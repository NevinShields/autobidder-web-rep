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
  let actualValue = variableValues[dependsOnVariable];

  // If the dependent variable doesn't have a value yet, hide this variable
  if (actualValue === undefined || actualValue === null) {
    return false;
  }

  // Handle case where actualValue is an array (common for select/dropdown inputs)
  // For single-select inputs, take the first value; for multi-select, we'll handle it in the condition logic
  if (Array.isArray(actualValue)) {
    // For equals/not_equals conditions, use the first value (single-select behavior)
    if (condition === 'equals' || condition === 'not_equals') {
      actualValue = actualValue.length > 0 ? actualValue[0] : null;
    }
    // For contains condition, we might want to check if any of the selected values match
    // This will be handled in the contains case below
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
        // Handle case where actualValue is an array (multi-select)
        if (Array.isArray(actualValue)) {
          // Check if any of the actual values are in the expected values
          return actualValue.some(val => expectedValues.includes(val));
        }
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

// Helper function to get only visible variables based on conditional logic
export function getVisibleVariables(
  variables: Variable[],
  variableValues: Record<string, any>
): Variable[] {
  return variables.filter(variable => {
    // Always show variables without conditional logic
    if (!variable.conditionalLogic?.enabled) {
      return true;
    }
    
    // Use the evaluateConditionalLogic function to determine visibility
    return evaluateConditionalLogic(variable, variableValues, variables);
  });
}

// Helper function to check if all visible variables have values
export function areAllVisibleVariablesCompleted(
  variables: Variable[],
  variableValues: Record<string, any>
): { isCompleted: boolean; missingVariables: string[] } {
  const visibleVariables = getVisibleVariables(variables, variableValues);
  const missingVariables: string[] = [];
  
  for (const variable of visibleVariables) {
    const value = variableValues[variable.id];
    
    // Check if the variable has a value
    const hasValue = value !== undefined && value !== null && value !== '';
    
    // For arrays (like multiple choice), check if not empty
    const hasArrayValue = Array.isArray(value) && value.length > 0;
    
    if (!hasValue && !hasArrayValue) {
      missingVariables.push(variable.name);
    }
  }
  
  return {
    isCompleted: missingVariables.length === 0,
    missingVariables
  };
}

// Helper function to get default value for a hidden conditional variable
export function getDefaultValueForHiddenVariable(variable: Variable): any {
  // Check if the variable has a custom default value set
  if (variable.conditionalLogic?.defaultValue !== undefined) {
    return variable.conditionalLogic.defaultValue;
  }
  
  // Use type-appropriate defaults
  switch (variable.type) {
    case 'checkbox':
      return false; // Unchecked by default
    case 'number':
    case 'slider':
      return 0; // Zero for numeric values
    case 'select':
    case 'dropdown':
    case 'multiple-choice':
      return variable.type === 'multiple-choice' ? [] : ''; // Empty for selects
    case 'text':
      return ''; // Empty string for text
    default:
      return 0; // Default fallback
  }
}