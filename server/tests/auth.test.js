const request = require('supertest');
const { app } = require('../src/app');
const { createUser, loginAs } = require('./helpers');
const pool = require('../src/config/db');

describe('POST /api/auth/signup', () => {
  test('creates a new user and sets cookie', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'new@test.com',
        password: 'password123',
        display_name: 'New User',
        sports: ['Beach Volleyball'],
        skill_level: '3',
      });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'new@test.com', display_name: 'New User' });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('lowercases email on signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'UPPER@Test.com', password: 'password123', display_name: 'Upper' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('upper@test.com');
  });

  test('returns 400 for duplicate email', async () => {
    await createUser({ email: 'dup@test.com' });
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@test.com', password: 'password123', display_name: 'Dup' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ password: 'password123', display_name: 'No Email' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when display_name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'x@test.com', password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'short@test.com', password: '1234567', display_name: 'Short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  test('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'notanemail', password: 'password123', display_name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  test('returns 400 for email without domain', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'user@', password: 'password123', display_name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  test('accepts signup without optional fields', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'minimal@test.com', password: 'password123', display_name: 'Minimal' });
    expect(res.status).toBe(201);
    expect(res.body.user.avatar_seed).toBe('beach-ace');
  });

  test('returns 400 when display_name exceeds 50 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'toolong@test.com', password: 'password123', display_name: 'A'.repeat(51) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/50 characters/i);
  });

  test('returns 400 when email exceeds 254 characters', async () => {
    const longEmail = 'a'.repeat(244) + '@test.com'; // 253+1 = 254... let's make it 255
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'a'.repeat(246) + '@test.com', password: 'password123', display_name: 'Long Email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too long/i);
  });
});

describe('POST /api/auth/login', () => {
  test('logs in with correct credentials', async () => {
    const user = await createUser({ email: 'login@test.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: user.rawPassword });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'login@test.com' });
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('returns 401 for wrong password', async () => {
    await createUser({ email: 'wrongpw@test.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpw@test.com', password: 'wrong_password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  test('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  test('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@test.com' });
    expect(res.status).toBe(400);
  });

  test('returns 403 for suspended account', async () => {
    const user = await createUser({ email: 'suspended@test.com' });
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [user.id]);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'suspended@test.com', password: user.rawPassword });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/suspended/i);
  });

  test('login is case-insensitive on email', async () => {
    const user = await createUser({ email: 'case@test.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'CASE@test.com', password: user.rawPassword });
    expect(res.status).toBe(200);
  });

  test('token includes is_admin flag', async () => {
    const admin = await createUser({ email: 'admin@test.com', is_admin: true });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: admin.rawPassword });
    expect(res.status).toBe(200);
    expect(res.body.user.is_admin).toBe(true);
  });
});

describe('POST /api/auth/logout', () => {
  test('clears the cookie', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    // Cookie should be cleared (Max-Age=0 or expires in past)
    const setCookie = res.headers['set-cookie']?.[0] || '';
    expect(setCookie).toMatch(/token=;|Max-Age=0/);
  });

  test('logout works without being logged in', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/auth/me', () => {
  test('returns current user when authenticated', async () => {
    const user = await createUser({ email: 'me@test.com', display_name: 'Me User' });
    const cookie = await loginAs(user);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'me@test.com', display_name: 'Me User' });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/auth/me — edge cases', () => {
  test('returns 403 when authenticated user no longer exists in DB', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    // Middleware catches missing user and treats it as suspended/inactive
    expect(res.status).toBe(403);
  });
});

describe('Auth DB error paths', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  test('returns 500 when DB fails on POST /auth/signup', async () => {
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'err@test.com', password: 'password123', display_name: 'ErrUser' });
    expect(res.status).toBe(500);
  });

  test('returns 500 when DB fails on POST /auth/login', async () => {
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'err@test.com', password: 'password123' });
    expect(res.status).toBe(500);
  });

  test('returns 500 when DB fails on GET /auth/me', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    // The authenticate middleware now queries the DB; the mock is consumed there
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(500);
  });
});
