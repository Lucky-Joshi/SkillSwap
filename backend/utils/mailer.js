const config = require('../config/env');

const sendMail = async ({ to, subject, html }) => {
  if (!config.resendApiKey || !config.emailFrom) {
    if (config.env === 'production') throw new Error('Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
    console.info(`[mail:development] ${subject} -> ${to}\n${html.replace(/<[^>]+>/g, '').trim()}`);
    return { delivered: false, mode: 'development' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: config.emailFrom, to: [to], subject, html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email provider rejected the message (${response.status}): ${details.slice(0, 300)}`);
  }
  return response.json();
};

module.exports = { sendMail };
