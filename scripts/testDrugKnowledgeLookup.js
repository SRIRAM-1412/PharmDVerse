import pg from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function test() {
  await client.connect();
  
  console.log('--- TEST 1: ASPIRIN ---');
  const r1 = await client.query("SELECT id, generic_name, brand_names, drug_class FROM public.drug_knowledge WHERE LOWER(generic_name) = 'aspirin';");
  console.log('Result 1:', r1.rows);

  console.log('\n--- TEST 2: BRAND NAME ECOSPRIN ---');
  const r2 = await client.query("SELECT id, generic_name, brand_names, drug_class FROM public.drug_knowledge WHERE LOWER(brand_names) LIKE '%ecosprin%';");
  console.log('Result 2:', r2.rows);

  console.log('\n--- TEST 3: SYNONYM ADRENALINE / EPINEPHRINE ---');
  const r3 = await client.query("SELECT id, generic_name, brand_names, drug_class FROM public.drug_knowledge WHERE LOWER(generic_name) LIKE '%adrenaline%' OR LOWER(generic_name) LIKE '%epinephrine%';");
  console.log('Result 3:', r3.rows);

  await client.end();
}

test();
