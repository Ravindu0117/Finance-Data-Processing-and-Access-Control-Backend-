'use strict';

const { getDb }    = require('../config/database');
const RecordModel  = require('../models/record.model');

const RecordService = {
  async create(data) {
    const db = await getDb();
    return RecordModel.create(db, data);
  },

  async list(filters) {
    const db = await getDb();
    return RecordModel.findAll(db, filters);
  },

  async getById(id) {
    const db = await getDb();
    const record = RecordModel.findById(db, id);
    if (!record) {
      const err = new Error('Financial record not found.');
      err.status = 404;
      throw err;
    }
    return record;
  },

  async update(id, fields) {
    const db = await getDb();
    const record = RecordModel.findById(db, id);
    if (!record) {
      const err = new Error('Financial record not found.');
      err.status = 404;
      throw err;
    }
    return RecordModel.update(db, id, fields);
  },

  async remove(id) {
    const db = await getDb();
    const deleted = RecordModel.softDelete(db, id);
    if (!deleted) {
      const err = new Error('Financial record not found.');
      err.status = 404;
      throw err;
    }
  },
};

module.exports = RecordService;
