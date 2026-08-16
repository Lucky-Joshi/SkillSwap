const Institution = require('../models/Institution');
const asyncHandler = require('../utils/asyncHandler');

// @route  GET /api/institutions
// @access public — used by the signup form (datalist) and profile editor.
const getInstitutions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = {};
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { city: rx }, { country: rx }];
  }
  const institutions = await Institution.find(filter).sort({ name: 1 }).limit(200).lean();
  res.json({ success: true, institutions });
});

module.exports = { getInstitutions };
