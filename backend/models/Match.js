const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    compatibilityScore: { type: Number, min: 0, max: 100, default: 0 },
    skills: [
      {
        skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
        name: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    requestedBy: { type: String, enum: ['mentor', 'learner'], required: true },
    createdAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

matchSchema.index({ mentorId: 1, learnerId: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
