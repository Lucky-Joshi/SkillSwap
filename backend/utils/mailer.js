/**
 * Dev mailer. In production, wire this to SendGrid / Postmark / SES.
 * Because the prototype has no SMTP credentials, verification links are
 * logged to the console and also stored so they can be replayed.
 */
const sendMail = async ({ to, subject, html }) => {
  // eslint-disable-next-line no-console
  console.log('\n===== [SkillSwap Email] =====');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(html.replace(/<[^>]+>/g, '').trim());
  console.log('==============================\n');
  return true;
};

module.exports = { sendMail };
