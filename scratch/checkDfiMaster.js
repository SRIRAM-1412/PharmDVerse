import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
} catch (e) {}

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { headers: { 'x-super-admin': 'true' } }
});

async function check() {
  const { data, error } = await supabase.from('drug_food_interaction_knowledge').select('*');
  console.log('DFI records in database:', data);
}

check();
