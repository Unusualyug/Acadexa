import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/me/saved-services', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedServices', 'name slug category startingPrice pricingModel');
  res.json({ services: user.savedServices });
}));
router.get('/consultants', authenticate, requireAdmin, asyncHandler(async (_req, res) => {
  const users = await User.find({ role: { $in: ['consultant', 'admin', 'owner'] }, accountStatus: 'active' }).select('name email role');
  res.json({ consultants: users });
}));
export default router;
