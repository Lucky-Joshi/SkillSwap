const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ mentor: 1, learner: 1, sessionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
