export type FormulaEditContextMode = 'targeted' | 'rebuild';

function truncateString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength)}...`;
}

function compactObject<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null) return false;
      if (typeof entry === 'string' && entry.trim() === '') return false;
      if (Array.isArray(entry) && entry.length === 0) return false;
      return true;
    }),
  ) as Partial<T>;
}

function summarizeOptions(options: any[], mode: FormulaEditContextMode) {
  const maxOptions = mode === 'targeted' ? 8 : 12;
  const visibleOptions: Array<Record<string, unknown>> = options.slice(0, maxOptions).map((option) => compactObject({
    id: option?.id,
    label: truncateString(option?.label, 60),
    value: typeof option?.value === 'string' || typeof option?.value === 'number' ? option.value : undefined,
    numericValue: typeof option?.numericValue === 'number' ? option.numericValue : undefined,
    defaultUnselectedValue: typeof option?.defaultUnselectedValue === 'number' ? option.defaultUnselectedValue : undefined,
  }));

  if (options.length > maxOptions) {
    visibleOptions.push({ truncatedOptionCount: options.length - maxOptions });
  }

  return visibleOptions;
}

function summarizeConditionalLogic(conditionalLogic: any) {
  if (!conditionalLogic || typeof conditionalLogic !== 'object') {
    return undefined;
  }

  const conditions = Array.isArray(conditionalLogic.conditions)
    ? conditionalLogic.conditions.slice(0, 6).map((condition: any) => compactObject({
        dependsOnVariable: condition?.dependsOnVariable,
        condition: condition?.condition,
        expectedValue: condition?.expectedValue,
        expectedValues: Array.isArray(condition?.expectedValues) ? condition.expectedValues.slice(0, 6) : undefined,
      }))
    : undefined;

  return compactObject({
    enabled: conditionalLogic.enabled,
    operator: conditionalLogic.operator,
    dependsOnVariable: conditionalLogic.dependsOnVariable,
    condition: conditionalLogic.condition,
    expectedValue: conditionalLogic.expectedValue,
    expectedValues: Array.isArray(conditionalLogic.expectedValues) ? conditionalLogic.expectedValues.slice(0, 6) : undefined,
    defaultValue: conditionalLogic.defaultValue,
    conditions,
  });
}

function summarizeVariable(variable: any, mode: FormulaEditContextMode, depth = 0): Record<string, unknown> {
  const maxChildVariables = mode === 'targeted' ? 10 : 16;
  const summary: Record<string, unknown> = compactObject({
    id: variable?.id,
    name: truncateString(variable?.name, 80),
    type: variable?.type,
    unit: truncateString(variable?.unit, 24),
    defaultValue: variable?.defaultValue,
    allowMultipleSelection: variable?.allowMultipleSelection,
    options: Array.isArray(variable?.options) ? summarizeOptions(variable.options, mode) : undefined,
    conditionalLogic: summarizeConditionalLogic(variable?.conditionalLogic),
  });

  if (variable?.repeatableConfig && typeof variable.repeatableConfig === 'object') {
    const repeatableConfig = variable.repeatableConfig;
    summary.repeatableConfig = compactObject({
      countSourceMode: repeatableConfig.countSourceMode,
      countVariableId: repeatableConfig.countVariableId,
      fixedCount: repeatableConfig.fixedCount,
      minInstances: repeatableConfig.minInstances,
      maxInstances: repeatableConfig.maxInstances,
      itemLabelTemplate: truncateString(repeatableConfig.itemLabelTemplate, 80),
      instanceFormula: truncateString(repeatableConfig.instanceFormula, 200),
      childVariables: depth < 1 && Array.isArray(repeatableConfig.childVariables)
        ? repeatableConfig.childVariables.slice(0, maxChildVariables).map((childVariable: any) => summarizeVariable(childVariable, mode, depth + 1))
        : undefined,
      truncatedChildVariableCount: Array.isArray(repeatableConfig.childVariables) && repeatableConfig.childVariables.length > maxChildVariables
        ? repeatableConfig.childVariables.length - maxChildVariables
        : undefined,
    });
  }

  return summary;
}

export function buildFormulaEditContext(currentFormula: any, mode: FormulaEditContextMode): string {
  const variables = Array.isArray(currentFormula?.variables)
    ? currentFormula.variables.map((variable: any) => summarizeVariable(variable, mode))
    : [];

  const summary = compactObject({
    name: truncateString(currentFormula?.name, 120),
    title: truncateString(currentFormula?.title, 160),
    description: truncateString(currentFormula?.description, mode === 'targeted' ? 400 : 1000),
    bulletPoints: Array.isArray(currentFormula?.bulletPoints)
      ? currentFormula.bulletPoints.slice(0, mode === 'targeted' ? 4 : 6).map((bullet: unknown) => truncateString(bullet, 120)).filter(Boolean)
      : undefined,
    formula: truncateString(currentFormula?.formula, 500),
    iconUrl: truncateString(currentFormula?.iconUrl, 120),
    variableCount: variables.length,
    variables,
  });

  return JSON.stringify(summary, null, 2);
}
