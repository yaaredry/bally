require('dotenv').config();
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

const AVATAR_SEEDS = [
  'beach-ace', 'surfer-wave', 'spike-king', 'sand-setter',
  'dig-master', 'block-hero', 'serve-ace', 'rally-queen',
  'volley-star', 'beach-pro', 'foot-wizard', 'court-legend',
];

// Beach Volleyball uses numeric levels 1-7 (1=lowest)
// Footvolley uses letter levels E-A + League (E=lowest, League=highest)
const USERS = [
  { email: 'alex@bally.app',  name: 'Alex Chen',      sports: ['Beach Volleyball'],              skill: '5',      beach: 'Gordon Beach',    avatar: AVATAR_SEEDS[0] },
  { email: 'maya@bally.app',  name: 'Maya Levi',      sports: ['Beach Volleyball', 'Footvolley'], skill: '7',      beach: 'Frishman Beach',  avatar: AVATAR_SEEDS[1] },
  { email: 'tom@bally.app',   name: 'Tom Katz',       sports: ['Footvolley'],                    skill: 'B',      beach: 'Hilton Beach',    avatar: AVATAR_SEEDS[2] },
  { email: 'sara@bally.app',  name: 'Sara Mizrahi',   sports: ['Beach Volleyball'],              skill: '2',      beach: 'Gordon Beach',    avatar: AVATAR_SEEDS[3] },
  { email: 'yoni@bally.app',  name: 'Yoni Bar',       sports: ['Beach Volleyball', 'Footvolley'], skill: '6',      beach: 'Tel Baruch',      avatar: AVATAR_SEEDS[4] },
  { email: 'dana@bally.app',  name: 'Dana Shapiro',   sports: ['Beach Volleyball'],              skill: '4',      beach: 'Jerusalem Beach', avatar: AVATAR_SEEDS[5] },
  { email: 'ido@bally.app',   name: 'Ido Oren',       sports: ['Footvolley'],                    skill: 'League', beach: 'Hilton Beach',    avatar: AVATAR_SEEDS[6] },
  { email: 'noa@bally.app',   name: 'Noa Peretz',     sports: ['Beach Volleyball'],              skill: '3',      beach: 'Gordon Beach',    avatar: AVATAR_SEEDS[7] },
  { email: 'eyal@bally.app',  name: 'Eyal Cohen',     sports: ['Beach Volleyball', 'Footvolley'], skill: '5',      beach: 'Frishman Beach',  avatar: AVATAR_SEEDS[8] },
  { email: 'rina@bally.app',  name: 'Rina Goldberg',  sports: ['Footvolley'],                    skill: 'E',      beach: 'Bat Yam Beach',   avatar: AVATAR_SEEDS[9] },
];

// Admin user — password: chino1234!
const ADMIN = {
  email: 'admin@bally.app',
  name: 'Admin',
  avatar: AVATAR_SEEDS[0],
};

// Curated beaches grouped by city, roughly north to south within each city
const LOCATIONS = [
  // ── Tel Aviv ────────────────────────────────────────────────────────────────
  { city: 'Tel Aviv', name: 'North Tsuk Beach (Mandarin)',  lat: 32.1932, lng: 34.7998 },
  { city: 'Tel Aviv', name: 'South Tsuk Beach (Sea & Sun)', lat: 32.1856, lng: 34.7968 },
  { city: 'Tel Aviv', name: 'Tel Baruch Beach',             lat: 32.1328, lng: 34.7637 },
  { city: 'Tel Aviv', name: 'Mezitzim Beach',               lat: 32.1000, lng: 34.7628 },
  { city: 'Tel Aviv', name: 'The Religious Beach',          lat: 32.0965, lng: 34.7623 },
  { city: 'Tel Aviv', name: 'Hilton Beach',                 lat: 32.0938, lng: 34.7621 },
  { city: 'Tel Aviv', name: 'Gordon Beach',                 lat: 32.0869, lng: 34.7624 },
  { city: 'Tel Aviv', name: 'Frischmann Beach',             lat: 32.0853, lng: 34.7618 },
  { city: 'Tel Aviv', name: 'Trumpeldor Beach',             lat: 32.0838, lng: 34.7616 },
  { city: 'Tel Aviv', name: 'Bograshov Beach',              lat: 32.0817, lng: 34.7613 },
  { city: 'Tel Aviv', name: 'Jerusalem Beach (Geula)',      lat: 32.0780, lng: 34.7607 },
  { city: 'Tel Aviv', name: 'Charles Clore Beach',          lat: 32.0748, lng: 34.7597 },
  { city: 'Tel Aviv', name: 'Aviv Beach',                   lat: 32.0718, lng: 34.7587 },
  { city: 'Tel Aviv', name: "Ha'Maravi Beach (Manta Ray)",  lat: 32.0682, lng: 34.7572 },

  // ── Herzliya ────────────────────────────────────────────────────────────────
  { city: 'Herzliya', name: 'Acadia Beach',                 lat: 32.1650, lng: 34.7985 },
  { city: 'Herzliya', name: 'HaSharon Beach',               lat: 32.1590, lng: 34.7962 },

  // ── Haifa ────────────────────────────────────────────────────────────────────
  // Sources: municipality maps & OpenStreetMap; ordered south to north along Haifa bay
  { city: 'Haifa', name: "Hof HaCarmel (Dado South)",       lat: 32.7631, lng: 34.9595 },
  { city: 'Haifa', name: 'Dado Beach',                      lat: 32.7892, lng: 34.9742 },
  { city: 'Haifa', name: 'Zamir Beach',                     lat: 32.7960, lng: 34.9790 },
  { city: 'Haifa', name: 'Bat Galim Beach',                 lat: 32.8264, lng: 35.0017 },
  { city: 'Haifa', name: 'Kiryat Haim Beach',               lat: 32.8372, lng: 35.0751 },
];

