const axios = require('axios');
const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { deleteUser } = require('../services/cleanupService');
const { notify } = require('../services/notificationService');
const { queueTrustRefresh } = require('../services/trustService');
const config = require('../config/env');

const actorId = (req) => String(req.user.id || req.user._id);
const getClientIp = (req) => String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
const enumKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const safeUser = (user) => {
  if (!user) return user;
  const { password, verificationToken, resetToken, resetTokenExpiry, ...safe } = user;
  return { ...safe, _id: safe.id };
};
const parsePage = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};
const orderFrom = (sort, allowed, fallback = 'createdAt') => {
  const raw = String(sort || `-${fallback}`);
  const desc = raw.startsWith('-');
  const field = raw.replace(/^-/, '');
  return allowed.includes(field) ? { [field]: desc ? 'desc' : 'asc' } : { [fallback]: 'desc' };
};
const logAudit = async (req, action, targetType, targetId, targetName = '', extra = {}) => {
  try {
    await prisma.adminAuditLog.create({ data: {
      adminId: actorId(req), action, targetType, targetId: targetId ? String(targetId) : null,
      targetModel: targetType === 'user' ? 'User' : targetType, targetName: targetName || '',
      reason: extra.reason || '', notes: extra.notes || '', ip: getClientIp(req),
      previousStatus: extra.previousStatus || '', newStatus: extra.newStatus || '', metadata: extra.metadata,
    } });
  } catch (err) { console.warn(`[audit] ${action} failed: ${err.message}`); }
};
const notifyUser = (userId, type, title, message, data = {}) => notify({ userId, type, title, message, data });
const readUser = async (id) => prisma.user.findUnique({ where: { id } });
const notFound = (message) => new AppError(message, 404);
const userSummarySelect = { id: true, name: true, email: true, avatar: true, role: true, isVerified: true, status: true, trustScore: true, points: true, rating: true, profileViews: true, createdAt: true, lastActiveAt: true, suspensionReason: true, suspendedUntil: true, banReason: true, bannedAt: true };

