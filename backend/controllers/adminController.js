const mongoose = require('mongoose');
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
const Report = require('../models/Report');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { deleteUser } = require('../services/cleanupService');

const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, activeUsers, verifiedUsers,
    newUsersThisWeek, newUsersThisMonth,
    totalInstitutions,
    totalConnections, activeConnections,
    totalSessions, completedSessions, cancelledSessions, sessionsThisWeek, sessionsThisMonth,
    totalMessages, totalReviews,
    totalSkills, totalBadges, issuedBadges,
    totalReports, pendingReports,
    avgTrustResult, topSkills, recentUsers,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ lastActiveAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Institution.countDocuments({}),
    Connection.countDocuments({}),
    Connection.countDocuments({ active: true }),
    Session.countDocuments({}),
    Session.countDocuments({ status: 'completed' }),
    Session.countDocuments({ status: 'cancelled' }),
    Session.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Session.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Message.countDocuments({}),
    Review.countDocuments({}),
    Skill.countDocuments({}),
    Badge.countDocuments({}),
    UserBadge.countDocuments({}),
    Report.countDocuments({}),
    Report.countDocuments({ status: 'pending' }),
    User.aggregate([
      { $group: { _id: null, avg: { $avg: '$trustScore' } } },
    ]),
    UserSkill.aggregate([
      { $group: { _id: '$skillId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'skills', localField: '_id', foreignField: '_id', as: 'skill' } },
      { $unwind: '$skill' },
      { $project: { name: '$skill.name', icon: '$skill.icon', count: 1 } },
    ]),
    User.find({}).sort({ createdAt: -1 }).limit(5).select('name email avatar role isVerified createdAt'),
  ]);

  res.json({
    success: true,
    dashboard: {
      totalUsers, activeUsers, verifiedUsers,
      newUsersThisWeek, newUsersThisMonth,
      totalInstitutions,
      totalConnections, activeConnections,
      totalSessions, completedSessions, cancelledSessions, sessionsThisWeek, sessionsThisMonth,
      totalMessages, totalReviews,
      totalSkills, totalBadges, issuedBadges,
      totalReports, pendingReports,
      avgTrustScore: Math.round((avgTrustResult[0]?.avg || 0) * 10) / 10,
      topSkills, recentUsers,
    },
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { q, role, verified, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { college: rx }];
  }
  if (role) filter.role = role;
  if (verified !== undefined) filter.isVerified = verified === 'true' || verified === true;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limitNum)
      .select('name email college role isVerified trustScore points rating profileViews createdAt lastActiveAt avatar isSuspended')
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    users: users.map((u) => ({ ...u, id: String(u._id) })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password -verificationToken -resetToken -resetTokenExpiry');
  if (!user) return next(new AppError('User not found.', 404));

  const [skills, activeConnections, sessionsCompletedCount, reviews, badges] = await Promise.all([
    UserSkill.find({ userId: user._id }).populate('skillId', 'name category icon'),
    Connection.countDocuments({ $or: [{ userA: user._id }, { userB: user._id }], active: true }),
    Session.countDocuments({ $or: [{ mentorId: user._id }, { learnerId: user._id }], status: 'completed' }),
    Review.find({ $or: [{ mentor: user._id }, { learner: user._id }] })
      .populate('mentor', 'name email avatar')
      .populate('learner', 'name email avatar')
      .sort({ createdAt: -1 }),
    UserBadge.find({ userId: user._id }).populate('badgeId', 'name description icon points'),
  ]);

  res.json({
    success: true,
    user: {
      ...user.toObject(),
      id: String(user._id),
      skills,
      activeConnections,
      sessionsCompleted: sessionsCompletedCount,
      reviews,
      badges,
    },
  });
});

const updateUser = asyncHandler(async (req, res, next) => {
  const { role, isVerified, isSuspended } = req.body;
  const updates = {};
  if (role !== undefined) updates.role = role;
  if (isVerified !== undefined) updates.isVerified = isVerified;
  if (isSuspended !== undefined) updates.isSuspended = isSuspended;

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields to update.', 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .select('-password -verificationToken -resetToken -resetTokenExpiry');
  if (!user) return next(new AppError('User not found.', 404));
  res.json({ success: true, user });
});

const suspendUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin') return next(new AppError('Admin accounts cannot be suspended.', 400));

  user.isSuspended = !user.isSuspended;
  await user.save({ validateModifiedOnly: true });

  res.json({
    success: true,
    message: user.isSuspended ? 'User has been suspended.' : 'User has been unsuspended.',
    isSuspended: user.isSuspended,
  });
});

const deleteUserAdmin = asyncHandler(async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
  } catch (err) {
    return next(err);
  }
  res.json({ success: true, message: 'User and all associated data deleted.' });
});

