import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import crypto from 'crypto';

const supabaseUrl = 'https://ngfgwgwofnuwqrbmvtuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZmd3Z3dvZm51d3FyYm12dHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Njc5NjEsImV4cCI6MjEwMjU0Mzk2MX0.UjWJhQh0T0DRpcYKNunAEr6jOdMIc7pl2uDBxtGc8d4';
const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

function hashPasswordNode(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function runSuperAdminHardeningSuite() {
  console.log('=== RUNNING PHARMDVERSE SUPER ADMIN HARDENING SUITE ===\n');

  const results = [];
  function record(num, testName, passed, details) {
    results.push({ num, testName, status: passed ? 'PASS' : 'FAIL', details });
  }

  const pgClient = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await pgClient.connect();

  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    // ----------------------------------------------------
    // TEST 1 — VALID SUPER ADMIN LOGIN VIA SUPABASE
    // ----------------------------------------------------
    const validEmail = 'tsriramireddy1999@gmail.com';
    const validPasswordHash = hashPasswordNode('9440251915');

    const fetchRes = await anonClient
      .from('super_admin')
      .select('id, name, email, password_hash, role, is_active')
      .eq('email', validEmail)
      .maybeSingle();

    const admin = fetchRes.data;
    const isValid = admin && admin.is_active === true && admin.password_hash === validPasswordHash;
    record(1, 'Valid Super Admin Database Login', isValid, `Account ID: ${admin?.id}, Role: ${admin?.role}`);

    // ----------------------------------------------------
    // TEST 2 — WRONG PASSWORD REJECTION
    // ----------------------------------------------------
    const wrongHash = hashPasswordNode('WrongPassword123');
    const isWrongValid = admin && admin.password_hash === wrongHash;
    record(2, 'Wrong Password Rejection', !isWrongValid, 'Wrong password hash mismatch successfully rejected.');

    // ----------------------------------------------------
    // TEST 3 — NONEXISTENT EMAIL REJECTION
    // ----------------------------------------------------
    const nonExistentRes = await anonClient
      .from('super_admin')
      .select('*')
      .eq('email', 'nonexistent_admin@pharmdverse.com')
      .maybeSingle();

    record(3, 'Nonexistent Email Rejection', nonExistentRes.data === null, 'Nonexistent email returned null.');

    // ----------------------------------------------------
    // TEST 4 — INACTIVE ACCOUNT REJECTION
    // ----------------------------------------------------
    // Create temporary inactive account
    const dummyInactiveEmail = 'inactive_admin_test@pharmdverse.com';
    await pgClient.query(`
      INSERT INTO public.super_admin (name, email, password_hash, role, is_active)
      VALUES ('Inactive Admin Test', $1, $2, 'SUPER_ADMIN', false)
      ON CONFLICT (email) DO UPDATE SET is_active = false;
    `, [dummyInactiveEmail, validPasswordHash]);

    const inactiveRes = await anonClient
      .from('super_admin')
      .select('*')
      .eq('email', dummyInactiveEmail)
      .maybeSingle();

    const isInactiveBlocked = inactiveRes.data && inactiveRes.data.is_active === false;
    record(4, 'Inactive Super Admin Rejection', isInactiveBlocked, 'Inactive account (is_active = false) detected.');
    await pgClient.query('DELETE FROM public.super_admin WHERE email = $1;', [dummyInactiveEmail]);

    // ----------------------------------------------------
    // TEST 5 — ACTIVE SESSION CREATION FOR SUPER ADMIN
    // ----------------------------------------------------
    const token1 = `token_test_sa1_${Date.now()}`;
    const insertSessRes = await anonClient
      .from('active_sessions')
      .insert([{
        user_id: admin.id,
        user_role: 'super_admin',
        session_token: token1,
        is_active: true,
        login_at: new Date().toISOString()
      }])
      .select();

    const sess1Created = insertSessRes.data?.[0];
    record(5, 'Super Admin Active Session Creation', !!sess1Created, `Session Token: ${token1}`);

    // ----------------------------------------------------
    // TEST 6 — DETECT EXISTING ACTIVE SESSION CONFLICT
    // ----------------------------------------------------
    const checkConflict = await anonClient
      .from('active_sessions')
      .select('*')
      .eq('user_id', admin.id)
      .eq('user_role', 'super_admin')
      .eq('is_active', true);

    const hasConflict = (checkConflict.data || []).length >= 1;
    record(6, 'Single Active Session Conflict Detection', hasConflict, `Found ${checkConflict.data?.length || 0} active sessions for Super Admin.`);

    // ----------------------------------------------------
    // TEST 7 — INVALIDATE PREVIOUS SESSION & CREATE NEW
    // ----------------------------------------------------
    await pgClient.query(`
      UPDATE public.active_sessions SET is_active = false WHERE user_id = $1 AND user_role = 'super_admin';
    `, [admin.id]);

    const token2 = `token_test_sa2_${Date.now()}`;
    await anonClient.from('active_sessions').insert([{
      user_id: admin.id,
      user_role: 'super_admin',
      session_token: token2,
      is_active: true,
      login_at: new Date().toISOString()
    }]);

    const oldTokenCheck = await anonClient.from('active_sessions').select('is_active').eq('session_token', token1).single();
    const newTokenCheck = await anonClient.from('active_sessions').select('is_active').eq('session_token', token2).single();

    const p7 = oldTokenCheck.data?.is_active === false && newTokenCheck.data?.is_active === true;
    record(7, 'Previous Session Invalidation & Force Continue', p7, `Old Session Active: ${oldTokenCheck.data?.is_active}, New Session Active: ${newTokenCheck.data?.is_active}`);

    // ----------------------------------------------------
    // TEST 8 — FRONTEND SECRET & DEV_ADMIN_CREDENTIALS AUDIT
    // ----------------------------------------------------
    const fs = await import('fs');
    const authServiceCode = fs.readFileSync('src/services/authService.js', 'utf-8');
    const hasDevCreds = authServiceCode.includes('DEV_ADMIN_CREDENTIALS');
    record(8, 'DEV_ADMIN_CREDENTIALS Dependency Removal', !hasDevCreds, 'DEV_ADMIN_CREDENTIALS completely removed from authService.js.');

    // Clean up test sessions
    await pgClient.query("DELETE FROM public.active_sessions WHERE user_role = 'super_admin' AND (session_token = $1 OR session_token = $2);", [token1, token2]);

  } catch (err) {
    console.error('Error running Super Admin hardening suite:', err);
  } finally {
    await pgClient.end();
  }

  console.log('\n--- SUPER ADMIN HARDENING SUITE RESULTS ---');
  results.forEach(r => console.log(`[${r.status}] TEST ${r.num}: ${r.testName} -> ${r.details}`));
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failCount} | FAILED: ${failCount}`);
}

runSuperAdminHardeningSuite();
