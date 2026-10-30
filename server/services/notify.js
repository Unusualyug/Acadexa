import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { env } from '../config/env.js';

/**
 * Creates an in-app notification and (optionally) a queued email.
 * Email delivery is stubbed: it logs the message and marks the delivery state,
 * so swapping in a real provider (Resend/SES) only requires changing sendEmail().
 * Notifications never include sensitive academic details in the subject/preview.
 */
export async function notify({ recipient, type, title, body, link, relatedModel, relatedId, email = false }) {
  if (!recipient) return null;
  const user = await User.findById(recipient).select('notificationPrefs email name');
  if (!user) return null;
  const notification = await Notification.create({
    recipient,
    type,
    title,
    body,
    link,
    relatedModel,
    relatedId,
    emailDelivery: email && user.notificationPrefs?.emailSecurity !== false ? 'queued' : 'not_sent',
  });
  if (notification.emailDelivery === 'queued') {
    await sendEmail({ to: user.email, subject: title, text: body });
    notification.emailDelivery = env.isProd ? 'sent' : 'sent';
    await notification.save();
  }
  return notification;
}

export async function sendEmail({ to, subject, text }) {
  // Replace with a real transactional provider in production.
  console.log(`[email:${env.paymentProvider === 'sandbox' ? 'sandbox' : 'smtp'}] -> ${to} :: ${subject}`);
  return { ok: true, provider: 'log' };
}

export async function notifyStaff({ type, title, body, link, relatedModel, relatedId }) {
  const staff = await User.find({ role: { $in: ['admin', 'owner', 'support'] }, accountStatus: 'active' }).select('_id');
  await Promise.all(staff.map((s) => notify({ recipient: s._id, type, title, body, link, relatedModel, relatedId })));
}
