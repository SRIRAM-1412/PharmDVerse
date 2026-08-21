import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectDrugKnowledgeMaster() {
  await client.connect();
  console.log('=== INSPECTING public.drug_knowledge TABLE IN SUPABASE ===\n');

  try {
    // 1. Column definitions
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'drug_knowledge'
      ORDER BY ordinal_position;
    `);
    console.log('--- COLUMNS ---');
    cols.rows.forEach(c => console.log(`- ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));

    // 2. Count of records
    const count = await client.query(`SELECT COUNT(*) FROM public.drug_knowledge;`);
    console.log(`\n--- TOTAL DRUG RECORDS: ${count.rows[0].count} ---`);

    // 3. Check for duplicates in generic_name
    const dups = await client.query(`
      SELECT LOWER(generic_name) as lower_generic, COUNT(*)
      FROM public.drug_knowledge
      GROUP BY LOWER(generic_name)
      HAVING COUNT(*) > 1;
    `);
    console.log(`\n--- DUPLICATE GENERIC NAMES: ${dups.rows.length} ---`);
    dups.rows.forEach(d => console.log(`- "${d.lower_generic}": ${d.count} occurrences`));

    // 4. RLS Policies
    const rls = await client.query(`
      SELECT tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'drug_knowledge';
    `);
    console.log('\n--- RLS POLICIES ---');
    rls.rows.forEach(p => console.log(`- Policy: ${p.policyname} | Cmd: ${p.cmd} | Roles: ${p.roles}`));

  } catch (err) {
    console.error('Error inspecting drug_knowledge:', err);
  } finally {
    await client.end();
  }
}

inspectDrugKnowledgeMaster();
