import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiZap, FiUsers, FiMessageSquare, FiAward, FiBookOpen, FiGithub, FiCheckCircle,
  FiMoon, FiSun, FiArrowRight, FiSearch, FiCalendar, FiTrendingUp,
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

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

export default function Landing() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-brand-50/50 text-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950/40 dark:text-slate-100">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent text-xl font-black text-white shadow-glow">
            ⇄
          </div>
          <span className="font-display text-xl font-extrabold">
            Skill<span className="gradient-text">Swap</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:text-brand-600 dark:border-white/10 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-20 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
            <FiZap className="h-3.5 w-3.5" />
            AI-powered peer learning platform
          </div>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-6xl">
            Learn from your peers. <br />
            <span className="gradient-text">Teach what you know.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-500 dark:text-slate-400 sm:text-lg">
            SkillSwap connects college students for peer mentorship — AI matches you
            with the perfect mentor or learner based on your skills, goals and availability.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base">
              Start learning free <FiArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3.5 text-base">
              I have an account
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">Demo account: demo@skillswap.io / demo1234</p>

          {/* Floating cards */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="pointer-events-none absolute -top-8 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="relative grid gap-4 sm:grid-cols-3">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="glass rounded-2xl p-5 text-left">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">⚛️</span>
                  <span className="chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">96% match</span>
                </div>
                <div className="font-semibold">React Mentor found</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Rohan M. can teach React, Node & Docker</div>
              </motion.div>
              <motion.div animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: 0.4 }} className="glass rounded-2xl p-5 text-left">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">🐍</span>
                  <span className="chip bg-brand-500/15 text-brand-700 dark:text-brand-300">Roadmap ready</span>
                </div>
                <div className="font-semibold">Data Science Roadmap</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Python → NumPy → Pandas → ML → Deep Learning</div>
              </motion.div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4.2, delay: 0.8 }} className="glass rounded-2xl p-5 text-left">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">🏅</span>
                  <span className="chip bg-accent/15 text-amber-600 dark:text-amber-300">+40 pts</span>
                </div>
                <div className="font-semibold">Badge unlocked</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Session Master · 3rd session completed</div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Logos strip */}
      <section className="border-y border-slate-200/60 bg-white/60 py-8 dark:border-white/10 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-4 text-sm font-semibold text-slate-400">
          <span className="flex items-center gap-2"><FiGithub /> GitHub for expertise</span>
          <span className="flex items-center gap-2"><FiUsers /> LinkedIn for skills</span>
          <span className="flex items-center gap-2"><FiBookOpen /> AI-powered mentoring</span>
          <span className="flex items-center gap-2"><FiCheckCircle /> Verified college community</span>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Everything you need to grow</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-500 dark:text-slate-400">
            A complete skill exchange ecosystem, purpose-built for college campuses.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08 }}
              className="glass card-hover rounded-2xl p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-xl text-white shadow-lg">
                <f.icon />
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">How it works</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur dark:border-white/10 dark:bg-slate-900/50"
            >
              <div className="gradient-text font-display text-4xl font-extrabold">{s.n}</div>
              <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recommendation formula */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="glass grid gap-10 rounded-3xl p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Matchmaking, powered by AI</h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Every student gets a compatibility score computed from six signals,
              using semantic embeddings that understand intent, not just keywords.
            </p>
            <div className="mt-6 space-y-3">
              {[
                ['Skill Match', 40],
                ['Mutual Learning Interest', 20],
                ['Availability', 15],
                ['Teaching Rating', 10],
                ['Experience Level', 10],
                ['Department Similarity', 5],
              ].map(([label, pct]) => (
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

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Loved by students</h2>
        </div>
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

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-accent p-10 text-center text-white sm:p-16"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Ready to swap skills?</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-100">
            Join your college's peer learning community today. It's free.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-brand-700 shadow-lg transition hover:bg-brand-50">
              Create account <FiArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">
              <FiSearch className="h-5 w-5" /> Log in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent text-xs font-black text-white">⇄</div>
            <span className="font-semibold text-slate-500 dark:text-slate-300">SkillSwap</span>
          </div>
          <p>© {new Date().getFullYear()} SkillSwap · AI-Powered Peer Learning Platform</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-brand-500">About</span>
            <span className="cursor-pointer hover:text-brand-500">Privacy</span>
            <span className="cursor-pointer hover:text-brand-500">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
