const Skill = require('../models/Skill');
const Badge = require('../models/Badge');
const Institution = require('../models/Institution');

const SKILLS = [
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
  ['Node.js', ['node', 'nodejs'], 'backend', 'intermediate', '🟢'],
  ['Express.js', ['express'], 'backend', 'intermediate', '🚂'],
  ['Django', [], 'backend', 'intermediate', '🎸'],
  ['Flask', [], 'backend', 'intermediate', '🌶️'],
  ['FastAPI', [], 'backend', 'intermediate', '⚡'],
  ['GraphQL', [], 'backend', 'intermediate', '🔗'],
  ['REST APIs', ['rest', 'api design'], 'backend', 'intermediate', '🔌'],
  ['Firebase', [], 'backend', 'intermediate', '🔥'],
  ['MongoDB', ['mongo'], 'database', 'intermediate', '🍃'],
  ['PostgreSQL', ['postgres', 'psql'], 'database', 'intermediate', '🐘'],
  ['MySQL', [], 'database', 'beginner', '🐬'],
  ['Redis', [], 'database', 'intermediate', '🔴'],
  ['Pandas', [], 'data-science', 'intermediate', '🐼'],
  ['NumPy', [], 'data-science', 'intermediate', '🔢'],
  ['Matplotlib', [], 'data-science', 'beginner', '📊'],
  ['Tableau', [], 'data-science', 'intermediate', '📈'],
  ['TensorFlow', [], 'ai-ml', 'advanced', '🧠'],
  ['PyTorch', [], 'ai-ml', 'advanced', '🔥'],
  ['Scikit-learn', ['sklearn'], 'ai-ml', 'intermediate', '🤖'],
  ['OpenCV', [], 'ai-ml', 'intermediate', '👁️'],
  ['Docker', [], 'cloud-devops', 'intermediate', '🐳'],
  ['Kubernetes', ['k8s'], 'cloud-devops', 'advanced', '☸️'],
  ['AWS', [], 'cloud-devops', 'intermediate', '☁️'],
  ['CI/CD', [], 'cloud-devops', 'intermediate', '🔄'],
  ['Linux', [], 'cloud-devops', 'beginner', '🐧'],
  ['Public Speaking', ['speaking'], 'soft-skills', 'intermediate', '🎤'],
  ['Leadership', [], 'soft-skills', 'intermediate', '👑'],
  ['Communication', [], 'soft-skills', 'beginner', '💬'],
  ['Teamwork', [], 'soft-skills', 'beginner', '🤝'],
  ['Time Management', [], 'soft-skills', 'beginner', '⏰'],
  ['English', [], 'languages', 'intermediate', '🗣️'],
  ['Hindi', [], 'languages', 'intermediate', '🇮🇳'],
  ['French', [], 'languages', 'beginner', '🇫🇷'],
  ['German', [], 'languages', 'beginner', '🇩🇪'],
  ['Japanese', [], 'languages', 'advanced', '🇯🇵'],
  ['Excel', [], 'business', 'beginner', '📊'],
  ['PowerPoint', [], 'business', 'beginner', '📽️'],
  ['Digital Marketing', ['marketing'], 'business', 'intermediate', '📢'],
  ['Financial Modeling', ['finance'], 'business', 'advanced', '💰'],
  ['Project Management', ['pm'], 'business', 'intermediate', '📋'],
  ['Photography', [], 'design', 'beginner', '📷'],
  ['Copywriting', [], 'soft-skills', 'intermediate', '✍️'],
  ['Data Analysis', ['data analytics'], 'data-science', 'intermediate', '🔍'],
  ['SQL', [], 'database', 'beginner', '🗃️'],
  ['Spring Boot', ['spring', 'springboot'], 'backend', 'intermediate', '🌱'],
  ['ASP.NET', ['dotnet'], 'backend', 'intermediate', '🔷'],
  ['Machine Learning', ['ml'], 'ai-ml', 'advanced', '🧠'],
  ['Deep Learning', ['dl'], 'ai-ml', 'advanced', '🔮'],
  ['Natural Language Processing', ['nlp'], 'ai-ml', 'advanced', '📝'],
  ['Computer Vision', ['cv'], 'ai-ml', 'advanced', '👁️'],
  ['Flutter', [], 'frontend', 'intermediate', '💙'],
  ['Swift', [], 'programming', 'intermediate', '🍎'],
  ['Kotlin', [], 'programming', 'intermediate', '🟣'],
  ['Ruby on Rails', ['rails', 'ruby'], 'backend', 'intermediate', '💎'],
  ['PHP', [], 'backend', 'beginner', '🐘'],
  ['Svelte', [], 'frontend', 'intermediate', '🔥'],
];

