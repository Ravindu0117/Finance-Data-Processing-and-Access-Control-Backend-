'use strict';

const { getDb }  = require('../config/database');
const UserModel  = require('../models/user.model');

const UserService = {
  async list(filters) {
    const db = await getDb();
    return UserModel.findAll(db, filters);
  },

  async getById(id) {
    const db = await getDb();
    const user = UserModel.findById(db, id);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
    return user;
  },

  async create(userData) {
    const db = await getDb();
    const existing = UserModel.findByEmail(db, userData.email);
    if (existing) {
      const err = new Error('Email is already registered.');
      err.status = 409;
      throw err;
    }
    return UserModel.create(db, userData);
  },

  async update(id, fields) {
    const db = await getDb();
    const user = UserModel.findById(db, id);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
    return UserModel.update(db, id, fields);
  },

  async remove(id, requesterId) {
    if (id === requesterId) {
      const err = new Error('You cannot delete your own account.');
      err.status = 400;
      throw err;
    }
    const db = await getDb();
    const deleted = UserModel.delete(db, id);
    if (!deleted) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
  },
};

module.exports = UserService;
