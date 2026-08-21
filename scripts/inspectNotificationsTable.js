import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectNotifications() {
  await client.connect();
  console.log('=== INSPECTING NOTIFICATIONS TABLE RECORDS IN SUPABASE ===\n');

  try {
    const res = await client.query(`
      SELECT id, recipient_user_id, recipient_role, sender_user_id, sender_role, clinical_case_id, notification_type, title, message, created_at
      FROM public.notifications
      ORDER BY created_at DESC
      LIMIT 20;
    `);

    console.log(`FOUND ${res.rows.length} RECENT NOTIFICATION RECORDS:`);
    res.rows.forEach((r, idx) => {
      console.log(`\n--- Notification #${idx + 1} ---`);
      console.log(`ID: ${r.id}`);
      console.log(`Created At: ${r.created_at}`);
      console.log(`Type: ${r.notification_type} | Title: "${r.title}"`);
      console.log(`Case ID: ${r.clinical_case_id}`);
      console.log(`Recipient: ${r.recipient_user_id} (${r.recipient_role})`);
      console.log(`Sender: ${r.sender_user_id} (${r.sender_role})`);
      console.log(`Message:\n${r.message}`);
    });
  } catch (err) {
    console.error('Error querying notifications:', err);
  } finally {
    await client.end();
  }
}

inspectNotifications();
