import api, { unwrap } from './api';

// Dashboard
export const getAdminDashboard = () => unwrap(api.get('/admin/dashboard'));

// Users
export const listAdminUsers = (params) => unwrap(api.get('/admin/users', { params }));
export const getAdminUser = (id) => unwrap(api.get(`/admin/users/${id}`));
export const updateAdminUser = (id, data) => unwrap(api.put(`/admin/users/${id}`, data));
export const verifyAdminUser = (id, data) => unwrap(api.post(`/admin/users/${id}/verify`, data));
export const suspendAdminUser = (id, data) => unwrap(api.post(`/admin/users/${id}/suspend`, data));
export const softDeleteAdminUser = (id, data) => unwrap(api.post(`/admin/users/${id}/delete`, data));
export const permanentDeleteAdminUser = (id, data) => unwrap(api.delete(`/admin/users/${id}`, { data }));
export const reactivateAdminUser = (id, data) => unwrap(api.post(`/admin/users/${id}/reactivate`, data));
export const banAdminUser = (id, data) => unwrap(api.post(`/admin/users/${id}/ban`, data));

// Audit Logs
export const listAdminAuditLogs = (params) => unwrap(api.get('/admin/audit-logs', { params }));

// Institutions
export const listAdminInstitutions = (params) => unwrap(api.get('/admin/institutions', { params }));
export const createAdminInstitution = (data) => unwrap(api.post('/admin/institutions', data));
export const updateAdminInstitution = (id, data) => unwrap(api.put(`/admin/institutions/${id}`, data));
export const deleteAdminInstitution = (id) => unwrap(api.delete(`/admin/institutions/${id}`));
export const mergeAdminInstitutions = (data) => unwrap(api.post('/admin/institutions/merge', data));

// Skills
export const listAdminSkills = (params) => unwrap(api.get('/admin/skills', { params }));
export const createAdminSkill = (data) => unwrap(api.post('/admin/skills', data));
export const updateAdminSkill = (id, data) => unwrap(api.put(`/admin/skills/${id}`, data));
export const deleteAdminSkill = (id) => unwrap(api.delete(`/admin/skills/${id}`));
export const mergeAdminSkills = (data) => unwrap(api.post('/admin/skills/merge', data));

// Sessions
export const listAdminSessions = (params) => unwrap(api.get('/admin/sessions', { params }));
export const getAdminSessionStats = () => unwrap(api.get('/admin/sessions/stats'));

// Badges
export const listAdminBadges = () => unwrap(api.get('/admin/badges'));
export const createAdminBadge = (data) => unwrap(api.post('/admin/badges', data));
export const updateAdminBadge = (id, data) => unwrap(api.put(`/admin/badges/${id}`, data));
export const deleteAdminBadge = (id) => unwrap(api.delete(`/admin/badges/${id}`));

// Certificates
export const listAdminCertificates = (params) => unwrap(api.get('/admin/certificates', { params }));

// Reports
export const listAdminReports = (params) => unwrap(api.get('/admin/reports', { params }));
export const resolveAdminReport = (id, data) => unwrap(api.patch(`/admin/reports/${id}/resolve`, data));

// AI Monitor
export const getAdminAIMonitor = () => unwrap(api.get('/admin/ai'));

// System Health
export const getAdminSystemHealth = () => unwrap(api.get('/admin/health'));

// Analytics
export const getAdminAnalytics = () => unwrap(api.get('/admin/analytics'));
