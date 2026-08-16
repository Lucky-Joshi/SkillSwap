const express = require('express');
const { getRecommendations, refreshRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getRecommendations);
router.post('/refresh', refreshRecommendations);

module.exports = router;
