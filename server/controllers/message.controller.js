import Message from '../models/Message.js';
import Order from '../models/Order.js';
import FileRecord from '../models/FileRecord.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify } from '../services/notify.js';

async function authorizeOrderThread(req) {
  const order = await Order.findById(req.params.orderId).populate('assignedConsultant', 'name');
  if (!order) throw ApiError.notFound('Order not found.');
  const isOwner = order.student.equals(req.user._id);
  const isAdmin = ['admin', 'owner'].includes(req.user.role);
  const isAssigned = req.user.role === 'consultant' && order.assignedConsultant?._id?.equals(req.user._id);
  const isSupport = req.user.role === 'support';
  if (!isOwner && !isAdmin && !isAssigned && !isSupport) throw ApiError.forbidden('You do not have access to this conversation.');
  return order;
}

export const listMessages = asyncHandler(async (req, res) => {
  const order = await authorizeOrderThread(req);
  const filter = { order: order._id };
  if (!['admin', 'owner', 'support', 'consultant'].includes(req.user.role)) filter.internal = false;
  const messages = await Message.find(filter).sort({ createdAt: 1 }).populate('sender', 'name role').lean();
  await Message.updateMany({ order: order._id, 'readBy.user': { $ne: req.user._id } }, { $push: { readBy: { user: req.user._id, at: new Date() } } });
  res.json({ messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const order = await authorizeOrderThread(req);
  if (order.status === 'Cancelled' || order.status === 'Rejected') throw ApiError.badRequest('This order is closed. Please open a support ticket instead.');
  const attachments = await FileRecord.find({ _id: { $in: req.body.attachmentIds || [] }, owner: req.user._id, isDeleted: false });
  const message = await Message.create({
    order: order._id,
    sender: req.user._id,
    senderRole: req.user.role,
    senderName: req.user.name,
    body: req.body.body,
    attachments: attachments.map((a) => a._id),
    internal: Boolean(req.body.internal) && ['admin', 'owner', 'support'].includes(req.user.role),
    readBy: [{ user: req.user._id, at: new Date() }],
  });
  if (order.student.equals(req.user._id)) {
    const staff = (await import('../models/User.js')).default;
    const recipients = [order.assignedConsultant].filter(Boolean);
    const admins = await staff.find({ role: { $in: ['admin', 'owner'] } }).select('_id');
    await Promise.all([...recipients, ...admins].map((r) => notify({ recipient: r._id || r, type: 'message', title: `New message on ${order.reference}`, body: 'A student replied on an order conversation.', link: `/admin/orders/${order._id}` })));
  } else {
    order.lastStudentActivityAt = new Date();
    await order.save();
    await notify({ recipient: order.student, type: 'message', title: `New message on ${order.reference}`, body: 'You have a new reply about your order.', link: `/dashboard/orders/${order._id}`, email: true });
  }
  const populated = await message.populate('sender', 'name role');
  res.status(201).json({ message: populated });
});
