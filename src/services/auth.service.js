'use strict';

const { getDb }    = require('../config/database');
const UserModel    = require('../models/user.model');
const { signToken } = require('../middleware/auth');

const AuthService = {
  async register(userData) {
    const db = await getDb();
    const existing = UserModel.findByEmail(db, userData.email);
    if (existing) {
      const err = new Error('Email is already registered.');
      err.status = 409;
      throw err;
    }
    const user = await UserModel.create(db, userData);
    const token = signToken({ id: user.id, role: user.role });
    return { user, token };
  },

  async login(email, password) {
    const db = await getDb();
    const user = UserModel.findByEmail(db, email);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }
    if (user.status === 'inactive') {
      const err = new Error('Your account has been deactivated.');
      err.status = 403;
      throw err;
    }
    const valid = await UserModel.verifyPassword(password, user.password);
    if (!valid) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }
    // Strip the hash before returning
    const { password: _pw, ...safeUser } = user;
    const token = signToken({ id: safeUser.id, role: safeUser.role });
    return { user: safeUser, token };
  },
};

module.exports = AuthService;
