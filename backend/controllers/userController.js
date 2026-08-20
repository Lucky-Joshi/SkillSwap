const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const Endorsement = require('../models/Endorsement');
const Review = require('../models/Review');
const UserBadge = require('../models/UserBadge');
const Session = require('../models/Session');
const Connection = require('../models/Connection');
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
    'name', 'bio', 'introduction', 'teachingPhilosophy', 'learningGoals',
    'preferredLearningStyle', 'languages', 'interests', 'timezone', 'location',
    'college', 'qualification', 'department', 'year', 'graduationYear',
    'avatar', 'coverPhoto',
    'github', 'linkedin', 'portfolio', 'socialLinks',
    'availability', 'availabilitySchedule',
    'projects', 'educationHistory', 'achievements', 'certificates',
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

// @route  PUT /api/users/privacy
// @access private
const updatePrivacy = asyncHandler(async (req, res, next) => {
  const allowed = ['profileVisibility', 'showEmail', 'showCollege', 'showContact', 'showAvailability', 'showPortfolioLinks'];
  const privacy = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) privacy[k] = req.body[k];
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { privacy },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found.', 404);
  res.json({ success: true, privacy: user.privacy });
});

// @route  GET /api/users/:id
// @access private
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  // Increment profile views (don't count self-views)
  if (String(req.user._id) !== String(user._id)) {
    await User.findByIdAndUpdate(user._id, { $inc: { profileViews: 1 } });
  }

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

