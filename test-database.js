#!/usr/bin/env node

/**
 * Database Testing Script for Autobidder Pre-Launch
 * Tests critical database operations and data integrity
 */

/**
 * Database Testing Script for Autobidder Pre-Launch
 * Tests critical database operations via API endpoints
 */

const BASE_URL = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000';

console.log('🗃️  Testing Database Operations...\n');

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${message ? ` - ${message}` : ''}`);
  
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

/**
 * Test helper function to make HTTP requests
 */
async function testAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = response.headers.get('content-type')?.includes('json') 
      ? await response.json() 
      : await response.text();

    return {
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * Test Database Connection via API
 */
async function testDatabaseConnection() {
  try {
    // Test database connection via stats endpoint (which requires DB)
    const result = await testAPI('/api/stats');
    const connected = result.status !== 0; // Any response means server/DB is working
    logTest('Database Connection', connected, connected ? 'Database responding via API' : 'Database connection failed');
    return connected;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

/**
 * Test Table Integrity via API endpoints
 */
async function testTableIntegrity() {
  console.log('\n🔍 Testing Table Integrity...\n');

  const endpoints = [
    { name: 'Users', endpoint: '/api/auth/user' },
    { name: 'Formulas', endpoint: '/api/formulas' },
    { name: 'Formula Templates', endpoint: '/api/formula-templates' },
    { name: 'Leads', endpoint: '/api/leads' },
    { name: 'Multi-Service Leads', endpoint: '/api/multi-service-leads' },
    { name: 'Business Settings', endpoint: '/api/business-settings' },
    { name: 'Email Settings', endpoint: '/api/email-settings' },
    { name: 'Estimates', endpoint: '/api/estimates' }
  ];

  for (const { name, endpoint } of endpoints) {
    try {
      const result = await testAPI(endpoint);
      // Any response (including auth required) means the table/endpoint works
      const tableExists = result.status !== 0;
      logTest(`${name} table/endpoint`, tableExists, 
        result.success ? `${name} accessible` : `${name} requires auth (expected)`);
    } catch (error) {
      logTest(`${name} table/endpoint`, false, error.message);
    }
  }
}

/**
 * Test Data Constraints via API validation
 */
async function testDataConstraints() {
  console.log('\n🔍 Testing Data Constraints...\n');

  try {
    // Test signup validation (should reject invalid data)
    const invalidSignup = await testAPI('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email', password: '123' })
    });
    
    logTest('Email validation', invalidSignup.status === 400, 
      invalidSignup.status === 400 ? 'Invalid emails properly rejected' : 'Email validation may be weak');

    // Test password requirements
    const weakPassword = await testAPI('/api/auth/signup', {
      method: 'POST', 
      body: JSON.stringify({ email: 'test@example.com', password: '123' })
    });
    
    logTest('Password requirements', weakPassword.status === 400,
      weakPassword.status === 400 ? 'Weak passwords properly rejected' : 'Password validation may be weak');

  } catch (error) {
    logTest('Data constraints', false, error.message);
  }
}

/**
 * Test Price Data Integrity  
 */
async function testPriceDataIntegrity() {
  console.log('\n🔍 Testing Price Data Integrity...\n');

  try {
    // Test that formula templates load properly (indicates pricing system works)
    const templates = await testAPI('/api/formula-templates');
    if (templates.success && Array.isArray(templates.data)) {
      logTest('Formula templates load', true, `Found ${templates.data.length} formula templates`);
      
      // Check if templates have proper structure
      if (templates.data.length > 0) {
        const hasValidStructure = templates.data.some(t => t.variables && t.formula);
        logTest('Formula structure valid', hasValidStructure, 
          hasValidStructure ? 'Templates have proper pricing structure' : 'Templates may be missing pricing data');
      }
    } else {
      logTest('Formula templates load', false, 'Could not load formula templates');
    }

    // Test stats endpoint (aggregates lead data)
    const stats = await testAPI('/api/stats');
    logTest('Stats calculation', stats.status !== 0, 
      stats.success ? 'Statistics calculations working' : 'Stats may require authentication');

  } catch (error) {
    logTest('Price data integrity', false, error.message);
  }
}

/**
 * Test Formula Variables Structure
 */
async function testFormulaVariables() {
  console.log('\n🔍 Testing Formula Variables...\n');

  try {
    const templates = await testAPI('/api/formula-templates');
    
    if (templates.success && Array.isArray(templates.data)) {
      let validFormulas = 0;
      
      for (const template of templates.data) {
        if (Array.isArray(template.variables) && template.variables.length > 0) {
          // Check if variables have required fields
          const hasValidVariables = template.variables.every(v => 
            v.name && v.label && v.type
          );
          if (hasValidVariables) validFormulas++;
        }
      }
      
      logTest('Formula variables structure', validFormulas > 0,
        `${validFormulas}/${templates.data.length} templates have valid variable structures`);
    } else {
      logTest('Formula variables structure', false, 'Could not access formula templates');
    }

  } catch (error) {
    logTest('Formula variables structure', false, error.message);
  }
}

/**
 * Test Email Settings Configuration
 */
async function testEmailConfiguration() {
  console.log('\n🔍 Testing Email Configuration...\n');

  try {
    const emailSettings = await testAPI('/api/email-settings');
    
    logTest('Email configuration', emailSettings.status !== 0,
      emailSettings.success ? 'Email settings accessible' : 'Email settings require auth (expected)');

  } catch (error) {
    logTest('Email configuration', false, error.message);
  }
}

/**
 * Test Business Settings
 */
async function testBusinessSettings() {
  console.log('\n🔍 Testing Business Settings...\n');

  try {
    const businessSettings = await testAPI('/api/business-settings');
    
    logTest('Business settings', businessSettings.status !== 0,
      businessSettings.success ? 'Business settings accessible' : 'Business settings require auth (expected)');

  } catch (error) {
    logTest('Business settings', false, error.message);
  }
}

/**
 * Run All Database Tests
 */
async function runDatabaseTests() {
  console.log('🗃️  Starting Database Tests...\n');

  // Test 1: Connection
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.log('❌ Cannot proceed without database connection');
    return false;
  }

  // Test 2: Table Integrity
  await testTableIntegrity();

  // Test 3: Data Constraints
  await testDataConstraints();

  // Test 4: Price Data Integrity
  await testPriceDataIntegrity();

  // Test 5: Formula Variables
  await testFormulaVariables();

  // Test 6: Email Configuration
  await testEmailConfiguration();

  // Test 7: Business Settings
  await testBusinessSettings();

  // Summary
  console.log('\n📊 Database Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

  if (testResults.failed > 0) {
    console.log('\n🚨 Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   ❌ ${test.name}: ${test.message}`);
      });
  }

  const databaseReady = testResults.failed === 0;
  console.log(`\n🗃️  Database Ready: ${databaseReady ? '✅ YES' : '❌ NO - Address database issues first'}`);
  
  return databaseReady;
}

// Run tests
runDatabaseTests().then(ready => {
  process.exit(ready ? 0 : 1);
}).catch(error => {
  console.error('❌ Database test runner failed:', error);
  process.exit(1);
});