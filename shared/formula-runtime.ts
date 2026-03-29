import { areAllVisibleVariablesCompleted, evaluateConditionalLogic, evaluateConditionalRule, getDefaultValueForHiddenVariable } from './conditional-logic';
import type { PriceConstraintRule, Variable } from './schema';

export const REPEATABLE_GROUP_VALUES_KEY = '__repeatableGroups' as const;

export type RepeatableGroupInstanceValues = Record<string, any>;
export type RepeatableGroupValuesMap = Record<string, RepeatableGroupInstanceValues[]>;
export type FormulaValueMap = Record<string, any> & {
  [REPEATABLE_GROUP_VALUES_KEY]?: RepeatableGroupValuesMap;
};

const toOptionId = (rawValue: unknown, fallbackIndex: number): string => {
  const base = String(rawValue ?? '').trim().toLowerCase();
  const normalized = base
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return normalized || `option_${fallbackIndex}`;
};

export function isRepeatableGroupVariable(variable: Variable): boolean {
  return variable.type === 'repeatable-group' && Boolean(variable.repeatableConfig);
}

export function getRepeatableGroupVariables(variables: Variable[]): Variable[] {
  return variables.filter(isRepeatableGroupVariable);
}

export function getFlatFormulaVariables(variables: Variable[]): Variable[] {
  return variables.filter((variable) => !isRepeatableGroupVariable(variable));
}

export function getRepeatableGroupValues(values: Record<string, any> | undefined | null): RepeatableGroupValuesMap {
  const raw = values?.[REPEATABLE_GROUP_VALUES_KEY];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return raw as RepeatableGroupValuesMap;
}

export function getFlatFormulaValues(values: Record<string, any> | undefined | null): Record<string, any> {
  if (!values || typeof values !== 'object') {
    return {};
  }
  const next = { ...values };
  delete next[REPEATABLE_GROUP_VALUES_KEY];
  return next;
}

function replaceMultiSelectOptionReferences(
  formulaExpression: string,
  variables: Variable[],
  variableValues: Record<string, any>,
): string {
  let nextExpression = formulaExpression;

  variables.forEach((variable) => {
    if (variable.type !== 'multiple-choice' || !variable.allowMultipleSelection || !variable.options) {
      return;
    }

    const selectedValues = Array.isArray(variableValues[variable.id]) ? variableValues[variable.id] : [];

    variable.options.forEach((option, optionIndex) => {
      const optionId = toOptionId(option.id ?? option.value, optionIndex + 1);
      if (!optionId) {
        return;
      }

      const optionReference = `${variable.id}_${optionId}`;
      const isSelected = selectedValues.some((selectedValue: any) => selectedValue?.toString() === option.value?.toString());
      const unselectedDefault = option.defaultUnselectedValue !== undefined ? option.defaultUnselectedValue : 0;
      const optionValue = isSelected ? (option.numericValue || 0) : unselectedDefault;

      nextExpression = nextExpression.replace(
        new RegExp(`\\b${optionReference}\\b`, 'g'),
        String(optionValue),
      );
    });
  });

  return nextExpression;
}

export function resolveVariableValueForCalculation(
  variable: Variable,
  variableValues: Record<string, any>,
  allVariables: Variable[],
): number {
  if (isRepeatableGroupVariable(variable)) {
    return 0;
  }

  let value = variableValues[variable.id];
  const shouldShow = !variable.conditionalLogic?.enabled || evaluateConditionalLogic(variable, variableValues, allVariables);

  if (!shouldShow) {
    const defaultValue = getDefaultValueForHiddenVariable(variable);

    if (variable.type === 'checkbox') {
      const checkedVal = variable.checkedValue !== undefined ? variable.checkedValue : 1;
      const uncheckedVal = variable.uncheckedValue !== undefined ? variable.uncheckedValue : 0;
      return defaultValue ? Number(checkedVal) || 0 : Number(uncheckedVal) || 0;
    }

    if ((variable.type === 'select' || variable.type === 'dropdown') && variable.options) {
      const option = variable.options.find((opt) => opt.value === defaultValue);
      return Number(option?.multiplier ?? option?.numericValue ?? defaultValue ?? 0) || 0;
    }

    if (variable.type === 'multiple-choice' && variable.options) {
      if (Array.isArray(defaultValue)) {
        return defaultValue.reduce((total: number, selectedValue: any) => {
          const option = variable.options?.find((opt) => opt.value?.toString() === selectedValue?.toString());
          return total + (option?.numericValue || 0);
        }, 0);
      }

      const option = variable.options.find((opt) => opt.value === defaultValue);
      return Number(option?.numericValue ?? defaultValue ?? 0) || 0;
    }

    if (variable.type === 'number' || variable.type === 'slider' || variable.type === 'stepper') {
      return Number(defaultValue) || 0;
    }

    return 0;
  }

  if (Array.isArray(value) && (variable.type === 'select' || variable.type === 'dropdown')) {
    value = value[0];
  }

  if (variable.type === 'select' && variable.options) {
    const option = variable.options.find((opt) => opt.value === value);
    return Number(option?.multiplier ?? option?.numericValue ?? 0) || 0;
  }

  if (variable.type === 'dropdown' && variable.options) {
    const option = variable.options.find((opt) => opt.value === value);
    return Number(option?.numericValue ?? 0) || 0;
  }

  if (variable.type === 'multiple-choice' && variable.options) {
    if (Array.isArray(value)) {
      return value.reduce((total: number, selectedValue: any) => {
        const option = variable.options?.find((opt) => opt.value?.toString() === selectedValue?.toString());
        return total + (option?.numericValue || 0);
      }, 0);
    }

    if (value !== undefined && value !== null && value !== '') {
      const option = variable.options.find((opt) => opt.value?.toString() === value?.toString());
      return Number(option?.numericValue ?? value ?? 0) || 0;
    }

    return 0;
  }

  if (variable.type === 'number' || variable.type === 'slider' || variable.type === 'stepper') {
    return Number(value) || 0;
  }

  if (variable.type === 'checkbox') {
    const checkedVal = variable.checkedValue !== undefined ? variable.checkedValue : 1;
    const uncheckedVal = variable.uncheckedValue !== undefined ? variable.uncheckedValue : 0;
    return value ? Number(checkedVal) || 0 : Number(uncheckedVal) || 0;
  }

  return 0;
}

