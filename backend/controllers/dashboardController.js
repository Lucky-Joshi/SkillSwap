const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

const YEAR_VALUES = { year1: '1', year2: '2', year3: '3', year4: '4', year5: '5', graduate: 'Graduate' };
const userView = (user) => user ? { ...user, _id: user.id, year: YEAR_VALUES[user.year] || user.year } : null;

const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const participation = { OR: [{ mentorId: userId }, { learnerId: userId }] };
  const connectionParticipation = { OR: [{ userAId: userId }, { userBId: userId }] };
  const [
    skillDocs, matchCount, pendingRequests, completedSessions, upcomingRows, recentRows,
    messageCount, unreadNotifications, badgeCount, connectionRows, reviewRows,
  ] = await Promise.all([
    prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
    prisma.connection.count({ where: { ...connectionParticipation, status: { not: 'rejected' } } }),
    prisma.connection.count({ where: { ...connectionParticipation, status: 'pending' } }),
    prisma.session.count({ where: { ...participation, status: 'completed' } }),
    prisma.session.findMany({
      where: { ...participation, status: 'confirmed', date: { gte: new Date() } },
      orderBy: { date: 'asc' }, take: 5,
    }),
    prisma.session.findMany({
      where: { ...participation, status: 'completed' },
      orderBy: { completedAt: 'desc' }, take: 5,
      include: { mentor: { select: { id: true, name: true, avatar: true } }, learner: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.message.count({ where: { receiverId: userId, read: false, senderId: { not: userId } } }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.userBadge.count({ where: { userId } }),
    prisma.connection.findMany({
      where: { ...connectionParticipation, status: 'accepted', active: true },
      include: {
        userA: { select: { id: true, name: true, avatar: true } },
        userB: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.review.findMany({
      where: { mentorId: userId }, orderBy: { createdAt: 'desc' }, take: 3,
      include: { learner: { select: { id: true, name: true, avatar: true } } },
    }),
  ]);

  const teach = skillDocs.filter((row) => row.canTeach);
  const learn = skillDocs.filter((row) => row.wantToLearn);
  const skillHoursMap = {};
  for (const session of recentRows) {
    const topic = session.topic || 'General';
    if (!skillHoursMap[topic]) skillHoursMap[topic] = { taught: 0, learned: 0 };
    const hours = (session.duration || 60) / 60;
    if (session.mentorId === userId) skillHoursMap[topic].taught += hours;
    else skillHoursMap[topic].learned += hours;
  }
  const skillHours = Object.entries(skillHoursMap)
    .map(([skill, values]) => ({ skill, ...values, total: values.taught + values.learned }))
    .sort((a, b) => b.total - a.total).slice(0, 8);

  const connectionsSummary = connectionRows.map((row) => {
    const isA = row.userAId === userId;
    const other = userView(isA ? row.userB : row.userA);
    return {
      id: row.id,
      userId: other?.id,
      name: other?.name || 'Unknown',
      avatar: other?.avatar,
      type: row.type,
      role: row.type === 'peer' ? 'peer' : (isA ? 'mentor' : 'learner'),
      acceptedAt: row.acceptedAt,
    };
  });
  const activityFeed = recentRows.slice(0, 4).map((session) => {
    const other = userView(session.mentorId === userId ? session.learner : session.mentor);
    return {
      type: 'session',
      text: `Completed "${session.topic}" with ${other?.name || 'someone'}`,
      date: session.completedAt,
      hours: (session.duration || 60) / 60,
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const notificationsMapped = recentRows.map((row) => ({ ...row, id: row.id, _id: row.id, mentorId: userView(row.mentor), learnerId: userView(row.learner) }));
  const user = req.user;
  const profileCompletion = Math.min(100, Math.round([
    user.bio ? 20 : 0, user.avatar ? 10 : 0, user.college ? 10 : 0, user.department ? 10 : 0,
    user.year ? 10 : 0, teach.length ? 20 : 0, learn.length ? 20 : 0,
  ].reduce((a, b) => a + b, 0)));

  res.json({
    success: true,
    stats: {
      teachCount: teach.length, learnCount: learn.length, totalSkills: skillDocs.length,
      matchCount, pendingRequests, completedSessions, messageCount, unreadNotifications,
      badgeCount, points: user.points, rating: user.rating, reviewCount: user.reviewCount,
      sessionsCompleted: user.sessionsCompleted || 0, hoursLearned: user.hoursLearned || 0,
      hoursTaught: user.hoursTaught || 0, learningStreak: user.learningStreak || 0,
      teachingStreak: user.teachingStreak || 0, learnedSkills: user.learnedSkills || [],
      activeConnections: connectionRows.length, profileCompletion,
    },
    upcomingSessions: upcomingRows.map((row) => ({ ...row, _id: row.id })),
    recentSessions: notificationsMapped,
    skillHours,
    connectionsSummary,
    activityFeed,
    recentReviews: reviewRows.map((row) => ({ id: row.id, rating: row.rating, feedback: row.feedback, date: row.createdAt, from: userView(row.learner) })),
  });
});

module.exports = { getDashboard };
