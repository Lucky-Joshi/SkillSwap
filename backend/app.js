const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.clientUrl.split(',').map((u) => u.trim()),
    credentials: true,
  })
);

if (config.env !== 'test') app.use(morgan('dev'));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(mongoSanitize());
app.use(xss());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});
app.use('/api/auth', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, config.uploadDir)));

app.use('/api', routes);

app.get('/', (req, res) =>
  res.json({ name: 'SkillSwap API', version: '1.0.0', docs: '/api/health' })
);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
