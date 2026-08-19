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

async function verifyStep2() {
  await client.connect();

  // 1. Table existence check
  const tableCheck = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'drug_knowledge';
  `);
  const tableExists = tableCheck.rows.length > 0;

  // 2. Columns check
  const columnsRes = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'drug_knowledge'
    ORDER BY ordinal_position;
  `);

  // 3. Primary Key check
  const pkRes = await client.query(`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public' AND tc.table_name = 'drug_knowledge' AND tc.constraint_type = 'PRIMARY KEY';
  `);
  const hasPk = pkRes.rows.some(r => r.column_name === 'id');

  // 4. Unique Constraint / Index check
  const idxRes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'drug_knowledge'
      AND indexname = 'idx_drug_knowledge_generic_name_unique';
  `);
  const hasUniqueIndex = idxRes.rows.length > 0;

  // 5. Foreign keys check
  const fkRes = await client.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'drug_knowledge';
  `);

  // 6. Current row count in drug_knowledge
  const rowCountRes = await client.query(`SELECT COUNT(*) FROM public.drug_knowledge;`);
  const rowCount = parseInt(rowCountRes.rows[0].count, 10);

  // 7. Check if patient_prescribed_drugs was modified (structure & row count)
  const prescribedDrugsCountRes = await client.query(`SELECT COUNT(*) FROM public.patient_prescribed_drugs;`);

  console.log('=== STEP 2 EMPIRICAL VERIFICATION OUTPUT ===');
  console.log(`Table exists: ${tableExists ? 'YES' : 'NO'}`);
  console.log(`Columns count: ${columnsRes.rows.length}`);
  console.table(columnsRes.rows);
  console.log(`Primary Key (id): ${hasPk ? 'YES' : 'NO'}`);
  console.log(`Unique generic_name index: ${hasUniqueIndex ? 'YES' : 'NO'}`);
  console.log(`Foreign Keys count: ${fkRes.rows.length} (Expected: 0)`);
  console.log(`Current row count in drug_knowledge: ${rowCount} (Expected: 0)`);
  console.log(`Existing patient_prescribed_drugs count: ${prescribedDrugsCountRes.rows[0].count}`);

  await client.end();
}

verifyStep2();
