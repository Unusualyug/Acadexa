import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/booking.controller.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.get('/slots', ctrl.availableSlots);
router.use(authenticate);
router.get('/', ctrl.myBookings);
router.post('/', validate({ body: z.object({ category: z.string().min(2), startsAt: z.coerce.date(), durationMinutes: z.coerce.number().min(15).max(120).optional(), notes: z.string().max(1200).optional(), price: z.coerce.number().min(0).optional() }) }), ctrl.createBooking);
router.post('/:id/cancel', ctrl.cancelBooking);
router.post('/:id/reschedule', validate({ body: z.object({ startsAt: z.coerce.date() }) }), ctrl.rescheduleBooking);
router.get('/staff/all', requireStaff, ctrl.adminListBookings);
router.patch('/staff/:id', requireStaff, ctrl.adminUpdateBooking);
export default router;
