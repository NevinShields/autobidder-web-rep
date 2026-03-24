import type { Formula, Variable } from "@shared/schema";
import {
  evaluateRepeatableGroup,
  getFlatFormulaValues,
  getRepeatableGroupLabel,
  getRepeatableGroupValues,
  isRepeatableGroupVariable,
} from "@shared/formula-runtime";
import { evaluateConditionalLogic } from "@shared/conditional-logic";

interface SubmittedVariableDetailsProps {
  values: Record<string, any>;
  formula?: Pick<Formula, "variables"> | null;
  className?: string;
}

const formatLabel = (label: string) =>
  label
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const hasDisplayValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
};

const formatOptionValue = (variable: Variable | undefined, rawValue: unknown): string => {
  if (!variable?.options) {
    return String(rawValue);
  }

  const match = variable.options.find((option) => option.value?.toString() === rawValue?.toString());
  return match?.label || String(rawValue);
};

const formatValue = (value: unknown, variable?: Variable): string => {
  if (Array.isArray(value)) {
    return value.map((item) => formatOptionValue(variable, item)).join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  const formatted = formatOptionValue(variable, value);
  return variable?.unit && formatted !== "" ? formatted + " " + variable.unit : formatted;
};

export default function SubmittedVariableDetails({
  values,
  formula,
  className,
}: SubmittedVariableDetailsProps) {
  const topLevelValues = getFlatFormulaValues(values);
  const repeatableValues = getRepeatableGroupValues(values);
  const variables = formula?.variables || [];

  const flatVariables = variables.filter((variable) => !isRepeatableGroupVariable(variable));
  const repeatableGroups = variables.filter(isRepeatableGroupVariable);

  const flatEntries = flatVariables.length > 0
    ? flatVariables
        .filter((variable) => hasDisplayValue(topLevelValues[variable.id]))
        .map((variable) => ({
          key: variable.id,
          label: variable.name,
          value: formatValue(topLevelValues[variable.id], variable),
        }))
    : Object.entries(topLevelValues)
        .filter(([, value]) => hasDisplayValue(value))
        .map(([key, value]) => ({
          key,
          label: formatLabel(key),
          value: formatValue(value),
        }));

  const hasRepeatableMetadata = repeatableGroups.length > 0;
  const fallbackRepeatableEntries = !hasRepeatableMetadata
    ? Object.entries(repeatableValues)
    : [];

  return (
    <div className={className || "space-y-3"}>
      {flatEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {flatEntries.map((entry) => (
            <div key={entry.key} className="flex justify-between gap-3 rounded bg-gray-50 dark:bg-gray-700/50 p-2 text-xs">
              <span className="text-gray-600 dark:text-gray-300 font-medium">{entry.label}:</span>
              <span className="text-right text-gray-800 dark:text-gray-100 font-medium break-words">{entry.value}</span>
            </div>
          ))}
        </div>
      )}

      {repeatableGroups.map((group) => {
        const instances = repeatableValues[group.id] || [];
        const childVariables = group.repeatableConfig?.childVariables || [];
        const evaluation = evaluateRepeatableGroup(group, variables, topLevelValues, instances);
        const itemCount = Math.max(instances.length, evaluation.count);

        if (itemCount === 0) {
          return null;
        }

        return (
          <div key={group.id} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">{group.name}</div>
                <div className="text-xs text-gray-600">{itemCount} item{itemCount === 1 ? "" : "s"} entered</div>
              </div>
              <div className="text-sm font-semibold text-emerald-700">
                Total: ${evaluation.total.toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              {Array.from({ length: itemCount }, (_, index) => {
                const instanceValues = instances[index] || {};
                const childEntries = childVariables
                  .filter((childVariable) => {
                    const shouldShow = !childVariable.conditionalLogic?.enabled
                      || evaluateConditionalLogic(childVariable, instanceValues, childVariables);
                    return shouldShow && hasDisplayValue(instanceValues[childVariable.id]);
                  })
                  .map((childVariable) => ({
                    key: childVariable.id,
                    label: childVariable.name,
                    value: formatValue(instanceValues[childVariable.id], childVariable as Variable),
                  }));

                return (
                  <div key={group.id + "-" + index} className="rounded-md border border-white bg-white p-3 shadow-sm space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-gray-700">
                        {getRepeatableGroupLabel(group, index)}
                      </div>
                      <div className="text-xs font-semibold text-emerald-700">
                        Total: ${(evaluation.perInstanceTotals[index] || 0).toLocaleString()}
                      </div>
                    </div>

                    {childEntries.length > 0 && (
                      <div className="grid grid-cols-1 gap-2">
                        {childEntries.map((entry) => (
                          <div key={entry.key} className="flex justify-between gap-3 rounded bg-gray-50 p-2 text-xs">
                            <span className="text-gray-600 font-medium">{entry.label}:</span>
                            <span className="text-right text-gray-900 font-medium break-words">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {fallbackRepeatableEntries.map(([groupId, instances]) => {
        if (!Array.isArray(instances) || instances.length === 0) {
          return null;
        }

        return (
          <div key={groupId} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">{formatLabel(groupId)}</div>
              <div className="text-xs text-gray-600">{instances.length} item{instances.length === 1 ? "" : "s"} entered</div>
            </div>

            <div className="space-y-2">
              {instances.map((instance, index) => (
                <div key={groupId + "-" + index} className="rounded-md border border-white bg-white p-3 shadow-sm space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Item {index + 1}</div>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(instance || {})
                      .filter(([, value]) => hasDisplayValue(value))
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-3 rounded bg-gray-50 p-2 text-xs">
                          <span className="text-gray-600 font-medium">{formatLabel(key)}:</span>
                          <span className="text-right text-gray-900 font-medium break-words">{formatValue(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
