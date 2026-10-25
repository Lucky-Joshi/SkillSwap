import api, { unwrap } from './api';

export const login = (payload) => unwrap(api.post('/auth/login', payload));
export const register = (payload) => unwrap(api.post('/auth/register', payload));
export const me = () => unwrap(api.get('/auth/me'));
