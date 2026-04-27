const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
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

// Trust the first proxy (nginx in prod) so rate-limiter sees real client IPs.
// Only enabled in production — in dev there is no proxy and trusting X-Forwarded-For
// would allow rate-limit bypass via IP spoofing.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // served via nginx which sets its own; API-only server
}));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '64kb' })); // cap request body size
app.use(cookieParser());

app.set('io', io);

// Apply write limiter to all mutating requests across every route
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

// Strict limiter only on credential endpoints, not on /me or /logout
app.post('/api/auth/login', authLimiter);
app.post('/api/auth/signup', authLimiter);
app.use('/api/auth', generalLimiter, authRoutes);
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
