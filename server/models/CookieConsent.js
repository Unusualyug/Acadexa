import mongoose from 'mongoose';

/**
 * A single record per browser (identified by a random visitor id kept in
 * localStorage — not a cookie, not a fingerprint), holding the current choice
 * plus an append-only history so the exact moment and wording of each decision
 * can be shown later.
 */
const eventSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['accept_all', 'reject_optional', 'custom'], required: true },
    categories: {
      necessary: { type: Boolean, default: true },
      analytics: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
    },
    policyVersion: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const consentSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    necessary: { type: Boolean, default: true },
    analytics: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    action: { type: String, enum: ['accept_all', 'reject_optional', 'custom'], required: true },
    policyVersion: { type: String, required: true },
    userAgent: { type: String, default: '', maxlength: 300 },
    // Store a salted hash rather than the raw address: enough to spot abuse, not a location record.
    ipHash: { type: String, default: '' },
    history: { type: [eventSchema], default: [] },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

consentSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    visitorId: this.visitorId,
    necessary: this.necessary,
    analytics: this.analytics,
    marketing: this.marketing,
    action: this.action,
    policyVersion: this.policyVersion,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('CookieConsent', consentSchema);
