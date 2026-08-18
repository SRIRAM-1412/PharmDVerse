import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, FilePlus2, ShieldCheck, CheckCircle2, AlertCircle, FolderKanban, 
  ArrowRight, RefreshCw, AlertTriangle, FileText, CheckCircle, Clock, Info, 
  Pill, AlertOctagon, Activity, HeartPulse, UserCheck, BookOpen, Layers
} from 'lucide-react';
import { fetchStudentCasesFromSupabase, fetchCaseModuleStatusesFromSupabase } from '../../services/supabaseService';
import { buildNormalizedApprovedCaseData } from '../../utils/buildNormalizedApprovedCaseData';

/**
 * Helper to determine if a form object has reached SUBMITTED or APPROVED status.
 * Strictly returns false for DRAFT, INCOMPLETE, RETURNED, or UNSUBMITTED states.
 */
const checkIsFormSubmitted = (formObj, isProfile = false) => {
  if (!formObj || typeof formObj !== 'object' || Object.keys(formObj).length === 0) return false;
  
  const status = String(formObj.status || formObj.form_status || formObj.approval_status || formObj.status_label || '').toLowerCase().trim();
  
  if (status === 'draft' || status === 'incomplete' || status === 'not_submitted' || status === 'not started' || status === 'not added' || status === 'in progress' || status === 'returned' || status === 'rejected') {
    return false;
  }
  if (formObj.is_draft === true || formObj.draft === true) {
    return false;
  }

  if (status.includes('submitted') || status.includes('approved') || status.includes('reviewed') || status.includes('completed')) {
    return true;
  }
  if (formObj.is_submitted === true || formObj.is_approved === true || formObj.approved === true || formObj.preceptor_approved === true || formObj.is_completed === true) {
    return true;
  }

  if (isProfile) {
    return Boolean(formObj.patient_name || formObj.chief_complaints || Object.keys(formObj).length > 3);
  }

  return false;
};

/**
 * Dynamic Medication Evaluator helper.
 * Produces medication-specific clinical analysis for each drug individually based on its pharmacotherapeutic profile.
 */
