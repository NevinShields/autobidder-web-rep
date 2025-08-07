import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import type { Formula, DesignSettings } from "@shared/schema";

interface StyledCalculatorProps {
  formula?: Formula;
}

export default function StyledCalculator(props: any = {}) {
  const { formula: propFormula } = props;
  const [values, setValues] = useState<Record<string, any>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch design settings from new API
  const { data: designSettings, isLoading: isLoadingDesign } = useQuery<DesignSettings>({
    queryKey: ['/api/design-settings'],
  });

  // Fetch formulas if no formula is provided (for standalone page usage)
  const { data: formulas, isLoading: isLoadingFormulas } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
    enabled: !propFormula, // Only fetch if no formula prop provided
  });

  // Use provided formula or first available formula
  const formula = propFormula || (formulas && formulas.length > 0 ? formulas[0] : null);

  if (isLoadingDesign || isLoadingFormulas) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!formula) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">No Calculator Available</h2>
        <p className="text-gray-600">You need to create a calculator first to preview it here.</p>
        <Button className="mt-4" onClick={() => window.location.href = '/formulas'}>
          Create Calculator
        </Button>
      </div>
    );
  }

  const handleValueChange = (variableId: string, value: any) => {
    setValues(prev => ({ ...prev, [variableId]: value }));
  };

  const calculatePrice = () => {
    try {
      let formulaExpression = formula.formula;
      
      formula.variables.forEach((variable) => {
        let value = values[variable.id];
        
        if (variable.type === 'select' && variable.options) {
          const option = variable.options.find(opt => opt.value === value);
          value = option?.multiplier || option?.numericValue || 0;
        } else if (variable.type === 'dropdown' && variable.options) {
          const option = variable.options.find(opt => opt.value === value);
          value = option?.numericValue || 0;
        } else if (variable.type === 'multiple-choice' && variable.options) {
          // Handle multiple selection - sum all selected numeric values
          if (Array.isArray(value)) {
            value = value.reduce((total: number, selectedValue: string) => {
              const option = variable.options?.find(opt => opt.value.toString() === selectedValue);
              return total + (option?.numericValue || 0);
            }, 0);
          } else {
            value = 0;
          }
        } else if (variable.type === 'number') {
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
      
      const result = Function(`"use strict"; return (${formulaExpression})`)();
      setCalculatedPrice(Math.round(result));
    } catch (error) {
      console.error('Formula calculation error:', error);
      toast({
        title: "Calculation error",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      });
    }
  };

  // Get styling from design settings
  const styling = designSettings?.styling || {};
  const componentStyles = designSettings?.componentStyles || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div 
        className="max-w-md w-full mx-auto"
        style={{
          backgroundColor: styling.backgroundColor || '#FFFFFF',
          borderRadius: `${styling.containerBorderRadius || 16}px`,
          padding: '24px',
          boxShadow: styling.containerShadow === 'xl' 
            ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: styling.primaryColor || '#2563EB' }}
          >
            {formula.title}
          </h1>
          {formula.description && (
            <p className="text-gray-600 mb-6">
              {formula.description}
            </p>
          )}
        </div>

        {/* Form with conditional logic */}
        <div className="space-y-6">
          {formula.variables.map((variable) => (
            <EnhancedVariableInput
              key={variable.id}
              variable={variable}
              value={values[variable.id]}
              onChange={(value) => handleValueChange(variable.id, value)}
              styling={styling}
              componentStyles={componentStyles}
              allVariables={formula.variables}
              currentValues={values}
            />
          ))}
        </div>

        {/* Calculate Button */}
        <div className="mt-8">
          <Button
            onClick={calculatePrice}
            className="w-full"
            style={{
              backgroundColor: styling.primaryColor || '#2563EB',
              borderRadius: `${styling.buttonBorderRadius || 12}px`,
              padding: '16px 24px',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            Calculate Price
          </Button>
        </div>

        {/* Result Display */}
        {calculatedPrice !== null && (
          <div 
            className="mt-6 p-6 text-center rounded-lg"
            style={{
              backgroundColor: styling.resultBackgroundColor || '#F3F4F6',
              borderRadius: `${styling.containerBorderRadius || 12}px`,
            }}
          >
            <h3 
              className="text-3xl font-bold"
              style={{ color: styling.primaryColor || '#2563EB' }}
            >
              ${calculatedPrice.toLocaleString()}
            </h3>
            <p className="text-gray-600 mt-1">Estimated Price</p>
          </div>
        )}
      </div>
    </div>
  );
}