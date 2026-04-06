'use strict';

const { request, app, registerUser } = require('./helpers');

describe('Auth routes', () => {
  const baseEmail = `auth_${Date.now()}@example.com`;

  // ── Registration ────────────────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice',
        email: baseEmail,
        password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(baseEmail);
      expect(res.body.user.password).toBeUndefined(); // hash must NOT be exposed
    });

    it('rejects duplicate email with 409', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Again',
        email: baseEmail,
        password: 'password123',
      });
      expect(res.status).toBe(409);
    });

    it('rejects missing fields with 422', async () => {
      const res = await request(app).post('/api/auth/register').send({ name: 'No Email' });
      expect(res.status).toBe(422);
      expect(res.body.details).toBeDefined();
    });

    it('rejects a short password with 422', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short',
        email: 'short@example.com',
        password: '123',
      });
      expect(res.status).toBe(422);
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('returns a token for valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: baseEmail,
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: baseEmail,
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(401);
    });
  });

  // ── /me ─────────────────────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('returns own profile when authenticated', async () => {
      const { token, user } = await registerUser();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with a malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.real.token');
      expect(res.status).toBe(401);
    });
  });
});