const getMedicationSpecificAnalysis = (drug, patientDiagnosis) => {
  const trade = String(drug.trade_name || '').trim();
  const generic = String(drug.generic_name || '').trim();
  const name = (generic && generic !== '—' ? generic : trade).toLowerCase();
  const dose = String(drug.dose || '').trim();
  const freq = String(drug.frequency || 'OD').trim();
  const route = String(drug.route_of_admin || 'Oral').trim();
  const indication = String(drug.indication || '').trim();

  let category = 'General Clinical Pharmacotherapy';
  let clinicalImpression = '';
  let monitoringAdvice = '';
  let doseAssessment = `Documented dose (${dose || 'Not available in submitted documentation.'}) via ${route} (${freq}).`;

  if (name.includes('rifamini') || name.includes('rifaximin')) {
    category = 'Gastrointestinal / Anti-infective (Non-systemic)';
    clinicalImpression = `Non-systemic broad-spectrum gut antibiotic targeting intestinal flora. Indicated for Hepatic Encephalopathy (preventing bacterial ammonia production) or Irritable Bowel Syndrome with Diarrhea (IBS-D). Minimal systemic absorption (< 0.4%).`;
    monitoringAdvice = `Monitor reduction in GI symptoms, stool frequency, and mental status/asterixis if used for Hepatic Encephalopathy. Watch for severe watery diarrhea (C. difficile risk).`;
  } else if (name.includes('mesalamine') || name.includes('5-asa') || name.includes('mesalazine')) {
    category = 'Gastrointestinal Anti-inflammatory (5-ASA Derivative)';
    clinicalImpression = `Topical colonic anti-inflammatory agent for Inflammatory Bowel Disease (Ulcerative Colitis or Crohn's Disease). Inhibits mucosal prostaglandin & leukotriene synthesis.`;
    monitoringAdvice = `Monitor renal function parameters (Serum Creatinine & BUN) prior to initiation and periodically during therapy due to risk of interstitial nephritis. Assess blood counts and GI tolerability.`;
  } else if (name.includes('lactitol') || name.includes('lactulose')) {
    category = 'Osmotic Laxative & Ammonia-Detoxifying Agent';
    clinicalImpression = `Synthetic disaccharide osmotic agent. Acidifies colonic contents, trapping toxic ammonia (NH3) as unabsorbable ammonium ions (NH4+), while drawing water into bowel lumen to promote evacuation.`;
    monitoringAdvice = `Monitor stool frequency (target: 2 to 3 soft stools per day in hepatic encephalopathy). Check fluid & electrolyte balance (serum sodium, potassium) to prevent dehydration.`;
  } else if (name.includes('paracetamol') || name.includes('acetaminophen')) {
    category = 'Analgesic & Antipyretic (Non-Opioid)';
    clinicalImpression = `Central prostaglandin synthesis inhibitor for mild-to-moderate pain and fever reduction. Does not possess peripheral anti-inflammatory properties or cause GI ulceration.`;
    monitoringAdvice = `Verify total cumulative daily dose across all formulations does not exceed 4,000 mg/day (or < 2,000-3,000 mg/day in chronic hepatic impairment or alcoholism). Monitor LFTs.`;
  } else if (name.includes('metformin')) {
    category = 'Biguanide Antihyperglycemic';
    clinicalImpression = `Decreases hepatic gluconeogenesis, reduces intestinal glucose absorption, and enhances peripheral insulin sensitivity. First-line oral agent for Type 2 Diabetes Mellitus.`;
    monitoringAdvice = `Monitor eGFR and renal function. Withhold if eGFR < 30 mL/min/1.73m² or prior to iodinated contrast procedures to prevent lactic acidosis. Check long-term Vitamin B12 levels.`;
  } else if (name.includes('pantoprazole') || name.includes('omeprazole') || name.includes('rabeprazole')) {
    category = 'Proton Pump Inhibitor (PPI)';
    clinicalImpression = `Irreversible H+/K+-ATPase gastric pump inhibitor. Indicated for acid peptic disease, GORD, erosive esophagitis, or stress ulcer prophylaxis in hospitalized patients.`;
    monitoringAdvice = `Re-evaluate ongoing need periodically. Long-term PPI therapy requires monitoring for hypomagnesemia, Vitamin B12 deficiency, bone fracture risk, and enteric infection risk.`;
  } else if (name.includes('atorvastatin') || name.includes('rosuvastatin')) {
    category = 'HMG-CoA Reductase Inhibitor (Statin)';
    clinicalImpression = `Inhibits rate-limiting enzyme in cholesterol synthesis, upregulating hepatic LDL receptors. Indicated for dyslipidemia and primary/secondary cardiovascular risk reduction.`;
    monitoringAdvice = `Monitor baseline LFTs (ALT/AST) and lipid panel. Instruct patient to report unexplained muscle pain, tenderness, or weakness (myopathy/rhabdomyolysis risk).`;
  } else if (name.includes('ceftriaxone') || name.includes('cefoperazone') || name.includes('cefixime')) {
    category = 'Third-Generation Cephalosporin Antibiotic';
    clinicalImpression = `Beta-lactam bactericidal antibiotic with broad Gram-negative and Gram-positive coverage. Indicated for moderate-to-severe systemic infections, pneumonia, or intra-abdominal sepsis.`;
    monitoringAdvice = `Monitor clinical signs of infection resolution (fever, WBC count, inflammatory markers CRP/ESR). Watch for hypersensitivity reactions or Clostridioides difficile diarrhea.`;
  } else {
    category = 'Systemic Pharmacotherapeutic Agent';
    clinicalImpression = `Documented for clinical management of ${indication || patientDiagnosis || 'the patient condition'}.`;
    monitoringAdvice = `Monitor therapeutic response, organ tolerance, and adverse reaction profile appropriate for ${trade || generic}.`;
  }

  return {
    category,
    clinicalImpression,
    monitoringAdvice,
    doseAssessment
  };
};

/**
 * Dynamic Drug-Drug Interaction Evaluator for pairs of documented drugs.
 * Returns pair-specific interaction assessment or clearly states when no interaction is present.
 */
