require('dotenv/config');
const path = require('path');
// This line forces Node to look in the current folder for .env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const pool = require('./db/pool');
const apiRoutes = require('./routes/api');

const app = express();
// Force it to 5000 to match our frontend config
const PORT = process.env.PORT || 5000; 

app.use(helmet());

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://snackmaster-feedback-system.vercel.app',
  'https://snackmaster-feedback-system-f7o66ytxc-vickysingh13s-projects.vercel.app',
  'https://snackmaster.io',
  'https://www.snackmaster.io'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`❌ Blocked by CORS: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/api', apiRoutes);

async function bootstrapAdmin() {
  try {
    const existing = await pool.query('SELECT id FROM admin_users LIMIT 1');
    if (existing.rows.length === 0) {
      const pass = process.env.ADMIN_PASSWORD || 'SnackMaster@2024';
      const hash = await bcrypt.hash(pass, 10);
      await pool.query(
        'INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3)',
        [process.env.ADMIN_EMAIL || 'admin@snackmaster.io', hash, 'Admin']
      );
      console.log('✅ Admin user created');
    }
  } catch (err) {
    console.error('❌ Database Connection Error:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await bootstrapAdmin();
});