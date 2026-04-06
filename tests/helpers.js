'use strict';

/**
 * Shared test utilities.
 *
 * All test files import:
 *   const { request, app, registerUser } = require('./helpers');
 *
 * Then make calls like:
 *   request(app).get('/api/...').set(...)
 *
 * All tests share a single in-memory DB instance for the process,
 * which keeps the suite fast and lets tests depend on each other's data
 * (e.g. create-then-read). The tradeoff is that test order within a file
 * matters for stateful sequences (delete tests run last, etc.).
 */

const supertest = require('supertest');
const app       = require('../src/app');

/**
 * Creates a user directly in the DB (bypassing the public /register endpoint
 * which restricts role to 'viewer') and returns { token, user }.
 */
async function registerUser(overrides = {}) {
  const defaults = {
    name:     'Test User',
    email:    `u_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
    password: 'password123',
    role:     'viewer',
  };
  const userData = { ...defaults, ...overrides };

  const { getDb }     = require('../src/config/database');
  const UserModel     = require('../src/models/user.model');
  const { signToken } = require('../src/middleware/auth');

  const db    = await getDb();
  const user  = await UserModel.create(db, userData);
  const token = signToken({ id: user.id, role: user.role });

  return { token, user };
}

// Export supertest as a callable so tests can do: request(app).get(...)
module.exports = { request: supertest, app, registerUser };
