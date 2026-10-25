const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const { paginate, paginateResults } = require('../utils/paginate');
const { relationshipLabel, listConnections, cancelRelationship } = require('../services/mentorshipService');

const connectionLabel = (connection, viewerId) => relationshipLabel(connection, viewerId);
const getConnection = (id) => prisma.connection.findUnique({ where: { id } });
const assertParticipant = (connection, userId) => {
  if (connection.userAId !== userId && connection.userBId !== userId) throw new AppError('You are not part of this connection.', 403);
};

const requestMatch = asyncHandler(async (req, res) => {
  const { userId, mode, type = 'mentorship' } = req.body;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || ['suspended', 'deleted', 'banned'].includes(target.status) || ['admin', 'super_admin'].includes(target.role)) throw new AppError('User not found.', 404);
  if (target.profileVisibility === 'private') throw new AppError('This profile is private.', 403);
  if (target.id === req.user.id) throw new AppError('You cannot request a connection with yourself.', 400);
  const [userAId, userBId] = type === 'peer'
    ? [req.user.id, target.id]
    : mode === 'mentors' ? [target.id, req.user.id] : [req.user.id, target.id];
  const existing = await prisma.connection.findFirst({
    where: { OR: [{ userAId: req.user.id, userBId: target.id }, { userAId: target.id, userBId: req.user.id }] },
  });
  if (existing?.status === 'pending' || existing?.status === 'accepted') throw new AppError('A connection with this user already exists.', 409);
  if (existing) await prisma.connection.delete({ where: { id: existing.id } });
  let connection;
  try {
    connection = await prisma.connection.create({
      data: {
        userAId, userBId, type, requestedById: req.user.id,
        compatibilityScore: req.body.compatibilityScore || 0,
        skillAteaches: req.body.skillAteaches || '', skillBteaches: req.body.skillBteaches || '',
      },
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('A connection with this user already exists.', 409);
    throw error;
  }
  const typeLabel = type === 'peer' ? 'Peer learning' : 'Mentorship';
  await notify({
    userId: target.id, type: 'connection_request', title: `${typeLabel} request`,
    message: `${req.user.name} wants to ${type === 'peer' ? 'learn from each other' : 'connect with you'}.`,
    data: { matchId: connection.id },
  });
  res.status(201).json({ success: true, match: await connectionLabel(connection, req.user.id) });
});

const respond = async (req, status) => {
  const connection = await getConnection(req.body.matchId);
  if (!connection) throw new AppError('Connection not found.', 404);
  assertParticipant(connection, req.user.id);
  if (connection.status !== 'pending') throw new AppError('This connection is already responded to.', 400);
  const result = await prisma.connection.updateMany({
    where: { id: connection.id, status: 'pending' },
    data: { status, active: status === 'accepted', respondedAt: new Date(), ...(status === 'accepted' ? { acceptedAt: new Date() } : {}) },
  });
  if (!result.count) throw new AppError('This connection was already responded to.', 409);
  return getConnection(connection.id);
};

const acceptMatch = asyncHandler(async (req, res) => {
  const connection = await respond(req, 'accepted');
  const otherId = connection.userAId === req.user.id ? connection.userBId : connection.userAId;
  const label = connection.type === 'peer' ? 'Peer learning' : 'Mentorship';
  await notify({
    userId: otherId, type: 'connection_accepted', title: `${label} accepted`,
    message: `${req.user.name} accepted your request. Schedule your first session to unlock chat.`,
    data: { matchId: connection.id },
  });
  await Promise.all([evaluateBadges(req.user.id), evaluateBadges(otherId)]);
  queueTrustRefresh(req.user.id); queueTrustRefresh(otherId);
  res.json({ success: true, match: await connectionLabel(connection, req.user.id) });
});

const rejectMatch = asyncHandler(async (req, res) => {
  const connection = await respond(req, 'rejected');
  res.json({ success: true, match: await connectionLabel(connection, req.user.id) });
});

const cancelMatch = asyncHandler(async (req, res) => {
  const connection = await cancelRelationship(req.body.matchId, req.user.id);
  const otherId = connection.userAId === req.user.id ? connection.userBId : connection.userAId;
  const label = connection.type === 'peer' ? 'Peer learning' : 'Mentorship';
  await notify({ userId: otherId, type: 'system', title: `${label} ended`, message: `${req.user.name} ended this ${label.toLowerCase()} relationship.`, data: { matchId: connection.id } });
  res.json({ success: true, match: await connectionLabel(connection, req.user.id) });
});

const getRelationships = asyncHandler(async (req, res) => {
  const { mentors, learners, peers } = await listConnections(req.user.id);
  res.json({ success: true, mentors, learners, peers });
});

const getMatchHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const where = { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] };
  if (req.query.status) where.status = req.query.status;
  if (req.query.type) where.type = req.query.type;
  const [connections, total] = await Promise.all([
    prisma.connection.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.connection.count({ where }),
  ]);
  const labels = await Promise.all(connections.map((connection) => connectionLabel(connection, req.user.id)));
  res.json({ success: true, ...paginateResults(labels, total, page, limit) });
});

const getPendingRequests = asyncHandler(async (req, res) => {
  const connections = await prisma.connection.findMany({
    where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }], status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });
  const data = await Promise.all(connections.map((connection) => connectionLabel(connection, req.user.id)));
  res.json({ success: true, data });
});

module.exports = { requestMatch, acceptMatch, rejectMatch, cancelMatch, getRelationships, getMatchHistory, getPendingRequests };
