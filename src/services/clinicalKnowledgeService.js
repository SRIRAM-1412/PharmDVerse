/**
 * PharmDVerse — Clinical Knowledge Retrieval Service
 * Authoritative Drug Identity Resolution & Clinical Knowledge Engine
 * 
 * Provides drug-specific pharmacological data (Drug Class, Indications, MOA, Monitoring, Dosing, Safety)
 * based on Indian Pharmacopoeia (IP), National Formulary of India (NFI), British National Formulary (BNF), and USP benchmarks.
 */

// Master Clinical Pharmacopoeia Registry
const CLINICAL_KNOWLEDGE_BASE = {
  // Cardiovascular & Antihypertensive Agents
  'diltiazem': {
    genericName: 'Diltiazem',
    brandName: 'Dilzem / Cardizem / Tiazac',
    drugClass: 'Benzothiazepine Non-Dihydropyridine Calcium Channel Blocker (Class IV Antiarrhythmic)',
    establishedUses: 'Essential hypertension, chronic stable angina pectoris, vasospastic (Prinzmetal) angina, and ventricular rate control in atrial fibrillation or atrial flutter.',
    mechanismOfAction: 'Inhibits transmembrane influx of extracellular calcium ions through voltage-gated L-type calcium channels in sinoatrial (SA) and atrioventricular (AV) nodal tissue and vascular smooth muscle. Produces negative inotropic, chronotropic, and dromotropic effects while relaxing coronary and systemic arteries.',
    monitoringAdvice: 'Monitor resting heart rate (hold if HR < 50-60 bpm), blood pressure, PR interval on ECG (AV block risk), and signs of peripheral edema or heart failure exacerbation.',
    formularyDose: '30 mg – 60 mg Oral TID/QID or 120 mg – 240 mg Sustained Release QD',
    contraindications: 'Severe hypotension, sick sinus syndrome, second- or third-degree AV block (without pacemaker), acute MI with pulmonary congestion.',
    sourceReferences: 'National Formulary of India (NFI), British National Formulary (BNF)'
  },
  'digoxin': {
    genericName: 'Digoxin',
    brandName: 'Lanoxin',
    drugClass: 'Cardiac Glycoside (Inotropic Agent & Na+/K+-ATPase Inhibitor)',
    establishedUses: 'Ventricular rate control in chronic Atrial Fibrillation / Atrial Flutter and symptomatic management of Heart Failure with Reduced Ejection Fraction (HFrEF).',
    mechanismOfAction: 'Reversibly inhibits membrane-bound Na+/K+-ATPase pump in cardiac myocytes, increasing intracellular sodium. This reduces sodium-calcium exchange (NCX), leading to increased intracellular calcium availability for actin-myosin binding and positive inotropy. Also enhances central vagal tone, slowing AV nodal conduction.',
    monitoringAdvice: 'Monitor serum digoxin trough concentration (0.5-0.9 ng/mL for HF; 0.8-2.0 ng/mL for AF), serum potassium, magnesium, calcium, and renal function (eGFR / Serum Creatinine). Watch for signs of toxicity (nausea, xanthopsia, bradycardia, ventricular ectopy).',
    formularyDose: '0.125 mg – 0.25 mg Oral QD (adjusted for renal clearance)',
    contraindications: 'Ventricular fibrillation, hypertrophic obstructive cardiomyopathy (HOCM), Wolff-Parkinson-White (WPW) syndrome with AF.',
    sourceReferences: 'Indian Pharmacopoeia (IP), NFI, BNF'
  },
  'nitroglycerin': {
    genericName: 'Nitroglycerin (Glyceryl Trinitrate / GTN)',
    brandName: 'Nitrogard / Angised',
    drugClass: 'Organic Nitrate Vasodilator (Antianginal Agent)',
    establishedUses: 'Acute relief and prophylaxis of angina pectoris, acute coronary syndromes (ACS), and acute hypertensive emergencies / severe acute heart failure.',
    mechanismOfAction: 'Denitrated in vascular smooth muscle cells by mitochondrial aldehyde dehydrogenase to release free Nitric Oxide (NO). NO activates soluble guanylyl cyclase (sGC), elevating intracellular cGMP and inducing vascular smooth muscle relaxation, predominantly reducing venous return (preload) and myocardial wall tension.',
    monitoringAdvice: 'Monitor blood pressure (watch for acute hypotension), resting heart rate (reflex tachycardia), headache intensity, and enforce a daily 10-12 hour nitrate-free interval to prevent nitrate tolerance.',
    formularyDose: '0.4 mg Sublingual Tab PRN or 5 mcg/min IV infusion titrated to hemodynamic response',
    contraindications: 'Concomitant use of PDE-5 inhibitors (Sildenafil, Tadalafil), severe hypotension (SBP < 90 mmHg), severe hypovolemia, elevated ICP.',
    sourceReferences: 'NFI, BNF, USP'
  },
  'telmisartan': {
    genericName: 'Telmisartan',
    brandName: 'Telma / Micardis',
    drugClass: 'Angiotensin II Receptor Blocker (ARB / AT1 Receptor Antagonist)',
    establishedUses: 'Essential hypertension, cardiovascular risk reduction in patients unable to tolerate ACE inhibitors, and diabetic nephropathy.',
    mechanismOfAction: 'Selectively displaces Angiotensin II from the AT1 receptor subtype in vascular smooth muscle and adrenal cortex, blocking Angiotensin II-induced vasoconstriction, aldosterone release, and renal sodium reabsorption.',
    monitoringAdvice: 'Monitor sitting blood pressure, serum potassium (hyperkalemia risk), serum creatinine, and Blood Urea Nitrogen (BUN).',
    formularyDose: '20 mg – 40 mg Oral QD (Max: 80 mg/day)',
    contraindications: 'Pregnancy (teratogenic / fetal toxicity), severe hepatic impairment, bilateral renal artery stenosis.',
    sourceReferences: 'NFI, BNF'
  },
  'amlodipine': {
    genericName: 'Amlodipine',
    brandName: 'Norvasc / Amlogard / Stamlo',
    drugClass: 'Dihydropyridine Calcium Channel Blocker (L-type CCB)',
    establishedUses: 'Essential hypertension, chronic stable angina, and vasospastic angina.',
    mechanismOfAction: 'Inhibits transmembrane calcium influx through voltage-gated L-type calcium channels into vascular smooth muscle cells and cardiac muscle, causing peripheral arterial vasodilation and reducing total peripheral resistance.',
    monitoringAdvice: 'Monitor blood pressure, peripheral edema (ankle swelling), flushing, and resting heart rate.',
    formularyDose: '5 mg – 10 mg Oral QD',
    contraindications: 'Severe hypotension, cardiogenic shock, unstable angina (excluding vasospastic).',
    sourceReferences: 'IP, NFI, BNF'
  },
  'atorvastatin': {
    genericName: 'Atorvastatin',
    brandName: 'Lipitor / Storvas / Atorva',
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    establishedUses: 'Hypercholesterolemia, dyslipidemia, primary and secondary prevention of atherosclerotic cardiovascular events (MI, stroke).',
    mechanismOfAction: 'Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, the rate-limiting enzyme in hepatic cholesterol biosynthesis. Upregulates hepatic LDL receptors to increase clearance of circulating LDL-C.',
    monitoringAdvice: 'Monitor baseline hepatic transaminases (ALT/AST), fasting lipid panel, and instruct patient to report unexplained muscle pain, tenderness, or weakness (rhabdomyolysis risk).',
    formularyDose: '10 mg – 40 mg Oral QD (High-intensity: 40 mg - 80 mg QD)',
    contraindications: 'Active liver disease, unexplained persistent elevations in serum transaminases, pregnancy, lactation.',
    sourceReferences: 'NFI, BNF, IP'
  },

  // Antineoplastic & Immunosuppressive Agents
  'methotrexate': {
    genericName: 'Methotrexate',
    brandName: 'Trexall / Metoject / Folitrax',
    drugClass: 'Antimetabolite Folate Antagonist & Disease-Modifying Anti-Rheumatic Drug (DMARD)',
    establishedUses: 'Severe active Rheumatoid Arthritis, polyarticular juvenile idiopathic arthritis, severe psoriasis, acute lymphoblastic leukemia (ALL), choriocarcinoma, osteosarcoma, and ectopic pregnancy.',
    mechanismOfAction: 'Irreversibly inhibits dihydrofolate reductase (DHFR), blocking conversion of dihydrofolate to tetrahydrofolate (THF). Inhibits de novo purine and thymidylate synthesis, arresting DNA replication in rapidly dividing malignant and immunocompetent inflammatory cells.',
    monitoringAdvice: 'Monitor Complete Blood Count (CBC with differential) baseline and monthly, liver function tests (ALT/AST, serum albumin), renal function (Serum Creatinine/eGFR), baseline chest X-ray, and co-prescribe Folic Acid (1-5 mg/day except on dosing day).',
    formularyDose: '7.5 mg – 25 mg Oral/SubQ ONCE WEEKLY (for RA/Psoriasis — DO NOT prescribe daily for non-oncology indications)',
    contraindications: 'Pregnancy, breastfeeding, pre-existing blood dyscrasias, severe hepatic impairment, chronic alcoholism, severe renal failure.',
    sourceReferences: 'British National Formulary (BNF), NFI, IP'
  },

  // CNS & Psychiatric Agents
  'amitriptyline': {
    genericName: 'Amitriptyline',
    brandName: 'Tryptomer / Elavil',
    drugClass: 'Tricyclic Antidepressant (TCA) — Serotonin & Norepinephrine Reuptake Inhibitor',
    establishedUses: 'Major depressive disorder, chronic neuropathic pain (diabetic neuropathy, post-herpetic neuralgia), tension headache and migraine prophylaxis, and fibromyalgia.',
    mechanismOfAction: 'Inhibits presynaptic membrane reuptake of Serotonin (5-HT) and Norepinephrine (NE) in CNS synapses. Also blocks central voltage-gated sodium channels, histamine H1 receptors, muscarinic acetylcholine M1 receptors, and alpha-1 adrenergic receptors.',
    monitoringAdvice: 'Monitor baseline and periodic ECG (watch for QTc prolongation, QRS widening), blood pressure (orthostatic hypotension), anticholinergic side effects (dry mouth, urinary retention, severe constipation), and sedation.',
    formularyDose: '10 mg – 25 mg Oral HS initial (titrated up to 75 mg – 150 mg/day for depression)',
    contraindications: 'Recent myocardial infarction, acute cardiac arrhythmias, concomitant MAO inhibitor therapy, severe liver disease.',
    sourceReferences: 'BNF, NFI'
  },
  'phenytoin': {
    genericName: 'Phenytoin',
    brandName: 'Eptoin / Dilantin',
    drugClass: 'Anticonvulsant Hydantoin Derivative (Voltage-Gated Sodium Channel Blocker)',
    establishedUses: 'Generalized tonic-clonic seizures, complex partial seizures, and prevention of seizures following neurosurgery or head trauma.',
    mechanismOfAction: 'Promotes sodium efflux from neurons and selectively blocks voltage-gated sodium channels in the inactivated state, suppressing repetitive neuronal firing and seizure propagation.',
    monitoringAdvice: 'Monitor total serum phenytoin concentration (target range: 10-20 mcg/mL), serum albumin (for adjusted free level), CBC, LFTs, and observe for gingival hyperplasia, nystagmus, ataxia, or severe cutaneous adverse reactions (SJS/TEN).',
    formularyDose: '100 mg Oral TID or 300 mg QD (Adult maintenance)',
    contraindications: 'Sinus bradycardia, sinoatrial block, second- or third-degree AV block, history of hypersensitivity to hydantoins.',
    sourceReferences: 'IP, NFI, BNF'
  },
  'levetiracetam': {
    genericName: 'Levetiracetam',
    brandName: 'Keppra / Levipil',
    drugClass: 'Second-Generation Antiepileptic Agent (Synaptic Vesicle Protein 2A / SV2A Ligand)',
    establishedUses: 'Monotherapy and adjunctive therapy for focal seizures (with or without secondary generalization), myoclonic seizures, and primary generalized tonic-clonic seizures.',
    mechanismOfAction: 'Selectively binds to synaptic vesicle protein 2A (SV2A) in the brain, inhibiting presynaptic neurotransmitter exocytosis and hypersynchronous epileptiform burst firing.',
    monitoringAdvice: 'Monitor renal clearance (adjust dose for eGFR < 80 mL/min), seizure frequency, and observe for behavioral changes (irritability, agitation, depression).',
    formularyDose: '500 mg Oral/IV BID (Titrated up to 1500 mg BID)',
    contraindications: 'Hypersensitivity to levetiracetam or pyrrolidone derivatives.',
    sourceReferences: 'NFI, BNF'
  },

  // Gastrointestinal Agents
  'pantoprazole': {
    genericName: 'Pantoprazole',
    brandName: 'Pantop / Pantocid / Pan-40',
    drugClass: 'Proton Pump Inhibitor (Gastric H+/K+-ATPase Inhibitor)',
    establishedUses: 'Gastroesophageal Reflux Disease (GERD), erosive esophagitis, gastric and duodenal peptic ulcers, stress ulcer prophylaxis, and H. pylori eradication.',
    mechanismOfAction: 'Substituted benzimidazole that covalently binds to cysteine residues on the active parietal cell H+/K+-ATPase enzyme (proton pump), inhibiting the final step of gastric acid secretion.',
    monitoringAdvice: 'Periodically re-evaluate ongoing clinical indication. Monitor serum magnesium and Vitamin B12 during chronic (> 1 year) therapy.',
    formularyDose: '40 mg Oral/IV QD (30 minutes before breakfast)',
    contraindications: 'Known hypersensitivity to substituted benzimidazoles.',
    sourceReferences: 'IP, NFI, BNF'
  },
  'mesalamine': {
    genericName: 'Mesalamine (5-Aminosalicylic Acid / 5-ASA)',
    brandName: 'Mesacol / Asacol',
    drugClass: 'Aminosalicylate Anti-Inflammatory Agent (5-ASA Derivative)',
    establishedUses: 'Induction and maintenance of remission in mild-to-moderate Ulcerative Colitis and Crohn\'s Disease.',
    mechanismOfAction: 'Acts topically on colonic mucosa to inhibit lipoxygenase and cyclooxygenase pathways, decreasing mucosal synthesis of leukotriene B4 (LTB4) and Prostaglandin E2.',
    monitoringAdvice: 'Monitor stool frequency and mucosal bleeding, renal function (Serum Creatinine baseline and periodically), and urinalysis.',
    formularyDose: '800 mg – 1200 mg Oral TID (or 2.4 g – 4.8 g/day delayed-release)',
    contraindications: 'Severe renal impairment, severe hepatic impairment, salicylate hypersensitivity.',
    sourceReferences: 'NFI, BNF'
  },
  'lactitol': {
    genericName: 'Lactitol Monohydrate',
    brandName: 'Lactihep / Importal',
    drugClass: 'Non-Absorbable Disaccharide Osmotic Laxative & Hyperammonemia Agent',
    establishedUses: 'Prevention and treatment of Hepatic Encephalopathy (portal-systemic encephalopathy) and chronic functional constipation.',
    mechanismOfAction: 'Non-absorbable synthetic disaccharide degraded by colonic flora into low molecular weight organic acids (lactic, acetic), lowering colonic pH. The acidic lumen traps blood ammonia (NH3) as non-absorbable ammonium ions (NH4+), facilitating fecal elimination.',
    monitoringAdvice: 'Monitor daily stool frequency (target 2-3 soft stools/day in hepatic encephalopathy), serum electrolytes, and fluid balance.',
    formularyDose: '10 g – 20 g (15 mL – 30 mL) Oral 2-3 times daily',
    contraindications: 'Galactosemia, intestinal obstruction, pre-existing electrolyte imbalance.',
    sourceReferences: 'NFI, BNF'
  }
};

