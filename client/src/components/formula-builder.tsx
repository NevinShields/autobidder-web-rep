import { useState } from "react";
import { Formula, Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Eye, Save, Plus, Video, Image } from "lucide-react";
import VariableCard from "./variable-card";
import AddVariableModal from "./add-variable-modal";
import { useToast } from "@/hooks/use-toast";


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
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const { toast } = useToast();

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



  const handleFormulaChange = (newFormula: string) => {
    setFormulaExpression(newFormula);
    onUpdate({ formula: newFormula });
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingIcon(true);

    try {
      const formData = new FormData();
      formData.append('icon', file);

      const response = await fetch('/api/upload/icon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onUpdate({ iconUrl: result.iconUrl });
      
      toast({
        title: "Icon uploaded successfully",
        description: "Your custom icon has been saved"
      });
    } catch (error) {
      console.error('Icon upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload icon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingIcon(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formula Builder */}
      <div className="lg:col-span-2">
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

          {/* Basic Details Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Formula Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formula-name">Formula Name *</Label>
                <Input
                  id="formula-name"
                  value={formula.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="e.g., Kitchen Remodel Pricing"
                />
              </div>
              <div>
                <Label htmlFor="formula-title">Calculator Title</Label>
                <Input
                  id="formula-title"
                  value={formula.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="e.g., Get Your Kitchen Remodel Quote"
                />
              </div>
            </div>
          </div>

          {/* Media Settings Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Media & Guide</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="guide-video" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Guide Video URL
                </Label>
                <Input
                  id="guide-video"
                  value={formula.guideVideoUrl || ''}
                  onChange={(e) => onUpdate({ guideVideoUrl: e.target.value || null })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500 mt-1">Add a YouTube or video URL to help guide customers through the calculator</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <Label htmlFor="show-image">Show Service Image</Label>
                </div>
                <Switch
                  id="show-image"
                  checked={formula.showImage}
                  onCheckedChange={(checked) => onUpdate({ showImage: checked })}
                />
              </div>
              
              {formula.showImage && (
                <div>
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    value={formula.imageUrl || ''}
                    onChange={(e) => onUpdate({ imageUrl: e.target.value || null })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Add an image to display alongside your service in the selector</p>
                </div>
              )}
              
              <div>
                <Label className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  Service Icon
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      id="icon-url"
                      value={formula.iconUrl || ''}
                      onChange={(e) => onUpdate({ iconUrl: e.target.value || null })}
                      placeholder="https://example.com/icon.svg or emoji 🏠"
                      className="flex-1"
                    />
                    <div className="text-sm text-gray-400">or</div>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        className="hidden"
                        id="icon-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('icon-upload')?.click()}
                        className="shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                  {isUploadingIcon && (
                    <div className="text-xs text-blue-600">Uploading icon...</div>
                  )}
                  <p className="text-xs text-gray-500">Add a custom icon URL/emoji or upload an image for this service</p>
                </div>
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
      <div className="lg:col-span-1">
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


      </div>

      <AddVariableModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        onAddVariable={handleAddVariable}
      />
    </div>
  );
}
