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

    // Gear contributions
    const gearResult = await pool.query(
      `SELECT gg.item, gg.player_id, u.display_name, u.avatar_seed
       FROM game_gear gg JOIN users u ON u.id = gg.player_id
       WHERE gg.game_id = $1 ORDER BY gg.created_at`,
      [req.params.id]
    );
    game.gear = gearResult.rows;

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
  if (notes && notes.length > 500) {
    return res.status(400).json({ error: 'Notes must be 500 characters or fewer' });
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

// DELETE /api/games/:id/leave — approved player opts out of a game
router.delete('/:id/leave', authenticate, async (req, res) => {
  try {
    const game = await pool.query('SELECT status FROM games WHERE id = $1', [req.params.id]);
    if (!game.rows.length) return res.status(404).json({ error: 'Game not found' });
    if (['cancelled', 'completed'].includes(game.rows[0].status)) {
      return res.status(400).json({ error: 'Cannot leave a finished or cancelled game' });
    }

    // Confirm player is approved (not host)
    const reqRow = await pool.query(
      "SELECT id FROM game_requests WHERE game_id = $1 AND player_id = $2 AND status = 'approved'",
      [req.params.id, req.user.id]
    );
    if (!reqRow.rows.length) return res.status(400).json({ error: 'You are not an approved player in this game' });

    // Remove from game
    await pool.query('DELETE FROM game_requests WHERE game_id = $1 AND player_id = $2', [req.params.id, req.user.id]);
    await pool.query('UPDATE users SET games_played = GREATEST(games_played - 1, 0) WHERE id = $1', [req.user.id]);
    await pool.query('DELETE FROM game_gear WHERE game_id = $1 AND player_id = $2', [req.params.id, req.user.id]);

    // If game was full, reopen it
    if (game.rows[0].status === 'full') {
      await pool.query("UPDATE games SET status = 'open' WHERE id = $1", [req.params.id]);
    }

    // Post system message to chat
    const userRow = await pool.query('SELECT display_name FROM users WHERE id = $1', [req.user.id]);
    const name = userRow.rows[0]?.display_name || 'A player';
    const { rows: [msg] } = await pool.query(
      `INSERT INTO chat_messages (game_id, sender_id, message, is_system)
       VALUES ($1, NULL, $2, TRUE) RETURNING id, message, is_system, created_at`,
      [req.params.id, `${name} has withdrawn from the game.`]
    );

    // Emit via Socket.io so connected players see it immediately
    req.app.get('io')?.to(`game:${req.params.id}`).emit('new_message', {
      ...msg,
      sender_name: 'Operator',
      sender_avatar: null,
      sender_id: null,
    });

    res.json({ message: 'Left game', system_message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/games/:id/gear — declare you'll bring an item
router.post('/:id/gear', authenticate, async (req, res) => {
  const { item } = req.body;
  const VALID = ['ball', 'lines', 'speaker', 'hose'];
  if (!VALID.includes(item)) return res.status(400).json({ error: 'Invalid gear item' });

  try {
    // Must be host or approved player
    const access = await pool.query(
      `SELECT 1 FROM games WHERE id = $1 AND host_id = $2
       UNION
       SELECT 1 FROM game_requests WHERE game_id = $1 AND player_id = $2 AND status = 'approved'`,
      [req.params.id, req.user.id]
    );
    if (!access.rows.length) return res.status(403).json({ error: 'Not part of this game' });

    await pool.query(
      'INSERT INTO game_gear (game_id, player_id, item) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id, item]
    );
    res.status(201).json({ message: 'Gear added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/games/:id/gear/:item — remove your declared gear
router.delete('/:id/gear/:item', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM game_gear WHERE game_id = $1 AND player_id = $2 AND item = $3',
      [req.params.id, req.user.id, req.params.item]
    );
    res.json({ message: 'Gear removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/games/:id/my-ratings — returns who the current user has already rated in this game
router.get('/:id/my-ratings', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT rated_id, stars, updated_at FROM ratings WHERE game_id = $1 AND rater_id = $2',
      [req.params.id, req.user.id]
    );
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    res.json({
      stars_map:  Object.fromEntries(result.rows.map(r => [r.rated_id, r.stars])),
      locked_ids: result.rows.filter(r => new Date(r.updated_at).getTime() < cutoff).map(r => r.rated_id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/games/:id/rate
router.post('/:id/rate', authenticate, async (req, res) => {
  const { rated_id, stars } = req.body;
  if (!rated_id || !stars || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'rated_id and stars (1-5 integer) are required' });
  }
  if (rated_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot rate yourself' });
  }

  try {
    const game = await pool.query(
      "SELECT status, game_date FROM games WHERE id = $1",
      [req.params.id]
    );
    if (!game.rows.length) return res.status(404).json({ error: 'Game not found' });

    const { status, game_date } = game.rows[0];
    if (status !== 'completed') {
      return res.status(400).json({ error: 'Game is not completed yet' });
    }

    const daysSince = (Date.now() - new Date(game_date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) {
      return res.status(400).json({ error: 'Rating window has closed (7 days after game)' });
    }

    // Verify rater was in the game (host or approved player)
    const participation = await pool.query(
      `SELECT 1 FROM games WHERE id = $1 AND host_id = $2
       UNION
       SELECT 1 FROM game_requests WHERE game_id = $1 AND player_id = $2 AND status = 'approved'`,
      [req.params.id, req.user.id]
    );
    if (!participation.rows.length) {
      return res.status(403).json({ error: 'You were not part of this game' });
    }

    // Verify rated_id was also in the game
    const ratedParticipation = await pool.query(
      `SELECT 1 FROM games WHERE id = $1 AND host_id = $2
       UNION
       SELECT 1 FROM game_requests WHERE game_id = $1 AND player_id = $2 AND status = 'approved'`,
      [req.params.id, rated_id]
    );
    if (!ratedParticipation.rows.length) {
      return res.status(400).json({ error: 'Rated player was not part of this game' });
    }

    // If a rating already exists, block the update if it was last changed > 7 days ago
    const existing = await pool.query(
      'SELECT updated_at FROM ratings WHERE game_id = $1 AND rater_id = $2 AND rated_id = $3',
      [req.params.id, req.user.id, rated_id]
    );
    if (existing.rows.length) {
      const daysSinceUpdate = (Date.now() - new Date(existing.rows[0].updated_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 7) {
        return res.status(403).json({ error: 'Rating can no longer be changed (7-day window passed)' });
      }
    }

    await pool.query(
      `INSERT INTO ratings (game_id, rater_id, rated_id, stars) VALUES ($1,$2,$3,$4)
       ON CONFLICT (game_id, rater_id, rated_id) DO UPDATE SET stars = EXCLUDED.stars, updated_at = NOW()`,
      [req.params.id, req.user.id, rated_id, stars]
    );

    res.status(201).json({ message: 'Rating submitted' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Already rated this player for this game' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
