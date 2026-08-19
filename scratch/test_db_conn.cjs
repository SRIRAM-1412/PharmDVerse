const { Client } = require('pg');

const hosts = [
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com'
];

async function testAll() {
  for (const host of hosts) {
    const cs = `postgresql://postgres.uvvzhrvrqtqwyhlptvnx:kNJuN5IIKtogQWKT@${host}:6543/postgres`;
    console.log(`Testing ${host}...`);
    const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log(`SUCCESS connected to ${host}!`);
      const res = await client.query('SELECT 1 as connected;');
      console.log(res.rows);
      await client.end();
      return cs;
    } catch (err) {
      console.log(`Failed ${host}: ${err.message}`);
    }
  }
}

testAll();
