const mongoose = require('mongoose');

/**
 * Session lifecycle (stored): pending → confirmed → completed | cancelled
 * Derived states (computed at read time): upcoming (confirmed & future),
 * in_progress (confirmed & within the time window).
 */
const sessionSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', index: true },
    topic: { type: String, required: [true, 'Topic is required'], trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    notes: { type: String, default: '', maxlength: 1000 },
    date: { type: Date, required: true },
    startTime: { type: String, default: '10:00', trim: true },
    duration: { type: Number, min: 15, max: 240, default: 60 },
    meetingMode: { type: String, enum: ['online', 'offline'], default: 'online' },
    meetingType: { type: String, enum: ['googleMeet', 'zoom', 'teams', 'custom'], default: 'googleMeet' },
    meetingLink: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    locationType: { type: String, enum: ['campus', 'classroom', 'library', 'lab', 'custom'], default: 'campus' },
    location: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    confirmedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, default: '', maxlength: 2000 },
    recommendAnother: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sessionSchema.index({ date: 1, status: 1 });
sessionSchema.index({ mentorId: 1, learnerId: 1 });

module.exports = mongoose.model('Session', sessionSchema);
