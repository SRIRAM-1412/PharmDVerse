import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectOtherInvs() {
  await client.connect();
  console.log('=== INSPECTING EXISTING other_investigations RECORDS ===\n');

  try {
    const res = await client.query(`
      SELECT id, other_investigations
      FROM public.patient_profiles
      WHERE other_investigations IS NOT NULL AND TRIM(other_investigations) != ''
      LIMIT 10;
    `);

    console.log(`Found ${res.rows.length} patient profiles with non-empty other_investigations:`);
    res.rows.forEach(r => {
      console.log(`• ID: ${r.id} | Length: ${r.other_investigations.length} chars | Content sample: "${r.other_investigations.substring(0, 150)}..."`);
    });

  } catch (err) {
    console.error('Error querying other_investigations:', err);
  } finally {
    await client.end();
  }
}

inspectOtherInvs();
