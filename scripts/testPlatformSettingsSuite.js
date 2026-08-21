import { 
  fetchPlatformSettingsFromSupabase, 
  updatePlatformSettingsInSupabase, 
  uploadPlatformAssetToSupabase, 
  DEFAULT_PLATFORM_SETTINGS 
} from '../src/services/platformService.js';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING PLATFORM SETTINGS & BRANDING TEST SUITE');
  console.log('====================================================\n');

  try {
    // TEST 1: Default Platform Branding Integrity
    if (!DEFAULT_PLATFORM_SETTINGS.platform_name || !DEFAULT_PLATFORM_SETTINGS.logo_url) {
      throw new Error('TEST 1 FAILED: DEFAULT_PLATFORM_SETTINGS missing essential properties.');
    }
    console.log('✅ TEST 1 PASSED: Default PharmDVerse platform branding structure verified.');

    // TEST 2: Fetch Platform Settings Fallback Handling
    const res = await fetchPlatformSettingsFromSupabase();
    if (!res.success || !res.settings || !res.settings.platform_name) {
      throw new Error('TEST 2 FAILED: fetchPlatformSettingsFromSupabase did not return valid settings.');
    }
    console.log(`✅ TEST 2 PASSED: Platform settings fetched successfully (Platform Name: "${res.settings.platform_name}").`);

    // TEST 3: Update Platform Settings Persistence
    const newSettingsPayload = { ...DEFAULT_PLATFORM_SETTINGS };

    const updateRes = await updatePlatformSettingsInSupabase(newSettingsPayload, 'Test Runner');
    if (!updateRes.success || updateRes.settings.platform_name !== 'PharmDVerse ERP') {
      throw new Error('TEST 3 FAILED: updatePlatformSettingsInSupabase failed to persist values.');
    }
    console.log('✅ TEST 3 PASSED: Platform settings updated and persisted successfully.');

    // TEST 4: Asset Upload Validation (File Size & Type)
    const oversizedFile = { name: 'big_logo.png', type: 'image/png', size: 5 * 1024 * 1024 }; // 5MB
    const uploadRes = await uploadPlatformAssetToSupabase(oversizedFile, 'logo');
    if (uploadRes.success || !uploadRes.error.includes('exceeds limit')) {
      throw new Error('TEST 4 FAILED: Oversized file upload (>2MB) was not rejected.');
    }
    console.log('✅ TEST 4 PASSED: Asset upload validation rejects oversized files (>2MB).');

    // TEST 5: Invalid Mime Type Validation
    const invalidTypeFile = { name: 'malicious.exe', type: 'application/x-msdownload', size: 1000 };
    const invalidRes = await uploadPlatformAssetToSupabase(invalidTypeFile, 'logo');
    if (invalidRes.success || !invalidRes.error.includes('Invalid file format')) {
      throw new Error('TEST 5 FAILED: Invalid file format (.exe) was not rejected.');
    }
    console.log('✅ TEST 5 PASSED: Asset upload validation rejects unsupported file formats.');

    console.log('\n====================================================');
    console.log('TEST SUITE SUMMARY: ALL 5 TESTS PASSED SUCCESSFULLY.');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
