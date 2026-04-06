'use strict';

const ROLES = Object.freeze({
  VIEWER:  'viewer',
  ANALYST: 'analyst',
  ADMIN:   'admin',
});

/**
 * Permission matrix.
 * Each key is an action; values are the roles that may perform it.
 */
const PERMISSIONS = Object.freeze({
  // User management
  CREATE_USER:   [ROLES.ADMIN],
  UPDATE_USER:   [ROLES.ADMIN],
  DELETE_USER:   [ROLES.ADMIN],
  LIST_USERS:    [ROLES.ADMIN],
  VIEW_OWN_PROFILE: [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN],

  // Financial records
  CREATE_RECORD: [ROLES.ADMIN],
  UPDATE_RECORD: [ROLES.ADMIN],
  DELETE_RECORD: [ROLES.ADMIN],
  VIEW_RECORDS:  [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN],

  // Dashboard / analytics
  VIEW_DASHBOARD: [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN],
  VIEW_INSIGHTS:  [ROLES.ANALYST, ROLES.ADMIN],
});

const STATUS = Object.freeze({
  ACTIVE:   'active',
  INACTIVE: 'inactive',
});

const RECORD_TYPES = Object.freeze(['income', 'expense']);

module.exports = { ROLES, PERMISSIONS, STATUS, RECORD_TYPES };
