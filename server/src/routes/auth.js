const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

router.post('/signup', async (req, res) => {
  const { email, password, display_name, sports, skill_level, home_beach, avatar_seed } = req.body;

  if (!email || !password || !display_name) {
    return res.status(400).json({ error: 'Email, password, and display name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (display_name.length > 50) {
    return res.status(400).json({ error: 'Display name must be 50 characters or fewer' });
  }
  if (email.length > 254) {
    return res.status(400).json({ error: 'Email address is too long' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, sports, skill_level, home_beach, avatar_seed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, display_name, sports, skill_level, home_beach, avatar_seed, games_hosted, games_played`,
      [email.toLowerCase(), password_hash, display_name, sports || [], skill_level || null, home_beach || null, avatar_seed || 'beach-ace']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, cookieOpts());
    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, display_name, sports, skill_level, home_beach, avatar_seed, games_hosted, games_played, is_active, is_admin FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account suspended. Please contact support.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...safeUser } = user;

    res.cookie('token', token, cookieOpts());
    res.json({ user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOpts());
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, display_name, sports, skill_level, home_beach, avatar_seed, games_hosted, games_played, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
