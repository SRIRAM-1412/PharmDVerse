import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const CANDIDATES = [
  { name: 'PCV', category: 'Haematology', evalType: 'numeric' },
  { name: 'CT — Clotting Time', category: 'Coagulation', evalType: 'numeric' },
  { name: 'BT — Bleeding Time', category: 'Coagulation', evalType: 'numeric' },
  { name: 'Urine Specific Gravity', category: 'Urinalysis', evalType: 'numeric' },
  { name: 'Urine pH', category: 'Urinalysis', evalType: 'numeric' },
  { name: 'Urine Transparency', category: 'Urinalysis', evalType: 'present_absent' },
  { name: 'Urine Crystals', category: 'Urinalysis', evalType: 'present_absent' }
];

async function checkMissing() {
  await client.connect();
  console.log('=== CHECKING GENUINELY MISSING LAB MASTER KNOWLEDGE RECORDS ===\n');

  const allRes = await client.query('SELECT parameter_name, normalized_name, category, evaluation_type FROM public.lab_parameter_knowledge');
  const allRows = allRes.rows;

  const missingToInsert = [];

  for (const c of CANDIDATES) {
    const found = allRows.find(r => 
      r.parameter_name.toLowerCase() === c.name.toLowerCase() ||
      r.normalized_name.toLowerCase() === c.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    );
    if (found) {
      console.log(`[EXISTS IN DB] "${c.name}" -> Category: "${found.category}", EvalType: "${found.evaluation_type}"`);
    } else {
      console.log(`[GENUINELY MISSING] "${c.name}" -> NEEDS INSERTION into public.lab_parameter_knowledge`);
      missingToInsert.push(c);
    }
  }

  console.log(`\nTOTAL GENUINELY MISSING RECORDS TO INSERT: ${missingToInsert.length}`);
  await client.end();
}

checkMissing();