const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const week = new Date(now.getTime() - 7 * 86400000);
  const month = new Date(now.getTime() - 30 * 86400000);
  const [totalUsers, activeUsers, verifiedUsers, suspendedUsers, deletedUsers, bannedUsers, newUsersThisWeek, newUsersThisMonth,
    totalInstitutions, totalConnections, activeConnections, totalSessions, completedSessions, cancelledSessions,
    sessionsThisWeek, sessionsThisMonth, totalMessages, totalReviews, totalSkills, totalBadges, issuedBadges, totalReports, pendingReports,
    trust, topSkillRows, recentUsers] = await Promise.all([
    prisma.user.count(), prisma.user.count({ where: { lastActiveAt: { gte: week }, status: { notIn: ['deleted', 'banned'] } } }),
    prisma.user.count({ where: { isVerified: true } }), prisma.user.count({ where: { status: 'suspended' } }),
    prisma.user.count({ where: { status: 'deleted' } }), prisma.user.count({ where: { status: 'banned' } }),
    prisma.user.count({ where: { createdAt: { gte: week } } }), prisma.user.count({ where: { createdAt: { gte: month } } }),
    prisma.institution.count(), prisma.connection.count(), prisma.connection.count({ where: { active: true } }),
    prisma.session.count(), prisma.session.count({ where: { status: 'completed' } }), prisma.session.count({ where: { status: 'cancelled' } }),
    prisma.session.count({ where: { createdAt: { gte: week } } }), prisma.session.count({ where: { createdAt: { gte: month } } }),
    prisma.message.count(), prisma.review.count(), prisma.skill.count(), prisma.badge.count(), prisma.userBadge.count(),
    prisma.report.count(), prisma.report.count({ where: { status: 'pending' } }),
    prisma.user.aggregate({ where: { status: { notIn: ['deleted', 'banned'] } }, _avg: { trustScore: true } }),
    prisma.userSkill.groupBy({ by: ['skillId'], _count: { _all: true }, orderBy: { _count: { skillId: 'desc' } }, take: 5 }),
    prisma.user.findMany({ where: { status: { notIn: ['deleted', 'banned'] } }, orderBy: { createdAt: 'desc' }, take: 5, select: userSummarySelect }),
  ]);
  const topSkills = await prisma.skill.findMany({ where: { id: { in: topSkillRows.map((row) => row.skillId) } }, select: { id: true, name: true, icon: true } });
  res.json({ success: true, dashboard: {
    totalUsers, activeUsers, verifiedUsers, suspendedUsers, deletedUsers, bannedUsers, newUsersThisWeek, newUsersThisMonth,
    totalInstitutions, totalConnections, activeConnections, totalSessions, completedSessions, cancelledSessions, sessionsThisWeek,
    sessionsThisMonth, totalMessages, totalReviews, totalSkills, totalBadges, issuedBadges, totalReports, pendingReports,
    avgTrustScore: Math.round((trust._avg.trustScore || 0) * 10) / 10,
    topSkills: topSkillRows.map((row) => ({ ...topSkills.find((skill) => skill.id === row.skillId), count: row._count._all })),
    recentUsers: recentUsers.map(safeUser),
  } });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const where = {};
  if (req.query.q) where.OR = ['name', 'email', 'college'].map((field) => ({ [field]: { contains: String(req.query.q).trim().slice(0, 100), mode: 'insensitive' } }));
  if (req.query.role) where.role = enumKey(req.query.role);
  where.status = req.query.status ? enumKey(req.query.status) : { not: 'deleted' };
  if (req.query.verified !== undefined) where.isVerified = req.query.verified === 'true';
  const orderBy = orderFrom(req.query.sort, ['createdAt', 'name', 'email', 'points', 'rating', 'trustScore', 'lastActiveAt']);
  const [users, total] = await Promise.all([prisma.user.findMany({ where, select: userSummarySelect, orderBy, skip, take: limit }), prisma.user.count({ where })]);
  res.json({ success: true, users: users.map(safeUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await readUser(req.params.id);
  if (!user) throw notFound('User not found.');
  const [skills, activeConnections, completedSessions, reviews, badges, auditHistory] = await Promise.all([
    prisma.userSkill.findMany({ where: { userId: user.id }, include: { skill: { select: { id: true, name: true, category: true, icon: true } } } }),
    prisma.connection.count({ where: { OR: [{ userAId: user.id }, { userBId: user.id }], active: true } }),
    prisma.session.count({ where: { OR: [{ mentorId: user.id }, { learnerId: user.id }], status: 'completed' } }),
    prisma.review.findMany({ where: { OR: [{ mentorId: user.id }, { learnerId: user.id }] }, include: { mentor: { select: { id: true, name: true, email: true, avatar: true } }, learner: { select: { id: true, name: true, email: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true }, orderBy: { earnedAt: 'desc' } }),
    prisma.adminAuditLog.findMany({ where: { targetId: user.id, targetType: 'user' }, include: { admin: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);
  res.json({ success: true, user: { ...safeUser(user), skills, activeConnections, sessionsCompleted: completedSessions, reviews, badges, auditHistory } });
});

const updateUser = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'faculty', 'alumni', 'admin', 'super_admin'].includes(role)) throw new AppError('A valid role is required.', 400);
  const user = await readUser(req.params.id);
  if (!user) throw notFound('User not found.');
  const actor = req.user.role;
  if (user.id === actorId(req)) throw new AppError('You cannot change your own administrator role.', 400);
  if (actor !== 'super_admin' && (['admin', 'super_admin'].includes(role) || ['admin', 'super_admin'].includes(user.role))) {
    throw new AppError('Only a super administrator can change administrator roles.', 403);
  }
  if (['admin', 'super_admin'].includes(user.role) && user.id === actorId(req) && role !== user.role) throw new AppError('You cannot change your own administrator role.', 400);
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role } });
  await logAudit(req, 'update_user_role', 'user', user.id, user.name, { reason: req.body.reason, previousStatus: user.role, newStatus: role });
  res.json({ success: true, user: safeUser(updated) });
});

