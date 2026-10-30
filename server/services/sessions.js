/**
 * Session helpers: creation, lookup, revocation.
 *
 * The cookie holds a signed JWT containing a random session id (`sid`). The
 * database stores only the SHA-256 hash of that id, so the session can be
 * looked up but never reconstructed from the database.
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import { env } from '../config/env.js';

const SESSION_DAYS = 90; // remembered devices
export const SHORT_SESSION_DAYS = 1; // "this session only"

export const hashSid = (sid) => crypto.createHash('sha256').update(String(sid)).digest('hex');

export function sessionExpiry(days = SESSION_DAYS) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export const cookieOptions = (days = SESSION_DAYS) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  maxAge: days * 24 * 60 * 60 * 1000,
  path: '/',
});

/** Signs an existing session id into a fresh cookie value. */
export function signSessionToken({ sub, sid, role }, days = SESSION_DAYS) {
  return jwt.sign({ sub, sid, ...(role ? { role } : {}) }, env.jwtSecret, { expiresIn: `${days}d` });
}

/** Creates a session record and returns the signed token to put in the cookie. */
export async function createSession(user, req, { days = SESSION_DAYS } = {}) {
  const sid = crypto.randomBytes(32).toString('hex');
  const expiresAt = sessionExpiry(days);
  await Session.create({
    user: user._id,
    tokenHash: hashSid(sid),
    sid,
    slidingDays: days,
    userAgent: (req?.headers?.['user-agent'] || '').slice(0, 300),
    ip: (req?.ip || '').slice(0, 80),
    expiresAt,
  });
  const token = signSessionToken({ sub: user._id, sid, role: user.role }, days);
  return { token, sid, expiresAt };
}

/** Resolves a token to { payload, session, user } or null if not usable. */
export async function resolveSession(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return { error: 'invalid' };
  }
  if (!payload.sid) return { error: 'legacy' }; // pre-session token: no revocation handle
  const session = await Session.findOne({ tokenHash: hashSid(payload.sid) });
  if (!session) return { error: 'unknown', payload };
  if (session.revokedAt) return { error: 'revoked', payload, session };
  if (session.expiresAt <= new Date()) return { error: 'expired', payload, session };
  return { payload, session };
}

/** Marks one session revoked. Returns true when something changed. */
export async function revokeSession(sessionId, reason = 'signed_out') {
  const res = await Session.updateOne(
    { _id: sessionId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );
  return res.modifiedCount > 0;
}

/** Revokes every active session for a user, optionally keeping one (the current device). */
export async function revokeAllSessions(userId, { reason = 'all_signed_out', exceptSessionId = null } = {}) {
  const filter = { user: userId, revokedAt: null };
  if (exceptSessionId) filter._id = { $ne: exceptSessionId };
  const res = await Session.updateMany(filter, { $set: { revokedAt: new Date(), revokedReason: reason } });
  return res.modifiedCount;
}

/**
 * Keeps an active session alive (sliding expiry) and records last-seen.
 *
 * A user who opens the app at least once every 90 days is never asked to sign in
 * again. RENEW_AFTER_DAYS is deliberately short so the cookie is refreshed well
 * before it lapses, even if the user takes a long break mid-window.
 * Returns the new expiry when the cookie should be reissued, otherwise null.
 */
const RENEW_AFTER_DAYS = 60;

export async function touchSession(session, res) {
  const now = new Date();
  const stale = !session.lastSeenAt || now.getTime() - new Date(session.lastSeenAt).getTime() > 5 * 60 * 1000;

  const remainingDays = (new Date(session.expiresAt).getTime() - now.getTime()) / 86400000;
  const shouldRenew = remainingDays < RENEW_AFTER_DAYS;

  if (!shouldRenew) {
    if (stale) {
      session.lastSeenAt = now;
      await Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: now } });
    }
    return null;
  }

  // Slide both the database record and the cookie forward by a full window.
  const days = session.slidingDays || SESSION_DAYS;
  const expiresAt = sessionExpiry(days);
  session.lastSeenAt = now;
  session.expiresAt = expiresAt;
  await Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: now, expiresAt } });

  if (res) {
    // Re-sign the same sid with a refreshed lifetime; the identity does not change.
    const payload = { sub: session.user, sid: session.sid };
    res.cookie(env.cookieName, signSessionToken(payload, days), cookieOptions(days));
  }
  return expiresAt;
}

export async function activeSessionsFor(userId) {
  return Session.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ lastSeenAt: -1 })
    .select('userAgent ip createdAt lastSeenAt expiresAt')
    .lean();
}

export async function purgeExpiredSessions() {
  const res = await Session.deleteMany({ expiresAt: { $lt: new Date(Date.now() - 7 * 86400000) } });
  return res.deletedCount;
}
