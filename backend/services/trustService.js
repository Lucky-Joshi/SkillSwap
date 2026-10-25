const prisma = require('../lib/prisma');

const computeTrustScore = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: String(userId) } });
  if (!user) return 0;
  const [skillCount, reviewCount, sessionCount, matchCount, badgeCount] = await Promise.all([
    prisma.userSkill.count({ where: { userId: String(userId) } }),
    prisma.review.count({ where: { OR: [{ mentorId: String(userId) }, { learnerId: String(userId) }] } }),
    prisma.session.count({ where: { OR: [{ mentorId: String(userId) }, { learnerId: String(userId) }], status: 'completed' } }),
    prisma.connection.count({ where: { OR: [{ userAId: String(userId) }, { userBId: String(userId) }], status: { not: 'rejected' } } }),
    prisma.userBadge.count({ where: { userId: String(userId) } }),
  ]);
  let score = 0;
  if (user.isVerified) score += 30;
  if (user.college && user.qualification && user.department && user.year) score += 10;
  if (user.bio) score += 10;
  if (user.avatar) score += 5;
  if (user.github || user.linkedin || user.portfolio) score += 5;
  score += Math.min(15, skillCount * 3);
  if (reviewCount) score += 10;
  if (sessionCount) score += 10;
  if (matchCount) score += 5;
  if (badgeCount) score += 5;
  score = Math.max(0, Math.min(100, Math.round(score)));
  await prisma.user.update({ where: { id: String(userId) }, data: { trustScore: score } });
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

const queueTrustRefresh = (userId) => {
  if (userId) setImmediate(() => refreshTrustScore(userId));
};

module.exports = { computeTrustScore, refreshTrustScore, queueTrustRefresh };
