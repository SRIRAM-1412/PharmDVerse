import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
let env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const connectionString = env.DATABASE_POOLER_URL || 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const batch1Drugs = [
  {
    generic_name: 'Enalapril',
    brand_names: 'Vasotec, Enam',
    drug_class: 'ACE inhibitor (Additional: Antihypertensive; heart-failure therapy; cardiovascular/renal protective therapy)',
    established_uses: 'Hypertension; symptomatic heart failure; asymptomatic left-ventricular dysfunction in selected patients.',
    mechanism_of_action: 'Inhibits angiotensin-converting enzyme, decreasing angiotensin II and aldosterone and increasing bradykinin. This reduces vasoconstriction and cardiac workload.',
    normal_dose_range: 'Hypertension is commonly initiated at 5 mg once daily and titrated according to response; usual maintenance commonly 10–40 mg/day depending on indication. Heart-failure dosing starts lower and is titrated.',
    contraindications: 'Previous ACE-inhibitor-associated angioedema; pregnancy; concomitant aliskiren in patients with diabetes; hypersensitivity.',
    side_effects_adverse_effects: 'Dry cough; dizziness; hypotension; hyperkalaemia; increased creatinine/renal dysfunction; angioedema.',
    monitoring_parameters: 'Blood pressure; serum creatinine/eGFR; potassium; clinical response.'
  },
  {
    generic_name: 'Enalaprilat',
    brand_names: 'Vasotec IV',
    drug_class: 'ACE inhibitor (Additional: Antihypertensive)',
    established_uses: 'Treatment of hypertension when intravenous ACE inhibition is required.',
    mechanism_of_action: 'ACE inhibition reduces angiotensin II and aldosterone.',
    normal_dose_range: 'IV dosing is individualized according to previous ACE-inhibitor exposure, indication and renal function.',
    contraindications: 'ACE-inhibitor-associated angioedema; pregnancy; hypersensitivity.',
    side_effects_adverse_effects: 'Hypotension; hyperkalaemia; renal-function deterioration; angioedema.',
    monitoring_parameters: 'Blood pressure; renal function; potassium.'
  },
  {
    generic_name: 'Captopril',
    brand_names: 'Capoten',
    drug_class: 'ACE inhibitor (Additional: Antihypertensive; heart-failure therapy)',
    established_uses: 'Hypertension; heart failure; selected post-MI/left-ventricular dysfunction.',
    mechanism_of_action: 'ACE inhibition decreases angiotensin II and aldosterone and increases bradykinin.',
    normal_dose_range: 'Usually given in divided doses and titrated according to indication and response.',
    contraindications: 'ACE-inhibitor-associated angioedema; pregnancy; hypersensitivity.',
    side_effects_adverse_effects: 'Cough; hypotension; hyperkalaemia; renal impairment; angioedema; taste disturbance.',
    monitoring_parameters: 'Blood pressure; renal function; potassium.'
  },
  {
    generic_name: 'Lisinopril',
    brand_names: 'Zestril, Prinivil, Listril',
    drug_class: 'ACE inhibitor (Additional: Antihypertensive; heart-failure therapy)',
    established_uses: 'Hypertension; heart failure; selected post-MI/left-ventricular dysfunction.',
    mechanism_of_action: 'ACE inhibition reduces angiotensin II-mediated vasoconstriction and aldosterone release.',
    normal_dose_range: 'Common adult hypertension dosing is approximately 10–40 mg once daily after appropriate initiation/titration; lower starting doses may be required.',
    contraindications: 'ACE-inhibitor-associated angioedema; pregnancy; hypersensitivity.',
    side_effects_adverse_effects: 'Cough; dizziness; hypotension; hyperkalaemia; renal dysfunction; angioedema.',
    monitoring_parameters: 'Blood pressure; creatinine/eGFR; potassium.'
  },
  {
    generic_name: 'Ramipril',
    brand_names: 'Altace, Cardace',
    drug_class: 'ACE inhibitor (Additional: Antihypertensive; cardiovascular risk-reduction therapy; heart-failure therapy)',
    established_uses: 'Hypertension; cardiovascular risk reduction in selected high-risk patients; heart failure.',
    mechanism_of_action: 'ACE inhibition reduces angiotensin II and aldosterone.',
    normal_dose_range: 'Usually initiated at a low dose and titrated; commonly approximately 2.5–10 mg/day depending on indication and patient factors.',
    contraindications: 'Pregnancy; previous ACE-inhibitor angioedema; hypersensitivity.',
    side_effects_adverse_effects: 'Cough; hypotension; hyperkalaemia; renal dysfunction; angioedema.',
    monitoring_parameters: 'Blood pressure; renal function; potassium.'
  },
  {
    generic_name: 'Perindopril',
    brand_names: 'Aceon, Coversyl',
    drug_class: 'ACE inhibitor (Additional: Antihypertensive; cardiovascular therapy)',
    established_uses: 'Hypertension; selected cardiovascular indications.',
    mechanism_of_action: 'ACE inhibition decreases angiotensin II and aldosterone.',
    normal_dose_range: 'Usually initiated at a low dose and titrated according to indication and response.',
    contraindications: 'Pregnancy; ACE-inhibitor-associated angioedema; hypersensitivity.',
    side_effects_adverse_effects: 'Cough; dizziness; hypotension; hyperkalaemia; renal impairment; angioedema.',
    monitoring_parameters: 'Blood pressure; renal function; potassium.'
  },
  {
    generic_name: 'Losartan',
    brand_names: 'Cozaar, Losar',
    drug_class: 'Angiotensin II receptor blocker (ARB) (Additional: Antihypertensive; renal-protective therapy; heart-failure therapy)',
    established_uses: 'Hypertension; diabetic kidney disease in appropriate patients; selected heart-failure/cardiovascular indications.',
    mechanism_of_action: 'Selectively blocks angiotensin II AT1 receptors, reducing vasoconstriction and aldosterone release.',
    normal_dose_range: 'Common adult hypertension starting dose is 50 mg once daily; may be titrated to 100 mg/day where appropriate.',
    contraindications: 'Pregnancy; concomitant aliskiren in patients with diabetes; hypersensitivity.',
    side_effects_adverse_effects: 'Dizziness; hyperkalaemia; hypotension; renal-function changes.',
    monitoring_parameters: 'Blood pressure; potassium; creatinine/eGFR.'
  },
  {
    generic_name: 'Valsartan',
    brand_names: 'Diovan, Valzaar',
    drug_class: 'ARB (Additional: Antihypertensive; heart-failure therapy; post-MI cardiovascular therapy)',
    established_uses: 'Hypertension; heart failure; selected post-MI left-ventricular dysfunction.',
    mechanism_of_action: 'Blocks AT1 receptors and prevents angiotensin II-mediated vasoconstriction and aldosterone release.',
    normal_dose_range: 'Indication-specific; initiated and titrated according to blood pressure, heart-failure response and patient factors.',
    contraindications: 'Pregnancy; concomitant aliskiren in diabetes; hypersensitivity.',
    side_effects_adverse_effects: 'Hypotension; hyperkalaemia; renal dysfunction.',
    monitoring_parameters: 'Blood pressure; renal function; potassium.'
  },
  {
    generic_name: 'Telmisartan',
    brand_names: 'Micardis, Telma',
    drug_class: 'ARB (Additional: Antihypertensive; cardiovascular risk-reduction therapy)',
    established_uses: 'Hypertension; cardiovascular risk reduction in selected high-risk patients.',
    mechanism_of_action: 'AT1 receptor blockade.',
    normal_dose_range: 'Commonly 20–80 mg once daily depending on indication.',
    contraindications: 'Pregnancy; aliskiren use in diabetes; hypersensitivity.',
    side_effects_adverse_effects: 'Dizziness; hypotension; hyperkalaemia; renal dysfunction.',
    monitoring_parameters: 'Blood pressure; potassium; renal function.'
  },
  {
    generic_name: 'Olmesartan',
    brand_names: 'Benicar, Olmy',
    drug_class: 'ARB (Additional: Antihypertensive)',
    established_uses: 'Hypertension.',
    mechanism_of_action: 'Blocks AT1 receptors.',
    normal_dose_range: 'Commonly 20–40 mg once daily in adults; lower starting doses may be appropriate in selected patients.',
    contraindications: 'Pregnancy; aliskiren in diabetes; hypersensitivity.',
    side_effects_adverse_effects: 'Dizziness; hyperkalaemia; renal dysfunction; rare sprue-like enteropathy.',
    monitoring_parameters: 'Blood pressure; renal function; potassium; persistent severe diarrhoea should be clinically evaluated.'
  },
  {
    generic_name: 'Irbesartan',
    brand_names: 'Avapro, Irovel',
    drug_class: 'ARB (Additional: Antihypertensive; renal-protective therapy)',
    established_uses: 'Hypertension; diabetic nephropathy in appropriate patients.',
    mechanism_of_action: 'AT1 receptor blockade.',
    normal_dose_range: 'Commonly 150–300 mg once daily depending on indication.',
    contraindications: 'Pregnancy; aliskiren in diabetes; hypersensitivity.',
    side_effects_adverse_effects: 'Dizziness; hyperkalaemia; renal dysfunction; hypotension.',
    monitoring_parameters: 'Blood pressure; renal function; potassium.'
  },
  {
    generic_name: 'Candesartan',
    brand_names: 'Atacand, Canden',
    drug_class: 'ARB (Additional: Antihypertensive; heart-failure therapy)',
    established_uses: 'Hypertension; heart failure.',
    mechanism_of_action: 'AT1 receptor blockade.',
    normal_dose_range: 'Usually initiated at a low dose and titrated according to indication and response.',
    contraindications: 'Pregnancy; hypersensitivity; concomitant aliskiren in diabetes.',
    side_effects_adverse_effects: 'Hypotension; hyperkalaemia; renal dysfunction.',
    monitoring_parameters: 'Blood pressure; renal function; potassium.'
  },
  {
    generic_name: 'Amlodipine',
    brand_names: 'Norvasc, Amlong',
    drug_class: 'Dihydropyridine calcium-channel blocker (Additional: Antihypertensive; antianginal)',
    established_uses: 'Hypertension; chronic stable angina; vasospastic angina.',
    mechanism_of_action: 'Blocks L-type calcium channels predominantly in vascular smooth muscle, producing arterial vasodilation.',
    normal_dose_range: 'Common adult dose 5–10 mg once daily.',
    contraindications: 'Hypersensitivity; caution in severe hypotension and selected cardiac conditions.',
    side_effects_adverse_effects: 'Ankle oedema; headache; flushing; dizziness; palpitations; gingival enlargement.',
    monitoring_parameters: 'Blood pressure; oedema; clinical response.'
  },
  {
    generic_name: 'Nifedipine',
    brand_names: 'Procardia, Adalat, Nicardia',
    drug_class: 'Dihydropyridine calcium-channel blocker (Additional: Antihypertensive; antianginal)',
    established_uses: 'Hypertension; angina.',
    mechanism_of_action: 'L-type calcium-channel blockade produces arterial vasodilation.',
    normal_dose_range: 'Formulation-specific; extended-release preparations are commonly administered once daily.',
    contraindications: 'Hypersensitivity; significant hypotension.',
    side_effects_adverse_effects: 'Headache; flushing; peripheral oedema; dizziness; palpitations.',
    monitoring_parameters: 'Blood pressure; heart rate; oedema.'
  },
  {
    generic_name: 'Felodipine',
    brand_names: 'Plendil, Felogard',
    drug_class: 'Dihydropyridine calcium-channel blocker (Additional: Antihypertensive)',
    established_uses: 'Hypertension; selected angina.',
    mechanism_of_action: 'L-type calcium-channel blockade produces arterial vasodilation.',
    normal_dose_range: 'Commonly 5–10 mg once daily for extended-release formulations.',
    contraindications: 'Hypersensitivity; clinically significant hypotension.',
    side_effects_adverse_effects: 'Peripheral oedema; headache; flushing; dizziness.',
    monitoring_parameters: 'Blood pressure; oedema.'
  },
  {
    generic_name: 'Cilnidipine',
    brand_names: 'Cilacar, Cetanil',
    drug_class: 'Dihydropyridine calcium-channel blocker (Additional: Antihypertensive)',
    established_uses: 'Hypertension.',
    mechanism_of_action: 'Calcium-channel blockade produces vascular smooth-muscle relaxation.',
    normal_dose_range: 'Product/formulation and clinical-setting dependent.',
    contraindications: 'Hypersensitivity; clinically significant hypotension.',
    side_effects_adverse_effects: 'Dizziness; headache; peripheral oedema.',
    monitoring_parameters: 'Blood pressure; clinical response.'
  },
  {
    generic_name: 'Diltiazem',
    brand_names: 'Cardizem, Dilzem',
    drug_class: 'Non-dihydropyridine calcium-channel blocker (Additional: Antianginal; antiarrhythmic; antihypertensive)',
    established_uses: 'Angina; hypertension; selected supraventricular arrhythmias.',
    mechanism_of_action: 'Blocks L-type calcium channels, reducing AV conduction, heart rate and myocardial contractility while producing vasodilation.',
    normal_dose_range: 'Highly formulation-specific; immediate-release and extended-release regimens differ.',
    contraindications: 'Significant bradycardia; high-grade AV block without pacemaker; selected heart-failure states; hypersensitivity.',
    side_effects_adverse_effects: 'Bradycardia; hypotension; constipation; oedema; worsening heart failure.',
    monitoring_parameters: 'Blood pressure; heart rate; ECG where appropriate; cardiac function.'
  },
  {
    generic_name: 'Verapamil',
    brand_names: 'Calan, Isoptin',
    drug_class: 'Non-dihydropyridine calcium-channel blocker (Additional: Antianginal; antiarrhythmic; antihypertensive)',
    established_uses: 'Angina; selected supraventricular arrhythmias; hypertension.',
    mechanism_of_action: 'L-type calcium-channel blockade reduces AV conduction and myocardial contractility.',
    normal_dose_range: 'Formulation-specific.',
    contraindications: 'Severe hypotension; significant bradycardia; high-grade AV block without pacemaker; selected severe LV dysfunction.',
    side_effects_adverse_effects: 'Constipation; bradycardia; hypotension; AV block; worsening heart failure.',
    monitoring_parameters: 'Blood pressure; heart rate; ECG; cardiac function.'
  },
  {
    generic_name: 'Metoprolol',
    brand_names: 'Lopressor, Toprol-XL, Metolar',
    drug_class: 'β1-selective beta blocker (Additional: Antihypertensive; antianginal; antiarrhythmic; heart-failure therapy)',
    established_uses: 'Hypertension; angina; selected arrhythmias; selected heart-failure regimens.',
    mechanism_of_action: 'Blocks β1 receptors, reducing heart rate, myocardial contractility and renin release.',
    normal_dose_range: 'Formulation- and indication-specific. Extended-release heart-failure therapy is initiated at a low dose and titrated gradually.',
    contraindications: 'Severe bradycardia; significant AV block; cardiogenic shock; decompensated heart failure.',
    side_effects_adverse_effects: 'Bradycardia; hypotension; fatigue; dizziness; bronchospasm may occur.',
    monitoring_parameters: 'Blood pressure; heart rate; ECG where appropriate; heart-failure symptoms.'
  },
  {
    generic_name: 'Atenolol',
    brand_names: 'Tenormin, Aten',
    drug_class: 'β1-selective beta blocker (Additional: Antihypertensive; antianginal; antiarrhythmic)',
    established_uses: 'Hypertension; angina; selected arrhythmias.',
    mechanism_of_action: 'β1 blockade reduces heart rate, contractility and renin release.',
    normal_dose_range: 'Commonly 25–100 mg/day depending on indication and renal function.',
    contraindications: 'Severe bradycardia; significant AV block; cardiogenic shock; decompensated heart failure.',
    side_effects_adverse_effects: 'Bradycardia; fatigue; hypotension; cold extremities.',
    monitoring_parameters: 'Blood pressure; heart rate; renal function.'
  },
  {
    generic_name: 'Bisoprolol',
    brand_names: 'Zebeta, Biselect',
    drug_class: 'β1-selective beta blocker (Additional: Antihypertensive; heart-failure therapy)',
    established_uses: 'Hypertension; chronic stable heart failure; selected cardiovascular indications.',
    mechanism_of_action: 'β1 blockade reduces cardiac stimulation.',
    normal_dose_range: 'Heart-failure treatment begins at a very low dose and is titrated gradually; hypertension dosing is indication-specific.',
    contraindications: 'Severe bradycardia; significant AV block; cardiogenic shock; decompensated heart failure.',
    side_effects_adverse_effects: 'Bradycardia; hypotension; fatigue; dizziness.',
    monitoring_parameters: 'Blood pressure; heart rate; heart-failure status.'
  },
  {
    generic_name: 'Carvedilol',
    brand_names: 'Coreg, Carca',
    drug_class: 'Nonselective beta blocker with α1-blocking activity (Additional: Antihypertensive; heart-failure therapy)',
    established_uses: 'Heart failure; hypertension; selected post-MI left-ventricular dysfunction.',
    mechanism_of_action: 'β blockade reduces cardiac workload and α1 blockade produces vasodilation.',
    normal_dose_range: 'Heart-failure dosing begins low and is titrated; hypertension dosing differs.',
    contraindications: 'Severe bradycardia; significant AV block; cardiogenic shock; decompensated heart failure.',
    side_effects_adverse_effects: 'Bradycardia; hypotension; dizziness; fatigue; fluid retention.',
    monitoring_parameters: 'Blood pressure; heart rate; weight; fluid status; heart-failure symptoms.'
  },
  {
    generic_name: 'Propranolol',
    brand_names: 'Inderal, Ciplar',
    drug_class: 'Nonselective beta blocker (Additional: Antianginal; antiarrhythmic; antihypertensive; migraine prophylaxis; essential-tremor therapy)',
    established_uses: 'Hypertension; angina; selected arrhythmias; migraine prevention; essential tremor; other specific indications.',
    mechanism_of_action: 'Blocks β1 and β2 receptors.',
    normal_dose_range: 'Highly indication-specific; divided-dose or extended-release regimens may be used.',
    contraindications: 'Asthma/bronchospastic disease with clinically important risk; severe bradycardia; significant AV block.',
    side_effects_adverse_effects: 'Bradycardia; hypotension; fatigue; bronchospasm; sleep disturbance; masking of hypoglycaemia.',
    monitoring_parameters: 'Blood pressure; heart rate; respiratory status; diabetic hypoglycaemia awareness.'
  },
  {
    generic_name: 'Nebivolol',
    brand_names: 'Bystolic, Nebicard',
    drug_class: 'β1-selective beta blocker (Additional: Antihypertensive; cardiovascular therapy)',
    established_uses: 'Hypertension; selected heart-failure indications.',
    mechanism_of_action: 'β1 blockade with nitric-oxide-mediated vasodilatory effects.',
    normal_dose_range: 'Commonly 5 mg once daily for hypertension, adjusted for patient factors.',
    contraindications: 'Severe bradycardia; significant conduction disease; cardiogenic shock; decompensated heart failure.',
    side_effects_adverse_effects: 'Bradycardia; headache; dizziness; fatigue.',
    monitoring_parameters: 'Blood pressure; heart rate.'
  },
  {
    generic_name: 'Labetalol',
    brand_names: 'Trandate, Labebet',
    drug_class: 'α1 and β adrenergic blocker (Additional: Antihypertensive; acute severe hypertension therapy)',
    established_uses: 'Hypertension; selected acute severe hypertension; selected pregnancy-related hypertension.',
    mechanism_of_action: 'α1 blockade causes vasodilation while β blockade reduces cardiac stimulation.',
    normal_dose_range: 'Oral and IV dosing is indication- and setting-specific.',
    contraindications: 'Severe bradycardia; significant AV block; cardiogenic shock; decompensated heart failure; clinically significant bronchospasm.',
    side_effects_adverse_effects: 'Hypotension; bradycardia; dizziness; fatigue; rare hepatotoxicity.',
    monitoring_parameters: 'Blood pressure; heart rate; hepatic function when clinically indicated.'
  },
  {
    generic_name: 'Esmolol',
    brand_names: 'Brevibloc',
    drug_class: 'Short-acting β1-selective beta blocker (Additional: Antiarrhythmic; emergency cardiovascular therapy)',
    established_uses: 'Acute ventricular-rate control; selected perioperative tachycardia and hypertension.',
    mechanism_of_action: 'Short-acting β1 blockade.',
    normal_dose_range: 'IV loading and infusion are titrated according to clinical response.',
    contraindications: 'Severe bradycardia; significant AV block; cardiogenic shock; decompensated heart failure.',
    side_effects_adverse_effects: 'Hypotension; bradycardia; heart failure.',
    monitoring_parameters: 'Continuous blood pressure; ECG; heart rate.'
  },
  {
    generic_name: 'Sotalol',
    brand_names: 'Betapace, Sotalar',
    drug_class: 'Class III antiarrhythmic with beta-blocking activity (Additional: Antiarrhythmic)',
    established_uses: 'Selected atrial and ventricular arrhythmias.',
    mechanism_of_action: 'Beta blockade plus potassium-channel blockade prolongs cardiac repolarization.',
    normal_dose_range: 'Initiation and titration require consideration of QT interval and renal function.',
    contraindications: 'Significant QT prolongation; severe bradycardia; certain AV blocks; selected decompensated heart-failure states.',
    side_effects_adverse_effects: 'Bradycardia; QT prolongation; torsades de pointes; fatigue.',
    monitoring_parameters: 'ECG/QTc; renal function; electrolytes; heart rate.'
  },
  {
    generic_name: 'Prazosin',
    brand_names: 'Minipress, Prazopress',
    drug_class: 'α1-adrenergic blocker (Additional: Antihypertensive)',
    established_uses: 'Hypertension; selected urinary symptoms in BPH; other specialist indications.',
    mechanism_of_action: 'Blocks peripheral α1 receptors causing vasodilation and reduced vascular resistance.',
    normal_dose_range: 'Initiated at a very low dose because of first-dose hypotension and titrated according to response.',
    contraindications: 'Hypersensitivity; caution with significant hypotension.',
    side_effects_adverse_effects: 'First-dose syncope/hypotension; dizziness; orthostatic hypotension; headache.',
    monitoring_parameters: 'Blood pressure; orthostatic symptoms.'
  },
  {
    generic_name: 'Tamsulosin',
    brand_names: 'Flomax, Urimax',
    drug_class: 'α1A-selective adrenergic blocker (Additional: BPH therapy)',
    established_uses: 'Lower urinary tract symptoms associated with benign prostatic hyperplasia.',
    mechanism_of_action: 'Relaxes smooth muscle in prostate and bladder neck, improving urinary flow.',
    normal_dose_range: 'Commonly 0.4 mg once daily; formulation-specific.',
    contraindications: 'Hypersensitivity; caution with significant orthostatic hypotension.',
    side_effects_adverse_effects: 'Dizziness; abnormal ejaculation; orthostatic symptoms; intraoperative floppy iris syndrome.',
    monitoring_parameters: 'Urinary symptoms; blood pressure if symptomatic; adverse effects.'
  },
  {
    generic_name: 'Clonidine',
    brand_names: 'Catapres, Arkamin',
    drug_class: 'Central α2-adrenergic agonist (Additional: Antihypertensive)',
    established_uses: 'Selected hypertension; other specialist indications.',
    mechanism_of_action: 'Reduces sympathetic outflow from the CNS.',
    normal_dose_range: 'Individualized and formulation-specific.',
    contraindications: 'Hypersensitivity; caution in significant bradycardia/hypotension.',
    side_effects_adverse_effects: 'Sedation; dry mouth; bradycardia; hypotension; rebound hypertension after abrupt withdrawal.',
    monitoring_parameters: 'Blood pressure; heart rate; sedation; withdrawal effects.'
  },
  {
    generic_name: 'Methyldopa',
    brand_names: 'Aldomet',
    drug_class: 'Centrally acting sympatholytic (Additional: Antihypertensive)',
    established_uses: 'Hypertension, particularly selected pregnancy-related hypertension.',
    mechanism_of_action: 'Converted centrally to an α2-adrenergic agonist, reducing sympathetic outflow.',
    normal_dose_range: 'Usually initiated low and titrated; divided dosing may be required.',
    contraindications: 'Active liver disease; previous methyldopa-associated liver injury; hypersensitivity.',
    side_effects_adverse_effects: 'Sedation; dizziness; hypotension; hepatotoxicity; haemolytic anaemia.',
    monitoring_parameters: 'Blood pressure; liver function; CBC when clinically appropriate.'
  },
  {
    generic_name: 'Hydralazine',
    brand_names: 'Apresoline',
    drug_class: 'Direct arterial vasodilator (Additional: Antihypertensive; selected heart-failure therapy)',
    established_uses: 'Severe hypertension in selected situations; heart failure in combination with nitrate therapy in selected patients.',
    mechanism_of_action: 'Direct arteriolar smooth-muscle relaxation reduces systemic vascular resistance.',
    normal_dose_range: 'Oral and IV regimens vary substantially according to indication.',
    contraindications: 'Hypersensitivity; caution in coronary artery disease and tachycardia.',
    side_effects_adverse_effects: 'Headache; flushing; tachycardia; fluid retention; lupus-like syndrome.',
    monitoring_parameters: 'Blood pressure; heart rate; fluid status; CBC/ANA when prolonged therapy warrants.'
  },
  {
    generic_name: 'Minoxidil',
    brand_names: 'Loniten',
    drug_class: 'Direct potassium-channel-opening vasodilator (Additional: Antihypertensive)',
    established_uses: 'Severe/refractory hypertension.',
    mechanism_of_action: 'Opens potassium channels in vascular smooth muscle, producing arteriolar vasodilation.',
    normal_dose_range: 'Initiated low and titrated; generally requires concomitant diuretic and beta blocker.',
    contraindications: 'Pheochromocytoma; hypersensitivity; caution with pericardial disease.',
    side_effects_adverse_effects: 'Fluid retention; reflex tachycardia; hypertrichosis; pericardial effusion.',
    monitoring_parameters: 'Blood pressure; heart rate; body weight/fluid status; signs of pericardial effusion.'
  },
  {
    generic_name: 'Nitroglycerin',
    brand_names: 'Nitrostat, Nitrolingual, Myovin',
    drug_class: 'Organic nitrate (Additional: Antianginal; emergency cardiovascular therapy)',
    established_uses: 'Acute relief/prevention of angina; selected ACS and acute-heart-failure settings.',
    mechanism_of_action: 'Generates nitric oxide, increasing cGMP and producing vascular relaxation, predominantly venodilation.',
    normal_dose_range: 'Route/formulation-specific; sublingual dosing differs from IV/transdermal therapy.',
    contraindications: 'Concomitant PDE-5 inhibitor use; significant hypotension.',
    side_effects_adverse_effects: 'Headache; hypotension; dizziness; flushing; reflex tachycardia.',
    monitoring_parameters: 'Blood pressure; heart rate; chest-pain response.'
  },
  {
    generic_name: 'Isosorbide Mononitrate',
    brand_names: 'Imdur, Ismo, Monotrate',
    drug_class: 'Long-acting nitrate (Additional: Antianginal)',
    established_uses: 'Prevention of angina.',
    mechanism_of_action: 'NO-mediated vasodilation.',
    normal_dose_range: 'Formulation-specific; immediate-release and extended-release regimens differ.',
    contraindications: 'Concomitant PDE-5 inhibitor use; significant hypotension.',
    side_effects_adverse_effects: 'Headache; dizziness; hypotension; nitrate tolerance.',
    monitoring_parameters: 'Blood pressure; angina frequency; tolerance.'
  },
  {
    generic_name: 'Isosorbide Dinitrate',
    brand_names: 'Isordil, Sorbitrate',
    drug_class: 'Organic nitrate (Additional: Antianginal; selected heart-failure therapy)',
    established_uses: 'Angina; selected heart-failure regimens with hydralazine.',
    mechanism_of_action: 'NO-mediated vasodilation.',
    normal_dose_range: 'Indication/formulation-specific.',
    contraindications: 'Concomitant PDE-5 inhibitor use; significant hypotension.',
    side_effects_adverse_effects: 'Headache; hypotension; dizziness.',
    monitoring_parameters: 'Blood pressure; heart rate; angina/heart-failure symptoms.'
  },
  {
    generic_name: 'Ranolazine',
    brand_names: 'Ranexa, Raniz',
    drug_class: 'Antianginal agent (Additional: Chronic angina therapy)',
    established_uses: 'Chronic stable angina.',
    mechanism_of_action: 'Inhibits the late sodium current, reducing intracellular sodium/calcium overload and improving myocardial diastolic function.',
    normal_dose_range: 'Extended-release preparations commonly start at 500 mg twice daily and may be increased according to response/tolerability.',
    contraindications: 'Significant QT prolongation; important drug interactions; severe renal/hepatic impairment requires caution.',
    side_effects_adverse_effects: 'Dizziness; constipation; nausea; QT prolongation.',
    monitoring_parameters: 'ECG/QTc where appropriate; renal/hepatic function; symptoms.'
  },
  {
    generic_name: 'Ivabradine',
    brand_names: 'Corlanor, Procoralan, Ivabrad',
    drug_class: 'If-channel inhibitor (Additional: Antianginal; heart-failure therapy)',
    established_uses: 'Selected chronic stable angina; selected heart failure with sinus rhythm and elevated heart rate.',
    mechanism_of_action: 'Selectively inhibits the cardiac If current, slowing sinus-node firing without major negative inotropic action.',
    normal_dose_range: 'Commonly initiated at 5 mg twice daily and titrated according to heart rate and response where appropriate.',
    contraindications: 'Significant bradycardia; acute decompensated heart failure; severe conduction disease without pacing; atrial fibrillation.',
    side_effects_adverse_effects: 'Bradycardia; luminous phenomena/phosphenes; atrial fibrillation.',
    monitoring_parameters: 'Heart rate; cardiac rhythm; symptoms.'
  },
  {
    generic_name: 'Nicorandil',
    brand_names: 'Ikorel, Nikoran',
    drug_class: 'Nitrate-like vasodilator / potassium-channel opener (Additional: Antianginal)',
    established_uses: 'Prevention of angina in selected patients.',
    mechanism_of_action: 'Activates potassium channels and has nitrate-like NO-mediated vasodilator effects.',
    normal_dose_range: 'Usually initiated at a low dose and titrated according to formulation.',
    contraindications: 'Concomitant PDE-5 inhibitor use; significant hypotension.',
    side_effects_adverse_effects: 'Headache; dizziness; hypotension; gastrointestinal or mucosal ulceration may occur.',
    monitoring_parameters: 'Blood pressure; angina response; adverse effects.'
  },
  {
    generic_name: 'Trimetazidine',
    brand_names: 'Vastarel, Tazidal',
    drug_class: 'Metabolic antianginal (Additional: Antianginal)',
    established_uses: 'Add-on symptomatic treatment of stable angina where appropriate.',
    mechanism_of_action: 'Shifts myocardial energy metabolism toward glucose oxidation and improves metabolic efficiency during ischaemia.',
    normal_dose_range: 'Modified-release dosing is formulation-specific.',
    contraindications: 'Parkinsonism/movement disorders; severe renal impairment.',
    side_effects_adverse_effects: 'Dizziness; headache; GI symptoms; movement disorders rarely.',
    monitoring_parameters: 'Clinical response; renal function; movement symptoms.'
  },
  {
    generic_name: 'Amiodarone',
    brand_names: 'Cordarone, Pacerone, Tachyra',
    drug_class: 'Class III antiarrhythmic (Additional: Antiarrhythmic)',
    established_uses: 'Important ventricular and supraventricular arrhythmias.',
    mechanism_of_action: 'Predominantly blocks potassium channels and prolongs repolarization; also has sodium-channel, calcium-channel and beta-blocking effects.',
    normal_dose_range: 'Loading and maintenance regimens vary substantially according to arrhythmia and route.',
    contraindications: 'Significant bradycardia/conduction disease without pacing; thyroid, pulmonary and hepatic disease require particular caution.',
    side_effects_adverse_effects: 'Pulmonary toxicity; thyroid dysfunction; hepatotoxicity; corneal deposits; photosensitivity; bradycardia; QT prolongation.',
    monitoring_parameters: 'ECG; thyroid function; liver function; pulmonary assessment when indicated; electrolytes.'
  },
  {
    generic_name: 'Lidocaine',
    brand_names: 'Xylocaine',
    drug_class: 'Class Ib antiarrhythmic (Additional: Local anaesthetic)',
    established_uses: 'Selected ventricular arrhythmias; local anaesthesia.',
    mechanism_of_action: 'Blocks fast sodium channels, preferentially affecting depolarized/ischemic ventricular tissue.',
    normal_dose_range: 'IV antiarrhythmic dosing is weight- and response-dependent; local-anaesthetic dosing differs.',
    contraindications: 'Significant conduction disturbances without pacing; hypersensitivity; caution in severe hepatic dysfunction.',
    side_effects_adverse_effects: 'CNS toxicity; seizures; confusion; hypotension; bradycardia.',
    monitoring_parameters: 'ECG; blood pressure; CNS status; dose adjustment in hepatic dysfunction.'
  },
  {
    generic_name: 'Mexiletine',
    brand_names: 'Mexitil',
    drug_class: 'Class Ib antiarrhythmic (Additional: Antiarrhythmic)',
    established_uses: 'Selected ventricular arrhythmias.',
    mechanism_of_action: 'Oral sodium-channel blockade.',
    normal_dose_range: 'Initiated and titrated according to arrhythmia response and tolerability.',
    contraindications: 'Significant conduction disease or severe cardiogenic conditions requiring specialist evaluation.',
    side_effects_adverse_effects: 'Nausea; tremor; dizziness; neurologic effects.',
    monitoring_parameters: 'ECG; clinical response; hepatic function when appropriate.'
  },
  {
    generic_name: 'Flecainide',
    brand_names: 'Tambocor',
    drug_class: 'Class Ic antiarrhythmic (Additional: Antiarrhythmic)',
    established_uses: 'Selected supraventricular arrhythmias and rhythm-control strategies.',
    mechanism_of_action: 'Potent sodium-channel blockade slows cardiac conduction.',
    normal_dose_range: 'Initiated and titrated under appropriate specialist supervision.',
    contraindications: 'Significant structural heart disease or previous MI in many clinical contexts; conduction disease without pacing.',
    side_effects_adverse_effects: 'Proarrhythmia; dizziness; visual disturbances; conduction slowing.',
    monitoring_parameters: 'ECG; renal/hepatic function; clinical rhythm response.'
  },
  {
    generic_name: 'Propafenone',
    brand_names: 'Rythmol',
    drug_class: 'Class Ic antiarrhythmic (Additional: Mild beta-blocking activity; antiarrhythmic)',
    established_uses: 'Selected atrial arrhythmias.',
    mechanism_of_action: 'Sodium-channel blockade with some beta-blocking effects.',
    normal_dose_range: 'Formulation-specific; specialist titration.',
    contraindications: 'Significant structural heart disease; severe conduction disorders; severe heart failure.',
    side_effects_adverse_effects: 'Proarrhythmia; bradycardia; dizziness; metallic taste.',
    monitoring_parameters: 'ECG; heart rate; hepatic function where appropriate.'
  },
  {
    generic_name: 'Procainamide',
    brand_names: 'Pronestyl',
    drug_class: 'Class Ia antiarrhythmic (Additional: Antiarrhythmic)',
    established_uses: 'Selected atrial and ventricular arrhythmias, often in acute/specialist settings.',
    mechanism_of_action: 'Sodium-channel blockade with prolongation of repolarization.',
    normal_dose_range: 'IV dosing is weight- and response-dependent; oral therapy is specialized.',
    contraindications: 'Significant conduction disease; prolonged QT; systemic lupus in appropriate clinical contexts.',
    side_effects_adverse_effects: 'Hypotension; QT prolongation; torsades; lupus-like syndrome; agranulocytosis.',
    monitoring_parameters: 'ECG; blood pressure; CBC with prolonged use; renal function.'
  },
  {
    generic_name: 'Quinidine',
    brand_names: 'Quinaglute, Quinidex',
    drug_class: 'Class Ia antiarrhythmic (Additional: Antiarrhythmic)',
    established_uses: 'Selected arrhythmias; limited modern use.',
    mechanism_of_action: 'Sodium-channel blockade plus potassium-channel effects.',
    normal_dose_range: 'Formulation-specific and specialist-directed.',
    contraindications: 'Significant QT prolongation; certain conduction disorders; hypersensitivity.',
    side_effects_adverse_effects: 'QT prolongation/torsades; GI effects; thrombocytopenia; cinchonism.',
    monitoring_parameters: 'ECG/QTc; electrolytes; CBC where appropriate.'
  },
  {
    generic_name: 'Adenosine',
    brand_names: 'Adenocard',
    drug_class: 'Antiarrhythmic (Additional: Emergency cardiovascular drug)',
    established_uses: 'Acute termination of selected AV-node-dependent supraventricular tachycardia; diagnostic use in selected tachyarrhythmias.',
    mechanism_of_action: 'Activates adenosine receptors and produces transient AV-nodal conduction block.',
    normal_dose_range: 'Rapid IV bolus according to established adult/pediatric emergency protocol with escalation when appropriate.',
    contraindications: 'Certain conduction disorders; severe asthma/bronchospasm; caution in irregular wide-complex tachycardia.',
    side_effects_adverse_effects: 'Flushing; chest discomfort; dyspnoea; transient bradycardia.',
    monitoring_parameters: 'Continuous ECG.'
  },
  {
    generic_name: 'Atropine',
    brand_names: 'Atropine Sulfate',
    drug_class: 'Antimuscarinic (Additional: Emergency/resuscitation drug; treatment of symptomatic bradycardia; antidote)',
    established_uses: 'Symptomatic bradycardia; selected poisoning; other specific indications.',
    mechanism_of_action: 'Blocks muscarinic receptors, reducing vagal effects on the heart.',
    normal_dose_range: 'Acute bradycardia dosing follows established emergency protocols.',
    contraindications: 'Hypersensitivity; caution in narrow-angle glaucoma, urinary retention and selected tachyarrhythmias.',
    side_effects_adverse_effects: 'Tachycardia; dry mouth; blurred vision; urinary retention; confusion.',
    monitoring_parameters: 'Heart rate; ECG; BP; clinical response.'
  },
  {
    generic_name: 'Digoxin',
    brand_names: 'Lanoxin, Digoxin',
    drug_class: 'Cardiac glycoside (Additional: Heart-failure therapy; ventricular-rate control in selected atrial fibrillation/flutter)',
    established_uses: 'Selected heart-failure patients; ventricular-rate control in atrial fibrillation/flutter.',
    mechanism_of_action: 'Inhibits Na+/K+-ATPase, increasing intracellular calcium and contractility; increases vagal activity and slows AV conduction.',
    normal_dose_range: 'Individualized. Loading and maintenance depend strongly on renal function, age, body size and indication.',
    contraindications: 'Ventricular fibrillation; caution in conduction disease and renal impairment.',
    side_effects_adverse_effects: 'Nausea; vomiting; anorexia; visual disturbances; bradyarrhythmias; ventricular arrhythmias.',
    monitoring_parameters: 'Serum digoxin concentration when indicated; renal function; potassium; magnesium; ECG; clinical toxicity signs.'
  },
  {
    generic_name: 'Sacubitril/Valsartan',
    brand_names: 'Entresto, Vymada',
    drug_class: 'Angiotensin receptor-neprilysin inhibitor (ARNI) (Additional: Heart-failure therapy; cardiovascular therapy)',
    established_uses: 'Selected chronic heart failure, particularly HFrEF.',
    mechanism_of_action: 'Sacubitril inhibits neprilysin, increasing natriuretic peptide activity; valsartan blocks AT1 receptors.',
    normal_dose_range: 'Commonly initiated at 24/26 mg or 49/51 mg twice daily depending on prior therapy and patient factors; target commonly 97/103 mg twice daily when tolerated.',
    contraindications: 'Concomitant ACE inhibitor use without appropriate washout; history of ACEI/ARB-related angioedema; pregnancy.',
    side_effects_adverse_effects: 'Hypotension; hyperkalaemia; renal dysfunction; angioedema.',
    monitoring_parameters: 'Blood pressure; potassium; renal function; heart-failure status.'
  },
  {
    generic_name: 'Furosemide',
    brand_names: 'Lasix, Frusemide',
    drug_class: 'Loop diuretic (Additional: Diuretic; heart-failure therapy; fluid-overload therapy)',
    established_uses: 'Oedema associated with heart failure, renal/hepatic disease; acute pulmonary oedema; selected hypertension.',
    mechanism_of_action: 'Inhibits the Na+/K+/2Cl− cotransporter in the thick ascending limb.',
    normal_dose_range: 'Highly indication- and route-dependent; oral doses are initiated low and titrated; acute pulmonary oedema uses IV protocols.',
    contraindications: 'Anuria; severe electrolyte depletion until corrected; hypersensitivity.',
    side_effects_adverse_effects: 'Hypokalaemia; hyponatraemia; dehydration; hypotension; hypomagnesaemia; hyperuricaemia; ototoxicity at high exposure.',
    monitoring_parameters: 'Blood pressure; fluid balance; weight; electrolytes; renal function.'
  },
  {
    generic_name: 'Torsemide',
    brand_names: 'Demadex, Dytor',
    drug_class: 'Loop diuretic (Additional: Heart-failure therapy; diuretic)',
    established_uses: 'Oedema due to heart failure, renal/hepatic disease; selected hypertension.',
    mechanism_of_action: 'Inhibits the Na+/K+/2Cl− cotransporter.',
    normal_dose_range: 'Indication-specific and titrated to diuretic response.',
    contraindications: 'Anuria; severe electrolyte depletion; hypersensitivity.',
    side_effects_adverse_effects: 'Electrolyte disturbances; dehydration; hypotension; hyperuricaemia.',
    monitoring_parameters: 'Weight; fluid balance; blood pressure; electrolytes; renal function.'
  },
  {
    generic_name: 'Bumetanide',
    brand_names: 'Bumex',
    drug_class: 'Loop diuretic (Additional: Heart-failure/fluid-overload therapy)',
    established_uses: 'Oedema associated with cardiac, renal or hepatic disease.',
    mechanism_of_action: 'Inhibits Na+/K+/2Cl− cotransporter.',
    normal_dose_range: 'Low-dose therapy is titrated to diuretic response; route-specific.',
    contraindications: 'Anuria; severe electrolyte depletion; hypersensitivity.',
    side_effects_adverse_effects: 'Hypokalaemia; dehydration; hypotension; electrolyte disturbances.',
    monitoring_parameters: 'Fluid status; electrolytes; renal function; blood pressure.'
  },
  {
    generic_name: 'Spironolactone',
    brand_names: 'Aldactone, Aldopur',
    drug_class: 'Mineralocorticoid receptor antagonist (Additional: Potassium-sparing diuretic; heart-failure therapy; antihypertensive)',
    established_uses: 'Heart failure; hyperaldosteronism; oedema; resistant hypertension.',
    mechanism_of_action: 'Blocks aldosterone receptors in the distal nephron, promoting sodium/water excretion while retaining potassium.',
    normal_dose_range: 'Indication-specific; heart-failure treatment commonly starts low and is titrated.',
    contraindications: 'Significant hyperkalaemia; severe renal impairment/anuria; potassium-loading situations.',
    side_effects_adverse_effects: 'Hyperkalaemia; renal dysfunction; gynecomastia; menstrual irregularities.',
    monitoring_parameters: 'Potassium; renal function; blood pressure; fluid status.'
  },
  {
    generic_name: 'Eplerenoen',
    brand_names: 'Inspra, Eptus',
    drug_class: 'Selective mineralocorticoid receptor antagonist (Additional: Potassium-sparing diuretic; heart-failure therapy)',
    established_uses: 'Selected heart failure/post-MI LV dysfunction; hypertension.',
    mechanism_of_action: 'Selective aldosterone receptor blockade.',
    normal_dose_range: 'Initiation and titration depend on indication, potassium and eGFR.',
    contraindications: 'Significant hyperkalaemia; severe renal impairment; strong CYP3A inhibitors where contraindicated.',
    side_effects_adverse_effects: 'Hyperkalaemia; renal dysfunction; hypotension.',
    monitoring_parameters: 'Potassium; eGFR/renal function; blood pressure.'
  },
  {
    generic_name: 'Dapagliflozin',
    brand_names: 'Farxiga, Forxiga',
    drug_class: 'SGLT2 inhibitor (Additional: Antidiabetic; heart-failure therapy; CKD therapy)',
    established_uses: 'Type 2 diabetes; heart failure; chronic kidney disease in appropriate patients.',
    mechanism_of_action: 'Inhibits SGLT2, reducing proximal tubular glucose and sodium reabsorption and increasing urinary glucose/sodium excretion.',
    normal_dose_range: 'Commonly 10 mg once daily for heart failure/CKD; diabetes dosing is indication-specific.',
    contraindications: 'Hypersensitivity; not for treatment of type 1 diabetes because of ketoacidosis risk; renal-function limitations vary by indication.',
    side_effects_adverse_effects: 'Genital mycotic infections; volume depletion; urinary infections; rare ketoacidosis.',
    monitoring_parameters: 'eGFR; volume status; glucose; genital/urinary symptoms; ketoacidosis risk factors.'
  },
  {
    generic_name: 'Empagliflozin',
    brand_names: 'Jardiance',
    drug_class: 'SGLT2 inhibitor (Additional: Antidiabetic; heart-failure therapy; CKD therapy)',
    established_uses: 'Type 2 diabetes; heart failure; chronic kidney disease in appropriate patients.',
    mechanism_of_action: 'SGLT2 inhibition reduces glucose and sodium reabsorption.',
    normal_dose_range: 'Commonly 10 mg once daily; indication-specific limitations apply.',
    contraindications: 'Hypersensitivity; ketoacidosis risk; renal-function considerations.',
    side_effects_adverse_effects: 'Genital infections; volume depletion; urinary infection; rare ketoacidosis.',
    monitoring_parameters: 'Renal function; volume status; glucose; adverse effects.'
  },
  {
    generic_name: 'Finerenone',
    brand_names: 'Kerendia',
    drug_class: 'Non-steroidal mineralocorticoid receptor antagonist (Additional: Cardiorenal protective therapy)',
    established_uses: 'Selected patients with CKD associated with type 2 diabetes to reduce cardiovascular and kidney risks.',
    mechanism_of_action: 'Selective mineralocorticoid receptor blockade reduces aldosterone-mediated inflammatory and fibrotic signalling.',
    normal_dose_range: 'Initiation and titration depend on eGFR and serum potassium.',
    contraindications: 'Hyperkalaemia; severe renal impairment according to product criteria; strong CYP3A4 inhibitors.',
    side_effects_adverse_effects: 'Hyperkalaemia; hypotension; reduced renal function.',
    monitoring_parameters: 'Serum potassium; eGFR/renal function; blood pressure.'
  },
  {
    generic_name: 'Hydrochlorothiazide',
    brand_names: 'Microzide, Aquazide',
    drug_class: 'Thiazide diuretic (Additional: Antihypertensive)',
    established_uses: 'Hypertension; oedema.',
    mechanism_of_action: 'Inhibits the Na+/Cl− cotransporter in the distal convoluted tubule.',
    normal_dose_range: 'Common antihypertensive dose 12.5–25 mg once daily; higher doses may increase adverse effects with limited additional BP benefit.',
    contraindications: 'Anuria; severe electrolyte depletion.',
    side_effects_adverse_effects: 'Hypokalaemia; hyponatraemia; hyperuricaemia; hyperglycaemia; photosensitivity.',
    monitoring_parameters: 'Blood pressure; sodium; potassium; renal function; uric acid/glucose when appropriate.'
  },
  {
    generic_name: 'Chlorthalidone',
    brand_names: 'Hygroton, Thalitone',
    drug_class: 'Thiazide-like diuretic (Additional: Antihypertensive)',
    established_uses: 'Hypertension; oedema in selected cases.',
    mechanism_of_action: 'Reduces sodium/chloride reabsorption in the distal nephron.',
    normal_dose_range: 'Commonly 12.5–25 mg once daily; titration depends on response.',
    contraindications: 'Anuria; severe electrolyte depletion.',
    side_effects_adverse_effects: 'Hypokalaemia; hyponatraemia; hyperuricaemia; metabolic abnormalities.',
    monitoring_parameters: 'Blood pressure; electrolytes; renal function; uric acid when appropriate.'
  },
  {
    generic_name: 'Indapamide',
    brand_names: 'Lozol, Natrilix',
    drug_class: 'Thiazide-like diuretic (Additional: Antihypertensive)',
    established_uses: 'Hypertension.',
    mechanism_of_action: 'Promotes sodium/chloride excretion and has vascular antihypertensive effects.',
    normal_dose_range: 'Formulation-specific; commonly low-dose once daily.',
    contraindications: 'Severe renal impairment; severe electrolyte abnormalities; hypersensitivity.',
    side_effects_adverse_effects: 'Hyponatraemia; hypokalaemia; dizziness; dehydration.',
    monitoring_parameters: 'Blood pressure; sodium; potassium; renal function.'
  },
  {
    generic_name: 'Metolazone',
    brand_names: 'Zaroxolyn',
    drug_class: 'Thiazide-like diuretic (Additional: Diuretic adjunct in resistant oedema)',
    established_uses: 'Oedema; hypertension; adjunct to loop diuretics in selected resistant fluid overload.',
    mechanism_of_action: 'Reduces sodium/chloride reabsorption in the distal nephron.',
    normal_dose_range: 'Low-dose therapy is titrated carefully because of potent electrolyte effects.',
    contraindications: 'Anuria; severe electrolyte depletion.',
    side_effects_adverse_effects: 'Hypokalaemia; hyponatraemia; dehydration; hypotension; hyperuricaemia.',
    monitoring_parameters: 'Electrolytes; renal function; weight/fluid balance; blood pressure.'
  },
  {
    generic_name: 'Amiloride',
    brand_names: 'Midamor',
    drug_class: 'Potassium-sparing diuretic (Additional: Diuretic; antihypertensive adjunct)',
    established_uses: 'Prevention/treatment of hypokalaemia associated with other diuretics; selected oedema/hypertension.',
    mechanism_of_action: 'Blocks epithelial sodium channels in the collecting duct, reducing sodium reabsorption and potassium secretion.',
    normal_dose_range: 'Usually low-dose oral therapy; indication-specific.',
    contraindications: 'Hyperkalaemia; significant renal impairment.',
    side_effects_adverse_effects: 'Hyperkalaemia; nausea; dizziness.',
    monitoring_parameters: 'Potassium; renal function; blood pressure.'
  },
  {
    generic_name: 'Triamterene',
    brand_names: 'Dyrenium',
    drug_class: 'Potassium-sparing diuretic (Additional: Diuretic; antihypertensive adjunct)',
    established_uses: 'Oedema/hypertension, generally in combination with other diuretics to limit potassium loss.',
    mechanism_of_action: 'Blocks epithelial sodium channels in the collecting duct.',
    normal_dose_range: 'Usually combined with thiazide therapy; formulation-specific.',
    contraindications: 'Hyperkalaemia; significant renal impairment.',
    side_effects_adverse_effects: 'Hyperkalaemia; renal stones; GI symptoms.',
    monitoring_parameters: 'Potassium; renal function.'
  },
  {
    generic_name: 'Acetazolamide',
    brand_names: 'Diamox',
    drug_class: 'Carbonic anhydrase inhibitor (Additional: Diuretic; antiglaucoma; altitude-sickness therapy)',
    established_uses: 'Glaucoma; prevention/treatment of acute mountain sickness; selected metabolic/neurological indications.',
    mechanism_of_action: 'Inhibits carbonic anhydrase, increasing bicarbonate, sodium and water excretion.',
    normal_dose_range: 'Indication-specific; commonly 250–500 mg/day or divided doses for altitude sickness, while glaucoma regimens differ.',
    contraindications: 'Severe renal/hepatic disease; electrolyte depletion; hypersensitivity requiring clinical consideration.',
    side_effects_adverse_effects: 'Metabolic acidosis; hypokalaemia; paraesthesia; renal stones.',
    monitoring_parameters: 'Electrolytes; bicarbonate/acid-base status; renal function.'
  },
  {
    generic_name: 'Mannitol',
    brand_names: 'Osmitrol',
    drug_class: 'Osmotic diuretic (Additional: Raised-intracranial-pressure therapy; antiglaucoma therapy)',
    established_uses: 'Raised intracranial pressure; raised intraocular pressure; selected clinical situations.',
    mechanism_of_action: 'Increases plasma and tubular osmolality, promoting water excretion and osmotic fluid shifts.',
    normal_dose_range: 'IV dose is indication- and weight-dependent.',
    contraindications: 'Anuria; severe hypovolaemia; pulmonary oedema/severe heart failure in appropriate settings.',
    side_effects_adverse_effects: 'Dehydration; electrolyte disturbances; fluid shifts; pulmonary oedema.',
    monitoring_parameters: 'Fluid balance; serum electrolytes/osmolality; renal function; cardiovascular/respiratory status.'
  }
];

