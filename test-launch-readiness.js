#!/usr/bin/env node

/**
 * Complete Launch Readiness Test Suite
 * Runs all critical tests to determine if the app is ready for paid users
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 AUTOBIDDER LAUNCH READINESS TEST SUITE\n');
console.log('═'.repeat(60));

const testSuite = [
  {
    name: 'Price Calculation System',
    command: 'node test-price-calculations.js',
    critical: true,
    description: 'Tests mathematical accuracy of pricing formulas'
  },
  {
    name: 'API Endpoints',
    command: 'node test-critical-apis.js', 
    critical: true,
    description: 'Tests all critical API endpoints are responding'
  },
  {
    name: 'Database Integrity',
    command: 'node test-database.js',
    critical: true,
    description: 'Tests database structure and data integrity'
  }
];

const results = [];

/**
 * Run individual test suite
 */
async function runTestSuite(test) {
  console.log(`\n🧪 Running: ${test.name}`);
  console.log(`📋 ${test.description}`);
  console.log('─'.repeat(40));

  try {
    const { stdout, stderr } = await execAsync(test.command);
    
    // Check if test passed (exit code 0)
    const passed = true; // If we get here, the command succeeded
    
    results.push({
      name: test.name,
      passed,
      critical: test.critical,
      output: stdout,
      error: stderr
    });

    console.log(stdout);
    if (stderr) {
      console.log('Warnings:', stderr);
    }

  } catch (error) {
    const passed = false;
    
    results.push({
      name: test.name,
      passed,
      critical: test.critical,
      output: error.stdout || '',
      error: error.stderr || error.message
    });

    console.log('❌ Test Failed:');
    console.log(error.stdout || '');
    console.log('Error:', error.stderr || error.message);
  }
}

/**
 * Generate launch readiness report
 */
function generateLaunchReport() {
  console.log('\n🎯 LAUNCH READINESS REPORT');
  console.log('═'.repeat(60));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const criticalFailed = results.filter(r => !r.passed && r.critical).length;

  console.log(`\n📊 Test Results Summary:`);
  console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`   ❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`   🚨 Critical Failed: ${criticalFailed}`);
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  console.log(`   📈 Success Rate: ${successRate}%`);

  if (failedTests > 0) {
    console.log(`\n🚨 Failed Tests:`);
    results
      .filter(r => !r.passed)
      .forEach(test => {
        const critical = test.critical ? '🚨 CRITICAL' : '⚠️  NON-CRITICAL';
        console.log(`   ${critical}: ${test.name}`);
      });
  }

  // Determine launch readiness
  const readyForLaunch = criticalFailed === 0;
  
  console.log(`\n🚀 LAUNCH STATUS: ${readyForLaunch ? '✅ READY' : '❌ NOT READY'}`);
  
  if (readyForLaunch) {
    console.log(`\n🎉 Your app is ready for paid users!`);
    console.log(`\n✓ All critical systems are functioning properly`);
    console.log(`✓ Price calculations are accurate`);
    console.log(`✓ API endpoints are responding`);
    console.log(`✓ Database integrity is maintained`);
    
    console.log(`\n📋 Pre-Launch Checklist:`);
    console.log(`   □ Set up production monitoring`);
    console.log(`   □ Configure backup systems`);
    console.log(`   □ Prepare customer support`);
    console.log(`   □ Test payment processing with small amounts`);
    console.log(`   □ Verify email delivery to your domain`);
    console.log(`   □ Review and update terms of service`);
  } else {
    console.log(`\n⚠️  Critical issues must be resolved before launch:`);
    console.log(`   Please address all failed critical tests above`);
    console.log(`   Re-run this test suite after fixes`);
  }

  return readyForLaunch;
}

/**
 * Run complete test suite
 */
async function runCompleteSuite() {
  console.log(`Running ${testSuite.length} test suites...\n`);

  for (const test of testSuite) {
    await runTestSuite(test);
  }

  const ready = generateLaunchReport();
  return ready;
}

// Execute test suite
runCompleteSuite()
  .then(ready => {
    process.exit(ready ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test suite execution failed:', error);
    process.exit(1);
  });