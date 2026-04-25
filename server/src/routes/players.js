const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, display_name, sports, skill_level, home_beach, avatar_seed, games_hosted, games_played FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ player: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me', authenticate, async (req, res) => {
  const { display_name, home_beach, sports, skill_level, avatar_seed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET
        display_name = COALESCE($1, display_name),
        home_beach = COALESCE($2, home_beach),
        sports = COALESCE($3, sports),
        skill_level = COALESCE($4, skill_level),
        avatar_seed = COALESCE($5, avatar_seed)
       WHERE id = $6
       RETURNING id, email, display_name, sports, skill_level, home_beach, avatar_seed, games_hosted, games_played`,
      [display_name || null, home_beach || null, sports || null, skill_level || null, avatar_seed || null, req.user.id]
    );
    res.json({ player: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, display_name, sports, skill_level, home_beach, avatar_seed, games_hosted, games_played FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Player not found' });
    res.json({ player: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
