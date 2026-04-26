const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');
const pool = require('../src/config/db');
const { createUser, loginAs, makeGame, approvePlayer } = require('./helpers');

const SECRET = process.env.JWT_SECRET;

function adminCookie(user) {
  const token = jwt.sign({ id: user.id, email: user.email, is_admin: true }, SECRET, { expiresIn: '1h' });
  return [`token=${token}`];
}

// ── /api/admin/stats ──────────────────────────────────────────────────────────

describe('GET /api/admin/stats', () => {
  test('returns stats for admin', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('games');
    expect(res.body).toHaveProperty('requests');
    expect(typeof res.body.users.total).toBe('number');
  });

  test('rejects non-admin', async () => {
    const user = await createUser();
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: false }, SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', [`token=${token}`]);
    expect(res.status).toBe(403);
  });
});

// ── /api/admin/users ──────────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  test('returns all users', async () => {
    const admin = await createUser({ is_admin: true });
    await createUser({ display_name: 'Player A' });
    await createUser({ display_name: 'Player B' });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
  });

  test('filters by search term', async () => {
    const admin = await createUser({ is_admin: true });
    await createUser({ display_name: 'Searchable Player' });
    const res = await request(app)
      .get('/api/admin/users?search=Searchable')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.users.some(u => u.display_name === 'Searchable Player')).toBe(true);
  });

  test('filters by sport', async () => {
    const admin = await createUser({ is_admin: true });
    await createUser({ sports: ['Footvolley'], skill_level: 'B' });
    await createUser({ sports: ['Beach Volleyball'], skill_level: '3' });
    const res = await request(app)
      .get('/api/admin/users?sport=Footvolley')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    res.body.users.forEach(u => expect(u.sports).toContain('Footvolley'));
  });

  test('filters by skill_level', async () => {
    const admin = await createUser({ is_admin: true });
    await createUser({ skill_level: '7' });
    const res = await request(app)
      .get('/api/admin/users?skill_level=7')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    res.body.users.forEach(u => expect(u.skill_level).toBe('7'));
  });

  test('filters by is_active=false', async () => {
    const admin = await createUser({ is_admin: true });
    const suspended = await createUser();
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [suspended.id]);
    const res = await request(app)
      .get('/api/admin/users?is_active=false')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    res.body.users.forEach(u => expect(u.is_active).toBe(false));
  });
});

describe('GET /api/admin/users/:id', () => {
  test('returns user detail', async () => {
    const admin = await createUser({ is_admin: true });
    const user = await createUser({ display_name: 'Detail Player' });
    const res = await request(app)
      .get(`/api/admin/users/${user.id}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ display_name: 'Detail Player' });
  });

  test('returns 404 for unknown user', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .get('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/admin/users/:id (suspend/edit)', () => {
  test('can suspend a user via is_active: false', async () => {
    const admin = await createUser({ is_admin: true });
    const user = await createUser();
    const res = await request(app)
      .put(`/api/admin/users/${user.id}`)
      .set('Cookie', adminCookie(admin))
      .send({ is_active: false });
    expect(res.status).toBe(200);
    const r = await pool.query('SELECT is_active FROM users WHERE id = $1', [user.id]);
    expect(r.rows[0].is_active).toBe(false);
  });

  test('can update display_name', async () => {
    const admin = await createUser({ is_admin: true });
    const user = await createUser({ display_name: 'Original' });
    const res = await request(app)
      .put(`/api/admin/users/${user.id}`)
      .set('Cookie', adminCookie(admin))
      .send({ display_name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.user.display_name).toBe('Updated');
  });
});

// ── /api/admin/games ──────────────────────────────────────────────────────────

describe('GET /api/admin/games', () => {
  test('returns all games', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    await makeGame(host.id);
    const res = await request(app)
      .get('/api/admin/games')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.games)).toBe(true);
    expect(res.body.games.length).toBeGreaterThanOrEqual(1);
  });

  test('filters by sport', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    await makeGame(host.id, { sport: 'Footvolley', skill_level: 'B' });
    const res = await request(app)
      .get('/api/admin/games?sport=Footvolley')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    res.body.games.forEach(g => expect(g.sport).toBe('Footvolley'));
  });

  test('filters by status', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    await makeGame(host.id, { status: 'cancelled' });
    const res = await request(app)
      .get('/api/admin/games?status=cancelled')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    res.body.games.forEach(g => expect(g.status).toBe('cancelled'));
  });

  test('filters by location search', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    await makeGame(host.id, { location_name: 'Unique Test Beach' });
    const res = await request(app)
      .get('/api/admin/games?search=Unique Test')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.games.some(g => g.location_name === 'Unique Test Beach')).toBe(true);
  });
});

describe('GET /api/admin/games/:id', () => {
  test('returns game detail for admin', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    const game = await makeGame(host.id, { location_name: 'Admin Beach' });
    const res = await request(app)
      .get(`/api/admin/games/${game.id}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.game).toMatchObject({ location_name: 'Admin Beach' });
  });
});

