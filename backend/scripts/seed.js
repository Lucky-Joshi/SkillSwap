const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Skill = require('../models/Skill');
const Badge = require('../models/Badge');
const Institution = require('../models/Institution');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Connection = require('../models/Connection');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const UserBadge = require('../models/UserBadge');
const {
  seedSkills,
  seedBadges,
  seedInstitutions,
  createAdminUser,
  createTestUser,
  resetDemoAccount,
  ensureSkill,
  linkSkill,
  pick,
} = require('../services/seedService');
const { deleteTestUsers } = require('../services/cleanupService');
const { computeTrustScore } = require('../services/trustService');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);

const log = (...m) => console.log(...m);

const main = async () => {
  await connectDB();
  log('\nSkillSwap seeder\n');

  // --cleanup-test : delete every temporary test account, keep everything else.
  if (flag('cleanup-test')) {
    const removed = await deleteTestUsers();
    log(`Deleted ${removed} temporary test account(s).`);
    log('Demo and regular accounts were untouched.');
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  // --demo-reset : recreate ONLY the demo account + its data.
  if (flag('demo-reset')) {
    const demo = await resetDemoAccount();
    log('Demo account reset ✔');
    log(`Login with: ${demo.email} / demo1234`);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  // Full seed (default) clears everything for a known-good state.
  if (!flag('no-clear')) {
    const collections = [
      Skill, Badge, Institution, User, UserSkill, Connection, Session, Message, Review, Notification, UserBadge,
    ];
    for (const M of collections) await M.deleteMany({});
    log('Cleared collections.');
  }

  const skipUsers = flag('no-users');

  // 1. Core data (skills + badges + institutions) — always seeded.
  const skills = await seedSkills();
  const badges = await seedBadges();
  const institutions = await seedInstitutions();
  log(`Seeded ${skills} skills, ${badges} badges, ${institutions} institutions.`);

  if (flag('core')) {
    log('Core-only seed complete (skills, badges, institutions). No users created.');
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  // 2. Admin account (required for the cleanup tools).
  await createAdminUser();
  log('Seeded admin account: admin@skillswap.io / admin1234');

  if (skipUsers) {
    log('Skipped demo users (--no-users).');
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  // 3. Demo account + demo students (students first so the demo account's
  //    seeded relationships can link to them).
  const demoSpecs = require('../services/seedService').DEMO_USERS;
  let created = 0;
  const demoStudents = [];
  for (const u of demoSpecs) {
    const user = await User.create({
      name: u.name,
      email: u.email,
      password: 'demo1234',
      college: u.college,
      qualification: u.qualification,
      department: u.department,
      year: u.year,
      bio: u.bio,
      avatar: u.avatar,
      github: u.github,
      linkedin: u.linkedin,
      availability: u.availability,
      rating: u.rating,
      reviewCount: u.reviewCount,
      points: u.points,
      isVerified: true,
      isDemo: true,
      trustScore: 85,
    });
    created++;
    demoStudents.push(user);
    for (const name of [...u.canTeach, ...u.wantToLearn]) {
      const skill = await ensureSkill(name);
      if (!skill) continue;
      await linkSkill(user._id, skill, u.canTeach.includes(name), u.wantToLearn.includes(name));
    }
  }
  log(`Seeded ${created} demo students.`);

  const demo = await resetDemoAccount();
  log(`Seeded demo account: ${demo.email} / demo1234`);

  // Accepted connections between demo students (fills Connection history + leaderboard realism).
  const pairs = [
    [0, 5], [1, 6], [2, 8], [4, 9], [3, 7],
  ];
  for (const [mentorIdx, learnerIdx] of pairs) {
    const mentor = demoStudents[mentorIdx];
    const learner = demoStudents[learnerIdx];
    if (!mentor || !learner) continue;
    const conn = await Connection.create({
      userA: mentor._id,
      userB: learner._id,
      type: 'mentorship',
      compatibilityScore: pick([82, 86, 90, 84, 88]),
      status: 'accepted',
      active: true,
      acceptedAt: new Date(),
      requestedBy: learner._id,
      respondedAt: new Date(),
    });
    for (let i = 0; i < 2; i++) {
      await Message.create({
        sender: i % 2 === 0 ? mentor._id : learner._id,
        receiver: i % 2 === 0 ? learner._id : mentor._id,
        conversationId: [String(mentor._id), String(learner._id)].sort().join('_'),
        message: pick([
          'Hey! Great to connect — when are you free this week?',
          'I can share some resources to get you started.',
          'Looking forward to our first session!',
        ]),
        read: true,
        createdAt: new Date(Date.now() - (2 - i) * 3600 * 1000),
        matchId: conn._id,
      });
    }
  }
  log('Seeded 5 accepted demo connections with messages.');

  // Honest trust scores for every demo user (recomputed from actual data).
  for (const u of [demo, ...demoStudents]) {
    await computeTrustScore(u._id);
  }
  log('Recomputed trust scores for demo users.');

  // 4. Optional temporary test accounts for development/testing.
  const testFlagIdx = args.findIndex((a) => a === '--test-users');
  let testCount = 0;
  if (testFlagIdx !== -1) {
    const n = parseInt(args[testFlagIdx + 1], 10);
    testCount = Number.isFinite(n) && n > 0 ? n : 5;
    for (let i = 0; i < testCount; i++) {
      await createTestUser(i);
    }
    log(`Created ${testCount} temporary test account(s) (marked isTest, safe to clean).`);
  }

  await mongoose.disconnect();
  log('\nSeed complete ✔');
  log(`Logins: demo@skillswap.io / demo1234 · admin@skillswap.io / admin1234${testCount ? ` · ${testCount} test account(s)` : ''}`);
  log('\nSeed data control:');
  log('  --core           skills + badges + institutions only');
  log('  --no-users       core + admin account, no demo/test users');
  log('  --demo-reset     recreate only the demo account');
  log('  --test-users N   additionally create N temporary test accounts');
  log('  --cleanup-test   delete all temporary test accounts');
  process.exit(0);
};

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
