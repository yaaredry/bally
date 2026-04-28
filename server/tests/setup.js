const pool = require('../src/config/db');

beforeEach(async () => {
  // Delete in dependency order (children before parents)
  await pool.query('DELETE FROM ratings');
  await pool.query('DELETE FROM game_gear');
  await pool.query('DELETE FROM chat_messages');
  await pool.query('DELETE FROM game_requests');
  await pool.query('DELETE FROM games');
  await pool.query('DELETE FROM location_nets');
  await pool.query('DELETE FROM locations');
  await pool.query('DELETE FROM users');
});

afterAll(async () => {
  await pool.end();
});
