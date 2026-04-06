'use strict';

const { getDb }   = require('../config/database');
const RecordModel = require('../models/record.model');

const DashboardService = {
  /**
   * High-level summary: income, expenses, net, count.
   * Available to all authenticated roles.
   */
  async getSummary(filters = {}) {
    const db = await getDb();
    return RecordModel.getTotals(db, filters);
  },

  /**
   * Category breakdown — analyst/admin only.
   */
  async getCategoryBreakdown(filters = {}) {
    const db = await getDb();
    return RecordModel.getCategoryTotals(db, filters);
  },

  /**
   * Month-by-month trend for a given year — analyst/admin only.
   */
  async getMonthlyTrends(year) {
    const db = await getDb();
    return RecordModel.getMonthlyTrends(db, { year });
  },

  /**
   * Last N transactions — available to all roles.
   */
  async getRecentActivity(limit = 10) {
    const db = await getDb();
    return RecordModel.getRecentActivity(db, Math.min(limit, 50));
  },
};

module.exports = DashboardService;
