const prisma = require('../lib/prisma');

const effectiveStart = (session) => {
  const date = new Date(session.date);
  const [hours = 10, minutes = 0] = String(session.startTime || '10:00').split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};
const endOfDay = (date) => { const end = new Date(date); end.setHours(23, 59, 59, 999); return end; };
const startOfDay = (date) => { const start = new Date(date); start.setHours(0, 0, 0, 0); return start; };
const deriveStatus = (session, now = new Date()) => {
  if (session.status !== 'confirmed') return session.status;
  const start = effectiveStart(session);
  const end = new Date(start.getTime() + (session.duration || 60) * 60000);
  return now >= start && now <= end ? 'in_progress' : 'upcoming';
};
const sessionEndLocal = (session) => new Date(effectiveStart(session).getTime() + (session.duration || 60) * 60000);
const isSameLocalDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const isYesterdayLocal = (a, b) => { const y = new Date(b); y.setDate(y.getDate() - 1); return isSameLocalDay(a, y); };
const updateStreak = (previous, lastDate, today = new Date()) => {
  if (!lastDate) return 1;
  if (isSameLocalDay(lastDate, today)) return previous || 1;
  if (isYesterdayLocal(lastDate, today)) return (previous || 0) + 1;
  return 1;
};

const applySessionCompletion = async (user, session, client = prisma) => {
  const userId = user.id || user._id;
  const isMentor = String(session.mentorId) === String(userId);
  const durationHours = (session.duration || 60) / 60;
  const today = new Date();
  const data = { lastSessionDate: today };
  if (isMentor) {
    data.hoursTaught = { increment: durationHours };
    data.teachingStreak = updateStreak(user.teachingStreak, user.lastSessionDate, today);
  } else {
    data.sessionsCompleted = { increment: 1 };
    data.hoursLearned = { increment: durationHours };
    data.learningStreak = updateStreak(user.learningStreak, user.lastSessionDate, today);
    if (session.topic && !user.learnedSkills.includes(session.topic)) data.learnedSkills = { push: session.topic };
  }
  return client.user.update({ where: { id: String(userId) }, data });
};

const relationshipFor = (session) => prisma.connection.findFirst({
  where: {
    OR: [
      { userAId: session.mentorId, userBId: session.learnerId },
      { userAId: session.learnerId, userBId: session.mentorId },
    ],
    status: 'accepted', active: true,
  },
});

module.exports = { effectiveStart, deriveStatus, sessionEndLocal, isSameLocalDay, isYesterdayLocal, applySessionCompletion, relationshipFor, startOfDay, endOfDay };
