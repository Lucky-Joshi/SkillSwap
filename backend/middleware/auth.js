const { verifyToken } = require('../utils/token');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    throw new AuthenticationError('Not authorized. Please log in.');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new AuthenticationError('Session expired or invalid. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('_id name email role avatar verified');
  if (!user) {
    throw new AuthenticationError('The user belonging to this token no longer exists.');
  }

  req.user = user;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new AuthorizationError('You do not have permission to perform this action.');
  }
  next();
};

module.exports = { protect, restrictTo };
