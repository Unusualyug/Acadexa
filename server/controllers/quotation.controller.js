import { z } from 'zod';
import Quotation from '../models/Quotation.js';
import Order from '../models/Order.js';
import SystemSettings from '../models/SystemSettings.js';
import { ORDER_STATUS } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReference } from '../utils/reference.js';
import { notify } from '../services/notify.js';
import { assertTransition, pushActivity } from '../services/orders.js';
import { logAudit } from '../services/audit.js';

export const quotationSchema = z.object({
  orderId: z.string().min(1),
  amount: z.coerce.number().min(0),
  currency: z.string().default('INR'),
  scope: z.string().min(20, 'Describe the agreed scope'),
  deliverables: z.array(z.string()).min(1, 'Add at least one deliverable'),
  estimatedDelivery: z.coerce.date(),
  revisionLimit: z.coerce.number().min(0).max(20).default(2),
  additionalCharges: z.array(z.object({ label: z.string(), amount: z.coerce.number().min(0) })).optional().default([]),
  paymentTerms: z.string().default('Full payment before work begins. 100% advance.'),
  terms: z.string().optional(),
  validDays: z.coerce.number().min(1).max(60).default(7),
});

export const createQuotation = asyncHandler(async (req, res) => {
  const body = req.body;
  const order = await Order.findById(body.orderId);
  if (!order) throw ApiError.notFound('Order not found.');
  if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED, ORDER_STATUS.COMPLETED].includes(order.status)) {
    throw ApiError.badRequest('A quotation cannot be created for a closed order.');
  }
  if (![ORDER_STATUS.PENDING_REVIEW, ORDER_STATUS.MORE_INFO, ORDER_STATUS.QUOTATION_SENT, ORDER_STATUS.AWAITING_PAYMENT].includes(order.status)) {
    throw ApiError.badRequest(`Cannot issue a quotation while the order is "${order.status}".`);
  }
  const settings = await SystemSettings.findOne({ singleton: 'main' });
  const validDays = body.validDays || settings?.defaults?.quotationValidDays || 7;

  const previous = await Quotation.find({ order: order._id });
  if (previous.length) {
    await Quotation.updateMany({ order: order._id, status: 'Sent' }, { $set: { status: 'Superseded' } });
  }
  const quotation = await Quotation.create({
    reference: await nextReference('QT'),
    order: order._id,
    student: order.student,
    version: previous.length + 1,
    amount: body.amount,
    currency: body.currency || order.currency,
    scope: body.scope,
    deliverables: body.deliverables,
    estimatedDelivery: body.estimatedDelivery,
    revisionLimit: body.revisionLimit,
    additionalCharges: body.additionalCharges,
    paymentTerms: body.paymentTerms,
    terms: body.terms,
    expiresAt: new Date(Date.now() + validDays * 86400000),
    status: 'Sent',
    sentAt: new Date(),
    supersedes: previous.sort((a, b) => b.version - a.version)[0]?._id,
    createdBy: req.user._id,
  });

  order.activeQuotation = quotation._id;
  order.agreedAmount = body.amount;
  order.currency = quotation.currency;
  order.paymentStatus = body.amount > 0 ? 'Pending' : 'Not Required';
  order.status = ORDER_STATUS.QUOTATION_SENT;
  pushActivity(order, { status: ORDER_STATUS.QUOTATION_SENT, action: `Quotation ${quotation.reference} sent`, note: `${quotation.currency} ${body.amount}`, actor: req.user._id, actorRole: req.user.role });
  await order.save();

  await notify({
    recipient: order.student,
    type: 'quotation',
    title: `Quotation ready for ${order.reference}`,
    body: `A quotation of ${quotation.currency} ${body.amount} is awaiting your review. It expires on ${quotation.expiresAt.toDateString()}.`,
    link: `/dashboard/quotations`,
    relatedModel: 'Quotation',
    relatedId: quotation._id,
    email: true,
  });
  await logAudit(req, { action: 'quotation.created', entity: 'Quotation', entityId: quotation._id, reference: quotation.reference, meta: { amount: body.amount, order: order.reference } });
  res.status(201).json({ quotation, order });
});

