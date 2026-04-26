const bcrypt = require('bcryptjs');
const request = require('supertest');
const { app } = require('../src/app');
const pool = require('../src/config/db');

let _counter = 0;
function uid() {
  return `${Date.now()}_${++_counter}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Insert a user directly into the DB.
 * Returns the DB row + the raw password used.
 */
async function createUser(overrides = {}) {
  const rawPassword = overrides.password || 'password123';
  const hash = await bcrypt.hash(rawPassword, 4); // low cost for speed
  const email = overrides.email || `user_${uid()}@test.com`;
  const result = await pool.query(
    `INSERT INTO users
       (email, password_hash, display_name, sports, skill_level, avatar_seed, is_admin)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      email,
      hash,
      overrides.display_name || 'Test User',
      overrides.sports || ['Beach Volleyball'],
      overrides.skill_level || '3',
      overrides.avatar_seed || 'beach-ace',
      overrides.is_admin || false,
    ]
  );
  return { ...result.rows[0], rawPassword };
}

/**
 * Log in as a user via the API and return the Set-Cookie header value.
 */
async function loginAs(user) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.rawPassword });
  expect(res.status).toBe(200);
  return res.headers['set-cookie'];
}

/**
 * Insert a game directly into the DB.
 */
async function makeGame(hostId, overrides = {}) {
  const gameDate = overrides.game_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const result = await pool.query(
    `INSERT INTO games
       (host_id, sport, format, skill_level, game_date, duration_hours,
        location_name, location, max_players, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,
             ST_SetSRID(ST_MakePoint($8,$9), 4326),
             $10,$11,$12)
     RETURNING *`,
    [
      hostId,
      overrides.sport || 'Beach Volleyball',
      overrides.format || '2v2',
      overrides.skill_level || '3',
      gameDate,
      overrides.duration_hours || 1.5,
      overrides.location_name || 'Gordon Beach',
      overrides.lng || 34.7669,
      overrides.lat || 32.0861,
      overrides.max_players || 4,
      overrides.notes || null,
      overrides.status || 'open',
    ]
  );
  return result.rows[0];
}

/**
 * Approve a player into a game (insert + approve a game_request).
 */
async function approvePlayer(gameId, playerId) {
  await pool.query(
    `INSERT INTO game_requests (game_id, player_id, status)
     VALUES ($1, $2, 'approved')
     ON CONFLICT (game_id, player_id) DO UPDATE SET status = 'approved'`,
    [gameId, playerId]
  );
  await pool.query(
    'UPDATE users SET games_played = games_played + 1 WHERE id = $1',
    [playerId]
  );
}

module.exports = { createUser, loginAs, makeGame, approvePlayer };
