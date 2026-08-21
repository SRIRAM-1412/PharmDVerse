import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const INITIAL_INVESTIGATIONS = [
  {
    investigation_name: 'Electrocardiogram (ECG / EKG)',
    normalized_name: 'electrocardiogram (ecg / ekg)',
    category: 'Cardiac',
    description: 'Non-invasive surface recording of cardiac electrical activity measuring P-QRS-T waveforms and rhythm.',
    expected_findings: 'Normal sinus rhythm (60-100 bpm), normal PR interval (120-200 ms), normal QRS duration (< 120 ms).',
    clinical_significance: 'Identification of cardiac arrhythmias, ischemic ST-T wave changes, myocardial infarction, conduction blocks, and drug-induced QTc prolongation.',
    is_active: true
  },
  {
    investigation_name: 'Echocardiogram (ECHO / Transthoracic ECHO)',
    normalized_name: 'echocardiogram (echo / transthoracic echo)',
    category: 'Cardiac',
    description: 'Transthoracic ultrasound visualization of cardiac chambers, valvular anatomy, wall motion, and ejection fraction.',
    expected_findings: 'Normal Left Ventricular Ejection Fraction (LVEF 55-70%), normal cardiac chamber dimensions, intact valvular motion.',
    clinical_significance: 'Evaluation of heart failure (reduced EF vs preserved EF), cardiomyopathy (DCM/HCM), valvular stenosis/regurgitation, pulmonary hypertension, and pericardial effusion.',
    is_active: true
  },
  {
    investigation_name: 'Ultrasound Scan Whole Abdomen (USG Abdomen)',
    normalized_name: 'ultrasound scan whole abdomen (usg abdomen)',
    category: 'Radiology',
    description: 'Transabdominal sonographic imaging of abdominal and pelvic solid organs, vasculature, and peritoneal cavity.',
    expected_findings: 'Normal echotexture and dimensions of liver, gallbladder, pancreas, spleen, kidneys, and urinary bladder; no free fluid.',
    clinical_significance: 'Detection of hepatomegaly, fatty liver, cholelithiasis, renal cortical cysts/calculi, ascites, splenomegaly, and obstructive uropathy.',
    is_active: true
  },
  {
    investigation_name: 'Chest X-Ray (PA View)',
    normalized_name: 'chest x-ray (pa view)',
    category: 'Radiology',
    description: 'Posteroanterior radiographic imaging of the thoracic cage, lung parenchyma, mediastinum, and cardiac silhouette.',
    expected_findings: 'Clear lung fields, normal cardiothoracic ratio (< 0.50), sharp costophrenic and cardiophrenic angles, normal mediastinal contour.',
    clinical_significance: 'Diagnosis of pulmonary consolidations, pneumonia, cardiomegaly, pleural effusion, pneumothorax, pulmonary congestion, and pulmonary tuberculosis.',
    is_active: true
  },
  {
    investigation_name: 'Upper GI Endoscopy (Esophagogastroduodenoscopy / EGD)',
    normalized_name: 'upper gi endoscopy (esophagogastroduodenoscopy / egd)',
    category: 'Endoscopy',
    description: 'Direct fiberoptic endoscopic visualization of upper gastrointestinal mucosa (esophagus, stomach, and proximal duodenum).',
    expected_findings: 'Smooth pink mucosal lining without ulcerations, erosions, varices, or mucosal friability.',
    clinical_significance: 'Diagnosis of peptic ulcer disease, gastritis, esophageal varices, GERD, Mallory-Weiss tears, and upper GI hemorrhage.',
    is_active: true
  },
  {
    investigation_name: 'Colonoscopy (Lower GI Endoscopy)',
    normalized_name: 'colonoscopy (lower gi endoscopy)',
    category: 'Endoscopy',
    description: 'Endoscopic visualization of the mucosal lining of the large intestine (rectum to cecum) and terminal ileum.',
    expected_findings: 'Normal mucosal vascular pattern without ulceration, polyps, inflammatory lesions, or strictures.',
    clinical_significance: 'Evaluation of inflammatory bowel disease (Ulcerative Colitis / Crohn\'s disease), colorectal polyps, gastrointestinal bleeding, and colorectal neoplasia.',
    is_active: true
  },
  {
    investigation_name: 'Histopathology / Biopsy Examination',
    normalized_name: 'histopathology / biopsy examination',
    category: 'Pathology',
    description: 'Microscopic cellular and tissue architectural examination of biopted tissue specimens stained with H&E or special stains.',
    expected_findings: 'Normal tissue architecture appropriate for target organ without atypia, dysplasia, necrosis, or malignant infiltration.',
    clinical_significance: 'Definitive histopathological diagnosis of tissue malignancy, focal cholesterolosis, granulomatous inflammation, and organ dysplasia.',
    is_active: true
  },
  {
    investigation_name: 'Synovial Fluid Analysis & Microscopy',
    normalized_name: 'synovial fluid analysis & microscopy',
    category: 'Pathology',
    description: 'Physical, chemical, cell count, and polarized light microscopic examination of aspirated joint fluid.',
    expected_findings: 'Clear, pale yellow fluid; high viscosity; WBC count < 200/mm³; absence of microcrystals or bacterial organisms.',
    clinical_significance: 'Differential diagnosis of inflammatory vs septic vs crystal-induced arthritis (gout - monosodium urate crystals; pseudogout - CPPD crystals).',
    is_active: true
  },
  {
    investigation_name: 'CT Scan Brain / Head (Non-Contrast / CECT)',
    normalized_name: 'ct scan brain / head (non-contrast / cect)',
    category: 'Radiology',
    description: 'Cross-sectional axial computed tomography of cerebral parenchyma, ventricles, and intracranial osseous structures.',
    expected_findings: 'Symmetric cerebral hemispheres, normal ventricular size and sulcal pattern without intracranial hemorrhage or space-occupying lesions.',
    clinical_significance: 'Rapid diagnosis of ischemic vs hemorrhagic stroke, cerebral edema, subdural/epidural hematoma, mass lesions, and hydrocephalus.',
    is_active: true
  },
  {
    investigation_name: 'MRI Brain / Spine',
    normalized_name: 'mri brain / spine',
    category: 'Radiology',
    description: 'High-resolution multiplanar magnetic resonance imaging utilizing nuclear magnetic resonance for soft tissue characterization.',
    expected_findings: 'Normal signal intensity across T1, T2, and FLAIR sequences without demyelination, infarction, or disc herniation.',
    clinical_significance: 'Identification of early ischemic stroke (DWI), demyelinating lesions (Multiple Sclerosis), spinal cord compression, intervertebral disc herniation, and intracranial neoplasms.',
    is_active: true
  }
];

