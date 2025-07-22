import { useState } from "react";
import { Formula, Variable, StylingOptions } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Save, Plus } from "lucide-react";
import VariableCard from "./variable-card";
import AddVariableModal from "./add-variable-modal";

interface FormulaBuilderProps {
  formula: Formula;
  onUpdate: (formula: Partial<Formula>) => void;
  onSave: () => void;
  onPreview: () => void;
  isSaving?: boolean;
}

export default function FormulaBuilderComponent({ 
  formula, 
  onUpdate, 
  onSave, 
  onPreview, 
  isSaving 
}: FormulaBuilderProps) {
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [formulaExpression, setFormulaExpression] = useState(formula.formula);

  const handleAddVariable = (variable: Variable) => {
    const updatedVariables = [...formula.variables, variable];
    onUpdate({ variables: updatedVariables });
  };

  const handleDeleteVariable = (variableId: string) => {
    const updatedVariables = formula.variables.filter(v => v.id !== variableId);
    onUpdate({ variables: updatedVariables });
  };

  const handleStylingChange = (key: keyof StylingOptions, value: any) => {
    onUpdate({
      styling: {
        ...formula.styling,
        [key]: value
      }
    });
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormulaExpression(newFormula);
    onUpdate({ formula: newFormula });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Formula Builder */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Formula Builder</h2>
                <p className="text-sm text-gray-500">{formula.name}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onPreview}>
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button onClick={onSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>

          {/* Variables Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Variables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formula.variables.map((variable) => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  onDelete={handleDeleteVariable}
                />
              ))}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-primary hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => setShowVariableModal(true)}
              >
                <div className="text-center">
                  <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Add Variable</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formula Builder */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Pricing Formula</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="formula-expression">Formula Expression</Label>
                <Input
                  id="formula-expression"
                  value={formulaExpression}
                  onChange={(e) => handleFormulaChange(e.target.value)}
                  placeholder="e.g., squareFootage * 25 + laborHours * 85"
                  className="mt-1"
                />
              </div>
              <div className="text-xs text-gray-500">
                Use variable IDs in your formula. Available variables: {formula.variables.map(v => v.id).join(", ")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Embed Code */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Embed Code</h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-600 mb-3">Copy this code to embed on your website:</p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs font-mono text-gray-700 overflow-x-auto">
              {`<iframe src="${window.location.origin}/embed/${formula.embedId}" width="100%" height="600" frameborder="0"></iframe>`}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-2"
              onClick={() => {
                const embedCode = `<iframe src="${window.location.origin}/embed/${formula.embedId}" width="100%" height="600" frameborder="0"></iframe>`;
                navigator.clipboard.writeText(embedCode);
              }}
            >
              Copy Code
            </Button>
          </div>
        </div>

        {/* Styling Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Styling</h3>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-700">Primary Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  type="color"
                  value={formula.styling.primaryColor}
                  onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                  className="w-8 h-8 p-0 border-0"
                />
                <Input
                  type="text"
                  value={formula.styling.primaryColor}
                  onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                  className="flex-1 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Button Style</Label>
              <Select
                value={formula.styling.buttonStyle}
                onValueChange={(value) => handleStylingChange('buttonStyle', value)}
              >
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="pill">Pill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-breakdown"
                checked={formula.styling.showPriceBreakdown}
                onCheckedChange={(checked) => handleStylingChange('showPriceBreakdown', checked)}
              />
              <Label htmlFor="show-breakdown" className="text-xs">
                Show price breakdown
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-lead"
                checked={formula.styling.includeLedCapture}
                onCheckedChange={(checked) => handleStylingChange('includeLedCapture', checked)}
              />
              <Label htmlFor="include-lead" className="text-xs">
                Include lead capture
              </Label>
            </div>
          </div>
        </div>
      </div>

      <AddVariableModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        onAddVariable={handleAddVariable}
      />
    </div>
  );
}
