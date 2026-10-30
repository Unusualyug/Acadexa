import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorRole: String,
    action: { type: String, required: true, index: true },
    entity: String,
    entityId: { type: mongoose.Schema.Types.ObjectId },
    reference: String,
    meta: { type: mongoose.Schema.Types.Mixed },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditSchema);
