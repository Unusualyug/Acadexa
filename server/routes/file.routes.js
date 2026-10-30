import { Router } from 'express';
import * as ctrl from '../controllers/file.controller.js';
import { authenticate, optionalAuth, requireStaff, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
// Public upload for enquiry reference files (no auth required)
router.post('/upload', optionalAuth, upload.array('files', 8), ctrl.uploadFiles);
// Authenticated routes
router.use(authenticate);
router.get('/', ctrl.myFiles);
router.get('/:id/download', ctrl.downloadFile);
router.delete('/:id', ctrl.deleteFile);
router.post('/order/:id/deliverables', requireStaff, upload.array('files', 8), ctrl.uploadDeliverable);
router.get('/order/:id/purge-preview', requireAdmin, ctrl.purgePreview);
router.delete('/order/:id/files', requireAdmin, ctrl.purgeOrderFilesNow);
export default router;
