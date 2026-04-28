const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function mergeData() {
  try {
    console.log('🔄 Starting data merge from backup.sql into Neon...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'backup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Extract data between COPY statements
    const copyPattern = /COPY public\.(\w+).*?FROM stdin;\n([\s\S]*?)\\\.\n/g;
    let match;
    const tables = {};

    while ((match = copyPattern.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const dataLines = match[2].trim().split('\n');
      tables[tableName] = dataLines;
    }

    console.log('📋 Tables found in backup:');
    Object.entries(tables).forEach(([name, lines]) => {
      console.log(`  • ${name}: ${lines.length} rows`);
    });
    console.log();

    // Get table columns from Neon schema
    const columnsQuery = `
      SELECT table_name, column_name, ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    const columnsRes = await neonPool.query(columnsQuery);
    const columns = {};
    columnsRes.rows.forEach(row => {
      if (!columns[row.table_name]) columns[row.table_name] = [];
      columns[row.table_name].push(row.column_name);
    });

    // Merge admin_users
    if (tables.admin_users) {
      console.log('⏳ Merging admin_users...');
      for (const line of tables.admin_users) {
        const parts = line.split('\t');
        if (parts.length >= 4) {
          const [id, email, password_hash, name_part, created_at_part] = parts;
          // Handle name with potential tabs
          const remaining = line.substring(
            line.indexOf(password_hash) + password_hash.length + 1
          ).split('\t');
          const name = remaining[0];
          const created_at = remaining[1];

          await neonPool.query(
            `INSERT INTO admin_users (id, email, password_hash, name, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
               email = EXCLUDED.email,
               password_hash = EXCLUDED.password_hash,
               name = EXCLUDED.name`,
            [id, email, password_hash, name, created_at]
          );
        }
      }
      console.log(`✓ Merged ${tables.admin_users.length} admin users\n`);
    }

    // Merge form_configs
    if (tables.form_configs) {
      console.log('⏳ Merging form_configs...');
      for (const line of tables.form_configs) {
        const parts = line.split('\t');
        if (parts.length >= 6) {
          const id = parts[0];
          const type = parts[1];
          const label = parts[2];
          const is_enabled = parts[3] === 't';
          const fields = parts[4];
          const display_order = parts[5];
          const updated_at = parts[6];

          await neonPool.query(
            `INSERT INTO form_configs (id, type, label, is_enabled, fields, display_order, updated_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               type = EXCLUDED.type,
               label = EXCLUDED.label,
               is_enabled = EXCLUDED.is_enabled,
               fields = EXCLUDED.fields,
               display_order = EXCLUDED.display_order`,
            [id, type, label, is_enabled, fields, display_order, updated_at]
          );
        }
      }
      console.log(`✓ Merged ${tables.form_configs.length} form configs\n`);
    }

    // Merge machines
    if (tables.machines) {
      console.log('⏳ Merging machines...');
      for (const line of tables.machines) {
        const parts = line.split('\t');
        if (parts.length >= 5) {
          const id = parts[0];
          const machine_code = parts[1];
          const location = parts[2];
          const area = parts[3];
          const status = parts[4];
          const created_at = parts[5];
          const name = parts[6] === '\\N' ? null : parts[6];
          const qr_code_url = parts[7] === '\\N' ? null : parts[7];
          const deleted_at = parts[8] === '\\N' ? null : parts[8];

          await neonPool.query(
            `INSERT INTO machines (id, machine_code, location, area, status, created_at, name, qr_code_url, deleted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               machine_code = EXCLUDED.machine_code,
               location = EXCLUDED.location,
               area = EXCLUDED.area,
               status = EXCLUDED.status,
               name = EXCLUDED.name,
               qr_code_url = EXCLUDED.qr_code_url`,
            [id, machine_code, location, area, status, created_at, name, qr_code_url, deleted_at]
          );
        }
      }
      console.log(`✓ Merged ${tables.machines.length} machines\n`);
    }

    // Merge submissions
    if (tables.submissions) {
      console.log('⏳ Merging submissions...');
      for (const line of tables.submissions) {
        const parts = line.split('\t');
        if (parts.length >= 5) {
          const id = parts[0];
          const machine_id = parts[1] === '\\N' ? null : parseInt(parts[1]);
          const type = parts[2];
          const data = parts[3];
          const status = parts[4];
          const whatsapp_status = parts[5] || 'not_contacted';
          const notes = parts[6] === '\\N' ? null : parts[6];
          const created_at = parts[7];
          const updated_at = parts[8];

          await neonPool.query(
            `INSERT INTO submissions (id, machine_id, type, data, status, whatsapp_status, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               machine_id = EXCLUDED.machine_id,
               type = EXCLUDED.type,
               data = EXCLUDED.data,
               status = EXCLUDED.status,
               whatsapp_status = EXCLUDED.whatsapp_status,
               notes = EXCLUDED.notes`,
            [id, machine_id, type, data, status, whatsapp_status, notes, created_at, updated_at]
          );
        }
      }
      console.log(`✓ Merged ${tables.submissions.length} submissions\n`);
    }

    // Merge weekly_config if exists
    if (tables.weekly_config) {
      console.log('⏳ Merging weekly_config...');
      for (const line of tables.weekly_config) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          const id = parts[0];
          const title = parts[1];
          const start_date = parts[2] === '\\N' ? null : parts[2];
          const end_date = parts[3] === '\\N' ? null : parts[3];
          const is_active = (parts[4] || 't') === 't';
          const created_at = parts[5];
          const updated_at = parts[6];

          await neonPool.query(
            `INSERT INTO weekly_config (id, title, start_date, end_date, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               start_date = EXCLUDED.start_date,
               end_date = EXCLUDED.end_date,
               is_active = EXCLUDED.is_active`,
            [id, title, start_date, end_date, is_active, created_at, updated_at]
          );
        }
      }
      console.log(`✓ Merged ${tables.weekly_config.length} weekly configs\n`);
    }

    // Verify counts
    console.log('📊 Verifying data in Neon database:\n');
    const counts = await Promise.all([
      neonPool.query('SELECT COUNT(*) FROM machines'),
      neonPool.query('SELECT COUNT(*) FROM form_configs'),
      neonPool.query('SELECT COUNT(*) FROM submissions'),
      neonPool.query('SELECT COUNT(*) FROM admin_users'),
      neonPool.query('SELECT COUNT(*) FROM weekly_config')
    ]);

    console.log('✅ Data merge complete!\n');
    console.log('📋 Final Data Summary (Neon):');
    console.log(`  • Machines: ${counts[0].rows[0].count}`);
    console.log(`  • Form Configs: ${counts[1].rows[0].count}`);
    console.log(`  • Submissions: ${counts[2].rows[0].count}`);
    console.log(`  • Admin Users: ${counts[3].rows[0].count}`);
    console.log(`  • Weekly Configs: ${counts[4].rows[0].count}`);

  } catch (err) {
    console.error('❌ Merge error:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await neonPool.end();
    process.exit(0);
  }
}

mergeData();
