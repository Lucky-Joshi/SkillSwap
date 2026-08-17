const Message = require('../models/Message');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');
const { assertCanInteract, conversationKey, findRelationship } = require('../services/mentorshipService');
const { isUserOnline } = require('../socket');

// @route  GET /api/messages/conversations?search=&unread=
// @access private — only conversations with an active mentorship/peer relationship
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { search, unread } = req.query;

  // Accepted + active connections only. Chat is never global.
  const relationships = await require('../models/Connection').find({
    $or: [{ userA: userId }, { userB: userId }],
    status: 'accepted',
    active: true,
  });

  const allowedIds = new Set();
  const relationByOther = new Map();
  for (const rel of relationships) {
    const otherId = String(rel.userA) === String(userId) ? String(rel.userB) : String(rel.userA);
    allowedIds.add(otherId);
    relationByOther.set(otherId, rel);
  }
  if (allowedIds.size === 0) return res.json({ success: true, conversations: [] });

  // If searching by name, pre-filter allowed IDs to those matching the search
  let filteredIds = allowedIds;
  if (search && search.trim()) {
    const matchingUsers = await User.find({
      _id: { $in: [...allowedIds] },
      name: { $regex: search.trim(), $options: 'i' },
    }).select('_id');
    filteredIds = new Set(matchingUsers.map((u) => String(u._id)));
    if (filteredIds.size === 0) return res.json({ success: true, conversations: [] });
  }

  const messages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(500);

  const map = new Map();
  for (const m of messages) {
    const otherId = String(m.sender) === String(userId) ? String(m.receiver) : String(m.sender);
    if (!filteredIds.has(otherId)) continue;
    if (!map.has(otherId)) {
      map.set(otherId, { lastMessage: m, unread: !m.read && String(m.receiver) === String(userId) ? 1 : 0 });
    } else {
      const entry = map.get(otherId);
      if (!m.read && String(m.receiver) === String(userId)) entry.unread += 1;
    }
  }

  const conversations = [];
  for (const [otherId, { lastMessage, unread }] of map) {
    const other = await User.findById(otherId).select('name email avatar department year');
    const rel = relationByOther.get(otherId);
    conversations.push({
      userId: otherId,
      user: other,
      online: isUserOnline(otherId),
      lastMessage: lastMessage.message,
      lastMessageAt: lastMessage.createdAt,
      lastMessageByMe: String(lastMessage.sender) === String(userId),
      unread,
      relationship: {
        id: rel._id,
        type: rel.type,
        role: rel.type === 'peer' ? 'peer' : (String(rel.userA) === String(userId) ? 'mentor' : 'learner'),
        acceptedAt: rel.acceptedAt,
      },
    });
  }

  // If unread filter, exclude conversations with no unread messages
  let result = conversations;
  if (unread === 'true') result = conversations.filter((c) => c.unread > 0);

  result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  res.json({ success: true, conversations: result });
});

// @route  GET /api/messages/:userId?page=&limit=
// @access private — only with an active relationship
const getMessages = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = paginate(req);

  const otherId = req.params.userId;
  const other = await User.findById(otherId);
  if (!other) throw new AppError('User not found.', 404);

  await assertCanInteract(req.user._id, otherId);

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

// @route  POST /api/messages { receiver, message }
// @access private — only with an active relationship
const sendMessage = asyncHandler(async (req, res, next) => {
  const { receiver, message, matchId } = req.body;
  const target = await User.findById(receiver);
  if (!target) throw new AppError('User not found.', 404);

  const relationship = await assertCanInteract(req.user._id, receiver);

  const doc = await Message.create({
    sender: req.user._id,
    receiver,
    conversationId: conversationKey(req.user._id, receiver),
    message,
    matchId: relationship._id,
  });

  res.status(201).json({ success: true, message: doc });
});

module.exports = { getConversations, getMessages, sendMessage };
