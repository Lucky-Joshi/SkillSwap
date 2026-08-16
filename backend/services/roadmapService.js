/**
 * Heuristic fallbacks for roadmap / skill graph used when the FastAPI
 * service is unreachable.
 */

const ROADMAP_TEMPLATES = {
  'data scientist': [
    { title: 'Python Fundamentals', description: 'Syntax, control flow, functions, OOP.', skills: ['Python'], weeks: 2, hours: 20 },
    { title: 'NumPy & Data Manipulation', description: 'Arrays, vectorized operations.', skills: ['NumPy'], weeks: 1, hours: 12 },
    { title: 'Pandas & Data Wrangling', description: 'DataFrames, cleaning, joining.', skills: ['Pandas'], weeks: 2, hours: 18 },
    { title: 'Statistics & Probability', description: 'Distributions, hypothesis testing, regression.', skills: ['Statistics'], weeks: 3, hours: 25 },
    { title: 'Data Visualization', description: 'Matplotlib, Seaborn, storytelling with data.', skills: ['Data Analysis', 'Power BI'], weeks: 1, hours: 10 },
    { title: 'Machine Learning', description: 'Supervised & unsupervised learning with scikit-learn.', skills: ['Machine Learning'], weeks: 4, hours: 40 },
    { title: 'Deep Learning (optional)', description: 'Neural networks with TensorFlow/PyTorch.', skills: ['Deep Learning'], weeks: 4, hours: 35 },
    { title: 'Real-World Projects', description: 'Portfolio projects on real datasets.', skills: ['Machine Learning'], weeks: 4, hours: 45 },
    { title: 'Interview Preparation', description: 'SQL, ML case studies, behavioral rounds.', skills: ['SQL', 'Communication'], weeks: 2, hours: 15 },
  ],
  'web developer': [
    { title: 'HTML, CSS & JavaScript', description: 'Semantics, flexbox/grid, DOM.', skills: ['HTML & CSS', 'JavaScript'], weeks: 3, hours: 30 },
    { title: 'Git & GitHub', description: 'Version control, branching, PRs.', skills: ['Git & GitHub'], weeks: 1, hours: 8 },
    { title: 'Modern Frontend Framework', description: 'Components, state, hooks (React).', skills: ['React'], weeks: 4, hours: 40 },
    { title: 'Backend Fundamentals', description: 'REST APIs with Node + Express.', skills: ['Node.js', 'Express.js'], weeks: 3, hours: 30 },
    { title: 'Databases', description: 'Modeling, SQL & MongoDB.', skills: ['SQL', 'MongoDB'], weeks: 2, hours: 20 },
    { title: 'Auth, Security & Deployment', description: 'JWT, HTTPS, hosting (Vercel/Railway).', skills: ['Docker', 'CI/CD'], weeks: 2, hours: 20 },
    { title: 'Full-Stack Projects', description: '2–3 portfolio-ready apps.', skills: ['React', 'Node.js'], weeks: 4, hours: 50 },
    { title: 'Interview Preparation', description: 'DSA, system design basics, live coding.', skills: ['Data Structures & Algorithms'], weeks: 3, hours: 25 },
  ],
  'ml engineer': [
    { title: 'Python & SQL', description: 'Strong Python + data querying.', skills: ['Python', 'SQL'], weeks: 3, hours: 30 },
    { title: 'Math for ML', description: 'Linear algebra, calculus, probability.', skills: ['Statistics'], weeks: 3, hours: 30 },
    { title: 'Data Science Toolkit', description: 'NumPy, Pandas, matplotlib.', skills: ['NumPy', 'Pandas'], weeks: 2, hours: 20 },
    { title: 'Classic Machine Learning', description: 'scikit-learn end to end.', skills: ['Machine Learning'], weeks: 4, hours: 40 },
    { title: 'Deep Learning', description: 'PyTorch/TensorFlow, CNNs, RNNs.', skills: ['Deep Learning', 'PyTorch'], weeks: 5, hours: 50 },
    { title: 'MLOps', description: 'Docker, model serving, CI/CD.', skills: ['Docker', 'CI/CD'], weeks: 3, hours: 25 },
    { title: 'Capstone Projects', description: '2–3 deployed ML products.', skills: ['Machine Learning'], weeks: 4, hours: 45 },
    { title: 'Interview Preparation', description: 'ML theory, coding, system design.', skills: ['Data Structures & Algorithms'], weeks: 3, hours: 20 },
  ],
  'android developer': [
    { title: 'Java/Kotlin Basics', description: 'OOP with Kotlin.', skills: ['Java'], weeks: 3, hours: 25 },
    { title: 'App Fundamentals', description: 'Activities, layouts, intents.', skills: ['React Native'], weeks: 2, hours: 15 },
    { title: 'UI with Jetpack Compose', description: 'Modern declarative UI.', skills: ['UX/UI Design'], weeks: 3, hours: 25 },
    { title: 'Networking & Data', description: 'REST APIs, Retrofit, Room.', skills: ['REST APIs', 'SQL'], weeks: 3, hours: 25 },
    { title: 'Advanced Android', description: 'Coroutines, DI, testing.', skills: ['C#'], weeks: 3, hours: 25 },
    { title: 'Publishing', description: 'Play Store release, metrics.', skills: ['Marketing'], weeks: 1, hours: 8 },
    { title: 'Projects', description: '2–3 apps on Play Store.', skills: ['React Native'], weeks: 4, hours: 40 },
  ],
  'ui ux designer': [
    { title: 'Design Fundamentals', description: 'Color, typography, layout, hierarchy.', skills: ['UX/UI Design'], weeks: 2, hours: 15 },
    { title: 'UX Research', description: 'User interviews, personas, journeys.', skills: ['Communication'], weeks: 2, hours: 15 },
    { title: 'Wireframing & Prototyping', description: 'Figma mastery.', skills: ['Figma'], weeks: 3, hours: 25 },
    { title: 'Interaction & Motion', description: 'Micro-interactions, states.', skills: ['Figma'], weeks: 2, hours: 15 },
    { title: 'Design Systems', description: 'Tokens, components, documentation.', skills: ['UX/UI Design'], weeks: 2, hours: 18 },
    { title: 'Portfolio & Case Studies', description: '3 polished case studies.', skills: ['Technical Writing'], weeks: 3, hours: 25 },
  ],
};

