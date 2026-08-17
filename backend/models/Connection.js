const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['mentorship', 'peer'],
      default: 'mentorship',
    },
    compatibilityScore: { type: Number, min: 0, max: 100, default: 0 },
    skills: [
      {
        skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
        name: String,
      },
    ],
    skillAteaches: { type: String, default: '' },
    skillBteaches: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    acceptedAt: { type: Date },
    active: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

connectionSchema.index({ userA: 1, userB: 1 }, { unique: true });
connectionSchema.index({ active: 1, status: 1 });

module.exports = mongoose.model('Connection', connectionSchema);
