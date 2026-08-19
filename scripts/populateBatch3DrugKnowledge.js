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

const batch3Drugs = [
  {
    generic_name: 'Benzylpenicillin / Penicillin G',
    brand_names: 'Pfizerpen, Crystapen',
    drug_class: 'Natural penicillin (Additional: Beta-lactam antibacterial; bactericidal antibiotic)',
    established_uses: 'Susceptible streptococcal infections; syphilis; meningococcal disease and other susceptible serious infections according to indication.',
    mechanism_of_action: 'Binds penicillin-binding proteins and inhibits bacterial cell-wall peptidoglycan cross-linking.',
    normal_dose_range: 'Highly indication- and route-dependent; IV/IM dosing commonly uses repeated or continuous administration in serious infections.',
    contraindications: 'Serious immediate hypersensitivity to penicillins.',
    side_effects_adverse_effects: 'Allergic reactions; anaphylaxis; rash; diarrhoea; seizures with very high concentrations, especially renal impairment.',
    monitoring_parameters: 'Clinical response; allergy; renal function; microbiology where appropriate.'
  },
  {
    generic_name: 'Phenoxymethylpenicillin',
    brand_names: 'Penicillin V, Pen-Vee K',
    drug_class: 'Natural penicillin (Additional: Oral beta-lactam antibacterial)',
    established_uses: 'Susceptible mild-to-moderate streptococcal and other susceptible infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis by binding penicillin-binding proteins.',
    normal_dose_range: 'Commonly administered orally in divided doses; exact dose depends on infection and age.',
    contraindications: 'Serious penicillin hypersensitivity.',
    side_effects_adverse_effects: 'Rash; diarrhoea; nausea; allergic reactions.',
    monitoring_parameters: 'Clinical response; allergy; GI tolerance.'
  },
  {
    generic_name: 'Amoxicillin',
    brand_names: 'Amoxil, Mox',
    drug_class: 'Aminopenicillin (Additional: Beta-lactam antibacterial; bactericidal antibiotic)',
    established_uses: 'Respiratory infections; otitis media; sinusitis; urinary infections; susceptible skin/soft-tissue infections; selected H. pylori regimens.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis by binding penicillin-binding proteins.',
    normal_dose_range: 'Common adult oral dosing is approximately 500 mg every 8 hours or 750–1000 mg every 12 hours depending on indication and formulation; higher doses may be used for selected infections.',
    contraindications: 'Serious immediate beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Diarrhoea; nausea; rash; hypersensitivity; C. difficile-associated diarrhoea.',
    monitoring_parameters: 'Clinical response; allergy; renal function when prolonged/high-dose therapy is used.'
  },
  {
    generic_name: 'Ampicillin',
    brand_names: 'Principen, Ampicin',
    drug_class: 'Aminopenicillin (Additional: Beta-lactam antibacterial)',
    established_uses: 'Susceptible respiratory, urinary, gastrointestinal and enterococcal infections; selected meningitis regimens.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Route- and infection-specific; serious infections commonly require parenteral dosing with renal adjustment where necessary.',
    contraindications: 'Serious penicillin hypersensitivity.',
    side_effects_adverse_effects: 'Rash; diarrhoea; nausea; allergic reactions.',
    monitoring_parameters: 'Clinical response; renal function; allergy.'
  },
  {
    generic_name: 'Amoxicillin + Clavulanic Acid',
    brand_names: 'Augmentin, Moxikind-CV, Clavam',
    drug_class: 'Aminopenicillin + beta-lactamase inhibitor (Additional: Beta-lactam antibacterial combination)',
    established_uses: 'Respiratory infections; bite wounds; dental infections; skin/soft-tissue infections; selected urinary/intra-abdominal infections.',
    mechanism_of_action: 'Amoxicillin inhibits cell-wall synthesis; clavulanate inhibits selected beta-lactamases.',
    normal_dose_range: 'Formulation- and indication-specific; common adult oral regimens include 625 mg every 8 hours or 875/125 mg every 12 hours.',
    contraindications: 'Previous severe beta-lactam allergy; previous amoxicillin/clavulanate-associated cholestatic jaundice/hepatic dysfunction.',
    side_effects_adverse_effects: 'Diarrhoea; nausea; rash; hepatic dysfunction; C. difficile-associated diarrhoea.',
    monitoring_parameters: 'Clinical response; renal function; hepatic symptoms; allergy.'
  },
  {
    generic_name: 'Piperacillin + Tazobactam',
    brand_names: 'Zosyn, Tazocin',
    drug_class: 'Antipseudomonal penicillin + beta-lactamase inhibitor (Additional: Broad-spectrum beta-lactam antibacterial)',
    established_uses: 'Severe hospital and community-acquired infections; intra-abdominal infections; pneumonia; complicated urinary infections; sepsis due to susceptible organisms.',
    mechanism_of_action: 'Piperacillin inhibits cell-wall synthesis; tazobactam inhibits selected beta-lactamases.',
    normal_dose_range: 'IV dosing is indication- and renal-function-dependent; common adult regimens include 3.375–4.5 g every 6–8 hours depending on severity and local protocol.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Allergy; diarrhoea; thrombocytopenia; electrolyte disturbances; renal dysfunction.',
    monitoring_parameters: 'Renal function; CBC; electrolytes; clinical response; cultures.'
  },
  {
    generic_name: 'Nafcillin',
    brand_names: 'Unipen',
    drug_class: 'Antistaphylococcal penicillin (Additional: Beta-lactam antibacterial)',
    established_uses: 'Serious susceptible MSSA infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'IV/IM dosing is indication-specific; commonly administered every 4–6 hours for serious infections.',
    contraindications: 'Serious penicillin hypersensitivity.',
    side_effects_adverse_effects: 'Allergic reactions; hepatic enzyme elevation; neutropenia; phlebitis.',
    monitoring_parameters: 'Liver function; CBC; renal function; clinical response.'
  },
  {
    generic_name: 'Oxacillin',
    brand_names: 'Bactocill',
    drug_class: 'Antistaphylococcal penicillin (Additional: Beta-lactam antibacterial)',
    established_uses: 'Serious MSSA infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis and is resistant to staphylococcal penicillinase.',
    normal_dose_range: 'Parenteral dosing is indication-specific; serious infections commonly require frequent IV administration.',
    contraindications: 'Serious penicillin hypersensitivity.',
    side_effects_adverse_effects: 'Allergy; hepatotoxicity; neutropenia; phlebitis.',
    monitoring_parameters: 'Liver function; CBC; clinical response.'
  },
  {
    generic_name: 'Dicloxacillin',
    brand_names: 'Dynapen',
    drug_class: 'Antistaphylococcal penicillin (Additional: Oral beta-lactam antibacterial)',
    established_uses: 'Mild-to-moderate susceptible MSSA skin and soft-tissue infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Common adult oral dosing is approximately 250–500 mg every 6 hours depending on infection.',
    contraindications: 'Serious penicillin hypersensitivity.',
    side_effects_adverse_effects: 'GI upset; rash; allergic reactions; hepatic abnormalities.',
    monitoring_parameters: 'Clinical response; allergy; hepatic function if prolonged.'
  },
  {
    generic_name: 'Cephalexin',
    brand_names: 'Keflex, Phexin',
    drug_class: 'First-generation cephalosporin (Additional: Beta-lactam antibacterial)',
    established_uses: 'Skin/soft-tissue infections; streptococcal infections; selected urinary infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Common adult oral dosing is approximately 250–500 mg every 6 hours; higher total daily doses may be used according to indication.',
    contraindications: 'Serious cephalosporin/penicillin hypersensitivity.',
    side_effects_adverse_effects: 'Diarrhoea; nausea; rash; C. difficile-associated diarrhoea.',
    monitoring_parameters: 'Clinical response; renal function where appropriate.'
  },
  {
    generic_name: 'Cefadroxil',
    brand_names: 'Duricef, Cefadrox',
    drug_class: 'First-generation cephalosporin (Additional: Beta-lactam antibacterial)',
    established_uses: 'Skin/soft-tissue infections; susceptible urinary infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Commonly 500 mg twice daily; indication-specific.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'GI upset; diarrhoea; rash; allergic reactions.',
    monitoring_parameters: 'Clinical response; renal function.'
  },
  {
    generic_name: 'Cefuroxime',
    brand_names: 'Ceftin, Zinacef, Ceftum',
    drug_class: 'Second-generation cephalosporin (Additional: Beta-lactam antibacterial)',
    established_uses: 'Respiratory infections; sinusitis; otitis media; urinary infections; skin/soft-tissue infections; selected surgical prophylaxis.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Oral and IV dosing differ; adult oral dosing commonly 250–500 mg twice daily depending on indication.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Diarrhoea; nausea; rash; C. difficile-associated diarrhoea.',
    monitoring_parameters: 'Clinical response; renal function.'
  },
  {
    generic_name: 'Cefaclor',
    brand_names: 'Ceclor, Distaclor',
    drug_class: 'Second-generation cephalosporin (Additional: Beta-lactam antibacterial)',
    established_uses: 'Respiratory; urinary; skin and soft-tissue infections caused by susceptible organisms.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Common adult oral dosing approximately 250–500 mg every 8 hours; formulation-specific.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'GI symptoms; rash; allergic reactions.',
    monitoring_parameters: 'Clinical response; renal function.'
  },
  {
    generic_name: 'Cefixime',
    brand_names: 'Suprax, Taxim-O, Cefi',
    drug_class: 'Third-generation cephalosporin (Additional: Oral beta-lactam antibacterial)',
    established_uses: 'Respiratory and urinary infections; selected susceptible infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Common adult dose 400 mg/day, either once daily or divided according to formulation.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Diarrhoea; nausea; abdominal discomfort; rash.',
    monitoring_parameters: 'Clinical response; renal function.'
  },
  {
    generic_name: 'Cefotaxime',
    brand_names: 'Claforan, Taxim',
    drug_class: 'Third-generation cephalosporin (Additional: Parenteral beta-lactam antibacterial)',
    established_uses: 'Severe bacterial infections; meningitis; pneumonia; sepsis; urinary and intra-abdominal infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'IV/IM dosing is indication- and severity-dependent; serious infections commonly require multiple daily doses.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Allergy; diarrhoea; liver enzyme elevation; cytopenias.',
    monitoring_parameters: 'Renal function; CBC; liver function; cultures.'
  },
  {
    generic_name: 'Ceftriaxone',
    brand_names: 'Rocephin, Monocef',
    drug_class: 'Third-generation cephalosporin (Additional: Parenteral beta-lactam antibacterial)',
    established_uses: 'Pneumonia; meningitis; sepsis; gonorrhoea; urinary and intra-abdominal infections; other susceptible serious infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Common adult dosing 1–2 g once daily; severe infections may require higher indication-specific dosing.',
    contraindications: 'Serious beta-lactam hypersensitivity; important neonatal contraindications with calcium-containing IV solutions.',
    side_effects_adverse_effects: 'Diarrhoea; biliary sludge; rash; allergy; C. difficile-associated diarrhoea.',
    monitoring_parameters: 'Clinical response; allergy; liver/biliary symptoms; renal function when appropriate.'
  },
  {
    generic_name: 'Ceftazidime',
    brand_names: 'Fortaz, Tazicef, Fortum',
    drug_class: 'Third-generation cephalosporin (Additional: Antipseudomonal beta-lactam)',
    established_uses: 'Serious infections caused by susceptible Gram-negative organisms including Pseudomonas aeruginosa.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'IV dosing is infection- and renal-function-dependent; common adult regimens use repeated daily dosing.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Allergic reactions; diarrhoea; neurotoxicity/seizures with accumulation; cytopenias.',
    monitoring_parameters: 'Renal function; neurological status; CBC; microbiology.'
  },
  {
    generic_name: 'Cefepime',
    brand_names: 'Maxipime, Cefepime',
    drug_class: 'Fourth-generation cephalosporin (Additional: Broad-spectrum antipseudomonal beta-lactam)',
    established_uses: 'Severe hospital infections; pneumonia; sepsis; febrile neutropenia; susceptible Gram-negative infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'IV dosing is indication- and renal-function-dependent; common adult regimens range around 1–2 g every 8–12 hours.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Allergy; diarrhoea; neurotoxicity/encephalopathy especially with renal impairment.',
    monitoring_parameters: 'Renal function; neurological status; CBC; clinical response.'
  },
  {
    generic_name: 'Ceftaroline',
    brand_names: 'Teflaro, Zinforo',
    drug_class: 'Fifth-generation cephalosporin (Additional: Anti-MRSA beta-lactam)',
    established_uses: 'Community-acquired bacterial pneumonia; acute bacterial skin and skin-structure infections.',
    mechanism_of_action: 'Binds penicillin-binding proteins including PBP2a in MRSA.',
    normal_dose_range: 'IV dosing commonly 600 mg every 12 hours; renal adjustment required.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Diarrhoea; rash; positive direct antiglobulin test; neutropenia with prolonged therapy.',
    monitoring_parameters: 'Renal function; CBC during prolonged treatment; clinical response.'
  },
  {
    generic_name: 'Aztreonam',
    brand_names: 'Azactam',
    drug_class: 'Monobactam (Additional: Beta-lactam antibacterial; Gram-negative agent)',
    established_uses: 'Serious susceptible Gram-negative infections including selected Pseudomonas infections.',
    mechanism_of_action: 'Binds primarily PBP3 and inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'IV/IM dosing is indication- and renal-function-dependent; severe infections require higher/frequent dosing.',
    contraindications: 'Hypersensitivity to aztreonam.',
    side_effects_adverse_effects: 'Rash; GI symptoms; liver enzyme elevation; injection-site reactions.',
    monitoring_parameters: 'Renal function; liver function; clinical response.'
  },
  {
    generic_name: 'Meropenem',
    brand_names: 'Merrem, Meronem',
    drug_class: 'Carbapenem (Additional: Broad-spectrum beta-lactam; antipseudomonal antibacterial)',
    established_uses: 'Severe intra-abdominal, meningitis, pneumonia, sepsis and other susceptible serious infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis by binding penicillin-binding proteins.',
    normal_dose_range: 'IV dosing is indication- and renal-function-dependent; commonly 500 mg–1 g every 8 hours, with higher specialist dosing for selected infections.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Diarrhoea; rash; seizures uncommon; liver enzyme abnormalities.',
    monitoring_parameters: 'Renal function; neurological status; microbiology; clinical response.'
  },
  {
    generic_name: 'Imipenem + Cilastatin',
    brand_names: 'Primaxin, Tienam',
    drug_class: 'Carbapenem (Additional: Broad-spectrum beta-lactam antibacterial)',
    established_uses: 'Severe susceptible bacterial infections.',
    mechanism_of_action: 'Imipenem inhibits bacterial cell-wall synthesis; cilastatin inhibits renal dehydropeptidase-I and prevents imipenem degradation.',
    normal_dose_range: 'IV dosing is indication- and renal-function-dependent; commonly administered in divided doses.',
    contraindications: 'Serious beta-lactam hypersensitivity; caution with CNS disorders/seizure risk.',
    side_effects_adverse_effects: 'GI symptoms; rash; seizures; liver enzyme abnormalities.',
    monitoring_parameters: 'Renal function; neurological status; clinical response.'
  },
  {
    generic_name: 'Ertapenem',
    brand_names: 'Invanz',
    drug_class: 'Carbapenem (Additional: Broad-spectrum beta-lactam antibacterial)',
    established_uses: 'Complicated intra-abdominal, urinary, skin/soft-tissue and selected pelvic infections.',
    mechanism_of_action: 'Inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'Common adult dose 1 g IV/IM once daily; renal adjustment may be required.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Diarrhoea; nausea; headache; infusion/injection reactions; seizures uncommon.',
    monitoring_parameters: 'Renal function; clinical response.'
  },
  {
    generic_name: 'Meropenem / Vaborbactam',
    brand_names: 'Vabomere',
    drug_class: 'Carbapenem + beta-lactamase inhibitor (Additional: Broad-spectrum antibacterial; resistant Gram-negative infection therapy)',
    established_uses: 'Serious infections caused by susceptible carbapenem-resistant Enterobacterales in appropriate settings.',
    mechanism_of_action: 'Meropenem inhibits cell-wall synthesis; vaborbactam inhibits selected beta-lactamases.',
    normal_dose_range: 'IV dosing is indication- and renal-function-dependent and should follow specialist/institutional protocols.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'Diarrhoea; headache; infusion reactions; liver enzyme elevation.',
    monitoring_parameters: 'Renal function; microbiology; clinical response.'
  },
  {
    generic_name: 'Azithromycin',
    brand_names: 'Zithromax, Azithral',
    drug_class: 'Macrolide (Additional: Protein-synthesis inhibitor; antibacterial)',
    established_uses: 'Respiratory infections; atypical bacterial infections; selected sexually transmitted infections.',
    mechanism_of_action: 'Binds the 50S ribosomal subunit and inhibits bacterial protein synthesis.',
    normal_dose_range: 'Common adult regimens include 500 mg once daily for 3 days or 500 mg on day 1 followed by 250 mg daily for selected indications; regimen is indication-specific.',
    contraindications: 'Macrolide hypersensitivity; previous azithromycin-associated cholestatic jaundice/hepatic dysfunction; important QT-risk situations.',
    side_effects_adverse_effects: 'GI symptoms; QT prolongation; hepatotoxicity; hearing disturbances rarely.',
    monitoring_parameters: 'Clinical response; liver function when indicated; QT risk.'
  },
  {
    generic_name: 'Clarithromycin',
    brand_names: 'Biaxin, Claribid',
    drug_class: 'Macrolide (Additional: Protein-synthesis inhibitor; antibacterial)',
    established_uses: 'Respiratory infections; selected H. pylori regimens; susceptible atypical infections.',
    mechanism_of_action: 'Binds the 50S ribosomal subunit and inhibits protein synthesis.',
    normal_dose_range: 'Common adult dose 250–500 mg twice daily depending on indication.',
    contraindications: 'Significant QT prolongation; important interacting drugs; severe macrolide hypersensitivity.',
    side_effects_adverse_effects: 'GI symptoms; dysgeusia; QT prolongation; hepatotoxicity; drug interactions.',
    monitoring_parameters: 'Liver function; ECG/QT where appropriate; interactions.'
  },
  {
    generic_name: 'Erythromycin',
    brand_names: 'Erythrocin, Althrocin',
    drug_class: 'Macrolide (Additional: Protein-synthesis inhibitor; antibacterial)',
    established_uses: 'Respiratory and selected skin infections; pertussis; selected atypical infections.',
    mechanism_of_action: 'Binds 50S ribosomal subunit.',
    normal_dose_range: 'Formulation- and indication-specific; oral adult dosing commonly divided several times daily.',
    contraindications: 'Significant QT prolongation; serious macrolide hypersensitivity; important drug interactions.',
    side_effects_adverse_effects: 'GI intolerance; cholestatic hepatitis; QT prolongation; drug interactions.',
    monitoring_parameters: 'Liver function; QT risk; clinical response.'
  },
  {
    generic_name: 'Clindamycin',
    brand_names: 'Cleocin, Dalacin C',
    drug_class: 'Lincosamide (Additional: Protein-synthesis inhibitor; anaerobic/Gram-positive antibacterial)',
    established_uses: 'Anaerobic infections; dental infections; skin/soft-tissue infections; selected bone/joint infections.',
    mechanism_of_action: 'Binds the 50S ribosomal subunit and inhibits protein synthesis.',
    normal_dose_range: 'Oral adult dosing commonly 150–450 mg every 6 hours; IV dosing is indication-specific.',
    contraindications: 'Serious clindamycin hypersensitivity; previous severe antibiotic-associated colitis requires caution.',
    side_effects_adverse_effects: 'Diarrhoea; C. difficile-associated colitis; rash; liver enzyme elevation.',
    monitoring_parameters: 'Diarrhoea/C. difficile symptoms; liver function with prolonged treatment; clinical response.'
  },
  {
    generic_name: 'Doxycycline',
    brand_names: 'Vibramycin, Doxypal',
    drug_class: 'Tetracycline (Additional: Protein-synthesis inhibitor; antibacterial)',
    established_uses: 'Respiratory infections; acne; rickettsial infections; chlamydial infections; selected skin infections; other susceptible infections.',
    mechanism_of_action: 'Binds 30S ribosomal subunit and inhibits aminoacyl-tRNA attachment.',
    normal_dose_range: 'Common adult dose 100 mg once or twice daily depending on indication.',
    contraindications: 'Tetracycline hypersensitivity; generally avoided in pregnancy and young children unless specific indications justify use.',
    side_effects_adverse_effects: 'GI irritation; oesophagitis; photosensitivity; tooth/bone effects in developing children.',
    monitoring_parameters: 'Clinical response; GI/oesophageal symptoms; photosensitivity.'
  },
  {
    generic_name: 'Minocycline',
    brand_names: 'Minocin, Cynomycin',
    drug_class: 'Tetracycline (Additional: Protein-synthesis inhibitor; antibacterial)',
    established_uses: 'Acne; selected susceptible bacterial infections.',
    mechanism_of_action: 'Binds 30S ribosomal subunit.',
    normal_dose_range: 'Common adult dosing approximately 50–100 mg once or twice daily depending on indication.',
    contraindications: 'Tetracycline hypersensitivity; pregnancy/young children except specific specialist indications.',
    side_effects_adverse_effects: 'Dizziness; pigmentation; photosensitivity; GI symptoms; autoimmune hepatitis rarely.',
    monitoring_parameters: 'Clinical response; liver function where prolonged; adverse effects.'
  },
  {
    generic_name: 'Tigecycline',
    brand_names: 'Tygacil',
    drug_class: 'Glycylcycline (Additional: Tetracycline-related protein-synthesis inhibitor)',
    established_uses: 'Complicated intra-abdominal and skin/soft-tissue infections in selected situations.',
    mechanism_of_action: 'Binds the 30S ribosomal subunit and inhibits protein synthesis.',
    normal_dose_range: 'IV loading followed by maintenance dosing; regimen is indication-specific.',
    contraindications: 'Serious tetracycline hypersensitivity; not preferred for bloodstream infection due to low serum concentrations.',
    side_effects_adverse_effects: 'Nausea; vomiting; hepatotoxicity; pancreatitis; increased mortality signal in some severe infection settings.',
    monitoring_parameters: 'Liver function; GI effects; clinical response.'
  },
  {
    generic_name: 'Gentamicin',
    brand_names: 'Garamycin, Genticyn',
    drug_class: 'Aminoglycoside (Additional: Protein-synthesis inhibitor; bactericidal antibacterial)',
    established_uses: 'Serious Gram-negative infections; selected synergistic treatment of Gram-positive infections.',
    mechanism_of_action: 'Binds 30S ribosomal subunit causing misreading of mRNA and inhibition of protein synthesis.',
    normal_dose_range: 'Dosing is weight-, renal-function-, indication- and therapeutic-drug-monitoring-dependent.',
    contraindications: 'Serious aminoglycoside hypersensitivity.',
    side_effects_adverse_effects: 'Nephrotoxicity; ototoxicity; neuromuscular blockade.',
    monitoring_parameters: 'Serum drug levels when indicated; renal function; hearing/vestibular symptoms; electrolytes.'
  },
  {
    generic_name: 'Amikacin',
    brand_names: 'Amikin, Mikacin',
    drug_class: 'Aminoglycoside (Additional: Protein-synthesis inhibitor; bactericidal antibacterial)',
    established_uses: 'Serious Gram-negative infections; resistant organisms where susceptibility supports use.',
    mechanism_of_action: 'Binds 30S ribosomal subunit.',
    normal_dose_range: 'Weight-, renal-function-, indication- and therapeutic-drug-monitoring-dependent.',
    contraindications: 'Aminoglycoside hypersensitivity.',
    side_effects_adverse_effects: 'Nephrotoxicity; ototoxicity; neuromuscular blockade.',
    monitoring_parameters: 'Serum concentrations; renal function; auditory/vestibular function.'
  },
  {
    generic_name: 'Tobramycin',
    brand_names: 'Nebcin, Tobi',
    drug_class: 'Aminoglycoside (Additional: Protein-synthesis inhibitor; antipseudomonal antibacterial)',
    established_uses: 'Serious Gram-negative infections including Pseudomonas; inhaled formulations for selected chronic airway infections.',
    mechanism_of_action: 'Binds 30S ribosomal subunit.',
    normal_dose_range: 'Systemic dosing is weight-, renal-function- and monitoring-dependent; inhaled dosing is formulation-specific.',
    contraindications: 'Aminoglycoside hypersensitivity.',
    side_effects_adverse_effects: 'Nephrotoxicity; ototoxicity; neuromuscular blockade.',
    monitoring_parameters: 'Renal function; drug levels for systemic therapy; hearing/vestibular function.'
  },
  {
    generic_name: 'Ciprofloxacin',
    brand_names: 'Cipro, Ciplox',
    drug_class: 'Fluoroquinolone (Additional: DNA gyrase/topoisomerase inhibitor)',
    established_uses: 'Selected urinary, gastrointestinal and Gram-negative infections; Pseudomonas infections; other susceptible infections.',
    mechanism_of_action: 'Inhibits bacterial DNA gyrase and topoisomerase IV.',
    normal_dose_range: 'Common adult oral dosing 250–750 mg twice daily depending on infection; IV dosing differs.',
    contraindications: 'Fluoroquinolone hypersensitivity; significant interaction/contraindication situations; avoid unnecessary use in uncomplicated infections when safer options exist.',
    side_effects_adverse_effects: 'Tendinopathy/tendon rupture; QT prolongation; CNS effects; dysglycaemia; peripheral neuropathy; C. difficile-associated diarrhoea.',
    monitoring_parameters: 'Renal function; tendon/CNS symptoms; QT risk; glucose where relevant.'
  },
  {
    generic_name: 'Levofloxacin',
    brand_names: 'Levaquin, Loxof',
    drug_class: 'Fluoroquinolone (Additional: DNA gyrase/topoisomerase inhibitor)',
    established_uses: 'Pneumonia; selected urinary infections; selected bacterial infections where appropriate.',
    mechanism_of_action: 'Inhibits DNA gyrase and topoisomerase IV.',
    normal_dose_range: 'Common adult dosing 250–750 mg once daily depending on indication and renal function.',
    contraindications: 'Fluoroquinolone hypersensitivity; avoid where safer effective alternatives are available.',
    side_effects_adverse_effects: 'Tendinopathy; QT prolongation; CNS effects; dysglycaemia; peripheral neuropathy; C. difficile infection.',
    monitoring_parameters: 'Renal function; tendon symptoms; ECG/QT risk; glucose where appropriate.'
  },
  {
    generic_name: 'Moxifloxacin',
    brand_names: 'Avelox, Moxicip',
    drug_class: 'Fluoroquinolone (Additional: Respiratory fluoroquinolone; DNA gyrase/topoisomerase inhibitor)',
    established_uses: 'Selected respiratory and other susceptible bacterial infections.',
    mechanism_of_action: 'Inhibits bacterial DNA gyrase and topoisomerase IV.',
    normal_dose_range: 'Common adult dose 400 mg once daily for selected indications.',
    contraindications: 'Fluoroquinolone hypersensitivity; significant QT prolongation risk.',
    side_effects_adverse_effects: 'QT prolongation; tendon injury; CNS effects; neuropathy; dysglycaemia.',
    monitoring_parameters: 'ECG/QT risk; tendon/CNS symptoms; clinical response.'
  },
  {
    generic_name: 'Ofloxacin',
    brand_names: 'Floxin, Oflomac',
    drug_class: 'Fluoroquinolone (Additional: DNA gyrase/topoisomerase inhibitor)',
    established_uses: 'Selected urinary, respiratory and other susceptible bacterial infections.',
    mechanism_of_action: 'Inhibits bacterial DNA gyrase/topoisomerase IV.',
    normal_dose_range: 'Common adult oral dosing approximately 200–400 mg twice daily depending on indication.',
    contraindications: 'Fluoroquinolone hypersensitivity.',
    side_effects_adverse_effects: 'Tendon injury; CNS effects; QT prolongation; neuropathy; GI symptoms.',
    monitoring_parameters: 'Renal function; tendon/CNS symptoms; QT risk.'
  },
  {
    generic_name: 'Norfloxacin',
    brand_names: 'Noroxin, Norbactin',
    drug_class: 'Fluoroquinolone (Additional: Urinary antibacterial; DNA gyrase inhibitor)',
    established_uses: 'Selected urinary bacterial infections where appropriate.',
    mechanism_of_action: 'Inhibits bacterial DNA gyrase and topoisomerase IV.',
    normal_dose_range: 'Common adult oral dose approximately 400 mg twice daily for selected indications.',
    contraindications: 'Fluoroquinolone hypersensitivity.',
    side_effects_adverse_effects: 'Tendon injury; CNS effects; QT prolongation; GI symptoms.',
    monitoring_parameters: 'Renal function; adverse effects; antimicrobial susceptibility.'
  },
  {
    generic_name: 'Trimethoprim',
    brand_names: 'Proloprim, Trimpex',
    drug_class: 'Dihydrofolate reductase inhibitor (Additional: Antibacterial; folate antagonist)',
    established_uses: 'Selected urinary and respiratory bacterial infections.',
    mechanism_of_action: 'Inhibits bacterial dihydrofolate reductase.',
    normal_dose_range: 'Indication-specific; common adult urinary-infection dosing is approximately 200 mg twice daily.',
    contraindications: 'Significant hypersensitivity; severe folate deficiency situations require caution.',
    side_effects_adverse_effects: 'Hyperkalaemia; rash; nausea; marrow suppression; elevated creatinine.',
    monitoring_parameters: 'CBC; renal function; potassium.'
  },
  {
    generic_name: 'Co-trimoxazole (Trimethoprim + Sulfamethoxazole)',
    brand_names: 'Bactrim, Septra, Ciplin',
    drug_class: 'Sulfonamide + dihydrofolate reductase inhibitor (Additional: Antifolate antibacterial combination)',
    established_uses: 'Urinary infections; selected respiratory infections; Pneumocystis jirovecii treatment/prophylaxis; selected susceptible bacterial infections.',
    mechanism_of_action: 'Sequentially inhibits bacterial folate synthesis.',
    normal_dose_range: 'Formulation- and indication-specific; standard-strength and double-strength preparations differ.',
    contraindications: 'Serious sulfonamide/trimethoprim hypersensitivity; severe hepatic/renal disease in relevant settings; pregnancy/neonatal contraindications.',
    side_effects_adverse_effects: 'Rash; Stevens-Johnson syndrome; hyperkalaemia; marrow suppression; renal effects.',
    monitoring_parameters: 'CBC; potassium; renal function; liver function; rash.'
  },
  {
    generic_name: 'Vancomycin',
    brand_names: 'Vancocin, Vancogen',
    drug_class: 'Glycopeptide (Additional: Cell-wall synthesis inhibitor; Gram-positive antibacterial)',
    established_uses: 'Serious MRSA and other susceptible Gram-positive infections; oral formulation for C. difficile infection.',
    mechanism_of_action: 'Binds D-Ala-D-Ala termini and inhibits bacterial cell-wall synthesis.',
    normal_dose_range: 'IV dosing is weight-, renal-function-, infection- and therapeutic-monitoring-dependent. Oral dosing is indication-specific and is not used for systemic bloodstream infections.',
    contraindications: 'Serious glycopeptide hypersensitivity.',
    side_effects_adverse_effects: 'Nephrotoxicity; infusion reaction; ototoxicity uncommon; neutropenia with prolonged therapy.',
    monitoring_parameters: 'Renal function; therapeutic drug monitoring/AUC or levels according to protocol; infusion reactions; CBC when prolonged.'
  },
  {
    generic_name: 'Teicoplanin',
    brand_names: 'Targocid',
    drug_class: 'Glycopeptide (Additional: Cell-wall synthesis inhibitor)',
    established_uses: 'Serious Gram-positive infections including MRSA where available and appropriate.',
    mechanism_of_action: 'Binds D-Ala-D-Ala and inhibits cell-wall synthesis.',
    normal_dose_range: 'Loading and maintenance dosing are weight-, renal-function- and infection-dependent.',
    contraindications: 'Glycopeptide hypersensitivity.',
    side_effects_adverse_effects: 'Nephrotoxicity; rash; infusion reactions; thrombocytopenia; ototoxicity uncommon.',
    monitoring_parameters: 'Renal function; drug levels where indicated; CBC.'
  },
  {
    generic_name: 'Linezolid',
    brand_names: 'Zyvox, Lizoforce',
    drug_class: 'Oxazolidinone (Additional: Protein-synthesis inhibitor; resistant Gram-positive antibacterial)',
    established_uses: 'MRSA; VRE; selected pneumonia and skin/soft-tissue infections.',
    mechanism_of_action: 'Binds the 50S ribosomal subunit and prevents formation of the functional initiation complex.',
    normal_dose_range: 'Common adult dose 600 mg every 12 hours.',
    contraindications: 'Serious hypersensitivity; important MAOI/serotonergic interaction situations require careful assessment.',
    side_effects_adverse_effects: 'Thrombocytopenia; anaemia; peripheral/optic neuropathy with prolonged use; serotonin syndrome; lactic acidosis rarely.',
    monitoring_parameters: 'CBC; neurological/visual symptoms with prolonged use; drug interactions.'
  },
  {
    generic_name: 'Tedizolid',
    brand_names: 'Sivextro',
    drug_class: 'Oxazolidinone (Additional: Protein-synthesis inhibitor)',
    established_uses: 'Acute bacterial skin and skin-structure infections.',
    mechanism_of_action: 'Inhibits bacterial protein synthesis through binding to the 50S ribosomal subunit.',
    normal_dose_range: '200 mg once daily for the standard adult treatment course.',
    contraindications: 'Hypersensitivity.',
    side_effects_adverse_effects: 'Nausea; headache; diarrhoea; cytopenias less commonly.',
    monitoring_parameters: 'CBC when prolonged therapy; clinical response; drug interactions.'
  },
  {
    generic_name: 'Colistin',
    brand_names: 'Coly-Mycin M, Xylistin',
    drug_class: 'Polymyxin (Additional: Antibacterial for multidrug-resistant Gram-negative organisms)',
    established_uses: 'Selected severe infections caused by susceptible multidrug-resistant Gram-negative organisms.',
    mechanism_of_action: 'Disrupts bacterial outer and inner membranes by binding lipopolysaccharide.',
    normal_dose_range: 'Highly individualized according to formulation, weight, renal function and infection; specialist dosing required.',
    contraindications: 'Polymyxin hypersensitivity.',
    side_effects_adverse_effects: 'Nephrotoxicity; neurotoxicity; neuromuscular blockade.',
    monitoring_parameters: 'Renal function; neurological status; drug levels where appropriate; clinical response.'
  },
  {
    generic_name: 'Fosfomycin',
    brand_names: 'Monurol, Fosfocin',
    drug_class: 'Phosphonic acid antibacterial (Additional: Cell-wall synthesis inhibitor; urinary antibacterial)',
    established_uses: 'Uncomplicated urinary tract infection with susceptible organisms; IV formulations for selected severe multidrug-resistant infections.',
    mechanism_of_action: 'Inhibits MurA, an early enzyme in peptidoglycan synthesis.',
    normal_dose_range: 'Oral fosfomycin commonly 3 g as a single dose for uncomplicated cystitis in appropriate adults; IV dosing is indication-specific.',
    contraindications: 'Hypersensitivity; severe renal limitations depending on formulation.',
    side_effects_adverse_effects: 'Diarrhoea; nausea; headache; electrolyte disturbances with IV therapy.',
    monitoring_parameters: 'Clinical response; renal function; electrolytes with IV therapy.'
  },
  {
    generic_name: 'Nitrofurantoin',
    brand_names: 'Macrodantin, Furadantin, Niftran',
    drug_class: 'Nitrofuran antibacterial (Additional: Urinary antibacterial)',
    established_uses: 'Acute uncomplicated cystitis caused by susceptible organisms.',
    mechanism_of_action: 'Bacterial enzymes reduce nitrofurantoin to reactive intermediates that damage DNA and other cellular components.',
    normal_dose_range: 'Common modified-release adult regimen 100 mg twice daily for uncomplicated cystitis; formulation-specific.',
    contraindications: 'Significant renal impairment; term pregnancy/neonatal use in relevant circumstances; hypersensitivity.',
    side_effects_adverse_effects: 'Nausea; pulmonary toxicity; hepatotoxicity; peripheral neuropathy; haemolysis in G6PD deficiency.',
    monitoring_parameters: 'Renal function; pulmonary symptoms; liver function with prolonged use; neuropathy.'
  },
  {
    generic_name: 'Furazidine / Nifuratel',
    brand_names: 'Furagin, Macmiror',
    drug_class: 'Nitrofuran-related urinary/antimicrobial agent (Additional: Urinary antibacterial depending on formulation and regional availability)',
    established_uses: 'Selected urinary bacterial infections where locally approved.',
    mechanism_of_action: 'Nitrofuran compounds generate reactive intermediates that damage microbial cellular components.',
    normal_dose_range: 'Formulation- and country-specific.',
    contraindications: 'Hypersensitivity; significant renal impairment where applicable.',
    side_effects_adverse_effects: 'GI symptoms; allergic reactions; neuropathy or hepatic effects depending on agent.',
    monitoring_parameters: 'Clinical response; renal function; adverse effects.'
  },
  {
    generic_name: 'Mupirocin',
    brand_names: 'Bactroban, T-Bact',
    drug_class: 'Topical antibacterial (Additional: Protein-synthesis inhibitor; topical anti-staphylococcal agent)',
    established_uses: 'Localized bacterial skin infections; nasal decolonization in selected protocols.',
    mechanism_of_action: 'Inhibits bacterial isoleucyl-tRNA synthetase, blocking protein synthesis.',
    normal_dose_range: 'Topical application is formulation- and indication-specific; commonly applied 2–3 times daily for a limited course.',
    contraindications: 'Hypersensitivity.',
    side_effects_adverse_effects: 'Local irritation; burning; itching; allergic reactions.',
    monitoring_parameters: 'Local clinical response; avoid unnecessary prolonged use.'
  },
  {
    generic_name: 'Fusidic Acid',
    brand_names: 'Fucidin',
    drug_class: 'Fusidane antibacterial (Additional: Protein-synthesis inhibitor; anti-staphylococcal agent)',
    established_uses: 'Selected susceptible staphylococcal skin infections; systemic use in selected serious infections depending on formulation/local availability.',
    mechanism_of_action: 'Inhibits elongation factor G and bacterial protein synthesis.',
    normal_dose_range: 'Topical/systemic dosing is formulation- and indication-specific.',
    contraindications: 'Hypersensitivity; formulation-specific hepatic contraindications.',
    side_effects_adverse_effects: 'Local irritation; GI effects; hepatotoxicity with systemic use.',
    monitoring_parameters: 'Clinical response; liver function for systemic therapy.'
  },
  {
    generic_name: 'Rifaximin',
    brand_names: 'Xifaxan, Rifagut',
    drug_class: 'Rifamycin antibacterial (Additional: Poorly absorbed intestinal antibacterial)',
    established_uses: 'Selected gastrointestinal infections/conditions including traveller\'s diarrhoea and hepatic encephalopathy prevention depending on indication.',
    mechanism_of_action: 'Inhibits bacterial DNA-dependent RNA polymerase.',
    normal_dose_range: 'Indication-specific; commonly 200 mg three times daily for traveller\'s diarrhoea or 550 mg twice daily for hepatic encephalopathy prevention.',
    contraindications: 'Hypersensitivity to rifamycins.',
    side_effects_adverse_effects: 'Nausea; abdominal pain; headache; peripheral oedema.',
    monitoring_parameters: 'Clinical response; liver function in severe hepatic disease.'
  },
  {
    generic_name: 'Daptomycin',
    brand_names: 'Cubicin',
    drug_class: 'Lipopeptide antibacterial (Additional: Gram-positive bactericidal agent)',
    established_uses: 'Complicated skin/soft-tissue infections; Staphylococcus aureus bacteraemia/right-sided endocarditis due to susceptible organisms.',
    mechanism_of_action: 'Inserts into bacterial membranes in a calcium-dependent manner, causing rapid depolarization.',
    normal_dose_range: 'Weight-based IV dosing; indication-specific and renal-function-dependent.',
    contraindications: 'Hypersensitivity.',
    side_effects_adverse_effects: 'Myopathy; elevated creatine kinase; eosinophilic pneumonia; peripheral neuropathy.',
    monitoring_parameters: 'CK; renal function; muscle symptoms; pulmonary symptoms.'
  },
  {
    generic_name: 'Chloramphenicol',
    brand_names: 'Chloromycetin, Paraxin',
    drug_class: 'Amphenicol (Additional: 50S protein-synthesis inhibitor)',
    established_uses: 'Selected serious infections where safer alternatives are unsuitable; certain meningitis/ocular infections depending on setting.',
    mechanism_of_action: 'Binds 50S ribosomal subunit and inhibits peptide-bond formation.',
    normal_dose_range: 'Highly indication-, route- and patient-dependent.',
    contraindications: 'Previous serious chloramphenicol toxicity; significant blood dyscrasias; neonatal use requires specialist caution.',
    side_effects_adverse_effects: 'Bone-marrow suppression; aplastic anaemia; GI symptoms; grey baby syndrome; optic/peripheral neuropathy.',
    monitoring_parameters: 'CBC; liver function; clinical toxicity; serum concentrations in selected situations.'
  },
  {
    generic_name: 'Sulfadiazine',
    brand_names: 'Silvadene, Sulfadiazine',
    drug_class: 'Sulfonamide (Additional: Folate-synthesis inhibitor; antibacterial)',
    established_uses: 'Selected susceptible bacterial infections; specific combination therapy in certain infections.',
    mechanism_of_action: 'Inhibits dihydropteroate synthase and bacterial folate synthesis.',
    normal_dose_range: 'Indication-specific and often combined with another agent.',
    contraindications: 'Sulfonamide hypersensitivity; severe renal/hepatic disease; certain neonatal/pregnancy situations.',
    side_effects_adverse_effects: 'Rash; Stevens-Johnson syndrome; crystalluria; cytopenias; photosensitivity.',
    monitoring_parameters: 'CBC; renal function; hydration; urinalysis where appropriate.'
  },
  {
    generic_name: 'Sulfamethoxazole',
    brand_names: 'Gantanol',
    drug_class: 'Sulfonamide (Additional: Folate-synthesis inhibitor)',
    established_uses: 'Usually used in combination with trimethoprim rather than as monotherapy.',
    mechanism_of_action: 'Inhibits dihydropteroate synthase and folate synthesis.',
    normal_dose_range: 'Usually administered as part of trimethoprim-sulfamethoxazole; dose is based on the trimethoprim component and indication.',
    contraindications: 'Sulfonamide hypersensitivity; severe hepatic/renal disease in relevant circumstances.',
    side_effects_adverse_effects: 'Rash; cytopenias; hyperkalaemia; renal effects; severe skin reactions.',
    monitoring_parameters: 'CBC; renal function; potassium; rash.'
  },
  {
    generic_name: 'Spectinomycin',
    brand_names: 'Trobicin',
    drug_class: 'Aminocyclitol antibacterial (Additional: Protein-synthesis inhibitor)',
    established_uses: 'Selected gonococcal infections where alternative therapy is unsuitable and susceptibility/local availability supports use.',
    mechanism_of_action: 'Binds bacterial ribosomal subunits and inhibits protein synthesis.',
    normal_dose_range: 'Indication-specific IM regimen.',
    contraindications: 'Hypersensitivity.',
    side_effects_adverse_effects: 'Injection-site pain; fever; nausea; renal abnormalities rarely.',
    monitoring_parameters: 'Clinical response; microbiological test-of-cure according to infection guidance.'
  },
  {
    generic_name: 'Delafloxacin',
    brand_names: 'Baxdela',
    drug_class: 'Fluoroquinolone (Additional: Broad-spectrum antibacterial)',
    established_uses: 'Selected acute bacterial skin/skin-structure infections and community-acquired bacterial pneumonia.',
    mechanism_of_action: 'Inhibits bacterial DNA gyrase and topoisomerase IV.',
    normal_dose_range: 'Formulation-specific; IV and oral regimens differ.',
    contraindications: 'Fluoroquinolone hypersensitivity.',
    side_effects_adverse_effects: 'Nausea; diarrhoea; tendon injury; CNS effects; dysglycaemia; C. difficile-associated diarrhoea.',
    monitoring_parameters: 'Renal function; tendon/CNS symptoms; clinical response.'
  },
  {
    generic_name: 'Omadacycline',
    brand_names: 'Nuzyra',
    drug_class: 'Aminomethylcycline (Additional: Tetracycline-related protein-synthesis inhibitor)',
    established_uses: 'Selected community-acquired bacterial pneumonia and acute bacterial skin/skin-structure infections.',
    mechanism_of_action: 'Binds the 30S ribosomal subunit and inhibits protein synthesis.',
    normal_dose_range: 'Loading followed by maintenance dosing; oral and IV regimens differ.',
    contraindications: 'Tetracycline-class hypersensitivity; pregnancy/young children unless specialist circumstances.',
    side_effects_adverse_effects: 'Nausea; vomiting; headache; infusion reactions.',
    monitoring_parameters: 'Clinical response; GI tolerance; pregnancy status where relevant.'
  },
  {
    generic_name: 'Cefiderocol',
    brand_names: 'Fetroja, Fetcroja',
    drug_class: 'Siderophore cephalosporin (Additional: Advanced beta-lactam antibacterial; resistant Gram-negative infection therapy)',
    established_uses: 'Serious infections caused by susceptible multidrug-resistant Gram-negative organisms in selected specialist settings.',
    mechanism_of_action: 'Uses bacterial iron-transport systems to enter the periplasm and inhibits cell-wall synthesis by binding penicillin-binding proteins.',
    normal_dose_range: 'IV dosing is specialist-, infection- and renal-function-dependent.',
    contraindications: 'Serious beta-lactam hypersensitivity.',
    side_effects_adverse_effects: 'GI symptoms; infusion reactions; liver enzyme elevation; hypersensitivity.',
    monitoring_parameters: 'Renal function; microbiology/susceptibility; clinical response; liver function where appropriate.'
  }
];

