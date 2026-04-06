'use strict';

const { request, app, registerUser } = require('./helpers');

describe('User routes', () => {
  let adminToken, viewerToken, adminUser;

  beforeAll(async () => {
    const admin   = await registerUser({ name: 'Admin', role: 'admin' });
    const viewer  = await registerUser({ name: 'Viewer', role: 'viewer' });
    adminToken  = admin.token;
    adminUser   = admin.user;
    viewerToken = viewer.token;
  });

  // ── GET /api/users ──────────────────────────────────────────────────────────
  describe('GET /api/users', () => {
    it('admin can list all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('viewer cannot list users — 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('unauthenticated request returns 401', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/users/:id ──────────────────────────────────────────────────────
  describe('GET /api/users/:id', () => {
    it('admin can view any user', async () => {
      const { user: target } = await registerUser({ role: 'viewer' });
      const res = await request(app)
        .get(`/api/users/${target.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(target.id);
    });

    it('viewer can view their own profile', async () => {
      const { token, user } = await registerUser({ role: 'viewer' });
      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it("viewer cannot view another user's profile — 403", async () => {
      const { user: other } = await registerUser({ role: 'viewer' });
      const res = await request(app)
        .get(`/api/users/${other.id}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/users ─────────────────────────────────────────────────────────
  describe('POST /api/users', () => {
    it('admin can create a user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
          email: `new_${Date.now()}@example.com`,
          password: 'password123',
          role: 'analyst',
        });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('analyst');
    });

    it('viewer cannot create a user — 403', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'X', email: 'x@x.com', password: 'password123' });
      expect(res.status).toBe(403);
    });
  });

  // ── PATCH /api/users/:id ────────────────────────────────────────────────────
  describe('PATCH /api/users/:id', () => {
    it('admin can update a user role', async () => {
      const { user: target } = await registerUser({ role: 'viewer' });
      const res = await request(app)
        .patch(`/api/users/${target.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'analyst' });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('analyst');
    });

    it('rejects invalid role with 422', async () => {
      const { user: target } = await registerUser({ role: 'viewer' });
      const res = await request(app)
        .patch(`/api/users/${target.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superuser' });
      expect(res.status).toBe(422);
    });
  });

  // ── DELETE /api/users/:id ───────────────────────────────────────────────────
  describe('DELETE /api/users/:id', () => {
    it('admin can delete another user', async () => {
      const { user: target } = await registerUser({ role: 'viewer' });
      const res = await request(app)
        .delete(`/api/users/${target.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('admin cannot delete themselves — 400', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });
});
