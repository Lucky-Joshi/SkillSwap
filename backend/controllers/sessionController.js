const Session = require('../models/Session');
const Match = require('../models/Match');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const { paginate, paginateResults } = require('../utils/paginate');

const sessionLabel = async (session, viewerId) => {
  const [mentor, learner] = await Promise.all([
    User.findById(session.mentorId),
    User.findById(session.learnerId),
  ]);
  const isMentor = String(session.mentorId) === String(viewerId);
  return {
    ...session.toObject(),
    role: isMentor ? 'mentor' : 'learner',
    mentor: mentor ? { id: mentor._id, name: mentor.name, avatar: mentor.avatar, rating: mentor.rating } : null,
    learner: learner ? { id: learner._id, name: learner.name, avatar: learner.avatar, rating: learner.rating } : null,
  };
};

// @route  POST /api/session
// @access private
const createSession = asyncHandler(async (req, res, next) => {
  const { otherUserId, topic, date, duration, notes, link, matchId } = req.body;

  const other = await User.findById(otherUserId);
  if (!other) throw new AppError('User not found.', 404);

  const [mentorId, learnerId] =
    req.body.mentorId === String(req.user._id) || !req.body.mentorId
      ? [req.user._id, other._id]
      : [other._id, req.user._id];

  const session = await Session.create({
    mentorId,
    learnerId,
    matchId,
    topic,
    date: new Date(date),
    duration: duration || 60,
    notes: notes || '',
    link: link || '',
  });

  await notify({
    userId: other._id,
    type: 'session',
    title: 'New session scheduled',
    message: `${req.user.name} scheduled a session: "${topic}" on ${new Date(date).toLocaleString()}.`,
    data: { sessionId: session._id },
  });

  res.status(201).json({ success: true, session: await sessionLabel(session, req.user._id) });
});

// @route  GET /api/session?status=&page=
// @access private
const getSessions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { $or: [{ mentorId: req.user._id }, { learnerId: req.user._id }] };
  if (req.query.status) filter.status = req.query.status;

  const [sessions, total] = await Promise.all([
    Session.find(filter).sort({ date: 1 }).skip(skip).limit(limit),
    Session.countDocuments(filter),
  ]);

  const labeled = [];
  for (const s of sessions) labeled.push(await sessionLabel(s, req.user._id));
  res.json({ success: true, ...paginateResults(labeled, total, page, limit) });
});

// @route  PUT /api/session/:id
// @access private
const updateSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new AppError('Session not found.', 404);

  const isParticipant =
    String(session.mentorId) === String(req.user._id) || String(session.learnerId) === String(req.user._id);
  if (!isParticipant) throw new AppError('Not your session.', 403);

  const { topic, date, duration, notes, link, status } = req.body;
  if (topic !== undefined) session.topic = topic;
  if (date !== undefined) session.date = date;
  if (duration !== undefined) session.duration = duration;
  if (notes !== undefined) session.notes = notes;
  if (link !== undefined) session.link = link;
  if (status !== undefined) session.status = status;
  if (status === 'completed') session.completedAt = new Date();

  await session.save();

  if (status === 'completed') {
    const otherId = String(session.mentorId) === String(req.user._id) ? session.learnerId : session.mentorId;
    await notify({
      userId: otherId,
      type: 'session',
      title: 'Session completed 🎉',
      message: `"${session.topic}" was marked complete. Don't forget to leave a review.`,
      data: { sessionId: session._id },
    });
    await evaluateBadges(req.user._id);
    await evaluateBadges(otherId);
    queueTrustRefresh(req.user._id);
    queueTrustRefresh(otherId);
    await Match.updateOne(
      { $or: [{ mentorId: session.mentorId, learnerId: session.learnerId }, { mentorId: session.learnerId, learnerId: session.mentorId }] },
      { status: 'completed' }
    );
  }

  res.json({ success: true, session: await sessionLabel(session, req.user._id) });
});

module.exports = { createSession, getSessions, updateSession };
