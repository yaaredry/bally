const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/games/my/games — must be before /:id
router.get('/my/games', authenticate, async (req, res) => {
  try {
    const hosting = await pool.query(
      `SELECT g.*, ST_Y(g.location::geometry) as lat, ST_X(g.location::geometry) as lng,
         COUNT(CASE WHEN gr.status = 'approved' THEN 1 END)::int as approved_count
       FROM games g
       LEFT JOIN game_requests gr ON g.id = gr.game_id
       WHERE g.host_id = $1 AND g.status != 'cancelled'
       GROUP BY g.id ORDER BY g.game_date DESC`,
      [req.user.id]
    );

    const joined = await pool.query(
      `SELECT g.*, ST_Y(g.location::geometry) as lat, ST_X(g.location::geometry) as lng,
         gr.status as my_status, u.display_name as host_name, u.avatar_seed as host_avatar
       FROM game_requests gr
       JOIN games g ON gr.game_id = g.id
       JOIN users u ON g.host_id = u.id
       WHERE gr.player_id = $1 AND g.status != 'cancelled'
       ORDER BY g.game_date DESC`,
      [req.user.id]
    );

    res.json({ hosting: hosting.rows, joined: joined.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/games
router.get('/', authenticate, async (req, res) => {
  const { sport, skill_level, format, date, lat, lng, radius_km = 50 } = req.query;

  let query = `
    SELECT g.*,
      u.display_name as host_name, u.avatar_seed as host_avatar, u.skill_level as host_skill,
      ST_Y(g.location::geometry) as lat, ST_X(g.location::geometry) as lng,
      COUNT(CASE WHEN gr.status = 'approved' THEN 1 END)::int as approved_count,
      (g.max_players - COUNT(CASE WHEN gr.status = 'approved' THEN 1 END))::int as slots_remaining
    FROM games g
    JOIN users u ON g.host_id = u.id
    LEFT JOIN game_requests gr ON g.id = gr.game_id
    WHERE g.status NOT IN ('cancelled', 'completed') AND g.game_date > NOW()
  `;
  const params = [];
  let idx = 1;

  if (sport) { query += ` AND g.sport = $${idx++}`; params.push(sport); }
  if (skill_level) { query += ` AND g.skill_level = $${idx++}`; params.push(skill_level); }
  if (format) { query += ` AND g.format = $${idx++}`; params.push(format); }
  if (date) { query += ` AND DATE(g.game_date) = $${idx++}`; params.push(date); }
  if (lat && lng) {
    query += ` AND ST_DWithin(g.location::geography, ST_MakePoint($${idx++}, $${idx++})::geography, $${idx++} * 1000)`;
    params.push(parseFloat(lng), parseFloat(lat), parseFloat(radius_km));
  }

  query += ' GROUP BY g.id, u.display_name, u.avatar_seed, u.skill_level ORDER BY g.game_date ASC';

  try {
    const result = await pool.query(query, params);
    res.json({ games: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/games/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const gameResult = await pool.query(
      `SELECT g.*,
         u.display_name as host_name, u.avatar_seed as host_avatar, u.skill_level as host_skill,
         ST_Y(g.location::geometry) as lat, ST_X(g.location::geometry) as lng,
         COUNT(CASE WHEN gr.status = 'approved' THEN 1 END)::int as approved_count
       FROM games g
       JOIN users u ON g.host_id = u.id
       LEFT JOIN game_requests gr ON g.id = gr.game_id
       WHERE g.id = $1
       GROUP BY g.id, u.display_name, u.avatar_seed, u.skill_level`,
      [req.params.id]
    );

    if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    const game = gameResult.rows[0];

    const rosterResult = await pool.query(
      `SELECT u.id, u.display_name, u.avatar_seed, u.skill_level
       FROM game_requests gr JOIN users u ON gr.player_id = u.id
       WHERE gr.game_id = $1 AND gr.status = 'approved'`,
      [req.params.id]
    );
    game.roster = rosterResult.rows;
    game.slots_remaining = game.max_players - game.approved_count;

    const myReq = await pool.query(
      'SELECT id, status FROM game_requests WHERE game_id = $1 AND player_id = $2',
      [req.params.id, req.user.id]
    );
    game.my_request_id = myReq.rows[0]?.id || null;
    game.my_request_status = myReq.rows[0]?.status || null;

    const isHost = game.host_id === req.user.id;
    const isApproved = rosterResult.rows.some(r => r.id === req.user.id);

    if (isHost || isApproved) {
      const chatResult = await pool.query(
        `SELECT cm.id, cm.message, cm.created_at, cm.sender_id,
           u.display_name as sender_name, u.avatar_seed as sender_avatar
         FROM chat_messages cm JOIN users u ON cm.sender_id = u.id
         WHERE cm.game_id = $1 ORDER BY cm.created_at ASC LIMIT 200`,
        [req.params.id]
      );
      game.chat_messages = chatResult.rows;
      game.can_chat = true;
    } else {
      game.can_chat = false;
    }

    res.json({ game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/games
router.post('/', authenticate, async (req, res) => {
  const { sport, format, skill_level, game_date, duration_hours, location_name, lat, lng, max_players, notes } = req.body;

  if (!sport || !format || !skill_level || !game_date || !location_name || !lat || !lng || !max_players) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO games (host_id, sport, format, skill_level, game_date, duration_hours, location_name, location, max_players, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), $10, $11)
       RETURNING *, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng`,
      [req.user.id, sport, format, skill_level, game_date, duration_hours, location_name, parseFloat(lng), parseFloat(lat), parseInt(max_players), notes || null]
    );

    await pool.query('UPDATE users SET games_hosted = games_hosted + 1 WHERE id = $1', [req.user.id]);

    res.status(201).json({ game: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/games/:id (cancel)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT host_id FROM games WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    if (result.rows[0].host_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await pool.query("UPDATE games SET status = 'cancelled' WHERE id = $1", [req.params.id]);
    await pool.query('UPDATE users SET games_hosted = GREATEST(games_hosted - 1, 0) WHERE id = $1', [req.user.id]);

    res.json({ message: 'Game cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/games/:id/join
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const gameResult = await pool.query(
      'SELECT id, host_id, max_players, status FROM games WHERE id = $1',
      [req.params.id]
    );
    if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });

    const game = gameResult.rows[0];
    if (game.host_id === req.user.id) return res.status(400).json({ error: 'You are the host' });
    if (!['open', 'full'].includes(game.status) === false && game.status !== 'open') {
      return res.status(400).json({ error: 'Game is not accepting requests' });
    }

    const result = await pool.query(
      `INSERT INTO game_requests (game_id, player_id)
       VALUES ($1, $2)
       ON CONFLICT (game_id, player_id) DO UPDATE SET status = 'pending'
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    res.status(201).json({ request: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/games/:id/requests (host dashboard)
router.get('/:id/requests', authenticate, async (req, res) => {
  try {
    const gameResult = await pool.query('SELECT host_id FROM games WHERE id = $1', [req.params.id]);
    if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    if (gameResult.rows[0].host_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const result = await pool.query(
      `SELECT gr.id, gr.status, gr.created_at, gr.player_id,
         u.display_name, u.avatar_seed, u.skill_level
       FROM game_requests gr JOIN users u ON gr.player_id = u.id
       WHERE gr.game_id = $1 ORDER BY gr.created_at ASC`,
      [req.params.id]
    );

    res.json({ requests: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/games/:id/requests/:requestId (approve / decline)
router.put('/:id/requests/:requestId', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or declined' });
  }

  try {
    const gameResult = await pool.query('SELECT host_id, max_players FROM games WHERE id = $1', [req.params.id]);
    if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    if (gameResult.rows[0].host_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    if (status === 'approved') {
      const countResult = await pool.query(
        "SELECT COUNT(*)::int as cnt FROM game_requests WHERE game_id = $1 AND status = 'approved'",
        [req.params.id]
      );
      if (countResult.rows[0].cnt >= gameResult.rows[0].max_players) {
        return res.status(400).json({ error: 'Game is already full' });
      }
    }

    const result = await pool.query(
      'UPDATE game_requests SET status = $1 WHERE id = $2 AND game_id = $3 RETURNING *',
      [status, req.params.requestId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

    if (status === 'approved') {
      await pool.query('UPDATE users SET games_played = games_played + 1 WHERE id = $1', [result.rows[0].player_id]);
      const countResult = await pool.query(
        "SELECT COUNT(*)::int as cnt FROM game_requests WHERE game_id = $1 AND status = 'approved'",
        [req.params.id]
      );
      if (countResult.rows[0].cnt >= gameResult.rows[0].max_players) {
        await pool.query("UPDATE games SET status = 'full' WHERE id = $1", [req.params.id]);
      }
    }

    res.json({ request: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/games/:id/complete
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT host_id FROM games WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    if (result.rows[0].host_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await pool.query("UPDATE games SET status = 'completed' WHERE id = $1", [req.params.id]);
    res.json({ message: 'Game marked as completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
