import api, { unwrap } from './api';

export const getLeaderboard = (params) => unwrap(api.get('/leaderboard', { params }));