const verifyUser = asyncHandler(async (req, res) => {
  const user = await readUser(req.params.id);
  if (!user) throw notFound('User not found.');
  if (['deleted', 'banned'].includes(user.status)) throw new AppError(`Cannot verify a ${user.status} user.`, 400);
  const isVerified = !user.isVerified;
  const status = isVerified ? 'verified' : (user.status === 'verified' ? 'active' : user.status);
  await prisma.user.update({ where: { id: user.id }, data: { isVerified, status, verifiedById: isVerified ? actorId(req) : null, verifiedAt: isVerified ? new Date() : null } });
  if (isVerified) queueTrustRefresh(user.id);
  await logAudit(req, isVerified ? 'verify_user' : 'unverify_user', 'user', user.id, user.name, { reason: req.body.reason, previousStatus: user.status, newStatus: status });
  if (isVerified) await notifyUser(user.id, 'user_verified', 'Profile Verified', 'Your profile has been verified by the SkillSwap Team.', { verifiedBy: actorId(req) });
  res.json({ success: true, message: isVerified ? 'User verified.' : 'Verification removed.', user: { id: user.id, status, isVerified } });
});

const suspendUser = asyncHandler(async (req, res) => {
  const user = await readUser(req.params.id);
  if (!user) throw notFound('User not found.');
  if (['admin', 'super_admin'].includes(user.role)) throw new AppError('Admin accounts cannot be suspended.', 400);
  if (user.status === 'suspended') {
    const status = user.isVerified ? 'verified' : 'active';
    await prisma.user.update({ where: { id: user.id }, data: { status, suspensionReason: '', suspendedUntil: null, suspendedById: null, suspensionNotes: '' } });
    await logAudit(req, 'unsuspend_user', 'user', user.id, user.name, { reason: req.body.reason, previousStatus: 'suspended', newStatus: status });
    await notifyUser(user.id, 'user_reactivated', 'Account Restored', 'Your account suspension has been lifted.');
    return res.json({ success: true, message: 'User unsuspended.', status });
  }
  const reason = String(req.body.reason || '').trim();
  if (!reason) throw new AppError('A reason for suspension is required.', 400);
  let suspendedUntil = null;
  const duration = Number.parseInt(req.body.duration, 10);
  if (Number.isFinite(duration) && duration > 0) suspendedUntil = new Date(Date.now() + duration * (req.body.durationUnit === 'hours' ? 3600000 : 86400000));
  await prisma.user.update({ where: { id: user.id }, data: { status: 'suspended', suspensionReason: reason, suspendedUntil, suspendedById: actorId(req), suspensionNotes: req.body.notes || '' } });
  await logAudit(req, 'suspend_user', 'user', user.id, user.name, { reason, notes: req.body.notes, previousStatus: user.status, newStatus: 'suspended', metadata: { duration, suspendedUntil } });
  await notifyUser(user.id, 'user_suspended', 'Account Suspended', suspendedUntil ? `Your account is suspended until ${suspendedUntil.toLocaleDateString()}. Reason: ${reason}` : `Your account has been suspended. Reason: ${reason}`, { reason, suspendedUntil });
  res.json({ success: true, message: 'User suspended.', status: 'suspended', suspendedUntil });
});

const softDeleteUser = asyncHandler(async (req, res) => {
  const user = await readUser(req.params.id);
  if (!user) throw notFound('User not found.');
  if (['admin', 'super_admin'].includes(user.role)) throw new AppError('Admin accounts cannot be deleted.', 400);
  if (user.status === 'deleted') throw new AppError('User is already deleted.', 400);
  const reason = String(req.body.reason || '').trim();
  if (!reason) throw new AppError('A reason for deletion is required.', 400);
  await prisma.user.update({ where: { id: user.id }, data: { status: 'deleted', deletedAt: new Date(), deletedById: actorId(req), deletionType: 'soft' } });
  await logAudit(req, 'soft_delete_user', 'user', user.id, user.name, { reason, previousStatus: user.status, newStatus: 'deleted' });
  await notifyUser(user.id, 'user_deletion_warning', 'Account Deletion Notice', 'Your account has been marked for deletion.', { deletedBy: actorId(req) });
  res.json({ success: true, message: 'User soft-deleted. They can be restored later.' });
});

