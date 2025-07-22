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
import DesignPanel from "./design-panel";

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

  const handleUpdateVariable = (oldId: string, updates: Partial<Variable>) => {
    const updatedVariables = formula.variables.map(v => 
      v.id === oldId ? { ...v, ...updates } : v
    );
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
                  onUpdate={handleUpdateVariable}
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
                <textarea
                  id="formula-expression"
                  value={formulaExpression}
                  onChange={(e) => handleFormulaChange(e.target.value)}
                  placeholder="e.g., squareFootage * 25 + laborHours * 85"
                  className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Available Variables */}
              {formula.variables.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="text-xs font-medium text-blue-900 mb-2">Available Variable IDs:</h4>
                  <div className="flex flex-wrap gap-1">
                    {formula.variables.map((variable) => (
                      <code
                        key={variable.id}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => {
                          const textarea = document.getElementById('formula-expression') as HTMLTextAreaElement;
                          if (textarea) {
                            const cursorPos = textarea.selectionStart;
                            const newValue = formulaExpression.slice(0, cursorPos) + variable.id + formulaExpression.slice(cursorPos);
                            handleFormulaChange(newValue);
                            // Set cursor position after the inserted variable
                            setTimeout(() => {
                              textarea.setSelectionRange(cursorPos + variable.id.length, cursorPos + variable.id.length);
                              textarea.focus();
                            }, 10);
                          }
                        }}
                      >
                        {variable.id}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Click on a variable ID to insert it into your formula
                  </p>
                </div>
              )}
              
              {/* Formula Help */}
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Formula Tips:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use basic math operators: +, -, *, /, ( )</li>
                  <li>Reference variables by their ID (case-sensitive)</li>
                  <li>Select variables automatically use their multiplier values</li>
                  <li>Checkbox variables return true/false, multiply by costs</li>
                </ul>
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

        {/* Design Panel */}
        <DesignPanel
          styling={formula.styling}
          onChange={handleStylingChange}
        />
      </div>

      <AddVariableModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        onAddVariable={handleAddVariable}
      />
    </div>
  );
}
