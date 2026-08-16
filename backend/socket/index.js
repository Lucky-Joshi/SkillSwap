const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Message = require('../models/Message');
const { notify } = require('../services/notificationService');

let io = null;

const getIO = () => io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.userId = String(user._id);
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    console.log(`[socket] user connected: ${userId}`);

    // Mark a conversation as read when the client opens it
    socket.on('messages:read', async ({ from }, ack) => {
      try {
        await Message.updateMany(
          { sender: from, receiver: userId, read: false },
          { read: true, readAt: new Date() }
        );
        io.to(`user:${from}`).emit('messages:read-confirmed', { by: userId });
        if (typeof ack === 'function') ack({ success: true });
      } catch (err) {
        if (typeof ack === 'function') ack({ success: false, error: err.message });
      }
    });

    // Send + persist a chat message
    socket.on('message:send', async ({ receiver, message, matchId }, ack) => {
      try {
        if (!receiver || !message?.trim()) {
          return ack?.({ success: false, error: 'receiver and message are required' });
        }
        const doc = await Message.create({
          sender: userId,
          receiver,
          message: message.trim().slice(0, 2000),
          matchId: matchId || undefined,
        });

        io.to(`user:${receiver}`).emit('message:new', {
          ...doc.toObject(),
          sender: String(doc.sender),
          receiver: String(doc.receiver),
          matchId: doc.matchId ? String(doc.matchId) : null,
        });

        // Also echo back to the sender (other tabs)
        io.to(`user:${userId}`).emit('message:sent', {
          ...doc.toObject(),
          sender: String(doc.sender),
          receiver: String(doc.receiver),
          matchId: doc.matchId ? String(doc.matchId) : null,
        });

        await notify({
          userId: receiver,
          type: 'message',
          title: 'New message',
          message: message.trim().slice(0, 80),
          data: { senderId: userId },
        });

        ack?.({ success: true, message: doc });
      } catch (err) {
        ack?.({ success: false, error: err.message });
      }
    });

    // Typing indicator
    socket.on('typing', ({ receiver }) => {
      io.to(`user:${receiver}`).emit('typing', { from: userId });
    });
    socket.on('typing:stop', ({ receiver }) => {
      io.to(`user:${receiver}`).emit('typing:stop', { from: userId });
    });

    socket.on('disconnect', () => {
      console.log(`[socket] user disconnected: ${userId}`);
    });
  });

  return io;
};

module.exports = { initSocket, getIO };
