import crypto from "node:crypto";
import { z } from "zod";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";
import { notify, sendEmail } from "../services/notify.js";
import { logAudit } from "../services/audit.js";
import { normalisePhone } from "../utils/phone.js";
import {
  createSession,
  cookieOptions,
  revokeSession,
  revokeAllSessions,
  activeSessionsFor,
  resolveSession,
  SHORT_SESSION_DAYS,
} from "../services/sessions.js";

const REMEMBER_DAYS = 90; // remembered device: stays signed in, slides forward on use
const DEFAULT_DAYS = SHORT_SESSION_DAYS;

/** Issues a new server-side session and sets the httpOnly cookie. */
async function startSession(req, res, user, { remember = true } = {}) {
  const days = remember ? REMEMBER_DAYS : DEFAULT_DAYS;
  const { token, expiresAt } = await createSession(user, req, { days });
  const opts = cookieOptions(days);
  // Not "keep me signed in" -> session cookie: cleared when the browser closes.
  if (!remember) delete opts.maxAge;
  res.cookie(env.cookieName, token, opts);
  return { token, expiresAt };
}

const clearSessionCookie = (res) =>
  res.clearCookie(env.cookieName, { ...cookieOptions(), maxAge: 0 });

export const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name").max(120),
  email: z.string().email("Enter a valid email address"),
  // Required so the team can call about a live order. Validated and normalised to +CC...
  phone: z
    .string({ required_error: "A mobile number is required" })
    .min(8, "Enter a valid mobile number")
    .max(20)
    .refine(
      (v) => normalisePhone(v) !== null,
      "Enter a valid mobile number — 10 digits, or include your country code",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

/** Profile fields are validated explicitly rather than accepted as arbitrary keys. */
export const profileSchema = z.object({
  phone: z
    .string()
    .max(20)
    .optional()
    .refine(
      (v) => v === undefined || v === "" || normalisePhone(v) !== null,
      "Enter a valid mobile number",
    ),
  institution: z.string().max(160).optional(),
  course: z.string().max(160).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(600).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional().default(true),
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    throw ApiError.conflict("An account with this email already exists.");
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "student",
    verificationToken: crypto.randomBytes(24).toString("hex"),
    profile: { phone: normalisePhone(req.body.phone) },
  });
  const { token } = await startSession(req, res, user, { remember: true });
  await notify({
    recipient: user._id,
    type: "account",
    title: "Welcome to Acadexa",
    body: "Your account is ready. Browse services to submit your first request.",
    link: "/services",
    email: true,
  });
  res.status(201).json({ user: user.toSafeJSON(), token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user) throw ApiError.unauthorized("Incorrect email or password.");
  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized("Incorrect email or password.");
  if (user.accountStatus === "suspended")
    throw ApiError.forbidden(
      "This account is suspended. Please contact support.",
    );
  user.lastLoginAt = new Date();
  await user.save();
  const { token, expiresAt } = await startSession(req, res, user, {
    remember: req.body.remember !== false,
  });
  await logAudit(req, {
    action: "auth.login",
    entity: "User",
    entityId: user._id,
    reference: user.email,
    meta: { sessionExpires: expiresAt.toISOString() },
  });
  res.json({ user: user.toSafeJSON(), token, sessionExpiresAt: expiresAt });
});

export const logout = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.[env.cookieName] ||
    (req.headers.authorization || "").replace(/^Bearer /, "") ||
    null;
  if (token) {
    const resolved = await resolveSession(token);
    if (resolved.session)
      await revokeSession(resolved.session._id, "signed_out");
  }
  clearSessionCookie(res);
  res.json({ message: "Signed out." });
});

/** Signs out every device, including this one. */
export const logoutAll = asyncHandler(async (req, res) => {
  const count = await revokeAllSessions(req.user._id, {
    reason: "signed_out_all",
  });
  clearSessionCookie(res);
  await logAudit(req, {
    action: "auth.logout_all",
    entity: "User",
    entityId: req.user._id,
    meta: { revoked: count },
  });
  res.json({
    message: `Signed out of ${count} session${count === 1 ? "" : "s"}.`,
    revoked: count,
  });
});

/** Active devices for the privacy center. Token hashes are never returned. */
export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await activeSessionsFor(req.user._id);
  const currentId = req.auth?.session?._id
    ? String(req.auth.session._id)
    : null;
  res.json({
    sessions: sessions.map((s) => ({
      id: s._id,
      userAgent: s.userAgent || "Unknown device",
      ip: s.ip || "—",
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      current: String(s._id) === currentId,
    })),
  });
});

