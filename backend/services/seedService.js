const Skill = require('../models/Skill');
const Badge = require('../models/Badge');
const Institution = require('../models/Institution');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Match = require('../models/Match');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const UserBadge = require('../models/UserBadge');
const { deleteUserData } = require('./cleanupService');

const SKILLS = [
  // programming
  ['Python', ['python3', 'py'], 'programming', 'beginner', '🐍'],
  ['JavaScript', ['js', 'es6', 'vanilla js'], 'programming', 'beginner', '⚡'],
  ['TypeScript', ['ts'], 'programming', 'intermediate', '🟦'],
  ['Java', [], 'programming', 'intermediate', '☕'],
  ['C / C++', ['cpp', 'c'], 'programming', 'intermediate', '⚙️'],
  ['C#', ['csharp'], 'programming', 'intermediate', '🎮'],
  ['Go', ['golang'], 'programming', 'intermediate', '🐹'],
  ['Rust', [], 'programming', 'advanced', '🦀'],
  ['Data Structures & Algorithms', ['dsa', 'algorithms'], 'programming', 'intermediate', '🧠'],
  ['Git & GitHub', ['git', 'github', 'version control'], 'programming', 'beginner', '🐙'],
  ['Cybersecurity', ['security', 'ethical hacking'], 'programming', 'advanced', '🔐'],
  ['Blockchain', ['web3'], 'programming', 'advanced', '⛓️'],
  // frontend
  ['HTML & CSS', ['html', 'css'], 'frontend', 'beginner', '🌐'],
  ['React', ['reactjs', 'react.js'], 'frontend', 'intermediate', '⚛️'],
  ['React Native', [], 'frontend', 'intermediate', '📱'],
  ['Vue.js', ['vue'], 'frontend', 'intermediate', '💚'],
  ['Angular', [], 'frontend', 'intermediate', '🔺'],
  ['Next.js', ['nextjs'], 'frontend', 'advanced', '▲'],
  ['Tailwind CSS', ['tailwind'], 'frontend', 'beginner', '🎨'],
  ['Sass', [], 'frontend', 'beginner', '💅'],
  ['Bootstrap', [], 'frontend', 'beginner', '🥾'],
  ['UX/UI Design', ['ui', 'ux', 'ui ux design'], 'design', 'intermediate', '🎨'],
  ['Figma', [], 'design', 'beginner', '🖌️'],
  ['Adobe Photoshop', ['photoshop'], 'design', 'beginner', '🎭'],
  ['Video Editing', ['premiere pro'], 'design', 'beginner', '🎬'],
  // backend
  ['Node.js', ['node', 'nodejs'], 'backend', 'intermediate', '🟢'],
  ['Express.js', ['express'], 'backend', 'intermediate', '🚂'],
  ['Django', [], 'backend', 'intermediate', '🎸'],
  ['Flask', [], 'backend', 'intermediate', '🌶️'],
  ['FastAPI', [], 'backend', 'intermediate', '⚡'],
  ['GraphQL', [], 'backend', 'intermediate', '🔗'],
  ['REST APIs', ['rest', 'api design'], 'backend', 'intermediate', '🔌'],
  ['Firebase', [], 'backend', 'intermediate', '🔥'],
  // database
  ['SQL', ['mysql', 'postgresql', 'sqlite'], 'database', 'beginner', '🗄️'],
  ['MongoDB', [], 'database', 'intermediate', '🍃'],
  ['Redis', [], 'database', 'intermediate', '🔴'],
  // data science / ai-ml
  ['Data Science', [], 'data-science', 'advanced', '📊'],
  ['Data Analysis', ['pandas', 'analytics'], 'data-science', 'intermediate', '📈'],
  ['NumPy', [], 'data-science', 'intermediate', '🔢'],
  ['Pandas', [], 'data-science', 'intermediate', '🐼'],
  ['Statistics', [], 'data-science', 'intermediate', '📐'],
  ['Power BI', [], 'data-science', 'intermediate', '📉'],
  ['Tableau', [], 'data-science', 'intermediate', '📊'],
  ['Excel', ['spreadsheets'], 'business', 'beginner', '📗'],
  ['Machine Learning', ['ml'], 'ai-ml', 'advanced', '🤖'],
  ['Deep Learning', ['dl'], 'ai-ml', 'advanced', '🧬'],
  ['TensorFlow', [], 'ai-ml', 'advanced', '🧠'],
  ['PyTorch', [], 'ai-ml', 'advanced', '🔥'],
  ['Natural Language Processing', ['nlp'], 'ai-ml', 'advanced', '💬'],
  ['Computer Vision', [], 'ai-ml', 'advanced', '👁️'],
  // cloud / devops
  ['Docker', ['containerization'], 'cloud-devops', 'intermediate', '🐳'],
  ['Kubernetes', ['k8s'], 'cloud-devops', 'advanced', '☸️'],
  ['AWS', ['amazon web services'], 'cloud-devops', 'intermediate', '☁️'],
  ['Azure', [], 'cloud-devops', 'intermediate', '🔷'],
  ['Google Cloud', ['gcp'], 'cloud-devops', 'intermediate', '☁️'],
  ['Linux', [], 'cloud-devops', 'beginner', '🐧'],
  ['CI/CD', ['github actions', 'devops'], 'cloud-devops', 'intermediate', '🔁'],
  // soft skills / languages / business
  ['Public Speaking', [], 'soft-skills', 'beginner', '🎤'],
  ['Leadership', [], 'soft-skills', 'intermediate', '👑'],
  ['Communication', [], 'soft-skills', 'beginner', '💬'],
  ['Technical Writing', ['writing'], 'soft-skills', 'beginner', '✍️'],
  ['Spanish', [], 'languages', 'beginner', '🇪🇸'],
  ['German', [], 'languages', 'beginner', '🇩🇪'],
  ['French', [], 'languages', 'beginner', '🇫🇷'],
  ['Hindi', [], 'languages', 'beginner', '🇮🇳'],
  ['Finance', [], 'business', 'beginner', '💰'],
  ['Marketing', [], 'business', 'beginner', '📣'],
  ['Entrepreneurship', [], 'business', 'intermediate', '🚀'],
  ['Project Management', ['agile', 'scrum'], 'business', 'intermediate', '📋'],
];

