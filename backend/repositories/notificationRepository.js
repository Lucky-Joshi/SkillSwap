const Notification = require('../models/Notification');

class NotificationRepository {
  async create(data) {
    return Notification.create(data);
  }

  async findByUser(userId, { read = null, type = null, skip = 0, limit = 20 } = {}) {
    const query = { userId };
    if (read !== null) query.read = read;
    if (type) query.type = type;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return { notifications, total };
  }

  async markAsRead(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { read: true } },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
  }

  async countUnread(userId) {
    return Notification.countDocuments({ userId, read: false });
  }

  async deleteMany(query) {
    return Notification.deleteMany(query);
  }
}

module.exports = new NotificationRepository();
