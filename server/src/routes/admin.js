const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const requireAdmin = require('../middleware/requireAdmin');

router.use(requireAdmin);

// ── Stats / Metrics ──────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const [
      userCount,
      activeUsers,
      sportBreakdown,
      levelBreakdown,
      gamesByStatus,
      gamesLast7,
      gamesLast30,
      popularLocations,
      topPlayers,
      approvalRate,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE is_admin = FALSE'),
      pool.query(`
        SELECT COUNT(DISTINCT u.id) FROM users u
        WHERE u.is_admin = FALSE AND (
          EXISTS (SELECT 1 FROM games g WHERE g.host_id = u.id AND g.created_at > NOW() - INTERVAL '30 days')
          OR EXISTS (SELECT 1 FROM game_requests gr WHERE gr.player_id = u.id AND gr.created_at > NOW() - INTERVAL '30 days')
        )
      `),
      pool.query(`
        SELECT unnest(sports) AS sport, COUNT(*) AS count
        FROM users WHERE is_admin = FALSE GROUP BY sport ORDER BY count DESC
      `),
      pool.query(`
        SELECT skill_level, COUNT(*) AS count
        FROM users WHERE is_admin = FALSE AND skill_level IS NOT NULL
        GROUP BY skill_level ORDER BY skill_level
      `),
      pool.query(`SELECT status, COUNT(*) AS count FROM games GROUP BY status`),
      pool.query(`SELECT COUNT(*) FROM games WHERE created_at > NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*) FROM games WHERE created_at > NOW() - INTERVAL '30 days'`),
      pool.query(`
        SELECT location_name, COUNT(*) AS count
        FROM games GROUP BY location_name ORDER BY count DESC LIMIT 10
      `),
      pool.query(`
        SELECT u.id, u.display_name, u.avatar_seed, u.sports, u.skill_level,
               u.games_hosted, u.games_played,
               (u.games_hosted + u.games_played) AS total_activity
        FROM users u WHERE u.is_admin = FALSE
        ORDER BY total_activity DESC LIMIT 10
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'approved') AS approved,
          COUNT(*) AS total
        FROM game_requests
      `),
    ]);

    res.json({
      users: {
        total: parseInt(userCount.rows[0].count),
        active_last_30d: parseInt(activeUsers.rows[0].count),
        by_sport: sportBreakdown.rows,
        by_level: levelBreakdown.rows,
      },
      games: {
        by_status: gamesByStatus.rows,
        last_7_days: parseInt(gamesLast7.rows[0].count),
        last_30_days: parseInt(gamesLast30.rows[0].count),
      },
      locations: { popular: popularLocations.rows },
      players: { top_active: topPlayers.rows },
      requests: {
        approved: parseInt(approvalRate.rows[0].approved),
        total: parseInt(approvalRate.rows[0].total),
        approval_rate: approvalRate.rows[0].total > 0
          ? Math.round((approvalRate.rows[0].approved / approvalRate.rows[0].total) * 100)
          : 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Users ────────────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  const { search, sport, skill_level, is_active } = req.query;
  const conditions = ['is_admin = FALSE'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(display_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }
  if (sport) {
    params.push(sport);
    conditions.push(`$${params.length} = ANY(sports)`);
  }
  if (skill_level) {
    params.push(skill_level);
    conditions.push(`skill_level = $${params.length}`);
  }
  if (is_active !== undefined) {
    params.push(is_active === 'true');
    conditions.push(`is_active = $${params.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT id, email, display_name, home_beach, sports, skill_level, avatar_seed,
              games_hosted, games_played, is_active, created_at,
              ROUND((SELECT AVG(stars) FROM ratings WHERE rated_id = users.id)::numeric, 1) AS avg_rating,
              (SELECT COUNT(*) FROM ratings WHERE rated_id = users.id) AS rating_count
       FROM users
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC`,
      params
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const [user, games, ratingsReceived] = await Promise.all([
      pool.query(
        `SELECT id, email, display_name, home_beach, sports, skill_level, avatar_seed,
                games_hosted, games_played, is_active, created_at
         FROM users WHERE id = $1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT g.id, g.sport, g.format, g.skill_level, g.game_date, g.status, g.location_name,
                CASE WHEN g.host_id = $1 THEN 'host' ELSE 'player' END AS role
         FROM games g
         LEFT JOIN game_requests gr ON gr.game_id = g.id AND gr.player_id = $1 AND gr.status = 'approved'
         WHERE g.host_id = $1 OR gr.player_id IS NOT NULL
         ORDER BY g.game_date DESC LIMIT 20`,
        [req.params.id]
      ),
      pool.query(
        `SELECT r.stars, r.created_at, u.display_name AS rater_name, u.avatar_seed AS rater_avatar,
                g.sport, g.game_date
         FROM ratings r
         JOIN users u ON u.id = r.rater_id
         JOIN games g ON g.id = r.game_id
         WHERE r.rated_id = $1
         ORDER BY r.created_at DESC`,
        [req.params.id]
      ),
    ]);

    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: user.rows[0],
      games: games.rows,
      ratings: ratingsReceived.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id', async (req, res) => {
  const { display_name, home_beach, sports, skill_level, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
         display_name = COALESCE($1, display_name),
         home_beach   = COALESCE($2, home_beach),
         sports       = COALESCE($3, sports),
         skill_level  = COALESCE($4, skill_level),
         is_active    = COALESCE($5, is_active)
       WHERE id = $6 AND is_admin = FALSE
       RETURNING id, email, display_name, home_beach, sports, skill_level, avatar_seed, games_hosted, games_played, is_active`,
      [display_name, home_beach, sports, skill_level, is_active, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND is_admin = FALSE RETURNING id',
      [hash, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Games ────────────────────────────────────────────────────────────────────

router.get('/games', async (req, res) => {
  const { sport, status, search } = req.query;
  const conditions = [];
  const params = [];

  if (sport) { params.push(sport); conditions.push(`g.sport = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`g.status = $${params.length}`); }
  if (search) { params.push(`%${search}%`); conditions.push(`g.location_name ILIKE $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT g.id, g.sport, g.format, g.skill_level, g.game_date, g.status,
              g.location_name, g.max_players, g.notes, g.created_at,
              u.display_name AS host_name, u.avatar_seed AS host_avatar,
              (SELECT COUNT(*) FROM game_requests WHERE game_id = g.id AND status = 'approved') AS approved_count,
              (SELECT COUNT(*) FROM game_requests WHERE game_id = g.id AND status = 'pending') AS pending_count
       FROM games g JOIN users u ON u.id = g.host_id
       ${where}
       ORDER BY g.game_date DESC`,
      params
    );
    res.json({ games: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/games/:id', async (req, res) => {
  try {
    const [game, requests, chat] = await Promise.all([
      pool.query(
        `SELECT g.*, u.display_name AS host_name, u.email AS host_email
         FROM games g JOIN users u ON u.id = g.host_id WHERE g.id = $1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT gr.id, gr.status, gr.created_at,
                u.id AS player_id, u.display_name, u.email, u.avatar_seed, u.skill_level
         FROM game_requests gr JOIN users u ON u.id = gr.player_id
         WHERE gr.game_id = $1 ORDER BY gr.created_at`,
        [req.params.id]
      ),
      pool.query(
        `SELECT cm.id, cm.message, cm.created_at, u.display_name AS sender_name
         FROM chat_messages cm JOIN users u ON u.id = cm.sender_id
         WHERE cm.game_id = $1 ORDER BY cm.created_at`,
        [req.params.id]
      ),
    ]);

    if (!game.rows.length) return res.status(404).json({ error: 'Game not found' });

    res.json({ game: game.rows[0], requests: requests.rows, chat: chat.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/games/:id', async (req, res) => {
  const { sport, format, skill_level, game_date, duration_hours, location_name, max_players, notes, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE games SET
         sport          = COALESCE($1, sport),
         format         = COALESCE($2, format),
         skill_level    = COALESCE($3, skill_level),
         game_date      = COALESCE($4, game_date),
         duration_hours = COALESCE($5, duration_hours),
         location_name  = COALESCE($6, location_name),
         max_players    = COALESCE($7, max_players),
         notes          = COALESCE($8, notes),
         status         = COALESCE($9, status)
       WHERE id = $10
       RETURNING *`,
      [sport, format, skill_level, game_date, duration_hours, location_name, max_players, notes, status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Game not found' });
    res.json({ game: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/games/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE games SET status = 'cancelled' WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Game cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/games/:id/players', async (req, res) => {
  const { player_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO game_requests (game_id, player_id, status) VALUES ($1,$2,'approved')
       ON CONFLICT (game_id, player_id) DO UPDATE SET status = 'approved'`,
      [req.params.id, player_id]
    );
    res.json({ message: 'Player added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/games/:id/players/:playerId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM game_requests WHERE game_id = $1 AND player_id = $2',
      [req.params.id, req.params.playerId]
    );
    res.json({ message: 'Player removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/games/:id/chat', async (req, res) => {
  try {
    await pool.query('DELETE FROM chat_messages WHERE game_id = $1', [req.params.id]);
    res.json({ message: 'Chat cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Locations ────────────────────────────────────────────────────────────────

router.get('/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY city, lat DESC');
    res.json({ locations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/locations', async (req, res) => {
  const { name, city, lat, lng } = req.body;
  if (!name || !city || lat == null || lng == null) {
    return res.status(400).json({ error: 'name, city, lat, and lng are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO locations (name, city, lat, lng) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, city, lat, lng]
    );
    res.status(201).json({ location: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Location name already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/locations/:id', async (req, res) => {
  const { name, city, lat, lng } = req.body;
  try {
    const result = await pool.query(
      `UPDATE locations SET
         name = COALESCE($1, name),
         city = COALESCE($2, city),
         lat  = COALESCE($3, lat),
         lng  = COALESCE($4, lng)
       WHERE id = $5 RETURNING *`,
      [name, city, lat, lng, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Location not found' });
    res.json({ location: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/locations/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE locations SET is_active = NOT is_active WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Location not found' });
    res.json({ location: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Ratings ──────────────────────────────────────────────────────────────────

router.get('/ratings', async (req, res) => {
  const { user_id, game_id } = req.query;
  const conditions = [];
  const params = [];

  if (user_id) { params.push(user_id); conditions.push(`r.rated_id = $${params.length}`); }
  if (game_id) { params.push(game_id); conditions.push(`r.game_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT r.id, r.stars, r.created_at,
              rater.display_name AS rater_name, rater.email AS rater_email,
              rated.display_name AS rated_name, rated.email AS rated_email,
              g.sport, g.game_date, g.location_name
       FROM ratings r
       JOIN users rater ON rater.id = r.rater_id
       JOIN users rated ON rated.id = r.rated_id
       JOIN games g ON g.id = r.game_id
       ${where}
       ORDER BY r.created_at DESC`,
      params
    );
    res.json({ ratings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/ratings/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ratings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Rating deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Matching ─────────────────────────────────────────────────────────────────

router.get('/matching', async (req, res) => {
  try {
    // Level distribution
    const distribution = await pool.query(`
      SELECT skill_level, COUNT(*) AS count,
             array_agg(sport ORDER BY sport) AS sports_array
      FROM (
        SELECT u.id, u.skill_level, unnest(u.sports) AS sport
        FROM users u WHERE u.is_admin = FALSE AND u.skill_level IS NOT NULL AND u.is_active = TRUE
      ) sub
      GROUP BY skill_level ORDER BY skill_level
    `);

    // Pairs with same skill level who have never been in the same game
    const pairs = await pool.query(`
      WITH eligible AS (
        SELECT id, display_name, avatar_seed, skill_level, sports,
               (games_hosted + games_played) AS activity
        FROM users
        WHERE is_admin = FALSE AND is_active = TRUE AND skill_level IS NOT NULL
      ),
      same_level_pairs AS (
        SELECT a.id AS id_a, a.display_name AS name_a, a.avatar_seed AS avatar_a,
               a.skill_level, a.sports AS sports_a, a.activity AS activity_a,
               b.id AS id_b, b.display_name AS name_b, b.avatar_seed AS avatar_b,
               b.sports AS sports_b, b.activity AS activity_b
        FROM eligible a JOIN eligible b ON a.skill_level = b.skill_level AND a.id < b.id
      ),
      played_together AS (
        SELECT LEAST(gr1.player_id, gr2.player_id) AS id_a,
               GREATEST(gr1.player_id, gr2.player_id) AS id_b
        FROM game_requests gr1
        JOIN game_requests gr2 ON gr1.game_id = gr2.game_id
          AND gr1.player_id != gr2.player_id
          AND gr1.status = 'approved' AND gr2.status = 'approved'
        UNION
        SELECT LEAST(g.host_id, gr.player_id),
               GREATEST(g.host_id, gr.player_id)
        FROM games g
        JOIN game_requests gr ON gr.game_id = g.id AND gr.status = 'approved'
      )
      SELECT slp.*
      FROM same_level_pairs slp
      WHERE NOT EXISTS (
        SELECT 1 FROM played_together pt WHERE pt.id_a = slp.id_a AND pt.id_b = slp.id_b
      )
      ORDER BY (slp.activity_a + slp.activity_b) DESC
      LIMIT 50
    `);

    res.json({
      distribution: distribution.rows,
      suggestions: pairs.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
