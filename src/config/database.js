'use strict';

const path = require('path');
const initSqlJs = require('../../node_modules/sql.js');

let db = null;

/**
 * Returns the singleton SQL.js Database instance.
 * On first call, initialises the engine and runs schema migrations.
 */
async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  db = new SQL.Database();

  applySchema(db);
  return db;
}

function applySchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'viewer'   CHECK(role IN ('viewer','analyst','admin')),
      status      TEXT    NOT NULL DEFAULT 'active'   CHECK(status IN ('active','inactive')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      amount      REAL    NOT NULL CHECK(amount > 0),
      type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
      category    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      notes       TEXT,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      deleted_at  TEXT    DEFAULT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Index for common filter / sort queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_records_type     ON financial_records(type);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_records_date     ON financial_records(date);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_records_deleted  ON financial_records(deleted_at);`);
}

/**
 * A thin helper that runs a SELECT and returns plain JS objects.
 * sql.js returns results as [{columns:[...], values:[[...]]} ...]
 */
function query(db, sql, params = []) {
  const results = db.exec(sql, params);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map(row =>
    columns.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {})
  );
}

/**
 * Runs a non-SELECT statement and returns { changes, lastInsertRowid }.
 */
function run(db, sql, params = []) {
  db.run(sql, params);
  const meta = db.exec('SELECT changes() AS changes, last_insert_rowid() AS lastId');
  if (!meta.length) return { changes: 0, lastInsertRowid: null };
  const { columns, values } = meta[0];
  const row = columns.reduce((o, c, i) => { o[c] = values[0][i]; return o; }, {});
  return { changes: row.changes, lastInsertRowid: row.lastId };
}

module.exports = { getDb, query, run };
