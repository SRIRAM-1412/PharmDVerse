/**
 * PHARMDVERSE ERP — OFFICIAL LABORATORY MASTER DATA & ALIAS MAPPING
 * Reference: Official Patient Documentation Form (10 Categories, 62 Parameters)
 */

export const FORM_LAB_CATEGORY_MAP = {
  'Haematological Patterns': [
    { parameter_name: 'Hb', db_name: 'Hb', reference_range: '11-16.5 %' },
    { parameter_name: 'RBC', db_name: 'RBC Count', reference_range: '3.8-5.8 cells/mm' },
    { parameter_name: 'WBC', db_name: 'WBC Count', reference_range: '4000-10000 cells/mm' },
    { parameter_name: 'Neutrophils', db_name: 'Neutrophils', reference_range: '40-70 %' },
    { parameter_name: 'Lymphocytes', db_name: 'Lymphocytes', reference_range: '15-30 %' },
    { parameter_name: 'Eosinophils', db_name: 'Eosinophils', reference_range: '1-6 %' },
    { parameter_name: 'Monocytes', db_name: 'Monocytes', reference_range: '2-10 %' },
    { parameter_name: 'MCH', db_name: 'MCH', reference_range: '27-32 pg/cell' },
    { parameter_name: 'MCHC', db_name: 'MCHC', reference_range: '31-35 gm%' },
    { parameter_name: 'MCV', db_name: 'MCV', reference_range: '49-80 fl' },
    { parameter_name: 'ESR', db_name: 'ESR', reference_range: '0-20 mm/hr' },
    { parameter_name: 'Platelets', db_name: 'Platelets', reference_range: '1.5-4 lakhs/cell' },
    { parameter_name: 'PCV', db_name: 'PCV', reference_range: '35-45 %' },
    { parameter_name: 'CT', db_name: 'CT — Clotting Time', reference_range: '3-8 mins' },
    { parameter_name: 'BT', db_name: 'BT — Bleeding Time', reference_range: '2-7 mins' },
    { parameter_name: 'PT', db_name: 'PT', reference_range: '11-13.5 secs' },
    { parameter_name: 'APTT', db_name: 'APTT', reference_range: '25-35 secs' }
  ],
  'Thyroid Function Tests': [
    { parameter_name: 'TSH', db_name: 'TSH', reference_range: '0.5-4 mIU/L' },
    { parameter_name: 'Free T4', db_name: 'Free T4', reference_range: '0.8-1.8 ng/dL' },
    { parameter_name: 'Total T3', db_name: 'Total T3', reference_range: '80-180 ng/dL' }
  ],
  'Urine Analysis': [
    { parameter_name: 'Color', db_name: 'Urine Colour', reference_range: 'Pale Yellow' },
    { parameter_name: 'Specific gravity', db_name: 'Urine Specific Gravity', reference_range: '1.005-1.030' },
    { parameter_name: 'pH', db_name: 'Urine pH', reference_range: '4.6-8.0' },
    { parameter_name: 'Sugar', db_name: 'Urine Glucose / Sugar', reference_range: 'Nil' },
    { parameter_name: 'Blood', db_name: 'Urine Blood', reference_range: 'Nil' },
    { parameter_name: 'Pus cells', db_name: 'Pus Cells', reference_range: '1-5 hpf' },
    { parameter_name: 'RBC', db_name: 'RBC Count', reference_range: '0-2 hpf' },
    { parameter_name: 'Ketone bodies', db_name: 'Ketone Bodies', reference_range: 'Absent' },
    { parameter_name: 'Epi. Cells', db_name: 'Epithelial Cells', reference_range: '1-5 hpf' },
    { parameter_name: 'Proteins', db_name: 'Urine Protein', reference_range: 'Nil / Negative' },
    { parameter_name: 'Bile salts/pigments', db_name: 'Bile Salts/Pigments', reference_range: 'Absent' },
    { parameter_name: 'Glucose', db_name: 'Urine Glucose / Sugar', reference_range: 'Nil' },
    { parameter_name: 'Transparency', db_name: 'Urine Transparency', reference_range: 'Clear' },
    { parameter_name: 'Crystals', db_name: 'Urine Crystals', reference_range: 'Absent' }
  ],
  'Blood Glucose': [
    { parameter_name: 'FBS', db_name: 'FBS', reference_range: '70-100 mg/dl' },
    { parameter_name: 'RBS', db_name: 'RBS', reference_range: '70-140 mg/dl' },
    { parameter_name: 'PPBS', db_name: 'PPBS', reference_range: '110-160 mg/dl' }
  ],
  'Electrolytes': [
    { parameter_name: 'Na', db_name: 'Sodium', reference_range: '135-145 meq/l' },
    { parameter_name: 'K', db_name: 'Potassium', reference_range: '3.5-5.5 meq/l' },
    { parameter_name: 'Chlorides', db_name: 'Chloride', reference_range: '98-107 meq/l' },
    { parameter_name: 'Mg', db_name: 'Magnesium', reference_range: '1.7-2.2 mg/dL' },
    { parameter_name: 'Sr.Ca', db_name: 'Serum Calcium', reference_range: '8.4-10.8 mg/dl' }
  ],
  'Cardiac Function Tests': [
    { parameter_name: 'CPK', db_name: 'CPK / CK', reference_range: '38-174 IU/L' },
    { parameter_name: 'CPK-MB', db_name: 'CPK-MB', reference_range: '0-24 IU/L' },
    { parameter_name: 'LDH', db_name: 'LDH', reference_range: '140-280 U/L' }
  ],
  'Liver Functions Test': [
    { parameter_name: 'Bili (T)', db_name: 'Total Bilirubin', reference_range: '0.3-1.2 mg/dl' },
    { parameter_name: 'Bili (D)', db_name: 'Direct Bilirubin', reference_range: '0-0.3 mg/dl' },
    { parameter_name: 'Bili (ID)', db_name: 'Indirect Bilirubin', reference_range: '0.2-0.8 mg/dl' },
    { parameter_name: 'SGOT (AST)', db_name: 'SGOT (AST)', reference_range: '6-38 u/l' },
    { parameter_name: 'SGPT (ALT)', db_name: 'SGPT (ALT)', reference_range: '6-38 u/l' },
    { parameter_name: 'Alk. Phos', db_name: 'Alkaline Phosphatase', reference_range: '36-142 mu/ml' },
    { parameter_name: 'Globulin', db_name: 'Globulin', reference_range: '2.0-3.5 g/dL' },
    { parameter_name: 'Albumin', db_name: 'Albumin', reference_range: '3.5-5.0 g/dL' }
  ],
  'Renal Function Tests': [
    { parameter_name: 'Urea', db_name: 'Urea', reference_range: '15-40 mg/dL' },
    { parameter_name: 'S.Cr', db_name: 'Serum Creatinine', reference_range: '0.6-1.1 mg%' },
    { parameter_name: 'Uric acid', db_name: 'Uric Acid', reference_range: '2.6-7.2 mg%' }
  ],
  'Lipid Profile Tests': [
    { parameter_name: 'Total Chol', db_name: 'Total Cholesterol', reference_range: '130-200 mg/dl' },
    { parameter_name: 'HDL', db_name: 'HDL', reference_range: '40-60 mg/dl' },
    { parameter_name: 'LDL', db_name: 'LDL', reference_range: '<100 mg/dl' },
    { parameter_name: 'VLDL', db_name: 'VLDL', reference_range: '5-30 mg/dl' },
    { parameter_name: 'TG', db_name: 'Triglycerides', reference_range: '<150 mg/dl' }
  ],
  'General': [
    { parameter_name: 'General Parameter', db_name: 'General Parameter', reference_range: '0-100' }
  ]
};

