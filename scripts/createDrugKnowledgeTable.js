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

async function createDrugKnowledgeTable() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('Connected successfully!');

  const createTableDDL = `
    -- CREATE DRUG_KNOWLEDGE TABLE FOR SECTION 4
    CREATE TABLE IF NOT EXISTS public.drug_knowledge (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      generic_name TEXT NOT NULL,
      brand_names TEXT,
      drug_class TEXT,
      established_uses TEXT,
      mechanism_of_action TEXT,
      normal_dose_range TEXT,
      contraindications TEXT,
      side_effects_adverse_effects TEXT,
      monitoring_parameters TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- CREATE UNIQUE INDEX ON LOWER(TRIM(generic_name)) FOR UNIQUENESS
    CREATE UNIQUE INDEX IF NOT EXISTS idx_drug_knowledge_generic_name_unique 
    ON public.drug_knowledge (LOWER(TRIM(generic_name)));

    -- ENABLE ROW LEVEL SECURITY
    ALTER TABLE public.drug_knowledge ENABLE ROW LEVEL SECURITY;

    -- DROP EXISTING POLICY IF ANY AND RECREATE SELECT POLICY FOR ALL USERS
    DROP POLICY IF EXISTS "Allow read access to all users for drug_knowledge" ON public.drug_knowledge;
    CREATE POLICY "Allow read access to all users for drug_knowledge"
      ON public.drug_knowledge FOR SELECT
      USING (true);

    -- GRANT USAGE AND SELECT
    GRANT SELECT ON public.drug_knowledge TO anon, authenticated, service_role;
  `;

  try {
    await client.query(createTableDDL);
    console.log('Successfully created table drug_knowledge in Supabase!');

    // Verify schema structure from information_schema
    const columnsRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'drug_knowledge'
      ORDER BY ordinal_position;
    `);

    console.log('\n--- TABLE COLUMNS AUDIT ---');
    console.table(columnsRes.rows);

    // Verify Constraints
    const constraintsRes = await client.query(`
      SELECT tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public' AND tc.table_name = 'drug_knowledge';
    `);

    console.log('\n--- TABLE CONSTRAINTS AUDIT ---');
    console.table(constraintsRes.rows);

    // Verify Index
    const indexRes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'drug_knowledge';
    `);

    console.log('\n--- INDEX AUDIT ---');
    console.table(indexRes.rows);

    // Verify existing tables were untouched
    const countRes = await client.query(`
      SELECT count(*) FROM public.patient_prescribed_drugs;
    `);
    console.log(`\nExisting patient_prescribed_drugs table intact with count: ${countRes.rows[0].count}`);

  } catch (err) {
    console.error('Error creating drug_knowledge table:', err);
  } finally {
    await client.end();
  }
}

createDrugKnowledgeTable();
