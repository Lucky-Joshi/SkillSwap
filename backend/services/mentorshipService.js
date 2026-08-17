const Match = require('../models/Match');
const AppError = require('../utils/AppError');

/**
 * A "mentorship relationship" is an accepted, active Match.
 * Only active relationships unlock sessions and chat.
 */

// Deterministic key for a conversation between two users.
const conversationKey = (a, b) => [String(a), String(b)].sort().join('_');

// Find the accepted + active relationship between two users (either direction).
const findRelationship = async (a, b) =>
  Match.findOne({
    $or: [
      { mentorId: a, learnerId: b },
      { mentorId: b, learnerId: a },
    ],
    status: 'accepted',
    active: true,
  });

// Boolean gate used by chat + sessions.
const canInteract = async (a, b) => {
  if (String(a) === String(b)) return false;
  return Boolean(await findRelationship(a, b));
};

// Throw when two users are not in an accepted relationship.
const assertCanInteract = async (a, b) => {
  const rel = await findRelationship(a, b);
  if (!rel) {
    throw new AppError('Chat will become available once your mentorship request is accepted.', 403);
  }
  return rel;
};

const relationshipLabel = async (match, viewerId) => {
  const [mentor, learner] = await Promise.all([
    require('../models/User').findById(match.mentorId),
    require('../models/User').findById(match.learnerId),
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
    skills: match.skills,
    role: isMentor ? 'mentor' : 'learner',
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
};

// List the viewer's active relationships, split by direction.
const listMentorships = async (userId) => {
  const matches = await Match.find({
    $or: [{ mentorId: userId }, { learnerId: userId }],
    status: 'accepted',
    active: true,
  }).sort({ acceptedAt: -1 });

  const mentors = [];
  const learners = [];
  for (const m of matches) {
    const label = await relationshipLabel(m, userId);
    if (label.role === 'learner') mentors.push(label); // my mentor
    else learners.push(label); // my learner
  }
  return { mentors, learners };
};

// Cancel an active relationship (sets it inactive for both sides).
const cancelRelationship = async (matchId, userId) => {
  const match = await Match.findById(matchId);
  if (!match) throw new AppError('Relationship not found.', 404);
  const isParticipant =
    String(match.mentorId) === String(userId) || String(match.learnerId) === String(userId);
  if (!isParticipant) throw new AppError('You are not part of this relationship.', 403);
  if (match.status !== 'accepted') throw new AppError('Only active relationships can be cancelled.', 400);

  match.status = 'cancelled';
  match.active = false;
  await match.save();
  return match;
};

module.exports = {
  conversationKey,
  findRelationship,
  canInteract,
  assertCanInteract,
  relationshipLabel,
  listMentorships,
  cancelRelationship,
};
