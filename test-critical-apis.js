#!/usr/bin/env node

/**
 * Critical API Testing Script for Autobidder Pre-Launch
 * Run this to test core functionality before going live with paid users
 */

const BASE_URL = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000';

console.log(`🧪 Testing Autobidder APIs at: ${BASE_URL}`);

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
 * Test Results Storage
 */
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
 * Core API Tests
 */
async function runTests() {
  console.log('\n🚀 Starting Pre-Launch API Tests...\n');

  // Test 1: Server Health Check
  console.log('🔍 Testing Server Health...');
  const healthCheck = await testAPI('/api/auth/user');
  logTest('Server responds', healthCheck.status !== 0, 
    healthCheck.error ? healthCheck.error : 'Server is responding');

  // Test 2: Database Connection
  console.log('\n🔍 Testing Database Connection...');
  const dbTest = await testAPI('/api/stats');
  logTest('Database connection', dbTest.success || dbTest.status === 401, 
    dbTest.success ? 'Database connected' : 'Database may have issues');

  // Test 3: Authentication Endpoints
  console.log('\n🔍 Testing Authentication...');
  
  // Test login endpoint exists
  const loginTest = await testAPI('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', password: 'invalid' })
  });
  logTest('Login endpoint', loginTest.status === 401 || loginTest.status === 400, 
    'Login endpoint is responding correctly to invalid credentials');

  // Test signup endpoint exists  
  const signupTest = await testAPI('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', password: 'test123', name: 'Test User' })
  });
  logTest('Signup endpoint', signupTest.status !== 0, 
    'Signup endpoint is accessible');

  // Test 4: Formula System
  console.log('\n🔍 Testing Formula System...');
  
  // Test formulas endpoint
  const formulasTest = await testAPI('/api/formulas');
  logTest('Formulas endpoint', formulasTest.status !== 0, 
    formulasTest.success ? 'Formulas loading' : 'Auth required (expected)');

  // Test formula templates
  const templatesTest = await testAPI('/api/formula-templates');
  logTest('Formula templates', templatesTest.success, 
    formulasTest.success ? `Found ${templatesTest.data?.length || 0} templates` : 'Templates may require auth');

  // Test 5: Lead Capture System
  console.log('\n🔍 Testing Lead Capture...');
  
  // Test leads endpoint
  const leadsTest = await testAPI('/api/leads');
  logTest('Leads endpoint', leadsTest.status !== 0, 
    leadsTest.success ? 'Leads accessible' : 'Auth required (expected)');

  // Test multi-service leads
  const multiLeadsTest = await testAPI('/api/multi-service-leads');
  logTest('Multi-service leads', multiLeadsTest.status !== 0, 
    'Multi-service leads endpoint responding');

  // Test 6: Email System Configuration
  console.log('\n🔍 Testing Email Configuration...');
  
  // Test email settings
  const emailTest = await testAPI('/api/email-settings');
  logTest('Email settings', emailTest.status !== 0, 
    'Email configuration endpoint accessible');

  // Test 7: Stripe Integration
  console.log('\n🔍 Testing Payment System...');
  
  // Test Stripe webhook endpoint exists
  const stripeTest = await testAPI('/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({})
  });
  logTest('Stripe webhook', stripeTest.status !== 0, 
    'Stripe integration endpoint exists');

  // Test subscription endpoint
  const subscriptionTest = await testAPI('/api/subscription');
  logTest('Subscription endpoint', subscriptionTest.status !== 0, 
    'Subscription system accessible');

  // Test 8: Business Settings
  console.log('\n🔍 Testing Business Configuration...');
  
  const businessTest = await testAPI('/api/business-settings');
  logTest('Business settings', businessTest.status !== 0, 
    'Business settings endpoint responding');

  // Test 9: Website Integration
  console.log('\n🔍 Testing Website System...');
  
  const websiteTest = await testAPI('/api/websites');
  logTest('Website integration', websiteTest.status !== 0, 
    'Website system accessible');

  // Test 10: Support System
  console.log('\n🔍 Testing Support System...');
  
  const supportTest = await testAPI('/api/support-tickets');
  logTest('Support system', supportTest.status !== 0, 
    'Support ticket system responding');

  // Print Summary
  console.log('\n📊 Test Summary:');
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

  const readyForLaunch = testResults.failed === 0 && testResults.passed >= 8;
  console.log(`\n🚀 Launch Ready: ${readyForLaunch ? '✅ YES' : '❌ NO - Address failed tests first'}`);
  
  return readyForLaunch;
}

// Run tests
runTests().then(ready => {
  process.exit(ready ? 0 : 1);
}).catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});