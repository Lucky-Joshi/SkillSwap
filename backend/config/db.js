const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Postgres connected via Prisma');
    return prisma;
  } catch (err) {
    logger.error('Prisma connection failed:', err.message);
    process.exit(1);
  }
};

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = connectDB;