const permanentDeleteUser = asyncHandler(async (req, res) => {
  if (req.body.confirmation !== 'DELETE') throw new AppError('Type DELETE to confirm permanent deletion.', 400);
  const user = await readUser(req.params.id);
  if (!user) throw notFound('User not found.');
  if (['admin', 'super_admin'].includes(user.role)) throw new AppError('Admin accounts cannot be deleted.', 400);
  await logAudit(req, 'permanent_delete_user', 'user', user.id, user.name, { reason: req.body.reason, previousStatus: user.status, newStatus: 'deleted' });
  await deleteUser(user.id);
  res.json({ success: true, message: 'User permanently deleted.' });
});

const reactivateUser = asyncHandler(async (req, res) => {
  const user = await readUser(req.params.id);
  if (!user) throw notFound('User not found.');
  if (user.status === 'banned') throw new AppError('Banned users must be unbanned first.', 400);
  const status = user.isVerified ? 'verified' : 'active';
  await prisma.user.update({ where: { id: user.id }, data: { status, deletedAt: null, deletedById: null, deletionType: null, suspensionReason: '', suspendedUntil: null, suspendedById: null, suspensionNotes: '' } });
  await logAudit(req, 'reactivate_user', 'user', user.id, user.name, { reason: req.body.reason, previousStatus: user.status, newStatus: status });
  await notifyUser(user.id, 'user_reactivated', 'Account Reactivated', 'Your account has been reactivated.');
  res.json({ success: true, status });
});