export const myQuotations = asyncHandler(async (req, res) => {
  const quotations = await Quotation.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate('order', 'reference title status deadline serviceName')
    .lean();
  res.json({ quotations });
});

export const acceptQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findOne({ _id: req.params.id, student: req.user._id });
  if (!quotation) throw ApiError.notFound('Quotation not found.');
  if (quotation.status === 'Accepted') throw ApiError.conflict('This quotation has already been accepted.');
  if (quotation.status !== 'Sent') throw ApiError.badRequest(`This quotation is ${quotation.status.toLowerCase()} and can no longer be accepted.`);
  if (new Date(quotation.expiresAt) < new Date()) {
    quotation.status = 'Expired';
    await quotation.save();
    throw ApiError.badRequest('This quotation has expired. Please contact us to request an updated quotation.');
  }
  const order = await Order.findById(quotation.order);
  quotation.status = 'Accepted';
  quotation.acceptedAt = new Date();
  await quotation.save();

  order.activeQuotation = quotation._id;
  order.agreedAmount = quotation.amount;
  order.paymentStatus = quotation.amount > 0 ? 'Pending' : 'Not Required';
  order.status = quotation.amount > 0 ? ORDER_STATUS.AWAITING_PAYMENT : ORDER_STATUS.CONFIRMED;
  pushActivity(order, { status: order.status, action: 'Quotation accepted by student', note: `Agreed ${quotation.currency} ${quotation.amount}`, actor: req.user._id, actorRole: req.user.role });
  await order.save();

  await notify({ recipient: order.student, type: 'quotation', title: `Quotation ${quotation.reference} accepted`, body: quotation.amount > 0 ? 'Please complete payment to confirm your order.' : 'Your order is confirmed.', link: `/dashboard/orders/${order._id}`, email: true });
  const staff = await import('../models/User.js').then(({ default: User }) => User.find({ role: { $in: ['admin', 'owner'] } }).select('_id'));
  await Promise.all(staff.map((s) => notify({ recipient: s._id, type: 'admin_quotation', title: `Quotation accepted: ${quotation.reference}`, body: `${order.reference} · ${quotation.currency} ${quotation.amount}`, link: `/admin/orders/${order._id}` })));
  await logAudit(req, { action: 'quotation.accepted', entity: 'Quotation', entityId: quotation._id, reference: quotation.reference });
  res.json({ quotation, order });
});

export const rejectQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findOne({ _id: req.params.id, student: req.user._id });
  if (!quotation) throw ApiError.notFound('Quotation not found.');
  if (quotation.status !== 'Sent') throw ApiError.badRequest('Only an outstanding quotation can be declined.');
  quotation.status = 'Rejected';
  quotation.rejectedAt = new Date();
  await quotation.save();
  const order = await Order.findById(quotation.order);
  if (order && order.status === ORDER_STATUS.QUOTATION_SENT) {
    order.status = ORDER_STATUS.PENDING_REVIEW;
    pushActivity(order, { status: ORDER_STATUS.PENDING_REVIEW, action: 'Quotation declined by student', note: req.body.reason, actor: req.user._id, actorRole: req.user.role });
    await order.save();
  }
  await logAudit(req, { action: 'quotation.rejected', entity: 'Quotation', entityId: quotation._id, reference: quotation.reference, meta: { reason: req.body.reason } });
  res.json({ quotation });
});

export const adminListQuotations = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const quotations = await Quotation.find(filter).sort({ createdAt: -1 }).limit(200).populate('order', 'reference title status student').populate('student', 'name email').lean();
  res.json({ quotations });
});

export const expireQuotationsJob = async () => {
  const result = await Quotation.updateMany(
    { status: 'Sent', expiresAt: { $lt: new Date() } },
    { $set: { status: 'Expired' } }
  );
  if (result.modifiedCount) console.log(`[job] expired ${result.modifiedCount} quotations`);
  return result.modifiedCount;
};
