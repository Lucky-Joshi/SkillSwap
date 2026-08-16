import api, { unwrap } from './api';

export const getConversations = () => unwrap(api.get('/messages/conversations'));
export const getMessages = (userId, params) => unwrap(api.get(`/messages/${userId}`, { params }));
export const sendMessage = (payload) => unwrap(api.post('/messages', payload));
