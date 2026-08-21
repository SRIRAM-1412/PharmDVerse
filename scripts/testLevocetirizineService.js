import pg from 'pg';
import { fetchDrugKnowledgeFromSupabase } from '../src/services/supabaseService.js';

async function testService() {
  console.log('=== TESTING fetchDrugKnowledgeFromSupabase for Levocetirizine ===\n');

  const res1 = await fetchDrugKnowledgeFromSupabase('Levocetirizine');
  console.log('Lookup Levocetirizine:', JSON.stringify(res1, null, 2));

  const res2 = await fetchDrugKnowledgeFromSupabase('Montair LC');
  console.log('\nLookup Montair LC:', JSON.stringify(res2, null, 2));
}

testService();