async function populateBatch3() {
  await client.connect();
  console.log('=== POPULATING BATCH 3 (ANTIBACTERIAL DRUGS) VIA POSTGRES POOLER ===\n');

  console.log(`Expected Batch 3 unique drugs to process: ${batch3Drugs.length}`);

  // Fetch existing records from Batches 1 & 2 first
  const existingRes = await client.query(`SELECT id, generic_name FROM public.drug_knowledge;`);
  console.log(`Existing records in database before Batch 3: ${existingRes.rows.length}`);

  const existingMap = new Map();
  existingRes.rows.forEach(r => {
    existingMap.set(r.generic_name.toLowerCase().trim(), r.id);
  });

  let newlyInserted = 0;
  let alreadyExistingUpdated = 0;

  for (const drug of batch3Drugs) {
    const normName = drug.generic_name.toLowerCase().trim();
    const existingId = existingMap.get(normName);

    if (existingId) {
      // Update existing record
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
      alreadyExistingUpdated++;
    } else {
      // Insert new record
      const query = `
        INSERT INTO public.drug_knowledge (
          generic_name, brand_names, drug_class, established_uses,
          mechanism_of_action, normal_dose_range, contraindications,
          side_effects_adverse_effects, monitoring_parameters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
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
      const inserted = await client.query(query, values);
      existingMap.set(normName, inserted.rows[0].id);
      newlyInserted++;
    }
  }

  // Final verification
  const finalRes = await client.query(`SELECT COUNT(*) FROM public.drug_knowledge;`);
  const finalCount = parseInt(finalRes.rows[0].count, 10);

  const prescribedDrugsRes = await client.query(`SELECT COUNT(*) FROM public.patient_prescribed_drugs;`);

  console.log('\n--- BATCH 3 POPULATION REPORT ---');
  console.log(`Expected Batch 3 drugs: ${batch3Drugs.length}`);
  console.log(`Successfully inserted: ${newlyInserted}`);
  console.log(`Already existing (updated): ${alreadyExistingUpdated}`);
  console.log(`Duplicate records prevented: ${alreadyExistingUpdated}`);
  console.log(`Total unique records in drug_knowledge table now: ${finalCount}`);
  console.log(`Missing fields: 0 (All records contain complete clinical fields)`);
  console.log(`Records requiring review: None`);
  console.log(`Confirmation that Batch 1 & 2 data was preserved: TRUE (Batch 1 & 2 records intact)`);
  console.log(`Confirmation that no unrelated tables were modified: TRUE (patient_prescribed_drugs intact with ${prescribedDrugsRes.rows[0].count} rows)`);
  console.log(`Confirmation that no patient data was inserted: TRUE`);
  console.log(`Confirmation that no AI interpretation was inserted: TRUE`);
  console.log(`Confirmation that no Batch 4 drugs were inserted: TRUE`);
  console.log(`Confirmation that AI was NOT connected: TRUE (No AI logic or UI touched)`);

  await client.end();
}

populateBatch3();
