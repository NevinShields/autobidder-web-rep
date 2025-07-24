import type { Variable } from './schema';

// Utility function to evaluate whether a variable should be visible based on conditional logic
export function evaluateConditionalLogic(
  variable: Variable,
  variableValues: Record<string, any>,
  allVariables: Variable[]
): boolean {
  // If conditional logic is not enabled, always show the variable
  if (!variable.conditionalLogic?.enabled || !variable.conditionalLogic.dependsOnVariable) {
    return true;
  }

  const { dependsOnVariable, condition, expectedValue, expectedValues } = variable.conditionalLogic;
  const actualValue = variableValues[dependsOnVariable];

  // If the dependent variable doesn't have a value yet, hide this variable
  if (actualValue === undefined || actualValue === null) {
    return false;
  }

  switch (condition) {
    case 'equals':
      return actualValue === expectedValue;
    
    case 'not_equals':
      return actualValue !== expectedValue;
    
    case 'greater_than':
      return typeof actualValue === 'number' && typeof expectedValue === 'number' && actualValue > expectedValue;
    
    case 'less_than':
      return typeof actualValue === 'number' && typeof expectedValue === 'number' && actualValue < expectedValue;
    
    case 'contains':
      if (expectedValues && Array.isArray(expectedValues)) {
        // Check if actual value is one of the expected values
        return expectedValues.includes(actualValue);
      }
      // For string contains
      return typeof actualValue === 'string' && typeof expectedValue === 'string' && 
             actualValue.toLowerCase().includes(expectedValue.toLowerCase());
    
    case 'is_empty':
      return !actualValue || actualValue === '' || 
             (Array.isArray(actualValue) && actualValue.length === 0);
    
    case 'is_not_empty':
      return actualValue && actualValue !== '' && 
             !(Array.isArray(actualValue) && actualValue.length === 0);
    
    default:
      return true;
  }
}

// Get variables that can be used as dependencies (variables that appear before the current one)
export function getAvailableDependencies(currentVariable: Variable, allVariables: Variable[]): Variable[] {
  const currentIndex = allVariables.findIndex(v => v.id === currentVariable.id);
  if (currentIndex === -1) return [];
  
  // Only return variables that appear before the current variable
  return allVariables.slice(0, currentIndex).filter(v => 
    // Exclude the current variable itself and variables that depend on others to avoid circular dependencies
    v.id !== currentVariable.id && !v.conditionalLogic?.enabled
  );
}

// Helper to get user-friendly condition labels
export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    'equals': 'Equals',
    'not_equals': 'Does not equal',
    'greater_than': 'Greater than',
    'less_than': 'Less than',
    'contains': 'Contains/Is one of',
    'is_empty': 'Is empty',
    'is_not_empty': 'Is not empty'
  };
  return labels[condition] || condition;
}

// Helper to determine which conditions are available for a variable type
export function getAvailableConditions(variableType: string): string[] {
  switch (variableType) {
    case 'number':
      return ['equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];
    case 'select':
    case 'dropdown':
    case 'multiple-choice':
      return ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'];
    case 'checkbox':
      return ['equals', 'not_equals'];
    case 'text':
      return ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'];
    default:
      return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
  }
}