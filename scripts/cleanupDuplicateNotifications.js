import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function cleanupDuplicateNotifications() {
  await client.connect();
  console.log('=== CLEANING UP DUPLICATE NOTIFICATION RECORDS IN SUPABASE ===\n');

  try {
    // Delete duplicate notifications keeping only the oldest record per (recipient_user_id, clinical_case_id, notification_type, message)
    const deleteQuery = `
      DELETE FROM public.notifications n1
      USING public.notifications n2
      WHERE n1.id > n2.id
        AND n1.recipient_user_id = n2.recipient_user_id
        AND n1.clinical_case_id = n2.clinical_case_id
        AND n1.notification_type = n2.notification_type
        AND n1.created_at = n2.created_at;
    `;

    const res = await client.query(deleteQuery);
    console.log(`Deleted ${res.rowCount} duplicate notification records from database.`);

    const remaining = await client.query(`
      SELECT count(*) FROM public.notifications WHERE notification_type = 'Case Submitted';
    `);
    console.log(`Remaining 'Case Submitted' notifications: ${remaining.rows[0].count}`);

  } catch (err) {
    console.error('Error cleaning up duplicates:', err);
  } finally {
    await client.end();
  }
}

cleanupDuplicateNotifications();
