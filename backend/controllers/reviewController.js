const Review = require('../models/Review');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');
const { queueTrustRefresh } = require('../services/trustService');
const { paginate, paginateResults } = require('../utils/paginate');

// @route  POST /api/review { mentor, rating, feedback, sessionId? }
// @access private
const createReview = asyncHandler(async (req, res, next) => {
  const { mentor, rating, feedback, sessionId } = req.body;
  const mentorUser = await User.findById(mentor);
  if (!mentorUser) throw new AppError('Mentor not found.', 404);
  if (String(mentor) === String(req.user._id)) {
    throw new AppError('You cannot review yourself.', 400);
  }

  const review = await Review.create({
    mentor,
    learner: req.user._id,
    rating,
    feedback: feedback || '',
    sessionId,
  });

  // Recompute mentor's aggregate rating
  const agg = await Review.aggregate([
    { $match: { mentor: mentorUser._id } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const stats = agg[0] || { avg: rating, count: 1 };
  await User.findByIdAndUpdate(mentorUser._id, {
    rating: Math.round(stats.avg * 10) / 10,
    reviewCount: stats.count,
  });

  await notify({
    userId: mentorUser._id,
    type: 'review',
    title: 'New review received',
    message: `${req.user.name} rated you ${rating}/5.`,
    data: { reviewId: review._id },
  });
  queueTrustRefresh(mentorUser._id);
  queueTrustRefresh(req.user._id);

  res.status(201).json({ success: true, review });
});

// @route  GET /api/review/:userId?page=
// @access private
const getUserReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { mentor: req.params.userId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('learner', 'name avatar department year')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResults(reviews, total, page, limit) });
});

module.exports = { createReview, getUserReviews };
