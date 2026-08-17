const UserSkill = require('../models/UserSkill');
const Match = require('../models/Match');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const UserBadge = require('../models/UserBadge');
const asyncHandler = require('../utils/asyncHandler');

// @route  GET /api/dashboard
// @access private
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    skillDocs,
    matchCount,
    pendingRequests,
    completedSessions,
    upcomingSessions,
    messageCount,
    unreadNotifs,
    badgeCount,
  ] = await Promise.all([
    UserSkill.find({ userId }).populate('skillId'),
    Match.countDocuments({
      $or: [{ mentorId: userId }, { learnerId: userId }],
      status: { $ne: 'rejected' },
    }),
    Match.countDocuments({
      $or: [{ mentorId: userId }, { learnerId: userId }],
      status: 'pending',
    }),
    Session.countDocuments({
      $or: [{ mentorId: userId }, { learnerId: userId }],
      status: 'completed',
    }),
    Session.find({
      $or: [{ mentorId: userId }, { learnerId: userId }],
      status: 'confirmed',
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .limit(3),
    Message.countDocuments({
      receiver: userId,
      read: false,
      sender: { $ne: userId },
    }),
    Notification.countDocuments({ userId, read: false }),
    UserBadge.countDocuments({ userId }),
  ]);

const teach = skillDocs.filter((s) => s.canTeach);
const learn = skillDocs.filter((s) => s.wantToLearn);

res.json({
  success: true,
  stats: {
    teachCount: teach.length,
    learnCount: learn.length,
    totalSkills: skillDocs.length,
    matchCount,
    pendingRequests,
    completedSessions,
    messageCount,
    unreadNotifications: unreadNotifs,
    badgeCount,
    points: req.user.points,
    rating: req.user.rating,
    reviewCount: req.user.reviewCount,
    sessionsCompleted: req.user.sessionsCompleted || 0,
    hoursLearned: req.user.hoursLearned || 0,
    hoursTaught: req.user.hoursTaught || 0,
    learningStreak: req.user.learningStreak || 0,
    teachingStreak: req.user.teachingStreak || 0,
    learnedSkills: req.user.learnedSkills || [],
    profileCompletion: Math.min(
      100,
      Math.round(
        [
          req.user.bio ? 20 : 0,
          req.user.avatar ? 10 : 0,
          req.user.college ? 10 : 0,
          req.user.department ? 10 : 0,
          req.user.year ? 10 : 0,
          teach.length ? 20 : 0,
          learn.length ? 20 : 0,
        ].reduce((a, b) => a + b, 0)
      )
    ),
  },
  upcomingSessions,
  recentSkills: skillDocs.slice(0, 6).map((s) => ({
    id: s._id,
    name: s.skillId?.name,
    category: s.skillId?.category,
    icon: s.skillId?.icon,
    level: s.level,
    canTeach: s.canTeach,
    wantToLearn: s.wantToLearn,
  })),
});
});

module.exports = { getDashboard };
