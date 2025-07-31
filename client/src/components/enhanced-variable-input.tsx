import { Variable } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { evaluateConditionalLogic } from "@shared/conditional-logic";

interface EnhancedVariableInputProps {
  variable: Variable;
  value: any;
  onChange: (value: any) => void;
  styling: any;
  allVariables?: Variable[];
  currentValues?: Record<string, any>;
}

export default function EnhancedVariableInput({ 
  variable, 
  value, 
  onChange, 
  styling,
  allVariables = [],
  currentValues = {}
}: EnhancedVariableInputProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (variable.type === 'multiple-choice') {
      if (Array.isArray(value)) {
        setSelectedOptions(value);
      } else if (value) {
        // Handle case where value is not an array but should be
        setSelectedOptions([value.toString()]);
      } else {
        // Initialize empty array for multiple choice
        setSelectedOptions([]);
      }
    }
  }, [value, variable.type]);

  const handleMultipleChoiceChange = (optionValue: string, checked: boolean) => {
    let newSelection: string[];
    if (variable.allowMultipleSelection) {
      if (checked) {
        newSelection = [...selectedOptions, optionValue];
      } else {
        newSelection = selectedOptions.filter(v => v !== optionValue);
      }
    } else {
      newSelection = checked ? [optionValue] : [];
    }
    
    setSelectedOptions(newSelection);
    onChange(newSelection);
  };

  const getNumericValue = (optionValues: string | string[]): number => {
    if (!variable.options) return 0;
    
    const values = Array.isArray(optionValues) ? optionValues : [optionValues];
    return values.reduce((total, val) => {
      const option = variable.options?.find(opt => opt.value === val || opt.label === val);
      return total + (option?.numericValue || 0);
    }, 0);
  };

  // Apply styling with shadow support
  const getShadowValue = (shadowSize: string) => {
    switch (shadowSize) {
      case 'sm': return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      case 'md': return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      case 'lg': return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      case 'xl': return '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      default: return 'none';
    }
  };

  const getWidthValue = (width: string) => {
    switch (width) {
      case 'sm': return '200px';
      case 'md': return '300px';
      case 'lg': return '400px';
      case 'xl': return '500px';
      case 'full': return '100%';
      default: return '100%';
    }
  };

  const getFontSize = (size: string) => {
    switch (size) {
      case 'xs': return '0.75rem';
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      case 'xl': return '1.25rem';
      default: return '1rem'; // base
    }
  };

  const inputStyle = {
    backgroundColor: styling?.inputBackgroundColor || '#FFFFFF',
    borderRadius: `${styling?.inputBorderRadius || 4}px`,
    borderWidth: `${styling?.inputBorderWidth || 1}px`,
    borderColor: styling?.inputBorderColor || '#D1D5DB',
    padding: styling?.inputPadding === 'sm' ? '0.375rem' : 
             styling?.inputPadding === 'lg' ? '0.75rem' : '0.5rem',
    boxShadow: getShadowValue(styling?.inputShadow || 'none'),
    fontSize: getFontSize(styling?.inputFontSize || 'base'),
    color: styling?.inputTextColor || '#374151',
    height: `${styling?.inputHeight || 40}px`,
    width: getWidthValue(styling?.inputWidth || 'full')
  };

  // Question card container styling
  const getPadding = (padding: string) => {
    switch (padding) {
      case 'sm': return '0.75rem';
      case 'md': return '1rem';
      case 'lg': return '1.5rem';
      case 'xl': return '2rem';
      default: return '1.5rem';
    }
  };

  const questionCardStyle = {
    backgroundColor: styling?.questionCardBackgroundColor || '#FFFFFF',
    borderRadius: `${styling?.questionCardBorderRadius || 12}px`,
    borderWidth: `${styling?.questionCardBorderWidth || 1}px`,
    borderColor: styling?.questionCardBorderColor || '#E5E7EB',
    borderStyle: 'solid',
    boxShadow: getShadowValue(styling?.questionCardShadow || 'sm'),
    padding: getPadding(styling?.questionCardPadding || 'lg'),
    marginBottom: '1rem'
  };

  // Check if this variable should be shown based on conditional logic
  const shouldShow = !variable.conditionalLogic?.enabled || 
    evaluateConditionalLogic(variable, currentValues, allVariables);

  // If the variable should not be shown, return null
  if (!shouldShow) {
    return null;
  }

  switch (variable.type) {
    case 'number':
      return (
        <div style={questionCardStyle}>
          <div className="space-y-2">
            <Label htmlFor={variable.id}>{variable.name}</Label>
            <div className="relative">
              <Input
                id={variable.id}
                type="number"
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                style={inputStyle}
                className="pr-12"
              />
              {variable.unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {variable.unit}
                </span>
              )}
            </div>
          </div>
        </div>
      );

    case 'text':
      return (
        <div style={questionCardStyle}>
          <div className="space-y-2">
            <Label htmlFor={variable.id}>{variable.name}</Label>
            <Input
              id={variable.id}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div style={questionCardStyle}>
          <div className="flex items-center space-x-3 py-1">
            <Checkbox
              id={variable.id}
              checked={value || false}
              onCheckedChange={(checked) => onChange(checked === true)}
              className="flex-shrink-0"
            />
            <Label htmlFor={variable.id} className="flex-1 leading-normal">
              {variable.name}
            </Label>
          </div>
        </div>
      );

    case 'slider':
      const sliderValue = Array.isArray(value) ? value : [value || variable.min || 0];
      return (
        <div style={questionCardStyle}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={variable.id}>{variable.name}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {sliderValue[0]}
                </span>
                {variable.unit && (
                  <span className="text-sm text-gray-500">{variable.unit}</span>
                )}
              </div>
            </div>
            <Slider
              id={variable.id}
              value={sliderValue}
              onValueChange={(newValue) => onChange(newValue[0])}
              min={variable.min || 0}
              max={variable.max || 100}
              step={variable.step || 1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{variable.min || 0}{variable.unit && ` ${variable.unit}`}</span>
              <span>{variable.max || 100}{variable.unit && ` ${variable.unit}`}</span>
            </div>
          </div>
        </div>
      );

    case 'dropdown':
      return (
        <div style={questionCardStyle}>
          <div className="space-y-2">
            <Label htmlFor={variable.id}>{variable.name}</Label>
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger style={inputStyle} className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {variable.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'multiple-choice':
      const getImageSize = (size: string) => {
        switch (size) {
          case 'sm': return 'w-8 h-8';
          case 'md': return 'w-12 h-12';
          case 'lg': return 'w-24 h-24'; // 50% larger for better visibility
          case 'xl': return 'w-32 h-32'; // Even larger for xl
          default: return 'w-12 h-12';
        }
      };

      const multiChoiceCardStyle = {
        borderRadius: `${styling?.multiChoiceCardBorderRadius || 8}px`,
        boxShadow: getShadowValue(styling?.multiChoiceCardShadow || 'none')
      };

      const multiChoiceImageStyle = {
        borderRadius: `${styling?.multiChoiceImageBorderRadius || 8}px`,
        boxShadow: getShadowValue(styling?.multiChoiceImageShadow || 'sm')
      };

      const layoutClass = styling?.multiChoiceLayout === 'grid' 
        ? 'grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        : 'space-y-3';

      return (
        <div style={questionCardStyle}>
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: styling?.textColor }}>
              {variable.name}
            </Label>
          {variable.allowMultipleSelection && (
            <p className="text-xs text-gray-500">Multiple selections allowed</p>
          )}
          
          <div className={layoutClass}>
            {variable.options?.map((option) => {
              const isSelected = selectedOptions.includes(option.value.toString());
              return (
                <div
                  key={option.value}
                  className={`border-2 cursor-pointer transition-all rounded-lg hover:shadow-sm ${
                    styling?.multiChoiceLayout === 'grid' ? 'p-2 text-center' : 'p-3'
                  }`}
                  style={{
                    ...multiChoiceCardStyle,
                    borderColor: isSelected 
                      ? (styling?.multiChoiceSelectedColor || '#3B82F6')
                      : (styling?.inputBorderColor || '#D1D5DB'),
                    backgroundColor: isSelected 
                      ? (styling?.multiChoiceSelectedBgColor || '#EBF8FF')
                      : styling?.backgroundColor || 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = styling?.multiChoiceHoverBgColor || '#F7FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = styling?.backgroundColor || 'transparent';
                    }
                  }}
                  onClick={() => handleMultipleChoiceChange(
                    option.value.toString(),
                    !selectedOptions.includes(option.value.toString())
                  )}
                >
                  <div className={`flex items-center justify-center text-center flex-col ${
                    styling?.multiChoiceLayout === 'grid' ? 'space-y-1' : 'space-y-2'
                  }`}>
                    {option.image ? (
                      <img 
                        src={option.image} 
                        alt={option.label}
                        className={`${getImageSize(styling?.multiChoiceImageSize || 'md')} object-cover mx-auto`}
                        style={multiChoiceImageStyle}
                      />
                    ) : (
                      <div 
                        className={`${getImageSize(styling?.multiChoiceImageSize || 'md')} flex items-center justify-center mx-auto rounded-lg`}
                        style={{
                          fontSize: styling?.multiChoiceImageSize === 'sm' ? '1rem' :
                                   styling?.multiChoiceImageSize === 'md' ? '1.5rem' : 
                                   styling?.multiChoiceImageSize === 'lg' ? '3rem' : 
                                   styling?.multiChoiceImageSize === 'xl' ? '4rem' : '1.5rem',
                          backgroundColor: isSelected 
                            ? (styling?.multiChoiceSelectedColor || '#3B82F6')
                            : '#F3F4F6',
                          color: isSelected ? 'white' : '#6B7280'
                        }}
                      >
                        {option.label.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div 
                        className={`font-medium ${
                          styling?.multiChoiceLayout === 'grid' ? 'text-xs' : 'text-sm'
                        }`}
                        style={{ 
                          color: isSelected 
                            ? (styling?.multiChoiceSelectedColor || '#3B82F6')
                            : (styling?.textColor || '#1F2937')
                        }}
                      >
                        {option.label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      );

    case 'select': // Legacy support
      return (
        <div style={questionCardStyle}>
          <div className="space-y-2">
            <Label htmlFor={variable.id}>{variable.name}</Label>
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger style={inputStyle} className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {variable.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    default:
      return (
        <div style={questionCardStyle}>
          <div className="space-y-2">
            <Label>{variable.name}</Label>
            <div className="text-sm text-gray-500">
              Unsupported variable type: {variable.type}
            </div>
          </div>
        </div>
      );
  }
}