const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: [
        'verify_user', 'unverify_user',
        'suspend_user', 'unsuspend_user',
        'soft_delete_user', 'permanent_delete_user',
        'reactivate_user',
        'ban_user', 'unban_user',
        'update_user_role',
        'create_badge', 'update_badge', 'delete_badge',
        'create_institution', 'update_institution', 'delete_institution', 'merge_institutions',
        'create_skill', 'update_skill', 'delete_skill', 'merge_skills',
        'resolve_report', 'dismiss_report',
        'update_settings',
      ],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'badge', 'institution', 'skill', 'session', 'report', 'system'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetModel' },
    targetModel: { type: String, default: 'User' },
    targetName: { type: String, default: '' },
    reason: { type: String, default: '' },
    notes: { type: String, default: '' },
    ip: { type: String, default: '' },
    previousStatus: { type: String, default: '' },
    newStatus: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ admin: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
