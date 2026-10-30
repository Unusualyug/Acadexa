import { z } from 'zod';
import SupportTicket from '../models/SupportTicket.js';
import Message from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReference } from '../utils/reference.js';
import { notify, notifyStaff } from '../services/notify.js';
import { logAudit } from '../services/audit.js';

export const ticketSchema = z.object({
  category: z.string().min(2),
  subject: z.string().min(5).max(160),
  description: z.string().min(20).max(4000),
  orderId: z.string().optional(),
});

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.create({
    reference: await nextReference('TK'),
    student: req.user._id,
    order: req.body.orderId || undefined,
    category: req.body.category,
    subject: req.body.subject,
    description: req.body.description,
  });
  await notify({ recipient: req.user._id, type: 'support', title: `Ticket ${ticket.reference} created`, body: 'Our team will respond during business hours.', link: '/dashboard/support', email: true });
  await notifyStaff({ type: 'admin_support', title: `New support ticket ${ticket.reference}`, body: req.body.subject, link: `/admin/support/${ticket._id}` });
  res.status(201).json({ ticket });
});

export const myTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ student: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ tickets });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found.');
  const isOwner = ticket.student.equals(req.user._id);
  if (!isOwner && !['admin', 'owner', 'support'].includes(req.user.role)) throw ApiError.forbidden('You do not have access to this ticket.');
  const messages = await Message.find({ ticket: ticket._id, ...(isOwner ? { internal: false } : {}) }).sort({ createdAt: 1 }).populate('sender', 'name role').lean();
  res.json({ ticket, messages });
});

export const replyTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found.');
  const isOwner = ticket.student.equals(req.user._id);
  const isStaff = ['admin', 'owner', 'support'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden('You do not have access to this ticket.');
  if (['Resolved', 'Closed'].includes(ticket.status) && isOwner) throw ApiError.badRequest('This ticket is closed. Please create a new ticket.');
  const message = await Message.create({
    ticket: ticket._id,
    sender: req.user._id,
    senderRole: req.user.role,
    senderName: req.user.name,
    body: req.body.body,
    internal: Boolean(req.body.internal) && isStaff,
  });
  ticket.messages.push(message._id);
  if (isStaff) {
    ticket.status = 'Awaiting Student';
    ticket.firstResponseAt = ticket.firstResponseAt || new Date();
    await notify({ recipient: ticket.student, type: 'support', title: `Reply on ticket ${ticket.reference}`, body: 'Support has replied to your enquiry.', link: '/dashboard/support', email: true });
  } else {
    ticket.status = 'In Progress';
    await notifyStaff({ type: 'admin_support', title: `Student replied on ${ticket.reference}`, body: req.body.body.slice(0, 120), link: `/admin/support/${ticket._id}` });
  }
  await ticket.save();
  res.status(201).json({ message, ticket });
});

export const adminListTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 }).limit(200).populate('student', 'name email').populate('assignedTo', 'name').lean();
  res.json({ tickets });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found.');
  const { status, assignedTo, priority, resolution, internalNote } = req.body;
  if (status) {
    if (!['Open', 'In Progress', 'Awaiting Student', 'Resolved', 'Closed'].includes(status)) throw ApiError.badRequest('Invalid ticket status.');
    ticket.status = status;
    if (status === 'Resolved') { ticket.resolvedAt = new Date(); ticket.resolution = resolution || ticket.resolution; }
  }
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo || undefined;
  if (priority) ticket.priority = priority;
  if (resolution) ticket.resolution = resolution;
  if (internalNote) ticket.internalNotes.push({ note: internalNote, actor: req.user._id, at: new Date() });
  await ticket.save();
  await logAudit(req, { action: 'support.ticket_updated', entity: 'SupportTicket', entityId: ticket._id, reference: ticket.reference, meta: { status } });
  res.json({ ticket });
});

export const publicEnquirySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(24),
  category: z.string().min(2),
  message: z.string().min(20).max(3000),
  deadline: z.string().optional().nullable(),
  fileIds: z.array(z.string()).optional().default([]),
});

export const createEnquiry = asyncHandler(async (req, res) => {
  const Enquiry = (await import('../models/Enquiry.js')).default;

  // Validate phone format (server-side)
  const phoneRaw = String(req.body.phone || '').replace(/[\s().-]/g, '');
  const phoneValid = phoneRaw.startsWith('+')
    ? /^\+[1-9]\d{7,14}$/.test(phoneRaw)
    : /^[6-9]\d{9}$/.test(phoneRaw) || /^\d{11,15}$/.test(phoneRaw);
  if (!phoneValid) throw ApiError.badRequest('Enter a valid mobile number — 10 digits, or include your country code.');

  // Validate deadline is not in the past
  if (req.body.deadline) {
    const deadlineDate = new Date(req.body.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) throw ApiError.badRequest('The deadline must be a future date.');
  }

  const enquiry = await Enquiry.create({
    reference: await nextReference('EN'),
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    category: req.body.category,
    message: req.body.message,
    deadline: req.body.deadline || null,
    fileIds: req.body.fileIds || [],
  });
  await notifyStaff({ type: 'admin_enquiry', title: `New web enquiry ${enquiry.reference}`, body: `${req.body.category} — ${req.body.message.slice(0, 100)}`, link: '/admin/support' });
  res.status(201).json({ enquiry: { reference: enquiry.reference, name: enquiry.name, email: enquiry.email, phone: enquiry.phone, category: enquiry.category, deadline: enquiry.deadline, message: enquiry.message }, message: 'Thank you — your enquiry has been received. We reply within one working day.' });
});

export const adminListEnquiries = asyncHandler(async (_req, res) => {
  const Enquiry = (await import('../models/Enquiry.js')).default;
  const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ enquiries });
});

export const updateEnquiry = asyncHandler(async (req, res) => {
  const Enquiry = (await import('../models/Enquiry.js')).default;
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { ...req.body, handledBy: req.user._id }, { returnDocument: 'after', runValidators: true });
  if (!enquiry) throw ApiError.notFound('Enquiry not found.');
  res.json({ enquiry });
});
