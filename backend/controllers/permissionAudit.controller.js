import { handle } from '../utils/asyncHandler.js';
import { PermissionAuditLog } from '../models/index.js';

export const listPermissionAuditLogs = handle(async (req, res) => {
  const { targetType, search, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (targetType) filter.targetType = targetType;
  if (search) {
    filter.$or = [
      { targetLabel: { $regex: search, $options: 'i' } },
      { actorEmail: { $regex: search, $options: 'i' } },
      { summary: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [logs, total] = await Promise.all([
    PermissionAuditLog.find(filter)
      .populate('actor', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    PermissionAuditLog.countDocuments(filter),
  ]);

  res.json({ success: true, count: logs.length, total, data: logs });
});
