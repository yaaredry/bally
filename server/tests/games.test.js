const request = require('supertest');
const { app } = require('../src/app');
const pool = require('../src/config/db');
const { createUser, loginAs, makeGame, approvePlayer } = require('./helpers');

// ── GET /api/games ────────────────────────────────────────────────────────────

describe('GET /api/games', () => {
  test('returns open future games', async () => {
    const host = await createUser();
    await makeGame(host.id);
    const viewer = await createUser();
    const cookie = await loginAs(viewer);

    const res = await request(app).get('/api/games').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.games)).toBe(true);
    expect(res.body.games.length).toBeGreaterThanOrEqual(1);
  });

  test('filters by sport', async () => {
    const host = await createUser();
    await makeGame(host.id, { sport: 'Beach Volleyball' });
    await makeGame(host.id, { sport: 'Footvolley' });
    const viewer = await createUser();
    const cookie = await loginAs(viewer);

    const res = await request(app)
      .get('/api/games?sport=Footvolley')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    res.body.games.forEach(g => expect(g.sport).toBe('Footvolley'));
  });

  test('filters by format', async () => {
    const host = await createUser();
    await makeGame(host.id, { format: '2v2' });
    await makeGame(host.id, { format: '3v3' });
    const viewer = await createUser();
    const cookie = await loginAs(viewer);

    const res = await request(app)
      .get('/api/games?format=2v2')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    res.body.games.forEach(g => expect(g.format).toBe('2v2'));
  });

  test('does not return past or cancelled games', async () => {
    const host = await createUser();
    await makeGame(host.id, {
      game_date: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
    });
    await makeGame(host.id, { status: 'cancelled' });
    const viewer = await createUser();
    const cookie = await loginAs(viewer);

    const res = await request(app).get('/api/games').set('Cookie', cookie);
    expect(res.status).toBe(200);
    res.body.games.forEach(g => {
      expect(['open', 'full']).toContain(g.status);
    });
  });

  test('filters by lat/lng radius', async () => {
    const host = await createUser();
    await makeGame(host.id, { lat: 32.0861, lng: 34.7669 }); // Gordon Beach
    const viewer = await createUser();
    const cookie = await loginAs(viewer);
    const res = await request(app)
      .get('/api/games?lat=32.0861&lng=34.7669&radius_km=5')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.games)).toBe(true);
  });

  test('filters by date', async () => {
    const host = await createUser();
    const tomorrow = new Date(Date.now() + 86400000);
    await makeGame(host.id, { game_date: tomorrow.toISOString() });
    const viewer = await createUser();
    const cookie = await loginAs(viewer);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/games?date=${dateStr}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.games)).toBe(true);
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/games');
    expect(res.status).toBe(401);
  });

  test('each game includes slots_remaining', async () => {
    const host = await createUser();
    await makeGame(host.id, { max_players: 4 });
    const viewer = await createUser();
    const cookie = await loginAs(viewer);

    const res = await request(app).get('/api/games').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.games[0]).toHaveProperty('slots_remaining');
  });
});

// ── GET /api/games/my/games ───────────────────────────────────────────────────

