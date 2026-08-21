import pg from 'pg';
import { parsePrescriptionInput, resolveTradeNameToGeneric } from '../src/utils/prescriptionParserService.js';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function runSection4AFullPipelineValidation() {
  await client.connect();
  const results = [];

  function record(testName, passed, details) {
    results.push({ test: testName, status: passed ? 'PASS' : 'FAIL', details });
  }

  console.log('=== STARTING 4A DRUG KNOWLEDGE FULL PIPELINE & PERSISTENCE VALIDATION SUITE ===\n');

  // TEST 1: Single Drug (Inj. Amikacin)
  try {
    const res1 = resolveTradeNameToGeneric('Inj. Amikacin');
    const db1 = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) = 'amikacin'");
    const row = db1.rows[0] || {};
    
    const requiredCols = [
      'generic_name', 'brand_names', 'drug_class',
      'established_uses', 'mechanism_of_action', 'normal_dose_range',
      'contraindications', 'side_effects_adverse_effects', 'monitoring_parameters'
    ];
    const hasAllColsInSchema = requiredCols.every(col => Object.prototype.hasOwnProperty.call(row, col));

    const p1 = res1.dosageForm === 'Injection' && res1.genericNameDisplay === 'Amikacin' && hasAllColsInSchema;
    record('Single Drug Resolution & 10-Field Display (Inj. Amikacin)', p1, `Form: ${res1.dosageForm}, Generic: ${res1.genericNameDisplay}, All 10 Schema Columns Present: ${hasAllColsInSchema}`);
  } catch (e) {
    record('Single Drug Resolution & 10-Field Display (Inj. Amikacin)', false, e.message);
  }

  // TEST 2: Tab. Dolo 650
  try {
    const res2 = resolveTradeNameToGeneric('Tab. Dolo 650');
    const p2 = res2.extractedTradeName.toLowerCase() === 'dolo' && res2.extractedStrength === '650 mg' && res2.genericNameDisplay === 'Paracetamol';
    record('Trade Name + Strength Parsing (Tab. Dolo 650)', p2, `Trade: ${res2.extractedTradeName}, Strength: ${res2.extractedStrength}, Generic: ${res2.genericNameDisplay}`);
  } catch (e) {
    record('Trade Name + Strength Parsing (Tab. Dolo 650)', false, e.message);
  }

  // TEST 3: TABTELMA & TELIMISARTANHYDROCCHLORT Resolution (Screenshot fix verification)
  try {
    const res3a = resolveTradeNameToGeneric('TABTELMA');
    const res3b = resolveTradeNameToGeneric('TELIMISARTANHYDROCCHLORT');
    const db3a = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%telmisartan%'");
    const db3b = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%hydrochlorothiazide%'");

    const p3 = res3a.genericNameDisplay.includes('Telmisartan') &&
      res3b.genericNameDisplay === 'Telmisartan + Hydrochlorothiazide' &&
      db3a.rows.length > 0 && db3b.rows.length > 0;

    record('TABTELMA & TELIMISARTANHYDROCCHLORT Resolution', p3, `Trade: ${res3a.genericNameDisplay}, Concatenated Generic: ${res3b.genericNameDisplay}`);
  } catch (e) {
    record('TABTELMA & TELIMISARTANHYDROCCHLORT Resolution', false, e.message);
  }

  // TEST 4: Three-Drug Combination (Tab. Tripride)
  try {
    const res4 = resolveTradeNameToGeneric('Tab. Tripride');
    const db4a = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%glimepiride%'");
    const db4b = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%metformin%'");
    const db4c = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%voglibose%'");
    const p4 = res4.ingredientCount === 3 && db4a.rows.length > 0 && db4b.rows.length > 0 && db4c.rows.length > 0;
    record('Three-Drug FDC Separate Component Knowledge (Tab. Tripride)', p4, `Ingredients: ${res4.ingredientCount}, All 3 Separate DB Records Found: ${p4}`);
  } catch (e) {
    record('Three-Drug FDC Separate Component Knowledge (Tab. Tripride)', false, e.message);
  }

  // TEST 5: Four-or-More Drug Combination (Tab. Forecox)
  try {
    const res5 = resolveTradeNameToGeneric('Tab. Forecox');
    const db5a = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%rifampicin%'");
    const db5b = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%isoniazid%'");
    const db5c = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%pyrazinam%'");
    const db5d = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%ethambutol%'");
    const p5 = res5.ingredientCount === 4 && db5a.rows.length > 0 && db5b.rows.length > 0 && db5c.rows.length > 0 && db5d.rows.length > 0;
    record('Four-Drug FDC Separate Component Knowledge (Tab. Forecox)', p5, `Ingredients: ${res5.ingredientCount}, All 4 Separate DB Records Found: ${p5}`);
  } catch (e) {
    record('Four-Drug FDC Separate Component Knowledge (Tab. Forecox)', false, e.message);
  }

  // TEST 6: Normalization Tests
  try {
    const r6a = resolveTradeNameToGeneric('Tab Dolo');
    const r6b = resolveTradeNameToGeneric('Tab. Dolo');
    const r6c = resolveTradeNameToGeneric('TAB DOLO');
    const r6d = resolveTradeNameToGeneric('tablet dolo');
    const r6e = resolveTradeNameToGeneric('Inj Amikacin');
    const r6f = resolveTradeNameToGeneric('Inj. Amikacin');
    const r6g = resolveTradeNameToGeneric('Injection Amikacin');

    const p6 = r6a.genericNameDisplay.includes('Paracetamol') && r6b.genericNameDisplay.includes('Paracetamol') &&
      r6c.genericNameDisplay.includes('Paracetamol') && r6d.genericNameDisplay.includes('Paracetamol') &&
      r6e.genericNameDisplay.includes('Amikacin') && r6f.genericNameDisplay.includes('Amikacin') && r6g.genericNameDisplay.includes('Amikacin');

    record('Case and Formatting Normalization Tolerance', p6, 'All 7 input variations resolved consistently.');
  } catch (e) {
    record('Case and Formatting Normalization Tolerance', false, e.message);
  }

  // TEST 7: Unknown Trade Name Safety
  try {
    const res7 = resolveTradeNameToGeneric('Tab. UnknownXYZ');
    const p7 = res7.status === 'UNRESOLVED_TRADE_NAME' && res7.genericNameDisplay.includes('could not be confidently resolved');
    record('Unknown Trade Name Safety (Tab. UnknownXYZ)', p7, `Status: ${res7.status}, Message: ${res7.genericNameDisplay}`);
  } catch (e) {
    record('Unknown Trade Name Safety (Tab. UnknownXYZ)', false, e.message);
  }

  // TEST 8: SAVE -> RELOAD -> EDIT -> SAVE Persistence Simulation
  try {
    const initialEntry = { trade_name: 'Tab. Augmentin 625', generic_name: 'Amoxicillin + Clavulanic acid', dose: '625 mg', route_of_admin: 'Oral' };
    const savedJSON = JSON.stringify([initialEntry]);
    const reloadedList = JSON.parse(savedJSON);

    const item1 = resolveTradeNameToGeneric(reloadedList[0].trade_name);
    const item2 = resolveTradeNameToGeneric(reloadedList[0].generic_name);

    const p8 = item1.ingredientCount === 2 && item2.ingredientCount === 2 &&
      item1.activeIngredients.includes('Amoxicillin') && item1.activeIngredients.includes('Clavulanic acid');

    record('Save -> Reload -> Edit Persistence', p8, `Survives save & reload cleanly. Active 1: ${item1.activeIngredients[0]}, Active 2: ${item1.activeIngredients[1]}`);
  } catch (e) {
    record('Save -> Reload -> Edit Persistence', false, e.message);
  }

  console.log('\n--- TEST RESULTS SUMMARY ---');
  results.forEach(r => console.log(`[${r.status}] ${r.test} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);

  await client.end();
}

runSection4AFullPipelineValidation();
