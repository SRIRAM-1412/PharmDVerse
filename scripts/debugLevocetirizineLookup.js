import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function debugLevocetirizine() {
  await client.connect();

  console.log('=== DEBUGGING LEVOCETIRIZINE DB LOOKUP ===\n');

  // 1. Exact match ilike 'levocetirizine'
  const r1 = await client.query("SELECT id, generic_name, brand_names FROM public.drug_knowledge WHERE generic_name ILIKE 'levocetirizine'");
  console.log('1. ILIKE levocetirizine:', r1.rows);

  // 2. Substring match ilike '%levocetirizine%'
  const r2 = await client.query("SELECT id, generic_name, brand_names FROM public.drug_knowledge WHERE generic_name ILIKE '%levocetirizine%'");
  console.log('2. ILIKE %levocetirizine%:', r2.rows);

  // 3. Search for any generic name starting with levoceti
  const r3 = await client.query("SELECT id, generic_name, brand_names FROM public.drug_knowledge WHERE generic_name ILIKE '%levoceti%'");
  console.log('3. ILIKE %levoceti%:', r3.rows);

  await client.end();
}

debugLevocetirizine();
