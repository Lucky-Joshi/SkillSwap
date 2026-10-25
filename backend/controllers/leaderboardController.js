const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');

const YEAR_VALUES = { year1: '1', year2: '2', year3: '3', year4: '4', year5: '5', graduate: 'Graduate' };

const getLeaderboard = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const where = { points: { gt: 0 }, role: { notIn: ['admin', 'super_admin'] }, status: { notIn: ['suspended', 'deleted', 'banned'] }, profileVisibility: { not: 'private' } };
  const [users, total, badgeGroups] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ points: 'desc' }, { rating: 'desc' }],
      select: { id: true, name: true, avatar: true, college: true, department: true, year: true, points: true, rating: true, reviewCount: true },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
    prisma.userBadge.groupBy({ by: ['userId'], _count: { _all: true } }),
  ]);
  const badgeMap = new Map(badgeGroups.map((group) => [group.userId, group._count._all]));
  const data = users.map((user, i) => ({
    rank: skip + i + 1,
    id: user.id,
    _id: user.id,
    name: user.name,
    avatar: user.avatar,
    college: user.college,
    department: user.department,
    year: YEAR_VALUES[user.year] || user.year,
    points: user.points,
    rating: user.rating,
    reviewCount: user.reviewCount,
    badgeCount: badgeMap.get(user.id) || 0,
  }));
  res.json({ success: true, ...paginateResults(data, total, page, limit) });
});

module.exports = { getLeaderboard };
