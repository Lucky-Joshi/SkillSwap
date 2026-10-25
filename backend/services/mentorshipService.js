const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

const conversationKey = (a, b) => [String(a), String(b)].sort().join('_');
const userInclude = {
  userA: { select: { id: true, name: true, avatar: true, college: true, department: true, year: true, rating: true, bio: true } },
  userB: { select: { id: true, name: true, avatar: true, college: true, department: true, year: true, rating: true, bio: true } },
};
const findRelationship = async (a, b) => prisma.connection.findFirst({
  where: {
    OR: [{ userAId: String(a), userBId: String(b) }, { userAId: String(b), userBId: String(a) }],
    status: 'accepted', active: true,
  },
});
const canInteract = async (a, b) => String(a) !== String(b) && Boolean(await findRelationship(a, b));
const assertCanInteract = async (a, b) => {
  const relationship = await findRelationship(a, b);
  if (!relationship) throw new AppError('Chat will become available once your connection request is accepted.', 403);
  return relationship;
};

const getRelationshipStats = async (userId, partnerId) => {
  const sessions = await prisma.session.findMany({
    where: { OR: [{ mentorId: userId, learnerId: partnerId }, { mentorId: partnerId, learnerId: userId }] },
    orderBy: { date: 'desc' },
  });
  const completed = sessions.filter((session) => session.status === 'completed');
  const totalMinutes = completed.reduce((sum, session) => sum + (session.duration || 60), 0);
  const lastSession = completed[0] || null;
  const upcoming = sessions.filter((session) => session.status === 'confirmed' && session.date >= new Date()).sort((a, b) => a.date - b.date)[0] || null;
  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    lastSessionAt: lastSession?.completedAt || lastSession?.date || null,
    nextSession: upcoming ? {
      id: upcoming.id, topic: upcoming.topic, date: upcoming.date, startTime: upcoming.startTime,
      duration: upcoming.duration, meetingMode: upcoming.meetingMode,
    } : null,
  };
};

const relationshipLabel = async (connection, viewerId, includeStats = false) => {
  const [userA, userB] = connection.userA && typeof connection.userA === 'object'
    ? [connection.userA, connection.userB]
    : await Promise.all([
        prisma.user.findUnique({ where: { id: connection.userAId }, select: userInclude.userA.select }),
        prisma.user.findUnique({ where: { id: connection.userBId }, select: userInclude.userB.select }),
      ]);
  const userAId = connection.userAId || userA?.id;
  const userBId = connection.userBId || userB?.id;
  const isA = String(userAId) === String(viewerId);
  const other = isA ? userB : userA;
  const label = {
    id: connection.id || connection._id,
    type: connection.type,
    status: connection.status,
    active: connection.active,
    acceptedAt: connection.acceptedAt,
    compatibilityScore: connection.compatibilityScore,
    requestedBy: connection.requestedById || connection.requestedBy,
    skills: connection.skills || [],
    skillAteaches: connection.skillAteaches,
    skillBteaches: connection.skillBteaches,
    role: connection.type === 'peer' ? 'peer' : (isA ? 'mentor' : 'learner'),
    otherUser: other ? {
      id: other.id,
      _id: other.id,
      name: other.name,
      avatar: other.avatar,
      college: other.college,
      department: other.department,
      year: ({ year1: '1', year2: '2', year3: '3', year4: '4', year5: '5', graduate: 'Graduate' })[other.year] || other.year,
      rating: other.rating,
      bio: other.bio,
    } : null,
  };
  if (includeStats && connection.status === 'accepted' && other) label.stats = await getRelationshipStats(viewerId, other.id);
  return label;
};

const listConnections = async (userId) => {
  const connections = await prisma.connection.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }], status: 'accepted', active: true },
    include: userInclude,
    orderBy: { acceptedAt: 'desc' },
  });
  const mentors = [], learners = [], peers = [];
  for (const connection of connections) {
    const label = await relationshipLabel(connection, userId, true);
    if (connection.type === 'peer') peers.push(label);
    else if (label.role === 'learner') mentors.push(label);
    else learners.push(label);
  }
  return { mentors, learners, peers };
};

const cancelRelationship = async (connectionId, userId) => {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new AppError('Connection not found.', 404);
  if (connection.userAId !== userId && connection.userBId !== userId) throw new AppError('You are not part of this connection.', 403);
  if (connection.status !== 'accepted') throw new AppError('Only active connections can be cancelled.', 400);
  return prisma.connection.update({ where: { id: connectionId }, data: { status: 'cancelled', active: false } });
};

module.exports = { conversationKey, findRelationship, canInteract, assertCanInteract, relationshipLabel, listConnections, listMentorships: listConnections, cancelRelationship, getRelationshipStats };
