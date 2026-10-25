const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const { paginate, paginateResults } = require('../utils/paginate');
const { assertCanInteract } = require('../services/mentorshipService');
const { effectiveStart, deriveStatus, sessionEndLocal, applySessionCompletion } = require('../services/sessionService');

const currentUserId = (user) => String(user.id || user._id);
const participant = (session, id) => {
  if (session.mentorId !== String(id) && session.learnerId !== String(id)) throw new AppError('Not your session.', 403);
};
const sessionLabel = (session, viewerId) => ({
  ...session,
  _id: session.id,
  role: session.mentorId === String(viewerId) ? 'mentor' : 'learner',
  storedStatus: session.status,
  status: deriveStatus(session),
  start: effectiveStart(session).toISOString(),
  end: sessionEndLocal(session).toISOString(),
  mentor: session.mentor ? { id: session.mentor.id, _id: session.mentor.id, name: session.mentor.name, avatar: session.mentor.avatar, rating: session.mentor.rating } : null,
  learner: session.learner ? { id: session.learner.id, _id: session.learner.id, name: session.learner.name, avatar: session.learner.avatar, rating: session.learner.rating } : null,
});
const sessionInclude = { mentor: { select: { id: true, name: true, avatar: true, rating: true } }, learner: { select: { id: true, name: true, avatar: true, rating: true } } };
const validateMeeting = (mode, { meetingType, meetingLink, locationType }) => {
  if (mode === 'online') {
    if (!['googleMeet', 'zoom', 'teams', 'custom'].includes(meetingType)) throw new AppError('Please choose an online meeting platform.', 400);
    if (!/^https?:\/\/.+/i.test(meetingLink || '')) throw new AppError('A valid meeting link (starting with http) is required for online sessions.', 400);
  } else if (!['campus', 'classroom', 'library', 'lab', 'custom'].includes(locationType)) {
    throw new AppError('Please choose an offline location type.', 400);
  }
};

const createSession = asyncHandler(async (req, res) => {
  const { otherUserId, topic, description = '', date, startTime = '10:00', duration = 60, meetingMode = 'online', meetingType, meetingLink, locationType, location, notes = '' } = req.body;
  const actorId = currentUserId(req.user);
  const relationship = await assertCanInteract(actorId, otherUserId);
  validateMeeting(meetingMode, { meetingType, meetingLink, locationType });
  const actorIsA = relationship.userAId === actorId;
  const session = await prisma.session.create({
    data: {
      mentorId: actorIsA ? actorId : otherUserId,
      learnerId: actorIsA ? otherUserId : actorId,
      matchId: relationship.id,
      topic, description, notes, date: new Date(date), startTime, duration, meetingMode,
      meetingType: meetingMode === 'online' ? meetingType : 'googleMeet',
      meetingLink: meetingMode === 'online' ? meetingLink : '',
      link: meetingMode === 'online' ? meetingLink : '',
      locationType: meetingMode === 'offline' ? locationType : 'campus',
      location: meetingMode === 'offline' ? (location || '') : '',
    }, include: sessionInclude,
  });
  await notify({ userId: otherUserId, type: 'session_booked', title: 'Session scheduled ⏳', message: `${req.user.name} scheduled "${topic}" for ${new Date(date).toLocaleDateString()} at ${startTime}. Please confirm.`, data: { sessionId: session.id } });
  res.status(201).json({ success: true, session: sessionLabel(session, actorId) });
});

const getSessions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const actorId = currentUserId(req.user);
  const where = { OR: [{ mentorId: actorId }, { learnerId: actorId }] };
  if (['pending', 'confirmed', 'completed', 'cancelled'].includes(req.query.status)) where.status = req.query.status;
  if (['online', 'offline'].includes(req.query.meetingMode)) where.meetingMode = req.query.meetingMode;
  if (req.query.role === 'mentor') { delete where.OR; where.mentorId = actorId; }
  if (req.query.role === 'learner') { delete where.OR; where.learnerId = actorId; }
  if (req.query.search) where.topic = { contains: String(req.query.search).trim().slice(0, 100), mode: 'insensitive' };
  if (req.query.dateFrom || req.query.dateTo) where.date = { ...(req.query.dateFrom ? { gte: new Date(req.query.dateFrom) } : {}), ...(req.query.dateTo ? { lte: new Date(req.query.dateTo) } : {}) };
  const [sessions, total] = await Promise.all([
    prisma.session.findMany({ where, include: sessionInclude, orderBy: { date: req.query.sort === 'date_asc' ? 'asc' : 'desc' }, skip, take: limit }),
    prisma.session.count({ where }),
  ]);
  res.json({ success: true, ...paginateResults(sessions.map((session) => sessionLabel(session, actorId)), total, page, limit) });
});

