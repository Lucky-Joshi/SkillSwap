const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const notify = async ({ userId, type = 'system', title, message = '', data = null }) => {
  if (!userId) return null;
  try {
    const doc = await Notification.create({ userId, type, title, message, data });
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      io.to(`user:${String(userId)}`).emit('notification:new', doc);
    }
    return doc;
  } catch (err) {
    logger.error('Notification failed:', { userId, type, error: err.message });
    return null;
  }
};

module.exports = { notify };
