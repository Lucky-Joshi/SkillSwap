const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Review = require('../models/Review');
const Session = require('../models/Session');
const Match = require('../models/Match');
const { notify } = require('./notificationService');

const BADGE_KEYS = {
  'First Steps': 'First Steps',
  'Profile Pro': 'Profile Pro',
  'Skill Collector': 'Skill Collector',
  'First Match': 'First Match',
  'Networker': 'Networker',
  'Session Master': 'Session Master',
  'Mentor Star': 'Mentor Star',
  'Top Contributor': 'Top Contributor',
};

const grantBadge = async (userId, badgeName, source = 'auto') => {
  const badge = await Badge.findOne({ name: badgeName });
  if (!badge) return null;
  const exists = await UserBadge.exists({ userId, badgeId: badge._id });
  if (exists) return null;

  const earned = await UserBadge.create({ userId, badgeId: badge._id, source });
  await User.findByIdAndUpdate(userId, { $inc: { points: badge.points } });
  await notify({
    userId,
    type: 'badge',
    title: `Badge unlocked: ${badge.name}`,
    message: `${badge.icon} ${badge.description}`,
    data: { badgeId: badge._id },
  });
  return earned;
};

/**
 * Check-and-grant badges based on the user's current stats.
 */
const evaluateBadges = async (userId) => {
  const [skillCount, reviewCount, sessionCount, matchCount, user] = await Promise.all([
    UserSkill.countDocuments({ userId }),
    Review.countDocuments({ $or: [{ mentor: userId }, { learner: userId }] }),
    Session.countDocuments({ $or: [{ mentorId: userId }, { learnerId: userId }], status: 'completed' }),
    Match.countDocuments({ $or: [{ mentorId: userId }, { learnerId: userId }], status: { $ne: 'rejected' } }),
    User.findById(userId),
  ]);

  const grants = [];
  if (user && skillCount >= 1) grants.push(grantBadge(userId, BADGE_KEYS['First Steps']));
  if (user && skillCount >= 3 && user.bio) grants.push(grantBadge(userId, BADGE_KEYS['Profile Pro']));
  if (skillCount >= 5) grants.push(grantBadge(userId, BADGE_KEYS['Skill Collector']));
  if (matchCount >= 1) grants.push(grantBadge(userId, BADGE_KEYS['First Match']));
  if (matchCount >= 3) grants.push(grantBadge(userId, BADGE_KEYS['Networker']));
  if (sessionCount >= 1) grants.push(grantBadge(userId, BADGE_KEYS['Session Master']));
  if (reviewCount >= 5) grants.push(grantBadge(userId, BADGE_KEYS['Mentor Star']));
  if ((user?.points || 0) >= 100) grants.push(grantBadge(userId, BADGE_KEYS['Top Contributor']));

  await Promise.all(grants.filter(Boolean));
  return grants.filter(Boolean);
};

module.exports = { grantBadge, evaluateBadges, BADGE_KEYS };
