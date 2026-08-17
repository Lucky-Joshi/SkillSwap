const express = require('express');
const { body } = require('express-validator');
const { getRoadmap, getSkillGraph, getRelatedSkills, getNextSteps } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.post('/roadmap', [body('goal').trim().notEmpty()], validate, getRoadmap);
router.get('/skill-graph', getSkillGraph);
router.post('/related-skills', [body('skill').trim().notEmpty()], validate, getRelatedSkills);
router.post('/next-steps', [body('completedTopic').trim().notEmpty()], validate, getNextSteps);

module.exports = router;
