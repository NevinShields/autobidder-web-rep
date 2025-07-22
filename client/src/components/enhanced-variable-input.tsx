import { Variable } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface EnhancedVariableInputProps {
  variable: Variable;
  value: any;
  onChange: (value: any) => void;
  styling: any;
}

export default function EnhancedVariableInput({ 
  variable, 
  value, 
  onChange, 
  styling 
}: EnhancedVariableInputProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (variable.type === 'multiple-choice' && Array.isArray(value)) {
      setSelectedOptions(value);
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

  const inputStyle = {
    backgroundColor: styling?.inputBackgroundColor || '#FFFFFF',
    borderRadius: `${styling?.inputBorderRadius || 4}px`,
    borderWidth: `${styling?.inputBorderWidth || 1}px`,
    borderColor: styling?.inputBorderColor || '#D1D5DB',
    padding: styling?.inputPadding === 'sm' ? '0.375rem' : 
             styling?.inputPadding === 'lg' ? '0.75rem' : '0.5rem',
    boxShadow: getShadowValue(styling?.inputShadow || 'none')
  };

  switch (variable.type) {
    case 'number':
      return (
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
      );

    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={variable.id}>{variable.name}</Label>
          <Input
            id={variable.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
          />
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={variable.id}
            checked={value || false}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          <Label htmlFor={variable.id}>{variable.name}</Label>
        </div>
      );

    case 'dropdown':
      return (
        <div className="space-y-2">
          <Label htmlFor={variable.id}>{variable.name}</Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger style={inputStyle}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.numericValue !== undefined && (
                      <span className="ml-2 text-sm text-gray-500">
                        +{option.numericValue}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'multiple-choice':
      const getImageSize = (size: string) => {
        switch (size) {
          case 'sm': return 'w-8 h-8';
          case 'md': return 'w-12 h-12';
          case 'lg': return 'w-16 h-16';
          case 'xl': return 'w-20 h-20';
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

      return (
        <div className="space-y-2">
          <Label>{variable.name}</Label>
          {variable.allowMultipleSelection && (
            <p className="text-xs text-gray-500">Multiple selections allowed</p>
          )}
          
          <div className={`grid gap-3 ${variable.options && variable.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {variable.options?.map((option) => {
              const isSelected = selectedOptions.includes(option.value.toString());
              return (
                <div
                  key={option.value}
                  className="border-2 p-3 cursor-pointer transition-all"
                  style={{
                    ...multiChoiceCardStyle,
                    borderColor: isSelected 
                      ? (styling?.multiChoiceSelectedColor || '#3B82F6')
                      : '#D1D5DB',
                    backgroundColor: isSelected 
                      ? (styling?.multiChoiceSelectedBgColor || '#EBF8FF')
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = styling?.multiChoiceHoverBgColor || '#F7FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={() => handleMultipleChoiceChange(
                    option.value.toString(),
                    !selectedOptions.includes(option.value.toString())
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedOptions.includes(option.value.toString())}
                      onCheckedChange={(checked) => handleMultipleChoiceChange(
                        option.value.toString(),
                        checked === true
                      )}
                    />
                    
                    {option.image && (
                      <img 
                        src={option.image} 
                        alt={option.label}
                        className={`${getImageSize(styling?.multiChoiceImageSize || 'md')} object-cover border`}
                        style={multiChoiceImageStyle}
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.numericValue !== undefined && (
                        <div className="text-sm text-gray-500">
                          Value: {option.numericValue}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'select': // Legacy support
      return (
        <div className="space-y-2">
          <Label htmlFor={variable.id}>{variable.name}</Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger style={inputStyle}>
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
      );

    default:
      return (
        <div className="space-y-2">
          <Label>{variable.name}</Label>
          <div className="text-sm text-gray-500">
            Unsupported variable type: {variable.type}
          </div>
        </div>
      );
  }
}