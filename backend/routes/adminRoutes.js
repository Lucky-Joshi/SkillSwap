const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getDashboard, listUsers, getUser, updateUser, suspendUser, deleteUserAdmin,
  listInstitutions, createInstitution, updateInstitution, deleteInstitution, mergeInstitutions,
  listSkills, createSkill, updateSkill, deleteSkill, mergeSkills,
  listSessions, getSessionStats,
  listBadges, createBadge, updateBadge, deleteBadge,
  listCertificates,
  listReports, resolveReport,
  getAIMonitor, getSystemHealth, getAnalytics,
} = require('../controllers/adminController');

const router = express.Router();

// All routes require admin role
router.use(protect, restrictTo('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Users
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUserAdmin);

// Institutions
router.get('/institutions', listInstitutions);
router.post('/institutions', createInstitution);
router.put('/institutions/:id', updateInstitution);
router.delete('/institutions/:id', deleteInstitution);
router.post('/institutions/merge', mergeInstitutions);

// Skills
router.get('/skills', listSkills);
router.post('/skills', createSkill);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);
router.post('/skills/merge', mergeSkills);

// Sessions
router.get('/sessions', listSessions);
router.get('/sessions/stats', getSessionStats);

// Badges
router.get('/badges', listBadges);
router.post('/badges', createBadge);
router.put('/badges/:id', updateBadge);
router.delete('/badges/:id', deleteBadge);

// Certificates
router.get('/certificates', listCertificates);

// Reports
router.get('/reports', listReports);
router.patch('/reports/:id/resolve', resolveReport);

// AI Monitor
router.get('/ai', getAIMonitor);

// System Health
router.get('/health', getSystemHealth);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
