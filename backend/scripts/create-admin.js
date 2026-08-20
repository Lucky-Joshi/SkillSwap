#!/usr/bin/env node
/* eslint-disable no-console */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap';

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : null;
}

async function run() {
  const name = getArg('name');
  const email = getArg('email');
  const password = getArg('password');

  if (!name || !email || !password) {
    console.error('\nUsage: node scripts/create-admin.js --name "Admin Name" --email admin@example.com --password yourpassword\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(MONGO);
  console.log('Connected to MongoDB.');

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`"${email}" is already an admin.`);
    } else {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted "${email}" to admin.`);
    }
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: 'admin',
    isVerified: true,
    college: 'Platform Administration',
    qualification: 'Other',
    department: 'Administration',
    year: 'Graduate',
    trustScore: 100,
  });

  console.log(`Admin account created: ${admin.email}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
