const { Pool } = require('pg');
require('dotenv').config();

const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'snackmaster',
  user: 'postgres',
  password: 'postgres',
  ssl: false
});

const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateData() {
  try {
    console.log('🔄 Starting migration from local to Neon...\n');

    // Migrate machines
    console.log('⏳ Migrating machines...');
    const machinesRes = await localPool.query('SELECT * FROM machines');
    for (const machine of machinesRes.rows) {
      await neonPool.query(
        `INSERT INTO machines (id, machine_code, location, area, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [machine.id, machine.machine_code, machine.location, machine.area, machine.status, machine.created_at]
      );
    }
    console.log(`✓ Migrated ${machinesRes.rows.length} machines\n`);

    // Migrate form_configs
    console.log('⏳ Migrating form_configs...');
    const formsRes = await localPool.query('SELECT * FROM form_configs');
    for (const form of formsRes.rows) {
      await neonPool.query(
        `INSERT INTO form_configs (id, type, label, is_enabled, fields, display_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [form.id, form.type, form.label, form.is_enabled, form.fields, form.display_order, form.updated_at]
      );
    }
    console.log(`✓ Migrated ${formsRes.rows.length} form_configs\n`);

    // Migrate submissions
    console.log('⏳ Migrating submissions...');
    const submissionsRes = await localPool.query('SELECT * FROM submissions');
    for (const submission of submissionsRes.rows) {
      await neonPool.query(
        `INSERT INTO submissions (id, machine_id, type, data, status, whatsapp_status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [submission.id, submission.machine_id, submission.type, submission.data, submission.status, submission.whatsapp_status, submission.notes, submission.created_at, submission.updated_at]
      );
    }
    console.log(`✓ Migrated ${submissionsRes.rows.length} submissions\n`);

    // Migrate admin_users
    console.log('⏳ Migrating admin_users...');
    const adminsRes = await localPool.query('SELECT * FROM admin_users');
    for (const admin of adminsRes.rows) {
      await neonPool.query(
        `INSERT INTO admin_users (id, email, password_hash, name, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [admin.id, admin.email, admin.password_hash, admin.name, admin.created_at]
      );
    }
    console.log(`✓ Migrated ${adminsRes.rows.length} admin_users\n`);

    console.log('✅ Migration complete!\n');
    console.log('Summary:');
    console.log(`  - Machines: ${machinesRes.rows.length}`);
    console.log(`  - Forms: ${formsRes.rows.length}`);
    console.log(`  - Submissions: ${submissionsRes.rows.length}`);
    console.log(`  - Admins: ${adminsRes.rows.length}`);

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await localPool.end();
    await neonPool.end();
    process.exit(0);
  }
}

migrateData();
