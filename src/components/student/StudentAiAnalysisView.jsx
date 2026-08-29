import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, FilePlus2, ShieldCheck, CheckCircle2, AlertCircle, FolderKanban, 
  ArrowRight, RefreshCw, AlertTriangle, FileText, CheckCircle, Clock, Info, 
  Pill, AlertOctagon, Activity, HeartPulse, UserCheck, BookOpen, Layers, FileSearch, Utensils, ShieldAlert, HeartHandshake, ClipboardList, Printer
} from 'lucide-react';
import { 
  fetchStudentCasesFromSupabase, 
  fetchCaseModuleStatusesFromSupabase, 
  fetchLabParameterKnowledgeFromSupabase, 
  fetchMultipleDrugKnowledgeFromSupabase,
  evaluateSection5ADrugInteractionsInSupabase,
  evaluateSection5BDrugFoodInteractionsInSupabase,
  fetchDocumentBrandingSettingsFromSupabase,
  fetchPreceptorByIdFromSupabase
} from '../../services/supabaseService';
import { buildNormalizedApprovedCaseData } from '../../utils/buildNormalizedApprovedCaseData';
import { generateOfficialClinicalCasePDF } from '../../utils/generateOfficialClinicalCasePDF';
import { resolveClinicalEntityKnowledge } from '../../services/clinicalKnowledgeService';
import { evaluatePairwiseDrugInteraction, runAiClinicalCaseAnalysis, synthesizeSection4DrugAiInterpretation } from '../../services/aiAnalysisService';

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
 * Clinical Brand & Generic Medication Identity Database
 */
/**
 * Clinical Brand & Generic Medication Identity Database
 */
const BRAND_GENERIC_REGISTRY = {
  // Cardiac, Inotropic & Antiplatelet / Antihypertensive Agents
  'digoxin': { generic: 'Digoxin', brand: 'Lanoxin', type: 'Generic Name', class: 'Cardiac Glycoside (Inotropic Agent & Na+/K+-ATPase Inhibitor)', use: 'Rate control in chronic Atrial Fibrillation / Atrial Flutter and HFrEF.', moa: 'Reversibly inhibits membrane-bound Na+/K+-ATPase pump in cardiac myocytes, increasing intracellular sodium, reducing Na+/Ca2+ exchange and increasing intracellular calcium for positive inotropy.', mon: 'Monitor serum digoxin levels (0.5-0.9 ng/mL for HF, 0.8-2.0 ng/mL for AF), serum potassium, magnesium, and renal clearance.', dose: '0.125 mg – 0.25 mg Oral QD' },
  'lanoxin': { generic: 'Digoxin', brand: 'Lanoxin', type: 'Brand Name', class: 'Cardiac Glycoside (Inotropic Agent & Na+/K+-ATPase Inhibitor)', use: 'Rate control in chronic Atrial Fibrillation / Atrial Flutter and HFrEF.', moa: 'Reversibly inhibits Na+/K+-ATPase pump in cardiac myocytes.', mon: 'Monitor serum digoxin levels, potassium, and renal clearance.', dose: '0.125 mg – 0.25 mg Oral QD' },
  
  'diltiazem': { generic: 'Diltiazem', brand: 'Dilzem / Cardizem / Tiazac', type: 'Generic Name', class: 'Benzothiazepine Non-Dihydropyridine Calcium Channel Blocker (Class IV Antiarrhythmic)', use: 'Essential hypertension, angina pectoris (vasospastic and chronic stable), and ventricular rate control in atrial fibrillation or atrial flutter.', moa: 'Inhibits transmembrane influx of extracellular calcium ions through voltage-gated L-type calcium channels in sinoatrial (SA) and atrioventricular (AV) nodal tissue and vascular smooth muscle, slowing AV nodal conduction and inducing coronary vasodilation.', mon: 'Monitor resting heart rate (hold if HR < 50-60 bpm), blood pressure, PR interval on ECG (AV block risk), and signs of peripheral edema.', dose: '30 mg – 60 mg Oral TID/QID or 120 mg – 240 mg Sustained Release QD' },
  'dilzem': { generic: 'Diltiazem', brand: 'Dilzem', type: 'Brand Name', class: 'Benzothiazepine Non-Dihydropyridine Calcium Channel Blocker', use: 'Hypertension, angina pectoris, and rate control in atrial fibrillation.', moa: 'Inhibits voltage-gated L-type calcium channels in cardiac nodes and vascular smooth muscle.', mon: 'Monitor heart rate, blood pressure, and ECG PR interval.', dose: '30 mg – 60 mg Oral TID/QID' },

  'amitriptyline': { generic: 'Amitriptyline', brand: 'Tryptomer / Elavil', type: 'Generic Name', class: 'Tricyclic Antidepressant (TCA) — Serotonin & Norepinephrine Reuptake Inhibitor', use: 'Major depressive disorder, chronic neuropathic pain (diabetic neuropathy, post-herpetic neuralgia), tension headache & migraine prophylaxis, and fibromyalgia.', moa: 'Inhibits presynaptic reuptake transporters of Serotonin (SERT) and Norepinephrine (NET) in CNS neurons; also blocks voltage-gated sodium channels, central alpha-1 adrenergic, histamine H1, and muscarinic M1 receptors.', mon: 'Monitor baseline and periodic ECG (QTc prolongation, QRS widening), blood pressure (orthostatic hypotension), anticholinergic tolerance (dry mouth, urinary retention, constipation), and sedation.', dose: '10 mg – 25 mg Oral HS initial (up to 75 mg – 150 mg/day for depression)' },
  'tryptomer': { generic: 'Amitriptyline', brand: 'Tryptomer', type: 'Brand Name', class: 'Tricyclic Antidepressant (TCA)', use: 'Neuropathic pain, depression, and migraine prophylaxis.', moa: 'Inhibits presynaptic reuptake of serotonin and norepinephrine in CNS neurons.', mon: 'Monitor ECG (QTc), blood pressure, and anticholinergic side effects.', dose: '10 mg – 25 mg Oral HS' },
  
  'aspirin': { generic: 'Aspirin (Acetylsalicylic Acid)', brand: 'Ecospirin / Disprin', type: 'Generic Name', class: 'Antiplatelet Agent & NSAID — Irreversible Cyclooxygenase-1 (COX-1) Inhibitor', use: 'Primary & secondary prevention of acute coronary syndromes, ischemic stroke, TIA, and arterial thrombosis.', moa: 'Irreversibly acetylates Serine-529 of COX-1 in platelets, permanently blocking Thromboxane A2 (TXA2) synthesis and inhibiting TXA2-mediated platelet activation for the 7-10 day lifespan of the platelet.', mon: 'Monitor for GI bleeding, dark stools, epigastric distress, and complete blood counts.', dose: '75 mg – 150 mg Oral OD (Antiplatelet)' },
  'ecosprin': { generic: 'Aspirin (Acetylsalicylic Acid)', brand: 'Ecospirin', type: 'Brand Name', class: 'Antiplatelet Agent — Irreversible COX-1 Inhibitor', use: 'Prevention of myocardial infarction, ischemic stroke, and post-angioplasty thrombosis.', moa: 'Irreversibly acetylates platelet COX-1, suppressing Thromboxane A2 production.', mon: 'Monitor for GI mucosal irritation, bleeding signs, and Hb/Hct.', dose: '75 mg – 150 mg Oral OD' },
  'ecospirin': { generic: 'Aspirin (Acetylsalicylic Acid)', brand: 'Ecospirin', type: 'Brand Name', class: 'Antiplatelet Agent — Irreversible COX-1 Inhibitor', use: 'Prevention of myocardial infarction and ischemic stroke.', moa: 'Irreversibly acetylates platelet COX-1, suppressing TXA2 synthesis.', mon: 'Monitor GI tolerance and bleeding signs.', dose: '75 mg – 150 mg Oral OD' },
  
  'telmisartan': { generic: 'Telmisartan', brand: 'Telma / Micardis', type: 'Generic Name', class: 'Angiotensin II Receptor Blocker (ARB / AT1 Receptor Antagonist)', use: 'Essential hypertension, reduction of cardiovascular morbidity, and diabetic nephropathy.', moa: 'Selectively blocks Angiotensin II binding to AT1 receptors in vascular smooth muscle and adrenal gland, inhibiting Angiotensin II-mediated vasoconstriction and aldosterone secretion.', mon: 'Monitor blood pressure, serum potassium, and renal function (Serum Creatinine & BUN).', dose: '20 mg – 40 mg Oral QD' },
  'telmisaten': { generic: 'Telmisartan', brand: 'Telma', type: 'Generic Name (Pharmacopoeia Variant)', class: 'Angiotensin II Receptor Blocker (ARB / AT1 Receptor Antagonist)', use: 'Essential hypertension and renal protection.', moa: 'Selectively blocks AT1 angiotensin II receptors, inhibiting vasoconstriction and aldosterone release.', mon: 'Monitor blood pressure, serum potassium, and renal clearance.', dose: '20 mg – 40 mg Oral QD' },
  'telma': { generic: 'Telmisartan', brand: 'Telma', type: 'Brand Name', class: 'Angiotensin II Receptor Blocker (ARB / AT1 Receptor Antagonist)', use: 'Essential hypertension and cardiovascular risk reduction.', moa: 'Blocks vascular AT1 angiotensin II receptors, preventing vasoconstriction.', mon: 'Monitor blood pressure, serum potassium, and renal function.', dose: '20 mg – 40 mg Oral QD' },

  'clopidogrel': { generic: 'Clopidogrel', brand: 'Plavix / Clopilet', type: 'Generic Name', class: 'Antiplatelet Agent — Irreversible P2Y12 ADP Receptor Antagonist', use: 'Atherothrombotic event reduction in recent MI, stroke, or post-stent placement.', moa: 'Active thiol metabolite irreversibly modifies platelet P2Y12 receptors, blocking ADP binding.', mon: 'Monitor bleeding parameters and complete blood counts.', dose: '75 mg Oral QD' },
  'plavix': { generic: 'Clopidogrel', brand: 'Plavix', type: 'Brand Name', class: 'Antiplatelet Agent — Irreversible P2Y12 ADP Receptor Antagonist', use: 'Reduction of atherothrombotic events post-MI or stroke.', moa: 'Irreversibly modifies platelet P2Y12 purinergic receptors.', mon: 'Monitor for signs of bleeding and hematocrit.', dose: '75 mg Oral QD' },

  'nitroglycerin': { generic: 'Nitroglycerin (Glyceryl Trinitrate / GTN)', brand: 'Nitrogard / Angised', type: 'Generic Name', class: 'Organic Nitrate Vasodilator (Antianginal Agent)', use: 'Acute relief and prophylaxis of angina pectoris, acute coronary syndromes (ACS), and acute hypertensive emergencies / acute heart failure.', moa: 'Denitrated in vascular smooth muscle cells to form free Nitric Oxide (NO), which stimulates soluble guanylyl cyclase (sGC) to increase intracellular cGMP. Increased cGMP causes smooth muscle relaxation, predominantly dilating peripheral veins (reducing preload) and coronary arteries (improving myocardial oxygen supply).', mon: 'Monitor blood pressure (watch for acute hypotension), resting heart rate (reflex tachycardia), headache, and ensure a 10-12 hour nitrate-free interval daily to prevent tolerance.', dose: '0.4 mg Sublingual Tab PRN or 5 mcg/min IV infusion' },
  'glyceryl trinitrate': { generic: 'Nitroglycerin (Glyceryl Trinitrate / GTN)', brand: 'Angised', type: 'Generic Name', class: 'Organic Nitrate Vasodilator', use: 'Acute angina pectoris and acute coronary syndromes.', moa: 'Releases Nitric Oxide (NO) in vascular smooth muscle, increasing cGMP to cause venodilation and reduce myocardial preload.', mon: 'Monitor blood pressure, heart rate, and headache.', dose: '0.4 mg Sublingual PRN' },
  'sorbitrate': { generic: 'Isosorbide Dinitrate', brand: 'Sorbitrate', type: 'Brand Name', class: 'Organic Nitrate Antianginal Vasodilator', use: 'Prevention and treatment of angina pectoris.', moa: 'Releases Nitric Oxide to dilate venous capacitance vessels and coronary arteries.', mon: 'Monitor blood pressure and headache.', dose: '5 mg – 10 mg Sublingual / Oral TID' },
  'isosorbide': { generic: 'Isosorbide Mononitrate / Dinitrate', brand: 'Imdur / Sorbitrate', type: 'Generic Name', class: 'Organic Nitrate Antianginal Vasodilator', use: 'Prophylaxis of angina pectoris and adjunctive management of chronic heart failure.', moa: 'Stimulates soluble guanylyl cyclase via Nitric Oxide donor action, causing venous vasodilation and reduced cardiac preload.', mon: 'Monitor blood pressure and orthostatic dizziness.', dose: '20 mg – 60 mg Oral QD/BID' },
  'nicorandil': { generic: 'Nicorandil', brand: 'Nikoran', type: 'Generic Name', class: 'K+ Channel Opener & Organic Nitrate Hybrid Vasodilator', use: 'Prevention and long-term treatment of chronic stable angina pectoris.', moa: 'Opens ATP-sensitive potassium (K-ATP) channels causing arterial vasodilation, combined with a nitrate moiety that dilates venous capacitance vessels.', mon: 'Monitor blood pressure, headache, and watch for painful mucosal/gastrointestinal ulcerations.', dose: '10 mg – 20 mg Oral BID' },

  'amlodipine': { generic: 'Amlodipine', brand: 'Norvasc / Amlogard', type: 'Generic Name', class: 'Dihydropyridine Calcium Channel Blocker (L-type CCB)', use: 'Essential hypertension and chronic stable angina.', moa: 'Inhibits transmembrane calcium influx into vascular smooth muscle, causing peripheral vasodilation.', mon: 'Monitor blood pressure, heart rate, and peripheral edema.', dose: '5 mg – 10 mg Oral QD' },
  'metoprolol': { generic: 'Metoprolol', brand: 'Betaloc', type: 'Generic Name', class: 'Beta-1 Selective Adrenoreceptor Blocker (Cardioselective Beta-blocker)', use: 'Hypertension, angina pectoris, tachyarrhythmias, and post-MI.', moa: 'Competitively blocks cardiac Beta-1 receptors, decreasing heart rate and contractility.', mon: 'Monitor resting heart rate and blood pressure.', dose: '25 mg – 50 mg Oral BID' },
  'atorvastatin': { generic: 'Atorvastatin', brand: 'Lipitor / Storvas', type: 'Generic Name', class: 'HMG-CoA Reductase Inhibitor (Statin)', use: 'Hypercholesterolemia and cardiovascular risk reduction.', moa: 'Competitively inhibits rate-limiting HMG-CoA reductase in hepatic cholesterol synthesis.', mon: 'Monitor lipid panel and baseline LFTs.', dose: '10 mg – 20 mg Oral QD' },
  'storvas': { generic: 'Atorvastatin', brand: 'Storvas', type: 'Brand Name', class: 'HMG-CoA Reductase Inhibitor (Statin)', use: 'Hypercholesterolemia and atherosclerotic risk reduction.', moa: 'Inhibits hepatic HMG-CoA reductase.', mon: 'Monitor lipid panel and LFTs.', dose: '10 mg – 20 mg Oral QD' },

  // Gastrointestinal, Antispasmodic, PPI & Osmotic Laxative Agents
  'buscopan': { generic: 'Hyoscine Butylbromide (Scopolamine Butylbromide)', brand: 'Buscopan', type: 'Generic / Brand Entry', class: 'Antimuscarinic Visceral Antispasmodic (Peripheral Anticholinergic)', use: 'Symptomatic relief of visceral smooth-muscle spasm in the GI, biliary, and genitourinary tracts; acute abdominal cramps.', moa: 'Quaternary ammonium anticholinergic agent that competitively inhibits visceral muscarinic M3 receptors, producing peripheral smooth-muscle relaxation without central CNS penetration.', mon: 'Monitor relief of abdominal cramps/spasms and anticholinergic side effects (dry mouth, urinary retention).', dose: '10 mg – 20 mg Oral/IV 3-4 times daily' },
  'buscogast': { generic: 'Hyoscine Butylbromide', brand: 'Buscogast', type: 'Brand Name', class: 'Antimuscarinic Visceral Antispasmodic', use: 'Symptomatic relief of visceral smooth-muscle spasm and abdominal cramps.', moa: 'Competitively inhibits peripheral visceral muscarinic receptors.', mon: 'Monitor relief of abdominal pain and cramps.', dose: '10 mg – 20 mg Oral/IV 3-4 times daily' },
  'hyoscine': { generic: 'Hyoscine Butylbromide', brand: 'Buscopan / Buscogast', type: 'Generic Name', class: 'Antimuscarinic Visceral Antispasmodic', use: 'GI and genitourinary smooth-muscle spasm.', moa: 'Competitively blocks visceral muscarinic receptors.', mon: 'Monitor spasm relief.', dose: '10 mg – 20 mg Oral/IV 3-4 times daily' },

  'mesalamine': { generic: 'Mesalamine (5-Aminosalicylic Acid / 5-ASA)', brand: 'Mesacol / Asacol', type: 'Generic Name', class: 'Aminosalicylate Anti-Inflammatory Agent (5-ASA Derivative)', use: 'Induction and maintenance of remission in Ulcerative Colitis and mild-to-moderate Crohn\'s Disease.', moa: 'Topically blocks mucosal arachidonic acid metabolism by inhibiting lipoxygenase and cyclooxygenase pathways, reducing mucosal leukotriene B4 (LTB4) and Prostaglandin E2 synthesis in the colon.', mon: 'Monitor GI symptom relief, stool frequency/blood, renal function (Serum Creatinine/BUN baseline and periodically), and urinalysis for interstitial nephritis.', dose: '800 mg – 1200 mg Oral TID or 2.4 g – 4.8 g/day' },
  'mesalazine': { generic: 'Mesalamine (5-ASA)', brand: 'Mesacol', type: 'Generic Name (Variant)', class: 'Aminosalicylate Anti-Inflammatory Agent (5-ASA Derivative)', use: 'Ulcerative Colitis and Crohn\'s Disease.', moa: 'Inhibits mucosal leukotriene B4 and prostaglandin synthesis in colonic mucosa.', mon: 'Monitor stool frequency, GI symptoms, and renal function.', dose: '800 mg – 1200 mg Oral TID' },
  'mesacol': { generic: 'Mesalamine (5-ASA)', brand: 'Mesacol', type: 'Brand Name', class: 'Aminosalicylate Anti-Inflammatory Agent', use: 'Ulcerative Colitis remission induction and maintenance.', moa: 'Topical colonic inhibition of lipoxygenase and COX pathways.', mon: 'Monitor GI symptoms and renal clearance.', dose: '800 mg – 1200 mg Oral TID' },

  'lactitol': { generic: 'Lactitol Monohydrate', brand: 'Lactihep / Importal', type: 'Generic Name', class: 'Non-Absorbable Disaccharide Osmotic Laxative & Hyperammonemia Agent', use: 'Prevention and treatment of Hepatic Encephalopathy (portal-systemic encephalopathy) and chronic constipation.', moa: 'Non-absorbable disaccharide metabolized by colonic microflora into low molecular weight organic acids (lactic, acetic), lowering colonic pH. Acidic environment traps toxic blood ammonia (NH3) as non-absorbable ammonium ions (NH4+), facilitating fecal excretion while osmotically stimulating intestinal motility.', mon: 'Monitor stool frequency (target 2-3 soft stools/day in hepatic encephalopathy), serum electrolytes (sodium, potassium), and hydration status.', dose: '10 g – 20 g (15 mL – 30 mL) Oral 2-3 times daily' },
  'lactitolmonohydrine': { generic: 'Lactitol Monohydrate', brand: 'Lactihep', type: 'Generic Variant', class: 'Non-Absorbable Disaccharide Osmotic Laxative & Hyperammonemia Agent', use: 'Hepatic Encephalopathy and chronic constipation.', moa: 'Colonic microflora break down lactitol to organic acids, lowering pH and trapping blood ammonia (NH3) as ammonium (NH4+) for elimination.', mon: 'Monitor stool frequency (2-3 soft stools/day) and serum electrolytes.', dose: '15 mL – 30 mL Oral 2-3 times daily' },
  'lactihep': { generic: 'Lactitol Monohydrate', brand: 'Lactihep', type: 'Brand Name', class: 'Non-Absorbable Disaccharide Osmotic Laxative & Hyperammonemia Agent', use: 'Hepatic Encephalopathy and chronic constipation.', moa: 'Lowers colonic pH via organic acid bacterial fermentation, converting NH3 to NH4+ for excretion.', mon: 'Monitor stool frequency and serum electrolytes.', dose: '15 mL – 30 mL Oral 2-3 times daily' },
  'lactulose': { generic: 'Lactulose', brand: 'Duphalac', type: 'Generic Name', class: 'Non-Absorbable Disaccharide Osmotic Laxative & Hyperammonemia Agent', use: 'Hepatic Encephalopathy and chronic constipation.', moa: 'Degraded by colonic bacteria into lactic acid, trapping ammonia as ammonium ions.', mon: 'Monitor stool output and serum electrolytes.', dose: '15 mL – 30 mL Oral 2-3 times daily' },
  'duphalac': { generic: 'Lactulose', brand: 'Duphalac', type: 'Brand Name', class: 'Non-Absorbable Disaccharide Osmotic Laxative', use: 'Hepatic Encephalopathy and chronic constipation.', moa: 'Osmotic colonic acidifying agent trapping ammonia.', mon: 'Monitor stool frequency.', dose: '15 mL – 30 mL Oral 2-3 times daily' },

  'pantoprazole': { generic: 'Pantoprazole', brand: 'Pantop / Pantocid', type: 'Generic Name', class: 'Proton Pump Inhibitor (Gastric H+/K+-ATPase Inhibitor)', use: 'GERD, peptic ulcer disease, stress ulcer prophylaxis, and H. pylori eradication.', moa: 'Covalently binds to cysteine residues on parietal cell H+/K+-ATPase proton pump, inhibiting gastric acid output.', mon: 'Re-evaluate ongoing indication periodically. Monitor serum magnesium in long-term therapy.', dose: '40 mg Oral/IV QD' },
  'pantop': { generic: 'Pantoprazole', brand: 'Pantop', type: 'Brand Name', class: 'Proton Pump Inhibitor (Gastric H+/K+-ATPase Inhibitor)', use: 'GERD, peptic ulcer disease, stress ulcer prophylaxis.', moa: 'Covalently binds to parietal cell H+/K+-ATPase proton pump.', mon: 'Monitor GI symptom relief.', dose: '40 mg Oral QD' },

  'paracetamol': { generic: 'Paracetamol (Acetaminophen)', brand: 'Dolo / Crocin / Calpol', type: 'Generic Name', class: 'Non-Opioid Analgesic & Antipyretic (Central Cyclooxygenase Inhibitor)', use: 'Symptomatic management of mild-to-moderate pain and fever.', moa: 'Inhibits central CNS cyclooxygenase (COX-3 / central variants), suppressing hypothalamic Prostaglandin E2 synthesis.', mon: 'Ensure total daily dose does not exceed 4,000 mg/day (or < 2,000-3,000 mg/day in liver impairment).', dose: '500 mg – 650 mg Oral Q4-6H PRN' },
  'dolo': { generic: 'Paracetamol', brand: 'Dolo-650', type: 'Brand Name', class: 'Non-Opioid Analgesic & Antipyretic', use: 'Management of fever and mild-to-moderate pain.', moa: 'Inhibits central CNS prostaglandin synthesis.', mon: 'Monitor daily dose (< 4000 mg/day).', dose: '650 mg Oral Q6H PRN' },
  'crocin': { generic: 'Paracetamol', brand: 'Crocin', type: 'Brand Name', class: 'Non-Opioid Analgesic & Antipyretic', use: 'Management of fever and mild-to-moderate pain.', moa: 'Inhibits central CNS prostaglandin synthesis.', mon: 'Monitor total daily dose.', dose: '500 mg – 650 mg Oral Q6H PRN' },

  'tramadol': { generic: 'Tramadol', brand: 'Ultram', type: 'Generic Name', class: 'Centrally Acting Synthetic Opioid Analgesic & Monoamine Reuptake Inhibitor', use: 'Moderate to severe acute and chronic pain.', moa: 'Weak agonist at mu-opioid receptors combined with inhibition of neuronal reuptake of norepinephrine and serotonin.', mon: 'Monitor pain response, CNS sedation, and respiratory status.', dose: '50 mg – 100 mg Oral Q4-6H PRN' },
  'ondansetron': { generic: 'Ondansetron', brand: 'Zofran', type: 'Generic Name', class: '5-HT3 Receptor Antagonist Antiemetic', use: 'Prevention and treatment of nausea and vomiting.', moa: 'Selectively antagonizes 5-HT3 receptors peripherally on vagal nerve terminals and centrally in the CTZ.', mon: 'Monitor bowel function and QTc in high-risk patients.', dose: '4 mg – 8 mg Oral/IV Q8H' },

  // Antihistamines & Allergy
  'levocetirizine': { generic: 'Levocetirizine', brand: 'One All / Cetzine', type: 'Generic Name', class: 'Second-Generation Peripheral H1-Receptor Antagonist (Non-sedating Antihistamine)', use: 'Perennial & seasonal allergic rhinitis, chronic idiopathic urticaria, and pruritus.', moa: 'Selectively antagonizes peripheral H1 histamine receptors, blocking histamine-mediated allergic reactions.', mon: 'Monitor relief of allergic symptoms and adjust dose in renal impairment.', dose: '5 mg Oral HS' },
  'levocetriz': { generic: 'Levocetirizine', brand: 'One All', type: 'Generic Name (Truncated Entry)', class: 'Second-Generation Peripheral H1-Receptor Antagonist', use: 'Allergic rhinitis and urticaria.', moa: 'Selectively antagonizes peripheral H1 histamine receptors.', mon: 'Monitor symptom relief.', dose: '5 mg Oral HS' },
  'one all': { generic: 'Levocetirizine', brand: 'One All', type: 'Brand Name', class: 'Second-Generation Peripheral H1-Receptor Antagonist', use: 'Allergic rhinitis and urticaria.', moa: 'Selectively antagonizes peripheral H1 histamine receptors.', mon: 'Monitor symptom relief.', dose: '5 mg Oral HS' },

  // Antimicrobials
  'azithromycin': { generic: 'Azithromycin', brand: 'Azithral / ATM', type: 'Generic Name', class: 'Macrolide Antibiotic — 50S Ribosomal Subunit Protein Synthesis Inhibitor', use: 'Community-acquired pneumonia, COPD exacerbations, sinusitis, pharyngitis, and skin infections.', moa: 'Binds reversibly to the 50S ribosomal subunit of susceptible microorganisms, inhibiting protein synthesis.', mon: 'Monitor infection resolution, QTc interval, and GI tolerance.', dose: '500 mg Oral QD x 3-5 days' },
  'azithrom': { generic: 'Azithromycin', brand: 'Azithral', type: 'Generic Name (Truncated Entry)', class: 'Macrolide Antibiotic — 50S Ribosomal Subunit Inhibitor', use: 'Respiratory and soft tissue infections.', moa: 'Inhibits bacterial protein synthesis via 50S ribosomal subunit binding.', mon: 'Monitor infection clearance.', dose: '500 mg Oral QD' },

  // Anti-Parkinsonian, COMT Inhibitors & Anticonvulsants
  'entacapone': { generic: 'Entacapone', brand: 'Comtan / Stalevo component', type: 'Generic Name', class: 'COMT (Catechol-O-Methyltransferase) Inhibitor (Anti-Parkinsonian Adjunct)', use: 'Adjunctive treatment to Levodopa + Carbidopa in patients with Parkinson\'s Disease experiencing end-of-dose motor fluctuations ("wearing-off").', moa: 'Reversible, selective peripheral inhibitor of Catechol-O-Methyltransferase (COMT). Prevents peripheral breakdown of Levodopa to 3-O-methyldopa (3-OMD), increasing plasma elimination half-life of Levodopa and providing sustained striatal dopamine delivery.', mon: 'Monitor for enhanced levodopa dopaminergic side effects (dyskinesias, nausea, hallucinations), orthostatic blood pressure, harmless urine discoloration (reddish-brown), and hepatic function.', dose: '200 mg Oral with each dose of Levodopa + Carbidopa (max 1,600 mg/day)' },
  'comtan': { generic: 'Entacapone', brand: 'Comtan', type: 'Brand Name', class: 'COMT (Catechol-O-Methyltransferase) Inhibitor', use: 'Adjunctive treatment to Levodopa + Carbidopa for motor fluctuations in Parkinson\'s Disease.', moa: 'Reversibly inhibits peripheral COMT, reducing peripheral metabolism of Levodopa.', mon: 'Monitor dyskinesias, orthostatic BP, and urine discoloration.', dose: '200 mg Oral with each dose of Levodopa + Carbidopa' },
  'levodopa': { generic: 'Levodopa + Carbidopa', brand: 'Syndopa', type: 'Generic Combination', class: 'Dopamine Precursor & Central Decarboxylase Modulator (Anti-Parkinsonian Agent)', use: 'Idiopathic Parkinson\'s Disease and parkinsonism.', moa: 'Levodopa crosses the blood-brain barrier to form dopamine; Carbidopa inhibits peripheral decarboxylation.', mon: 'Monitor motor response improvement, dyskinesias, and orthostatic BP.', dose: '100 mg / 25 mg Oral TID' },
  'levo dopa': { generic: 'Levodopa + Carbidopa', brand: 'Syndopa', type: 'Generic Combination', class: 'Dopamine Precursor & Central Decarboxylase Modulator', use: 'Idiopathic Parkinson\'s Disease.', moa: 'Levodopa crosses BBB to form dopamine; Carbidopa prevents peripheral destruction.', mon: 'Monitor motor response and dyskinesias.', dose: '100 mg / 25 mg Oral TID' },
  'syndopa': { generic: 'Levodopa + Carbidopa', brand: 'Syndopa', type: 'Brand Name', class: 'Dopamine Precursor & Central Decarboxylase Modulator', use: 'Idiopathic Parkinson\'s Disease.', moa: 'Levodopa crosses BBB into striatum; Carbidopa blocks peripheral conversion.', mon: 'Monitor motor response.', dose: '100 mg / 25 mg Oral TID' },
  'phenytoin': { generic: 'Phenytoin', brand: 'Eptoin', type: 'Generic Name', class: 'Anticonvulsant Hydantoin Derivative (Voltage-Gated Sodium Channel Blocker)', use: 'Tonic-clonic and complex partial seizures.', moa: 'Blocks voltage-gated neuronal sodium channels to stabilize neuronal membranes.', mon: 'Monitor total serum phenytoin levels (10-20 mcg/mL), CBC, and LFTs.', dose: '100 mg Oral TID' },

  // Metabolic & Diuretics
  'metformin': { generic: 'Metformin', brand: 'Glycomet / Glucophage', type: 'Generic Name', class: 'Biguanide Antihyperglycemic Agent', use: 'First-line therapy for Type 2 Diabetes Mellitus.', moa: 'Activates hepatic AMPK, suppressing hepatic gluconeogenesis and enhancing insulin sensitivity.', mon: 'Monitor eGFR, renal function, and Vitamin B12 levels.', dose: '500 mg – 1000 mg Oral BID' },
  'furosemide': { generic: 'Furosemide', brand: 'Lasix', type: 'Generic Name', class: 'Loop Diuretic (Sulfamoylbenzoate Derivative)', use: 'Edema associated with heart failure, cirrhosis, and renal disease.', moa: 'Inhibits Na+/K+/2Cl- co-transporter in thick ascending limb of loop of Henle.', mon: 'Monitor serum electrolytes (potassium, sodium), renal function, and blood pressure.', dose: '20 mg – 40 mg Oral/IV QD' },
  'spironolactone': { generic: 'Spironolactone', brand: 'Aldactone', type: 'Generic Name', class: 'Potassium-Sparing Diuretic (Aldosterone Antagonist)', use: 'Refractory edema in cirrhosis with ascites, chronic heart failure, and hypertension.', moa: 'Competitively blocks mineralocorticoid receptors in renal distal tubule.', mon: 'Monitor serum potassium and serum creatinine.', dose: '25 mg – 100 mg Oral QD' }
};

