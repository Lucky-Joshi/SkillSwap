const express = require('express');
const { getInstitutions } = require('../controllers/institutionController');

const router = express.Router();

router.get('/', getInstitutions);

module.exports = router;
