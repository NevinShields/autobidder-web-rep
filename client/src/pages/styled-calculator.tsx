import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Formula, DesignSettings } from "@shared/schema";

interface StyledCalculatorProps {
  formula?: Formula;
}

export default function StyledCalculator(props: any = {}) {
  const { formula: propFormula } = props;
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string | null>(null);

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

  // Get styling and component styles from design settings
  const styling = designSettings?.styling || {};
  const componentStyles = designSettings?.componentStyles || {};

  // Helper function to get component style with proper shadow mapping
  const getComponentStyle = (componentType: keyof typeof componentStyles) => {
    const style = componentStyles[componentType];
    if (!style) return {};

    // Map shadow values
    const shadowMap: Record<string, string> = {
      'none': '0 0 #0000',
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    };

    return {
      borderColor: style.borderColor,
      borderWidth: `${style.borderWidth}px`,
      backgroundColor: style.backgroundColor,
      borderRadius: `${style.borderRadius}px`,
      padding: `${style.padding}px`,
      margin: `${style.margin}px`,
      height: `${style.height}px`,
      width: style.width === 'full' ? '100%' : style.width,
      boxShadow: shadowMap[style.shadow as string] || shadowMap.sm,
    };
  };

  // Handle form input changes
  const handleInputChange = (variableId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [variableId]: value
    }));
  };

  // Calculate result
  const calculateResult = () => {
    try {
      // Simple calculation logic - this would be replaced with your actual formula logic
      let calculatedValue = 0;
      
      formula.variables.forEach(variable => {
        const value = formData[variable.id];
        if (variable.type === 'number' && typeof value === 'number') {
          calculatedValue += value * 10; // Simple multiplier
        }
      });

      setResult(`$${calculatedValue.toFixed(2)}`);
    } catch (error) {
      console.error('Calculation error:', error);
      setResult('Error calculating price');
    }
  };

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

  return (
    <div 
      className="max-w-2xl mx-auto"
      style={{
        width: `${styling.containerWidth || 700}px`,
        backgroundColor: styling.backgroundColor || '#FFFFFF',
        borderRadius: `${styling.containerBorderRadius || 16}px`,
        padding: '24px',
        boxShadow: styling.containerShadow === 'xl' 
          ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
          : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        color: styling.textColor || '#1F2937',
        fontFamily: styling.fontFamily === 'inter' ? 'Inter, sans-serif' : 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 
          className="text-3xl font-bold mb-2"
          style={{ 
            color: styling.primaryColor || '#2563EB',
            fontWeight: styling.fontWeight === 'bold' ? '700' : '600'
          }}
        >
          {formula.title}
        </h1>
        {formula.description && (
          <p className="text-lg text-gray-600">
            {formula.description}
          </p>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {formula.variables.map((variable) => {
          if (variable.type === 'number' || variable.type === 'text') {
            const inputStyle = getComponentStyle('textInput');
            return (
              <div key={variable.id} className="space-y-2">
                <Label 
                  htmlFor={variable.id}
                  style={{ 
                    color: styling.textColor || '#1F2937',
                    fontSize: styling.fontSize === 'lg' ? '18px' : '16px'
                  }}
                >
                  {variable.name}
                </Label>
                <Input
                  id={variable.id}
                  type={variable.type === 'number' ? 'number' : 'text'}
                  placeholder={variable.placeholder}
                  value={formData[variable.id] || ''}
                  onChange={(e) => handleInputChange(
                    variable.id, 
                    variable.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                  )}
                  style={{
                    ...inputStyle,
                    borderStyle: 'solid',
                  }}
                />
              </div>
            );
          }

          if (variable.type === 'select') {
            const dropdownStyle = getComponentStyle('dropdown');
            return (
              <div key={variable.id} className="space-y-2">
                <Label 
                  htmlFor={variable.id}
                  style={{ 
                    color: styling.textColor || '#1F2937',
                    fontSize: styling.fontSize === 'lg' ? '18px' : '16px'
                  }}
                >
                  {variable.name}
                </Label>
                <Select
                  value={formData[variable.id] || ''}
                  onValueChange={(value) => handleInputChange(variable.id, value)}
                >
                  <SelectTrigger
                    style={{
                      ...dropdownStyle,
                      borderStyle: 'solid',
                    }}
                  >
                    <SelectValue placeholder={`Select ${variable.name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {variable.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (variable.type === 'multiple_choice') {
            const multiChoiceStyle = getComponentStyle('multipleChoice');
            return (
              <div key={variable.id} className="space-y-3">
                <Label 
                  style={{ 
                    color: styling.textColor || '#1F2937',
                    fontSize: styling.fontSize === 'lg' ? '18px' : '16px'
                  }}
                >
                  {variable.name}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {variable.options?.map((option) => {
                    const isSelected = formData[variable.id] === option.value;
                    return (
                      <div
                        key={option.value}
                        className="cursor-pointer transition-all duration-200"
                        style={{
                          ...multiChoiceStyle,
                          borderStyle: 'solid',
                          backgroundColor: isSelected 
                            ? (multiChoiceStyle.activeBackgroundColor || styling.multiChoiceSelectedBgColor || '#EFF6FF')
                            : multiChoiceStyle.backgroundColor,
                          borderColor: isSelected 
                            ? (multiChoiceStyle.activeBorderColor || styling.multiChoiceSelectedColor || '#2563EB')
                            : multiChoiceStyle.borderColor,
                        }}
                        onClick={() => handleInputChange(variable.id, option.value)}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-4 h-4 rounded-full border-2 ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}
                          />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            {option.description && (
                              <div className="text-sm text-gray-500">{option.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Calculate Button */}
      <div className="mt-8">
        <Button
          onClick={calculateResult}
          className="w-full"
          style={{
            backgroundColor: styling.primaryColor || '#2563EB',
            borderRadius: `${styling.buttonBorderRadius || 12}px`,
            padding: styling.buttonPadding === 'lg' ? '16px 24px' : '12px 20px',
            fontSize: styling.fontSize === 'lg' ? '18px' : '16px',
            fontWeight: styling.buttonFontWeight === 'bold' ? '700' : '600',
          }}
        >
          Calculate Price
        </Button>
      </div>

      {/* Result Display */}
      {result && (
        <div 
          className="mt-6 text-center"
          style={{
            ...getComponentStyle('pricingCard'),
            borderStyle: 'solid',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h3 
            className="text-2xl font-bold"
            style={{ color: styling.primaryColor || '#2563EB' }}
          >
            {result}
          </h3>
          <p className="text-gray-600 mt-1">Estimated Price</p>
        </div>
      )}
    </div>
  );
}