'use strict';

const bcrypt = require('bcryptjs');
const { query, run } = require('../config/database');

const SALT_ROUNDS = 10;

const UserModel = {
  /**
   * Creates a new user. Returns the created user (without password).
   */
  async create(db, { name, email, password, role = 'viewer', status = 'active' }) {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const { lastInsertRowid } = run(
      db,
      `INSERT INTO users (name, email, password, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email.toLowerCase(), hashed, role, status]
    );
    return this.findById(db, lastInsertRowid);
  },

  findById(db, id) {
    const [user] = query(
      db,
      `SELECT id, name, email, role, status, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );
    return user || null;
  },

  findByEmail(db, email) {
    // Returns row INCLUDING password hash (for auth checks only)
    const [user] = query(
      db,
      `SELECT id, name, email, password, role, status FROM users WHERE email = ?`,
      [email.toLowerCase()]
    );
    return user || null;
  },

  findAll(db, { page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    let where = '';
    const params = [];
    if (status) {
      where = 'WHERE status = ?';
      params.push(status);
    }
    const rows = query(
      db,
      `SELECT id, name, email, role, status, created_at, updated_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [{ total }] = query(db, `SELECT COUNT(*) AS total FROM users ${where}`, params);
    return { data: rows, total, page, limit };
  },

  update(db, id, fields) {
    const allowed = ['name', 'role', 'status'];
    const updates = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }
    if (!updates.length) return this.findById(db, id);

    updates.push(`updated_at = datetime('now')`);
    params.push(id);

    run(db, `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.findById(db, id);
  },

  /**
   * Hard delete — in practice an admin action only.
   */
  delete(db, id) {
    const { changes } = run(db, `DELETE FROM users WHERE id = ?`, [id]);
    return changes > 0;
  },

  async verifyPassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  },
};

module.exports = UserModel;
