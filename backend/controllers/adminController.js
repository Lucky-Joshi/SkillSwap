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
const AdminAuditLog = require('../models/AdminAuditLog');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { deleteUser, deleteUserData } = require('../services/cleanupService');
const { queueTrustRefresh } = require('../services/trustService');

const logAudit = async ({ admin, action, targetType, targetId, targetModel, targetName, reason, notes, ip, previousStatus, newStatus, metadata }) => {
  try {
    await AdminAuditLog.create({ admin, action, targetType, targetId, targetModel, targetName, reason, notes, ip, previousStatus, newStatus, metadata });
  } catch (err) {
    console.warn(`[audit] failed to log ${action}: ${err.message}`);
  }
};

const notifyUser = async (userId, type, title, message, data = {}) => {
  try {
    await Notification.create({ userId, type, title, message, data });
  } catch (err) {
    console.warn(`[notification] failed to send to ${userId}: ${err.message}`);
  }
};

const getClientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';

// ─── Dashboard ──────────────────────────────────────────────────────────────

const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, activeUsers, verifiedUsers,
    suspendedUsers, deletedUsers, bannedUsers,
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
    User.countDocuments({ lastActiveAt: { $gte: sevenDaysAgo }, status: { $nin: ['deleted', 'banned'] } }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ status: 'deleted' }),
    User.countDocuments({ status: 'banned' }),
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
      { $match: { status: { $nin: ['deleted', 'banned'] } } },
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
    User.find({ status: { $nin: ['deleted', 'banned'] } }).sort({ createdAt: -1 }).limit(5).select('name email avatar role isVerified status createdAt'),
  ]);

  res.json({
    success: true,
    dashboard: {
      totalUsers, activeUsers, verifiedUsers,
      suspendedUsers, deletedUsers, bannedUsers,
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

// ─── User List ──────────────────────────────────────────────────────────────

const listUsers = asyncHandler(async (req, res) => {
  const { q, role, status: statusFilter, verified, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  const filter = {};
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { college: rx }];
  }
  if (role) filter.role = role;
  if (statusFilter) {
    filter.status = statusFilter;
  } else {
    filter.status = { $nin: ['deleted'] };
  }
  if (verified !== undefined) filter.isVerified = verified === 'true' || verified === true;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limitNum)
      .select('name email college role isVerified status trustScore points rating profileViews createdAt lastActiveAt avatar isSuspended suspensionReason suspendedUntil banReason bannedAt')
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    users: users.map((u) => ({ ...u, id: String(u._id) })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// ─── Single User ────────────────────────────────────────────────────────────

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

  const recentLogs = await AdminAuditLog.find({ targetId: user._id, targetType: 'user' })
    .populate('admin', 'name email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

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
      auditHistory: recentLogs,
    },
  });
});

// ─── Update User (basic fields: role only) ──────────────────────────────────

const updateUser = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  const updates = {};
  if (role !== undefined) updates.role = role;

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields to update.', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  const previousRole = user.role;
  if (role !== undefined) user.role = role;
  await user.save({ validateModifiedOnly: true });

  await logAudit({
    admin: req.user._id,
    action: 'update_user_role',
    targetType: 'user',
    targetId: user._id,
    targetName: user.name,
    reason: req.body.reason || '',
    ip: getClientIp(req),
    previousStatus: previousRole,
    newStatus: role,
  });

  const updated = await User.findById(user._id).select('-password -verificationToken -resetToken -resetTokenExpiry');
  res.json({ success: true, user: updated });
});

// ─── Verify User ────────────────────────────────────────────────────────────

const verifyUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.status === 'deleted' || user.status === 'banned') {
    return next(new AppError(`Cannot verify a ${user.status} user.`, 400));
  }

  const wasVerified = user.isVerified;
  const previousStatus = user.status;

  if (wasVerified) {
    user.isVerified = false;
    user.verifiedBy = undefined;
    user.verifiedAt = undefined;
    if (user.status === 'verified') user.status = 'active';

    await user.save({ validateModifiedOnly: true });

    await logAudit({
      admin: req.user._id, action: 'unverify_user', targetType: 'user',
      targetId: user._id, targetName: user.name, reason: req.body.reason || '',
      ip: getClientIp(req), previousStatus, newStatus: user.status,
    });

    return res.json({ success: true, message: 'Verification removed.', user: { id: user._id, status: user.status, isVerified: false } });
  }

  user.isVerified = true;
  user.status = 'verified';
  user.verifiedBy = req.user._id;
  user.verifiedAt = new Date();
  await user.save({ validateModifiedOnly: true });

  queueTrustRefresh(user._id);

  await logAudit({
    admin: req.user._id, action: 'verify_user', targetType: 'user',
    targetId: user._id, targetName: user.name, reason: req.body.reason || '',
    ip: getClientIp(req), previousStatus, newStatus: 'verified',
  });

  await notifyUser(user._id, 'user_verified', 'Profile Verified',
    'Congratulations! Your profile has been verified by the SkillSwap Team. Verified users appear higher in Discover and gain higher trust scores.',
    { verifiedBy: req.user._id }
  );

  res.json({ success: true, message: 'User verified.', user: { id: user._id, status: 'verified', isVerified: true } });
});