const BADGES = [
  ['First Steps', 'Complete your first skill', '🐣', 10, 'Complete your profile with at least one skill', true],
  ['Profile Pro', 'Complete your profile and add 3 skills', '🎓', 15, 'bio + 3 skills', true],
  ['Skill Collector', 'Add 5 or more skills', '🧩', 20, '5+ skills', true],
  ['First Match', 'Get your first match accepted', '🤝', 25, 'first accepted connection', true],
  ['Networker', 'Have 3 active connections', '🌐', 30, '3+ connections', true],
  ['Session Master', 'Complete your first mentoring session', '⏱️', 40, '1 completed session', true],
  ['Mentor Star', 'Receive 5 or more reviews', '⭐', 50, '5+ reviews', true],
  ['Certified Learner', 'Earn your first certificate', '📜', 35, 'manually granted', false],
  ['Top Contributor', 'Earn 100 points', '🏆', 100, '100+ points', true],
];

const INSTITUTIONS = [
  ['National Institute of Technology', 'New Delhi', 'India', 'university'],
  ['Indian Institute of Technology Delhi', 'New Delhi', 'India', 'university'],
  ['Indian Institute of Technology Bombay', 'Mumbai', 'India', 'university'],
  ['Indian Institute of Technology Madras', 'Chennai', 'India', 'university'],
  ['Indian Institute of Technology Kharagpur', 'Kharagpur', 'India', 'university'],
  ['Indian Institute of Technology Kanpur', 'Kanpur', 'India', 'university'],
  ['Indian Institute of Technology Roorkee', 'Roorkee', 'India', 'university'],
  ['Birla Institute of Technology and Science', 'Pilani', 'India', 'university'],
  ['Delhi Technological University', 'New Delhi', 'India', 'university'],
  ['Vellore Institute of Technology', 'Vellore', 'India', 'university'],
  ['SRM Institute of Science and Technology', 'Chennai', 'India', 'university'],
  ['Anna University', 'Chennai', 'India', 'university'],
  ['University of Mumbai', 'Mumbai', 'India', 'university'],
  ['Pune University (SPPU)', 'Pune', 'India', 'university'],
  ['Jadavpur University', 'Kolkata', 'India', 'university'],
  ['Osmania University', 'Hyderabad', 'India', 'university'],
  ['Manipal Institute of Technology', 'Manipal', 'India', 'college'],
  ['College of Engineering Pune', 'Pune', 'India', 'college'],
  ['NIT Warangal', 'Warangal', 'India', 'university'],
  ['NIT Trichy', 'Tiruchirappalli', 'India', 'university'],
  ['Indian Statistical Institute', 'Kolkata', 'India', 'university'],
  ['Christ University', 'Bengaluru', 'India', 'university'],
  ['Lovely Professional University', 'Phagwara', 'India', 'university'],
  ['Amity University', 'Noida', 'India', 'university'],
  ['Jamia Millia Islamia', 'New Delhi', 'India', 'university'],
  ['BITS Hyderabad', 'Hyderabad', 'India', 'university'],
  ['MIT World Peace University', 'Pune', 'India', 'university'],
  ['Kalinga Institute of Industrial Technology', 'Bhubaneswar', 'India', 'university'],
  ['PSG College of Technology', 'Coimbatore', 'India', 'college'],
  ['St. Xavier\'s College Mumbai', 'Mumbai', 'India', 'college'],
  ['Harvard University', 'Cambridge', 'USA', 'university'],
  ['Stanford University', 'Stanford', 'USA', 'university'],
  ['Massachusetts Institute of Technology', 'Cambridge', 'USA', 'university'],
  ['University of California, Berkeley', 'Berkeley', 'USA', 'university'],
  ['University of Oxford', 'Oxford', 'UK', 'university'],
  ['University of Cambridge', 'Cambridge', 'UK', 'university'],
  ['National University of Singapore', 'Singapore', 'Singapore', 'university'],
  ['University of Toronto', 'Toronto', 'Canada', 'university'],
];

