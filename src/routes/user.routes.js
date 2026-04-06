'use strict';

const express     = require('express');
const UserService = require('../services/user.service');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest }         = require('../middleware/errorHandler');
const {
  createUserRules,
  updateUserRules,
  listUserRules,
  idParamRule,
} = require('../validators/user.validator');

const router = express.Router();

// All user-management routes require authentication
router.use(authenticate);

/**
 * GET /api/users
 * Admin only. Lists all users with optional ?status filter and pagination.
 */
router.get(
  '/',
  authorize('LIST_USERS'),
  listUserRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { page, limit, status } = req.query;
      const result = await UserService.list({ page, limit, status });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/users/:id
 * Admin can view any user. Non-admins can only view their own profile.
 */
router.get('/:id', idParamRule, validateRequest, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const isAdmin  = req.user.role === 'admin';

    if (!isAdmin && req.user.id !== targetId) {
      return res.status(403).json({ error: 'You may only view your own profile.' });
    }

    const user = await UserService.getById(targetId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Admin only. Creates a new user with an explicit role.
 */
router.post(
  '/',
  authorize('CREATE_USER'),
  createUserRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, password, role, status } = req.body;
      const user = await UserService.create({ name, email, password, role, status });
      res.status(201).json({ message: 'User created.', user });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/users/:id
 * Admin only. Updates name, role, or status.
 */
router.patch(
  '/:id',
  authorize('UPDATE_USER'),
  idParamRule,
  updateUserRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, role, status } = req.body;
      const user = await UserService.update(req.params.id, { name, role, status });
      res.json({ message: 'User updated.', user });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Admin only. Hard deletes a user (cannot self-delete).
 */
router.delete(
  '/:id',
  authorize('DELETE_USER'),
  idParamRule,
  validateRequest,
  async (req, res, next) => {
    try {
      await UserService.remove(req.params.id, req.user.id);
      res.json({ message: 'User deleted.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
