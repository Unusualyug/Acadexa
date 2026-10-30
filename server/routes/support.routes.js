import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/support.controller.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.post('/enquiry', validate({ body: ctrl.publicEnquirySchema }), ctrl.createEnquiry);
router.get('/staff/enquiries', authenticate, requireStaff, ctrl.adminListEnquiries);
router.patch('/staff/enquiries/:id', authenticate, requireStaff, ctrl.updateEnquiry);
router.use(authenticate);
router.get('/', ctrl.myTickets);
router.post('/', validate({ body: ctrl.ticketSchema }), ctrl.createTicket);
router.get('/staff/all', requireStaff, ctrl.adminListTickets);
router.patch('/staff/:id', requireStaff, ctrl.updateTicket);
router.get('/:id', ctrl.getTicket);
router.post('/:id/reply', validate({ body: z.object({ body: z.string().min(1).max(4000), internal: z.boolean().optional() }) }), ctrl.replyTicket);
export default router;
