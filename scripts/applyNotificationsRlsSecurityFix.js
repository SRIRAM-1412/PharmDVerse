import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function applyRlsFix() {
  await client.connect();
  console.log('=== APPLYING TARGETED RLS SECURITY FIX TO public.notifications ===\n');

  try {
    // 1. Drop existing open policy
    await client.query(`DROP POLICY IF EXISTS "Allow All notifications" ON public.notifications;`);
    await client.query(`DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;`);
    await client.query(`DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;`);
    await client.query(`DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;`);

    // Ensure RLS is enabled
    await client.query(`ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`);

    // 2. Create SELECT Policy
    await client.query(`
      CREATE POLICY "notifications_select_policy" ON public.notifications
      FOR SELECT
      TO public
      USING (
        (recipient_user_id = auth.uid()) OR
        ((recipient_user_id)::text = ((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-student-id'::text)) OR
        ((recipient_user_id)::text = ((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-preceptor-id'::text)) OR
        (((recipient_user_id)::text = ((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-college-id'::text)) AND (recipient_role = 'College Admin')) OR
        (((college_id)::text = ((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-college-id'::text)) AND (recipient_role = 'College Admin')) OR
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);

    // 3. Create UPDATE Policy (For marking as read & archiving)
    await client.query(`
      CREATE POLICY "notifications_update_policy" ON public.notifications
      FOR UPDATE
      TO public
      USING (
        (recipient_user_id = auth.uid()) OR
        ((recipient_user_id)::text = ((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-student-id'::text)) OR
        ((recipient_user_id)::text = ((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-preceptor-id'::text)) OR
        (((recipient_user_id)::text = ((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-college-id'::text)) AND (recipient_role = 'College Admin')) OR
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);

    // 4. Create INSERT Policy (Allows workflow system to create notifications for recipients)
    await client.query(`
      CREATE POLICY "notifications_insert_policy" ON public.notifications
      FOR INSERT
      TO public
      WITH CHECK (
        true
      );
    `);

    console.log('Successfully applied SELECT, UPDATE, and INSERT policies to public.notifications.');

  } catch (err) {
    console.error('Error applying RLS fix:', err);
  } finally {
    await client.end();
  }
}

applyRlsFix();
