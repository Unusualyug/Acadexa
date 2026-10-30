import { Router } from 'express';
import { z } from 'zod';
import * as auth from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: auth.registerSchema }), auth.register);
router.post('/login', authLimiter, validate({ body: auth.loginSchema }), auth.login);
router.post('/logout', optionalAuth, auth.logout);
router.post('/logout-all', authenticate, auth.logoutAll);
router.get('/sessions', authenticate, auth.listSessions);
router.delete('/sessions/:id', authenticate, auth.revokeOneSession);
router.get('/me', optionalAuth, auth.me);
router.patch('/profile', authenticate, validate({ body: z.object({ name: z.string().min(2).max(120).optional(), profile: auth.profileSchema.optional(), notificationPrefs: z.record(z.string(), z.boolean()).optional() }) }), auth.updateProfile);
router.patch('/password', authenticate, validate({ body: z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) }) }), auth.changePassword);
router.post('/forgot-password', authLimiter, validate({ body: z.object({ email: z.string().email() }) }), auth.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: z.object({ token: z.string().min(10), password: z.string().min(8).max(128) }) }), auth.resetPassword);
router.post('/verify-email', validate({ body: z.object({ token: z.string().min(10) }) }), auth.verifyEmail);
router.post('/account-request', authenticate, validate({ body: z.object({ action: z.enum(['deactivate', 'delete']), reason: z.string().max(500).optional() }) }), auth.requestAccountAction);

export default router;
