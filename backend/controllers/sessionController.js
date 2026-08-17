const Session = require('../models/Session');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const { paginate, paginateResults } = require('../utils/paginate');
const { assertCanInteract, findRelationship } = require('../services/mentorshipService');
const {
  effectiveStart,
  deriveStatus,
  sessionEndLocal,
  applySessionCompletion,
  relationshipFor,
  startOfDay,
  endOfDay,
} = require('../services/sessionService');

const sessionLabel = async (session, viewerId) => {
  const [mentor, learner] = await Promise.all([
    User.findById(session.mentorId),
    User.findById(session.learnerId),
  ]);
  const isMentor = String(session.mentorId) === String(viewerId);
  const start = effectiveStart(session);
  return {
    ...session.toObject(),
    role: isMentor ? 'mentor' : 'learner',
    status: deriveStatus(session),
    storedStatus: session.status,
    start: start.toISOString(),
    end: sessionEndLocal(session).toISOString(),
    mentor: mentor ? { id: mentor._id, name: mentor.name, avatar: mentor.avatar, rating: mentor.rating } : null,
    learner: learner ? { id: learner._id, name: learner.name, avatar: learner.avatar, rating: learner.rating } : null,
  };
};

// Validate meeting details for the chosen mode.
const validateMeeting = (mode, { meetingType, meetingLink, locationType, location }) => {
  if (mode === 'online') {
    if (!meetingType || !['googleMeet', 'zoom', 'teams', 'custom'].includes(meetingType)) {
      throw new AppError('Please choose an online meeting platform.', 400);
    }
    if (!meetingLink || !/^https?:\/\/.+/i.test(meetingLink)) {
      throw new AppError('A valid meeting link (starting with http) is required for online sessions.', 400);
    }
  } else {
    if (!locationType || !['campus', 'classroom', 'library', 'lab', 'custom'].includes(locationType)) {
      throw new AppError('Please choose an offline location type.', 400);
    }
  }
};

// @route  POST /api/session
// @access private — requires an accepted relationship
const createSession = asyncHandler(async (req, res, next) => {
  const {
    otherUserId,
    topic,
    description = '',
    date,
    startTime = '10:00',
    duration = 60,
    meetingMode = 'online',
    meetingType,
    meetingLink,
    locationType,
    location,
    notes = '',
  } = req.body;

  const relationship = await assertCanInteract(req.user._id, otherUserId);
  validateMeeting(meetingMode, { meetingType, meetingLink, locationType, location });

  const isMentor = relationship.type === 'peer'
    ? String(relationship.userA) === String(req.user._id)
    : String(relationship.userA) === String(req.user._id);
  const session = await Session.create({
    mentorId: isMentor ? req.user._id : otherUserId,
    learnerId: isMentor ? otherUserId : req.user._id,
    matchId: relationship._id,
    topic,
    description,
    notes,
    date: new Date(date),
    startTime,
    duration,
    meetingMode,
    meetingType: meetingMode === 'online' ? meetingType : undefined,
    meetingLink: meetingMode === 'online' ? meetingLink : '',
    link: meetingMode === 'online' ? meetingLink : '',
    locationType: meetingMode === 'offline' ? locationType : undefined,
    location: meetingMode === 'offline' ? (location || '') : '',
  });

  await notify({
    userId: otherUserId,
    type: 'session',
    title: 'Session scheduled ⏳',
    message: `${req.user.name} scheduled "${topic}" for ${new Date(session.date).toLocaleDateString()} at ${startTime}. Please confirm.`,
    data: { sessionId: session._id },
  });

  res.status(201).json({ success: true, session: await sessionLabel(session, req.user._id) });
});

// @route  GET /api/session?status=&page=
// @access private
const getSessions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { $or: [{ mentorId: req.user._id }, { learnerId: req.user._id }] };
  if (req.query.status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const [sessions, total] = await Promise.all([
    Session.find(filter).sort({ date: 1 }).skip(skip).limit(limit),
    Session.countDocuments(filter),
  ]);

  const labeled = [];
  for (const s of sessions) labeled.push(await sessionLabel(s, req.user._id));
  res.json({ success: true, ...paginateResults(labeled, total, page, limit) });
});

