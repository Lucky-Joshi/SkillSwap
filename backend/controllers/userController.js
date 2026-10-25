const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { publicUserPrisma } = require('../services/userServicePrisma');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const { deleteUser } = require('../services/cleanupService');
const { paginate } = require('../utils/paginate');
const config = require('../config/env');

const userId = (user) => String(user.id || user._id);
const enumKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const qualificationToDb = (value) => enumKey(value);
const yearToDb = (value) => value === 'Graduate' || value === 'graduate' ? 'graduate' : `year${value}`;
const cleanUser = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return { ...safe, _id: safe.id };
};
const exactSkill = (name) => ({
  OR: [
    { name: { equals: name, mode: 'insensitive' } },
    { aliases: { has: name } },
  ],
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: await publicUserPrisma(userId(req.user), userId(req.user)) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const fields = [
    'name', 'bio', 'introduction', 'teachingPhilosophy', 'learningGoals', 'preferredLearningStyle',
    'languages', 'interests', 'timezone', 'location', 'college', 'department', 'graduationYear',
    'avatar', 'coverPhoto', 'github', 'linkedin', 'portfolio', 'socialLinks', 'availability',
    'availabilitySchedule', 'projects', 'educationHistory', 'achievements', 'certificates',
  ];
  const data = {};
  for (const key of fields) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (req.body.qualification !== undefined) data.qualification = req.body.qualification ? qualificationToDb(req.body.qualification) : null;
  if (req.body.year !== undefined) data.year = req.body.year ? yearToDb(req.body.year) : null;
  const updated = await prisma.user.update({ where: { id: userId(req.user) }, data }).catch((err) => {
    if (err.code === 'P2025') throw new AppError('User not found.', 404);
    throw err;
  });
  await evaluateBadges(updated.id);
  queueTrustRefresh(updated.id);
  res.json({ success: true, user: await publicUserPrisma(updated.id, updated.id) });
});

const updatePrivacy = asyncHandler(async (req, res) => {
  const fields = ['profileVisibility', 'showEmail', 'showCollege', 'showContact', 'showAvailability', 'showPortfolioLinks'];
  const current = req.user.privacy && typeof req.user.privacy === 'object' ? req.user.privacy : {};
  const privacy = { ...current };
  for (const key of fields) if (req.body[key] !== undefined) privacy[key] = req.body[key];
  if (req.body.visibility !== undefined) privacy.visibility = req.body.visibility;
  const visibility = req.body.visibility || req.body.profileVisibility;
  if (visibility && !['public', 'members', 'private'].includes(visibility)) throw new AppError('Invalid profile visibility.', 400);
  const updated = await prisma.user.update({ where: { id: userId(req.user) }, data: { privacy, ...(visibility ? { profileVisibility: visibility } : {}) } });
  res.json({ success: true, privacy: updated.privacy });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found.', 404);
  const viewerId = userId(req.user);
  if (viewerId !== user.id) await prisma.user.update({ where: { id: user.id }, data: { profileViews: { increment: 1 } } });
  const profile = await publicUserPrisma(user.id, viewerId);
  if (viewerId !== user.id) {
    const { findRelationship, getRelationshipStats } = require('../services/mentorshipService');
    const rel = await findRelationship(viewerId, user.id);
    if (rel) {
      profile.relationship = {
        id: rel.id,
        type: rel.type,
        status: rel.status,
        active: rel.active,
        role: rel.type === 'peer' ? 'peer' : (rel.userAId === viewerId ? 'mentor' : 'learner'),
        acceptedAt: rel.acceptedAt,
        stats: await getRelationshipStats(viewerId, user.id),
      };
    }
  }
  res.json({ success: true, user: profile });
});

