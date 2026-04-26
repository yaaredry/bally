require('dotenv').config();
const pool = require('../src/config/db');

const LOCATIONS = [
  // ── Tel Aviv ────────────────────────────────────────────────────────────────
  { city: 'Tel Aviv', name: 'North Tsuk Beach (Mandarin)',  lat: 32.1932, lng: 34.7998 },
  { city: 'Tel Aviv', name: 'South Tsuk Beach (Sea & Sun)', lat: 32.1856, lng: 34.7968 },
  { city: 'Tel Aviv', name: 'Tel Baruch Beach',             lat: 32.1326, lng: 34.7662 },
  { city: 'Tel Aviv', name: 'Mezitzim Beach',               lat: 32.0997, lng: 34.7655 },
  { city: 'Tel Aviv', name: 'The Religious Beach',          lat: 32.0961, lng: 34.7650 },
  { city: 'Tel Aviv', name: 'Hilton Beach',                 lat: 32.0934, lng: 34.7644 },
  { city: 'Tel Aviv', name: 'Gordon Beach',                 lat: 32.0861, lng: 34.7669 },
  { city: 'Tel Aviv', name: 'Frischmann Beach',             lat: 32.0848, lng: 34.7671 },
  { city: 'Tel Aviv', name: 'Trumpeldor Beach',             lat: 32.0835, lng: 34.7665 },
  { city: 'Tel Aviv', name: 'Bograshov Beach',              lat: 32.0812, lng: 34.7661 },
  { city: 'Tel Aviv', name: 'Jerusalem Beach (Geula)',      lat: 32.0772, lng: 34.7653 },
  { city: 'Tel Aviv', name: 'Charles Clore Beach',          lat: 32.0743, lng: 34.7637 },
  { city: 'Tel Aviv', name: 'Aviv Beach',                   lat: 32.0706, lng: 34.7624 },
  { city: 'Tel Aviv', name: "Ha'Maravi Beach (Manta Ray)",  lat: 32.0675, lng: 34.7606 },

  // ── Herzliya ────────────────────────────────────────────────────────────────
  { city: 'Herzliya', name: 'Acadia Beach',                 lat: 32.1650, lng: 34.7985 },
  { city: 'Herzliya', name: 'HaSharon Beach',               lat: 32.1590, lng: 34.7962 },

  // ── Haifa ────────────────────────────────────────────────────────────────────
  { city: 'Haifa', name: "Hof HaCarmel (Dado South)",       lat: 32.7631, lng: 34.9595 },
  { city: 'Haifa', name: 'Dado Beach',                      lat: 32.7892, lng: 34.9742 },
  { city: 'Haifa', name: 'Zamir Beach',                     lat: 32.7960, lng: 34.9790 },
  { city: 'Haifa', name: 'Bat Galim Beach',                 lat: 32.8264, lng: 35.0017 },
  { city: 'Haifa', name: 'Kiryat Haim Beach',               lat: 32.8372, lng: 35.0751 },
];

async function seedLocations() {
  try {
    let inserted = 0;
    for (const loc of LOCATIONS) {
      const result = await pool.query(
        `INSERT INTO locations (name, city, lat, lng)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING`,
        [loc.name, loc.city, loc.lat, loc.lng]
      );
      if (result.rowCount > 0) inserted++;
    }
    console.log(`Locations: ${inserted} inserted, ${LOCATIONS.length - inserted} already existed.`);
  } catch (err) {
    console.error('Failed to seed locations:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedLocations();
