'use strict';

const { query, run } = require('../config/database');

const RecordModel = {
  create(db, { amount, type, category, date, notes, created_by }) {
    const { lastInsertRowid } = run(
      db,
      `INSERT INTO financial_records (amount, type, category, date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [amount, type, category.trim(), date, notes || null, created_by]
    );
    return this.findById(db, lastInsertRowid);
  },

  findById(db, id) {
    const [record] = query(
      db,
      `SELECT r.*, u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON u.id = r.created_by
       WHERE r.id = ? AND r.deleted_at IS NULL`,
      [id]
    );
    return record || null;
  },

  /**
   * List records with filtering, sorting, and pagination.
   * Filters: type, category, dateFrom, dateTo
   */
  findAll(db, { page = 1, limit = 20, type, category, dateFrom, dateTo, sortBy = 'date', order = 'DESC' } = {}) {
    const conditions = ['r.deleted_at IS NULL'];
    const params = [];

    if (type) { conditions.push('r.type = ?'); params.push(type); }
    if (category) { conditions.push('r.category = ?'); params.push(category); }
    if (dateFrom) { conditions.push('r.date >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('r.date <= ?'); params.push(dateTo); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    // Whitelist sort columns to prevent injection
    const safeSortBy = ['date', 'amount', 'category', 'type', 'created_at'].includes(sortBy) ? sortBy : 'date';
    const safeOrder  = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const data = query(
      db,
      `SELECT r.*, u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON u.id = r.created_by
       ${where}
       ORDER BY r.${safeSortBy} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [{ total }] = query(
      db,
      `SELECT COUNT(*) AS total FROM financial_records r ${where}`,
      params
    );

    return { data, total, page, limit };
  },

  update(db, id, fields) {
    const allowed = ['amount', 'type', 'category', 'date', 'notes'];
    const updates = [];
    const params  = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }
    if (!updates.length) return this.findById(db, id);

    updates.push(`updated_at = datetime('now')`);
    params.push(id);
    run(db, `UPDATE financial_records SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.findById(db, id);
  },

  /**
   * Soft delete: sets deleted_at timestamp instead of removing the row.
   */
  softDelete(db, id) {
    const { changes } = run(
      db,
      `UPDATE financial_records SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return changes > 0;
  },

  // ─── Aggregations (used by dashboard service) ──────────────────────────────

  getTotals(db, { dateFrom, dateTo } = {}) {
    const conditions = ['deleted_at IS NULL'];
    const params = [];
    if (dateFrom) { conditions.push('date >= ?'); params.push(dateFrom); }
    if (dateTo)   { conditions.push('date <= ?'); params.push(dateTo); }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const rows = query(
      db,
      `SELECT
         SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS total_income,
         SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expenses,
         COUNT(*)                                              AS record_count
       FROM financial_records ${where}`,
      params
    );
    const { total_income, total_expenses, record_count } = rows[0];
    return {
      total_income:   total_income   || 0,
      total_expenses: total_expenses || 0,
      net_balance:    (total_income  || 0) - (total_expenses || 0),
      record_count:   record_count   || 0,
    };
  },

  getCategoryTotals(db, { type, dateFrom, dateTo } = {}) {
    const conditions = ['deleted_at IS NULL'];
    const params = [];
    if (type)     { conditions.push('type = ?');   params.push(type); }
    if (dateFrom) { conditions.push('date >= ?');  params.push(dateFrom); }
    if (dateTo)   { conditions.push('date <= ?');  params.push(dateTo); }
    const where = `WHERE ${conditions.join(' AND ')}`;

    return query(
      db,
      `SELECT category, type, SUM(amount) AS total, COUNT(*) AS count
       FROM financial_records ${where}
       GROUP BY category, type
       ORDER BY total DESC`,
      params
    );
  },

  getMonthlyTrends(db, { year, months = 12 } = {}) {
    const targetYear = year || new Date().getFullYear();
    return query(
      db,
      `SELECT
         strftime('%Y-%m', date) AS month,
         SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses,
         SUM(CASE WHEN type='income'  THEN amount ELSE -amount END) AS net
       FROM financial_records
       WHERE deleted_at IS NULL
         AND strftime('%Y', date) = ?
       GROUP BY month
       ORDER BY month ASC
       LIMIT ?`,
      [String(targetYear), months]
    );
  },

  getRecentActivity(db, limit = 10) {
    return query(
      db,
      `SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON u.id = r.created_by
       WHERE r.deleted_at IS NULL
       ORDER BY r.created_at DESC
       LIMIT ?`,
      [limit]
    );
  },
};

module.exports = RecordModel;
