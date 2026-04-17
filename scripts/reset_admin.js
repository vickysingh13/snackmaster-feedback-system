#!/usr/bin/env node
/**
 * SnackMaster — Admin Password Reset Script
 * 
 * Usage:
 *   node scripts/reset_admin.js
 * 
 * Or with env vars:
 *   ADMIN_EMAIL=admin@snackmaster.io ADMIN_PASSWORD=NewPass@123 node scripts/reset_admin.js
 */

require('dotenv').config({ path: '../backend/.env' });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log('\n🍿 SnackMaster — Admin Password Reset\n');

  try {
    const email = process.env.ADMIN_EMAIL || await ask('Admin email: ');
    const password = process.env.ADMIN_PASSWORD || await ask('New password: ');

    if (!email || !password) {
      console.error('❌ Email and password are required');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);

    const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE admin_users SET password_hash = $1 WHERE email = $2',
        [hash, email]
      );
      console.log(`\n✅ Password updated for ${email}`);
    } else {
      await pool.query(
        'INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3)',
        [email, hash, 'SnackMaster Admin']
      );
      console.log(`\n✅ Admin user created: ${email}`);
    }

    console.log('   You can now log in at /admin/login\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    rl.close();
    await pool.end();
    process.exit(0);
  }
}

main();
