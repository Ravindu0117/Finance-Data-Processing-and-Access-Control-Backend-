'use strict';

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');

const authRoutes      = require('./routes/auth.routes');
const userRoutes      = require('./routes/user.routes');
const recordRoutes    = require('./routes/record.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/records',   recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
