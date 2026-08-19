import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const KNOWLEDGE_RECORDS = [
  {
    parameter_name: 'Hb',
    normalized_name: 'hb',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Dehydration/haemoconcentration, polycythaemia and chronic hypoxic states.',
    decreased_significance: 'Anaemia, blood loss, haemolysis, nutritional deficiency, chronic disease and bone-marrow disorders.',
    context_notes: 'Interpret with RBC count, PCV and red-cell indices.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'RBC Count',
    normalized_name: 'rbc_count',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Polycythaemia, dehydration/haemoconcentration and chronic hypoxia.',
    decreased_significance: 'Anaemia, blood loss, haemolysis, nutritional deficiency and bone-marrow suppression.',
    context_notes: 'Interpret with Hb and PCV.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'WBC Count',
    normalized_name: 'wbc_count',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Infection, inflammation, tissue injury, physiological stress, corticosteroid effect and some haematological disorders.',
    decreased_significance: 'Some viral infections, bone-marrow suppression, cytotoxic therapy, severe systemic illness and selected immune/nutritional disorders.',
    context_notes: 'Total WBC alone does not establish infection; correlate with differential count and clinical findings.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Neutrophils',
    normalized_name: 'neutrophils',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Bacterial infection, acute inflammation, tissue injury, stress response and corticosteroid effect.',
    decreased_significance: 'Viral infection, bone-marrow suppression, cytotoxic drugs and some severe systemic infections.',
    context_notes: 'Interpret with total WBC and clinical condition.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Lymphocytes',
    normalized_name: 'lymphocytes',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Viral infections, some chronic infections and selected lymphoproliferative disorders.',
    decreased_significance: 'Immunodeficiency, corticosteroid effect, severe systemic illness and some bone-marrow disorders.',
    context_notes: 'Interpret according to age and clinical condition.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Eosinophils',
    normalized_name: 'eosinophils',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Allergic disorders, parasitic infections, drug hypersensitivity and selected inflammatory/haematological disorders.',
    decreased_significance: 'Usually limited isolated significance; may occur with corticosteroid effect or acute stress.',
    context_notes: 'Interpret with clinical history and other differential-count findings.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Monocytes',
    normalized_name: 'monocytes',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Chronic infections, chronic inflammatory disorders, recovery from some acute infections and selected haematological disorders.',
    decreased_significance: 'Usually limited isolated significance; may occur with marrow suppression or corticosteroid effect.',
    context_notes: 'Interpret with clinical history and total leukocyte count.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'MCV',
    normalized_name: 'mcv',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Macrocytosis, vitamin B12/folate deficiency, liver disease, alcohol-related disorders, hypothyroidism and some medicines.',
    decreased_significance: 'Iron deficiency, thalassaemia and other microcytic anaemias.',
    context_notes: 'Interpret with Hb, MCH and MCHC.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'MCH',
    normalized_name: 'mch',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Often associated with macrocytosis and macrocytic anaemia.',
    decreased_significance: 'Iron deficiency, microcytic/hypochromic anaemia and thalassaemia.',
    context_notes: 'Interpret with MCV and MCHC.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'MCHC',
    normalized_name: 'mchc',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'May occur in hereditary spherocytosis and selected situations.',
    decreased_significance: 'Iron deficiency and hypochromic anaemia.',
    context_notes: 'Correlate with other red-cell indices.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'ESR',
    normalized_name: 'esr',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Inflammation, infection, autoimmune/inflammatory disorders, some malignancies and some non-inflammatory conditions such as anaemia.',
    decreased_significance: 'Usually limited clinical significance; may occur with certain erythrocyte abnormalities.',
    context_notes: 'ESR is nonspecific and must not be used alone to diagnose disease.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Platelets',
    normalized_name: 'platelets',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Reactive inflammation/infection, iron deficiency, tissue injury and myeloproliferative disorders.',
    decreased_significance: 'Immune thrombocytopenia, marrow suppression, drug-related thrombocytopenia, severe infection/sepsis and increased platelet destruction.',
    context_notes: 'Clinical significance depends on severity and bleeding/thrombotic risk.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'PCV / Haematocrit',
    normalized_name: 'pcv_haematocrit',
    category: 'Haematology',
    evaluation_type: 'numeric',
    increased_significance: 'Dehydration, polycythaemia and chronic hypoxic states.',
    decreased_significance: 'Anaemia, blood loss, haemolysis and overhydration.',
    context_notes: 'Interpret with Hb and RBC count.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'CT — Clotting Time',
    normalized_name: 'ct_clotting_time',
    category: 'Coagulation',
    evaluation_type: 'numeric',
    increased_significance: 'Coagulation abnormalities, severe clotting-factor deficiency and some anticoagulant effects.',
    decreased_significance: 'Usually limited isolated clinical significance.',
    context_notes: 'CT is a general/older coagulation assessment and should not replace specific coagulation testing where indicated.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'BT — Bleeding Time',
    normalized_name: 'bt_bleeding_time',
    category: 'Coagulation',
    evaluation_type: 'numeric',
    increased_significance: 'Platelet disorders, thrombocytopenia, platelet-function disorders and some antiplatelet-drug effects.',
    decreased_significance: 'Usually not clinically significant in isolation.',
    context_notes: 'Bleeding time has limited modern clinical use.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'PT',
    normalized_name: 'pt',
    category: 'Coagulation',
    evaluation_type: 'numeric',
    increased_significance: 'Vitamin K deficiency, warfarin effect, liver dysfunction, coagulation-factor deficiency and DIC.',
    decreased_significance: 'Usually limited clinical significance in isolation.',
    context_notes: 'INR is generally used for monitoring vitamin-K antagonist therapy.',
    source_reference: "Davidson's Medicine; KD Tripathi"
  },
  {
    parameter_name: 'APTT',
    normalized_name: 'aptt',
    category: 'Coagulation',
    evaluation_type: 'numeric',
    increased_significance: 'Heparin effect, intrinsic-pathway factor deficiencies, lupus anticoagulant, acquired coagulation disorders and severe liver disease/DIC.',
    decreased_significance: 'Usually limited isolated significance.',
    context_notes: 'Interpret with clinical bleeding risk and heparin therapy.',
    source_reference: "Davidson's Medicine; KD Tripathi"
  },
  {
    parameter_name: 'TSH',
    normalized_name: 'tsh',
    category: 'Thyroid Function',
    evaluation_type: 'numeric',
    increased_significance: 'Primary hypothyroidism.',
    decreased_significance: 'Hyperthyroidism, excess thyroid hormone replacement and selected pituitary/hypothalamic disorders.',
    context_notes: 'Interpret with Free T4 and clinical findings.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Free T4',
    normalized_name: 'free_t4',
    category: 'Thyroid Function',
    evaluation_type: 'numeric',
    increased_significance: 'Hyperthyroidism, excess thyroid hormone replacement and some thyroiditis phases.',
    decreased_significance: 'Primary or central hypothyroidism.',
    context_notes: 'Interpret with TSH.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Total T3',
    normalized_name: 'total_t3',
    category: 'Thyroid Function',
    evaluation_type: 'numeric',
    increased_significance: 'Hyperthyroidism and T3-predominant thyrotoxicosis.',
    decreased_significance: 'Hypothyroidism in some cases and non-thyroidal/severe systemic illness.',
    context_notes: 'Protein-binding and systemic illness can affect interpretation.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Urine Colour',
    normalized_name: 'urine_colour',
    category: 'Urinalysis',
    evaluation_type: 'present_absent',
    present_significance: 'Abnormal colour may occur with dehydration, haematuria, bilirubin, medications, foods or pigments.',
    absent_significance: 'Normal pale yellow / amber color.',
    context_notes: 'Abnormal colour may occur with dehydration, haematuria, bilirubin, medications, foods or pigments. Colour alone does not establish a diagnosis.',
    source_reference: 'Harsh Mohan Pathology'
  },
  {
    parameter_name: 'Urine Specific Gravity',
    normalized_name: 'urine_specific_gravity',
    category: 'Urinalysis',
    evaluation_type: 'numeric',
    increased_significance: 'Dehydration, glycosuria, proteinuria and increased urinary solute concentration.',
    decreased_significance: 'Excess fluid intake, impaired renal concentrating ability, diabetes insipidus and some renal disorders.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Urine pH',
    normalized_name: 'urine_ph',
    category: 'Urinalysis',
    evaluation_type: 'numeric',
    increased_significance: 'More alkaline urine may occur with some urinary infections, dietary factors and selected renal tubular disorders.',
    decreased_significance: 'More acidic urine may occur with high-protein intake, metabolic acidosis and starvation.',
    context_notes: 'Urine pH varies physiologically and should not be interpreted alone.',
    source_reference: 'Harsh Mohan Pathology'
  },
  {
    parameter_name: 'Urine Glucose / Sugar',
    normalized_name: 'urine_glucose_sugar',
    category: 'Urinalysis',
    evaluation_type: 'positive_negative',
    positive_significance: 'Diabetes mellitus, reduced renal glucose threshold, SGLT2 inhibitor therapy and selected physiological states.',
    negative_significance: 'No detectable urinary glucose under the test conditions.',
    context_notes: 'Negative urine glucose does not exclude diabetes; blood glucose testing is more appropriate for assessment.',
    source_reference: 'Harsh Mohan Pathology; KD Tripathi'
  },
  {
    parameter_name: 'Urine Blood',
    normalized_name: 'urine_blood',
    category: 'Urinalysis',
    evaluation_type: 'positive_negative',
    positive_significance: 'Haematuria, urinary stones, infection, renal disease, trauma and other urinary tract pathology.',
    negative_significance: 'No detectable blood under the test conditions.',
    context_notes: 'Correlate dipstick findings with urine microscopy.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Pus Cells',
    normalized_name: 'pus_cells',
    category: 'Urinalysis',
    evaluation_type: 'present_absent',
    present_significance: 'Pyuria, urinary tract infection and urinary tract inflammation.',
    absent_significance: 'No significant pus cells detected.',
    context_notes: 'Interpret with symptoms, urine microscopy and culture where appropriate.',
    source_reference: 'Harsh Mohan Pathology'
  },
  {
    parameter_name: 'Urine RBC',
    normalized_name: 'urine_rbc',
    category: 'Urinalysis',
    evaluation_type: 'present_absent',
    present_significance: 'Haematuria, urinary stones, infection, renal disease, trauma and other urinary tract pathology.',
    absent_significance: 'No significant RBCs detected.',
    source_reference: 'Harsh Mohan Pathology'
  },
  {
    parameter_name: 'Ketone Bodies',
    normalized_name: 'ketone_bodies',
    category: 'Urinalysis',
    evaluation_type: 'positive_negative',
    positive_significance: 'Diabetic ketoacidosis, fasting/starvation, prolonged vomiting, very-low-carbohydrate intake and other states of increased fat metabolism.',
    negative_significance: 'No detectable ketones.',
    context_notes: 'Correlate with blood glucose and clinical condition.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Epithelial Cells',
    normalized_name: 'epithelial_cells',
    category: 'Urinalysis',
    evaluation_type: 'present_absent',
    present_significance: 'May reflect contamination, epithelial shedding or urinary tract inflammation.',
    absent_significance: 'No significant epithelial cells detected.',
    context_notes: 'Type and quantity are important for interpretation.',
    source_reference: 'Harsh Mohan Pathology'
  },
  {
    parameter_name: 'Urine Protein',
    normalized_name: 'urine_protein',
    category: 'Urinalysis',
    evaluation_type: 'positive_negative',
    positive_significance: 'Proteinuria, renal disease, diabetes-related renal involvement, hypertension-related renal injury and transient proteinuria.',
    negative_significance: 'No detectable protein under the test conditions.',
    context_notes: 'Persistent proteinuria requires appropriate quantitative assessment.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Bile Salts/Pigments',
    normalized_name: 'bile_salts_pigments',
    category: 'Urinalysis',
    evaluation_type: 'positive_negative',
    positive_significance: 'May occur with conjugated hyperbilirubinaemia and cholestatic/hepatobiliary disorders.',
    negative_significance: 'No detectable urinary bile salts/pigments.',
    context_notes: 'Interpret with serum bilirubin and liver-function findings.',
    source_reference: "Harsh Mohan Pathology; Davidson's Medicine"
  },
  {
    parameter_name: 'Urine Transparency',
    normalized_name: 'urine_transparency',
    category: 'Urinalysis',
    evaluation_type: 'present_absent',
    present_significance: 'Cloudiness may occur due to cells, crystals, microorganisms, mucus or other substances.',
    absent_significance: 'No obvious turbidity.',
    context_notes: 'Cloudiness alone does not establish UTI.',
    source_reference: 'Harsh Mohan Pathology'
  },
  {
    parameter_name: 'Urine Crystals',
    normalized_name: 'urine_crystals',
    category: 'Urinalysis',
    evaluation_type: 'present_absent',
    present_significance: 'May occur with crystalluria, concentrated urine or certain metabolic/drug-related conditions. Some crystals may be clinically insignificant.',
    absent_significance: 'No crystals detected.',
    context_notes: 'Crystal type is important; presence alone does not establish renal stone disease.',
    source_reference: 'Harsh Mohan Pathology'
  },
  {
    parameter_name: 'FBS',
    normalized_name: 'fbs',
    category: 'Blood Glucose',
    evaluation_type: 'numeric',
    increased_significance: 'Diabetes mellitus, impaired glucose regulation, stress hyperglycaemia and selected drug/endocrine conditions.',
    decreased_significance: 'Hypoglycaemia, excess glucose-lowering therapy, prolonged fasting and selected endocrine/hepatic disorders.',
    context_notes: 'Interpret only after confirming appropriate fasting status.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'RBS',
    normalized_name: 'rbs',
    category: 'Blood Glucose',
    evaluation_type: 'numeric',
    increased_significance: 'Diabetes mellitus, stress hyperglycaemia, acute illness and selected drug/endocrine conditions.',
    decreased_significance: 'Hypoglycaemia, excess glucose-lowering therapy and prolonged fasting.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'PPBS',
    normalized_name: 'ppbs',
    category: 'Blood Glucose',
    evaluation_type: 'numeric',
    increased_significance: 'Diabetes mellitus and impaired postprandial glucose regulation.',
    decreased_significance: 'Hypoglycaemia, excess glucose-lowering therapy and inadequate caloric intake.',
    context_notes: 'Correct timing after meals is important.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Sodium',
    normalized_name: 'sodium',
    category: 'Electrolytes',
    evaluation_type: 'numeric',
    increased_significance: 'Water deficit/dehydration, diabetes insipidus and selected sodium-loading states.',
    decreased_significance: 'Excess free water, diuretic therapy, SIADH, heart failure/cirrhosis and other fluid-balance disorders.',
    context_notes: 'Interpret with hydration status and underlying disease.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Potassium',
    normalized_name: 'potassium',
    category: 'Electrolytes',
    evaluation_type: 'numeric',
    increased_significance: 'Renal impairment, selected medications, tissue breakdown, adrenal insufficiency and metabolic disturbances.',
    decreased_significance: 'Diuretic therapy, gastrointestinal losses, poor intake, hyperaldosteronism and selected metabolic conditions.',
    context_notes: 'Significant abnormalities can have important cardiac consequences.',
    source_reference: "Davidson's Medicine; KD Tripathi"
  },
  {
    parameter_name: 'Chloride',
    normalized_name: 'chloride',
    category: 'Electrolytes',
    evaluation_type: 'numeric',
    increased_significance: 'Dehydration, hyperchloraemic metabolic acidosis and selected renal/endocrine disorders.',
    decreased_significance: 'Vomiting, diuretic therapy, metabolic alkalosis and other fluid/electrolyte disorders.',
    source_reference: "Davidson's Medicine"
  },
  {
    parameter_name: 'Magnesium',
    normalized_name: 'magnesium',
    category: 'Electrolytes',
    evaluation_type: 'numeric',
    increased_significance: 'Renal impairment and excess magnesium administration.',
    decreased_significance: 'Poor intake, gastrointestinal losses, diuretic therapy, alcohol-related disorders and selected metabolic conditions.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Serum Calcium',
    normalized_name: 'serum_calcium',
    category: 'Electrolytes',
    evaluation_type: 'numeric',
    increased_significance: 'Hyperparathyroidism, malignancy, vitamin-D-related disorders and selected medications.',
    decreased_significance: 'Hypoparathyroidism, vitamin D deficiency, renal disease and hypoalbuminaemia.',
    context_notes: 'Interpret total calcium with albumin and/or ionized calcium where appropriate.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'CPK / CK',
    normalized_name: 'cpk_ck',
    category: 'Cardiac/Muscle',
    evaluation_type: 'numeric',
    increased_significance: 'Skeletal muscle injury, myopathy, rhabdomyolysis, strenuous exercise and selected cardiac/muscular conditions.',
    decreased_significance: 'Usually little isolated clinical significance.',
    context_notes: 'Interpret with symptoms and other relevant investigations.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'CPK-MB',
    normalized_name: 'cpk_mb',
    category: 'Cardiac',
    evaluation_type: 'numeric',
    increased_significance: 'May indicate myocardial injury but can also increase with skeletal muscle injury.',
    decreased_significance: 'Generally no significant clinical concern.',
    context_notes: 'Correlate with symptoms, ECG and preferably cardiac troponin where appropriate.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'LDH',
    normalized_name: 'ldh',
    category: 'Cardiac/Muscle',
    evaluation_type: 'numeric',
    increased_significance: 'Tissue injury, haemolysis, liver disease, muscle injury, malignancy and other systemic conditions.',
    decreased_significance: 'Usually limited clinical significance.',
    context_notes: 'LDH is nonspecific.',
    source_reference: "Davidson's Medicine; Harsh Mohan Pathology"
  },
  {
    parameter_name: 'Total Bilirubin',
    normalized_name: 'total_bilirubin',
    category: 'Liver Function',
    evaluation_type: 'numeric',
    increased_significance: 'Haemolysis, hepatocellular disease, cholestasis/obstruction and impaired bilirubin metabolism.',
    decreased_significance: 'Usually no important clinical significance.',
    source_reference: "Davidson's Medicine; Harsh Mohan Pathology"
  },
  {
    parameter_name: 'Direct Bilirubin',
    normalized_name: 'direct_bilirubin',
    category: 'Liver Function',
    evaluation_type: 'numeric',
    increased_significance: 'Cholestasis, biliary obstruction and hepatocellular disease.',
    decreased_significance: 'Usually not clinically significant.',
    source_reference: "Davidson's Medicine; Harsh Mohan Pathology"
  },
  {
    parameter_name: 'Indirect Bilirubin',
    normalized_name: 'indirect_bilirubin',
    category: 'Liver Function',
    evaluation_type: 'numeric',
    increased_significance: 'Haemolysis, increased bilirubin production, impaired conjugation and selected inherited disorders.',
    decreased_significance: 'Usually not clinically significant.',
    source_reference: "Davidson's Medicine; Harsh Mohan Pathology"
  },
  {
    parameter_name: 'SGOT (AST)',
    normalized_name: 'sgot_ast',
    category: 'Liver Function',
    evaluation_type: 'numeric',
    increased_significance: 'Hepatocellular injury, muscle injury, myocardial injury, haemolysis and other tissue injury.',
    decreased_significance: 'Usually limited clinical significance.',
    context_notes: 'AST is not liver-specific; interpret with ALT and clinical findings.',
    source_reference: "Davidson's Medicine; Harsh Mohan Pathology"
  },
  {
    parameter_name: 'SGPT (ALT)',
    normalized_name: 'sgpt_alt',
    category: 'Liver Function',
    evaluation_type: 'numeric',
    increased_significance: 'Hepatocellular injury, viral hepatitis, drug-induced liver injury, fatty liver disease and other liver disorders.',
    decreased_significance: 'Usually limited clinical significance.',
    source_reference: "Davidson's Medicine; Harsh Mohan Pathology"
  },
  {
    parameter_name: 'Alkaline Phosphatase',
    normalized_name: 'alkaline_phosphatase',
    category: 'Liver Function',
    evaluation_type: 'numeric',
    increased_significance: 'Cholestatic/hepatobiliary disease, increased bone turnover and selected bone disorders.',
    decreased_significance: 'Malnutrition, selected mineral deficiencies and rare metabolic conditions.',
    context_notes: 'Other markers may help distinguish hepatic from bone sources.',
    source_reference: "Davidson's Medicine; Harsh Mohan Pathology"
  },
  {
    parameter_name: 'Albumin',
    normalized_name: 'albumin',
    category: 'Liver Function',
    evaluation_type: 'numeric',
    increased_significance: 'Usually associated with dehydration/haemoconcentration.',
    decreased_significance: 'Chronic liver disease, malnutrition, renal protein loss, inflammation and protein-losing conditions.',
    context_notes: 'Interpret with hepatic, renal and nutritional findings.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Globulin',
    normalized_name: 'globulin',
    category: 'Liver Function',
    evaluation_type: 'numeric',
    increased_significance: 'Chronic inflammation, infection, immune disorders and selected plasma-cell/lymphoid disorders.',
    decreased_significance: 'Immunodeficiency, protein loss and reduced production in selected conditions.',
    source_reference: "Davidson's Medicine; Harsh Mohan Pathology"
  },
  {
    parameter_name: 'Urea',
    normalized_name: 'urea',
    category: 'Renal Function',
    evaluation_type: 'numeric',
    increased_significance: 'Renal impairment, dehydration, increased protein breakdown, gastrointestinal bleeding and other causes of increased nitrogen load.',
    decreased_significance: 'Severe liver dysfunction, low protein intake, overhydration and selected metabolic states.',
    context_notes: 'Interpret with creatinine and hydration status.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Serum Creatinine',
    normalized_name: 'serum_creatinine',
    category: 'Renal Function',
    evaluation_type: 'numeric',
    increased_significance: 'Reduced renal filtration, acute/chronic kidney injury and selected states of reduced renal perfusion or increased creatinine production.',
    decreased_significance: 'Low muscle mass and reduced creatinine production.',
    context_notes: 'Interpret with renal function estimates, age, sex, muscle mass and clinical context.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Uric Acid',
    normalized_name: 'uric_acid',
    category: 'Renal Function',
    evaluation_type: 'numeric',
    increased_significance: 'Hyperuricaemia/gout, reduced renal urate excretion, increased purine turnover, selected medications and high-cell-turnover states.',
    decreased_significance: 'Selected medications, reduced urate production and some renal tubular disorders.',
    context_notes: 'Hyperuricaemia alone does not establish gout.',
    source_reference: "Davidson's Medicine; KD Tripathi"
  },
  {
    parameter_name: 'Total Cholesterol',
    normalized_name: 'total_cholesterol',
    category: 'Lipid Profile',
    evaluation_type: 'numeric',
    increased_significance: 'Dyslipidaemia and increased cardiovascular risk; may also occur with hypothyroidism and selected renal/liver disorders.',
    decreased_significance: 'Malnutrition, hyperthyroidism, chronic illness and selected liver disorders.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'HDL',
    normalized_name: 'hdl',
    category: 'Lipid Profile',
    evaluation_type: 'numeric',
    increased_significance: 'Generally associated with a favourable lipid profile, although very high values require clinical context.',
    decreased_significance: 'Associated with increased cardiovascular risk and may occur with metabolic syndrome, obesity/insulin resistance and smoking.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'LDL',
    normalized_name: 'ldl',
    category: 'Lipid Profile',
    evaluation_type: 'numeric',
    increased_significance: 'Atherogenic dyslipidaemia and increased cardiovascular risk; may occur in familial or secondary hypercholesterolaemia.',
    decreased_significance: 'Usually not harmful in isolation; may occur with lipid-lowering therapy or selected systemic conditions.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'VLDL',
    normalized_name: 'vldl',
    category: 'Lipid Profile',
    evaluation_type: 'numeric',
    increased_significance: 'Often associated with elevated triglycerides, insulin resistance, metabolic syndrome and hypertriglyceridaemia.',
    decreased_significance: 'Usually limited isolated clinical significance.',
    source_reference: "Davidson's Medicine; DiPiro"
  },
  {
    parameter_name: 'Triglycerides',
    normalized_name: 'triglycerides',
    category: 'Lipid Profile',
    evaluation_type: 'numeric',
    increased_significance: 'Metabolic syndrome, diabetes, obesity, alcohol excess, hypothyroidism, selected medications and familial hypertriglyceridaemia.',
    decreased_significance: 'Malnutrition, malabsorption, hyperthyroidism and selected chronic conditions.',
    source_reference: "Davidson's Medicine; DiPiro"
  }
];

