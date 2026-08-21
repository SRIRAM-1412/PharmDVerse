import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectTables() {
  await client.connect();
  console.log('=== INSPECTING COLUMNS OF lab_parameter_knowledge & patient_lab_investigations ===\n');

  try {
    // 1. Columns of lab_parameter_knowledge
    const cols1 = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'lab_parameter_knowledge'
      ORDER BY ordinal_position;
    `);
    console.log('--- COLUMNS OF public.lab_parameter_knowledge ---');
    cols1.rows.forEach(c => console.log(`- ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));

    // Sample row from lab_parameter_knowledge
    const sample1 = await client.query(`SELECT * FROM public.lab_parameter_knowledge LIMIT 3;`);
    console.log('\n--- SAMPLE ROWS FROM public.lab_parameter_knowledge ---');
    console.log(JSON.stringify(sample1.rows, null, 2));

    // 2. Columns of patient_lab_investigations
    const cols2 = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'patient_lab_investigations'
      ORDER BY ordinal_position;
    `);
    console.log('\n--- COLUMNS OF public.patient_lab_investigations ---');
    cols2.rows.forEach(c => console.log(`- ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));

    // Constraints & FKs on patient_lab_investigations
    const fks2 = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND conrelid = 'public.patient_lab_investigations'::regclass;
    `);
    console.log('\n--- CONSTRAINTS ON public.patient_lab_investigations ---');
    fks2.rows.forEach(f => console.log(`- ${f.conname}: ${f.pg_get_constraintdef}`));

    // RLS Policies on patient_lab_investigations
    const rls2 = await client.query(`
      SELECT policyname, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE tablename = 'patient_lab_investigations';
    `);
    console.log('\n--- RLS POLICIES ON public.patient_lab_investigations ---');
    rls2.rows.forEach(p => console.log(`- Policy: ${p.policyname} | Cmd: ${p.cmd} | Roles: ${p.roles}`));

    // Sample rows from patient_lab_investigations
    const sample2 = await client.query(`SELECT * FROM public.patient_lab_investigations LIMIT 5;`);
    console.log('\n--- SAMPLE ROWS FROM public.patient_lab_investigations ---');
    console.log(JSON.stringify(sample2.rows, null, 2));

  } catch (err) {
    console.error('Error inspecting tables:', err);
  } finally {
    await client.end();
  }
}

inspectTables();
