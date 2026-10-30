import { Router } from 'express';
import * as ctrl from '../controllers/service.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.get('/', optionalAuth, ctrl.listServices);
router.get('/slug/:slug', optionalAuth, ctrl.getService);
router.post('/', authenticate, requireAdmin, validate({ body: ctrl.serviceSchema }), ctrl.createService);
router.patch('/:id', authenticate, requireAdmin, ctrl.updateService);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteService);
router.post('/:id/save', authenticate, ctrl.toggleSavedService);
export default router;