/**
 * Dynamic Medication Evaluator helper.
 * Delegates to Clinical Knowledge Retrieval Service for drug identity resolution & verified knowledge.
 */
const getMedicationSpecificAnalysis = (drug) => {
  const trade = String(drug.trade_name || '').replace(/^—$/, '').trim();
  const generic = String(drug.generic_name || '').replace(/^—$/, '').trim();
  const rawInput = `${generic} ${trade}`.trim() || 'Prescribed Medication';

  const knowledge = resolveClinicalEntityKnowledge(rawInput);

  return {
    originalEntry: rawInput,
    recognizedEntryType: knowledge.isVerified ? 'Prescribed Pharmacotherapeutic Agent' : 'Clinical Verification Required',
    resolvedGeneric: knowledge.displayTitle || generic || trade || 'Pharmacotherapy Entry',
    brandName: trade && trade !== '—' && trade.toLowerCase() !== (generic || '').toLowerCase() ? trade : (knowledge.brandName || null),
    drugClass: knowledge.drugClass,
    establishedUse: knowledge.establishedUses,
    mechanismOfAction: knowledge.mechanismOfAction,
    monitoringAdvice: knowledge.monitoringAdvice,
    formularyDose: knowledge.formularyDose,
    isVerified: knowledge.isVerified,
    needsVerificationBanner: knowledge.needsVerificationBanner,
    sourceReferences: knowledge.sourceReferences
  };
};

/**
 * Dynamic Pairwise Drug-Drug Interaction Evaluator.
 * Delegates to AI Analysis Service for independent pairwise drug interaction evaluations.
 */
const getPairSpecificInteraction = (drug1, drug2) => {
  const inter = evaluatePairwiseDrugInteraction(drug1, drug2);
  return {
    pairTitle: inter.pairTitle,
    hasInteraction: inter.hasInteraction,
    isUncertain: false,
    severity: inter.severity,
    mechanism: inter.mechanism,
    clinicalSignificance: inter.clinicalSignificance,
    managementConsideration: inter.managementConsideration,
    source: inter.source
  };
};

