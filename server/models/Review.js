import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, maxlength: 1500 },
    moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    isPublished: { type: Boolean, default: false, index: true },
    adminResponse: String,
    consentToPublish: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