const BADGES = [
  ['First Steps', 'Complete your profile', '👣', 10, 'Complete profile fields', true],
  ['Profile Pro', 'Fill in all profile sections', '📝', 20, 'Complete all profile fields', true],
  ['Skill Collector', 'Add 5 or more skills', '🎯', 15, 'Add at least 5 skills', true],
  ['First Match', 'Connect with your first peer', '🤝', 20, 'Accept first connection', true],
  ['Networker', 'Make 5 connections', '🌐', 25, 'Have 5 accepted connections', true],
  ['Session Master', 'Complete 3 sessions', '🎓', 30, 'Complete 3 sessions', true],
  ['Mentor Star', 'Get a 5-star review', '⭐', 35, 'Receive a 5-star rating', true],
  ['Certified Learner', 'Complete a session and earn a certificate', '📜', 40, 'Complete a rated session', true],
  ['Top Contributor', 'Reach 100 points', '🏆', 50, 'Accumulate 100 points', true],
];

const INSTITUTIONS = [
  ['Indian Institute of Technology Bombay', 'Mumbai', 'India', 'university'],
  ['Indian Institute of Technology Delhi', 'New Delhi', 'India', 'university'],
  ['Indian Institute of Technology Madras', 'Chennai', 'India', 'university'],
  ['Indian Institute of Technology Kanpur', 'Kanpur', 'India', 'university'],
  ['Indian Institute of Technology Kharagpur', 'Kharagpur', 'India', 'university'],
  ['Indian Institute of Science', 'Bangalore', 'India', 'university'],
  ['National Institute of Technology Trichy', 'Tiruchirappalli', 'India', 'university'],
  ['BITS Pilani', 'Pilani', 'India', 'university'],
  ['VIT Vellore', 'Vellore', 'India', 'college'],
  ['SRM Institute of Science and Technology', 'Chennai', 'India', 'college'],
  ['Manipal Institute of Technology', 'Manipal', 'India', 'college'],
  ['Delhi Technological University', 'New Delhi', 'India', 'university'],
  ['Netaji Subhas University of Technology', 'New Delhi', 'India', 'university'],
  ['Indraprastha Institute of Information Technology', 'New Delhi', 'India', 'university'],
  ['Birla Institute of Technology and Science', 'Pilani', 'India', 'university'],
  ['PSG College of Technology', 'Coimbatore', 'India', 'college'],
  ['Thiagarajar College of Engineering', 'Madurai', 'India', 'college'],
  ['R.V. College of Engineering', 'Bangalore', 'India', 'college'],
  ['PES University', 'Bangalore', 'India', 'university'],
  ['Amrita Vishwa Vidyapeetham', 'Coimbatore', 'India', 'university'],
  ['Sri Venkateswara College', 'New Delhi', 'India', 'college'],
  ['St. Stephen\'s College', 'New Delhi', 'India', 'college'],
  ['Presidency College', 'Chennai', 'India', 'college'],
  ['Lady Shri Ram College', 'New Delhi', 'India', 'college'],
  ['Hansraj College', 'New Delhi', 'India', 'college'],
  ['Christ University', 'Bangalore', 'India', 'university'],
  ['Symbiosis International University', 'Pune', 'India', 'university'],
  ['Lovely Professional University', 'Phagwara', 'India', 'university'],
  ['Chandigarh University', 'Chandigarh', 'India', 'university'],
  ['Sharda University', 'Greater Noida', 'India', 'university'],
  ['Harvard University', 'Cambridge, MA', 'USA', 'university'],
  ['Stanford University', 'Stanford, CA', 'USA', 'university'],
  ['Massachusetts Institute of Technology', 'Cambridge, MA', 'USA', 'university'],
  ['University of Oxford', 'Oxford', 'UK', 'university'],
  ['University of Cambridge', 'Cambridge', 'UK', 'university'],
  ['ETH Zurich', 'Zurich', 'Switzerland', 'university'],
  ['National University of Singapore', 'Singapore', 'Singapore', 'university'],
  ['University of Melbourne', 'Melbourne', 'Australia', 'university'],
];

const seedSkills = async () => {
  const ops = SKILLS.map(([name, aliases, category, difficulty, icon]) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, aliases, category, difficulty, icon } },
      upsert: true,
    },
  }));
  const result = await Skill.bulkWrite(ops);
  return result.upsertedCount + result.modifiedCount;
};

const seedBadges = async () => {
  const ops = BADGES.map(([name, description, icon, points, criteria, autoGrant]) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, description, icon, points, criteria, autoGrant } },
      upsert: true,
    },
  }));
  const result = await Badge.bulkWrite(ops);
  return result.upsertedCount + result.modifiedCount;
};

const seedInstitutions = async () => {
  const ops = INSTITUTIONS.map(([name, city, country, type]) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, city, country, type } },
      upsert: true,
    },
  }));
  const result = await Institution.bulkWrite(ops);
  return result.upsertedCount + result.modifiedCount;
};

module.exports = { SKILLS, BADGES, INSTITUTIONS, seedSkills, seedBadges, seedInstitutions };
