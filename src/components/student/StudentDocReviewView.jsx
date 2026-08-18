import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Sparkles, FolderKanban, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, AlertOctagon, FileText, ArrowRight, ExternalLink, Filter, Search, CheckCircle,
  FileSearch, Info, AlertCircle
} from 'lucide-react';
import { fetchStudentCasesFromSupabase, fetchCaseModuleStatusesFromSupabase } from '../../services/supabaseService';
import { buildNormalizedApprovedCaseData } from '../../utils/buildNormalizedApprovedCaseData';

/**
 * Helper to determine if a form object has SAVED/PERSISTED data in Supabase for the selected case.
 * Returns true if the form record exists with non-empty clinical fields.
 * Returns false if no form record exists or the form is completely empty/unsaved.
 */
const checkIsFormSaved = (formObj, formType = '') => {
  if (!formObj || typeof formObj !== 'object' || Object.keys(formObj).length === 0) return false;
  
  const status = String(formObj.status || formObj.form_status || formObj.approval_status || formObj.status_label || '').toLowerCase().trim();
  
  if (status === 'not_created' || status === 'uncreated' || status === 'not added') {
    return false;
  }

  if (formType === 'profile' || formType === true) {
    return Boolean(
      formObj.patient_name ||
      formObj.chief_complaints ||
      formObj.provisional_diagnosis ||
      (formObj.final_diagnosis && formObj.final_diagnosis !== 'N/A')
    );
  }

  if (formType === 'counselling') {
    return Boolean(
      formObj.disease_counselled ||
      formObj.medications_counselled ||
      formObj.topics_covered ||
      formObj.counselling_points ||
      formObj.points_covered
    );
  }

  if (formType === 'intervention') {
    return Boolean(
      formObj.description_of_problem ||
      formObj.problem_identified ||
      formObj.prescription_problems ||
      formObj.action_taken ||
      formObj.recommendations ||
      formObj.actions_taken
    );
  }

  if (formType === 'dir') {
    return Boolean(
      formObj.details_of_enquiry ||
      formObj.query ||
      formObj.question_asked ||
      formObj.information_provided ||
      formObj.response
    );
  }

  if (formType === 'adr') {
    const suspectedArr = Array.isArray(formObj.suspected_meds) ? formObj.suspected_meds : (Array.isArray(formObj.suspected_drugs) ? formObj.suspected_drugs : []);
    const hasSuspectedMeds = suspectedArr.length > 0 || Boolean(formObj.suspected_medication || formObj.suspected_drug || formObj.suspected_med);
    
    const reactionTitle = String(formObj.reaction_title || formObj.reactionTitle || '').trim();
    const reactionDesc = String(formObj.reaction_description || '').trim();
    const hasReaction = Boolean(
      (reactionTitle && reactionTitle !== 'N/A' && reactionTitle !== '—') ||
      (reactionDesc && reactionDesc !== 'N/A' && reactionDesc !== '—')
    );
    
    return Boolean(hasReaction || hasSuspectedMeds);
  }

  return false;
};

