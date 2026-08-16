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
  demoMode: process.env.DEMO_MODE === 'true',
  emailVerifyBaseUrl: process.env.EMAIL_VERIFY_BASE_URL || 'http://localhost:5173/verify-email',
};

module.exports = config;
