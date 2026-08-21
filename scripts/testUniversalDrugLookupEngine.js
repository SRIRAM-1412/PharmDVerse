import pg from 'pg';
import { 
  fetchDrugKnowledgeFromSupabase, 
  lookupSingleIngredientInSupabase 
} from '../src/services/supabaseService.js';

async function testUniversalEngine() {
  console.log('=== TESTING UNIVERSAL AUTOMATED 5-TIER DRUG LOOKUP ENGINE ===\n');

  const testList = [
    { input: 'Levocetirizine', expected: 'Levocetirizine' },
    { input: 'levocetrizine', expected: 'Levocetirizine' }, // Typo (missing 'i')
    { input: 'Hydrochlorothiazide', expected: 'Hydrochlorothiazide' },
    { input: 'Hydrochlorthiazide', expected: 'Hydrochlorothiazide' }, // Typo (missing 'o')
    { input: 'Telmisartan', expected: 'Telmisartan' },
    { input: 'telimisartan', expected: 'Telmisartan' }, // Typo (extra 'i')
    { input: 'Amikacin', expected: 'Amikacin' },
    { input: 'Paracetamol', expected: 'Paracetamol' },
    { input: 'Montelukast', expected: 'Montelukast' },
    { input: 'Montair LC', expectedCount: 2 }, // FDC: Montelukast + Levocetirizine
    { input: 'Tab. Telma H', expectedCount: 2 }, // FDC: Telmisartan + Hydrochlorothiazide
    { input: 'Tab. Tripride', expectedCount: 3 } // FDC: Glimepiride + Metformin + Voglibose
  ];

  let passCount = 0;

  for (const item of testList) {
    const res = await fetchDrugKnowledgeFromSupabase(item.input);
    
    if (item.expectedCount) {
      const match = res.status === 'FOUND' && res.ingredientCount === item.expectedCount;
      console.log(`[${match ? 'PASS' : 'FAIL'}] FDC Input "${item.input}" -> Ingredients: ${res.ingredientCount || 0}/${item.expectedCount} (${res.activeIngredients?.join(', ')})`);
      if (match) passCount++;
    } else {
      const matchData = res.status === 'FOUND' ? res.data : null;
      const genericFound = matchData ? matchData.generic_name : 'NOT FOUND';
      const match = res.status === 'FOUND' && genericFound.toLowerCase() === item.expected.toLowerCase();
      console.log(`[${match ? 'PASS' : 'FAIL'}] Input "${item.input}" -> Matched DB Generic: "${genericFound}" (Expected: "${item.expected}")`);
      if (match) passCount++;
    }
  }

  console.log(`\nUNIVERSAL LOOKUP SUITE: ${passCount}/${testList.length} PASSED (100% AUTOMATED)`);
}

testUniversalEngine();
