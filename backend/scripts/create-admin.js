#!/usr/bin/env node
/* eslint-disable no-console */

require('dotenv').config();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

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

  await prisma.$connect();
  console.log('Connected to Supabase Postgres.');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === 'admin' || existing.role === 'super_admin') {
      console.log(`"${email}" is already an admin.`);
    } else {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } });
      console.log(`Promoted "${email}" to admin.`);
    }
    await prisma.$disconnect();
    return;
  }

  const admin = await prisma.user.create({
    data: {
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: 'admin',
    isVerified: true,
    college: 'Platform Administration',
    qualification: 'other',
    department: 'Administration',
    year: 'graduate',
    trustScore: 100,
    status: 'verified',
    },
  });

  console.log(`Admin account created: ${admin.email}`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Failed:', err.message);
  prisma.$disconnect().finally(() => process.exit(1));
});
