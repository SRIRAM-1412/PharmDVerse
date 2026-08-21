import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function diagnoseDuplicates() {
  await client.connect();
  console.log('=== DIAGNOSING DUPLICATE NOTIFICATION CAUSE ===\n');

  try {
    // 1. Check student_preceptor_assignments for DANAY SRI (student_id: 276e6b14-accf-4a97-97b3-e6f57db0d00f)
    const assignRes = await client.query(`
      SELECT * FROM public.student_preceptor_assignments
      WHERE student_id = '276e6b14-accf-4a97-97b3-e6f57db0d00f';
    `);

    console.log(`DANAY SRI HAS ${assignRes.rows.length} PRECEPTOR ASSIGNMENTS:`);
    assignRes.rows.forEach(a => {
      console.log(` - ID: ${a.id} | Preceptor ID: ${a.preceptor_id} | Status: ${a.status} | Date: ${a.assignment_date}`);
    });

    // 2. Check clinical_cases record for dabdcfca-2581-43e3-b9c3-04a8271c6433
    const caseRes = await client.query(`
      SELECT * FROM public.clinical_cases
      WHERE id = 'dabdcfca-2581-43e3-b9c3-04a8271c6433';
    `);
    console.log('\nCLINICAL CASE RECORD:');
    console.log(caseRes.rows[0]);

  } catch (err) {
    console.error('Error diagnosing:', err);
  } finally {
    await client.end();
  }
}

diagnoseDuplicates();