const banUser = asyncHandler(async (req, res) => {
  const user = await readUser(req.params.id);
  if (!user) throw notFound('User not found.');
  if (['admin', 'super_admin'].includes(user.role)) throw new AppError('Admin accounts cannot be banned.', 400);
  if (user.status === 'banned') {
    const status = user.isVerified ? 'verified' : 'active';
    await prisma.user.update({ where: { id: user.id }, data: { status, banReason: '', bannedById: null, bannedAt: null } });
    await logAudit(req, 'unban_user', 'user', user.id, user.name, { previousStatus: 'banned', newStatus: status });
    await notifyUser(user.id, 'user_reactivated', 'Account Restored', 'Your account ban has been lifted.');
    return res.json({ success: true, message: 'User unbanned.', status });
  }
  const reason = String(req.body.reason || '').trim();
  if (!reason) throw new AppError('A reason for banning is required.', 400);
  await prisma.user.update({ where: { id: user.id }, data: { status: 'banned', banReason: reason, bannedById: actorId(req), bannedAt: new Date() } });
  await logAudit(req, 'ban_user', 'user', user.id, user.name, { reason, previousStatus: user.status, newStatus: 'banned' });
  await notifyUser(user.id, 'user_banned', 'Account Banned', `Your account has been banned. Reason: ${reason}`, { reason });
  res.json({ success: true, message: 'User banned.', status: 'banned' });
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const where = {};
  if (req.query.action) where.action = enumKey(req.query.action);
  if (req.query.targetType) where.targetType = enumKey(req.query.targetType);
  if (req.query.adminId) where.adminId = req.query.adminId;
  const [logs, total] = await Promise.all([prisma.adminAuditLog.findMany({ where, include: { admin: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }), prisma.adminAuditLog.count({ where })]);
  res.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const listInstitutions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const where = {};
  if (req.query.q) where.OR = ['name', 'city', 'country'].map((field) => ({ [field]: { contains: String(req.query.q).trim(), mode: 'insensitive' } }));
  if (req.query.type) where.type = enumKey(req.query.type);
  const [institutions, total] = await Promise.all([prisma.institution.findMany({ where, orderBy: orderFrom(req.query.sort, ['createdAt', 'name', 'city']), skip, take: limit }), prisma.institution.count({ where })]);
  const counts = await prisma.user.groupBy({ by: ['college'], where: { college: { in: institutions.map((item) => item.name) } }, _count: { _all: true } });
  res.json({ success: true, institutions: institutions.map((item) => ({ ...item, _id: item.id, userCount: counts.find((row) => row.college === item.name)?._count._all || 0 })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const createInstitution = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) throw new AppError('Institution name is required.', 400);
  try {
    const institution = await prisma.institution.create({ data: { name: req.body.name.trim(), city: req.body.city || '', country: req.body.country || '', type: enumKey(req.body.type || 'college') } });
    await logAudit(req, 'create_institution', 'institution', institution.id, institution.name);
    res.status(201).json({ success: true, institution: { ...institution, _id: institution.id } });
  } catch (err) { if (err.code === 'P2002') throw new AppError('An institution with this name already exists.', 409); throw err; }
});
const updateInstitution = asyncHandler(async (req, res) => {
  const data = {};
  for (const key of ['name', 'city', 'country']) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (req.body.type !== undefined) data.type = enumKey(req.body.type);
  const updated = await prisma.institution.update({ where: { id: req.params.id }, data }).catch((err) => { if (err.code === 'P2025') throw notFound('Institution not found.'); throw err; });
  await logAudit(req, 'update_institution', 'institution', updated.id, updated.name);
  res.json({ success: true, institution: { ...updated, _id: updated.id } });
});
const deleteInstitution = asyncHandler(async (req, res) => {
  const row = await prisma.institution.delete({ where: { id: req.params.id } }).catch((err) => { if (err.code === 'P2025') throw notFound('Institution not found.'); throw err; });
  await logAudit(req, 'delete_institution', 'institution', row.id, row.name);
  res.json({ success: true, message: 'Institution deleted.' });
});
const mergeInstitutions = asyncHandler(async (req, res) => {
  const { targetId, sourceIds } = req.body;
  if (!targetId || !Array.isArray(sourceIds) || !sourceIds.length || sourceIds.includes(targetId)) throw new AppError('targetId and sourceIds array are required.', 400);
  const [target, sources] = await Promise.all([prisma.institution.findUnique({ where: { id: targetId } }), prisma.institution.findMany({ where: { id: { in: sourceIds } } })]);
  if (!target) throw notFound('Target institution not found.');
  await prisma.$transaction(async (tx) => {
    for (const source of sources) await tx.user.updateMany({ where: { college: source.name }, data: { college: target.name } });
    await tx.institution.deleteMany({ where: { id: { in: sources.map((item) => item.id) } } });
  });
  await logAudit(req, 'merge_institutions', 'institution', target.id, target.name, { metadata: { sourceNames: sources.map((item) => item.name) } });
  res.json({ success: true, message: `Merged ${sources.length} institution(s) into ${target.name}.` });
});

const listSkills = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const where = {};
  if (req.query.q) where.OR = [{ name: { contains: String(req.query.q).trim(), mode: 'insensitive' } }, { aliases: { has: String(req.query.q).trim() } }];
  if (req.query.category) where.category = enumKey(req.query.category);
  const [skills, total] = await Promise.all([prisma.skill.findMany({ where, orderBy: orderFrom(req.query.sort, ['createdAt', 'name', 'category', 'difficulty']), skip, take: limit }), prisma.skill.count({ where })]);
  const counts = await prisma.userSkill.groupBy({ by: ['skillId'], where: { skillId: { in: skills.map((row) => row.id) } }, _count: { _all: true } });
  res.json({ success: true, skills: skills.map((row) => ({ ...row, _id: row.id, userCount: counts.find((item) => item.skillId === row.id)?._count._all || 0 })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
const createSkill = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) throw new AppError('Skill name is required.', 400);
  try {
    const skill = await prisma.skill.create({ data: { name: req.body.name.trim(), aliases: req.body.aliases || [], category: enumKey(req.body.category || 'other'), difficulty: enumKey(req.body.difficulty || 'beginner'), icon: req.body.icon || '⭐' } });
    await logAudit(req, 'create_skill', 'skill', skill.id, skill.name);
    res.status(201).json({ success: true, skill: { ...skill, _id: skill.id } });
  } catch (err) { if (err.code === 'P2002') throw new AppError('A skill with this name already exists.', 409); throw err; }
});
const updateSkill = asyncHandler(async (req, res) => {
  const data = {};
  for (const key of ['name', 'aliases', 'icon']) if (req.body[key] !== undefined) data[key] = req.body[key];
  for (const key of ['category', 'difficulty']) if (req.body[key] !== undefined) data[key] = enumKey(req.body[key]);
  const updated = await prisma.skill.update({ where: { id: req.params.id }, data }).catch((err) => { if (err.code === 'P2025') throw notFound('Skill not found.'); throw err; });
  await logAudit(req, 'update_skill', 'skill', updated.id, updated.name);
  res.json({ success: true, skill: { ...updated, _id: updated.id } });
});
const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await prisma.skill.delete({ where: { id: req.params.id } }).catch((err) => { if (err.code === 'P2025') throw notFound('Skill not found.'); throw err; });
  await logAudit(req, 'delete_skill', 'skill', skill.id, skill.name);
  res.json({ success: true, message: 'Skill and its references deleted.' });
});
const mergeSkills = asyncHandler(async (req, res) => {
  const { targetId, sourceIds } = req.body;
  if (!targetId || !Array.isArray(sourceIds) || !sourceIds.length || sourceIds.includes(targetId)) throw new AppError('targetId and sourceIds array are required.', 400);
  const target = await prisma.skill.findUnique({ where: { id: targetId } });
  if (!target) throw notFound('Target skill not found.');
  const sources = await prisma.skill.findMany({ where: { id: { in: sourceIds } }, include: { userSkills: true } });
  await prisma.$transaction(async (tx) => {
    for (const source of sources) {
      await tx.connectionSkill.updateMany({ where: { skillId: source.id }, data: { skillId: target.id } });
      for (const row of source.userSkills) {
        await tx.userSkill.upsert({ where: { userId_skillId: { userId: row.userId, skillId: target.id } }, create: { userId: row.userId, skillId: target.id, level: row.level, canTeach: row.canTeach, wantToLearn: row.wantToLearn, verified: row.verified }, update: { level: Math.max(row.level, 1), canTeach: row.canTeach, wantToLearn: row.wantToLearn, verified: row.verified } });
      }
      const endorsements = await tx.endorsement.findMany({ where: { skillId: source.id } });
      for (const row of endorsements) await tx.endorsement.upsert({ where: { userId_skillId_endorserId: { userId: row.userId, skillId: target.id, endorserId: row.endorserId } }, create: { userId: row.userId, skillId: target.id, endorserId: row.endorserId }, update: {} });
      await tx.skill.delete({ where: { id: source.id } });
    }
    const aliases = [...new Set([...target.aliases, target.name, ...sources.flatMap((source) => [source.name, ...source.aliases])])].filter((name) => name !== target.name);
    await tx.skill.update({ where: { id: target.id }, data: { aliases } });
  });
  await logAudit(req, 'merge_skills', 'skill', target.id, target.name, { metadata: { mergedCount: sources.length } });
  res.json({ success: true, message: `Merged ${sources.length} skill(s) into ${target.name}.` });
});

const listSessions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const where = {};
  if (req.query.status) where.status = enumKey(req.query.status);
  if (req.query.from || req.query.to) where.createdAt = { ...(req.query.from ? { gte: new Date(req.query.from) } : {}), ...(req.query.to ? { lte: new Date(req.query.to) } : {}) };
  const [sessions, total] = await Promise.all([prisma.session.findMany({ where, include: { mentor: { select: { id: true, name: true, email: true, avatar: true } }, learner: { select: { id: true, name: true, email: true, avatar: true } } }, orderBy: orderFrom(req.query.sort, ['createdAt', 'date', 'status']), skip, take: limit }), prisma.session.count({ where })]);
  res.json({ success: true, sessions: sessions.map((row) => ({ ...row, _id: row.id })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
const getSessionStats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 86400000);
  const [statusRows, duration, recent] = await Promise.all([prisma.session.groupBy({ by: ['status'], _count: { _all: true } }), prisma.session.aggregate({ where: { status: 'completed' }, _avg: { duration: true } }), prisma.session.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })]);
  const sessionsByDay = new Map();
  for (const row of recent) { const day = row.createdAt.toISOString().slice(0, 10); sessionsByDay.set(day, (sessionsByDay.get(day) || 0) + 1); }
  const counts = Object.fromEntries(statusRows.map((row) => [row.status, row._count._all]));
  res.json({ success: true, stats: { total: Object.values(counts).reduce((sum, count) => sum + count, 0), pending: counts.pending || 0, confirmed: counts.confirmed || 0, completed: counts.completed || 0, cancelled: counts.cancelled || 0, avgDuration: Math.round(duration._avg.duration || 0), sessionsByDay: [...sessionsByDay].sort(([a], [b]) => a.localeCompare(b)).map(([_id, count]) => ({ _id, count })) } });
});

