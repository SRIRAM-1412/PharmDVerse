import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NjEsImV4cCI6MjEwMjU0Mzk2MX0.UjWJhQh0T0DRpcYKNunAEr6jOdMIc7pl2uDBxtGc8d4';
const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function runStudentStructuredOtherInvSuite() {
  console.log('=== TESTING STUDENT STRUCTURED OTHER INVESTIGATIONS SYSTEM ===\n');

  const results = [];
  function record(num, testName, passed, details) {
    results.push({ num, testName, status: passed ? 'PASS' : 'FAIL', details });
  }

  const pgClient = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await pgClient.connect();

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // ----------------------------------------------------
    // TEST 1 — FETCH ACTIVE MASTER INVESTIGATIONS
    // ----------------------------------------------------
    const masterRes = await supabase
      .from('other_investigation_knowledge')
      .select('*')
      .eq('is_active', true)
      .order('investigation_name');

    const activeMasters = masterRes.data || [];
    record(1, 'Fetch Active Master Investigations', activeMasters.length >= 10, `Fetched ${activeMasters.length} active master investigations for student dropdown.`);

    const ecgMaster = activeMasters.find(m => m.investigation_name.includes('ECG'));
    const echoMaster = activeMasters.find(m => m.investigation_name.includes('ECHO'));

    // ----------------------------------------------------
    // TEST 2 — CREATE DUMMY PATIENT PROFILE
    // ----------------------------------------------------
    const existingCaseRes = await pgClient.query(`SELECT student_id, college_id FROM public.clinical_cases WHERE student_id IS NOT NULL AND college_id IS NOT NULL LIMIT 1;`);
    const studentId = existingCaseRes.rows[0]?.student_id;
    const collegeId = existingCaseRes.rows[0]?.college_id;

    const newCaseInsert = await pgClient.query(`
      INSERT INTO public.clinical_cases (case_id, student_id, college_id, hospital_name, department, ward_unit, ip_op_type, date_of_admission, date_of_collection, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'Test Hospital', 'General Medicine', 'Unit 1', 'IP', '2026-08-01', '2026-08-02', 'Draft', NOW(), NOW())
      RETURNING id;
    `, [`CASE-TEST-${Date.now()}`, studentId, collegeId]);

    const caseId = newCaseInsert.rows[0]?.id;

    const profileInsert = await pgClient.query(`
      INSERT INTO public.patient_profiles (clinical_case_id, student_id, college_id, patient_name, age, gender, other_investigations, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, patient_name, other_investigations;
    `, [caseId, studentId, collegeId, 'TEST PATIENT STRUCTURED INV', 45, 'Male', 'LEGACY FREE-TEXT RECORD FOR VERIFICATION']);

    const testProfile = profileInsert.rows?.[0];
    record(2, 'Create Test Patient Profile & Legacy Free-Text', !!testProfile, `Created Test Profile ID: ${testProfile?.id}`);

    if (testProfile) {
      // ----------------------------------------------------
      // TEST 3 — SAVE STRUCTURED INVESTIGATION 1 (ECG)
      // ----------------------------------------------------
      const inv1Res = await supabase.from('patient_other_investigations').insert([{
        patient_profile_id: testProfile.id,
        investigation_knowledge_id: ecgMaster?.id,
        investigation_name: ecgMaster?.investigation_name || 'Electrocardiogram (ECG)',
        test_date: '2026-08-01',
        finding_result: 'Sinus tachycardia (HR 115 bpm)',
        remarks: 'Baseline admission ECG'
      }]).select();

      const inv1 = inv1Res.data?.[0];
      record(3, 'Save Structured Investigation 1 (ECG)', !!inv1, `Created record ID: ${inv1?.id}`);

      // ----------------------------------------------------
      // TEST 4 — SAVE STRUCTURED INVESTIGATION 2 (ECHO)
      // ----------------------------------------------------
      const inv2Res = await supabase.from('patient_other_investigations').insert([{
        patient_profile_id: testProfile.id,
        investigation_knowledge_id: echoMaster?.id,
        investigation_name: echoMaster?.investigation_name || 'Echocardiogram (ECHO)',
        test_date: '2026-08-02',
        finding_result: 'LVEF 35%, global hypokinesia, moderate mitral regurgitation',
        remarks: 'Cardiology echo consult'
      }]).select();

      const inv2 = inv2Res.data?.[0];
      record(4, 'Save Structured Investigation 2 (ECHO)', !!inv2, `Created record ID: ${inv2?.id}`);

      // ----------------------------------------------------
      // TEST 5 — SAVE DUPLICATE INVESTIGATION TYPE (ECG ON DIFFERENT DATE)
      // ----------------------------------------------------
      const inv3Res = await supabase.from('patient_other_investigations').insert([{
        patient_profile_id: testProfile.id,
        investigation_knowledge_id: ecgMaster?.id,
        investigation_name: ecgMaster?.investigation_name || 'Electrocardiogram (ECG)',
        test_date: '2026-08-15',
        finding_result: 'Normal sinus rhythm (HR 78 bpm), resolved tachycardia',
        remarks: 'Follow-up post treatment ECG'
      }]).select();

      const inv3 = inv3Res.data?.[0];
      record(5, 'Save Duplicate Investigation Type on Different Date', !!inv3, `Successfully saved 2nd ECG on different date (ID: ${inv3?.id}).`);

      // ----------------------------------------------------
      // TEST 6 — FETCH ALL STRUCTURED RECORDS FOR PROFILE
      // ----------------------------------------------------
      const listRes = await supabase
        .from('patient_other_investigations')
        .select('*')
        .eq('patient_profile_id', testProfile.id)
        .order('test_date');

      const fetchedList = listRes.data || [];
      record(6, 'Fetch Structured Patient Investigations', fetchedList.length === 3, `Returned ${fetchedList.length} / 3 structured investigation rows for profile.`);

      // ----------------------------------------------------
      // TEST 7 — EDIT FINDING RESULT
      // ----------------------------------------------------
      if (inv2) {
        const updateRes = await supabase
          .from('patient_other_investigations')
          .update({ finding_result: 'LVEF 40%, mild mitral regurgitation' })
          .eq('id', inv2.id)
          .select();

        record(7, 'Edit Finding Result', updateRes.data?.[0]?.finding_result === 'LVEF 40%, mild mitral regurgitation', 'Successfully updated structured finding result.');
      } else {
        record(7, 'Edit Finding Result', false, 'Skipped due to missing record.');
      }

      // ----------------------------------------------------
      // TEST 8 — DELETE INVESTIGATION ROW
      // ----------------------------------------------------
      if (inv3) {
        const delRes = await supabase
          .from('patient_other_investigations')
          .delete()
          .eq('id', inv3.id);

        const checkAfterDel = await supabase
          .from('patient_other_investigations')
          .select('*')
          .eq('patient_profile_id', testProfile.id);

        record(8, 'Delete Investigation Row', checkAfterDel.data?.length === 2, 'Row deleted successfully.');
      } else {
        record(8, 'Delete Investigation Row', false, 'Skipped due to missing record.');
      }

      // ----------------------------------------------------
      // TEST 9 — LEGACY FREE-TEXT PRESERVATION
      // ----------------------------------------------------
      const legacyCheck = await supabase
        .from('patient_profiles')
        .select('other_investigations')
        .eq('id', testProfile.id)
        .single();

      record(9, 'Legacy Free-Text Preserved', legacyCheck.data?.other_investigations === 'LEGACY FREE-TEXT RECORD FOR VERIFICATION', 'Historical free-text column remains 100% intact.');

      // Clean up test data
      await pgClient.query('DELETE FROM public.patient_profiles WHERE id = $1', [testProfile.id]);
      if (caseId) await pgClient.query('DELETE FROM public.clinical_cases WHERE id = $1', [caseId]);
    }

  } catch (err) {
    console.error('Error running Student Structured Other Inv suite:', err);
  } finally {
    await pgClient.end();
  }

  console.log('\n--- STUDENT STRUCTURED OTHER INVESTIGATION SUITE RESULTS ---');
  results.forEach(r => console.log(`[${r.status}] TEST ${r.num}: ${r.testName} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);
}

runStudentStructuredOtherInvSuite();
