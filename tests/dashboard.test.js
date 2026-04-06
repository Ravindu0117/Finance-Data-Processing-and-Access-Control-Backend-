'use strict';

const { request, app, registerUser } = require('./helpers');

describe('Dashboard routes', () => {
  let adminToken, analystToken, viewerToken;

  const createRecord = (token, overrides = {}) =>
    request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount:   500,
        type:     'income',
        category: 'Test',
        date:     '2024-06-01',
        ...overrides,
      });

  beforeAll(async () => {
    adminToken   = (await registerUser({ role: 'admin'   })).token;
    analystToken = (await registerUser({ role: 'analyst' })).token;
    viewerToken  = (await registerUser({ role: 'viewer'  })).token;

    // Seed a few records
    await createRecord(adminToken, { amount: 1000, type: 'income',  category: 'Salary' });
    await createRecord(adminToken, { amount: 300,  type: 'expense', category: 'Rent'   });
    await createRecord(adminToken, { amount: 200,  type: 'expense', category: 'Food'   });
  });

  // ── Summary (all roles) ─────────────────────────────────────────────────────
  describe('GET /api/dashboard/summary', () => {
    it('viewer can access summary', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.summary).toHaveProperty('total_income');
      expect(res.body.summary).toHaveProperty('total_expenses');
      expect(res.body.summary).toHaveProperty('net_balance');
    });

    it('net_balance equals income minus expenses', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      const { total_income, total_expenses, net_balance } = res.body.summary;
      expect(net_balance).toBeCloseTo(total_income - total_expenses, 2);
    });

    it('unauthenticated request returns 401', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
    });
  });

  // ── Recent activity (all roles) ─────────────────────────────────────────────
  describe('GET /api/dashboard/recent', () => {
    it('viewer can see recent activity', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent?limit=5')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.activity)).toBe(true);
    });
  });

  // ── Category breakdown (analyst / admin only) ───────────────────────────────
  describe('GET /api/dashboard/categories', () => {
    it('analyst can access category breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/categories')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.breakdown)).toBe(true);
    });

    it('viewer cannot access category breakdown — 403', async () => {
      const res = await request(app)
        .get('/api/dashboard/categories')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('can filter breakdown by type', async () => {
      const res = await request(app)
        .get('/api/dashboard/categories?type=expense')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      res.body.breakdown.forEach(row => expect(row.type).toBe('expense'));
    });
  });

  // ── Monthly trends (analyst / admin only) ───────────────────────────────────
  describe('GET /api/dashboard/trends', () => {
    it('admin can access monthly trends', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?year=2024')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.trends)).toBe(true);
    });

    it('viewer cannot access monthly trends — 403', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects invalid year with 422', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?year=1800')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(422);
    });
  });
});
