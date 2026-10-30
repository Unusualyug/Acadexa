import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);
router.get('/order/:orderId', ctrl.listMessages);
router.post('/order/:orderId', validate({ body: z.object({ body: z.string().min(1).max(4000), attachmentIds: z.array(z.string()).max(5).optional(), internal: z.boolean().optional() }) }), ctrl.sendMessage);
export default router;
