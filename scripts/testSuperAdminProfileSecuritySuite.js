import { 
  hashPassword, 
  fetchSuperAdminProfileFromSupabase, 
  updateSuperAdminProfileInSupabase, 
  changeSuperAdminPasswordInSupabase 
} from '../src/services/supabaseService.js';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING SUPER ADMIN MY PROFILE & SECURITY TEST SUITE');
  console.log('====================================================\n');

  try {
    // TEST 1: Password hashing verification
    const pwd = 'TestSuperAdminPassword123!';
    const hashed1 = await hashPassword(pwd);
    const hashed2 = await hashPassword(pwd);

    if (!hashed1 || hashed1 !== hashed2 || hashed1.length !== 64) {
      throw new Error('TEST 1 FAILED: Password hashing produced invalid SHA-256 hash output.');
    }
    console.log('✅ TEST 1 PASSED: SHA-256 password hashing utility produces consistent 64-char hex string.');

    // TEST 2: Password hashing rejects empty passwords
    const emptyHash = await hashPassword('');
    if (emptyHash !== null) {
      throw new Error('TEST 2 FAILED: hashPassword should return null for empty input.');
    }
    console.log('✅ TEST 2 PASSED: hashPassword returns null for empty password input.');

    // TEST 3: Mock current password check validation
    const mockDbHash = await hashPassword('AdminPass2026');
    const correctInputHash = await hashPassword('AdminPass2026');
    const wrongInputHash = await hashPassword('WrongPass2026');

    if (mockDbHash !== correctInputHash) {
      throw new Error('TEST 3 FAILED: Matching password did not match database hash.');
    }
    if (mockDbHash === wrongInputHash) {
      throw new Error('TEST 3 FAILED: Wrong password incorrectly matched database hash.');
    }
    console.log('✅ TEST 3 PASSED: Current password hash verification correctly approves valid passwords and rejects invalid passwords.');

    // TEST 4: Minimum length validation for new password
    const shortNewPasswordRes = await changeSuperAdminPasswordInSupabase('invalid-id', 'AdminPass2026', 'short');
    if (shortNewPasswordRes.success || !shortNewPasswordRes.error.includes('8 characters')) {
      throw new Error('TEST 4 FAILED: Short password (<8 chars) was not rejected.');
    }
    console.log('✅ TEST 4 PASSED: Password change enforces minimum 8 characters requirement.');

    console.log('\n====================================================');
    console.log('TEST SUITE SUMMARY: ALL 4 TESTS PASSED SUCCESSFULLY.');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
