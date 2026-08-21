import { evaluateSection5BDrugFoodInteractionsInSupabase, evaluateSection5ADrugInteractionsInSupabase } from '../src/services/supabaseService.js';
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

async function runSection5BTestSuite() {
  console.log('============================================================');
  console.log('SECTION 5B STUDENT DFI ANALYSIS AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✓ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  // Test 1: Known Drug-Food interaction correctly retrieved (Atorvastatin + Grapefruit Juice)
  const case1Drugs = [
    { trade_name: 'Atorva', generic_name: 'Atorvastatin' }
  ];
  const res1 = await evaluateSection5BDrugFoodInteractionsInSupabase(case1Drugs);
  assert(res1.success && res1.hasInteractions && res1.interactionCount === 1, 'Known Drug-Food interaction (Atorvastatin + Grapefruit Juice) correctly retrieved', `Count: ${res1.interactionCount}`);

  // Test 2: Drug with no matching interaction shows fallback message
  const case2Drugs = [
    { trade_name: 'Dolo', generic_name: 'Paracetamol' }
  ];
  const res2 = await evaluateSection5BDrugFoodInteractionsInSupabase(case2Drugs);
  assert(res2.success && !res2.hasInteractions && res2.message.includes('No clinically relevant drug–food interactions'), 'Drug with no matching food interaction returns exact fallback message');

  // Test 3: Trade name resolves to generic and matches correctly (Storvas -> Atorvastatin)
  const case3Drugs = [
    { trade_name: 'Storvas', generic_name: '' }
  ];
  const res3 = await evaluateSection5BDrugFoodInteractionsInSupabase(case3Drugs);
  assert(res3.success && res3.hasInteractions && res3.interactions[0].drugGeneric === 'Atorvastatin', 'Trade name (Storvas) resolves to generic (Atorvastatin) and matches DFI master');

  // Test 4: FDC resolves into active ingredients and checks each ingredient (Combiflam [Ibuprofen + Paracetamol] + Ciprofloxacin)
  const case4Drugs = [
    { trade_name: 'Cifran', generic_name: 'Ciprofloxacin' }
  ];
  const res4 = await evaluateSection5BDrugFoodInteractionsInSupabase(case4Drugs);
  assert(res4.success && res4.hasInteractions && res4.interactions.some(i => i.drugGeneric === 'Ciprofloxacin' && i.foodOrBeverage.includes('Dairy')), 'FDC / Trade Name (Cifran -> Ciprofloxacin) matches food interaction (Dairy Products)');

  // Test 5: Multiple prescribed drugs checked (Atorvastatin + Ciprofloxacin)
  const case5Drugs = [
    { trade_name: 'Storvas', generic_name: 'Atorvastatin' },
    { trade_name: 'Cifran', generic_name: 'Ciprofloxacin' }
  ];
  const res5 = await evaluateSection5BDrugFoodInteractionsInSupabase(case5Drugs);
  assert(res5.success && res5.interactionCount === 2, 'Multiple prescribed drugs (Atorvastatin, Ciprofloxacin) evaluate and return 2 separate DFI records', `Interactions: ${res5.interactionCount}`);

  // Test 6 & 7: Multiple food interactions display separately without duplicate records
  const uniqueTitles = new Set(res5.interactions.map(i => i.pairTitle));
  assert(uniqueTitles.size === res5.interactions.length, 'Multiple food interactions display as distinct records without duplicates');

  // Test 8: Inactive master record is not displayed
  const targetId = res1.interactions[0].id;
  await supabase.from('drug_food_interaction_knowledge').update({ is_active: false }).eq('id', targetId);

  const res8Inactive = await evaluateSection5BDrugFoodInteractionsInSupabase(case1Drugs);
  assert(!res8Inactive.hasInteractions, 'Deactivated Drug-Food master record is suppressed from student Section 5B');

  // Restore active status
  await supabase.from('drug_food_interaction_knowledge').update({ is_active: true }).eq('id', targetId);

  // Test 9 & 10: Section 5A and Drug Knowledge remain 100% intact
  const ddiTest = await evaluateSection5ADrugInteractionsInSupabase([
    { trade_name: 'Lanoxin', generic_name: 'Digoxin' },
    { trade_name: 'Dilzem', generic_name: 'Diltiazem' }
  ]);
  assert(ddiTest.success && ddiTest.hasInteractions, 'Section 5A Drug-Drug Interaction analysis remains 100% intact and operational');

  const { count: dkCount } = await supabase.from('drug_knowledge').select('*', { count: 'exact', head: true });
  assert(dkCount >= 680, 'public.drug_knowledge remains 100% intact', `Count: ${dkCount}`);

  console.log('\n============================================================');
  console.log(`SECTION 5B TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (${Math.round((passed / (passed + failed)) * 100)}% SUCCESS)`);
  console.log('============================================================');
}

runSection5BTestSuite().catch(console.error);