const listBadges = asyncHandler(async (req, res) => {
  const badges = await prisma.badge.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { userBadges: true } } } });
  res.json({ success: true, badges: badges.map(({ _count, ...badge }) => ({ ...badge, _id: badge.id, issued: _count.userBadges })) });
});
const createBadge = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) throw new AppError('Badge name is required.', 400);
  try {
    const badge = await prisma.badge.create({ data: { name: req.body.name.trim(), description: req.body.description || '', icon: req.body.icon || '🏅', points: Number(req.body.points) || 10, criteria: req.body.criteria || '', autoGrant: req.body.autoGrant !== false } });
    await logAudit(req, 'create_badge', 'badge', badge.id, badge.name);
    res.status(201).json({ success: true, badge: { ...badge, _id: badge.id } });
  } catch (err) { if (err.code === 'P2002') throw new AppError('A badge with this name already exists.', 409); throw err; }
});
const updateBadge = asyncHandler(async (req, res) => {
  const data = {};
  for (const key of ['name', 'description', 'icon', 'criteria', 'autoGrant']) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (req.body.points !== undefined) data.points = Number(req.body.points);
  const updated = await prisma.badge.update({ where: { id: req.params.id }, data }).catch((err) => { if (err.code === 'P2025') throw notFound('Badge not found.'); throw err; });
  await logAudit(req, 'update_badge', 'badge', updated.id, updated.name);
  res.json({ success: true, badge: { ...updated, _id: updated.id } });
});
const deleteBadge = asyncHandler(async (req, res) => {
  const badge = await prisma.badge.delete({ where: { id: req.params.id } }).catch((err) => { if (err.code === 'P2025') throw notFound('Badge not found.'); throw err; });
  await logAudit(req, 'delete_badge', 'badge', badge.id, badge.name);
  res.json({ success: true, message: 'Badge and all user-badge references deleted.' });
});

