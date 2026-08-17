import { motion } from 'framer-motion';
import { FiZap, FiCpu, FiGitBranch, FiFileText, FiTrendingUp } from 'react-icons/fi';
import HeroSection from '../../components/public/HeroSection';
import SectionHeader from '../../components/public/SectionHeader';
import FeatureCard from '../../components/public/FeatureCard';
import CTASection from '../../components/public/CTASection';
import { ROUTES } from '../../utils/routes';

const AI_FEATURES = [
  {
    icon: FiZap,
    title: 'Recommendation Engine',
    description: 'Computes a compatibility score from six weighted signals: skill match (40%), mutual learning interest (20%), availability (15%), teaching rating (10%), experience level (10%), and department similarity (5%). Scores are normalized 0–100.',
    badge: '6 weighted signals',
  },
  {
    icon: FiCpu,
    title: 'Semantic Skill Matching',
    description: 'Uses SBERT (sentence-transformers/all-MiniLM-L6-v2) to embed skill names into vector space. "ReactJS" and "React" achieve ~0.89 cosine similarity — so mentors listing "React" are found by learners searching "ReactJS". Falls back to TF-IDF when the heavy stack is unavailable.',
    badge: 'SBERT + TF-IDF',
  },
  {
    icon: FiGitBranch,
    title: 'Skill Knowledge Graph',
    description: 'A NetworkX prerequisite graph (edge: prerequisite → advanced). The can_cover function checks if a mentor\'s skills can reach a learner\'s goal within 2 hops — so a Python mentor can cover "Machine Learning" through intermediate skills like NumPy and Pandas.',
    badge: 'NetworkX graph',
  },
  {
    icon: FiFileText,
    title: 'Resume Skill Extraction',
    description: 'Upload a PDF, DOCX or TXT resume. PyMuPDF and python-docx extract text, then spaCy NER (or a TF-IDF lexicon fallback) identifies skill mentions. Extracted skills are added to your profile automatically.',
  },
  {
    icon: FiTrendingUp,
    title: 'Learning Roadmaps',
    description: 'Tell the AI a goal — "Become a Data Scientist" — and get a step-by-step roadmap with skills, weeks and estimated hours. Named templates for Data Scientist, Web Developer, ML Engineer, Android Developer and UI/UX Designer, plus a generic fallback.',
  },
];

function CompatibilityBreakdown() {
  const signals = [
    ['Skill Match', 40, 'Do your teach/learn lists overlap?'],
    ['Mutual Interest', 20, 'Can you both teach each other?'],
    ['Availability', 15, 'Do your schedules align?'],
    ['Teaching Rating', 10, 'What do past learners say?'],
    ['Experience Level', 10, 'Skill depth and sessions completed'],
    ['Department', 5, 'Same or related department'],
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeader
        badge="How matching works"
        title="Compatibility scoring"
        description="Every pair of students gets a 0–100 compatibility score. Here's how it's computed."
      />
      <div className="glass mx-auto max-w-3xl rounded-3xl p-8 sm:p-12">
        <div className="space-y-4">
          {signals.map(([label, pct, desc], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4"
            >
              <div className="w-36 text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</div>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent"
                />
              </div>
              <div className="w-10 text-right text-sm font-bold text-slate-600 dark:text-slate-300">{pct}%</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Example:</span> A 3rd-year CSE student who knows React and wants to learn Python
            gets a 92% match with a 4th-year student who knows Python and wants to learn React — high skill overlap,
            mutual interest, and complementary goals.
          </p>
        </div>
      </div>
    </section>
  );
}

function ArchitectureDiagram() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeader
        badge="Architecture"
        title="System overview"
        description="The AI service runs as a separate FastAPI microservice, called by the Node.js backend."
      />
      <div className="glass mx-auto max-w-3xl rounded-3xl p-8 sm:p-12">
        <pre className="overflow-x-auto text-xs leading-relaxed text-slate-600 dark:text-slate-300">
{`┌─────────────────────────────────┐
│       React Frontend            │
│   (Vite · Tailwind · Framer)    │
└────────────┬────────────────────┘
             │ HTTP + WebSocket
┌────────────▼────────────────────┐
│     Node.js + Express Backend   │
│   (JWT · Socket.IO · Multer)    │
└──────┬──────────────┬───────────┘
       │              │
┌──────▼──────┐ ┌─────▼──────────────┐
│  MongoDB 7  │ │  FastAPI AI Service │
│ (Mongoose)  │ │  SBERT · TF-IDF     │
└─────────────┘ │  NetworkX · spaCy   │
                └─────────────────────}`}
        </pre>
      </div>
    </section>
  );
}

export default function AI() {
  return (
    <>
      <HeroSection
        badge="AI Technology"
        title="Intelligence under the hood."
        titleHighlight="Semantic matching, not keywords."
        description="SkillSwap uses sentence-transformers, TF-IDF, NetworkX graphs and spaCy NER to power matching, roadmaps and resume parsing."
        primaryLabel="Try it now"
        primaryTo={ROUTES.REGISTER}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AI_FEATURES.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} badge={f.badge} delay={i * 0.08} />
          ))}
        </div>
      </section>

      <CompatibilityBreakdown />
      <ArchitectureDiagram />

      <div className="mx-auto max-w-6xl">
        <CTASection
          title="Experience AI-powered matching"
          description="Create a free account and see your compatibility scores instantly."
          primaryLabel="Get started"
          primaryTo={ROUTES.REGISTER}
          secondaryLabel="See all features"
          secondaryTo={ROUTES.FEATURES}
        />
      </div>
    </>
  );
}
