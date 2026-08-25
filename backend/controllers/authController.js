const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, randomToken } = require('../utils/token');
const { sendMail } = require('../utils/mailer');
const { publicUser } = require('../services/userService');
const { evaluateBadges } = require('../services/badgeService');
const { queueTrustRefresh } = require('../services/trustService');
const config = require('../config/env');

const sendVerificationEmail = async (user) => {
  const token = randomToken();
  user.verificationToken = token;
  await user.save({ validateBeforeSave: false });
  const link = `${config.emailVerifyBaseUrl}?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your SkillSwap account',
    html: `<h1>Welcome to SkillSwap!</h1><p>Verify your college email to get started:</p><a href="${link}">Verify Email</a><p>Or paste this in your browser: ${link}</p>`,
  });
  return token;
};

// @route  POST /api/auth/register
// @access public — open registration for all students.
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, college, qualification, department, year, bio, availability } = req.body;

  if (!college || !qualification || !department || !year) {
    throw new AppError('Please complete your profile: school/college, qualification, year and department are required.', 400);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists. Please log in.', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    college: String(college).trim(),
    qualification: String(qualification).trim(),
    department: String(department).trim(),
    year,
    bio: bio || '',
    availability: availability || 'anytime',
    status: 'active',
    isVerified: false,
    trustScore: 15,
  });

  const token = signToken(user._id);
  await evaluateBadges(user._id);
  queueTrustRefresh(user._id);

  await sendVerificationEmail(user);

  const profile = await publicUser(user);
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

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
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

  const token = signToken(user._id);
  const profile = await publicUser(user);
  res.json({ success: true, token, user: profile });
});

// @route  GET /api/auth/me
// @access private
const me = asyncHandler(async (req, res) => {
  const profile = await publicUser(req.user);
  res.json({ success: true, user: profile });
});

// @route  GET /api/auth/verify-email?token=...
// @access public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.query;
  const user = await User.findOne({ verificationToken: token }).select('+verificationToken');

  if (!user) {
    throw new AppError('Invalid or expired verification link.', 400);
  }
  user.isVerified = true;
  user.status = 'verified';
  user.verificationToken = undefined;
  await user.save({ validateBeforeSave: false });
  queueTrustRefresh(user._id);

  res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
});

// @route  POST /api/auth/resend-verification
// @access public
const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new AppError('No account found with that email.', 404);
  if (user.isVerified) throw new AppError('This account is already verified.', 400);
  await sendVerificationEmail(user);
  res.json({ success: true, message: 'Verification email resent.' });
});

// @route  POST /api/auth/forgot-password
// @access public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new AppError('No account found with that email.', 404);

  const token = randomToken();
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  await sendMail({
    to: user.email,
    subject: 'Reset your SkillSwap password',
    html: `<p>Reset link (valid 1 hour): ${config.clientUrl}/reset-password?token=${token}</p>`,
  });

  res.json({ success: true, message: 'Password reset link sent to your email.' });
});

// @route  POST /api/auth/reset-password
// @access public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  }).select('+resetToken +resetTokenExpiry');

  if (!user) throw new AppError('Invalid or expired reset token.', 400);

  user.password = password;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

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
