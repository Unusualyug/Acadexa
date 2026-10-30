import ConsultationBooking from '../models/ConsultationBooking.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReference } from '../utils/reference.js';
import { notify, notifyStaff } from '../services/notify.js';

const SLOT_MINUTES = 30;

export const availableSlots = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  if (Number.isNaN(date.getTime())) throw ApiError.badRequest('Invalid date.');
  const dayStart = new Date(date); dayStart.setHours(10, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(18, 0, 0, 0);
  const booked = await ConsultationBooking.find({
    startsAt: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ['Requested', 'Confirmed', 'Rescheduled'] },
  }).select('startsAt durationMinutes').lean();
  const slots = [];
  for (let t = dayStart.getTime(); t + SLOT_MINUTES * 60000 <= dayEnd.getTime(); t += SLOT_MINUTES * 60000) {
    const clash = booked.some((b) => Math.abs(new Date(b.startsAt).getTime() - t) < b.durationMinutes * 60000);
    slots.push({ startsAt: new Date(t), available: !clash && t > Date.now() });
  }
  res.json({ date: dayStart.toISOString().slice(0, 10), slots });
});

export const createBooking = asyncHandler(async (req, res) => {
  const startsAt = new Date(req.body.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) throw ApiError.badRequest('Choose a valid future time slot.');
  const duration = Number(req.body.durationMinutes || SLOT_MINUTES);
  const end = new Date(startsAt.getTime() + duration * 60000);
  const clash = await ConsultationBooking.findOne({
    status: { $in: ['Requested', 'Confirmed', 'Rescheduled'] },
    startsAt: { $lt: end },
    $expr: { $gt: [{ $add: ['$startsAt', { $multiply: ['$durationMinutes', 60000] }] }, startsAt] },
  });
  if (clash) throw ApiError.conflict('That slot has just been taken. Please choose another time.');
  const booking = await ConsultationBooking.create({
    reference: await nextReference('CB'),
    student: req.user._id,
    category: req.body.category,
    startsAt,
    durationMinutes: duration,
    price: req.body.price || 0,
    notes: req.body.notes,
    status: 'Requested',
  });
  await notify({ recipient: req.user._id, type: 'booking', title: `Consultation ${booking.reference} requested`, body: `${startsAt.toDateString()} at ${startsAt.toTimeString().slice(0, 5)}. We will confirm shortly.`, link: '/dashboard/consultations', email: true });
  await notifyStaff({ type: 'admin_booking', title: `New consultation request ${booking.reference}`, body: req.body.category, link: '/admin/calendar' });
  res.status(201).json({ booking });
});

export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await ConsultationBooking.find({ student: req.user._id }).sort({ startsAt: -1 }).lean();
  res.json({ bookings });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await ConsultationBooking.findOne({ _id: req.params.id, student: req.user._id });
  if (!booking) throw ApiError.notFound('Booking not found.');
  if (['Cancelled', 'Completed', 'No Show'].includes(booking.status)) throw ApiError.badRequest('This booking can no longer be cancelled.');
  const hoursNotice = (new Date(booking.startsAt) - Date.now()) / 36e5;
  if (hoursNotice < 12) throw ApiError.badRequest('Cancellations require at least 12 hours notice. Please contact support.');
  booking.status = 'Cancelled';
  booking.cancelReason = req.body.reason;
  await booking.save();
  res.json({ booking });
});

export const rescheduleBooking = asyncHandler(async (req, res) => {
  const booking = await ConsultationBooking.findOne({ _id: req.params.id, student: req.user._id });
  if (!booking) throw ApiError.notFound('Booking not found.');
  const startsAt = new Date(req.body.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) throw ApiError.badRequest('Choose a valid future slot.');
  const clash = await ConsultationBooking.findOne({ _id: { $ne: booking._id }, status: { $in: ['Requested', 'Confirmed', 'Rescheduled'] }, startsAt });
  if (clash) throw ApiError.conflict('That slot is already booked.');
  booking.startsAt = startsAt;
  booking.status = 'Rescheduled';
  await booking.save();
  res.json({ booking });
});

export const adminListBookings = asyncHandler(async (_req, res) => {
  const bookings = await ConsultationBooking.find().sort({ startsAt: -1 }).limit(200).populate('student', 'name email').populate('consultant', 'name').lean();
  res.json({ bookings });
});

export const adminUpdateBooking = asyncHandler(async (req, res) => {
  const booking = await ConsultationBooking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found.');
  const { status, consultant, meetingLink } = req.body;
  if (status) booking.status = status;
  if (consultant !== undefined) booking.consultant = consultant || undefined;
  if (meetingLink !== undefined) booking.meetingLink = meetingLink;
  await booking.save();
  if (status) await notify({ recipient: booking.student, type: 'booking', title: `Consultation ${booking.reference}: ${status}`, body: 'Open your dashboard for details.', link: '/dashboard/consultations', email: true });
  res.json({ booking });
});
