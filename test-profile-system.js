#!/usr/bin/env node

/**
 * Test runner script for profile system tests
 * Run with: node test-profile-system.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Profile System Tests\n');

const testFiles = [
  'src/contexts/__tests__/ProfileContext.test.tsx',
  'src/services/profile/__tests__/ProfileRecommendationEngine.test.ts',
  'src/services/profile/__tests__/ProfileCompletionService.test.ts',
  'src/services/error/__tests__/ProfileErrorHandler.test.ts',
  'src/hooks/__tests__/useAutoSave.test.ts',
  'src/components/profile/__tests__/ProfileHub.test.tsx'
];

const results = {
  passed: 0,
  failed: 0,
  skipped: 0
};

for (const testFile of testFiles) {
  console.log(`📝 Testing: ${testFile}`);
  
  try {
    const output = execSync(`npx jest "${testFile}" --passWithNoTests --verbose`, {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    console.log('✅ PASSED\n');
    results.passed++;
    
    // Parse Jest output for test counts (optional)
    const testCountMatch = output.match(/(\d+) passed/);
    if (testCountMatch) {
      console.log(`   ${testCountMatch[1]} test(s) passed`);
    }
    
  } catch (error) {
    console.log('❌ FAILED\n');
    results.failed++;
    
    // Show error details
    console.log('Error details:');
    console.log(error.stdout || error.message);
    console.log('\n');
  }
}

console.log('📊 Test Summary:');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⏭️  Skipped: ${results.skipped}`);

if (results.failed === 0) {
  console.log('\n🎉 All profile system tests passed!');
  process.exit(0);
} else {
  console.log('\n💥 Some tests failed. Check the output above for details.');
  process.exit(1);
}