const listInstitutions = asyncHandler(async (req, res) => {
  const { q, type, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { city: rx }, { country: rx }];
  }
  if (type) filter.type = type;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [institutions, total] = await Promise.all([
    Institution.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
    Institution.countDocuments(filter),
  ]);

  const enriched = await Promise.all(
    institutions.map(async (inst) => {
      const userCount = await User.countDocuments({ college: inst.name });
      return { ...inst, id: String(inst._id), userCount };
    })
  );

  res.json({
    success: true,
    institutions: enriched,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const createInstitution = asyncHandler(async (req, res, next) => {
  const { name, city, country, type } = req.body;
  if (!name || !name.trim()) return next(new AppError('Institution name is required.', 400));

  const existing = await Institution.findOne({ name: new RegExp('^' + name.trim() + '$', 'i') });
  if (existing) return next(new AppError('An institution with this name already exists.', 409));

  const institution = await Institution.create({ name: name.trim(), city, country, type });
  res.status(201).json({ success: true, institution });
});

const updateInstitution = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!institution) return next(new AppError('Institution not found.', 404));
  res.json({ success: true, institution });
});

const deleteInstitution = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findByIdAndDelete(req.params.id);
  if (!institution) return next(new AppError('Institution not found.', 404));
  res.json({ success: true, message: 'Institution deleted.' });
});

const mergeInstitutions = asyncHandler(async (req, res, next) => {
  const { targetId, sourceIds } = req.body;
  if (!targetId || !sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
    return next(new AppError('targetId and sourceIds array are required.', 400));
  }

  const target = await Institution.findById(targetId);
  if (!target) return next(new AppError('Target institution not found.', 404));

  const sources = await Institution.find({ _id: { $in: sourceIds } });
  const sourceNames = sources.map((s) => s.name);

  await User.updateMany({ college: { $in: sourceNames } }, { $set: { college: target.name } });
  await Institution.deleteMany({ _id: { $in: sourceIds } });

  res.json({ success: true, message: `Merged ${sources.length} institution(s) into ${target.name}.` });
});

const listSkills = asyncHandler(async (req, res) => {
  const { q, category, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { aliases: rx }];
  }
  if (category) filter.category = category;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [skills, total] = await Promise.all([
    Skill.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
    Skill.countDocuments(filter),
  ]);

  const enriched = await Promise.all(
    skills.map(async (skill) => {
      const userCount = await UserSkill.countDocuments({ skillId: skill._id });
      return { ...skill, id: String(skill._id), userCount };
    })
  );

  res.json({
    success: true,
    skills: enriched,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const createSkill = asyncHandler(async (req, res, next) => {
  const { name, aliases, category, difficulty, icon } = req.body;
  if (!name || !name.trim()) return next(new AppError('Skill name is required.', 400));

  const existing = await Skill.findOne({ name: new RegExp('^' + name.trim() + '$', 'i') });
  if (existing) return next(new AppError('A skill with this name already exists.', 409));

  const skill = await Skill.create({ name: name.trim(), aliases, category, difficulty, icon });
  res.status(201).json({ success: true, skill });
});

const updateSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!skill) return next(new AppError('Skill not found.', 404));
  res.json({ success: true, skill });
});

const deleteSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findByIdAndDelete(req.params.id);
  if (!skill) return next(new AppError('Skill not found.', 404));
  await UserSkill.deleteMany({ skillId: skill._id });
  res.json({ success: true, message: 'Skill and all user-skill references deleted.' });
});

const mergeSkills = asyncHandler(async (req, res, next) => {
  const { targetId, sourceIds } = req.body;
  if (!targetId || !sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
    return next(new AppError('targetId and sourceIds array are required.', 400));
  }

  const target = await Skill.findById(targetId);
  if (!target) return next(new AppError('Target skill not found.', 404));

  const sources = await Skill.find({ _id: { $in: sourceIds } });

  const allAliases = new Set([...(target.aliases || []), target.name]);
  for (const src of sources) {
    allAliases.add(src.name);
    for (const alias of src.aliases || []) allAliases.add(alias);
  }
  target.aliases = [...allAliases].filter((a) => a !== target.name);
  await target.save();

  for (const srcId of sourceIds) {
    await UserSkill.updateMany({ skillId: srcId }, { $set: { skillId: target._id } });
  }

  await Skill.deleteMany({ _id: { $in: sourceIds } });

  res.json({ success: true, message: `Merged ${sources.length} skill(s) into ${target.name}.` });
});

