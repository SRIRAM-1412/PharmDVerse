import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function setupInteractionTables() {
  console.log('=== SETTING UP SECTION 5 MASTER INTERACTION TABLES ===\n');
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // 1. CREATE public.drug_drug_interaction_knowledge TABLE
    console.log('Creating public.drug_drug_interaction_knowledge table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.drug_drug_interaction_knowledge (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        drug_a_generic text NOT NULL,
        drug_a_normalized text NOT NULL,
        drug_b_generic text NOT NULL,
        drug_b_normalized text NOT NULL,
        pair_key text UNIQUE NOT NULL,
        interaction_description text NOT NULL,
        mechanism text,
        clinical_significance text,
        severity text NOT NULL DEFAULT 'Major',
        management text,
        monitoring text,
        source_reference text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
        updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
      );
    `);

    // Indexes for drug_drug_interaction_knowledge
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ddi_drug_a_norm ON public.drug_drug_interaction_knowledge (drug_a_normalized);
      CREATE INDEX IF NOT EXISTS idx_ddi_drug_b_norm ON public.drug_drug_interaction_knowledge (drug_b_normalized);
      CREATE INDEX IF NOT EXISTS idx_ddi_pair_key ON public.drug_drug_interaction_knowledge (pair_key);
      CREATE INDEX IF NOT EXISTS idx_ddi_is_active ON public.drug_drug_interaction_knowledge (is_active);
    `);

    // Enable RLS for drug_drug_interaction_knowledge
    await client.query(`
      ALTER TABLE public.drug_drug_interaction_knowledge ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS ddi_knowledge_select_policy ON public.drug_drug_interaction_knowledge;
      CREATE POLICY ddi_knowledge_select_policy ON public.drug_drug_interaction_knowledge
        FOR SELECT TO public USING (true);

      DROP POLICY IF EXISTS ddi_knowledge_write_policy ON public.drug_drug_interaction_knowledge;
      CREATE POLICY ddi_knowledge_write_policy ON public.drug_drug_interaction_knowledge
        FOR ALL TO public
        USING (true)
        WITH CHECK (true);
    `);
    console.log('✓ drug_drug_interaction_knowledge table, indexes, and RLS enabled.');

    // 2. CREATE public.drug_food_interaction_knowledge TABLE
    console.log('Creating public.drug_food_interaction_knowledge table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.drug_food_interaction_knowledge (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        drug_generic text NOT NULL,
        drug_normalized text NOT NULL,
        food_or_beverage text NOT NULL,
        food_normalized text NOT NULL,
        interaction_description text NOT NULL,
        mechanism text,
        clinical_significance text,
        severity text NOT NULL DEFAULT 'Major',
        management text,
        counselling_point text,
        source_reference text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
        updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
        CONSTRAINT unique_drug_food_pair UNIQUE (drug_normalized, food_normalized)
      );
    `);

    // Indexes for drug_food_interaction_knowledge
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_dfi_drug_norm ON public.drug_food_interaction_knowledge (drug_normalized);
      CREATE INDEX IF NOT EXISTS idx_dfi_food_norm ON public.drug_food_interaction_knowledge (food_normalized);
      CREATE INDEX IF NOT EXISTS idx_dfi_is_active ON public.drug_food_interaction_knowledge (is_active);
    `);

    // Enable RLS for drug_food_interaction_knowledge
    await client.query(`
      ALTER TABLE public.drug_food_interaction_knowledge ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS dfi_knowledge_select_policy ON public.drug_food_interaction_knowledge;
      CREATE POLICY dfi_knowledge_select_policy ON public.drug_food_interaction_knowledge
        FOR SELECT TO public USING (true);

      DROP POLICY IF EXISTS dfi_knowledge_write_policy ON public.drug_food_interaction_knowledge;
      CREATE POLICY dfi_knowledge_write_policy ON public.drug_food_interaction_knowledge
        FOR ALL TO public
        USING (true)
        WITH CHECK (true);
    `);
    console.log('✓ drug_food_interaction_knowledge table, indexes, and RLS enabled.');

    // 3. SEED INITIAL MASTER DDI RECORDS (5 Classic Pharmacopoeia Pairs)
    console.log('\nSeeding initial Drug-Drug Master Interactions...');
    const seedDDI = [
      {
        drug_a: 'Digoxin',
        drug_b: 'Diltiazem',
        desc: 'Diltiazem elevates Digoxin plasma concentration and compounds AV nodal conduction slowing.',
        mech: 'Diltiazem inhibits renal P-glycoprotein (P-gp) efflux pumps and decreases digoxin clearance. Both agents slow AV nodal conduction.',
        sig: 'Substantial increase in serum Digoxin concentration (up to 20-50% elevation) accompanied by risk of symptomatic bradycardia and AV block.',
        sev: 'Major',
        mgmt: 'Monitor serum Digoxin trough levels closely; reduce Digoxin dose by 25-50% upon initiating Diltiazem.',
        mon: 'Serum digoxin trough levels (0.5-0.9 ng/mL), resting heart rate, ECG PR interval.',
        source: 'NFI, BNF'
      },
      {
        drug_a: 'Methotrexate',
        drug_b: 'Aspirin',
        desc: 'Aspirin inhibits renal clearance of Methotrexate, increasing toxic plasma levels.',
        mech: 'Aspirin reduces renal blood flow/GFR and competitively inhibits renal tubular secretion of Methotrexate via organic anion transporters (OAT1/OAT3).',
        sig: 'Severe elevation in plasma Methotrexate concentration leading to acute bone marrow suppression (pancytopenia), nephrotoxicity, and mucositis.',
        sev: 'Severe',
        mgmt: 'Avoid co-administration with high-dose Methotrexate. If low-dose weekly Methotrexate is used for RA, monitor CBC and renal function.',
        mon: 'Complete Blood Count (CBC), Serum Creatinine, LFTs.',
        source: 'BNF, IP'
      },
      {
        drug_a: 'Digoxin',
        drug_b: 'Furosemide',
        desc: 'Loop diuretic-induced hypokalemia sensitizes the myocardium to Digoxin toxicity.',
        mech: 'Furosemide causes renal potassium and magnesium loss. Hypokalemia increases Digoxin binding to cardiac Na+/K+-ATPase pumps.',
        sig: 'Precipitation of severe Digoxin toxicity and fatal cardiac arrhythmias (PVCT, ventricular tachycardia) even at therapeutic Digoxin levels.',
        sev: 'Major',
        mgmt: 'Monitor serum potassium and magnesium frequently. Co-prescribe oral potassium supplements or Spironolactone to maintain K+ > 4.0 mEq/L.',
        mon: 'Serum Potassium (K+), Serum Magnesium (Mg2+), Serum Digoxin level.',
        source: 'IP, NFI, BNF'
      },
      {
        drug_a: 'Aspirin',
        drug_b: 'Clopidogrel',
        desc: 'Additive antiplatelet inhibition increases gastrointestinal bleeding vulnerability.',
        mech: 'Additive platelet inhibition via COX-1 acetylation (Aspirin) and irreversible P2Y12 ADP receptor blockade (Clopidogrel).',
        sig: 'Significantly increased risk of major gastrointestinal mucosal hemorrhage and systemic bleeding.',
        sev: 'Major',
        mgmt: 'Ensure DAPT duration is strictly guideline-directed. Co-prescribe PPI gastroprotection (e.g. Pantoprazole 40 mg OD).',
        mon: 'Hemoglobin/Hematocrit, stool occult blood, epigastric pain assessment.',
        source: 'NFI, BNF'
      },
      {
        drug_a: 'Telmisartan',
        drug_b: 'Spironolactone',
        desc: 'Dual renin-angiotensin-aldosterone blockade significantly increases hyperkalemia risk.',
        mech: 'Telmisartan blocks AT1 receptor-mediated aldosterone release while Spironolactone competitively blocks mineralocorticoid receptors in the distal tubule, suppressing renal potassium excretion.',
        sig: 'Additive potassium retention leading to severe hyperkalemia (K+ > 5.5 mEq/L), cardiac conduction abnormalities, and fatal arrhythmias.',
        sev: 'Major',
        mgmt: 'Monitor serum potassium and renal function within 1-2 weeks of initiation. Avoid potassium supplements.',
        mon: 'Serum Potassium, Serum Creatinine, eGFR.',
        source: 'BNF, IP'
      }
    ];

    for (const ddi of seedDDI) {
      const normA = ddi.drug_a.toLowerCase().trim();
      const normB = ddi.drug_b.toLowerCase().trim();
      const pairKey = [normA, normB].sort().join(':::');

      await client.query(`
        INSERT INTO public.drug_drug_interaction_knowledge (
          drug_a_generic, drug_a_normalized, drug_b_generic, drug_b_normalized, pair_key,
          interaction_description, mechanism, clinical_significance, severity, management, monitoring, source_reference, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW(), NOW())
        ON CONFLICT (pair_key) DO UPDATE SET
          interaction_description = EXCLUDED.interaction_description,
          mechanism = EXCLUDED.mechanism,
          clinical_significance = EXCLUDED.clinical_significance,
          severity = EXCLUDED.severity,
          management = EXCLUDED.management,
          monitoring = EXCLUDED.monitoring,
          source_reference = EXCLUDED.source_reference,
          updated_at = NOW();
      `, [ddi.drug_a, normA, ddi.drug_b, normB, pairKey, ddi.desc, ddi.mech, ddi.sig, ddi.sev, ddi.mgmt, ddi.mon, ddi.source]);
    }
    console.log('✓ Seeded 5 initial Drug-Drug interaction master records.');

    // 4. SEED INITIAL MASTER DFI RECORDS (5 Classic Pharmacopoeia Drug-Food Pairs)
    console.log('\nSeeding initial Drug-Food Master Interactions...');
    const seedDFI = [
      {
        drug: 'Atorvastatin',
        food: 'Grapefruit Juice',
        desc: 'Grapefruit juice inhibits intestinal CYP3A4 metabolism, markedly increasing statin blood levels.',
        mech: 'Furanocoumarins in grapefruit juice irreversibly inhibit intestinal CYP3A4 enzymes, reducing first-pass metabolism.',
        sig: 'Elevated AUC and Cmax of Atorvastatin, substantially increasing risk of myopathy, rhabdomyolysis, and acute kidney injury.',
        sev: 'Major',
        mgmt: 'Advise patient to avoid consuming grapefruit or grapefruit juice (>200 mL/day) during statin therapy.',
        counselling: 'Avoid grapefruit juice while taking Atorvastatin as it can increase drug concentration and cause severe muscle pain.',
        source: 'BNF, USP'
      },
      {
        drug: 'Ciprofloxacin',
        food: 'Dairy Products / Milk / Calcium-fortified juices',
        desc: 'Multivalent calcium cations chelate Ciprofloxacin, preventing gastrointestinal absorption.',
        mech: 'Calcium, magnesium, and aluminum ions form insoluble chelate complexes with fluoroquinolones in the gut lumen.',
        sig: 'Significant reduction in oral Ciprofloxacin bioavailability (up to 40-60% decrease in AUC), leading to subtherapeutic blood levels and treatment failure.',
        sev: 'Major',
        mgmt: 'Administer Ciprofloxacin at least 2 hours before or 6 hours after consuming dairy products or calcium-enriched foods.',
        counselling: 'Do not take Ciprofloxacin with milk, yogurt, or calcium-fortified juice alone. Take 2 hours before or 6 hours after dairy.',
        source: 'NFI, BNF'
      },
      {
        drug: 'Warfarin',
        food: 'Green Leafy Vegetables (High Vitamin K Foods)',
        desc: 'Variable Vitamin K intake directly antagonizes Warfarin anticoagulation efficacy.',
        mech: 'Vitamin K is an essential cofactor for hepatic gamma-carboxylation of clotting factors II, VII, IX, and X, counteracting Warfarin VKORC1 inhibition.',
        sig: 'Fluctuations in INR control; sudden increase in dietary Vitamin K causes Warfarin resistance and thrombosis risk.',
        sev: 'Major',
        mgmt: 'Instruct patient to maintain a consistent daily intake of Vitamin K-rich foods rather than completely eliminating them.',
        counselling: 'Keep your intake of green leafy vegetables (spinach, kale, broccoli) consistent every week to keep your INR stable.',
        source: 'IP, BNF'
      },
      {
        drug: 'Linezolid',
        food: 'Tyramine-Rich Foods (Aged Cheese, Red Wine, Yeast Extract)',
        desc: 'Weak non-selective MAO inhibition by Linezolid impairs dietary tyramine breakdown.',
        mech: 'Reversible non-selective MAO-A/B inhibition prevents intestinal breakdown of ingested tyramine, resulting in systemic sympathomimetic release.',
        sig: 'Precipitation of severe hypertensive crisis (cheese reaction), severe headache, tachyarrhythmias, and cerebrovascular risk.',
        sev: 'Severe',
        mgmt: 'Strictly avoid foods with high tyramine content during Linezolid therapy and for 2 weeks after stopping.',
        counselling: 'Avoid aged cheeses, soy sauce, draught beer, and yeast extracts while taking Linezolid to prevent dangerous BP spikes.',
        source: 'BNF, USP'
      },
      {
        drug: 'Metoprolol',
        food: 'High-Protein Meals',
        desc: 'High-protein food enhances systemic bioavailability of orally administered Metoprolol.',
        mech: 'Protein-rich food stimulates splanchnic blood flow and reduces hepatic first-pass extraction during absorption phase.',
        sig: 'Increase in peak plasma Metoprolol concentration (Cmax) and AUC by 20-40%, increasing bradycardic and hypotensive response.',
        sev: 'Moderate',
        mgmt: 'Advise patient to take Metoprolol consistently either always with meals or always on an empty stomach.',
        counselling: 'Take your Metoprolol tablet consistently with or immediately after meals every day to maintain steady blood pressure control.',
        source: 'NFI, BNF'
      }
    ];

    for (const dfi of seedDFI) {
      const normDrug = dfi.drug.toLowerCase().trim();
      const normFood = dfi.food.toLowerCase().trim();

      await client.query(`
        INSERT INTO public.drug_food_interaction_knowledge (
          drug_generic, drug_normalized, food_or_beverage, food_normalized,
          interaction_description, mechanism, clinical_significance, severity, management, counselling_point, source_reference, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())
        ON CONFLICT (drug_normalized, food_normalized) DO UPDATE SET
          interaction_description = EXCLUDED.interaction_description,
          mechanism = EXCLUDED.mechanism,
          clinical_significance = EXCLUDED.clinical_significance,
          severity = EXCLUDED.severity,
          management = EXCLUDED.management,
          counselling_point = EXCLUDED.counselling_point,
          source_reference = EXCLUDED.source_reference,
          updated_at = NOW();
      `, [dfi.drug, normDrug, dfi.food, normFood, dfi.desc, dfi.mech, dfi.sig, dfi.sev, dfi.mgmt, dfi.counselling, dfi.source]);
    }
    console.log('✓ Seeded 5 initial Drug-Food interaction master records.');

  } catch (err) {
    console.error('Error setting up interaction tables:', err);
  } finally {
    await client.end();
  }
}

setupInteractionTables();