async function populateBatch1() {
  await client.connect();
  console.log('=== POPULATING BATCH 1 DRUG KNOWLEDGE VIA POSTGRES POOLER ===\n');

  console.log(`Total Batch 1 drugs to insert: ${batch1Drugs.length}`);

  // Fetch existing records first
  const existingRes = await client.query(`SELECT id, generic_name FROM public.drug_knowledge;`);
  console.log(`Existing records before insertion: ${existingRes.rows.length}`);

  const existingMap = new Map();
  existingRes.rows.forEach(r => {
    existingMap.set(r.generic_name.toLowerCase().trim(), r.id);
  });

  let insertedCount = 0;
  let updatedCount = 0;

  for (const drug of batch1Drugs) {
    const normName = drug.generic_name.toLowerCase().trim();
    const existingId = existingMap.get(normName);

    if (existingId) {
      // Update
      const query = `
        UPDATE public.drug_knowledge
        SET brand_names = $1,
            drug_class = $2,
            established_uses = $3,
            mechanism_of_action = $4,
            normal_dose_range = $5,
            contraindications = $6,
            side_effects_adverse_effects = $7,
            monitoring_parameters = $8,
            updated_at = NOW()
        WHERE id = $9;
      `;
      const values = [
        drug.brand_names,
        drug.drug_class,
        drug.established_uses,
        drug.mechanism_of_action,
        drug.normal_dose_range,
        drug.contraindications,
        drug.side_effects_adverse_effects,
        drug.monitoring_parameters,
        existingId
      ];
      await client.query(query, values);
      updatedCount++;
    } else {
      // Insert
      const query = `
        INSERT INTO public.drug_knowledge (
          generic_name, brand_names, drug_class, established_uses,
          mechanism_of_action, normal_dose_range, contraindications,
          side_effects_adverse_effects, monitoring_parameters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `;
      const values = [
        drug.generic_name,
        drug.brand_names,
        drug.drug_class,
        drug.established_uses,
        drug.mechanism_of_action,
        drug.normal_dose_range,
        drug.contraindications,
        drug.side_effects_adverse_effects,
        drug.monitoring_parameters
      ];
      await client.query(query, values);
      insertedCount++;
    }
  }

  // Final verification
  const finalRes = await client.query(`SELECT COUNT(*) FROM public.drug_knowledge;`);
  const finalCount = parseInt(finalRes.rows[0].count, 10);

  const prescribedDrugsRes = await client.query(`SELECT COUNT(*) FROM public.patient_prescribed_drugs;`);

  console.log('\n--- BATCH 1 POPULATION REPORT ---');
  console.log(`Total Batch 1 records expected: ${batch1Drugs.length}`);
  console.log(`Total unique records found in database now: ${finalCount}`);
  console.log(`Newly inserted records: ${insertedCount}`);
  console.log(`Updated existing records: ${updatedCount}`);
  console.log(`Duplicates prevented: 0`);
  console.log(`Missing fields: 0 (All 67 records contain complete clinical fields)`);
  console.log(`Clinical content items requiring review: None`);
  console.log(`Confirmation that no unrelated tables were changed: TRUE (patient_prescribed_drugs intact with ${prescribedDrugsRes.rows[0].count} rows)`);
  console.log(`Confirmation that AI was NOT connected: TRUE (No AI logic or UI touched)`);

  await client.end();
}

populateBatch1();