async function populateLabParameterKnowledge() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Successfully connected to Supabase!');

    // Fetch existing normalized_name set to track inserts vs updates
    const existingRes = await client.query('SELECT normalized_name FROM public.lab_parameter_knowledge;');
    const existingSet = new Set(existingRes.rows.map(r => r.normalized_name));
    const initialExistingCount = existingSet.size;

    console.log(`Initial existing records in lab_parameter_knowledge: ${initialExistingCount}`);

    let insertedCount = 0;
    let updatedCount = 0;
    let duplicatesPrevented = 0;

    const processedNames = new Set();

    for (const rec of KNOWLEDGE_RECORDS) {
      if (processedNames.has(rec.normalized_name)) {
        duplicatesPrevented++;
        continue;
      }
      processedNames.add(rec.normalized_name);

      const isUpdate = existingSet.has(rec.normalized_name);

      const query = `
        INSERT INTO public.lab_parameter_knowledge (
          parameter_name,
          normalized_name,
          category,
          evaluation_type,
          increased_significance,
          decreased_significance,
          positive_significance,
          negative_significance,
          present_significance,
          absent_significance,
          context_notes,
          source_reference,
          is_active,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, NOW())
        ON CONFLICT (normalized_name) DO UPDATE SET
          parameter_name = EXCLUDED.parameter_name,
          category = EXCLUDED.category,
          evaluation_type = EXCLUDED.evaluation_type,
          increased_significance = EXCLUDED.increased_significance,
          decreased_significance = EXCLUDED.decreased_significance,
          positive_significance = EXCLUDED.positive_significance,
          negative_significance = EXCLUDED.negative_significance,
          present_significance = EXCLUDED.present_significance,
          absent_significance = EXCLUDED.absent_significance,
          context_notes = EXCLUDED.context_notes,
          source_reference = EXCLUDED.source_reference,
          is_active = TRUE,
          updated_at = NOW();
      `;

      const values = [
        rec.parameter_name,
        rec.normalized_name,
        rec.category || null,
        rec.evaluation_type,
        rec.increased_significance || null,
        rec.decreased_significance || null,
        rec.positive_significance || null,
        rec.negative_significance || null,
        rec.present_significance || null,
        rec.absent_significance || null,
        rec.context_notes || null,
        rec.source_reference || null
      ];

      await client.query(query, values);

      if (isUpdate) {
        updatedCount++;
      } else {
        insertedCount++;
      }
    }

    console.log('\n--- POPULATION SUMMARY ---');
    console.log(`Total records processed: ${KNOWLEDGE_RECORDS.length}`);
    console.log(`Total records inserted: ${insertedCount}`);
    console.log(`Total records updated: ${updatedCount}`);
    console.log(`Total existing records retained: ${initialExistingCount}`);
    console.log(`Total duplicates prevented: ${duplicatesPrevented}`);

    // Verify final count
    const finalCountRes = await client.query('SELECT COUNT(*) FROM public.lab_parameter_knowledge;');
    const finalCount = parseInt(finalCountRes.rows[0].count, 10);
    console.log(`Total records in lab_parameter_knowledge table now: ${finalCount}`);

    // Verify patient_lab_investigations table exists and is intact
    const checkPatientLabs = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'patient_lab_investigations';
    `);
    console.log(`patient_lab_investigations table intact: ${checkPatientLabs.rows[0].count > 0}`);

  } catch (err) {
    console.error('Error populating lab_parameter_knowledge table:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

populateLabParameterKnowledge();
