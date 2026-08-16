import api, { unwrap } from './api';

export const createReview = (payload) => unwrap(api.post('/review', payload));
export const getUserReviews = (userId, params) => unwrap(api.get(`/review/${userId}`, { params }));
