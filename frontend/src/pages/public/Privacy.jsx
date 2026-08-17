import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/routes';

const sections = [
  {
    title: '1. Introduction',
    content: `Welcome to SkillSwap.

SkillSwap is a peer-to-peer learning platform that helps students connect with mentors, learners, and peers based on their skills, interests, and academic background.

Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information.

By using SkillSwap, you agree to this Privacy Policy.`,
  },
  {
    title: '2. Information We Collect',
    content: `When you create an account, we may collect:

**Personal Information**
- Full Name
- Email Address
- Profile Picture
- Username
- Institution Name
- Qualification
- Department
- Academic Year/Class
- Bio
- Skills
- Learning Interests

**Account Information**
- Login Credentials (encrypted)
- Authentication Tokens
- Account Preferences

**Usage Information**
- Pages visited
- Search history
- Skills viewed
- Session history
- Chat metadata
- Device type
- Browser information
- IP address
- Log data

**Uploaded Content**
- Resume
- Profile Image
- Certificates
- Portfolio Links`,
  },
  {
    title: '3. How We Use Your Information',
    content: `We use your information to:
- Create and manage your account
- Recommend mentors and peer learners
- Improve AI-based recommendations
- Schedule learning sessions
- Enable real-time messaging
- Generate certificates
- Award badges
- Improve platform performance
- Detect fraudulent activity
- Respond to support requests`,
  },
  {
    title: '4. AI Features',
    content: `SkillSwap uses artificial intelligence to:
- Recommend suitable mentors
- Recommend peer learners
- Analyze skills
- Generate learning roadmaps
- Suggest related skills
- Parse resumes (optional)

AI recommendations are generated automatically and may not always be perfect.`,
  },
  {
    title: '5. Information Sharing',
    content: `We do not sell your personal information.

We may share information only:
- With other users as part of your public profile
- When required by law
- To protect the security of the platform
- With trusted infrastructure providers that help operate the platform`,
  },
  {
    title: '6. Public Profile Information',
    content: `Depending on your privacy settings, other users may see:
- Name
- Profile Picture
- Institution
- Skills
- Bio
- Badges
- Certificates
- Reviews
- Ratings

Private information such as your email address and authentication credentials is not displayed publicly.`,
  },
  {
    title: '7. Data Security',
    content: `We implement reasonable security measures including:
- Password hashing
- JWT authentication
- Secure API communication
- Input validation
- Database security
- Access control
- Encrypted connections (HTTPS in production)

However, no online platform can guarantee absolute security.`,
  },
  {
    title: '8. Cookies',
    content: `SkillSwap may use cookies or similar technologies to:
- Keep you logged in
- Remember preferences
- Improve performance
- Analyze usage`,
  },
  {
    title: '9. Data Retention',
    content: `We retain your data while your account is active or as necessary to provide the service.

If you delete your account, we will delete or anonymize your data where reasonably possible, except where retention is required by law.`,
  },
  {
    title: '10. Your Rights',
    content: `You may:
- Update your profile
- Change your password
- Delete your account
- Request correction of inaccurate information
- Control profile visibility through privacy settings`,
  },
  {
    title: '11. Children\'s Privacy',
    content: `SkillSwap is intended for students.

If users under the age required by applicable law use the platform, they should do so with appropriate parental or guardian permission where necessary.`,
  },
  {
    title: '12. Third-Party Services',
    content: `SkillSwap may integrate with services such as:
- GitHub
- Google Authentication (if enabled)
- LinkedIn (future)
- MongoDB Atlas
- Cloud hosting providers

These services have their own privacy policies.`,
  },
  {
    title: '13. Changes to this Privacy Policy',
    content: `We may update this Privacy Policy from time to time.

Continued use of SkillSwap after changes means you accept the updated policy.`,
  },
  {
    title: '14. Contact',
    content: `For privacy-related questions, contact:

**Email:** developer.lucky.joshi@gmail.com`,
  },
];

export default function Privacy() {
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
            Privacy <span className="gradient-text">Policy</span>
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