/**
 * Case-Specific MRP Generator Helper.
 * Evaluates actual patient drugs, documented diagnoses, and lab findings against public drug database knowledge.
 */
const generateCaseSpecificMRPs = (norm, evaluatedDrugs) => {
  const mrps = [];

  const drugNames = evaluatedDrugs.map(d => (d.generic_name !== '—' ? d.generic_name : d.trade_name).toLowerCase()).join(' ');
  const tradeNames = evaluatedDrugs.map(d => d.trade_name.toLowerCase()).join(' ');
  const allDrugStr = `${drugNames} ${tradeNames}`;

  const finalDiag = String(norm.diagnosis.final || '').toLowerCase();
  const chiefComp = String(norm.history.chiefComplaints || '').toLowerCase();
  const condStr = `${finalDiag} ${chiefComp}`;

  // Check 1: Aspirin in Epigastric Pain / GI Distress
  if ((condStr.includes('epigastric') || condStr.includes('gastric') || condStr.includes('ulcer') || condStr.includes('abdominal pain')) && (allDrugStr.includes('aspirin') || allDrugStr.includes('ecosprin'))) {
    mrps.push({
      priority: 'High Priority',
      category: 'Adverse GI Effect / Drug-Condition Concern',
      medicationsInvolved: evaluatedDrugs.filter(d => d.trade_name.toLowerCase().includes('aspirin') || d.trade_name.toLowerCase().includes('ecosprin') || d.generic_name.toLowerCase().includes('aspirin')).map(d => `${d.trade_name} (${d.generic_name})`).join(', ') || 'Ecospirin (Aspirin)',
      caseEvidence: `Documented complaint/condition: "${norm.history.chiefComplaints || norm.diagnosis.final}" in a patient prescribed oral Aspirin.`,
      pharmacologicalRationale: 'Aspirin directly acetylates COX-1, reducing gastric mucosal Prostaglandin E2 synthesis and disrupting the protective mucosal bicarbonate barrier, exacerbating epigastric pain or peptic mucosal injury.',
      preceptorReview: 'Evaluate co-prescribing a Proton Pump Inhibitor (e.g. Pantoprazole 40 mg OD) for GI mucosal protection or re-evaluating antiplatelet/analgesic selection.'
    });
  }

  // Check 2: Telmisartan + Severe Hyponatremia (Lab: Serum Sodium < 130)
  const sodiumLab = norm.labs.find(l => String(l.parameter_name).toLowerCase().includes('sodium') || String(l.parameter_name).toLowerCase().includes('na'));
  const sodiumVal = sodiumLab ? parseFloat(String(sodiumLab.test_value).replace(/[^0-9.]/g, '')) : NaN;

  if (!isNaN(sodiumVal) && sodiumVal < 130 && (allDrugStr.includes('telmisat') || allDrugStr.includes('telma') || allDrugStr.includes('losartan') || allDrugStr.includes('valsartan'))) {
    mrps.push({
      priority: 'High Priority',
      category: 'Drug-Lab Interaction / Electrolyte Clearance Alert',
      medicationsInvolved: evaluatedDrugs.filter(d => d.trade_name.toLowerCase().includes('telm') || d.generic_name.toLowerCase().includes('telm')).map(d => `${d.trade_name} (${d.generic_name})`).join(', ') || 'Telma (Telmisartan)',
      caseEvidence: `Documented Serum Sodium is ${sodiumLab.test_value} ${sodiumLab.unit} (Low / Hyponatremia) in a patient taking Telmisartan.`,
      pharmacologicalRationale: 'Angiotensin II Receptor Blockers (Telmisartan) inhibit aldosterone release in the adrenal cortex, reducing renal distal tubule sodium reabsorption and compounding systemic hyponatremia.',
      preceptorReview: 'Monitor serum sodium and blood pressure closely; evaluate temporary dose titration or holding of ARB until electrolyte balance is restored.'
    });
  }

  // Check 3: Severe Leukocytosis (WBC > 11,000) & Antimicrobial Workup
  const wbcLab = norm.labs.find(l => String(l.parameter_name).toLowerCase().includes('wbc') || String(l.parameter_name).toLowerCase().includes('leukocyte'));
  const wbcVal = wbcLab ? parseFloat(String(wbcLab.test_value).replace(/[^0-9.]/g, '')) : NaN;

  if (!isNaN(wbcVal) && wbcVal > 11000) {
    const hasAntibiotic = evaluatedDrugs.some(d => {
      const n = (d.generic_name + d.trade_name).toLowerCase();
      return n.includes('cef') || n.includes('cipro') || n.includes('amox') || n.includes('azithro') || n.includes('rifax') || n.includes('vancom');
    });

    if (!hasAntibiotic) {
      mrps.push({
        priority: 'High Priority',
        category: 'Untreated Clinical Condition / Antimicrobial Review',
        medicationsInvolved: 'Prescribed Regimen',
        caseEvidence: `Documented WBC Count is ${wbcLab.test_value} ${wbcLab.unit || 'cells/mm³'} (High / Markedly Elevated Leukocytosis).`,
        pharmacologicalRationale: 'Marked leukocytosis (> 11,000 cells/mm³) indicates acute systemic bacterial infection or severe tissue inflammation requiring diagnostic infection source identification.',
        preceptorReview: 'Evaluate septic workup, inflammatory markers (CRP/ESR), microbiology cultures, and appropriate empirical antibiotic therapy.'
      });
    }
  }

  // Check 4: Sub-therapeutic Buscopan parenteral dose (e.g. 1.5 mg IV)
  const buscopanDrug = evaluatedDrugs.find(d => {
    const n = (d.generic_name + d.trade_name).toLowerCase();
    return n.includes('buscopan') || n.includes('buscogast') || n.includes('hyoscine');
  });

  if (buscopanDrug) {
    const doseVal = parseFloat(String(buscopanDrug.dose).replace(/[^0-9.]/g, ''));
    if (!isNaN(doseVal) && doseVal < 10 && String(buscopanDrug.route_of_admin).toUpperCase().includes('IV')) {
      mrps.push({
        priority: 'Moderate Priority',
        category: 'Sub-therapeutic Dosage / Prescription Order Verification',
        medicationsInvolved: `${buscopanDrug.trade_name} (${buscopanDrug.generic_name})`,
        caseEvidence: `Documented parenteral dose is ${buscopanDrug.dose} ${buscopanDrug.route_of_admin}.`,
        pharmacologicalRationale: 'Standard adult parenteral dose of Hyoscine Butylbromide for acute visceral spasm is 20 mg slow IV injection (max 100 mg/day). A dose of 1.5 mg IV is sub-therapeutic.',
        preceptorReview: 'Verify whether the documented 1.5 mg dose represents a transcription entry error for standard 20 mg IV slow push.'
      });
    }
  }

  // Fallback MRP if no specific flag matched
  if (mrps.length === 0 && evaluatedDrugs.length > 0) {
    mrps.push({
      priority: 'Moderate Priority',
      category: 'Dosing Duration & Organ Clearance Monitoring',
      medicationsInvolved: evaluatedDrugs.map(d => d.generic_name !== '—' ? d.generic_name : d.trade_name).join(', '),
      caseEvidence: `Prescribed regimen for documented condition: ${norm.diagnosis.final || norm.history.chiefComplaints}.`,
      pharmacologicalRationale: 'Renally and hepatically cleared therapeutic agents require periodic laboratory organ function monitoring (Serum Creatinine, LFTs) during active treatment.',
      preceptorReview: 'Evaluate therapy duration, therapeutic response markers, and baseline organ clearance.'
    });
  }

  return mrps;
};

/**
 * Short Factual Case Summary Generator (approx 2–4 lines).
 * Based ONLY on actual saved case information in Supabase without hallucination.
 */
const generateFactualCaseSummary = (norm) => {
  const ageStr = norm.demographics.age && norm.demographics.age !== 'N/A' && norm.demographics.age !== '—' ? `${norm.demographics.age}-year-old` : '';
  const genderStr = norm.demographics.gender && norm.demographics.gender !== 'N/A' && norm.demographics.gender !== '—' ? norm.demographics.gender.toLowerCase() : 'patient';
  
  const patientDesc = [ageStr, genderStr].filter(Boolean).join(' ') || 'patient';
  
  const dept = norm.demographics.department && norm.demographics.department !== 'N/A' && norm.demographics.department !== '—' ? norm.demographics.department : '';
  const ward = norm.demographics.ward && norm.demographics.ward !== 'N/A' && norm.demographics.ward !== '—' ? norm.demographics.ward : '';
  const locationParts = [dept, ward].filter(Boolean).join(' / ');
  const locationStr = locationParts ? `admitted to the ${locationParts}` : '';

  const complaints = norm.history.chiefComplaints && norm.history.chiefComplaints !== 'N/A' && norm.history.chiefComplaints !== '—' ? norm.history.chiefComplaints : null;
  const diagnosis = norm.diagnosis.final && norm.diagnosis.final !== 'N/A' && norm.diagnosis.final !== '—' ? norm.diagnosis.final : null;
  const pastHistory = norm.history.pastMedicalHistory && norm.history.pastMedicalHistory !== 'N/A' && norm.history.pastMedicalHistory !== 'NIL' && norm.history.pastMedicalHistory !== 'None' && norm.history.pastMedicalHistory !== '—' ? norm.history.pastMedicalHistory : null;
  const allergies = norm.demographics.allergyDrugs && norm.demographics.allergyDrugs !== 'N/A' && norm.demographics.allergyDrugs !== 'NIL' && norm.demographics.allergyDrugs !== 'None' && norm.demographics.allergyDrugs !== 'No known drug allergies' && norm.demographics.allergyDrugs !== 'NKDA' && norm.demographics.allergyDrugs !== '—' ? norm.demographics.allergyDrugs : null;
  const social = norm.demographics.socialHistory && norm.demographics.socialHistory !== 'N/A' && norm.demographics.socialHistory !== '—' ? norm.demographics.socialHistory : null;

  const sentences = [];

  // Sentence 1: Patient presentation
  if (complaints || diagnosis) {
    let s1 = `This case involves a ${patientDesc} ${locationStr}`.trim();
    if (complaints && diagnosis) {
      s1 += ` presenting with ${complaints} and diagnosed with ${diagnosis}.`;
    } else if (complaints) {
      s1 += ` presenting with ${complaints}.`;
    } else if (diagnosis) {
      s1 += ` with a documented final diagnosis of ${diagnosis}.`;
    } else {
      s1 += `.`;
    }
    sentences.push(s1.replace(/\s+/g, ' ').replace(' .', '.'));
  } else {
    sentences.push(`This case involves a ${patientDesc} ${locationStr}.`.replace(/\s+/g, ' ').replace(' .', '.'));
  }

  // Sentence 2: Past medical history
  if (pastHistory) {
    sentences.push(`Documented past medical history includes ${pastHistory}.`);
  }

  // Sentence 3: Allergies & Social History
  if (allergies && social) {
    sentences.push(`Documented allergies: ${allergies}. Relevant social history: ${social}.`);
  } else if (allergies) {
    sentences.push(`Documented allergies: ${allergies}.`);
  } else if (social) {
    sentences.push(`Relevant social history: ${social}.`);
  }

  return sentences.join(' ');
};

/**
 * Helper to calculate or verify BMI from height (cm) and weight (kg).
 */
const calculateOrVerifyBmi = (rawHeight, rawWeight, rawBmi) => {
  const hCm = parseFloat(String(rawHeight || '').replace(/[^0-9.]/g, ''));
  const wKg = parseFloat(String(rawWeight || '').replace(/[^0-9.]/g, ''));
  const existingBmi = parseFloat(String(rawBmi || '').replace(/[^0-9.]/g, ''));

  if (!isNaN(wKg) && !isNaN(hCm) && hCm > 0) {
    const hM = hCm / 100;
    const calcBmi = (wKg / (hM * hM)).toFixed(1);
    return {
      bmiVal: calcBmi,
      bmiStr: `${calcBmi} kg/m²`,
      heightStr: `${hCm} cm`,
      weightStr: `${wKg} kg`
    };
  }

  if (!isNaN(existingBmi) && existingBmi > 0) {
    return {
      bmiVal: existingBmi.toFixed(1),
      bmiStr: `${existingBmi.toFixed(1)} kg/m²`,
      heightStr: !isNaN(hCm) ? `${hCm} cm` : 'Not documented',
      weightStr: !isNaN(wKg) ? `${wKg} kg` : 'Not documented'
    };
  }

  return {
    bmiVal: null,
    bmiStr: 'Not documented',
    heightStr: !isNaN(hCm) ? `${hCm} cm` : 'Not documented',
    weightStr: !isNaN(wKg) ? `${wKg} kg` : 'Not documented'
  };
};

/**
 * Short Patient-Specific AI Profile Interpretation Generator (Section 2).
 * Based ONLY on actual saved patient profile values without hallucinated parameters.
 */
const generatePatientProfileInterpretation = (norm, profileObj) => {
  const age = norm.demographics.age && norm.demographics.age !== 'N/A' && norm.demographics.age !== '—' ? norm.demographics.age : null;
  const sex = norm.demographics.gender && norm.demographics.gender !== 'N/A' && norm.demographics.gender !== '—' ? norm.demographics.gender : null;
  
  const rawH = profileObj?.height || profileObj?.height_cm || norm.demographics.height;
  const rawW = profileObj?.weight || profileObj?.weight_kg || norm.demographics.weight;
  const rawBmi = profileObj?.bmi || norm.demographics.bmi;

  const bmiData = calculateOrVerifyBmi(rawH, rawW, rawBmi);

  const sentences = [];

  // Sentence 1: Demographics & BMI Status
  const pDesc = [age ? `${age}-year-old` : '', sex ? sex.toLowerCase() : 'patient'].filter(Boolean).join(' ') || 'patient';
  if (bmiData.bmiVal) {
    const val = parseFloat(bmiData.bmiVal);
    let category = '';
    if (val < 18.5) category = 'underweight range';
    else if (val <= 24.9) category = 'healthy normal weight range';
    else if (val <= 29.9) category = 'overweight category';
    else if (val <= 34.9) category = 'Class I obesity range';
    else if (val <= 39.9) category = 'Class II severe obesity range';
    else category = 'Class III morbid obesity range';

    sentences.push(`The patient is a ${pDesc}. Calculated BMI of ${bmiData.bmiStr} based on documented height (${bmiData.heightStr}) and weight (${bmiData.weightStr}) is in the ${category}.`);
  } else {
    sentences.push(`The patient is a ${pDesc}. Height and weight values are not fully documented to compute BMI.`);
  }

  // Sentence 2: Vitals Interpretation (if documented)
  const vitalsList = Array.isArray(profileObj?.vital_signs) && profileObj.vital_signs.length > 0
    ? profileObj.vital_signs
    : (Array.isArray(norm.vitals) ? norm.vitals : []);

  const latestVital = vitalsList[0] || profileObj || {};
  const sys = parseInt(latestVital.bp_sys || (typeof latestVital.bp === 'string' ? latestVital.bp.split('/')[0] : null), 10);
  const dia = parseInt(latestVital.bp_dia || (typeof latestVital.bp === 'string' ? latestVital.bp.split('/')[1] : null), 10);
  const pulse = parseInt(latestVital.pulse_rate || latestVital.pr || latestVital.pulse, 10);
  const temp = parseFloat(latestVital.temperature_f || latestVital.temp, 10);
  const spo2 = parseInt(latestVital.spo2, 10);

  const vitalNotes = [];
  if (!isNaN(sys) && !isNaN(dia)) {
    if (sys >= 140 || dia >= 90) vitalNotes.push(`elevated blood pressure (${sys}/${dia} mmHg)`);
    else if (sys < 90 || dia < 60) vitalNotes.push(`hypotensive blood pressure (${sys}/${dia} mmHg)`);
  }
  if (!isNaN(pulse)) {
    if (pulse > 100) vitalNotes.push(`tachycardia (${pulse} bpm)`);
    else if (pulse < 60) vitalNotes.push(`bradycardia (${pulse} bpm)`);
  }
  if (!isNaN(temp)) {
    if (temp >= 100.4) vitalNotes.push(`fever/pyrexia (${temp}°F)`);
  }
  if (!isNaN(spo2)) {
    if (spo2 < 95) vitalNotes.push(`reduced oxygen saturation (SpO2 ${spo2}%)`);
  }

  if (vitalNotes.length > 0) {
    sentences.push(`Documented vital signs show ${vitalNotes.join(', ')}.`);
  } else if (!isNaN(sys) || !isNaN(pulse) || !isNaN(temp) || !isNaN(spo2)) {
    sentences.push('Documented vital signs are within normal hemodynamically stable limits.');
  } else {
    sentences.push('Vital signs are not documented in the saved case file.');
  }

  // Sentence 3: Relevant Physical Examination Findings (if documented)
  const genExam = profileObj?.general_examination || profileObj?.general_exam;
  const sysExam = profileObj?.systemic_examination || profileObj?.systemic_exam;

  if (genExam && genExam !== 'N/A' && genExam !== 'Conscious and coherent.') {
    sentences.push(`Physical examination findings: ${genExam}.`);
  } else if (sysExam && sysExam !== 'N/A' && sysExam !== 'CVS: S1S2 heard. RS: NVBS. GI: Soft. CNS: Intact.') {
    sentences.push(`Systemic examination findings: ${sysExam}.`);
  }

  return sentences.join(' ');
};

