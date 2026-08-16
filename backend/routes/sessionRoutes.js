const express = require('express');
const { body } = require('express-validator');
const { createSession, getSessions, updateSession } = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.post(
  '/',
  [
    body('otherUserId').isMongoId(),
    body('topic').trim().notEmpty().isLength({ max: 120 }),
    body('date').isISO8601().withMessage('Valid date required'),
    body('duration').optional().isInt({ min: 15, max: 240 }),
  ],
  validate,
  createSession
);
router.get('/', getSessions);
router.put('/:id', updateSession);

module.exports = router;
