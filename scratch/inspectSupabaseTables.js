import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.xkgjcxuhuhduxscplkbg:Pharmdverse%401412@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function inspectTables() {
  const client = new Client({ connectionString });
  await client.connect();

  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('--- SUPABASE PUBLIC TABLES ---');
  res.rows.forEach(r => console.log('- ' + r.table_name));

  const interactionCheck = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (table_name LIKE '%interaction%' OR table_name LIKE '%ddi%' OR table_name LIKE '%food%');
  `);

  console.log('\n--- INTERACTION TABLES FOUND ---');
  console.log(interactionCheck.rows);

  await client.end();
}

inspectTables().catch(err => console.error(err));
