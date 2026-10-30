import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    status: String,
    action: String,
    note: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    visibility: { type: String, enum: ['student', 'internal'], default: 'student' },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: String,
    title: { type: String, required: true, maxlength: 160 },
    subjectArea: { type: String, maxlength: 160 },
    instructions: { type: String, required: true, maxlength: 6000 },
    deliverablesRequired: { type: String, maxlength: 2000 },
    institutionalGuidelines: { type: String, maxlength: 2000 },
    additionalNotes: { type: String, maxlength: 2000 },
    preferredCommunication: { type: String, enum: ['In-app messages', 'Email', 'WhatsApp'], default: 'In-app messages' },
    deadline: { type: Date, required: true },
    status: { type: String, default: 'Pending Review', index: true },
    assignedConsultant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    activeQuotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', default: null },
    agreedAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    paymentStatus: { type: String, enum: ['Not Required', 'Pending', 'Paid', 'Refunded', 'Partially Refunded'], default: 'Pending', index: true },
    couponCode: String,
    discountAmount: { type: Number, default: 0 },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FileRecord' }],
    deliveredFiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FileRecord' }],
    revisionCount: { type: Number, default: 0 },
    deadlineHistory: [{ from: Date, to: Date, reason: String, at: Date, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    activity: [activitySchema],
    internalNotes: [{ note: String, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: Date }],
    cancelledReason: String,
    completedAt: Date,
    deliveredAt: Date,
    lastStudentActivityAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ student: 1, status: 1 });
orderSchema.index({ deadline: 1 });

export default mongoose.model('Order', orderSchema);
