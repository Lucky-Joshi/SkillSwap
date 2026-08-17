import { motion } from 'framer-motion';
import { FiHeart, FiZap, FiUsers, FiGlobe } from 'react-icons/fi';
import HeroSection from '../../components/public/HeroSection';
import SectionHeader from '../../components/public/SectionHeader';
import CTASection from '../../components/public/CTASection';
import { ROUTES } from '../../utils/routes';

const VALUES = [
  { icon: FiHeart, title: 'Student-first', description: 'Built by students, for students. Every feature is designed to make peer learning more accessible and effective on college campuses.' },
  { icon: FiZap, title: 'AI-powered', description: 'We use cutting-edge NLP and semantic matching to connect the right mentors with the right learners — no more blind guessing.' },
  { icon: FiUsers, title: 'Community-driven', description: 'SkillSwap thrives on participation. The more students contribute — teaching, reviewing, mentoring — the better the platform gets for everyone.' },
  { icon: FiGlobe, title: 'Open & transparent', description: 'The matching algorithm is explainable. Every compatibility score comes with a breakdown so you know exactly why you were matched.' },
];

const TEAM = [
  { name: 'SkillSwap Team', role: 'Creators & Maintainers', description: 'A team of passionate developers and designers building the future of peer learning on college campuses.' },
];

export default function About() {
  return (
    <>
      <HeroSection
        badge="About us"
        title="Peer learning,"
        titleHighlight="reimagined."
        description="SkillSwap started from a simple observation: college students have incredible skills to share, but there's no good way to find the right learning partners."
        primaryLabel="Join the community"
        primaryTo={ROUTES.REGISTER}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeader
          title="Our mission"
          description="Make peer-to-peer skill exchange as natural as asking a friend for help."
        />
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg text-slate-600 dark:text-slate-300"
          >
            Every student is both a learner and a teacher. A 3rd-year CSE student can teach React
            while learning Machine Learning from a 4th-year. A design student can teach Figma
            while learning Python. SkillSwap makes these exchanges happen — automatically,
            intelligently, and with full transparency.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeader title="What we believe" />
        <div className="grid gap-6 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">{v.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeader title="Technology" description="Built with modern tools for speed, reliability and intelligence." />
        <div className="glass mx-auto max-w-3xl rounded-3xl p-8 sm:p-12">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400">Frontend</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>React 18 + Vite</li>
                <li>Tailwind CSS v3</li>
                <li>Framer Motion</li>
                <li>React Router v6</li>
                <li>Socket.IO Client</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400">Backend</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>Node.js + Express</li>
                <li>MongoDB + Mongoose</li>
                <li>Socket.IO Server</li>
                <li>JWT Authentication</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400">AI Service</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>Python FastAPI</li>
                <li>Sentence-Transformers (SBERT)</li>
                <li>TF-IDF (scikit-learn)</li>
                <li>NetworkX Skill Graph</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400">Infrastructure</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>Docker Compose</li>
                <li>MongoDB Atlas</li>
                <li>Vercel / Netlify (Frontend)</li>
                <li>Railway / Render (Backend)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl">
        <CTASection
          title="Want to contribute?"
          description="SkillSwap is open source. Check out the code, report issues, or submit a PR."
          primaryLabel="View on GitHub"
          primaryTo={ROUTES.HOME}
          secondaryLabel="Contact us"
          secondaryTo={ROUTES.CONTACT}
        />
      </div>
    </>
  );
}
