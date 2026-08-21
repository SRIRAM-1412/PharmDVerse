import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function deduplicate() {
  await client.connect();

  const query = `
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY recipient_user_id, clinical_case_id, notification_type, message
               ORDER BY created_at ASC
             ) as rn
      FROM public.notifications
    )
    DELETE FROM public.notifications
    WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  `;

  const res = await client.query(query);
  console.log(`Deduplicated: Deleted ${res.rowCount} duplicate notification rows.`);
  await client.end();
}

deduplicate();