const listSessions = asyncHandler(async (req, res) => {
  const { status, from, to, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [sessions, total] = await Promise.all([
    Session.find(filter).sort(sort).skip(skip).limit(limitNum)
      .populate('mentorId', 'name email avatar')
      .populate('learnerId', 'name email avatar')
      .lean(),
    Session.countDocuments(filter),
  ]);

  res.json({
    success: true,
    sessions,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getSessionStats = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [statusCounts, avgDurationResult, sessionsByDay] = await Promise.all([
    Session.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Session.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$duration' } } },
    ]),
    Session.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const statusMap = {};
  let total = 0;
  for (const s of statusCounts) {
    statusMap[s._id] = s.count;
    total += s.count;
  }

  res.json({
    success: true,
    stats: {
      total,
      pending: statusMap.pending || 0,
      confirmed: statusMap.confirmed || 0,
      completed: statusMap.completed || 0,
      cancelled: statusMap.cancelled || 0,
      avgDuration: Math.round(avgDurationResult[0]?.avg || 0),
      sessionsByDay,
    },
  });
});

const listBadges = asyncHandler(async (req, res) => {
  const badges = await Badge.find({}).sort({ name: 1 }).lean();
  const enriched = await Promise.all(
    badges.map(async (badge) => {
      const issued = await UserBadge.countDocuments({ badgeId: badge._id });
      return { ...badge, id: String(badge._id), issued };
    })
  );
  res.json({ success: true, badges: enriched });
});

const createBadge = asyncHandler(async (req, res, next) => {
  const { name, description, icon, points, criteria, autoGrant } = req.body;
  if (!name || !name.trim()) return next(new AppError('Badge name is required.', 400));

  const existing = await Badge.findOne({ name: new RegExp('^' + name.trim() + '$', 'i') });
  if (existing) return next(new AppError('A badge with this name already exists.', 409));

  const badge = await Badge.create({ name: name.trim(), description, icon, points, criteria, autoGrant });
  res.status(201).json({ success: true, badge });
});

const updateBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!badge) return next(new AppError('Badge not found.', 404));
  res.json({ success: true, badge });
});

const deleteBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findByIdAndDelete(req.params.id);
  if (!badge) return next(new AppError('Badge not found.', 404));
  await UserBadge.deleteMany({ badgeId: badge._id });
  res.json({ success: true, message: 'Badge and all user-badge references deleted.' });
});

const listCertificates = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ status: 'completed', rating: { $gte: 4 } })
    .populate('mentorId', 'name email')
    .populate('learnerId', 'name email')
    .sort({ completedAt: -1 })
    .lean();

  const certificates = sessions.map((s) => ({
    id: String(s._id),
    topic: s.topic,
    date: s.completedAt || s.date,
    rating: s.rating,
    mentor: s.mentorId,
    learner: s.learnerId,
  }));

  res.json({ success: true, certificates });
});

const listReports = asyncHandler(async (req, res) => {
  const { status, targetType, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (targetType) filter.targetType = targetType;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [reports, total] = await Promise.all([
    Report.find(filter).sort(sort).skip(skip).limit(limitNum)
      .populate('reporterId', 'name email')
      .lean(),
    Report.countDocuments(filter),
  ]);

  res.json({
    success: true,
    reports,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const resolveReport = asyncHandler(async (req, res, next) => {
  const { status, resolution } = req.body;
  if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
    return next(new AppError('Status must be reviewed, resolved, or dismissed.', 400));
  }

  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status, reviewedBy: req.user._id, reviewedAt: new Date(), resolution },
    { new: true, runValidators: true }
  );
  if (!report) return next(new AppError('Report not found.', 404));

  res.json({ success: true, report });
});

const getAIMonitor = asyncHandler(async (req, res) => {
  const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${aiUrl}/health`);
    if (!response.ok) throw new Error('AI service responded with error');
    const data = await response.json();
    res.json({
      success: true,
      aiStatus: 'online',
      uptime: data.uptime || 0,
      graphNodes: data.graph_nodes || 0,
      graphEdges: data.graph_edges || 0,
      version: data.version || 'unknown',
    });
  } catch (err) {
    res.json({
      success: true,
      aiStatus: 'offline',
      uptime: 0,
      graphNodes: 0,
      graphEdges: 0,
      version: null,
    });
  }
});

const getSystemHealth = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

  const io = req.app.get('io');
  const socketStatus = io ? 'operational' : 'unavailable';

  let aiStatus = 'offline';
  let aiData = {};
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${aiUrl}/health`);
    if (response.ok) {
      aiData = await response.json();
      aiStatus = 'online';
    }
  } catch (err) {
    aiStatus = 'offline';
  }

  res.json({
    success: true,
    health: {
      db: { status: dbStatus, readyState: dbState },
      api: { status: 'operational' },
      socket: { status: socketStatus },
      ai: { status: aiStatus, ...aiData },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    },
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [userGrowth, sessionsByStatus, topSkills, connectionTypes, reviewRatings] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: twelveWeeksAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Session.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    UserSkill.aggregate([
      { $group: { _id: '$skillId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'skills', localField: '_id', foreignField: '_id', as: 'skill' } },
      { $unwind: '$skill' },
      { $project: { name: '$skill.name', count: 1 } },
    ]),
    Connection.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    Review.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    analytics: {
      userGrowth,
      sessionsByStatus,
      topSkills,
      connectionTypes,
      reviewRatings,
    },
  });
});

module.exports = {
  getDashboard, listUsers, getUser, updateUser, suspendUser, deleteUserAdmin,
  listInstitutions, createInstitution, updateInstitution, deleteInstitution, mergeInstitutions,
  listSkills, createSkill, updateSkill, deleteSkill, mergeSkills,
  listSessions, getSessionStats,
  listBadges, createBadge, updateBadge, deleteBadge,
  listCertificates,
  listReports, resolveReport,
  getAIMonitor, getSystemHealth, getAnalytics,
};
