const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');
const { createUser } = require('./helpers');
const pool = require('../src/config/db');

const SECRET = process.env.JWT_SECRET;

describe('authenticate middleware', () => {
  test('returns 401 with no cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/not authenticated/i);
  });

  test('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=bogus_token');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid token/i);
  });

  test('returns 401 with expired token', async () => {
    const user = await createUser();
    const expired = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${expired}`);
    expect(res.status).toBe(401);
  });

  test('passes with valid token', async () => {
    const user = await createUser();
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
  });

  test('returns 403 for a suspended user with a valid token', async () => {
    const user = await createUser();
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/suspended/i);
  });

  test('returns 403 for a token whose user no longer exists', async () => {
    const token = jwt.sign({ id: '00000000-0000-0000-0000-000000000000', email: 'ghost@test.com' }, SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(403);
  });
});

describe('trust proxy', () => {
  test('X-Forwarded-For is ignored in non-production (dev) environment', async () => {
    // In dev NODE_ENV the app should NOT trust proxy headers.
    // We verify the rate-limiter still responds normally (not crash) when the
    // spoofed header is present — the real IP is used, not the spoofed one.
    expect(process.env.NODE_ENV).not.toBe('production');
    const res = await request(app)
      .get('/health')
      .set('X-Forwarded-For', '1.2.3.4');
    expect(res.status).toBe(200);
    // app.get('trust proxy') should be falsy in test/dev
    expect(app.get('trust proxy')).toBeFalsy();
  });
});

describe('requireAdmin middleware', () => {
  test('returns 401 with no cookie', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  test('returns 403 for non-admin user', async () => {
    const user = await createUser();
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: false }, SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin/i);
  });

  test('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', 'token=invalid');
    expect(res.status).toBe(401);
  });

  test('allows admin user', async () => {
    const admin = await createUser({ is_admin: true });
    const token = jwt.sign({ id: admin.id, email: admin.email, is_admin: true }, SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
  });
});