const getSessionDashboard = asyncHandler(async (req, res) => {
  const actorId = currentUserId(req.user);
  const sessions = await prisma.session.findMany({ where: { OR: [{ mentorId: actorId }, { learnerId: actorId }] }, include: sessionInclude, orderBy: { date: 'asc' } });
  const labeled = sessions.map((session) => sessionLabel(session, actorId));
  const now = new Date();
  const upcoming = labeled.filter((session) => session.storedStatus === 'confirmed' && new Date(session.start) > now);
  const pending = labeled.filter((session) => session.storedStatus === 'pending');
  const inProgress = labeled.filter((session) => session.storedStatus === 'confirmed' && session.status === 'in_progress');
  const completed = labeled.filter((session) => session.storedStatus === 'completed');
  const cancelled = labeled.filter((session) => session.storedStatus === 'cancelled');
  const history = [...completed, ...cancelled].sort((a, b) => new Date(b.start) - new Date(a.start));
  upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));
  res.json({ success: true, dashboard: { upcoming, pending, inProgress, completed, cancelled, history, nextMeeting: upcoming[0] || null }, stats: {
    totalSessions: labeled.length, completedCount: completed.length, upcomingCount: upcoming.length, pendingCount: pending.length, cancelledCount: cancelled.length,
    sessionsCompleted: req.user.sessionsCompleted || 0, hoursLearned: req.user.hoursLearned || 0, hoursTaught: req.user.hoursTaught || 0,
    learningStreak: req.user.learningStreak || 0, teachingStreak: req.user.teachingStreak || 0, learnedSkills: req.user.learnedSkills || [],
  } });
});

const getSessionCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  let from, to;
  if (req.query.month) {
    const [year, month] = String(req.query.month).split('-').map(Number);
    from = new Date(year, month - 1, 1);
    to = new Date(year, month, 0, 23, 59, 59, 999);
  } else {
    from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
    to = req.query.to ? new Date(req.query.to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new AppError('Invalid calendar date range.', 400);
  const actorId = currentUserId(req.user);
  const sessions = await prisma.session.findMany({ where: { OR: [{ mentorId: actorId }, { learnerId: actorId }], date: { gte: from, lte: to } }, include: sessionInclude, orderBy: { date: 'asc' } });
  const byDay = new Map();
  for (const session of sessions.map((item) => sessionLabel(item, actorId))) {
    const day = new Date(session.date).toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(session);
  }
  res.json({ success: true, events: [...byDay].map(([date, sessionsOnDay]) => ({ date, sessions: sessionsOnDay })) });
});

const getParticipantSession = async (id, actorId) => {
  const session = await prisma.session.findUnique({ where: { id }, include: sessionInclude });
  if (!session) throw new AppError('Session not found.', 404);
  participant(session, actorId);
  return session;
};

const updateSession = asyncHandler(async (req, res) => {
  const actorId = currentUserId(req.user);
  const session = await getParticipantSession(req.params.id, actorId);
  if (!['pending', 'confirmed'].includes(session.status)) throw new AppError('Only pending or confirmed sessions can be edited.', 400);
  const fields = ['topic', 'description', 'date', 'startTime', 'duration', 'meetingMode', 'meetingType', 'meetingLink', 'locationType', 'location', 'notes'];
  const data = {};
  for (const field of fields) if (req.body[field] !== undefined) data[field] = req.body[field];
  const mode = data.meetingMode || session.meetingMode;
  const meeting = { ...session, ...data };
  validateMeeting(mode, meeting);
  if (data.date) data.date = new Date(data.date);
  if (mode === 'online') { data.locationType = 'campus'; data.location = ''; }
  else { data.meetingType = 'googleMeet'; data.meetingLink = ''; data.link = ''; }
  if (data.meetingLink !== undefined) data.link = data.meetingLink;
  const result = await prisma.session.updateMany({ where: { id: session.id, status: session.status }, data });
  if (!result.count) throw new AppError('Session changed before this update could be saved. Refresh and try again.', 409);
  const updated = await prisma.session.findUnique({ where: { id: session.id }, include: sessionInclude });
  const otherId = session.mentorId === actorId ? session.learnerId : session.mentorId;
  await notify({ userId: otherId, type: 'system', title: 'Session updated', message: `"${updated.topic}" was updated.`, data: { sessionId: session.id } });
  res.json({ success: true, session: sessionLabel(updated, actorId) });
});

const confirmSession = asyncHandler(async (req, res) => {
  const actorId = currentUserId(req.user);
  const session = await getParticipantSession(req.params.id, actorId);
  if (session.status !== 'pending') throw new AppError('This session is already responded to.', 400);
  const result = await prisma.session.updateMany({ where: { id: session.id, status: 'pending' }, data: { status: 'confirmed', confirmedAt: new Date() } });
  if (!result.count) throw new AppError('Session changed before this update could be saved.', 409);
  const updated = await prisma.session.findUnique({ where: { id: session.id }, include: sessionInclude });
  const otherId = session.mentorId === actorId ? session.learnerId : session.mentorId;
  await notify({ userId: otherId, type: 'session_confirmed', title: 'Session confirmed ✅', message: `${req.user.name} confirmed "${session.topic}". Your chat is open.`, data: { sessionId: session.id } });
  await notify({ userId: actorId, type: 'session_confirmed', title: 'Session confirmed ✅', message: `You confirmed "${session.topic}".`, data: { sessionId: session.id } });
  res.json({ success: true, session: sessionLabel(updated, actorId) });
});

