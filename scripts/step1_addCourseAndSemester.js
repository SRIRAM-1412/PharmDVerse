import pg from 'pg';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function addCourseAndSemesterColumns() {
  console.log('=== STEP 1: ADD COURSE & SEMESTER COLUMNS TO public.students ===\n');
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // 1. Add course column (default 'Pharm.D' for existing students)
    console.log('1. Adding "course" column to public.students...');
    await client.query(`
      ALTER TABLE public.students
        ADD COLUMN IF NOT EXISTS course TEXT DEFAULT 'Pharm.D';
    `);
    console.log('   ✓ course column added (default: Pharm.D)');

    // 2. Add semester column (nullable, only used for B.Pharm)
    console.log('2. Adding "semester" column to public.students...');
    await client.query(`
      ALTER TABLE public.students
        ADD COLUMN IF NOT EXISTS semester TEXT;
    `);
    console.log('   ✓ semester column added (nullable)');

    // 3. Set all existing students to Pharm.D (safety)
    console.log('3. Setting all existing students to course = Pharm.D...');
    const updateRes = await client.query(`
      UPDATE public.students SET course = 'Pharm.D' WHERE course IS NULL;
    `);
    console.log(`   ✓ ${updateRes.rowCount} existing student(s) set to Pharm.D`);

    // 4. Verify columns exist
    console.log('4. Verifying columns...');
    const verifyRes = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'students'
        AND column_name IN ('course', 'semester')
      ORDER BY column_name;
    `);
    console.log('   Verified columns:');
    verifyRes.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'NULL'})`);
    });

    console.log('\n=== STEP 1 COMPLETE: course & semester columns added to public.students ===');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

addCourseAndSemesterColumns();
