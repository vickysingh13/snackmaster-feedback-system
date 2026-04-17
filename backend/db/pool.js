const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL is missing from .env file!");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Set to false for local dev
  max: 20,
});

pool.on('error', (err) => {
  console.error('❌ Database Pool Error:', err.message);
});

module.exports = pool;