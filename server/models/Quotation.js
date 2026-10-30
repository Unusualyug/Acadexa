import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    version: { type: Number, default: 1 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    scope: { type: String, required: true },
    deliverables: [{ type: String }],
    estimatedDelivery: { type: Date },
    revisionLimit: { type: Number, default: 2 },
    additionalCharges: [{ label: String, amount: Number }],
    paymentTerms: { type: String, default: 'Full payment before work begins. 100% advance.' },
    terms: { type: String },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Superseded'], default: 'Sent', index: true },
    sentAt: Date,
    acceptedAt: Date,
    rejectedAt: Date,
    supersedes: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentOrderId: String,
  },
  { timestamps: true }
);

export default mongoose.model('Quotation', quotationSchema);