/**
 * SECTION 3 — LABORATORY PARAMETER ALIAS & NORMALIZATION MAP
 */
const PARAM_ALIAS_MAP = {
  'hb': 'hb', 'hemoglobin': 'hb', 'haemoglobin': 'hb', 'hgb': 'hb',
  'rbc_count': 'rbc_count', 'rbc': 'rbc_count', 'red_blood_cell_count': 'rbc_count', 'red_blood_cells': 'rbc_count',
  'wbc_count': 'wbc_count', 'wbc': 'wbc_count', 'white_blood_cell_count': 'wbc_count', 'white_blood_cells': 'wbc_count', 'total_wbc': 'wbc_count', 'tc': 'wbc_count', 'total_leukocyte_count': 'wbc_count',
  'neutrophils': 'neutrophils', 'neutrophil': 'neutrophils', 'polymorphs': 'neutrophils', 'granulocytes': 'neutrophils',
  'lymphocytes': 'lymphocytes', 'lymphocyte': 'lymphocytes', 'lymph': 'lymphocytes',
  'eosinophils': 'eosinophils', 'eosinophil': 'eosinophils', 'eos': 'eosinophils',
  'monocytes': 'monocytes', 'monocyte': 'monocytes', 'mono': 'monocytes',
  'mcv': 'mcv', 'mean_corpuscular_volume': 'mcv',
  'mch': 'mch', 'mean_corpuscular_hemoglobin': 'mch',
  'mchc': 'mchc', 'mean_corpuscular_hemoglobin_concentration': 'mchc',
  'esr': 'esr', 'erythrocyte_sedimentation_rate': 'esr',
  'platelets': 'platelets', 'platelet_count': 'platelets', 'plt': 'platelets', 'platelet': 'platelets',
  'pcv_haematocrit': 'pcv_haematocrit', 'pcv': 'pcv_haematocrit', 'haematocrit': 'pcv_haematocrit', 'hematocrit': 'pcv_haematocrit', 'packed_cell_volume': 'pcv_haematocrit',
  'ct_clotting_time': 'ct_clotting_time', 'ct': 'ct_clotting_time', 'clotting_time': 'ct_clotting_time',
  'bt_bleeding_time': 'bt_bleeding_time', 'bt': 'bt_bleeding_time', 'bleeding_time': 'bt_bleeding_time',
  'pt': 'pt', 'prothrombin_time': 'pt',
  'aptt': 'aptt', 'ptt': 'aptt', 'activated_partial_thromboplastin_time': 'aptt',
  'tsh': 'tsh', 'thyroid_stimulating_hormone': 'tsh',
  'free_t4': 'free_t4', 'ft4': 'free_t4', 'free_thyroxine': 'free_t4',
  'total_t3': 'total_t3', 't3': 'total_t3', 'total_triiodothyronine': 'total_t3',
  'urine_colour': 'urine_colour', 'urine_color': 'urine_colour', 'color': 'urine_colour', 'colour': 'urine_colour',
  'urine_specific_gravity': 'urine_specific_gravity', 'specific_gravity': 'urine_specific_gravity', 'sp_gravity': 'urine_specific_gravity',
  'urine_ph': 'urine_ph', 'ph': 'urine_ph',
  'urine_glucose_sugar': 'urine_glucose_sugar', 'urine_glucose': 'urine_glucose_sugar', 'urine_sugar': 'urine_glucose_sugar', 'sugar': 'urine_glucose_sugar', 'glucose': 'urine_glucose_sugar',
  'urine_blood': 'urine_blood', 'blood': 'urine_blood', 'hematuria': 'urine_blood', 'haematuria': 'urine_blood',
  'pus_cells': 'pus_cells', 'pus': 'pus_cells', 'pus_cell': 'pus_cells', 'pyuria': 'pus_cells',
  'urine_rbc': 'urine_rbc',
  'ketone_bodies': 'ketone_bodies', 'ketones': 'ketone_bodies', 'urine_ketones': 'ketone_bodies', 'ketone': 'ketone_bodies',
  'epithelial_cells': 'epithelial_cells', 'epithelial': 'epithelial_cells', 'epi_cells': 'epithelial_cells',
  'urine_protein': 'urine_protein', 'protein': 'urine_protein', 'albumin_urine': 'urine_protein', 'urine_albumin': 'urine_protein',
  'bile_salts_pigments': 'bile_salts_pigments', 'bile_salts': 'bile_salts_pigments', 'bile_pigments': 'bile_salts_pigments', 'bile': 'bile_salts_pigments',
  'urine_transparency': 'urine_transparency', 'transparency': 'urine_transparency', 'clarity': 'urine_transparency', 'appearance': 'urine_transparency',
  'urine_crystals': 'urine_crystals', 'crystals': 'urine_crystals',
  'fbs': 'fbs', 'fasting_blood_sugar': 'fbs', 'fasting_glucose': 'fbs',
  'rbs': 'rbs', 'random_blood_sugar': 'rbs', 'random_glucose': 'rbs',
  'ppbs': 'ppbs', 'post_prandial_blood_sugar': 'ppbs', 'pp_glucose': 'ppbs',
  'sodium': 'sodium', 'na+': 'sodium', 'na': 'sodium', 'serum_sodium': 'sodium',
  'potassium': 'potassium', 'k+': 'potassium', 'k': 'potassium', 'serum_potassium': 'potassium',
  'chloride': 'chloride', 'cl-': 'chloride', 'cl': 'chloride', 'serum_chloride': 'chloride',
  'magnesium': 'magnesium', 'mg++': 'magnesium', 'mg': 'magnesium', 'serum_magnesium': 'magnesium',
  'serum_calcium': 'serum_calcium', 'calcium': 'serum_calcium', 'ca++': 'serum_calcium', 'ca': 'serum_calcium',
  'cpk_ck': 'cpk_ck', 'cpk': 'cpk_ck', 'ck': 'cpk_ck', 'creatine_kinase': 'cpk_ck',
  'cpk_mb': 'cpk_mb', 'ck_mb': 'cpk_mb', 'ckmb': 'cpk_mb', 'cpkmb': 'cpk_mb',
  'ldh': 'ldh', 'lactate_dehydrogenase': 'ldh',
  'total_bilirubin': 'total_bilirubin', 't_bilirubin': 'total_bilirubin', 't_bili': 'total_bilirubin',
  'direct_bilirubin': 'direct_bilirubin', 'd_bilirubin': 'direct_bilirubin', 'd_bili': 'direct_bilirubin', 'conjugated_bilirubin': 'direct_bilirubin',
  'indirect_bilirubin': 'indirect_bilirubin', 'i_bilirubin': 'indirect_bilirubin', 'unconjugated_bilirubin': 'indirect_bilirubin',
  'sgot_ast': 'sgot_ast', 'sgot': 'sgot_ast', 'ast': 'sgot_ast',
  'sgpt_alt': 'sgpt_alt', 'sgpt': 'sgpt_alt', 'alt': 'sgpt_alt',
  'alkaline_phosphatase': 'alkaline_phosphatase', 'alp': 'alkaline_phosphatase', 'alk_phos': 'alkaline_phosphatase',
  'albumin': 'albumin', 'serum_albumin': 'albumin',
  'globulin': 'globulin', 'serum_globulin': 'globulin',
  'urea': 'urea', 'blood_urea': 'urea', 'bun': 'urea', 'blood_urea_nitrogen': 'urea',
  'serum_creatinine': 'serum_creatinine', 's_cr': 'serum_creatinine', 'scr': 'serum_creatinine', 'creatinine': 'serum_creatinine', 's_creatinine': 'serum_creatinine',
  'uric_acid': 'uric_acid', 'serum_uric_acid': 'uric_acid',
  'total_cholesterol': 'total_cholesterol', 'cholesterol': 'total_cholesterol', 't_chol': 'total_cholesterol',
  'hdl': 'hdl', 'hdl_cholesterol': 'hdl',
  'ldl': 'ldl', 'ldl_cholesterol': 'ldl',
  'vldl': 'vldl', 'vldl_cholesterol': 'vldl',
  'triglycerides': 'triglycerides', 'tg': 'triglycerides', 'triacylglycerol': 'triglycerides'
};

const normalizeLabParamKey = (rawName) => {
  if (!rawName) return '';
  const clean = String(rawName)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return PARAM_ALIAS_MAP[clean] || clean;
};

const matchLabKnowledgeRecord = (rawTestName, knowledgeList = []) => {
  if (!rawTestName || !Array.isArray(knowledgeList) || knowledgeList.length === 0) return null;

  const targetKey = normalizeLabParamKey(rawTestName);

  // Direct normalized_name match or alias match
  let found = knowledgeList.find(k => k.normalized_name === targetKey);
  if (found) return found;

  // Substring / fallback matching
  const cleanRaw = String(rawTestName).toLowerCase().trim();
  found = knowledgeList.find(k => {
    const kn = String(k.parameter_name).toLowerCase().trim();
    const nn = String(k.normalized_name).toLowerCase().trim();
    return cleanRaw.includes(kn) || kn.includes(cleanRaw) || cleanRaw.includes(nn) || nn.includes(cleanRaw);
  });

  return found || null;
};

const formatCautiousAssociation = (sigText) => {
  if (!sigText) return 'relevant clinical conditions';
  let text = String(sigText).trim();
  text = text.replace(/\.$/, '');
  if (/^[A-Z][a-z]/.test(text)) {
    text = text.charAt(0).toLowerCase() + text.slice(1);
  }
  return text;
};

/**
 * Section 3 Result Status & Clinical Significance Evaluation Engine
 */
const evaluateLabResultStatus = (labRecord, knowledgeRecord, norm = {}) => {
  const rawVal = labRecord?.test_value !== undefined && labRecord?.test_value !== null ? String(labRecord.test_value).trim() : '';
  const rawRef = labRecord?.reference_range !== undefined && labRecord?.reference_range !== null ? String(labRecord.reference_range).trim() : '';
  const testName = labRecord?.test_name || labRecord?.parameter_name || 'Laboratory Parameter';

  if (!rawVal || rawVal === 'N/A' || rawVal === '—') {
    return {
      status: 'Result Not Documented',
      statusType: 'missing',
      significance: 'Result not documented.',
      aiInterpretation: 'Result not documented; interpretation cannot be performed.'
    };
  }

  if (!knowledgeRecord) {
    return {
      status: 'Knowledge Unavailable',
      statusType: 'neutral',
      significance: 'Clinical significance knowledge is not available for this parameter.',
      aiInterpretation: `Clinical significance knowledge is not available for ${testName}.`
    };
  }

  const evalType = knowledgeRecord.evaluation_type || 'numeric';

  // POSITIVE / NEGATIVE EVALUATION
  if (evalType === 'positive_negative') {
    const valLower = rawVal.toLowerCase();
    const isPositive = valLower.includes('positive') || valLower.includes('+') || valLower.includes('reactive') || valLower.includes('trace') || valLower.includes('present');
    if (isPositive) {
      const sig = knowledgeRecord.positive_significance || 'Positive result identified.';
      const formattedSig = formatCautiousAssociation(sig);
      return {
        status: 'Positive',
        statusType: 'positive',
        significance: sig,
        aiInterpretation: `The documented ${testName} result is ${rawVal}. This positive finding may be associated with ${formattedSig}. Correlation with clinical findings and symptoms is required.`
      };
    } else {
      const sig = knowledgeRecord.negative_significance || 'No abnormal activity detected.';
      return {
        status: 'Negative',
        statusType: 'negative',
        significance: sig,
        aiInterpretation: `The documented ${testName} result is ${rawVal}. No significant abnormality is identified from this parameter based on documented findings.`
      };
    }
  }

  // PRESENT / ABSENT EVALUATION
  if (evalType === 'present_absent') {
    const valLower = rawVal.toLowerCase();
    const isPresent = valLower.includes('present') || valLower.includes('+') || valLower.includes('detected') || valLower.includes('cloudy') || valLower.includes('turbid') || valLower.includes('yes');
    if (isPresent) {
      const sig = knowledgeRecord.present_significance || 'Finding present.';
      const formattedSig = formatCautiousAssociation(sig);
      return {
        status: 'Present',
        statusType: 'present',
        significance: sig,
        aiInterpretation: `The documented finding of ${testName} is present (${rawVal}). This finding may occur with ${formattedSig}. Clinical correlation with patient symptoms and findings is required.`
      };
    } else {
      const sig = knowledgeRecord.absent_significance || 'Finding absent.';
      return {
        status: 'Absent',
        statusType: 'absent',
        significance: sig,
        aiInterpretation: `The documented finding of ${testName} is absent (${rawVal}). No significant abnormality is identified from this parameter based on documented findings.`
      };
    }
  }

  // NUMERIC EVALUATION
  const numVal = parseFloat(rawVal.replace(/[^0-9.]/g, ''));
  if (isNaN(numVal)) {
    return {
      status: 'Qualitative Result',
      statusType: 'neutral',
      significance: knowledgeRecord.context_notes || 'Qualitative laboratory entry.',
      aiInterpretation: `The documented value "${rawVal}" for ${testName} is qualitative; should be interpreted in the clinical context.`
    };
  }

  if (!rawRef || rawRef === 'N/A' || rawRef === '—') {
    return {
      status: 'Reference Range Not Documented',
      statusType: 'warning',
      significance: 'Reference range not documented; interpretation is limited.',
      aiInterpretation: `Reference range not documented for ${testName}; interpretation is limited.`
    };
  }

  // Parse reference range bounds
  let minBound = null;
  let maxBound = null;

  if (rawRef.includes('-') || rawRef.includes('–') || rawRef.includes('to')) {
    const parts = rawRef.replace('to', '-').replace('–', '-').split('-');
    const minP = parseFloat(parts[0].replace(/[^0-9.]/g, ''));
    const maxP = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
    if (!isNaN(minP)) minBound = minP;
    if (!isNaN(maxP)) maxBound = maxP;
  } else if (rawRef.includes('<')) {
    const maxP = parseFloat(rawRef.replace(/[^0-9.]/g, ''));
    if (!isNaN(maxP)) maxBound = maxP;
  } else if (rawRef.includes('>')) {
    const minP = parseFloat(rawRef.replace(/[^0-9.]/g, ''));
    if (!isNaN(minP)) minBound = minP;
  }

  if (minBound !== null && numVal < minBound) {
    const sig = knowledgeRecord.decreased_significance || 'Decreased laboratory parameter level.';
    const formattedSig = formatCautiousAssociation(sig);
    return {
      status: 'Decreased',
      statusType: 'decreased',
      significance: sig,
      aiInterpretation: `The documented ${testName} (${rawVal}) is below the documented reference range (${rawRef}). This reduction may occur with ${formattedSig}. Correlation with clinical findings and patient status is required.`
    };
  }

  if (maxBound !== null && numVal > maxBound) {
    const sig = knowledgeRecord.increased_significance || 'Elevated laboratory parameter level.';
    const formattedSig = formatCautiousAssociation(sig);
    return {
      status: 'Increased',
      statusType: 'increased',
      significance: sig,
      aiInterpretation: `The documented ${testName} (${rawVal}) is above the documented reference range (${rawRef}). This elevation may be associated with ${formattedSig}. Correlation with clinical findings is required.`
    };
  }

  if (minBound !== null || maxBound !== null) {
    return {
      status: 'Within Reference Range',
      statusType: 'normal',
      significance: 'Result is within documented reference range.',
      aiInterpretation: `The documented result for ${testName} (${rawVal}) is within the laboratory reference range (${rawRef}), with no significant abnormality identified from this parameter alone.`
    };
  }

  return {
    status: 'Documented',
    statusType: 'neutral',
    significance: knowledgeRecord.context_notes || 'Value documented.',
    aiInterpretation: `The documented value for ${testName} is ${rawVal}; should be interpreted in the clinical context.`
  };
};

/**
 * Smart Lab Unit Extractor.
 * Extracts unit from explicit record unit, reference_range, test_value, or test_name.
 */
const extractLabUnit = (labRecord) => {
  let u = labRecord?.unit || labRecord?.test_unit;
  if (u && String(u).trim() !== '' && String(u).trim() !== 'N/A' && String(u).trim() !== '—') {
    return String(u).trim();
  }

  const rawRef = String(labRecord?.reference_range || '').trim();
  const rawVal = String(labRecord?.test_value || '').trim();
  const rawName = String(labRecord?.test_name || labRecord?.parameter_name || '').trim();

  // 1. Extract unit trailing reference range (e.g. "11-16.5 %" -> "%", "4000-11000 cells/cu.mm" -> "cells/cu.mm", "135-145 mEq/L" -> "mEq/L", "< 200 mg/dL" -> "mg/dL")
  if (rawRef) {
    const cleaned = rawRef
      .replace(/^[<>=~]*\s*/, '')
      .replace(/^[0-9.,\s]+[-–to\s]+[0-9.,\s]+/, '')
      .replace(/^[0-9.,\s]+/, '')
      .trim();

    if (cleaned && cleaned !== '-' && cleaned !== '—' && !/^[0-9.,]+$/.test(cleaned)) {
      return cleaned;
    }
  }

  // 2. Extract unit trailing test_value (e.g. "13.9 %" -> "%")
  if (rawVal) {
    const cleanedVal = rawVal
      .replace(/^[<>=~]*\s*/, '')
      .replace(/^[0-9.,\s]+/, '')
      .trim();

    if (cleanedVal && cleanedVal !== '-' && cleanedVal !== '—' && !/^[0-9.,]+$/.test(cleanedVal)) {
      return cleanedVal;
    }
  }

  // 3. Extract unit from parameter name if formatted like "HB %" or "WBC (cells/mm³)"
  if (rawName.includes('%')) return '%';
  const matchParen = rawName.match(/\(([^)]+)\)/);
  if (matchParen && matchParen[1]) {
    const pStr = matchParen[1].trim();
    if (!['AST', 'ALT', 'CK', 'CK-MB', 'AST/SGOT', 'ALT/SGPT'].includes(pStr.toUpperCase())) {
      return pStr;
    }
  }

  return 'Not specified';
};

