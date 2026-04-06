'use strict';

const { body, query, param } = require('express-validator');
const { RECORD_TYPES } = require('../config/constants');

const createRecordRules = [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),
  body('type')
    .isIn(RECORD_TYPES)
    .withMessage(`Type must be one of: ${RECORD_TYPES.join(', ')}.`),
  body('category')
    .trim().notEmpty().withMessage('Category is required.')
    .isLength({ max: 80 }),
  body('date')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD).'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 500 }),
];

const updateRecordRules = [
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),
  body('type')
    .optional()
    .isIn(RECORD_TYPES)
    .withMessage(`Type must be one of: ${RECORD_TYPES.join(', ')}.`),
  body('category')
    .optional()
    .trim().notEmpty()
    .isLength({ max: 80 }),
  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD).'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 500 }),
];

const listRecordRules = [
  query('type').optional().isIn(RECORD_TYPES),
  query('category').optional().isString().trim(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['date', 'amount', 'category', 'type', 'created_at']),
  query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
];

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer.').toInt(),
];

module.exports = { createRecordRules, updateRecordRules, listRecordRules, idParamRule };
