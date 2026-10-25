const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');

const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const where = { userId: req.user.id };
  if (req.query.read === 'true') where.read = true;
  if (req.query.read === 'false') where.read = false;
  if (typeof req.query.type === 'string' && req.query.type.trim()) where.type = req.query.type.trim();

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, read: false } }),
  ]);
  const notifications = rows.map((row) => ({ ...row, _id: row.id }));
  res.json({ success: true, ...paginateResults(notifications, total, page, limit), unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  const [notification] = await prisma.notification.updateManyAndReturn({
    where: { id: req.params.id, userId: req.user.id },
    data: { read: true, readAt: new Date() },
  });
  if (!notification) throw new AppError('Notification not found.', 404);
  res.json({ success: true, notification: notification ? { ...notification, _id: notification.id } : null });
});

const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true, readAt: new Date() },
  });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = { getNotifications, markRead, markAllRead };
