const prisma = require('../lib/prisma');
const { notify } = require('./notificationService');

const BADGE_KEYS = {
  'First Steps': 'First Steps', 'Profile Pro': 'Profile Pro', 'Skill Collector': 'Skill Collector',
  'First Match': 'First Match', Networker: 'Networker', 'Session Master': 'Session Master',
  'Mentor Star': 'Mentor Star', 'Top Contributor': 'Top Contributor',
};

const grantBadge = async (userId, badgeName, source = 'auto') => {
  const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
  if (!badge) return null;
  try {
    const earned = await prisma.$transaction(async (tx) => {
      const row = await tx.userBadge.create({ data: { userId: String(userId), badgeId: badge.id, source } });
      await tx.user.update({ where: { id: String(userId) }, data: { points: { increment: badge.points } } });
      return row;
    });
    await notify({
      userId,
      type: 'badge_earned',
      title: `Badge unlocked: ${badge.name}`,
      message: `${badge.icon} ${badge.description}`,
      data: { badgeId: badge.id },
    });
    return earned;
  } catch (error) {
    if (error.code === 'P2002') return null;
    throw error;
  }
};

const evaluateBadges = async (userId) => {
  const [skillCount, reviewCount, sessionCount, matchCount, user] = await Promise.all([
    prisma.userSkill.count({ where: { userId } }),
    prisma.review.count({ where: { OR: [{ mentorId: userId }, { learnerId: userId }] } }),
    prisma.session.count({ where: { OR: [{ mentorId: userId }, { learnerId: userId }], status: 'completed' } }),
    prisma.connection.count({ where: { OR: [{ userAId: userId }, { userBId: userId }], status: { not: 'rejected' } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, bio: true, points: true } }),
  ]);
  const grants = [];
  if (user && skillCount >= 1) grants.push([BADGE_KEYS['First Steps']]);
  if (user && skillCount >= 3 && user.bio) grants.push([BADGE_KEYS['Profile Pro']]);
  if (skillCount >= 5) grants.push([BADGE_KEYS['Skill Collector']]);
  if (matchCount >= 1) grants.push([BADGE_KEYS['First Match']]);
  if (matchCount >= 3) grants.push([BADGE_KEYS.Networker]);
  if (sessionCount >= 1) grants.push([BADGE_KEYS['Session Master']]);
  if (reviewCount >= 5) grants.push([BADGE_KEYS['Mentor Star']]);
  if ((user?.points || 0) >= 100) grants.push([BADGE_KEYS['Top Contributor']]);
  return Promise.all(grants.map(([name]) => grantBadge(userId, name)));
};

module.exports = { grantBadge, evaluateBadges, BADGE_KEYS };
