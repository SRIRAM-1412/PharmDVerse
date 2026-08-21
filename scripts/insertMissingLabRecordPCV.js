import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function insertPCV() {
  await client.connect();

  const query = `
    INSERT INTO public.lab_parameter_knowledge (
      parameter_name, normalized_name, category, evaluation_type,
      increased_significance, decreased_significance, context_notes,
      source_reference, is_active, created_at, updated_at
    ) VALUES (
      'PCV',
      'pcv',
      'Haematology',
      'numeric',
      'Polycythaemia, dehydration/haemoconcentration, chronic hypoxic lung disease, erythrocytosis.',
      'Anaemia, acute or chronic blood loss, haemolysis, bone marrow suppression, overhydration.',
      'Packed Cell Volume (Haematocrit). Interpret together with Hb and RBC count.',
      'Harsh Mohan Pathology; Davidson Principles and Practice of Medicine',
      true,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING RETURNING *;
  `;

  const res = await client.query(query);
  console.log('Inserted PCV Master Record:', res.rows);
  await client.end();
}

insertPCV();
