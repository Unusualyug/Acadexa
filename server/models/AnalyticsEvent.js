import mongoose from 'mongoose';

/**
 * First-party, cookie-free page-view record. Written only when the visitor has
 * granted analytics consent. No IP, no user agent, no cross-site identifier —
 * just a random visitor id, the path and the day, which is enough to see which
 * pages are actually read.
 */
const analyticsEventSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, index: true },
    path: { type: String, required: true, maxlength: 300 },
    referrerHost: { type: String, default: '', maxlength: 120 },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 180 },
  },
  { versionKey: false }
);

analyticsEventSchema.index({ path: 1, createdAt: -1 });

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
