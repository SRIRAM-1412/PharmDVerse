import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function inspectRoleEmails() {
  await client.connect();
  console.log('=== INSPECTING USER EMAIL FIELDS ACROSS ALL ROLE TABLES ===\n');

  try {
    const roles = [
      { name: 'Super Admin', table: 'super_admin' },
      { name: 'College Admin / College', table: 'colleges' },
      { name: 'Preceptor', table: 'preceptors' },
      { name: 'Student', table: 'students' }
    ];

    for (const role of roles) {
      const colRes = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name ILIKE '%email%';
      `, [role.table]);

      const countRes = await client.query(`SELECT count(*) FROM public."${role.table}";`);

      console.log(`Role: ${role.name} (Table: public."${role.table}")`);
      console.log(` • Total Rows: ${countRes.rows[0].count}`);
      console.log(` • Email Columns:`);
      colRes.rows.forEach(c => console.log(`    - ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
      console.log('');
    }
  } catch (err) {
    console.error('Error inspecting role emails:', err);
  } finally {
    await client.end();
  }
}

inspectRoleEmails();