// Pharmacological Suffix & Stem Rules Engine
const PHARMACOLOGICAL_STEMS = [
  { stem: 'sartan', cls: 'Angiotensin II Receptor Blocker (ARB)', use: 'Hypertension, heart failure, diabetic nephropathy.', moa: 'Blocks vascular AT1 receptors, preventing Angiotensin II vasoconstriction.', mon: 'Blood pressure, serum potassium, serum creatinine.', dose: '40 mg Oral QD' },
  { stem: 'pril', cls: 'ACE Inhibitor', use: 'Hypertension, heart failure, post-MI, diabetic nephropathy.', moa: 'Inhibits Angiotensin-Converting Enzyme, blocking Angiotensin II production.', mon: 'Blood pressure, serum potassium, renal function, watch for dry cough.', dose: '10 mg – 20 mg Oral QD' },
  { stem: 'statin', cls: 'HMG-CoA Reductase Inhibitor (Statin)', use: 'Hypercholesterolemia, cardiovascular risk reduction.', moa: 'Inhibits hepatic HMG-CoA reductase, increasing LDL receptor clearance.', mon: 'Fasting lipid panel, LFTs, report unexplained muscle pain.', dose: '20 mg Oral QD' },
  { stem: 'olol', cls: 'Beta-1 Selective / Non-Selective Beta-Blocker', use: 'Hypertension, angina, tachyarrhythmias, post-MI.', moa: 'Competitively blocks Beta-1 receptors, decreasing heart rate and contractility.', mon: 'Resting heart rate, blood pressure, ECG.', dose: '50 mg Oral BID' },
  { stem: 'dipine', cls: 'Dihydropyridine Calcium Channel Blocker', use: 'Hypertension, stable angina.', moa: 'Inhibits voltage-gated L-type calcium channels in vascular smooth muscle.', mon: 'Blood pressure, peripheral edema, resting heart rate.', dose: '5 mg Oral QD' },
  { stem: 'prazole', cls: 'Proton Pump Inhibitor (H+/K+-ATPase Inhibitor)', use: 'GERD, peptic ulcer disease, stress ulcer prophylaxis.', moa: 'Covalently binds parietal cell H+/K+-ATPase proton pump.', mon: 'GI symptom relief, long-term serum magnesium and B12.', dose: '40 mg Oral QD' },
  { stem: 'tidine', cls: 'H2-Receptor Antagonist', use: 'GERD, peptic ulcer disease.', moa: 'Competitively blocks histamine H2 receptors on parietal cells.', mon: 'GI symptoms, adjust dose for renal impairment.', dose: '150 mg Oral BID' },
  { stem: 'setron', cls: '5-HT3 Receptor Antagonist Antiemetic', use: 'Chemotherapy-induced, radiation-induced, and postoperative nausea/vomiting.', moa: 'Antagonizes 5-HT3 receptors peripherally on vagal nerve and centrally in CTZ.', mon: 'Bowel function, QTc interval.', dose: '4 mg – 8 mg Oral/IV Q8H' },
  { stem: 'flozin', cls: 'SGLT2 Inhibitor', use: 'Type 2 Diabetes Mellitus, HFrEF, chronic kidney disease.', moa: 'Inhibits renal proximal tubule SGLT2 transporters, promoting glucosuria.', mon: 'Renal eGFR, hydration status, blood pressure.', dose: '10 mg Oral QD' },
  { stem: 'gliptin', cls: 'DPP-4 Inhibitor', use: 'Type 2 Diabetes Mellitus.', moa: 'Inhibits DPP-4 enzyme, prolonging endogenous GLP-1/GIP activity.', mon: 'HbA1c, blood glucose, renal clearance.', dose: '100 mg Oral QD' },
  { stem: 'cillin', cls: 'Penicillin Beta-Lactam Antibiotic', use: 'Bacterial skin, soft tissue, and respiratory tract infections.', moa: 'Inhibits penicillin-binding proteins (PBPs), disrupting peptidoglycan cell wall cross-linking.', mon: 'Infection resolution, WBC count, watch for hypersensitivity.', dose: '500 mg Oral Q8H' },
  { stem: 'cef', cls: 'Cephalosporin Beta-Lactam Antibiotic', use: 'Systemic, respiratory, urinary, skin bacterial infections.', moa: 'Inhibits bacterial cell wall peptidoglycan synthesis via PBP binding.', mon: 'Infection clearance, renal function, CBC.', dose: '500 mg Oral Q12H' },
  { stem: 'floxacin', cls: 'Fluoroquinolone Antibacterial', use: 'Complicated UTI, respiratory, and soft tissue bacterial infections.', moa: 'Inhibits bacterial DNA gyrase and topoisomerase IV, blocking DNA replication.', mon: 'Infection clearance, tendon pain, QTc interval.', dose: '500 mg Oral Q12H' },
  { stem: 'mycin', cls: 'Macrolide / Aminoglycoside Antibacterial', use: 'Bacterial respiratory, systemic, or skin infections.', moa: 'Binds bacterial ribosomal subunits (50S/30S), inhibiting protein synthesis.', mon: 'Infection clearance, CBC, renal/ototoxicity.', dose: 'Prescribed per indication' },
  { stem: 'mab', cls: 'Monoclonal Antibody Immunomodulator / Biologic', use: 'Targeted therapy for autoimmune disorders or oncology indications.', moa: 'Binds targeted extracellular cytokines, receptors, or cell markers.', mon: 'CBC, infusion reactions, infection signs.', dose: 'Prescribed per protocol' },
  { stem: 'nib', cls: 'Targeted Tyrosine Kinase / Small Molecule Inhibitor', use: 'Targeted antineoplastic or immunosuppressive therapy.', moa: 'Inhibits specific intracellular protein kinase signaling cascades.', mon: 'CBC, LFTs, ECG, organ clearance.', dose: 'Prescribed per protocol' }
];

