import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, maxlength: 400 },
    link: String,
    relatedModel: String,
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    read: { type: Boolean, default: false, index: true },
    emailDelivery: { type: String, enum: ['not_sent', 'queued', 'sent', 'failed', 'skipped'], default: 'not_sent' },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
