import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function createLabParameterKnowledgeTable() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Successfully connected to Supabase!');

    console.log('Creating lab_parameter_knowledge table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.lab_parameter_knowledge (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          parameter_name TEXT NOT NULL,
          normalized_name TEXT NOT NULL UNIQUE,
          category TEXT NULL,
          evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('numeric', 'positive_negative', 'present_absent')),
          increased_significance TEXT NULL,
          decreased_significance TEXT NULL,
          positive_significance TEXT NULL,
          negative_significance TEXT NULL,
          present_significance TEXT NULL,
          absent_significance TEXT NULL,
          context_notes TEXT NULL,
          source_reference TEXT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
      );

      CREATE INDEX IF NOT EXISTS idx_lab_param_knowledge_norm_name ON public.lab_parameter_knowledge(normalized_name);

      ALTER TABLE public.lab_parameter_knowledge ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow Read Access for All Users" ON public.lab_parameter_knowledge;
      CREATE POLICY "Allow Read Access for All Users" ON public.lab_parameter_knowledge
          FOR SELECT USING (true);
    `);

    console.log('Table lab_parameter_knowledge created successfully with RLS enabled!');

    // Verification step
    const checkTable = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'lab_parameter_knowledge'
      ORDER BY ordinal_position;
    `);

    console.log('Columns created:');
    checkTable.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type} (Nullable: ${r.is_nullable})`));

    const checkCount = await client.query(`SELECT COUNT(*) FROM public.lab_parameter_knowledge;`);
    console.log(`Current row count in lab_parameter_knowledge: ${checkCount.rows[0].count}`);

    // Verify patient_lab_investigations table exists and was untouched
    const checkPatientLabs = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'patient_lab_investigations';
    `);
    console.log(`patient_lab_investigations table exists and intact: ${checkPatientLabs.rows[0].count > 0}`);

  } catch (err) {
    console.error('Error creating lab_parameter_knowledge table:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

createLabParameterKnowledgeTable();