const DEFAULT_STEPS = [
  { title: 'Fundamentals', description: 'Learn the core concepts and tools.', skills: [], weeks: 2, hours: 20 },
  { title: 'Build Projects', description: 'Apply skills to real mini-projects.', skills: [], weeks: 3, hours: 30 },
  { title: 'Advanced Topics', description: 'Deep-dive into advanced areas.', skills: [], weeks: 3, hours: 25 },
  { title: 'Portfolio & Networking', description: 'Showcase work and connect with peers.', skills: ['Communication'], weeks: 2, hours: 15 },
  { title: 'Interview Preparation', description: 'Practice, mock interviews, apply.', skills: ['Public Speaking'], weeks: 2, hours: 15 },
];

const generateRoadmap = (goal = '') => {
  const lower = goal.toLowerCase();
  let steps = null;
  for (const [key, value] of Object.entries(ROADMAP_TEMPLATES)) {
    if (lower.includes(key.split(' ')[0]) || lower.includes(key)) {
      steps = value;
      break;
    }
  }
  if (!steps) {
    steps = DEFAULT_STEPS.map((s, i) => ({ ...s, skills: i === 0 ? ['Python'] : s.skills }));
  }
  return {
    goal,
    steps,
    totalEstimatedHours: steps.reduce((acc, s) => acc + (s.hours || 0), 0),
  };
};

const SKILL_GRAPH = {
  JavaScript: ['React', 'Node.js', 'Next.js', 'Vue.js', 'TypeScript'],
  React: ['Redux', 'Next.js', 'React Native', 'Tailwind CSS', 'GraphQL'],
  Python: ['NumPy', 'Pandas', 'Django', 'Flask', 'Machine Learning', 'FastAPI'],
  'Node.js': ['Express.js', 'MongoDB', 'GraphQL', 'Docker'],
  'Machine Learning': ['Deep Learning', 'TensorFlow', 'PyTorch', 'Natural Language Processing'],
  SQL: ['MongoDB', 'PostgreSQL', 'Data Science'],
  'HTML & CSS': ['JavaScript', 'Tailwind CSS', 'React'],
  TypeScript: ['React', 'Next.js', 'Angular'],
};

const fallbackSkillGraph = () => {
  const nodes = [];
  const edges = [];
  Object.entries(SKILL_GRAPH).forEach(([parent, children]) => {
    nodes.push({ id: parent, group: 'skill' });
    children.forEach((child) => {
      nodes.push({ id: child, group: 'skill' });
      edges.push({ source: parent, target: child });
    });
  });
  return { nodes: Array.from(new Map(nodes.map((n) => [n.id, n])).values()), edges };
};

const fallbackRelated = (skill) => {
  const direct = SKILL_GRAPH[skill] || [];
  const related = new Set(direct);
  Object.entries(SKILL_GRAPH).forEach(([parent, children]) => {
    if (children.includes(skill)) related.add(parent);
  });
  return [...related].slice(0, 8);
};

module.exports = { generateRoadmap, fallbackSkillGraph, fallbackRelated, ROADMAP_TEMPLATES };
