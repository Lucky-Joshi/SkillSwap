const express = require('express');
const { checkHealth } = require('../utils/health');
const { getMetrics } = require('../utils/metrics');
const { protect, restrictTo } = require('../middleware/auth');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const health = await checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

router.get('/metrics', protect, restrictTo('admin'), (req, res) => {
  sendSuccess(res, { data: getMetrics() });
});

module.exports = router;