const cancelSession = asyncHandler(async (req, res) => {
  const actorId = currentUserId(req.user);
  const session = await getParticipantSession(req.params.id, actorId);
  if (session.status === 'completed') throw new AppError('Completed sessions cannot be cancelled.', 400);
  if (session.status === 'cancelled') throw new AppError('This session is already cancelled.', 400);
  const result = await prisma.session.updateMany({ where: { id: session.id, status: session.status }, data: { status: 'cancelled', cancelledAt: new Date(), cancelledById: actorId } });
  if (!result.count) throw new AppError('Session changed before this update could be saved.', 409);
  const updated = await prisma.session.findUnique({ where: { id: session.id }, include: sessionInclude });
  const otherId = session.mentorId === actorId ? session.learnerId : session.mentorId;
  await notify({ userId: otherId, type: 'session_cancelled', title: 'Session cancelled', message: `${req.user.name} cancelled "${session.topic}".`, data: { sessionId: session.id } });
  res.json({ success: true, session: sessionLabel(updated, actorId) });
});

const completeSession = asyncHandler(async (req, res) => {
  const actorId = currentUserId(req.user);
  const session = await getParticipantSession(req.params.id, actorId);
  if (session.status !== 'confirmed') throw new AppError('Only confirmed sessions can be completed.', 400);
  const { rating, feedback = '', recommendAnother = false } = req.body;
  const isLearner = session.learnerId === actorId;
  const completedAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.session.updateMany({ where: { id: session.id, status: 'confirmed' }, data: { status: 'completed', completedAt, ...(rating !== undefined ? { rating } : {}), feedback: feedback || session.feedback, recommendAnother } });
    if (!changed.count) throw new AppError('Session changed before this update could be saved.', 409);
    if (isLearner && rating) {
      await tx.review.upsert({ where: { mentorId_learnerId_sessionId: { mentorId: session.mentorId, learnerId: session.learnerId, sessionId: session.id } }, create: { mentorId: session.mentorId, learnerId: session.learnerId, sessionId: session.id, rating, feedback }, update: { rating, feedback } });
      const stats = await tx.review.aggregate({ where: { mentorId: session.mentorId }, _avg: { rating: true }, _count: { _all: true } });
      await tx.user.update({ where: { id: session.mentorId }, data: { rating: Math.round((stats._avg.rating || rating) * 10) / 10, reviewCount: stats._count._all } });
    }
    const learner = await tx.user.findUnique({ where: { id: session.learnerId } });
    const mentor = await tx.user.findUnique({ where: { id: session.mentorId } });
    const updatedSession = { ...session, status: 'completed', completedAt, rating: rating ?? session.rating, feedback: feedback || session.feedback, recommendAnother };
    if (learner) await applySessionCompletion(learner, updatedSession, tx);
    if (mentor) await applySessionCompletion(mentor, updatedSession, tx);
    return { learner: learner && await tx.user.findUnique({ where: { id: learner.id } }), mentor: mentor && await tx.user.findUnique({ where: { id: mentor.id } }) };
  });
  await Promise.all([evaluateBadges(session.mentorId), evaluateBadges(session.learnerId)]);
  queueTrustRefresh(session.mentorId); queueTrustRefresh(session.learnerId);
  let nextSteps = [];
  try { nextSteps = require('../services/nextStepsService').suggestNext(session.topic, updated.learner?.careerGoal || '').next || []; } catch {}
  const otherId = session.mentorId === actorId ? session.learnerId : session.mentorId;
  await notify({ userId: otherId, type: 'session_completed', title: 'Session completed 🎉', message: `"${session.topic}" was completed${isLearner && rating ? ` and rated ${rating}/5.` : '.'}`, data: { sessionId: session.id } });
  await notify({ userId: actorId, type: 'session_completed', title: 'Session completed 🎉', message: `You completed "${session.topic}".`, data: { sessionId: session.id } });
  const finalSession = await prisma.session.findUnique({ where: { id: session.id }, include: sessionInclude });
  res.json({ success: true, session: sessionLabel(finalSession, actorId), progress: { sessionsCompleted: updated.learner?.sessionsCompleted, hoursLearned: updated.learner?.hoursLearned, hoursTaught: updated.mentor?.hoursTaught, learningStreak: updated.learner?.learningStreak, teachingStreak: updated.mentor?.teachingStreak }, nextSteps });
});

module.exports = { createSession, getSessions, getSessionDashboard, getSessionCalendar, updateSession, confirmSession, cancelSession, completeSession };
