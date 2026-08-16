const config = require('../config/env');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }
  if (err.name === 'ValidationError') {
    error = new AppError(Object.values(err.errors).map((e) => e.message).join('. '), 400);
  }
  if (err.code === 11000) {
    error = new AppError('Duplicate value. That record already exists.', 409);
  }
  if (err.name === 'MulterError') {
    error = new AppError(err.message, 400);
  }

  const statusCode = error.statusCode || 500;
  const isDev = config.env === 'development';

  res.status(statusCode).json({
    success: false,
    status: error.status || 'error',
    message: error.message || 'Internal Server Error',
    ...(isDev ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