// ── /api/admin/locations ──────────────────────────────────────────────────────

describe('Admin locations CRUD', () => {
  test('GET /api/admin/locations returns locations', async () => {
    const admin = await createUser({ is_admin: true });
    await pool.query(
      "INSERT INTO locations (name, city, lat, lng) VALUES ('Admin Test Beach', 'Tel Aviv', 32.0, 34.7)"
    );
    const res = await request(app)
      .get('/api/admin/locations')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.locations)).toBe(true);
  });

  test('POST /api/admin/locations creates a location', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .post('/api/admin/locations')
      .set('Cookie', adminCookie(admin))
      .send({ name: 'New Admin Beach', city: 'Tel Aviv', lat: 32.1, lng: 34.8 });
    expect(res.status).toBe(201);
    expect(res.body.location).toMatchObject({ name: 'New Admin Beach' });
  });

  test('PUT /api/admin/locations/:id updates a location name', async () => {
    const admin = await createUser({ is_admin: true });
    const r = await pool.query(
      "INSERT INTO locations (name, city, lat, lng) VALUES ('Old Name Beach', 'Tel Aviv', 32.0, 34.7) RETURNING id"
    );
    const locId = r.rows[0].id;
    const res = await request(app)
      .put(`/api/admin/locations/${locId}`)
      .set('Cookie', adminCookie(admin))
      .send({ name: 'Updated Beach Name' });
    expect(res.status).toBe(200);
    expect(res.body.location.name).toBe('Updated Beach Name');
  });

  test('POST /api/admin/locations returns 400 when fields are missing', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .post('/api/admin/locations')
      .set('Cookie', adminCookie(admin))
      .send({ name: 'Missing Fields Beach' }); // missing city, lat, lng
    expect(res.status).toBe(400);
  });

  test('PATCH /api/admin/locations/:id/toggle toggles active status', async () => {
    const admin = await createUser({ is_admin: true });
    const r = await pool.query(
      "INSERT INTO locations (name, city, lat, lng, is_active) VALUES ('Toggle Beach', 'Tel Aviv', 32.0, 34.7, TRUE) RETURNING id"
    );
    const locId = r.rows[0].id;
    const res = await request(app)
      .patch(`/api/admin/locations/${locId}/toggle`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.location.is_active).toBe(false);
  });
});

// ── /api/admin/games — management ─────────────────────────────────────────────

describe('Admin game management', () => {
  test('PUT /api/admin/games/:id updates game fields', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    const game = await makeGame(host.id);
    const res = await request(app)
      .put(`/api/admin/games/${game.id}`)
      .set('Cookie', adminCookie(admin))
      .send({ notes: 'Admin updated note' });
    expect(res.status).toBe(200);
    expect(res.body.game.notes).toBe('Admin updated note');
  });

  test('DELETE /api/admin/games/:id cancels a game', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    const game = await makeGame(host.id);
    const res = await request(app)
      .delete(`/api/admin/games/${game.id}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    const r = await pool.query('SELECT status FROM games WHERE id = $1', [game.id]);
    expect(r.rows[0].status).toBe('cancelled');
  });

  test('POST /api/admin/games/:id/players adds a player', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    const res = await request(app)
      .post(`/api/admin/games/${game.id}/players`)
      .set('Cookie', adminCookie(admin))
      .send({ player_id: player.id });
    expect(res.status).toBe(200);
    const r = await pool.query(
      "SELECT status FROM game_requests WHERE game_id = $1 AND player_id = $2",
      [game.id, player.id]
    );
    expect(r.rows[0].status).toBe('approved');
  });

  test('DELETE /api/admin/games/:id/players/:playerId removes a player', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    await approvePlayer(game.id, player.id);
    const res = await request(app)
      .delete(`/api/admin/games/${game.id}/players/${player.id}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    const r = await pool.query(
      'SELECT id FROM game_requests WHERE game_id = $1 AND player_id = $2',
      [game.id, player.id]
    );
    expect(r.rows.length).toBe(0);
  });

  test('DELETE /api/admin/games/:id/chat clears chat messages', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    const game = await makeGame(host.id);
    await pool.query(
      'INSERT INTO chat_messages (game_id, sender_id, message) VALUES ($1,$2,$3)',
      [game.id, host.id, 'Test message']
    );
    const res = await request(app)
      .delete(`/api/admin/games/${game.id}/chat`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    const r = await pool.query('SELECT id FROM chat_messages WHERE game_id = $1', [game.id]);
    expect(r.rows.length).toBe(0);
  });
});

// ── /api/admin/users — password reset ─────────────────────────────────────────

