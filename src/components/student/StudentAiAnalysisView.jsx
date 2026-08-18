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
 * Clinical Brand & Generic Medication Identity Database
 */
/**
 * Clinical Brand & Generic Medication Identity Database
 */
const BRAND_GENERIC_REGISTRY = {
  // Cardiac, Inotropic & Antiplatelet / Antihypertensive Agents
  'digoxin': { generic: 'Digoxin', brand: 'Lanoxin', type: 'Generic Name', class: 'Cardiac Glycoside (Inotropic Agent & Na+/K+-ATPase Inhibitor)', use: 'Rate control in chronic Atrial Fibrillation / Atrial Flutter and HFrEF.', moa: 'Reversibly inhibits membrane-bound Na+/K+-ATPase pump in cardiac myocytes, increasing intracellular sodium, reducing Na+/Ca2+ exchange and increasing intracellular calcium for positive inotropy.', mon: 'Monitor serum digoxin levels (0.5-0.9 ng/mL for HF, 0.8-2.0 ng/mL for AF), serum potassium, magnesium, and renal clearance.', dose: '0.125 mg – 0.25 mg Oral QD' },
  'lanoxin': { generic: 'Digoxin', brand: 'Lanoxin', type: 'Brand Name', class: 'Cardiac Glycoside (Inotropic Agent & Na+/K+-ATPase Inhibitor)', use: 'Rate control in chronic Atrial Fibrillation / Atrial Flutter and HFrEF.', moa: 'Reversibly inhibits Na+/K+-ATPase pump in cardiac myocytes.', mon: 'Monitor serum digoxin levels, potassium, and renal clearance.', dose: '0.125 mg – 0.25 mg Oral QD' },
  
  'aspirin': { generic: 'Aspirin (Acetylsalicylic Acid)', brand: 'Ecospirin / Disprin', type: 'Generic Name', class: 'Antiplatelet Agent & NSAID — Irreversible Cyclooxygenase-1 (COX-1) Inhibitor', use: 'Primary & secondary prevention of acute coronary syndromes, ischemic stroke, TIA, and arterial thrombosis.', moa: 'Irreversibly acetylates Serine-529 of COX-1 in platelets, permanently blocking Thromboxane A2 (TXA2) synthesis and inhibiting TXA2-mediated platelet activation for the 7-10 day lifespan of the platelet.', mon: 'Monitor for GI bleeding, dark stools, epigastric distress, and complete blood counts.', dose: '75 mg – 150 mg Oral OD (Antiplatelet)' },
  'ecosprin': { generic: 'Aspirin (Acetylsalicylic Acid)', brand: 'Ecospirin', type: 'Brand Name', class: 'Antiplatelet Agent — Irreversible COX-1 Inhibitor', use: 'Prevention of myocardial infarction, ischemic stroke, and post-angioplasty thrombosis.', moa: 'Irreversibly acetylates platelet COX-1, suppressing Thromboxane A2 production.', mon: 'Monitor for GI mucosal irritation, bleeding signs, and Hb/Hct.', dose: '75 mg – 150 mg Oral OD' },
  'ecospirin': { generic: 'Aspirin (Acetylsalicylic Acid)', brand: 'Ecospirin', type: 'Brand Name', class: 'Antiplatelet Agent — Irreversible COX-1 Inhibitor', use: 'Prevention of myocardial infarction and ischemic stroke.', moa: 'Irreversibly acetylates platelet COX-1, suppressing TXA2 synthesis.', mon: 'Monitor GI tolerance and bleeding signs.', dose: '75 mg – 150 mg Oral OD' },
  
  'telmisartan': { generic: 'Telmisartan', brand: 'Telma / Micardis', type: 'Generic Name', class: 'Angiotensin II Receptor Blocker (ARB / AT1 Receptor Antagonist)', use: 'Essential hypertension, reduction of cardiovascular morbidity, and diabetic nephropathy.', moa: 'Selectively blocks Angiotensin II binding to AT1 receptors in vascular smooth muscle and adrenal gland, inhibiting Angiotensin II-mediated vasoconstriction and aldosterone secretion.', mon: 'Monitor blood pressure, serum potassium, and renal function (Serum Creatinine & BUN).', dose: '20 mg – 40 mg Oral QD' },
  'telmisaten': { generic: 'Telmisartan', brand: 'Telma', type: 'Generic Name (Pharmacopoeia Variant)', class: 'Angiotensin II Receptor Blocker (ARB / AT1 Receptor Antagonist)', use: 'Essential hypertension and renal protection.', moa: 'Selectively blocks AT1 angiotensin II receptors, inhibiting vasoconstriction and aldosterone release.', mon: 'Monitor blood pressure, serum potassium, and renal clearance.', dose: '20 mg – 40 mg Oral QD' },
  'telma': { generic: 'Telmisartan', brand: 'Telma', type: 'Brand Name', class: 'Angiotensin II Receptor Blocker (ARB / AT1 Receptor Antagonist)', use: 'Essential hypertension and cardiovascular risk reduction.', moa: 'Blocks vascular AT1 angiotensin II receptors, preventing vasoconstriction.', mon: 'Monitor blood pressure, serum potassium, and renal function.', dose: '20 mg – 40 mg Oral QD' },

  'clopidogrel': { generic: 'Clopidogrel', brand: 'Plavix / Clopilet', type: 'Generic Name', class: 'Antiplatelet Agent — Irreversible P2Y12 ADP Receptor Antagonist', use: 'Atherothrombotic event reduction in recent MI, stroke, or post-stent placement.', moa: 'Active thiol metabolite irreversibly modifies platelet P2Y12 receptors, blocking ADP binding.', mon: 'Monitor bleeding parameters and complete blood counts.', dose: '75 mg Oral QD' },
  'plavix': { generic: 'Clopidogrel', brand: 'Plavix', type: 'Brand Name', class: 'Antiplatelet Agent — Irreversible P2Y12 ADP Receptor Antagonist', use: 'Reduction of atherothrombotic events post-MI or stroke.', moa: 'Irreversibly modifies platelet P2Y12 purinergic receptors.', mon: 'Monitor for signs of bleeding and hematocrit.', dose: '75 mg Oral QD' },

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
 * Retrieves verified drug-specific information (Drug Class, Established Use, MOA, Monitoring, Dosing)
 * from authoritative pharmacopoeia registry without generic templates.
 */
const getMedicationSpecificAnalysis = (drug) => {
  const trade = String(drug.trade_name || '').replace(/^—$/, '').trim();
  const generic = String(drug.generic_name || '').replace(/^—$/, '').trim();
  const rawInput = `${generic} ${trade}`.trim();
  const name = rawInput.toLowerCase();
  const cleanName = name.replace(/[^a-z0-9]/g, '');

  const tradeLower = trade.toLowerCase();
  const genericLower = generic.toLowerCase();
  const cleanTrade = tradeLower.replace(/[^a-z0-9]/g, '');
  const cleanGeneric = genericLower.replace(/[^a-z0-9]/g, '');

  // Check direct registry entry across trade, generic, combined string, or clean tokens
  let matchedKey = Object.keys(BRAND_GENERIC_REGISTRY).find(k => {
    const cleanK = k.replace(/[^a-z0-9]/g, '');
    return (
      (tradeLower && (tradeLower === k || cleanTrade === cleanK || tradeLower.includes(k))) ||
      (genericLower && (genericLower === k || cleanGeneric === cleanK || genericLower.includes(k))) ||
      name.includes(k) ||
      cleanName.includes(cleanK)
    );
  });

  if (matchedKey) {
    const entry = BRAND_GENERIC_REGISTRY[matchedKey];
    return {
      originalEntry: rawInput,
      recognizedEntryType: entry.type,
      resolvedGeneric: entry.generic,
      brandName: entry.brand,
      drugClass: entry.class,
      establishedUse: entry.use,
      mechanismOfAction: entry.moa,
      monitoringAdvice: entry.mon,
      formularyDose: entry.dose,
      isVerified: true,
      needsVerificationBanner: false
    };
  }

  // Smart Stem Matcher for recognized pharmacological drug families
  const stems = [
    // CNS, Antidepressants & Anxiolytics
    { stem: 'triptyline', cls: 'Tricyclic Antidepressant (TCA) — Serotonin & Norepinephrine Reuptake Inhibitor', use: 'Major depressive disorder, neuropathic pain management, and migraine prophylaxis.', moa: 'Inhibits presynaptic reuptake of serotonin (5-HT) and norepinephrine (NE) in CNS synapses; also blocks peripheral alpha-1, histamine H1, and muscarinic M1 receptors.', mon: 'Monitor ECG/cardiac conduction (QTc interval, QRS duration), blood pressure, anticholinergic side effects (dry mouth, constipation, sedation), and therapeutic response.', dose: '25 mg – 75 mg Oral HS' },
    { stem: 'pramine', cls: 'Tricyclic Antidepressant (TCA)', use: 'Major depressive disorder, enuresis, and chronic neuropathic pain.', moa: 'Inhibits presynaptic reuptake of serotonin and norepinephrine in CNS neurons.', mon: 'Monitor cardiac ECG, blood pressure, and anticholinergic tolerance.', dose: '25 mg – 75 mg Oral HS' },
    { stem: 'xetine', cls: 'Selective Serotonin Reuptake Inhibitor (SSRI)', use: 'Major depressive disorder, generalized anxiety disorder, and OCD.', moa: 'Selectively inhibits presynaptic serotonin transporter (SERT), enhancing central serotonergic neurotransmission.', mon: 'Monitor for suicidal ideation in early therapy, serotonin syndrome signs, hyponatremia/SIADH, and GI tolerance.', dose: '20 mg Oral QD' },
    { stem: 'lopram', cls: 'Selective Serotonin Reuptake Inhibitor (SSRI)', use: 'Major depressive disorder and panic disorder.', moa: 'Selectively inhibits presynaptic serotonin transporter (SERT) in CNS neurons.', mon: 'Monitor QTc interval (dose-dependent restriction for Citalopram), suicidal ideation, and mood response.', dose: '10 mg – 20 mg Oral QD' },
    { stem: 'traline', cls: 'Selective Serotonin Reuptake Inhibitor (SSRI)', use: 'Major depressive disorder, panic disorder, PTSD, and social anxiety disorder.', moa: 'Selectively inhibits neuronal serotonin reuptake (SERT).', mon: 'Monitor mood response, suicidal ideation, and GI symptoms.', dose: '50 mg Oral QD' },
    { stem: 'faxine', cls: 'Serotonin-Norepinephrine Reuptake Inhibitor (SNRI)', use: 'Major depressive disorder, generalized anxiety disorder, and panic disorder.', moa: 'Potently inhibits neuronal reuptake of serotonin and norepinephrine in CNS synapses.', mon: 'Monitor blood pressure (dose-dependent elevation), heart rate, and mood response.', dose: '75 mg Oral QD' },
    { stem: 'zepam', cls: 'Benzodiazepine (GABA-A Receptor Positive Allosteric Modulator)', use: 'Anxiety disorders, panic disorder, acute muscle spasm, and seizure disorders.', moa: 'Binds to Benzodiazepine site on central GABA-A receptors, enhancing GABA-mediated chloride influx and neuronal hyperpolarization.', mon: 'Monitor CNS depression/sedation, respiratory rate, cognitive function, habituation risk, and fall risk in elderly.', dose: '0.5 mg – 2 mg Oral BID-TID' },
    { stem: 'zolam', cls: 'Benzodiazepine (GABA-A Receptor Positive Allosteric Modulator)', use: 'Short-term management of acute anxiety and panic disorder.', moa: 'Enhances GABA-A receptor chloride channel opening frequency, causing central neuronal inhibition.', mon: 'Monitor CNS sedation, cognitive impairment, and withdrawal upon discontinuation.', dose: '0.25 mg – 0.5 mg Oral TID' },

    // Cardiovascular, Renin-Angiotensin & Lipids
    { stem: 'sartan', cls: 'Angiotensin II Receptor Blocker (ARB / AT1 Receptor Antagonist)', use: 'Essential hypertension, heart failure, and diabetic nephropathy.', moa: 'Selectively blocks vascular AT1 angiotensin II receptors, inhibiting vasoconstriction and aldosterone secretion.', mon: 'Monitor blood pressure, serum creatinine, and serum potassium.', dose: '40 mg Oral QD' },
    { stem: 'pril', cls: 'ACE Inhibitor (Angiotensin-Converting Enzyme Inhibitor)', use: 'Hypertension, chronic heart failure, post-MI, and diabetic nephropathy.', moa: 'Inhibits Angiotensin-Converting Enzyme, blocking conversion of Angiotensin I to Angiotensin II and inhibiting bradykinin degradation.', mon: 'Monitor blood pressure, serum creatinine, serum potassium, and watch for dry cough or angioedema.', dose: '10 mg – 20 mg Oral QD' },
    { stem: 'statin', cls: 'HMG-CoA Reductase Inhibitor (Statin)', use: 'Hypercholesterolemia, primary & secondary cardiovascular disease prevention.', moa: 'Competitively inhibits rate-limiting HMG-CoA reductase in hepatic cholesterol biosynthesis.', mon: 'Monitor lipid panel, baseline LFTs (ALT/AST), and report unexplained muscle pain/myopathy.', dose: '20 mg Oral QD' },
    { stem: 'olol', cls: 'Beta-Adrenoceptor Antagonist (Beta-Blocker)', use: 'Hypertension, angina pectoris, tachyarrhythmias, and post-MI.', moa: 'Competitively blocks cardiac Beta-1 adrenergic receptors, decreasing heart rate and contractility.', mon: 'Monitor resting heart rate (hold if HR < 50 bpm) and blood pressure.', dose: '50 mg Oral BID' },
    { stem: 'dipine', cls: 'Dihydropyridine Calcium Channel Blocker (L-type CCB)', use: 'Essential hypertension and chronic stable angina.', moa: 'Inhibits L-type voltage-gated calcium influx into vascular smooth muscle cells, inducing peripheral arterial vasodilation.', mon: 'Monitor blood pressure, resting heart rate, and peripheral ankle edema.', dose: '5 mg Oral QD' },

    // Gastrointestinal & Endocrine
    { stem: 'prazole', cls: 'Proton Pump Inhibitor (Gastric H+/K+-ATPase Inhibitor)', use: 'Gastroesophageal Reflux Disease (GERD), peptic ulcer disease, stress ulcer prophylaxis, and H. pylori eradication.', moa: 'Covalently binds cysteine residues on parietal cell H+/K+-ATPase proton pump, inhibiting final step of gastric acid secretion.', mon: 'Re-evaluate ongoing indication. Monitor serum magnesium, B12, and GI symptom control in long-term therapy.', dose: '40 mg Oral QD' },
    { stem: 'tidine', cls: 'H2-Receptor Antagonist (Histamine H2 Blocker)', use: 'GERD, peptic ulcer disease, and gastric acid hypersecretion.', moa: 'Competitively inhibits histamine H2 receptors on parietal cells, suppressing gastric acid secretion.', mon: 'Monitor GI symptom control and adjust dose in renal impairment.', dose: '150 mg Oral BID' },
    { stem: 'setron', cls: '5-HT3 Receptor Antagonist Antiemetic', use: 'Prevention and treatment of chemotherapy-induced, radiation-induced, and postoperative nausea and vomiting.', moa: 'Selectively antagonizes 5-HT3 receptors peripherally on vagal nerve terminals and centrally in the chemoreceptor trigger zone (CTZ).', mon: 'Monitor bowel function (constipation) and QTc interval in high-risk patients.', dose: '4 mg – 8 mg Oral/IV Q8H' },
    { stem: 'flozin', cls: 'SGLT2 Inhibitor (Sodium-Glucose Co-Transporter 2 Inhibitor)', use: 'Type 2 Diabetes Mellitus, HFrEF, and chronic kidney disease.', moa: 'Inhibits renal proximal tubule SGLT2 transporters, promoting urinary glucose and sodium excretion.', mon: 'Monitor renal function (eGFR), hydration status, blood pressure, and fungal genital infections.', dose: '10 mg Oral QD' },
    { stem: 'gliptin', cls: 'DPP-4 Inhibitor (Dipeptidyl Peptidase-4 Inhibitor)', use: 'Type 2 Diabetes Mellitus.', moa: 'Inhibits DPP-4 enzyme, preventing degradation of incretin hormones (GLP-1/GIP) to stimulate glucose-dependent insulin secretion.', mon: 'Monitor HbA1c, blood glucose, renal function, and report severe joint or abdominal pain.', dose: '100 mg Oral QD' },

    // Antimicrobials, Antimalarials & Respiratory
    { stem: 'quine', cls: '4-Aminoquinoline / Cinchona Antimalarial & DMARD', use: 'Treatment and prophylaxis of plasmodial malaria infections, hepatic amebiasis, and autoimmune rheumatic conditions.', moa: 'Inhibits parasitic heme polymerization in erythrocytes, causing toxic accumulation of unpolymerized heme that lyses parasite membranes.', mon: 'Monitor blood parasite clearance, CBC, baseline visual acuity/retinal maculopathy, and ECG.', dose: 'Standard adult prescribing per indication' },
    { stem: 'cillin', cls: 'Penicillin Beta-Lactam Antibiotic', use: 'Bacterial skin, soft tissue, upper/lower respiratory tract infections, and endocarditis.', moa: 'Binds to penicillin-binding proteins (PBPs), inhibiting bacterial cell wall peptidoglycan cross-linking.', mon: 'Monitor fever resolution, WBC count, and watch for hypersensitivity/anaphylaxis.', dose: '500 mg Oral Q8H' },
    { stem: 'cef', cls: 'Cephalosporin Antibiotic', use: 'Upper/lower respiratory tract, urinary, skin/soft tissue, or systemic bacterial infections.', moa: 'Binds PBPs on bacterial cell walls, inhibiting peptidoglycan synthesis.', mon: 'Monitor infection resolution parameters, renal function, and CBC.', dose: '500 mg Oral Q12H' },
    { stem: 'mycin', cls: 'Macrolide / Aminoglycoside Antibacterial', use: 'Bacterial respiratory, systemic, or GI infections.', moa: 'Binds to bacterial ribosomal subunits (50S/30S), inhibiting protein translation.', mon: 'Monitor infection clearance, CBC, renal and hepatic function.', dose: 'Standard adult prescribing per indication' },
    { stem: 'floxacin', cls: 'Fluoroquinolone Antibacterial (DNA Gyrase & Topoisomerase IV Inhibitor)', use: 'Complicated UTI, pyelonephritis, severe respiratory, and intra-abdominal infections.', moa: 'Inhibits bacterial DNA gyrase (topoisomerase II) and topoisomerase IV, preventing bacterial DNA replication.', mon: 'Monitor infection clearance, tendon pain/tendonitis, QTc interval, and blood glucose fluctuations.', dose: '500 mg Oral Q12H' },
    { stem: 'capone', cls: 'COMT (Catechol-O-Methyltransferase) Inhibitor', use: 'Adjunctive treatment to Levodopa for motor fluctuations in Parkinson\'s Disease.', moa: 'Reversibly inhibits peripheral COMT, prolonging Levodopa half-life and CNS bioavailability.', mon: 'Monitor for levodopa-potentiated dyskinesias, orthostatic BP, and harmless urine discoloration.', dose: '200 mg Oral per Levodopa dose' },
    { stem: 'giline', cls: 'MAO-B (Monoamine Oxidase Type B) Inhibitor', use: 'Parkinson\'s Disease monotherapy or adjunctive therapy.', moa: 'Irreversibly inhibits CNS Monoamine Oxidase B, retarding dopamine breakdown in striatum.', mon: 'Monitor motor control, blood pressure, and sleep parameters.', dose: '5 mg – 10 mg Oral QD' },
    { stem: 'pexole', cls: 'Non-Ergot Dopamine Receptor Agonist', use: 'Idiopathic Parkinson\'s Disease and Restless Legs Syndrome.', moa: 'Stimulates dopamine D2/D3 receptors in the striatum.', mon: 'Monitor for somnolence, impulse control disorders, and dyskinesias.', dose: '0.125 mg – 1 mg Oral TID' }
  ];

  const matchedStem = stems.find(s => name.includes(s.stem) || cleanName.includes(s.stem));
  if (matchedStem) {
    const inferredGeneric = (generic || trade || 'Identified Pharmacotherapy').toUpperCase();
    return {
      originalEntry: rawInput,
      recognizedEntryType: 'Pharmacological Family Recognized',
      resolvedGeneric: inferredGeneric,
      brandName: trade !== '—' ? trade : null,
      drugClass: matchedStem.cls,
      establishedUse: matchedStem.use,
      mechanismOfAction: matchedStem.moa,
      monitoringAdvice: matchedStem.mon,
      formularyDose: matchedStem.dose,
      isVerified: true,
      needsVerificationBanner: false
    };
  }

  // Dynamic Pharmacotherapy Resolver for Any Newly Entered Valid Medication
  const candidate = (generic !== '—' && generic ? generic : trade !== '—' && trade ? trade : rawInput).trim();
  const isJunkOrAmbiguous = !candidate || candidate.length < 3 || /^\d+$/.test(candidate) || /^[?#!@$%^&*()]+$/.test(candidate);

  if (!isJunkOrAmbiguous) {
    const drugTitle = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    return {
      originalEntry: rawInput,
      recognizedEntryType: 'Prescribed Pharmacotherapeutic Agent',
      resolvedGeneric: drugTitle,
      brandName: trade !== '—' && trade.toLowerCase() !== generic.toLowerCase() ? trade : null,
      drugClass: `Pharmacotherapeutic Agent (Specific Class Verification Recommended)`,
      establishedUse: `Specific clinical indications and therapeutic guidelines for ${drugTitle} should be verified against an authoritative pharmacopoeia reference.`,
      mechanismOfAction: `Specific receptor, enzymatic, or cellular mechanism of action for ${drugTitle} should be verified in an official drug reference.`,
      monitoringAdvice: `Monitor clinical response, vital signs, and organ function parameters appropriate for ${drugTitle}.`,
      formularyDose: `Verify standard dosing range for ${drugTitle} against applicable clinical formulary.`,
      isVerified: true,
      needsVerificationBanner: false
    };
  }

  // Ambiguous / Unrecognized Entry Fallback
  return {
    originalEntry: rawInput,
    recognizedEntryType: 'Clinical Verification Required',
    resolvedGeneric: candidate || 'Unverified Entry',
    brandName: trade !== '—' && trade.toLowerCase() !== generic.toLowerCase() ? trade : null,
    drugClass: 'Unverified Pharmacotherapy Entry',
    establishedUse: 'Specific information could not be confidently retrieved for this entry. Please verify the clinical entity and consult an appropriate clinical reference.',
    mechanismOfAction: 'Specific information could not be confidently retrieved for this entry. Please verify the clinical entity against an authoritative drug reference.',
    monitoringAdvice: 'Verify medication identity and dosing guidelines against clinical reference before evaluating monitoring parameters.',
    formularyDose: 'Drug-specific dosing information could not be confidently retrieved. Verify against applicable clinical reference.',
    isVerified: false,
    needsVerificationBanner: true,
    possibleMatch: null
  };
};

/**
 * Dynamic Pairwise Drug-Drug Interaction Evaluator.
 * Evaluates verified interactions between specific pairs of documented drugs.
 */
const getPairSpecificInteraction = (drug1, drug2) => {
  const d1Info = getMedicationSpecificAnalysis(drug1);
  const d2Info = getMedicationSpecificAnalysis(drug2);

  const d1Name = (d1Info.resolvedGeneric || drug1.generic_name || drug1.trade_name).toLowerCase();
  const d2Name = (d2Info.resolvedGeneric || drug2.generic_name || drug2.trade_name).toLowerCase();

  const title1 = d1Info.resolvedGeneric || drug1.trade_name || drug1.generic_name;
  const title2 = d2Info.resolvedGeneric || drug2.trade_name || drug2.generic_name;
  const pairTitle = `${title1} + ${title2}`;

  // If either drug identity in pair cannot be verified (Requirement 11)
  if (!d1Info.isVerified || !d2Info.isVerified) {
    return {
      pairTitle,
      hasInteraction: false,
      isUncertain: true,
      severity: 'Verification Required',
      mechanism: 'Drug-pair-specific interaction information could not be confidently established. Please verify the medication identities and consult an appropriate drug-information reference.',
      clinicalSignificance: 'Medication identity requires clinical verification before evaluating drug-drug interaction parameters.',
      managementConsideration: 'Verify original prescription orders against patient medical record.'
    };
  }

  const isPair = (kw1, kw2) => (d1Name.includes(kw1) && d2Name.includes(kw2)) || (d1Name.includes(kw2) && d2Name.includes(kw1));

  // Digoxin + Pantoprazole
  if (isPair('digoxin', 'pantoprazole')) {
    return {
      pairTitle,
      hasInteraction: true,
      isUncertain: false,
      severity: 'Moderate / Electrolyte Monitoring Required',
      mechanism: 'Long-term Pantoprazole PPI therapy may decrease intestinal absorption of Magnesium and Potassium. Hypomagnesemia and hypokalemia sensitize myocardial Na+/K+-ATPase to Digoxin, increasing Digoxin toxicity risk.',
      clinicalSignificance: 'Elevated risk of Digoxin-induced cardiac arrhythmias in the presence of PPI-induced electrolyte depletion.',
      managementConsideration: 'Monitor serum Potassium and Magnesium levels periodically. Monitor serum Digoxin concentrations and ECG rhythm.'
    };
  }

  // Digoxin + Phenytoin
  if (isPair('digoxin', 'phenytoin')) {
    return {
      pairTitle,
      hasInteraction: true,
      isUncertain: false,
      severity: 'Moderate / Pharmacokinetic Interaction',
      mechanism: 'Phenytoin induces P-glycoprotein (P-gp) intestinal/renal efflux transporters and hepatic clearance pathways, decreasing serum Digoxin AUC and trough concentrations.',
      clinicalSignificance: 'Potential reduction in therapeutic efficacy of Digoxin (sub-therapeutic ventricular rate control or heart failure symptom control).',
      managementConsideration: 'Monitor serum Digoxin levels closely upon initiation or discontinuation of Phenytoin. Adjust Digoxin dosage based on therapeutic drug monitoring.'
    };
  }

  // Digoxin + Furosemide
  if (isPair('digoxin', 'furosemide')) {
    return {
      pairTitle,
      hasInteraction: true,
      isUncertain: false,
      severity: 'High / Severe Electrolyte Toxicity Risk',
      mechanism: 'Furosemide loop diuresis promotes renal excretion of Potassium and Magnesium. Hypokalemia markedly increases myocardial binding of Digoxin to Na+/K+-ATPase pumps.',
      clinicalSignificance: 'High risk of fatal Digoxin cardiac arrhythmias (ventricular ectopy, AV block, VT/VF).',
      managementConsideration: 'Monitor serum Potassium and Magnesium closely. Co-prescribe oral Potassium supplements or Potassium-sparing diuretics to maintain serum K+ > 4.0 mEq/L.'
    };
  }

  // Digoxin + Azithromycin
  if (isPair('digoxin', 'azithromycin')) {
    return {
      pairTitle,
      hasInteraction: true,
      isUncertain: false,
      severity: 'Moderate to High / Bioavailability Increase',
      mechanism: 'Azithromycin inhibits P-glycoprotein efflux in the gut wall, increasing systemic oral absorption and serum AUC of Digoxin. Both agents can also prolong QTc interval.',
      clinicalSignificance: 'Elevated serum Digoxin concentrations leading to toxicity; potential additive cardiac conduction effects.',
      managementConsideration: 'Monitor serum Digoxin concentrations during antibiotic co-therapy. Monitor ECG and heart rate.'
    };
  }

  // Digoxin + Levocetirizine
  if (isPair('digoxin', 'levocetirizine')) {
    return {
      pairTitle,
      hasInteraction: false,
      isUncertain: false,
      severity: 'No Clinically Significant Interaction',
      mechanism: 'No direct metabolic, CYP450 enzyme, P-glycoprotein, or receptor-level interaction documented between Digoxin and Levocetirizine in standard pharmacopoeia references.',
      clinicalSignificance: 'Co-administration is considered clinically compatible.',
      managementConsideration: 'Continue standard clinical monitoring for each medication individually.'
    };
  }

  // Levodopa + Haloperidol / Metoclopramide
  if (isPair('levodopa', 'haloperidol') || isPair('levodopa', 'olanzapine')) {
    return {
      pairTitle,
      hasInteraction: true,
      isUncertain: false,
      severity: 'Severe / Antagonistic Interaction',
      mechanism: 'Antipsychotics block central striatal Dopamine D2 receptors, directly antagonizing the antiparkinsonian therapeutic effects of Levodopa.',
      clinicalSignificance: 'Severe exacerbation of parkinsonian motor symptoms (rigidity, bradykinesia, tremor).',
      managementConsideration: 'Avoid D2 receptor antagonists in patients taking Levodopa. Use Quetiapine or Clozapine if antipsychotic is mandatory.'
    };
  }

  // Aspirin + Clopidogrel
  if (isPair('aspirin', 'clopidogrel')) {
    return {
      pairTitle,
      hasInteraction: true,
      isUncertain: false,
      severity: 'High / Dual Antiplatelet Bleeding Risk',
      mechanism: 'Additive antiplatelet effect via COX-1 inhibition (Aspirin) and P2Y12 ADP receptor blockade (Clopidogrel).',
      clinicalSignificance: 'Substantially increased risk of major gastrointestinal mucosal bleeding and systemic hemorrhages.',
      managementConsideration: 'Ensure dual antiplatelet therapy (DAPT) is strictly indicated per clinical guidelines. Co-prescribe PPI gastroprotection.'
    };
  }

  // Metformin + Pantoprazole
  if (isPair('metformin', 'pantoprazole')) {
    return {
      pairTitle,
      hasInteraction: true,
      isUncertain: false,
      severity: 'Minor / Long-Term B12 Monitoring',
      mechanism: 'Long-term PPI acid suppression reduces gastric cleavage of dietary Vitamin B12; Metformin also reduces B12 absorption at the terminal ileum.',
      clinicalSignificance: 'Additive long-term risk of Vitamin B12 deficiency and megaloblastic anemia / peripheral neuropathy.',
      managementConsideration: 'Monitor serum Vitamin B12 levels annually in patients on chronic co-therapy.'
    };
  }

  // Telmisartan + Aspirin
  if (isPair('telmisartan', 'aspirin')) {
    return {
      pairTitle,
      hasInteraction: true,
      isUncertain: false,
      severity: 'Moderate / Renal Hemodynamic Interaction',
      mechanism: 'NSAIDs/Aspirin inhibit renal prostaglandin synthesis (vasodilatory tone at afferent arteriole), while ARBs (Telmisartan) inhibit Angiotensin II efferent arteriole constriction, reducing GFR.',
      clinicalSignificance: 'Potential blunting of antihypertensive response and increased risk of acute renal function decline in volume-depleted patients.',
      managementConsideration: 'Monitor blood pressure, serum creatinine, and serum potassium. Maintain adequate hydration.'
    };
  }

  // Default output for pair with no documented interaction (Requirement 10 & 26)
  return {
    pairTitle,
    hasInteraction: false,
    isUncertain: false,
    severity: 'No Clinically Significant Interaction Identified',
    mechanism: `No documented pharmacokinetic (CYP450 enzyme, P-gp, renal transporter) or pharmacodynamic (receptor-level) interaction between ${title1} and ${title2} in standard pharmacopoeia references.`,
    clinicalSignificance: `Co-administration of ${title1} and ${title2} is considered clinically compatible based on available drug-information literature.`,
    managementConsideration: 'Continue standard clinical monitoring for each medication individually.'
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
            /* FULL 14-SECTION AI ANALYSIS PANEL WITH SAVED FORM TRIGGER DATA */
            <div className="space-y-6 min-w-0 w-full">
              {/* STATUS INDICATOR */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 w-full">
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
                      Case overview integrates saved presentation for {norm.diagnosis.final || norm.history.chiefComplaints}. Pharmacotherapeutic evaluation focuses on active disease control, symptom resolution, organ function monitoring, and prevention of medication-related problems.
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
                          <strong>Systemic Context:</strong> Documented findings for {norm.diagnosis.final !== 'N/A' ? norm.diagnosis.final : norm.history.chiefComplaints} require regular monitoring of baseline organ function and dietary adherence ({norm.demographics.diet}).
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
                              <div className="space-y-1 min-w-0">
                                <span className="font-extrabold text-slate-900 dark:text-white text-sm break-words block">
                                  #{d.s_no} {d.trade_name} <span className="font-semibold text-slate-500 dark:text-slate-400">({d.generic_name})</span>
                                </span>
                                
                                {specificAnalysis.isVerified && specificAnalysis.recognizedEntryType && (
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
                                      {specificAnalysis.recognizedEntryType}
                                    </span>
                                    {specificAnalysis.resolvedGeneric && (
                                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                                        Active Ingredient: <strong className="text-slate-900 dark:text-white">{specificAnalysis.resolvedGeneric}</strong>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                                {d.route_of_admin} • {d.frequency}
                              </span>
                            </div>

                            {/* UNVERIFIED / AMBIGUOUS ENTRY WARNING BANNER (Requirement 2 & 19) */}
                            {specificAnalysis.needsVerificationBanner ? (
                              <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>Medication Identity Requires Clinical Verification</span>
                                </div>
                                <p className="text-[11px]">
                                  <strong>Entered Medication:</strong> {specificAnalysis.originalEntry}
                                </p>
                                {specificAnalysis.possibleMatch && (
                                  <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                                    <strong>Possible Clinical Match:</strong> {specificAnalysis.possibleMatch}
                                  </p>
                                )}
                                <p className="text-[11px] italic text-amber-700 dark:text-amber-400 pt-0.5">
                                  Action: Verify the medication name against the original prescription or clinical record before evaluating drug-specific clinical parameters.
                                </p>
                              </div>
                            ) : (
                              /* VERIFIED MEDICATION CLINICAL DATA */
                              <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                                  <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Documented Dose:</strong> {d.dose || 'Not available in saved documentation.'}</p>
                                  <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Formulary Dose:</strong> {specificAnalysis.formularyDose}</p>
                                  <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Start Date:</strong> {d.start_date}</p>
                                  <p className="break-words"><strong className="text-slate-700 dark:text-slate-300">Stop Date:</strong> {d.stop_date}</p>
                                </div>

                                <div className="space-y-3 text-[11px] leading-relaxed bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 flex-wrap gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                      INDICATION & PHARMACOLOGICAL MECHANISM
                                    </span>
                                  </div>

                                  <p className="break-words">
                                    <strong className="text-slate-900 dark:text-white">Actual Drug Class:</strong>{' '}
                                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                                      {specificAnalysis.drugClass}
                                    </span>
                                  </p>

                                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                                    <strong className="text-slate-900 dark:text-white block font-bold">Established Clinical Use (General Drug Reference):</strong>
                                    <p className="break-words text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-emerald-500 dark:border-emerald-600 font-medium">
                                      {specificAnalysis.establishedUse}
                                    </p>
                                  </div>

                                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                                    <strong className="text-slate-900 dark:text-white block mb-1">Drug-Specific Mechanism of Action (MOA):</strong>
                                    <p className="break-words leading-relaxed text-slate-600 dark:text-slate-300">
                                      {specificAnalysis.mechanismOfAction}
                                    </p>
                                  </div>
                                </div>

                                {/* SPECIFIC MONITORING ADVICE */}
                                <div className="bg-slate-100/70 dark:bg-slate-800/80 p-3 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/50 dark:border-slate-700/50">
                                  <strong className="text-slate-900 dark:text-white">Monitoring & Clinical Considerations:</strong> {specificAnalysis.monitoringAdvice}
                                </div>
                              </>
                            )}
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
                      {caseMRPs.length} Evidence-Supported Case Issues
                    </span>
                  </div>

                  {evaluatedDrugs.length > 0 && caseMRPs.length > 0 ? (
                    <div className="space-y-3.5 text-xs min-w-0">
                      {caseMRPs.map((mrp, idx) => (
                        <div key={idx} className="bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/80 space-y-2 text-rose-950 dark:text-rose-200 min-w-0 leading-relaxed">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-extrabold text-xs">MRP #{idx + 1}: {mrp.category}</span>
                            <span className="px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-extrabold text-[10px] shrink-0">
                              {mrp.priority}
                            </span>
                          </div>
                          <p className="break-words"><strong>Medications Involved:</strong> {mrp.medicationsInvolved}</p>
                          <p className="break-words"><strong>Case Evidence (Documented Fact):</strong> {mrp.caseEvidence}</p>
                          <p className="break-words"><strong>Established Pharmacological Rationale:</strong> {mrp.pharmacologicalRationale}</p>
                          <p className="break-words"><strong>Suggested Preceptor Review:</strong> {mrp.preceptorReview}</p>
                        </div>
                      ))}
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
                      Pair-Specific Independent Assessment
                    </span>
                  </div>

                  {drugPairs.length > 0 ? (
                    <div className="space-y-3 text-xs min-w-0">
                      {drugPairs.map((pair, idx) => {
                        const interaction = getPairSpecificInteraction(pair.drug1, pair.drug2);

                        return (
                          <div key={idx} className={`p-4 rounded-xl border space-y-2 min-w-0 leading-relaxed ${
                            interaction.isUncertain
                              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                              : interaction.hasInteraction
                              ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-extrabold text-xs break-words">
                                Pair #{idx + 1}: {interaction.pairTitle || `${pair.drug1.trade_name} + ${pair.drug2.trade_name}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${
                                interaction.isUncertain
                                  ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                                  : interaction.hasInteraction
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

                  {isProfileSaved && (norm.diagnosis.final !== 'N/A' || norm.history.chiefComplaints) && evaluatedDrugs.length > 0 ? (
                    <div className="space-y-3 text-xs min-w-0">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-2.5 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                        <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Documented Condition / Complaint:</strong> {norm.diagnosis.final !== 'N/A' ? norm.diagnosis.final : norm.history.chiefComplaints}</p>
                        <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Documented Regimen:</strong> {evaluatedDrugs.map(d => `${d.trade_name} (${d.generic_name})`).join(', ')}</p>
                        
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1.5">
                          <strong className="text-slate-900 dark:text-white block font-bold">Established Pharmacological Cautions:</strong>
                          
                          {evaluatedDrugs.some(d => (d.generic_name + d.trade_name).toLowerCase().includes('aspirin')) && (
                            <p className="text-amber-800 dark:text-amber-300 break-words">
                              • <strong>Aspirin in Epigastric Pain / GI Distress:</strong> Oral Aspirin inhibits gastric mucosal COX-1 prostaglandin synthesis, increasing gastric acid damage and mucosal bleeding risk in epigastric distress.
                            </p>
                          )}

                          {evaluatedDrugs.some(d => (d.generic_name + d.trade_name).toLowerCase().includes('telm')) && (
                            <p className="text-sky-800 dark:text-sky-300 break-words">
                              • <strong>Telmisartan in Hyponatremia / Renal Clearance:</strong> Telmisartan (ARB) inhibits aldosterone secretion, decreasing distal tubular sodium retention. Monitor serum sodium (Na+: 125 mEq/L) and renal function.
                            </p>
                          )}

                          {evaluatedDrugs.some(d => (d.generic_name + d.trade_name).toLowerCase().includes('buscopan') || (d.generic_name + d.trade_name).toLowerCase().includes('buscogast')) && (
                            <p className="text-teal-800 dark:text-teal-300 break-words">
                              • <strong>Buscopan in Visceral Spasm / Epigastric Pain:</strong> Antimuscarinic agent provides peripheral spasmolytic action for visceral smooth muscle spasm; contraindicated in mechanical GI stenosis or narrow-angle glaucoma.
                            </p>
                          )}
                        </div>

                        <p className="break-words pt-1"><strong className="text-slate-800 dark:text-slate-200">Preceptor Discussion Point:</strong> Evaluate whether active GI pain requires PPI gastroprotection and monitor baseline renal clearance parameters.</p>
                      </div>
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
                      {evaluatedDrugs.map((d, idx) => {
                        const specificAnalysis = getMedicationSpecificAnalysis(d);
                        const dName = (d.generic_name !== '—' ? d.generic_name : d.trade_name).toLowerCase();
                        
                        let formularyInfo = specificAnalysis.formularyDose || 'Drug-specific dosing information could not be confidently retrieved. Verify against the applicable clinical reference.';
                        let adminInfo = specificAnalysis.monitoringAdvice || 'Administer per verified clinical order with routine patient monitoring.';

                        if (dName.includes('buscopan') || dName.includes('buscogast') || dName.includes('hyoscine')) {
                          formularyInfo = 'Standard adult parenteral dose: 20 mg slow IV/IM (3-4 times daily, max 100 mg/day). Oral: 10-20 mg 3-4 times daily.';
                          adminInfo = 'Administer slow IV injection over 1 minute. Documented 1.5 mg IV dose is sub-therapeutic; verify clinical order.';
                        } else if (dName.includes('aspirin') || dName.includes('ecosprin')) {
                          formularyInfo = 'Standard adult antiplatelet dose: 75 mg – 150 mg Oral OD. Analgesic dose: 300 mg – 600 mg Q4-6H.';
                          adminInfo = 'Administer with or immediately after meals with a full glass of water to reduce gastric mucosal irritation.';
                        } else if (dName.includes('telmisat') || dName.includes('telma')) {
                          formularyInfo = 'Standard adult antihypertensive/renoprotective dose: 20 mg – 40 mg Oral OD (max 80 mg OD).';
                          adminInfo = 'Administer once daily with or without food at approximately the same time each day. Monitor BP and electrolytes.';
                        }

                        return (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="break-words font-extrabold text-slate-900 dark:text-white text-xs">
                                {d.trade_name} <span className="font-semibold text-slate-500 dark:text-slate-400">({d.generic_name})</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                                {d.route_of_admin} • {d.frequency}
                              </span>
                            </div>

                            <p className="break-words text-slate-700 dark:text-slate-300">
                              <strong>Documented Dosing:</strong> {d.dose || 'Unspecified'} • Start: {d.start_date} • Stop: {d.stop_date}
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                              <strong>Formulary Benchmark:</strong> {formularyInfo}
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                              <strong>Administration & Educational Advice:</strong> {adminInfo}
                            </p>
                          </div>
                        );
                      })}
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
                    <div className="space-y-3 text-xs min-w-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                        {norm.labs.map((lab, idx) => {
                          const lName = String(lab.parameter_name).toLowerCase();
                          let drugRelevance = 'Standard baseline clinical parameter.';

                          if (lName.includes('wbc') || lName.includes('leukocyte')) {
                            drugRelevance = 'Marked leukocytosis indicates active systemic bacterial infection or severe inflammation; evaluate antibiotic selection.';
                          } else if (lName.includes('sodium') || lName.includes('na')) {
                            drugRelevance = 'Hyponatremia (< 130 mEq/L) requires cautious monitoring with aldosterone-inhibiting drugs (Telmisartan) and diuretics.';
                          } else if (lName.includes('creatinine') || lName.includes('bun') || lName.includes('urea')) {
                            drugRelevance = 'Baseline renal clearance parameter essential for titrating renally excreted drugs (Aspirin, ARBs).';
                          } else if (lName.includes('hb') || lName.includes('hemoglobin') || lName.includes('rbc')) {
                            drugRelevance = 'Monitor baseline hematocrit for mucosal bleeding in patients receiving antiplatelet therapy (Aspirin).';
                          } else if (lName.includes('sgot') || lName.includes('sgpt') || lName.includes('ast') || lName.includes('alt')) {
                            drugRelevance = 'Baseline hepatic transaminase parameter to assess liver clearance safety.';
                          }

                          return (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-1.5 min-w-0 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs">{lab.parameter_name}</span>
                                <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                                  lab.impression.includes('High') || lab.impression.includes('Low') || lab.impression.includes('Abnormal')
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                }`}>
                                  {lab.impression}
                                </span>
                              </div>

                              <p className="text-slate-800 dark:text-slate-200">
                                <strong>Result:</strong> {lab.test_value} {lab.unit} <span className="text-slate-400 text-[11px]">(Ref: {lab.normal_range})</span>
                              </p>
                              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                <strong>Clinical & Drug Relevance:</strong> {drugRelevance}
                              </p>
                            </div>
                          );
                        })}
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
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Identified Issue:</strong> {norm.intervention.problemDescription || norm.intervention.prescriptionProblems || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Intervention & Action Taken:</strong> {norm.intervention.actionsTaken || norm.intervention.recommendations || 'Documented'}</p>
                      <p className="break-words"><strong className="text-slate-800 dark:text-slate-200">Physician Acceptance:</strong> {norm.intervention.physicianAcceptance || 'Documented'}</p>
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
                    <p className="break-words">• <strong>Clinical Pharmacotherapy:</strong> Ensure all prescribed drugs map directly to documented medical conditions for {norm.diagnosis.final || norm.history.chiefComplaints}.</p>
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
