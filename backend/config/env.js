const dotenv = require('dotenv');

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap',
  jwtSecret: process.env.JWT_SECRET || 'skillswap-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiServiceTimeout: parseInt(process.env.AI_SERVICE_TIMEOUT, 10) || 4000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  emailVerifyBaseUrl: process.env.EMAIL_VERIFY_BASE_URL || 'http://localhost:5173/verify-email',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((u) => u.trim())
    : [process.env.CLIENT_URL || 'http://localhost:5173'],
  logLevel: process.env.LOG_LEVEL || 'debug',
  rateLimit: {
    global: { windowMs: 15 * 60 * 1000, max: parseInt(process.env.RATE_LIMIT_GLOBAL, 10) || 500 },
    auth: { windowMs: 15 * 60 * 1000, max: parseInt(process.env.RATE_LIMIT_AUTH, 10) || 30 },
    ai: { windowMs: 15 * 60 * 1000, max: parseInt(process.env.RATE_LIMIT_AI, 10) || 20 },
  },
  ai: {
    similarityThreshold: parseFloat(process.env.AI_SIMILARITY_THRESHOLD) || 0.3,
    topN: parseInt(process.env.AI_TOP_N, 10) || 10,
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT, 10) || 4000,
  },
};

module.exports = config;
