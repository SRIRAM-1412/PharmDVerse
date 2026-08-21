import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function setupRls() {
  await client.connect();
  console.log('=== SETTING UP RLS POLICIES FOR public.drug_knowledge ===\n');

  try {
    // Enable RLS on drug_knowledge
    await client.query(`ALTER TABLE public.drug_knowledge ENABLE ROW LEVEL SECURITY;`);

    // Create policy for INSERT/UPDATE/ALL if not already existing
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drug_knowledge' AND policyname = 'Allow write access for drug_knowledge') THEN
          CREATE POLICY "Allow write access for drug_knowledge" ON public.drug_knowledge
          FOR ALL
          TO public
          USING (true)
          WITH CHECK (true);
        END IF;
      END
      $$;
    `);
    console.log('✓ RLS write policy verified/created for public.drug_knowledge.');
  } catch (err) {
    console.error('Error setting up RLS:', err);
  } finally {
    await client.end();
  }
}

setupRls();
