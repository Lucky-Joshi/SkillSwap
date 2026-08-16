const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');

/**
 * Heuristic recommendation engine.
 * Mirrors the formula implemented in the FastAPI service so the backend can
 * fall back when the AI service is unreachable:
 *
 *   Compatibility = 40% Skill Match
 *                 + 20% Mutual Learning Interest
 *                 + 15% Availability
 *                 + 10% Teaching Rating
 *                 + 10% Experience Level
 *                 +  5% Department Similarity
 */

const SKILL_ALIASES = {};

const loadSkillMap = async () => {
  if (Object.keys(SKILL_ALIASES).length) return SKILL_ALIASES;
  const skills = await Skill.find({});
  skills.forEach((s) => {
    SKILL_ALIASES[s.name.toLowerCase()] = s.name.toLowerCase();
    (s.aliases || []).forEach((a) => {
      SKILL_ALIASES[a.toLowerCase()] = s.name.toLowerCase();
    });
  });
  return SKILL_ALIASES;
};

const normalize = (name = '') => {
  const lower = name.toLowerCase().trim();
  return SKILL_ALIASES[lower] || lower;
};

const jaccard = (a, b) => {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const inter = a.filter((x) => setB.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return inter / union;
};

const overlapRatio = (a, b) => {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  return a.filter((x) => setB.has(x)).length / Math.max(a.length, 1);
};

/**
 * @param {object} user - the active user (with populated skills)
 * @param {Array} candidates - other users with populated userSkills + skills
 * @param {object} opts { mode: 'mentors' | 'learners' }
 * @returns ranked array of { userId, score, skillMatch, mutualInterest, availability, teachingRating, experience, department, reasons, mutualSkills }
 */
const rankCandidates = async (user, candidates, { mode = 'mentors' } = {}) => {
  await loadSkillMap();

  const myTeach = user.skills.filter((s) => s.canTeach).map((s) => normalize(s.skillId?.name || s.name));
  const myLearn = user.skills.filter((s) => s.wantToLearn).map((s) => normalize(s.skillId?.name || s.name));

  const ranked = candidates.map((cand) => {
    const theirTeach = cand.skills.filter((s) => s.canTeach).map((s) => normalize(s.skillId?.name || s.name));
    const theirLearn = cand.skills.filter((s) => s.wantToLearn).map((s) => normalize(s.skillId?.name || s.name));

    let skillMatch;
    let mutualInterest;
    let reasons = [];
    let mutualSkills = [];

    if (mode === 'mentors') {
      skillMatch = overlapRatio(myLearn, theirTeach); // they can teach what I want
      mutualInterest = overlapRatio(myTeach, theirLearn); // we can exchange
      reasons = myLearn.filter((l) => theirTeach.includes(l));
      mutualSkills = myTeach.filter((t) => theirLearn.includes(t));
    } else {
      skillMatch = overlapRatio(myTeach, theirLearn); // they want to learn what I teach
      mutualInterest = overlapRatio(myLearn, theirTeach);
      reasons = myTeach.filter((t) => theirLearn.includes(t));
      mutualSkills = myLearn.filter((l) => theirTeach.includes(l));
    }

    const availability = cand.availability && cand.availability !== '' ? 1 : 0.4;
    const teachingRating = cand.rating / 5;
    const experience = Math.min((parseInt(cand.year, 10) || 1) / 4, 1);
    const department = user.department && cand.department && user.department === cand.department ? 1 : 0;

    const score = Math.round(
      skillMatch * 40 +
        mutualInterest * 20 +
        availability * 15 +
        teachingRating * 10 +
        experience * 10 +
        department * 5
    );

    return {
      userId: cand._id,
      score: Math.max(0, Math.min(score, 100)),
      skillMatch: Math.round(skillMatch * 100),
      mutualInterest: Math.round(mutualInterest * 100),
      availability: Math.round(availability * 100),
      teachingRating: Math.round(teachingRating * 100),
      experience: Math.round(experience * 100),
      department: Math.round(department * 100),
      reasons,
      mutualSkills,
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
};

/**
 * Build a serializable "candidate card" from a user doc + score breakdown.
 */
const buildCards = (users, scoresById) =>
  users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    college: u.college,
    department: u.department,
    year: u.year,
    avatar: u.avatar,
    bio: u.bio,
    rating: u.rating,
    reviewCount: u.reviewCount,
    availability: u.availability,
    canTeach: u.skills.filter((s) => s.canTeach).map((s) => s.skillId?.name || s.name),
    wantToLearn: u.skills.filter((s) => s.wantToLearn).map((s) => s.skillId?.name || s.name),
    mutualSkills: scoresById.get(String(u._id))?.mutualSkills || [],
    score: scoresById.get(String(u._id))?.score ?? 0,
    breakdown: scoresById.get(String(u._id)),
  }));

module.exports = { rankCandidates, buildCards, normalize, loadSkillMap };