const KNOWN_DRUGS = [
  // Anticonvulsants / Seizure Management
  'phenytoin', 'eptoin', 'dilantin', 'phenytoin sodium',
  'carbamazepine', 'tegretol', 'zeptol', 'mazetol',
  'oxcarbazepine', 'trileptal', 'oxetol',
  'valproate', 'valproic acid', 'sodium valproate', 'valparin', 'epilim', 'divalproex',
  'levetiracetam', 'keppra', 'levipil',
  'lamotrigine', 'lamictal',
  'clobazam', 'frisium',
  'phenobarbital', 'gardenal',
  'lacosamide', 'vimpat',
  'topiramate', 'topamax',

  // Anti-Ulcer & Gastrointestinal
  'pantop', 'pantop 40', 'pantocid', 'pan 40', 'pantodac', 'pantoprazole', 'pan-d', 'pan d', 'pantop-d',
  'omeprazole', 'ozid', 'ocid',
  'rabeprazole', 'rabeloc', 'rabicip', 'razo', 'cyra',
  'esomeprazole', 'nexpro',
  'ranitidine', 'zinetac', 'aciloc', 'famotidine', 'famocid',
  'sucralfate', 'sucrafil',
  'ondansetron', 'zofran', 'emeset',
  'domperidone', 'vomistop', 'metoclopramide', 'perinorm',
  'lactulose', 'duphalac', 'lactitol', 'importal',
  'mesalamine', 'mesalazine', '5-asa', 'mesacol', 'asacol',
  'rifaximin', 'rcifax', 'spiraxin',
  'hyoscine', 'hyoscine butylbromide', 'buscopan', 'buscogast',

  // Analgesics, NSAIDs & Antipyretics
  'paracetamol', 'acetaminophen', 'dolo', 'dolo 650', 'crocin', 'calpol', 'pacimol', 'pcm',
  'ibuprofen', 'brufen', 'advil', 'diclofenac', 'voveran', 'voltaren',
  'aceclofenac', 'zinetac', 'naproxen', 'naprosyn', 'ketorolac', 'ketorol',
  'mefenamic acid', 'meftal', 'tramadol', 'ultram', 'tramazac',

  // Antibiotics & Antimicrobials
  'azithromycin', 'atm', 'azithral', 'zithrox', 'clarithromycin', 'erythromycin',
  'amoxicillin', 'moxikind', 'augmentin', 'ampicillin', 'sulbactam',
  'piperacillin', 'tazobactam', 'pipzo', 'zocin',
  'ceftriaxone', 'monocef', 'cefotaxime', 'taxim',
  'cefixime', 'taxim-o', 'cefpodoxime', 'doxcef', 'cefuroxime', 'altacef', 'ceftum', 'cefepime',
  'meropenem', 'meronem', 'ertapenem', 'imipenem',
  'ciprofloxacin', 'ciplox', 'cifran', 'levofloxacin', 'levoquin', 'moxifloxacin', 'ofloxacin', 'oflox',
  'amikacin', 'amicip', 'mikacin', 'gentamicin', 'genticyn',
  'vancomycin', 'vancocin', 'linezolid', 'lizolid',
  'metronidazole', 'flagyl', 'metrogyl', 'doxycycline', 'nitrofurantoin',

  // Cardiovascular, Antihypertensives & Antiplatelets
  'aspirin', 'ecosprin', 'acetylsalicylic acid', 'acetylsalicylic',
  'clopidogrel', 'clopilet', 'plavix', 'ticagrelor', 'brilinta',
  'heparin', 'enoxaparin', 'clexane', 'lwmh', 'warfarin', 'coumadin', 'apixaban', 'rivaroxaban',
  'telmisartan', 'telma', 'telpres', 'tazloc', 'telmikind',
  'losartan', 'zaart', 'valsartan', 'olmesartan',
  'amlodipine', 'amlong', 'stamlo', 'cilnidipine', 'cilacar', 'nifedipine', 'nicardia',
  'atenolol', 'aten', 'metoprolol', 'betaloc', 'metolar', 'bisoprolol', 'concor', 'carvedilol',
  'enalapril', 'ramipril', 'cardace', 'prazosin', 'minipress',
  'nitroglycerin', 'sorbitrate', 'isosorbide', 'amiodarone', 'digoxin',

  // Diuretics
  'furosemide', 'frusemide', 'lasix', 'torsemide', 'dytor',
  'spironolactone', 'aldactone', 'hydrochlorothiazide', 'hctz', 'chlorthalidone',

  // Antidiabetics & Statins
  'metformin', 'glycomet', 'glucophage', 'glyciphage',
  'glimepiride', 'amaryl', 'gliclazide', 'teneligliptin', 'sitagliptin', 'vildagliptin',
  'dapagliflozin', 'empagliflozin', 'insulin', 'actrapid', 'lantus', 'mixtard', 'humulin',
  'atorvastatin', 'atorva', 'storvas', 'lipitor', 'rosuvastatin', 'rosuvas', 'simvastatin', 'fenofibrate',

  // Antihistamines & Respiratory
  'one all', '1 all', 'oneall', 'levocetirizine', 'levocetriz', 'levozet', 'cetzine', 'okacet', 'alerid', 'cetirizine', 'fexofenadine', 'loratadine',
  'salbutamol', 'asthalin', 'levosalbutamol', 'ipratropium', 'duolin', 'budesonide', 'pulmicort', 'foracort', 'montelukast', 'deriphyllin', 'etofylline', 'theophylline',

  // Steroids & Gout
  'dexamethasone', 'dexona', 'hydrocortisone', 'effcorlin', 'methylprednisolone', 'solumedrol', 'prednisolone', 'omnacortil', 'betamethasone',
  'allopurinol', 'zyloric', 'febuxostat', 'colchicine'
];

const KNOWN_DRUG_STEMS = [
  'toin', 'prazole', 'sartan', 'statin', 'cillin', 'mycin', 'cycline', 'floxacin',
  'olol', 'dipine', 'pril', 'tidine', 'gliptin', 'gliflozin', 'coxib', 'vir',
  'mab', 'zepam', 'zolam', 'nidazole', 'barbital', 'terol', 'lukast', 'cetirizine', 'triz',
  'setron', 'sone', 'nide', 'drine', 'lam'
];

