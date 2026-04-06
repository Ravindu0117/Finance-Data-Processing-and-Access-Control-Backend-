'use strict';

const jwt = require('jsonwebtoken');
const { getDb, query } = require('../config/database');
const { PERMISSIONS, STATUS } = require('../config/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'finance-dashboard-secret-key-change-in-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

/**
 * Signs a JWT for the given user payload.
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * Middleware: verifies Bearer token and attaches req.user.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' });
  }

  const token = authHeader.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  // Confirm the user still exists and is active
  const db = await getDb();
  const [user] = query(db, 'SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);

  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }
  if (user.status === STATUS.INACTIVE) {
    return res.status(403).json({ error: 'Your account has been deactivated.' });
  }

  req.user = user;
  next();
}

/**
 * Middleware factory: checks that req.user has permission for the given action.
 * Usage: authorize('CREATE_RECORD')
 */
function authorize(action) {
  return (req, res, next) => {
    const allowed = PERMISSIONS[action];
    if (!allowed) {
      return res.status(500).json({ error: `Unknown permission action: ${action}` });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Your role (${req.user.role}) cannot perform: ${action}.`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize, signToken };