export function evaluateFlatFormulaExpression(
  formulaExpression: string,
  variables: Variable[],
  variableValues: Record<string, any>,
): number {
  if (!formulaExpression.trim()) {
    return 0;
  }

  const flatVariables = getFlatFormulaVariables(variables);
  let nextExpression = replaceMultiSelectOptionReferences(formulaExpression, flatVariables, variableValues);

  flatVariables.forEach((variable) => {
    const resolvedValue = resolveVariableValueForCalculation(variable, variableValues, flatVariables);
    nextExpression = nextExpression.replace(
      new RegExp(`\\b${variable.id}\\b`, 'g'),
      String(resolvedValue),
    );
  });

  const result = Function(`"use strict"; return (${nextExpression})`)();
  return Number.isFinite(Number(result)) ? Number(result) : 0;
}

export function getRepeatableGroupCount(
  group: Variable,
  allVariables: Variable[],
  topLevelValues: Record<string, any>,
): number {
  const config = group.repeatableConfig;
  if (!config) {
    return 0;
  }

  let count = 0;

  if (config.countSourceMode === 'fixed') {
    count = Math.floor(Number(config.fixedCount) || 0);
  } else {
    if (!config.countVariableId) {
      return 0;
    }

    const rawCountValue = topLevelValues[config.countVariableId];
    if (
      rawCountValue === undefined ||
      rawCountValue === null ||
      rawCountValue === '' ||
      (Array.isArray(rawCountValue) && rawCountValue.length === 0)
    ) {
      return 0;
    }

    const flatVariables = getFlatFormulaVariables(allVariables);
    const countVariable = flatVariables.find((variable) => variable.id === config.countVariableId);
    if (!countVariable) {
      return 0;
    }

    count = Math.floor(resolveVariableValueForCalculation(countVariable, topLevelValues, flatVariables));
  }

  if (typeof config.minInstances === 'number') {
    count = Math.max(config.minInstances, count);
  }

  if (typeof config.maxInstances === 'number') {
    count = Math.min(config.maxInstances, count);
  }

  return Math.max(0, count);
}

export function getRepeatableGroupLabel(group: Variable, index: number): string {
  const template = group.repeatableConfig?.itemLabelTemplate?.trim();
  if (!template) {
    return `${group.name} ${index + 1}`;
  }

  return template
    .replace(/\{index\}/gi, String(index + 1))
    .replace(/\{number\}/gi, String(index + 1));
}

export function evaluateRepeatableGroup(
  group: Variable,
  allVariables: Variable[],
  topLevelValues: Record<string, any>,
  groupValues: RepeatableGroupInstanceValues[] = [],
): { total: number; count: number; perInstanceTotals: number[] } {
  if (!group.repeatableConfig) {
    return { total: 0, count: 0, perInstanceTotals: [] };
  }

  const shouldShow = !group.conditionalLogic?.enabled || evaluateConditionalLogic(group, topLevelValues, allVariables);
  if (!shouldShow) {
    return { total: 0, count: 0, perInstanceTotals: [] };
  }

  const count = getRepeatableGroupCount(group, allVariables, topLevelValues);
  const childVariables = group.repeatableConfig.childVariables || [];
  const instanceFormula = group.repeatableConfig.instanceFormula || '';
  const perInstanceTotals = Array.from({ length: count }, (_, index) => {
    const instanceValues = groupValues[index] || {};
    return evaluateFlatFormulaExpression(instanceFormula, childVariables, instanceValues);
  });

  const total = perInstanceTotals.reduce((sum, value) => sum + value, 0);
  return { total, count, perInstanceTotals };
}

