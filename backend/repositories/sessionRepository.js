const Session = require('../models/Session');

class SessionRepository {
  async findById(id) {
    return Session.findById(id);
  }

  async findByIdLean(id) {
    return Session.findById(id).lean();
  }

  async create(data) {
    return Session.create(data);
  }

  async updateById(id, update, options = {}) {
    return Session.findByIdAndUpdate(id, update, { new: true, runValidators: true, ...options });
  }

  async findByUser(userId, filters = {}) {
    const query = {
      $or: [{ mentorId: userId }, { learnerId: userId }],
    };

    if (filters.status) query.status = filters.status;
    if (filters.meetingMode) query.meetingMode = filters.meetingMode;
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { topic: { $regex: filters.search, $options: 'i' } },
        ],
      });
    }

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate('mentorId', 'name avatar')
        .populate('learnerId', 'name avatar')
        .sort(filters.sort || { date: -1 })
        .skip(filters.skip || 0)
        .limit(filters.limit || 20)
        .lean(),
      Session.countDocuments(query),
    ]);

    return { sessions, total };
  }

  async findByDateRange(userId, startDate, endDate) {
    return Session.find({
      $or: [{ mentorId: userId }, { learnerId: userId }],
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] },
    })
      .populate('mentorId', 'name avatar')
      .populate('learnerId', 'name avatar')
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  async findUpcomingReminders(cutoffDate) {
    return Session.find({
      status: { $in: ['pending', 'confirmed'] },
      date: { $lte: cutoffDate },
    })
      .populate('mentorId', 'name email')
      .populate('learnerId', 'name email')
      .lean();
  }

  async countByUser(userId) {
    return Session.countDocuments({
      $or: [{ mentorId: userId }, { learnerId: userId }],
    });
  }

  async getStatsByUser(userId) {
    const results = await Session.aggregate([
      { $match: { $or: [{ mentorId: userId }, { learnerId: userId }] } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
        },
      },
    ]);
    return results;
  }

  async deleteMany(query) {
    return Session.deleteMany(query);
  }
}

module.exports = new SessionRepository();
