const express = require('express');
const { getAllBadges, getMyBadges } = require('../controllers/badgeController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/mine', getMyBadges);
router.get('/', getAllBadges);

module.exports = router;
