const UserSkill = require('../models/UserSkill');
const Connection = require('../models/Connection');
const UserBadge = require('../models/UserBadge');
const Skill = require('../models/Skill');

/**
 * Assemble a full user object with populated skills for API responses.
 */
const publicUser = async (user) => {
  const [skills, badgeCount] = await Promise.all([
    UserSkill.find({ userId: user._id })
      .populate('skillId')
      .sort({ canTeach: -1, level: -1 }),
    UserBadge.countDocuments({ userId: user._id }),
  ]);

  const base = user.toObject ? user.toObject() : user;
  delete base.password;

  return {
    ...base,
    id: String(base._id),
    status: base.status || 'active',
    canTeach: skills.filter((s) => s.canTeach).map((s) => s.skillId?.name || s.name),
    wantToLearn: skills.filter((s) => s.wantToLearn).map((s) => s.skillId?.name || s.name),
    skills: skills.map((s) => ({
      id: s._id,
      skillId: s.skillId?._id || s.skillId,
      name: s.skillId?.name || 'Unknown',
      category: s.skillId?.category,
      icon: s.skillId?.icon,
      level: s.level,
      canTeach: s.canTeach,
      wantToLearn: s.wantToLearn,
      verified: s.verified,
    })),
    badgeCount,
    trustScore: base.trustScore || 0,
    qualification: base.qualification || '',
    isVerified: base.isVerified || false,
    introduction: base.introduction || '',
    teachingPhilosophy: base.teachingPhilosophy || '',
    learningGoals: base.learningGoals || '',
    preferredLearningStyle: base.preferredLearningStyle || '',
    languages: base.languages || [],
    interests: base.interests || [],
    timezone: base.timezone || '',
    location: base.location || '',
    coverPhoto: base.coverPhoto || '',
    socialLinks: base.socialLinks || {},
    educationHistory: base.educationHistory || [],
    availabilitySchedule: base.availabilitySchedule || {},
    graduationYear: base.graduationYear || '',
    privacy: base.privacy || {},
    profileViews: base.profileViews || 0,
    stats: {
      teachCount: skills.filter((s) => s.canTeach).length,
      learnCount: skills.filter((s) => s.wantToLearn).length,
      totalSkills: skills.length,
    },
  };
};

const getMatchStatusWith = async (userA, userB) => {
  const conn = await Connection.findOne({
    $or: [
      { userA, userB },
      { userA: userB, userB: userA },
    ],
  });
  return conn || null;
};

const resolveSkills = async (names) => {
  const out = [];
  for (const name of names) {
    const skill = await Skill.findOne({
      $or: [{ name: { $regex: `^${name}$`, $options: 'i' } }, { aliases: { $regex: `^${name}$`, $options: 'i' } }],
    });
    if (skill) out.push(skill);
  }
  return out;
};

module.exports = { publicUser, getMatchStatusWith, resolveSkills };
