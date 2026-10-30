import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const myNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ notifications, unread });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { $set: { read: true } });
  res.json({ ok: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});
