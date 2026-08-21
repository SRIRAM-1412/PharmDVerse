import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectFullDatabase() {
  await client.connect();
  console.log('=== INSPECTING COMPLETE SUPABASE DATABASE ARCHITECTURE ===\n');

  try {
    // 1. All Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`FOUND ${tables.length} PUBLIC TABLES IN SUPABASE:`);
    tables.forEach(t => console.log(` - ${t}`));

    console.log('\n============================================================');
    console.log('TABLE-BY-TABLE SCHEMA & RLS AUDIT');
    console.log('============================================================\n');

    for (const tableName of tables) {
      // Row count
      const countRes = await client.query(`SELECT COUNT(*) FROM public."${tableName}"`);
      const count = countRes.rows[0].count;

      // Columns
      const colsRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      // PKs
      const pkRes = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
      `, [tableName]);
      const pks = pkRes.rows.map(r => r.column_name).join(', ');

      // FKs
      const fkRes = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
      `, [tableName]);

      // RLS
      const rlsRes = await client.query(`
        SELECT policyname, cmd, roles, qual, with_check
        FROM pg_policies
        WHERE tablename = $1;
      `, [tableName]);

      console.log(`### TABLE: public."${tableName}" (Row Count: ${count})`);
      console.log(` - Primary Key: ${pks || 'NONE'}`);
      console.log(' - Columns:');
      colsRes.rows.forEach(c => console.log(`    • ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
      if (fkRes.rows.length > 0) {
        console.log(' - Foreign Keys:');
        fkRes.rows.forEach(f => console.log(`    • ${f.column_name} -> ${f.foreign_table_name}(${f.foreign_column_name})`));
      }
      console.log(' - RLS Policies:');
      if (rlsRes.rows.length === 0) console.log('    • NONE (RLS disabled or no policies defined)');
      else rlsRes.rows.forEach(p => console.log(`    • Policy: "${p.policyname}" | Cmd: ${p.cmd} | Roles: {${p.roles}}`));
      console.log('');
    }

  } catch (err) {
    console.error('Error inspecting database:', err);
  } finally {
    await client.end();
  }
}

inspectFullDatabase();
