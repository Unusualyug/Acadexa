import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/payment.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.post('/qr-create', validate({ body: z.object({ orderId: z.string().min(1), amount: z.coerce.number().min(1), currency: z.string().min(2).default('INR'), upiId: z.string().min(1).optional(), fileIds: z.array(z.string()).default([]) }) }), ctrl.createQrPayment);
router.patch('/:id/verify', requireAdmin, validate({ body: z.object({ status: z.enum(['Verified', 'Failed']), note: z.string().max(500).optional() }) }), ctrl.verifyQrPayment);
router.post('/webhook', ctrl.webhook);
router.use(authenticate);
router.post('/create', validate({ body: z.object({ orderId: z.string().min(1), couponCode: z.string().max(30).optional() }) }), ctrl.createPaymentIntent);
router.post('/verify', validate({ body: z.object({ providerOrderId: z.string().min(5), providerPaymentId: z.string().min(5), signature: z.string().min(10) }) }), ctrl.verifyPayment);
router.post('/:id/sandbox-sign', ctrl.sandboxSign);
router.get('/', ctrl.myPayments);
router.get('/:id/receipt', ctrl.receipt);
router.get('/staff/all', requireAdmin, ctrl.adminListPayments);
router.post('/:id/refund', requireAdmin, validate({ body: z.object({ amount: z.coerce.number().min(1).optional(), reason: z.string().max(500).optional() }) }), ctrl.refundPayment);
export default router;
