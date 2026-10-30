import { z } from 'zod';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Quotation from '../models/Quotation.js';
import Coupon from '../models/Coupon.js';
import { ORDER_STATUS } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReference } from '../utils/reference.js';
import { env } from '../config/env.js';
import { gateway } from '../services/payments.js';
import { notify } from '../services/notify.js';
import { pushActivity } from '../services/orders.js';
import { logAudit } from '../services/audit.js';

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId, couponCode } = req.body;
  const order = await Order.findOne({ _id: orderId, student: req.user._id });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.paymentStatus === 'Paid') throw ApiError.conflict('This order has already been paid.');
  if (![ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.QUOTATION_SENT, ORDER_STATUS.CONFIRMED].includes(order.status)) {
    throw ApiError.badRequest('This order is not currently awaiting payment.');
  }
  const quotation = await Quotation.findById(order.activeQuotation);
  if (!quotation) throw ApiError.badRequest('No accepted quotation is attached to this order.');
  if (quotation.status !== 'Accepted' && quotation.status !== 'Sent') throw ApiError.badRequest('Please accept the quotation before paying.');
  if (new Date(quotation.expiresAt) < new Date()) throw ApiError.badRequest('The quotation has expired. Please request a new quotation.');

  const existing = await Payment.findOne({ order: order._id, status: { $in: ['Verified', 'Pending'] } });
  if (existing) {
    if (existing.status === 'Verified') throw ApiError.conflict('This order has already been paid.');
    return res.json({ payment: existing, checkout: { providerOrderId: existing.providerOrderId, amount: existing.amount, currency: existing.currency, keyId: gateway.name, sandbox: true } });
  }

  let amount = quotation.amount;
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase(), isActive: true });
    if (!coupon) throw ApiError.badRequest('Coupon code is not valid.');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest('Coupon has expired.');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw ApiError.badRequest('Coupon usage limit reached.');
    if (amount < coupon.minOrderValue) throw ApiError.badRequest(`This coupon requires a minimum order of ${coupon.currency || 'INR'} ${coupon.minOrderValue}.`);
    if (coupon.eligibleServices?.length && !coupon.eligibleServices.some((s) => s.equals(order.service))) throw ApiError.badRequest('Coupon is not valid for this service.');
    discount = coupon.type === 'percentage' ? Math.round((amount * coupon.value) / 100) : coupon.value;
    discount = Math.min(discount, amount);
    amount -= discount;
    order.couponCode = coupon.code;
    order.discountAmount = discount;
    await order.save();
  }

  const created = await gateway.createOrder({ amount: Math.round(amount * 100), currency: order.currency, receipt: order.reference });
  const payment = await Payment.create({
    reference: await nextReference('PAY'),
    order: order._id,
    quotation: quotation._id,
    student: req.user._id,
    provider: gateway.name,
    providerOrderId: created.providerOrderId,
    amount,
    currency: order.currency,
    status: 'Pending',
    invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
    events: [{ event: 'created', payload: { discount }, at: new Date() }],
  });
  res.status(201).json({ payment, checkout: { ...created, keyId: created.keyId, discount } });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { providerOrderId, providerPaymentId, signature } = req.body;
  const payment = await Payment.findOne({ providerOrderId, student: req.user._id });
  if (!payment) throw ApiError.notFound('Payment attempt not found.');
  if (payment.status === 'Verified') return res.json({ payment, message: 'Payment already verified.' });
  if (!['Created', 'Pending'].includes(payment.status)) throw ApiError.badRequest('This payment attempt is no longer open.');
  if (!gateway.verifyPaymentSignature({ providerOrderId, providerPaymentId, signature })) {
    // Do not close the attempt on a client-supplied signature mismatch: a tampered
    // response should not block a later genuine confirmation. Record the event instead.
    payment.events.push({ event: 'verification_failed', payload: { providerPaymentId }, at: new Date() });
    await payment.save();
    throw ApiError.badRequest('Payment could not be verified. No money has been recorded as received.');
  }
  await markVerified(payment, providerPaymentId, req.user._id);
  res.json({ payment, message: 'Payment verified. Your order is confirmed.' });
});

