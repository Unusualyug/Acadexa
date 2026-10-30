import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    category: { type: String, required: true },
    subject: { type: String, required: true, maxlength: 160 },
    description: { type: String, required: true, maxlength: 4000 },
    status: { type: String, enum: ['Open', 'In Progress', 'Awaiting Student', 'Resolved', 'Closed'], default: 'Open', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    resolution: String,
    internalNotes: [{ note: String, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: Date }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    resolvedAt: Date,
    firstResponseAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('SupportTicket', ticketSchema);
