const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const skillRoutes = require('./skillRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const matchRoutes = require('./matchRoutes');
const chatRoutes = require('./chatRoutes');
const sessionRoutes = require('./sessionRoutes');
const reviewRoutes = require('./reviewRoutes');
const notificationRoutes = require('./notificationRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const badgeRoutes = require('./badgeRoutes');
const certificateRoutes = require('./certificateRoutes');
const aiRoutes = require('./aiRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const institutionRoutes = require('./institutionRoutes');
const adminRoutes = require('./adminRoutes');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use('/health', healthRoutes);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/skills', skillRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/match', matchRoutes);
router.use('/messages', chatRoutes);
router.use('/session', sessionRoutes);
router.use('/review', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/badges', badgeRoutes);
router.use('/certificates', certificateRoutes);
router.use('/ai', aiRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/institutions', institutionRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
