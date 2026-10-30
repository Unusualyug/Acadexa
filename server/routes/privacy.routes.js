import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/privacy.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);
router.get('/', ctrl.myRequests);
router.post('/', validate({ body: z.object({ type: z.enum(['access', 'correction', 'deletion', 'export']), details: z.string().max(2000).optional() }) }), ctrl.createRequest);
router.get('/data-summary', ctrl.myDataSummary);
router.get('/staff/all', requireAdmin, ctrl.adminListRequests);
router.patch('/staff/:id', requireAdmin, ctrl.processRequest);
export default router;
