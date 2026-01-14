/**
 * localStorage utilities for managing pending calculators
 * Used on the /try page to store AI-generated calculators before user signup
 */

const STORAGE_KEY = 'autobidder_pending_calculator';

// Variable type matching the AI formula response
interface Variable {
  id: string;
  name: string;
  type: 'number' | 'select' | 'text' | 'multiple-choice' | 'dropdown';
  unit?: string;
  tooltip?: string;
  options?: Array<{
    id?: string;
    label: string;
    value: string | number;
    numericValue?: number;
    multiplier?: number;
    image?: string;
  }>;
  defaultValue?: string | number | boolean;
  allowMultipleSelection?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

// AIFormulaResponse type matching server definition
export interface AIFormulaResponse {
  name: string;
  title: string;
  description: string;
  bulletPoints: string[];
  formula: string;
  variables: Variable[];
  iconUrl: string;
}

export interface StoredCalculator {
  id: string;
  formula: AIFormulaResponse;
  createdAt: string;
}

/**
 * Generate a simple UUID for tracking
 */
function generateId(): string {
  return 'calc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save a calculator to localStorage
 */
export function saveCalculator(formula: AIFormulaResponse): StoredCalculator | null {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return null;
  }

  const stored: StoredCalculator = {
    id: generateId(),
    formula,
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return stored;
  } catch (error) {
    console.error('Failed to save calculator to localStorage:', error);
    return null;
  }
}

/**
 * Get the stored calculator from localStorage
 */
export function getCalculator(): StoredCalculator | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as StoredCalculator;

    // Basic validation
    if (!parsed.id || !parsed.formula || !parsed.formula.name) {
      console.warn('Invalid stored calculator data, clearing');
      clearCalculator();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse stored calculator:', error);
    clearCalculator();
    return null;
  }
}

/**
 * Check if there's a stored calculator
 */
export function hasCalculator(): boolean {
  return getCalculator() !== null;
}

/**
 * Clear the stored calculator
 */
export function clearCalculator(): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear calculator from localStorage:', error);
  }
}
