const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Connection = require('../models/Connection');
const Session = require('../models/Session');
const Review = require('../models/Review');
const UserBadge = require('../models/UserBadge');

/**
 * Compute a 0-100 "profile trust score" for a user so real, complete
 * profiles rank above fake/test accounts.
 *
 * Breakdown:
 *   +30 verified email
 *   +10 complete academic details (institution + qualification + department + year)
 *   +10 bio
 *   + 5 avatar
 *   + 5 linked socials / portfolio
 *   +15 skills (3 pts each, capped)
 *   +10 received review
 *   +10 completed session
 *   + 5 accepted match
 *   + 5 earned badge
 * --------
 *  100 max
 */
const computeTrustScore = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return 0;

  const [skillCount, reviewCount, sessionCount, matchCount, badgeCount] = await Promise.all([
    UserSkill.countDocuments({ userId }),
    Review.countDocuments({ $or: [{ mentor: userId }, { learner: userId }] }),
    Session.countDocuments({ $or: [{ mentorId: userId }, { learnerId: userId }], status: 'completed' }),
    Connection.countDocuments({ $or: [{ userA: userId }, { userB: userId }], status: { $ne: 'rejected' } }),
    UserBadge.countDocuments({ userId }),
  ]);

  let score = 0;
  if (user.isVerified) score += 30;
  if (user.college && user.qualification && user.department && user.year) score += 10;
  if (user.bio) score += 10;
  if (user.avatar) score += 5;
  if (user.github || user.linkedin || user.portfolio) score += 5;
  score += Math.min(15, skillCount * 3);
  if (reviewCount >= 1) score += 10;
  if (sessionCount >= 1) score += 10;
  if (matchCount >= 1) score += 5;
  if (badgeCount >= 1) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  await User.findByIdAndUpdate(userId, { trustScore: score });
  return score;
};

const refreshTrustScore = async (userId) => {
  try {
    return await computeTrustScore(userId);
  } catch (err) {
    console.warn(`[trust] refresh failed for ${userId}: ${err.message}`);
    return null;
  }
};

/** Fire-and-forget refresh — never blocks the request path. */
const queueTrustRefresh = (userId) => {
  if (!userId) return;
  setImmediate(() => refreshTrustScore(userId));
};

module.exports = { computeTrustScore, refreshTrustScore, queueTrustRefresh };
