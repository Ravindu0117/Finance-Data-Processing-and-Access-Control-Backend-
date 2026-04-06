'use strict';

/**
 * Seed script — populates the in-memory DB for manual testing.
 * Run:  node src/scripts/seed.js
 *
 * This boots the server in-process, creates demo users and records,
 * then prints the credentials you can use to explore the API.
 */

const { getDb } = require('../config/database');
const UserModel  = require('../models/user.model');
const RecordModel = require('../models/record.model');

const USERS = [
  { name: 'Alice Admin',   email: 'admin@example.com',   password: 'password123', role: 'admin'   },
  { name: 'Anna Analyst',  email: 'analyst@example.com', password: 'password123', role: 'analyst' },
  { name: 'Victor Viewer', email: 'viewer@example.com',  password: 'password123', role: 'viewer'  },
];

const RECORDS = [
  { amount: 12500, type: 'income',  category: 'Salary',       date: '2024-01-05', notes: 'January salary' },
  { amount: 800,   type: 'expense', category: 'Rent',         date: '2024-01-10', notes: 'Monthly rent' },
  { amount: 150,   type: 'expense', category: 'Utilities',    date: '2024-01-12', notes: 'Electricity bill' },
  { amount: 3000,  type: 'income',  category: 'Freelance',    date: '2024-01-20', notes: 'Web project' },
  { amount: 200,   type: 'expense', category: 'Groceries',    date: '2024-01-22' },
  { amount: 12500, type: 'income',  category: 'Salary',       date: '2024-02-05', notes: 'February salary' },
  { amount: 800,   type: 'expense', category: 'Rent',         date: '2024-02-10' },
  { amount: 500,   type: 'expense', category: 'Travel',       date: '2024-02-15', notes: 'Business trip' },
  { amount: 1200,  type: 'income',  category: 'Freelance',    date: '2024-02-18', notes: 'Logo design' },
  { amount: 90,    type: 'expense', category: 'Subscriptions',date: '2024-02-20', notes: 'SaaS tools' },
  { amount: 12500, type: 'income',  category: 'Salary',       date: '2024-03-05' },
  { amount: 800,   type: 'expense', category: 'Rent',         date: '2024-03-10' },
  { amount: 300,   type: 'expense', category: 'Groceries',    date: '2024-03-14' },
  { amount: 4500,  type: 'income',  category: 'Consulting',   date: '2024-03-25', notes: 'Q1 consulting' },
  { amount: 250,   type: 'expense', category: 'Utilities',    date: '2024-03-28' },
];

async function seed() {
  const db = await getDb();
  console.log('\n🌱  Seeding database...\n');

  // Create users
  let adminId;
  for (const u of USERS) {
    const user = await UserModel.create(db, u);
    console.log(`  👤  ${u.role.padEnd(8)}  ${u.email}  (id=${user.id})`);
    if (u.role === 'admin') adminId = user.id;
  }

  // Create financial records attributed to admin
  console.log('');
  for (const r of RECORDS) {
    RecordModel.create(db, { ...r, created_by: adminId });
  }
  console.log(`  💰  Created ${RECORDS.length} financial records.\n`);

  console.log('─'.repeat(55));
  console.log('Demo credentials (all passwords: password123)');
  console.log('─'.repeat(55));
  USERS.forEach(u => console.log(`  ${u.role.padEnd(8)}  ${u.email}`));
  console.log('─'.repeat(55));
  console.log('\nStart the server:  npm start');
  console.log('Login endpoint:    POST http://localhost:3000/api/auth/login\n');
}

seed().catch(err => { console.error(err); process.exit(1); });
