import api, { unwrap } from './api';

export const getSkills = (params) => unwrap(api.get('/skills', { params }));
export const getCategories = () => unwrap(api.get('/skills/categories'));
export const createSkill = (payload) => unwrap(api.post('/skills', payload));
export const updateSkill = (id, payload) => unwrap(api.put(`/skills/${id}`, payload));
export const deleteSkill = (id) => unwrap(api.delete(`/skills/${id}`));
