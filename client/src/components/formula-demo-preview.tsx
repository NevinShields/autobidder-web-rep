import { useEffect, useState } from "react";
import { Formula, Variable } from "@shared/schema";
import {
  evaluateFormulaWithRepeatableGroups,
  FormulaValueMap,
  getFlatFormulaValues,
  getHiddenConditionalCalculationIssues,
  getRepeatableGroupCount,
  getRepeatableGroupLabel,
  getRepeatableGroupValues,
  isRepeatableGroupVariable,
  REPEATABLE_GROUP_VALUES_KEY,
} from "@shared/formula-runtime";
import { evaluateConditionalLogic } from "@shared/conditional-logic";
import EnhancedVariableInput from "./enhanced-variable-input";
import { Calculator } from "lucide-react";

interface FormulaDemoPreviewProps {
  formula: Formula;
}

export default function FormulaDemoPreview({ formula }: FormulaDemoPreviewProps) {
  const [values, setValues] = useState<FormulaValueMap>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  const topLevelValues = getFlatFormulaValues(values);
  const repeatableValues = getRepeatableGroupValues(values);
  const hasAnyInput = Object.keys(topLevelValues).length > 0 || Object.keys(repeatableValues).length > 0;
  const hiddenCalculationIssues = hasAnyInput
    ? getHiddenConditionalCalculationIssues(formula.formula || "", formula.variables, values)
    : [];

  const handleVariableChange = (variableId: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [variableId]: value,
    }));
  };

  const handleRepeatableVariableChange = (
    groupId: string,
    instanceIndex: number,
    childVariableId: string,
    value: any,
  ) => {
    setValues((prev) => {
      const nextGroups = {
        ...getRepeatableGroupValues(prev),
      };
      const nextInstances = [...(nextGroups[groupId] || [])];
      nextInstances[instanceIndex] = {
        ...(nextInstances[instanceIndex] || {}),
        [childVariableId]: value,
      };
      nextGroups[groupId] = nextInstances;

      return {
        ...prev,
        [REPEATABLE_GROUP_VALUES_KEY]: nextGroups,
      };
    });
  };

  useEffect(() => {
    try {
      if (!formula.formula || formula.variables.length === 0) {
        setCalculatedPrice(null);
        return;
      }

      const result = evaluateFormulaWithRepeatableGroups(formula.formula, formula.variables, values);
      setCalculatedPrice(Math.round(result));
    } catch (error) {
      console.error("Formula calculation error:", error);
      setCalculatedPrice(null);
    }
  }, [formula.formula, formula.variables, values]);

  const renderRepeatableGroup = (group: Variable) => {
    const shouldShow = !group.conditionalLogic?.enabled || evaluateConditionalLogic(group, topLevelValues, formula.variables);
    if (!shouldShow) {
      return null;
    }

    const childVariables = group.repeatableConfig?.childVariables || [];
    const count = getRepeatableGroupCount(group, formula.variables, topLevelValues);
    const groupInstances = repeatableValues[group.id] || [];

    return (
      <div key={group.id} className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <div>
          <p className="font-medium text-gray-900">{group.name}</p>
          {group.tooltip && <p className="text-sm text-gray-600">{group.tooltip}</p>}
        </div>

        {count > 0 ? (
          Array.from({ length: count }, (_, index) => {
            const instanceValues = groupInstances[index] || {};
            return (
              <div key={`${group.id}-${index}`} className="space-y-3 rounded-lg border border-white bg-white p-3 shadow-sm">
                <p className="text-sm font-medium text-gray-700">{getRepeatableGroupLabel(group, index)}</p>
                {childVariables.map((childVariable) => (
                  <EnhancedVariableInput
                    key={`${group.id}-${index}-${childVariable.id}`}
                    variable={childVariable}
                    value={instanceValues[childVariable.id]}
                    onChange={(value) => handleRepeatableVariableChange(group.id, index, childVariable.id, value)}
                    styling={formula.styling}
                    allVariables={childVariables}
                    currentValues={instanceValues}
                  />
                ))}
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-amber-300 bg-white/80 px-4 py-3 text-sm text-amber-900">
            Set the count question first to preview repeated items here.
          </div>
        )}
      </div>
    );
  };

  if (!formula.variables.length) {
    return (
      <div className="py-6 text-center text-gray-500">
        <Calculator className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm">Add variables to see calculator inputs</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {formula.title && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{formula.title}</h3>
        </div>
      )}

      <div className="space-y-3">
        {formula.variables.map((variable) => {
          if (isRepeatableGroupVariable(variable)) {
            return renderRepeatableGroup(variable);
          }

          return (
            <EnhancedVariableInput
              key={variable.id}
              variable={variable}
              value={topLevelValues[variable.id]}
              onChange={(value) => handleVariableChange(variable.id, value)}
              styling={formula.styling}
              allVariables={formula.variables}
              currentValues={topLevelValues}
            />
          );
        })}
      </div>

      {hiddenCalculationIssues.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Formula warning</p>
          <p className="mt-1">
            One or more hidden conditional questions are resolving to `0` while still being used as multipliers in the
            formula. That can zero out pricing even though nothing technically crashed.
          </p>
          <div className="mt-3 space-y-1">
            {hiddenCalculationIssues.map((issue) => (
              <p key={issue.variableId}>{issue.message}</p>
            ))}
          </div>
          <p className="mt-3 text-amber-900/80">
            Fix this by giving hidden multiplier questions a neutral default such as `1`, or by restructuring the
            formula so optional sections are added separately instead of multiplied together.
          </p>
        </div>
      )}

      {formula.formula && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-center">
            <p className="mb-1 text-xs text-blue-600">Live Preview Price</p>
            {calculatedPrice !== null ? (
              <p className="text-xl font-bold text-blue-700">${calculatedPrice.toLocaleString()}</p>
            ) : (
              <p className="text-sm text-gray-500">Fill in values to see pricing</p>
            )}
          </div>
        </div>
      )}

      {formula.formula && (
        <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs">
          <p className="mb-1 text-gray-600">Formula:</p>
          <code className="font-mono text-gray-800">{formula.formula}</code>
        </div>
      )}
    </div>
  );
}
