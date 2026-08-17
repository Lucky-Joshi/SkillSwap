const { body, param, query } = require('express-validator');

const authValidation = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[a-zA-Z]/)
      .withMessage('Password must contain a letter'),
    body('college').optional().trim(),
    body('department').optional().trim(),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  resetPassword: [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
};

const userValidation = {
  updateProfile: [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('college').optional().trim(),
    body('department').optional().trim(),
    body('year').optional().isInt({ min: 1, max: 10 }),
    body('qualification').optional().trim(),
    body('availability').optional().isIn(['full', 'part', 'weekends', 'evenings']),
  ],
  getUser: [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  searchUsers: [
    query('q').optional().trim().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('college').optional().trim(),
    query('sort').optional().isIn(['name', '-name', 'rating', '-rating', 'points', '-points']),
  ],
  endorseSkill: [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('skillId').isMongoId().withMessage('Invalid skill ID'),
  ],
  addSkill: [
    body('name').trim().notEmpty().withMessage('Skill name is required'),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('canTeach').optional().isBoolean(),
    body('wantToLearn').optional().isBoolean(),
  ],
};

const sessionValidation = {
  create: [
    body('mentorId').isMongoId().withMessage('Invalid mentor ID'),
    body('learnerId').isMongoId().withMessage('Invalid learner ID'),
    body('topic').trim().notEmpty().withMessage('Topic is required').isLength({ max: 200 }),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:MM'),
    body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be 15-480 minutes'),
    body('meetingMode').optional().isIn(['online', 'in_person', 'hybrid']),
    body('meetingType').optional().trim(),
    body('meetingLink').optional().trim().isLength({ max: 500 }),
  ],
  getSessions: [
    query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    query('meetingMode').optional().isIn(['online', 'in_person', 'hybrid']),
    query('role').optional().isIn(['mentor', 'learner']),
    query('search').optional().trim().isLength({ max: 100 }),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  update: [
    param('id').isMongoId().withMessage('Invalid session ID'),
    body('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    body('topic').optional().trim().isLength({ min: 1, max: 200 }),
  ],
};

const connectionValidation = {
  request: [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('type').optional().isIn(['mentorship', 'peer']),
    body('skills').optional().isArray(),
  ],
  accept: [
    param('id').isMongoId().withMessage('Invalid connection ID'),
  ],
  reject: [
    param('id').isMongoId().withMessage('Invalid connection ID'),
  ],
};

const messageValidation = {
  send: [
    body('receiverId').isMongoId().withMessage('Invalid receiver ID'),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }),
  ],
  getMessages: [
    param('conversationId').trim().notEmpty(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
};

const reviewValidation = {
  create: [
    body('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('feedback').optional().trim().isLength({ max: 1000 }),
  ],
};

const notificationValidation = {
  getNotifications: [
    query('read').optional().isIn(['true', 'false']),
    query('type').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
};

const adminValidation = {
  listUsers: [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['user', 'admin', 'super_admin']),
    query('q').optional().trim().isLength({ max: 100 }),
  ],
  deleteSingleUser: [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
};

module.exports = {
  authValidation,
  userValidation,
  sessionValidation,
  connectionValidation,
  messageValidation,
  reviewValidation,
  notificationValidation,
  adminValidation,
};
