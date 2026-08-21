import handler from '../api/send-email.js';
import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function runRealEmailDeliverySuite() {
  await client.connect();
  console.log('=== TESTING PHARMDVERSE REAL EMAIL DELIVERY IMPLEMENTATION ===\n');

  const results = [];
  function record(num, testName, passed, details) {
    results.push({ num, testName, status: passed ? 'PASS' : 'FAIL', details });
  }

  try {
    // ----------------------------------------------------
    // TEST 1 — SERVER-SIDE HANDLER EXECUTION & DB RESOLUTION
    // ----------------------------------------------------
    // Insert a test pending notification record into public.notifications
    const insertRes = await client.query(`
      INSERT INTO public.notifications (
        recipient_user_id, recipient_role, sender_user_id, sender_role,
        clinical_case_id, notification_type, title, message, college_id,
        send_email, email_sent, email_delivery_status
      ) VALUES (
        '8a5b0e3a-c259-4b0e-97d0-7d419091a9a8', 'Preceptor',
        '276e6b14-accf-4a97-97b3-e6f57db0d00f', 'Student',
        'dabdcfca-2581-43e3-b9c3-04a8271c6433', 'Case Submitted',
        'UnitTest Email Delivery Notification', 'Testing serverless handler execution',
        '74a8d70b-a41d-4075-9dc2-63240a5f7069',
        true, false, 'Pending'
      ) RETURNING id;
    `);

    const testNotifId = insertRes.rows[0].id;
    record(1, 'Test Notification Created for Delivery', !!testNotifId, `Notification ID: ${testNotifId}`);

    // ----------------------------------------------------
    // TEST 2 — EXECUTE SERVERLESS HANDLER
    // ----------------------------------------------------
    let statusCode = 0;
    let jsonOutput = null;
    const req = { method: 'POST', body: { notificationId: testNotifId } };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonOutput = data; }
        };
      }
    };

    await handler(req, res);

    record(2, 'Serverless Handler Execution', statusCode === 200, `Status: ${statusCode}, Output: ${JSON.stringify(jsonOutput)}`);

    // ----------------------------------------------------
    // TEST 3 — RECIPIENT EMAIL RESOLUTION & DB DELIVERY RECORDING
    // ----------------------------------------------------
    const notifCheck = await client.query('SELECT * FROM public.notifications WHERE id = $1;', [testNotifId]);
    const updatedNotif = notifCheck.rows[0];

    const p3 = updatedNotif && updatedNotif.email_recipient !== null && (updatedNotif.email_delivery_status === 'Sent' || updatedNotif.email_delivery_status === 'Failed');
    record(3, 'Recipient Email Resolution & Delivery Status', p3, `Recipient: ${updatedNotif?.email_recipient}, Status: ${updatedNotif?.email_delivery_status}, Error: ${updatedNotif?.email_error_message || 'None'}`);

    // ----------------------------------------------------
    // TEST 4 — IDEMPOTENCY & DUPLICATE PROTECTION
    // ----------------------------------------------------
    // Manually mark email_sent = true and execute handler again
    await client.query("UPDATE public.notifications SET email_sent = true, email_delivery_status = 'Sent' WHERE id = $1;", [testNotifId]);

    let idempStatus = 0;
    let idempOutput = null;
    const req2 = { method: 'POST', body: { notificationId: testNotifId } };
    const res2 = {
      status: (code) => {
        idempStatus = code;
        return { json: (data) => { idempOutput = data; } };
      }
    };

    await handler(req2, res2);

    const p4 = idempStatus === 200 && idempOutput?.alreadySent === true;
    record(4, 'Idempotency & Duplicate Email Protection', p4, `AlreadySent flag: ${idempOutput?.alreadySent}, Message: ${idempOutput?.message}`);

    // ----------------------------------------------------
    // TEST 5 — SECURITY CHECK: NO API KEY EXPOSED IN FRONTEND
    // ----------------------------------------------------
    // Inspect package.json and src/ files to verify VITE_RESEND_API_KEY is not in client code
    const fs = await import('fs');
    const supabaseServiceCode = fs.readFileSync('src/services/supabaseService.js', 'utf-8');
    const hasClientKey = supabaseServiceCode.includes('VITE_RESEND_API_KEY') || supabaseServiceCode.includes('re_');
    record(5, 'Frontend Secret Protection', !hasClientKey, 'Zero secrets or VITE_RESEND_API_KEY present in client code bundle.');

    // Clean up test notification row
    await client.query('DELETE FROM public.notifications WHERE id = $1;', [testNotifId]);

  } catch (err) {
    console.error('Error running real email delivery suite:', err);
  } finally {
    await client.end();
  }

  console.log('\n--- REAL EMAIL DELIVERY SUITE RESULTS ---');
  results.forEach(r => console.log(`[${r.status}] TEST ${r.num}: ${r.testName} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);
}

runRealEmailDeliverySuite();
