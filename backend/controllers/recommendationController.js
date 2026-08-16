const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Match = require('../models/Match');
const asyncHandler = require('../utils/asyncHandler');
const { rankCandidates, buildCards } = require('../services/recommendationService');
const aiClient = require('../services/aiClient');

const withSkills = async (users) => {
  const out = [];
  for (const u of users) {
    const skills = await UserSkill.find({ userId: u._id }).populate('skillId').lean();
    out.push({
      ...(u.toObject ? u.toObject() : u),
      skills: skills.map((s) => ({
        ...s,
        skillId: s.skillId,
        name: s.skillId?.name || 'Unknown',
      })),
    });
  }
  return out;
};

const existingMatchKeys = async (userId) => {
  const matches = await Match.find({
    $or: [{ mentorId: userId }, { learnerId: userId }],
  }).select('mentorId learnerId status');
  const keySet = new Set();
  matches.forEach((m) => {
    keySet.add(`${String(m.mentorId)}_${String(m.learnerId)}`);
    keySet.add(`${String(m.learnerId)}_${String(m.mentorId)}`);
  });
  return { matches, keySet };
};

// @route  GET /api/recommendations?mode=mentors|learners
// @access private
const getRecommendations = asyncHandler(async (req, res) => {
  const mode = req.query.mode === 'learners' ? 'learners' : 'mentors';

  const candidates = await User.find({
    _id: { $ne: req.user._id },
    isVerified: true,
  }).lean();

  const candidatesWithSkills = await withSkills(candidates);
  const meWithSkills = {
    ...req.user.toObject(),
    skills: (await UserSkill.find({ userId: req.user._id }).populate('skillId').lean()).map(
      (s) => ({ ...s, skillId: s.skillId, name: s.skillId?.name || 'Unknown' })
    ),
  };

  const { keySet } = await existingMatchKeys(req.user._id);

  // Try the FastAPI semantic engine; fall back to heuristic on failure.
  let ranked;
  try {
    const payload = {
      user: {
        id: String(req.user._id),
        skills: meWithSkills.skills.map((s) => s.name),
        canTeach: meWithSkills.skills.filter((s) => s.canTeach).map((s) => s.name),
        wantToLearn: meWithSkills.skills.filter((s) => s.wantToLearn).map((s) => s.name),
        department: meWithSkills.department,
        year: meWithSkills.year,
        availability: meWithSkills.availability,
        rating: meWithSkills.rating,
      },
      candidates: candidatesWithSkills.map((c) => ({
        id: String(c._id),
        skills: c.skills.map((s) => s.name),
        canTeach: c.skills.filter((s) => s.canTeach).map((s) => s.name),
        wantToLearn: c.skills.filter((s) => s.wantToLearn).map((s) => s.name),
        department: c.department,
        year: c.year,
        availability: c.availability,
        rating: c.rating,
      })),
      mode,
      limit: 20,
    };
    const result = await aiClient.tryAi(
      '/recommendations',
      payload,
      () => rankCandidates(meWithSkills, candidatesWithSkills, { mode })
    );
    ranked = Array.isArray(result.results) ? result.results : result;
  } catch {
    ranked = await rankCandidates(meWithSkills, candidatesWithSkills, { mode });
  }

  // Map AI results back to user cards.
  const scoresById = new Map();
  ranked.forEach((r) => scoresById.set(String(r.userId || r.id), r));

  const validUsers = candidatesWithSkills.filter((c) => scoresById.has(String(c._id)));
  const cards = buildCards(validUsers, scoresById);

  const finalCards = cards
    .filter((c) => !keySet.has(`${req.user._id}_${c.id}`) && !keySet.has(`${c.id}_${req.user._id}`))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.json({
    success: true,
    mode,
    data: finalCards,
    aiService: await aiClient.isUp().catch(() => false),
  });
});

// @route  POST /api/recommendations/refresh
// @access private
const refreshRecommendations = asyncHandler(async (req, res) => {
  // Recompute happens on every GET; refresh simply forces a fresh DB snapshot.
  res.json({ success: true, message: 'Recommendations refreshed.' });
});

module.exports = { getRecommendations, refreshRecommendations };
