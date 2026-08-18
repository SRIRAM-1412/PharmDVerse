const { Client } = require('pg');

const oldDirectString = 'postgresql://postgres:kNJuN5IIKtogQWKT@db.uvvzhrvrqtqwyhlptvnx.supabase.co:5432/postgres';
const newDirectString = 'postgresql://postgres:xaSPYQPLysXv2rbo@db.ngfgwgwofnuwqrbmvtuo.supabase.co:5432/postgres';

const oldConnectionString = 'postgresql://postgres.uvvzhrvrqtqwyhlptvnx:kNJuN5IIKtogQWKT@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const newConnectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function testConnection(label, connectionString) {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT current_database(), current_schema();');
    console.log(`[SUCCESS] ${label}:`, res.rows[0]);
  } catch (err) {
    console.error(`[ERROR] ${label}:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  await testConnection('Old DB Direct', oldDirectString);
  await testConnection('Old DB Pooler', oldConnectionString);
  await testConnection('New DB Direct', newDirectString);
  await testConnection('New DB Pooler', newConnectionString);
}

main();
