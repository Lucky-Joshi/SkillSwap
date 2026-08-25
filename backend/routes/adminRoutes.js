const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getDashboard, listUsers, getUser, updateUser, verifyUser, suspendUser,
  softDeleteUser, permanentDeleteUser, reactivateUser, banUser,
  listAuditLogs,
  listInstitutions, createInstitution, updateInstitution, deleteInstitution, mergeInstitutions,
  listSkills, createSkill, updateSkill, deleteSkill, mergeSkills,
  listSessions, getSessionStats,
  listBadges, createBadge, updateBadge, deleteBadge,
  listCertificates,
  listReports, resolveReport,
  getAIMonitor, getSystemHealth, getAnalytics,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, restrictTo('admin', 'super-admin'));

router.get('/dashboard', getDashboard);

router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/verify', verifyUser);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/delete', softDeleteUser);
router.delete('/users/:id', permanentDeleteUser);
router.post('/users/:id/reactivate', reactivateUser);
router.post('/users/:id/ban', banUser);

router.get('/audit-logs', listAuditLogs);

router.get('/institutions', listInstitutions);
router.post('/institutions', createInstitution);
router.put('/institutions/:id', updateInstitution);
router.delete('/institutions/:id', deleteInstitution);
router.post('/institutions/merge', mergeInstitutions);

router.get('/skills', listSkills);
router.post('/skills', createSkill);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);
router.post('/skills/merge', mergeSkills);

router.get('/sessions', listSessions);
router.get('/sessions/stats', getSessionStats);

router.get('/badges', listBadges);
router.post('/badges', createBadge);
router.put('/badges/:id', updateBadge);
router.delete('/badges/:id', deleteBadge);

router.get('/certificates', listCertificates);

router.get('/reports', listReports);
router.patch('/reports/:id/resolve', resolveReport);

router.get('/ai', getAIMonitor);
router.get('/health', getSystemHealth);
router.get('/analytics', getAnalytics);

module.exports = router;
