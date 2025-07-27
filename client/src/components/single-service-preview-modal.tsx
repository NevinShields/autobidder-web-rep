import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Calculator, DollarSign } from 'lucide-react';
import { Formula } from '@shared/schema';
import EnhancedVariableInput from '@/components/enhanced-variable-input';
import ServiceCardDisplay from '@/components/service-card-display';

interface SingleServicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formula: Formula;
}

export default function SingleServicePreviewModal({ isOpen, onClose, formula }: SingleServicePreviewModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleVariableChange = (variableId: string, value: any) => {
    const newValues = { ...variableValues, [variableId]: value };
    setVariableValues(newValues);
    
    // Auto-calculate when all required variables have values
    const hasAllValues = (formula.variables || []).every(variable => {
      return newValues[variable.id] !== undefined && newValues[variable.id] !== '' && newValues[variable.id] !== null;
    });
    
    if (hasAllValues) {
      calculatePrice(newValues);
    }
  };

  const calculatePrice = (values: Record<string, any>) => {
    try {
      // Create a function from the formula
      const formulaCode = formula.formula.replace(/\b(\w+)\b/g, (match) => {
        // Check if this is a variable name
        const variable = (formula.variables || []).find(v => v.id === match);
        if (variable) {
          const value = values[match];
          
          // Handle different variable types
          if (variable.type === 'checkbox') {
            return value ? '1' : '0';
          } else if (variable.type === 'select' || variable.type === 'multiple-choice') {
            // For select/multiple choice, use the numeric value
            return value || '0';
          } else {
            // For number/text inputs, use the raw value
            return value || '0';
          }
        }
        return match;
      });

      // Evaluate the formula
      const result = Function(`"use strict"; return (${formulaCode})`)();
      const price = Math.max(0, Math.round(result));
      setCalculatedPrice(price);
      setShowResults(true);
    } catch (error) {
      console.error('Error calculating price:', error);
      setCalculatedPrice(null);
      setShowResults(false);
    }
  };

  const handleCalculate = () => {
    calculatePrice(variableValues);
  };

  const resetCalculator = () => {
    setVariableValues({});
    setCalculatedPrice(null);
    setShowResults(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {formula.title || formula.name} - Preview
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Header */}
          <div className="text-center border-b pb-4">
            <div className="flex items-center justify-center gap-3 mb-3">
              {formula.iconUrl && (
                <div className="w-12 h-12 flex items-center justify-center">
                  {formula.iconUrl.startsWith('http') ? (
                    <img 
                      src={formula.iconUrl} 
                      alt={formula.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl">{formula.iconUrl}</span>
                  )}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900">{formula.title || formula.name}</h2>
            </div>
            
            {formula.description && (
              <p className="text-gray-600 mb-3">{formula.description}</p>
            )}
            
            {formula.bulletPoints && formula.bulletPoints.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {formula.bulletPoints.map((point, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {point}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Calculator Form */}
          {!showResults ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Your Quote</h3>
              
              {/* Variables */}
              <div className="grid gap-4">
                {formula.variables.map((variable) => (
                  <div key={variable.id} className="space-y-2">
                    <EnhancedVariableInput
                      variable={variable}
                      value={variableValues[variable.id]}
                      onChange={(value) => handleVariableChange(variable.id, value)}
                      styling={formula.styling}
                      allVariables={formula.variables}
                    />
                  </div>
                ))}
              </div>

              {/* Calculate Button */}
              <div className="pt-6 border-t">
                <Button 
                  onClick={handleCalculate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                  disabled={formula.variables.length === 0}
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Calculate Price
                </Button>
              </div>
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center">Your Quote</h3>
              
              {/* Price Display */}
              <div 
                className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 text-center"
                style={{
                  borderRadius: `${formula.styling.pricingCardBorderRadius}px`,
                  backgroundColor: formula.styling.pricingCardBackgroundColor,
                  borderColor: formula.styling.pricingAccentColor,
                  color: formula.styling.pricingTextColor
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  {formula.iconUrl && (
                    <div className="w-10 h-10 flex items-center justify-center">
                      {formula.iconUrl.startsWith('http') ? (
                        <img 
                          src={formula.iconUrl} 
                          alt={formula.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl">{formula.iconUrl}</span>
                      )}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold">{formula.name}</h3>
                </div>
                
                <div className="text-4xl font-bold text-green-600 mb-3">
                  ${calculatedPrice?.toLocaleString() || '0'}
                </div>
                
                {/* Variable Summary */}
                <div className="text-sm text-gray-600 space-y-1">
                  {formula.variables.map(variable => {
                    const value = variableValues[variable.id];
                    if (value === undefined || value === null || value === '') return null;
                    
                    let displayValue = value;
                    if (variable.type === 'select' || variable.type === 'multiple-choice') {
                      const option = variable.options?.find(opt => opt.value === value);
                      displayValue = option?.label || value;
                    } else if (variable.type === 'checkbox') {
                      displayValue = value ? 'Yes' : 'No';
                    }
                    
                    return (
                      <div key={variable.id} className="flex justify-between">
                        <span>{variable.name}:</span>
                        <span className="font-medium">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={resetCalculator}
                  variant="outline"
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button 
                  onClick={onClose}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}