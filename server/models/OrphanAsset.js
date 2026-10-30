/**
 * An asset that could not be destroyed when its owner record was removed.
 *
 * Normally this collection is empty: account deletion destroys the stored file
 * first, then the FileRecord. When the storage provider is unreachable the file
 * survives while the database record does not, which would leave a document in
 * the bucket that nothing knows about. Instead of silently forgetting it, a
 * minimal record is kept here — storage identifiers only, no user PII — and the
 * scheduled job keeps retrying until the provider confirms deletion.
 */
import mongoose from 'mongoose';

const orphanAssetSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['cloudinary', 'local'], required: true, index: true },
    storageKey: { type: String, required: true },
    publicId: { type: String, default: null },
    resourceType: { type: String, default: null },
    reason: { type: String, default: 'account_deleted' },
    attempts: { type: Number, default: 1 },
    lastError: { type: String, default: null },
    lastAttemptAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('OrphanAsset', orphanAssetSchema);
