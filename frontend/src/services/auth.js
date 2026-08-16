import api, { unwrap } from './api';

export const login = (payload) => unwrap(api.post('/auth/login', payload));
export const register = (payload) => unwrap(api.post('/auth/register', payload));
export const me = () => unwrap(api.get('/auth/me'));
export const verifyEmail = (token) => unwrap(api.get('/auth/verify-email', { params: { token } }));
export const resendVerification = (email) => unwrap(api.post('/auth/resend-verification', { email }));
export const forgotPassword = (email) => unwrap(api.post('/auth/forgot-password', { email }));
export const resetPassword = (token, password) => unwrap(api.post('/auth/reset-password', { token, password }));
