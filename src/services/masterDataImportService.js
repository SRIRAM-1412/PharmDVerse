import * as XLSX from 'xlsx';
import { normalizeDrugSearchInput } from './supabaseService.js';

const VALID_LAB_CATEGORIES = new Set([
  'haematology', 'renal function', 'liver function', 'electrolytes',
  'glycaemic control', 'lipid profile', 'inflammatory markers',
  'coagulation profile', 'cardiometabolic & endocrine', 'arterial blood gas (abg)',
  'other', 'general'
]);

const VALID_LAB_EVAL_TYPES = new Set([
  'high/low', 'positive/negative', 'present/absent', 'qualitative/descriptive'
]);

const VALID_SEVERITIES = new Set([
  'major', 'severe', 'critical', 'moderate', 'minor', 'high', 'low'
]);

const parseBoolean = (val, defaultVal = true) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  const s = String(val).trim().toUpperCase();
  if (s === 'TRUE' || s === '1' || s === 'YES' || s === 'ACTIVE' || val === true) return true;
  if (s === 'FALSE' || s === '0' || s === 'NO' || s === 'INACTIVE' || val === false) return false;
  return defaultVal;
};

/**
 * Download Excel Template for Master Data
 */
export const downloadMasterExcelTemplate = (masterType) => {
  
  let platformPrefix = 'PharmDVerse';
  try {
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem('pharmdverse_platform_settings_cache') : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.platform_name) platformPrefix = parsed.platform_name.replace(/[^a-zA-Z0-9]/g, '');
    }
  } catch (e) {}
  
  let filename = `${platformPrefix}_Template.xlsx`;

  let sheetName = '';
  let headers = [];
  let sampleRow = {};

  switch (masterType) {
    case 'drug_knowledge':
      filename = `${platformPrefix}_Drug_Knowledge_Template.xlsx`;
      sheetName = 'Drug Knowledge Master';
      headers = [
        'generic_name', 'brand_names', 'primary_drug_class', 'additional_drug_classes',
        'established_uses', 'mechanism_of_action', 'normal_dose_range',
        'contraindications', 'side_effects_adverse_effects', 'monitoring_parameters', 'is_active'
      ];
      sampleRow = {
        generic_name: 'Paracetamol',
        brand_names: 'Dolo 650, Crocin, Calpol',
        primary_drug_class: 'Non-Opioid Analgesic & Antipyretic',
        additional_drug_classes: 'Central Cyclooxygenase Inhibitor',
        established_uses: 'Symptomatic management of fever and mild-to-moderate pain.',
        mechanism_of_action: 'Inhibits central CNS cyclooxygenase enzymes, suppressing hypothalamic PGE2 synthesis.',
        normal_dose_range: '500 mg – 650 mg Oral Q4-6H PRN (max 4,000 mg/day)',
        contraindications: 'Severe hepatic impairment, active severe liver disease.',
        side_effects_adverse_effects: 'Hepatotoxicity (overdose), rare hypersensitivity skin reactions.',
        monitoring_parameters: 'Total daily acetaminophen intake, liver function tests (LFTs) in chronic use.',
        is_active: 'TRUE'
      };
      break;

    case 'lab_knowledge':
      filename = `${platformPrefix}_Lab_Parameter_Template.xlsx`;
      sheetName = 'Lab Parameter Master';
      headers = [
        'parameter_name', 'category', 'evaluation_type', 'increased_significance',
        'decreased_significance', 'positive_significance', 'negative_significance',
        'present_significance', 'absent_significance', 'context_notes', 'source_reference', 'is_active'
      ];
      sampleRow = {
        parameter_name: 'Serum Creatinine',
        category: 'Renal Function',
        evaluation_type: 'High/Low',
        increased_significance: 'Indicates acute kidney injury (AKI), chronic renal disease, or urinary tract obstruction.',
        decreased_significance: 'Decreased muscle mass, severe liver disease, or malnutrition.',
        positive_significance: '',
        negative_significance: '',
        present_significance: '',
        absent_significance: '',
        context_notes: 'Evaluate baseline serum creatinine before prescribing nephrotoxic drugs.',
        source_reference: 'NFI, BNF',
        is_active: 'TRUE'
      };
      break;

    case 'other_inv_knowledge':
      filename = `${platformPrefix}_Other_Investigation_Template.xlsx`;
      sheetName = 'Other Investigation Master';
      headers = [
        'investigation_name', 'category', 'description', 'expected_findings',
        'clinical_significance', 'is_active'
      ];
      sampleRow = {
        investigation_name: '12-Lead Electrocardiogram (ECG)',
        category: 'Cardiac',
        description: 'Standard 12-lead non-invasive cardiac electrical activity recording.',
        expected_findings: 'Normal sinus rhythm, heart rate 60-100 bpm, normal PR/QRS/QTc intervals.',
        clinical_significance: 'Identifies myocardial ischemia, infarction, arrhythmias, and drug-induced QTc prolongation.',
        is_active: 'TRUE'
      };
      break;

    case 'ddi_knowledge':
      filename = `${platformPrefix}_Drug_Drug_Interaction_Template.xlsx`;
      sheetName = 'Drug-Drug Interaction Master';
      headers = [
        'drug_a_generic', 'drug_b_generic', 'interaction_description', 'mechanism',
        'clinical_significance', 'severity', 'management', 'monitoring', 'source_reference', 'is_active'
      ];
      sampleRow = {
        drug_a_generic: 'Digoxin',
        drug_b_generic: 'Diltiazem',
        interaction_description: 'Diltiazem inhibits renal P-glycoprotein efflux and decreases renal clearance of Digoxin.',
        mechanism: 'P-glycoprotein transporter inhibition and additive AV nodal dromotropic slowing.',
        clinical_significance: '20-50% increase in serum Digoxin levels and heightened risk of severe AV block.',
        severity: 'Major',
        management: 'Reduce Digoxin dose by 25-50% and monitor serum Digoxin trough levels.',
        monitoring: 'Resting heart rate, periodic ECGs, and serum Digoxin trough concentrations.',
        source_reference: 'BNF, NFI',
        is_active: 'TRUE'
      };
      break;

    case 'dfi_knowledge':
      filename = `${platformPrefix}_Drug_Food_Interaction_Template.xlsx`;
      sheetName = 'Drug-Food Interaction Master';
      headers = [
        'drug_generic', 'food_or_beverage', 'interaction_description', 'mechanism',
        'clinical_significance', 'severity', 'management', 'counselling_point', 'source_reference', 'is_active'
      ];
      sampleRow = {
        drug_generic: 'Atorvastatin',
        food_or_beverage: 'Grapefruit Juice',
        interaction_description: 'Grapefruit juice inhibits intestinal CYP3A4 metabolism, increasing statin exposure.',
        mechanism: 'Furanocoumarins irreversibly block intestinal CYP3A4 enzymes.',
        clinical_significance: 'Substantially increases systemic statin AUC, escalating myopathy and rhabdomyolysis risk.',
        severity: 'Major',
        management: 'Advise patient to avoid consuming grapefruit or grapefruit juice (>200 mL/day).',
        counselling_point: 'Do not drink grapefruit juice while taking Atorvastatin to prevent severe muscle damage.',
        source_reference: 'BNF, USP',
        is_active: 'TRUE'
      };
      break;

    default:
      throw new Error(`Unsupported master type: ${masterType}`);
  }

  // Create Workbook and Sheet
  const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  
  // Set column widths
  worksheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 5, 20) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

