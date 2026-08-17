const Review = require('../models/Review');

class ReviewRepository {
  async create(data) {
    return Review.create(data);
  }

  async findByMentor(mentorId, { skip = 0, limit = 20 } = {}) {
    const [reviews, total] = await Promise.all([
      Review.find({ mentor: mentorId })
        .populate('learner', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ mentor: mentorId }),
    ]);
    return { reviews, total };
  }

  async findForSession(sessionId) {
    return Review.findOne({ sessionId });
  }

  async getAverageRating(mentorId) {
    const result = await Review.aggregate([
      { $match: { mentor: mentorId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);
    return result[0] || { avgRating: 0, count: 0 };
  }
}

module.exports = new ReviewRepository();