async function createMasterTable() {
  await client.connect();
  console.log('=== CREATING public.other_investigation_knowledge TABLE & INDEXES ===\n');

  try {
    // 1. Create Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.other_investigation_knowledge (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        investigation_name text NOT NULL,
        normalized_name text NOT NULL UNIQUE,
        category text NOT NULL DEFAULT 'General Diagnostic',
        description text,
        expected_findings text,
        clinical_significance text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `);
    console.log('Table public.other_investigation_knowledge created/verified successfully.');

    // 2. Create Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_other_inv_normalized ON public.other_investigation_knowledge (normalized_name);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_other_inv_category ON public.other_investigation_knowledge (category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_other_inv_is_active ON public.other_investigation_knowledge (is_active);`);
    console.log('Indexes idx_other_inv_normalized, idx_other_inv_category, idx_other_inv_is_active created successfully.');

    // 3. RLS Setup
    await client.query(`ALTER TABLE public.other_investigation_knowledge ENABLE ROW LEVEL SECURITY;`);
    await client.query(`DROP POLICY IF EXISTS "other_inv_knowledge_select_policy" ON public.other_investigation_knowledge;`);
    await client.query(`DROP POLICY IF EXISTS "other_inv_knowledge_write_policy" ON public.other_investigation_knowledge;`);

    // SELECT Policy: Public Read Access
    await client.query(`
      CREATE POLICY "other_inv_knowledge_select_policy" ON public.other_investigation_knowledge
      FOR SELECT TO public USING (true);
    `);

    // WRITE Policy: Super Admin Only
    await client.query(`
      CREATE POLICY "other_inv_knowledge_write_policy" ON public.other_investigation_knowledge
      FOR ALL TO public
      USING (
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      )
      WITH CHECK (
        (((COALESCE(NULLIF(current_setting('request.headers'::text, true), ''::text), '{}'::text))::jsonb ->> 'x-super-admin'::text) = 'true'::text)
      );
    `);
    console.log('RLS select and write policies successfully applied.');

    // 4. Seed Initial Controlled Vocabulary
    console.log('\nSeeding initial controlled vocabulary records...');
    for (const inv of INITIAL_INVESTIGATIONS) {
      await client.query(`
        INSERT INTO public.other_investigation_knowledge (
          investigation_name, normalized_name, category, description, expected_findings, clinical_significance, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) ON CONFLICT (normalized_name) DO UPDATE SET
          investigation_name = EXCLUDED.investigation_name,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          expected_findings = EXCLUDED.expected_findings,
          clinical_significance = EXCLUDED.clinical_significance,
          is_active = EXCLUDED.is_active,
          updated_at = NOW();
      `, [inv.investigation_name, inv.normalized_name, inv.category, inv.description, inv.expected_findings, inv.clinical_significance, inv.is_active]);
    }

    const countRes = await client.query(`SELECT count(*) FROM public.other_investigation_knowledge;`);
    console.log(`\nTOTAL ROWS IN public.other_investigation_knowledge: ${countRes.rows[0].count}`);

  } catch (err) {
    console.error('Error creating table and seeding:', err);
  } finally {
    await client.end();
  }
}

createMasterTable();
