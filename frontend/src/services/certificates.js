import api, { unwrap } from './api';

export const getCertificates = () => unwrap(api.get('/certificates'));
export const grantCertificate = (sessionId) => unwrap(api.post(`/certificates/${sessionId}/grant`));
