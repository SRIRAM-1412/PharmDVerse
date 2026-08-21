import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function insertGeneral() {
  await client.connect();

  const query = `
    INSERT INTO public.lab_parameter_knowledge (
      parameter_name, normalized_name, category, evaluation_type,
      increased_significance, decreased_significance, context_notes,
      source_reference, is_active, created_at, updated_at
    ) VALUES (
      'General Parameter',
      'general_parameter',
      'General',
      'numeric',
      'Elevated general laboratory parameter.',
      'Decreased general laboratory parameter.',
      'General or uncategorized clinical laboratory measurement.',
      'Standard Laboratory Guidelines',
      true,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING RETURNING *;
  `;

  const res = await client.query(query);
  console.log('Inserted General Parameter Master Record:', res.rows);
  await client.end();
}

insertGeneral();
