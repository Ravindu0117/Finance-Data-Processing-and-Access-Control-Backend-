'use strict';

const express    = require('express');
const AuthService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const { registerRules, loginRules } = require('../validators/auth.validator');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/auth/register
 * Public. Creates the first admin or a regular user.
 *
 * Body: { name, email, password, role? }
 */
router.post('/register', registerRules, validateRequest, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await AuthService.register({ name, email, password, role });
    res.status(201).json({
      message: 'Registration successful.',
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Public. Returns a JWT on valid credentials.
 *
 * Body: { email, password }
 */
router.post('/login', loginRules, validateRequest, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({
      message: 'Login successful.',
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Protected. Returns the current authenticated user's profile.
 */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
