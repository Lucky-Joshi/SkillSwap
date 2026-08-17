const Connection = require('../models/Connection');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const { paginate, paginateResults } = require('../utils/paginate');
const { relationshipLabel, listConnections, cancelRelationship } = require('../services/mentorshipService');

const connectionLabel = async (conn, viewerId) => {
  return relationshipLabel(conn, viewerId);
};

// @route  POST /api/match/request { userId, mode, type? }
// @access private
const requestMatch = asyncHandler(async (req, res, next) => {
  const { userId, mode, type = 'mentorship' } = req.body;
  const target = await User.findById(userId);
  if (!target) throw new AppError('User not found.', 404);
  if (String(target._id) === String(req.user._id)) {
    throw new AppError('You cannot request a connection with yourself.', 400);
  }

  // For mentorship: userA = mentor, userB = learner
  // For peer: userA = requester, userB = target (symmetric)
  let userA, userB;
  if (type === 'peer') {
    userA = req.user._id;
    userB = target._id;
  } else {
    // Mentorship: requester is learner if mode='mentors', mentor if mode='learners'
    const isRequesterLearner = mode === 'mentors';
    userA = isRequesterLearner ? target._id : req.user._id;
    userB = isRequesterLearner ? req.user._id : target._id;
  }

  const existing = await Connection.findOne({
    $or: [
      { userA: req.user._id, userB: target._id },
      { userA: target._id, userB: req.user._id },
    ],
  });
  if (existing) {
    if (existing.status === 'pending' || existing.status === 'accepted') {
      throw new AppError('A connection with this user already exists.', 409);
    }
    await existing.deleteOne();
  }

  const conn = await Connection.create({
    userA,
    userB,
    type,
    requestedBy: req.user._id,
    compatibilityScore: req.body.compatibilityScore || 0,
    skills: req.body.skills || [],
    skillAteaches: req.body.skillAteaches || '',
    skillBteaches: req.body.skillBteaches || '',
  });

  const typeLabel = type === 'peer' ? 'Peer learning' : 'Mentorship';
  await notify({
    userId: target._id,
    type: 'mentorship',
    title: `${typeLabel} request`,
    message: `${req.user.name} wants to ${type === 'peer' ? 'learn from each other' : 'connect with you'}.`,
    data: { matchId: conn._id },
  });

  res.status(201).json({ success: true, match: await connectionLabel(conn, req.user._id) });
});

// @route  POST /api/match/accept { matchId }
// @access private
const acceptMatch = asyncHandler(async (req, res, next) => {
  const conn = await Connection.findById(req.body.matchId);
  if (!conn) throw new AppError('Connection not found.', 404);

  const isParticipant =
    String(conn.userA) === String(req.user._id) || String(conn.userB) === String(req.user._id);
  if (!isParticipant) throw new AppError('You are not part of this connection.', 403);
  if (conn.status !== 'pending') throw new AppError('This connection is already responded to.', 400);

  conn.status = 'accepted';
  conn.active = true;
  conn.respondedAt = new Date();
  conn.acceptedAt = new Date();
  await conn.save();

  const otherId = String(conn.userA) === String(req.user._id) ? conn.userB : conn.userA;
  const typeLabel = conn.type === 'peer' ? 'Peer learning' : 'Mentorship';

  await notify({
    userId: otherId,
    type: 'mentorship',
    title: `${typeLabel} accepted`,
    message: `${req.user.name} accepted your request. Schedule your first session to unlock chat.`,
    data: { matchId: conn._id },
  });
  await evaluateBadges(req.user._id);
  await evaluateBadges(otherId);
  queueTrustRefresh(req.user._id);
  queueTrustRefresh(otherId);

  res.json({ success: true, match: await connectionLabel(conn, req.user._id) });
});

// @route  POST /api/match/reject { matchId }
// @access private
const rejectMatch = asyncHandler(async (req, res, next) => {
  const conn = await Connection.findById(req.body.matchId);
  if (!conn) throw new AppError('Connection not found.', 404);

  const isParticipant =
    String(conn.userA) === String(req.user._id) || String(conn.userB) === String(req.user._id);
  if (!isParticipant) throw new AppError('You are not part of this connection.', 403);
  if (conn.status !== 'pending') throw new AppError('This connection is already responded to.', 400);

  conn.status = 'rejected';
  conn.active = false;
  conn.respondedAt = new Date();
  await conn.save();

  res.json({ success: true, match: await connectionLabel(conn, req.user._id) });
});

// @route  POST /api/match/cancel { matchId }
// @access private
const cancelMatch = asyncHandler(async (req, res, next) => {
  const conn = await cancelRelationship(req.body.matchId, req.user._id);
  const otherId = String(conn.userA) === String(req.user._id) ? conn.userB : conn.userA;
  const typeLabel = conn.type === 'peer' ? 'Peer learning' : 'Mentorship';
  await notify({
    userId: otherId,
    type: 'mentorship',
    title: `${typeLabel} ended`,
    message: `${req.user.name} ended this ${typeLabel.toLowerCase()} relationship.`,
    data: { matchId: conn._id },
  });
  res.json({ success: true, match: await connectionLabel(conn, req.user._id) });
});

// @route  GET /api/match/relationships  → { mentors, learners, peers }
// @access private
const getRelationships = asyncHandler(async (req, res) => {
  const { mentors, learners, peers } = await listConnections(req.user._id);
  res.json({ success: true, mentors, learners, peers });
});

// @route  GET /api/match/history?status=&page=&type=
// @access private
const getMatchHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = {
    $or: [{ userA: req.user._id }, { userB: req.user._id }],
  };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const [connections, total] = await Promise.all([
    Connection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Connection.countDocuments(filter),
  ]);

  const labeled = [];
  for (const c of connections) labeled.push(await connectionLabel(c, req.user._id));

  res.json({ success: true, ...paginateResults(labeled, total, page, limit) });
});

// @route  GET /api/match/requests (pending only)
// @access private
const getPendingRequests = asyncHandler(async (req, res) => {
  const connections = await Connection.find({
    $or: [{ userA: req.user._id }, { userB: req.user._id }],
    status: 'pending',
  }).sort({ createdAt: -1 });

  const labeled = [];
  for (const c of connections) labeled.push(await connectionLabel(c, req.user._id));
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
