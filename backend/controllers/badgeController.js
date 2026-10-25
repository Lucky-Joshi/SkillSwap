const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

const getAllBadges = asyncHandler(async (req, res) => {
  const [badges, earned] = await Promise.all([
    prisma.badge.findMany({ orderBy: { points: 'asc' } }),
    prisma.userBadge.findMany({
      where: { userId: req.user.id },
      select: { badgeId: true, earnedAt: true },
    }),
  ]);
  const earnedMap = new Map(earned.map(({ badgeId, earnedAt }) => [badgeId, earnedAt]));
  res.json({
    success: true,
    badges: badges.map((badge) => ({
      ...badge,
      _id: badge.id,
      earned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) || null,
    })),
  });
});

const getMyBadges = asyncHandler(async (req, res) => {
  const earned = await prisma.userBadge.findMany({
    where: { userId: req.user.id },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  });
  res.json({
    success: true,
    badges: earned.map((row) => ({ ...row, _id: row.id, badgeId: { ...row.badge, _id: row.badge.id } })),
  });
});

module.exports = { getAllBadges, getMyBadges };
