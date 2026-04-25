const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function setupChat(io) {
  io.use((socket, next) => {
    const cookie = socket.handshake.headers.cookie || '';
    const match = cookie.match(/token=([^;]+)/);
    const token = match ? match[1] : socket.handshake.auth.token;

    if (!token) return next(new Error('Authentication required'));

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_game_room', async ({ gameId }) => {
      try {
        const hostResult = await pool.query('SELECT host_id FROM games WHERE id = $1', [gameId]);
        const approvedResult = await pool.query(
          "SELECT 1 FROM game_requests WHERE game_id = $1 AND player_id = $2 AND status = 'approved'",
          [gameId, socket.user.id]
        );

        const isHost = hostResult.rows[0]?.host_id === socket.user.id;
        const isApproved = approvedResult.rows.length > 0;

        if (isHost || isApproved) {
          socket.join(`game:${gameId}`);
          socket.emit('joined_room', { gameId });
        } else {
          socket.emit('chat_error', { message: 'Not authorized' });
        }
      } catch {
        socket.emit('chat_error', { message: 'Server error' });
      }
    });

    socket.on('send_message', async ({ gameId, message }) => {
      if (!message?.trim()) return;

      try {
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(`game:${gameId}`)) {
          socket.emit('chat_error', { message: 'Not in this game room' });
          return;
        }

        const result = await pool.query(
          `INSERT INTO chat_messages (game_id, sender_id, message)
           VALUES ($1, $2, $3) RETURNING id, game_id, message, created_at, sender_id`,
          [gameId, socket.user.id, message.trim()]
        );

        const userResult = await pool.query(
          'SELECT display_name, avatar_seed FROM users WHERE id = $1',
          [socket.user.id]
        );

        io.to(`game:${gameId}`).emit('new_message', {
          ...result.rows[0],
          sender_name: userResult.rows[0].display_name,
          sender_avatar: userResult.rows[0].avatar_seed,
        });
      } catch {
        socket.emit('chat_error', { message: 'Failed to send message' });
      }
    });
  });
}

module.exports = setupChat;
