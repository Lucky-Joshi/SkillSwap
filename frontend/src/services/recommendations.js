import api, { unwrap } from './api';

export const getRecommendations = (mode = 'mentors') =>
  unwrap(api.get('/recommendations', { params: { mode } }));
export const refreshRecommendations = () => unwrap(api.post('/recommendations/refresh'));
