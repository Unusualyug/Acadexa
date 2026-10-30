import { z } from 'zod';
import Order from '../models/Order.js';
import Service from '../models/Service.js';
import Quotation from '../models/Quotation.js';
import FileRecord from '../models/FileRecord.js';
import User from '../models/User.js';
import { ORDER_STATUS, ORDER_STATUSES, STAFF_ROLES } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReference } from '../utils/reference.js';
import { notify, notifyStaff } from '../services/notify.js';
import { assertTransition, pushActivity } from '../services/orders.js';
import { logAudit } from '../services/audit.js';
import { purgeOrderFiles } from '../services/storage.js';

export const createOrderSchema = z.object({
  serviceId: z.string().min(1, 'Choose a service'),
  title: z.string().min(5, 'Give your request a short title').max(160),
  subjectArea: z.string().max(160).optional().default(''),
  instructions: z.string().min(30, 'Please describe your requirements in at least 30 characters').max(6000),
  deliverablesRequired: z.string().max(2000).optional().default(''),
  institutionalGuidelines: z.string().max(2000).optional().default(''),
  additionalNotes: z.string().max(2000).optional().default(''),
  preferredCommunication: z.enum(['In-app messages', 'Email', 'WhatsApp']).default('In-app messages'),
  deadline: z.coerce.date().refine((d) => d.getTime() > Date.now(), 'Deadline must be in the future'),
  fileIds: z.array(z.string()).max(8).optional().default([]),
  integrityAccepted: z.literal(true, { message: 'You must confirm the academic-integrity terms' }),
});

export async function loadOrderForUser(req, { staffAny = false } = {}) {
  const order = await Order.findById(req.params.id)
    .populate('service', 'name slug pricingModel')
    .populate('student', 'name email')
    .populate('assignedConsultant', 'name');
  if (!order) throw ApiError.notFound('Order not found.');
  const isOwner = order.student._id.equals(req.user._id);
  const isAdmin = ['admin', 'owner'].includes(req.user.role);
  const isAssignedConsultant = req.user.role === 'consultant' && order.assignedConsultant?._id?.equals(req.user._id);
  const isSupport = staffAny && req.user.role === 'support';
  if (!isOwner && !isAdmin && !isAssignedConsultant && !isSupport) {
    throw ApiError.forbidden('You do not have access to this order.');
  }
  return order;
}

export const createOrder = asyncHandler(async (req, res) => {
  const data = req.body;
  const service = await Service.findById(data.serviceId);
  if (!service || !service.isActive) throw ApiError.badRequest('This service is not currently available for new requests.');

  const duplicate = await Order.findOne({
    student: req.user._id,
    service: service._id,
    title: data.title,
    status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED, ORDER_STATUS.COMPLETED] },
  });
  if (duplicate) throw ApiError.conflict('You already have an open request with the same title for this service.');

  const files = await FileRecord.find({ _id: { $in: data.fileIds }, owner: req.user._id, purpose: 'reference', isDeleted: false });
  if (files.length !== data.fileIds.length) throw ApiError.badRequest('One or more attached files are invalid.');

  const order = await Order.create({
    reference: await nextReference('SD'),
    student: req.user._id,
    service: service._id,
    serviceName: service.name,
    title: data.title,
    subjectArea: data.subjectArea,
    instructions: data.instructions,
    deliverablesRequired: data.deliverablesRequired,
    institutionalGuidelines: data.institutionalGuidelines,
    additionalNotes: data.additionalNotes,
    preferredCommunication: data.preferredCommunication,
    deadline: data.deadline,
    files: files.map((f) => f._id),
    paymentStatus: 'Pending',
    activity: [{ status: ORDER_STATUS.PENDING_REVIEW, action: 'Request submitted', actor: req.user._id, actorRole: req.user.role }],
  });
  await FileRecord.updateMany({ _id: { $in: order.files } }, { $set: { order: order._id } });

  await notify({
    recipient: req.user._id,
    type: 'order',
    title: `Request ${order.reference} received`,
    body: `We are reviewing your ${service.name} request. You will be notified when a quotation is ready.`,
    link: `/dashboard/orders/${order._id}`,
    email: true,
  });
  await notifyStaff({
    type: 'admin_order',
    title: `New request ${order.reference}`,
    body: `${req.user.name} submitted a ${service.name} request.`,
    link: `/admin/orders/${order._id}`,
  });

  res.status(201).json({ order, reference: order.reference });
});

