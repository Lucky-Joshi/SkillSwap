const http = require('http');
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(config.port, () => {
    console.log(`[skillswap] API running on http://localhost:${config.port}`);
    console.log(`[skillswap] AI service: ${config.aiServiceUrl}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[skillswap] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await require('mongoose').disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => {
    console.error('[skillswap] Unhandled rejection:', err);
    server.close(() => process.exit(1));
  });
};

start();
