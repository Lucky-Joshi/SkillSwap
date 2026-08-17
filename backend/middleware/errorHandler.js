const config = require('../config/env');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    error = new AppError(errors.join('. '), 400);
    error.errors = errors;
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`Duplicate value for "${field}". That record already exists.`, 409);
  }
  if (err.name === 'MulterError') {
    error = new AppError(err.message, 400);
  }

  const statusCode = error.statusCode || 500;
  const isDev = config.env === 'development';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, {
      statusCode,
      message: error.message,
      stack: err.stack,
      requestId: req.id,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${statusCode}`, {
      message: error.message,
      requestId: req.id,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(error.errors && { errors: error.errors }),
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