// ─── Suspend User ───────────────────────────────────────────────────────────

const suspendUser = asyncHandler(async (req, res, next) => {
  const { reason, duration, notes } = req.body;
  if (!reason || !reason.trim()) return next(new AppError('A reason for suspension is required.', 400));

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin' || user.role === 'super-admin') {
    return next(new AppError('Admin accounts cannot be suspended.', 400));
  }

  if (user.status === 'suspended') {
    user.status = 'active';
    user.suspensionReason = '';
    user.suspendedUntil = undefined;
    user.suspendedBy = undefined;
    user.suspensionNotes = '';
    if (user.isVerified) user.status = 'verified';
    await user.save({ validateModifiedOnly: true });

    await logAudit({
      admin: req.user._id, action: 'unsuspend_user', targetType: 'user',
      targetId: user._id, targetName: user.name, reason,
      ip: getClientIp(req), previousStatus: 'suspended', newStatus: user.status,
    });

    await notifyUser(user._id, 'user_reactivated', 'Account Restored',
      'Your account suspension has been lifted. You can now use all features of SkillSwap.'
    );

    return res.json({ success: true, message: 'User unsuspended.', status: user.status });
  }

  const previousStatus = user.status;
  let suspendedUntil = undefined;
  if (duration) {
    const num = parseInt(duration, 10);
    if (!isNaN(num) && num > 0) {
      const unit = req.body.durationUnit || 'days';
      const ms = unit === 'hours' ? num * 3600000 : num * 86400000;
      suspendedUntil = new Date(Date.now() + ms);
    }
  }

  user.status = 'suspended';
  user.suspensionReason = reason.trim();
  user.suspendedUntil = suspendedUntil;
  user.suspendedBy = req.user._id;
  user.suspensionNotes = notes || '';
  await user.save({ validateModifiedOnly: true });

  await logAudit({
    admin: req.user._id, action: 'suspend_user', targetType: 'user',
    targetId: user._id, targetName: user.name, reason: reason.trim(),
    notes: notes || '', ip: getClientIp(req), previousStatus, newStatus: 'suspended',
    metadata: { duration, suspendedUntil },
  });

  const suspensionMsg = suspendedUntil
    ? `Your account has been temporarily suspended.\n\nReason: ${reason}\nSuspended Until: ${suspendedUntil.toLocaleDateString()}`
    : `Your account has been suspended indefinitely.\n\nReason: ${reason}`;

  await notifyUser(user._id, 'user_suspended', 'Account Suspended', suspensionMsg, {
    reason, suspendedUntil, suspendedBy: req.user._id,
  });

  res.json({ success: true, message: 'User suspended.', status: 'suspended', suspendedUntil });
});

// ─── Soft Delete User ───────────────────────────────────────────────────────

const softDeleteUser = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) return next(new AppError('A reason for deletion is required.', 400));

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin' || user.role === 'super-admin') {
    return next(new AppError('Admin accounts cannot be deleted.', 400));
  }
  if (user.status === 'deleted') {
    return next(new AppError('User is already deleted.', 400));
  }

  const previousStatus = user.status;

  await notifyUser(user._id, 'user_deletion_warning', 'Account Deletion Notice',
    'Your account has been marked for deletion. Your profile will be hidden and you will no longer be able to log in. Contact support if this was a mistake.',
    { deletedBy: req.user._id }
  );

  user.status = 'deleted';
  user.deletedAt = new Date();
  user.deletedBy = req.user._id;
  user.deletionType = 'soft';
  user.isActive = false;
  await user.save({ validateModifiedOnly: true });

  await logAudit({
    admin: req.user._id, action: 'soft_delete_user', targetType: 'user',
    targetId: user._id, targetName: user.name, reason: reason.trim(),
    ip: getClientIp(req), previousStatus, newStatus: 'deleted',
  });

  res.json({ success: true, message: 'User soft-deleted. They can be restored later.' });
});

// ─── Permanent Delete User ──────────────────────────────────────────────────

