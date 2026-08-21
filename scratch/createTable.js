import { supabase } from '../src/lib/supabaseClient.js';

async function createPlatformSettingsTable() {
  console.log('Attempting to create platform_settings table...');
  const sql = `
    CREATE TABLE IF NOT EXISTS public.platform_settings (
      id INT PRIMARY KEY DEFAULT 1,
      platform_name TEXT NOT NULL DEFAULT 'PharmDVerse ERP',
      tagline TEXT DEFAULT 'India''s Premier Clinical Pharmacy Case Analysis & ERP Platform',
      logo_url TEXT DEFAULT '/pharmdverse-logo.png',
      favicon_url TEXT DEFAULT '/pharmdverse-logo.png',
      support_email TEXT DEFAULT 'support@pharmdverse.org',
      footer_text TEXT DEFAULT '© 2026 PharmDVerse. All rights reserved. India''s Premier Clinical Pharmacy Case Analysis & ERP Platform.',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_by TEXT
    );
    ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on platform_settings') THEN
        CREATE POLICY "Allow public select on platform_settings" ON public.platform_settings FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow super admin write on platform_settings') THEN
        CREATE POLICY "Allow super admin write on platform_settings" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
    INSERT INTO public.platform_settings (id, platform_name, tagline, logo_url, favicon_url, support_email, footer_text)
    VALUES (1, 'PharmDVerse ERP', 'India''s Premier Clinical Pharmacy Case Analysis & ERP Platform', '/pharmdverse-logo.png', '/pharmdverse-logo.png', 'support@pharmdverse.org', '© 2026 PharmDVerse. All rights reserved. India''s Premier Clinical Pharmacy Case Analysis & ERP Platform.')
    ON CONFLICT (id) DO NOTHING;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log('RPC exec_sql error:', error.message);
    } else {
      console.log('RPC exec_sql success:', data);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

createPlatformSettingsTable();
