const { Client } = require('pg');

const newConnectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function checkRows() {
  const client = new Client({ connectionString: newConnectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tables = ['colleges', 'students', 'clinical_cases', 'patient_profiles', 'student_preceptor_assignments', 'patient_lab_investigations'];
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) FROM public."${t}"`);
    console.log(`Table ${t}: ${res.rows[0].count} rows`);
  }

  await client.end();
}

checkRows();
