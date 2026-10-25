const http = require('http');
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const prisma = require('./lib/prisma');
const { initSocket } = require('./socket');
const { startReminderScheduler } = require('./services/reminderService');
const logger = require('./utils/logger');

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = initSocket(server);
  app.set('io', io);

  server.listen(config.port, () => {
    logger.info(`SkillSwap API running on http://localhost:${config.port}`);
    logger.info(`AI service: ${config.aiServiceUrl}`);
    logger.info(`Environment: ${config.env}`);
  });

  const reminderTimer = startReminderScheduler();

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    clearInterval(reminderTimer);
    io.close();
    server.close(async () => {
      try {
        await prisma.$disconnect();
        logger.info('Postgres disconnected');
      } catch (err) {
        logger.error('Error disconnecting Postgres:', err.message);
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
    logger.error('Unhandled rejection; terminating process:', err);
    server.close(() => process.exit(1));
    setTimeout(() => process.exit(1), 10000).unref();
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    server.close(() => process.exit(1));
  });
};

start().catch(async (err) => {
  logger.error('Startup failed:', err);
  await prisma.$disconnect().catch(() => {});
  process.exitCode = 1;
});
