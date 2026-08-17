const asyncHandler = require('../utils/asyncHandler');
const aiClient = require('../services/aiClient');

// @route  POST /api/ai/roadmap { goal }
// @access private — learning roadmap via FastAPI, heuristic fallback.
const getRoadmap = asyncHandler(async (req, res) => {
  const { goal } = req.body;
  const fallback = () => require('../services/roadmapService').generateRoadmap(goal);

  const result = await aiClient.tryAi('/roadmap', { goal }, fallback);
  res.json({
    success: true,
    goal: result.goal || goal,
    steps: result.steps || [],
    totalEstimatedHours: result.total_estimated_hours ?? result.totalEstimatedHours ?? null,
    aiService: await aiClient.isUp().catch(() => false),
  });
});

// @route  GET /api/ai/skill-graph
// @access private — knowledge graph of skill relationships.
const getSkillGraph = asyncHandler(async (req, res) => {
  const fallback = () => require('../services/roadmapService').fallbackSkillGraph();
  const result = await aiClient.tryAi('/skills/graph', {}, fallback);
  res.json({ success: true, graph: result });
});

// @route  POST /api/ai/related-skills { skill }
// @access private — semantically related skills.
const getRelatedSkills = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  const fallback = () => ({
    skill,
    related: require('../services/roadmapService').fallbackRelated(skill),
  });
  const result = await aiClient.tryAi('/skills/related', { skill }, fallback);
  res.json({ success: true, data: result });
});

// @route  POST /api/ai/next-steps { completedTopic, goal? }
// @access private — recommend the next learning topic(s) after a session.
const getNextSteps = asyncHandler(async (req, res) => {
  const { completedTopic, goal = '' } = req.body;
  const fallback = () => require('../services/nextStepsService').suggestNext(completedTopic, goal);
  const result = await aiClient.tryAi('/roadmap/next', { completed_topic: completedTopic, goal }, fallback);
  res.json({
    success: true,
    completedTopic,
    next: result.next || result.topics || [],
    progress: result.progress ?? null,
    aiService: await aiClient.isUp().catch(() => false),
  });
});

module.exports = { getRoadmap, getSkillGraph, getRelatedSkills, getNextSteps };