describe('GET /api/games/my/games', () => {
  test('returns games hosted and joined', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    await approvePlayer(game.id, player.id);

    const cookie = await loginAs(player);
    const res = await request(app)
      .get('/api/games/my/games')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hosting');
    expect(res.body).toHaveProperty('joined');
    expect(res.body.joined.some(g => g.id === game.id)).toBe(true);
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/games/my/games');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/games/:id ────────────────────────────────────────────────────────

describe('GET /api/games/:id', () => {
  test('returns game detail for any authenticated user', async () => {
    const host = await createUser();
    const game = await makeGame(host.id, { location_name: 'Hilton Beach' });
    const viewer = await createUser();
    const cookie = await loginAs(viewer);

    const res = await request(app)
      .get(`/api/games/${game.id}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.game).toMatchObject({ id: game.id, location_name: 'Hilton Beach' });
    expect(res.body.game).toHaveProperty('roster');
    expect(res.body.game).toHaveProperty('lat');
    expect(res.body.game).toHaveProperty('lng');
  });

  test('chat is visible only to host and approved players', async () => {
    const host = await createUser();
    const player = await createUser();
    const outsider = await createUser();
    const game = await makeGame(host.id);
    await approvePlayer(game.id, player.id);

    const hostCookie = await loginAs(host);
    const playerCookie = await loginAs(player);
    const outsiderCookie = await loginAs(outsider);

    const hostRes = await request(app).get(`/api/games/${game.id}`).set('Cookie', hostCookie);
    expect(hostRes.body.game.can_chat).toBe(true);
    expect(hostRes.body.game.chat_messages).toBeDefined();

    const playerRes = await request(app).get(`/api/games/${game.id}`).set('Cookie', playerCookie);
    expect(playerRes.body.game.can_chat).toBe(true);

    const outsiderRes = await request(app).get(`/api/games/${game.id}`).set('Cookie', outsiderCookie);
    expect(outsiderRes.body.game.can_chat).toBe(false);
    expect(outsiderRes.body.game.chat_messages).toBeUndefined();
  });

  test('returns 404 for unknown game id', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .get('/api/games/00000000-0000-0000-0000-000000000000')
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  test('returns 401 when not authenticated', async () => {
    const host = await createUser();
    const game = await makeGame(host.id);
    const res = await request(app).get(`/api/games/${game.id}`);
    expect(res.status).toBe(401);
  });

  test('includes my_request_status for a pending request', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);

    await pool.query(
      "INSERT INTO game_requests (game_id, player_id, status) VALUES ($1,$2,'pending')",
      [game.id, player.id]
    );
    const cookie = await loginAs(player);
    const res = await request(app).get(`/api/games/${game.id}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.game.my_request_status).toBe('pending');
  });
});

// ── POST /api/games ───────────────────────────────────────────────────────────

describe('POST /api/games', () => {
  const validGame = {
    sport: 'Beach Volleyball',
    format: '2v2',
    skill_level: '3',
    game_date: new Date(Date.now() + 86400000).toISOString(),
    duration_hours: 1.5,
    location_name: 'Gordon Beach',
    lat: 32.0861,
    lng: 34.7669,
    max_players: 4,
  };

  test('creates a game successfully', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .post('/api/games')
      .set('Cookie', cookie)
      .send(validGame);
    expect(res.status).toBe(201);
    expect(res.body.game).toMatchObject({ sport: 'Beach Volleyball', format: '2v2' });
    expect(res.body.game).toHaveProperty('id');
  });

  test('increments host games_hosted count', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    await request(app).post('/api/games').set('Cookie', cookie).send(validGame);
    const r = await pool.query('SELECT games_hosted FROM users WHERE id = $1', [user.id]);
    expect(r.rows[0].games_hosted).toBe(1);
  });

  test('returns 400 when required fields are missing', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .post('/api/games')
      .set('Cookie', cookie)
      .send({ sport: 'Beach Volleyball' }); // missing many fields
    expect(res.status).toBe(400);
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/games').send(validGame);
    expect(res.status).toBe(401);
  });

  test('returns 400 when notes exceed 500 characters', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .post('/api/games')
      .set('Cookie', cookie)
      .send({ ...validGame, notes: 'A'.repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/500 characters/i);
  });
});

// ── DELETE /api/games/:id ─────────────────────────────────────────────────────

