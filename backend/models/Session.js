const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    topic: { type: String, required: [true, 'Topic is required'], trim: true, maxlength: 120 },
    notes: { type: String, default: '', maxlength: 1000 },
    date: { type: Date, required: true },
    duration: { type: Number, min: 15, max: 240, default: 60 },
    link: { type: String, default: '' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