/** Idempotent: a duplicate provider event can never create a second verified transaction. */
async function markVerified(payment, providerPaymentId, actorId) {
  if (payment.status === 'Verified') return payment;
  const duplicate = await Payment.findOne({ providerPaymentId, status: 'Verified', _id: { $ne: payment._id } });
  if (duplicate) throw ApiError.conflict('This transaction reference has already been recorded.');
  payment.status = 'Verified';
  payment.providerPaymentId = providerPaymentId;
  payment.verifiedAt = new Date();
  payment.events.push({ event: 'verified', payload: { providerPaymentId }, at: new Date() });
  await payment.save();

  if (payment.order) {
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = 'Paid';
      order.status = ORDER_STATUS.CONFIRMED;
      pushActivity(order, { status: ORDER_STATUS.CONFIRMED, action: 'Payment verified — order confirmed', note: `Payment ${payment.reference}`, actor: actorId, actorRole: 'student' });
      await order.save();
      await notify({ recipient: order.student, type: 'payment', title: `Payment received for ${order.reference}`, body: `Amount ${payment.currency} ${payment.amount}. Your order is now confirmed.`, link: `/dashboard/payments`, email: true });
      const User = (await import('../models/User.js')).default;
      const staff = await User.find({ role: { $in: ['admin', 'owner'] } }).select('_id');
      await Promise.all(staff.map((s) => notify({ recipient: s._id, type: 'admin_payment', title: `Payment verified: ${payment.reference}`, body: `${order.reference} · ${payment.currency} ${payment.amount}`, link: `/admin/payments` })));
    }
  }
  const quotation = await Quotation.findById(payment.quotation);
  if (quotation && quotation.status === 'Sent') { quotation.status = 'Accepted'; quotation.acceptedAt = new Date(); await quotation.save(); }
  return payment;
}

/** Sandbox only: mimics the provider signing a payment so the real verification path runs. */
export const sandboxSign = asyncHandler(async (req, res) => {
  if (env.paymentProvider !== 'sandbox') throw ApiError.notFound('Not available.');
  const payment = await Payment.findOne({ _id: req.params.id, student: req.user._id, status: { $in: ['Pending', 'Created'] } });
  if (!payment) throw ApiError.notFound('Payment attempt not found.');
  const { providerPaymentId } = req.body;
  if (!providerPaymentId) throw ApiError.badRequest('providerPaymentId is required.');
  res.json({ signature: gateway.signPayment({ providerOrderId: payment.providerOrderId, providerPaymentId }), mode: 'sandbox' });
});

export const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-payment-signature'];
  const raw = req.rawBody || Buffer.from(JSON.stringify(req.body));
  if (!gateway.verifyWebhook(raw, signature)) {
    return res.status(400).json({ message: 'Invalid webhook signature.' });
  }
  const { event, payload } = req.body;
  const payment = payload?.providerOrderId ? await Payment.findOne({ providerOrderId: payload.providerOrderId }) : null;
  if (!payment) return res.status(200).json({ received: true, ignored: true });
  payment.events.push({ event, payload, at: new Date() });
  if (['payment.captured', 'payment.authorized'].includes(event) && payload.providerPaymentId) {
    await markVerified(payment, payload.providerPaymentId, null);
  } else if (event === 'payment.failed') {
    payment.status = 'Failed';
    payment.failureReason = payload.reason || 'Provider reported failure';
    await payment.save();
  } else {
    await payment.save();
  }
  res.json({ received: true });
});

export const myPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.user._id }).sort({ createdAt: -1 }).populate('order', 'reference title').lean();
  res.json({ payments });
});

export const receipt = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, ...(req.user.role === 'student' ? { student: req.user._id } : {}) }).populate('order', 'reference title').populate('student', 'name email').lean();
  if (!payment) throw ApiError.notFound('Payment not found.');
  if (payment.status !== 'Verified') throw ApiError.badRequest('A receipt is available only for verified payments.');
  res.json({ receipt: payment });
});

export const adminListPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const payments = await Payment.find(filter).sort({ createdAt: -1 }).limit(200).populate('student', 'name email').populate('order', 'reference title').lean();
  res.json({ payments });
});

export const refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found.');
  if (payment.status !== 'Verified') throw ApiError.badRequest('Only verified payments can be refunded.');
  const amount = Number(req.body.amount || payment.amount);
  const already = payment.refunds.reduce((s, r) => s + r.amount, 0);
  if (amount <= 0 || amount + already > payment.amount) throw ApiError.badRequest('Refund amount exceeds the captured amount.');
  // Provider refund call would go here for Razorpay: refunds.create(payment.providerPaymentId, amount)
  payment.refunds.push({ amount, reason: req.body.reason || 'Approved refund', status: 'Processed', at: new Date(), by: req.user._id, providerRefundId: `rfnd_sbx_${Date.now()}` });
  payment.status = amount + already >= payment.amount ? 'Refunded' : 'Partially Refunded';
  await payment.save();
  if (payment.order) {
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = amount + already >= payment.amount ? 'Refunded' : 'Partially Refunded';
      if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUND_PENDING) {
        order.status = amount + already >= payment.amount ? ORDER_STATUS.REFUNDED : ORDER_STATUS.REFUND_PENDING;
      }
      pushActivity(order, { status: order.status, action: `Refund processed: ${payment.currency} ${amount}`, actor: req.user._id, actorRole: req.user.role, visibility: 'internal' });
      await order.save();
      await notify({ recipient: order.student, type: 'refund', title: `Refund processed for ${order.reference}`, body: `${payment.currency} ${amount} has been refunded to the original payment method. Bank timelines may apply.`, link: `/dashboard/payments`, email: true });
    }
  }
  await logAudit(req, { action: 'payment.refunded', entity: 'Payment', entityId: payment._id, reference: payment.reference, meta: { amount } });
  res.json({ payment });
});

