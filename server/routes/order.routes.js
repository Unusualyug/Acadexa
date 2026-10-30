import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/order.controller.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.use(authenticate);

router.get('/summary/dashboard', ctrl.dashboardSummary);
router.get('/staff/all', requireStaff, ctrl.adminListOrders);
router.get('/staff/:id', requireStaff, ctrl.adminGetOrder);
router.patch('/:id/status', requireStaff, validate({ body: z.object({ status: z.string(), note: z.string().max(2000).optional(), deliveryNote: z.string().max(200).optional() }) }), ctrl.updateStatus);
router.patch('/:id/assign', requireStaff, validate({ body: z.object({ consultantId: z.string().min(1) }) }), ctrl.assignConsultant);
router.patch('/:id/deadline', requireStaff, validate({ body: z.object({ deadline: z.coerce.date(), reason: z.string().max(500).optional() }) }), ctrl.updateDeadline);
router.post('/:id/internal-notes', requireStaff, validate({ body: z.object({ note: z.string().min(2).max(2000) }) }), ctrl.addInternalNote);

router.post('/', writeLimiter, validate({ body: ctrl.createOrderSchema }), ctrl.createOrder);
router.get('/', ctrl.myOrders);
router.get('/:id', ctrl.getOrder);
router.post('/:id/cancel', validate({ body: z.object({ reason: z.string().max(500).optional() }) }), ctrl.cancelOrder);
router.post('/:id/revisions', validate({ body: z.object({ description: z.string().min(10).max(2000), fileIds: z.array(z.string()).optional().default([]) }) }), ctrl.requestRevision);
export default router;
