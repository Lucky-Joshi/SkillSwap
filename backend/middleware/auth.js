const { verifyToken } = require('../utils/token');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    throw new AppError('Not authorized. Please log in.', 401);
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new AppError('Session expired or invalid. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  req.user = user;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  }
  next();
};

module.exports = { protect, restrictTo };
