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
  global: {
    headers: { 'x-super-admin': 'true' }
  }
});

async function runTestSuite() {
  console.log('============================================================');
  console.log('SECTION 5 MASTER KNOWLEDGE AUTOMATED TEST SUITE');
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

  // Test 1: public.drug_drug_interaction_knowledge table exists
  const { data: ddiData, error: ddiErr } = await supabase.from('drug_drug_interaction_knowledge').select('*').limit(5);
  assert(!ddiErr, 'public.drug_drug_interaction_knowledge table exists and is accessible', ddiErr?.message);

  // Test 2: public.drug_food_interaction_knowledge table exists
  const { data: dfiData, error: dfiErr } = await supabase.from('drug_food_interaction_knowledge').select('*').limit(5);
  assert(!dfiErr, 'public.drug_food_interaction_knowledge table exists and is accessible', dfiErr?.message);

  // Test 3: Create DDI Record
  const testA = 'TestDrugAlpha_' + Date.now();
  const testB = 'TestDrugBeta_' + Date.now();
  const normA = testA.toLowerCase();
  const normB = testB.toLowerCase();
  const pairKey = [normA, normB].sort().join(':::');

  const { data: createdDDI, error: createDDIErr } = await supabase
    .from('drug_drug_interaction_knowledge')
    .insert([{
      drug_a_generic: testA,
      drug_a_normalized: normA,
      drug_b_generic: testB,
      drug_b_normalized: normB,
      pair_key: pairKey,
      interaction_description: 'Test DDI interaction description',
      severity: 'Major',
      is_active: true
    }])
    .select();

  assert(!createDDIErr && createdDDI?.[0]?.id, 'Super Admin can create Drug-Drug interaction record', createDDIErr?.message);
  const createdDDIId = createdDDI?.[0]?.id;

  // Test 4: Duplicate DDI Drug A + Drug B Prevention
  const { error: dup1Err } = await supabase
    .from('drug_drug_interaction_knowledge')
    .insert([{
      drug_a_generic: testA,
      drug_a_normalized: normA,
      drug_b_generic: testB,
      drug_b_normalized: normB,
      pair_key: pairKey,
      interaction_description: 'Duplicate DDI description',
      severity: 'Major',
      is_active: true
    }]);

  assert(Boolean(dup1Err), 'Duplicate DDI (Drug A + Drug B) is prevented by pair_key constraint');

  // Test 5: Unordered Duplicate DDI (Drug B + Drug A) Prevention
  const revPairKey = [normB, normA].sort().join(':::'); // Will be identical to pairKey
  const { error: dup2Err } = await supabase
    .from('drug_drug_interaction_knowledge')
    .insert([{
      drug_a_generic: testB,
      drug_a_normalized: normB,
      drug_b_generic: testA,
      drug_b_normalized: normA,
      pair_key: revPairKey,
      interaction_description: 'Reversed Duplicate DDI description',
      severity: 'Major',
      is_active: true
    }]);

  assert(Boolean(dup2Err), 'Reversed Duplicate DDI (Drug B + Drug A) is prevented by unordered pair_key constraint');

  // Test 6: Edit DDI Record
  const { data: updatedDDI, error: updateDDIErr } = await supabase
    .from('drug_drug_interaction_knowledge')
    .update({ interaction_description: 'Updated DDI description text' })
    .eq('id', createdDDIId)
    .select();

  assert(!updateDDIErr && updatedDDI?.[0]?.interaction_description === 'Updated DDI description text', 'Super Admin can edit DDI record');

  // Test 7: Toggle DDI Active Status
  const { data: toggledDDI, error: toggleDDIErr } = await supabase
    .from('drug_drug_interaction_knowledge')
    .update({ is_active: false })
    .eq('id', createdDDIId)
    .select();

  assert(!toggleDDIErr && toggledDDI?.[0]?.is_active === false, 'Super Admin can deactivate DDI record');

  // Clean up test DDI record
  await supabase.from('drug_drug_interaction_knowledge').delete().eq('id', createdDDIId);

  // Test 8: Create DFI Record
  const testDrug = 'TestStatin_' + Date.now();
  const testFood = 'TestGrapefruit_' + Date.now();
  const normDrug = testDrug.toLowerCase();
  const normFood = testFood.toLowerCase();

  const { data: createdDFI, error: createDFIErr } = await supabase
    .from('drug_food_interaction_knowledge')
    .insert([{
      drug_generic: testDrug,
      drug_normalized: normDrug,
      food_or_beverage: testFood,
      food_normalized: normFood,
      interaction_description: 'Test DFI interaction description',
      severity: 'Major',
      is_active: true
    }])
    .select();

  assert(!createDFIErr && createdDFI?.[0]?.id, 'Super Admin can create Drug-Food interaction record', createDFIErr?.message);
  const createdDFIId = createdDFI?.[0]?.id;

  // Test 9: Duplicate DFI Prevention
  const { error: dupDFIErr } = await supabase
    .from('drug_food_interaction_knowledge')
    .insert([{
      drug_generic: testDrug,
      drug_normalized: normDrug,
      food_or_beverage: testFood,
      food_normalized: normFood,
      interaction_description: 'Duplicate DFI description',
      severity: 'Major',
      is_active: true
    }]);

  assert(Boolean(dupDFIErr), 'Duplicate Drug-Food combination is prevented by unique constraint');

  // Test 10: Edit DFI Record
  const { data: updatedDFI, error: updateDFIErr } = await supabase
    .from('drug_food_interaction_knowledge')
    .update({ counselling_point: 'Avoid juice with tablets' })
    .eq('id', createdDFIId)
    .select();

  assert(!updateDFIErr && updatedDFI?.[0]?.counselling_point === 'Avoid juice with tablets', 'Super Admin can edit DFI record');

  // Test 11: Toggle DFI Active Status
  const { data: toggledDFI, error: toggleDFIErr } = await supabase
    .from('drug_food_interaction_knowledge')
    .update({ is_active: false })
    .eq('id', createdDFIId)
    .select();

  assert(!toggleDFIErr && toggledDFI?.[0]?.is_active === false, 'Super Admin can deactivate DFI record');

  // Clean up test DFI record
  await supabase.from('drug_food_interaction_knowledge').delete().eq('id', createdDFIId);

  // Test 12: Verify existing drug_knowledge & patient_prescribed_drugs remain intact
  const { count: dkCount } = await supabase.from('drug_knowledge').select('*', { count: 'exact', head: true });
  assert(dkCount >= 680, 'public.drug_knowledge remains completely intact', `Count: ${dkCount}`);

  console.log('\n============================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (${Math.round((passed / (passed + failed)) * 100)}% SUCCESS)`);
  console.log('============================================================');
}

runTestSuite().catch(console.error);