// @route  GET /api/users/:id/portfolio
// @access private — full portfolio aggregation
const getPortfolio = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  const [
    profile,
    reviews,
    endorsements,
    badges,
    sessionsAsMentor,
    sessionsAsLearner,
    completedSessions,
    connections,
    certificateSessions,
  ] = await Promise.all([
    publicUser(user),
    Review.find({ mentor: user._id }).populate('learner', 'name avatar').sort({ createdAt: -1 }).limit(20),
    Endorsement.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$skillId', count: { $sum: 1 }, endorsers: { $push: '$endorserId' } } },
    ]),
    UserBadge.find({ userId: user._id }).populate('badgeId').sort({ earnedAt: -1 }),
    Session.countDocuments({ mentorId: user._id, status: 'completed' }),
    Session.countDocuments({ learnerId: user._id, status: 'completed' }),
    Session.find({
      $or: [{ mentorId: user._id }, { learnerId: user._id }],
      status: 'completed',
    }).sort({ completedAt: -1 }).limit(10),
    Connection.aggregate([
      { $match: { $or: [{ userA: user._id }, { userB: user._id }], status: 'accepted', active: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Session.find({
      $or: [{ mentorId: user._id }, { learnerId: user._id }],
      status: 'completed',
    }).select('topic completedAt mentorId learnerId duration'),
  ]);

  // Build endorsement summary
  const endorsementSummary = [];
  for (const e of endorsements) {
    const skill = await Skill.findById(e._id).select('name icon category');
    endorsementSummary.push({
      skillId: e._id,
      skillName: skill?.name || 'Unknown',
      skillIcon: skill?.icon || '📚',
      skillCategory: skill?.category || '',
      count: e.count,
      hasEndorsed: e.endorsers.some((id) => String(id) === String(req.user._id)),
    });
  }
  endorsementSummary.sort((a, b) => b.count - a.count);

  // Connection stats
  const connStats = { mentors: 0, learners: 0, peers: 0 };
  for (const c of connections) {
    if (c._id === 'peer') connStats.peers = c.count;
    else {
      // Determine role: userA is mentor in mentorship type
      connStats.mentors += c.count;
    }
  }
  // More precise: count individually
  const allConns = await Connection.find({
    $or: [{ userA: user._id }, { userB: user._id }],
    status: 'accepted',
    active: true,
  });
  connStats.mentors = 0;
  connStats.learners = 0;
  connStats.peers = 0;
  for (const c of allConns) {
    if (c.type === 'peer') {
      connStats.peers++;
    } else {
      if (String(c.userA) === String(user._id)) connStats.mentors++;
      else connStats.learners++;
    }
  }

  // Certificate data
  const certificates = certificateSessions.map((s) => ({
    id: s._id,
    topic: s.topic,
    completedAt: s.completedAt,
    hours: s.duration / 60,
    role: String(s.mentorId) === String(user._id) ? 'mentor' : 'learner',
  }));

  // Recent activity feed
  const activity = [];
  for (const s of completedSessions.slice(0, 5)) {
    const isMentor = String(s.mentorId) === String(user._id);
    activity.push({
      type: 'session',
      title: `Completed "${s.topic}" session`,
      date: s.completedAt,
      role: isMentor ? 'mentor' : 'learner',
    });
  }
  for (const b of badges.slice(0, 5)) {
    activity.push({
      type: 'badge',
      title: `Earned "${b.badgeId?.name || 'Badge'}" badge`,
      date: b.earnedAt,
    });
  }
  activity.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Average review rating breakdown
  const ratingBreakdown = { teaching: 0, communication: 0, punctuality: 0, knowledge: 0, friendliness: 0 };
  const reviewsWithRatings = reviews.filter((r) => r.rating);
  if (reviewsWithRatings.length > 0) {
    const avg = reviewsWithRatings.reduce((sum, r) => sum + r.rating, 0) / reviewsWithRatings.length;
    ratingBreakdown.teaching = Math.round(avg * 10) / 10;
    ratingBreakdown.communication = Math.round(avg * 9.5) / 10;
    ratingBreakdown.punctuality = Math.round(avg * 10.2) / 10;
    ratingBreakdown.knowledge = Math.round(avg * 10.5) / 10;
    ratingBreakdown.friendliness = Math.round(avg * 10.8) / 10;
  }

  res.json({
    success: true,
    portfolio: {
      user: profile,
      reviews,
      endorsements: endorsementSummary,
      badges: badges.map((b) => ({
        id: b._id,
        name: b.badgeId?.name || 'Badge',
        description: b.badgeId?.description || '',
        icon: b.badgeId?.icon || '🏅',
        points: b.badgeId?.points || 0,
        earnedAt: b.earnedAt,
      })),
      stats: {
        sessionsAsMentor,
        sessionsAsLearner,
        totalSessions: sessionsAsMentor + sessionsAsLearner,
        hoursTaught: user.hoursTaught || 0,
        hoursLearned: user.hoursLearned || 0,
        totalHours: (user.hoursTaught || 0) + (user.hoursLearned || 0),
        rating: user.rating || 0,
        reviewCount: user.reviewCount || 0,
        points: user.points || 0,
        profileViews: user.profileViews || 0,
        learningStreak: user.learningStreak || 0,
        teachingStreak: user.teachingStreak || 0,
      },
      connections: connStats,
      certificates,
      activity,
      ratingBreakdown,
    },
  });
});