/**
 * Common misspelling corrections dictionary
 */
const COMMON_SPELLING_CORRECTIONS = {
  // Drugs
  'mesalamin': 'Mesalamine',
  'hyoscine butylbromid': 'Hyoscine butylbromide',
  'amoxicilin': 'Amoxicillin',
  'telmisat': 'Telmisartan',
  'telmisartin': 'Telmisartan',
  'paracetmol': 'Paracetamol',
  'pantoprazol': 'Pantoprazole',
  'atorvastatin': 'Atorvastatin',
  'aspirine': 'Aspirin',
  'spironolacton': 'Spironolactone',
  'levocetriz': 'Levocetirizine',
  'levocetirizin': 'Levocetirizine',
  'levocetrizine': 'Levocetirizine',

  // Diagnoses
  'hypertenssion': 'Hypertension',
  'hypertensionn': 'Hypertension',
  'diabates': 'Diabetes Mellitus',
  'diabtes': 'Diabetes Mellitus',
  'astma': 'Asthma',
  'pneumonea': 'Pneumonia',
  'serosis': 'Cirrhosis',

  // Symptoms
  'feverr': 'Fever',
  'nauseaa': 'Nausea',
  'vomitting': 'Vomiting',

  // Diagnostic tests
  'echocardiogramm': 'Echocardiogram',
  'electrocardiogramm': 'Electrocardiogram',
  'ultrasond': 'Ultrasound'
};

/**
 * Evaluates Pre-Submission Clinical Documentation Issues across all saved modules.
 * Generates 🔴 CORRECTION REQUIRED, 🟠 PLEASE VERIFY, and 🔵 DOCUMENTATION GAP notes.
 */
