import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/consent.controller.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth, authenticate, requireAdmin } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public: a visitor can decide before creating an account.
router.post('/', optionalAuth, writeLimiter, validate({ body: ctrl.consentSchema }), ctrl.saveConsent);
router.get('/me', authenticate, ctrl.myConsent);

// Consent-gated page view. The client only calls this when analytics consent is true;
// the server records it without any personal identifier.
const eventSchema = z.object({
  visitorId: z.string().min(8).max(80).regex(/^[A-Za-z0-9_-]+$/),
  path: z.string().min(1).max(300),
  referrerHost: z.string().max(120).optional().default(''),
});

router.post(
  '/analytics/event',
  validate({ body: eventSchema }),
  asyncHandler(async (req, res) => {
    const { visitorId, path, referrerHost } = req.body;
    await AnalyticsEvent.create({
      visitorId,
      // Store the route only: no query strings, which could carry reset tokens or emails.
      path: path.split('?')[0].slice(0, 300),
      referrerHost: (referrerHost || '').slice(0, 120),
    });
    res.status(204).end();
  })
);

router.get('/admin/consents', authenticate, requireAdmin, ctrl.consentStats);

router.get(
  '/admin/summary',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 30 * 86400000);
    const [totals, topPaths, daily] = await Promise.all([
      AnalyticsEvent.countDocuments({ createdAt: { $gte: since } }),
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$path', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, views: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    res.json({
      windowDays: 30,
      totals: { views: totals },
      topPaths: topPaths.map((p) => ({ path: p._id, views: p.views })),
      daily: daily.map((d) => ({ date: d._id, views: d.views })),
    });
  })
);

export default router;
