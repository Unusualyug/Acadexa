import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/review.controller.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.get('/public', ctrl.publicReviews);
router.use(authenticate);
router.get('/mine', ctrl.myReviews);
router.post('/', validate({ body: z.object({ orderId: z.string().min(1), rating: z.coerce.number().min(1).max(5), feedback: z.string().max(1500).optional(), consentToPublish: z.boolean().optional() }) }), ctrl.createReview);
router.get('/staff/all', requireStaff, ctrl.adminListReviews);
router.patch('/staff/:id', requireStaff, ctrl.moderateReview);
export default router;
