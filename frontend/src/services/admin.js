import api, { unwrap } from './api';

export const getAdminStats = () => unwrap(api.get('/admin/stats'));
export const listAdminUsers = (params) => unwrap(api.get('/admin/users', { params }));
export const deleteTestUsers = () => unwrap(api.delete('/admin/users/test'));
export const deleteUser = (id) => unwrap(api.delete(`/admin/users/${id}`));
export const resetDemoAccount = () => unwrap(api.post('/admin/demo/reset'));
export const purgeData = () => unwrap(api.delete('/admin/data'));
export const reseed = () => unwrap(api.post('/admin/seed/reseed'));