const getPortfolio = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found.', 404);
  const [profile, reviews, endorsements, badges, sessionsAsMentor, sessionsAsLearner, completedSessions, connections] = await Promise.all([
    publicUserPrisma(user.id, userId(req.user)),
    prisma.review.findMany({ where: { mentorId: user.id }, include: { learner: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.endorsement.groupBy({ by: ['skillId'], where: { userId: user.id }, _count: { _all: true } }),
    prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true }, orderBy: { earnedAt: 'desc' } }),
    prisma.session.count({ where: { mentorId: user.id, status: 'completed' } }),
    prisma.session.count({ where: { learnerId: user.id, status: 'completed' } }),
    prisma.session.findMany({ where: { OR: [{ mentorId: user.id }, { learnerId: user.id }], status: 'completed' }, orderBy: { completedAt: 'desc' }, take: 10 }),
    prisma.connection.findMany({ where: { OR: [{ userAId: user.id }, { userBId: user.id }], status: 'accepted', active: true }, select: { userAId: true, userBId: true, type: true } }),
  ]);
  const skills = await prisma.skill.findMany({ where: { id: { in: endorsements.map((entry) => entry.skillId) } }, select: { id: true, name: true, icon: true, category: true } });
  const endorsementSummary = endorsements.map((entry) => {
    const skill = skills.find((item) => item.id === entry.skillId);
    return { skillId: entry.skillId, skillName: skill?.name || 'Unknown', skillIcon: skill?.icon || '📚', skillCategory: skill?.category || '', count: entry._count._all,
      hasEndorsed: false };
  });
  const recentActivity = [
    ...completedSessions.slice(0, 5).map((session) => ({ type: 'session', title: `Completed "${session.topic}" session`, date: session.completedAt, role: session.mentorId === user.id ? 'mentor' : 'learner' })),
    ...badges.slice(0, 5).map((entry) => ({ type: 'badge', title: `Earned "${entry.badge.name}" badge`, date: entry.earnedAt })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const connectionStats = { mentors: 0, learners: 0, peers: 0 };
  for (const connection of connections) {
    if (connection.type === 'peer') connectionStats.peers += 1;
    else if (connection.userAId === user.id) connectionStats.mentors += 1;
    else connectionStats.learners += 1;
  }
  res.json({ success: true, portfolio: {
    user: profile,
    reviews: reviews.map((review) => ({ ...review, _id: review.id, mentor: review.mentorId, learner: { ...review.learner, _id: review.learner.id }, sessionId: review.sessionId })),
    endorsements: endorsementSummary,
    badges: badges.map(({ id, badge, earnedAt }) => ({ id, name: badge.name, description: badge.description, icon: badge.icon, points: badge.points, earnedAt })),
    stats: { sessionsAsMentor, sessionsAsLearner, totalSessions: sessionsAsMentor + sessionsAsLearner, hoursTaught: user.hoursTaught, hoursLearned: user.hoursLearned, totalHours: user.hoursTaught + user.hoursLearned, rating: user.rating, reviewCount: user.reviewCount, points: user.points, profileViews: user.profileViews, learningStreak: user.learningStreak, teachingStreak: user.teachingStreak },
    connections: connectionStats,
    certificates: completedSessions.map((session) => ({ id: session.id, topic: session.topic, completedAt: session.completedAt, hours: session.duration / 60, role: session.mentorId === user.id ? 'mentor' : 'learner' })),
    activity: recentActivity,
    ratingBreakdown: { teaching: rating, communication: rating, punctuality: rating, knowledge: rating, friendliness: rating },
  } });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { search, skill, department, year, availability, college, qualification, mentor, verified } = req.query;
  const { page, limit, skip } = paginate(req);
  const where = { id: { not: userId(req.user) }, role: { notIn: ['admin', 'super_admin'] }, status: { notIn: ['suspended', 'deleted', 'banned'] } };
  where.profileVisibility = { not: 'private' };
  if (search) where.OR = ['name', 'bio', 'college'].map((field) => ({ [field]: { contains: String(search).slice(0, 100), mode: 'insensitive' } }));
  if (department) where.department = department;
  if (year) where.year = yearToDb(year);
  if (availability) where.availability = availability;
  if (college) where.college = { contains: String(college).slice(0, 100), mode: 'insensitive' };
  if (qualification) where.qualification = qualificationToDb(qualification);
  if (verified === 'true') where.isVerified = true;
  let skillIds;
  if (skill) {
    const found = await prisma.skill.findFirst({ where: exactSkill(String(skill).trim()) });
    if (!found) return res.json({ success: true, users: [], meta: { total: 0, page, limit, totalPages: 1, hasMore: false } });
    skillIds = [found.id];
  }
  if (mentor === 'true' || mentor === 'false' || skillIds) {
    const userSkills = await prisma.userSkill.findMany({ where: { ...(skillIds ? { skillId: { in: skillIds } } : {}), ...(mentor === 'true' ? { canTeach: true } : {}), ...(mentor === 'false' ? { wantToLearn: true } : {}) }, select: { userId: true } });
    where.id = { not: userId(req.user), in: [...new Set(userSkills.map((row) => row.userId))] };
  }
  const orderBy = req.query.sort === 'rating' ? [{ rating: 'desc' }] : req.query.sort === 'name' ? [{ name: 'asc' }] : req.query.sort === 'newest' ? [{ createdAt: 'desc' }] : [{ points: 'desc' }, { rating: 'desc' }];
  const [users, total] = await Promise.all([prisma.user.findMany({ where, orderBy, skip, take: limit }), prisma.user.count({ where })]);
  res.json({ success: true, users: await Promise.all(users.map((item) => publicUserPrisma(item.id, userId(req.user)))), meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1), hasMore: page * limit < total } });
});

