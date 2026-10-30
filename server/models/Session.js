import mongoose from 'mongoose';

/**
 * Server-side session record backing the httpOnly JWT cookie.
 *
 * The JWT carries a random `sid`; only its SHA-256 hash is stored here, so a
 * database read cannot be replayed as a working credential. Sessions can be
 * revoked individually (sign out this device) or all at once (password change),
 * which a stateless JWT alone cannot do.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    // Kept so the cookie can be re-signed with a fresh lifetime on renewal.
    sid: { type: String, default: null },
    slidingDays: { type: Number, default: 90 },
    userAgent: { type: String, default: '', maxlength: 300 },
    ip: { type: String, default: '', maxlength: 80 },
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
  },
  { timestamps: true }
);

// TTL cleanup: revoked/expired sessions disappear automatically.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

sessionSchema.methods.isActive = function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
};

export default mongoose.model('Session', sessionSchema);
