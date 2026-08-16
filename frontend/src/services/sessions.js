import api, { unwrap } from './api';

export const createSession = (payload) => unwrap(api.post('/session', payload));
export const getSessions = (params) => unwrap(api.get('/session', { params }));
export const updateSession = (id, payload) => unwrap(api.put(`/session/${id}`, payload));
