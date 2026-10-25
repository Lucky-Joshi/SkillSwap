const prisma = require('../../lib/prisma');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { signToken } = require('../../utils/token');
const { publicUserPrisma } = require('../../services/userServicePrisma');
const { evaluateBadges } = require('../../services/badgeService');
const { queueTrustRefresh } = require('../../services/trustService');
const bcrypt = require('bcryptjs');

const enumValue = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const qualificationToDb = (value) => enumValue(value);
const yearToDb = (value) => value === 'Graduate' || value === 'graduate' ? 'graduate' : `year${String(value).trim()}`;

// @route  POST /api/auth/register
// @access public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, college, qualification, department, year, bio, availability } = req.body;

  if (!college || !qualification || !department || !year) {
    throw new AppError('Please complete your profile: school/college, qualification, year and department are required.', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('An account with this email already exists. Please log in.', 409);

  const hashedPassword = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      college: String(college).trim(),
      qualification: qualificationToDb(qualification),
      department: String(department).trim(),
      year: yearToDb(year),
      bio: bio || '',
      availability: availability || 'anytime',
      status: 'active',
      isVerified: false,
      trustScore: 15,
    },
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('An account with this email already exists. Please log in.', 409);
    throw error;
  }

  const token = signToken(user.id);
  await evaluateBadges(user.id);
  queueTrustRefresh(user.id);

  const profile = await publicUserPrisma(user.id, user.id);
  res.status(201).json({
    success: true,
    token,
    user: profile,
    message: 'Account created successfully.',
  });
});

// @route  POST /api/auth/login
// @access public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  const BLOCKED = ['suspended', 'deleted', 'banned'];
  if (BLOCKED.includes(user.status)) {
    const messages = {
      suspended: 'Your account has been suspended. Please contact support.',
      deleted: 'Your account has been deleted.',
      banned: 'Your account has been banned.',
    };
    throw new AppError(messages[user.status] || 'Your account is restricted.', 403);
  }

  const token = signToken(user.id);
  const profile = await publicUserPrisma(user.id, user.id);
  res.json({ success: true, token, user: profile });
});

// @route  GET /api/auth/me
// @access private
const me = asyncHandler(async (req, res) => {
  const profile = await publicUserPrisma(req.user.id, req.user.id);
  res.json({ success: true, user: profile });
});

module.exports = {
  register,
  login,
  me,
};
