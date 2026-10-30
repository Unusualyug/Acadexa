import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: String,
    senderName: String,
    body: { type: String, required: true, maxlength: 4000 },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FileRecord' }],
    readBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: Date }],
    internal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