describe('DELETE /api/games/:id (cancel)', () => {
  test('host can cancel their game', async () => {
    const host = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(host);
    const res = await request(app)
      .delete(`/api/games/${game.id}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    const r = await pool.query('SELECT status FROM games WHERE id = $1', [game.id]);
    expect(r.rows[0].status).toBe('cancelled');
  });

  test('returns 403 for non-host', async () => {
    const host = await createUser();
    const other = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(other);
    const res = await request(app)
      .delete(`/api/games/${game.id}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  test('returns 404 for unknown game', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .delete('/api/games/00000000-0000-0000-0000-000000000000')
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
  });
});

// ── POST /api/games/:id/join ──────────────────────────────────────────────────

describe('POST /api/games/:id/join', () => {
  test('player can request to join', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/join`)
      .set('Cookie', cookie);
    expect(res.status).toBe(201);
    expect(res.body.request.status).toBe('pending');
  });

  test('host cannot join their own game', async () => {
    const host = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(host);
    const res = await request(app)
      .post(`/api/games/${game.id}/join`)
      .set('Cookie', cookie);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/host/i);
  });

  test('re-joining sets status back to pending', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);

    await pool.query(
      "INSERT INTO game_requests (game_id, player_id, status) VALUES ($1,$2,'declined')",
      [game.id, player.id]
    );
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/join`)
      .set('Cookie', cookie);
    expect(res.status).toBe(201);
    expect(res.body.request.status).toBe('pending');
  });

  test('returns 404 for unknown game', async () => {
    const player = await createUser();
    const cookie = await loginAs(player);
    const res = await request(app)
      .post('/api/games/00000000-0000-0000-0000-000000000000/join')
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
  });
});

// ── GET /api/games/:id/requests ───────────────────────────────────────────────

describe('GET /api/games/:id/requests', () => {
  test('host can see join requests', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    await pool.query(
      "INSERT INTO game_requests (game_id, player_id) VALUES ($1,$2)",
      [game.id, player.id]
    );
    const cookie = await loginAs(host);
    const res = await request(app)
      .get(`/api/games/${game.id}/requests`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.requests.length).toBe(1);
  });

  test('returns 403 for non-host', async () => {
    const host = await createUser();
    const other = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(other);
    const res = await request(app)
      .get(`/api/games/${game.id}/requests`)
      .set('Cookie', cookie);
    expect(res.status).toBe(403);
  });
});

// ── PUT /api/games/:id/requests/:requestId ────────────────────────────────────

describe('PUT /api/games/:id/requests/:requestId', () => {
  test('host can approve a request', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id, { max_players: 4 });
    const reqRes = await pool.query(
      "INSERT INTO game_requests (game_id, player_id) VALUES ($1,$2) RETURNING id",
      [game.id, player.id]
    );
    const requestId = reqRes.rows[0].id;

    const cookie = await loginAs(host);
    const res = await request(app)
      .put(`/api/games/${game.id}/requests/${requestId}`)
      .set('Cookie', cookie)
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('approved');
  });

  test('host can decline a request', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    const reqRes = await pool.query(
      "INSERT INTO game_requests (game_id, player_id) VALUES ($1,$2) RETURNING id",
      [game.id, player.id]
    );
    const requestId = reqRes.rows[0].id;

    const cookie = await loginAs(host);
    const res = await request(app)
      .put(`/api/games/${game.id}/requests/${requestId}`)
      .set('Cookie', cookie)
      .send({ status: 'declined' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('declined');
  });

  test('returns 400 for invalid status', async () => {
    const host = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(host);
    const res = await request(app)
      .put(`/api/games/${game.id}/requests/00000000-0000-0000-0000-000000000000`)
      .set('Cookie', cookie)
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });

  test('returns 403 for non-host', async () => {
    const host = await createUser();
    const other = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(other);
    const res = await request(app)
      .put(`/api/games/${game.id}/requests/00000000-0000-0000-0000-000000000000`)
      .set('Cookie', cookie)
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });

  test('marks game full when max_players reached', async () => {
    const host = await createUser();
    const p1 = await createUser();
    const p2 = await createUser();
    // max_players = 2, so approving 2 requests should make it full
    const game = await makeGame(host.id, { max_players: 2 });

    const r1 = await pool.query(
      "INSERT INTO game_requests (game_id, player_id) VALUES ($1,$2) RETURNING id",
      [game.id, p1.id]
    );
    const r2 = await pool.query(
      "INSERT INTO game_requests (game_id, player_id) VALUES ($1,$2) RETURNING id",
      [game.id, p2.id]
    );

    const cookie = await loginAs(host);
    await request(app)
      .put(`/api/games/${game.id}/requests/${r1.rows[0].id}`)
      .set('Cookie', cookie)
      .send({ status: 'approved' });
    await request(app)
      .put(`/api/games/${game.id}/requests/${r2.rows[0].id}`)
      .set('Cookie', cookie)
      .send({ status: 'approved' });

    const r = await pool.query('SELECT status FROM games WHERE id = $1', [game.id]);
    expect(r.rows[0].status).toBe('full');
  });

  test('returns 400 when trying to approve into a full game', async () => {
    const host = await createUser();
    const p1 = await createUser();
    const p2 = await createUser();
    const game = await makeGame(host.id, { max_players: 1 });

    const r1 = await pool.query(
      "INSERT INTO game_requests (game_id, player_id, status) VALUES ($1,$2,'approved') RETURNING id",
      [game.id, p1.id]
    );
    const r2 = await pool.query(
      "INSERT INTO game_requests (game_id, player_id) VALUES ($1,$2) RETURNING id",
      [game.id, p2.id]
    );

    const cookie = await loginAs(host);
    const res = await request(app)
      .put(`/api/games/${game.id}/requests/${r2.rows[0].id}`)
      .set('Cookie', cookie)
      .send({ status: 'approved' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/full/i);
  });
});