export const myOrders = asyncHandler(async (req, res) => {
  const { status, q, page = 1, limit = 10 } = req.query;
  const filter = { student: req.user._id };
  if (status && status !== 'All Orders') filter.status = status;
  if (q) filter.$or = [{ reference: { $regex: q, $options: 'i' } }, { title: { $regex: q, $options: 'i' } }];
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('service', 'name slug').lean(),
    Order.countDocuments(filter),
  ]);
  const counts = await Order.aggregate([{ $match: { student: req.user._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await loadOrderForUser(req);
  const [quotations, files, delivered, messages] = await Promise.all([
    Quotation.find({ order: order._id }).sort({ version: -1 }).lean(),
    FileRecord.find({ _id: { $in: order.files }, isDeleted: false }).lean(),
    FileRecord.find({ _id: { $in: order.deliveredFiles }, isDeleted: false }).lean(),
    import('../models/Message.js').then(({ default: Message }) => Message.find({ order: order._id, internal: false }).sort({ createdAt: 1 }).populate('sender', 'name role').lean()),
  ]);
  const activity = order.activity.filter((a) => a.visibility !== 'internal' || STAFF_ROLES.includes(req.user.role));
  res.json({ order: { ...order.toObject(), activity }, quotations, files, deliveredFiles: delivered, messages });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await loadOrderForUser(req);
  if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED, ORDER_STATUS.IN_PROGRESS].includes(order.status)) {
    throw ApiError.badRequest(`An order in "${order.status}" status cannot be cancelled here. Please raise a support ticket.`);
  }
  assertTransition(order.status, ORDER_STATUS.CANCELLED);
  order.status = ORDER_STATUS.CANCELLED;
  order.cancelledReason = req.body.reason || 'Cancelled by student';
  pushActivity(order, { status: ORDER_STATUS.CANCELLED, action: 'Request cancelled by student', note: req.body.reason, actor: req.user._id, actorRole: req.user.role });
  await order.save();
  await notifyStaff({ type: 'admin_order', title: `Request ${order.reference} cancelled`, body: req.body.reason || 'Cancelled by student', link: `/admin/orders/${order._id}` });
  res.json({ order });
});

export const requestRevision = asyncHandler(async (req, res) => {
  const order = await loadOrderForUser(req);
  if (![ORDER_STATUS.DELIVERED, ORDER_STATUS.READY_FOR_REVIEW].includes(order.status)) {
    throw ApiError.badRequest('Revisions can only be requested after a delivery is available.');
  }
  const quotation = order.activeQuotation ? await Quotation.findById(order.activeQuotation) : null;
  const limit = quotation?.revisionLimit ?? 2;
  if (order.revisionCount >= limit) {
    throw ApiError.badRequest(`The agreed revision limit (${limit}) has been reached. Please contact support to discuss further changes.`);
  }
  const files = await FileRecord.find({ _id: { $in: req.body.fileIds || [] }, owner: req.user._id, isDeleted: false });
  order.revisionCount += 1;
  order.status = ORDER_STATUS.REVISION_REQUESTED;
  for (const f of files) { f.purpose = 'revision-reference'; f.order = order._id; await f.save(); }
  pushActivity(order, {
    status: ORDER_STATUS.REVISION_REQUESTED,
    action: `Revision #${order.revisionCount} requested`,
    note: req.body.description,
    actor: req.user._id,
    actorRole: req.user.role,
  });
  await order.save();
  await notifyStaff({ type: 'admin_order', title: `Revision requested on ${order.reference}`, body: (req.body.description || '').slice(0, 160), link: `/admin/orders/${order._id}` });
  res.json({ order, revisionCount: order.revisionCount, revisionLimit: limit });
});

/* ---------------- staff ---------------- */

export const adminListOrders = asyncHandler(async (req, res) => {
  const { status, q, service, from, to, deadlineBefore, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (req.user.role === 'consultant') filter.assignedConsultant = req.user._id;
  if (status && status !== 'All') filter.status = status;
  if (service) filter.service = service;
  if (from || to) filter.createdAt = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) };
  if (deadlineBefore) filter.deadline = { $lte: new Date(deadlineBefore) };
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('student', 'name email').populate('assignedConsultant', 'name').lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
});

export const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await loadOrderForUser(req, { staffAny: true });
  const Message = (await import('../models/Message.js')).default;
  const [quotations, files, messages] = await Promise.all([
    Quotation.find({ order: order._id }).sort({ version: -1 }).lean(),
    FileRecord.find({ order: order._id, isDeleted: false }).lean(),
    Message.find({ order: order._id }).sort({ createdAt: 1 }).populate('sender', 'name role').lean(),
  ]);
  res.json({ order, quotations, files, messages });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await loadOrderForUser(req, { staffAny: req.user.role !== 'consultant' });
  const { status, note, deliveryNote } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw ApiError.badRequest('Unknown status.');
  const staff = STAFF_ROLES.includes(req.user.role);
  if (!staff && status !== ORDER_STATUS.CANCELLED) throw ApiError.forbidden('Only staff can change order status.');
  if (req.user.role === 'consultant' && !['In Progress', 'Awaiting Student Information', 'Ready for Review', 'Delivered'].includes(status)) {
    throw ApiError.forbidden('Consultants may only advance work-progress statuses.');
  }
  assertTransition(order.status, status);
  order.status = status;
  if (status === ORDER_STATUS.DELIVERED) { order.deliveredAt = new Date(); }
  if (status === ORDER_STATUS.COMPLETED) { order.completedAt = new Date(); }
  pushActivity(order, { status, action: deliveryNote || `Status changed to ${status}`, note, actor: req.user._id, actorRole: req.user.role });

  // Completing an order closes the paperwork: destroy the uploaded documents
  // (student references + deliverables) in storage, keeping the DB records.
  let purged = null;
  if (status === ORDER_STATUS.COMPLETED) {
    purged = await purgeOrderFiles(order._id, { actorId: req.user._id, reason: 'order_completed' });
    if (purged.purged.length || purged.failed.length) {
      pushActivity(order, {
        status,
        action: `Files deleted from ${purged.provider} (${purged.purged.length})`,
        note: purged.failed.length ? `${purged.failed.length} file(s) could not be deleted and need attention.` : undefined,
        actor: req.user._id,
        actorRole: req.user.role,
        visibility: 'internal',
      });
    }
  }

  await order.save();
  await notify({
    recipient: order.student._id,
    type: 'order_status',
    title: `Order ${order.reference} updated`,
    body: `Your order status is now "${status}". Sign in to view details.`,
    link: `/dashboard/orders/${order._id}`,
    email: [ORDER_STATUS.DELIVERED, ORDER_STATUS.QUOTATION_SENT, ORDER_STATUS.READY_FOR_REVIEW].includes(status),
  });
  await logAudit(req, {
    action: 'order.status_changed', entity: 'Order', entityId: order._id, reference: order.reference,
    meta: { status, ...(purged ? { purgedFiles: purged.purged.length, storage: purged.provider } : {}) },
  });
  res.json({ order, ...(purged ? { purged } : {}) });
});

