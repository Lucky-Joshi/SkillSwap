const Skill = require('../models/Skill');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');

// @route  GET /api/skills?search=&category=&difficulty=&page=&limit=
// @access private
const getSkills = asyncHandler(async (req, res) => {
  const { search, category, difficulty } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { aliases: { $regex: search, $options: 'i' } },
    ];
  }

  const { page, limit, skip } = paginate(req);
  const [skills, total] = await Promise.all([
    Skill.find(filter).sort({ category: 1, name: 1 }).skip(skip).limit(limit),
    Skill.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResults(skills, total, page, limit) });
});

// @route  GET /api/skills/categories
// @access private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Skill.distinct('category');
  res.json({ success: true, categories });
});

// @route  POST /api/skills
// @access private
const createSkill = asyncHandler(async (req, res, next) => {
  const { name, category, difficulty, icon, aliases } = req.body;
  const exists = await Skill.exists({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (exists) throw new AppError('Skill already exists.', 409);

  const skill = await Skill.create({ name, category, difficulty, icon, aliases });
  res.status(201).json({ success: true, skill });
});

// @route  PUT /api/skills/:id
// @access private
const updateSkill = asyncHandler(async (req, res, next) => {
  const { name, category, difficulty, icon, aliases } = req.body;
  const skill = await Skill.findByIdAndUpdate(
    req.params.id,
    { name, category, difficulty, icon, aliases },
    { new: true, runValidators: true }
  );
  if (!skill) throw new AppError('Skill not found.', 404);
  res.json({ success: true, skill });
});

// @route  DELETE /api/skills/:id
// @access private
const deleteSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findByIdAndDelete(req.params.id);
  if (!skill) throw new AppError('Skill not found.', 404);
  res.json({ success: true, message: 'Skill deleted.' });
});

module.exports = { getSkills, getCategories, createSkill, updateSkill, deleteSkill };
