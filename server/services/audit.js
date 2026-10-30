import AuditLog from '../models/AuditLog.js';

export async function logAudit(req, { action, entity, entityId, reference, meta }) {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action,
      entity,
      entityId,
      reference,
      meta,
      ip: req.ip,
      userAgent: req.headers?.['user-agent']?.slice(0, 240),
    });
  } catch (err) {
    console.error('[audit] failed to write log', err.message);
  }
}
