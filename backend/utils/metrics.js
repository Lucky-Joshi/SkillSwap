const metrics = {
  requests: {
    total: 0,
    success: 0,
    error: 0,
    byMethod: {},
    byRoute: {},
  },
  responseTimes: [],
  socketConnections: 0,
  aiRequests: {
    total: 0,
    success: 0,
    error: 0,
    totalTime: 0,
  },
  startTime: Date.now(),
};

const recordRequest = (req, res, startTime) => {
  const duration = Date.now() - startTime;
  metrics.requests.total++;
  metrics.responseTimes.push(duration);

  if (metrics.responseTimes.length > 1000) {
    metrics.responseTimes = metrics.responseTimes.slice(-500);
  }

  const method = req.method;
  metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;

  if (res.statusCode < 400) {
    metrics.requests.success++;
  } else {
    metrics.requests.error++;
  }
};

const recordAiRequest = (success, duration) => {
  metrics.aiRequests.total++;
  metrics.aiRequests.totalTime += duration;
  if (success) metrics.aiRequests.success++;
  else metrics.aiRequests.error++;
};

const getMetrics = () => {
  const responseTimes = metrics.responseTimes;
  const sorted = [...responseTimes].sort((a, b) => a - b);

  return {
    uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
    requests: {
      ...metrics.requests,
      avgResponseTime: responseTimes.length
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
      p50: sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : 0,
      p95: sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0,
      p99: sorted.length ? sorted[Math.floor(sorted.length * 0.99)] : 0,
    },
    ai: {
      ...metrics.aiRequests,
      avgTime: metrics.aiRequests.total
        ? Math.round(metrics.aiRequests.totalTime / metrics.aiRequests.total)
        : 0,
    },
    socketConnections: metrics.socketConnections,
    memory: {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
    },
  };
};

module.exports = { recordRequest, recordAiRequest, getMetrics, metrics };
