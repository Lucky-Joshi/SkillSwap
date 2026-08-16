const express = require('express');
const { getCertificates, grantCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getCertificates);
router.post('/:sessionId/grant', grantCertificate);

module.exports = router;
