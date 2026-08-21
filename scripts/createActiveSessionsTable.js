import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function setupActiveSessionsTable() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    // 1. Create public.active_sessions table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.active_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        user_role TEXT NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        login_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    await client.query(createTableSQL);
    console.log('✓ public.active_sessions table verified/created.');

    // 2. Create Partial Unique Index for ONE active session per (user_role, user_id)
    const createIndexSQL = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_session
      ON public.active_sessions (user_role, user_id)
      WHERE (is_active = true);
    `;
    await client.query(createIndexSQL);
    console.log('✓ Partial unique index (user_role, user_id WHERE is_active = true) verified/created.');

    // 3. Enable RLS on active_sessions
    await client.query(`ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;`);
    console.log('✓ RLS enabled on public.active_sessions.');

    // 4. Create RLS Policies allowing anon/authenticated read/insert/update without auth.uid()
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_sessions' AND policyname = 'Allow public session operations') THEN
          CREATE POLICY "Allow public session operations" ON public.active_sessions
          FOR ALL
          TO public
          USING (true)
          WITH CHECK (true);
        END IF;
      END
      $$;
    `);
    console.log('✓ RLS policy verified/created for public.active_sessions.');

    console.log('\n=== DATABASE SETUP COMPLETE ===');
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await client.end();
  }
}

setupActiveSessionsTable();