// @route  GET /api/session/dashboard
// @access private — grouped session dashboard + progress
const getSessionDashboard = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    $or: [{ mentorId: req.user._id }, { learnerId: req.user._id }],
  }).sort({ date: 1 });

  const labeled = [];
  for (const s of sessions) labeled.push(await sessionLabel(s, req.user._id));

  const now = new Date();
  const upcoming = labeled.filter((s) => s.storedStatus === 'confirmed' && new Date(s.start) > now);
  const pending = labeled.filter((s) => s.storedStatus === 'pending');
  const inProgress = labeled.filter((s) => s.storedStatus === 'confirmed' && s.status === 'in_progress');
  const completed = labeled.filter((s) => s.storedStatus === 'completed');
  const cancelled = labeled.filter((s) => s.storedStatus === 'cancelled');
  const history = [...completed, ...cancelled].sort((a, b) => new Date(b.start) - new Date(a.start));

  upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));
  const nextMeeting = upcoming[0] || null;

  res.json({
    success: true,
    dashboard: {
      upcoming,
      pending,
      inProgress,
      completed,
      cancelled,
      history,
      nextMeeting,
    },
    stats: {
      totalSessions: labeled.length,
      completedCount: completed.length,
      upcomingCount: upcoming.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      sessionsCompleted: req.user.sessionsCompleted || 0,
      hoursLearned: req.user.hoursLearned || 0,
      hoursTaught: req.user.hoursTaught || 0,
      learningStreak: req.user.learningStreak || 0,
      teachingStreak: req.user.teachingStreak || 0,
      learnedSkills: req.user.learnedSkills || [],
    },
  });
});

// @route  GET /api/session/calendar?month=YYYY-MM  (or ?from=&to=)
// @access private
const getSessionCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  let from;
  let to;
  if (req.query.month) {
    const [y, m] = String(req.query.month).split('-').map(Number);
    from = new Date(y, m - 1, 1);
    to = new Date(y, m, 0, 23, 59, 59, 999);
  } else {
    from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
    to = req.query.to ? new Date(req.query.to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const sessions = await Session.find({
    $or: [{ mentorId: req.user._id }, { learnerId: req.user._id }],
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 });

  const labeled = [];
  for (const s of sessions) labeled.push(await sessionLabel(s, req.user._id));

  const byDay = new Map();
  for (const s of labeled) {
    const day = new Date(s.date).toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(s);
  }
  const events = [...byDay.entries()]
    .map(([date, sessionsOnDay]) => ({ date, sessions: sessionsOnDay }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  res.json({ success: true, events });
});

// @route  PUT /api/session/:id  (edit fields while pending/confirmed)
// @access private
const updateSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new AppError('Session not found.', 404);
  assertParticipant(session, req.user._id);
  if (session.status !== 'pending' && session.status !== 'confirmed') {
    throw new AppError('Only pending or confirmed sessions can be edited.', 400);
  }

  const allowed = [
    'topic', 'description', 'date', 'startTime', 'duration',
    'meetingMode', 'meetingType', 'meetingLink', 'locationType', 'location', 'notes',
  ];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  const mode = updates.meetingMode || session.meetingMode;
  validateMeeting(mode, { ...session.toObject(), ...updates });

  if (updates.meetingMode === 'online') {
    updates.locationType = undefined;
    updates.location = '';
  } else if (updates.meetingMode === 'offline') {
    updates.meetingType = undefined;
    updates.meetingLink = '';
    updates.link = '';
  }
  if (updates.meetingLink !== undefined) updates.link = updates.meetingLink;

  Object.assign(session, updates);
  await session.save();

  const otherId = String(session.mentorId) === String(req.user._id) ? session.learnerId : session.mentorId;
  await notify({
    userId: otherId,
    type: 'session',
    title: 'Session updated',
    message: `"${session.topic}" was updated.`,
    data: { sessionId: session._id },
  });

  res.json({ success: true, session: await sessionLabel(session, req.user._id) });
});

// @route  POST /api/session/:id/confirm
// @access private
const confirmSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new AppError('Session not found.', 404);
  assertParticipant(session, req.user._id);
  if (session.status !== 'pending') throw new AppError('This session is already responded to.', 400);

  session.status = 'confirmed';
  session.confirmedAt = new Date();
  await session.save();

  const otherId = String(session.mentorId) === String(req.user._id) ? session.learnerId : session.mentorId;
  await notify({
    userId: otherId,
    type: 'session',
    title: 'Session confirmed ✅',
    message: `${req.user.name} confirmed "${session.topic}". Your chat is open.`,
    data: { sessionId: session._id },
  });

  // Also notify the confirmer
  await notify({
    userId: req.user._id,
    type: 'session',
    title: 'Session confirmed ✅',
    message: `You confirmed "${session.topic}" with ${otherId === session.mentorId ? 'your mentor' : 'your learner'}.`,
    data: { sessionId: session._id },
  });

  res.json({ success: true, session: await sessionLabel(session, req.user._id) });
});

