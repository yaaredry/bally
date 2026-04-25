require('dotenv').config();
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

const AVATAR_SEEDS = [
  'beach-ace', 'surfer-wave', 'spike-king', 'sand-setter',
  'dig-master', 'block-hero', 'serve-ace', 'rally-queen',
  'volley-star', 'beach-pro', 'foot-wizard', 'court-legend',
];

const USERS = [
  { email: 'alex@bally.app',  name: 'Alex Chen',      sports: ['Beach Volleyball'],              skill: 'Advanced',     beach: 'Gordon Beach',    avatar: AVATAR_SEEDS[0] },
  { email: 'maya@bally.app',  name: 'Maya Levi',      sports: ['Beach Volleyball', 'Footvolley'], skill: 'Elite',        beach: 'Frishman Beach',  avatar: AVATAR_SEEDS[1] },
  { email: 'tom@bally.app',   name: 'Tom Katz',       sports: ['Footvolley'],                    skill: 'Intermediate', beach: 'Hilton Beach',    avatar: AVATAR_SEEDS[2] },
  { email: 'sara@bally.app',  name: 'Sara Mizrahi',   sports: ['Beach Volleyball'],              skill: 'Beginner',     beach: 'Gordon Beach',    avatar: AVATAR_SEEDS[3] },
  { email: 'yoni@bally.app',  name: 'Yoni Bar',       sports: ['Beach Volleyball', 'Footvolley'], skill: 'Advanced',     beach: 'Tel Baruch',      avatar: AVATAR_SEEDS[4] },
  { email: 'dana@bally.app',  name: 'Dana Shapiro',   sports: ['Beach Volleyball'],              skill: 'Intermediate', beach: 'Jerusalem Beach', avatar: AVATAR_SEEDS[5] },
  { email: 'ido@bally.app',   name: 'Ido Oren',       sports: ['Footvolley'],                    skill: 'Elite',        beach: 'Hilton Beach',    avatar: AVATAR_SEEDS[6] },
  { email: 'noa@bally.app',   name: 'Noa Peretz',     sports: ['Beach Volleyball'],              skill: 'Intermediate', beach: 'Gordon Beach',    avatar: AVATAR_SEEDS[7] },
  { email: 'eyal@bally.app',  name: 'Eyal Cohen',     sports: ['Beach Volleyball', 'Footvolley'], skill: 'Advanced',     beach: 'Frishman Beach',  avatar: AVATAR_SEEDS[8] },
  { email: 'rina@bally.app',  name: 'Rina Goldberg',  sports: ['Footvolley'],                    skill: 'Beginner',     beach: 'Bat Yam Beach',   avatar: AVATAR_SEEDS[9] },
];

const LOCATIONS = [
  { name: 'Gordon Beach',      lat: 32.0853, lng: 34.7618 },
  { name: 'Frishman Beach',    lat: 32.0869, lng: 34.7624 },
  { name: 'Jerusalem Beach',   lat: 32.0924, lng: 34.7629 },
  { name: 'Hilton Beach',      lat: 32.0938, lng: 34.7621 },
  { name: 'Tel Baruch Beach',  lat: 32.1328, lng: 34.7637 },
  { name: 'Bat Yam Beach',     lat: 32.0172, lng: 34.7503 },
  { name: 'Herzliya Beach',    lat: 32.1640, lng: 34.7980 },
];

const FORMATS = ['2v2', '3v3', '4v4'];
const SPORTS = ['Beach Volleyball', 'Footvolley'];
const SKILLS = ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'All welcome'];
const NOTES = ['Bring your own ball', 'Beginners welcome!', 'Competitive game, come ready', null];

async function seed() {
  try {
    await pool.query('DELETE FROM chat_messages');
    await pool.query('DELETE FROM game_requests');
    await pool.query('DELETE FROM games');
    await pool.query('DELETE FROM users');
    console.log('Cleared existing data');

    const hash = await bcrypt.hash('password123', 12);
    const userIds = [];

    for (const u of USERS) {
      const r = await pool.query(
        `INSERT INTO users (email, password_hash, display_name, home_beach, sports, skill_level, avatar_seed)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [u.email, hash, u.name, u.beach, u.sports, u.skill, u.avatar]
      );
      userIds.push(r.rows[0].id);
    }
    console.log(`Inserted ${userIds.length} users`);

    const now = new Date();
    const gameIds = [];

    for (let i = 0; i < 20; i++) {
      const hostIdx = i % userIds.length;
      const loc = LOCATIONS[i % LOCATIONS.length];
      const sport = SPORTS[i % SPORTS.length];
      const format = FORMATS[i % FORMATS.length];
      const skill = SKILLS[i % SKILLS.length];
      const maxPlayers = format === '2v2' ? 4 : format === '3v3' ? 6 : 8;
      const daysOffset = i < 14 ? i + 1 : -(i - 13);
      const hours = 8 + (i % 9);

      const gameDate = new Date(now);
      gameDate.setDate(gameDate.getDate() + daysOffset);
      gameDate.setHours(hours, 0, 0, 0);

      const r = await pool.query(
        `INSERT INTO games (host_id, sport, format, skill_level, game_date, duration_hours, location_name, location, max_players, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7, ST_SetSRID(ST_MakePoint($8,$9), 4326), $10,$11) RETURNING id`,
        [userIds[hostIdx], sport, format, skill, gameDate.toISOString(), [1, 1.5, 2, 2.5][i % 4], loc.name, loc.lng, loc.lat, maxPlayers, NOTES[i % 4]]
      );
      gameIds.push(r.rows[0].id);
    }
    console.log(`Inserted ${gameIds.length} games`);

    for (let i = 0; i < gameIds.length; i++) {
      const hostIdx = i % userIds.length;
      const requestCount = 1 + (i % 3);
      for (let j = 1; j <= requestCount; j++) {
        const playerIdx = (hostIdx + j) % userIds.length;
        const status = j === 1 ? 'approved' : j === 2 ? 'pending' : 'approved';
        try {
          await pool.query(
            'INSERT INTO game_requests (game_id, player_id, status) VALUES ($1,$2,$3)',
            [gameIds[i], userIds[playerIdx], status]
          );
        } catch {
          // skip duplicates
        }
      }
    }

    await pool.query(`UPDATE users u SET games_hosted = (SELECT COUNT(*) FROM games WHERE host_id = u.id AND status != 'cancelled')`);
    await pool.query(`UPDATE users u SET games_played = (SELECT COUNT(*) FROM game_requests WHERE player_id = u.id AND status = 'approved')`);

    console.log('\nSeed complete!');
    console.log('Login with any user above, password: password123');
    console.log('Example: alex@bally.app / password123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
