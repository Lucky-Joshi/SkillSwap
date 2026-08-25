const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'connection_request', 'connection_accepted', 'connection_declined',
        'session_booked', 'session_confirmed', 'session_completed', 'session_cancelled',
        'review_received', 'badge_earned', 'message_received', 'reminder', 'system',
        'user_verified', 'user_suspended', 'user_reactivated', 'user_banned', 'user_deletion_warning',
      ],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Notification', notificationSchema);