// @route  POST /api/session/:id/cancel
// @access private
const cancelSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new AppError('Session not found.', 404);
  assertParticipant(session, req.user._id);
  if (session.status === 'completed') throw new AppError('Completed sessions cannot be cancelled.', 400);
  if (session.status === 'cancelled') throw new AppError('This session is already cancelled.', 400);

  session.status = 'cancelled';
  session.cancelledAt = new Date();
  session.cancelledBy = req.user._id;
  await session.save();

  const otherId = String(session.mentorId) === String(req.user._id) ? session.learnerId : session.mentorId;
  await notify({
    userId: otherId,
    type: 'session',
    title: 'Session cancelled',
    message: `${req.user.name} cancelled "${session.topic}".`,
    data: { sessionId: session._id },
  });

  res.json({ success: true, session: await sessionLabel(session, req.user._id) });
});

// @route  POST /api/session/:id/complete  { rating?, feedback?, recommendAnother? }
// @access private
const completeSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new AppError('Session not found.', 404);
  assertParticipant(session, req.user._id);
  if (session.status !== 'confirmed') throw new AppError('Only confirmed sessions can be completed.', 400);

  const { rating, feedback = '', recommendAnother = false } = req.body;
  const isLearner = String(session.learnerId) === String(req.user._id);

  session.status = 'completed';
  session.completedAt = new Date();
  session.rating = rating !== undefined ? rating : session.rating;
  session.feedback = feedback || session.feedback;
  session.recommendAnother = recommendAnother !== undefined ? recommendAnother : session.recommendAnother;
  await session.save();

  const mentor = await User.findById(session.mentorId);
  const learner = await User.findById(session.learnerId);

  // Create a review when the learner rates the session.
  if (isLearner && rating && mentor) {
    const review = await Review.create({
      mentor: mentor._id,
      learner: req.user._id,
      rating,
      feedback: feedback || '',
      sessionId: session._id,
    });
    const agg = await Review.aggregate([
      { $match: { mentor: mentor._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const stats = agg[0] || { avg: rating, count: 1 };
    await User.findByIdAndUpdate(mentor._id, {
      rating: Math.round(stats.avg * 10) / 10,
      reviewCount: stats.count,
    });
  }

  // Progress + badges + trust for both participants.
  if (learner) await applySessionCompletion(learner, session);
  if (mentor) await applySessionCompletion(mentor, session);
  await evaluateBadges(session.mentorId);
  await evaluateBadges(session.learnerId);
  queueTrustRefresh(session.mentorId);
  queueTrustRefresh(session.learnerId);

  // Generate AI next-steps suggestion
  let nextSteps = [];
  try {
    const { suggestNext } = require('../services/nextStepsService');
    const result = suggestNext(session.topic, learner?.careerGoal || '');
    nextSteps = result.next || [];
  } catch {
    nextSteps = [];
  }

  const otherId = String(session.mentorId) === String(req.user._id) ? session.learnerId : session.mentorId;
  await notify({
    userId: otherId,
    type: 'session',
    title: 'Session completed 🎉',
    message: `"${session.topic}" was completed${isLearner && rating ? ` and rated ${rating}/5.` : '.'}`,
    data: { sessionId: session._id },
  });

  // Notify the completer too
  await notify({
    userId: req.user._id,
    type: 'session',
    title: 'Session completed 🎉',
    message: `You completed "${session.topic}".${isLearner && rating ? ` Rated ${rating}/5.` : ''}`,
    data: { sessionId: session._id },
  });

  res.json({
    success: true,
    session: await sessionLabel(session, req.user._id),
    progress: {
      sessionsCompleted: learner?.sessionsCompleted,
      hoursLearned: learner?.hoursLearned,
      hoursTaught: mentor?.hoursTaught,
      learningStreak: learner?.learningStreak,
      teachingStreak: mentor?.teachingStreak,
    },
    nextSteps,
  });
});

const assertParticipant = (session, userId) => {
  const isParticipant =
    String(session.mentorId) === String(userId) || String(session.learnerId) === String(userId);
  if (!isParticipant) throw new AppError('Not your session.', 403);
};

module.exports = {
  createSession,
  getSessions,
  getSessionDashboard,
  getSessionCalendar,
  updateSession,
  confirmSession,
  cancelSession,
  completeSession,
};