/** Revoke one device by id. A user can only revoke their own sessions. */
export const revokeOneSession = asyncHandler(async (req, res) => {
  const sessions = await activeSessionsFor(req.user._id);
  const target = sessions.find((s) => String(s._id) === String(req.params.id));
  if (!target) throw ApiError.notFound("That session is no longer active.");
  await revokeSession(target._id, "revoked_by_user");
  const isCurrent =
    req.auth?.session?._id &&
    String(req.auth.session._id) === String(target._id);
  if (isCurrent) clearSessionCookie(res);
  await logAudit(req, {
    action: "auth.session_revoked",
    entity: "Session",
    entityId: target._id,
    meta: { current: Boolean(isCurrent) },
  });
  res.json({
    message: "Device signed out.",
    signedOutCurrent: Boolean(isCurrent),
  });
});

export const me = asyncHandler(async (req, res) => {
  // Anonymous callers get 200 with user: null so the client can probe session state
  // without generating spurious 401s in the network log.
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user.toSafeJSON() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "profile", "notificationPrefs"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "profile") {
        const incoming = { ...req.body.profile };
        if (incoming.phone !== undefined) {
          incoming.phone = incoming.phone ? normalisePhone(incoming.phone) : "";
          if (incoming.phone === null)
            throw ApiError.badRequest("Enter a valid mobile number.");
        }
        req.user[key] = {
          ...(req.user[key]?.toObject?.() ?? req.user[key]),
          ...incoming,
        };
      } else if (key === "notificationPrefs") {
        req.user[key] = {
          ...(req.user[key]?.toObject?.() ?? req.user[key]),
          ...req.body[key],
        };
      } else {
        req.user[key] = req.body[key];
      }
    }
  }
  await req.user.save();
  res.json({ user: req.user.toSafeJSON(), message: "Profile updated." });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+passwordHash");
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.badRequest("Your current password is incorrect.");
  user.passwordHash = await User.hashPassword(newPassword);
  user.resetTokenHash = undefined;
  await user.save();
  // Every other device must sign in again with the new password.
  const revoked = await revokeAllSessions(user._id, {
    reason: "password_changed",
    exceptSessionId: req.auth?.session?._id,
  });
  await notify({
    recipient: user._id,
    type: "security",
    title: "Your password was changed",
    body: revoked
      ? `Other devices were signed out (${revoked}). If this was not you, contact support immediately.`
      : "If this was not you, contact support immediately.",
    email: true,
  });
  await logAudit(req, {
    action: "auth.password_changed",
    entity: "User",
    entityId: user._id,
    meta: { sessionsRevoked: revoked },
  });
  res.json({
    message: "Password updated. Other devices have been signed out.",
    sessionsRevoked: revoked,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() });
  // Always respond the same way so accounts cannot be enumerated.
  if (user) {
    const raw = crypto.randomBytes(32).toString("hex");
    user.resetTokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    user.resetTokenExpires = new Date(Date.now() + 45 * 60 * 1000);
    await user.save();
    const link = `${env.clientOrigins[0]}/reset-password?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Acadexa password",
      text: `Reset link (valid 45 minutes): ${link}`,
    });
    console.log("[auth] password reset link:", link);
  }
  res.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetTokenHash: hash,
    resetTokenExpires: { $gt: new Date() },
  }).select("+passwordHash");
  if (!user)
    throw ApiError.badRequest("This reset link is invalid or has expired.");
  user.passwordHash = await User.hashPassword(password);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  // A reset usually means the old password may be compromised: kill every session.
  const revoked = await revokeAllSessions(user._id, {
    reason: "password_reset",
  });
  await notify({
    recipient: user._id,
    type: "security",
    title: "Password reset completed",
    body: revoked
      ? `Your password was reset and ${revoked} active session(s) were signed out.`
      : "Your password was reset successfully.",
    email: true,
  });
  res.json({ message: "Password has been reset. You can sign in now." });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({ verificationToken: token }).select(
    "+verificationToken",
  );
  if (!user)
    throw ApiError.badRequest("Verification link is invalid or already used.");
  user.emailVerified = true;
  user.verificationToken = undefined;
  await user.save();
  res.json({ message: "Email verified.", user: user.toSafeJSON() });
});

export const requestAccountAction = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  if (!["deactivate", "delete"].includes(action))
    throw ApiError.badRequest("Unsupported account action.");
  if (action === "deactivate") {
    req.user.accountStatus = "deactivated";
    await req.user.save();
    res.clearCookie(env.cookieName, { ...cookieOptions(), maxAge: 0 });
    return res.json({
      message: "Account deactivated. Contact support to restore it.",
    });
  }
  req.user.accountStatus = "pending_deletion";
  req.user.deletionRequestedAt = new Date();
  await req.user.save();
  await logAudit(req, {
    action: "account.deletion_requested",
    entity: "User",
    entityId: req.user._id,
    meta: { reason },
  });
  res.json({
    message:
      "Deletion request received. Our team will process it and confirm by email.",
  });
});