const listCertificates = asyncHandler(async (req, res) => {
  const sessions = await prisma.session.findMany({ where: { status: 'completed', rating: { gte: 4 } }, include: { mentor: { select: { id: true, name: true, email: true } }, learner: { select: { id: true, name: true, email: true } } }, orderBy: { completedAt: 'desc' } });
  res.json({ success: true, certificates: sessions.map((row) => ({ id: row.id, topic: row.topic, date: row.completedAt || row.date, rating: row.rating, mentor: row.mentor, learner: row.learner })) });
});
const listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const where = {};
  if (req.query.status) where.status = enumKey(req.query.status);
  if (req.query.targetType) where.targetType = enumKey(req.query.targetType);
  const [reports, total] = await Promise.all([prisma.report.findMany({ where, include: { reporter: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }), prisma.report.count({ where })]);
  res.json({ success: true, reports: reports.map((row) => ({ ...row, _id: row.id, reporterId: row.reporter })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
const resolveReport = asyncHandler(async (req, res) => {
  const status = enumKey(req.body.status);
  if (!['reviewed', 'resolved', 'dismissed'].includes(status)) throw new AppError('Status must be reviewed, resolved, or dismissed.', 400);
  const report = await prisma.report.update({ where: { id: req.params.id }, data: { status, reviewedById: actorId(req), reviewedAt: new Date(), resolution: req.body.resolution || '' } }).catch((err) => { if (err.code === 'P2025') throw notFound('Report not found.'); throw err; });
  await logAudit(req, status === 'dismissed' ? 'dismiss_report' : 'resolve_report', 'report', report.id, '', { reason: report.resolution, previousStatus: 'pending', newStatus: status });
  res.json({ success: true, report: { ...report, _id: report.id } });
});

const getAIMonitor = asyncHandler(async (req, res) => {
  try {
    const { data } = await axios.get(`${config.aiServiceUrl}/health`, { timeout: config.aiServiceTimeout });
    res.json({ success: true, aiStatus: 'online', uptime: data.uptime_seconds || 0, graphNodes: data.graph_nodes || 0, graphEdges: data.graph_edges || 0, version: data.version || 'unknown' });
  } catch (err) { res.json({ success: true, aiStatus: 'offline', uptime: 0, graphNodes: 0, graphEdges: 0, version: null, error: err.message }); }
});
const getSystemHealth = asyncHandler(async (req, res) => {
  let db = 'connected';
  try { await prisma.$queryRaw`SELECT 1`; } catch { db = 'disconnected'; }
  let ai = 'offline';
  try { await axios.get(`${config.aiServiceUrl}/health`, { timeout: config.aiServiceTimeout }); ai = 'online'; } catch {}
  res.json({ success: true, health: { db: { status: db }, api: { status: 'operational' }, socket: { status: req.app.get('io') ? 'operational' : 'unavailable' }, ai: { status: ai }, server: { uptime: process.uptime(), memory: process.memoryUsage(), nodeVersion: process.version } } });
});
const getAnalytics = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 86400000);
  const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000);
  const [users, sessionsByStatus, skillRows, connectionTypes, reviews] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: twelveWeeksAgo } }, select: { createdAt: true } }),
    prisma.session.groupBy({ by: ['status'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.userSkill.groupBy({ by: ['skillId'], _count: { _all: true }, orderBy: { _count: { skillId: 'desc' } }, take: 10 }),
    prisma.connection.groupBy({ by: ['type'], _count: { _all: true } }),
    prisma.review.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, rating: true } }),
  ]);
  const skills = await prisma.skill.findMany({ where: { id: { in: skillRows.map((row) => row.skillId) } }, select: { id: true, name: true } });
  const groupCounts = (rows, key) => Object.fromEntries(rows.map((row) => [row[key], row._count._all]));
  const weekly = new Map();
  for (const row of users) { const date = new Date(row.createdAt); const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); const key = monday.toISOString().slice(0, 10); weekly.set(key, (weekly.get(key) || 0) + 1); }
  const dailyReviews = new Map();
  for (const row of reviews) { const key = row.createdAt.toISOString().slice(0, 10); const value = dailyReviews.get(key) || { sum: 0, count: 0 }; value.sum += row.rating; value.count += 1; dailyReviews.set(key, value); }
  res.json({ success: true, analytics: {
    userGrowth: [...weekly].sort(([a], [b]) => a.localeCompare(b)).map(([_id, count]) => ({ _id, count })),
    sessionsByStatus: Object.entries(groupCounts(sessionsByStatus, 'status')).map(([_id, count]) => ({ _id, count })),
    topSkills: skillRows.map((row) => ({ _id: row.skillId, name: skills.find((skill) => skill.id === row.skillId)?.name || '', count: row._count._all })),
    connectionTypes: connectionTypes.map((row) => ({ _id: row.type, count: row._count._all })),
    reviewRatings: [...dailyReviews].sort(([a], [b]) => a.localeCompare(b)).map(([_id, value]) => ({ _id, avgRating: value.sum / value.count, count: value.count })),
  } });
});

module.exports = { getDashboard, listUsers, getUser, updateUser, verifyUser, suspendUser, softDeleteUser, permanentDeleteUser, reactivateUser, banUser, listAuditLogs, listInstitutions, createInstitution, updateInstitution, deleteInstitution, mergeInstitutions, listSkills, createSkill, updateSkill, deleteSkill, mergeSkills, listSessions, getSessionStats, listBadges, createBadge, updateBadge, deleteBadge, listCertificates, listReports, resolveReport, getAIMonitor, getSystemHealth, getAnalytics };
