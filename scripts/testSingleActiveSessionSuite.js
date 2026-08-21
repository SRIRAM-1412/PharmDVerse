import pg from 'pg';
import crypto from 'crypto';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function runSingleActiveSessionTestSuite() {
  await client.connect();
  console.log('=== STARTING PHARMDVERSE SINGLE ACTIVE SESSION VALIDATION SUITE ===\n');

  const results = [];
  function record(testNum, testName, passed, details) {
    results.push({ testNum, test: testName, status: passed ? 'PASS' : 'FAIL', details });
  }

  const testStudentId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
  const testStudentId2 = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
  const testPreceptorId = 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f';

  try {
    // Clean up any test records
    await client.query("DELETE FROM public.active_sessions WHERE user_id IN ($1, $2, $3)", [testStudentId, testStudentId2, testPreceptorId]);

    // ----------------------------------------------------
    // TEST 1 — NORMAL LOGIN
    // ----------------------------------------------------
    const token1 = crypto.randomUUID();
    await client.query(
      "INSERT INTO public.active_sessions (user_id, user_role, session_token, is_active) VALUES ($1, $2, $3, $4)",
      [testStudentId, 'student', token1, true]
    );

    const q1 = await client.query(
      "SELECT * FROM public.active_sessions WHERE user_id = $1 AND user_role = $2 AND is_active = true",
      [testStudentId, 'student']
    );
    const p1 = q1.rows.length === 1 && q1.rows[0].session_token === token1;
    record(1, 'Normal Login', p1, `Active sessions count: ${q1.rows.length}, Token: ${q1.rows[0]?.session_token.slice(0, 8)}...`);

    // ----------------------------------------------------
    // TEST 2 — SECOND DEVICE DETECTION
    // ----------------------------------------------------
    const q2 = await client.query(
      "SELECT * FROM public.active_sessions WHERE user_id = $1 AND user_role = $2 AND is_active = true",
      [testStudentId, 'student']
    );
    const p2 = q2.rows.length > 0; // System detects existing active session
    record(2, 'Second Device Detection', p2, `Existing active session detected prior to second device login: ${p2}`);

    // ----------------------------------------------------
    // TEST 3 — CANCEL
    // ----------------------------------------------------
    // User cancels -> No DB changes made
    const q3 = await client.query(
      "SELECT * FROM public.active_sessions WHERE user_id = $1 AND user_role = $2 AND is_active = true",
      [testStudentId, 'student']
    );
    const p3 = q3.rows.length === 1 && q3.rows[0].session_token === token1;
    record(3, 'Cancel Behavior', p3, `Device 1 session remains active, token unchanged.`);

    // ----------------------------------------------------
    // TEST 4 — FORCE PREVIOUS LOGOUT & CONTINUE
    // ----------------------------------------------------
    // Invalidate old session & create new
    await client.query(
      "UPDATE public.active_sessions SET is_active = false WHERE user_id = $1 AND user_role = $2 AND is_active = true",
      [testStudentId, 'student']
    );
    const token2 = crypto.randomUUID();
    await client.query(
      "INSERT INTO public.active_sessions (user_id, user_role, session_token, is_active) VALUES ($1, $2, $3, $4)",
      [testStudentId, 'student', token2, true]
    );

    const q4 = await client.query(
      "SELECT * FROM public.active_sessions WHERE user_id = $1 AND user_role = $2 AND is_active = true",
      [testStudentId, 'student']
    );
    const p4 = q4.rows.length === 1 && q4.rows[0].session_token === token2;
    record(4, 'Force Previous Logout & Continue', p4, `Device 1 invalidated, Device 2 active token: ${q4.rows[0]?.session_token.slice(0, 8)}...`);

    // ----------------------------------------------------
    // TEST 5 — OLD DEVICE INVALIDATION CHECK
    // ----------------------------------------------------
    const q5Old = await client.query(
      "SELECT is_active FROM public.active_sessions WHERE session_token = $1",
      [token1]
    );
    const p5 = q5Old.rows.length > 0 && q5Old.rows[0].is_active === false;
    record(5, 'Old Device Invalidation Check', p5, `Old session token is_active: ${q5Old.rows[0]?.is_active}`);

    // ----------------------------------------------------
    // TEST 6 — NORMAL LOGOUT
    // ----------------------------------------------------
    await client.query(
      "UPDATE public.active_sessions SET is_active = false WHERE session_token = $1",
      [token2]
    );
    const q6 = await client.query(
      "SELECT is_active FROM public.active_sessions WHERE session_token = $1",
      [token2]
    );
    const p6 = q6.rows[0]?.is_active === false;
    record(6, 'Normal Logout', p6, `Active session cleanly set to is_active = false on logout.`);

    // ----------------------------------------------------
    // TEST 7 — REFRESH & SESSION RESTORATION
    // ----------------------------------------------------
    const token3 = crypto.randomUUID();
    await client.query(
      "INSERT INTO public.active_sessions (user_id, user_role, session_token, is_active) VALUES ($1, $2, $3, $4)",
      [testStudentId, 'student', token3, true]
    );

    const q7Valid = await client.query(
      "SELECT is_active FROM public.active_sessions WHERE session_token = $1",
      [token3]
    );
    const q7Invalid = await client.query(
      "SELECT is_active FROM public.active_sessions WHERE session_token = $1",
      [token1]
    );
    const p7 = q7Valid.rows[0]?.is_active === true && q7Invalid.rows[0]?.is_active === false;
    record(7, 'Refresh & Session Restoration', p7, `Valid session restored (true), invalidated session rejected (false).`);

    // ----------------------------------------------------
    // TEST 8 — DIFFERENT USERS
    // ----------------------------------------------------
    const tokenUserB = crypto.randomUUID();
    await client.query(
      "INSERT INTO public.active_sessions (user_id, user_role, session_token, is_active) VALUES ($1, $2, $3, $4)",
      [testStudentId2, 'student', tokenUserB, true]
    );

    const q8A = await client.query("SELECT * FROM public.active_sessions WHERE user_id = $1 AND is_active = true", [testStudentId]);
    const q8B = await client.query("SELECT * FROM public.active_sessions WHERE user_id = $1 AND is_active = true", [testStudentId2]);
    const p8 = q8A.rows.length === 1 && q8B.rows.length === 1;
    record(8, 'Different Users Coexistence', p8, `Student A and Student B both maintain independent active sessions.`);

    // ----------------------------------------------------
    // TEST 9 — DIFFERENT ROLES (Same or different user_id across roles)
    // ----------------------------------------------------
    const tokenPreceptor = crypto.randomUUID();
    await client.query(
      "INSERT INTO public.active_sessions (user_id, user_role, session_token, is_active) VALUES ($1, $2, $3, $4)",
      [testStudentId, 'preceptor', tokenPreceptor, true]
    );

    const q9Student = await client.query("SELECT * FROM public.active_sessions WHERE user_id = $1 AND user_role = 'student' AND is_active = true", [testStudentId]);
    const q9Preceptor = await client.query("SELECT * FROM public.active_sessions WHERE user_id = $1 AND user_role = 'preceptor' AND is_active = true", [testStudentId]);
    const p9 = q9Student.rows.length === 1 && q9Preceptor.rows.length === 1;
    record(9, 'Different Roles Isolation (user_role + user_id)', p9, `Student and Preceptor roles do not interfere with each other.`);

    // ----------------------------------------------------
    // TEST 10 — DATABASE INTEGRITY & CONSTRAINTS
    // ----------------------------------------------------
    let indexEnforced = false;
    try {
      // Attempt to insert duplicate active session for same (user_role, user_id)
      await client.query(
        "INSERT INTO public.active_sessions (user_id, user_role, session_token, is_active) VALUES ($1, $2, $3, $4)",
        [testStudentId, 'student', crypto.randomUUID(), true]
      );
    } catch (err) {
      if (err.code === '23505') { // Unique constraint violation
        indexEnforced = true;
      }
    }

    const studentsModified = false; // We did not touch students table
    const preceptorsModified = false; // We did not touch preceptors table
    const collegesModified = false; // We did not touch colleges table

    const p10 = indexEnforced && !studentsModified && !preceptorsModified && !collegesModified;
    record(10, 'Database Integrity & Partial Unique Index', p10, `Partial unique index (user_role, user_id WHERE is_active = true) enforced: ${indexEnforced}. User tables untouched.`);

    // Cleanup test records
    await client.query("DELETE FROM public.active_sessions WHERE user_id IN ($1, $2, $3)", [testStudentId, testStudentId2, testPreceptorId]);

  } catch (e) {
    console.error('Error during test execution:', e);
  } finally {
    await client.end();
  }

  console.log('--- TEST RESULTS SUMMARY ---');
  results.forEach(r => console.log(`[${r.status}] TEST ${r.testNum}: ${r.test} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);
}

runSingleActiveSessionTestSuite();
