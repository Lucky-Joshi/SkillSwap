const UserSkill = require('../models/UserSkill');
const Connection = require('../models/Connection');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const UserBadge = require('../models/UserBadge');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const { effectiveStart } = require('../services/sessionService');

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
    recentSessions,
    messageCount,
    unreadNotifs,
    badgeCount,
    activeRelationships,
    recentReviews,
  ] = await Promise.all([
    UserSkill.find({ userId }).populate('skillId'),
    Connection.countDocuments({
      $or: [{ userA: userId }, { userB: userId }],
      status: { $ne: 'rejected' },
    }),
    Connection.countDocuments({
      $or: [{ userA: userId }, { userB: userId }],
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
      .limit(5),
    Session.find({
      $or: [{ mentorId: userId }, { learnerId: userId }],
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate('mentorId', 'name avatar')
      .populate('learnerId', 'name avatar'),
    Message.countDocuments({
      receiver: userId,
      read: false,
      sender: { $ne: userId },
    }),
    Notification.countDocuments({ userId, read: false }),
    UserBadge.countDocuments({ userId }),
    Connection.find({
      $or: [{ userA: userId }, { userB: userId }],
      status: 'accepted',
      active: true,
    }),
    Review.find({ mentor: userId }).sort({ createdAt: -1 }).limit(3).populate('learner', 'name avatar'),
  ]);

  const teach = skillDocs.filter((s) => s.canTeach);
  const learn = skillDocs.filter((s) => s.wantToLearn);

  // Skill hours breakdown — which skills have been taught/learned via sessions
  const skillHoursMap = {};
  for (const s of recentSessions) {
    const topic = s.topic || 'General';
    if (!skillHoursMap[topic]) skillHoursMap[topic] = { taught: 0, learned: 0 };
    const hours = (s.duration || 60) / 60;
    const isMentor = String(s.mentorId?._id || s.mentorId) === String(userId);
    if (isMentor) skillHoursMap[topic].taught += hours;
    else skillHoursMap[topic].learned += hours;
  }
  const skillHours = Object.entries(skillHoursMap)
    .map(([skill, h]) => ({ skill, ...h, total: h.taught + h.learned }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Active connections summary
  const connectionsSummary = activeRelationships.map((r) => {
    const isA = String(r.userA) === String(userId);
    const other = isA ? r.userB : r.userA;
    return {
      id: r._id,
      userId: other?._id || other,
      name: other?.name || 'Unknown',
      avatar: other?.avatar,
      type: r.type,
      role: r.type === 'peer' ? 'peer' : (isA ? 'mentor' : 'learner'),
      acceptedAt: r.acceptedAt,
    };
  });

  // Recent activity feed
  const activityFeed = [];
  for (const s of recentSessions.slice(0, 4)) {
    const isMentor = String(s.mentorId?._id || s.mentorId) === String(userId);
    const other = isMentor ? s.learnerId : s.mentorId;
    activityFeed.push({
      type: 'session',
      text: `Completed "${s.topic}" with ${other?.name || 'someone'}`,
      date: s.completedAt,
      hours: (s.duration || 60) / 60,
    });
  }
  activityFeed.sort((a, b) => new Date(b.date) - new Date(a.date));

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
      activeConnections: activeRelationships.length,
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
    recentSessions,
    skillHours,
    connectionsSummary,
    activityFeed,
    recentReviews: recentReviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      feedback: r.feedback,
      date: r.createdAt,
      from: r.learner,
    })),
  });
});

module.exports = { getDashboard };
