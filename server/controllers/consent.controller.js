import crypto from 'node:crypto';
import { z } from 'zod';
import CookieConsent from '../models/CookieConsent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

/** Bump when the categories or their wording change: stored consents then show as stale. */
export const CONSENT_POLICY_VERSION = '2026-01';

export const consentSchema = z.object({
  visitorId: z.string().min(8).max(80).regex(/^[A-Za-z0-9_-]+$/, 'Invalid visitor id'),
  action: z.enum(['accept_all', 'reject_optional', 'custom']),
  categories: z.object({
    necessary: z.literal(true).optional(),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
});

const hashIp = (ip) =>
  crypto.createHash('sha256').update(`${ip || ''}|${env.jwtSecret}`).digest('hex').slice(0, 32);

/**
 * Records (or replaces) this browser's consent decision.
 * `necessary` is not a user choice — it is always on; only analytics and
 * marketing are optional. The action field records *how* the choice was made.
 */
export const saveConsent = asyncHandler(async (req, res) => {
  const { visitorId, action, categories } = req.body;

  // A decision must match its label: "reject optional" can never carry optional consent.
  if (action === 'reject_optional' && (categories.analytics || categories.marketing)) {
    throw ApiError.badRequest('Rejecting optional cookies cannot enable analytics or marketing.');
  }
  if (action === 'accept_all' && (!categories.analytics || !categories.marketing)) {
    throw ApiError.badRequest('Accept all requires both optional categories to be enabled.');
  }

  const event = {
    action,
    categories: { necessary: true, analytics: categories.analytics, marketing: categories.marketing },
    policyVersion: CONSENT_POLICY_VERSION,
    at: new Date(),
  };

  const consent = await CookieConsent.findOneAndUpdate(
    { visitorId },
    {
      $set: {
        necessary: true,
        analytics: categories.analytics,
        marketing: categories.marketing,
        action,
        policyVersion: CONSENT_POLICY_VERSION,
        userAgent: (req.headers['user-agent'] || '').slice(0, 300),
        ipHash: hashIp(req.ip),
        lastSeenAt: new Date(),
        ...(req.user ? { user: req.user._id } : {}),
      },
      $push: { history: { $each: [event], $slice: -50 } },
      $setOnInsert: { visitorId },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  res.json({ consent: consent.toPublicJSON() });
});

/** Consent history for the signed-in user (privacy center / transparency). */
export const myConsent = asyncHandler(async (req, res) => {
  const records = await CookieConsent.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(10).lean();
  res.json({
    policyVersion: CONSENT_POLICY_VERSION,
    records: records.map((r) => ({
      visitorId: r.visitorId,
      analytics: r.analytics,
      marketing: r.marketing,
      action: r.action,
      policyVersion: r.policyVersion,
      updatedAt: r.updatedAt,
      history: (r.history || []).slice(-20).reverse(),
    })),
  });
});

/** Admin overview: how many browsers are in each state. Counts only, no identifiers. */
export const consentStats = asyncHandler(async (_req, res) => {
  const [total, accepted, rejected, custom, analyticsOn, marketingOn, recent] = await Promise.all([
    CookieConsent.countDocuments(),
    CookieConsent.countDocuments({ action: 'accept_all' }),
    CookieConsent.countDocuments({ action: 'reject_optional' }),
    CookieConsent.countDocuments({ action: 'custom' }),
    CookieConsent.countDocuments({ analytics: true }),
    CookieConsent.countDocuments({ marketing: true }),
    CookieConsent.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, decisions: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 14 },
    ]),
  ]);
  res.json({
    policyVersion: CONSENT_POLICY_VERSION,
    totals: { total, accepted, rejected, custom, analyticsOn, marketingOn },
    daily: recent.map((r) => ({ date: r._id, decisions: r.decisions })),
  });
});
