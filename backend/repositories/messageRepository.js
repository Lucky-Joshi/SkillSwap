const Message = require('../models/Message');

class MessageRepository {
  async create(data) {
    return Message.create(data);
  }

  async findById(id) {
    return Message.findById(id);
  }

  async findByConversation(conversationId, { skip = 0, limit = 50, before = null } = {}) {
    const query = { conversationId };
    if (before) query.createdAt = { $lt: new Date(before) };

    return Message.find(query)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async markAsRead(conversationId, userId, messageIds) {
    return Message.updateMany(
      {
        conversationId,
        receiver: userId,
        _id: { $in: messageIds },
        read: false,
      },
      { $set: { read: true, readAt: new Date() } }
    );
  }

  async getUnreadCounts(userId) {
    return Message.aggregate([
      { $match: { receiver: userId, read: false } },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    ]);
  }

  async getConversations(userId, { search = null, skip = 0, limit = 20 } = {}) {
    const pipeline = [
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'senderInfo',
        },
      },
      { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiver',
          foreignField: '_id',
          as: 'receiverInfo',
        },
      },
      { $unwind: { path: '$receiverInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          conversationId: '$_id',
          lastMessage: 1,
          unreadCount: 1,
          senderName: '$senderInfo.name',
          senderAvatar: '$senderInfo.avatar',
          receiverName: '$receiverInfo.name',
          receiverAvatar: '$receiverInfo.avatar',
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    return Message.aggregate(pipeline);
  }

  async countUnread(conversationId, userId) {
    return Message.countDocuments({
      conversationId,
      receiver: userId,
      read: false,
    });
  }

  async deleteMany(query) {
    return Message.deleteMany(query);
  }
}

module.exports = new MessageRepository();
