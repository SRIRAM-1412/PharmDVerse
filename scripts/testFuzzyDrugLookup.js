import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function testFuzzyLookup() {
  await client.connect();
  console.log('=== TESTING FUZZY INGREDIENT LOOKUPS ===\n');

  const testCases = [
    'Hydrochlorthiazide',
    'hydrochlorthiazide',
    'HYDROCHLORTHIAZIDE',
    'Levocetirizine',
    'levocetrizine',
    'Telmisartan',
    'telimisartan',
    'Amikacin'
  ];

  for (const term of testCases) {
    const clean = term.toLowerCase().trim();
    
    // 1. Exact
    let res = await client.query("SELECT generic_name FROM public.drug_knowledge WHERE generic_name ILIKE $1", [clean]);
    if (res.rows.length === 0) {
      // 2. Substring
      res = await client.query("SELECT generic_name FROM public.drug_knowledge WHERE generic_name ILIKE $1", [`%${clean}%`]);
    }
    if (res.rows.length === 0) {
      // 3. Prefix Fuzzy
      let prefix = clean;
      if (clean.includes('hydrochlor') || clean.includes('hydrochlort')) prefix = 'hydrochlor%';
      else if (clean.includes('levocet') || clean.includes('levoceti')) prefix = 'levocet%';
      else if (clean.includes('telm') || clean.includes('telim')) prefix = 'telm%';

      if (prefix !== clean) {
        res = await client.query("SELECT generic_name FROM public.drug_knowledge WHERE generic_name ILIKE $1", [prefix]);
      }
    }

    console.log(`Query "${term}" -> Match: ${res.rows[0]?.generic_name || 'NOT FOUND'}`);
  }

  await client.end();
}

testFuzzyLookup();