const updateImage = (field) => asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload an image.', 400);
  const value = `${config.uploadDir}/${req.file.filename}`;
  const user = await prisma.user.update({ where: { id: userId(req.user) }, data: { [field]: value } });
  if (field === 'avatar') queueTrustRefresh(user.id);
  res.json({ success: true, [field]: value, user: await publicUserPrisma(user.id, userId(req.user)) });
});
const uploadAvatar = updateImage('avatar');
const uploadCoverPhoto = updateImage('coverPhoto');

const endorseSkill = asyncHandler(async (req, res) => {
  const { userId: targetId, skillId } = req.body;
  const endorserId = userId(req.user);
  if (!targetId || !skillId) throw new AppError('userId and skillId are required.', 400);
  if (targetId === endorserId) throw new AppError('You cannot endorse your own skills.', 400);
  const hasSkill = await prisma.userSkill.findUnique({ where: { userId_skillId: { userId: targetId, skillId } } });
  if (!hasSkill) throw new AppError('This user does not have this skill.', 400);
  const existing = await prisma.endorsement.findUnique({ where: { userId_skillId_endorserId: { userId: targetId, skillId, endorserId } } });
  if (existing) {
    await prisma.endorsement.delete({ where: { id: existing.id } });
    return res.json({ success: true, endorsed: false });
  }
  await prisma.endorsement.create({ data: { userId: targetId, skillId, endorserId } });
  res.json({ success: true, endorsed: true });
});

const getEndorsements = asyncHandler(async (req, res) => {
  const rows = await prisma.endorsement.findMany({ where: { userId: req.params.id }, include: { skill: true }, orderBy: { createdAt: 'desc' } });
  const groups = new Map();
  for (const row of rows) {
    const current = groups.get(row.skillId) || { skillId: row.skillId, skillName: row.skill.name, skillIcon: row.skill.icon, count: 0, endorsers: [] };
    current.count += 1;
    current.endorsers.push(row.endorserId);
    groups.set(row.skillId, current);
  }
  const endorsements = [...groups.values()].sort((a, b) => b.count - a.count).map(({ endorsers, ...entry }) => ({ ...entry, hasEndorsed: endorsers.includes(userId(req.user)) }));
  res.json({ success: true, endorsements });
});

