const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const asyncHandler = require('../utils/asyncHandler');

// @route  GET /api/badges
// @access private
const getAllBadges = asyncHandler(async (req, res) => {
  const badges = await Badge.find({}).sort({ points: 1 });
  const earned = await UserBadge.find({ userId: req.user._id }).select('badgeId earnedAt');
  const earnedSet = new Map(earned.map((e) => [String(e.badgeId), e.earnedAt]));

  const data = badges.map((b) => ({
    id: b._id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    points: b.points,
    earned: earnedSet.has(String(b._id)),
    earnedAt: earnedSet.get(String(b._id)) || null,
  }));

  res.json({ success: true, badges: data });
});

// @route  GET /api/badges/mine
// @access private
const getMyBadges = asyncHandler(async (req, res) => {
  const earned = await UserBadge.find({ userId: req.user._id })
    .populate('badgeId')
    .sort({ earnedAt: -1 });
  res.json({ success: true, badges: earned });
});

module.exports = { getAllBadges, getMyBadges };
