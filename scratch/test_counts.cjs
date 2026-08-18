const { Client } = require('pg');

const directConn = 'postgresql://postgres:xaSPYQPLysXv2rbo@db.ngfgwgwofnuwqrbmvtuo.supabase.co:5432/postgres';
const poolerConn = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function testBoth() {
  console.log('--- DIRECT CONNECTION ---');
  const dClient = new Client({ connectionString: directConn, ssl: { rejectUnauthorized: false } });
  await dClient.connect();
  const res1 = await dClient.query('SELECT count(*) FROM public.colleges;');
  console.log('Colleges count (Direct):', res1.rows[0].count);
  const res2 = await dClient.query('SELECT count(*) FROM public.students;');
  console.log('Students count (Direct):', res2.rows[0].count);
  await dClient.end();

  console.log('\n--- POOLER CONNECTION ---');
  const pClient = new Client({ connectionString: poolerConn, ssl: { rejectUnauthorized: false } });
  await pClient.connect();
  const res3 = await pClient.query('SELECT count(*) FROM public.colleges;');
  console.log('Colleges count (Pooler):', res3.rows[0].count);
  const res4 = await pClient.query('SELECT count(*) FROM public.students;');
  console.log('Students count (Pooler):', res4.rows[0].count);
  await pClient.end();
}

testBoth();
