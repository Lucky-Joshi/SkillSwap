const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL (or DIRECT_URL) is required to connect to Supabase Postgres.');
}

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
