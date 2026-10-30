import mongoose from 'mongoose';

const privacySchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['access', 'correction', 'deletion', 'export'], required: true },
    details: { type: String, maxlength: 2000 },
    verificationStatus: { type: String, enum: ['unverified', 'verified'], default: 'unverified' },
    status: { type: String, enum: ['Received', 'In Review', 'Completed', 'Rejected'], default: 'Received', index: true },
    processingNotes: String,
    legalExceptions: String,
    completedAt: Date,
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('PrivacyRequest', privacySchema);
