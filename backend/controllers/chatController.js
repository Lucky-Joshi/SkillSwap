const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');
const { assertCanInteract, conversationKey } = require('../services/mentorshipService');
const { isUserOnline } = require('../socket');

const personView = (user) => user ? { ...user, _id: user.id, year: ({ year1: '1', year2: '2', year3: '3', year4: '4', year5: '5', graduate: 'Graduate' })[user.year] || user.year } : null;
const messageView = (message) => ({ ...message, _id: message.id, sender: message.senderId, receiver: message.receiverId });

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const relationships = await prisma.connection.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }], status: 'accepted', active: true },
  });
  const relationshipByOther = new Map();
  for (const rel of relationships) relationshipByOther.set(rel.userAId === userId ? rel.userBId : rel.userAId, rel);
  if (!relationshipByOther.size) return res.json({ success: true, conversations: [] });

  const whereUsers = { id: { in: [...relationshipByOther.keys()] } };
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    whereUsers.name = { contains: req.query.search.trim(), mode: 'insensitive' };
  }
  const matchingUsers = await prisma.user.findMany({ where: whereUsers, select: { id: true, name: true, avatar: true, department: true, year: true } });
  const matchingIds = new Set(matchingUsers.map((user) => user.id));
  if (!matchingIds.size) return res.json({ success: true, conversations: [] });
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' }, take: 500,
  });
  const latest = new Map();
  for (const message of messages) {
    const otherId = message.senderId === userId ? message.receiverId : message.senderId;
    if (!matchingIds.has(otherId)) continue;
    const row = latest.get(otherId) || { lastMessage: message, unread: 0 };
    if (!message.read && message.receiverId === userId) row.unread += 1;
    latest.set(otherId, row);
  }
  const userById = new Map(matchingUsers.map((user) => [user.id, personView(user)]));
  let conversations = [...latest.entries()].map(([otherId, { lastMessage, unread }]) => {
    const rel = relationshipByOther.get(otherId);
    return {
      userId: otherId,
      user: userById.get(otherId),
      online: isUserOnline(otherId),
      lastMessage: lastMessage.message,
      lastMessageAt: lastMessage.createdAt,
      lastMessageByMe: lastMessage.senderId === userId,
      unread,
      relationship: { id: rel.id, type: rel.type, role: rel.type === 'peer' ? 'peer' : (rel.userAId === userId ? 'mentor' : 'learner'), acceptedAt: rel.acceptedAt },
    };
  });
  if (req.query.unread === 'true') conversations = conversations.filter((row) => row.unread > 0);
  conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  res.json({ success: true, conversations });
});

const getMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const otherId = req.params.userId;
  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true } });
  if (!other) throw new AppError('User not found.', 404);
  await assertCanInteract(req.user.id, otherId);
  const where = { OR: [{ senderId: req.user.id, receiverId: otherId }, { senderId: otherId, receiverId: req.user.id }] };
  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: req.user.id, read: false },
    data: { read: true, readAt: new Date() },
  });
  const [rows, total] = await Promise.all([
    prisma.message.findMany({ where, orderBy: { createdAt: 'asc' }, skip, take: limit }),
    prisma.message.count({ where }),
  ]);
  res.json({ success: true, ...paginateResults(rows.map(messageView), total, page, limit) });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { receiver, message } = req.body;
  const target = await prisma.user.findUnique({ where: { id: receiver }, select: { id: true } });
  if (!target) throw new AppError('User not found.', 404);
  const relationship = await assertCanInteract(req.user.id, receiver);
  const row = await prisma.message.create({
    data: {
      senderId: req.user.id, receiverId: receiver,
      conversationId: conversationKey(req.user.id, receiver), message,
      matchId: relationship.id,
    },
  });
  res.status(201).json({ success: true, message: messageView(row) });
});

module.exports = { getConversations, getMessages, sendMessage };