describe('PUT /api/admin/users/:id/password', () => {
  test('resets a user password', async () => {
    const admin = await createUser({ is_admin: true });
    const user = await createUser({ email: 'resetme@test.com' });
    const res = await request(app)
      .put(`/api/admin/users/${user.id}/password`)
      .set('Cookie', adminCookie(admin))
      .send({ password: 'newpassword123' });
    expect(res.status).toBe(200);
    // Verify new password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'resetme@test.com', password: 'newpassword123' });
    expect(loginRes.status).toBe(200);
  });

  test('returns 400 if password is too short', async () => {
    const admin = await createUser({ is_admin: true });
    const user = await createUser();
    const res = await request(app)
      .put(`/api/admin/users/${user.id}/password`)
      .set('Cookie', adminCookie(admin))
      .send({ password: '12345' });
    expect(res.status).toBe(400);
  });
});

// ── /api/admin/ratings ────────────────────────────────────────────────────────

describe('GET /api/admin/ratings', () => {
  test('returns all ratings', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id, {
      game_date: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
    });
    await approvePlayer(game.id, player.id);
    await pool.query(
      'INSERT INTO ratings (game_id, rater_id, rated_id, stars) VALUES ($1,$2,$3,5)',
      [game.id, player.id, host.id]
    );
    const res = await request(app)
      .get('/api/admin/ratings')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.ratings)).toBe(true);
    expect(res.body.ratings.length).toBeGreaterThanOrEqual(1);
  });
});

describe('DELETE /api/admin/ratings/:id', () => {
  test('deletes a specific rating', async () => {
    const admin = await createUser({ is_admin: true });
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id, { status: 'completed' });
    await approvePlayer(game.id, player.id);
    const r = await pool.query(
      'INSERT INTO ratings (game_id, rater_id, rated_id, stars) VALUES ($1,$2,$3,4) RETURNING id',
      [game.id, player.id, host.id]
    );
    const ratingId = r.rows[0].id;
    const res = await request(app)
      .delete(`/api/admin/ratings/${ratingId}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    const check = await pool.query('SELECT id FROM ratings WHERE id = $1', [ratingId]);
    expect(check.rows.length).toBe(0);
  });
});

// ── /api/admin/matching ───────────────────────────────────────────────────────

describe('GET /api/admin/matching', () => {
  test('returns distribution and suggestions', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .get('/api/admin/matching')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('distribution');
    expect(res.body).toHaveProperty('suggestions');
    expect(Array.isArray(res.body.distribution)).toBe(true);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  });
});

// ── Error path coverage (invalid UUIDs trigger DB errors → 500 catch) ─────────

describe('Admin error paths (invalid UUID triggers 500)', () => {
  const INVALID = 'not-a-uuid';

  test('GET /api/admin/users/:id with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .get(`/api/admin/users/${INVALID}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(500);
  });

  test('PUT /api/admin/users/:id with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .put(`/api/admin/users/${INVALID}`)
      .set('Cookie', adminCookie(admin))
      .send({ display_name: 'x' });
    expect(res.status).toBe(500);
  });

  test('PUT /api/admin/users/:id/password with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .put(`/api/admin/users/${INVALID}/password`)
      .set('Cookie', adminCookie(admin))
      .send({ password: 'newpassword123' });
    expect(res.status).toBe(500);
  });

  test('GET /api/admin/games with invalid sport filter still returns 200', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .get('/api/admin/games?sport=Unknown')
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.games).toEqual([]);
  });

  test('PUT /api/admin/games/:id with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .put(`/api/admin/games/${INVALID}`)
      .set('Cookie', adminCookie(admin))
      .send({ notes: 'test' });
    expect(res.status).toBe(500);
  });

  test('DELETE /api/admin/games/:id with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .delete(`/api/admin/games/${INVALID}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(500);
  });

  test('POST /api/admin/games/:id/players with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .post(`/api/admin/games/${INVALID}/players`)
      .set('Cookie', adminCookie(admin))
      .send({ player_id: INVALID });
    expect(res.status).toBe(500);
  });

  test('DELETE /api/admin/games/:id/players/:playerId with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .delete(`/api/admin/games/${INVALID}/players/${INVALID}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(500);
  });

  test('DELETE /api/admin/games/:id/chat with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .delete(`/api/admin/games/${INVALID}/chat`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(500);
  });

  test('PUT /api/admin/locations/:id with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .put(`/api/admin/locations/${INVALID}`)
      .set('Cookie', adminCookie(admin))
      .send({ name: 'Test' });
    expect(res.status).toBe(500);
  });

  test('PATCH /api/admin/locations/:id/toggle with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .patch(`/api/admin/locations/${INVALID}/toggle`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(500);
  });

  test('DELETE /api/admin/ratings/:id with invalid UUID returns 500', async () => {
    const admin = await createUser({ is_admin: true });
    const res = await request(app)
      .delete(`/api/admin/ratings/${INVALID}`)
      .set('Cookie', adminCookie(admin));
    expect(res.status).toBe(500);
  });
});
