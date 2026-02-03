import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calculator, CheckCircle, RotateCcw, Minus, Plus } from 'lucide-react';
import { AIFormulaResponse } from '@/lib/calculator-storage';

interface GuestCalculatorPreviewProps {
  formula: AIFormulaResponse;
  onSaveClick: () => void;
}

export default function GuestCalculatorPreview({ formula, onSaveClick }: GuestCalculatorPreviewProps) {
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  // Initialize default values
  useEffect(() => {
    const defaults: Record<string, any> = {};
    formula.variables.forEach((variable) => {
      if (variable.defaultValue !== undefined) {
        defaults[variable.id] = variable.defaultValue;
      } else if (variable.type === 'slider' || variable.type === 'stepper') {
        defaults[variable.id] = variable.min ?? 0;
      } else if (variable.type === 'number') {
        defaults[variable.id] = 0;
      } else if (variable.type === 'multiple-choice' || variable.type === 'select' || variable.type === 'dropdown') {
        if (variable.options && variable.options.length > 0) {
          defaults[variable.id] = variable.options[0].value;
        }
      }
    });
    setVariableValues(defaults);
  }, [formula]);

  // Calculate price whenever values change
  useEffect(() => {
    calculatePrice(variableValues);
  }, [variableValues, formula]);

  const handleVariableChange = (variableId: string, value: any) => {
    setVariableValues((prev) => ({ ...prev, [variableId]: value }));
  };

  const calculatePrice = (values: Record<string, any>) => {
    try {
      let formulaExpression = formula.formula;

      formula.variables.forEach((variable) => {
        let variableValue = values[variable.id];

        // Handle array values for single-select
        if (Array.isArray(variableValue) && (variable.type === 'select' || variable.type === 'dropdown')) {
          variableValue = variableValue[0];
        }

        if (variable.type === 'select' && variable.options) {
          const option = variable.options.find((opt) => opt.value === variableValue);
          variableValue = option?.multiplier || option?.numericValue || 0;
        } else if (variable.type === 'dropdown' && variable.options) {
          const option = variable.options.find((opt) => opt.value === variableValue);
          variableValue = option?.numericValue || 0;
        } else if (variable.type === 'multiple-choice' && variable.options) {
          if (Array.isArray(variableValue)) {
            variableValue = variableValue.reduce((total: number, selectedValue: string) => {
              const option = variable.options?.find((opt) => opt.value.toString() === selectedValue);
              return total + (option?.numericValue || 0);
            }, 0);
          } else if (variableValue) {
            const option = variable.options.find((opt) => opt.value === variableValue);
            variableValue = option?.numericValue || 0;
          } else {
            variableValue = 0;
          }
        } else if (variable.type === 'number' || variable.type === 'slider' || variable.type === 'stepper') {
          variableValue = Number(variableValue) || 0;
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
    } catch (error) {
      console.error('Error calculating price:', error);
      setCalculatedPrice(0);
    }
  };

  const resetCalculator = () => {
    const defaults: Record<string, any> = {};
    formula.variables.forEach((variable) => {
      if (variable.defaultValue !== undefined) {
        defaults[variable.id] = variable.defaultValue;
      } else if (variable.type === 'slider' || variable.type === 'stepper') {
        defaults[variable.id] = variable.min ?? 0;
      } else if (variable.type === 'number') {
        defaults[variable.id] = 0;
      } else if (variable.type === 'multiple-choice' || variable.type === 'select' || variable.type === 'dropdown') {
        if (variable.options && variable.options.length > 0) {
          defaults[variable.id] = variable.options[0].value;
        }
      }
    });
    setVariableValues(defaults);
  };

  const renderVariableInput = (variable: AIFormulaResponse['variables'][0]) => {
    const value = variableValues[variable.id];

    switch (variable.type) {
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={variable.id} className="text-white/90 font-medium">
              {variable.name}
              {variable.unit && <span className="text-white/60 ml-1">({variable.unit})</span>}
            </Label>
            <Input
              id={variable.id}
              type="number"
              value={value || ''}
              onChange={(e) => handleVariableChange(variable.id, e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              placeholder={`Enter ${variable.name.toLowerCase()}`}
            />
          </div>
        );
      case 'stepper': {
        const minValue = variable.min ?? 0;
        const maxValue = variable.max ?? 100;
        const currentValue = Number(value);
        const normalizedValue = Number.isFinite(currentValue) ? currentValue : minValue;
        const clampValue = (nextValue: number) => Math.min(maxValue, Math.max(minValue, nextValue));
        return (
          <div className="space-y-2">
            <Label htmlFor={variable.id} className="text-white/90 font-medium">
              {variable.name}
              {variable.unit && <span className="text-white/60 ml-1">({variable.unit})</span>}
            </Label>
            <div className="inline-flex items-center overflow-hidden border border-white/20 rounded-md bg-white/10 h-10">
              <button
                type="button"
                onClick={() => handleVariableChange(variable.id, clampValue(normalizedValue - 1))}
                className="w-9 h-full flex items-center justify-center text-white hover:bg-white/10"
                aria-label={`Decrease ${variable.name}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="h-full w-px bg-white/20" />
              <div className="h-full flex items-center justify-center px-2">
                <Input
                  id={variable.id}
                  type="number"
                  value={normalizedValue}
                  min={minValue}
                  max={maxValue}
                  onChange={(e) => {
                    const parsed = e.target.value === '' ? minValue : Number(e.target.value);
                    handleVariableChange(variable.id, clampValue(Number.isNaN(parsed) ? minValue : parsed));
                  }}
                  className="bg-transparent border-0 text-white placeholder:text-white/40 text-center font-semibold h-full px-2 py-0 leading-none focus-visible:ring-0 focus-visible:ring-offset-0 no-spinner"
                  style={{
                    width: `calc(${Math.max(2, String(normalizedValue).length)}ch + 20px)`,
                    paddingTop: 6,
                    paddingBottom: 6,
                    lineHeight: 1.1,
                  }}
                  placeholder={`Enter ${variable.name.toLowerCase()}`}
                />
              </div>
              <div className="h-full w-px bg-white/20" />
              <button
                type="button"
                onClick={() => handleVariableChange(variable.id, clampValue(normalizedValue + 1))}
                className="w-9 h-full flex items-center justify-center text-white hover:bg-white/10"
                aria-label={`Increase ${variable.name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'select':
      case 'dropdown':
        return (
          <div className="space-y-2">
            <Label htmlFor={variable.id} className="text-white/90 font-medium">
              {variable.name}
            </Label>
            <Select value={value?.toString()} onValueChange={(val) => handleVariableChange(variable.id, val)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder={`Select ${variable.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {variable.options?.map((option, idx) => (
                  <SelectItem key={idx} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            <Label className="text-white/90 font-medium">{variable.name}</Label>
            <div className="grid grid-cols-2 gap-2">
              {variable.options?.map((option, idx) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleVariableChange(variable.id, option.value)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-purple-500/30 border-purple-400 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={variable.id} className="text-white/90 font-medium">
              {variable.name}
            </Label>
            <Input
              id={variable.id}
              type="text"
              value={value || ''}
              onChange={(e) => handleVariableChange(variable.id, e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              placeholder={`Enter ${variable.name.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column - Calculator Info & Form */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {formula.iconUrl && (
                <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-lg">
                  {formula.iconUrl.startsWith('http') ? (
                    <img src={formula.iconUrl} alt={formula.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-2xl">{formula.iconUrl}</span>
                  )}
                </div>
              )}
              <div>
                <CardTitle className="text-xl text-white">{formula.title || formula.name}</CardTitle>
                <Badge variant="secondary" className="mt-1 bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Preview Mode
                </Badge>
              </div>
            </div>
          </div>
          {formula.description && <p className="text-white/70 text-sm mt-3">{formula.description}</p>}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bullet Points */}
          {formula.bulletPoints && formula.bulletPoints.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/10">
              {formula.bulletPoints.map((point, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full"
                >
                  <CheckCircle className="w-3 h-3" />
                  {point}
                </span>
              ))}
            </div>
          )}

          {/* Variables Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Try the Calculator
            </h3>
            <div className="space-y-4">
              {formula.variables.map((variable) => (
                <div key={variable.id}>{renderVariableInput(variable)}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column - Price Display */}
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-green-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <DollarSign className="w-8 h-8 text-green-400" />
                <span className="text-lg font-semibold text-white">Estimated Price</span>
              </div>

              <div className="text-5xl font-bold text-green-400 mb-4">${calculatedPrice.toLocaleString()}</div>

              <p className="text-white/60 text-sm mb-6">Price updates as you adjust the options above</p>

              {/* Selection Summary */}
              {Object.keys(variableValues).length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 text-sm mb-4">
                  <h4 className="font-semibold mb-2 text-white/90">Your Selections:</h4>
                  <div className="space-y-1 text-left">
                    {formula.variables.map((variable) => {
                      const val = variableValues[variable.id];
                      if (val === undefined || val === null || val === '') return null;

                      let displayValue = val;
                      if (variable.type === 'select' || variable.type === 'dropdown' || variable.type === 'multiple-choice') {
                        const option = variable.options?.find((opt) => opt.value === val);
                        displayValue = option?.label || val;
                      }

                      return (
                        <div key={variable.id} className="flex justify-between items-center">
                          <span className="text-white/70">{variable.name}:</span>
                          <span className="text-white font-medium">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                onClick={resetCalculator}
                variant="outline"
                size="sm"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Calculator
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border-purple-500/30">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Love this calculator?</h3>
            <p className="text-white/70 text-sm mb-4">
              Create a free account to save, customize, and embed it on your website.
            </p>
            <Button
              onClick={onSaveClick}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Save & Customize This Calculator
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
