import api, { unwrap } from './api';

export const getProfile = () => unwrap(api.get('/users/profile'));
export const updateProfile = (payload) => unwrap(api.put('/users/profile', payload));
export const getUser = (id) => unwrap(api.get(`/users/${id}`));
export const searchUsers = (params) => unwrap(api.get('/users', { params }));
export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  return unwrap(api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
};
export const uploadResume = (file) => {
  const form = new FormData();
  form.append('resume', file);
  return unwrap(api.post('/users/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
};
export const addSkill = (payload) => unwrap(api.post('/users/skills', payload));
export const updateUserSkill = (id, payload) => unwrap(api.put(`/users/skills/${id}`, payload));
export const removeUserSkill = (id) => unwrap(api.delete(`/users/skills/${id}`));
export const deleteMyAccount = () => unwrap(api.delete('/users/me'));
