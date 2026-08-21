import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectRlsPatterns() {
  await client.connect();
  console.log('=== INSPECTING EXISTING RLS POLICIES ACROSS ALL TABLES ===\n');

  try {
    const res = await client.query(`
      SELECT tablename, policyname, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    console.log(`FOUND ${res.rows.length} POLICIES:`);
    res.rows.forEach(p => {
      console.log(`Table: public."${p.tablename}" | Policy: "${p.policyname}" | Cmd: ${p.cmd}`);
      console.log(`  Qual: ${p.qual}`);
      if (p.with_check) console.log(`  WithCheck: ${p.with_check}`);
      console.log('');
    });

  } catch (err) {
    console.error('Error inspecting RLS policies:', err);
  } finally {
    await client.end();
  }
}

inspectRlsPatterns();
