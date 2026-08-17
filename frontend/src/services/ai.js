import api, { unwrap } from './api';

export const getDashboard = () => unwrap(api.get('/dashboard'));
export const getRoadmap = (goal) => unwrap(api.post('/ai/roadmap', { goal }));
export const getSkillGraph = () => unwrap(api.get('/ai/skill-graph'));
export const getRelatedSkills = (skill) => unwrap(api.post('/ai/related-skills', { skill }));
export const getNextSteps = (completedTopic, goal) => unwrap(api.post('/ai/next-steps', { completedTopic, goal }));
