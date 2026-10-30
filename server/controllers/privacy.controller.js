import PrivacyRequest from '../models/PrivacyRequest.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import SupportTicket from '../models/SupportTicket.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReference } from '../utils/reference.js';
import { notify } from '../services/notify.js';
import { logAudit } from '../services/audit.js';
import User from '../models/User.js';

export const createRequest = asyncHandler(async (req, res) => {
  const request = await PrivacyRequest.create({
    reference: await nextReference('PR'),
    user: req.user._id,
    type: req.body.type,
    details: req.body.details,
    verificationStatus: 'verified', // authenticated session is the ownership proof
  });
  await notify({ recipient: req.user._id, type: 'privacy', title: `Privacy request ${request.reference} received`, body: 'We will respond within 30 days as described in our Privacy Policy.', link: '/dashboard/privacy', email: true });
  const admins = await User.find({ role: { $in: ['admin', 'owner'] } }).select('_id');
  await Promise.all(admins.map((a) => notify({ recipient: a._id, type: 'admin_privacy', title: `Privacy request ${request.reference}`, body: req.body.type, link: '/admin/privacy' })));
  await logAudit(req, { action: 'privacy.request_created', entity: 'PrivacyRequest', entityId: request._id, reference: request.reference, meta: { type: req.body.type } });
  res.status(201).json({ request });
});

export const myRequests = asyncHandler(async (req, res) => {
  const requests = await PrivacyRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ requests });
});

export const myDataSummary = asyncHandler(async (req, res) => {
  const [orders, payments, tickets, requests] = await Promise.all([
    Order.countDocuments({ student: req.user._id }),
    Payment.countDocuments({ student: req.user._id }),
    SupportTicket.countDocuments({ student: req.user._id }),
    PrivacyRequest.countDocuments({ user: req.user._id }),
  ]);
  res.json({ account: req.user.toSafeJSON(), records: { orders, payments, tickets, privacyRequests: requests }, policyVersion: '2026-01' });
});

export const adminListRequests = asyncHandler(async (_req, res) => {
  const requests = await PrivacyRequest.find().sort({ createdAt: -1 }).limit(200).populate('user', 'name email accountStatus').lean();
  res.json({ requests });
});

export const processRequest = asyncHandler(async (req, res) => {
  const request = await PrivacyRequest.findById(req.params.id).populate('user');
  if (!request) throw ApiError.notFound('Privacy request not found.');
  const { status, processingNotes, legalExceptions, verificationStatus } = req.body;
  if (status) request.status = status;
  if (processingNotes !== undefined) request.processingNotes = processingNotes;
  if (legalExceptions !== undefined) request.legalExceptions = legalExceptions;
  if (verificationStatus) request.verificationStatus = verificationStatus;
  if (status === 'Completed') {
    request.completedAt = new Date();
    request.handledBy = req.user._id;
    if (request.type === 'deletion') {
      await User.findByIdAndUpdate(request.user._id, {
        name: 'Deleted user',
        email: `deleted+${request.user._id}@studentdesk.invalid`,
        accountStatus: 'deactivated',
        profile: {},
        savedServices: [],
      });
      // Financial records are retained for statutory periods; personal identifiers are removed.
    }
  }
  await request.save();
  await notify({ recipient: request.user._id, type: 'privacy', title: `Privacy request ${request.reference}: ${request.status}`, body: 'Sign in to review the outcome of your request.', link: '/dashboard/privacy', email: true });
  await logAudit(req, { action: 'privacy.request_processed', entity: 'PrivacyRequest', entityId: request._id, reference: request.reference, meta: { status } });
  res.json({ request });
});
