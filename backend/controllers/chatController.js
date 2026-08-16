const Message = require('../models/Message');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');

// @route  GET /api/messages/conversations
// @access private
const getConversations = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .limit(500);

  const map = new Map();
  for (const m of messages) {
    const otherId = String(m.sender) === String(req.user._id) ? String(m.receiver) : String(m.sender);
    if (!map.has(otherId)) {
      map.set(otherId, { lastMessage: m, unread: !m.read && String(m.receiver) === String(req.user._id) ? 1 : 0 });
    } else {
      const entry = map.get(otherId);
      if (!m.read && String(m.receiver) === String(req.user._id)) entry.unread += 1;
    }
  }

  const conversations = [];
  for (const [otherId, { lastMessage, unread }] of map) {
    const other = await User.findById(otherId).select('name email avatar department year');
    conversations.push({
      userId: otherId,
      user: other,
      lastMessage: lastMessage.message,
      lastMessageAt: lastMessage.createdAt,
      lastMessageByMe: String(lastMessage.sender) === String(req.user._id),
      unread,
    });
  }

  conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  res.json({ success: true, conversations });
});

// @route  GET /api/messages/:userId?page=&limit=
// @access private
const getMessages = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = paginate(req);

  const otherId = req.params.userId;
  const other = await User.findById(otherId);
  if (!other) throw new AppError('User not found.', 404);

  const filter = {
    $or: [
      { sender: req.user._id, receiver: otherId },
      { sender: otherId, receiver: req.user._id },
    ],
  };

  // mark inbound as read (before querying so responses are accurate)
  await Message.updateMany(
    { sender: otherId, receiver: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );

  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit),
    Message.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResults(messages, total, page, limit) });
});

// @route  POST /api/messages { receiver, message, matchId? }
// @access private
const sendMessage = asyncHandler(async (req, res, next) => {
  const { receiver, message, matchId } = req.body;
  const target = await User.findById(receiver);
  if (!target) throw new AppError('User not found.', 404);

  const doc = await Message.create({
    sender: req.user._id,
    receiver,
    message,
    matchId: matchId || undefined,
  });

  res.status(201).json({ success: true, message: doc });
});

module.exports = { getConversations, getMessages, sendMessage };
