import { motion } from 'framer-motion';
import {
  FiUser, FiBookOpen, FiZap, FiMessageSquare, FiCalendar, FiMessageCircle, FiStar, FiAward,
} from 'react-icons/fi';
import HeroSection from '../../components/public/HeroSection';
import StepCard from '../../components/public/StepCard';
import CTASection from '../../components/public/CTASection';
import { ROUTES } from '../../utils/routes';

const STEPS = [
  { n: '01', title: 'Create Profile', desc: 'Sign up with your college email, fill in your academic details and verify your account.', icon: FiUser },
  { n: '02', title: 'Add Skills', desc: 'Pick the skills you can teach and the ones you want to learn. Set your proficiency level for each.', icon: FiBookOpen },
  { n: '03', title: 'AI Finds Matches', desc: 'Our recommendation engine scores every student by compatibility — skill match, mutual interest, availability and more.', icon: FiZap },
  { n: '04', title: 'Connect', desc: 'Send a mentorship or peer learning request. The other student accepts or rejects — you get notified instantly.', icon: FiMessageSquare },
  { n: '05', title: 'Schedule Session', desc: 'Plan a mentoring session with date, time, duration and meeting mode. Online (Google Meet, Zoom) or offline (campus, library).', icon: FiCalendar },
  { n: '06', title: 'Chat in Real Time', desc: 'Once connected, unlock real-time chat via Socket.IO. Coordinate, share resources, and stay in touch.', icon: FiMessageCircle },
  { n: '07', title: 'Learn Together', desc: 'Conduct the session, take notes, and build your skills. The AI suggests next topics when you complete a session.', icon: FiStar },
  { n: '08', title: 'Earn Rewards', desc: 'Complete sessions to earn points, unlock badges, collect certificates and climb the leaderboard.', icon: FiAward },
];

export default function HowItWorks() {
  return (
    <>
      <HeroSection
        badge="Step by step"
        title="How SkillSwap works."
        titleHighlight="From sign-up to skill mastery."
        description="Eight simple steps from creating your profile to earning certificates. The AI handles the matching — you focus on learning."
        primaryLabel="Get started"
        primaryTo={ROUTES.REGISTER}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <StepCard key={s.n} number={s.n} title={s.title} description={s.desc} icon={s.icon} delay={i * 0.08} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="glass mx-auto inline-block rounded-2xl p-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The entire flow — from sign-up to earning your first certificate — typically takes{' '}
              <span className="font-semibold text-brand-600 dark:text-brand-300">less than a week</span>.
            </p>
          </div>
        </motion.div>
      </section>

      <div className="mx-auto max-w-6xl">
        <CTASection
          title="Start your learning journey"
          description="It takes 2 minutes to create a profile. Your AI matches are ready instantly."
          primaryLabel="Create account"
          primaryTo={ROUTES.REGISTER}
          secondaryLabel="See features"
          secondaryTo={ROUTES.FEATURES}
        />
      </div>
    </>
  );
}
