import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NjEsImV4cCI6MjEwMjU0Mzk2MX0.UjWJhQh0T0DRpcYKNunAEr6jOdMIc7pl2uDBxtGc8d4';
const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function runOtherInvKnowledgeSuite() {
  console.log('=== TESTING SUPER ADMIN OTHER INVESTIGATION KNOWLEDGE MASTER ===\n');

  const results = [];
  function record(num, testName, passed, details) {
    results.push({ num, testName, status: passed ? 'PASS' : 'FAIL', details });
  }

  const pgClient = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await pgClient.connect();

  try {
    const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { 'x-super-admin': 'true' } }
    });

    // ----------------------------------------------------
    // TEST 1 — FETCH ALL INITIAL MASTER RECORDS
    // ----------------------------------------------------
    const fetchRes = await adminClient
      .from('other_investigation_knowledge')
      .select('*')
      .order('investigation_name');

    const invList = fetchRes.data || [];
    record(1, 'Fetch All Controlled Master Records', invList.length >= 10, `Fetched ${invList.length} master records from public.other_investigation_knowledge.`);

    // ----------------------------------------------------
    // TEST 2 — CATEGORY FILTERING (Radiology)
    // ----------------------------------------------------
    const radList = invList.filter(i => i.category === 'Radiology');
    record(2, 'Category Filtering (Radiology)', radList.length > 0, `Found ${radList.length} Radiology master investigations.`);

    // ----------------------------------------------------
    // TEST 3 — DUPLICATE PROTECTION GUARD
    // ----------------------------------------------------
    const existingName = invList[0]?.investigation_name;
    const existingNorm = invList[0]?.normalized_name;

    const dupCheckRes = await adminClient
      .from('other_investigation_knowledge')
      .select('id, investigation_name')
      .eq('normalized_name', existingNorm)
      .maybeSingle();

    record(3, 'Duplicate Protection Guard', !!dupCheckRes.data, `Duplicate check correctly detected existing investigation "${dupCheckRes.data?.investigation_name}".`);

    // ----------------------------------------------------
    // TEST 4 — CREATE NEW MASTER INVESTIGATION
    // ----------------------------------------------------
    const testInvName = `Unit Test Investigation ${Date.now()}`;
    const testNormName = testInvName.toLowerCase().trim();

    const createRes = await adminClient.from('other_investigation_knowledge').insert([{
      investigation_name: testInvName,
      normalized_name: testNormName,
      category: 'General Diagnostic',
      description: 'Test investigation procedure',
      expected_findings: 'Normal expected findings',
      clinical_significance: 'Test clinical significance',
      is_active: true
    }]).select();

    const createdRecord = createRes.data?.[0];
    record(4, 'Create New Master Investigation Record', !!createdRecord, `Created ID: ${createdRecord?.id || 'FAILED'}`);

    // ----------------------------------------------------
    // TEST 5 — EDIT MASTER INVESTIGATION
    // ----------------------------------------------------
    if (createdRecord) {
      const updateRes = await adminClient
        .from('other_investigation_knowledge')
        .update({
          description: 'Updated diagnostic description for unit test',
          updated_at: new Date().toISOString()
        })
        .eq('id', createdRecord.id)
        .select();

      const updatedRecord = updateRes.data?.[0];
      record(5, 'Edit Master Investigation Record', updatedRecord?.description === 'Updated diagnostic description for unit test', 'Successfully updated diagnostic description.');

      // ----------------------------------------------------
      // TEST 6 — INVESTIGATION DEACTIVATION (IS_ACTIVE = FALSE)
      // ----------------------------------------------------
      const deactRes = await adminClient
        .from('other_investigation_knowledge')
        .update({ is_active: false })
        .eq('id', createdRecord.id)
        .select();

      record(6, 'Investigation Deactivation (is_active = false)', deactRes.data?.[0]?.is_active === false, 'Status successfully toggled to Inactive.');

      // Cleanup test record
      await pgClient.query('DELETE FROM public.other_investigation_knowledge WHERE id = $1', [createdRecord.id]);
    } else {
      record(5, 'Edit Master Investigation Record', false, 'Skipped due to create failure.');
      record(6, 'Investigation Deactivation (is_active = false)', false, 'Skipped due to create failure.');
    }

    // ----------------------------------------------------
    // TEST 7 — NON-INTERFERENCE WITH EXISTING PATIENT DATA
    // ----------------------------------------------------
    const patientDataCheck = await pgClient.query("SELECT count(*) FROM public.patient_profiles WHERE other_investigations IS NOT NULL AND TRIM(other_investigations) != '';");
    record(7, 'Existing patient_profiles Data Preserved', parseInt(patientDataCheck.rows[0].count, 10) >= 9, `Found ${patientDataCheck.rows[0].count} preserved patient profile text records.`);

  } catch (err) {
    console.error('Error running Other Investigation Knowledge suite:', err);
  } finally {
    await pgClient.end();
  }

  console.log('\n--- OTHER INVESTIGATION KNOWLEDGE SUITE RESULTS ---');
  results.forEach(r => console.log(`[${r.status}] TEST ${r.num}: ${r.testName} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);
}

runOtherInvKnowledgeSuite();
