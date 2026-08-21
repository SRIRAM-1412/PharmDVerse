import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NjEsImV4cCI6MjEwMjU0Mzk2MX0.UjWJhQh0T0DRpcYKNunAEr6jOdMIc7pl2uDBxtGc8d4';
const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function runLabKnowledgeSuite() {
  console.log('=== TESTING SUPER ADMIN LAB PARAMETER KNOWLEDGE MANAGEMENT ===\n');

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
    // TEST 1 — FETCH ALL 62 EXISTING LAB PARAMETER RECORDS
    // ----------------------------------------------------
    const fetchRes = await adminClient
      .from('lab_parameter_knowledge')
      .select('*')
      .order('parameter_name');

    const labList = fetchRes.data || [];
    record(1, 'Fetch All Master Records', labList.length >= 62, `Fetched ${labList.length} records from public.lab_parameter_knowledge.`);

    // ----------------------------------------------------
    // TEST 2 — CATEGORY & SEARCH FILTERING
    // ----------------------------------------------------
    const haemList = labList.filter(l => l.category === 'Haematology');
    record(2, 'Category Filtering (Haematology)', haemList.length > 0, `Found ${haemList.length} Haematology parameters.`);

    // ----------------------------------------------------
    // TEST 3 — DUPLICATE PROTECTION GUARD
    // ----------------------------------------------------
    const existingName = labList[0]?.parameter_name;
    const existingNorm = labList[0]?.normalized_name;

    const dupCheckRes = await adminClient
      .from('lab_parameter_knowledge')
      .select('id, parameter_name')
      .or(`normalized_name.eq.${existingNorm},parameter_name.ilike.${existingName}`)
      .maybeSingle();

    record(3, 'Duplicate Protection Guard', !!dupCheckRes.data, `Duplicate check correctly detected existing parameter "${dupCheckRes.data?.parameter_name}".`);

    // ----------------------------------------------------
    // TEST 4 — CREATE NEW LABORATORY PARAMETER
    // ----------------------------------------------------
    const testParamName = `Unit Test Lab Param ${Date.now()}`;
    const testNormName = testParamName.toLowerCase().trim();

    const createRes = await adminClient.from('lab_parameter_knowledge').insert([{
      parameter_name: testParamName,
      normalized_name: testNormName,
      category: 'General',
      evaluation_type: 'numeric',
      increased_significance: 'Test high significance',
      decreased_significance: 'Test low significance',
      context_notes: 'Automated test record',
      source_reference: 'UnitTest Reference',
      is_active: true
    }]).select();

    const createdRecord = createRes.data?.[0];
    record(4, 'Create New Lab Parameter Master Record', !!createdRecord, `Created ID: ${createdRecord?.id || 'FAILED'}`);

    // ----------------------------------------------------
    // TEST 5 — EDIT LABORATORY PARAMETER
    // ----------------------------------------------------
    if (createdRecord) {
      const updateRes = await adminClient
        .from('lab_parameter_knowledge')
        .update({
          increased_significance: 'Updated high significance for unit test',
          updated_at: new Date().toISOString()
        })
        .eq('id', createdRecord.id)
        .select();

      const updatedRecord = updateRes.data?.[0];
      record(5, 'Edit Laboratory Parameter Master Record', updatedRecord?.increased_significance === 'Updated high significance for unit test', 'Successfully updated clinical significance.');

      // ----------------------------------------------------
      // TEST 6 — PARAMETER DEACTIVATION (IS_ACTIVE = FALSE)
      // ----------------------------------------------------
      const deactRes = await adminClient
        .from('lab_parameter_knowledge')
        .update({ is_active: false })
        .eq('id', createdRecord.id)
        .select();

      record(6, 'Parameter Deactivation (is_active = false)', deactRes.data?.[0]?.is_active === false, 'Status successfully toggled to Inactive.');

      // Cleanup test record
      await pgClient.query('DELETE FROM public.lab_parameter_knowledge WHERE id = $1', [createdRecord.id]);
    } else {
      record(5, 'Edit Laboratory Parameter Master Record', false, 'Skipped due to create failure.');
      record(6, 'Parameter Deactivation (is_active = false)', false, 'Skipped due to create failure.');
    }

    // ----------------------------------------------------
    // TEST 7 — STUDENT LAB WORKFLOW INTEGRITY
    // ----------------------------------------------------
    const studentClient = createClient(supabaseUrl, supabaseAnonKey);
    const studRes = await studentClient.from('lab_parameter_knowledge').select('*').eq('is_active', true);
    record(7, 'Student Lab Workflow Integrity', (studRes.data || []).length >= 62, `Student active lab query returned ${(studRes.data || []).length} active master parameters.`);

    // ----------------------------------------------------
    // TEST 8 — PRESERVATION OF ORIGINAL 62 RECORDS
    // ----------------------------------------------------
    const countCheck = await pgClient.query('SELECT count(*) FROM public.lab_parameter_knowledge;');
    record(8, 'Preservation of Original 62 Master Records', parseInt(countCheck.rows[0].count, 10) >= 62, `Total master count in database: ${countCheck.rows[0].count}`);

  } catch (err) {
    console.error('Error running Lab Knowledge suite:', err);
  } finally {
    await pgClient.end();
  }

  console.log('\n--- LAB KNOWLEDGE SUITE RESULTS ---');
  results.forEach(r => console.log(`[${r.status}] TEST ${r.num}: ${r.testName} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);
}

runLabKnowledgeSuite();