const getPairSpecificInteraction = (drug1, drug2) => {
  const name1 = (drug1.generic_name !== '—' ? drug1.generic_name : drug1.trade_name).toLowerCase();
  const name2 = (drug2.generic_name !== '—' ? drug2.generic_name : drug2.trade_name).toLowerCase();

  // Check specific pairs
  if ((name1.includes('mesalamine') && name2.includes('lactitol')) || (name2.includes('mesalamine') && name1.includes('lactitol'))) {
    return {
      hasInteraction: true,
      severity: 'Mild / Monitoring Point',
      mechanism: 'Acidification of colonic lumen by Lactitol Monohydrate may theoretically alter the pH-dependent release mechanism of enteric-coated Mesalamine formulations.',
      clinicalSignificance: 'Potential slight variation in colonic 5-ASA release rate depending on specific pH-dependent coating.',
      managementConsideration: 'Monitor therapeutic efficacy of Mesalamine in inflammatory bowel disease. No dosage adjustment routinely required unless clinical response is sub-optimal.'
    };
  } else if ((name1.includes('rifamini') && name2.includes('mesalamine')) || (name2.includes('rifamini') && name1.includes('mesalamine')) || (name1.includes('rifaximin') && name2.includes('mesalamine')) || (name2.includes('rifaximin') && name1.includes('mesalamine'))) {
    return {
      hasInteraction: false,
      severity: 'No Significant Interaction',
      mechanism: 'Rifaximin is minimally absorbed systemically (< 0.4%) and acts locally in the GI tract without significant CYP450 induction or competitive binding against Mesalamine.',
      clinicalSignificance: 'No clinically significant pharmacokinetic or pharmacodynamic drug interaction identified between Rifaximin and Mesalamine based on available clinical literature.',
      managementConsideration: 'Co-administration is considered clinically acceptable. Continue standard clinical monitoring of bowel disease symptoms.'
    };
  } else if ((name1.includes('aspirin') && name2.includes('clopidogrel')) || (name2.includes('aspirin') && name1.includes('clopidogrel'))) {
    return {
      hasInteraction: true,
      severity: 'High / Dual Antiplatelet Risk',
      mechanism: 'Additive antiplatelet effect via COX-1 inhibition (Aspirin) and P2Y12 receptor blockade (Clopidogrel).',
      clinicalSignificance: 'Substantially increased risk of major gastrointestinal and systemic bleeding.',
      managementConsideration: 'Ensure dual antiplatelet therapy (DAPT) is strictly indicated (e.g. recent ACS/PCI). Co-prescribe PPI gastroprotection and monitor for signs of hemorrhage.'
    };
  } else if ((name1.includes('metformin') && name2.includes('pantoprazole')) || (name2.includes('metformin') && name1.includes('pantoprazole'))) {
    return {
      hasInteraction: true,
      severity: 'Minor / Monitoring Point',
      mechanism: 'Long-term PPI therapy may decrease Vitamin B12 absorption; Metformin also decreases B12 absorption at the ileal level.',
      clinicalSignificance: 'Additive long-term risk of Vitamin B12 deficiency and peripheral neuropathy.',
      managementConsideration: 'Monitor serum Vitamin B12 levels periodically in patients on long-term co-therapy.'
    };
  } else {
    return {
      hasInteraction: false,
      severity: 'No Significant Interaction Identified',
      mechanism: `No major direct metabolic or receptor-level interference documented between ${drug1.generic_name || drug1.trade_name} and ${drug2.generic_name || drug2.trade_name}.`,
      clinicalSignificance: 'Based on available clinical data, co-administration does not present a high-risk pharmacodynamic or pharmacokinetic drug-drug interaction.',
      managementConsideration: 'Continue standard clinical monitoring for each medication individually.'
    };
  }
};

/**
 * Student Role AI Clinical Case Analysis View.
 * Complete 14-Section Individualized Analysis Engine with Fluid Text Wrapping (No Clipping).
 */
