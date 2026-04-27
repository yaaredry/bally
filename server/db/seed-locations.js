require('dotenv').config();
const pool = require('../src/config/db');

// Tel Aviv beaches with individual net/table GPS coordinates.
// net_type: 'volleyball' = beach volleyball / footvolley court
//           'teqball'    = teqball table
const BEACHES = [
  {
    name: 'Mezitzim Beach',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0936100, lng: 34.7710500, net_type: 'volleyball' },
      { lat: 32.0936700, lng: 34.7708300, net_type: 'volleyball' },
      { lat: 32.0937500, lng: 34.7705900, net_type: 'volleyball' },
    ],
  },
  {
    name: 'Hilton Beach',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0897000, lng: 34.7698100, net_type: 'volleyball' },
      { lat: 32.0907000, lng: 34.7699800, net_type: 'volleyball' },
    ],
  },
  {
    name: 'Gordon Beach',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0833300, lng: 34.7679700, net_type: 'volleyball' },
      { lat: 32.0834100, lng: 34.7676800, net_type: 'volleyball' },
      { lat: 32.0835400, lng: 34.7681400, net_type: 'volleyball' },
      { lat: 32.0836800, lng: 34.7678500, net_type: 'volleyball' },
      { lat: 32.0836800, lng: 34.7682700, net_type: 'volleyball' },
      { lat: 32.0837400, lng: 34.7680500, net_type: 'volleyball' },
      { lat: 32.0837900, lng: 34.7678600, net_type: 'volleyball' },
      { lat: 32.0838800, lng: 34.7683400, net_type: 'volleyball' },
      { lat: 32.0839300, lng: 34.7681800, net_type: 'volleyball' },
      { lat: 32.0839800, lng: 34.7680200, net_type: 'volleyball' },
      { lat: 32.0836600, lng: 34.7683000, net_type: 'teqball' },
      { lat: 32.0840500, lng: 34.7684400, net_type: 'teqball' },
      { lat: 32.0841600, lng: 34.7681900, net_type: 'teqball' },
    ],
  },
  {
    name: 'Frischmann Beach',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0815300, lng: 34.7672000, net_type: 'volleyball' },
      { lat: 32.0816600, lng: 34.7672100, net_type: 'volleyball' },
    ],
  },
  {
    name: 'Bograshov Beach',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0783000, lng: 34.7663800, net_type: 'volleyball' },
      { lat: 32.0783800, lng: 34.7661600, net_type: 'volleyball' },
      { lat: 32.0785800, lng: 34.7663900, net_type: 'volleyball' },
      { lat: 32.0786400, lng: 34.7661500, net_type: 'volleyball' },
      { lat: 32.0783900, lng: 34.7664300, net_type: 'teqball' },
      { lat: 32.0791100, lng: 34.7665200, net_type: 'teqball' },
      { lat: 32.0794700, lng: 34.7666100, net_type: 'teqball' },
      { lat: 32.0797300, lng: 34.7667300, net_type: 'teqball' },
    ],
  },
  {
    name: 'Trumpeldor Beach',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0743600, lng: 34.7648000, net_type: 'volleyball' },
      { lat: 32.0745600, lng: 34.7650200, net_type: 'teqball' },
      { lat: 32.0746400, lng: 34.7649900, net_type: 'teqball' },
      { lat: 32.0749100, lng: 34.7647600, net_type: 'teqball' },
      { lat: 32.0748800, lng: 34.7649900, net_type: 'teqball' },
      { lat: 32.0749800, lng: 34.7650600, net_type: 'teqball' },
      { lat: 32.0751200, lng: 34.7651400, net_type: 'teqball' },
      { lat: 32.0761600, lng: 34.7656200, net_type: 'teqball' },
      { lat: 32.0763500, lng: 34.7655900, net_type: 'teqball' },
      { lat: 32.0765000, lng: 34.7655700, net_type: 'teqball' },
      { lat: 32.0769600, lng: 34.7656700, net_type: 'teqball' },
      { lat: 32.0771300, lng: 34.7657200, net_type: 'teqball' },
    ],
  },
  {
    name: 'Jerusalem Beach (Geula)',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0741500, lng: 34.7647700, net_type: 'volleyball' },
      { lat: 32.0743600, lng: 34.7648000, net_type: 'volleyball' },
      { lat: 32.0714200, lng: 34.7637300, net_type: 'volleyball' },
      { lat: 32.0715700, lng: 34.7640200, net_type: 'teqball' },
      { lat: 32.0716900, lng: 34.7639900, net_type: 'teqball' },
      { lat: 32.0719600, lng: 34.7639100, net_type: 'teqball' },
      { lat: 32.0721000, lng: 34.7640400, net_type: 'teqball' },
      { lat: 32.0721300, lng: 34.7638800, net_type: 'teqball' },
    ],
  },
  {
    name: 'Aviv Beach',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0698600, lng: 34.7632200, net_type: 'volleyball' },
    ],
  },
  {
    name: 'Charles Clore Beach',
    city: 'Tel Aviv',
    nets: [
      { lat: 32.0686400, lng: 34.7624700, net_type: 'volleyball' },
      { lat: 32.0685000, lng: 34.7625000, net_type: 'volleyball' },
    ],
  },
];

async function seedLocations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove all Tel Aviv locations and their nets (cascade)
    await client.query("DELETE FROM locations WHERE city = 'Tel Aviv'");

    let beachCount = 0;
    let netCount = 0;

    for (const beach of BEACHES) {
      // Use the first net's coordinates as the representative pin on the location row
      const pin = beach.nets[0];

      const locResult = await client.query(
        `INSERT INTO locations (name, city, lat, lng)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [beach.name, beach.city, pin.lat, pin.lng]
      );
      const locationId = locResult.rows[0].id;
      beachCount++;

      for (let i = 0; i < beach.nets.length; i++) {
        const net = beach.nets[i];
        await client.query(
          `INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [locationId, net.lat, net.lng, net.net_type, i]
        );
        netCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`Locations: ${beachCount} beaches inserted with ${netCount} nets.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to seed locations:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedLocations();
