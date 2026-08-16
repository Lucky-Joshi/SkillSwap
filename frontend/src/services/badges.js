import api, { unwrap } from './api';

export const getAllBadges = () => unwrap(api.get('/badges'));
export const getMyBadges = () => unwrap(api.get('/badges/mine'));
