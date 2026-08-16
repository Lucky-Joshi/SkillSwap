const Notification = require('../models/Notification');

/**
 * Create a notification row and push it over Socket.IO to the recipient.
 * The socket module is required lazily to avoid a circular dependency.
 */
const notify = async ({ userId, type = 'system', title, message = '', data = null }) => {
  if (!userId) return null;
  const doc = await Notification.create({ userId, type, title, message, data });
  const { getIO } = require('../socket');
  const io = getIO();
  if (io) {
    io.to(`user:${String(userId)}`).emit('notification:new', doc);
  }
  return doc;
};

module.exports = { notify };
