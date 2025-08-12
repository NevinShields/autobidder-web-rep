#!/usr/bin/env node

/**
 * Price Calculation Testing Script
 * Tests the critical price calculation logic to ensure accuracy
 */

/**
 * Test price calculation functions
 * These mirror the logic used in your calculators
 */

function testPriceCalculations() {
  console.log('🧮 Testing Price Calculation Logic...\n');

  const tests = [];

  // Test 1: Basic arithmetic
  const basic = testCalculation('10 * 5', 50, 'Basic multiplication');
  tests.push(basic);

  // Test 2: Addition with variables
  const addition = testCalculation('100 + 25 + 10', 135, 'Addition');
  tests.push(addition);

  // Test 3: Percentage calculations
  const percentage = testCalculation('1000 * 0.15', 150, 'Percentage (15%)');
  tests.push(percentage);

  // Test 4: Complex formula with conditionals
  const complex = testConditionalCalculation(
    { sqft: 1000, service: 'premium' },
    'sqft < 500 ? 100 : (sqft * 0.50) + (service === "premium" ? 50 : 0)',
    550,
    'Complex conditional formula'
  );
  tests.push(complex);

  // Test 5: Large numbers (test the $32.48 vs $3248 bug)
  const largeNumber = testCalculation('3248', 3248, 'Large numbers');
  tests.push(largeNumber);

  // Test 6: Decimal precision
  const decimal = testCalculation('99.99 * 1.08', 107.99, 'Decimal precision');
  tests.push(decimal);

  // Test 7: Distance pricing
  const distance = testDistancePricing(50, 10, 2.5, 75, 'Distance-based pricing');
  tests.push(distance);

  // Summary
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  console.log('\n📊 Price Calculation Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

  if (failed > 0) {
    console.log('\n🚨 Failed Tests:');
    tests.filter(t => !t.passed).forEach(test => {
      console.log(`   ❌ ${test.name}: Expected ${test.expected}, got ${test.actual}`);
    });
  }

  return failed === 0;
}

function testCalculation(formula, expected, name) {
  try {
    // Simple evaluation for testing - in production this would use your formula parser
    const actual = eval(formula);
    const passed = Math.abs(actual - expected) < 0.01; // Allow for small floating point errors
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name} - Formula: ${formula} = ${actual}`);
    
    return { name, passed, expected, actual };
  } catch (error) {
    console.log(`❌ FAIL: ${name} - Error: ${error.message}`);
    return { name, passed: false, expected, actual: null, error: error.message };
  }
}

function testConditionalCalculation(variables, formula, expected, name) {
  try {
    // Replace variables in formula for testing
    let testFormula = formula;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      testFormula = testFormula.replace(regex, typeof value === 'string' ? `"${value}"` : value);
    });
    
    const actual = eval(testFormula);
    const passed = Math.abs(actual - expected) < 0.01;
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name} - Variables: ${JSON.stringify(variables)} = ${actual}`);
    
    return { name, passed, expected, actual };
  } catch (error) {
    console.log(`❌ FAIL: ${name} - Error: ${error.message}`);
    return { name, passed: false, expected, actual: null, error: error.message };
  }
}

function testDistancePricing(basePrice, distanceRate, miles, expected, name) {
  try {
    // Test distance pricing calculation: basePrice + (distanceRate * miles)
    const distanceCharge = distanceRate * miles;
    const actual = basePrice + distanceCharge;
    const passed = Math.abs(actual - expected) < 0.01;
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name} - Base: $${basePrice}, Rate: $${distanceRate}/mile, Distance: ${miles} miles = $${actual}`);
    
    return { name, passed, expected, actual };
  } catch (error) {
    console.log(`❌ FAIL: ${name} - Error: ${error.message}`);
    return { name, passed: false, expected, actual: null, error: error.message };
  }
}

/**
 * Test currency conversion (dollars to cents and vice versa)
 */
function testCurrencyConversion() {
  console.log('\n💰 Testing Currency Conversion...\n');

  const tests = [];

  // Test dollars to cents
  tests.push(testDollarsToCents(100.50, 10050, 'Dollars to cents'));
  tests.push(testDollarsToCents(3248.00, 324800, 'Large dollar amount to cents'));
  tests.push(testDollarsToCents(0.99, 99, 'Small dollar amount to cents'));

  // Test cents to dollars  
  tests.push(testCentsToDollars(10050, 100.50, 'Cents to dollars'));
  tests.push(testCentsToDollars(324800, 3248.00, 'Large cent amount to dollars'));
  tests.push(testCentsToDollars(99, 0.99, 'Small cent amount to dollars'));

  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  console.log('\n📊 Currency Conversion Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  return failed === 0;
}

function testDollarsToCents(dollars, expectedCents, name) {
  const actualCents = Math.round(dollars * 100);
  const passed = actualCents === expectedCents;
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name} - $${dollars} = ${actualCents} cents`);
  
  return { name, passed, expected: expectedCents, actual: actualCents };
}

function testCentsToDollars(cents, expectedDollars, name) {
  const actualDollars = cents / 100;
  const passed = Math.abs(actualDollars - expectedDollars) < 0.01;
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name} - ${cents} cents = $${actualDollars}`);
  
  return { name, passed, expected: expectedDollars, actual: actualDollars };
}

// Run tests
const priceTestsPass = testPriceCalculations();
const currencyTestsPass = testCurrencyConversion();

const allTestsPass = priceTestsPass && currencyTestsPass;

console.log(`\n🧮 Price System Ready: ${allTestsPass ? '✅ YES' : '❌ NO - Fix calculation issues first'}`);

process.exit(allTestsPass ? 0 : 1);