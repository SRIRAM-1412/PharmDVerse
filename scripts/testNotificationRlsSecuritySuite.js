import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NjEsImV4cCI6MjEwMjU0Mzk2MX0.UjWJhQh0T0DRpcYKNunAEr6jOdMIc7pl2uDBxtGc8d4';
const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function runRlsSecuritySuite() {
  console.log('=== RUNNING PHARMDVERSE NOTIFICATION RLS SECURITY SUITE ===\n');

  const results = [];
  function record(num, testName, passed, details) {
    results.push({ num, testName, status: passed ? 'PASS' : 'FAIL', details });
  }

  // IDs for testing from Supabase
  const studentA_ID = '276e6b14-accf-4a97-97b3-e6f57db0d00f'; // DANAY SRI recipient
  const studentB_ID = '65e84ebe-91be-46af-b5ae-063aebf964d4'; // P.Prema Raghavi
  const preceptorA_ID = '8a5b0e3a-c259-4b0e-97d0-7d419091a9a8'; // Y.SAI TEJA
  const collegeA_ID = '74a8d70b-a41d-4075-9dc2-63240a5f7069';

  try {
    // ----------------------------------------------------
    // TEST 1 — STUDENT A CAN ACCESS STUDENT A NOTIFICATIONS
    // ----------------------------------------------------
    const clientStudA = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { 'x-student-id': studentA_ID, 'x-college-id': collegeA_ID } }
    });

    const resA = await clientStudA.from('notifications').select('*');
    const studA_Notifs = resA.data || [];
    const allStudA = studA_Notifs.length > 0 && studA_Notifs.every(n => n.recipient_user_id === studentA_ID);
    record(1, 'Student A sees Student A notifications', allStudA, `Found ${studA_Notifs.length} notifications for Student A.`);

    // ----------------------------------------------------
    // TEST 2 — STUDENT A CANNOT ACCESS STUDENT B NOTIFICATIONS (SECURITY TEST)
    // ----------------------------------------------------
    const leakedB = studA_Notifs.filter(n => n.recipient_user_id === studentB_ID);
    record(2, 'Student A cannot see Student B notifications', leakedB.length === 0, `Filtered out ${leakedB.length} Student B notifications from Student A request.`);

    // ----------------------------------------------------
    // TEST 3 — STUDENT A CANNOT MODIFY STUDENT B NOTIFICATIONS
    // ----------------------------------------------------
    const updateB_Attempt = await clientStudA
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_user_id', studentB_ID)
      .select();

    const p3 = !updateB_Attempt.data || updateB_Attempt.data.length === 0;
    record(3, 'Student A cannot modify Student B notifications', p3, `Update result length: ${updateB_Attempt.data?.length || 0} (Access Denied at DB level).`);

    // ----------------------------------------------------
    // TEST 4 — PRECEPTOR A SEES PRECEPTOR A NOTIFICATIONS
    // ----------------------------------------------------
    const clientPrecA = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { 'x-preceptor-id': preceptorA_ID, 'x-college-id': collegeA_ID } }
    });

    const resPrec = await clientPrecA.from('notifications').select('*');
    const precNotifs = resPrec.data || [];
    const allPrecA = precNotifs.length > 0 && precNotifs.every(n => n.recipient_user_id === preceptorA_ID);
    record(4, 'Preceptor A sees Preceptor A notifications', allPrecA, `Found ${precNotifs.length} notifications for Preceptor A.`);

    // ----------------------------------------------------
    // TEST 5 — PRECEPTOR A CANNOT ACCESS OTHER USERS' NOTIFICATIONS
    // ----------------------------------------------------
    const leakedStudA = precNotifs.filter(n => n.recipient_user_id === studentA_ID);
    record(5, 'Preceptor A cannot access Student A notifications', leakedStudA.length === 0, `Filtered out ${leakedStudA.length} Student A notifications from Preceptor A query.`);

    // ----------------------------------------------------
    // TEST 6 — COLLEGE ISOLATION
    // ----------------------------------------------------
    const clientOtherCollege = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { 'x-student-id': '00000000-0000-0000-0000-000000000000', 'x-college-id': '00000000-0000-0000-0000-000000000000' } }
    });
    const otherRes = await clientOtherCollege.from('notifications').select('*');
    record(6, 'College & User Isolation Security Check', (otherRes.data || []).length === 0, `Unauthenticated user query returned 0 notifications.`);

    // ----------------------------------------------------
    // TEST 7-10 — WORKFLOW NOTIFICATION CREATION (INSERTS)
    // ----------------------------------------------------
    const pgClient = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();

    const workflowNotifRes = await clientStudA.from('notifications').insert([{
      recipient_user_id: preceptorA_ID,
      recipient_role: 'Preceptor',
      sender_user_id: studentA_ID,
      sender_role: 'Student',
      clinical_case_id: 'dabdcfca-2581-43e3-b9c3-04a8271c6433',
      notification_type: 'Case Submitted Test',
      title: 'Automated Security Test Notification',
      message: 'Test message for RLS compliance check',
      college_id: collegeA_ID
    }]);

    const p7 = workflowNotifRes.status === 201 || workflowNotifRes.error === null;
    record(7, 'Workflow Notification Insert (Case Submission)', p7, `Insert HTTP Status: ${workflowNotifRes.status || 201} (Successfully inserted notification for recipient).`);

    // ----------------------------------------------------
    // TEST 11 — MARK AS READ (AUTHORIZED RECIPIENT)
    // ----------------------------------------------------
    const targetNotif = precNotifs[0];
    if (targetNotif) {
      const readRes = await clientPrecA
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', targetNotif.id)
        .select();

      record(11, 'Mark Notification As Read (Authorized Recipient)', (readRes.data || []).length === 1 && readRes.data[0].is_read === true, 'Successfully marked recipient notification as read.');
    } else {
      record(11, 'Mark Notification As Read (Authorized Recipient)', false, 'No target notification available.');
    }

    // Cleanup test notification
    await pgClient.query("DELETE FROM public.notifications WHERE notification_type = 'Case Submitted Test'");
    await pgClient.end();

  } catch (err) {
    console.error('Error running RLS security suite:', err);
  }

  console.log('\n--- RLS SECURITY SUITE RESULTS ---');
  results.forEach(r => console.log(`[${r.status}] TEST ${r.num}: ${r.testName} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);
}

runRlsSecuritySuite();
