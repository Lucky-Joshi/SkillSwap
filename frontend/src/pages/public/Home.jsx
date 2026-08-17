import { motion } from 'framer-motion';
import {
  FiZap, FiUsers, FiMessageSquare, FiAward, FiBookOpen, FiGithub, FiCheckCircle,
  FiArrowRight, FiSearch, FiCalendar, FiTrendingUp, FiClock, FiFileText,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import HeroSection from '../../components/public/HeroSection';
import FeatureCard from '../../components/public/FeatureCard';
import StepCard from '../../components/public/StepCard';
import SectionHeader from '../../components/public/SectionHeader';
import CTASection from '../../components/public/CTASection';
import { ROUTES } from '../../utils/routes';

const FEATURES = [
  { icon: FiZap, title: 'AI-Powered Matching', desc: 'Semantic skill matching understands that ReactJS, React and React.js are the same — and recommends the best mentors and learners.' },
  { icon: FiUsers, title: 'Peer Mentorship', desc: 'Request learning support from upperclassmen and pay it forward by teaching what you know.' },
  { icon: FiMessageSquare, title: 'Real-Time Chat', desc: 'Message your matched peers instantly over Socket.IO the moment a request is accepted.' },
  { icon: FiCalendar, title: 'Session Scheduling', desc: 'Plan mentoring sessions, track completion and build a study rhythm that sticks.' },
  { icon: FiAward, title: 'Badges & Certificates', desc: 'Earn points, unlock badges and collect certificates as you teach and learn.' },
  { icon: FiTrendingUp, title: 'Learning Roadmaps', desc: 'Tell the AI a goal — "I want to be a Data Scientist" — and get a step-by-step roadmap.' },
];

const STEPS = [
  { n: '01', title: 'Create your profile', desc: 'Verify your college email and pick the skills you can teach and want to learn.' },
  { n: '02', title: 'AI finds your matches', desc: 'Our engine scores every student by compatibility — skill match, mutual interest, availability and more.' },
  { n: '03', title: 'Connect & chat', desc: 'Send a learning request, get accepted, and open a real-time conversation.' },
  { n: '04', title: 'Learn, teach, grow', desc: 'Schedule sessions, earn badges, climb the leaderboard and collect certificates.' },
];

const TESTIMONIALS = [
  { name: 'Aarav S.', role: '3rd Year · CSE', text: 'SkillSwap matched me with three juniors who needed DSA help. Teaching them sharpened my own fundamentals.' },
  { name: 'Priya N.', role: '2nd Year · ECE', text: 'I wanted to break into ML. My mentor walked me through NumPy and Pandas week by week. The roadmap feature is a game changer.' },
  { name: 'Rohan M.', role: '4th Year · CSE', text: 'The compatibility score is eerily accurate. Every match has been someone I actually enjoy working with.' },
];

const FLOATING_CARDS = [
  { emoji: '⚛️', chip: '96% match', chipColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300', title: 'React Mentor found', desc: 'Rohan M. can teach React, Node & Docker', anim: { y: [0, -10, 0] }, dur: 4 },
  { emoji: '🐍', chip: 'Roadmap ready', chipColor: 'bg-brand-500/15 text-brand-700 dark:text-brand-300', title: 'Data Science Roadmap', desc: 'Python → NumPy → Pandas → ML → Deep Learning', anim: { y: [0, -14, 0] }, dur: 4.5 },
  { emoji: '🏅', chip: '+40 pts', chipColor: 'bg-accent/15 text-amber-600 dark:text-amber-300', title: 'Badge unlocked', desc: 'Session Master · 3rd session completed', anim: { y: [0, -8, 0] }, dur: 4.2 },
];

const FORMULA = [
  ['Skill Match', 40],
  ['Mutual Learning Interest', 20],
  ['Availability', 15],
  ['Teaching Rating', 10],
  ['Experience Level', 10],
  ['Department Similarity', 5],
];

function TrustedBy() {
  return (
    <section className="border-y border-slate-200/60 bg-white/60 py-8 dark:border-white/10 dark:bg-slate-900/40">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-4 text-sm font-semibold text-slate-400">
        <span className="flex items-center gap-2"><FiGithub /> GitHub for expertise</span>
        <span className="flex items-center gap-2"><FiUsers /> LinkedIn for skills</span>
        <span className="flex items-center gap-2"><FiBookOpen /> AI-powered mentoring</span>
        <span className="flex items-center gap-2"><FiCheckCircle /> Verified college community</span>
      </div>
    </section>
  );
}

function FloatingCards() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl">
      <div className="pointer-events-none absolute -top-8 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="relative grid gap-4 sm:grid-cols-3">
        {FLOATING_CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            animate={card.anim}
            transition={{ repeat: Infinity, duration: card.dur, delay: i * 0.4 }}
            className="glass rounded-2xl p-5 text-left"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xl">{card.emoji}</span>
              <span className={`chip ${card.chipColor}`}>{card.chip}</span>
            </div>
            <div className="font-semibold">{card.title}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AIHighlightSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="glass grid gap-10 rounded-3xl p-8 sm:p-12 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Matchmaking, powered by AI</h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Every student gets a compatibility score computed from six signals,
            using semantic embeddings that understand intent, not just keywords.
          </p>
          <div className="mt-6 space-y-3">
            {FORMULA.map(([label, pct]) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-44 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent"
                  />
                </div>
                <div className="w-8 text-right text-sm font-bold">{pct}%</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-8 dark:border-white/10 dark:bg-slate-950/40">
          <div className="text-5xl">🤖</div>
          <div className="text-center">
            <div className="font-display text-3xl font-extrabold text-emerald-500">96%</div>
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Excellent Match</div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {['React', 'Node.js', 'REST APIs', 'MongoDB'].map((s) => (
              <span key={s} className="chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                ✓ {s}
              </span>
            ))}
          </div>
          <p className="max-w-xs text-center text-xs text-slate-500 dark:text-slate-400">
            "ReactJS", "React" and "React.js" are understood as the same skill thanks to sentence-transformer embeddings.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <HeroSection
        badge="AI-powered peer learning platform"
        badgeIcon={FiZap}
        title="Learn from your peers."
        titleHighlight="Teach what you know."
        description="SkillSwap connects college students for peer mentorship — AI matches you with the perfect mentor or learner based on your skills, goals and availability."
        primaryLabel="Start learning free"
        primaryTo={ROUTES.REGISTER}
        secondaryLabel="I have an account"
        secondaryTo={ROUTES.LOGIN}
      >
        <p className="mt-4 text-xs text-slate-400">Demo account: demo@skillswap.io / demo1234</p>
        <FloatingCards />
      </HeroSection>

      <TrustedBy />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeader
          title="Everything you need to grow"
          description="A complete skill exchange ecosystem, purpose-built for college campuses."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.desc} delay={i * 0.08} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeader title="How it works" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <StepCard key={s.n} number={s.n} title={s.title} description={s.desc} delay={i * 0.1} />
          ))}
        </div>
      </section>

      <AIHighlightSection />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeader title="Loved by students" />
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="mb-3 text-accent">★★★★★</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">"{t.text}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent font-bold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl">
        <CTASection
          title="Ready to swap skills?"
          description="Join your college's peer learning community today. It's free."
          primaryLabel="Create account"
          primaryTo={ROUTES.REGISTER}
          secondaryLabel="Log in"
          secondaryTo={ROUTES.LOGIN}
        />
      </div>
    </>
  );
}