/** Create a pending QR/UPI payment with optional proof files. Used instead of the sandbox gateway. */
export const createQrPayment = asyncHandler(async (req, res) => {
  const { orderId, amount, currency, upiId, fileIds } = req.body;
  const order = await Order.findOne({ _id: orderId, student: req.user._id });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.paymentStatus === 'Paid') throw ApiError.conflict('This order has already been paid.');
  if (![ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.QUOTATION_SENT, ORDER_STATUS.CONFIRMED].includes(order.status)) {
    throw ApiError.badRequest('This order is not currently awaiting payment.');
  }

  const existing = await Payment.findOne({ order: order._id, status: { $in: ['Pending', 'Verified'] } });
  if (existing) {
    if (existing.status === 'Verified') throw ApiError.conflict('This order has already been paid.');
    return res.json({ payment: existing, message: 'A pending payment already exists for this order.' });
  }

  const payment = await Payment.create({
    reference: await nextReference('PAY'),
    order: order._id,
    student: req.user._id,
    provider: 'upi_qr',
    providerOrderId: `qr_${Date.now()}`,
    amount,
    currency,
    status: 'Pending',
    invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
    upiId: upiId || null,
    fileIds: fileIds || [],
    events: [{ event: 'created', payload: { method: 'qr', upiId }, at: new Date() }],
  });

  order.paymentStatus = 'Pending';
  await order.save();

  await pushActivity(order, {
    status: ORDER_STATUS.AWAITING_PAYMENT,
    action: 'QR payment initiated — awaiting proof',
    note: `Payment ${payment.reference} · ${currency} ${amount}`,
    actor: req.user._id,
    actorRole: 'student',
  });

  res.status(201).json({ payment, message: 'Payment initiated. Upload proof of payment to complete.' });
});

/** Admin verifies or rejects a pending QR payment. */
export const verifyQrPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const payment = await Payment.findById(id);
  if (!payment) throw ApiError.notFound('Payment not found.');
  if (payment.status === 'Verified') throw ApiError.conflict('Payment already verified.');
  if (payment.status !== 'Pending') throw ApiError.badRequest('This payment is not in a pending state.');

  payment.status = status;
  payment.events.push({
    event: status === 'Verified' ? 'verified' : 'failed',
    payload: { verifiedBy: req.user._id, note },
    at: new Date(),
  });
  if (status === 'Verified') {
    payment.providerPaymentId = `qr_verified_${Date.now()}`;
    payment.verifiedAt = new Date();
  }
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.paymentStatus = status === 'Verified' ? 'Paid' : 'Failed';
    if (status === 'Verified') {
      order.status = ORDER_STATUS.CONFIRMED;
      pushActivity(order, {
        status: ORDER_STATUS.CONFIRMED,
        action: 'QR payment verified — order confirmed',
        note: `Payment ${payment.reference} verified by admin`,
        actor: req.user._id,
        actorRole: 'admin',
      });
    } else {
      pushActivity(order, {
        status: order.status,
        action: 'QR payment rejected',
        note: `Payment ${payment.reference} rejected · ${note || ''}`,
        actor: req.user._id,
        actorRole: 'admin',
        visibility: 'internal',
      });
    }
    await order.save();
    await notify({
      recipient: order.student,
      type: 'payment',
      title: `Payment ${status === 'Verified' ? 'verified' : 'rejected'} for ${order.reference}`,
      body: status === 'Verified'
        ? `Your payment of ${payment.currency} ${payment.amount} has been verified. Your order is confirmed.`
        : `Your payment proof was not accepted. ${note || ''} Please contact support or submit a new payment proof.`,
      link: `/dashboard/orders/${order._id}`,
      email: true,
    });
  }

  await logAudit(req, {
    action: `payment.qr_${status.toLowerCase()}`,
    entity: 'Payment',
    entityId: payment._id,
    reference: payment.reference,
    meta: { status, note },
  });

  res.json({ payment, message: `Payment ${status.toLowerCase()}.` });
});

