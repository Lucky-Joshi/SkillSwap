const express = require('express');
const { body } = require('express-validator');
const { createReview, getUserReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.post(
  '/',
  [
    body('mentor').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('feedback').optional().trim().isLength({ max: 1000 }),
    body('sessionId').optional().isMongoId(),
  ],
  validate,
  createReview
);
router.get('/:userId', getUserReviews);

module.exports = router;
