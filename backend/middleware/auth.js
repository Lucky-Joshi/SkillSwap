const { verifyToken } = require('../utils/token');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

const BLOCKED_STATUSES = ['suspended', 'deleted', 'banned'];

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

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true, name: true, email: true, role: true, avatar: true, status: true, isVerified: true,
      bio: true, college: true, department: true, year: true, points: true, rating: true,
      reviewCount: true, sessionsCompleted: true, hoursLearned: true, hoursTaught: true,
      learningStreak: true, teachingStreak: true, learnedSkills: true,
      privacy: true,
      profileVisibility: true,
    },
  });
  if (!user) {
    throw new AuthenticationError('The user belonging to this token no longer exists.');
  }

  if (BLOCKED_STATUSES.includes(user.status)) {
    const messages = {
      suspended: 'Your account has been suspended. Please contact support.',
      deleted: 'Your account has been deleted.',
      banned: 'Your account has been banned.',
    };
    throw new AuthenticationError(messages[user.status] || 'Your account is restricted.');
  }

  req.user = { ...user, _id: user.id };
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new AuthorizationError('You do not have permission to perform this action.');
  }
  next();
};

module.exports = { protect, restrictTo };
