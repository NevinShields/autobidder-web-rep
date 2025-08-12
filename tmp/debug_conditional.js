// Debug script to check conditional logic
console.log("=== CONDITIONAL LOGIC DEBUG ===");

// Test the evaluateConditionalLogic function
function evaluateConditionalLogic(variable, variableValues, allVariables) {
  // If conditional logic is not enabled, always show the variable
  if (!variable.conditionalLogic?.enabled || !variable.conditionalLogic.dependsOnVariable) {
    return true;
  }

  const { dependsOnVariable, condition, expectedValue, expectedValues } = variable.conditionalLogic;
  const actualValue = variableValues[dependsOnVariable];

  console.log(`Checking variable: ${variable.name}`);
  console.log(`Depends on: ${dependsOnVariable}`);
  console.log(`Condition: ${condition}`);
  console.log(`Expected value: ${expectedValue}`);
  console.log(`Expected values: ${JSON.stringify(expectedValues)}`);
  console.log(`Actual value: ${JSON.stringify(actualValue)}`);

  // If the dependent variable doesn't have a value yet, hide this variable
  if (actualValue === undefined || actualValue === null) {
    console.log("Hiding: dependent variable has no value");
    return false;
  }

  switch (condition) {
    case 'equals':
      const result = actualValue === expectedValue;
      console.log(`Equals check: ${JSON.stringify(actualValue)} === ${JSON.stringify(expectedValue)} = ${result}`);
      return result;
    
    case 'not_equals':
      const notEqualsResult = actualValue !== expectedValue;
      console.log(`Not equals check: ${JSON.stringify(actualValue)} !== ${JSON.stringify(expectedValue)} = ${notEqualsResult}`);
      return notEqualsResult;
    
    case 'contains':
      if (expectedValues && Array.isArray(expectedValues)) {
        // Check if actual value is one of the expected values
        const containsResult = expectedValues.includes(actualValue);
        console.log(`Contains array check: ${JSON.stringify(expectedValues)} includes ${JSON.stringify(actualValue)} = ${containsResult}`);
        return containsResult;
      }
      // For string contains
      const stringContainsResult = typeof actualValue === 'string' && typeof expectedValue === 'string' && 
             actualValue.toLowerCase().includes(expectedValue.toLowerCase());
      console.log(`String contains check: ${JSON.stringify(actualValue)} contains ${JSON.stringify(expectedValue)} = ${stringContainsResult}`);
      return stringContainsResult;
    
    default:
      console.log("Default case - showing variable");
      return true;
  }
}

// Test with sample data that matches what we saw in logs
const testValues = {
  houseHeight: ["Single Story"],
  roofMaterial: ["Metal"],
  roofSlope: ["Flat"]
};

// Test conditional variable
const testVariable = {
  name: "Test Metal Question",
  conditionalLogic: {
    enabled: true,
    dependsOnVariable: "roofMaterial",
    condition: "equals",
    expectedValue: "Metal"
  }
};

console.log("\n=== TESTING CONDITIONAL LOGIC ===");
const shouldShow = evaluateConditionalLogic(testVariable, testValues, []);
console.log(`Should show variable: ${shouldShow}`);

// Test with array values (which we see in the logs)
console.log("\n=== TESTING WITH ARRAY VALUE ===");
const testVariable2 = {
  name: "Test Metal Question Array",
  conditionalLogic: {
    enabled: true,
    dependsOnVariable: "roofMaterial",
    condition: "contains",
    expectedValues: ["Metal"]
  }
};

const shouldShow2 = evaluateConditionalLogic(testVariable2, testValues, []);
console.log(`Should show variable with array check: ${shouldShow2}`);