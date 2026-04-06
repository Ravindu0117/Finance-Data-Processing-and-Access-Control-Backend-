'use strict';

const { body, query, param } = require('express-validator');
const { ROLES, STATUS } = require('../config/constants');

const createUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}.`),
  body('status')
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage(`Status must be one of: ${Object.values(STATUS).join(', ')}.`),
];

const updateUserRules = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}.`),
  body('status')
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage(`Status must be one of: ${Object.values(STATUS).join(', ')}.`),
];

const listUserRules = [
  query('status').optional().isIn(Object.values(STATUS)),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer.').toInt(),
];

module.exports = { createUserRules, updateUserRules, listUserRules, idParamRule };
