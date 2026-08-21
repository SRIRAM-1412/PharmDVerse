import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectNotificationsTable() {
  await client.connect();
  console.log('=== INSPECTING public.notifications SCHEMA & DATA ===\n');

  try {
    // 1. Column details
    const colsRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications'
      ORDER BY ordinal_position;
    `);

    console.log('--- COLUMNS ---');
    colsRes.rows.forEach(c => console.log(`• ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable}, default: ${c.column_default})`));

    // 2. PK
    const pkRes = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = 'notifications';
    `);
    console.log('\n--- PRIMARY KEY ---');
    console.log(pkRes.rows.map(r => r.column_name).join(', '));

    // 3. FKs
    const fkRes = await client.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' AND tc.table_name = 'notifications';
    `);
    console.log('\n--- FOREIGN KEYS ---');
    fkRes.rows.forEach(f => console.log(`• ${f.column_name} -> ${f.foreign_table_name}(${f.foreign_column_name})`));

    // 4. Indexes
    const idxRes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'notifications';
    `);
    console.log('\n--- INDEXES ---');
    idxRes.rows.forEach(i => console.log(`• ${i.indexname}: ${i.indexdef}`));

    // 5. RLS Policies
    const rlsRes = await client.query(`
      SELECT policyname, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE tablename = 'notifications';
    `);
    console.log('\n--- RLS POLICIES ---');
    if (rlsRes.rows.length === 0) console.log('None');
    else rlsRes.rows.forEach(p => console.log(`• Policy: "${p.policyname}" | Cmd: ${p.cmd} | Roles: {${p.roles}} | Qual: ${p.qual} | WithCheck: ${p.with_check}`));

    // 6. Record Count
    const countRes = await client.query(`SELECT count(*) FROM public.notifications;`);
    console.log(`\nTOTAL RECORDS IN public.notifications: ${countRes.rows[0].count}`);

  } catch (err) {
    console.error('Error inspecting notifications table:', err);
  } finally {
    await client.end();
  }
}

inspectNotificationsTable();