// Form Display Name -> Database Parameter Name Bidirectional Map
export const FORM_TO_DB_PARAM_ALIAS_MAP = {
  'Hb': 'Hb',
  'Hb %': 'Hb',
  'RBC': 'RBC Count',
  'RBC Count': 'RBC Count',
  'WBC': 'WBC Count',
  'WBC Count': 'WBC Count',
  'Na': 'Sodium',
  'Sodium': 'Sodium',
  'Serum Sodium (Na+)': 'Sodium',
  'K': 'Potassium',
  'Potassium': 'Potassium',
  'Serum Potassium (K+)': 'Potassium',
  'Chlorides': 'Chloride',
  'Chloride': 'Chloride',
  'Mg': 'Magnesium',
  'Magnesium': 'Magnesium',
  'Sr.Ca': 'Serum Calcium',
  'Serum Calcium': 'Serum Calcium',
  'CPK': 'CPK / CK',
  'CPK / CK': 'CPK / CK',
  'CPK-MB': 'CPK-MB',
  'LDH': 'LDH',
  'Bili (T)': 'Total Bilirubin',
  'Total Bilirubin': 'Total Bilirubin',
  'Bilirubin Total': 'Total Bilirubin',
  'Bili (D)': 'Direct Bilirubin',
  'Direct Bilirubin': 'Direct Bilirubin',
  'Bilirubin Direct': 'Direct Bilirubin',
  'Bili (ID)': 'Indirect Bilirubin',
  'Indirect Bilirubin': 'Indirect Bilirubin',
  'Bilirubin Indirect': 'Indirect Bilirubin',
  'Alk. Phos': 'Alkaline Phosphatase',
  'Alkaline Phosphatase': 'Alkaline Phosphatase',
  'S.Cr': 'Serum Creatinine',
  'Serum Creatinine': 'Serum Creatinine',
  'Total Chol': 'Total Cholesterol',
  'Total Cholesterol': 'Total Cholesterol',
  'TG': 'Triglycerides',
  'Triglycerides': 'Triglycerides',
  'Color': 'Urine Colour',
  'Urine Colour': 'Urine Colour',
  'Urine Color': 'Urine Colour',
  'Sugar': 'Urine Glucose / Sugar',
  'Glucose': 'Urine Glucose / Sugar',
  'Urine Glucose / Sugar': 'Urine Glucose / Sugar',
  'Blood': 'Urine Blood',
  'Urine Blood': 'Urine Blood',
  'Epi. Cells': 'Epithelial Cells',
  'Epi Cells': 'Epithelial Cells',
  'Epithelial Cells': 'Epithelial Cells',
  'Proteins': 'Urine Protein',
  'Urine Protein': 'Urine Protein',
  'PCV': 'PCV',
  'PCV / Haematocrit': 'PCV',
  'CT': 'CT — Clotting Time',
  'CT — Clotting Time': 'CT — Clotting Time',
  'BT': 'BT — Bleeding Time',
  'BT — Bleeding Time': 'BT — Bleeding Time',
  'Specific gravity': 'Urine Specific Gravity',
  'Specific Gravity': 'Urine Specific Gravity',
  'Urine Specific Gravity': 'Urine Specific Gravity',
  'pH': 'Urine pH',
  'Urine pH': 'Urine pH',
  'Transparency': 'Urine Transparency',
  'Urine Transparency': 'Urine Transparency',
  'Crystals': 'Urine Crystals',
  'Urine Crystals': 'Urine Crystals'
};