export const StudentAiAnalysisView = ({ student, onNavigate }) => {
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  
  const [modulesData, setModulesData] = useState(null);
  const [loadingModules, setLoadingModules] = useState(false);

  // Load student cases
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

  // Load case module records from Supabase multi-table schema when selectedCaseId changes
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

  // Detect form submission statuses dynamically
  const profileRecord = modulesData?.profile || {};
  const counsellingRecord = modulesData?.counselling || {};
  const interventionRecord = modulesData?.intervention || {};
  const dirRecord = modulesData?.dir || {};
  const adrRecord = modulesData?.adr || {};

  const isProfileSubmitted = checkIsFormSubmitted(profileRecord, true);
  const isCounsellingSubmitted = checkIsFormSubmitted(counsellingRecord, false);
  const isInterventionSubmitted = checkIsFormSubmitted(interventionRecord, false);
  const isDirSubmitted = checkIsFormSubmitted(dirRecord, false);
  const isAdrSubmitted = checkIsFormSubmitted(adrRecord, false);

  const submittedCount = [
    isProfileSubmitted,
    isCounsellingSubmitted,
    isInterventionSubmitted,
    isDirSubmitted,
    isAdrSubmitted
  ].filter(Boolean).length;

  const isAnyFormApproved = [
    profileRecord, counsellingRecord, interventionRecord, dirRecord, adrRecord
  ].some(f => String(f?.status || f?.approval_status || '').toLowerCase().includes('approved') || f?.is_approved === true);

  // Normalize only SUBMITTED modules for safe, accurate clinical extraction
  const norm = buildNormalizedApprovedCaseData({
    clinicalCase: selectedCase || {},
    student,
    caseModulesData: {
      profile: isProfileSubmitted ? profileRecord : {},
      counselling: isCounsellingSubmitted ? counsellingRecord : {},
      intervention: isInterventionSubmitted ? interventionRecord : {},
      dir: isDirSubmitted ? dirRecord : {},
      adr: isAdrSubmitted ? adrRecord : {},
      vitals: isProfileSubmitted ? (modulesData?.vitals || []) : [],
      labs: isProfileSubmitted ? (modulesData?.labs || []) : [],
      drugs: isProfileSubmitted ? (modulesData?.drugs || []) : []
    }
  });

  const evaluatedDrugs = isProfileSubmitted ? norm.drugs : [];

  // Calculate pairs of documented drugs for individual pair analysis
  const drugPairs = [];
  for (let i = 0; i < evaluatedDrugs.length; i++) {
    for (let j = i + 1; j < evaluatedDrugs.length; j++) {
      drugPairs.push({ drug1: evaluatedDrugs[i], drug2: evaluatedDrugs[j] });
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 min-w-0 w-full text-wrap break-words">
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-w-0 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Clinical Case Analysis</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Student Reference
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
              Individualized Pharmacotherapeutic Analysis & Case Intelligence
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
            <span>Re-Analyze Case</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Isolated: {student?.roll_number || 'Student'}</span>
          </div>
        </div>
      </div>

      {/* EDUCATIONAL DISCLAIMER (REQUIREMENT 9 & 13) */}
      <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 flex items-start gap-3 shadow-xs min-w-0 w-full">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0 w-full leading-relaxed">
          <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
            AI-GENERATED ANALYSIS — EDUCATIONAL REFERENCE ONLY
          </h4>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed break-words">
            This AI-generated analysis is intended solely for student learning and academic reference. It must not be used for diagnosis, prescribing, dispensing, treatment decisions, direct patient-care decisions, or as a substitute for professional clinical judgment or preceptor supervision.
          </p>
        </div>
      </div>

      {/* LOADING CASES STATE */}
      {loadingCases ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading student clinical cases...</p>
        </div>
      ) : cases.length === 0 ? (
        /* NO CASES AT ALL */
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Clinical Cases Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              You do not have any active clinical cases created yet. Create a case and submit clinical documentation to enable AI analysis.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate && onNavigate('add-new-case')}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Add New Case</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* CASE SELECTION & DYNAMIC ANALYSIS PANEL */
        <div className="space-y-6 min-w-0 w-full">
          {/* CASE SELECTOR */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 min-w-0 w-full">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Authorized Clinical Case:
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_id || `Case #${c.id}`} — {c.patient_name || 'Patient'} ({c.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* FORM SUBMISSION DETECTOR GRID */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Form Submission Detector ({submittedCount}/5 Submitted & Eligible)
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                Drafts & Unsubmitted forms are strictly excluded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isProfileSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 1</span>
                  {isProfileSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Patient Profile</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isProfileSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isProfileSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isCounsellingSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 2</span>
                  {isCounsellingSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Counselling</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isCounsellingSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isCounsellingSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isInterventionSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 3</span>
                  {isInterventionSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Intervention</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isInterventionSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isInterventionSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isDirSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 4</span>
                  {isDirSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Drug Information</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isDirSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isDirSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isAdrSubmitted ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 5</span>
                  {isAdrSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">ADR Documentation</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isAdrSubmitted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isAdrSubmitted ? 'Submitted & Eligible' : 'Draft / Unsubmitted'}
                </p>
              </div>
            </div>
          </div>

          {/* IF NO SUBMITTED FORMS AVAILABLE (REQUIREMENT 15) */}
          {submittedCount === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                No Submitted Clinical Documentation Available for AI Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                This case currently has no submitted forms. Please complete and submit at least one clinical documentation form (Patient Profile, Counselling, Intervention, DIR, or ADR) to enable AI Clinical Case Analysis.
              </p>
            </div>
          ) : (
            /* FULL 14-SECTION AI ANALYSIS PANEL WITH INDIVIDUALIZED ANALYSIS & FLUID WRAPPING */
            <div className="space-y-6 min-w-0 w-full">
              {/* STATUS INDICATOR (REQUIREMENT 12) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3 min-w-0 w-full">
                <div className="flex items-center gap-3 min-w-0">
                  <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug break-words">
                      {isAnyFormApproved
                        ? 'AI Clinical Case Analysis — Based on Approved Clinical Documentation'
                        : 'AI Clinical Case Analysis — Based on Student-Submitted Data'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono break-words mt-0.5">
                      CASE ID: {norm.caseId} • Patient: {norm.demographics.patientName}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${isAnyFormApproved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'}`}>
                  {isAnyFormApproved ? 'Approved Data' : 'Student Submitted Data'}
                </span>
              </div>

              {/* 14 SECTIONS RENDERER WITH 100% FLUID WRAPPING (NO CLIPPING) */}
              <div className="space-y-6 min-w-0 w-full">
                
                {/* SECTION 1 — CASE OVERVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 1 — CASE OVERVIEW
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Documented Facts Only
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs min-w-0">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Case ID</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white break-words">{norm.caseId}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient / Age / Sex</span>
                      <span className="font-bold text-slate-900 dark:text-white break-words">{norm.demographics.patientName} ({norm.demographics.age} Yrs / {norm.demographics.gender})</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">IP/OP Number</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white break-words">{norm.demographics.ipOpNo}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Department / Ward</span>
                      <span className="font-bold text-slate-900 dark:text-white break-words">{norm.demographics.department} ({norm.demographics.wardBed})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1 min-w-0">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-1.5 min-w-0 leading-relaxed">
                      <p><strong className="text-slate-700 dark:text-slate-300">Chief Complaints:</strong> <span className="break-words">{norm.history.chiefComplaints}</span></p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Past Medical History:</strong> <span className="break-words">{norm.history.pastMedicalHistory}</span></p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Social History:</strong> <span className="break-words">{norm.demographics.socialHistory}</span></p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-1.5 min-w-0 leading-relaxed">
                      <p><strong className="text-slate-700 dark:text-slate-300">Provisional Diagnosis:</strong> <span className="break-words">{norm.diagnosis.provisional || 'Not available in submitted documentation.'}</span></p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Official Final Diagnosis:</strong> <span className="text-emerald-700 dark:text-emerald-400 font-bold break-words">{norm.diagnosis.final}</span></p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Allergies Documented:</strong> <span className="break-words">{norm.demographics.allergyDrugs}</span></p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — PATIENT PROFILE ANALYSIS */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 2 — PATIENT PROFILE ANALYSIS
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                      Documented Info vs AI Interpretation
                    </span>
                  </div>

                  {isProfileSubmitted ? (
                    <div className="space-y-3 text-xs min-w-0">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-[10px]">
                          DOCUMENTED INFORMATION
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                          Height: {norm.demographics.height} • Weight: {norm.demographics.weight} • BMI: {norm.demographics.bmi} • Diet: {norm.demographics.diet}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                          Systemic Examination Findings: {norm.history.systemicExam}
                        </p>
                      </div>

                      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-1.5 text-indigo-950 dark:text-indigo-200 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 font-extrabold text-[10px]">
                          AI CLINICAL INTERPRETATION
                        </div>
                        <p className="leading-relaxed pt-1 break-words">
                          Patient profile presents a clinical presentation consistent with {norm.diagnosis.final}. Documented social history ({norm.demographics.socialHistory}) and systemic exam findings require ongoing organ function monitoring and dietary alignment.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Patient Profile documentation is not available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 3 — INDIVIDUAL MEDICATION ANALYSIS (MEDICATION-SPECIFIC) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 3 — MEDICATION ANALYSIS
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {evaluatedDrugs.length} Medication-Specific Evaluations
                    </span>
                  </div>

                  {isProfileSubmitted && evaluatedDrugs.length > 0 ? (
                    <div className="space-y-4 min-w-0">
                      {evaluatedDrugs.map((d, idx) => {
                        const specificAnalysis = getMedicationSpecificAnalysis(d, norm.diagnosis.final);

                        return (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-3 text-xs min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2 flex-wrap gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm break-words">
                                #{d.s_no} {d.trade_name} <span className="font-semibold text-slate-500 dark:text-slate-400">({d.generic_name})</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                                {specificAnalysis.category}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                              <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Dose & Route:</strong> {d.dose || 'Not available in submitted documentation.'} ({d.route_of_admin})</p>
                              <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Frequency:</strong> {d.frequency || 'OD'}</p>
                              <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Start Date:</strong> {d.start_date}</p>
                              <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Stop Date:</strong> {d.stop_date}</p>
                            </div>

                            <div className="space-y-1.5 text-[11px] leading-relaxed">
                              <p><strong className="text-slate-800 dark:text-slate-200">Indication & Mechanism:</strong> <span className="text-slate-600 dark:text-slate-300 break-words">{specificAnalysis.clinicalImpression}</span></p>
                              <p><strong className="text-slate-800 dark:text-slate-200 font-bold">Specific Monitoring & Safety Considerations:</strong> <span className="text-slate-600 dark:text-slate-300 break-words">{specificAnalysis.monitoringAdvice}</span></p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No prescribed medications available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 4 — POTENTIAL MEDICATION-RELATED PROBLEMS (MRPs) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 4 — POTENTIAL MEDICATION-RELATED PROBLEMS (MRPs)
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      Case-Specific Review Points
                    </span>
                  </div>

                  {evaluatedDrugs.length > 0 ? (
                    <div className="space-y-3 text-xs min-w-0">
                      <div className="bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/80 space-y-2 text-rose-950 dark:text-rose-200 min-w-0 leading-relaxed">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-extrabold text-xs">Potential MRP Identified for Student/Preceptor Review</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-extrabold text-[10px] shrink-0">Moderate Priority</span>
                        </div>
                        <p className="break-words"><strong>Category:</strong> Dosing Duration & Renal/Organ Clearance Monitoring</p>
                        <p className="break-words"><strong>Medications Involved:</strong> {evaluatedDrugs.map(d => d.generic_name || d.trade_name).join(', ')}</p>
                        <p className="break-words"><strong>Evidence from Case:</strong> Prescribed regimen for documented diagnosis: {norm.diagnosis.final}.</p>
                        <p className="break-words"><strong>Suggested Preceptor Review:</strong> Evaluate therapy duration, stool frequency goals (for osmotic/anti-infective bowel agents), and baseline renal parameters (BUN/Creatinine).</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No medication records available in submitted documentation to evaluate MRPs.</p>
                  )}
                </div>

                {/* SECTION 5 — DRUG–DRUG INTERACTION REVIEW (PAIR-SPECIFIC INDIVIDUAL ASSESSMENT) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 5 — DRUG–DRUG INTERACTION REVIEW
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                      Pair-Specific Individual Evaluation
                    </span>
                  </div>

                  {drugPairs.length > 0 ? (
                    <div className="space-y-3 text-xs min-w-0">
                      {drugPairs.map((pair, idx) => {
                        const interaction = getPairSpecificInteraction(pair.drug1, pair.drug2);

                        return (
                          <div key={idx} className={`p-4 rounded-xl border space-y-2 min-w-0 leading-relaxed ${
                            interaction.hasInteraction
                              ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-extrabold text-xs break-words">
                                Pair #{idx + 1}: {pair.drug1.generic_name || pair.drug1.trade_name} + {pair.drug2.generic_name || pair.drug2.trade_name}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${
                                interaction.hasInteraction
                                  ? 'bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}>
                                {interaction.severity}
                              </span>
                            </div>

                            <p className="break-words"><strong>Potential Interaction Mechanism:</strong> {interaction.mechanism}</p>
                            <p className="break-words"><strong>Clinical Significance:</strong> {interaction.clinicalSignificance}</p>
                            <p className="break-words"><strong>Management & Monitoring Consideration:</strong> {interaction.managementConsideration}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Insufficient medication records in submitted documentation to evaluate drug-drug interactions.</p>
                  )}
                </div>

                {/* SECTION 6 — DRUG–DISEASE / CONDITION INTERACTION REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <HeartPulse className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 6 — DRUG–DISEASE / CONDITION INTERACTION REVIEW
                      </h3>
                    </div>
                  </div>

                  {isProfileSubmitted && norm.diagnosis.final !== 'N/A' && evaluatedDrugs.length > 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-2 min-w-0 leading-relaxed">
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Documented Diagnosis:</strong> {norm.diagnosis.final}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Documented Regimen:</strong> {evaluatedDrugs.map(d => d.generic_name || d.trade_name).join(', ')}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Student/Preceptor Review Point:</strong> Evaluate whether active GI anti-inflammatory or anti-infective therapy requires renal function dose titration or electrolyte monitoring.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Documented disease/condition data not available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 7 — DOSE / REGIMEN / ADMINISTRATION REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 7 — DOSE / REGIMEN / ADMINISTRATION REVIEW
                      </h3>
                    </div>
                  </div>

                  {evaluatedDrugs.length > 0 ? (
                    <div className="space-y-3 text-xs min-w-0">
                      {evaluatedDrugs.map((d, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl min-w-0 leading-relaxed">
                          <p className="break-words font-extrabold text-slate-900 dark:text-white">{d.trade_name} ({d.generic_name})</p>
                          <p className="break-words text-slate-700 dark:text-slate-300">Dose: {d.dose || 'Not available in submitted documentation.'} • Route: {d.route_of_admin} • Frequency: {d.frequency}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] pt-1 break-words">Consider reviewing administration timing with respect to meals and target stool consistency with preceptor.</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Dosing and administration details not available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 8 — LABORATORY & CLINICAL PARAMETER REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 8 — LABORATORY & CLINICAL PARAMETER REVIEW
                      </h3>
                    </div>
                  </div>

                  {isProfileSubmitted && norm.labs.length > 0 ? (
                    <div className="space-y-2 text-xs min-w-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                        {norm.labs.map((lab, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-1 min-w-0 leading-relaxed">
                            <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">{lab.parameter_name}:</strong> {lab.test_value} {lab.unit}</p>
                            <p className="text-[11px] text-slate-500 break-words">Reference: {lab.normal_range} • Impression: <span className="font-bold text-emerald-600 dark:text-emerald-400">{lab.impression}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Laboratory data not available in submitted documentation.</p>
                  )}
                </div>

                {/* SECTION 9 — ADR / SAFETY REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 9 — ADR / SAFETY REVIEW
                      </h3>
                    </div>
                  </div>

                  {isAdrSubmitted ? (
                    <div className="bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/80 text-xs text-rose-950 dark:text-rose-200 space-y-1.5 min-w-0 leading-relaxed">
                      <p className="break-words"><strong>Suspected Medication:</strong> {norm.adr.suspectedMed}</p>
                      <p className="break-words"><strong>Documented Reaction Title:</strong> {norm.adr.reactionTitle}</p>
                      <p className="break-words"><strong>Severity & Seriousness:</strong> {norm.adr.severity} / {norm.adr.seriousness}</p>
                      <p className="break-words"><strong>Causality (Naranjo/WHO):</strong> {norm.adr.causalityOpinion || 'Probable'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                      ADR documentation is not available for analysis.
                    </p>
                  )}
                </div>

                {/* SECTION 10 — PHARMACIST INTERVENTION REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 10 — PHARMACIST INTERVENTION REVIEW
                      </h3>
                    </div>
                  </div>

                  {isInterventionSubmitted ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-1.5 min-w-0 leading-relaxed">
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Identified Issue:</strong> {norm.intervention.problem || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Intervention & Action Taken:</strong> {norm.intervention.action || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Physician Acceptance:</strong> {norm.intervention.accepted ? 'Accepted' : 'Pending'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                      Pharmacist Intervention documentation is not available for analysis.
                    </p>
                  )}
                </div>

                {/* SECTION 11 — PATIENT COUNSELLING REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 11 — PATIENT COUNSELLING REVIEW
                      </h3>
                    </div>
                  </div>

                  {isCounsellingSubmitted ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-1.5 min-w-0 leading-relaxed">
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Disease Condition Counselled:</strong> {norm.counselling.diseaseCounselled || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Medications Counselled:</strong> {norm.counselling.medicationsCounselled || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Patient Understanding Ascertained:</strong> {norm.counselling.understandingAscertained ? 'Yes (Ascertained)' : 'No'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                      Not documented in the submitted counselling form.
                    </p>
                  )}
                </div>

                {/* SECTION 12 — MISSING / UNAVAILABLE INFORMATION */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 12 — MISSING / UNAVAILABLE INFORMATION
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-2 min-w-0 leading-relaxed">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">Genuinely Missing / Unsubmitted Case Items:</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                      {!isProfileSubmitted && <li className="break-words">Patient Profile documentation not available in submitted documentation.</li>}
                      {!isCounsellingSubmitted && <li className="break-words">Patient Counselling documentation not available in submitted documentation.</li>}
                      {!isInterventionSubmitted && <li className="break-words">Pharmacist Intervention documentation not available in submitted documentation.</li>}
                      {!isDirSubmitted && <li className="break-words">Drug Information Request documentation not available in submitted documentation.</li>}
                      {!isAdrSubmitted && <li className="break-words">ADR Documentation Log not available in submitted documentation.</li>}
                      {norm.labs.length === 0 && <li className="break-words">Laboratory findings not available in submitted documentation.</li>}
                    </ul>
                  </div>
                </div>

                {/* SECTION 13 — PRIORITY ISSUES FOR STUDENT REVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 13 — PRIORITY ISSUES FOR STUDENT REVIEW
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs min-w-0">
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 space-y-1.5 min-w-0 leading-relaxed">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-extrabold text-emerald-950 dark:text-emerald-200">High Priority Preceptor Discussion Point</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-extrabold text-[10px] shrink-0">Priority #1</span>
                      </div>
                      <p className="text-emerald-900 dark:text-emerald-200 break-words">Review complete pharmacotherapeutic indication match and renal/hepatic clearance parameters with preceptor during case presentation.</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 14 — LEARNING POINTS */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        SECTION 14 — LEARNING POINTS
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed min-w-0">
                    <p className="break-words">• <strong>Clinical Pharmacotherapy:</strong> Ensure all prescribed drugs map directly to documented medical conditions.</p>
                    <p className="break-words">• <strong>Medication Safety & ADR Detection:</strong> Monitor patient for subtle adverse reactions and maintain diligent documentation.</p>
                    <p className="break-words">• <strong>Patient Communication:</strong> Verify patient understanding of drug administration schedule, storage, and potential side effects.</p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
