import { useState, useEffect, useCallback } from 'react';
import {
  AIFormulaResponse,
  StoredCalculator,
  saveCalculator,
  getCalculator,
  clearCalculator,
  hasCalculator,
} from '@/lib/calculator-storage';

interface UsePendingCalculatorReturn {
  calculator: StoredCalculator | null;
  hasStoredCalculator: boolean;
  save: (formula: AIFormulaResponse) => StoredCalculator | null;
  clear: () => void;
  refresh: () => void;
}

/**
 * React hook for managing pending calculators in localStorage
 * Provides state synchronization and cross-tab updates
 */
export function usePendingCalculator(): UsePendingCalculatorReturn {
  const [calculator, setCalculator] = useState<StoredCalculator | null>(null);

  // Load calculator on mount
  useEffect(() => {
    setCalculator(getCalculator());
  }, []);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'autobidder_pending_calculator') {
        setCalculator(getCalculator());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const save = useCallback((formula: AIFormulaResponse): StoredCalculator | null => {
    const stored = saveCalculator(formula);
    setCalculator(stored);
    return stored;
  }, []);

  const clear = useCallback(() => {
    clearCalculator();
    setCalculator(null);
  }, []);

  const refresh = useCallback(() => {
    setCalculator(getCalculator());
  }, []);

  return {
    calculator,
    hasStoredCalculator: calculator !== null,
    save,
    clear,
    refresh,
  };
}

// Re-export hasCalculator for simple checks without the hook
export { hasCalculator };
