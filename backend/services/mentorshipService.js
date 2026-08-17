const Connection = require('../models/Connection');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const { effectiveStart } = require('./sessionService');

/**
 * A "connection" is an accepted, active Connection document.
 * Type determines semantics: 'mentorship' (directional) or 'peer' (mutual exchange).
 * Only active connections unlock sessions and chat.
 */

// Deterministic key for a conversation between two users.
const conversationKey = (a, b) => [String(a), String(b)].sort().join('_');

// Find the accepted + active connection between two users (either direction).
const findRelationship = async (a, b) =>
  Connection.findOne({
    $or: [
      { userA: a, userB: b },
      { userA: b, userB: a },
    ],
    status: 'accepted',
    active: true,
  });

// Boolean gate used by chat + sessions.
const canInteract = async (a, b) => {
  if (String(a) === String(b)) return false;
  return Boolean(await findRelationship(a, b));
};

// Throw when two users are not in an accepted connection.
const assertCanInteract = async (a, b) => {
  const rel = await findRelationship(a, b);
  if (!rel) {
    throw new AppError('Chat will become available once your connection request is accepted.', 403);
  }
  return rel;
};

// Get stats for a connection between two users.
const getRelationshipStats = async (userId, partnerId) => {
  const sessions = await Session.find({
    $or: [
      { mentorId: userId, learnerId: partnerId },
      { mentorId: partnerId, learnerId: userId },
    ],
  }).sort({ date: -1 });

  const completed = sessions.filter((s) => s.status === 'completed');
  const totalMinutes = completed.reduce((sum, s) => sum + (s.duration || 60), 0);
  const lastSession = completed[0] || null;

  const now = new Date();
  const upcoming = sessions
    .filter((s) => s.status === 'confirmed' && new Date(s.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    lastSessionAt: lastSession?.completedAt || lastSession?.date || null,
    nextSession: upcoming
      ? {
          id: upcoming._id,
          topic: upcoming.topic,
          date: upcoming.date,
          startTime: upcoming.startTime,
          duration: upcoming.duration,
          meetingMode: upcoming.meetingMode,
        }
      : null,
  };
};

const relationshipLabel = async (conn, viewerId, includeStats = false) => {
  const [userA, userB] = await Promise.all([
    require('../models/User').findById(conn.userA),
    require('../models/User').findById(conn.userB),
  ]);
  const isA = String(conn.userA) === String(viewerId);
  const other = isA ? userB : userA;

  // For mentorship: userA = mentor, userB = learner (whoever was assigned as mentor).
  // For peer: both are equal; role is just 'peer'.
  let role;
  if (conn.type === 'peer') {
    role = 'peer';
  } else {
    role = isA ? 'mentor' : 'learner';
  }

  const label = {
    id: conn._id,
    type: conn.type,
    status: conn.status,
    active: conn.active,
    acceptedAt: conn.acceptedAt,
    compatibilityScore: conn.compatibilityScore,
    requestedBy: conn.requestedBy,
    skills: conn.skills,
    skillAteaches: conn.skillAteaches,
    skillBteaches: conn.skillBteaches,
    role,
    otherUser: other
      ? {
          id: other._id,
          name: other.name,
          avatar: other.avatar,
          college: other.college,
          department: other.department,
          year: other.year,
          rating: other.rating,
          bio: other.bio,
        }
      : null,
  };

  if (includeStats && conn.status === 'accepted') {
    label.stats = await getRelationshipStats(viewerId, other._id);
  }

  return label;
};

// List the viewer's active connections, split by type and direction.
const listConnections = async (userId) => {
  const connections = await Connection.find({
    $or: [{ userA: userId }, { userB: userId }],
    status: 'accepted',
    active: true,
  }).sort({ acceptedAt: -1 });

  const mentors = [];
  const learners = [];
  const peers = [];

  for (const conn of connections) {
    const label = await relationshipLabel(conn, userId, true);
    if (conn.type === 'peer') {
      peers.push(label);
    } else if (label.role === 'learner') {
      mentors.push(label);
    } else {
      learners.push(label);
    }
  }
  return { mentors, learners, peers };
};

// Cancel an active connection (sets it inactive for both sides).
const cancelRelationship = async (connectionId, userId) => {
  const conn = await Connection.findById(connectionId);
  if (!conn) throw new AppError('Connection not found.', 404);
  const isParticipant =
    String(conn.userA) === String(userId) || String(conn.userB) === String(userId);
  if (!isParticipant) throw new AppError('You are not part of this connection.', 403);
  if (conn.status !== 'accepted') throw new AppError('Only active connections can be cancelled.', 400);

  conn.status = 'cancelled';
  conn.active = false;
  await conn.save();
  return conn;
};

module.exports = {
  conversationKey,
  findRelationship,
  canInteract,
  assertCanInteract,
  relationshipLabel,
  listConnections,
  listMentorships: listConnections,
  cancelRelationship,
  getRelationshipStats,
};
