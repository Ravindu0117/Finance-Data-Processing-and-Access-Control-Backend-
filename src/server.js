'use strict';

const app         = require('./app');
const { getDb }   = require('./config/database');
const UserModel   = require('./models/user.model');
const RecordModel = require('./models/record.model');

const PORT = process.env.PORT || 3000;

const SEED_USERS = [
  { name: 'Alice Admin',   email: 'admin@example.com',   password: 'password123', role: 'admin'   },
  { name: 'Anna Analyst',  email: 'analyst@example.com', password: 'password123', role: 'analyst' },
  { name: 'Victor Viewer', email: 'viewer@example.com',  password: 'password123', role: 'viewer'  },
];

const SEED_RECORDS = [
  { amount: 12500, type: 'income',  category: 'Salary',        date: '2024-01-05', notes: 'January salary' },
  { amount: 800,   type: 'expense', category: 'Rent',          date: '2024-01-10', notes: 'Monthly rent' },
  { amount: 150,   type: 'expense', category: 'Utilities',     date: '2024-01-12', notes: 'Electricity bill' },
  { amount: 3000,  type: 'income',  category: 'Freelance',     date: '2024-01-20', notes: 'Web project' },
  { amount: 200,   type: 'expense', category: 'Groceries',     date: '2024-01-22' },
  { amount: 12500, type: 'income',  category: 'Salary',        date: '2024-02-05', notes: 'February salary' },
  { amount: 800,   type: 'expense', category: 'Rent',          date: '2024-02-10' },
  { amount: 500,   type: 'expense', category: 'Travel',        date: '2024-02-15', notes: 'Business trip' },
  { amount: 1200,  type: 'income',  category: 'Freelance',     date: '2024-02-18', notes: 'Logo design' },
  { amount: 90,    type: 'expense', category: 'Subscriptions', date: '2024-02-20', notes: 'SaaS tools' },
  { amount: 12500, type: 'income',  category: 'Salary',        date: '2024-03-05' },
  { amount: 800,   type: 'expense', category: 'Rent',          date: '2024-03-10' },
  { amount: 300,   type: 'expense', category: 'Groceries',     date: '2024-03-14' },
  { amount: 4500,  type: 'income',  category: 'Consulting',    date: '2024-03-25', notes: 'Q1 consulting' },
  { amount: 250,   type: 'expense', category: 'Utilities',     date: '2024-03-28' },
];

async function seedDatabase(db) {
  let adminId;
  for (const u of SEED_USERS) {
    const user = await UserModel.create(db, u);
    if (u.role === 'admin') adminId = user.id;
  }
  for (const r of SEED_RECORDS) {
    RecordModel.create(db, { ...r, created_by: adminId });
  }
  console.log('✔  Demo data seeded (3 users, 15 records)');
  console.log('');
  console.log('   Demo credentials (password: password123)');
  console.log('   ─────────────────────────────────────────');
  console.log('   admin@example.com    →  full access');
  console.log('   analyst@example.com  →  read + insights');
  console.log('   viewer@example.com   →  read only');
  console.log('   ─────────────────────────────────────────');
}

(async () => {
  const db = await getDb();
  console.log('✔  Database initialised (sql.js in-memory SQLite)');

  // Always seed on startup — DB is in-memory so it's always empty at boot
  await seedDatabase(db);

  app.listen(PORT, () => {
    console.log(`\n✔  Finance API listening on http://localhost:${PORT}`);
    console.log(`   Health check: GET http://localhost:${PORT}/health\n`);
  });
})();
