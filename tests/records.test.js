'use strict';

const { request, app, registerUser } = require('./helpers');

describe('Financial Record routes', () => {
  let adminToken, analystToken, viewerToken;
  let recordId;

  const sampleRecord = {
    amount:   1500,
    type:     'income',
    category: 'Salary',
    date:     '2024-03-01',
    notes:    'March salary',
  };

  beforeAll(async () => {
    adminToken   = (await registerUser({ role: 'admin'   })).token;
    analystToken = (await registerUser({ role: 'analyst' })).token;
    viewerToken  = (await registerUser({ role: 'viewer'  })).token;
  });

  // ── CREATE ──────────────────────────────────────────────────────────────────
  describe('POST /api/records', () => {
    it('admin can create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleRecord);
      expect(res.status).toBe(201);
      expect(res.body.record.amount).toBe(1500);
      recordId = res.body.record.id;
    });

    it('analyst cannot create a record — 403', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(sampleRecord);
      expect(res.status).toBe(403);
    });

    it('viewer cannot create a record — 403', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(sampleRecord);
      expect(res.status).toBe(403);
    });

    it('rejects negative amount with 422', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...sampleRecord, amount: -100 });
      expect(res.status).toBe(422);
    });

    it('rejects invalid type with 422', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...sampleRecord, type: 'transfer' });
      expect(res.status).toBe(422);
    });

    it('rejects invalid date format with 422', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...sampleRecord, date: '01-03-2024' });
      expect(res.status).toBe(422);
    });

    it('rejects missing required fields with 422', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100 }); // missing type, category, date
      expect(res.status).toBe(422);
    });
  });

  // ── READ ────────────────────────────────────────────────────────────────────
  describe('GET /api/records', () => {
    it('viewer can list records', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('analyst can list records', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
    });

    it('can filter by type', async () => {
      const res = await request(app)
        .get('/api/records?type=income')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(r => expect(r.type).toBe('income'));
    });

    it('can filter by date range', async () => {
      const res = await request(app)
        .get('/api/records?dateFrom=2024-01-01&dateTo=2024-03-31')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/records');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/records/:id', () => {
    it('returns a record by id', async () => {
      const res = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.record.id).toBe(recordId);
    });

    it('returns 404 for missing record', async () => {
      const res = await request(app)
        .get('/api/records/999999')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  describe('PATCH /api/records/:id', () => {
    it('admin can update a record', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 2000, notes: 'Updated note' });
      expect(res.status).toBe(200);
      expect(res.body.record.amount).toBe(2000);
    });

    it('viewer cannot update a record — 403', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ amount: 999 });
      expect(res.status).toBe(403);
    });
  });

  // ── DELETE ──────────────────────────────────────────────────────────────────
  describe('DELETE /api/records/:id', () => {
    it('viewer cannot delete — 403', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('admin can soft-delete a record', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('deleted record no longer appears in GET', async () => {
      const res = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(404);
    });

    it('returns 404 when deleting an already-deleted record', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
