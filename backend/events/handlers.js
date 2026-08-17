const eventBus = require('./eventBus');
const notificationService = require('../services/notificationService');
const badgeService = require('../services/badgeService');
const logger = require('../utils/logger');

const registerEventHandlers = () => {
  eventBus.on('connection:requested', async ({ connection, requester }) => {
    try {
      const otherUserId =
        connection.userA.toString() === requester._id.toString()
          ? connection.userB
          : connection.userA;
      await notificationService.notify(otherUserId, {
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${requester.name} wants to connect with you`,
        data: { connectionId: connection._id },
      });
    } catch (err) {
      logger.error('Event handler error: connection:requested', err);
    }
  });

  eventBus.on('connection:accepted', async ({ connection, accepter }) => {
    try {
      const requesterId =
        connection.userA.toString() === accepter._id.toString()
          ? connection.userB
          : connection.userA;
      await notificationService.notify(requesterId, {
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: `${accepter.name} accepted your connection request`,
        data: { connectionId: connection._id },
      });
    } catch (err) {
      logger.error('Event handler error: connection:accepted', err);
    }
  });

  eventBus.on('connection:declined', async ({ connection, decliner }) => {
    try {
      const requesterId =
        connection.userA.toString() === decliner._id.toString()
          ? connection.userB
          : connection.userA;
      await notificationService.notify(requesterId, {
        type: 'connection_declined',
        title: 'Connection Declined',
        message: `${decliner.name} declined your connection request`,
        data: { connectionId: connection._id },
      });
    } catch (err) {
      logger.error('Event handler error: connection:declined', err);
    }
  });

  eventBus.on('session:booked', async ({ session, booker }) => {
    try {
      const otherUserId =
        session.mentorId.toString() === booker._id.toString()
          ? session.learnerId
          : session.mentorId;
      await notificationService.notify(otherUserId, {
        type: 'session_booked',
        title: 'New Session Booked',
        message: `${booker.name} booked a session: ${session.topic}`,
        data: { sessionId: session._id },
      });
    } catch (err) {
      logger.error('Event handler error: session:booked', err);
    }
  });

  eventBus.on('session:completed', async ({ session }) => {
    try {
      await badgeService.evaluateBadges(session.mentorId);
      await badgeService.evaluateBadges(session.learnerId);
    } catch (err) {
      logger.error('Event handler error: session:completed', err);
    }
  });

  eventBus.on('review:created', async ({ review, mentorId }) => {
    try {
      await notificationService.notify(mentorId, {
        type: 'review_received',
        title: 'New Review',
        message: `You received a ${review.rating}-star review`,
        data: { reviewId: review._id },
      });
    } catch (err) {
      logger.error('Event handler error: review:created', err);
    }
  });

  eventBus.on('badge:earned', async ({ userId, badge }) => {
    try {
      await notificationService.notify(userId, {
        type: 'badge_earned',
        title: 'Badge Earned',
        message: `You earned the "${badge.name}" badge`,
        data: { badgeId: badge._id },
      });
    } catch (err) {
      logger.error('Event handler error: badge:earned', err);
    }
  });

  logger.info('Event handlers registered');
};

module.exports = { registerEventHandlers };
