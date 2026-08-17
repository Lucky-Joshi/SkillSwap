const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { publicUser } = require('../services/userService');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const { deleteUser } = require('../services/cleanupService');
const { paginate } = require('../utils/paginate');
const config = require('../config/env');

// @route  GET /api/users/profile
// @access private
const getProfile = asyncHandler(async (req, res) => {
  const profile = await publicUser(req.user);
  res.json({ success: true, user: profile });
});

// @route  PUT /api/users/profile
// @access private
const updateProfile = asyncHandler(async (req, res, next) => {
  const allowed = [
    'name', 'bio', 'college', 'qualification', 'department', 'year', 'avatar',
    'github', 'linkedin', 'portfolio', 'availability', 'projects', 'achievements', 'certificates',
  ];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found.', 404);

  await evaluateBadges(user._id);
  queueTrustRefresh(user._id);
  const profile = await publicUser(user);
  res.json({ success: true, user: profile });
});

// @route  GET /api/users/:id
// @access private
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  const profile = await publicUser(user);

  // Relationship context for the viewer (drives profile actions).
  if (String(req.user._id) !== String(user._id)) {
    const { findRelationship, getRelationshipStats } = require('../services/mentorshipService');
    const rel = await findRelationship(req.user._id, user._id);
    if (rel) {
      const stats = await getRelationshipStats(req.user._id, user._id);
      profile.relationship = {
        id: rel._id,
        type: rel.type,
        status: rel.status,
        active: rel.active,
        role: rel.type === 'peer' ? 'peer' : (String(rel.userA) === String(req.user._id) ? 'mentor' : 'learner'),
        acceptedAt: rel.acceptedAt,
        stats,
      };
    }
  }

  res.json({ success: true, user: profile });
});

// @route  GET /api/users?search=&skill=&department=&year=&availability=&page=&limit=
// @access private
const searchUsers = asyncHandler(async (req, res) => {
  const { search, skill, department, year, availability } = req.query;
  const { page, limit, skip } = paginate(req);
  const filter = { _id: { $ne: req.user._id } };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) filter.department = department;
  if (year) filter.year = year;
  if (availability) filter.availability = availability;

  if (skill && skill.trim()) {
    const skillDoc = await Skill.findOne({
      $or: [{ name: { $regex: `^${skill.trim()}$`, $options: 'i' } }, { aliases: { $regex: `^${skill.trim()}$`, $options: 'i' } }],
    });
    if (skillDoc) {
      const skillUsers = await UserSkill.find({ skillId: skillDoc._id }).distinct('userId');
      filter._id = { $ne: req.user._id, $in: skillUsers };
    } else {
      return res.json({ success: true, users: [], meta: { total: 0, page, limit, totalPages: 1, hasMore: false } });
    }
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ isTest: 1, points: -1, rating: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const profiles = [];
  for (const u of users) profiles.push(await publicUser(u));
  res.json({ success: true, users: profiles, meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1), hasMore: page * limit < total } });
});

