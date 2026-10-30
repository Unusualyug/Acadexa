import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    name: { type: String, required: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true, maxlength: 24 },
    category: { type: String, required: true },
    message: { type: String, required: true, maxlength: 3000 },
    deadline: { type: Date },
    fileIds: [{ type: String }],
    status: { type: String, enum: ['New', 'Responded', 'Closed'], default: 'New', index: true },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Enquiry', enquirySchema);
