const os = require('os');
const mongoose = require('mongoose');
const config = require('../config/env');
const logger = require('../utils/logger');

const startTime = Date.now();

const checkHealth = async () => {
  const checks = {
    status: 'healthy',
    service: 'skillswap-backend',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // MongoDB check
  try {
    const mongoState = mongoose.connection.readyState;
    const mongoLabels = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    checks.checks.database = {
      status: mongoState === 1 ? 'healthy' : 'unhealthy',
      state: mongoLabels[mongoState] || 'unknown',
      host: mongoose.connection.host || 'N/A',
    };
  } catch (err) {
    checks.checks.database = { status: 'unhealthy', error: err.message };
  }

  // AI Service check
  try {
    const axios = require('axios');
    const response = await axios.get(`${config.aiServiceUrl}/health`, { timeout: 3000 });
    checks.checks.aiService = {
      status: response.status === 200 ? 'healthy' : 'degraded',
      url: config.aiServiceUrl,
    };
  } catch (err) {
    checks.checks.aiService = {
      status: 'unavailable',
      url: config.aiServiceUrl,
      error: err.message,
    };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = ((totalMem - freeMem) / totalMem) * 100;

  checks.checks.memory = {
    status: usedPercent > 90 ? 'critical' : usedPercent > 75 ? 'warning' : 'healthy',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    systemUsed: `${Math.round(usedPercent)}%`,
  };

  // CPU check
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  checks.checks.cpu = {
    status: loadAvg[0] > cpus.length * 0.9 ? 'warning' : 'healthy',
    cores: cpus.length,
    loadAvg: loadAvg.map((l) => l.toFixed(2)),
  };

  // Determine overall status
  const hasUnhealthy = Object.values(checks.checks).some((c) => c.status === 'unhealthy' || c.status === 'critical');
  const hasDegraded = Object.values(checks.checks).some((c) => c.status === 'degraded' || c.status === 'warning' || c.status === 'unavailable');

  if (hasUnhealthy) checks.status = 'unhealthy';
  else if (hasDegraded) checks.status = 'degraded';

  return checks;
};

module.exports = { checkHealth };
