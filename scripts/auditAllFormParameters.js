import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

// OFFICIAL FORM PARAMETER LIST (GROUPED BY THE 10 FORM CATEGORIES)
const FORM_CATEGORIES = [
  {
    category: 'HAEMATOLOGICAL PATTERNS',
    parameters: [
      'Hb', 'RBC', 'WBC', 'Neutrophils', 'Lymphocytes', 'Eosinophils',
      'Monocytes', 'MCH', 'MCHC', 'MCV', 'ESR', 'Platelets', 'PCV',
      'CT', 'BT', 'PT', 'APTT'
    ]
  },
  {
    category: 'THYROID FUNCTION TESTS',
    parameters: ['TSH', 'Free T4', 'Total T3']
  },
  {
    category: 'URINE ANALYSIS',
    parameters: [
      'Color', 'Specific gravity', 'pH', 'Sugar', 'Blood', 'Pus cells',
      'RBC', 'Ketone bodies', 'Epi. Cells', 'Proteins', 'Bile salts/pigments',
      'Glucose', 'Transparency', 'Crystals'
    ]
  },
  {
    category: 'BLOOD GLUCOSE',
    parameters: ['FBS', 'RBS', 'PPBS']
  },
  {
    category: 'ELECTROLYTES',
    parameters: ['Na', 'K', 'Chlorides', 'Mg', 'Sr.Ca']
  },
  {
    category: 'CARDIAC FUNCTION TESTS',
    parameters: ['CPK', 'CPK-MB', 'LDH']
  },
  {
    category: 'LIVER FUNCTIONS TEST',
    parameters: [
      'Bili (T)', 'Bili (D)', 'Bili (ID)', 'SGOT (AST)', 'SGPT (ALT)',
      'Alk. Phos', 'Globulin', 'Albumin'
    ]
  },
  {
    category: 'RENAL FUNCTION TESTS',
    parameters: ['Urea', 'S.Cr', 'Uric acid']
  },
  {
    category: 'LIPID PROFILE TESTS',
    parameters: ['Total Chol', 'HDL', 'LDL', 'VLDL', 'TG']
  },
  {
    category: 'OTHER INVESTIGATIONS',
    parameters: ['Other Investigations']
  }
];

const FRONTEND_MAP = {
  'Haematological Patterns': ['Hb %', 'RBC Count', 'WBC Count', 'Neutrophils', 'Lymphocytes', 'Eosinophils', 'Monocytes', 'MCH', 'MCHC', 'MCV', 'Platelets', 'PCV'],
  'Blood Glucose': ['FBS', 'RBS', 'PPBS'],
  'Renal Function Tests': ['Serum Creatinine', 'Blood Urea', 'Uric Acid'],
  'Liver Function Tests': ['SGOT (AST)', 'SGPT (ALT)', 'Bilirubin Total', 'Bilirubin Direct', 'Bilirubin Indirect', 'Alkaline Phosphatase'],
  'Electrolytes': ['Serum Sodium (Na+)', 'Serum Potassium (K+)', 'Chlorides', 'Serum Calcium'],
  'Thyroid Function Tests': ['TSH', 'Free T4', 'Total T3'],
  'Cardiac Function Tests': ['CPK-MB'],
  'Lipid Profile Tests': ['Total Cholesterol', 'HDL', 'LDL', 'VLDL', 'Triglycerides'],
  'Urine Analysis': ['Specific Gravity', 'pH', 'Pus Cells', 'Epi Cells'],
  'General': ['General Parameter']
};

