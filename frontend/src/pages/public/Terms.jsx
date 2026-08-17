import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By creating an account or using SkillSwap, you agree to these Terms and Conditions.

If you do not agree, please do not use the platform.`,
  },
  {
    title: '2. About SkillSwap',
    content: `SkillSwap is a student-focused platform that enables users to:
- Learn new skills
- Teach others
- Connect with peers
- Schedule mentoring sessions
- Participate in collaborative learning`,
  },
  {
    title: '3. User Eligibility',
    content: `Users are responsible for ensuring they are permitted to use the platform under applicable laws.

If you are under the required age in your jurisdiction, you should obtain parental or guardian permission where applicable.`,
  },
  {
    title: '4. User Accounts',
    content: `You agree to:
- Provide accurate information
- Keep your password secure
- Maintain your profile responsibly
- Not impersonate another person

You are responsible for all activity under your account.`,
  },
  {
    title: '5. Acceptable Use',
    content: `Users must not:
- Harass others
- Share offensive or illegal content
- Upload malicious software
- Attempt unauthorized access
- Create fake accounts
- Spam other users
- Misuse AI features
- Violate intellectual property rights`,
  },
  {
    title: '6. Mentorship & Peer Learning',
    content: `SkillSwap only facilitates connections.

Users are responsible for:
- Their own interactions
- Session scheduling
- Communication
- Shared learning materials

SkillSwap does not guarantee learning outcomes or mentor availability.`,
  },
  {
    title: '7. AI Recommendations',
    content: `AI recommendations are generated automatically based on available information.

They are suggestions only and should not be considered guarantees or professional advice.`,
  },
  {
    title: '8. User Content',
    content: `You retain ownership of content you upload.

By uploading content, you grant SkillSwap a limited license to store, display, and process it solely for operating the platform.`,
  },
  {
    title: '9. Reviews & Ratings',
    content: `Users should provide honest and respectful feedback.

Fake, abusive, or misleading reviews may be removed.`,
  },
  {
    title: '10. Certificates & Badges',
    content: `Certificates and badges are digital recognitions of platform activity.

They do not represent official academic qualifications or professional certifications.`,
  },
  {
    title: '11. Intellectual Property',
    content: `The SkillSwap platform, logo, branding, design, and software remain the property of the SkillSwap project unless otherwise stated.

Users retain ownership of their own uploaded content.`,
  },
  {
    title: '12. Service Availability',
    content: `We strive to keep SkillSwap available but do not guarantee uninterrupted access.

The platform may be updated, modified, or temporarily unavailable for maintenance.`,
  },
  {
    title: '13. Limitation of Liability',
    content: `SkillSwap is provided "as is."

To the extent permitted by applicable law, SkillSwap is not liable for indirect, incidental, or consequential damages arising from use of the platform.`,
  },
  {
    title: '14. Account Suspension',
    content: `We may suspend or terminate accounts that:
- Violate these Terms
- Abuse other users
- Create fake accounts
- Attempt to compromise platform security
- Engage in fraudulent activities`,
  },
  {
    title: '15. Privacy',
    content: `Your use of SkillSwap is also governed by our Privacy Policy.`,
  },
  {
    title: '16. Changes to the Terms',
    content: `We may update these Terms periodically.

Continued use of SkillSwap after updates constitutes acceptance of the revised Terms.`,
  },
  {
    title: '17. Contact',
    content: `For questions regarding these Terms:

**Email:** developer.lucky.joshi@gmail.com`,
  },
];

export default function Terms() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className="badge-accent mb-4 inline-block">Legal</span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Terms & <span className="gradient-text">Conditions</span>
          </h1>
          <p className="mt-4 text-slate-500 dark:text-slate-400">
            Last Updated: August 17, 2026
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-12 space-y-10"
        >
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">
                {section.title}
              </h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {section.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li key={i} className="ml-4 list-disc text-slate-600 dark:text-slate-400">
                        {line.slice(2)}
                      </li>
                    );
                  }
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <Link to={ROUTES.CONTACT} className="btn-primary">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
