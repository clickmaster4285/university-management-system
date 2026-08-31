import mongoose from 'mongoose';

const permissionAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        'role_created',
        'role_updated',
        'role_deleted',
        'role_applied',
        'role_reseeded',
        'user_access_updated',
        'user_login_enabled',
        'user_login_disabled',
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['role', 'user'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetLabel: {
      type: String,
      default: '',
      trim: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorEmail: {
      type: String,
      default: '',
      trim: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

permissionAuditLogSchema.index({ createdAt: -1 });
permissionAuditLogSchema.index({ targetType: 1, targetLabel: 1 });

export default mongoose.model('PermissionAuditLog', permissionAuditLogSchema);
