const { Client } = require('pg');

const oldConnectionString = 'postgresql://postgres.uvvzhrvrqtqwyhlptvnx:kNJuN5IIKtogQWKT@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function inspect() {
  const client = new Client({ connectionString: oldConnectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // 1. Get all tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('--- TABLES IN PUBLIC SCHEMA ---');
    for (const row of tablesRes.rows) {
      const table = row.table_name;
      const countRes = await client.query(`SELECT COUNT(*) FROM public."${table}"`);
      console.log(`Table: ${table} | Rows: ${countRes.rows[0].count}`);
    }

    // 2. Get ENUM types
    const enumRes = await client.query(`
      SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname;
    `);
    console.log('\n--- ENUM TYPES ---');
    console.log(enumRes.rows);

    // 3. Get custom RPC functions in public schema
    const funcRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `);
    console.log('\n--- CUSTOM FUNCTIONS ---');
    console.log(funcRes.rows.map(r => r.routine_name));

  } finally {
    await client.end();
  }
}

inspect().catch(err => console.error(err));
