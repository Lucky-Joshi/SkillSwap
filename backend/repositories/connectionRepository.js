const Connection = require('../models/Connection');

class ConnectionRepository {
  async findById(id) {
    return Connection.findById(id);
  }

  async findByIdLean(id) {
    return Connection.findById(id).lean();
  }

  async create(data) {
    return Connection.create(data);
  }

  async updateById(id, update, options = {}) {
    return Connection.findByIdAndUpdate(id, update, { new: true, runValidators: true, ...options });
  }

  async findBetweenUsers(userAId, userBId) {
    return Connection.findOne({
      $or: [
        { userA: userAId, userB: userBId },
        { userA: userBId, userB: userAId },
      ],
    });
  }

  async findByUser(userId, filters = {}) {
    const query = {
      $or: [{ userA: userId }, { userB: userId }],
      active: true,
    };

    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    const [connections, total] = await Promise.all([
      Connection.find(query)
        .populate('userA', 'name avatar skills')
        .populate('userB', 'name avatar skills')
        .sort(filters.sort || { updatedAt: -1 })
        .skip(filters.skip || 0)
        .limit(filters.limit || 20)
        .lean(),
      Connection.countDocuments(query),
    ]);

    return { connections, total };
  }

  async findPendingRequests(userId, { skip = 0, limit = 20 } = {}) {
    const query = {
      status: 'pending',
      $or: [
        { userA: userId },
        { userB: userId },
      ],
    };

    const [requests, total] = await Promise.all([
      Connection.find(query)
        .populate('userA', 'name avatar skills')
        .populate('userB', 'name avatar skills')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Connection.countDocuments(query),
    ]);

    return { requests, total };
  }

  async getStats(userId) {
    const stats = await Connection.aggregate([
      { $match: { $or: [{ userA: userId }, { userB: userId }] } },
      {
        $group: {
          _id: { status: '$status', type: '$type' },
          count: { $sum: 1 },
        },
      },
    ]);
    return stats;
  }

  async findActiveByUser(userId) {
    return Connection.find({
      $or: [{ userA: userId }, { userB: userId }],
      active: true,
      status: 'accepted',
    })
      .populate('userA', 'name avatar')
      .populate('userB', 'name avatar')
      .lean();
  }

  async deleteMany(query) {
    return Connection.deleteMany(query);
  }
}

module.exports = new ConnectionRepository();