const permanentDeleteUser = asyncHandler(async (req, res, next) => {
  const { confirmation, reason } = req.body;
  if (confirmation !== 'DELETE') {
    return next(new AppError('Type DELETE to confirm permanent deletion.', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin' || user.role === 'super-admin') {
    return next(new AppError('Admin accounts cannot be permanently deleted.', 400));
  }

  const previousStatus = user.status;
  const userName = user.name;

  await Message.updateMany({ sender: user._id }, { $set: { sender: null, message: '[Deleted User]' } });
  await Review.updateMany({ mentor: user._id }, { $set: { mentor: null } });
  await Review.updateMany({ learner: user._id }, { $set: { learner: null } });

  await deleteUserData(user._id);
  await User.findByIdAndDelete(user._id);

  await logAudit({
    admin: req.user._id, action: 'permanent_delete_user', targetType: 'user',
    targetId: user._id, targetName: userName, reason: reason || '',
    ip: getClientIp(req), previousStatus, newStatus: 'permanent',
  });

  res.json({ success: true, message: 'User permanently deleted.' });
});

// ─── Reactivate User ────────────────────────────────────────────────────────

const reactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  const previousStatus = user.status;
  if (!['suspended', 'deleted', 'banned'].includes(previousStatus)) {
    return next(new AppError('User is not in a restricted state.', 400));
  }

  user.status = user.isVerified ? 'verified' : 'active';
  user.suspensionReason = '';
  user.suspendedUntil = undefined;
  user.suspendedBy = undefined;
  user.suspensionNotes = '';
  user.banReason = '';
  user.bannedBy = undefined;
  user.bannedAt = undefined;
  user.deletedAt = undefined;
  user.deletedBy = undefined;
  user.deletionType = '';
  user.isActive = true;
  await user.save({ validateModifiedOnly: true });

  await logAudit({
    admin: req.user._id, action: 'reactivate_user', targetType: 'user',
    targetId: user._id, targetName: user.name, reason: req.body.reason || '',
    ip: getClientIp(req), previousStatus, newStatus: user.status,
  });

  await notifyUser(user._id, 'user_reactivated', 'Account Restored',
    'Your account has been restored. You can now log in and use all features of SkillSwap.'
  );

  res.json({ success: true, message: 'User reactivated.', status: user.status });
});

// ─── Ban User ───────────────────────────────────────────────────────────────

const banUser = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) return next(new AppError('A reason for banning is required.', 400));

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin' || user.role === 'super-admin') {
    return next(new AppError('Admin accounts cannot be banned.', 400));
  }

  const previousStatus = user.status;
  user.status = 'banned';
  user.banReason = reason.trim();
  user.bannedBy = req.user._id;
  user.bannedAt = new Date();
  await user.save({ validateModifiedOnly: true });

  await logAudit({
    admin: req.user._id, action: 'ban_user', targetType: 'user',
    targetId: user._id, targetName: user.name, reason: reason.trim(),
    ip: getClientIp(req), previousStatus, newStatus: 'banned',
  });

  await notifyUser(user._id, 'user_banned', 'Account Banned',
    `Your account has been permanently banned.\n\nReason: ${reason}\n\nContact support if you believe this is an error.`
  );

  res.json({ success: true, message: 'User banned.', status: 'banned' });
});

// ─── Audit Logs ─────────────────────────────────────────────────────────────

const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, targetType, admin, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;
  if (admin) filter.admin = admin;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .populate('admin', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AdminAuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    logs: logs.map((l) => ({ ...l, id: String(l._id) })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// ─── Institutions ───────────────────────────────────────────────────────────

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
  await logAudit({ admin: req.user._id, action: 'create_institution', targetType: 'institution', targetId: institution._id, targetName: institution.name, ip: getClientIp(req) });
  res.status(201).json({ success: true, institution });
});

const updateInstitution = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!institution) return next(new AppError('Institution not found.', 404));
  await logAudit({ admin: req.user._id, action: 'update_institution', targetType: 'institution', targetId: institution._id, targetName: institution.name, ip: getClientIp(req) });
  res.json({ success: true, institution });
});

const deleteInstitution = asyncHandler(async (req, res, next) => {
  const institution = await Institution.findByIdAndDelete(req.params.id);
  if (!institution) return next(new AppError('Institution not found.', 404));
  await logAudit({ admin: req.user._id, action: 'delete_institution', targetType: 'institution', targetId: institution._id, targetName: institution.name, ip: getClientIp(req) });
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

  await logAudit({
    admin: req.user._id, action: 'merge_institutions', targetType: 'institution',
    targetId: target._id, targetName: target.name, ip: getClientIp(req),
    metadata: { sourceNames },
  });

  res.json({ success: true, message: `Merged ${sources.length} institution(s) into ${target.name}.` });
});

