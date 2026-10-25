const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

const TYPE_ALIASES = { badge: 'badge_earned', review: 'review_received', session: 'session_booked' };

const notify = async ({ userId, type = 'system', title, message = '', data = null }) => {
  if (!userId) return null;
  try {
    const notification = await prisma.notification.create({
      data: { userId: String(userId), type: TYPE_ALIASES[type] || type, title, message, data },
    });
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) io.to(`user:${String(userId)}`).emit('notification:new', { ...notification, _id: notification.id });
    return notification;
  } catch (err) {
    logger.error('Notification failed:', { userId, type, error: err.message });
    return null;
  }
};

module.exports = { notify };
