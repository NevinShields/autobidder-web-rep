import { Variable } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { evaluateConditionalLogic } from "@shared/conditional-logic";

interface EnhancedVariableInputProps {
  variable: Variable;
  value: any;
  onChange: (value: any) => void;
  styling: any;
  componentStyles?: any;
  allVariables?: Variable[];
  currentValues?: Record<string, any>;
}

function VariableLabelWithTooltip({ variable, style }: { variable: Variable; style?: React.CSSProperties }) {
  if (!variable.tooltip) {
    return <Label htmlFor={variable.id} style={style}>{variable.name}</Label>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={variable.id} style={style}>{variable.name}</Label>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              type="button" 
              className="inline-flex items-center justify-center"
              data-testid={`tooltip-trigger-${variable.id}`}
            >
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="max-w-xs text-sm"
            data-testid={`tooltip-content-${variable.id}`}
          >
            <p>{variable.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default function EnhancedVariableInput({ 
  variable, 
  value, 
  onChange, 
  styling,
  componentStyles,
  allVariables = [],
  currentValues = {}
}: EnhancedVariableInputProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (variable.type === 'multiple-choice') {
      if (Array.isArray(value)) {
        // Convert values to unique IDs for internal tracking
        const uniqueIds = value.map((val, index) => {
          // Find the option index that matches this value
          const optionIndex = variable.options?.findIndex(opt => opt.value.toString() === val.toString()) ?? index;
          return `${val}_${optionIndex}`;
        });
        setSelectedOptions(uniqueIds);
      } else if (value) {
        // Handle case where value is not an array but should be
        const optionIndex = variable.options?.findIndex(opt => opt.value.toString() === value.toString()) ?? 0;
        setSelectedOptions([`${value}_${optionIndex}`]);
      } else {
        // Initialize empty array for multiple choice
        setSelectedOptions([]);
      }
    }
  }, [value, variable.type, variable.options]);

  const handleMultipleChoiceChange = (optionValue: string, optionIndex: number, checked: boolean) => {
    // Create unique identifier combining value and index to handle duplicate values
    const uniqueId = `${optionValue}_${optionIndex}`;
    
    let newSelection: string[];
    if (variable.allowMultipleSelection) {
      if (checked) {
        newSelection = [...selectedOptions, uniqueId];
      } else {
        newSelection = selectedOptions.filter(v => v !== uniqueId);
      }
    } else {
      newSelection = checked ? [uniqueId] : [];
    }
    
    setSelectedOptions(newSelection);
    
    // Convert back to original values for onChange (remove the index suffix)
    const originalValues = newSelection.map(id => id.replace(/_\d+$/, ''));
    onChange(originalValues);
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

  // Helper function to get font size
  const getFontSizeValue = (fontSize: string): string => {
    switch (fontSize) {
      case 'xs': return '0.75rem';
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      case 'xl': return '1.25rem';
      case 'base':
      default: return '1rem';
    }
  };

  // Helper function to get complete input styles
  const getInputStyles = () => ({
    backgroundColor: componentStyles?.textInput?.backgroundColor || '#FFFFFF',
    borderRadius: `${componentStyles?.textInput?.borderRadius || 8}px`,
    borderWidth: `${componentStyles?.textInput?.borderWidth || 1}px`,
    borderColor: componentStyles?.textInput?.borderColor || '#E5E7EB',
    borderStyle: 'solid' as const,
    padding: `${componentStyles?.textInput?.padding || 12}px`,
    boxShadow: getShadowValue(componentStyles?.textInput?.shadow || 'sm'),
    fontSize: getFontSizeValue(componentStyles?.textInput?.fontSize || 'base'),
    color: componentStyles?.textInput?.textColor || '#374151',
    height: `${componentStyles?.textInput?.height || 40}px`,
  });

  // Helper function to get complete dropdown styles
  const getDropdownStyles = () => ({
    backgroundColor: componentStyles?.dropdown?.backgroundColor || '#FFFFFF',
    borderRadius: `${componentStyles?.dropdown?.borderRadius || 8}px`,
    borderWidth: `${componentStyles?.dropdown?.borderWidth || 1}px`,
    borderColor: componentStyles?.dropdown?.borderColor || '#E5E7EB',
    borderStyle: 'solid' as const,
    padding: `${componentStyles?.dropdown?.padding || 12}px`,
    boxShadow: getShadowValue(componentStyles?.dropdown?.shadow || 'sm'),
    fontSize: getFontSizeValue(componentStyles?.dropdown?.fontSize || 'base'),
    color: componentStyles?.dropdown?.textColor || '#374151',
    height: `${componentStyles?.dropdown?.height || 40}px`,
  });

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

  // Helper function to get input styles with priority to component styles
  const getInputStyle = () => {
    const textInputStyles = componentStyles?.textInput;
    const dropdownStyles = componentStyles?.dropdown;
    
    if (variable.type === 'dropdown' && dropdownStyles) {
      return {
        backgroundColor: dropdownStyles.backgroundColor || '#FFFFFF',
        borderRadius: `${dropdownStyles.borderRadius || 8}px`,
        borderWidth: `${dropdownStyles.borderWidth || 1}px`,
        borderColor: dropdownStyles.borderColor || '#E5E7EB',
        padding: `${dropdownStyles.padding || 12}px`,
        boxShadow: getShadowValue(dropdownStyles.shadow || 'sm'),
        fontSize: getFontSize(dropdownStyles.fontSize || 'base'),
        color: dropdownStyles.textColor || '#374151',
        height: `${dropdownStyles.height || 40}px`,
        width: getWidthValue(dropdownStyles.width || 'full')
      };
    } else if (textInputStyles) {
      return {
        backgroundColor: textInputStyles.backgroundColor || '#FFFFFF',
        borderRadius: `${textInputStyles.borderRadius || 8}px`,
        borderWidth: `${textInputStyles.borderWidth || 1}px`,
        borderColor: textInputStyles.borderColor || '#E5E7EB',
        padding: `${textInputStyles.padding || 12}px`,
        boxShadow: getShadowValue(textInputStyles.shadow || 'sm'),
        fontSize: getFontSize(textInputStyles.fontSize || 'base'),
        color: textInputStyles.textColor || '#374151',
        height: `${textInputStyles.height || 40}px`,
        width: getWidthValue(textInputStyles.width || 'full')
      };
    }
    
    // Fallback to original formula styling
    return {
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
      width: getWidthValue(styling?.inputWidth || 'full'),
      fontFamily: styling.inputFontFamily === 'inter' ? 'Inter, sans-serif' :
                 styling.inputFontFamily === 'arial' ? 'Arial, sans-serif' :
                 styling.inputFontFamily === 'helvetica' ? 'Helvetica, sans-serif' :
                 styling.inputFontFamily === 'georgia' ? 'Georgia, serif' :
                 styling.inputFontFamily === 'times' ? 'Times New Roman, serif' :
                 styling.inputFontFamily === 'roboto' ? 'Roboto, sans-serif' :
                 styling.inputFontFamily === 'opensans' ? 'Open Sans, sans-serif' :
                 styling.inputFontFamily === 'lato' ? 'Lato, sans-serif' :
                 styling.inputFontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
                 styling.inputFontFamily === 'system' ? 'system-ui, sans-serif' :
                 styling.inputFontFamily || (styling.fontFamily === 'times' ? 'Times New Roman, serif' : 'Inter, sans-serif'),
      fontWeight: styling.inputFontWeight === 'light' ? '300' :
                 styling.inputFontWeight === 'normal' ? '400' :
                 styling.inputFontWeight === 'medium' ? '500' :
                 styling.inputFontWeight === 'semibold' ? '600' :
                 styling.inputFontWeight === 'bold' ? '700' :
                 styling.inputFontWeight === 'extrabold' ? '800' : '400'
    };
  };

  const inputStyle = getInputStyle();

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

  // Helper function to get question card styles with priority to component styles
  const getQuestionCardStyle = () => {
    const questionCardStyles = componentStyles?.['question-card'];
    
    if (questionCardStyles) {
      return {
        backgroundColor: questionCardStyles.backgroundColor || '#FFFFFF',
        borderRadius: `${questionCardStyles.borderRadius || 8}px`,
        borderWidth: `${questionCardStyles.borderWidth || 1}px`,
        borderColor: questionCardStyles.borderColor || '#E5E7EB',
        borderStyle: 'solid',
        boxShadow: getShadowValue(questionCardStyles.shadow || 'sm'),
        padding: `${questionCardStyles.padding || 12}px`,
        marginBottom: '1rem'
      };
    }
    
    // Fallback to original formula styling
    return {
      backgroundColor: styling?.questionCardBackgroundColor || '#FFFFFF',
      borderRadius: `${styling?.questionCardBorderRadius || 12}px`,
      borderWidth: `${styling?.questionCardBorderWidth || 1}px`,
      borderColor: styling?.questionCardBorderColor || '#E5E7EB',
      borderStyle: 'solid',
      boxShadow: getShadowValue(styling?.questionCardShadow || 'sm'),
      padding: getPadding(styling?.questionCardPadding || 'lg'),
      marginBottom: '1rem'
    };
  };

  const questionCardStyle = getQuestionCardStyle();

  // Check if this variable should be shown based on conditional logic
  const shouldShow = !variable.conditionalLogic?.enabled || 
    evaluateConditionalLogic(variable, currentValues, allVariables);

  // If the variable should not be shown, return null
  if (!shouldShow) {
    return null;
  }

  // Helper function to get label styles
  const getLabelStyle = () => {
    // Use componentStyles textColor only if it's not the default, otherwise use global styling.textColor
    const defaultTextInputColor = '#1F2937';
    const textColor = (componentStyles?.textInput?.textColor && componentStyles.textInput.textColor !== defaultTextInputColor)
      ? componentStyles.textInput.textColor
      : (styling.textColor || '#374151');
    
    return {
      color: textColor,
      fontFamily: styling.inputFontFamily === 'inter' ? 'Inter, sans-serif' :
               styling.inputFontFamily === 'arial' ? 'Arial, sans-serif' :
               styling.inputFontFamily === 'helvetica' ? 'Helvetica, sans-serif' :
               styling.inputFontFamily === 'georgia' ? 'Georgia, serif' :
               styling.inputFontFamily === 'times' ? 'Times New Roman, serif' :
               styling.inputFontFamily === 'roboto' ? 'Roboto, sans-serif' :
               styling.inputFontFamily === 'opensans' ? 'Open Sans, sans-serif' :
               styling.inputFontFamily === 'lato' ? 'Lato, sans-serif' :
               styling.inputFontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
               styling.inputFontFamily === 'system' ? 'system-ui, sans-serif' :
               styling.inputFontFamily || (styling.fontFamily === 'times' ? 'Times New Roman, serif' : 'Inter, sans-serif'),
    fontWeight: styling.inputFontWeight === 'light' ? '300' :
               styling.inputFontWeight === 'normal' ? '400' :
               styling.inputFontWeight === 'medium' ? '500' :
               styling.inputFontWeight === 'semibold' ? '600' :
               styling.inputFontWeight === 'bold' ? '700' :
               styling.inputFontWeight === 'extrabold' ? '800' : '500',
    fontSize: styling.inputFontSize === 'xs' ? '0.75rem' :
             styling.inputFontSize === 'sm' ? '0.875rem' :
             styling.inputFontSize === 'base' ? '1rem' :
             styling.inputFontSize === 'lg' ? '1.125rem' :
             styling.inputFontSize === 'xl' ? '1.25rem' :
             styling.inputFontSize === '2xl' ? '1.5rem' : '0.875rem'
    };
  };

  const labelStyle = getLabelStyle();

  switch (variable.type) {
    case 'number':
      return (
        <div className="question-card" style={questionCardStyle}>
          <div className="space-y-2">
            <VariableLabelWithTooltip variable={variable} style={labelStyle} />
            <div className="relative">
              <Input
                id={variable.id}
                type="number"
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                style={inputStyle}
                className="ab-input ab-number-input text-input pr-12"
                data-testid={`input-${variable.id}`}
                data-variable-id={variable.id}
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
        <div className="question-card" style={questionCardStyle}>
          <div className="space-y-2">
            <VariableLabelWithTooltip variable={variable} style={labelStyle} />
            <Input
              id={variable.id}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              style={inputStyle}
              className="ab-input ab-text-input text-input"
              data-testid={`input-${variable.id}`}
              data-variable-id={variable.id}
            />
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div className="question-card" style={questionCardStyle}>
          <div className="flex items-center space-x-3 py-1">
            <Checkbox
              id={variable.id}
              checked={value || false}
              onCheckedChange={(checked) => onChange(checked === true)}
              className="flex-shrink-0"
            />
            <VariableLabelWithTooltip variable={variable} style={{...labelStyle, flex: 1}} />
          </div>
        </div>
      );

    case 'slider':
      const sliderValue = Array.isArray(value) ? value : [value || variable.min || 0];
      return (
        <div className="question-card" style={questionCardStyle}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <VariableLabelWithTooltip variable={variable} style={labelStyle} />
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
              className="slider w-full"
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
        <div className="question-card" style={questionCardStyle}>
          <div className="space-y-2">
            <VariableLabelWithTooltip variable={variable} style={labelStyle} />
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger style={inputStyle} className="ab-select ab-dropdown dropdown w-full" data-testid={`select-${variable.id}`} data-variable-id={variable.id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent className="ab-select-content">
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
      const getImageSize = (size: string | number) => {
        // If it's a number, treat it as percentage - return both class and style
        if (typeof size === 'number') {
          return {
            className: 'object-cover mx-auto',
            style: { 
              width: `${size}%`, 
              height: `${size}%`,
              maxWidth: '100%',
              maxHeight: '100%'
            }
          };
        }
        
        // Return predefined classes for string sizes
        const classMap: Record<string, string> = {
          'sm': 'w-6 h-6 sm:w-8 sm:h-8',
          'md': 'w-8 h-8 sm:w-12 sm:h-12',
          'lg': 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20',
          'xl': 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24'
        };
        
        return {
          className: `${classMap[size] || classMap['md']} object-cover mx-auto`,
          style: {}
        };
      };

      const multiChoiceCardStyle = {
        borderRadius: `${componentStyles?.multipleChoice?.borderRadius || styling?.multiChoiceCardBorderRadius || 8}px`,
        borderWidth: `${componentStyles?.multipleChoice?.borderWidth || styling?.multiChoiceCardBorderWidth || 2}px`,
        borderColor: componentStyles?.multipleChoice?.borderColor || styling?.multiChoiceCardBorderColor || '#E5E7EB',
        borderStyle: 'solid' as const,
        backgroundColor: componentStyles?.multipleChoice?.backgroundColor || styling?.multiChoiceCardBackgroundColor || 'transparent',
        padding: componentStyles?.multipleChoice?.padding ? `${componentStyles.multipleChoice.padding}px` : undefined,
        boxShadow: getShadowValue(componentStyles?.multipleChoice?.shadow || styling?.multiChoiceCardShadow || 'none')
      };

      const multiChoiceImageStyle = {
        borderRadius: `${styling?.multiChoiceImageBorderRadius || 8}px`,
        boxShadow: getShadowValue(styling?.multiChoiceImageShadow || 'sm')
      };

      const layoutClass = styling?.multiChoiceLayout === 'grid' 
        ? 'grid gap-2 sm:gap-3 grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-fr'
        : 'flex flex-col space-y-3';

      return (
        <div className="question-card" style={questionCardStyle}>
          <div className="space-y-2" data-variable-id={variable.id}>
            <VariableLabelWithTooltip 
              variable={variable} 
              style={{ ...labelStyle, fontSize: '0.875rem', fontWeight: 500 }} 
            />
          {variable.allowMultipleSelection && (
            <p className="text-xs text-gray-500">Multiple selections allowed</p>
          )}
          
          <div className={layoutClass}>
            {variable.options?.map((option, optionIndex) => {
              const uniqueId = `${option.value}_${optionIndex}`;
              const isSelected = selectedOptions.includes(uniqueId);
              return (
                <div
                  key={`${option.value}-${optionIndex}`}
                  className={`ab-multiple-choice multiple-choice ${
                    // Use minimal classes when custom styling is detected to avoid conflicts
                    componentStyles?.multipleChoice?.borderWidth || componentStyles?.multipleChoice?.borderRadius || componentStyles?.multipleChoice?.borderColor
                      ? 'cursor-pointer transition-all' 
                      : 'border-2 cursor-pointer transition-all rounded-lg hover:shadow-sm'
                  } ${
                    styling?.multiChoiceLayout === 'grid' ? 'p-2 sm:p-3 text-center flex flex-col h-full min-h-[120px] justify-center' : 'p-3'
                  } ${isSelected ? 'selected' : ''}`}
                  style={hasCustomCSS ? {} : {
                    ...multiChoiceCardStyle,
                    borderColor: isSelected 
                      ? (styling?.multipleChoiceActiveBorderColor || styling?.multiChoiceSelectedColor || componentStyles?.multipleChoice?.activeBorderColor || '#3B82F6')
                      : (componentStyles?.multipleChoice?.borderColor || styling?.inputBorderColor || '#D1D5DB'),
                    backgroundColor: isSelected 
                      ? (styling?.multipleChoiceActiveBackgroundColor || styling?.multiChoiceSelectedBgColor || componentStyles?.multipleChoice?.activeBackgroundColor || '#3B82F6')
                      : (componentStyles?.multipleChoice?.backgroundColor || styling?.backgroundColor || 'transparent'),
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !hasCustomCSS) {
                      e.currentTarget.style.backgroundColor = styling?.multipleChoiceHoverBackgroundColor || componentStyles?.multipleChoice?.hoverBackgroundColor || styling?.multiChoiceHoverBgColor || '#F3F4F6';
                      e.currentTarget.style.borderColor = styling?.multipleChoiceHoverBorderColor || componentStyles?.multipleChoice?.hoverBorderColor || styling?.multiChoiceSelectedColor || '#D1D5DB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !hasCustomCSS) {
                      e.currentTarget.style.backgroundColor = componentStyles?.multipleChoice?.backgroundColor || styling?.backgroundColor || 'transparent';
                      e.currentTarget.style.borderColor = componentStyles?.multipleChoice?.borderColor || styling?.inputBorderColor || '#D1D5DB';
                    }
                  }}
                  onClick={() => handleMultipleChoiceChange(
                    option.value.toString(),
                    optionIndex,
                    !isSelected
                  )}
                >
                  <div className={`flex items-center justify-center text-center flex-col w-full h-full ${
                    styling?.multiChoiceLayout === 'grid' ? 'space-y-1 sm:space-y-2' : 'space-y-2'
                  }`}>
                    {(() => {
                      const imageSize = getImageSize(styling?.multiChoiceImageSize || 'md');
                      
                      return option.image ? (
                        <img 
                          src={option.image} 
                          alt={option.label}
                          className={imageSize.className}
                          style={{
                            ...multiChoiceImageStyle,
                            ...imageSize.style
                          }}
                        />
                      ) : (
                        <div 
                          className={`${imageSize.className} flex items-center justify-center rounded-lg`}
                          style={{
                            ...imageSize.style,
                            fontSize: typeof styling?.multiChoiceImageSize === 'number' ? '1.2rem' :
                                     styling?.multiChoiceImageSize === 'sm' ? '0.8rem' :
                                     styling?.multiChoiceImageSize === 'md' ? '1.2rem' : 
                                     styling?.multiChoiceImageSize === 'lg' ? '2rem' : 
                                     styling?.multiChoiceImageSize === 'xl' ? '2.5rem' : '1.2rem',
                            backgroundColor: isSelected 
                              ? (styling?.multipleChoiceActiveBackgroundColor || styling?.multiChoiceSelectedBgColor || '#3B82F6')
                              : '#F3F4F6',
                            color: isSelected ? 'white' : '#6B7280'
                          }}
                        >
                          {option.label.charAt(0).toUpperCase()}
                        </div>
                      );
                    })()}
                    
                    <div className="text-center">
                      <div 
                        className={`font-medium ${
                          styling?.multiChoiceLayout === 'grid' ? 'text-xs sm:text-sm' : 'text-sm'
                        } line-clamp-2`}
                        style={{ 
                          color: isSelected 
                            ? 'white'
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
            <VariableLabelWithTooltip variable={variable} style={labelStyle} />
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger style={inputStyle} className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent className="ab-select-content">
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
            <VariableLabelWithTooltip variable={variable} style={labelStyle} />
            <div className="text-sm text-gray-500">
              Unsupported variable type: {variable.type}
            </div>
          </div>
        </div>
      );
  }
}