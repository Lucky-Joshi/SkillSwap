const Session = require('../models/Session');
const UserBadge = require('../models/UserBadge');
const Badge = require('../models/Badge');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');

// @route  GET /api/certificates
// @access private — certificates are generated from completed sessions.
const getCertificates = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    $or: [{ mentorId: req.user._id }, { learnerId: req.user._id }],
    status: 'completed',
  }).sort({ completedAt: -1 });

  const certificates = sessions.map((s) => {
    const isMentor = String(s.mentorId) === String(req.user._id);
    return {
      id: s._id,
      title: `Peer Mentoring Certificate — ${s.topic}`,
      role: isMentor ? 'Mentor' : 'Learner',
      topic: s.topic,
      completedAt: s.completedAt || s.updatedAt,
      hours: Math.round((s.duration || 60) / 60 * 10) / 10,
      certificateId: `SS-${String(s._id).slice(-6).toUpperCase()}`,
    };
  });

  res.json({ success: true, certificates });
});

// @route  POST /api/certificates/:sessionId/grant
// @access private — grants the Certified Learner badge.
const grantCertificate = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.sessionId);
  if (!session || session.status !== 'completed') {
    return res.status(400).json({ success: false, message: 'Completed session not found.' });
  }
  const isParticipant =
    String(session.mentorId) === String(req.user._id) || String(session.learnerId) === String(req.user._id);
  if (!isParticipant) {
    return res.status(403).json({ success: false, message: 'Not your session.' });
  }

  const badge = await Badge.findOne({ name: 'Certified Learner' });
  if (badge) {
    const exists = await UserBadge.exists({ userId: req.user._id, badgeId: badge._id });
    if (!exists) {
      await UserBadge.create({ userId: req.user._id, badgeId: badge._id, source: 'certificate' });
      await notify({
        userId: req.user._id,
        type: 'badge',
        title: 'Certificate earned!',
        message: `${badge.icon} You earned the ${badge.name} badge for completing a session.`,
      });
    }
  }

  res.json({ success: true, message: 'Certificate granted.' });
});

module.exports = { getCertificates, grantCertificate };
