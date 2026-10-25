const dotenv = require('dotenv');

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || (env === 'production' ? '' : 'skillswap-dev-secret');
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const resumeDir = process.env.RESUME_DIR || `${require('os').tmpdir()}/skillswap-resumes`;
const corsOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (env === 'production') {
  const missing = [];
  if (!databaseUrl) missing.push('DATABASE_URL');
  if (jwtSecret.length < 32 || jwtSecret === 'skillswap-dev-secret') missing.push('JWT_SECRET (at least 32 characters)');
  if (!process.env.CLIENT_URL) missing.push('CLIENT_URL');
  if (!process.env.EMAIL_FROM) missing.push('EMAIL_FROM');
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
  if (!/^https:\/\//i.test(process.env.CLIENT_URL || '')) missing.push('CLIENT_URL must use HTTPS');
  if (corsOrigins.some((origin) => origin === '*' || !/^https:\/\//i.test(origin))) missing.push('CORS_ORIGINS must contain HTTPS origins only');
  if (!/^https:\/\//i.test(process.env.EMAIL_VERIFY_BASE_URL || '')) missing.push('EMAIL_VERIFY_BASE_URL must use HTTPS');
  if (missing.length) {
    throw new Error(`Missing or invalid production environment: ${missing.join(', ')}`);
  }
}

const config = {
  env,
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiServiceTimeout: parseInt(process.env.AI_SERVICE_TIMEOUT, 10) || 4000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  uploadDir,
  resumeDir,
  emailVerifyBaseUrl: process.env.EMAIL_VERIFY_BASE_URL || 'http://localhost:5173/verify-email',
  emailFrom: process.env.EMAIL_FROM || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  corsOrigins,
  logLevel: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
  rateLimit: {
    global: { windowMs: 15 * 60 * 1000, max: parseInt(process.env.RATE_LIMIT_GLOBAL, 10) || 500 },
    auth: { windowMs: 15 * 60 * 1000, max: parseInt(process.env.RATE_LIMIT_AUTH, 10) || 10 },
    ai: { windowMs: 15 * 60 * 1000, max: parseInt(process.env.RATE_LIMIT_AI, 10) || 20 },
  },
  ai: {
    similarityThreshold: parseFloat(process.env.AI_SIMILARITY_THRESHOLD) || 0.3,
    topN: parseInt(process.env.AI_TOP_N, 10) || 10,
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT, 10) || 4000,
  },
};

module.exports = config;