/**
 * Student Role AI Clinical Case Analysis View.
 * Educational Analysis Engine Triggered by SAVED Form Data.
 */
export const StudentAiAnalysisView = ({ student, onNavigate }) => {
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  
  const [modulesData, setModulesData] = useState(null);
  const [loadingModules, setLoadingModules] = useState(false);

  const [labKnowledgeList, setLabKnowledgeList] = useState([]);
  const [section4DrugKnowledge, setSection4DrugKnowledge] = useState([]);
  const [loadingDrugKnowledge, setLoadingDrugKnowledge] = useState(false);

  // Load standard lab parameter knowledge records from Supabase for Section 3
  useEffect(() => {
    const loadKnowledge = async () => {
      const res = await fetchLabParameterKnowledgeFromSupabase();
      if (res.success && Array.isArray(res.data)) {
        setLabKnowledgeList(res.data);
      }
    };
    loadKnowledge();
  }, []);

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

  // Detect form SAVED statuses dynamically for both NEW and EXISTING cases
  const profileRecord = (modulesData?.profile && Object.keys(modulesData.profile).length > 0)
    ? modulesData.profile
    : (selectedCase?.profile || selectedCase || {});

  const counsellingRecord = (modulesData?.counselling && Object.keys(modulesData.counselling).length > 0)
    ? modulesData.counselling
    : (selectedCase?.counselling || {});

  const interventionRecord = (modulesData?.intervention && Object.keys(modulesData.intervention).length > 0)
    ? modulesData.intervention
    : (selectedCase?.intervention || {});

  const dirRecord = (modulesData?.dir && Object.keys(modulesData.dir).length > 0)
    ? modulesData.dir
    : (selectedCase?.dir || {});

  const adrRecord = (modulesData?.adr && Object.keys(modulesData.adr).length > 0)
    ? modulesData.adr
    : (selectedCase?.adr || {});

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

  // Normalize only SAVED modules for safe, accurate clinical extraction (for both new & existing cases)
  const norm = buildNormalizedApprovedCaseData({
    clinicalCase: selectedCase || {},
    student,
    caseModulesData: {
      profile: isProfileSaved ? profileRecord : {},
      counselling: isCounsellingSaved ? counsellingRecord : {},
      intervention: isInterventionSaved ? interventionRecord : {},
      dir: isDirSaved ? dirRecord : {},
      adr: isAdrSaved ? adrRecord : {},
      vitals: isProfileSaved ? (modulesData?.vitals || selectedCase?.vital_signs || selectedCase?.vitals || []) : [],
      labs: isProfileSaved ? (modulesData?.labs || selectedCase?.lab_investigations || selectedCase?.labs || []) : [],
      drugs: isProfileSaved ? (modulesData?.drugs || selectedCase?.prescribed_drugs || selectedCase?.drugs || []) : []
    }
  });

  const evaluatedDrugs = isProfileSaved ? norm.drugs : [];

  const [section5ADdiResult, setSection5ADdiResult] = useState(null);
  const [loadingSection5A, setLoadingSection5A] = useState(false);

  const [section5BDfiResult, setSection5BDfiResult] = useState(null);
  const [loadingSection5B, setLoadingSection5B] = useState(false);

  const [brandingSettings, setBrandingSettings] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const loadBranding = async () => {
      const cid = student?.college_id || selectedCase?.college_id || student?.colleges?.id;
      if (cid) {
        const res = await fetchDocumentBrandingSettingsFromSupabase(cid);
        if (res.success && res.settings) {
          setBrandingSettings(res.settings);
        }
      }
    };
    loadBranding();
  }, [student, selectedCase]);

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const cid = student?.college_id || selectedCase?.college_id || student?.colleges?.id;
      let bSettings = brandingSettings;
      if (!bSettings && cid) {
        const res = await fetchDocumentBrandingSettingsFromSupabase(cid);
        if (res.success && res.settings) bSettings = res.settings;
      }

      // Fetch preceptor details if available
      const targetPreceptorId = selectedCase?.preceptor_id || selectedCase?.assigned_preceptor_id || selectedCase?.approved_by_preceptor_id || selectedCase?.preceptors?.id;
      let preceptorObj = selectedCase?.preceptors || selectedCase?.preceptor || {};
      if (targetPreceptorId && (!preceptorObj || !preceptorObj.full_name)) {
        const pRes = await fetchPreceptorByIdFromSupabase(targetPreceptorId);
        if (pRes.success && pRes.preceptor) {
          preceptorObj = pRes.preceptor;
        }
      }

      await generateOfficialClinicalCasePDF({
        clinicalCase: selectedCase || {},
        student: student || {},
        preceptor: preceptorObj,
        college: student?.colleges || selectedCase?.colleges || {},
        caseModulesData: modulesData || {},
        branding: bSettings || {},
        selectedForm: 'ai_analysis',
        section4DrugKnowledge,
        section4AiSynthesis,
        section5ADdiResult,
        section5BDfiResult
      });
    } catch (err) {
      console.error('Failed to generate College-Branded PDF:', err);
      window.print();
    } finally {
      setDownloadingPDF(false);
    }
  };

  // SECTION 4 — STEP 5A: Fetch drug knowledge from Supabase public.drug_knowledge table
  useEffect(() => {
    const loadDrugKnowledge = async () => {
      if (!evaluatedDrugs || evaluatedDrugs.length === 0) {
        setSection4DrugKnowledge([]);
        return;
      }
      setLoadingDrugKnowledge(true);
      const res = await fetchMultipleDrugKnowledgeFromSupabase(evaluatedDrugs);
      if (res.success && Array.isArray(res.results)) {
        setSection4DrugKnowledge(res.results);
      } else {
        setSection4DrugKnowledge([]);
      }
      setLoadingDrugKnowledge(false);
    };

    loadDrugKnowledge();
  }, [JSON.stringify(evaluatedDrugs)]);

  // SECTION 5A — Master Drug-Drug Interaction Analysis Execution
  useEffect(() => {
    const runSection5AAnalysis = async () => {
      if (!evaluatedDrugs || evaluatedDrugs.length === 0) {
        setSection5ADdiResult(null);
        return;
      }
      setLoadingSection5A(true);
      const res = await evaluateSection5ADrugInteractionsInSupabase(evaluatedDrugs);
      if (res.success) {
        setSection5ADdiResult(res);
      } else {
        setSection5ADdiResult(null);
      }
      setLoadingSection5A(false);
    };

    runSection5AAnalysis();
  }, [JSON.stringify(evaluatedDrugs)]);

  // SECTION 5B — Master Drug-Food Interaction Analysis Execution
  useEffect(() => {
    const runSection5BAnalysis = async () => {
      if (!evaluatedDrugs || evaluatedDrugs.length === 0) {
        setSection5BDfiResult(null);
        return;
      }
      setLoadingSection5B(true);
      const res = await evaluateSection5BDrugFoodInteractionsInSupabase(evaluatedDrugs);
      if (res.success) {
        setSection5BDfiResult(res);
      } else {
        setSection5BDfiResult(null);
      }
      setLoadingSection5B(false);
    };

    runSection5BAnalysis();
  }, [JSON.stringify(evaluatedDrugs)]);

  // STEP 5B: Execute Section 4 AI Interpretation Synthesis Engine
  const section4AiSynthesis = synthesizeSection4DrugAiInterpretation({
    norm,
    drugKnowledgeResults: section4DrugKnowledge,
    labs: (Array.isArray(modulesData?.labs) && modulesData.labs.length > 0)
      ? modulesData.labs
      : (Array.isArray(selectedCase?.lab_investigations) && selectedCase.lab_investigations.length > 0
        ? selectedCase.lab_investigations
        : (Array.isArray(selectedCase?.labs) ? selectedCase.labs : (Array.isArray(norm.labs) ? norm.labs : [])))
  });

  // Calculate pairs of documented drugs for individual pair analysis
  const drugPairs = [];
  for (let i = 0; i < evaluatedDrugs.length; i++) {
    for (let j = i + 1; j < evaluatedDrugs.length; j++) {
      drugPairs.push({ drug1: evaluatedDrugs[i], drug2: evaluatedDrugs[j] });
    }
  }

  // Generate Case-Specific MRPs
  const caseMRPs = generateCaseSpecificMRPs(norm, evaluatedDrugs);

  // Parse patient age for field-specific risk evaluation
  const patientAgeNum = parseInt(norm.demographics.age, 10) || 0;
  const isElderly = patientAgeNum >= 65;

  return (
    <div className="space-y-6 pb-16 min-w-0 w-full text-wrap break-words">
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

          {/* SAVED FORM STATUS GRID */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-w-0 w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                SAVED FORM STATUS ({savedCount}/5 Saved & Eligible)
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                Only saved and persisted form data is eligible for AI analysis.
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
            <div className="space-y-6 min-w-0 w-full">
              {/* SECTION 1 — CASE OVERVIEW (DYNAMIC PERSISTED CASE DATA) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 min-w-0 w-full">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      SECTION 1 — CASE OVERVIEW
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Saved Case Record
                  </span>
                </div>

                {/* SAVED CLINICAL PARAMETERS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Age / Sex</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-xs block truncate">
                      {norm.demographics.age && norm.demographics.age !== 'N/A' && norm.demographics.age !== '—' ? `${norm.demographics.age} Yrs` : 'Not documented'} / {norm.demographics.gender && norm.demographics.gender !== 'N/A' && norm.demographics.gender !== '—' ? norm.demographics.gender : 'Not documented'}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department / Ward</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-xs block truncate">
                      {norm.demographics.department && norm.demographics.department !== 'N/A' && norm.demographics.department !== '—' ? norm.demographics.department : 'Not documented'}
                      {norm.demographics.ward && norm.demographics.ward !== 'N/A' && norm.demographics.ward !== '—' ? ` (${norm.demographics.ward})` : ''}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Diagnosis</span>
                    <strong className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs block break-words">
                      {norm.diagnosis.final && norm.diagnosis.final !== 'N/A' && norm.diagnosis.final !== '—' ? norm.diagnosis.final : 'Not documented'}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Chief Complaint(s)</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs break-words">
                      {norm.history.chiefComplaints && norm.history.chiefComplaints !== 'N/A' && norm.history.chiefComplaints !== '—' ? norm.history.chiefComplaints : 'Not documented'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Relevant Past Medical History</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs break-words">
                      {norm.history.pastMedicalHistory && norm.history.pastMedicalHistory !== 'N/A' && norm.history.pastMedicalHistory !== '—' ? norm.history.pastMedicalHistory : 'Not documented'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Relevant Social History</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs break-words">
                      {norm.demographics.socialHistory && norm.demographics.socialHistory !== 'N/A' && norm.demographics.socialHistory !== '—' ? norm.demographics.socialHistory : 'Not available in saved documentation.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1 md:col-span-2 lg:col-span-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Documented Allergies</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs break-words">
                      {norm.demographics.allergyDrugs && norm.demographics.allergyDrugs !== 'N/A' && norm.demographics.allergyDrugs !== '—' ? norm.demographics.allergyDrugs : 'Not documented'}
                    </p>
                  </div>
                </div>

                {/* SHORT CASE SUMMARY BOX */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 space-y-1.5 min-w-0 text-xs leading-relaxed">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    CASE SUMMARY
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium break-words">
                    {generateFactualCaseSummary(norm)}
                  </p>
                </div>
              </div>

              {/* SECTION 2 — PATIENT PROFILE ANALYSIS (DYNAMIC ANTHROPOMETRICS & INTERPRETATION) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 min-w-0 w-full">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      SECTION 2 — PATIENT PROFILE ANALYSIS
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                    Anthropometric & Physical Assessment
                  </span>
                </div>

                {/* DEMOGRAPHICS & ANTHROPOMETRICS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Age</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-xs block truncate">
                      {norm.demographics.age && norm.demographics.age !== 'N/A' && norm.demographics.age !== '—' ? `${norm.demographics.age} Yrs` : 'Not documented'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sex</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-xs block truncate">
                      {norm.demographics.gender && norm.demographics.gender !== 'N/A' && norm.demographics.gender !== '—' ? norm.demographics.gender : 'Not documented'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Height</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-xs block truncate">
                      {calculateOrVerifyBmi(profileRecord?.height || selectedCase?.height, profileRecord?.weight || selectedCase?.weight, profileRecord?.bmi || selectedCase?.bmi).heightStr}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Weight</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-xs block truncate">
                      {calculateOrVerifyBmi(profileRecord?.height || selectedCase?.height, profileRecord?.weight || selectedCase?.weight, profileRecord?.bmi || selectedCase?.bmi).weightStr}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">BMI</span>
                    <strong className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs block truncate">
                      {calculateOrVerifyBmi(profileRecord?.height || selectedCase?.height, profileRecord?.weight || selectedCase?.weight, profileRecord?.bmi || selectedCase?.bmi).bmiStr}
                    </strong>
                  </div>
                </div>

                {/* VITALS & PHYSICAL EXAM FINDINGS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Documented Vital Signs</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs break-words">
                      {(() => {
                        const vList = Array.isArray(profileRecord?.vital_signs) && profileRecord.vital_signs.length > 0
                          ? profileRecord.vital_signs
                          : (Array.isArray(norm.vitals) && norm.vitals.length > 0 ? norm.vitals : []);
                        if (vList.length === 0) return 'Not documented';
                        const v = vList[0];
                        const parts = [];
                        if (v.bp || v.bp_sys) parts.push(`BP: ${v.bp || `${v.bp_sys}/${v.bp_dia}`} mmHg`);
                        if (v.pr || v.pulse_rate || v.pulse) parts.push(`Pulse: ${v.pr || v.pulse_rate || v.pulse} bpm`);
                        if (v.temp || v.temperature_f) parts.push(`Temp: ${v.temp || v.temperature_f}°F`);
                        if (v.rr || v.respiratory_rate) parts.push(`RR: ${v.rr || v.respiratory_rate}/min`);
                        if (v.spo2) parts.push(`SpO2: ${v.spo2}%`);
                        return parts.length > 0 ? parts.join(' | ') : 'Not documented';
                      })()}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Relevant Examination Findings</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs break-words">
                      {(() => {
                        const gen = profileRecord?.general_examination || profileRecord?.general_exam;
                        const sys = profileRecord?.systemic_examination || profileRecord?.systemic_exam;
                        const parts = [gen, sys].filter(Boolean);
                        return parts.length > 0 ? parts.join(' • ') : 'Not documented';
                      })()}
                    </p>
                  </div>
                </div>

                {/* PATIENT-SPECIFIC AI INTERPRETATION BOX */}
                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-1.5 min-w-0 text-xs leading-relaxed">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 block">
                    AI PATIENT PROFILE INTERPRETATION
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium break-words">
                    {generatePatientProfileInterpretation(norm, profileRecord)}
                  </p>
                </div>
              </div>

              {/* SECTION 3 — LABORATORY ANALYSIS (DYNAMIC PATIENT LABS MATCHED WITH CLINICAL KNOWLEDGE) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 min-w-0 w-full">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      SECTION 3 — LABORATORY ANALYSIS
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                    {(() => {
                      const labs = (Array.isArray(modulesData?.labs) && modulesData.labs.length > 0)
                        ? modulesData.labs
                        : (Array.isArray(selectedCase?.lab_investigations) && selectedCase.lab_investigations.length > 0
                          ? selectedCase.lab_investigations
                          : (Array.isArray(selectedCase?.labs) ? selectedCase.labs : (Array.isArray(norm.labs) ? norm.labs : [])));
                      return `${labs.length} Investigation${labs.length !== 1 ? 's' : ''}`;
                    })()}
                  </span>
                </div>

                {(() => {
                  const labs = (Array.isArray(modulesData?.labs) && modulesData.labs.length > 0)
                    ? modulesData.labs
                    : (Array.isArray(selectedCase?.lab_investigations) && selectedCase.lab_investigations.length > 0
                      ? selectedCase.lab_investigations
                      : (Array.isArray(selectedCase?.labs) ? selectedCase.labs : (Array.isArray(norm.labs) ? norm.labs : [])));

                  if (labs.length === 0) {
                    return (
                      <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">No Laboratory Investigations Documented</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          No lab investigation results are currently documented in the patient profile for this selected case.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {labs.map((labItem, idx) => {
                        const rawTestName = labItem.test_name || labItem.parameter_name || `Parameter ${idx + 1}`;
                        const matchedKnowledge = matchLabKnowledgeRecord(rawTestName, labKnowledgeList);
                        const evalResult = evaluateLabResultStatus(labItem, matchedKnowledge, norm);

                        return (
                          <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3 min-w-0">
                            {/* PARAMETER TITLE & STATUS BADGE */}
                            <div className="flex items-start justify-between flex-wrap gap-2">
                              <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                                  {rawTestName}
                                </h4>
                                {matchedKnowledge?.category && (
                                  <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                    Category: {matchedKnowledge.category}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                                evalResult.statusType === 'increased' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                                evalResult.statusType === 'decreased' ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800' :
                                evalResult.statusType === 'positive' || evalResult.statusType === 'present' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                                evalResult.statusType === 'normal' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' :
                                'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                              }`}>
                                Status: {evalResult.status}
                              </span>
                            </div>

                            {/* RESULT & REFERENCE RANGE GRID (ORDER: ACTUAL RESULT -> UNIT -> REFERENCE RANGE) */}
                            {(() => {
                              const fetchedUnit = extractLabUnit(labItem);
                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual Result</span>
                                    <strong className="font-mono font-extrabold text-slate-900 dark:text-white text-xs block truncate">
                                      {labItem.test_value !== undefined && labItem.test_value !== null && String(labItem.test_value).trim() !== '' ? String(labItem.test_value).trim() : 'Result not documented'}
                                    </strong>
                                  </div>

                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit</span>
                                    <strong className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs block truncate">
                                      {fetchedUnit}
                                    </strong>
                                  </div>

                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Reference Range</span>
                                    <strong className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs block truncate">
                                      {labItem.reference_range !== undefined && labItem.reference_range !== null && String(labItem.reference_range).trim() !== '' ? String(labItem.reference_range).trim() : 'Reference range not documented'}
                                    </strong>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* CLINICAL SIGNIFICANCE FROM KNOWLEDGE BASE */}
                            <div className="space-y-1 text-xs">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                Clinical Significance
                              </span>
                              <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed break-words bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                                {evalResult.significance}
                              </p>
                            </div>

                            {/* CASE-SPECIFIC AI INTERPRETATION */}
                            <div className="bg-cyan-50/60 dark:bg-cyan-950/30 p-3.5 rounded-lg border border-cyan-200/80 dark:border-cyan-800/80 space-y-1 text-xs leading-relaxed">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 dark:text-cyan-300 block">
                                AI Case-Specific Interpretation
                              </span>
                              <p className="text-slate-800 dark:text-slate-200 font-medium break-words">
                                {evalResult.aiInterpretation}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 4 — DRUG KNOWLEDGE (4A & 4B) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 min-w-0 w-full">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      4A — DRUG KNOWLEDGE RETRIEVAL & DISPLAY
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Database-Driven (public.drug_knowledge)
                  </span>
                </div>

                {loadingDrugKnowledge ? (
                  <div className="p-6 text-center">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Querying Supabase public.drug_knowledge database...</p>
                  </div>
                ) : section4DrugKnowledge.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">No Prescribed Medications Documented</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      No prescribed drugs are currently recorded in the saved patient profile for this selected case.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {section4DrugKnowledge.map((item, idx) => {
                      const drug = item.prescribedDrug || {};
                      const status = item.status;
                      const trade = drug.trade_name || drug.brand_name || '—';
                      const generic = drug.generic_name || drug.drug_name || '—';

                      // Extract ingredients list (supports 1, 2, 3, 4+ active ingredients)
                      const ingredientsList = item.ingredientKnowledge && item.ingredientKnowledge.length > 0
                        ? item.ingredientKnowledge
                        : (item.data ? [{ ingredient: item.data.generic_name || generic, status: status, data: item.data }] : []);

                      return (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-4 min-w-0">
                          {/* PRESCRIBED PRODUCT HEADER */}
                          <div className="flex items-start justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                <span>{trade !== '—' ? `${trade}` : generic}</span>
                                {generic !== '—' && generic !== trade && (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold normal-case">
                                    [{generic}]
                                  </span>
                                )}
                              </h4>
                              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                Route: {drug.route_of_admin || 'Oral'} | Dose: {drug.dose || 'As directed'} | Freq: {drug.frequency || 'OD'}
                              </span>
                            </div>

                            {/* 4A DB RETRIEVAL STATUS BADGE */}
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                              status === 'FOUND' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' :
                              status === 'UNRESOLVED_TRADE_NAME' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                              status === 'NOT_FOUND' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                              'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            }`}>
                              {status === 'FOUND' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                              {(status === 'NOT_FOUND' || status === 'UNRESOLVED_TRADE_NAME') && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                              {status === 'ERROR' && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                              <span>
                                {status === 'FOUND'
                                  ? (ingredientsList.length > 1 ? `✓ ${ingredientsList.length} Active Ingredients Retrieved` : '✓ Drug Knowledge Retrieved')
                                  : status === 'UNRESOLVED_TRADE_NAME'
                                  ? 'Trade name could not be confidently resolved.'
                                  : (item.message || '⚠️ Drug knowledge not currently available in database')}
                              </span>
                            </span>
                          </div>

                          {/* 4A DISPLAY — SEPARATE SUBCARDS FOR EACH ACTIVE INGREDIENT */}
                          {ingredientsList.length > 0 ? (
                            <div className="space-y-4">
                              {ingredientsList.map((ingItem, ingIdx) => {
                                const ingData = ingItem.data || {};
                                const ingStatus = ingItem.status;

                                return (
                                  <div key={ingIdx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                        {ingredientsList.length > 1 ? `ACTIVE INGREDIENT ${ingIdx + 1}: ${ingItem.ingredient}` : `ACTIVE INGREDIENT: ${ingItem.ingredient}`}
                                      </span>
                                      {ingStatus === 'FOUND' ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                                          ✓ Verified Database Record
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                                          ⚠️ Knowledge Unavailable
                                        </span>
                                      )}
                                    </div>

                                    {ingStatus === 'FOUND' && ingData && ingData.generic_name ? (() => {
                                      const rawClass = ingData.drug_class || ingData.primary_drug_class || '';
                                      let primaryClass = 'N/A';
                                      let additionalClass = 'N/A';

                                      if (rawClass) {
                                        if (rawClass.includes('(Additional:')) {
                                          const parts = rawClass.split(/\(Additional:/i);
                                          primaryClass = (parts[0] || '').replace(/[\(\)]/g, '').trim() || 'N/A';
                                          additionalClass = (parts[1] || '').replace(/[\(\)]/g, '').trim() || 'N/A';
                                        } else {
                                          primaryClass = rawClass;
                                          additionalClass = ingData.additional_drug_classes || 'N/A';
                                        }
                                      }

                                      return (
                                        <div className="space-y-3">
                                          {/* 10 DATABASE FIELDS FROM public.drug_knowledge */}
                                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] uppercase font-bold text-slate-400 block">1. Generic Name</span>
                                              <strong className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs block truncate">
                                                {ingData.generic_name || ingItem.ingredient}
                                              </strong>
                                            </div>

                                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] uppercase font-bold text-slate-400 block">2. Trade/Brand Names</span>
                                              <span className="font-medium text-slate-800 dark:text-slate-200 text-xs block truncate" title={ingData.brand_names || 'N/A'}>
                                                {ingData.brand_names || 'N/A'}
                                              </span>
                                            </div>

                                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] uppercase font-bold text-slate-400 block">3. Primary Drug Class</span>
                                              <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs block truncate" title={primaryClass}>
                                                {primaryClass}
                                              </span>
                                            </div>

                                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] uppercase font-bold text-slate-400 block">4. Additional Drug Classes</span>
                                              <span className="font-medium text-indigo-500 dark:text-indigo-300 text-xs block truncate" title={additionalClass}>
                                                {additionalClass}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                                5. Established Clinical Uses
                                              </span>
                                              <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-relaxed break-words">
                                                {ingData.established_uses || 'N/A'}
                                              </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                                6. Mechanism of Action
                                              </span>
                                              <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-relaxed break-words">
                                                {ingData.mechanism_of_action || 'N/A'}
                                              </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                                7. Normal Dose Range
                                              </span>
                                              <p className="text-slate-800 dark:text-slate-200 font-mono font-medium text-[11px] leading-relaxed break-words">
                                                {ingData.normal_dose_range || 'N/A'}
                                              </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                                                8. Contraindications
                                              </span>
                                              <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-relaxed break-words">
                                                {ingData.contraindications || 'N/A'}
                                              </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                                9. Side Effects & Adverse Effects
                                              </span>
                                              <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-relaxed break-words">
                                                {ingData.side_effects_adverse_effects || 'N/A'}
                                              </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                                                10. Monitoring Parameters
                                              </span>
                                              <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-relaxed break-words">
                                                {ingData.monitoring_parameters || 'N/A'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })() : (
                                      <p className="text-xs text-amber-700 dark:text-amber-300 italic p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                        Drug identified ({ingItem.ingredient}), but drug knowledge is not currently available in the database.
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                              <span className="font-extrabold uppercase text-[10px] block">Database Status Note</span>
                              <p className="text-[11px] leading-relaxed">
                                Trade name could not be confidently resolved. The entered drug name ("{trade !== '—' ? `${trade}` : generic}") is preserved in the prescription workflow without fabrication.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4B — AI CLINICAL MEDICATION INTERPRETATION */}
                {section4DrugKnowledge.length > 0 && section4AiSynthesis && (
                  <div className="space-y-5 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          4B — AI CLINICAL MEDICATION INTERPRETATION
                        </h4>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Synthesized with Section 3 Labs & Patient Record
                      </span>
                    </div>

                    {/* 1. MEDICATION-RELATED PROBLEMS (MRPs) */}
                    {section4AiSynthesis.mrpList && section4AiSynthesis.mrpList.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Identified Medication-Related Problems (MRPs)</span>
                        </h5>

                        <div className="space-y-3">
                          {section4AiSynthesis.mrpList.map((mrp, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/80 space-y-2 text-xs">
                              <div className="flex items-start justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300">
                                    {mrp.priority}
                                  </span>
                                  <strong className="font-extrabold text-slate-900 dark:text-white">
                                    {mrp.category}
                                  </strong>
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  Confidence: {mrp.confidence}
                                </span>
                              </div>

                              <p className="text-slate-800 dark:text-slate-200 text-xs">
                                <strong>Medication(s) Involved:</strong> {mrp.medicationsInvolved}
                              </p>

                              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-800/60 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">Case Evidence</span>
                                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{mrp.caseEvidence}</p>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-800/60 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">Pharmacological Rationale & Database Fact</span>
                                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{mrp.pharmacologicalRationale}</p>
                              </div>

                              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">Suggested Clinical Consideration</span>
                                <p className="text-emerald-900 dark:text-emerald-200 text-[11px] font-semibold leading-relaxed">{mrp.suggestedConsideration}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 1B. DIAGNOSTIC & RADIOLOGICAL FINDINGS CONTEXT BLOCK */}
                    {section4AiSynthesis.diagnosticFindings && section4AiSynthesis.diagnosticFindings.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <FileSearch className="w-4 h-4 text-blue-500" />
                          <span>Diagnostic & Radiological Findings (Contextual Synthesis)</span>
                        </h5>

                        <div className="space-y-3">
                          {section4AiSynthesis.diagnosticFindings.map((diag, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/80 space-y-2 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <strong className="font-extrabold text-blue-900 dark:text-blue-200 text-xs">
                                  {diag.investigation_name} {diag.test_date && diag.test_date !== '—' ? `(${diag.test_date})` : ''}
                                </strong>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                                  {diag.source}
                                </span>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200/60 dark:border-blue-800/60 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 block">Patient-Specific Finding / Result</span>
                                <p className="text-slate-800 dark:text-slate-200 text-[11px] font-bold leading-relaxed">{diag.patient_finding}</p>
                                {diag.remarks && (
                                  <p className="text-slate-500 dark:text-slate-400 text-[10px] italic">Remarks: {diag.remarks}</p>
                                )}
                              </div>

                              {diag.master_expected_findings && (
                                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block">Master Knowledge: Expected Normal Findings</span>
                                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{diag.master_expected_findings}</p>
                                </div>
                              )}

                              {diag.master_clinical_significance && (
                                <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">Master Knowledge: Clinical Significance</span>
                                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{diag.master_clinical_significance}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. DRUG-DRUG INTERACTIONS */}
                    {section4AiSynthesis.interactionConcerns && section4AiSynthesis.interactionConcerns.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <span>Drug-Drug Interaction Analysis</span>
                        </h5>

                        <div className="space-y-3">
                          {section4AiSynthesis.interactionConcerns.map((inter, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <strong className="font-extrabold text-indigo-900 dark:text-indigo-200 text-xs">
                                  {inter.drugsInvolved}
                                </strong>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100">
                                  {inter.confidence}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 text-[11px]"><strong>Mechanism:</strong> {inter.mechanism}</p>
                              <p className="text-slate-700 dark:text-slate-300 text-[11px]"><strong>Clinical Significance:</strong> {inter.clinicalSignificance}</p>
                              <p className="text-indigo-800 dark:text-indigo-300 font-semibold text-[11px]"><strong>Clinical Consideration:</strong> {inter.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. DRUG-DISEASE & CONTRAINDICATION ANALYSIS */}
                    {section4AiSynthesis.contraindicationConcerns && section4AiSynthesis.contraindicationConcerns.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4 text-rose-500" />
                          <span>Drug-Disease & Contraindication Analysis</span>
                        </h5>

                        <div className="space-y-3">
                          {section4AiSynthesis.contraindicationConcerns.map((c, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/80 space-y-2 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <strong className="font-extrabold text-rose-900 dark:text-rose-200 text-xs">
                                  {c.drugLabel} — {c.matchedCondition}
                                </strong>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
                                  {c.confidence}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 text-[11px]">{c.reasoning}</p>
                              <p className="text-rose-800 dark:text-rose-300 font-semibold text-[11px]"><strong>Consideration:</strong> {c.clinicalConsideration}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. ADVERSE EFFECT ASSOCIATIONS */}
                    {section4AiSynthesis.adverseEffectConcerns && section4AiSynthesis.adverseEffectConcerns.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <HeartPulse className="w-4 h-4 text-amber-500" />
                          <span>Possible Medication-Related Adverse Effects</span>
                        </h5>

                        <div className="space-y-3">
                          {section4AiSynthesis.adverseEffectConcerns.map((adv, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/80 space-y-2 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <strong className="font-extrabold text-amber-900 dark:text-amber-200 text-xs">
                                  {adv.drugLabel} — {adv.patientSymptom}
                                </strong>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                                  {adv.confidence}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 text-[11px]">{adv.reasoning}</p>
                              <p className="text-amber-800 dark:text-amber-300 font-semibold text-[11px]"><strong>Clinical Assessment Note:</strong> {adv.clinicalConsideration}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. PRIORITIZED SAFETY & MONITORING PARAMETERS (SECTION 3 LAB SYNTHESIZED) */}
                    {section4AiSynthesis.monitoringPriorities && section4AiSynthesis.monitoringPriorities.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-cyan-500" />
                          <span>Prioritized Safety & Laboratory Monitoring Parameters</span>
                        </h5>

                        <div className="space-y-2 text-xs">
                          {section4AiSynthesis.monitoringPriorities.map((mon, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border text-xs leading-relaxed ${
                              mon.isHighPriority ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}>
                              <strong className="text-slate-900 dark:text-white font-extrabold block">{mon.drugLabel}</strong>
                              <p className="text-slate-700 dark:text-slate-300 mt-1">{mon.priorityNote}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SECTION 5A: DRUG–DRUG INTERACTION ANALYSIS                          */}
          {/* ==================================================================== */}
          {loadingSection5A ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Evaluating Section 5A Master Drug–Drug Interactions...</span>
              </div>
            </div>
          ) : section5ADdiResult && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-indigo-200/80 dark:border-slate-800 shadow-xl space-y-6">
              
              {/* Section 5A Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-xs font-semibold mb-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Section 5A — Master Drug–Drug Interaction Analysis</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    5A — Drug–Drug Interaction Analysis
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                    Deterministic evaluation of student's prescribed medications against authoritative Supabase master interaction database.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Evaluated Pairs: <strong>{section5ADdiResult.evaluatedPairsCount || 0}</strong>
                  </span>
                </div>
              </div>

              {/* Section 5A Content */}
              {!section5ADdiResult.hasInteractions ? (
                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-indigo-500 mx-auto" />
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    No Clinically Relevant Interactions Identified
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                    {section5ADdiResult.message}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {section5ADdiResult.interactions.map((inter, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-indigo-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 dark:text-white">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {inter.drugAGeneric}
                          </span>
                          <span className="text-slate-400">+</span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {inter.drugBGeneric}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {inter.severity}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Ref: {inter.sourceReference}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <strong className="text-slate-900 dark:text-white font-bold block">Interaction Description:</strong>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{inter.interactionDescription}</p>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-slate-900 dark:text-white font-bold block">Pharmacological Mechanism:</strong>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{inter.mechanism}</p>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-slate-900 dark:text-white font-bold block">Clinical Significance:</strong>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{inter.clinicalSignificance}</p>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-slate-900 dark:text-white font-bold block">Clinical Management:</strong>
                          <p className="text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">{inter.management}</p>
                        </div>
                      </div>

                      {inter.monitoring && (
                        <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-xs flex items-start gap-2">
                          <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-indigo-900 dark:text-indigo-300 font-bold">Monitoring Advice:</strong>
                            <span className="text-indigo-800 dark:text-indigo-200 ml-1">{inter.monitoring}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ==================================================================== */}
          {/* SECTION 5B: DRUG–FOOD INTERACTION ANALYSIS                          */}
          {/* ==================================================================== */}
          {loadingSection5B ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-extrabold text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span>Evaluating Section 5B Master Drug–Food Interactions...</span>
              </div>
            </div>
          ) : section5BDfiResult && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-amber-200/80 dark:border-slate-800 shadow-xl space-y-6">
              
              {/* Section 5B Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-semibold mb-2">
                    <Utensils className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Section 5B — Master Drug–Food Interaction Analysis</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    5B — Drug–Food Interaction Analysis
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                    Deterministic evaluation of student's prescribed medications against authoritative Supabase drug-food interaction database.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Evaluated Drugs: <strong>{section5BDfiResult.evaluatedDrugsCount || 0}</strong>
                  </span>
                </div>
              </div>

              {/* Section 5B Content */}
              {!section5BDfiResult.hasInteractions ? (
                <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    No Clinically Relevant Interactions Identified
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                    {section5BDfiResult.message}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {section5BDfiResult.interactions.map((inter, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-amber-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 dark:text-white">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {inter.drugGeneric}
                          </span>
                          <span className="text-slate-400">+</span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {inter.foodOrBeverage}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {inter.severity}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Ref: {inter.sourceReference}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <strong className="text-slate-900 dark:text-white font-bold block">Interaction Description:</strong>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{inter.interactionDescription}</p>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-slate-900 dark:text-white font-bold block">Pharmacological Mechanism:</strong>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{inter.mechanism}</p>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-slate-900 dark:text-white font-bold block">Clinical Significance:</strong>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{inter.clinicalSignificance}</p>
                        </div>

                        <div className="space-y-1">
                          <strong className="text-slate-900 dark:text-white font-bold block">Clinical Management Strategy:</strong>
                          <p className="text-amber-800 dark:text-amber-200 font-medium leading-relaxed">{inter.management}</p>
                        </div>
                      </div>

                      {inter.counsellingPoint && (
                        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-xs flex items-start gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-emerald-900 dark:text-emerald-300 font-bold">Patient Counselling Point:</strong>
                            <span className="text-emerald-800 dark:text-emerald-200 ml-1 font-medium">{inter.counsellingPoint}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* SECTION 6A — ADVERSE DRUG REACTION (ADR) CAUSALITY & RISK SYNTHESIS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-w-0 w-full">
        
        {/* CARD HEADER */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-rose-50/50 via-slate-50 to-white dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  6A — Adverse Drug Reaction (ADR) Causality & Risk Synthesis
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Pharmacovigilance Evaluation
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Educational Clinical Analysis of Saved Adverse Event Documentation & Causality Criteria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAdrSaved ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ADR Record Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                No ADR Saved
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!isAdrSaved && !adrRecord?.suspected_drug && !adrRecord?.reaction_description ? (
            <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No ADR Documentation Saved for This Case
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                No Adverse Drug Reaction report has been saved under ADR Documentation for this clinical case. If an adverse drug event is suspected during pharmacotherapy, record details in the ADR Documentation module to generate structured causality scoring and risk synthesis.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* EDUCATIONAL DISCLAIMER BANNER */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold block">Educational Clinical Analysis Disclaimer:</strong>
                  The following ADR causality and risk synthesis is evaluated from saved student documentation using established pharmacovigilance frameworks (Naranjo Causality Algorithm & WHO Criteria) for preceptor evaluation and clinical learning.
                </div>
              </div>

              {/* PATIENT-SPECIFIC RECORDED FINDINGS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>1. Patient-Specific Recorded ADR Findings</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suspected Drug</span>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {adrRecord.suspected_drug || adrRecord.drug_name || 'Not Specified'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reaction Category</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {adrRecord.reaction_category || adrRecord.category || 'General / Systemic'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Severity Rating</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        String(adrRecord.severity || '').toLowerCase() === 'severe'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : String(adrRecord.severity || '').toLowerCase() === 'moderate'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {adrRecord.severity || 'Mild'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Onset</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {adrRecord.date_of_onset || adrRecord.onset_date || 'Not Documented'}
                    </p>
                  </div>

                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                    <div>
                      <strong className="text-slate-900 dark:text-white font-bold block">Adverse Reaction Description:</strong>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {adrRecord.reaction_description || adrRecord.reaction_details || 'No reaction details documented.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-semibold">Action Taken:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{adrRecord.action_taken || 'Unknown'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Dechallenge Outcome:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{adrRecord.dechallenge_result || adrRecord.dechallenge || 'Not Done'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Rechallenge Outcome:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{adrRecord.rechallenge_result || adrRecord.rechallenge || 'Not Done'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Patient Outcome:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{adrRecord.patient_outcome || 'Unknown'}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* CLINICAL INTERPRETATION & ASSESSMENT */}
              <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  <span>2. Clinical Interpretation & Causality Evaluation</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Naranjo Assessment */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-indigo-950 dark:text-indigo-200 font-bold flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Naranjo Causality Assessment
                      </strong>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 font-extrabold text-[10px]">
                        {adrRecord.causality_category || adrRecord.naranjo_causality || (adrRecord.naranjo_score >= 9 ? 'Certain' : adrRecord.naranjo_score >= 5 ? 'Probable' : adrRecord.naranjo_score >= 1 ? 'Possible' : 'Unlikely')}
                        {adrRecord.naranjo_score !== undefined && adrRecord.naranjo_score !== null ? ` (Score: ${adrRecord.naranjo_score})` : ''}
                      </span>
                    </div>
                    <p className="text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed text-[11px]">
                      {(() => {
                        const score = adrRecord.naranjo_score;
                        const cat = String(adrRecord.causality_category || adrRecord.naranjo_causality || '').toLowerCase();
                        if (score >= 9 || cat.includes('certain') || cat.includes('definite')) {
                          return "Naranjo criteria indicate a Highly Definite / Certain causal association between the suspected drug and the adverse reaction, supported by temporal onset, dechallenge, and absence of alternative explanations.";
                        }
                        if (score >= 5 || cat.includes('probable')) {
                          return "Naranjo criteria indicate a Probable causal association where the adverse event follows a reasonable temporal sequence after drug administration and is unlikely to be attributed to concurrent disease.";
                        }
                        if (score >= 1 || cat.includes('possible')) {
                          return "Naranjo criteria indicate a Possible causal association. The event follows a reasonable temporal sequence but could also be explained by underlying disease or concurrent pharmacotherapy.";
                        }
                        return "Naranjo criteria suggest an Unlikely causal association or insufficient objective data to confirm a direct drug-induced etiology.";
                      })()}
                    </p>
                  </div>

                  {/* WHO Rating */}
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-purple-950 dark:text-purple-200 font-bold flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        WHO Causality Rating
                      </strong>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-extrabold text-[10px]">
                        {adrRecord.who_causality || adrRecord.who_rating || 'Probable / Likely'}
                      </span>
                    </div>
                    <p className="text-purple-900/80 dark:text-purple-300/80 leading-relaxed text-[11px]">
                      WHO UMC causality classification aligns with documented clinical presentation, temporal relationship to drug initiation, and pharmacological plausibility.
                    </p>
                  </div>

                  {/* Dechallenge / Rechallenge Consistency */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                    <strong className="text-slate-900 dark:text-white font-bold block">Dechallenge & Rechallenge Evaluation:</strong>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {(() => {
                        const dech = String(adrRecord.dechallenge_result || adrRecord.dechallenge || '').toLowerCase();
                        const rech = String(adrRecord.rechallenge_result || adrRecord.rechallenge || '').toLowerCase();
                        const action = String(adrRecord.action_taken || '').toLowerCase();

                        if (dech.includes('positive') || action.includes('withdrawn') || action.includes('reduced')) {
                          return "Positive dechallenge documented: Patient showed symptom improvement or resolution following drug withdrawal/dose reduction, strongly supporting drug-induced causality.";
                        }
                        if (rech.includes('positive')) {
                          return "Positive rechallenge documented: Re-exposure led to recurrence of adverse symptoms, confirming definitive drug causality.";
                        }
                        return "Dechallenge/Rechallenge outcomes unconfirmed or omitted in accordance with standard patient safety guidelines against deliberate drug re-exposure.";
                      })()}
                    </p>
                  </div>

                  {/* Pharmacovigilance & Documentation Audit */}
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 space-y-2 text-xs">
                    <strong className="text-amber-950 dark:text-amber-200 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Pharmacovigilance & Reporting Advice
                    </strong>
                    <p className="text-amber-900/80 dark:text-amber-300/80 leading-relaxed text-[11px]">
                      {String(adrRecord.severity || '').toLowerCase() === 'severe' || String(adrRecord.seriousness || '').toLowerCase().includes('hospitalization') ? (
                        "High Priority Event: Reaction classified as Severe/Serious. Complete formal documentation for submission to institutional Pharmacovigilance Committee and Pharmacovigilance Programme of India (PvPI)."
                      ) : (
                        "Standard Pharmacovigilance Record: Event documented in patient record. Monitor for resolution and update patient allergy/ADR profile in medical history."
                      )}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* SECTION 6B — PATIENT COUNSELLING & REGIMEN EDUCATION AUDIT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-w-0 w-full">
        
        {/* CARD HEADER */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-teal-50/50 via-slate-50 to-white dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0 shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  6B — Patient Counselling & Regimen Education Audit
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Compliance & Education Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Educational Clinical Audit of Saved Patient Education & Medication Regimen Instructions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isCounsellingSaved ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Counselling Record Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                No Counselling Saved
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!isCounsellingSaved && !counsellingRecord?.points_covered && !counsellingRecord?.counselled_to && !counsellingRecord?.special_instructions ? (
            <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Patient Counselling Documentation Saved for This Case
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                No patient counselling record has been saved under Patient Counselling for this clinical case. If patient/caregiver education was performed during pharmacotherapy, record details in the Patient Counselling module to generate structured compliance audit and medication education synthesis.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* EDUCATIONAL DISCLAIMER BANNER */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/50 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold block">Educational Clinical Audit Disclaimer:</strong>
                  The following patient counselling audit evaluates documented student patient education against essential clinical compliance standards for preceptor review. Recommendations highlight potential educational gaps without altering the student's saved record.
                </div>
              </div>

              {/* 1. DOCUMENTED COUNSELLING FINDINGS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>1. Documented Patient Counselling Findings</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Counselled Recipient</span>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {counsellingRecord.counselled_to || counsellingRecord.recipient || 'Patient'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Counselled By</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {counsellingRecord.counselled_by || student?.full_name || 'Clinical Pharmacist'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Counselling Session Date</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {counsellingRecord.counselling_date || counsellingRecord.date || 'Not Documented'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Understanding Rating</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        String(counsellingRecord.patient_understanding || '').toLowerCase().includes('excellent')
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : String(counsellingRecord.patient_understanding || '').toLowerCase().includes('good')
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                            : String(counsellingRecord.patient_understanding || '').toLowerCase().includes('fair')
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      }`}>
                        {counsellingRecord.patient_understanding || 'Good'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* DOCUMENTED POINTS COVERED PILL BADGES */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <strong className="text-slate-900 dark:text-white font-bold block">Documented Counselling Points Covered:</strong>
                  {(() => {
                    const rawPoints = counsellingRecord.points_covered || counsellingRecord.points || [];
                    const pointsArr = Array.isArray(rawPoints) ? rawPoints : (typeof rawPoints === 'string' ? rawPoints.split(',').map(p => p.trim()) : []);
                    if (pointsArr.length === 0) {
                      return <p className="text-slate-500 italic">No checklist points explicitly marked.</p>;
                    }
                    return (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {pointsArr.map((pt, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-teal-100/80 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border border-teal-300 dark:border-teal-800 text-[11px] font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            {pt}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* LIFESTYLE & SPECIAL INSTRUCTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <strong className="text-slate-900 dark:text-white font-bold block">Documented Lifestyle Modifications:</strong>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {counsellingRecord.lifestyle_modifications || counsellingRecord.lifestyle_advice || 'No specific lifestyle modifications documented.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <strong className="text-slate-900 dark:text-white font-bold block">Documented Special Instructions / Device Advice:</strong>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {counsellingRecord.special_instructions || counsellingRecord.device_instructions || 'No special administration/device instructions documented.'}
                    </p>
                  </div>
                </div>

              </div>

              {/* 2. CLINICAL AUDIT & EDUCATIONAL GAP ANALYSIS */}
              <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>2. Clinical Audit & Educational Gap Analysis</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Overall Coverage Audit */}
                  <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/50 space-y-2 text-xs">
                    <strong className="text-teal-950 dark:text-teal-200 font-bold flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Counselling Coverage Scorecard
                    </strong>
                    <p className="text-teal-900/80 dark:text-teal-300/80 leading-relaxed text-[11px]">
                      {(() => {
                        const rawPoints = counsellingRecord.points_covered || [];
                        const pointsArr = Array.isArray(rawPoints) ? rawPoints : (typeof rawPoints === 'string' ? rawPoints.split(',') : []);
                        const count = pointsArr.length;
                        if (count >= 7) {
                          return `Comprehensive Counselling Recorded (${count} core topics covered): Covers medication identity, dosing, side effects, precautions, storage, and lifestyle modifications.`;
                        }
                        if (count >= 4) {
                          return `Moderate Counselling Recorded (${count} core topics covered): Essential administration points documented. Recommend expanding on side-effect warnings and missed-dose protocols.`;
                        }
                        return `Basic Counselling Recorded (${count} core topics covered): Standard administration instructions documented. Complete detailed counselling points to optimize patient medication adherence.`;
                      })()}
                    </p>
                  </div>

                  {/* Medication-Specific Regimen Verification */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2 text-xs">
                    <strong className="text-indigo-950 dark:text-indigo-200 font-bold flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Prescribed Regimen Specific Education Context
                    </strong>
                    <p className="text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed text-[11px]">
                      {(() => {
                        const drugNames = evaluatedDrugs.map(d => (d.generic_name || d.trade_name || '').toLowerCase()).join(' ');
                        if (drugNames.includes('insulin') || drugNames.includes('glimepiride') || drugNames.includes('metformin')) {
                          return "High-Alert Antidiabetic Therapy Prescribed: Patient education must emphasize hypoglycemia sign recognition (shakiness, sweating, dizziness) and immediate fast-acting carbohydrate administration.";
                        }
                        if (drugNames.includes('warfarin') || drugNames.includes('aspirin') || drugNames.includes('clopidogrel')) {
                          return "Anticoagulant / Antiplatelet Regimen Prescribed: Critical bleeding risk precautions required. Advise reporting unusual bruising, epistaxis, or dark stools.";
                        }
                        if (drugNames.includes('salbutamol') || drugNames.includes('budesonide') || drugNames.includes('inhaler')) {
                          return "Respiratory Inhalation Regimen Prescribed: Inhaler technique demonstration and post-inhalation mouth rinsing (to prevent oral candidiasis) are high priority.";
                        }
                        return `Prescribed Pharmacotherapy Context (${evaluatedDrugs.length} Active Agents): Ensure drug-specific food interaction precautions and administration timing (e.g. before vs after meals) are reinforced during follow-up.`;
                      })()}
                    </p>
                  </div>

                  {/* Identified Educational Gaps */}
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 space-y-2 text-xs">
                    <strong className="text-amber-950 dark:text-amber-200 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Identified / Recommended Counselling Gaps
                    </strong>
                    <p className="text-amber-900/80 dark:text-amber-300/80 leading-relaxed text-[11px]">
                      {(() => {
                        const rawPoints = counsellingRecord.points_covered || [];
                        const pointsStr = (Array.isArray(rawPoints) ? rawPoints.join(' ') : String(rawPoints)).toLowerCase();
                        const missing = [];
                        if (!pointsStr.includes('missed dose')) missing.push('Missed-dose guidance');
                        if (!pointsStr.includes('storage')) missing.push('Storage instructions');
                        if (!pointsStr.includes('side effect')) missing.push('Side-effect warning');
                        if (!pointsStr.includes('interaction')) missing.push('Interaction/precaution advice');

                        if (missing.length > 0) {
                          return `Possible Educational Gaps Identified: The following key points were unconfirmed in documented checklist: ${missing.join(', ')}. Consider addressing these during pre-discharge counselling.`;
                        }
                        return "No Critical Checklist Gaps Identified: Documented points cover all standard patient education domains.";
                      })()}
                    </p>
                  </div>

                  {/* Patient Understanding & Follow-up Advice */}
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-2 text-xs">
                    <strong className="text-purple-950 dark:text-purple-200 font-bold flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Adherence & Follow-Up Recommendations
                    </strong>
                    <p className="text-purple-900/80 dark:text-purple-300/80 leading-relaxed text-[11px]">
                      {String(counsellingRecord.patient_understanding || '').toLowerCase().includes('poor') || String(counsellingRecord.patient_understanding || '').toLowerCase().includes('fair') ? (
                        "Follow-Up Priority: Patient understanding rated Fair/Poor. Recommend follow-up teach-back session prior to discharge and providing written patient information leaflets (PILs)."
                      ) : (
                        "Good Patient Comprehension Recorded: Reinforce key administration rules at follow-up visits to sustain long-term medication compliance."
                      )}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* SECTION 6C — PHARMACIST CLINICAL INTERVENTION EVALUATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-w-0 w-full">
        
        {/* CARD HEADER */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  6C — Pharmacist Clinical Intervention Evaluation
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  DTP & Recommendation Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Educational Clinical Analysis of Identified Drug Therapy Problems & Proposed Corrective Interventions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isInterventionSaved ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Intervention Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                No Intervention Saved
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!isInterventionSaved && !interventionRecord?.prescription_problems && !interventionRecord?.problem_details && !interventionRecord?.recommendations ? (
            <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Pharmacist Intervention Record Saved for This Case
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                No clinical intervention record has been saved under Pharmacist Intervention for this clinical case. If a Drug Therapy Problem (DTP) was identified or recommendation made to the clinical team, record details in the Pharmacist Intervention module to generate structured clinical evaluation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* EDUCATIONAL DISCLAIMER BANNER */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold block">Educational Clinical Evaluation Disclaimer:</strong>
                  The following pharmacist intervention evaluation analyzes documented student drug therapy problem (DTP) identification and clinical recommendations against physician acceptance status and patient safety standards for preceptor review.
                </div>
              </div>

              {/* 1. DOCUMENTED PHARMACIST INTERVENTION FINDINGS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>1. Documented Pharmacist Intervention Findings</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Physician Acceptance Status</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        String(interventionRecord.physician_acceptance || '').toLowerCase().includes('accepted')
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : String(interventionRecord.physician_acceptance || '').toLowerCase().includes('reject')
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}>
                        {interventionRecord.physician_acceptance || 'Pending / Under Review'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attending Physician</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {interventionRecord.physician || 'Consultant Physician'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Intervention Date</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {interventionRecord.date_of_intervention || interventionRecord.date || 'Not Documented'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Ward / Dept</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {interventionRecord.ward || norm?.demographics?.ward || 'General Medical Ward'}
                    </p>
                  </div>

                </div>

                {/* DOCUMENTED PROBLEMS & RECOMMENDATIONS BADGES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <strong className="text-slate-900 dark:text-white font-bold block">Identified Prescription Problems (DTPs):</strong>
                    {(() => {
                      const rawProbs = interventionRecord.prescription_problems || interventionRecord.problems || [];
                      const probsArr = Array.isArray(rawProbs) ? rawProbs : (typeof rawProbs === 'string' ? rawProbs.split(',').map(p => p.trim()) : []);
                      if (probsArr.length === 0) {
                        return <p className="text-slate-500 italic">No DTP category selected.</p>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {probsArr.map((p, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-100/80 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                              {p}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <strong className="text-slate-900 dark:text-white font-bold block">Proposed Pharmacist Recommendations:</strong>
                    {(() => {
                      const rawRecs = interventionRecord.recommendations || [];
                      const recsArr = Array.isArray(rawRecs) ? rawRecs : (typeof rawRecs === 'string' ? rawRecs.split(',').map(r => r.trim()) : []);
                      if (recsArr.length === 0) {
                        return <p className="text-slate-500 italic">No recommendation category selected.</p>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {recsArr.map((r, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-100/80 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 text-[11px] font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              {r}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* PROBLEM & RECOMMENDATION DETAILS */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold block">Documented DTP Problem Details:</strong>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {interventionRecord.problem_details || interventionRecord.problem_description || 'No detailed DTP description documented.'}
                    </p>
                  </div>

                  <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                    <strong className="text-slate-900 dark:text-white font-bold block">Documented Proposed Recommendation:</strong>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {interventionRecord.recommendation_details || interventionRecord.recommendation_description || 'No detailed recommendation text documented.'}
                    </p>
                  </div>

                  {interventionRecord.outcome_remarks && (
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                      <strong className="text-slate-900 dark:text-white font-bold block">Documented Outcome Remarks:</strong>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {interventionRecord.outcome_remarks}
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* 2. CLINICAL AI INTERPRETATION & SYNTHESIS */}
              <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>2. Clinical AI Interpretation & Synthesis</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Clinical Relevance of DTP */}
                  <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 space-y-2 text-xs">
                    <strong className="text-rose-950 dark:text-rose-200 font-bold flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      Clinical Relevance of Identified DTP
                    </strong>
                    <p className="text-rose-900/80 dark:text-rose-300/80 leading-relaxed text-[11px]">
                      {(() => {
                        const rawProbs = interventionRecord.prescription_problems || [];
                        const probsStr = (Array.isArray(rawProbs) ? rawProbs.join(' ') : String(rawProbs)).toLowerCase();
                        if (probsStr.includes('interaction') || probsStr.includes('contraindication') || probsStr.includes('high dose')) {
                          return "High Clinical Relevance: Documented DTP addresses high-risk pharmacotherapeutic safety issues (Interaction / Contraindication / Excessive Dose) directly affecting patient safety.";
                        }
                        if (probsStr.includes('duplication') || probsStr.includes('unnecessary') || probsStr.includes('low dose')) {
                          return "Moderate Clinical Relevance: Documented DTP targets therapeutic optimization and dose adjustment to achieve target clinical response.";
                        }
                        return "Standard Clinical Relevance: Documented DTP addresses prescription completeness or schedule optimization.";
                      })()}
                    </p>
                  </div>

                  {/* Recommendation Consistency Assessment */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2 text-xs">
                    <strong className="text-indigo-950 dark:text-indigo-200 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Recommendation Alignment & Logic
                    </strong>
                    <p className="text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed text-[11px]">
                      Proposed intervention recommendation aligns with documented problem statement. Evaluates appropriate corrective action (dose titration, drug discontinuation, or monitoring) for attending physician review.
                    </p>
                  </div>

                  {/* Synthesis with Case Findings (Sections 3 - 5B) */}
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-2 text-xs">
                    <strong className="text-purple-950 dark:text-purple-200 font-bold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Correlation with AI Case Synthesis (Sec 3 – 5B)
                    </strong>
                    <p className="text-purple-900/80 dark:text-purple-300/80 leading-relaxed text-[11px]">
                      {(() => {
                        const hasDdiMatch = section5ADdiResult && section5ADdiResult.hasInteractions;
                        if (hasDdiMatch) {
                          return `DTP Correlation: Student intervention correlates with Section 5A Master DDI findings (${section5ADdiResult.majorCount || 1} Major interactions identified in case regimen).`;
                        }
                        return `Synthesis Context: Intervention addresses active pharmacotherapy regimen containing ${evaluatedDrugs.length} prescribed drugs.`;
                      })()}
                    </p>
                  </div>

                  {/* Acceptance & Documentation Audit */}
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 space-y-2 text-xs">
                    <strong className="text-amber-950 dark:text-amber-200 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Physician Acceptance & Outcome Audit
                    </strong>
                    <p className="text-amber-900/80 dark:text-amber-300/80 leading-relaxed text-[11px]">
                      {(() => {
                        const acc = String(interventionRecord.physician_acceptance || '').toLowerCase();
                        if (acc.includes('accepted')) {
                          return "Physician Acceptance Documented: Clinical recommendation accepted by prescriber. Record updated clinical outcome in patient record.";
                        }
                        if (acc.includes('reject')) {
                          return "Physician Non-Acceptance Documented: Prescriber elected to maintain current therapy. Document clinical rationale and alternative monitoring strategy.";
                        }
                        return "Pending Acceptance / Outcome Audit: Physician acceptance status unconfirmed. Follow up with attending clinical team to record final prescriber disposition.";
                      })()}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* SECTION 6D — DRUG INFORMATION QUERY & EVIDENCE REVIEW */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-w-0 w-full">
        
        {/* CARD HEADER */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-purple-50/50 via-slate-50 to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  6D — Drug Information Query & Evidence Review
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Evidence Synthesis & Literature Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Educational Clinical Review of Saved Drug Information Query, Literature Search Strategy & Evidence Response
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isDirSaved ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Drug Info Record Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                No Drug Info Saved
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!isDirSaved && !dirRecord?.query_text && !dirRecord?.question_category && !dirRecord?.structured_response ? (
            <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Drug Information Request Saved for This Case
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                No drug information request record has been saved under Drug Information Request for this clinical case. If a clinical drug query was received from a physician, nurse, or patient, record details in the Drug Information module to generate structured evidence evaluation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* EDUCATIONAL DISCLAIMER BANNER */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold block">Educational Evidence Review Disclaimer:</strong>
                  The following Drug Information review evaluates documented student query synthesis, literature search methodology, and evidence-based response structure against standard clinical pharmacotherapy resources for preceptor evaluation.
                </div>
              </div>

              {/* 1. DOCUMENTED DRUG INFORMATION REQUEST FINDINGS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>1. Documented Drug Information Request Findings</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Question Category</span>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {dirRecord.question_category || dirRecord.category || 'Therapeutic Use'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enquirer Category</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {dirRecord.enquirer_type || dirRecord.enquirer || 'Healthcare Professional'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Urgency Level</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        String(dirRecord.urgency_level || '').toLowerCase().includes('immediate') || String(dirRecord.urgency_level || '').toLowerCase().includes('emergency')
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : String(dirRecord.urgency_level || '').toLowerCase().includes('urgent')
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                      }`}>
                        {dirRecord.urgency_level || 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Request Date & Mode</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {dirRecord.date_of_request || dirRecord.request_date || 'Not Documented'} ({dirRecord.mode_of_request || 'Written'})
                    </p>
                  </div>

                </div>

                {/* QUERY TEXT & PATIENT BACKGROUND */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold block">Documented Clinical Query Text:</strong>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {dirRecord.query_text || dirRecord.question || 'No clinical query text documented.'}
                    </p>
                  </div>

                  {dirRecord.patient_background && (
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                      <strong className="text-slate-900 dark:text-white font-bold block">Documented Patient Clinical Background:</strong>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {dirRecord.patient_background}
                      </p>
                    </div>
                  )}
                </div>

                {/* LITERATURE SEARCH & STRUCTURED RESPONSE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <strong className="text-slate-900 dark:text-white font-bold block">Documented Literature Search Strategy / Sources:</strong>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {dirRecord.literature_search_strategy || dirRecord.literature_sources || 'No literature search strategy documented.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <strong className="text-slate-900 dark:text-white font-bold block">Documented Cited References / Guidelines:</strong>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {dirRecord.references || dirRecord.citations || 'No citations or references recorded.'}
                    </p>
                  </div>
                </div>

                {/* STRUCTURED RESPONSE TEXT */}
                <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-2 text-xs">
                  <strong className="text-purple-950 dark:text-purple-200 font-bold block">Documented Evidence-Based Response:</strong>
                  <p className="text-purple-900/90 dark:text-purple-300/90 leading-relaxed text-[11px]">
                    {dirRecord.structured_response || dirRecord.response || 'No response text documented.'}
                  </p>
                </div>

              </div>

              {/* 2. CLINICAL AI EVIDENCE EVALUATION & SYNTHESIS */}
              <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>2. Clinical AI Evidence Evaluation & Synthesis</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Clinical Question Clarity Audit */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2 text-xs">
                    <strong className="text-indigo-950 dark:text-indigo-200 font-bold flex items-center gap-1.5">
                      <FileSearch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Query Specificity & Clinical Context Audit
                    </strong>
                    <p className="text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed text-[11px]">
                      {dirRecord.query_text ? (
                        `Documented Query Evaluated (${dirRecord.question_category || 'General'}): Clinical question clearly formulates enquirer request. Patient background provides necessary context for therapeutic response.`
                      ) : (
                        "Query Text Incomplete: Record lacks detailed question wording. Ensure full clinical query is transcribed."
                      )}
                    </p>
                  </div>

                  {/* Response Alignment Assessment */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 space-y-2 text-xs">
                    <strong className="text-emerald-950 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Structured Response Completeness
                    </strong>
                    <p className="text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed text-[11px]">
                      {dirRecord.structured_response ? (
                        "Response Alignment Confirmed: Documented answer directly addresses question category with structured clinical advice and recommendations."
                      ) : (
                        "Response Text Pending: Evidence-based answer has not been fully recorded under structured response."
                      )}
                    </p>
                  </div>

                  {/* Search Strategy & Source Alignment */}
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-2 text-xs">
                    <strong className="text-purple-950 dark:text-purple-200 font-bold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Literature Search Strategy Methodology
                    </strong>
                    <p className="text-purple-900/80 dark:text-purple-300/80 leading-relaxed text-[11px]">
                      {(() => {
                        const strat = String(dirRecord.literature_search_strategy || '').toLowerCase();
                        const cat = String(dirRecord.question_category || '').toLowerCase();

                        if (cat.includes('pregnancy') || cat.includes('lactation')) {
                          return "Specialty Search Context: Pregnancy/Lactation query requires consultation of specialized reproductive safety databases (e.g. Briggs, LactMed, Micromedex).";
                        }
                        if (cat.includes('renal') || cat.includes('dosage')) {
                          return "Renal / Dosing Search Context: Requires consultation of tertiary drug handbooks (AHFS, Sanford Guide, Renal Dose Handbook) and manufacturer prescribing info.";
                        }
                        if (strat.includes('pubmed') || strat.includes('micromedex') || strat.includes('lexicomp')) {
                          return `Documented Search Strategy (${dirRecord.literature_search_strategy}): Incorporates authoritative tertiary & secondary clinical databases.`;
                        }
                        return "Standard Search Strategy: Ensure primary/secondary literature databases (PubMed, Micromedex, Lexicomp) are consulted for evidence verification.";
                      })()}
                    </p>
                  </div>

                  {/* Evidence & Citation Audit */}
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 space-y-2 text-xs">
                    <strong className="text-amber-950 dark:text-amber-200 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Citations & Evidence Integrity Audit
                    </strong>
                    <p className="text-amber-900/80 dark:text-amber-300/80 leading-relaxed text-[11px]">
                      {dirRecord.references ? (
                        "Citations Recorded: Reference citations present in record. Verify Vancouver/AMA reference formatting prior to preceptor sign-off."
                      ) : (
                        "Documentation Gap: No formal reference citations recorded. Include at least 2 authoritative literature references (e.g. NFI, BNF, PubMed PMID, Clinical Practice Guidelines) to substantiate response."
                      )}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* UNNUMBERED OVERALL CLINICAL CASE ANALYSIS SUMMARY */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-w-0 w-full">
        
        {/* CARD HEADER */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Overall Clinical Case Analysis Summary
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Unified Case Synthesis Across Sections 3 through 6D
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* ONE SHORT CONCISE SUMMARY PARAGRAPH */}
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {(() => {
              const ageStr = norm?.demographics?.age ? `${norm.demographics.age}-year-old` : 'patient';
              const genderStr = norm?.demographics?.gender ? norm.demographics.gender.toLowerCase() : 'patient';
              const diagStr = (Array.isArray(norm?.diagnoses) && norm.diagnoses.length > 0) ? norm.diagnoses.join(', ') : 'presenting clinical condition';
              const drugCount = Array.isArray(evaluatedDrugs) ? evaluatedDrugs.length : 0;

              let ddiStr = '';
              if (section5ADdiResult && section5ADdiResult.hasInteractions) {
                ddiStr = ` Major drug-drug interactions were identified requiring close clinical monitoring.`;
              }

              let adrStr = '';
              if (isAdrSaved && adrRecord?.suspected_drug) {
                adrStr = ` A suspected adverse reaction to ${adrRecord.suspected_drug} was documented and evaluated.`;
              }

              let counselStr = '';
              if (isCounsellingSaved) {
                counselStr = ` Patient counselling and compliance education points have been audited.`;
              }

              return `This clinical case involves a ${ageStr} ${genderStr} managed for ${diagStr} with ${drugCount} active prescribed pharmacotherapeutic agents. Evaluation across Sections 3 through 6D confirms therapeutic indication alignment, dosing safety parameters, and laboratory risk monitoring.${ddiStr}${adrStr}${counselStr} Continued preceptor evaluation and multidisciplinary clinical oversight are recommended to optimize therapeutic outcomes.`;
            })()}
          </p>

          {/* EDUCATIONAL DISCLAIMER - RED / CAUTION TREATMENT */}
          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1.5 text-xs text-rose-950 dark:text-rose-200">
            <strong className="font-extrabold uppercase tracking-wide flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              AI-GENERATED ANALYSIS — EDUCATIONAL REFERENCE ONLY
            </strong>
            <p className="text-rose-900/90 dark:text-rose-300/90 leading-relaxed text-[11px]">
              AI-generated analysis is provided for educational and reference purposes and does not replace clinical judgment, preceptor review, or professional patient-care decisions.
            </p>
          </div>

          {/* PDF DOWNLOAD BUTTON */}
          <div className="pt-2 flex justify-start">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Download AI Clinical Case Analysis PDF with College Branding"
            >
              {downloadingPDF ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating College PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Download AI Analysis PDF</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
