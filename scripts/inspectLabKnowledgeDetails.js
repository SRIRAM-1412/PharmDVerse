import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectLabDetails() {
  await client.connect();
  console.log('=== INSPECTING public.lab_parameter_knowledge POLICIES & EVALUATION TYPES ===\n');

  try {
    // 1. Categories
    const catRes = await client.query('SELECT DISTINCT category FROM public.lab_parameter_knowledge ORDER BY category;');
    console.log('--- DISTINCT CATEGORIES (10) ---');
    catRes.rows.forEach(r => console.log(`• ${r.category}`));

    // 2. Evaluation Types
    const evalRes = await client.query('SELECT DISTINCT evaluation_type FROM public.lab_parameter_knowledge ORDER BY evaluation_type;');
    console.log('\n--- DISTINCT EVALUATION TYPES ---');
    evalRes.rows.forEach(r => console.log(`• ${r.evaluation_type}`));

    // 3. RLS Policies
    const rlsRes = await client.query("SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE tablename = 'lab_parameter_knowledge';");
    console.log('\n--- RLS POLICIES ---');
    rlsRes.rows.forEach(p => console.log(`• Policy: "${p.policyname}" | Cmd: ${p.cmd} | Roles: {${p.roles}} | Qual: ${p.qual} | WithCheck: ${p.with_check}`));

  } catch (err) {
    console.error('Error inspecting lab details:', err);
  } finally {
    await client.end();
  }
}

inspectLabDetails();
