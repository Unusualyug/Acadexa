import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/quotation.controller.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);
router.get('/', ctrl.myQuotations);
router.get('/staff/all', requireStaff, ctrl.adminListQuotations);
router.post('/', requireStaff, validate({ body: ctrl.quotationSchema }), ctrl.createQuotation);
router.post('/:id/accept', ctrl.acceptQuotation);
router.post('/:id/reject', validate({ body: z.object({ reason: z.string().max(500).optional() }) }), ctrl.rejectQuotation);
export default router;
