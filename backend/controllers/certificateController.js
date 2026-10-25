const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');

const getCertificates = asyncHandler(async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { status: 'completed', OR: [{ mentorId: req.user.id }, { learnerId: req.user.id }] },
    orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
  });
  const certificates = sessions.map((session) => {
    const isMentor = session.mentorId === req.user.id;
    return {
      id: session.id,
      title: `Peer Mentoring Certificate — ${session.topic}`,
      role: isMentor ? 'Mentor' : 'Learner',
      topic: session.topic,
      completedAt: session.completedAt || session.updatedAt,
      hours: Math.round((session.duration || 60) / 60 * 10) / 10,
      certificateId: `SS-${session.id.slice(-6).toUpperCase()}`,
    };
  });
  res.json({ success: true, certificates });
});

const grantCertificate = asyncHandler(async (req, res) => {
  const session = await prisma.session.findUnique({ where: { id: req.params.sessionId } });
  if (!session || session.status !== 'completed') {
    return res.status(400).json({ success: false, message: 'Completed session not found.' });
  }
  if (session.mentorId !== req.user.id && session.learnerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not your session.' });
  }

  const badge = await prisma.badge.findUnique({ where: { name: 'Certified Learner' } });
  if (badge) {
    try {
      await prisma.userBadge.create({ data: { userId: req.user.id, badgeId: badge.id, source: 'certificate' } });
      await prisma.user.update({ where: { id: req.user.id }, data: { points: { increment: badge.points } } });
      await notify({
        userId: req.user.id,
        type: 'badge_earned',
        title: 'Certificate earned!',
        message: `${badge.icon} You earned the ${badge.name} badge for completing a session.`,
      });
    } catch (error) {
      if (error.code !== 'P2002') throw error;
    }
  }
  res.json({ success: true, message: 'Certificate granted.' });
});

module.exports = { getCertificates, grantCertificate };
