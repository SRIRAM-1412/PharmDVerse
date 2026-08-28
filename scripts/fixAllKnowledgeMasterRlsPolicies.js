import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function fixKnowledgeRlsPolicies() {
  console.log('=== FIXING RLS POLICIES FOR KNOWLEDGE MASTER TABLES ===\n');
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tables = [
    'drug_food_interaction_knowledge',
    'drug_drug_interaction_knowledge',
    'drug_knowledge',
    'lab_parameter_knowledge',
    'other_investigation_knowledge'
  ];

  try {
    for (const table of tables) {
      console.log(`Updating RLS policies for public.${table}...`);
      await client.query(`
        ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS ${table}_select_policy ON public.${table};
        DROP POLICY IF EXISTS ${table}_write_policy ON public.${table};
        DROP POLICY IF EXISTS dfi_knowledge_select_policy ON public.${table};
        DROP POLICY IF EXISTS dfi_knowledge_write_policy ON public.${table};
        DROP POLICY IF EXISTS ddi_knowledge_select_policy ON public.${table};
        DROP POLICY IF EXISTS ddi_knowledge_write_policy ON public.${table};
        DROP POLICY IF EXISTS "Allow all for ${table}" ON public.${table};
        DROP POLICY IF EXISTS "Allow read for ${table}" ON public.${table};
        DROP POLICY IF EXISTS "Allow write for ${table}" ON public.${table};

        CREATE POLICY "Allow select for ${table}" ON public.${table}
          FOR SELECT TO public USING (true);

        CREATE POLICY "Allow all for ${table}" ON public.${table}
          FOR ALL TO public USING (true) WITH CHECK (true);
      `);
      console.log(`✓ RLS policies updated for ${table}`);
    }
    console.log('\n=== SUCCESS: ALL KNOWLEDGE MASTER RLS POLICIES UPDATED ===');
  } catch (err) {
    console.error('Error updating RLS policies:', err);
  } finally {
    await client.end();
  }
}

fixKnowledgeRlsPolicies();
