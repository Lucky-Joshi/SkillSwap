const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    endorserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

endorsementSchema.index({ userId: 1, skillId: 1, endorserId: 1 }, { unique: true });

module.exports = mongoose.model('Endorsement', endorsementSchema);
