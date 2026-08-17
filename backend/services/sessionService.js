const Match = require('../models/Match');

/**
 * Session helpers: effective start time, derived lifecycle status and
 * per-user progress tracking applied when a session is completed.
 */

// Combine the session's date with its startTime ("HH:MM") in local time.
const effectiveStart = (session) => {
  const date = new Date(session.date);
  const [hours = 10, minutes = 0] = String(session.startTime || '10:00').split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const endOfDay = (d) => {
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return end;
};

const startOfDay = (d) => {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Derive the lifecycle status for display.
// stored: pending | confirmed | completed | cancelled
// derived: upcoming | in_progress
const deriveStatus = (session, now = new Date()) => {
  if (session.status === 'confirmed') {
    const start = effectiveStart(session);
    const end = new Date(start.getTime() + (session.duration || 60) * 60000);
    if (now >= start && now <= end) return 'in_progress';
    return 'upcoming';
  }
  return session.status;
};

// Normalise an endDate so comparisons use the session's local day.
const sessionEndLocal = (session) => {
  const start = effectiveStart(session);
  return new Date(start.getTime() + (session.duration || 60) * 60000);
};

// Date-only comparison for streak logic (uses server-local day boundaries).
const isSameLocalDay = (a, b) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

const isYesterdayLocal = (a, b) => {
  const yesterday = new Date(b);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameLocalDay(a, yesterday);
};

const updateStreak = (previous, lastDate, today = new Date()) => {
  if (!lastDate) return 1;
  if (isSameLocalDay(lastDate, today)) return previous || 1;
  if (isYesterdayLocal(lastDate, today)) return (previous || 0) + 1;
  return 1;
};

// Apply progress updates to a user who finished a session.
const applySessionCompletion = async (user, session) => {
  const durationHours = (session.duration || 60) / 60;
  const isMentor = String(session.mentorId) === String(user._id);
  const today = new Date();

  if (isMentor) {
    user.hoursTaught = (user.hoursTaught || 0) + durationHours;
    user.teachingStreak = updateStreak(user.teachingStreak, user.lastSessionDate, today);
  } else {
    user.sessionsCompleted = (user.sessionsCompleted || 0) + 1;
    user.hoursLearned = (user.hoursLearned || 0) + durationHours;
    user.learningStreak = updateStreak(user.learningStreak, user.lastSessionDate, today);
    if (session.topic && !(user.learnedSkills || []).includes(session.topic)) {
      user.learnedSkills = [...(user.learnedSkills || []), session.topic];
    }
  }
  user.lastSessionDate = today;
  await user.save();
  return user;
};

// Resolve the relationship between the session's two participants.
const relationshipFor = (session) =>
  Match.findOne({
    $or: [
      { mentorId: session.mentorId, learnerId: session.learnerId },
      { mentorId: session.learnerId, learnerId: session.mentorId },
    ],
    status: 'accepted',
    active: true,
  });

module.exports = {
  effectiveStart,
  deriveStatus,
  sessionEndLocal,
  isSameLocalDay,
  isYesterdayLocal,
  applySessionCompletion,
  relationshipFor,
  startOfDay,
  endOfDay,
};
