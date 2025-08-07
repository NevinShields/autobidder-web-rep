import { useState } from "react";
import { Formula, Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, Save, Plus, Video, Image, Sparkles, Wand2, Loader2, Map, GripVertical, BookOpen } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import VariableCard from "./variable-card";
import AddVariableModal from "./add-variable-modal";
import FormulaDemoPreview from "./formula-demo-preview";
import IconSelector from "./icon-selector";
import { TemplateLibraryButton } from "./template-library";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Variable Card Component
function SortableVariableCard({ variable, onDelete, onUpdate, allVariables }: {
  variable: Variable;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Variable>) => void;
  allVariables: Variable[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* Variable Card with left padding for drag handle */}
      <div className="pl-8">
        <VariableCard
          variable={variable}
          onDelete={onDelete}
          onUpdate={onUpdate}
          allVariables={allVariables}
        />
      </div>
    </div>
  );
}


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
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [aiEditInstructions, setAiEditInstructions] = useState("");
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateName, setTemplateName] = useState("");
  const { toast } = useToast();

  // Save as Template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: async ({ category, templateName }: { category: string; templateName: string }) => {
      const response = await apiRequest("POST", `/api/formulas/${formula.id}/save-as-template`, {
        category,
        templateName
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template saved successfully!",
        description: "Your formula has been added to the template library.",
      });
      setShowSaveAsTemplateModal(false);
      setTemplateCategory("");
      setTemplateName("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save template",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const variables = formula.variables || [];
      const oldIndex = variables.findIndex((variable) => variable.id === active.id);
      const newIndex = variables.findIndex((variable) => variable.id === over.id);

      const reorderedVariables = arrayMove(variables, oldIndex, newIndex);
      onUpdate({ variables: reorderedVariables });
    }
  }

  const generateAIFormulaMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", "/api/formulas/generate", { description });
      return response.json();
    },
    onSuccess: (data) => {
      onUpdate({
        name: data.name,
        title: data.title,
        description: data.description,
        bulletPoints: data.bulletPoints,
        formula: data.formula,
        variables: data.variables,
        iconUrl: data.iconUrl
      });
      setShowAIBuilder(false);
      setAiDescription("");
      toast({
        title: "AI Formula Generated!",
        description: "Complete service details, variables, and pricing formula created. Review and customize as needed.",
      });
    },
    onError: (error) => {
      console.error('AI generation error:', error);
      toast({
        title: "AI Generation Failed",
        description: "Please try again with a different description.",
        variant: "destructive",
      });
    },
  });

  const editAIFormulaMutation = useMutation({
    mutationFn: async (editInstructions: string) => {
      const currentFormula = {
        name: formula.name,
        title: formula.title,
        description: formula.description || '',
        bulletPoints: formula.bulletPoints || [],
        formula: formula.formula,
        variables: formula.variables,
        iconUrl: formula.iconUrl || '🔧'
      };
      const response = await apiRequest("POST", "/api/formulas/edit", { 
        currentFormula, 
        editInstructions 
      });
      return response.json();
    },
    onSuccess: (data) => {
      onUpdate({
        name: data.name,
        title: data.title,
        description: data.description,
        bulletPoints: data.bulletPoints,
        formula: data.formula,
        variables: data.variables,
        iconUrl: data.iconUrl
      });
      setShowAIEditor(false);
      setAiEditInstructions("");
      toast({
        title: "AI Edit Complete!",
        description: "Formula has been updated with your requested changes.",
      });
    },
    onError: (error) => {
      console.error('AI edit error:', error);
      toast({
        title: "AI Edit Failed",
        description: "Please try again with different instructions.",
        variant: "destructive",
      });
    },
  });

  const handleAddVariable = (variable: Variable) => {
    const updatedVariables = [...formula.variables, variable];
    onUpdate({ variables: updatedVariables });
  };

  const handleDeleteVariable = (variableId: string) => {
    const updatedVariables = formula.variables.filter(v => v.id !== variableId);
    onUpdate({ variables: updatedVariables });
  };

  const handleUpdateVariable = (oldId: string, updates: Partial<Variable>) => {
    try {
      console.log('Updating variable with ID:', oldId, 'Updates:', updates);
      
      const updatedVariables = formula.variables.map(v => 
        v.id === oldId ? { ...v, ...updates } : v
      );
      
      console.log('Updated variables array:', updatedVariables);
      onUpdate({ variables: updatedVariables });
      
      console.log('Variable update successful');
    } catch (error) {
      console.error('Error in handleUpdateVariable:', error);
      toast({
        title: "Error updating variable",
        description: `Failed to update variable: ${(error as Error)?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
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
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 truncate">Formula Builder</h2>
                <p className="text-sm text-gray-500 truncate">{formula.name}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <TemplateLibraryButton />
                {(formula.variables.length > 0 || formula.formula) && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSaveAsTemplateModal(true)}
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Save as Template</span>
                    <span className="sm:hidden">Save</span>
                  </Button>
                )}
                {(formula.variables.length > 0 || formula.formula) && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAIEditor(true)}
                    className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Edit with AI</span>
                    <span className="sm:hidden">AI</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={onPreview}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Preview</span>
                  <span className="sm:hidden">View</span>
                </Button>
                <Button 
                  onClick={onSave} 
                  disabled={isSaving}
                  className="text-xs sm:text-sm px-3 sm:px-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {isSaving ? (
                    <span className="hidden sm:inline">Saving...</span>
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* AI Formula Generator - Show for new formulas */}
          {(!formula.variables.length && !formula.formula) && (
            <div className="p-6 border-b border-gray-200">
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Create Formula with AI
                  </CardTitle>
                  <p className="text-sm text-blue-700">
                    Describe your service and let AI create the calculation formula, variables, and pricing logic for you.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showAIBuilder ? (
                    <Button
                      onClick={() => setShowAIBuilder(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Formula with AI
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ai-description" className="text-blue-900 font-medium">
                          Describe your service
                        </Label>
                        <Textarea
                          id="ai-description"
                          value={aiDescription}
                          onChange={(e) => setAiDescription(e.target.value)}
                          placeholder="e.g., 'Create a bathroom renovation calculator that includes square footage, fixtures, tile type, and labor costs'"
                          className="mt-2 min-h-[100px] border-blue-200 focus:border-blue-500"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Be specific about the factors that affect pricing (materials, size, complexity, etc.)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => generateAIFormulaMutation.mutate(aiDescription)}
                          disabled={!aiDescription.trim() || generateAIFormulaMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {generateAIFormulaMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Formula
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAIBuilder(false)}
                          disabled={generateAIFormulaMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Formula Editor - Show when user wants to edit existing formula */}
          {showAIEditor && (
            <div className="p-6 border-b border-gray-200">
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Edit Formula with AI
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    Tell AI how to modify your formula. It can add/remove variables, update descriptions, and adjust pricing logic.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-edit-instructions" className="text-purple-900 font-medium">
                      What changes would you like to make?
                    </Label>
                    <Textarea
                      id="ai-edit-instructions"
                      value={aiEditInstructions}
                      onChange={(e) => setAiEditInstructions(e.target.value)}
                      placeholder="e.g., 'Add a variable for material quality with options for basic, premium, and luxury. Also update the description to mention eco-friendly materials.'"
                      className="mt-2 min-h-[100px] border-purple-200 focus:border-purple-500"
                    />
                    <p className="text-xs text-purple-600 mt-1">
                      Be specific about variables to add/remove, pricing changes, or description updates you want.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => editAIFormulaMutation.mutate(aiEditInstructions)}
                      disabled={!aiEditInstructions.trim() || editAIFormulaMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {editAIFormulaMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Editing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Apply Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAIEditor(false)}
                      disabled={editAIFormulaMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div>
                <Label htmlFor="formula-description">Service Description</Label>
                <Textarea
                  id="formula-description"
                  value={formula.description || ""}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Brief description of what this service includes..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="formula-bullet-points">Service Highlights (Bullet Points)</Label>
                <Textarea
                  id="formula-bullet-points"
                  value={(formula.bulletPoints || []).join('\n')}
                  onChange={(e) => {
                    const points = e.target.value.split('\n').filter(point => point.trim());
                    onUpdate({ bulletPoints: points });
                  }}
                  placeholder="Enter each highlight on a new line:&#10;Professional installation&#10;Premium materials included&#10;5-year warranty"
                  rows={4}
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
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">
                      Upload Service Image
                    </Label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('image', file);
                            
                            try {
                              const response = await fetch('/api/upload-image', {
                                method: 'POST',
                                body: formData,
                              });
                              const data = await response.json();
                              
                              if (response.ok) {
                                onUpdate({ imageUrl: data.url });
                              }
                            } catch (error) {
                              console.error('Error uploading image:', error);
                            }
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {formula.imageUrl && (
                        <div className="flex items-center gap-2">
                          <img src={formula.imageUrl} alt="Service preview" className="w-8 h-8 object-cover rounded border" />
                          <span className="text-xs text-green-600">✓ Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="image-url" className="text-xs font-medium text-gray-600">
                      Or use image URL
                    </Label>
                    <Input
                      id="image-url"
                      value={formula.imageUrl || ''}
                      onChange={(e) => onUpdate({ imageUrl: e.target.value || null })}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">Add an image to display alongside your service in the selector</p>
                </div>
              )}
              
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🎯</span>
                  Service Icon
                </Label>
                <IconSelector
                  selectedIconId={formula.iconId || undefined}
                  onIconSelect={(iconId, iconUrl) => {
                    onUpdate({ 
                      iconId: iconId, 
                      iconUrl: iconUrl 
                    });
                  }}
                  triggerText="Choose Icon"
                  size="md"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Select a professional icon from our library to represent this service
                </p>
                
                {/* Custom Icon Upload/URL as fallback */}
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="custom-icon-upload" className="text-xs font-medium text-gray-600">
                      Upload custom icon
                    </Label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="file"
                        id="custom-icon-upload"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('icon', file);
                            
                            try {
                              const response = await fetch('/api/upload/icon', {
                                method: 'POST',
                                body: formData,
                              });
                              const data = await response.json();
                              
                              if (response.ok) {
                                onUpdate({ iconUrl: data.iconUrl, iconId: null });
                              }
                            } catch (error) {
                              console.error('Error uploading icon:', error);
                            }
                          }
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {formula.iconUrl && !formula.iconId && (
                        <div className="flex items-center gap-1">
                          <img src={formula.iconUrl} alt="Icon preview" className="w-4 h-4 object-cover rounded" />
                          <span className="text-xs text-green-600">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-icon" className="text-xs font-medium text-gray-600">
                      Or use custom icon URL
                    </Label>
                    <Input
                      id="custom-icon"
                      value={formula.iconUrl || ''}
                      onChange={(e) => onUpdate({ iconUrl: e.target.value || null, iconId: null })}
                      placeholder="https://example.com/icon.svg or emoji 🏠"
                      className="mt-1 h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Measure Map Controls */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    <Label htmlFor="enable-measure-map">Enable Measure Map Tool</Label>
                  </div>
                  <Switch
                    id="enable-measure-map"
                    checked={formula.enableMeasureMap || false}
                    onCheckedChange={(checked) => onUpdate({ enableMeasureMap: checked })}
                  />
                </div>
                
                {formula.enableMeasureMap && (
                  <div className="space-y-3 pl-6">
                    <div>
                      <Label htmlFor="measure-type">Measurement Type</Label>
                      <Select
                        value={formula.measureMapType || "area"}
                        onValueChange={(value) => onUpdate({ measureMapType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="area">Area (for surfaces, roofs, etc.)</SelectItem>
                          <SelectItem value="distance">Distance (for gutters, fencing, etc.)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="measure-unit">Unit of Measurement</Label>
                      <Select
                        value={formula.measureMapUnit || "sqft"}
                        onValueChange={(value) => onUpdate({ measureMapUnit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {formula.measureMapType === "area" ? (
                            <>
                              <SelectItem value="sqft">Square Feet (sq ft)</SelectItem>
                              <SelectItem value="sqm">Square Meters (sq m)</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="ft">Feet (ft)</SelectItem>
                              <SelectItem value="m">Meters (m)</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                      When enabled, customers can use Google Maps to measure their property for accurate pricing. 
                      The measurement will automatically populate relevant calculator variables.
                    </p>
                  </div>
                )}
              </div>

              {/* Upsell Items Section - Compact */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <Label className="text-sm">Upsell Items</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newUpsell = {
                        id: `upsell_${Date.now()}`,
                        name: "New Upsell",
                        description: "Add description here",
                        category: "addon",
                        percentageOfMain: 15,
                        isPopular: false,
                        iconUrl: "",
                        imageUrl: "",
                        tooltip: ""
                      };
                      onUpdate({ 
                        upsellItems: [...(formula.upsellItems || []), newUpsell] 
                      });
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {(formula.upsellItems || []).map((upsell, index) => (
                    <div key={upsell.id} className="border rounded-md p-2 space-y-2 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">#{index + 1}</span>
                          {upsell.isPopular && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-1 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={upsell.isPopular || false}
                            onCheckedChange={(checked) => {
                              const updatedUpsells = (formula.upsellItems || []).map(u => 
                                u.id === upsell.id ? { ...u, isPopular: checked } : u
                              );
                              onUpdate({ upsellItems: updatedUpsells });
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedUpsells = (formula.upsellItems || []).filter(u => u.id !== upsell.id);
                              onUpdate({ upsellItems: updatedUpsells });
                            }}
                            className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={upsell.name}
                            onChange={(e) => {
                              const updatedUpsells = (formula.upsellItems || []).map(u => 
                                u.id === upsell.id ? { ...u, name: e.target.value } : u
                              );
                              onUpdate({ upsellItems: updatedUpsells });
                            }}
                            placeholder="Premium Protection"
                            className="h-8 text-xs"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Percentage (%)</Label>
                          <Input
                            type="number"
                            value={upsell.percentageOfMain}
                            onChange={(e) => {
                              const updatedUpsells = (formula.upsellItems || []).map(u => 
                                u.id === upsell.id ? { ...u, percentageOfMain: Number(e.target.value) } : u
                              );
                              onUpdate({ upsellItems: updatedUpsells });
                            }}
                            placeholder="15"
                            min="1"
                            max="100"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={upsell.category}
                            onValueChange={(value) => {
                              const updatedUpsells = (formula.upsellItems || []).map(u => 
                                u.id === upsell.id ? { ...u, category: value } : u
                              );
                              onUpdate({ upsellItems: updatedUpsells });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="protection">Protection</SelectItem>
                              <SelectItem value="addon">Add-on</SelectItem>
                              <SelectItem value="upgrade">Upgrade</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Tooltip</Label>
                          <Input
                            value={upsell.tooltip || ""}
                            onChange={(e) => {
                              const updatedUpsells = (formula.upsellItems || []).map(u => 
                                u.id === upsell.id ? { ...u, tooltip: e.target.value } : u
                              );
                              onUpdate({ upsellItems: updatedUpsells });
                            }}
                            placeholder="Help text..."
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={upsell.description}
                          onChange={(e) => {
                            const updatedUpsells = (formula.upsellItems || []).map(u => 
                              u.id === upsell.id ? { ...u, description: e.target.value } : u
                            );
                            onUpdate({ upsellItems: updatedUpsells });
                          }}
                          placeholder="Describe what this upsell offers..."
                          rows={1}
                          className="text-xs resize-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Icon Upload</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('icon', file);
                                
                                try {
                                  const response = await fetch('/api/upload/icon', {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  const data = await response.json();
                                  
                                  if (response.ok) {
                                    const updatedUpsells = (formula.upsellItems || []).map(u => 
                                      u.id === upsell.id ? { ...u, iconUrl: data.iconUrl } : u
                                    );
                                    onUpdate({ upsellItems: updatedUpsells });
                                  }
                                } catch (error) {
                                  console.error('Error uploading icon:', error);
                                }
                              }
                            }}
                            className="text-xs w-full p-1 border border-gray-300 rounded"
                          />
                          {upsell.iconUrl && (
                            <div className="mt-1 flex items-center gap-1">
                              <img src={upsell.iconUrl} alt="Icon" className="w-4 h-4 object-cover rounded" />
                              <span className="text-xs text-green-600">✓</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-xs">Image Upload</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('icon', file);
                                
                                try {
                                  const response = await fetch('/api/upload/icon', {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  const data = await response.json();
                                  
                                  if (response.ok) {
                                    const updatedUpsells = (formula.upsellItems || []).map(u => 
                                      u.id === upsell.id ? { ...u, imageUrl: data.iconUrl } : u
                                    );
                                    onUpdate({ upsellItems: updatedUpsells });
                                  }
                                } catch (error) {
                                  console.error('Error uploading image:', error);
                                }
                              }
                            }}
                            className="text-xs w-full p-1 border border-gray-300 rounded"
                          />
                          {upsell.imageUrl && (
                            <div className="mt-1 flex items-center gap-1">
                              <img src={upsell.imageUrl} alt="Preview" className="w-4 h-4 object-cover rounded" />
                              <span className="text-xs text-green-600">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(formula.upsellItems || []).length === 0 && (
                    <div className="text-center py-2 text-gray-500 text-xs">
                      No upsell items configured. Add some to offer additional services to customers.
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded mt-2">
                  Upsell items are shown to customers after they configure their main service. 
                  Pricing is calculated as a percentage of their main service total.
                </p>
              </div>
            </div>
          </div>

          {/* Variables Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Variables</h3>
              {(formula.variables || []).length > 0 && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  Drag to reorder
                </p>
              )}
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={(formula.variables || []).map(v => v.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(formula.variables || []).map((variable) => (
                    <SortableVariableCard
                      key={variable.id}
                      variable={variable}
                      onDelete={handleDeleteVariable}
                      onUpdate={handleUpdateVariable}
                      allVariables={formula.variables || []}
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
              </SortableContext>
            </DndContext>
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
              {(formula.variables || []).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="text-xs font-medium text-blue-900 mb-2">Available Variable IDs:</h4>
                  <div className="flex flex-wrap gap-1">
                    {(formula.variables || []).map((variable) => (
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



      </div>

      <AddVariableModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        onAddVariable={handleAddVariable}
      />

      {/* Save as Template Modal */}
      <Dialog open={showSaveAsTemplateModal} onOpenChange={setShowSaveAsTemplateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Kitchen Remodel Calculator"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="template-category">Category</Label>
              <Select value={templateCategory} onValueChange={setTemplateCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="home-improvement">Home Improvement</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="professional-services">Professional Services</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSaveAsTemplateModal(false)}
              disabled={saveAsTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => saveAsTemplateMutation.mutate({ 
                category: templateCategory, 
                templateName: templateName || formula.name 
              })}
              disabled={!templateCategory || saveAsTemplateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {saveAsTemplateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
