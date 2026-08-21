import { parseAndValidateMasterExcel } from '../src/services/masterDataImportService.js';
import { normalizeDrugSearchInput } from '../src/services/supabaseService.js';

console.log('====================================================');
console.log('STARTING MASTER DATA BULK IMPORT & TEMPLATE TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

const assert = (condition, description) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ TEST ${totalTests} PASSED: ${description}`);
  } else {
    console.error(`❌ TEST ${totalTests} FAILED: ${description}`);
  }
};

// 1. DRUG KNOWLEDGE DUP CHECK & NORMALIZATION
const testNorm = normalizeDrugSearchInput('Paracetamol 650 mg');
assert(testNorm === 'paracetamol 650 mg', 'normalizeDrugSearchInput converts to lowercase trimmed string.');

// 2. DDI UNORDERED PAIR KEY LOGIC
const normA = normalizeDrugSearchInput('Digoxin');
const normB = normalizeDrugSearchInput('Diltiazem');
const pairKey1 = [normA, normB].sort().join(':::');
const pairKey2 = [normB, normA].sort().join(':::');

assert(pairKey1 === pairKey2, 'DDI pair_key enforces unordered equality (A+B === B+A).');
assert(pairKey1 === 'digoxin:::diltiazem', `DDI pair_key generated correctly: "${pairKey1}".`);

// 3. DFI PAIR KEY LOGIC
const dfiDrugNorm = normalizeDrugSearchInput('Atorvastatin');
const dfiFoodNorm = normalizeDrugSearchInput('Grapefruit Juice');
const dfiKey = `${dfiDrugNorm}:::${dfiFoodNorm}`;
assert(dfiKey === 'atorvastatin:::grapefruit juice', `DFI pair key generated correctly: "${dfiKey}".`);

// Summary
console.log('\n====================================================');
console.log(`TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED.`);
console.log('====================================================');
