const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { recordRequest } = require('./utils/metrics');
const logger = require('./utils/logger');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// Request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Security
app.use(mongoSanitize());
app.use(xss());

// Global rate limiter
const limiter = rateLimit({
  ...config.rateLimit.global,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// Auth rate limiter
const authLimiter = rateLimit({
  ...config.rateLimit.auth,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});
app.use('/api/auth', authLimiter);

// Request logging + metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    recordRequest(req, res, start);
    if (req.path !== '/health') {
      logger.http(`${req.method} ${req.originalUrl}`, {
        statusCode: res.statusCode,
        duration,
        requestId: req.id,
      });
    }
  });
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, config.uploadDir)));

// API routes
app.use('/api', routes);

// Root
app.get('/', (req, res) =>
  res.json({ name: 'SkillSwap API', version: '1.0.0', docs: '/api/health' })
);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