// Database Parameter Name -> Form Display Name Map
export const DB_TO_FORM_PARAM_DISPLAY_MAP = {
  'Hb': 'Hb',
  'RBC Count': 'RBC',
  'WBC Count': 'WBC',
  'Sodium': 'Na',
  'Potassium': 'K',
  'Chloride': 'Chlorides',
  'Magnesium': 'Mg',
  'Serum Calcium': 'Sr.Ca',
  'CPK / CK': 'CPK',
  'CPK-MB': 'CPK-MB',
  'LDH': 'LDH',
  'Total Bilirubin': 'Bili (T)',
  'Direct Bilirubin': 'Bili (D)',
  'Indirect Bilirubin': 'Bili (ID)',
  'Alkaline Phosphatase': 'Alk. Phos',
  'Serum Creatinine': 'S.Cr',
  'Total Cholesterol': 'Total Chol',
  'Triglycerides': 'TG',
  'Urine Colour': 'Color',
  'Urine Glucose / Sugar': 'Sugar',
  'Urine Blood': 'Blood',
  'Epithelial Cells': 'Epi. Cells',
  'Urine Protein': 'Proteins',
  'PCV': 'PCV',
  'CT — Clotting Time': 'CT',
  'BT — Bleeding Time': 'BT',
  'Urine Specific Gravity': 'Specific gravity',
  'Urine pH': 'pH',
  'Urine Transparency': 'Transparency',
  'Urine Crystals': 'Crystals'
};

/**
 * Normalizes any form parameter or alias to the official DB Parameter Name in public.lab_parameter_knowledge
 */
export const normalizeLabParamNameToDbName = (paramName) => {
  if (!paramName) return '';
  const trimmed = String(paramName).trim();
  if (FORM_TO_DB_PARAM_ALIAS_MAP[trimmed]) {
    return FORM_TO_DB_PARAM_ALIAS_MAP[trimmed];
  }
  // Case-insensitive fallback
  const lower = trimmed.toLowerCase();
  for (const [key, dbVal] of Object.entries(FORM_TO_DB_PARAM_ALIAS_MAP)) {
    if (key.toLowerCase() === lower) return dbVal;
  }
  return trimmed;
};

/**
 * Normalizes any DB Parameter Name to the official Form Display Name for Student Entry UI
 */
export const getFormDisplayNameForDbParam = (dbName) => {
  if (!dbName) return '';
  const trimmed = String(dbName).trim();
  if (DB_TO_FORM_PARAM_DISPLAY_MAP[trimmed]) {
    return DB_TO_FORM_PARAM_DISPLAY_MAP[trimmed];
  }
  // Case-insensitive fallback
  const lower = trimmed.toLowerCase();
  for (const [key, formVal] of Object.entries(DB_TO_FORM_PARAM_DISPLAY_MAP)) {
    if (key.toLowerCase() === lower) return formVal;
  }
  return trimmed;
};
