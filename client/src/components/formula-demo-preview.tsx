import { useState, useEffect } from "react";
import { Formula } from "@shared/schema";
import { Button } from "@/components/ui/button";
import EnhancedVariableInput from "./enhanced-variable-input";
import { Calculator } from "lucide-react";

interface FormulaDemoPreviewProps {
  formula: Formula;
}

export default function FormulaDemoPreview({ formula }: FormulaDemoPreviewProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  const handleVariableChange = (variableId: string, value: any) => {
    setValues(prev => ({
      ...prev,
      [variableId]: value
    }));
  };

  const calculatePrice = () => {
    try {
      if (!formula.formula || formula.variables.length === 0) {
        return;
      }

      let formulaExpression = formula.formula;
      
      // First, replace individual option references for multiple-choice with allowMultipleSelection
      formula.variables.forEach((variable) => {
        if (variable.type === 'multiple-choice' && variable.allowMultipleSelection && variable.options) {
          const selectedValues = Array.isArray(values[variable.id]) ? values[variable.id] : [];
          
          variable.options.forEach((option) => {
            if (option.id) {
              const optionReference = `${variable.id}_${option.id}`;
              const isSelected = selectedValues.some((val: any) => val.toString() === option.value.toString());
              const optionValue = isSelected ? (option.numericValue || 0) : 0;
              
              formulaExpression = formulaExpression.replace(
                new RegExp(`\\b${optionReference}\\b`, 'g'),
                String(optionValue)
              );
            }
          });
        }
      });
      
      // Then replace variable names with their values
      formula.variables.forEach((variable) => {
        // Skip multiple-choice with allowMultipleSelection since we already handled individual options
        if (variable.type === 'multiple-choice' && variable.allowMultipleSelection) {
          return; // Skip this variable, options already replaced
        }
        
        let value = values[variable.id];
        
        if (variable.type === 'select' && variable.options) {
          const option = variable.options.find(opt => opt.value === value);
          value = option?.multiplier || option?.numericValue || 0;
        } else if (variable.type === 'dropdown' && variable.options) {
          const option = variable.options.find(opt => opt.value === value);
          value = option?.numericValue || 0;
        } else if (variable.type === 'multiple-choice' && variable.options) {
          // For multiple-choice without allowMultipleSelection, or as fallback
          if (Array.isArray(value)) {
            value = value.reduce((total: number, selectedValue: string) => {
              const option = variable.options?.find(opt => opt.value.toString() === selectedValue);
              return total + (option?.numericValue || 0);
            }, 0);
          } else {
            value = 0;
          }
        } else if (variable.type === 'number' || variable.type === 'slider' || variable.type === 'stepper') {
          value = Number(value) || 0;
        } else if (variable.type === 'checkbox') {
          value = value ? 1 : 0;
        } else {
          value = 0;
        }
        
        formulaExpression = formulaExpression.replace(
          new RegExp(`\\b${variable.id}\\b`, 'g'),
          String(value)
        );
      });

      // Simple evaluation (in production, use a safer formula parser)
      const result = Function(`"use strict"; return (${formulaExpression})`)();
      setCalculatedPrice(Math.round(result));
    } catch (error) {
      console.error('Formula calculation error:', error);
      setCalculatedPrice(null);
    }
  };

  // Calculate price whenever values change
  useEffect(() => {
    calculatePrice();
  }, [values, formula.formula, formula.variables]);

  if (!formula.variables.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Add variables to see calculator inputs</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calculator Title */}
      {formula.title && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{formula.title}</h3>
        </div>
      )}

      {/* Variables */}
      <div className="space-y-3">
        {formula.variables.map((variable) => (
          <EnhancedVariableInput
            key={variable.id}
            variable={variable}
            value={values[variable.id]}
            onChange={(value) => handleVariableChange(variable.id, value)}
            styling={formula.styling}
          />
        ))}
      </div>

      {/* Real-time Pricing */}
      {formula.formula && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-blue-600 mb-1">Live Preview Price</p>
            {calculatedPrice !== null ? (
              <p className="text-xl font-bold text-blue-700">
                ${calculatedPrice.toLocaleString()}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Fill in values to see pricing
              </p>
            )}
          </div>
        </div>
      )}

      {/* Formula Display */}
      {formula.formula && (
        <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <p className="text-gray-600 mb-1">Formula:</p>
          <code className="text-gray-800 font-mono">{formula.formula}</code>
        </div>
      )}
    </div>
  );
}
