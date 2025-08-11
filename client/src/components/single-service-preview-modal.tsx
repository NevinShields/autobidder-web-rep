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
    
    // Calculate price immediately on any change
    calculatePrice(newValues);
  };

  const calculatePrice = (values: Record<string, any>) => {
    try {
      let formulaExpression = formula.formula;
      
      formula.variables.forEach((variable) => {
        let variableValue = values[variable.id];
        
        // Handle case where single-select values are accidentally stored as arrays
        if (Array.isArray(variableValue) && (variable.type === 'select' || variable.type === 'dropdown')) {
          variableValue = variableValue[0]; // Take the first value for single-select inputs
        }
        
        if (variable.type === 'select' && variable.options) {
          const option = variable.options.find(opt => opt.value === variableValue);
          variableValue = option?.multiplier || option?.numericValue || 0;
        } else if (variable.type === 'dropdown' && variable.options) {
          const option = variable.options.find(opt => opt.value === variableValue);
          variableValue = option?.numericValue || 0;
        } else if (variable.type === 'multiple-choice' && variable.options) {
          if (Array.isArray(variableValue)) {
            variableValue = variableValue.reduce((total: number, selectedValue: string) => {
              const option = variable.options?.find(opt => opt.value.toString() === selectedValue);
              return total + (option?.numericValue || 0);
            }, 0);
          } else {
            variableValue = 0;
          }
        } else if (variable.type === 'number' || variable.type === 'slider') {
          variableValue = Number(variableValue) || 0;
        } else if (variable.type === 'checkbox') {
          variableValue = variableValue ? 1 : 0;
        } else {
          variableValue = 0;
        }
        
        formulaExpression = formulaExpression.replace(
          new RegExp(`\\b${variable.id}\\b`, 'g'),
          String(variableValue)
        );
      });
      
      const result = Function(`"use strict"; return (${formulaExpression})`)();
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Service Info & Form */}
          <div className="space-y-6">
            {/* Service Header */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                {formula.iconUrl && (
                  <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow-sm">
                    {formula.iconUrl.startsWith('http') ? (
                      <img 
                        src={formula.iconUrl} 
                        alt={formula.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-3xl">{formula.iconUrl}</span>
                    )}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{formula.title || formula.name}</h2>
                  <p className="text-sm text-gray-500">Calculator Preview</p>
                </div>
              </div>
              
              {formula.description && (
                <p className="text-gray-700 mb-3 text-sm">{formula.description}</p>
              )}
              
              {formula.bulletPoints && formula.bulletPoints.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {formula.bulletPoints.map((point, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Calculator Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Get Your Quote
              </h3>
              
              {/* Variables */}
              <div className="space-y-4">
                {formula.variables.map((variable) => (
                  <div key={variable.id} className="bg-white border border-gray-200 rounded-lg p-4">
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
            </div>
          </div>

          {/* Right Column - Live Price Display */}
          <div className="space-y-6">
            {/* Live Price Display */}
            <div className="sticky top-6">
              <div 
                className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center shadow-lg"
                style={{
                  borderRadius: `${formula.styling.pricingCardBorderRadius || 12}px`,
                  backgroundColor: formula.styling.pricingCardBackgroundColor || '#f0fdf4',
                  borderColor: formula.styling.pricingAccentColor || '#22c55e',
                  color: formula.styling.pricingTextColor || '#065f46'
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <h3 className="text-xl font-bold">Live Quote</h3>
                </div>
                
                <div className="text-5xl font-bold text-green-600 mb-4">
                  ${calculatedPrice?.toLocaleString() || '0'}
                </div>
                
                {calculatedPrice && calculatedPrice > 0 && (
                  <p className="text-sm text-green-700 mb-4">
                    Price updates automatically as you make selections
                  </p>
                )}
                
                {/* Variable Summary */}
                {Object.keys(variableValues).length > 0 && (
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 text-sm">
                    <h4 className="font-semibold mb-2 text-gray-800">Your Selections:</h4>
                    <div className="space-y-1 text-left">
                      {formula.variables.map(variable => {
                        const value = variableValues[variable.id];
                        if (value === undefined || value === null || value === '') return null;
                        
                        let displayValue = value;
                        if (variable.type === 'select' || variable.type === 'dropdown') {
                          const option = variable.options?.find(opt => opt.value === value);
                          displayValue = option?.label || value;
                        } else if (variable.type === 'multiple-choice') {
                          if (Array.isArray(value)) {
                            const labels = value.map(v => {
                              const option = variable.options?.find(opt => opt.value === v);
                              return option?.label || v;
                            });
                            displayValue = labels.join(', ');
                          }
                        } else if (variable.type === 'checkbox') {
                          displayValue = value ? 'Yes' : 'No';
                        }
                        
                        return (
                          <div key={variable.id} className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">{variable.name}:</span>
                            <span className="text-gray-900 font-semibold">{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={resetCalculator}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={onClose}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}