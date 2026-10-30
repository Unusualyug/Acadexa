/**
 * Hard-deletes a student account and every record that belongs to it.
 *
 * Deletion order matters: child records are removed before the parent user, and
 * physical files are removed from the private upload directory using the
 * `storageKey` of each FileRecord. Nothing here is reversible.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Quotation from '../models/Quotation.js';
import Payment from '../models/Payment.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import FileRecord from '../models/FileRecord.js';
import { deleteStoredAsset } from './storage.js';
import OrphanAsset from '../models/OrphanAsset.js';
import Review from '../models/Review.js';
import SupportTicket from '../models/SupportTicket.js';
import ConsultationBooking from '../models/ConsultationBooking.js';
import PrivacyRequest from '../models/PrivacyRequest.js';
import AuditLog from '../models/AuditLog.js';
import { env } from '../config/env.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), env.uploadDir);

/**
 * Count everything that would be removed, without deleting anything.
 * Used by the admin UI so the confirmation shows real numbers.
 */
export async function summariseStudentData(studentId) {
  const orders = await Order.find({ student: studentId }).select('_id').lean();
  const orderIds = orders.map((o) => o._id);
  const tickets = await SupportTicket.find({ student: studentId }).select('_id').lean();
  const ticketIds = tickets.map((t) => t._id);

  const [quotations, payments, messages, files, reviews, ticketsCount, bookings, privacyRequests, notifications, auditEntries] =
    await Promise.all([
      Quotation.countDocuments({ order: { $in: orderIds } }),
      Payment.countDocuments({ $or: [{ student: studentId }, { order: { $in: orderIds } }] }),
      Message.countDocuments({ $or: [{ order: { $in: orderIds } }, { ticket: { $in: ticketIds } }] }),
      FileRecord.countDocuments({ $or: [{ owner: studentId }, { order: { $in: orderIds } }, { ticket: { $in: ticketIds } }] }),
      Review.countDocuments({ student: studentId }),
      SupportTicket.countDocuments({ _id: { $in: ticketIds } }),
      ConsultationBooking.countDocuments({ student: studentId }),
      PrivacyRequest.countDocuments({ user: studentId }),
      Notification.countDocuments({ recipient: studentId }),
      AuditLog.countDocuments({ actor: studentId }),
    ]);

  return {
    orders: orderIds.length,
    quotations,
    payments,
    messages,
    files,
    reviews,
    tickets: ticketsCount,
    bookings,
    privacyRequests,
    notifications,
    auditEntries,
  };
}

/**
 * Permanently removes a student and all related data.
 * @returns {Promise<{deleted: object, filesRemoved: number, filesMissing: number}>}
 */
export async function purgeStudent(studentId) {
  const student = await User.findById(studentId).select('_id role email name').lean();
  if (!student) return null;
  if (student.role !== 'student') {
    throw Object.assign(new Error('Only student accounts can be deleted with this action.'), { status: 400 });
  }

  const orders = await Order.find({ student: studentId }).select('_id').lean();
  const orderIds = orders.map((o) => o._id);
  const tickets = await SupportTicket.find({ student: studentId }).select('_id').lean();
  const ticketIds = tickets.map((t) => t._id);

  const fileFilter = { $or: [{ owner: studentId }, { order: { $in: orderIds } }, { ticket: { $in: ticketIds } }] };
  const files = await FileRecord.find(fileFilter);

  // Destroy the stored assets themselves (Cloudinary or local disk) BEFORE the
  // records go, otherwise a deleted student's documents survive in the bucket.
  // A provider failure is retried once; if it still fails we keep a PII-free
  // pointer in `orphanassets` so the scheduled job can finish the job later,
  // rather than deleting the only reference to a live document.
  let assetsRemoved = 0;
  let assetsOrphaned = 0;
  for (const file of files) {
    let removed = false;
    for (let attempt = 1; attempt <= 2 && !removed; attempt += 1) {
      try {
        removed = await deleteStoredAsset(file);
      } catch (err) {
        if (attempt === 2) {
          await OrphanAsset.create({
            provider: file.provider || 'local',
            storageKey: file.storageKey,
            publicId: file.publicId || null,
            resourceType: file.resourceType || null,
            reason: 'account_deleted',
            attempts: 2,
            lastError: String(err.message || err).slice(0, 300),
          });
          assetsOrphaned += 1;
          console.error(`[purge] asset left for later retry ${file.storageKey}: ${err.message}`);
        }
      }
    }
    if (removed) assetsRemoved += 1;
  }

  const counts = {};
  // Children first, parents last.
  counts.messages = (await Message.deleteMany({ $or: [{ order: { $in: orderIds } }, { ticket: { $in: ticketIds } }] })).deletedCount;
  counts.quotations = (await Quotation.deleteMany({ order: { $in: orderIds } })).deletedCount;
  counts.payments = (await Payment.deleteMany({ $or: [{ student: studentId }, { order: { $in: orderIds } }] })).deletedCount;
  counts.reviews = (await Review.deleteMany({ student: studentId })).deletedCount;
  counts.files = (await FileRecord.deleteMany(fileFilter)).deletedCount;
  counts.storedAssets = assetsRemoved;
  counts.storedAssetsPending = assetsOrphaned;
  counts.tickets = (await SupportTicket.deleteMany({ _id: { $in: ticketIds } })).deletedCount;
  counts.bookings = (await ConsultationBooking.deleteMany({ student: studentId })).deletedCount;
  counts.privacyRequests = (await PrivacyRequest.deleteMany({ user: studentId })).deletedCount;
  counts.notifications = (await Notification.deleteMany({ recipient: studentId })).deletedCount;
  counts.orders = (await Order.deleteMany({ _id: { $in: orderIds } })).deletedCount;

  // The student's own audit trail goes too; the purge itself is logged by the caller.
  counts.auditEntries = (await AuditLog.deleteMany({ actor: studentId })).deletedCount;

  await User.deleteOne({ _id: studentId });

  // Sweep any local-disk copies that were not tracked as Cloudinary assets.
  let filesRemoved = 0;
  let filesMissing = 0;
  for (const f of files) {
    if (f.provider === 'cloudinary' || !f.storageKey) continue;
    const abs = path.join(UPLOAD_ROOT, path.basename(f.storageKey));
    try {
      await fs.unlink(abs);
      filesRemoved += 1;
    } catch (err) {
      if (err.code === 'ENOENT') filesMissing += 1;
      else console.error('[purge] could not remove file', abs, err.message);
    }
  }

  return { deleted: counts, filesRemoved, filesMissing };
}

/** Masks an email for audit records: yuglakhani99@gmail.com -> y***9@gmail.com */
export function maskEmail(email = '') {
  const [local, domain] = String(email).split('@');
  if (!domain) return '***';
  const head = local.slice(0, 1);
  const tail = local.length > 2 ? local.slice(-1) : '';
  return `${head}***${tail}@${domain}`;
}

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
