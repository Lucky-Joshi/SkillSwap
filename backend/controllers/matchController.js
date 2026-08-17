const Match = require('../models/Match');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const { paginate, paginateResults } = require('../utils/paginate');
const { relationshipLabel, listMentorships, cancelRelationship } = require('../services/mentorshipService');

const matchLabel = async (match, viewerId) => {
  const [mentor, learner] = await Promise.all([
    User.findById(match.mentorId),
    User.findById(match.learnerId),
  ]);
  const other = String(match.mentorId) === String(viewerId) ? learner : mentor;
  const isMentor = String(match.mentorId) === String(viewerId);

  return {
    id: match._id,
    status: match.status,
    active: match.active,
    acceptedAt: match.acceptedAt,
    compatibilityScore: match.compatibilityScore,
    requestedBy: match.requestedBy,
    createdAt: match.createdAt,
    respondedAt: match.respondedAt,
    skills: match.skills,
    role: isMentor ? 'mentor' : 'learner',
    otherUser: other
      ? {
          id: other._id,
          name: other.name,
          email: other.email,
          avatar: other.avatar,
          college: other.college,
          department: other.department,
          year: other.year,
          rating: other.rating,
          bio: other.bio,
        }
      : null,
  };
};

// @route  POST /api/match/request { userId, mode }
// @access private
const requestMatch = asyncHandler(async (req, res, next) => {
  const { userId, mode } = req.body;
  const target = await User.findById(userId);
  if (!target) throw new AppError('User not found.', 404);
  if (String(target._id) === String(req.user._id)) {
    throw new AppError('You cannot request a match with yourself.', 400);
  }

  const requestedBy = mode === 'mentors' ? 'learner' : 'mentor';
  const existing = await Match.findOne({
    $or: [
      { mentorId: req.user._id, learnerId: target._id },
      { mentorId: target._id, learnerId: req.user._id },
    ],
  });
  if (existing) {
    if (existing.status === 'pending' || existing.status === 'accepted') {
      throw new AppError('A request with this user already exists.', 409);
    }
    await existing.deleteOne();
  }

  const [mentorId, learnerId] =
    requestedBy === 'learner' ? [target._id, req.user._id] : [req.user._id, target._id];

  const match = await Match.create({
    mentorId,
    learnerId,
    requestedBy,
    compatibilityScore: req.body.compatibilityScore || 0,
    skills: req.body.skills || [],
  });

  await notify({
    userId: target._id,
    type: 'mentorship',
    title: 'Mentorship request',
    message: `${req.user.name} has requested you as a mentor.`,
    data: { matchId: match._id },
  });

  res.status(201).json({ success: true, match: await matchLabel(match, req.user._id) });
});

// @route  POST /api/match/accept { matchId }
// @access private
const acceptMatch = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.body.matchId);
  if (!match) throw new AppError('Match not found.', 404);

  const isParticipant =
    String(match.mentorId) === String(req.user._id) || String(match.learnerId) === String(req.user._id);
  if (!isParticipant) throw new AppError('You are not part of this match.', 403);
  if (match.status !== 'pending') throw new AppError('This match is already responded to.', 400);

  match.status = 'accepted';
  match.active = true;
  match.respondedAt = new Date();
  match.acceptedAt = new Date();
  await match.save();

  const otherId = String(match.mentorId) === String(req.user._id) ? match.learnerId : match.mentorId;
  const isRequester = String(match.requestedBy) === 'learner' ? otherId : match.mentorId;

  await notify({
    userId: otherId,
    type: 'mentorship',
    title: 'Mentorship accepted 🎉',
    message: `${req.user.name} accepted your request. Schedule your first session to unlock chat.`,
    data: { matchId: match._id },
  });
  await evaluateBadges(req.user._id);
  await evaluateBadges(otherId);
  queueTrustRefresh(req.user._id);
  queueTrustRefresh(otherId);

  res.json({ success: true, match: await matchLabel(match, req.user._id) });
});

// @route  POST /api/match/reject { matchId }
// @access private
const rejectMatch = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.body.matchId);
  if (!match) throw new AppError('Match not found.', 404);

  const isParticipant =
    String(match.mentorId) === String(req.user._id) || String(match.learnerId) === String(req.user._id);
  if (!isParticipant) throw new AppError('You are not part of this match.', 403);
  if (match.status !== 'pending') throw new AppError('This match is already responded to.', 400);

  match.status = 'rejected';
  match.active = false;
  match.respondedAt = new Date();
  await match.save();

  res.json({ success: true, match: await matchLabel(match, req.user._id) });
});

// @route  POST /api/match/cancel { matchId }
// @access private
const cancelMatch = asyncHandler(async (req, res, next) => {
  const match = await cancelRelationship(req.body.matchId, req.user._id);
  const otherId = String(match.mentorId) === String(req.user._id) ? match.learnerId : match.mentorId;
  await notify({
    userId: otherId,
    type: 'mentorship',
    title: 'Mentorship ended',
    message: `${req.user.name} ended this mentorship relationship.`,
    data: { matchId: match._id },
  });
  res.json({ success: true, match: await matchLabel(match, req.user._id) });
});

// @route  GET /api/match/relationships  → { mentors, learners }
// @access private
const getRelationships = asyncHandler(async (req, res) => {
  const { mentors, learners } = await listMentorships(req.user._id);
  res.json({ success: true, mentors, learners });
});

// @route  GET /api/match/history?status=&page=
// @access private
const getMatchHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = {
    $or: [{ mentorId: req.user._id }, { learnerId: req.user._id }],
  };
  if (req.query.status) filter.status = req.query.status;

  const [matches, total] = await Promise.all([
    Match.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Match.countDocuments(filter),
  ]);

  const labeled = [];
  for (const m of matches) labeled.push(await matchLabel(m, req.user._id));

  res.json({ success: true, ...paginateResults(labeled, total, page, limit) });
});

// @route  GET /api/match/requests (pending only)
// @access private
const getPendingRequests = asyncHandler(async (req, res) => {
  const matches = await Match.find({
    $or: [{ mentorId: req.user._id }, { learnerId: req.user._id }],
    status: 'pending',
  }).sort({ createdAt: -1 });

  const labeled = [];
  for (const m of matches) labeled.push(await matchLabel(m, req.user._id));
  res.json({ success: true, data: labeled });
});

module.exports = {
  requestMatch,
  acceptMatch,
  rejectMatch,
  cancelMatch,
  getRelationships,
  getMatchHistory,
  getPendingRequests,
};