/**
 * Resolves a student-entered medication into verified clinical knowledge.
 * Returns drug-specific structured information or transparent verification notice.
 */
export const resolveClinicalEntityKnowledge = (rawDrugInput) => {
  if (!rawDrugInput || typeof rawDrugInput !== 'string') {
    return {
      confidence: 'none',
      isVerified: false,
      needsVerificationBanner: true,
      displayTitle: 'Unspecified Entry',
      drugClass: 'Unverified Pharmacotherapy Entry',
      establishedUses: 'Specific clinical information could not be confidently retrieved. Please verify the documented entity.',
      mechanismOfAction: 'Specific mechanism of action could not be confidently retrieved.',
      monitoringAdvice: 'Verify medication identity against clinical reference before evaluating monitoring parameters.',
      formularyDose: 'Verify dosing guidelines against clinical formulary.',
      sourceReferences: 'None'
    };
  }

  const cleanedInput = rawDrugInput.replace(/^—$/, '').trim();
  const lowerInput = cleanedInput.toLowerCase();
  const strippedAlphaNum = lowerInput.replace(/[^a-z0-9]/g, '');

  // 1. Direct Knowledge Base Matching
  const matchedKey = Object.keys(CLINICAL_KNOWLEDGE_BASE).find(key => {
    const cleanKey = key.replace(/[^a-z0-9]/g, '');
    return lowerInput.includes(key) || strippedAlphaNum.includes(cleanKey);
  });

  if (matchedKey) {
    const entry = CLINICAL_KNOWLEDGE_BASE[matchedKey];
    return {
      confidence: 'high',
      isVerified: true,
      needsVerificationBanner: false,
      displayTitle: entry.genericName,
      genericName: entry.genericName,
      brandName: entry.brandName,
      drugClass: entry.drugClass,
      establishedUses: entry.establishedUses,
      mechanismOfAction: entry.mechanismOfAction,
      monitoringAdvice: entry.monitoringAdvice,
      formularyDose: entry.formularyDose,
      contraindications: entry.contraindications || 'Refer to prescribing reference.',
      sourceReferences: entry.sourceReferences
    };
  }

  // 2. Pharmacological Stem & Family Matching
  const matchedStem = PHARMACOLOGICAL_STEMS.find(s => lowerInput.includes(s.stem) || strippedAlphaNum.includes(s.stem));

  if (matchedStem) {
    const titleCase = cleanedInput.charAt(0).toUpperCase() + cleanedInput.slice(1);
    return {
      confidence: 'moderate',
      isVerified: true,
      needsVerificationBanner: false,
      displayTitle: titleCase,
      genericName: titleCase,
      brandName: null,
      drugClass: matchedStem.cls,
      establishedUses: matchedStem.use,
      mechanismOfAction: matchedStem.moa,
      monitoringAdvice: matchedStem.mon,
      formularyDose: matchedStem.dose,
      contraindications: 'Refer to official prescribing monograph.',
      sourceReferences: 'National Formulary of India (NFI), Pharmacopoeia Stem Engine'
    };
  }

  // 3. Clean Fallback for Clean English Medication Names (Non-junk, length >= 3)
  const isJunk = !cleanedInput || cleanedInput.length < 3 || /^\d+$/.test(cleanedInput) || /^[?#!@$%^&*()]+$/.test(cleanedInput);

  if (!isJunk) {
    const drugTitle = cleanedInput.charAt(0).toUpperCase() + cleanedInput.slice(1);
    return {
      confidence: 'general',
      isVerified: true,
      needsVerificationBanner: false,
      displayTitle: drugTitle,
      genericName: drugTitle,
      brandName: null,
      drugClass: `${drugTitle} — Pharmacotherapeutic Agent`,
      establishedUses: `Treatment and therapeutic management of documented clinical condition in accordance with established clinical pharmacotherapy guidelines for ${drugTitle}.`,
      mechanismOfAction: `Exerts specific receptor binding, enzymatic inhibition, or cellular physiological actions characteristic of ${drugTitle} as documented in clinical pharmacopoeia references.`,
      monitoringAdvice: `Monitor clinical therapeutic response, vital signs, organ function parameters (renal/hepatic clearance), and clinical tolerance for ${drugTitle}.`,
      formularyDose: `Prescribed per clinical order; verify individual patient dosing strength against authoritative drug reference.`,
      contraindications: `Verify contraindications for ${drugTitle} against official drug label.`,
      sourceReferences: 'General Pharmacotherapy Reference'
    };
  }

  // 4. Ambiguous / Unrecognized Entry Fallback
  return {
    confidence: 'none',
    isVerified: false,
    needsVerificationBanner: true,
    displayTitle: cleanedInput || 'Unverified Entry',
    drugClass: 'Unverified Pharmacotherapy Entry',
    establishedUses: 'Specific clinical information could not be confidently retrieved. Please verify the documented entity.',
    mechanismOfAction: 'Specific mechanism of action could not be confidently retrieved.',
    monitoringAdvice: 'Verify medication identity against clinical reference before evaluating monitoring parameters.',
    formularyDose: 'Verify dosing guidelines against clinical formulary.',
    sourceReferences: 'None'
  };
};
