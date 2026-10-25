const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');

const toDbCategory = (category) => typeof category === 'string' ? category.replaceAll('-', '_') : category;
const toApiSkill = (skill) => ({ ...skill, _id: skill.id, category: skill.category.replaceAll('_', '-') });

const getSkills = asyncHandler(async (req, res) => {
  const { search, category, difficulty } = req.query;
  const where = {};
  if (category) where.category = toDbCategory(category);
  if (difficulty) where.difficulty = difficulty;
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { aliases: { has: String(search).toLowerCase() } },
    ];
  }
  const { page, limit, skip } = paginate(req);
  const [rows, total] = await Promise.all([
    prisma.skill.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }], skip, take: limit }),
    prisma.skill.count({ where }),
  ]);
  res.json({ success: true, ...paginateResults(rows.map(toApiSkill), total, page, limit) });
});

const getCategories = asyncHandler(async (_req, res) => {
  const rows = await prisma.skill.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } });
  res.json({ success: true, categories: rows.map(({ category }) => category.replaceAll('_', '-')) });
});

const createSkill = asyncHandler(async (req, res) => {
  const { name, category = 'other', difficulty = 'beginner', icon, aliases = [] } = req.body;
  const exists = await prisma.skill.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
  if (exists) throw new AppError('Skill already exists.', 409);
  const skill = await prisma.skill.create({ data: { name, category: toDbCategory(category), difficulty, icon, aliases } });
  res.status(201).json({ success: true, skill: toApiSkill(skill) });
});

const updateSkill = asyncHandler(async (req, res) => {
  const { name, category, difficulty, icon, aliases } = req.body;
  const data = Object.fromEntries(Object.entries({ name, category: toDbCategory(category), difficulty, icon, aliases }).filter(([, value]) => value !== undefined));
  let skill;
  try {
    skill = await prisma.skill.update({ where: { id: req.params.id }, data });
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Skill not found.', 404);
    throw error;
  }
  res.json({ success: true, skill: toApiSkill(skill) });
});

const deleteSkill = asyncHandler(async (req, res) => {
  try {
    await prisma.skill.delete({ where: { id: req.params.id } });
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Skill not found.', 404);
    throw error;
  }
  res.json({ success: true, message: 'Skill deleted.' });
});

module.exports = { getSkills, getCategories, createSkill, updateSkill, deleteSkill };
