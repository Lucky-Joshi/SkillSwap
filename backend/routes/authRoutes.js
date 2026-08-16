const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const emailRule = () => body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail();
const passwordRule = (field = 'password') =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    emailRule(),
    passwordRule(),
    body('college').trim().notEmpty().withMessage('School/college/university is required').isLength({ max: 120 }),
    body('qualification').trim().notEmpty().withMessage('Qualification is required').isIn([
      '10th Grade', '12th Grade', 'Diploma', 'B.Tech', 'B.E', 'B.Sc', 'BCA', 'MCA',
      'M.Tech', 'M.Sc', 'BBA', 'MBA', 'BA', 'MA', 'Ph.D', 'Other',
    ]).withMessage('Invalid qualification'),
    body('department').trim().notEmpty().withMessage('Department/stream is required').isLength({ max: 80 }),
    body('year').trim().notEmpty().withMessage('Current year/class is required').isIn(['1', '2', '3', '4', '5', 'Graduate']),
    body('isTest').optional().isBoolean(),
  ],
  validate,
  register
);

router.post('/login', [emailRule(), passwordRule('password')], validate, login);
router.get('/me', protect, me);
router.get('/verify-email', [body().optional()], verifyEmail);
router.post('/resend-verification', [emailRule()], validate, resendVerification);
router.post('/forgot-password', [emailRule()], validate, forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), passwordRule('password')], validate, resetPassword);

module.exports = router;
