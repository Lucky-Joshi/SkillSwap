const Session = require('../models/Session');
const { notify } = require('./notificationService');
const { effectiveStart } = require('./sessionService');

/**
 * Periodically finds confirmed sessions starting within the reminder window
 * and notifies both participants once. Called by a setInterval in server.js.
 */
const sendSessionReminders = async ({ withinMs = 60 * 60 * 1000, toleranceMs = 2 * 60 * 1000 } = {}) => {
  const now = Date.now();
  const windowStart = now - toleranceMs;
  const windowEnd = now + withinMs;

  const sessions = await Session.find({
    status: 'confirmed',
    reminderSent: false,
  });

  const due = sessions.filter((s) => {
    const start = effectiveStart(s).getTime();
    return start >= windowStart && start <= windowEnd;
  });

  for (const session of due) {
    try {
      await notify({
        userId: session.mentorId,
        type: 'reminder',
        title: 'Session reminder ⏰',
        message: `"${session.topic}" starts at ${session.startTime}.`,
        data: { sessionId: session._id },
      });
      await notify({
        userId: session.learnerId,
        type: 'reminder',
        title: 'Session reminder ⏰',
        message: `"${session.topic}" starts at ${session.startTime}.`,
        data: { sessionId: session._id },
      });
      session.reminderSent = true;
      await session.save();
    } catch (err) {
      console.warn(`[reminder] failed for session ${session._id}: ${err.message}`);
    }
  }

  return due.length;
};

const startReminderScheduler = () =>
  setInterval(() => {
    sendSessionReminders().catch((err) => console.warn('[reminder] scheduler error:', err.message));
  }, 60 * 1000);

module.exports = { sendSessionReminders, startReminderScheduler };
