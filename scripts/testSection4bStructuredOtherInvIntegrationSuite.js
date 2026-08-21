import { buildNormalizedApprovedCaseData } from '../src/utils/buildNormalizedApprovedCaseData.js';
import { synthesizeSection4DrugAiInterpretation } from '../src/services/aiAnalysisService.js';

async function runSection4bIntegrationSuite() {
  console.log('=== TESTING SECTION 4B STRUCTURED OTHER INVESTIGATIONS INTEGRATION ===\n');

  const results = [];
  function record(num, testName, passed, details) {
    results.push({ num, testName, status: passed ? 'PASS' : 'FAIL', details });
  }

  try {
    // ----------------------------------------------------
    // TEST 1 — CASE A (STRUCTURED ONLY)
    // ----------------------------------------------------
    const structuredMockA = [
      {
        investigation_name: 'Echocardiogram (ECHO)',
        test_date: '2026-08-01',
        finding_result: 'LVEF 35%, global hypokinesia',
        remarks: 'Cardiology consult',
        master_knowledge: {
          description: 'Ultrasound of heart',
          expected_findings: 'Normal LVEF 55-70%',
          clinical_significance: 'Evaluation of heart failure EF'
        }
      },
      {
        investigation_name: 'Electrocardiogram (ECG)',
        test_date: '2026-08-02',
        finding_result: 'Sinus tachycardia (HR 115 bpm)',
        remarks: null,
        master_knowledge: {
          description: 'Surface electrical recording',
          expected_findings: 'Normal sinus rhythm 60-100 bpm',
          clinical_significance: 'Identification of arrhythmias'
        }
      }
    ];

    const normA = buildNormalizedApprovedCaseData({
      clinicalCase: { id: 'test-case-a' },
      caseModulesData: {
        profile: {
          patient_name: 'PATIENT A',
          age: 58,
          gender: 'Male',
          other_investigations: '', // Empty legacy
          patient_other_investigations: structuredMockA
        }
      }
    });

    const isStructuredA = normA.otherInvestigations?.isStructured === true && normA.otherInvestigations?.structuredList?.length === 2;
    record(1, 'Case A (Structured Only) Normalization', isStructuredA, `isStructured: ${normA.otherInvestigations?.isStructured}, count: ${normA.otherInvestigations?.structuredList?.length}`);

    const aiResA = synthesizeSection4DrugAiInterpretation({ norm: normA, drugKnowledgeResults: [] });
    const hasDiagA = (aiResA.diagnosticFindings || []).length === 2;
    record(2, 'Case A Section 4B Synthesis & Cardiac MRP Extraction', hasDiagA, `Synthesized ${aiResA.diagnosticFindings?.length} diagnostic items in Section 4B payload.`);

    // ----------------------------------------------------
    // TEST 2 — CASE B (LEGACY ONLY FALLBACK)
    // ----------------------------------------------------
    const normB = buildNormalizedApprovedCaseData({
      clinicalCase: { id: 'test-case-b' },
      caseModulesData: {
        profile: {
          patient_name: 'PATIENT B',
          age: 62,
          gender: 'Female',
          other_investigations: 'U/S SCAN WHOLE ABDOMINAL - FATTY LIVER',
          patient_other_investigations: [] // Empty structured
        }
      }
    });

    const isLegacyB = normB.otherInvestigations?.isStructured === false && normB.otherInvestigations?.legacyText === 'U/S SCAN WHOLE ABDOMINAL - FATTY LIVER';
    record(3, 'Case B (Legacy Only) Fallback Normalization', isLegacyB, `isStructured: ${normB.otherInvestigations?.isStructured}, legacyText: "${normB.otherInvestigations?.legacyText}"`);

    const aiResB = synthesizeSection4DrugAiInterpretation({ norm: normB, drugKnowledgeResults: [] });
    const hasDiagB = (aiResB.diagnosticFindings || []).length === 1 && aiResB.diagnosticFindings[0]?.source === 'Legacy Text Fallback';
    record(4, 'Case B Section 4B Legacy Fallback Synthesis', hasDiagB, `Fallback source: ${aiResB.diagnosticFindings?.[0]?.source}`);

    // ----------------------------------------------------
    // TEST 3 — CASE C (STRUCTURED + LEGACY DEDUPLICATION)
    // ----------------------------------------------------
    const normC = buildNormalizedApprovedCaseData({
      clinicalCase: { id: 'test-case-c' },
      caseModulesData: {
        profile: {
          patient_name: 'PATIENT C',
          age: 50,
          gender: 'Male',
          other_investigations: 'DUPLICATE LEGACY TEXT ECHO ECG',
          patient_other_investigations: structuredMockA
        }
      }
    });

    const isDedupC = normC.otherInvestigations?.isStructured === true && !normC.otherInvestigations?.legacyText;
    record(5, 'Case C Structured-over-Legacy Priority & Deduplication', isDedupC, 'Structured records selected as PRIMARY source; duplicate legacy text suppressed.');

    // ----------------------------------------------------
    // TEST 4 — CASE D (NEITHER STRUCTURED NOR LEGACY)
    // ----------------------------------------------------
    const normD = buildNormalizedApprovedCaseData({
      clinicalCase: { id: 'test-case-d' },
      caseModulesData: {
        profile: {
          patient_name: 'PATIENT D',
          other_investigations: '',
          patient_other_investigations: []
        }
      }
    });

    const isNeitherD = normD.otherInvestigations?.isStructured === false && !normD.otherInvestigations?.legacyText;
    const aiResD = synthesizeSection4DrugAiInterpretation({ norm: normD, drugKnowledgeResults: [] });
    const hasDiagD = (aiResD.diagnosticFindings || []).length === 0;

    record(6, 'Case D (Neither) Empty Handling', isNeitherD && hasDiagD, 'Cleanly handled cases without diagnostic records; 0 errors.');

    // ----------------------------------------------------
    // TEST 5 — MASTER KNOWLEDGE VS PATIENT FINDING SEPARATION
    // ----------------------------------------------------
    const firstDiagItem = aiResA.diagnosticFindings[0];
    const isSeparated = firstDiagItem?.patient_finding === 'LVEF 35%, global hypokinesia' &&
                        firstDiagItem?.master_expected_findings === 'Normal LVEF 55-70%' &&
                        firstDiagItem?.master_clinical_significance === 'Evaluation of heart failure EF';

    record(7, 'Master Knowledge vs Patient Finding Separation', isSeparated, 'Patient-specific finding strictly separated from master expected findings & clinical significance.');

  } catch (err) {
    console.error('Error running Section 4B Integration Suite:', err);
  }

  console.log('\n--- SECTION 4B INTEGRATION SUITE RESULTS ---');
  results.forEach(r => console.log(`[${r.status}] TEST ${r.num}: ${r.testName} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);
}

runSection4bIntegrationSuite();
