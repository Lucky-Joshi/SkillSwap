const express = require('express');
const { body } = require('express-validator');
const {
  createSession,
  getSessions,
  getSessionDashboard,
  getSessionCalendar,
  updateSession,
  confirmSession,
  cancelSession,
  completeSession,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.get('/dashboard', getSessionDashboard);
router.get('/calendar', getSessionCalendar);
router.get('/', getSessions);

router.post(
  '/',
  [
    body('otherUserId').isMongoId().withMessage('Valid user required'),
    body('topic').trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().isLength({ max: 1000 }),
    body('date').isISO8601().withMessage('Valid date required'),
    body('startTime').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Valid time (HH:MM) required'),
    body('duration').optional().isInt({ min: 15, max: 240 }),
    body('meetingMode').optional().isIn(['online', 'offline']),
    body('meetingType').optional().isIn(['googleMeet', 'zoom', 'teams', 'custom']),
    body('meetingLink').optional().isURL({ require_protocol: true }).withMessage('Valid meeting link required'),
    body('locationType').optional().isIn(['campus', 'classroom', 'library', 'lab', 'custom']),
    body('location').optional().isLength({ max: 200 }),
  ],
  validate,
  createSession
);

router.put(
  '/:id',
  [
    body('topic').optional().trim().notEmpty().isLength({ max: 120 }),
    body('date').optional().isISO8601(),
    body('startTime').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
    body('duration').optional().isInt({ min: 15, max: 240 }),
    body('meetingMode').optional().isIn(['online', 'offline']),
    body('meetingType').optional().isIn(['googleMeet', 'zoom', 'teams', 'custom']),
    body('meetingLink').optional().isURL({ require_protocol: true }),
    body('locationType').optional().isIn(['campus', 'classroom', 'library', 'lab', 'custom']),
  ],
  validate,
  updateSession
);

router.post('/:id/confirm', confirmSession);
router.post('/:id/cancel', cancelSession);
router.post(
  '/:id/complete',
  [
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('feedback').optional().isLength({ max: 2000 }),
    body('recommendAnother').optional().isBoolean(),
  ],
  validate,
  completeSession
);

module.exports = router;
