const express = require('express');
const { body } = require('express-validator');
const {
  requestMatch,
  acceptMatch,
  rejectMatch,
  cancelMatch,
  getRelationships,
  getMatchHistory,
  getPendingRequests,
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.get('/history', getMatchHistory);
router.get('/requests', getPendingRequests);
router.get('/relationships', getRelationships);
router.post('/request', [body('userId').matches(/^[A-Za-z0-9_-]{8,64}$/), body('mode').optional().isIn(['mentors', 'learners', 'peer']), body('type').optional().isIn(['mentorship', 'peer'])], validate, requestMatch);
router.post('/accept', [body('matchId').matches(/^[A-Za-z0-9_-]{8,64}$/)], validate, acceptMatch);
router.post('/reject', [body('matchId').matches(/^[A-Za-z0-9_-]{8,64}$/)], validate, rejectMatch);
router.post('/cancel', [body('matchId').matches(/^[A-Za-z0-9_-]{8,64}$/)], validate, cancelMatch);

module.exports = router;
