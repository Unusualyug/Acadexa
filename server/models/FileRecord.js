import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
    // Where the bytes live. `local` is the development fallback; every upload
    // goes to `cloudinary` as soon as credentials are configured.
    provider: { type: String, enum: ['cloudinary', 'local'], default: 'local', index: true },
    storageKey: { type: String, required: true, unique: true },
    publicId: { type: String, default: null, index: true },
    resourceType: { type: String, default: null }, // 'image' for PDFs/images, 'raw' otherwise
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    purpose: { type: String, required: true, index: true },
    version: { type: Number, default: 1 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    retentionUntil: Date,
    downloadCount: { type: Number, default: 0 },
    // Set when the underlying asset was destroyed (order completed, retention, manual delete).
    purgedAt: Date,
    purgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purgeReason: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('FileRecord', fileSchema);
