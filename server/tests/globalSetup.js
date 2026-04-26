const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

module.exports = async function globalSetup() {
  require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

  // Apply schema to the test DB (CREATE TABLE IF NOT EXISTS is idempotent)
  const schema = fs.readFileSync(
    path.join(__dirname, '../db/schema.sql'),
    'utf8'
  );
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(schema);
  } finally {
    await pool.end();
  }
};
