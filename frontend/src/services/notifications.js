import api, { unwrap } from './api';

export const getNotifications = (params) => unwrap(api.get('/notifications', { params }));
export const markRead = (id) => unwrap(api.put(`/notifications/${id}/read`));
export const markAllRead = () => unwrap(api.put('/notifications/read-all'));
