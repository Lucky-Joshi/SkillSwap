const { fallbackRelated } = require('./roadmapService');

/**
 * Heuristic "what's next" recommendations used after a session completes.
 * Builds a chain from the completed topic using the skill graph, then pads
 * with a sensible learning progression.
 */
const suggestNext = (completedTopic = '', goal = '') => {
  const topic = (completedTopic || '').trim();

  const related = fallbackRelated(topic);
  const next = [];

  // 1. Directly related follow-up skills.
  for (const skill of related) {
    if (next.length >= 3) break;
    if (skill.toLowerCase() !== topic.toLowerCase()) next.push(skill);
  }

  // 2. If the goal implies a roadmap, pull its remaining steps.
  const { generateRoadmap } = require('./roadmapService');
  if (goal && next.length < 3) {
    const roadmap = generateRoadmap(goal);
    const startIdx = roadmap.steps.findIndex((s) => {
      const skills = (s.skills || []).map((x) => x.toLowerCase());
      return skills.includes(topic.toLowerCase()) || s.title.toLowerCase().includes(topic.toLowerCase());
    });
    const remaining = roadmap.steps.slice(startIdx + 1, startIdx + 4).map((s) => s.title);
    for (const step of remaining) {
      if (next.length >= 3) break;
      if (!next.includes(step)) next.push(step);
    }
  }

  // 3. Generic progression fallback.
  const generic = ['Practice with small projects', 'Advanced topics', 'Peer review & feedback'];
  for (const g of generic) {
    if (next.length >= 3) break;
    next.push(g);
  }

  return { next, progress: null };
};

module.exports = { suggestNext };
