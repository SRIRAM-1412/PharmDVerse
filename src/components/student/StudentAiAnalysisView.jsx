import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, FilePlus2, ShieldCheck, CheckCircle2, AlertCircle, FolderKanban, 
  ArrowRight, RefreshCw, AlertTriangle, FileText, CheckCircle, Clock, Info, 
  Pill, AlertOctagon, Activity, HeartPulse, UserCheck, BookOpen, Layers
} from 'lucide-react';
import { fetchStudentCasesFromSupabase, fetchCaseModuleStatusesFromSupabase } from '../../services/supabaseService';
import { buildNormalizedApprovedCaseData } from '../../utils/buildNormalizedApprovedCaseData';
import { resolveClinicalEntityKnowledge } from '../../services/clinicalKnowledgeService';
import { evaluatePairwiseDrugInteraction, runAiClinicalCaseAnalysis } from '../../services/aiAnalysisService';

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
 * Student Role AI Clinical Case Analysis View.
 * Educational Analysis Engine Triggered by SAVED Form Data.
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
            /* SECTION 1 — CASE OVERVIEW (DYNAMIC PERSISTED CASE DATA) */
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
          )}
        </div>
      )}
    </div>
  );
};
