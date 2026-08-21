import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function insertParacetamol() {
  await client.connect();

  const insertSQL = `
    INSERT INTO public.drug_knowledge (
      generic_name, brand_names, drug_class, established_uses,
      mechanism_of_action, normal_dose_range, contraindications,
      side_effects_adverse_effects, monitoring_parameters, updated_at
    ) VALUES (
      'Paracetamol',
      'Dolo, Crocin, Calpol, Pacimol, Sumo, Tylenol',
      'Analgesic / Antipyretic (Additional: Non-opioid analgesic)',
      'Mild to moderate pain relief; fever reduction (pyrexia).',
      'Central inhibition of cyclooxygenase (COX-3/COX-1/COX-2 variants) and activation of descending serotonergic pathways.',
      'Oral: 500–1000 mg every 4–6 hours as needed; maximum 4000 mg/day in adults.',
      'Severe active hepatic impairment or severe acute liver disease; known hypersensitivity to paracetamol.',
      'Nausea, rash, hypersensitivity reactions, elevated hepatic transaminases (with high doses or chronic use).',
      'Liver function tests (ALT, AST, bilirubin) in chronic high-dose therapy or overdose; daily cumulative dose monitoring.',
      NOW()
    ) ON CONFLICT DO NOTHING RETURNING *;
  `;

  const res = await client.query(insertSQL);
  console.log('Inserted Paracetamol:', res.rows);
  await client.end();
}

insertParacetamol();