/**
 * Parse & Validate Excel file for Master Data Import
 */
export const parseAndValidateMasterExcel = async (file, masterType, existingRecords = []) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          return resolve({
            success: false,
            error: 'The uploaded Excel file contains no data rows.',
            totalRows: 0, validCount: 0, duplicateCount: 0, errorCount: 0,
            validRecords: [], rowsWithStatus: []
          });
        }

        // Build Existing Duplicate Sets
        const existingKeys = new Set();
        (existingRecords || []).forEach(r => {
          if (masterType === 'drug_knowledge') {
            const k = r.normalized_name || normalizeDrugSearchInput(r.generic_name);
            if (k) existingKeys.add(k);
          } else if (masterType === 'lab_knowledge' || masterType === 'other_inv_knowledge') {
            const k = r.normalized_name || normalizeDrugSearchInput(r.parameter_name || r.investigation_name);
            if (k) existingKeys.add(k);
          } else if (masterType === 'ddi_knowledge') {
            if (r.pair_key) existingKeys.add(r.pair_key);
            else {
              const normA = normalizeDrugSearchInput(r.drug_a_generic);
              const normB = normalizeDrugSearchInput(r.drug_b_generic);
              if (normA && normB) existingKeys.add([normA, normB].sort().join(':::'));
            }
          } else if (masterType === 'dfi_knowledge') {
            const normDrug = r.drug_normalized || normalizeDrugSearchInput(r.drug_generic);
            const normFood = r.food_normalized || normalizeDrugSearchInput(r.food_or_beverage);
            if (normDrug && normFood) existingKeys.add(`${normDrug}:::${normFood}`);
          }
        });

        const fileKeysSeen = new Set();
        const validRecords = [];
        const rowsWithStatus = [];

        let validCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2; // Row 1 is header
          const rowStatus = {
            rowNum,
            rawData: row,
            status: 'VALID', // 'VALID' | 'DUPLICATE' | 'ERROR'
            errorDetails: [],
            recordToInsert: null
          };

          if (masterType === 'drug_knowledge') {
            const genericName = String(row.generic_name || '').trim();
            if (!genericName) {
              rowStatus.status = 'ERROR';
              rowStatus.errorDetails.push('Missing required column: "generic_name".');
            } else {
              const norm = normalizeDrugSearchInput(genericName);
              if (fileKeysSeen.has(norm)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Duplicate generic drug "${genericName}" within uploaded Excel file.`);
              } else if (existingKeys.has(norm)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Drug "${genericName}" already exists in public.drug_knowledge database.`);
              } else {
                fileKeysSeen.add(norm);
                rowStatus.recordToInsert = {
                  generic_name: genericName,
                  normalized_name: norm,
                  brand_names: String(row.brand_names || '').trim() || null,
                  primary_drug_class: String(row.primary_drug_class || '').trim() || null,
                  additional_drug_classes: String(row.additional_drug_classes || '').trim() || null,
                  established_uses: String(row.established_uses || '').trim() || null,
                  mechanism_of_action: String(row.mechanism_of_action || '').trim() || null,
                  normal_dose_range: String(row.normal_dose_range || '').trim() || null,
                  contraindications: String(row.contraindications || '').trim() || null,
                  side_effects_adverse_effects: String(row.side_effects_adverse_effects || '').trim() || null,
                  monitoring_parameters: String(row.monitoring_parameters || '').trim() || null,
                  is_active: parseBoolean(row.is_active, true)
                };
              }
            }

          } else if (masterType === 'lab_knowledge') {
            const paramName = String(row.parameter_name || '').trim();
            const category = String(row.category || '').trim();
            const evalType = String(row.evaluation_type || '').trim();

            if (!paramName) rowStatus.errorDetails.push('Missing required column: "parameter_name".');
            if (!category) rowStatus.errorDetails.push('Missing required column: "category".');
            else if (!VALID_LAB_CATEGORIES.has(category.toLowerCase())) {
              rowStatus.errorDetails.push(`Invalid category "${category}". Must be one of standard 10 lab categories.`);
            }

            if (!evalType) rowStatus.errorDetails.push('Missing required column: "evaluation_type".');
            else if (!VALID_LAB_EVAL_TYPES.has(evalType.toLowerCase())) {
              rowStatus.errorDetails.push(`Invalid evaluation_type "${evalType}". Expected: High/Low, Positive/Negative, Present/Absent, or Qualitative/Descriptive.`);
            }

            if (rowStatus.errorDetails.length > 0) {
              rowStatus.status = 'ERROR';
            } else {
              const norm = normalizeDrugSearchInput(paramName);
              if (fileKeysSeen.has(norm)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Duplicate parameter "${paramName}" within uploaded Excel file.`);
              } else if (existingKeys.has(norm)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Lab parameter "${paramName}" already exists in public.lab_parameter_knowledge database.`);
              } else {
                fileKeysSeen.add(norm);
                rowStatus.recordToInsert = {
                  parameter_name: paramName,
                  normalized_name: norm,
                  category: category,
                  evaluation_type: evalType,
                  increased_significance: String(row.increased_significance || '').trim() || null,
                  decreased_significance: String(row.decreased_significance || '').trim() || null,
                  positive_significance: String(row.positive_significance || '').trim() || null,
                  negative_significance: String(row.negative_significance || '').trim() || null,
                  present_significance: String(row.present_significance || '').trim() || null,
                  absent_significance: String(row.absent_significance || '').trim() || null,
                  context_notes: String(row.context_notes || '').trim() || null,
                  source_reference: String(row.source_reference || '').trim() || 'BNF, NFI',
                  is_active: parseBoolean(row.is_active, true)
                };
              }
            }

          } else if (masterType === 'other_inv_knowledge') {
            const invName = String(row.investigation_name || '').trim();
            const category = String(row.category || '').trim();

            if (!invName) rowStatus.errorDetails.push('Missing required column: "investigation_name".');
            if (!category) rowStatus.errorDetails.push('Missing required column: "category".');

            if (rowStatus.errorDetails.length > 0) {
              rowStatus.status = 'ERROR';
            } else {
              const norm = normalizeDrugSearchInput(invName);
              if (fileKeysSeen.has(norm)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Duplicate investigation "${invName}" within uploaded Excel file.`);
              } else if (existingKeys.has(norm)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Investigation "${invName}" already exists in public.other_investigation_knowledge database.`);
              } else {
                fileKeysSeen.add(norm);
                rowStatus.recordToInsert = {
                  investigation_name: invName,
                  normalized_name: norm,
                  category: category,
                  description: String(row.description || '').trim() || null,
                  expected_findings: String(row.expected_findings || '').trim() || null,
                  clinical_significance: String(row.clinical_significance || '').trim() || null,
                  is_active: parseBoolean(row.is_active, true)
                };
              }
            }

          } else if (masterType === 'ddi_knowledge') {
            const drugA = String(row.drug_a_generic || '').trim();
            const drugB = String(row.drug_b_generic || '').trim();
            const desc = String(row.interaction_description || '').trim();
            const severity = String(row.severity || 'Major').trim();

            if (!drugA) rowStatus.errorDetails.push('Missing required column: "drug_a_generic".');
            if (!drugB) rowStatus.errorDetails.push('Missing required column: "drug_b_generic".');
            if (!desc) rowStatus.errorDetails.push('Missing required column: "interaction_description".');
            if (!VALID_SEVERITIES.has(severity.toLowerCase())) {
              rowStatus.errorDetails.push(`Invalid severity "${severity}". Expected: Major, Severe, Critical, Moderate, or Minor.`);
            }

            if (rowStatus.errorDetails.length > 0) {
              rowStatus.status = 'ERROR';
            } else {
              const normA = normalizeDrugSearchInput(drugA);
              const normB = normalizeDrugSearchInput(drugB);
              const pairKey = [normA, normB].sort().join(':::');

              if (fileKeysSeen.has(pairKey)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Duplicate interaction pair (${drugA} + ${drugB}) within uploaded Excel file.`);
              } else if (existingKeys.has(pairKey)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Interaction pair (${drugA} + ${drugB}) already exists in public.drug_drug_interaction_knowledge database.`);
              } else {
                fileKeysSeen.add(pairKey);
                rowStatus.recordToInsert = {
                  drug_a_generic: drugA,
                  drug_a_normalized: normA,
                  drug_b_generic: drugB,
                  drug_b_normalized: normB,
                  pair_key: pairKey,
                  interaction_description: desc,
                  mechanism: String(row.mechanism || '').trim() || null,
                  clinical_significance: String(row.clinical_significance || '').trim() || null,
                  severity: severity,
                  management: String(row.management || '').trim() || null,
                  monitoring: String(row.monitoring || '').trim() || null,
                  source_reference: String(row.source_reference || '').trim() || 'BNF, NFI',
                  is_active: parseBoolean(row.is_active, true)
                };
              }
            }

          } else if (masterType === 'dfi_knowledge') {
            const drug = String(row.drug_generic || '').trim();
            const food = String(row.food_or_beverage || '').trim();
            const desc = String(row.interaction_description || '').trim();
            const severity = String(row.severity || 'Major').trim();

            if (!drug) rowStatus.errorDetails.push('Missing required column: "drug_generic".');
            if (!food) rowStatus.errorDetails.push('Missing required column: "food_or_beverage".');
            if (!desc) rowStatus.errorDetails.push('Missing required column: "interaction_description".');
            if (!VALID_SEVERITIES.has(severity.toLowerCase())) {
              rowStatus.errorDetails.push(`Invalid severity "${severity}". Expected: Major, Severe, Critical, Moderate, or Minor.`);
            }

            if (rowStatus.errorDetails.length > 0) {
              rowStatus.status = 'ERROR';
            } else {
              const normDrug = normalizeDrugSearchInput(drug);
              const normFood = normalizeDrugSearchInput(food);
              const pairKey = `${normDrug}:::${normFood}`;

              if (fileKeysSeen.has(pairKey)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Duplicate drug-food pair (${drug} + ${food}) within uploaded Excel file.`);
              } else if (existingKeys.has(pairKey)) {
                rowStatus.status = 'DUPLICATE';
                rowStatus.errorDetails.push(`Drug-Food interaction (${drug} + ${food}) already exists in public.drug_food_interaction_knowledge database.`);
              } else {
                fileKeysSeen.add(pairKey);
                rowStatus.recordToInsert = {
                  drug_generic: drug,
                  drug_normalized: normDrug,
                  food_or_beverage: food,
                  food_normalized: normFood,
                  interaction_description: desc,
                  mechanism: String(row.mechanism || '').trim() || null,
                  clinical_significance: String(row.clinical_significance || '').trim() || null,
                  severity: severity,
                  management: String(row.management || '').trim() || null,
                  counselling_point: String(row.counselling_point || '').trim() || null,
                  source_reference: String(row.source_reference || '').trim() || 'BNF, USP',
                  is_active: parseBoolean(row.is_active, true)
                };
              }
            }
          }

          rowsWithStatus.push(rowStatus);
          if (rowStatus.status === 'VALID' && rowStatus.recordToInsert) {
            validCount++;
            validRecords.push(rowStatus.recordToInsert);
          } else if (rowStatus.status === 'DUPLICATE') {
            duplicateCount++;
          } else if (rowStatus.status === 'ERROR') {
            errorCount++;
          }
        });

        resolve({
          success: true,
          totalRows: rawRows.length,
          validCount,
          duplicateCount,
          errorCount,
          validRecords,
          rowsWithStatus
        });

      } catch (err) {
        resolve({
          success: false,
          error: `Excel parse failure: ${err.message}`,
          totalRows: 0, validCount: 0, duplicateCount: 0, errorCount: 0,
          validRecords: [], rowsWithStatus: []
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read the selected file.',
        totalRows: 0, validCount: 0, duplicateCount: 0, errorCount: 0,
        validRecords: [], rowsWithStatus: []
      });
    };

    reader.readAsArrayBuffer(file);
  });
};
