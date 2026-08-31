import { PermissionAuditLog } from '../models/index.js';

export async function logPermissionAudit({
  action,
  targetType,
  targetId = null,
  targetLabel = '',
  actor = null,
  actorEmail = '',
  summary = '',
  changes = null,
}) {
  try {
    await PermissionAuditLog.create({
      action,
      targetType,
      targetId,
      targetLabel,
      actor: actor?._id || actor || null,
      actorEmail: actorEmail || actor?.email || '',
      summary,
      changes,
    });
  } catch (error) {
    console.error('Failed to write permission audit log:', error.message);
  }
}
