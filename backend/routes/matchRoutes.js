const express = require('express');
const { body } = require('express-validator');
const {
  requestMatch,
  acceptMatch,
  rejectMatch,
  getMatchHistory,
  getPendingRequests,
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.get('/history', getMatchHistory);
router.get('/requests', getPendingRequests);
router.post('/request', [body('userId').isMongoId(), body('mode').optional().isIn(['mentors', 'learners'])], validate, requestMatch);
router.post('/accept', [body('matchId').isMongoId()], validate, acceptMatch);
router.post('/reject', [body('matchId').isMongoId()], validate, rejectMatch);

module.exports = router;
