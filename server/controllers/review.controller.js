import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ORDER_STATUS } from '../utils/constants.js';

export const createReview = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, student: req.user._id });
  if (!order) throw ApiError.notFound('Order not found.');
  const eligible = order.deliveredAt || [ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED, ORDER_STATUS.REVISION_REQUESTED].includes(order.status);
  if (!eligible) throw ApiError.badRequest('Feedback can be submitted once your order has been delivered.');
  const existing = await Review.findOne({ order: order._id });
  if (existing) throw ApiError.conflict('You have already submitted feedback for this order.');
  if (req.body.consentToPublish && !req.body.feedback) throw ApiError.badRequest('Add written feedback if you consent to publication.');
  const review = await Review.create({
    student: req.user._id,
    order: order._id,
    service: order.service,
    rating: req.body.rating,
    feedback: req.body.feedback,
    consentToPublish: Boolean(req.body.consentToPublish),
  });
  res.status(201).json({ review, message: 'Thank you — your feedback has been recorded.' });
});

export const publicReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find({ isPublished: true, moderationStatus: 'approved' })
    .sort({ createdAt: -1 })
    .limit(9)
    .populate('student', 'name')
    .populate('service', 'name')
    .lean();
  res.json({ reviews: reviews.map((r) => ({ ...r, student: { name: r.student?.name?.split(' ')[0] || 'Student' } })) });
});

export const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ student: req.user._id }).populate('order', 'reference title').lean();
  res.json({ reviews });
});

export const adminListReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(200).populate('student', 'name email').populate('order', 'reference').lean();
  res.json({ reviews });
});

export const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');
  const { moderationStatus, isPublished, adminResponse } = req.body;
  if (moderationStatus) review.moderationStatus = moderationStatus;
  if (typeof isPublished === 'boolean') {
    if (isPublished && !review.consentToPublish) throw ApiError.badRequest('The student has not consented to publication.');
    review.isPublished = isPublished;
  }
  if (adminResponse !== undefined) review.adminResponse = adminResponse;
  await review.save();
  res.json({ review });
});