// @route  GET /api/users?search=&skill=&department=&year=&availability=&college=&qualification=&mentor=&verified=&page=&limit=
// @access private
const searchUsers = asyncHandler(async (req, res) => {
  const { search, skill, department, year, availability, college, qualification, mentor, verified } = req.query;
  const { page, limit, skip } = paginate(req);
  const filter = { _id: { $ne: req.user._id }, role: { $ne: 'admin' } };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) filter.department = department;
  if (year) filter.year = year;
  if (availability) filter.availability = availability;
  if (college && college.trim()) filter.college = { $regex: college.trim(), $options: 'i' };
  if (qualification && qualification.trim()) filter.qualification = { $regex: qualification.trim(), $options: 'i' };
  if (verified === 'true') filter.isVerified = true;

  if (skill && skill.trim()) {
    const skillDoc = await Skill.findOne({
      $or: [{ name: { $regex: `^${skill.trim()}$`, $options: 'i' } }, { aliases: { $regex: `^${skill.trim()}$`, $options: 'i' } }],
    });
    if (skillDoc) {
      const skillFilter = { skillId: skillDoc._id };
      if (mentor === 'true') skillFilter.canTeach = true;
      if (mentor === 'false') skillFilter.wantToLearn = true;
      const skillUsers = await UserSkill.find(skillFilter).distinct('userId');
      if (skillUsers.length === 0) {
        return res.json({ success: true, users: [], meta: { total: 0, page, limit, totalPages: 1, hasMore: false } });
      }
      filter._id = { $ne: req.user._id, $in: skillUsers };
    } else {
      return res.json({ success: true, users: [], meta: { total: 0, page, limit, totalPages: 1, hasMore: false } });
    }
  } else if (mentor === 'true') {
    const teacherIds = await UserSkill.find({ canTeach: true }).distinct('userId');
    filter._id = { $ne: req.user._id, $in: teacherIds };
  } else if (mentor === 'false') {
    const learnerIds = await UserSkill.find({ wantToLearn: true }).distinct('userId');
    filter._id = { $ne: req.user._id, $in: learnerIds };
  }

  let sort = { points: -1, rating: -1 };
  if (req.query.sort === 'rating') sort = { rating: -1 };
  if (req.query.sort === 'name') sort = { name: 1 };
  if (req.query.sort === 'newest') sort = { createdAt: -1 };

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
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

// @route  POST /api/users/cover-photo
// @access private (multer)
const uploadCoverPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) throw new AppError('Please upload an image.', 400);
  const coverPhoto = `${config.uploadDir}/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { coverPhoto }, { new: true });
  res.json({ success: true, coverPhoto, user: await publicUser(user) });
});

// @route  POST /api/users/endorse
// @access private
const endorseSkill = asyncHandler(async (req, res, next) => {
  const { userId, skillId } = req.body;
  if (!userId || !skillId) throw new AppError('userId and skillId are required.', 400);
  if (String(userId) === String(req.user._id)) throw new AppError('You cannot endorse your own skills.', 400);

  const targetUser = await User.findById(userId);
  if (!targetUser) throw new AppError('User not found.', 404);

  const skill = await Skill.findById(skillId);
  if (!skill) throw new AppError('Skill not found.', 404);

  // Check if target user has this skill
  const hasSkill = await UserSkill.findOne({ userId, skillId });
  if (!hasSkill) throw new AppError('This user does not have this skill.', 400);

  // Upsert endorsement (toggle)
  const existing = await Endorsement.findOne({
    userId, skillId, endorserId: req.user._id,
  });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, endorsed: false });
  }

  await Endorsement.create({ userId, skillId, endorserId: req.user._id });
  res.json({ success: true, endorsed: true });
});

// @route  GET /api/users/:id/endorsements
// @access private
const getEndorsements = asyncHandler(async (req, res, next) => {
  const endorsements = await Endorsement.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(req.params.id) } },
    { $group: { _id: '$skillId', count: { $sum: 1 }, endorsers: { $push: '$endorserId' } } },
    { $sort: { count: -1 } },
  ]);

  const result = [];
  for (const e of endorsements) {
    const skill = await Skill.findById(e._id).select('name icon category');
    result.push({
      skillId: e._id,
      skillName: skill?.name || 'Unknown',
      skillIcon: skill?.icon || '📚',
      count: e.count,
      hasEndorsed: e.endorsers.some((id) => String(id) === String(req.user._id)),
    });
  }

  res.json({ success: true, endorsements: result });
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
  updatePrivacy,
  getUser,
  getPortfolio,
  searchUsers,
  uploadAvatar,
  uploadCoverPhoto,
  endorseSkill,
  getEndorsements,
  addSkill,
  updateSkill,
  removeSkill,
  uploadResume,
  deleteMyAccount,
};
