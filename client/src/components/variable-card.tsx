import { useState } from "react";
import { Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Edit3, Check, DollarSign, Settings } from "lucide-react";

interface VariableCardProps {
  variable: Variable;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Variable>) => void;
}

export default function VariableCard({ variable, onDelete, onUpdate }: VariableCardProps) {
  const [isEditingId, setIsEditingId] = useState(false);
  const [editId, setEditId] = useState(variable.id);
  const [showPricingDetails, setShowPricingDetails] = useState(false);

  const handleSaveId = () => {
    if (onUpdate && editId.trim() && editId !== variable.id) {
      onUpdate(variable.id, { id: editId.trim() });
    }
    setIsEditingId(false);
    setEditId(variable.id);
  };

  const handleCancelEdit = () => {
    setIsEditingId(false);
    setEditId(variable.id);
  };

  const handlePricingUpdate = (optionIndex: number, numericValue: number | undefined) => {
    if (!onUpdate || !variable.options) return;
    
    const updatedOptions = variable.options.map((option, index) => 
      index === optionIndex 
        ? { ...option, numericValue }
        : option
    );
    
    onUpdate(variable.id, { options: updatedOptions });
  };

  const hasOptionsWithPricing = variable.options && ['select', 'dropdown', 'multiple-choice'].includes(variable.type);
  const hasPricingValues = variable.options?.some(option => option.numericValue !== undefined);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{variable.name}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(variable.id)}
          className="text-gray-400 hover:text-red-500 p-1"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      {/* Variable ID Section */}
      <div className="mb-3 pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 font-medium">Variable ID:</label>
          {!isEditingId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingId(true)}
              className="text-gray-400 hover:text-blue-500 p-1"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
        </div>
        {isEditingId ? (
          <div className="flex items-center space-x-1 mt-1">
            <Input
              value={editId}
              onChange={(e) => setEditId(e.target.value)}
              className="text-xs h-6 px-2"
              placeholder="variableId"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveId}
              className="text-green-600 hover:text-green-700 p-1"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <code className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded font-mono">
            {variable.id}
          </code>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <label className="text-gray-600">Type:</label>
          <span className="text-gray-900 ml-1 capitalize">{variable.type}</span>
        </div>
        <div>
          <label className="text-gray-600">
            {['select', 'dropdown', 'multiple-choice'].includes(variable.type) ? 'Options:' : 'Unit:'}
          </label>
          <span className="text-gray-900 ml-1">
            {['select', 'dropdown', 'multiple-choice'].includes(variable.type)
              ? variable.options?.length || 0
              : variable.unit || 'N/A'}
          </span>
        </div>
      </div>

      {/* Pricing Details Section */}
      {hasOptionsWithPricing && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3 text-gray-500" />
              <label className="text-xs text-gray-600 font-medium">Pricing Details</label>
              {hasPricingValues && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Configured
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPricingDetails(!showPricingDetails)}
              className="text-gray-400 hover:text-blue-500 p-1"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
          
          {showPricingDetails && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">
                Set numeric values for each option to use in formula calculations:
              </p>
              {variable.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700 flex-1 truncate">
                    {option.label}
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={option.numericValue || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      handlePricingUpdate(index, value);
                    }}
                    className="h-6 w-16 text-xs px-1"
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">
                Use these values in formulas like: {variable.id} * quantity
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
