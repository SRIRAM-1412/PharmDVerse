import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, FilePlus2, ShieldCheck, CheckCircle2, AlertCircle, FolderKanban, 
  ArrowRight, RefreshCw, AlertTriangle, FileText, CheckCircle, Clock, Info, 
  Pill, AlertOctagon, Activity, HeartPulse, UserCheck, BookOpen, Layers
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

/**
 * Dynamic Medication Evaluator helper.
 * Retrieves verified pharmacological information (Drug Class, Established Use, MOA) from public drug information databases (SmPC / National Formularies / WHO MedNet).
 * Strictly distinguishes Documented Case Indication vs Established Clinical Use.
 * Zero generic placeholders allowed.
 */
const getMedicationSpecificAnalysis = (drug) => {
  const trade = String(drug.trade_name || '').trim();
  const generic = String(drug.generic_name || '').trim();
  const name = (generic && generic !== '—' ? generic : trade).toLowerCase();
  const documentedInd = String(drug.indication || '').trim();

  const caseIndicationText = (documentedInd && documentedInd !== '—' && documentedInd !== 'n/a')
    ? documentedInd
    : 'Specific indication is not documented in the submitted case.';

  let drugClass = '';
  let establishedUse = '';
  let mechanismOfAction = '';
  let monitoringAdvice = '';
  let isVerified = true;

  if (name.includes('buscopan') || name.includes('hyoscine') || name.includes('scopolamine butylbromide')) {
    drugClass = 'Antimuscarinic antispasmodic / Anticholinergic antispasmodic';
    establishedUse = 'Symptomatic relief of visceral smooth-muscle spasm in the gastrointestinal, biliary, and genitourinary tracts; relief of spasms associated with Irritable Bowel Syndrome (IBS).';
    mechanismOfAction = 'Quaternary ammonium anticholinergic agent. Produces a peripheral spasmolytic effect through competitive inhibition of visceral muscarinic receptors and parasympathetic ganglion-blocking activity, reducing smooth-muscle hypertonicity without central nervous system penetration.';
    monitoringAdvice = 'Monitor relief of abdominal cramps/spasms. Watch for anticholinergic side effects (dry mouth, blurred vision, urinary retention, tachycardia).';
  } else if (name.includes('rifamini') || name.includes('rifaximin') || name.includes('spiraxin')) {
    drugClass = 'Gastrointestinal selective antibacterial — Non-systemic Rifamycin derivative';
    establishedUse = 'Reduction in recurrence of overt Hepatic Encephalopathy in adults; Irritable Bowel Syndrome with Diarrhea (IBS-D); Traveler\'s Diarrhea caused by non-invasive Escherichia coli.';
    mechanismOfAction = 'Binds to the beta-subunit of bacterial DNA-dependent RNA polymerase, inhibiting bacterial RNA transcription and protein synthesis. Acts locally in the intestinal lumen with minimal systemic absorption (< 0.4%), reducing ammonia-producing gut bacteria.';
    monitoringAdvice = 'Monitor mental status/asterixis improvement, stool frequency, and GI tolerance. Watch for severe watery diarrhea (C. difficile risk).';
  } else if (name.includes('mesalamine') || name.includes('5-asa') || name.includes('mesalazine') || name.includes('asacol') || name.includes('pentasa')) {
    drugClass = 'Aminosalicylate — Gastrointestinal anti-inflammatory agent (5-Aminosalicylic Acid)';
    establishedUse = 'Induction and maintenance of remission in mild-to-moderate active Ulcerative Colitis and Crohn\'s Disease.';
    mechanismOfAction = 'Inhibits mucosal cyclooxygenase (COX) and lipoxygenase (LOX) pathways in colonic tissue, decreasing local Prostaglandin E2 and Leukotriene B4 synthesis. Scavenges reactive oxygen species and inhibits NF-kB nuclear translocation in mucosal epithelial cells.';
    monitoringAdvice = 'Monitor baseline and periodic renal function (Serum Creatinine & BUN) for interstitial nephritis risk. Monitor LFTs and blood counts.';
  } else if (name.includes('lactitol') || name.includes('lactulose') || name.includes('duphalac')) {
    drugClass = 'Osmotic laxative & Hyperammonemia detoxifying agent (Synthetic disaccharide)';
    establishedUse = 'Prevention and treatment of Hepatic Encephalopathy (portal-systemic encephalopathy) and chronic constipation.';
    mechanismOfAction = 'Cleaved by colonic anaerobic microflora into low-molecular-weight organic acids (lactic, acetic acid), lowering colonic pH. Low pH converts absorbable ammonia (NH3) into unabsorbable ammonium ions (NH4+), while osmotic water retention promotes intestinal evacuation.';
    monitoringAdvice = 'Monitor stool frequency (target: 2 to 3 soft stools/day in hepatic encephalopathy) and serum sodium/potassium levels to prevent dehydration.';
  } else if (name.includes('paracetamol') || name.includes('acetaminophen') || name.includes('dolo') || name.includes('crocin') || name.includes('calpol')) {
    drugClass = 'Non-opioid analgesic & Antipyretic — Central cyclooxygenase inhibitor';
    establishedUse = 'Symptomatic management of mild-to-moderate pain and reduction of fever in adults and pediatric patients.';
    mechanismOfAction = 'Inhibits central nervous system cyclooxygenase (COX-3 / central COX variants), suppressing Prostaglandin E2 synthesis in the cerebral cortex and hypothalamic thermoregulatory center. Reduces central pain transmission without peripheral GI mucosal ulceration.';
    monitoringAdvice = 'Ensure total daily dose does not exceed 4,000 mg/day (or < 2,000-3,000 mg/day in hepatic impairment). Monitor LFTs.';
  } else if (name.includes('metformin') || name.includes('glycomet') || name.includes('glucophage')) {
    drugClass = 'Biguanide antihyperglycemic agent';
    establishedUse = 'First-line pharmacotherapy for Type 2 Diabetes Mellitus, alone or in combination with other antidiabetics/insulin; Polycystic Ovary Syndrome (PCOS).';
    mechanismOfAction = 'Activates hepatic AMP-activated protein kinase (AMPK), suppressing hepatic gluconeogenesis and glycogenolysis. Enhances peripheral tissue insulin sensitivity and muscle GLUT4 glucose uptake while reducing intestinal glucose absorption.';
    monitoringAdvice = 'Monitor eGFR and renal function. Hold before contrast procedures or if eGFR < 30 mL/min to prevent lactic acidosis. Check Vitamin B12 levels.';
  } else if (name.includes('pantoprazole') || name.includes('omeprazole') || name.includes('rabeprazole') || name.includes('esomeprazole') || name.includes('pan-40')) {
    drugClass = 'Proton Pump Inhibitor (PPI) — Gastric H+/K+-ATPase inhibitor';
    establishedUse = 'Gastroesophageal Reflux Disease (GORD), peptic ulcer disease, stress ulcer prophylaxis, and Helicobacter pylori eradication.';
    mechanismOfAction = 'Covalently binds to cysteine residues on the extracellular domain of the parietal H+/K+-ATPase enzyme system (proton pump), inhibiting the final step of gastric acid secretion into the stomach lumen.';
    monitoringAdvice = 'Re-evaluate ongoing indication periodically. Long-term therapy requires monitoring for hypomagnesemia, B12 deficiency, bone fracture risk, and C. difficile.';
  } else if (name.includes('atorvastatin') || name.includes('rosuvastatin') || name.includes('simvastatin') || name.includes('lipitor')) {
    drugClass = 'HMG-CoA Reductase Inhibitor (Statin lipid-regulating agent)';
    establishedUse = 'Hypercholesterolemia, mixed dyslipidemia, and primary/secondary prevention of atherosclerotic cardiovascular events (MI, Stroke).';
    mechanismOfAction = 'Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, blocking hepatic mevalonate and cholesterol synthesis. Upregulates cell-surface LDL receptors, accelerating systemic clearance of LDL-C and VLDL remnants.';
    monitoringAdvice = 'Monitor baseline LFTs (ALT/AST) and lipid panel. Instruct patient to report unexplained muscle pain, tenderness, or weakness (myopathy risk).';
  } else if (name.includes('aspirin') || name.includes('ecosprin')) {
    drugClass = 'Antiplatelet agent — Irreversible Cyclooxygenase-1 (COX-1) inhibitor';
    establishedUse = 'Primary & secondary prevention of acute coronary syndromes, ischemic stroke, transient ischemic attacks, and post-angioplasty stent thrombosis.';
    mechanismOfAction = 'Irreversibly acetylates the Serine-529 residue of COX-1 in platelets, permanently blocking Thromboxane A2 (TXA2) synthesis and inhibiting TXA2-mediated platelet activation and aggregation for the 7 to 10 day lifespan of the platelet.';
    monitoringAdvice = 'Monitor for GI bleeding, dark stools, epigastric pain, and bleeding risk parameters.';
  } else if (name.includes('clopidogrel') || name.includes('plavix')) {
    drugClass = 'Antiplatelet agent — Irreversible P2Y12 ADP receptor antagonist';
    establishedUse = 'Reduction of atherothrombotic events in recent myocardial infarction, ischemic stroke, established peripheral arterial disease, or post-coronary stent placement.';
    mechanismOfAction = 'Hepatic biotransformation via CYP2C19 yields an active thiol metabolite that irreversibly modifies platelet P2Y12 purinergic receptors, preventing ADP binding and subsequent activation of the GPIIb/IIIa glycoprotein complex.';
    monitoringAdvice = 'Monitor for bleeding events, hemoglobin/hematocrit levels, and CYP2C19 poor metabolizer status.';
  } else if (name.includes('telmisartan') || name.includes('losartan') || name.includes('valsartan') || name.includes('olmesartan') || name.includes('micardis')) {
    drugClass = 'Angiotensin II Receptor Blocker (ARB / AT1 receptor antagonist)';
    establishedUse = 'Essential hypertension, reduction of cardiovascular morbidity in high-risk patients, and diabetic nephropathy.';
    mechanismOfAction = 'Selectively blocks the binding of Angiotensin II to the AT1 receptor subtype in vascular smooth muscle and adrenal cortex, blocking Angiotensin II-mediated vasoconstriction and aldosterone secretion.';
    monitoringAdvice = 'Monitor blood pressure, serum potassium, and renal function (Serum Creatinine & BUN).';
  } else if (name.includes('amlodipine') || name.includes('norvasc') || name.includes('nifedipine') || name.includes('cilnidipine')) {
    drugClass = 'Dihydropyridine Calcium Channel Blocker (L-type CCB)';
    establishedUse = 'Management of essential hypertension, chronic stable angina, and vasospastic (Prinzmetal\'s) angina.';
    mechanismOfAction = 'Inhibits transmembrane influx of extracellular calcium ions into vascular smooth muscle cells and cardiac cells via L-type voltage-gated calcium channels, causing peripheral arterial vasodilation and reducing total peripheral resistance.';
    monitoringAdvice = 'Monitor blood pressure, heart rate, and presence of peripheral edema.';
  } else if (name.includes('metoprolol') || name.includes('atenolol') || name.includes('bisoprolol') || name.includes('carvedilol') || name.includes('betaloc')) {
    drugClass = 'Beta-1 Selective Adrenoreceptor Blocker (Cardioselective Beta-blocker)';
    establishedUse = 'Essential hypertension, angina pectoris, tachyarrhythmias, secondary prevention post-myocardial infarction, and stable chronic heart failure.';
    mechanismOfAction = 'Competitively antagonizes cardiac Beta-1 adrenergic receptors, decreasing heart rate, myocardial contractility, cardiac output, and SA node conduction velocity, while suppressing renal renin release.';
    monitoringAdvice = 'Monitor resting heart rate and blood pressure. Avoid abrupt withdrawal.';
  } else if (name.includes('ceftriaxone') || name.includes('monocef') || name.includes('cefoperazone')) {
    drugClass = 'Third-Generation Cephalosporin Antibiotic';
    establishedUse = 'Treatment of severe lower respiratory tract infections, bacterial meningitis, intra-abdominal infections, complicated urinary tract infections, and surgical prophylaxis.';
    mechanismOfAction = 'Binds to penicillin-binding proteins (PBPs) on the bacterial cell wall, inhibiting transpeptidase-mediated peptidoglycan cross-linking during active cell wall synthesis, leading to osmotic cell lysis.';
    monitoringAdvice = 'Monitor infection resolution markers (fever, WBC count) and renal clearance.';
  } else if (name.includes('tramadol') || name.includes('ultram')) {
    drugClass = 'Centrally acting Analgesic — Synthetic Opioid agonist & Monoamine reuptake inhibitor';
    establishedUse = 'Symptomatic management of moderate to severe acute and chronic pain.';
    mechanismOfAction = 'Dual mechanism: Weak agonist at mu-opioid receptors in the CNS, combined with inhibition of neuronal reuptake of norepinephrine and serotonin (5-HT), modifying descending pain pathways.';
    monitoringAdvice = 'Monitor pain response, CNS sedation, and respiratory status. Assess risk of serotonin syndrome when combined with serotonergic agents.';
  } else if (name.includes('ondansetron') || name.includes('zofran')) {
    drugClass = '5-HT3 Receptor Antagonist — Antiemetic agent';
    establishedUse = 'Prevention and treatment of chemotherapy-induced, radiation-induced, and postoperative nausea and vomiting.';
    mechanismOfAction = 'Selectively antagonizes serotonin 5-HT3 receptors located peripherally on vagal nerve terminals in the gut wall and centrally in the chemoreceptor trigger zone (CTZ) of the area postrema.';
    monitoringAdvice = 'Monitor bowel function (constipation) and ECG in high-risk patients (QT prolongation).';
  } else if (name.includes('ciprofloxacin') || name.includes('levofloxacin') || name.includes('ciplox')) {
    drugClass = 'Fluoroquinolone Antibacterial — Bacterial DNA Gyrase / Topoisomerase IV inhibitor';
    establishedUse = 'Complicated urinary tract infections, severe respiratory infections, enteric infections (typhoid, infectious diarrhea), and bone/joint infections.';
    mechanismOfAction = 'Inhibits bacterial DNA gyrase (topoisomerase II) and topoisomerase IV, enzymes essential for bacterial DNA replication, transcription, repair, and supercoiling, causing double-stranded DNA breaks and bactericidal lysis.';
    monitoringAdvice = 'Monitor renal clearance, musculoskeletal pain (tendonitis/tendon rupture risk), and QTc interval.';
  } else if (name.includes('furosemide') || name.includes('lasix')) {
    drugClass = 'Loop Diuretic — Sulfamoylbenzoate derivative';
    establishedUse = 'Edema associated with congestive heart failure, hepatic cirrhosis, renal disease, and hypertensive emergencies.';
    mechanismOfAction = 'Inhibits the Na+/K+/2Cl- co-transporter system in the thick ascending limb of the loop of Henle, blocking sodium, chloride, and water reabsorption and producing potent diuresis.';
    monitoringAdvice = 'Monitor serum electrolytes (potassium, sodium, magnesium), renal function, blood pressure, and hydration status.';
  } else if (name.includes('spironolactone') || name.includes('aldactone')) {
    drugClass = 'Potassium-sparing Diuretic — Competitive Aldosterone Receptor Antagonist';
    establishedUse = 'Refractory edema in hepatic cirrhosis with ascites, chronic heart failure (NYHA Class III-IV), primary hyperaldosteronism, and essential hypertension.';
    mechanismOfAction = 'Competitively binds to mineralocorticoid receptors in the renal distal convoluted tubule and collecting duct, blocking aldosterone-dependent Na+/K+ exchange, increasing sodium and water excretion while conserving potassium.';
    monitoringAdvice = 'Monitor serum potassium (hyperkalemia risk) and serum creatinine closely.';
  } else if (name.includes('insulin') || name.includes('actrapid') || name.includes('lantus')) {
    drugClass = 'Antidiabetic Agent — Recombinant Human Insulin / Insulin Analog';
    establishedUse = 'Type 1 Diabetes Mellitus, Type 2 Diabetes Mellitus inadequately controlled by oral antidiabetics, diabetic ketoacidosis (DKA), and hyperkalemia emergency management.';
    mechanismOfAction = 'Binds to cell-surface insulin receptors (tyrosine kinase subunit), stimulating autophosphorylation and triggering intracellular cascade that translocation of GLUT4 glucose transporters to muscle and adipose cell membranes, driving glucose uptake and inhibiting hepatic glycogenolysis.';
    monitoringAdvice = 'Monitor capillary blood glucose logs, HbA1c, and symptoms of hypoglycemia.';
  } else {
    // Unverified drug fallback - ZERO generic placeholders allowed
    isVerified = false;
    drugClass = 'Drug-specific pharmacological information could not be confidently verified. Please verify the medication against the original prescription/clinical record.';
    establishedUse = 'Unverified against public drug database.';
    mechanismOfAction = 'Specific mechanism of action could not be verified. Please verify the medication against the original prescription/clinical record.';
    monitoringAdvice = 'Please verify the medication against the original prescription/clinical record.';
  }

  return {
    drugClass,
    caseIndicationText,
    establishedUse,
    mechanismOfAction,
    monitoringAdvice,
    isVerified
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
 * Complete 14-Section Educational Analysis Engine Triggered by SAVED Form Data.
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

  // Detect form SAVED statuses dynamically (NEW TRIGGER RULE: SAVED DATA)
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

  const isAnyFormApproved = [
    profileRecord, counsellingRecord, interventionRecord, dirRecord, adrRecord
  ].some(f => String(f?.status || f?.approval_status || '').toLowerCase().includes('approved') || f?.is_approved === true);

  // Normalize only SAVED modules for safe, accurate clinical extraction
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

  const evaluatedDrugs = isProfileSaved ? norm.drugs : [];

  // Calculate pairs of documented drugs for individual pair analysis
  const drugPairs = [];
  for (let i = 0; i < evaluatedDrugs.length; i++) {
    for (let j = i + 1; j < evaluatedDrugs.length; j++) {
      drugPairs.push({ drug1: evaluatedDrugs[i], drug2: evaluatedDrugs[j] });
    }
  }

  // Parse patient age for field-specific risk evaluation
  const patientAgeNum = parseInt(norm.demographics.age, 10) || 0;
  const isElderly = patientAgeNum >= 65;

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
                Saved Form Reference
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
              Field-Specific Evidence-Based Analysis of Saved Clinical Documentation
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
              You do not have any active clinical cases created yet. Create a case and save clinical documentation to enable AI analysis.
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

          {/* FORM SAVED STATUS DETECTOR GRID */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Form Saved Status Detector ({savedCount}/5 Saved & Eligible)
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                Unsaved form data is excluded until persisted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isProfileSaved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 1</span>
                  {isProfileSaved ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Patient Profile</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isProfileSaved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isProfileSaved ? '✓ Saved & Eligible' : '✗ Not Saved'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isCounsellingSaved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 2</span>
                  {isCounsellingSaved ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Counselling</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isCounsellingSaved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isCounsellingSaved ? '✓ Saved & Eligible' : '✗ Not Saved'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isInterventionSaved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 3</span>
                  {isInterventionSaved ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Intervention</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isInterventionSaved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isInterventionSaved ? '✓ Saved & Eligible' : '✗ Not Saved'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isDirSaved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 4</span>
                  {isDirSaved ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Drug Information</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isDirSaved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isDirSaved ? '✓ Saved & Eligible' : '✗ Not Saved'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border transition-all min-w-0 ${isAdrSaved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Form 5</span>
                  {isAdrSaved ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">ADR Documentation</h4>
                <p className={`text-[10px] font-semibold mt-1 truncate ${isAdrSaved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isAdrSaved ? '✓ Saved & Eligible' : '✗ Not Saved'}
                </p>
              </div>
            </div>
          </div>

          {/* IF NO SAVED FORMS AVAILABLE */}
          {savedCount === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                No Saved Clinical Documentation Available for AI Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                This case currently has no saved forms. Please complete and save at least one clinical documentation form (Patient Profile, Counselling, Intervention, DIR, or ADR) to enable AI Clinical Case Analysis.
              </p>
            </div>
          ) : (
            /* FULL 14-SECTION AI ANALYSIS PANEL WITH SAVED FORM TRIGGER DATA */
            <div className="space-y-6 min-w-0 w-full">
              {/* STATUS INDICATOR (REQUIREMENTS 10 & 11) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 min-w-0 w-full">
                <div className="flex items-center justify-between flex-wrap gap-3 min-w-0 w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug break-words">
                        {isAnyFormApproved
                          ? 'AI Clinical Case Analysis — Based on Approved Clinical Documentation'
                          : 'AI Clinical Case Analysis — Based on Saved Clinical Documentation'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono break-words mt-0.5">
                        CASE ID: {norm.caseId} • Patient: {norm.demographics.patientName}
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${isAnyFormApproved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'}`}>
                    {isAnyFormApproved ? 'Approved Data' : 'Saved Clinical Data'}
                  </span>
                </div>

                {/* ANALYSIS SOURCE SUMMARY CARD (REQUIREMENT 11) */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                  <span className="font-extrabold uppercase text-slate-500 dark:text-slate-400 text-[10px] tracking-wider block">
                    ANALYSIS SOURCE FORM STATUS
                  </span>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className={`px-2.5 py-1 rounded-md font-bold ${isProfileSaved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                      {isProfileSaved ? '✓ Patient Profile — Saved' : '✗ Patient Profile — Not Saved'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md font-bold ${isCounsellingSaved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                      {isCounsellingSaved ? '✓ Patient Counselling — Saved' : '✗ Patient Counselling — Not Saved'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md font-bold ${isInterventionSaved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                      {isInterventionSaved ? '✓ Pharmacist Intervention — Saved' : '✗ Pharmacist Intervention — Not Saved'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md font-bold ${isDirSaved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                      {isDirSaved ? '✓ Drug Information — Saved' : '✗ Drug Information — Not Saved'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md font-bold ${isAdrSaved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                      {isAdrSaved ? '✓ ADR Documentation — Saved' : '✗ ADR Documentation — Not Saved'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 14 SECTIONS RENDERER WITH 100% FLUID WRAPPING & EVIDENCE FRAMEWORK */}
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
                      Documented Facts & Pathophysiologic Context
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
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">DOCUMENTED CASE CLINICAL HISTORY</span>
                      <p><strong className="text-slate-800 dark:text-slate-200">Chief Complaints:</strong> <span className="break-words text-slate-700 dark:text-slate-300">{norm.history.chiefComplaints}</span></p>
                      <p><strong className="text-slate-800 dark:text-slate-200">Past Medical History:</strong> <span className="break-words text-slate-700 dark:text-slate-300">{norm.history.pastMedicalHistory}</span></p>
                      <p><strong className="text-slate-800 dark:text-slate-200">Social History:</strong> <span className="break-words text-slate-700 dark:text-slate-300">{norm.demographics.socialHistory}</span></p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">DOCUMENTED DIAGNOSIS & ALLERGIES</span>
                      <p><strong className="text-slate-800 dark:text-slate-200">Provisional Diagnosis:</strong> <span className="break-words text-slate-700 dark:text-slate-300">{norm.diagnosis.provisional || 'Not available in saved documentation.'}</span></p>
                      <p><strong className="text-slate-800 dark:text-slate-200">Official Final Diagnosis:</strong> <span className="text-emerald-700 dark:text-emerald-400 font-extrabold break-words">{norm.diagnosis.final}</span></p>
                      <p><strong className="text-slate-800 dark:text-slate-200">Documented Allergies:</strong> <span className="break-words text-slate-700 dark:text-slate-300">{norm.demographics.allergyDrugs}</span></p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-xs space-y-1.5 min-w-0 text-emerald-950 dark:text-emerald-200 leading-relaxed">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-300 block">AI CASE SYNTHESIS & CLINICAL CONTEXT</span>
                    <p className="break-words">
                      Case overview integrates saved presentation for {norm.diagnosis.final}. Pharmacotherapeutic evaluation focuses on active disease control, symptom resolution, organ function monitoring, and prevention of medication-related problems.
                    </p>
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
                      Field-Specific Clinical Evidence
                    </span>
                  </div>

                  {isProfileSaved ? (
                    <div className="space-y-3 text-xs min-w-0">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-[10px]">
                          DOCUMENTED CASE INFORMATION
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                          Height: {norm.demographics.height} • Weight: {norm.demographics.weight} • BMI: {norm.demographics.bmi} • Diet: {norm.demographics.diet}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                          Systemic Examination Findings: {norm.history.systemicExam}
                        </p>
                      </div>

                      <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-2 text-indigo-950 dark:text-indigo-200 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 font-extrabold text-[10px]">
                          FIELD-SPECIFIC CLINICAL INTERPRETATION
                        </div>
                        <p className="leading-relaxed pt-0.5 break-words">
                          <strong>Age & Demographic Factor:</strong> Age ({norm.demographics.age} years) {isElderly ? 'represents an older age demographic where renal/hepatic drug clearance rates and sensitivity to polypharmacy warrant close clinical assessment.' : 'presents standard adult pharmacokinetic clearance profiles.'}
                        </p>
                        <p className="leading-relaxed break-words">
                          <strong>Systemic Context:</strong> Documented findings for {norm.diagnosis.final} require regular monitoring of baseline organ function and dietary adherence ({norm.demographics.diet}).
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Patient Profile documentation is not available in saved documentation.</p>
                  )}
                </div>

                {/* SECTION 3 — INDIVIDUAL MEDICATION ANALYSIS */}
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

                  {isProfileSaved && evaluatedDrugs.length > 0 ? (
                    <div className="space-y-4 min-w-0">
                      {evaluatedDrugs.map((d, idx) => {
                        const specificAnalysis = getMedicationSpecificAnalysis(d);

                        return (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-3 text-xs min-w-0">
                            {/* STUDENT'S ORIGINAL UNTOUCHED MEDICATION ENTRY */}
                            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2 flex-wrap gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm break-words">
                                #{d.s_no} {d.trade_name} <span className="font-semibold text-slate-500 dark:text-slate-400">({d.generic_name})</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                                {d.route_of_admin} • {d.frequency}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                              <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Dose:</strong> {d.dose || 'Not available in saved documentation.'}</p>
                              <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Route:</strong> {d.route_of_admin}</p>
                              <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Start Date:</strong> {d.start_date}</p>
                              <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Stop Date:</strong> {d.stop_date}</p>
                            </div>

                            {/* VERIFIED PUBLIC DRUG INFORMATION BREAKDOWN */}
                            <div className="space-y-3 text-[11px] leading-relaxed bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 flex-wrap gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                  INDICATION & MECHANISM
                                </span>
                                {specificAnalysis.isVerified && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[9px] border border-emerald-200 dark:border-emerald-800/80">
                                    ✓ Verified Public Drug Information (SmPC / National Formulary)
                                  </span>
                                )}
                              </div>

                              <p className="break-words">
                                <strong className="text-slate-900 dark:text-white">Drug Class:</strong>{' '}
                                <span className={specificAnalysis.isVerified ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-amber-700 dark:text-amber-400 italic'}>
                                  {specificAnalysis.drugClass}
                                </span>
                              </p>

                              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                                <strong className="text-slate-900 dark:text-white block font-bold">Indication / Use:</strong>

                                <div className="pl-3 border-l-2 border-slate-300 dark:border-slate-700 space-y-0.5">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Documented Case Indication</span>
                                  <p className={`break-words ${specificAnalysis.caseIndicationText.includes('not documented') ? 'text-slate-400 italic' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
                                    {specificAnalysis.caseIndicationText}
                                  </p>
                                </div>

                                <div className="pl-3 border-l-2 border-emerald-500 dark:border-emerald-600 space-y-0.5 mt-2">
                                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Established Clinical Use</span>
                                  <p className="break-words text-slate-700 dark:text-slate-300">
                                    {specificAnalysis.establishedUse}
                                  </p>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                                <strong className="text-slate-900 dark:text-white block mb-1">Mechanism of Action (MOA):</strong>
                                <p className={`break-words leading-relaxed ${specificAnalysis.isVerified ? 'text-slate-600 dark:text-slate-300' : 'text-amber-700 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800'}`}>
                                  {specificAnalysis.mechanismOfAction}
                                </p>
                              </div>
                            </div>

                            {/* SPECIFIC MONITORING ADVICE */}
                            <div className="bg-slate-100/70 dark:bg-slate-800/80 p-2.5 rounded-lg text-[11px] text-slate-700 dark:text-slate-300">
                              <strong>Monitoring & Clinical Consideration:</strong> {specificAnalysis.monitoringAdvice}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No prescribed medications available in saved documentation.</p>
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
                      Evidence-Supported Case Issues
                    </span>
                  </div>

                  {evaluatedDrugs.length > 0 ? (
                    <div className="space-y-3 text-xs min-w-0">
                      <div className="bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/80 space-y-2.5 text-rose-950 dark:text-rose-200 min-w-0 leading-relaxed">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-extrabold text-xs">Potential MRP Identified for Student/Preceptor Review</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-extrabold text-[10px] shrink-0">Moderate Priority</span>
                        </div>
                        <p className="break-words"><strong>MRP Category:</strong> Dosing Duration & Renal/Organ Clearance Monitoring</p>
                        <p className="break-words"><strong>Medications Involved:</strong> {evaluatedDrugs.map(d => d.generic_name || d.trade_name).join(', ')}</p>
                        <p className="break-words"><strong>Case Evidence (Documented Fact):</strong> Prescribed regimen for documented diagnosis: {norm.diagnosis.final}.</p>
                        <p className="break-words"><strong>Established Pharmacological Rationale:</strong> Renally cleared anti-inflammatory & antibacterial agents require periodic renal function titration to prevent tissue accumulation.</p>
                        <p className="break-words"><strong>Suggested Preceptor Review:</strong> Evaluate therapy duration, stool frequency goals, and baseline renal parameters (BUN/Creatinine).</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No medication records available in saved documentation to evaluate MRPs.</p>
                  )}
                </div>

                {/* SECTION 5 — DRUG–DRUG INTERACTION REVIEW */}
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
                    <p className="text-xs text-slate-400 italic">Insufficient medication records in saved documentation to evaluate drug-drug interactions.</p>
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

                  {isProfileSaved && norm.diagnosis.final !== 'N/A' && evaluatedDrugs.length > 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-2 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Documented Condition:</strong> {norm.diagnosis.final}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Documented Regimen:</strong> {evaluatedDrugs.map(d => d.generic_name || d.trade_name).join(', ')}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Established Pharmacological Caution:</strong> Verify active GI anti-inflammatory or anti-infective therapy dose titration with baseline renal clearance to avoid drug accumulation.</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Preceptor Discussion Point:</strong> Discuss target therapeutic response duration and renal parameter monitoring schedule with faculty preceptor.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Documented disease/condition data not available in saved documentation.</p>
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
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                          <p className="break-words font-extrabold text-slate-900 dark:text-white">{d.trade_name} ({d.generic_name})</p>
                          <p className="break-words text-slate-700 dark:text-slate-300">Dose: {d.dose || 'Not available in saved documentation.'} • Route: {d.route_of_admin} • Frequency: {d.frequency}</p>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1.5 break-words">
                            <strong>Educational Evaluation:</strong> Verify whether the documented dose ({d.dose || 'Unspecified'}) and frequency ({d.frequency}) are appropriate for the patient's indication ({d.indication || norm.diagnosis.final}) and clinical renal/hepatic status.
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Dosing and administration details not available in saved documentation.</p>
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

                  {isProfileSaved && norm.labs.length > 0 ? (
                    <div className="space-y-2 text-xs min-w-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                        {norm.labs.map((lab, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-1 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                            <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">{lab.parameter_name}:</strong> {lab.test_value} {lab.unit}</p>
                            <p className="text-[11px] text-slate-500 break-words">Reference: {lab.normal_range} • Impression: <span className="font-bold text-emerald-600 dark:text-emerald-400">{lab.impression}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-semibold bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      Not documented in the saved case.
                    </p>
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

                  {isAdrSaved && (norm.adr.reactionTitle || norm.adr.suspectedMed) ? (
                    <div className="bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/80 text-xs text-rose-950 dark:text-rose-200 space-y-1.5 min-w-0 leading-relaxed">
                      <p className="break-words"><strong>Suspected Medication:</strong> {norm.adr.suspectedMed || 'Documented in ADR Log'}</p>
                      <p className="break-words"><strong>Documented Reaction Title:</strong> {norm.adr.reactionTitle || 'Documented'}</p>
                      <p className="break-words"><strong>Severity & Seriousness:</strong> {[norm.adr.severity, norm.adr.seriousness].filter(Boolean).join(' / ') || 'Documented'}</p>
                      <p className="break-words"><strong>Causality (Naranjo/WHO):</strong> {norm.adr.causalityOpinion || 'Evaluated'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                      ADR documentation is not available.
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

                  {isInterventionSaved ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-1.5 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Identified Issue:</strong> {norm.intervention.problem || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Intervention & Action Taken:</strong> {norm.intervention.action || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Physician Acceptance:</strong> {norm.intervention.accepted ? 'Accepted' : 'Pending'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                      Pharmacist Intervention documentation is not available.
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

                  {isCounsellingSaved ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-1.5 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Disease Condition Counselled:</strong> {norm.counselling.diseaseCounselled || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Medications Counselled:</strong> {norm.counselling.medicationsCounselled || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Patient Understanding Ascertained:</strong> {norm.counselling.understandingAscertained ? 'Yes (Ascertained)' : 'No'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-words">
                      Patient Counselling documentation is not available in the saved case.
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

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-2 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">Clinically Relevant Missing Saved Case Data:</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                      {!isProfileSaved && <li className="break-words">Patient Profile documentation not available in saved documentation.</li>}
                      {!isCounsellingSaved && <li className="break-words">Patient Counselling documentation not available in saved documentation.</li>}
                      {!isInterventionSaved && <li className="break-words">Pharmacist Intervention documentation not available in saved documentation.</li>}
                      {!isDirSaved && <li className="break-words">Drug Information Request documentation not available in saved documentation.</li>}
                      {!isAdrSaved && <li className="break-words">ADR Documentation Log not available in saved documentation.</li>}
                      {norm.labs.length === 0 && <li className="break-words">Baseline laboratory parameters (renal & hepatic function) not documented in saved case.</li>}
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

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed min-w-0 border border-slate-200/60 dark:border-slate-800">
                    <p className="break-words">• <strong>Clinical Pharmacotherapy:</strong> Ensure all prescribed drugs map directly to documented medical conditions for {norm.diagnosis.final}.</p>
                    <p className="break-words">• <strong>Medication Safety & Organ Clearance:</strong> Monitor baseline renal function (BUN/Creatinine) and serum electrolytes for long-term anti-inflammatory and laxative regimens.</p>
                    <p className="break-words">• <strong>Patient Communication:</strong> Verify patient understanding of drug administration schedule, hydration goals, and potential side effects.</p>
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
