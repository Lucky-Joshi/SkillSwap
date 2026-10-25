const prisma = require('../../lib/prisma');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { signToken, randomToken } = require('../../utils/token');
const { sendMail } = require('../../utils/mailer');
const { publicUserPrisma } = require('../../services/userServicePrisma');
const { evaluateBadges } = require('../../services/badgeService');
const { queueTrustRefresh } = require('../../services/trustService');
const config = require('../../config/env');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const enumValue = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const qualificationToDb = (value) => enumValue(value);
const yearToDb = (value) => value === 'Graduate' || value === 'graduate' ? 'graduate' : `year${String(value).trim()}`;

const sendVerificationEmail = async (user) => {
  const token = randomToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken: hashToken(token), verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const link = `${config.emailVerifyBaseUrl}?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your SkillSwap account',
    html: `<h1>Welcome to SkillSwap!</h1><p>Verify your college email to get started:</p><a href="${link}">Verify Email</a><p>Or paste this in your browser: ${link}</p>`,
  });
  return token;
};

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

  await sendVerificationEmail(user);

  const profile = await publicUserPrisma(user.id, user.id);
  res.status(201).json({
    success: true,
    token,
    user: profile,
    message: 'Account created. Please verify your email.',
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

// @route  GET /api/auth/verify-email?token=...
// @access public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.query;
  const user = token ? await prisma.user.findFirst({ where: { verificationToken: hashToken(String(token)), verificationTokenExpiry: { gt: new Date() } } }) : null;

  if (!user) {
    throw new AppError('Invalid or expired verification link.', 400);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      status: 'verified',
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });
  queueTrustRefresh(user.id);

  res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
});

// @route  POST /api/auth/resend-verification
// @access public
const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isVerified) await sendVerificationEmail(user);
  res.json({ success: true, message: 'If the account can receive verification email, a message has been sent.' });
});

// @route  POST /api/auth/forgot-password
// @access public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ success: true, message: 'If an account exists, a password reset link has been sent.' });

  const token = randomToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashToken(token),
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendMail({
    to: user.email,
    subject: 'Reset your SkillSwap password',
    html: `<p>Reset link (valid 1 hour): ${config.clientUrl}/reset-password?token=${token}</p>`,
  });

  res.json({ success: true, message: 'If an account exists, a password reset link has been sent.' });
});

// @route  POST /api/auth/reset-password
// @access public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;
  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashToken(String(token)),
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token.', 400);

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  res.json({ success: true, message: 'Password reset successfully. Please log in.' });
});

module.exports = {
  register,
  login,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
