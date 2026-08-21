import { supabase } from '../src/lib/supabaseClient.js';

async function checkPlatformSettingsTable() {
  console.log('Checking public.platform_settings in Supabase...');
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1);

    if (error) {
      console.log('QueryResult error (table may not exist yet or empty):', error.message);
    } else {
      console.log('QueryResult data:', data);
    }
  } catch (err) {
    console.error('Exception checking table:', err.message);
  }
}

checkPlatformSettingsTable();
