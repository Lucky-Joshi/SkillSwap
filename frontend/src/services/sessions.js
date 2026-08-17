import api, { unwrap } from './api';

export const createSession = (payload) => unwrap(api.post('/session', payload));
export const getSessions = (params) => unwrap(api.get('/session', { params }));
export const getSessionDashboard = () => unwrap(api.get('/session/dashboard'));
export const getSessionCalendar = (params) => unwrap(api.get('/session/calendar', { params }));
export const updateSession = (id, payload) => unwrap(api.put(`/session/${id}`, payload));
export const confirmSession = (id) => unwrap(api.post(`/session/${id}/confirm`));
export const cancelSession = (id) => unwrap(api.post(`/session/${id}/cancel`));
export const completeSession = (id, payload) => unwrap(api.post(`/session/${id}/complete`, payload));
