const UserSkill = require('../models/UserSkill');
const Match = require('../models/Match');
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
    isTest: base.isTest || false,
    isDemo: base.isDemo || false,
    stats: {
      teachCount: skills.filter((s) => s.canTeach).length,
      learnCount: skills.filter((s) => s.wantToLearn).length,
      totalSkills: skills.length,
    },
  };
};

const getMatchStatusWith = async (userA, userB) => {
  const match = await Match.findOne({
    $or: [
      { mentorId: userA, learnerId: userB },
      { mentorId: userB, learnerId: userA },
    ],
  });
  return match || null;
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
