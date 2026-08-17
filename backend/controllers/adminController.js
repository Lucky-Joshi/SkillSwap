const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Connection = require('../models/Connection');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const UserBadge = require('../models/UserBadge');
const Skill = require('../models/Skill');
const Badge = require('../models/Badge');
const Institution = require('../models/Institution');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { deleteUser, deleteTestUsers } = require('../services/cleanupService');
const { resetDemoAccount } = require('../services/seedService');

// @route  GET /api/admin/stats
// @access private (admin) — overview of data for cleanup decisions.
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, verifiedUsers, testUsers, demoUsers, totalSkills, totalBadges,
    totalInstitutions, totalConnections, totalSessions, totalMessages, totalReviews,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isTest: true }),
    User.countDocuments({ isDemo: true }),
    Skill.countDocuments({}),
    Badge.countDocuments({}),
    Institution.countDocuments({}),
    Connection.countDocuments({}),
    Session.countDocuments({}),
    Message.countDocuments({}),
    Review.countDocuments({}),
  ]);

  const averageTrust = await User.aggregate([
    { $match: { isTest: { $ne: true }, isDemo: { $ne: true } } },
    { $group: { _id: null, avg: { $avg: '$trustScore' } } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      verifiedUsers,
      testUsers,
      demoUsers,
      averageTrustScore: Math.round((averageTrust[0]?.avg || 0) * 10) / 10,
      totalSkills,
      totalBadges,
      totalInstitutions,
      totalConnections,
      totalSessions,
      totalMessages,
      totalReviews,
    },
  });
});

// @route  GET /api/admin/users
// @access private (admin) — search users, test users first.
const listUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = {};
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const users = await User.find(filter)
    .sort({ isTest: -1, createdAt: -1 })
    .limit(100)
    .select('name email college role isVerified isTest isDemo trustScore points createdAt')
    .lean();
  res.json({
    success: true,
    users: users.map((u) => ({ ...u, id: String(u._id) })),
  });
});

// @route  DELETE /api/admin/users/test
// @access private (admin) — delete every temporary test account.
const deleteAllTestUsers = asyncHandler(async (req, res) => {
  const removed = await deleteTestUsers();
  res.json({ success: true, removed, message: `Deleted ${removed} temporary test account(s).` });
});

// @route  DELETE /api/admin/users/:id
// @access private (admin) — delete a specific user + their data.
const deleteSingleUser = asyncHandler(async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
  } catch (err) {
    return next(err);
  }
  res.json({ success: true, message: 'User and all associated data deleted.' });
});

// @route  POST /api/admin/demo/reset
// @access private (admin) — recreate the demo account cleanly.
const resetDemo = asyncHandler(async (req, res) => {
  const demo = await resetDemoAccount();
  res.json({ success: true, message: 'Demo account reset to a clean state.', email: demo.email });
});

// @route  DELETE /api/admin/data
// @access private (admin) — purge all user-generated data (keep core + admin).
const purgeData = asyncHandler(async (req, res) => {
  const keepAdmin = await User.findOne({ role: 'admin' }).select('_id');
  await Promise.all([
    UserSkill.deleteMany({}),
    Connection.deleteMany({}),
    Session.deleteMany({}),
    Message.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    UserBadge.deleteMany({}),
  ]);
  await User.deleteMany({ role: { $ne: 'admin' } });
  if (keepAdmin) {
    await User.findByIdAndUpdate(keepAdmin._id, { points: 0 });
  }
  res.json({ success: true, message: 'All user data purged. Skills, badges, institutions and admin account kept.' });
});

// @route  POST /api/admin/seed/reseed
// @access private (admin) — re-run the full seed for a known-good state.
const reseed = asyncHandler(async (req, res) => {
  await resetDemoAccount();
  res.json({ success: true, message: 'Demo data re-seeded. Use the CLI for a full rebuild.' });
});

module.exports = { getStats, listUsers, deleteAllTestUsers, deleteSingleUser, resetDemo, purgeData, reseed };