// @route  PUT /api/users/avatar
// @access private (multer)
const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) throw new AppError('Please upload an image.', 400);
  const avatar = `${config.uploadDir}/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
  queueTrustRefresh(user._id);
  res.json({ success: true, avatar, user: await publicUser(user) });
});

// @route  POST /api/users/skills  { skillId | skillName, level, canTeach, wantToLearn }
// @access private
const addSkill = asyncHandler(async (req, res, next) => {
  const { skillId, skillName, level, canTeach, wantToLearn } = req.body;

  let skill;
  if (skillId) {
    skill = await Skill.findById(skillId);
  } else if (skillName) {
    skill = await Skill.findOne({ name: { $regex: `^${skillName}$`, $options: 'i' } });
  }
  if (!skill) throw new AppError('Skill not found.', 404);

  const existing = await UserSkill.findOneAndUpdate(
    { userId: req.user._id, skillId: skill._id },
    {
      level: level ?? 3,
      canTeach: canTeach ?? false,
      wantToLearn: wantToLearn ?? true,
    },
    { new: true, upsert: true }
  );

  await evaluateBadges(req.user._id);
  queueTrustRefresh(req.user._id);
  res.status(201).json({ success: true, skill: existing, user: await publicUser(req.user) });
});

// @route  PUT /api/users/skills/:userSkillId
// @access private
const updateSkill = asyncHandler(async (req, res, next) => {
  const us = await UserSkill.findOne({ _id: req.params.userSkillId, userId: req.user._id });
  if (!us) throw new AppError('Skill entry not found.', 404);

  const { level, canTeach, wantToLearn, verified } = req.body;
  if (level !== undefined) us.level = level;
  if (canTeach !== undefined) us.canTeach = canTeach;
  if (wantToLearn !== undefined) us.wantToLearn = wantToLearn;
  if (verified !== undefined) us.verified = verified;
  await us.save();
  queueTrustRefresh(req.user._id);

  res.json({ success: true, skill: us, user: await publicUser(req.user) });
});

// @route  DELETE /api/users/skills/:userSkillId
// @access private
const removeSkill = asyncHandler(async (req, res, next) => {
  const us = await UserSkill.findOne({ _id: req.params.userSkillId, userId: req.user._id });
  if (!us) throw new AppError('Skill entry not found.', 404);
  await us.deleteOne();
  queueTrustRefresh(req.user._id);
  res.json({ success: true, user: await publicUser(req.user) });
});

// @route  POST /api/users/resume
// @access private (multer) — extract skills from uploaded resume via AI service
const uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.file) throw new AppError('Please upload a resume (PDF/DOCX/TXT).', 400);
  const filePath = req.file.path;

  const aiClient = require('../services/aiClient');
  const fs = require('fs');

  let extracted = [];
  try {
    const { data } = await aiClient.client.post('/resume/parse', {
      file_path: filePath,
    });
    extracted = data?.skills || [];
  } catch (err) {
    console.warn('[resume] AI service unavailable, scanning locally.');
    extracted = await localResumeScan(filePath);
  }

  const Skill = require('../models/Skill');
  const skills = await Skill.find({});
  const skillNameSet = new Set(skills.map((s) => s.name.toLowerCase()));

  const matched = [];
  for (const entry of extracted) {
    const lower = entry.toLowerCase();
    const skill = skills.find(
      (s) => s.name.toLowerCase() === lower || (s.aliases || []).some((a) => a.toLowerCase() === lower)
    );
    if (skill && !skillNameSet.has(lower)) {
      skillNameSet.add(lower);
      matched.push(skill);
    }
  }

  for (const skill of matched) {
    await UserSkill.findOneAndUpdate(
      { userId: req.user._id, skillId: skill._id },
      { canTeach: true, wantToLearn: false, level: 3, verified: false },
      { upsert: true, new: true }
    );
  }

  res.json({
    success: true,
    extracted: extracted.slice(0, 40),
    added: matched.map((m) => m.name),
    user: await publicUser(req.user),
  });
});

// @route  DELETE /api/users/me
// @access private — lets a user permanently delete their own account.
// Temporary test accounts can always self-delete; other accounts can too,
// but demo and admin accounts are protected.
const deleteMyAccount = asyncHandler(async (req, res, next) => {
  try {
    await deleteUser(req.user._id);
  } catch (err) {
    return next(err);
  }
  res.json({ success: true, message: 'Your account and all associated data were deleted.' });
});

const localResumeScan = async (filePath) => {
  const fs = require('fs');
  const path = require('path');
  const text = fs.readFileSync(filePath, 'utf8').toLowerCase();

  const common = [
    'python', 'javascript', 'typescript', 'java', 'c++', 'c', 'c#', 'go', 'rust', 'sql',
    'react', 'react native', 'vue', 'angular', 'node.js', 'nodejs', 'express', 'django',
    'flask', 'mongodb', 'postgresql', 'mysql', 'docker', 'kubernetes', 'aws', 'git', 'github',
    'machine learning', 'deep learning', 'data science', 'pandas', 'numpy', 'tensorflow',
    'pytorch', 'figma', 'tailwind css', 'html', 'css', 'communication', 'leadership',
  ];

  const found = new Set();
  for (const kw of common) {
    if (text.includes(kw)) {
      found.add(kw === 'c++' ? 'C / C++' : kw);
    }
  }
  return [...found];
};

module.exports = {
  getProfile,
  updateProfile,
  getUser,
  searchUsers,
  uploadAvatar,
  addSkill,
  updateSkill,
  removeSkill,
  uploadResume,
  deleteMyAccount,
};
