const express = require('express');
const { body } = require('express-validator');
const {
  getSkills,
  getCategories,
  createSkill,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.get('/', getSkills);
router.get('/categories', getCategories);
router.post(
  '/',
  [body('name').trim().notEmpty().isLength({ max: 60 }), body('category').optional(), body('difficulty').optional()],
  validate,
  createSkill
);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

module.exports = router;
