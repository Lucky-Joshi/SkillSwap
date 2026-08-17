const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginateResults } = require('../utils/paginate');

// @route  GET /api/notifications?page=&limit=&read=&type=
// @access private
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { userId: req.user._id };
  if (req.query.read === 'true') filter.read = true;
  if (req.query.read === 'false') filter.read = false;
  if (req.query.type && req.query.type.trim()) filter.type = req.query.type.trim();

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);
  res.json({
    success: true,
    ...paginateResults(notifications, total, page, limit),
    unreadCount,
  });
});

// @route  PUT /api/notifications/:id/read
// @access private
const markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true, readAt: new Date() },
    { new: true }
  );
  res.json({ success: true, notification: notif });
});

// @route  PUT /api/notifications/read-all
// @access private
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = { getNotifications, markRead, markAllRead };
