import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function applyLabRls() {
  await client.connect();
  console.log('=== APPLYING SECURE RLS POLICIES TO public.lab_parameter_knowledge ===\n');

  try {
    await client.query(`DROP POLICY IF EXISTS "Allow Write Access for Super Admin" ON public.lab_parameter_knowledge;`);
    await client.query(`DROP POLICY IF EXISTS "lab_parameter_knowledge_write_policy" ON public.lab_parameter_knowledge;`);

    // Add Write Policy for Super Admin
    await client.query(`
      CREATE POLICY "lab_parameter_knowledge_write_policy" ON public.lab_parameter_knowledge
      FOR ALL
      TO public
      USING (
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      )
      WITH CHECK (
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);

    console.log('Successfully applied Super Admin write policy to public.lab_parameter_knowledge.');

  } catch (err) {
    console.error('Error applying lab knowledge RLS:', err);
  } finally {
    await client.end();
  }
}

applyLabRls();