// ─── Skills ─────────────────────────────────────────────────────────────────

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
  await logAudit({ admin: req.user._id, action: 'create_skill', targetType: 'skill', targetId: skill._id, targetName: skill.name, ip: getClientIp(req) });
  res.status(201).json({ success: true, skill });
});

const updateSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!skill) return next(new AppError('Skill not found.', 404));
  await logAudit({ admin: req.user._id, action: 'update_skill', targetType: 'skill', targetId: skill._id, targetName: skill.name, ip: getClientIp(req) });
  res.json({ success: true, skill });
});

const deleteSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findByIdAndDelete(req.params.id);
  if (!skill) return next(new AppError('Skill not found.', 404));
  await UserSkill.deleteMany({ skillId: skill._id });
  await logAudit({ admin: req.user._id, action: 'delete_skill', targetType: 'skill', targetId: skill._id, targetName: skill.name, ip: getClientIp(req) });
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

  await logAudit({
    admin: req.user._id, action: 'merge_skills', targetType: 'skill',
    targetId: target._id, targetName: target.name, ip: getClientIp(req),
    metadata: { mergedCount: sources.length },
  });

  res.json({ success: true, message: `Merged ${sources.length} skill(s) into ${target.name}.` });
});

// ─── Sessions ───────────────────────────────────────────────────────────────

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

// ─── Badges ─────────────────────────────────────────────────────────────────

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
  await logAudit({ admin: req.user._id, action: 'create_badge', targetType: 'badge', targetId: badge._id, targetName: badge.name, ip: getClientIp(req) });
  res.status(201).json({ success: true, badge });
});

const updateBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!badge) return next(new AppError('Badge not found.', 404));
  await logAudit({ admin: req.user._id, action: 'update_badge', targetType: 'badge', targetId: badge._id, targetName: badge.name, ip: getClientIp(req) });
  res.json({ success: true, badge });
});

const deleteBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findByIdAndDelete(req.params.id);
  if (!badge) return next(new AppError('Badge not found.', 404));
  await UserBadge.deleteMany({ badgeId: badge._id });
  await logAudit({ admin: req.user._id, action: 'delete_badge', targetType: 'badge', targetId: badge._id, targetName: badge.name, ip: getClientIp(req) });
  res.json({ success: true, message: 'Badge and all user-badge references deleted.' });
});

// ─── Certificates ───────────────────────────────────────────────────────────

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

// ─── Reports ────────────────────────────────────────────────────────────────

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

  await logAudit({
    admin: req.user._id, action: status === 'dismissed' ? 'dismiss_report' : 'resolve_report',
    targetType: 'report', targetId: report._id, reason: resolution || '',
    ip: getClientIp(req), previousStatus: 'pending', newStatus: status,
  });

  res.json({ success: true, report });
});

// ─── AI Monitor ─────────────────────────────────────────────────────────────

const getAIMonitor = asyncHandler(async (req, res) => {
  const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const { default: axios } = await import('axios');
    const { data } = await axios.get(`${aiUrl}/health`, { timeout: 5000 });
    res.json({
      success: true,
      aiStatus: 'online',
      uptime: data.uptime_seconds || 0,
      graphNodes: data.graph_nodes || 0,
      graphEdges: 0,
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
      error: err.message,
    });
  }
});

// ─── System Health ──────────────────────────────────────────────────────────

const getSystemHealth = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

  const io = req.app.get('io');
  const socketStatus = io ? 'operational' : 'unavailable';

  let aiStatus = 'offline';
  let aiData = {};
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const { default: axios } = await import('axios');
    const { data } = await axios.get(`${aiUrl}/health`, { timeout: 5000 });
    aiData = data;
    aiStatus = 'online';
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

// ─── Analytics ──────────────────────────────────────────────────────────────

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
  getDashboard, listUsers, getUser, updateUser, verifyUser, suspendUser,
  softDeleteUser, permanentDeleteUser, reactivateUser, banUser,
  listAuditLogs,
  listInstitutions, createInstitution, updateInstitution, deleteInstitution, mergeInstitutions,
  listSkills, createSkill, updateSkill, deleteSkill, mergeSkills,
  listSessions, getSessionStats,
  listBadges, createBadge, updateBadge, deleteBadge,
  listCertificates,
  listReports, resolveReport,
  getAIMonitor, getSystemHealth, getAnalytics,
};
