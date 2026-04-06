'use strict';

const { validationResult } = require('express-validator');

/**
 * Reads express-validator errors from req and short-circuits with 422 if any.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed.',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Global error handler — must be registered last in Express.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Only log unexpected server errors; suppress expected 4xx noise in tests
  const status = err.status || 500;
  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[ERROR]', err.message || err);
  }

  // SQLite unique constraint
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: 'A record with that value already exists.' });
  }

  res.status(status).json({
    error: err.message || 'An unexpected error occurred.',
  });
}

/**
 * 404 handler — register after all routes.
 */
function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { validateRequest, errorHandler, notFound };
