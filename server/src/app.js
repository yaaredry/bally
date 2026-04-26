const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const playerRoutes = require('./routes/players');
const adminRoutes = require('./routes/admin');
const setupChat = require('./socket/chat');
const { authLimiter, generalLimiter, writeLimiter } = require('./middleware/rateLimiter');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.set('io', io);

// Apply write limiter to all mutating requests across every route
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/games', generalLimiter, gameRoutes);
app.use('/api/players', generalLimiter, playerRoutes);
app.use('/api/admin', generalLimiter, adminRoutes);
app.use('/api/locations', generalLimiter);

setupChat(io);

const pool = require('./config/db');
app.get('/api/locations', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, city, lat, lng FROM locations WHERE is_active = TRUE ORDER BY city, lat DESC'
    );
    res.json({ locations: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = { app, server, io };
