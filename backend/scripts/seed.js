#!/usr/bin/env node
/* eslint-disable no-console */

require('dotenv').config();
const mongoose = require('mongoose');
const { seedSkills, seedBadges, seedInstitutions } = require('../services/seedService');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap';

const log = (msg) => console.log(msg);
const flag = (f) => process.argv.includes(`--${f}`);

async function run() {
  log('\nSkillSwap Core Data Seeder\n');

  log('Connecting to MongoDB…');
  await mongoose.connect(MONGO);
  log('Connected.\n');

  try {
    const skills = await seedSkills();
    log(`✔ Skills: ${skills} seeded/updated`);

    const badges = await seedBadges();
    log(`✔ Badges: ${badges} seeded/updated`);

    const institutions = await seedInstitutions();
    log(`✔ Institutions: ${institutions} seeded/updated`);

    log('\nCore data seeding complete.');
    log('Users, connections, sessions, and messages are created by real user activity.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    log('Disconnected.\n');
  }
}

run();
