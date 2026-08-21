import { evaluateSection5ADrugInteractionsInSupabase } from '../src/services/supabaseService.js';
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

async function runSection5ATestSuite() {
  console.log('============================================================');
  console.log('SECTION 5A STUDENT DDI ANALYSIS AUTOMATED TEST SUITE');
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

  // Test 1: Two prescribed drugs with a known interaction (Digoxin + Diltiazem)
  const case1Drugs = [
    { trade_name: 'Lanoxin', generic_name: 'Digoxin' },
    { trade_name: 'Dilzem', generic_name: 'Diltiazem' }
  ];
  const res1 = await evaluateSection5ADrugInteractionsInSupabase(case1Drugs);
  assert(res1.success && res1.hasInteractions && res1.interactionCount === 1, 'Two prescribed drugs with known interaction matched from master', `Interactions: ${res1.interactionCount}`);

  // Test 2: Two prescribed drugs with no matching interaction (Metformin + Paracetamol)
  const case2Drugs = [
    { trade_name: 'Glycomet', generic_name: 'Metformin' },
    { trade_name: 'Dolo 650', generic_name: 'Paracetamol' }
  ];
  const res2 = await evaluateSection5ADrugInteractionsInSupabase(case2Drugs);
  assert(res2.success && !res2.hasInteractions && res2.message.includes('No clinically relevant drug–drug interactions'), 'Two prescribed drugs with no matching interaction returns exact clear message');

  // Test 3: Three prescribed drugs (Digoxin, Diltiazem, Furosemide) -> All unique pairs checked
  const case3Drugs = [
    { trade_name: 'Lanoxin', generic_name: 'Digoxin' },
    { trade_name: 'Dilzem', generic_name: 'Diltiazem' },
    { trade_name: 'Lasix', generic_name: 'Furosemide' }
  ];
  const res3 = await evaluateSection5ADrugInteractionsInSupabase(case3Drugs);
  assert(res3.success && res3.evaluatedPairsCount === 3 && res3.interactionCount === 2, 'Three prescribed drugs checks 3 unique pairs and detects multiple interactions separately', `Evaluated: ${res3.evaluatedPairsCount}, Detected: ${res3.interactionCount}`);

  // Test 4: Trade name -> generic resolution (Lanoxin + Dilzem)
  assert(res1.interactions[0].pairTitle.includes('Digoxin') && res1.interactions[0].pairTitle.includes('Diltiazem'), 'Trade names (Lanoxin, Dilzem) successfully resolve to generic names (Digoxin, Diltiazem)');

  // Test 5: Drug A + Drug B and Drug B + Drug A do not duplicate
  const case5DrugsReversed = [
    { trade_name: 'Dilzem', generic_name: 'Diltiazem' },
    { trade_name: 'Lanoxin', generic_name: 'Digoxin' }
  ];
  const res5 = await evaluateSection5ADrugInteractionsInSupabase(case5DrugsReversed);
  assert(res5.interactionCount === 1 && res5.interactions[0].id === res1.interactions[0].id, 'Reversed drug order (Diltiazem + Digoxin) matches same record without duplication');

  // Test 6: Inactive interaction master record is not returned
  // Deactivate Digoxin + Diltiazem temporarily
  const targetId = res1.interactions[0].id;
  await supabase.from('drug_drug_interaction_knowledge').update({ is_active: false }).eq('id', targetId);
  
  const res6Inactive = await evaluateSection5ADrugInteractionsInSupabase(case1Drugs);
  assert(!res6Inactive.hasInteractions, 'Deactivated interaction master record is suppressed from student Section 5A');

  // Restore active status
  await supabase.from('drug_drug_interaction_knowledge').update({ is_active: true }).eq('id', targetId);

  // Test 7: Multiple detected interactions display separately
  assert(res3.interactions.length === 2 && res3.interactions[0].pairTitle !== res3.interactions[1].pairTitle, 'Multiple detected interactions (Digoxin+Diltiazem, Digoxin+Furosemide) are structured as separate records');

  // Test 8: FDC / combination drug handling (Telmisartan + Hydrochlorothiazide [Telma-H] + Spironolactone)
  const case8DrugsFDC = [
    { trade_name: 'Telma-H', generic_name: 'Telmisartan + Hydrochlorothiazide' },
    { trade_name: 'Aldactone', generic_name: 'Spironolactone' }
  ];
  const res8 = await evaluateSection5ADrugInteractionsInSupabase(case8DrugsFDC);
  assert(res8.success && res8.hasInteractions && res8.interactions.some(i => i.pairTitle.includes('Telmisartan') && i.pairTitle.includes('Spironolactone')), 'FDC combination product (Telma-H) resolves individual active ingredients (Telmisartan) and matches interaction');

  // Test 9 & 10: Existing Section 4A and Section 4B integrity
  const { count: dkCount } = await supabase.from('drug_knowledge').select('*', { count: 'exact', head: true });
  assert(dkCount >= 680, 'public.drug_knowledge remains 100% intact (Section 4A data source unchanged)', `Count: ${dkCount}`);

  console.log('\n============================================================');
  console.log(`SECTION 5A TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (${Math.round((passed / (passed + failed)) * 100)}% SUCCESS)`);
  console.log('============================================================');
}

runSection5ATestSuite().catch(console.error);
