const http = require('http');
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { startReminderScheduler } = require('./services/reminderService');
const { registerEventHandlers } = require('./events/handlers');
const logger = require('./utils/logger');

const start = async () => {
  await connectDB();

  registerEventHandlers();

  const server = http.createServer(app);
  const io = initSocket(server);
  app.set('io', io);

  server.listen(config.port, () => {
    logger.info(`SkillSwap API running on http://localhost:${config.port}`);
    logger.info(`AI service: ${config.aiServiceUrl}`);
    logger.info(`Environment: ${config.env}`);
  });

  startReminderScheduler();

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
      } catch (err) {
        logger.error('Error disconnecting MongoDB:', err.message);
      }
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    server.close(() => process.exit(1));
  });
};

start();
