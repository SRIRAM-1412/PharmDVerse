import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectTables() {
  await client.connect();
  console.log('=== INSPECTING LAB PARAMETER KNOWLEDGE & OTHER INVESTIGATIONS DATA ===\n');

  try {
    // 1. lab_parameter_knowledge sample
    const labSample = await client.query(`SELECT category, parameter_name, evaluation_type, increased_significance, decreased_significance FROM public.lab_parameter_knowledge LIMIT 5;`);
    console.log('\nSample lab parameters:', labSample.rows);

    // 2. Check for any other_investigations tables in information_schema
    const otherTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND (table_name LIKE '%investigant%' OR table_name LIKE '%other%');
    `);
    console.log('\n--- INVESTIGATION / OTHER TABLES IN SUPABASE ---');
    console.log(otherTables.rows.map(r => r.table_name));

    // 3. Inspect public.patient_profiles and public.patient_lab_investigations columns for Other Investigations
    const profileCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'patient_profiles';
    `);
    console.log('\n--- patient_profiles INVESTIGATION COLUMNS ---');
    const invCols = profileCols.rows.filter(c => c.column_name.includes('investig') || c.column_name.includes('other') || c.column_name.includes('lab'));
    invCols.forEach(c => console.log(`• ${c.column_name} (${c.data_type})`));

    const labInvCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'patient_lab_investigations';
    `);
    console.log('\n--- patient_lab_investigations COLUMNS ---');
    labInvCols.rows.forEach(c => console.log(`• ${c.column_name} (${c.data_type})`));

    // 4. Inspect existing records of other_investigations in patient_profiles
    const otherInvsProfiles = await client.query(`
      SELECT id, case_id, other_investigations FROM public.patient_profiles WHERE other_investigations IS NOT NULL AND other_investigations != '' LIMIT 10;
    `);
    console.log('\n--- SAMPLE other_investigations FROM patient_profiles ---');
    console.log(otherInvsProfiles.rows);

  } catch (err) {
    console.error('Error inspecting tables:', err);
  } finally {
    await client.end();
  }
}

inspectTables();