export function evaluateFormulaWithRepeatableGroups(
  formulaExpression: string,
  variables: Variable[],
  values: FormulaValueMap,
): number {
  if (!formulaExpression.trim()) {
    return 0;
  }

  const topLevelValues = getFlatFormulaValues(values);
  const repeatableValues = getRepeatableGroupValues(values);
  const flatVariables = getFlatFormulaVariables(variables);
  let nextExpression = formulaExpression;

  getRepeatableGroupVariables(variables).forEach((group) => {
    const { total } = evaluateRepeatableGroup(group, variables, topLevelValues, repeatableValues[group.id] || []);
    nextExpression = nextExpression.replace(new RegExp(`\\b${group.id}\\b`, 'g'), String(total));
  });

  nextExpression = replaceMultiSelectOptionReferences(nextExpression, flatVariables, topLevelValues);

  flatVariables.forEach((variable) => {
    const resolvedValue = resolveVariableValueForCalculation(variable, topLevelValues, flatVariables);
    nextExpression = nextExpression.replace(new RegExp(`\\b${variable.id}\\b`, 'g'), String(resolvedValue));
  });

  const result = Function(`"use strict"; return (${nextExpression})`)();
  return Number.isFinite(Number(result)) ? Number(result) : 0;
}

export function resolvePriceConstraintValue(
  rules: PriceConstraintRule[] | null | undefined,
  fallbackValue: number | null | undefined,
  values: Record<string, any>,
): number | null {
  const matchingRule = (rules || []).find((rule) => {
    if (!rule?.enabled) {
      return false;
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      return false;
    }

    return evaluateConditionalRule(
      {
        enabled: true,
        operator: rule.operator || 'AND',
        conditions: rule.conditions,
      },
      values,
    );
  });

  if (matchingRule && Number.isFinite(matchingRule.value)) {
    return matchingRule.value;
  }

  return fallbackValue ?? null;
}

export function applyPriceConstraints(
  rawPrice: number,
  config: {
    minPrice?: number | null;
    maxPrice?: number | null;
    conditionalMinPrices?: PriceConstraintRule[] | null;
    conditionalMaxPrices?: PriceConstraintRule[] | null;
  },
  values: Record<string, any>,
  options?: { priceUnit?: 'dollars' | 'cents'; constraintUnit?: 'dollars' | 'cents' },
): number {
  const priceUnit = options?.priceUnit || 'dollars';
  const constraintUnit = options?.constraintUnit || 'cents';
  const normalizeConstraint = (constraintValue: number | null): number | null => {
    if (constraintValue === null || constraintValue === undefined) {
      return null;
    }

    if (priceUnit === constraintUnit) {
      return constraintValue;
    }

    if (priceUnit === 'dollars' && constraintUnit === 'cents') {
      return constraintValue / 100;
    }

    if (priceUnit === 'cents' && constraintUnit === 'dollars') {
      return Math.round(constraintValue * 100);
    }

    return constraintValue;
  };

  let nextPrice = rawPrice;
  const resolvedMinPrice = normalizeConstraint(
    resolvePriceConstraintValue(config.conditionalMinPrices, config.minPrice, values),
  );
  const resolvedMaxPrice = normalizeConstraint(
    resolvePriceConstraintValue(config.conditionalMaxPrices, config.maxPrice, values),
  );

  if (resolvedMinPrice !== null && nextPrice < resolvedMinPrice) {
    nextPrice = resolvedMinPrice;
  }

  if (resolvedMaxPrice !== null && nextPrice > resolvedMaxPrice) {
    nextPrice = resolvedMaxPrice;
  }

  return nextPrice;
}

export function getFormulaCompletionStatus(
  variables: Variable[],
  values: FormulaValueMap,
): { isCompleted: boolean; missingVariables: string[] } {
  const topLevelValues = getFlatFormulaValues(values);
  const repeatableValues = getRepeatableGroupValues(values);
  const flatVariables = getFlatFormulaVariables(variables);
  const topLevelCompletion = areAllVisibleVariablesCompleted(flatVariables, topLevelValues);
  const missingVariables = [...topLevelCompletion.missingVariables];

  getRepeatableGroupVariables(variables).forEach((group) => {
    const shouldShow = !group.conditionalLogic?.enabled || evaluateConditionalLogic(group, topLevelValues, variables);
    if (!shouldShow) {
      return;
    }

    const count = getRepeatableGroupCount(group, variables, topLevelValues);
    const childVariables = group.repeatableConfig?.childVariables || [];
    const instances = repeatableValues[group.id] || [];

    for (let index = 0; index < count; index += 1) {
      const instanceValues = instances[index] || {};
      const childCompletion = areAllVisibleVariablesCompleted(childVariables, instanceValues);
      if (!childCompletion.isCompleted) {
        const label = getRepeatableGroupLabel(group, index);
        childCompletion.missingVariables.forEach((name) => {
          missingVariables.push(`${label}: ${name}`);
        });
      }
    }
  });

  return {
    isCompleted: missingVariables.length === 0,
    missingVariables,
  };
}
