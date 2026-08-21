import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function createTableAndRls() {
  await client.connect();
  console.log('=== CREATING public.patient_other_investigations TABLE & RLS ===\n');

  try {
    // 1. Create Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.patient_other_investigations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_profile_id uuid NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
        investigation_knowledge_id uuid REFERENCES public.other_investigation_knowledge(id) ON DELETE SET NULL,
        investigation_name text NOT NULL,
        test_date date,
        finding_result text NOT NULL,
        remarks text,
        created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `);
    console.log('Table public.patient_other_investigations created/verified successfully.');

    // 2. Create Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_patient_other_inv_profile_id ON public.patient_other_investigations (patient_profile_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_patient_other_inv_know_id ON public.patient_other_investigations (investigation_knowledge_id);`);
    console.log('Indexes idx_patient_other_inv_profile_id and idx_patient_other_inv_know_id created.');

    // 3. RLS Setup
    await client.query(`ALTER TABLE public.patient_other_investigations ENABLE ROW LEVEL SECURITY;`);
    await client.query(`DROP POLICY IF EXISTS "patient_other_inv_select_policy" ON public.patient_other_investigations;`);
    await client.query(`DROP POLICY IF EXISTS "patient_other_inv_insert_policy" ON public.patient_other_investigations;`);
    await client.query(`DROP POLICY IF EXISTS "patient_other_inv_update_policy" ON public.patient_other_investigations;`);
    await client.query(`DROP POLICY IF EXISTS "patient_other_inv_delete_policy" ON public.patient_other_investigations;`);
    await client.query(`DROP POLICY IF EXISTS "Allow All patient_other_investigations" ON public.patient_other_investigations;`);

    // SELECT Policy: Multi-tenant / authorized users
    await client.query(`
      CREATE POLICY "patient_other_inv_select_policy" ON public.patient_other_investigations
      FOR SELECT TO public
      USING (
        (EXISTS (
          SELECT 1 FROM public.patient_profiles p
          WHERE p.id = patient_other_investigations.patient_profile_id
        )) OR
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);

    // INSERT Policy
    await client.query(`
      CREATE POLICY "patient_other_inv_insert_policy" ON public.patient_other_investigations
      FOR INSERT TO public
      WITH CHECK (true);
    `);

    // UPDATE Policy
    await client.query(`
      CREATE POLICY "patient_other_inv_update_policy" ON public.patient_other_investigations
      FOR UPDATE TO public
      USING (
        (EXISTS (
          SELECT 1 FROM public.patient_profiles p
          WHERE p.id = patient_other_investigations.patient_profile_id
        )) OR
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);

    // DELETE Policy
    await client.query(`
      CREATE POLICY "patient_other_inv_delete_policy" ON public.patient_other_investigations
      FOR DELETE TO public
      USING (
        (EXISTS (
          SELECT 1 FROM public.patient_profiles p
          WHERE p.id = patient_other_investigations.patient_profile_id
        )) OR
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);

    console.log('RLS policies successfully applied to public.patient_other_investigations.');

  } catch (err) {
    console.error('Error setting up table and RLS:', err);
  } finally {
    await client.end();
  }
}

createTableAndRls();
