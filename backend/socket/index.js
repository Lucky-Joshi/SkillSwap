const { Server } = require('socket.io');
const config = require('../config/env');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../utils/token');
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
    cors: { origin: config.corsOrigins, methods: ['GET', 'POST'], credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, name: true, status: true } });
      if (!user || ['suspended', 'deleted', 'banned'].includes(user.status)) return next(new Error('Account unavailable'));
      socket.userId = user.id;
      socket.userName = user.name;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const existingSocket = onlineUsers.get(userId);
    if (existingSocket) existingSocket.disconnect(true);
    onlineUsers.set(userId, socket);
    metrics.socketConnections = onlineUsers.size;
    socket.join(`user:${userId}`);
    socket.broadcast.emit('user:online', { userId });

    socket.on('messages:read', async ({ from } = {}, ack) => {
      try {
        if (!from || from === userId) throw new Error('Invalid conversation');
        await assertCanInteract(userId, from);
        await prisma.message.updateMany({ where: { senderId: from, receiverId: userId, read: false }, data: { read: true, readAt: new Date() } });
        io.to(`user:${from}`).emit('messages:read-confirmed', { by: userId });
        ack?.({ success: true });
      } catch (err) {
        logger.warn('Socket messages:read rejected', { userId, error: err.message });
        ack?.({ success: false, error: 'Could not mark messages as read.' });
      }
    });

    socket.on('message:send', async ({ receiver, message } = {}, ack) => {
      try {
        if (typeof receiver !== 'string' || typeof message !== 'string' || !message.trim()) throw new Error('Invalid message');
        const trimmed = message.trim().slice(0, 2000);
        const relationship = await assertCanInteract(userId, receiver);
        const row = await prisma.message.create({ data: { senderId: userId, receiverId: receiver, conversationId: conversationKey(userId, receiver), message: trimmed, matchId: relationship.id } });
        const payload = { ...row, _id: row.id, sender: userId, receiver, matchId: row.matchId, read: false };
        io.to(`user:${receiver}`).emit('message:new', payload);
        io.to(`user:${userId}`).emit('message:sent', payload);
        await notify({ userId: receiver, type: 'message_received', title: 'New message', message: trimmed.slice(0, 80), data: { senderId: userId } });
        ack?.({ success: true, message: payload });
      } catch (err) {
        logger.warn('Socket message:send rejected', { userId, error: err.message });
        ack?.({ success: false, error: 'Message could not be sent.' });
      }
    });

    const relayTyping = async (event) => async ({ receiver } = {}) => {
      if (!receiver || receiver === userId) return;
      try {
        await assertCanInteract(userId, receiver);
        io.to(`user:${receiver}`).emit(event, { from: userId });
      } catch (err) {
        logger.warn('Socket typing event rejected', { userId, error: err.message });
      }
    };
    socket.on('typing', relayTyping('typing'));
    socket.on('typing:stop', relayTyping('typing:stop'));

    socket.on('disconnect', () => {
      if (onlineUsers.get(userId) === socket) onlineUsers.delete(userId);
      metrics.socketConnections = onlineUsers.size;
      socket.broadcast.emit('user:offline', { userId });
    });
  });
  return io;
};

module.exports = { initSocket, getIO, isUserOnline, onlineUsers };
