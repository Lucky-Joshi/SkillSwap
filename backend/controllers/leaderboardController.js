const User = require('../models/User');
const UserBadge = require('../models/UserBadge');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');

// @route  GET /api/leaderboard?page=&limit=
// @access private
const getLeaderboard = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const [users, total] = await Promise.all([
    User.find({ points: { $gt: 0 }, role: { $ne: 'admin' } })
      .sort({ points: -1, rating: -1 })
      .select('name avatar college department year points rating reviewCount')
      .skip(skip)
      .limit(limit),
    User.countDocuments({ points: { $gt: 0 }, role: { $ne: 'admin' } }),
  ]);

  const badgeCounts = await UserBadge.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);
  const badgeMap = new Map(badgeCounts.map((b) => [String(b._id), b.count]));

  const data = users.map((u, i) => ({
    rank: (page - 1) * limit + i + 1,
    id: u._id,
    name: u.name,
    avatar: u.avatar,
    college: u.college,
    department: u.department,
    year: u.year,
    points: u.points,
    rating: u.rating,
    reviewCount: u.reviewCount,
    badgeCount: badgeMap.get(String(u._id)) || 0,
  }));

  res.json({ success: true, ...paginateResults(data, total, page, limit) });
});

module.exports = { getLeaderboard };
