const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { rankCandidates, buildCards } = require('../services/recommendationService');
const aiClient = require('../services/aiClient');

const YEAR_VALUES = { year1: '1', year2: '2', year3: '3', year4: '4', year5: '5', graduate: 'Graduate' };
const withSkills = (user) => ({
  ...user,
  _id: user.id,
  year: YEAR_VALUES[user.year] || user.year,
  skills: (user.userSkills || []).map((row) => ({
    ...row,
    _id: row.id,
    skillId: { ...row.skill, _id: row.skill.id },
    name: row.skill.name,
  })),
});

const getRecommendations = asyncHandler(async (req, res) => {
  const mode = req.query.mode === 'learners' ? 'learners' : 'mentors';
  const skillInclude = { userSkills: { include: { skill: true } } };
  const [candidateRows, meRow, connections] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { not: req.user.id }, isVerified: true, role: { notIn: ['admin', 'super_admin'] }, profileVisibility: { not: 'private' },
        status: { notIn: ['suspended', 'deleted', 'banned'] },
      },
      include: skillInclude,
    }),
    prisma.user.findUnique({ where: { id: req.user.id }, include: skillInclude }),
    prisma.connection.findMany({ where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] }, select: { userAId: true, userBId: true } }),
  ]);
  const candidates = candidateRows.map(withSkills);
  const meWithSkills = withSkills(meRow);
  const keySet = new Set();
  for (const connection of connections) {
    keySet.add(`${connection.userAId}_${connection.userBId}`);
    keySet.add(`${connection.userBId}_${connection.userAId}`);
  }

  let ranked;
  try {
    const payload = {
      user: {
        id: meWithSkills.id,
        skills: meWithSkills.skills.map((skill) => skill.name),
        canTeach: meWithSkills.skills.filter((skill) => skill.canTeach).map((skill) => skill.name),
        wantToLearn: meWithSkills.skills.filter((skill) => skill.wantToLearn).map((skill) => skill.name),
        department: meWithSkills.department, year: meWithSkills.year,
        availability: meWithSkills.availability, rating: meWithSkills.rating,
      },
      candidates: candidates.map((user) => ({
        id: user.id,
        skills: user.skills.map((skill) => skill.name),
        canTeach: user.skills.filter((skill) => skill.canTeach).map((skill) => skill.name),
        wantToLearn: user.skills.filter((skill) => skill.wantToLearn).map((skill) => skill.name),
        department: user.department, year: user.year,
        availability: user.availability, rating: user.rating,
      })),
      mode,
      limit: 20,
    };
    const result = await aiClient.tryAi('/recommendations', payload, () => rankCandidates(meWithSkills, candidates, { mode }));
    ranked = Array.isArray(result.results) ? result.results : result;
  } catch {
    ranked = await rankCandidates(meWithSkills, candidates, { mode });
  }
  const scoresById = new Map(ranked.map((row) => [String(row.userId || row.id), row]));
  const cards = buildCards(candidates.filter((user) => scoresById.has(String(user.id))), scoresById);
  const data = cards
    .filter((card) => !keySet.has(`${req.user.id}_${card.id}`) && !keySet.has(`${card.id}_${req.user.id}`))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  res.json({ success: true, mode, data, aiService: await aiClient.isUp().catch(() => false) });
});

const refreshRecommendations = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Recommendations refreshed.' });
});

module.exports = { getRecommendations, refreshRecommendations };
