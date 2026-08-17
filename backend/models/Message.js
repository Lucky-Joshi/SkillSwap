const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  conversationId: { type: String, index: true },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection' },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ matchId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
