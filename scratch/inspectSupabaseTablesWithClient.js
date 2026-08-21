import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let supabaseUrl = 'https://xkgjcxuhuhduxscplkbg.supabase.co';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
} catch (e) {}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTables() {
  console.log('Testing connection to Supabase...');

  const { data: ddiRows, error: e1 } = await supabase.from('drug_drug_interactions').select('*').limit(5);
  const { data: dfiRows, error: e2 } = await supabase.from('drug_food_interactions').select('*').limit(5);
  const { data: dikRows, error: e3 } = await supabase.from('drug_interaction_knowledge').select('*').limit(5);

  console.log('ddi error:', e1);
  console.log('dfi error:', e2);
  console.log('dik error:', e3);
}

inspectTables();