const generatePreSubmissionReview = (norm, caseModulesData) => {
  const issues = [];
  let issueIdCounter = 1;

  const addIssue = (category, formModule, formTab, fieldName, enteredValue, issue, suggestion, actionText, targetFieldId = '') => {
    issues.push({
      id: `issue-${issueIdCounter++}`,
      category, // 'CORRECTION_REQUIRED' | 'PLEASE_VERIFY' | 'DOCUMENTATION_GAP'
      formModule,
      formTab,
      fieldName,
      enteredValue: enteredValue || 'Not Documented',
      issue,
      suggestion,
      actionText: actionText || 'Verify against original clinical record and manually correct the form if necessary.',
      targetFieldId: targetFieldId || `field-${formTab}`
    });
  };

  const isProfileSaved = checkIsFormSaved(caseModulesData?.profile, 'profile');
  const isCounsellingSaved = checkIsFormSaved(caseModulesData?.counselling, 'counselling');
  const isInterventionSaved = checkIsFormSaved(caseModulesData?.intervention, 'intervention');
  const isDirSaved = checkIsFormSaved(caseModulesData?.dir, 'dir');
  const isAdrSaved = checkIsFormSaved(caseModulesData?.adr, 'adr');

  // ==========================================
  // 1. PATIENT PROFILE DOCUMENTATION REVIEW
  // ==========================================
  if (isProfileSaved) {
    const profile = caseModulesData?.profile || {};
    const drugs = norm.drugs || [];
    const labs = norm.labs || [];
    const vitals = norm.vitals || [];

    // A. Allergy Information Gap Check (Requirement 21)
    const allergyVal = String(profile.allergy_drugs || profile.allergy_food || profile.allergies || norm.allergies || '').trim();
    if (!allergyVal || allergyVal === 'N/A' || allergyVal === '—') {
      addIssue(
        'DOCUMENTATION_GAP',
        'Patient Profile',
        'patient-profile',
        'Allergy Information',
        allergyVal || 'Empty',
        'Allergy status has not been explicitly documented in the patient profile.',
        'If allergy information is available and clinically relevant, document the patient\'s allergy status before final submission.',
        'Document allergy status or explicit "No Known Drug Allergies (NKDA)".',
        'field-allergies'
      );
    }

    // B. Diagnosis Spelling & Terminology Check (Requirement 10)
    const rawDiagnosis = profile.diagnosis_final || profile.provisional_diagnosis || norm.diagnosis.final || '';
    if (rawDiagnosis) {
      const lowerDiag = rawDiagnosis.toLowerCase().trim();
      if (COMMON_SPELLING_CORRECTIONS[lowerDiag]) {
        addIssue(
          'PLEASE_VERIFY',
          'Patient Profile',
          'patient-profile',
          'Final / Provisional Diagnosis',
          rawDiagnosis,
          'The entered diagnosis or condition may contain a spelling or terminology formatting issue.',
          COMMON_SPELLING_CORRECTIONS[lowerDiag],
          'Verify diagnosis terminology against original clinical case notes.',
          'field-diagnosis'
        );
      }
    } else {
      addIssue(
        'DOCUMENTATION_GAP',
        'Patient Profile',
        'patient-profile',
        'Diagnosis',
        'Not Documented',
        'Neither a final nor provisional diagnosis has been recorded in the saved profile.',
        'Document the patient\'s primary diagnosis or chief clinical condition.',
        'Enter diagnosis in Patient Profile form.',
        'field-diagnosis'
      );
    }

    // C. Chief Complaints Spelling (Requirement 11)
    const complaints = profile.chief_complaints || '';
    if (complaints) {
      const words = complaints.toLowerCase().split(/\s+/);
      words.forEach(w => {
        const cleanW = w.replace(/[^a-z]/g, '');
        if (COMMON_SPELLING_CORRECTIONS[cleanW] && cleanW !== 'dyspnoea' && cleanW !== 'dyspnea') {
          addIssue(
            'PLEASE_VERIFY',
            'Patient Profile',
            'patient-profile',
            'Chief Complaints / Symptoms',
            w,
            'Possible spelling issue detected in clinical symptom documentation.',
            COMMON_SPELLING_CORRECTIONS[cleanW],
            'Verify symptom spelling against clinical admission notes.'
          );
        }
      });
    }

    // D. Medication List Review (Requirements 6, 7, 8, 9 & Date Checks)
    drugs.forEach((d, idx) => {
      const trade = (d.trade_name || '').replace(/^—$/, '').trim();
      const generic = (d.generic_name || '').replace(/^—$/, '').trim();
      const combined = `${trade} ${generic}`.trim();
      const lowerCombined = combined.toLowerCase();

      // Check dates for Invalid Sequence (Stop Date < Start Date) (Requirement 5A)
      if (d.start_date && d.stop_date && d.start_date !== '—' && d.stop_date !== '—') {
        const startDateObj = new Date(d.start_date);
        const stopDateObj = new Date(d.stop_date);
        if (!isNaN(startDateObj.getTime()) && !isNaN(stopDateObj.getTime()) && stopDateObj < startDateObj) {
          addIssue(
            'CORRECTION_REQUIRED',
            'Patient Profile',
            'patient-profile',
            `Medication #${idx + 1} (${trade || generic}) Dates`,
            `Start: ${d.start_date} • Stop: ${d.stop_date}`,
            'The documented treatment end date occurs earlier than the recorded start date.',
            'Verify the original clinical record and correct the treatment date sequence.',
            'Correct treatment dates in Patient Profile medication log.'
          );
        }
      }

      // Check for Misspelled Medication Name (Requirement 8)
      // Use exact word boundaries so correct spellings like "pantoprazole" do not loosely match "pantoprazol"
      let matchedCorrection = null;
      const tokens = lowerCombined.split(/[\s()/-]+/).filter(Boolean);

      // Check if entry contains a known valid brand or generic (e.g. "ONE ALL LEVOCETRIZ", "PANTOP PANTOPRAZOLE", "TELMA")
      const hasValidBrandOrGeneric = KNOWN_DRUGS.some(k => lowerCombined.includes(k)) || tokens.some(t => 
        KNOWN_DRUGS.includes(t) || 
        KNOWN_DRUG_STEMS.some(stem => t.includes(stem))
      );

      if (!hasValidBrandOrGeneric) {
        tokens.forEach(tok => {
          if (COMMON_SPELLING_CORRECTIONS[tok]) {
            matchedCorrection = COMMON_SPELLING_CORRECTIONS[tok];
          }
        });

        if (matchedCorrection) {
          addIssue(
            'PLEASE_VERIFY',
            'Patient Profile',
            'patient-profile',
            `Medication #${idx + 1} Name`,
            combined,
            'The entered medication name appears to contain a spelling variation.',
            matchedCorrection,
            'Verify medication spelling against prescription/clinical record.'
          );
        } else if (lowerCombined.length > 2 && !lowerCombined.includes('—')) {
          addIssue(
            'PLEASE_VERIFY',
            'Patient Profile',
            'patient-profile',
            `Medication #${idx + 1} Name`,
            combined,
            'The medication name could not be confidently identified in standard drug nomenclature.',
            'No confident correction available. Verify exact spelling against clinical record.',
            'Verify trade and generic names against original prescription.'
          );
        }
      }

      // Missing Dose / Frequency check
      if (!d.dose || d.dose === '—' || d.dose.trim() === '') {
        addIssue(
          'DOCUMENTATION_GAP',
          'Patient Profile',
          'patient-profile',
          `Medication #${idx + 1} (${trade || generic}) Dose`,
          'Not Specified',
          'Dosage strength/unit is not documented for this prescribed medication.',
          'Document exact dose (e.g. 40 mg, 500 mg, 20 mg/mL).',
          'Enter dosage details in Patient Profile.'
        );
      }
    });

    // E. Laboratory Parameter Review (Requirements 13, 14, 15, 16)
    labs.forEach((lab, idx) => {
      const testName = (lab.test_name || '').trim();
      const valStr = (lab.result_value || lab.value || '').trim();
      const unitStr = (lab.unit || '').trim();
      const valNum = parseFloat(valStr);

      // Check test name spelling
      if (testName) {
        const lowerTest = testName.toLowerCase();
        if (COMMON_SPELLING_CORRECTIONS[lowerTest]) {
          addIssue(
            'PLEASE_VERIFY',
            'Patient Profile',
            'patient-profile',
            `Lab Test #${idx + 1} Name`,
            testName,
            'The entered laboratory test name contains a spelling formatting issue.',
            COMMON_SPELLING_CORRECTIONS[lowerTest],
            'Verify lab test name against report.'
          );
        }
      }

      // Check Abnormal Values safely (Requirement 14 & 16: Do NOT flag as error or replace!)
      if (testName.toLowerCase().includes('creatinine') && !isNaN(valNum)) {
        if (valNum > 2.0 || valNum < 0.4) {
          addIssue(
            'PLEASE_VERIFY',
            'Patient Profile',
            'patient-profile',
            'Serum Creatinine',
            `${valStr} ${unitStr}`,
            'The documented Serum Creatinine value appears clinically elevated / abnormal compared with standard reference ranges.',
            'Potentially abnormal value. Verify value and unit against the original laboratory report.',
            'Confirm numerical value and unit from physical lab sheet.'
          );
        }
      }

      if ((testName.toLowerCase().includes('hemoglobin') || testName.toLowerCase().includes('hb')) && !isNaN(valNum)) {
        if (valNum < 8.0 || valNum > 18.0) {
          addIssue(
            'PLEASE_VERIFY',
            'Patient Profile',
            'patient-profile',
            'Hemoglobin (Hb)',
            `${valStr} ${unitStr}`,
            'The documented Hemoglobin value is outside typical physiological baseline ranges.',
            'Potentially abnormal value. Verify value and unit against the original laboratory report.',
            'Confirm numerical value and unit from physical lab sheet.'
          );
        }
      }

      // Missing Unit check
      if (valStr && (!unitStr || unitStr === '—' || unitStr === '')) {
        addIssue(
          'PLEASE_VERIFY',
          'Patient Profile',
          'patient-profile',
          `Lab Test #${idx + 1} (${testName}) Unit`,
          `Value: ${valStr}`,
          'Laboratory result value is documented without a measurement unit.',
          'Verify and specify the unit (e.g. mg/dL, g/dL, mEq/L) against original lab report.',
          'Add measurement unit in Patient Profile lab table.'
        );
      }
    });
  }

  // ==========================================
  // 2. PATIENT COUNSELLING DOCUMENTATION REVIEW
  // ==========================================
  if (isCounsellingSaved) {
    const counselling = caseModulesData?.counselling || {};
    if (!counselling.special_instructions && !counselling.adherence_advice && !counselling.counselling_points) {
      addIssue(
        'DOCUMENTATION_GAP',
        'Patient Counselling',
        'patient-counselling',
        'Counselling Details',
        'Blank / Unspecified',
        'Patient Counselling form is saved but key counselling points or administration instructions are empty.',
        'Document medication administration, lifestyle modification, or adherence advice provided to the patient.',
        'Enter counselling points in Patient Counselling form.'
      );
    }
  }

  // ==========================================
  // 3. PHARMACIST INTERVENTION DOCUMENTATION REVIEW
  // ==========================================
  if (isInterventionSaved) {
    const intervention = caseModulesData?.intervention || {};
    if (!intervention.recommendation && !intervention.outcome && !intervention.intervention_type) {
      addIssue(
        'DOCUMENTATION_GAP',
        'Pharmacist Intervention',
        'pharmacist-intervention',
        'Intervention Details',
        'Blank / Unspecified',
        'Pharmacist Intervention form is saved but recommendation or outcome rationale is not documented.',
        'Document intervention category, clinical rationale, and physician/preceptor outcome.',
        'Fill intervention details in Pharmacist Intervention form.'
      );
    }
  }

  // ==========================================
  // 4. DRUG INFORMATION REQUEST DOCUMENTATION REVIEW
  // ==========================================
  if (isDirSaved) {
    const dir = caseModulesData?.dir || {};
    if (!dir.response_text || dir.response_text.trim() === '') {
      addIssue(
        'DOCUMENTATION_GAP',
        'Drug Information Request',
        'drug-info-request',
        'DIR Response / References',
        'Blank / Unspecified',
        'Drug Information Request form is saved but response text or authoritative references are missing.',
        'Provide evidence-based DIR response and cite authoritative references (e.g. BNF, Micromedex, SmPC).',
        'Complete DIR response field.'
      );
    }
  }

  // ==========================================
  // 5. ADR DOCUMENTATION LOG REVIEW
  // ==========================================
  if (isAdrSaved) {
    const adr = caseModulesData?.adr || {};
    if (!adr.reaction_title || adr.reaction_title.trim() === '' || adr.reaction_title === 'N/A') {
      addIssue(
        'DOCUMENTATION_GAP',
        'ADR Documentation Log',
        'adr-documentation',
        'Reaction Title',
        'Blank / Unspecified',
        'ADR documentation form is saved but adverse reaction title is missing.',
        'Specify the documented adverse drug reaction title (e.g. Maculopapular rash, Dry cough).',
        'Enter reaction title in ADR form.'
      );
    }
  }

  return issues;
};

