'use strict';

const express           = require('express');
const DashboardService  = require('../services/dashboard.service');
const { authenticate, authorize } = require('../middleware/auth');
const { query }                   = require('express-validator');
const { validateRequest }         = require('../middleware/errorHandler');

const router = express.Router();

router.use(authenticate);

const dateRangeRules = [
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid date.'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid date.'),
];

/**
 * GET /api/dashboard/summary
 * All roles. Returns total income, total expenses, net balance, record count.
 * Optional filters: ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 */
router.get(
  '/summary',
  authorize('VIEW_DASHBOARD'),
  dateRangeRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const summary = await DashboardService.getSummary({ dateFrom, dateTo });
      res.json({ summary });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/dashboard/recent
 * All roles. Returns the most recent N records.
 * Optional: ?limit=10
 */
router.get(
  '/recent',
  authorize('VIEW_DASHBOARD'),
  [query('limit').optional().isInt({ min: 1, max: 50 }).toInt()],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = req.query.limit || 10;
      const activity = await DashboardService.getRecentActivity(limit);
      res.json({ activity });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/dashboard/categories
 * Analyst / Admin only. Returns totals grouped by category and type.
 * Optional filters: ?type=income|expense&dateFrom=...&dateTo=...
 */
router.get(
  '/categories',
  authorize('VIEW_INSIGHTS'),
  [
    ...dateRangeRules,
    query('type').optional().isIn(['income', 'expense']),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { type, dateFrom, dateTo } = req.query;
      const breakdown = await DashboardService.getCategoryBreakdown({ type, dateFrom, dateTo });
      res.json({ breakdown });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/dashboard/trends
 * Analyst / Admin only. Monthly income vs expense for a given year.
 * Optional: ?year=2024
 */
router.get(
  '/trends',
  authorize('VIEW_INSIGHTS'),
  [query('year').optional().isInt({ min: 2000, max: 2100 }).toInt()],
  validateRequest,
  async (req, res, next) => {
    try {
      const { year } = req.query;
      const trends = await DashboardService.getMonthlyTrends(year);
      res.json({ trends });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