async function auditAllFormParameters() {
  await client.connect();

  const dbRes = await client.query('SELECT * FROM public.lab_parameter_knowledge');
  const dbRows = dbRes.rows;

  let rowIdx = 1;
  console.log('=== COMPLETE PARAMETER-BY-PARAMETER AUDIT TABLE ===\n');
  console.log('Idx | Category | Form Parameter | Frontend Dropdown | Exists in DB? | Exact DB Name | Eval Type | Status');
  console.log('-'.repeat(120));

  for (const catObj of FORM_CATEGORIES) {
    for (const formParam of catObj.parameters) {
      if (formParam === 'Other Investigations') {
        console.log(`${rowIdx++} | ${catObj.category} | ${formParam} | YES (Free-text textarea) | N/A | patient_profiles.other_investigations | textual | MATCH (Free-Text Field)`);
        continue;
      }

      let fePresent = false;
      for (const [feCat, feParams] of Object.entries(FRONTEND_MAP)) {
        if (feParams.some(p => p.toLowerCase() === formParam.toLowerCase() || p.toLowerCase().includes(formParam.toLowerCase()) || formParam.toLowerCase().includes(p.toLowerCase()))) {
          fePresent = true;
          break;
        }
      }

      const pClean = formParam.toLowerCase().replace(/[^a-z0-9]/g, '');
      let dbMatch = dbRows.find(r => r.parameter_name.toLowerCase().replace(/[^a-z0-9]/g, '') === pClean);

      let status = 'MISSING';
      let exactDBName = 'N/A';
      let evalType = 'N/A';

      if (dbMatch) {
        status = 'MATCH';
        exactDBName = dbMatch.parameter_name;
        evalType = dbMatch.evaluation_type;
      } else {
        let aliasMatch = dbRows.find(r => {
          const dbName = r.parameter_name.toLowerCase();
          const pName = formParam.toLowerCase();
          if (pName === 'hb' && (dbName === 'hb' || dbName === 'hb %' || dbName === 'hemoglobin')) return true;
          if (pName === 'rbc' && (dbName === 'rbc count' || dbName === 'red blood cells')) return true;
          if (pName === 'wbc' && (dbName === 'wbc count' || dbName === 'white blood cells')) return true;
          if (pName === 's.cr' && (dbName === 'serum creatinine' || dbName === 'creatinine')) return true;
          if (pName === 'sr.ca' && (dbName === 'serum calcium' || dbName === 'calcium')) return true;
          if (pName === 'na' && (dbName === 'sodium' || dbName.includes('na+'))) return true;
          if (pName === 'k' && (dbName === 'potassium' || dbName.includes('k+'))) return true;
          if (pName === 'mg' && (dbName === 'magnesium' || dbName === 'mg++')) return true;
          if (pName === 'chlorides' && (dbName === 'chloride' || dbName === 'chlorides')) return true;
          if (pName === 'bili (t)' && dbName.includes('total bilirubin')) return true;
          if (pName === 'bili (d)' && dbName.includes('direct bilirubin')) return true;
          if (pName === 'bili (id)' && dbName.includes('indirect bilirubin')) return true;
          if (pName === 'alk. phos' && dbName.includes('alkaline phosphatase')) return true;
          if (pName === 'total chol' && dbName.includes('total cholesterol')) return true;
          if (pName === 'tg' && dbName.includes('triglycerides')) return true;
          if (pName === 'cpk' && (dbName.includes('cpk') || dbName.includes('ck'))) return true;
          if (pName === 'color' && dbName.includes('colour')) return true;
          if (pName === 'epi. cells' && (dbName.includes('epithelial') || dbName.includes('epi cells'))) return true;
          if (pName === 'sugar' && (dbName.includes('glucose') || dbName.includes('sugar'))) return true;
          if (pName === 'proteins' && (dbName.includes('protein') || dbName.includes('albumin'))) return true;
          if (pName === 'glucose' && dbName.includes('glucose')) return true;
          if (pName === 'blood' && dbName.includes('urine blood')) return true;
          return false;
        });

        if (aliasMatch) {
          status = 'NAME MISMATCH / ALIAS';
          exactDBName = aliasMatch.parameter_name;
          evalType = aliasMatch.evaluation_type;
        }
      }

      console.log(`${rowIdx++} | ${catObj.category} | ${formParam} | ${fePresent ? 'YES' : 'NO (Missing in Frontend Dropdown)'} | ${dbMatch || status.startsWith('NAME') ? 'YES' : 'NO'} | ${exactDBName} | ${evalType} | ${status}`);
    }
  }

  await client.end();
}

auditAllFormParameters();
