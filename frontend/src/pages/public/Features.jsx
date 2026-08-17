import { motion } from 'framer-motion';
import {
  FiZap, FiUsers, FiMessageSquare, FiCalendar, FiTrendingUp, FiFileText,
  FiAward, FiBookOpen, FiSearch,
} from 'react-icons/fi';
import HeroSection from '../../components/public/HeroSection';
import FeatureCard from '../../components/public/FeatureCard';
import CTASection from '../../components/public/CTASection';
import { ROUTES } from '../../utils/routes';

const FEATURES = [
  {
    icon: FiZap,
    title: 'AI Mentor Matching',
    description: 'Our recommendation engine uses semantic embeddings to match you with the best mentors. It understands that "ReactJS", "React" and "React.js" are the same skill — so matches are precise, not keyword-guessing.',
    badge: 'Powered by SBERT',
  },
  {
    icon: FiUsers,
    title: 'Peer Learning',
    description: 'Not just top-down mentoring. SkillSwap supports mutual peer exchanges where both students teach each other different skills. You learn Python, they learn React — everyone grows.',
    badge: 'Two-way exchange',
  },
  {
    icon: FiSearch,
    title: 'Skill Exchange',
    description: 'Browse students by skill, category, department and availability. Filter by what you want to learn or what you can teach. The discovery page makes finding the right match effortless.',
  },
  {
    icon: FiCalendar,
    title: 'Session Scheduling',
    description: 'Plan mentoring sessions with date, time, duration and meeting mode (online or offline). Track pending, confirmed and completed sessions in a clean dashboard.',
  },
  {
    icon: FiTrendingUp,
    title: 'AI Learning Roadmaps',
    description: 'Tell the AI your goal — "Become a Data Scientist" — and get a personalized, step-by-step roadmap with skills, weeks and estimated hours for each stage.',
    badge: 'Goal-based',
  },
  {
    icon: FiFileText,
    title: 'Resume Parsing',
    description: 'Upload your resume (PDF, DOCX or TXT) and our AI extracts your skills automatically. No more manual entry — the system detects what you know from your resume.',
  },
  {
    icon: FiAward,
    title: 'Certificates',
    description: 'Earn a unique certificate (SS-XXXXXX) every time you complete a mentoring session. Build a verifiable record of your teaching and learning contributions.',
  },
  {
    icon: FiBookOpen,
    title: 'Badges & Points',
    description: 'Unlock 8+ achievement badges — First Steps, Profile Pro, Session Master, Mentor Star and more. Earn points that feed into the leaderboard rankings.',
  },
  {
    icon: FiUsers,
    title: 'Leaderboards',
    description: 'Compete with peers on the campus leaderboard. Rankings are based on points earned from badges, sessions completed, reviews received and overall engagement.',
  },
];

export default function Features() {
  return (
    <>
      <HeroSection
        badge="Platform Features"
        title="Built for peer learning."
        titleHighlight="Every feature, one purpose."
        description="SkillSwap packs everything you need for effective peer mentorship — from AI matching to session tracking, badges and roadmaps."
        primaryLabel="Get started free"
        primaryTo={ROUTES.REGISTER}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06 }}
              className="glass card-hover rounded-2xl p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-xl text-white shadow-lg">
                <f.icon />
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.description}</p>
              {f.badge && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  {f.badge}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl">
        <CTASection
          title="Ready to start?"
          description="Join your college's peer learning community today."
          primaryLabel="Create account"
          primaryTo={ROUTES.REGISTER}
          secondaryLabel="See how it works"
          secondaryTo={ROUTES.HOW_IT_WORKS}
        />
      </div>
    </>
  );
}
