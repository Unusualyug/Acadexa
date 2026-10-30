import { env } from '../config/env.js';
import { resolveSession, touchSession } from '../services/sessions.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ADMIN_ROLES, STAFF_ROLES } from '../utils/constants.js';

function extractToken(req) {
  const cookieToken = req.cookies?.[env.cookieName];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Please sign in to continue.');

  const resolved = await resolveSession(token);
  if (resolved.error === 'invalid') throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  if (resolved.error === 'revoked') throw ApiError.unauthorized('This session has been signed out. Please sign in again.');
  if (resolved.error === 'expired') throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  if (resolved.error) throw ApiError.unauthorized('Please sign in again.');

  const { payload, session } = resolved;
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists.');
  if (user.accountStatus === 'suspended') throw ApiError.forbidden('This account is suspended. Contact support.');
  if (user.accountStatus === 'deactivated') throw ApiError.forbidden('This account is deactivated.');

  // Sliding expiry: an active user is never signed out. `res` lets the cookie be reissued.
  await touchSession(session, res);
  req.user = user;
  req.auth = { token, payload, session };
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const { payload, session, error } = await resolveSession(token);
    if (error) return next(); // invalid/revoked/expired: treat as anonymous
    const user = await User.findById(payload.sub);
    if (user && user.accountStatus === 'active') {
      req.user = user;
      req.auth = { token, payload, session };
      await touchSession(session, res);
    }
  } catch { /* ignore invalid token for optional auth */ }
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions for this action.'));
  next();
};

export const requireStaff = requireRole(...STAFF_ROLES);
export const requireAdmin = requireRole(...ADMIN_ROLES);
