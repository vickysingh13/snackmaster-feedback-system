const { Pool } = require('pg');
require('dotenv').config();

// Try multiple connection strings
const connectionConfigs = [
  // Unix socket (local)
  {
    host: '/tmp',
    port: 5432,
    database: 'snackmaster',
    user: 'postgres',
    ssl: false
  },
  // localhost with no password (trust auth)
  {
    host: 'localhost',
    port: 5432,
    database: 'snackmaster',
    user: 'postgres',
    password: '',
    ssl: false
  },
  // localhost with standard password
  {
    host: 'localhost',
    port: 5432,
    database: 'snackmaster',
    user: 'postgres',
    password: 'postgres',
    ssl: false
  },
  // 127.0.0.1
  {
    host: '127.0.0.1',
    port: 5432,
    database: 'snackmaster',
    user: 'postgres',
    password: 'postgres',
    ssl: false
  }
];

const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateData() {
  let localPool = null;
  let connected = false;

  // Try to connect to local database
  for (const config of connectionConfigs) {
    try {
      console.log(`🔄 Trying connection with host: ${config.host}`);
      localPool = new Pool(config);
      await localPool.query('SELECT 1');
      console.log('✅ Connected to local database\n');
      connected = true;
      break;
    } catch (err) {
      if (localPool) await localPool.end();
      continue;
    }
  }

  if (!connected) {
    console.error('❌ Could not connect to local database with any configuration');
    console.error('Please verify PostgreSQL is running and credentials are correct');
    process.exit(1);
  }

  try {
    console.log('🔄 Starting migration from local to Neon...\n');

    // Migrate machines
    console.log('⏳ Migrating machines...');
    const machinesRes = await localPool.query('SELECT * FROM machines');
    console.log(`   Found ${machinesRes.rows.length} machines in local database`);

    for (const machine of machinesRes.rows) {
      await neonPool.query(
        `INSERT INTO machines (id, machine_code, location, area, status, created_at, name, qr_code_url, deleted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           machine_code = EXCLUDED.machine_code,
           location = EXCLUDED.location,
           area = EXCLUDED.area,
           status = EXCLUDED.status,
           name = EXCLUDED.name,
           qr_code_url = EXCLUDED.qr_code_url,
           deleted_at = EXCLUDED.deleted_at`,
        [machine.id, machine.machine_code, machine.location, machine.area, machine.status, machine.created_at, machine.name, machine.qr_code_url, machine.deleted_at]
      );
    }
    console.log(`✓ Migrated ${machinesRes.rows.length} machines\n`);

    // Migrate form_configs
    console.log('⏳ Migrating form_configs...');
    const formsRes = await localPool.query('SELECT * FROM form_configs');
    console.log(`   Found ${formsRes.rows.length} form configs in local database`);

    for (const form of formsRes.rows) {
      await neonPool.query(
        `INSERT INTO form_configs (id, type, label, is_enabled, fields, display_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           type = EXCLUDED.type,
           label = EXCLUDED.label,
           is_enabled = EXCLUDED.is_enabled,
           fields = EXCLUDED.fields,
           display_order = EXCLUDED.display_order`,
        [form.id, form.type, form.label, form.is_enabled, form.fields, form.display_order, form.updated_at]
      );
    }
    console.log(`✓ Migrated ${formsRes.rows.length} form_configs\n`);

    // Migrate submissions
    console.log('⏳ Migrating submissions...');
    const submissionsRes = await localPool.query('SELECT * FROM submissions');
    console.log(`   Found ${submissionsRes.rows.length} submissions in local database`);

    for (const submission of submissionsRes.rows) {
      await neonPool.query(
        `INSERT INTO submissions (id, machine_id, type, data, status, whatsapp_status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           machine_id = EXCLUDED.machine_id,
           type = EXCLUDED.type,
           data = EXCLUDED.data,
           status = EXCLUDED.status,
           whatsapp_status = EXCLUDED.whatsapp_status,
           notes = EXCLUDED.notes`,
        [submission.id, submission.machine_id, submission.type, submission.data, submission.status, submission.whatsapp_status, submission.notes, submission.created_at, submission.updated_at]
      );
    }
    console.log(`✓ Migrated ${submissionsRes.rows.length} submissions\n`);

    // Migrate admin_users
    console.log('⏳ Migrating admin_users...');
    const adminsRes = await localPool.query('SELECT * FROM admin_users');
    console.log(`   Found ${adminsRes.rows.length} admin users in local database`);

    for (const admin of adminsRes.rows) {
      await neonPool.query(
        `INSERT INTO admin_users (id, email, password_hash, name, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name`,
        [admin.id, admin.email, admin.password_hash, admin.name, admin.created_at]
      );
    }
    console.log(`✓ Migrated ${adminsRes.rows.length} admin_users\n`);

    // Verify data in Neon
    console.log('📊 Verifying data in Neon database:\n');
    const neonMachines = await neonPool.query('SELECT COUNT(*) FROM machines');
    const neonForms = await neonPool.query('SELECT COUNT(*) FROM form_configs');
    const neonSubmissions = await neonPool.query('SELECT COUNT(*) FROM submissions');
    const neonAdmins = await neonPool.query('SELECT COUNT(*) FROM admin_users');

    console.log('✅ Migration complete!\n');
    console.log('📋 Data Summary:');
    console.log(`  • Machines: ${neonMachines.rows[0].count}`);
    console.log(`  • Form Configs: ${neonForms.rows[0].count}`);
    console.log(`  • Submissions: ${neonSubmissions.rows[0].count}`);
    console.log(`  • Admin Users: ${neonAdmins.rows[0].count}`);

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
