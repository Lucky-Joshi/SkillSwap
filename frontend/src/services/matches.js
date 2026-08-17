import api, { unwrap } from './api';

export const requestMatch = (payload) => unwrap(api.post('/match/request', payload));
export const acceptMatch = (matchId) => unwrap(api.post('/match/accept', { matchId }));
export const rejectMatch = (matchId) => unwrap(api.post('/match/reject', { matchId }));
export const cancelMatch = (matchId) => unwrap(api.post('/match/cancel', { matchId }));
export const getMatchHistory = (params) => unwrap(api.get('/match/history', { params }));
export const getPendingRequests = () => unwrap(api.get('/match/requests'));
export const getRelationships = () => unwrap(api.get('/match/relationships'));
