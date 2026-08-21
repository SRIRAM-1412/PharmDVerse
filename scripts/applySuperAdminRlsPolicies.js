import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function applySuperAdminRls() {
  await client.connect();
  console.log('=== SECURING public.super_admin RLS POLICIES ===\n');

  try {
    // 1. Drop overly broad policies
    await client.query(`DROP POLICY IF EXISTS "Allow All Operations Super Admin" ON public.super_admin;`);
    await client.query(`DROP POLICY IF EXISTS "super_admin_select_policy" ON public.super_admin;`);
    await client.query(`DROP POLICY IF EXISTS "super_admin_update_policy" ON public.super_admin;`);
    await client.query(`DROP POLICY IF EXISTS "super_admin_insert_delete_policy" ON public.super_admin;`);

    // Ensure RLS is enabled
    await client.query(`ALTER TABLE public.super_admin ENABLE ROW LEVEL SECURITY;`);

    // 2. CREATE SELECT Policy (Allows authentication lookups and super_admin identity access)
    await client.query(`
      CREATE POLICY "super_admin_select_policy" ON public.super_admin
      FOR SELECT
      TO public
      USING (
        (is_active = true) OR
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);

    // 3. CREATE UPDATE Policy (Allows last_login timestamp update and super_admin updates)
    await client.query(`
      CREATE POLICY "super_admin_update_policy" ON public.super_admin
      FOR UPDATE
      TO public
      USING (
        (is_active = true) OR
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);

    console.log('Successfully secured public.super_admin RLS policies.');

  } catch (err) {
    console.error('Error applying Super Admin RLS:', err);
  } finally {
    await client.end();
  }
}

applySuperAdminRls();