// ── POST /api/games/:id/complete ──────────────────────────────────────────────

describe('POST /api/games/:id/complete', () => {
  test('host can mark game as completed', async () => {
    const host = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(host);
    const res = await request(app)
      .post(`/api/games/${game.id}/complete`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    const r = await pool.query('SELECT status FROM games WHERE id = $1', [game.id]);
    expect(r.rows[0].status).toBe('completed');
  });

  test('returns 403 for non-host', async () => {
    const host = await createUser();
    const other = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(other);
    const res = await request(app)
      .post(`/api/games/${game.id}/complete`)
      .set('Cookie', cookie);
    expect(res.status).toBe(403);
  });
});

// ── DELETE /api/games/:id/leave ───────────────────────────────────────────────

describe('DELETE /api/games/:id/leave', () => {
  test('approved player can leave a game', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    await approvePlayer(game.id, player.id);

    const cookie = await loginAs(player);
    const res = await request(app)
      .delete(`/api/games/${game.id}/leave`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);

    const r = await pool.query(
      'SELECT status FROM game_requests WHERE game_id = $1 AND player_id = $2',
      [game.id, player.id]
    );
    expect(r.rows.length).toBe(0);
  });

  test('reopens a full game when a player leaves', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id, { max_players: 1, status: 'full' });
    await approvePlayer(game.id, player.id);

    const cookie = await loginAs(player);
    await request(app).delete(`/api/games/${game.id}/leave`).set('Cookie', cookie);

    const r = await pool.query('SELECT status FROM games WHERE id = $1', [game.id]);
    expect(r.rows[0].status).toBe('open');
  });

  test('posts a system chat message when player leaves', async () => {
    const host = await createUser();
    const player = await createUser({ display_name: 'Leaver' });
    const game = await makeGame(host.id);
    await approvePlayer(game.id, player.id);

    const cookie = await loginAs(player);
    const res = await request(app).delete(`/api/games/${game.id}/leave`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.system_message.is_system).toBe(true);
    expect(res.body.system_message.message).toMatch(/leaver/i);
  });

  test('returns 400 if player is not approved', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(player);
    const res = await request(app)
      .delete(`/api/games/${game.id}/leave`)
      .set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  test('returns 400 for a completed game', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id, { status: 'completed' });
    await approvePlayer(game.id, player.id);

    const cookie = await loginAs(player);
    const res = await request(app)
      .delete(`/api/games/${game.id}/leave`)
      .set('Cookie', cookie);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/finished|cancelled/i);
  });

  test('returns 404 for unknown game', async () => {
    const player = await createUser();
    const cookie = await loginAs(player);
    const res = await request(app)
      .delete('/api/games/00000000-0000-0000-0000-000000000000/leave')
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
  });
});

