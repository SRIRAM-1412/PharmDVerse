import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectColumns() {
  await client.connect();
  const res = await client.query("SELECT * FROM public.drug_knowledge WHERE LOWER(generic_name) IN ('telmisartan', 'hydrochlorothiazide', 'paracetamol', 'amikacin')");
  res.rows.forEach(r => {
    console.log('--- GENERIC NAME:', r.generic_name, '---');
    console.log('drug_class:', r.drug_class);
    console.log('primary_drug_class:', r.primary_drug_class);
    console.log('additional_drug_classes:', r.additional_drug_classes);
    console.log('brand_names:', r.brand_names);
    console.log('established_uses:', r.established_uses ? r.established_uses.slice(0, 50) + '...' : null);
    console.log('mechanism_of_action:', r.mechanism_of_action ? r.mechanism_of_action.slice(0, 50) + '...' : null);
    console.log('normal_dose_range:', r.normal_dose_range);
    console.log('contraindications:', r.contraindications ? r.contraindications.slice(0, 50) + '...' : null);
    console.log('side_effects_adverse_effects:', r.side_effects_adverse_effects ? r.side_effects_adverse_effects.slice(0, 50) + '...' : null);
    console.log('monitoring_parameters:', r.monitoring_parameters ? r.monitoring_parameters.slice(0, 50) + '...' : null);
  });
  await client.end();
}

inspectColumns();
