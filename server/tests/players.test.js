const request = require('supertest');
const { app } = require('../src/app');
const pool = require('../src/config/db');
const { createUser, loginAs } = require('./helpers');

describe('GET /api/players/me', () => {
  test('returns the current player profile', async () => {
    const user = await createUser({ display_name: 'Player One', sports: ['Footvolley'], skill_level: 'B' });
    const cookie = await loginAs(user);
    const res = await request(app)
      .get('/api/players/me')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.player).toMatchObject({
      display_name: 'Player One',
      sports: ['Footvolley'],
      skill_level: 'B',
    });
    expect(res.body.player.password_hash).toBeUndefined();
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/players/me');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/players/me', () => {
  test('updates display_name', async () => {
    const user = await createUser({ display_name: 'Old Name' });
    const cookie = await loginAs(user);
    const res = await request(app)
      .put('/api/players/me')
      .set('Cookie', cookie)
      .send({ display_name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.player.display_name).toBe('New Name');
  });

  test('updates home_beach', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .put('/api/players/me')
      .set('Cookie', cookie)
      .send({ home_beach: 'Hilton Beach' });
    expect(res.status).toBe(200);
    expect(res.body.player.home_beach).toBe('Hilton Beach');
  });

  test('updates sports and skill_level', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .put('/api/players/me')
      .set('Cookie', cookie)
      .send({ sports: ['Beach Volleyball', 'Footvolley'], skill_level: '5' });
    expect(res.status).toBe(200);
    expect(res.body.player.sports).toEqual(expect.arrayContaining(['Beach Volleyball', 'Footvolley']));
    expect(res.body.player.skill_level).toBe('5');
  });

  test('updates avatar_seed', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .put('/api/players/me')
      .set('Cookie', cookie)
      .send({ avatar_seed: 'surfer-wave' });
    expect(res.status).toBe(200);
    expect(res.body.player.avatar_seed).toBe('surfer-wave');
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .put('/api/players/me')
      .send({ display_name: 'Hacker' });
    expect(res.status).toBe(401);
  });

  test('returns 400 when display_name exceeds 50 characters', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .put('/api/players/me')
      .set('Cookie', cookie)
      .send({ display_name: 'A'.repeat(51) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/50 characters/i);
  });

  test('returns 400 when home_beach exceeds 100 characters', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .put('/api/players/me')
      .set('Cookie', cookie)
      .send({ home_beach: 'B'.repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/100 characters/i);
  });

  test('partial update does not overwrite other fields with null', async () => {
    const user = await createUser({ display_name: 'Keep Name', home_beach: 'Gordon Beach' });
    const cookie = await loginAs(user);
    // Only update home_beach — display_name should stay
    const res = await request(app)
      .put('/api/players/me')
      .set('Cookie', cookie)
      .send({ home_beach: 'Hilton Beach' });
    expect(res.status).toBe(200);
    expect(res.body.player.display_name).toBe('Keep Name');
    expect(res.body.player.home_beach).toBe('Hilton Beach');
  });
});

describe('GET /api/players/:id', () => {
  test('returns public profile for a valid user', async () => {
    const user = await createUser({ display_name: 'Public Player' });
    const viewer = await createUser();
    const cookie = await loginAs(viewer);
    const res = await request(app)
      .get(`/api/players/${user.id}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.player).toMatchObject({ display_name: 'Public Player' });
    expect(res.body.player.email).toBeUndefined();
    expect(res.body.player.password_hash).toBeUndefined();
  });

  test('returns 404 for unknown user id', async () => {
    const viewer = await createUser();
    const cookie = await loginAs(viewer);
    const res = await request(app)
      .get('/api/players/00000000-0000-0000-0000-000000000000')
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  test('returns 401 when not authenticated', async () => {
    const user = await createUser();
    const res = await request(app).get(`/api/players/${user.id}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/players/me — edge cases', () => {
  test('returns 404 when authenticated user no longer exists in DB', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    const res = await request(app).get('/api/players/me').set('Cookie', cookie);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

// ── Error paths ───────────────────────────────────────────────────────────────

describe('Players error paths (invalid UUID → 500)', () => {
  const INVALID = 'not-a-uuid';

  test('GET /api/players/me with invalid user ID in JWT returns 500', async () => {
    // Create a JWT with an invalid UUID as the user ID
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: INVALID, email: 'x@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/players/me')
      .set('Cookie', [`token=${token}`]);
    expect(res.status).toBe(500);
  });

  test('PUT /api/players/me with invalid user ID in JWT returns 500', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: INVALID, email: 'x@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .put('/api/players/me')
      .set('Cookie', [`token=${token}`])
      .send({ display_name: 'Test' });
    expect(res.status).toBe(500);
  });

  test('GET /api/players/:id with invalid UUID returns 500', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .get(`/api/players/${INVALID}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(500);
  });
});
