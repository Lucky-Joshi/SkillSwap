const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Message = require('../models/Message');
const { notify } = require('../services/notificationService');
const { assertCanInteract, conversationKey } = require('../services/mentorshipService');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

let io = null;

const onlineUsers = new Map();

const getIO = () => io;
const isUserOnline = (userId) => onlineUsers.has(String(userId));

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('_id name');
      if (!user) return next(new Error('User not found'));
      socket.userId = String(user._id);
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    const existingSocket = onlineUsers.get(userId);
    if (existingSocket) {
      existingSocket.disconnect(true);
      logger.info(`Replaced existing socket for user ${userId}`);
    }

    onlineUsers.set(userId, socket);
    metrics.socketConnections = onlineUsers.size;
    socket.join(`user:${userId}`);
    socket.broadcast.emit('user:online', { userId });
    logger.info(`Socket connected: ${userId} (online: ${onlineUsers.size})`);

    socket.on('messages:read', async ({ from }, ack) => {
      try {
        await Message.updateMany(
          { sender: from, receiver: userId, read: false },
          { read: true, readAt: new Date() }
        );
        io.to(`user:${from}`).emit('messages:read-confirmed', { by: userId });
        if (typeof ack === 'function') ack({ success: true });
      } catch (err) {
        logger.error('Socket messages:read error:', err.message);
        if (typeof ack === 'function') ack({ success: false, error: err.message });
      }
    });

    socket.on('message:send', async ({ receiver, message }, ack) => {
      try {
        if (!receiver || !message?.trim()) {
          return ack?.({ success: false, error: 'receiver and message are required' });
        }
        const trimmed = message.trim().slice(0, 2000);
        const relationship = await assertCanInteract(userId, receiver);

        const doc = await Message.create({
          sender: userId,
          receiver,
          conversationId: conversationKey(userId, receiver),
          message: trimmed,
          matchId: relationship._id,
        });

        const payload = {
          _id: doc._id,
          sender: userId,
          receiver,
          conversationId: doc.conversationId,
          matchId: doc.matchId ? String(doc.matchId) : null,
          message: trimmed,
          read: false,
          createdAt: doc.createdAt,
        };

        io.to(`user:${receiver}`).emit('message:new', payload);
        io.to(`user:${userId}`).emit('message:sent', payload);

        await notify({
          userId: receiver,
          type: 'message_received',
          title: 'New message',
          message: trimmed.slice(0, 80),
          data: { senderId: userId },
        });

        ack?.({ success: true, message: payload });
      } catch (err) {
        logger.error('Socket message:send error:', err.message);
        ack?.({ success: false, error: err.message });
      }
    });

    socket.on('typing', ({ receiver }) => {
      io.to(`user:${receiver}`).emit('typing', { from: userId });
    });
    socket.on('typing:stop', ({ receiver }) => {
      io.to(`user:${receiver}`).emit('typing:stop', { from: userId });
    });

    socket.on('disconnect', () => {
      if (onlineUsers.get(userId) === socket) {
        onlineUsers.delete(userId);
      }
      metrics.socketConnections = onlineUsers.size;
      socket.broadcast.emit('user:offline', { userId });
      logger.info(`Socket disconnected: ${userId} (online: ${onlineUsers.size})`);
    });
  });

  return io;
};

module.exports = { initSocket, getIO, isUserOnline, onlineUsers };