const DEMO_USERS = [
  {
    name: 'Aarav Sharma', email: 'aarav@skillswap.io', department: 'Computer Science', year: '3',
    qualification: 'B.Tech', college: 'National Institute of Technology',
    bio: 'Full-stack developer building products with React and Node. Love teaching DSA.',
    avatar: 'https://i.pravatar.cc/150?img=12', github: 'https://github.com/aarav',
    linkedin: 'https://linkedin.com/in/aarav', availability: 'evenings',
    rating: 4.8, reviewCount: 12, points: 240, isVerified: true,
    canTeach: ['React', 'Node.js', 'Data Structures & Algorithms'],
    wantToLearn: ['Machine Learning', 'Go'],
  },
  {
    name: 'Priya Nair', email: 'priya@skillswap.io', department: 'Electronics', year: '2',
    qualification: 'B.Tech', college: 'National Institute of Technology',
    bio: 'Data enthusiast exploring ML and analytics. Python + Pandas daily.',
    avatar: 'https://i.pravatar.cc/150?img=32', github: 'https://github.com/priya',
    availability: 'weekends', rating: 4.6, reviewCount: 8, points: 190, isVerified: true,
    canTeach: ['Python', 'Pandas', 'Statistics', 'Data Analysis'],
    wantToLearn: ['Deep Learning', 'Docker', 'AWS'],
  },
  {
    name: 'Rohan Mehta', email: 'rohan@skillswap.io', department: 'Computer Science', year: '4',
    qualification: 'B.Tech', college: 'National Institute of Technology',
    bio: 'Backend engineer. Microservices, Node, and cloud. Mentor for backend careers.',
    avatar: 'https://i.pravatar.cc/150?img=33', github: 'https://github.com/rohan',
    availability: 'mornings', rating: 4.9, reviewCount: 21, points: 320, isVerified: true,
    canTeach: ['Node.js', 'Express.js', 'Docker', 'REST APIs', 'MongoDB'],
    wantToLearn: ['Kubernetes', 'Go'],
  },
  {
    name: 'Sneha Iyer', email: 'sneha@skillswap.io', department: 'Design', year: '3',
    qualification: 'B.Tech', college: 'National Institute of Technology',
    bio: 'Product designer. Figma, UI/UX and design systems. Teaching design thinking.',
    avatar: 'https://i.pravatar.cc/150?img=45', availability: 'evenings',
    rating: 4.7, reviewCount: 15, points: 210, isVerified: true,
    canTeach: ['UX/UI Design', 'Figma', 'Adobe Photoshop'],
    wantToLearn: ['React', 'Public Speaking'],
  },
  {
    name: 'Kabir Singh', email: 'kabir@skillswap.io', department: 'Mechanical', year: '2',
    qualification: 'B.Tech', college: 'National Institute of Technology',
    bio: 'Started coding last year. DSA and competitive programming focus.',
    avatar: 'https://i.pravatar.cc/150?img=59', availability: 'weekdays',
    rating: 4.4, reviewCount: 5, points: 90, isVerified: true,
    canTeach: ['C / C++', 'Git & GitHub'],
    wantToLearn: ['Data Structures & Algorithms', 'Python', 'JavaScript'],
  },
  {
    name: 'Ananya Gupta', email: 'ananya@skillswap.io', department: 'Computer Science', year: '1',
    qualification: 'B.Tech', college: 'National Institute of Technology',
    bio: 'First year, learning the basics. Web dev beginner.',
    avatar: 'https://i.pravatar.cc/150?img=47', availability: 'anytime',
    rating: 4.2, reviewCount: 3, points: 60, isVerified: true,
    canTeach: ['Communication', 'Hindi'],
    wantToLearn: ['HTML & CSS', 'JavaScript', 'React', 'Tailwind CSS'],
  },
  {
    name: 'Vikram Reddy', email: 'vikram@skillswap.io', department: 'Data Science', year: '4',
    qualification: 'B.Tech', college: 'National Institute of Technology',
    bio: 'ML engineer in the making. PyTorch, NLP, computer vision.',
    avatar: 'https://i.pravatar.cc/150?img=68', availability: 'evenings',
    rating: 4.8, reviewCount: 18, points: 300, isVerified: true,
    canTeach: ['Machine Learning', 'PyTorch', 'Natural Language Processing', 'Python'],
    wantToLearn: ['Kubernetes', 'Cloud'],
  },
  {
    name: 'Isha Kapoor', email: 'isha@skillswap.io', department: 'Business', year: '3',
    qualification: 'MBA', college: 'National Institute of Technology',
    bio: 'Marketing + entrepreneurship. Building a student startup.',
    avatar: 'https://i.pravatar.cc/150?img=31', availability: 'weekends',
    rating: 4.5, reviewCount: 9, points: 130, isVerified: true,
    canTeach: ['Marketing', 'Entrepreneurship', 'Public Speaking'],
    wantToLearn: ['Excel', 'React', 'SQL'],
  },
  {
    name: 'Dev Patel', email: 'dev@skillswap.io', department: 'Computer Science', year: '2',
    qualification: 'B.Tech', college: 'National Institute of Technology',
    bio: 'Frontend enthusiast. Animations, responsive design, a11y.',
    avatar: 'https://i.pravatar.cc/150?img=13', availability: 'mornings',
    rating: 4.6, reviewCount: 7, points: 110, isVerified: true,
    canTeach: ['JavaScript', 'Tailwind CSS', 'HTML & CSS'],
    wantToLearn: ['TypeScript', 'Next.js', 'GraphQL'],
  },
  {
    name: 'Meera Krishnan', email: 'meera@skillswap.io', department: 'Data Science', year: '1',
    qualification: 'B.Sc', college: 'National Institute of Technology',
    bio: 'Curious about data. Starting with Python and statistics.',
    avatar: 'https://i.pravatar.cc/150?img=20', availability: 'anytime',
    rating: 4.3, reviewCount: 4, points: 75, isVerified: true,
    canTeach: ['Excel', 'Communication'],
    wantToLearn: ['Python', 'Statistics', 'Pandas', 'SQL'],
  },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Create a skill if it does not already exist (idempotent). */
const ensureSkill = async (name) => {
  const def = SKILLS.find((s) => s[0] === name);
  let skill = await Skill.findOne({ name });
  if (!skill) {
    skill = await Skill.create(
      def
        ? { name, aliases: def[1], category: def[2], difficulty: def[3], icon: def[4] }
        : { name }
    );
  }
  return skill;
};

const linkSkill = async (userId, skill, canTeach, wantToLearn) => {
  await UserSkill.findOneAndUpdate(
    { userId, skillId: skill._id },
    {
      level: pick([3, 4, 5]),
      canTeach,
      wantToLearn,
      verified: canTeach,
    },
    { upsert: true, new: true }
  );
};

const seedSkills = async () => {
  const docs = [];
  for (const [name, aliases, category, difficulty, icon] of SKILLS) {
    docs.push(await Skill.create({ name, aliases, category, difficulty, icon }));
  }
  return docs.length;
};

const seedBadges = async () => {
  const docs = [];
  for (const [name, description, icon, points, criteria, autoGrant] of BADGES) {
    docs.push(await Badge.create({ name, description, icon, points, criteria, autoGrant }));
  }
  return docs.length;
};

const seedInstitutions = async () => {
  for (const [name, city, country, type] of INSTITUTIONS) {
    await Institution.findOneAndUpdate({ name }, { city, country, type }, { upsert: true });
  }
  return INSTITUTIONS.length;
};

const createAdminUser = async () => {
  const existing = await User.findOne({ email: 'admin@skillswap.io' });
  if (existing) return existing;
  return User.create({
    name: 'Platform Admin',
    email: 'admin@skillswap.io',
    password: 'admin1234',
    role: 'admin',
    college: 'SkillSwap HQ',
    qualification: 'M.Tech',
    department: 'Administration',
    year: 'Graduate',
    isVerified: true,
    isDemo: true,
    trustScore: 100,
    bio: 'Platform administrator with cleanup and seed tools.',
  });
};

const createTestUser = async (index = 0) => {
  const email = `test${Date.now()}${index}@skillswap.io`;
  const user = await User.create({
    name: `Test User ${index + 1}`,
    email,
    password: 'test1234',
    college: 'Test University',
    qualification: 'B.Tech',
    department: 'Computer Science',
    year: '2',
    bio: 'Temporary test account — safe to delete anytime.',
    availability: 'anytime',
    isVerified: true,
    isTest: true,
    trustScore: 55,
  });
  for (const name of ['Python', 'JavaScript', 'React']) {
    await linkSkill(user._id, await ensureSkill(name), index % 2 === 0, index % 2 !== 0);
  }
  return user;
};

/**
 * Reset ONLY the demo account to a clean, seeded state.
 * Deletes the existing demo account + all of its data, then recreates it
 * with skills, notifications and relationships to mentor accounts if present.
 */
const resetDemoAccount = async () => {
  const existing = await User.findOne({ email: 'demo@skillswap.io' });
  if (existing) await deleteUserData(existing._id);
  if (existing) await User.findByIdAndDelete(existing._id);

  const demoCanTeach = ['React', 'JavaScript', 'Tailwind CSS'];
  const demoWantToLearn = ['Machine Learning', 'Go', 'Kubernetes'];

  const demo = await User.create({
    name: 'Demo Student',
    email: 'demo@skillswap.io',
    password: 'demo1234',
    department: 'Computer Science',
    qualification: 'B.Tech',
    year: '3',
    college: 'National Institute of Technology',
    bio: 'Demo account — explore SkillSwap with all features unlocked.',
    availability: 'evenings',
    rating: 4.7,
    reviewCount: 10,
    points: 150,
    isVerified: true,
    isDemo: true,
    trustScore: 100,
    github: 'https://github.com/demo',
  });

  for (const name of [...demoCanTeach, ...demoWantToLearn]) {
    await linkSkill(demo._id, await ensureSkill(name), demoCanTeach.includes(name), demoWantToLearn.includes(name));
  }

  // Relationships to existing mentor accounts (idempotent-safe).
  const mentorLinks = [
    ['rohan@skillswap.io', 'ananya@skillswap.io'],
    ['isha@skillswap.io', 'demo@skillswap.io'],
  ];
  for (const [mentorEmail, learnerEmail] of mentorLinks) {
    const mentor = await User.findOne({ email: mentorEmail });
    const learner = await User.findOne({ email: learnerEmail });
    if (!mentor || !learner) continue;
    const match = await Match.create({
      mentorId: mentor._id,
      learnerId: learner._id,
      compatibilityScore: 88,
      status: 'accepted',
      active: true,
      acceptedAt: new Date(),
      requestedBy: 'learner',
      respondedAt: new Date(),
    });
    for (let i = 0; i < 3; i++) {
      const sender = i % 2 === 0 ? mentor._id : learner._id;
      const receiver = i % 2 === 0 ? learner._id : mentor._id;
      await Message.create({
        sender,
        receiver,
        conversationId: [String(sender), String(receiver)].sort().join('_'),
        message: pick([
          'Hey! Great to connect — what should we cover first?',
          'I can help you get started with the basics.',
          'Shall we schedule our first session this week?',
        ]),
        read: true,
        createdAt: new Date(Date.now() - (3 - i) * 3600 * 1000),
        matchId: match._id,
      });
    }
    if (mentor.email === 'isha@skillswap.io') {
      await Session.create({
        mentorId: mentor._id,
        learnerId: learner._id,
        matchId: match._id,
        topic: 'Marketing 101',
        description: 'Introduction to marketing fundamentals.',
        date: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        startTime: '17:00',
        duration: 60,
        status: 'confirmed',
        meetingMode: 'online',
        meetingType: 'googleMeet',
        meetingLink: 'https://meet.google.com/skillswap-demo',
        link: 'https://meet.google.com/skillswap-demo',
      });
      await Review.create({
        mentor: mentor._id,
        learner: learner._id,
        rating: 5,
        feedback: 'Super patient and explained everything clearly!',
      });
    }
  }

  // Notifications for the demo inbox.
  const others = await User.find({ email: { $ne: 'demo@skillswap.io' }, isTest: { $ne: true } }).select('name').limit(4);
  for (const u of others) {
    await Notification.create({
      userId: demo._id,
      type: 'match',
      title: `${u.name} is a great match`,
      message: `AI found a ${pick([86, 90, 83, 78])}% compatibility with ${u.name}.`,
      read: false,
    });
  }

  return demo;
};

module.exports = {
  SKILLS,
  BADGES,
  INSTITUTIONS,
  DEMO_USERS,
  pick,
  ensureSkill,
  linkSkill,
  seedSkills,
  seedBadges,
  seedInstitutions,
  createAdminUser,
  createTestUser,
  resetDemoAccount,
};