const FORMATS = ['2v2', '3v3', '4v4'];
const SPORTS = ['Beach Volleyball', 'Footvolley'];
const SKILLS = ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'All welcome'];
const NOTES = ['Bring your own ball', 'Beginners welcome!', 'Competitive game, come ready', null];

async function seed() {
  try {
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM chat_messages');
    await pool.query('DELETE FROM game_requests');
    await pool.query('DELETE FROM games');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM locations');
    console.log('Cleared existing data');

    // Seed locations
    for (const loc of LOCATIONS) {
      await pool.query(
        'INSERT INTO locations (name, city, lat, lng) VALUES ($1,$2,$3,$4)',
        [loc.name, loc.city, loc.lat, loc.lng]
      );
    }
    console.log(`Inserted ${LOCATIONS.length} locations`);

    const hash = await bcrypt.hash('password123', 12);
    const adminHash = await bcrypt.hash('chino1234!', 12);
    const userIds = [];

    // Seed regular users
    for (const u of USERS) {
      const r = await pool.query(
        `INSERT INTO users (email, password_hash, display_name, home_beach, sports, skill_level, avatar_seed)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [u.email, hash, u.name, u.beach, u.sports, u.skill, u.avatar]
      );
      userIds.push(r.rows[0].id);
    }

    // Seed admin user
    await pool.query(
      `INSERT INTO users (email, password_hash, display_name, avatar_seed, is_admin)
       VALUES ($1,$2,$3,$4,TRUE)`,
      [ADMIN.email, adminHash, ADMIN.name, ADMIN.avatar]
    );
    console.log(`Inserted ${userIds.length} users + 1 admin`);

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

      // Games in the past (daysOffset < 0) that are recent enough for ratings get status 'completed'
      const isPast = daysOffset < 0;
      const status = isPast ? 'completed' : 'open';

      const r = await pool.query(
        `INSERT INTO games (host_id, sport, format, skill_level, game_date, duration_hours, location_name, location, max_players, notes, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7, ST_SetSRID(ST_MakePoint($8,$9), 4326), $10,$11,$12) RETURNING id`,
        [userIds[hostIdx], sport, format, skill, gameDate.toISOString(), [1, 1.5, 2, 2.5][i % 4], loc.name, loc.lng, loc.lat, maxPlayers, NOTES[i % 4], status]
      );
      gameIds.push({ id: r.rows[0].id, isPast, hostIdx });
    }
    console.log(`Inserted ${gameIds.length} games`);

    const requestMap = {}; // gameId -> [playerIds approved]
    for (let i = 0; i < gameIds.length; i++) {
      const { id: gameId, hostIdx } = gameIds[i];
      requestMap[gameId] = [userIds[hostIdx]]; // host is always in the game
      const requestCount = 1 + (i % 3);
      for (let j = 1; j <= requestCount; j++) {
        const playerIdx = (hostIdx + j) % userIds.length;
        const status = j === 1 ? 'approved' : j === 2 ? 'pending' : 'approved';
        try {
          await pool.query(
            'INSERT INTO game_requests (game_id, player_id, status) VALUES ($1,$2,$3)',
            [gameId, userIds[playerIdx], status]
          );
          if (status === 'approved') requestMap[gameId].push(userIds[playerIdx]);
        } catch {
          // skip duplicates
        }
      }
    }

    // Seed sample ratings for completed games
    let ratingsInserted = 0;
    for (const { id: gameId, isPast } of gameIds) {
      if (!isPast) continue;
      const players = requestMap[gameId];
      if (players.length < 2) continue;
      // Each player rates the next player (circular, skip self)
      for (let i = 0; i < players.length; i++) {
        const rater = players[i];
        const rated = players[(i + 1) % players.length];
        if (rater === rated) continue;
        const stars = 3 + (ratingsInserted % 3); // 3, 4, or 5 stars
        try {
          await pool.query(
            'INSERT INTO ratings (game_id, rater_id, rated_id, stars) VALUES ($1,$2,$3,$4)',
            [gameId, rater, rated, stars]
          );
          ratingsInserted++;
        } catch {
          // skip duplicates
        }
      }
    }
    console.log(`Inserted ${ratingsInserted} ratings`);

    await pool.query(`UPDATE users u SET games_hosted = (SELECT COUNT(*) FROM games WHERE host_id = u.id AND status != 'cancelled')`);
    await pool.query(`UPDATE users u SET games_played = (SELECT COUNT(*) FROM game_requests WHERE player_id = u.id AND status = 'approved')`);

    console.log('\nSeed complete!');
    console.log('Player login: alex@bally.app / password123 (any seeded user)');
    console.log('Admin login:  admin@bally.app / chino1234!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
