import api, { unwrap } from './api';

export const getInstitutions = (q) => unwrap(api.get('/institutions', { params: q ? { q } : {} }));
