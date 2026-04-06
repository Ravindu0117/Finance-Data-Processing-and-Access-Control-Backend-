'use strict';

const express       = require('express');
const RecordService = require('../services/record.service');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest }         = require('../middleware/errorHandler');
const {
  createRecordRules,
  updateRecordRules,
  listRecordRules,
  idParamRule,
} = require('../validators/record.validator');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/records
 * Viewer / Analyst / Admin.
 * Query params: type, category, dateFrom, dateTo, page, limit, sortBy, order
 */
router.get(
  '/',
  authorize('VIEW_RECORDS'),
  listRecordRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { type, category, dateFrom, dateTo, page, limit, sortBy, order } = req.query;
      const result = await RecordService.list({ type, category, dateFrom, dateTo, page, limit, sortBy, order });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/records/:id
 * Viewer / Analyst / Admin.
 */
router.get(
  '/:id',
  authorize('VIEW_RECORDS'),
  idParamRule,
  validateRequest,
  async (req, res, next) => {
    try {
      const record = await RecordService.getById(req.params.id);
      res.json({ record });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/records
 * Admin only.
 * Body: { amount, type, category, date, notes? }
 */
router.post(
  '/',
  authorize('CREATE_RECORD'),
  createRecordRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { amount, type, category, date, notes } = req.body;
      const record = await RecordService.create({
        amount,
        type,
        category,
        date,
        notes,
        created_by: req.user.id,
      });
      res.status(201).json({ message: 'Record created.', record });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/records/:id
 * Admin only. Partial update of any field.
 */
router.patch(
  '/:id',
  authorize('UPDATE_RECORD'),
  idParamRule,
  updateRecordRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { amount, type, category, date, notes } = req.body;
      const record = await RecordService.update(req.params.id, { amount, type, category, date, notes });
      res.json({ message: 'Record updated.', record });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/records/:id
 * Admin only. Soft delete — sets deleted_at, data is retained in DB.
 */
router.delete(
  '/:id',
  authorize('DELETE_RECORD'),
  idParamRule,
  validateRequest,
  async (req, res, next) => {
    try {
      await RecordService.remove(req.params.id);
      res.json({ message: 'Record deleted.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