export const StudentDocReviewView = ({ student, onNavigate, onOpenPatientProfile, onOpenPatientCounselling, onOpenPharmacistIntervention, onOpenDrugInformationRequest, onOpenADRDocumentation }) => {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [loadingCases, setLoadingCases] = useState(true);
  const [modulesData, setModulesData] = useState(null);
  const [loadingModules, setLoadingModules] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  // Load cases for student
  useEffect(() => {
    const loadCases = async () => {
      if (!student?.id) {
        setLoadingCases(false);
        return;
      }
      setLoadingCases(true);
      const res = await fetchStudentCasesFromSupabase(student.id);
      if (res.success && Array.isArray(res.data)) {
        setCases(res.data);
        if (res.data.length > 0) {
          setSelectedCaseId(res.data[0].id || '');
        }
      }
      setLoadingCases(false);
    };

    loadCases();
  }, [student?.id]);

  // Load case module records when selectedCaseId changes
  const loadCaseModules = async (caseId) => {
    if (!caseId) return;
    setLoadingModules(true);
    const res = await fetchCaseModuleStatusesFromSupabase(caseId);
    if (res.success) {
      setModulesData(res.records);
    } else {
      setModulesData(null);
    }
    setLoadingModules(false);
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseModules(selectedCaseId);
    }
  }, [selectedCaseId]);

  const selectedCase = cases.find(c => String(c.id) === String(selectedCaseId)) || cases[0];

  const profileRecord = modulesData?.profile || {};
  const counsellingRecord = modulesData?.counselling || {};
  const interventionRecord = modulesData?.intervention || {};
  const dirRecord = modulesData?.dir || {};
  const adrRecord = modulesData?.adr || {};

  const isProfileSaved = checkIsFormSaved(profileRecord, 'profile');
  const isCounsellingSaved = checkIsFormSaved(counsellingRecord, 'counselling');
  const isInterventionSaved = checkIsFormSaved(interventionRecord, 'intervention');
  const isDirSaved = checkIsFormSaved(dirRecord, 'dir');
  const isAdrSaved = checkIsFormSaved(adrRecord, 'adr');

  const savedCount = [
    isProfileSaved,
    isCounsellingSaved,
    isInterventionSaved,
    isDirSaved,
    isAdrSaved
  ].filter(Boolean).length;

  const norm = buildNormalizedApprovedCaseData({
    clinicalCase: selectedCase || {},
    student,
    caseModulesData: {
      profile: isProfileSaved ? profileRecord : {},
      counselling: isCounsellingSaved ? counsellingRecord : {},
      intervention: isInterventionSaved ? interventionRecord : {},
      dir: isDirSaved ? dirRecord : {},
      adr: isAdrSaved ? adrRecord : {},
      vitals: isProfileSaved ? (modulesData?.vitals || []) : [],
      labs: isProfileSaved ? (modulesData?.labs || []) : [],
      drugs: isProfileSaved ? (modulesData?.drugs || []) : []
    }
  });

  // Evaluate Pre-Submission Review Issues
  const allIssues = generatePreSubmissionReview(norm, modulesData);

  const correctionCount = allIssues.filter(i => i.category === 'CORRECTION_REQUIRED').length;
  const verifyCount = allIssues.filter(i => i.category === 'PLEASE_VERIFY').length;
  const gapCount = allIssues.filter(i => i.category === 'DOCUMENTATION_GAP').length;

  const filteredIssues = allIssues.filter(issue => {
    if (activeCategoryFilter === 'CORRECTION_REQUIRED') return issue.category === 'CORRECTION_REQUIRED';
    if (activeCategoryFilter === 'PLEASE_VERIFY') return issue.category === 'PLEASE_VERIFY';
    if (activeCategoryFilter === 'DOCUMENTATION_GAP') return issue.category === 'DOCUMENTATION_GAP';
    return true;
  });

  const handleReviewFieldClick = (issueObj) => {
    const formTab = typeof issueObj === 'string' ? issueObj : issueObj.formTab;
    const targetFieldId = typeof issueObj === 'object' ? issueObj.targetFieldId : '';

    if (formTab === 'patient-profile' && onOpenPatientProfile && selectedCase) {
      onOpenPatientProfile(selectedCase, targetFieldId);
    } else if (formTab === 'patient-counselling' && onOpenPatientCounselling && selectedCase) {
      onOpenPatientCounselling(selectedCase, targetFieldId);
    } else if (formTab === 'pharmacist-intervention' && onOpenPharmacistIntervention && selectedCase) {
      onOpenPharmacistIntervention(selectedCase, targetFieldId);
    } else if (formTab === 'drug-info-request' && onOpenDrugInformationRequest && selectedCase) {
      onOpenDrugInformationRequest(selectedCase, targetFieldId);
    } else if (formTab === 'adr-documentation' && onOpenADRDocumentation && selectedCase) {
      onOpenADRDocumentation(selectedCase, targetFieldId);
    } else if (onNavigate) {
      onNavigate(formTab, 'All', selectedCaseId);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 min-w-0 w-full text-wrap break-words">
      
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-w-0 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <FileSearch className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Pre-Submission Clinical Documentation Review</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                Self-Review & Quality Assistance
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
              Identify documentation mistakes, spelling/terminology issues, missing information, and inconsistencies before final submission.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => loadCaseModules(selectedCaseId)}
            disabled={loadingModules || !selectedCaseId}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingModules ? 'animate-spin' : ''}`} />
            <span>Re-Run Review</span>
          </button>
        </div>
      </div>

      {/* STUDENT-FACING DISCLAIMER (REQUIREMENT 32) */}
      <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/80 flex items-start gap-3 shadow-xs min-w-0 w-full">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 dark:text-blue-200 font-medium leading-relaxed break-words">
          AI review identifies possible documentation issues and likely corrections where confidently recognized. Verify all suggestions against the original clinical record. AI does not automatically modify your documentation.
        </p>
      </div>

      {/* LOADING CASES STATE */}
      {loadingCases ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading student clinical cases for pre-submission review...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Clinical Cases Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Create a case and save clinical documentation to perform a Pre-Submission Review.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 min-w-0 w-full">
          {/* CASE SELECTOR */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 min-w-0 w-full">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Clinical Case to Review:
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_id || `Case #${c.id}`} — {c.patient_name || 'Patient'} ({c.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* SAVED FORM STATUS GRID */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                SAVED FORM STATUS ({savedCount}/5 Saved & Reviewed)
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                Only saved and persisted form data is included in review.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isProfileSaved ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 1</span>
                  {isProfileSaved ? <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Patient Profile</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isProfileSaved ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {isProfileSaved ? '✓ Saved & Reviewed' : '✕ Not Saved'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isCounsellingSaved ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 2</span>
                  {isCounsellingSaved ? <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Counselling</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isCounsellingSaved ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {isCounsellingSaved ? '✓ Saved & Reviewed' : '✕ Not Saved'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isInterventionSaved ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 3</span>
                  {isInterventionSaved ? <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Intervention</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isInterventionSaved ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {isInterventionSaved ? '✓ Saved & Reviewed' : '✕ Not Saved'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isDirSaved ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 4</span>
                  {isDirSaved ? <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Drug Information</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isDirSaved ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {isDirSaved ? '✓ Saved & Reviewed' : '✕ Not Saved'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isAdrSaved ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 5</span>
                  {isAdrSaved ? <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">ADR Documentation</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isAdrSaved ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {isAdrSaved ? '✓ Saved & Reviewed' : '✕ Not Saved'}
                </p>
              </div>
            </div>
          </div>

          {/* IF NO SAVED FORMS AVAILABLE */}
          {savedCount === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                No Saved Clinical Documentation Available for Review
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                This case currently has no saved forms. Complete and save at least one clinical documentation form to generate pre-submission review notes.
              </p>
            </div>
          ) : (
            <div className="space-y-6 min-w-0 w-full">
              
              {/* REVIEW SUMMARY BAR (REQUIREMENT 4) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      PRE-SUBMISSION REVIEW SUMMARY
                    </h3>
                  </div>

                  {/* DYNAMIC CATEGORY COUNTS (REQUIREMENT 4) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveCategoryFilter('ALL')}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${activeCategoryFilter === 'ALL' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                      All Issues ({allIssues.length})
                    </button>

                    <button
                      onClick={() => setActiveCategoryFilter('CORRECTION_REQUIRED')}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${activeCategoryFilter === 'CORRECTION_REQUIRED' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'}`}
                    >
                      🔴 {correctionCount} Correction Required
                    </button>

                    <button
                      onClick={() => setActiveCategoryFilter('PLEASE_VERIFY')}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${activeCategoryFilter === 'PLEASE_VERIFY' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'}`}
                    >
                      🟠 {verifyCount} Verify
                    </button>

                    <button
                      onClick={() => setActiveCategoryFilter('DOCUMENTATION_GAP')}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${activeCategoryFilter === 'DOCUMENTATION_GAP' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'}`}
                    >
                      🔵 {gapCount} Documentation Gaps
                    </button>
                  </div>
                </div>

                {allIssues.length === 0 ? (
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Great job! No obvious spelling errors, formatting conflicts, date sequence issues, or critical documentation gaps were detected in your saved forms.</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review the message notes below. Verify each item against your original clinical record and manually edit the original form if needed before final submission.
                  </p>
                )}
              </div>

              {/* MESSAGE NOTES LIST (REQUIREMENT 3 & 25) */}
              <div className="space-y-4 min-w-0 w-full">
                {filteredIssues.map((issue) => {
                  const isCorrection = issue.category === 'CORRECTION_REQUIRED';
                  const isVerify = issue.category === 'PLEASE_VERIFY';
                  const isGap = issue.category === 'DOCUMENTATION_GAP';

                  let cardStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';
                  let badgeStyle = 'bg-slate-100 text-slate-800';
                  let categoryLabel = 'NOTE';

                  if (isCorrection) {
                    cardStyle = 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60';
                    badgeStyle = 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
                    categoryLabel = '🔴 CORRECTION REQUIRED';
                  } else if (isVerify) {
                    cardStyle = 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60';
                    badgeStyle = 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
                    categoryLabel = '🟠 PLEASE VERIFY';
                  } else if (isGap) {
                    cardStyle = 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60';
                    badgeStyle = 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800';
                    categoryLabel = '🔵 DOCUMENTATION GAP';
                  }

                  return (
                    <div
                      key={issue.id}
                      className={`p-5 rounded-2xl border shadow-xs space-y-3.5 leading-relaxed min-w-0 w-full transition-all ${cardStyle}`}
                    >
                      {/* HEADER LINE */}
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${badgeStyle}`}>
                            {categoryLabel}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            Form: {issue.formModule}
                          </span>
                        </div>

                        {/* REVIEW FIELD ACTION BUTTON (REQUIREMENT 25) */}
                        <button
                          onClick={() => handleReviewFieldClick(issue)}
                          className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <span>Review Field</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* FIELD & ENTERED VALUE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Field</span>
                          <strong className="text-slate-900 dark:text-white font-extrabold text-xs block mt-0.5">
                            {issue.fieldName}
                          </strong>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Entered Data / Value</span>
                          <span className="text-slate-800 dark:text-slate-200 font-mono text-xs block mt-0.5 break-words">
                            {issue.enteredValue}
                          </span>
                        </div>
                      </div>

                      {/* ISSUE OBSERVATION */}
                      <div className="space-y-1 text-xs">
                        <strong className="text-slate-900 dark:text-white font-bold block">Issue / Observation:</strong>
                        <p className="text-slate-700 dark:text-slate-300 break-words leading-relaxed">
                          {issue.issue}
                        </p>
                      </div>

                      {/* SUGGESTED CORRECTION & ACTION */}
                      <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                        <p className="text-slate-900 dark:text-white font-bold break-words">
                          <strong>Suggested Correction / Benchmark:</strong>{' '}
                          <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                            {issue.suggestion}
                          </span>
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                          <strong>Recommended Action:</strong> {issue.actionText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};
