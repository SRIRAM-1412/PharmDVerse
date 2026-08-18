const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NjEsImV4cCI6MjEwMjU0Mzk2MX0.UjWJhQh0T0DRpcYKNunAEr6jOdMIc7pl2uDBxtGc8d4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Testing connection to new Supabase project via JS Client...');

  const { data: colleges, error: colErr } = await supabase.from('colleges').select('*');
  if (colErr) console.error('Colleges query error:', colErr.message);
  else console.log(`Colleges retrieved: ${colleges.length}`);

  const { data: students, error: studErr } = await supabase.from('students').select('*').limit(5);
  if (studErr) console.error('Students query error:', studErr.message);
  else console.log(`Sample students retrieved: ${students.length}`);

  const { data: cases, error: caseErr } = await supabase.from('clinical_cases').select('*').limit(5);
  if (caseErr) console.error('Cases query error:', caseErr.message);
  else console.log(`Sample cases retrieved: ${cases.length}`);
}

verify();