// ── POST /api/games/:id/gear ──────────────────────────────────────────────────

describe('POST /api/games/:id/gear and DELETE /api/games/:id/gear/:item', () => {
  test('host can add gear', async () => {
    const host = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(host);
    const res = await request(app)
      .post(`/api/games/${game.id}/gear`)
      .set('Cookie', cookie)
      .send({ item: 'ball' });
    expect(res.status).toBe(201);
  });

  test('approved player can add gear', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id);
    await approvePlayer(game.id, player.id);
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/gear`)
      .set('Cookie', cookie)
      .send({ item: 'speaker' });
    expect(res.status).toBe(201);
  });

  test('non-participant cannot add gear', async () => {
    const host = await createUser();
    const outsider = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(outsider);
    const res = await request(app)
      .post(`/api/games/${game.id}/gear`)
      .set('Cookie', cookie)
      .send({ item: 'ball' });
    expect(res.status).toBe(403);
  });

  test('returns 400 for invalid gear item', async () => {
    const host = await createUser();
    const game = await makeGame(host.id);
    const cookie = await loginAs(host);
    const res = await request(app)
      .post(`/api/games/${game.id}/gear`)
      .set('Cookie', cookie)
      .send({ item: 'invalid_item' });
    expect(res.status).toBe(400);
  });

  test('player can remove their own gear', async () => {
    const host = await createUser();
    const game = await makeGame(host.id);
    await pool.query(
      "INSERT INTO game_gear (game_id, player_id, item) VALUES ($1,$2,'ball')",
      [game.id, host.id]
    );
    const cookie = await loginAs(host);
    const res = await request(app)
      .delete(`/api/games/${game.id}/gear/ball`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    const r = await pool.query(
      "SELECT * FROM game_gear WHERE game_id=$1 AND player_id=$2 AND item='ball'",
      [game.id, host.id]
    );
    expect(r.rows.length).toBe(0);
  });
});

// ── POST /api/games/:id/rate ──────────────────────────────────────────────────

describe('POST /api/games/:id/rate and GET /api/games/:id/my-ratings', () => {
  async function completedGame() {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id, {
      game_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      status: 'completed',
    });
    await approvePlayer(game.id, player.id);
    return { host, player, game };
  }

  test('approved player can rate another participant', async () => {
    const { host, player, game } = await completedGame();
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: host.id, stars: 5 });
    expect(res.status).toBe(201);
  });

  test('host can rate a player', async () => {
    const { host, player, game } = await completedGame();
    const cookie = await loginAs(host);
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: player.id, stars: 4 });
    expect(res.status).toBe(201);
  });

  test('returns 400 for rating yourself', async () => {
    const { player, game } = await completedGame();
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: player.id, stars: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  test('returns 400 if game is not completed', async () => {
    const host = await createUser();
    const player = await createUser();
    const game = await makeGame(host.id, { status: 'open' });
    await approvePlayer(game.id, player.id);
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: host.id, stars: 4 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not completed/i);
  });

  test('returns 403 if non-participant tries to rate', async () => {
    const outsider = await createUser();
    const { host, game } = await completedGame();
    const cookie = await loginAs(outsider);
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: host.id, stars: 3 });
    expect(res.status).toBe(403);
  });

  test('returns 400 if stars out of range', async () => {
    const { host, player, game } = await completedGame();
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: host.id, stars: 6 });
    expect(res.status).toBe(400);
  });

  test('returns 400 if stars is a float', async () => {
    const { host, player, game } = await completedGame();
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: host.id, stars: 4.5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/integer/i);
  });

  test('can update a rating within 7 days', async () => {
    const { host, player, game } = await completedGame();
    const cookie = await loginAs(player);
    await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: host.id, stars: 3 });
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: host.id, stars: 5 });
    expect(res.status).toBe(201);
    const r = await pool.query(
      'SELECT stars FROM ratings WHERE game_id=$1 AND rater_id=$2 AND rated_id=$3',
      [game.id, player.id, host.id]
    );
    expect(r.rows[0].stars).toBe(5);
  });

  test('returns 403 when trying to update a rating older than 7 days', async () => {
    const { host, player, game } = await completedGame();
    // Insert a rating with an old updated_at
    await pool.query(
      `INSERT INTO ratings (game_id, rater_id, rated_id, stars, updated_at)
       VALUES ($1,$2,$3,4, NOW() - INTERVAL '8 days')`,
      [game.id, player.id, host.id]
    );
    const cookie = await loginAs(player);
    const res = await request(app)
      .post(`/api/games/${game.id}/rate`)
      .set('Cookie', cookie)
      .send({ rated_id: host.id, stars: 1 });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/7-day/i);
  });

  test('GET /my-ratings returns stars_map and locked_ids', async () => {
    const { host, player, game } = await completedGame();
    // Insert an old rating (locked)
    await pool.query(
      `INSERT INTO ratings (game_id, rater_id, rated_id, stars, updated_at)
       VALUES ($1,$2,$3,4, NOW() - INTERVAL '8 days')`,
      [game.id, player.id, host.id]
    );
    const cookie = await loginAs(player);
    const res = await request(app)
      .get(`/api/games/${game.id}/my-ratings`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.stars_map[host.id]).toBe(4);
    expect(res.body.locked_ids).toContain(host.id);
  });

  test('GET /my-ratings returns empty for no ratings', async () => {
    const { player, game } = await completedGame();
    const cookie = await loginAs(player);
    const res = await request(app)
      .get(`/api/games/${game.id}/my-ratings`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.stars_map).toEqual({});
    expect(res.body.locked_ids).toEqual([]);
  });
});

// ── GET /api/locations ────────────────────────────────────────────────────────

describe('GET /api/locations', () => {
  test('returns active locations (public endpoint)', async () => {
    await pool.query(
      "INSERT INTO locations (name, city, lat, lng) VALUES ('Test Beach', 'Tel Aviv', 32.0, 34.7)"
    );
    const res = await request(app).get('/api/locations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.locations)).toBe(true);
    expect(res.body.locations.some(l => l.name === 'Test Beach')).toBe(true);
  });

  test('does not return inactive locations', async () => {
    await pool.query(
      "INSERT INTO locations (name, city, lat, lng, is_active) VALUES ('Inactive Beach', 'Tel Aviv', 32.0, 34.7, FALSE)"
    );
    const res = await request(app).get('/api/locations');
    expect(res.status).toBe(200);
    expect(res.body.locations.some(l => l.name === 'Inactive Beach')).toBe(false);
  });
});

// ── GET /health ───────────────────────────────────────────────────────────────

describe('GET /health', () => {
  test('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Error paths (invalid UUID triggers 500) ───────────────────────────────────

describe('Games error paths (invalid UUID → 500)', () => {
  const INVALID = 'not-a-uuid';

  test('GET /api/games/:id with invalid UUID returns 500', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .get(`/api/games/${INVALID}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(500);
  });

  test('POST /api/games/:id/join with invalid UUID returns 500', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .post(`/api/games/${INVALID}/join`)
      .set('Cookie', cookie);
    expect(res.status).toBe(500);
  });

  test('DELETE /api/games/:id with invalid UUID returns 500', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .delete(`/api/games/${INVALID}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(500);
  });

  test('POST /api/games/:id/complete with invalid UUID returns 500', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .post(`/api/games/${INVALID}/complete`)
      .set('Cookie', cookie);
    expect(res.status).toBe(500);
  });

  test('DELETE /api/games/:id/leave with invalid UUID returns 500', async () => {
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .delete(`/api/games/${INVALID}/leave`)
      .set('Cookie', cookie);
    expect(res.status).toBe(500);
  });

  test('GET /api/games/my/games returns 200 for authenticated user', async () => {
    // Covers the success path of /my/games for users with no games
    const user = await createUser();
    const cookie = await loginAs(user);
    const res = await request(app)
      .get('/api/games/my/games')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.hosting).toEqual([]);
    expect(res.body.joined).toEqual([]);
  });
});