const addSkill = asyncHandler(async (req, res) => {
  const { skillId, skillName, level = 3, canTeach = false, wantToLearn = true } = req.body;
  const skill = skillId ? await prisma.skill.findUnique({ where: { id: skillId } }) : skillName ? await prisma.skill.findFirst({ where: exactSkill(skillName.trim()) }) : null;
  if (!skill) throw new AppError('Skill not found.', 404);
  const row = await prisma.userSkill.upsert({ where: { userId_skillId: { userId: userId(req.user), skillId: skill.id } }, create: { userId: userId(req.user), skillId: skill.id, level, canTeach, wantToLearn }, update: { level, canTeach, wantToLearn } });
  await evaluateBadges(userId(req.user));
  queueTrustRefresh(userId(req.user));
  res.status(201).json({ success: true, skill: { ...row, _id: row.id, skillId: skill.id }, user: await publicUserPrisma(userId(req.user), userId(req.user)) });
});

const updateSkill = asyncHandler(async (req, res) => {
  const row = await prisma.userSkill.findFirst({ where: { id: req.params.userSkillId, userId: userId(req.user) } });
  if (!row) throw new AppError('Skill entry not found.', 404);
  const data = {};
  for (const key of ['level', 'canTeach', 'wantToLearn']) if (req.body[key] !== undefined) data[key] = req.body[key];
  const updated = await prisma.userSkill.update({ where: { id: row.id }, data });
  queueTrustRefresh(userId(req.user));
  res.json({ success: true, skill: { ...updated, _id: updated.id }, user: await publicUserPrisma(userId(req.user), userId(req.user)) });
});

const removeSkill = asyncHandler(async (req, res) => {
  const result = await prisma.userSkill.deleteMany({ where: { id: req.params.userSkillId, userId: userId(req.user) } });
  if (!result.count) throw new AppError('Skill entry not found.', 404);
  queueTrustRefresh(userId(req.user));
  res.json({ success: true, user: await publicUserPrisma(userId(req.user), userId(req.user)) });
});

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload a resume (PDF/DOCX/TXT).', 400);
  const fs = require('fs');
  const aiClient = require('../services/aiClient');
  let extracted = [];
  try {
    const { data } = await aiClient.client.post('/resume/parse', { file_path: req.file.path });
    extracted = data?.skills || [];
  } catch {
    const content = fs.readFileSync(req.file.path, 'utf8').toLowerCase();
    extracted = ['python', 'javascript', 'typescript', 'java', 'react', 'node.js', 'sql', 'postgresql', 'docker', 'aws', 'figma'].filter((term) => content.includes(term));
  } finally {
    fs.promises.unlink(req.file.path).catch(() => {});
  }
  const skills = await prisma.skill.findMany();
  const matched = skills.filter((skill) => extracted.some((entry) => skill.name.toLowerCase() === entry.toLowerCase() || skill.aliases.some((alias) => alias.toLowerCase() === entry.toLowerCase())));
  await prisma.$transaction(matched.map((skill) => prisma.userSkill.upsert({ where: { userId_skillId: { userId: userId(req.user), skillId: skill.id } }, create: { userId: userId(req.user), skillId: skill.id, canTeach: true, wantToLearn: false, level: 3 }, update: { canTeach: true, wantToLearn: false } })));
  res.json({ success: true, extracted: extracted.slice(0, 40), added: matched.map((skill) => skill.name), user: await publicUserPrisma(userId(req.user), userId(req.user)) });
});

const deleteMyAccount = asyncHandler(async (req, res) => {
  await deleteUser(userId(req.user));
  res.json({ success: true, message: 'Your account and all associated data were deleted.' });
});

module.exports = { getProfile, updateProfile, updatePrivacy, getUser, getPortfolio, searchUsers, uploadAvatar, uploadCoverPhoto, endorseSkill, getEndorsements, addSkill, updateSkill, removeSkill, uploadResume, deleteMyAccount };
