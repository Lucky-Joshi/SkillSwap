const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');
const { queueTrustRefresh } = require('../services/trustService');
const { paginate, paginateResults } = require('../utils/paginate');

const createReview = asyncHandler(async (req, res) => {
  const { mentor, rating, feedback, sessionId } = req.body;
  const mentorUser = await prisma.user.findUnique({ where: { id: mentor } });
  if (!mentorUser) throw new AppError('Mentor not found.', 404);
  if (mentor === req.user.id) throw new AppError('You cannot review yourself.', 400);
  const session = await prisma.session.findUnique({ where: { id: sessionId || '' } });
  if (!session || session.status !== 'completed' || session.learnerId !== req.user.id || session.mentorId !== mentor) {
    throw new AppError('You can review a mentor after completing a session with them.', 403);
  }

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.upsert({
      where: { mentorId_learnerId_sessionId: { mentorId: mentor, learnerId: req.user.id, sessionId } },
      create: { mentorId: mentor, learnerId: req.user.id, rating, feedback: feedback || '', sessionId },
      update: { rating, feedback: feedback || '' },
    });
    const stats = await tx.review.aggregate({ where: { mentorId: mentor }, _avg: { rating: true }, _count: { _all: true } });
    await tx.user.update({ where: { id: mentor }, data: { rating: Math.round((stats._avg.rating || rating) * 10) / 10, reviewCount: stats._count._all } });
    return created;
  });
  await notify({
    userId: mentor,
    type: 'review_received',
    title: 'New review received',
    message: `${req.user.name} rated you ${rating}/5.`,
    data: { reviewId: review.id },
  });
  queueTrustRefresh(mentor);
  queueTrustRefresh(req.user.id);
  res.status(201).json({ success: true, review: { ...review, _id: review.id } });
});

const getUserReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const where = { mentorId: req.params.userId };
  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { learner: { select: { id: true, name: true, avatar: true, department: true, year: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);
  const reviews = rows.map(({ learner, ...review }) => ({
    ...review,
    _id: review.id,
    learner: learner ? { ...learner, _id: learner.id, year: ({ year1: '1', year2: '2', year3: '3', year4: '4', year5: '5', graduate: 'Graduate' })[learner.year] || learner.year } : null,
  }));
  res.json({ success: true, ...paginateResults(reviews, total, page, limit) });
});

module.exports = { createReview, getUserReviews };
