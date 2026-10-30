import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, default: 'sandbox' },
    providerOrderId: { type: String, index: true },
    providerPaymentId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['Created', 'Pending', 'Verified', 'Failed', 'Refunded', 'Partially Refunded'], default: 'Created', index: true },
    verifiedAt: Date,
    failureReason: String,
    refunds: [{ amount: Number, reason: String, status: String, providerRefundId: String, at: Date, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    events: [{ event: String, payload: mongoose.Schema.Types.Mixed, at: Date }],
    invoiceNumber: String,
    kind: { type: String, enum: ['order', 'booking'], default: 'order' },
  },
  { timestamps: true }
);

paymentSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Payment', paymentSchema);