export const assignConsultant = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');
  const consultant = await User.findOne({ _id: req.body.consultantId, role: { $in: ['consultant', 'admin', 'owner'] } });
  if (!consultant) throw ApiError.badRequest('Consultant not found.');
  order.assignedConsultant = consultant._id;
  pushActivity(order, { action: `Assigned to ${consultant.name}`, actor: req.user._id, actorRole: req.user.role, visibility: 'internal' });
  await order.save();
  await notify({ recipient: consultant._id, type: 'assignment', title: `New assignment: ${order.reference}`, body: `${order.serviceName} · due ${new Date(order.deadline).toDateString()}`, link: `/admin/orders/${order._id}` });
  await logAudit(req, { action: 'order.assigned', entity: 'Order', entityId: order._id, reference: order.reference, meta: { consultant: consultant.email } });
  res.json({ order });
});

export const updateDeadline = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');
  const to = new Date(req.body.deadline);
  if (Number.isNaN(to.getTime())) throw ApiError.badRequest('Invalid deadline.');
  order.deadlineHistory.push({ from: order.deadline, to, reason: req.body.reason || 'Adjusted by staff', at: new Date(), actor: req.user._id });
  order.deadline = to;
  pushActivity(order, { action: 'Deadline updated', note: `${new Date(to).toDateString()} — ${req.body.reason || ''}`, actor: req.user._id, actorRole: req.user.role });
  await order.save();
  await notify({ recipient: order.student._id, type: 'deadline', title: `Deadline updated for ${order.reference}`, body: `New deadline: ${to.toDateString()}`, link: `/dashboard/orders/${order._id}`, email: true });
  await logAudit(req, { action: 'order.deadline_changed', entity: 'Order', entityId: order._id, reference: order.reference, meta: { to } });
  res.json({ order });
});

export const addInternalNote = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');
  order.internalNotes.push({ note: req.body.note, actor: req.user._id, at: new Date() });
  await order.save();
  res.json({ internalNotes: order.internalNotes });
});

export const dashboardSummary = asyncHandler(async (req, res) => {
  const filter = { student: req.user._id };
  const [counts, upcoming, quotationCount, recent, unpaid] = await Promise.all([
    Order.aggregate([{ $match: filter }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Order.find({ ...filter, deadline: { $gte: new Date() }, status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.AWAITING_INFO, ORDER_STATUS.READY_FOR_REVIEW, ORDER_STATUS.QUOTATION_SENT, ORDER_STATUS.AWAITING_PAYMENT] } }).sort({ deadline: 1 }).limit(3).lean(),
    Quotation.countDocuments({ student: req.user._id, status: 'Sent', expiresAt: { $gt: new Date() } }),
    Order.find(filter).sort({ updatedAt: -1 }).limit(6).lean(),
    Order.countDocuments({ ...filter, paymentStatus: 'Pending', status: { $in: [ORDER_STATUS.QUOTATION_SENT, ORDER_STATUS.AWAITING_PAYMENT] } }),
  ]);
  const map = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  res.json({
    cards: {
      activeOrders: (map[ORDER_STATUS.CONFIRMED] || 0) + (map[ORDER_STATUS.IN_PROGRESS] || 0) + (map[ORDER_STATUS.AWAITING_INFO] || 0) + (map[ORDER_STATUS.READY_FOR_REVIEW] || 0),
      pendingQuotations: quotationCount,
      awaitingPayment: unpaid,
      inProgress: map[ORDER_STATUS.IN_PROGRESS] || 0,
      delivered: (map[ORDER_STATUS.DELIVERED] || 0) + (map[ORDER_STATUS.COMPLETED] || 0),
      upcomingDeadlines: upcoming.length,
    },
    upcomingDeadlines: upcoming,
    recentOrders: recent,
  });
});
