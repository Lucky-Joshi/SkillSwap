const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  getUser,
  searchUsers,
  uploadAvatar,
  addSkill,
  updateSkill,
  removeSkill,
  uploadResume,
  deleteMyAccount,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadImage, uploadResume: resumeUpload } = require('../middleware/upload');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ max: 80 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('year').optional().isIn(['1', '2', '3', '4', '5', 'Graduate', '']),
    body('availability').optional().isIn(['weekdays', 'weekends', 'evenings', 'mornings', 'anytime', '']),
    body('github').optional().isURL({ require_protocol: false }).withMessage('Invalid GitHub URL'),
    body('linkedin').optional().isURL({ require_protocol: false }).withMessage('Invalid LinkedIn URL'),
    body('portfolio').optional().isURL({ require_protocol: false }).withMessage('Invalid portfolio URL'),
  ],
  validate,
  updateProfile
);

router.get('/', searchUsers);
router.post('/avatar', uploadImage.single('avatar'), uploadAvatar);
router.post('/resume', resumeUpload.single('resume'), uploadResume);

router.post(
  '/skills',
  [
    body('skillId').optional().isMongoId(),
    body('skillName').optional().trim(),
    body('level').optional().isInt({ min: 1, max: 5 }),
    body('canTeach').optional().isBoolean(),
    body('wantToLearn').optional().isBoolean(),
  ],
  validate,
  addSkill
);
router.put('/skills/:userSkillId', updateSkill);
router.delete('/skills/:userSkillId', removeSkill);

router.delete('/me', deleteMyAccount);

router.get('/:id', getUser);

module.exports = router;
