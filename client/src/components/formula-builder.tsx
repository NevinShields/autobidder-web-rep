import { useState, useEffect } from "react";
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
import { Eye, Save, Plus, Video, Image, Sparkles, Wand2, Loader2, Map, GripVertical, BookOpen, X, Camera, Trash2, Upload, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import VariableCard from "./variable-card";
import AddVariableModal from "./add-variable-modal";
import FormulaDemoPreview from "./formula-demo-preview";
import IconSelector from "./icon-selector";
import { TemplateLibraryButton } from "./template-library";
import { ObjectUploader } from "@/components/ObjectUploader";
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

function RefinePromptButton({ formula, onUpdate }: { formula: Formula; onUpdate: (formula: Partial<Formula>) => void }) {
  const [isRefining, setIsRefining] = useState(false);
  const { toast } = useToast();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!formula.photoMeasurementSetup?.objectDescription?.trim() || isRefining}
      onClick={async () => {
        if (!formula.photoMeasurementSetup?.objectDescription?.trim()) return;
        
        setIsRefining(true);
        try {
          const response = await fetch('/api/photo-measurement/refine-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: formula.photoMeasurementSetup.objectDescription,
              measurementType: formula.photoMeasurementSetup.measurementType || 'area'
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            const setup = formula.photoMeasurementSetup!;
            onUpdate({ 
              photoMeasurementSetup: {
                ...setup,
                objectDescription: data.refinedDescription
              }
            });
            toast({
              title: "Prompt Refined!",
              description: "Your description has been optimized for better AI measurement accuracy."
            });
          } else {
            toast({
              variant: "destructive",
              title: "Refinement Failed",
              description: data.message || "Could not refine the prompt"
            });
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to refine prompt"
          });
        } finally {
          setIsRefining(false);
        }
      }}
      className="h-7 text-xs"
    >
      {isRefining ? (
        <>
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Refining...
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 mr-1" />
          Refine Prompt
        </>
      )}
    </Button>
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
  const [minPriceDollars, setMinPriceDollars] = useState(formula.minPrice ? (formula.minPrice / 100).toString() : '');
  const [maxPriceDollars, setMaxPriceDollars] = useState(formula.maxPrice ? (formula.maxPrice / 100).toString() : '');
  const [showMediaSection, setShowMediaSection] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [selectedAIProvider, setSelectedAIProvider] = useState("openai");
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [aiEditInstructions, setAiEditInstructions] = useState("");
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateIconId, setTemplateIconId] = useState<number | null>(formula.iconId || null);
  const [templateIconUrl, setTemplateIconUrl] = useState<string | null>(formula.iconUrl || null);
  const { toast } = useToast();

  // Sync local formulaExpression state when formula.formula changes (e.g., after AI generation)
  useEffect(() => {
    setFormulaExpression(formula.formula);
  }, [formula.formula]);

  // Fetch template categories for the save as template dialog
  const { data: templateCategories } = useQuery<Array<{ id: number; name: string; isActive: boolean }>>({
    queryKey: ['/api/template-categories'],
  });

  // Reset template modal state
  const resetTemplateModal = () => {
    setTemplateCategory("");
    setTemplateName("");
    setTemplateIconId(formula.iconId || null);
    setTemplateIconUrl(formula.iconUrl || null);
  };

  // Save as Template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: async ({ category, templateName, iconId, iconUrl }: { 
      category: string; 
      templateName: string;
      iconId?: number | null;
      iconUrl?: string | null;
    }) => {
      const response = await apiRequest("POST", `/api/formulas/${formula.id}/save-as-template`, {
        category,
        templateName,
        iconId,
        iconUrl
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template saved successfully!",
        description: "Your formula has been added to the template library.",
      });
      setShowSaveAsTemplateModal(false);
      resetTemplateModal();
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
      const response = await apiRequest("POST", "/api/formulas/generate", { 
        description, 
        provider: selectedAIProvider 
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
        editInstructions,
        provider: selectedAIProvider 
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

  const handleMinPriceChange = (value: string) => {
    setMinPriceDollars(value);
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      onUpdate({ minPrice: null });
    } else {
      onUpdate({ minPrice: Math.round(numValue * 100) });
    }
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPriceDollars(value);
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      onUpdate({ maxPrice: null });
    } else {
      onUpdate({ maxPrice: Math.round(numValue * 100) });
    }
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
    <div className="max-w-7xl mx-auto">
      {/* Formula Builder */}
      <div className="w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">Formula Builder</h2>
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
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
                        <Label htmlFor="ai-provider" className="text-blue-900 font-medium">
                          AI Provider
                        </Label>
                        <Select value={selectedAIProvider} onValueChange={setSelectedAIProvider}>
                          <SelectTrigger className="mt-2 border-blue-200 focus:border-blue-500">
                            <SelectValue placeholder="Choose AI provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI (GPT-4o) - Advanced</SelectItem>
                            <SelectItem value="claude">Claude 3.5 Sonnet - Intelligent</SelectItem>
                            <SelectItem value="gemini">Google Gemini - Versatile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Edit Formula with AI
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    Tell AI how to modify your formula. It can add/remove variables, update descriptions, adjust pricing logic, and create conditional questions that show/hide based on previous answers.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-provider-edit" className="text-purple-900 font-medium">
                      AI Provider
                    </Label>
                    <Select value={selectedAIProvider} onValueChange={setSelectedAIProvider}>
                      <SelectTrigger className="mt-2 border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="Choose AI provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI (GPT-4o) - Advanced</SelectItem>
                        <SelectItem value="claude">Claude 3.5 Sonnet - Intelligent</SelectItem>
                        <SelectItem value="gemini">Google Gemini - Versatile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ai-edit-instructions" className="text-purple-900 font-medium">
                      What changes would you like to make?
                    </Label>
                    <Textarea
                      id="ai-edit-instructions"
                      value={aiEditInstructions}
                      onChange={(e) => setAiEditInstructions(e.target.value)}
                      placeholder="e.g., 'Add a checkbox asking if the house has a detached garage, and if yes, show a follow-up question asking for the garage size with options: 1-car, 2-car, 3-car'"
                      className="mt-2 min-h-[100px] border-purple-200 focus:border-purple-500"
                    />
                    <p className="text-xs text-purple-600 mt-1">
                      You can add variables, conditional questions (that show based on previous answers), update pricing, or modify descriptions.
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

          {/* Basic Details Section - Compact */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Icon */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {formula.iconUrl ? (
                    <div className="relative group">
                      <img src={formula.iconUrl} alt="Icon" className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200" />
                      <button
                        onClick={() => onUpdate({ iconUrl: null, iconId: null })}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-2xl">🔧</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <IconSelector
                    selectedIconId={formula.iconId || undefined}
                    onIconSelect={(iconId, iconUrl) => onUpdate({ iconId, iconUrl })}
                    triggerText="Icon"
                    size="sm"
                  />
                  <label className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('icon', file);
                          try {
                            const response = await fetch('/api/upload/icon', { method: 'POST', body: formData });
                            const data = await response.json();
                            if (response.ok) {
                              onUpdate({ iconUrl: data.iconUrl, iconId: null });
                              toast({ title: "Icon uploaded" });
                            }
                          } catch (error) {
                            toast({ title: "Upload failed", variant: "destructive" });
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Service Name */}
              <div className="sm:col-span-1 lg:col-span-1">
                <Label htmlFor="formula-name" className="text-xs text-gray-500 mb-1 block">Service Name *</Label>
                <Input
                  id="formula-name"
                  value={formula.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="Kitchen Remodel"
                  className="h-9"
                />
              </div>

              {/* Calculator Title */}
              <div className="sm:col-span-2 lg:col-span-2">
                <Label htmlFor="formula-title" className="text-xs text-gray-500 mb-1 block">Calculator Title</Label>
                <Input
                  id="formula-title"
                  value={formula.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Get Your Kitchen Remodel Quote"
                  className="h-9"
                />
              </div>
            </div>

          </div>

          {/* Media & Advanced Settings - Collapsible */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowMediaSection(!showMediaSection)}
              className="w-full px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Media & Settings</span>
                {(formula.description || (formula.bulletPoints && formula.bulletPoints.length > 0) || formula.guideVideoUrl || formula.showImage || formula.enableMeasureMap || formula.enablePhotoMeasurement) && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
              {showMediaSection ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {showMediaSection && (
              <div className="px-4 sm:px-6 pb-4 space-y-4">
                {/* Description & Bullet Points */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="formula-description" className="text-xs text-gray-500 mb-1 block">Description</Label>
                    <Textarea
                      id="formula-description"
                      value={formula.description || ""}
                      onChange={(e) => onUpdate({ description: e.target.value })}
                      placeholder="Brief description of this service..."
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="formula-bullet-points" className="text-xs text-gray-500 mb-1 block">Highlights (one per line)</Label>
                    <Textarea
                      id="formula-bullet-points"
                      value={(formula.bulletPoints || []).join('\n')}
                      onChange={(e) => onUpdate({ bulletPoints: e.target.value.split('\n') })}
                      onBlur={(e) => onUpdate({ bulletPoints: e.target.value.split('\n').filter(p => p.trim()) })}
                      placeholder="Professional installation&#10;Premium materials&#10;5-year warranty"
                      rows={3}
                      className="text-sm resize-none"
                      data-testid="textarea-bullet-points"
                    />
                  </div>
                </div>

                {/* Video & Image Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guide-video" className="text-xs text-gray-500 mb-1 block">Guide Video URL</Label>
                    <Input
                      id="guide-video"
                      value={formula.guideVideoUrl || ''}
                      onChange={(e) => onUpdate({ guideVideoUrl: e.target.value || null })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Service Image</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-image"
                        checked={formula.showImage}
                        onCheckedChange={(checked) => onUpdate({ showImage: checked })}
                      />
                      <span className="text-xs text-gray-600">{formula.showImage ? 'Enabled' : 'Disabled'}</span>
                      {formula.showImage && formula.imageUrl && (
                        <img src={formula.imageUrl} alt="Preview" className="w-8 h-8 object-cover rounded border ml-2" />
                      )}
                    </div>
                  </div>
                </div>

                {formula.showImage && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('image', file);
                          try {
                            const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
                            const data = await response.json();
                            if (response.ok) onUpdate({ imageUrl: data.url });
                          } catch (error) {
                            console.error('Error uploading image:', error);
                          }
                        }
                      }}
                      className="text-xs flex-1"
                    />
                    <span className="text-xs text-gray-500">or</span>
                    <Input
                      value={formula.imageUrl || ''}
                      onChange={(e) => onUpdate({ imageUrl: e.target.value || null })}
                      placeholder="Image URL"
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Map className="w-4 h-4 text-gray-500" />
                      <span className="text-sm dark:text-gray-200">Measure Map</span>
                    </div>
                    <Switch
                      checked={formula.enableMeasureMap || false}
                      onCheckedChange={(checked) => onUpdate({ enableMeasureMap: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-gray-500" />
                      <span className="text-sm dark:text-gray-200">AI Photo Measure</span>
                    </div>
                    <Switch
                      checked={formula.enablePhotoMeasurement || false}
                      onCheckedChange={(checked) => onUpdate({ enablePhotoMeasurement: checked })}
                    />
                  </div>
                </div>

                {formula.enableMeasureMap && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-blue-700">Unit:</Label>
                      <Select
                        value={formula.measureMapUnit || "sqft"}
                        onValueChange={(value) => onUpdate({ measureMapUnit: value })}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sqft">Square Feet</SelectItem>
                          <SelectItem value="sqm">Square Meters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {formula.enablePhotoMeasurement && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs text-purple-700">Object Description</Label>
                          <RefinePromptButton formula={formula} onUpdate={onUpdate} />
                        </div>
                        <Textarea
                          value={formula.photoMeasurementSetup?.objectDescription || ''}
                          onChange={(e) => {
                            const setup = formula.photoMeasurementSetup || { objectDescription: '', measurementType: 'area' as const, referenceImages: [] };
                            onUpdate({ photoMeasurementSetup: { ...setup, objectDescription: e.target.value } });
                          }}
                          placeholder="E.g., 'Residential house roof'"
                          rows={2}
                          className="text-xs resize-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-purple-700 mb-1 block">Customer Instructions</Label>
                        <Textarea
                          value={formula.photoMeasurementSetup?.customerInstructions || ''}
                          onChange={(e) => {
                            const setup = formula.photoMeasurementSetup || { objectDescription: '', measurementType: 'area' as const, referenceImages: [] };
                            onUpdate({ photoMeasurementSetup: { ...setup, customerInstructions: e.target.value } });
                          }}
                          placeholder="E.g., 'Take photos from different angles'"
                          rows={2}
                          className="text-xs resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-purple-700">Measure:</Label>
                      <Select
                        value={formula.photoMeasurementSetup?.measurementType || "area"}
                        onValueChange={(value: 'area' | 'length' | 'width' | 'height' | 'perimeter') => {
                          const setup = formula.photoMeasurementSetup || { objectDescription: '', measurementType: 'area' as const, referenceImages: [] };
                          onUpdate({ photoMeasurementSetup: { ...setup, measurementType: value } });
                        }}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="area">Area (sq ft)</SelectItem>
                          <SelectItem value="length">Length (ft)</SelectItem>
                          <SelectItem value="width">Width (ft)</SelectItem>
                          <SelectItem value="height">Height (ft)</SelectItem>
                          <SelectItem value="perimeter">Perimeter (ft)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Upsell Items - Compact Toggle */}
                <div className="pt-2 border-t dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-500" />
                      <span className="text-sm dark:text-gray-200">Upsell Items</span>
                      {(formula.upsellItems || []).length > 0 && (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">{formula.upsellItems?.length}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const newUpsell = {
                          id: `upsell_${Date.now()}`,
                          name: "New Upsell",
                          description: "Add description",
                          category: "addon",
                          percentageOfMain: 15,
                          isPopular: false,
                          iconUrl: "",
                          imageUrl: "",
                          tooltip: ""
                        };
                        onUpdate({ upsellItems: [...(formula.upsellItems || []), newUpsell] });
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {(formula.upsellItems || []).length > 0 && (
                    <div className="mt-2 space-y-2">
                      {(formula.upsellItems || []).map((upsell, index) => (
                        <div key={upsell.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Input
                              value={upsell.name}
                              onChange={(e) => {
                                const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? { ...u, name: e.target.value } : u);
                                onUpdate({ upsellItems: updated });
                              }}
                              placeholder="Name"
                              className="h-8 text-xs"
                            />
                            <Input
                              type="number"
                              value={upsell.percentageOfMain}
                              onChange={(e) => {
                                const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? { ...u, percentageOfMain: Number(e.target.value) } : u);
                                onUpdate({ upsellItems: updated });
                              }}
                              placeholder="%"
                              className="h-8 text-xs"
                            />
                            <Select
                              value={upsell.category}
                              onValueChange={(value) => {
                                const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? { ...u, category: value } : u);
                                onUpdate({ upsellItems: updated });
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
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={upsell.isPopular || false}
                                onCheckedChange={(checked) => {
                                  const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? { ...u, isPopular: checked } : u);
                                  onUpdate({ upsellItems: updated });
                                }}
                              />
                              <span className="text-xs text-gray-500">Popular</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdate({ upsellItems: (formula.upsellItems || []).filter(u => u.id !== upsell.id) })}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Variables Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Variables</h3>
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
                <div className="grid grid-cols-1 gap-4">
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
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Pricing Formula</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="formula-expression">Formula Expression</Label>
                <textarea
                  id="formula-expression"
                  value={formulaExpression}
                  onChange={(e) => handleFormulaChange(e.target.value)}
                  placeholder="e.g., squareFootage * 25 + laborHours * 85"
                  className="w-full min-h-[80px] p-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              {/* Available Variables */}
              {(formula.variables || []).length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">Available Variable IDs:</h4>
                  <div className="flex flex-wrap gap-1">
                    {(formula.variables || []).map((variable) => {
                      const insertVariable = (id: string) => {
                        const textarea = document.getElementById('formula-expression') as HTMLTextAreaElement;
                        if (textarea) {
                          const cursorPos = textarea.selectionStart;
                          const newValue = formulaExpression.slice(0, cursorPos) + id + formulaExpression.slice(cursorPos);
                          handleFormulaChange(newValue);
                          setTimeout(() => {
                            textarea.setSelectionRange(cursorPos + id.length, cursorPos + id.length);
                            textarea.focus();
                          }, 10);
                        }
                      };

                      const isMultiSelect = variable.type === 'multiple-choice' && variable.allowMultipleSelection;
                      
                      return (
                        <div key={variable.id} className="contents">
                          {/* Show base ID only if NOT a multi-select multiple-choice */}
                          {!isMultiSelect && (
                            <code
                              className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                              onClick={() => insertVariable(variable.id)}
                            >
                              {variable.id}
                            </code>
                          )}

                          {/* Show individual option IDs for multi-select multiple-choice */}
                          {isMultiSelect && variable.options?.map((option, optIndex) => {
                            const optionId = option.id || option.value || `option_${optIndex}`;
                            return (
                              <code
                                key={`${variable.id}_${optionId}`}
                                className="inline-block px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs rounded cursor-pointer hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                                onClick={() => insertVariable(`${variable.id}_${optionId}`)}
                                title={`${option.label}: ${option.numericValue || 0}`}
                              >
                                {variable.id}_{optionId}
                              </code>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Click on a variable ID to insert it into your formula. <span className="text-green-700 dark:text-green-300 font-medium">Green IDs</span> are individual options from multi-select variables.
                  </p>
                </div>
              )}
              
              {/* Min/Max Price Constraints */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-price">Minimum Price (optional)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="min-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={minPriceDollars}
                      onChange={(e) => handleMinPriceChange(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                      data-testid="input-min-price"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    If the calculated price is below this, show this minimum instead
                  </p>
                </div>
                <div>
                  <Label htmlFor="max-price">Maximum Price (optional)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="max-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={maxPriceDollars}
                      onChange={(e) => handleMaxPriceChange(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                      data-testid="input-max-price"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    If the calculated price is above this, show this maximum instead
                  </p>
                </div>
              </div>
              
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



      <AddVariableModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        onAddVariable={handleAddVariable}
      />

      {/* Save as Template Modal */}
      <Dialog open={showSaveAsTemplateModal} onOpenChange={(open) => {
        setShowSaveAsTemplateModal(open);
        if (!open) resetTemplateModal();
      }}>
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
                  {templateCategories?.filter(c => c.isActive).map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Template Icon</Label>
              <div className="mt-1">
                <IconSelector
                  selectedIconId={templateIconId}
                  onIconSelect={(iconId, iconUrl) => {
                    setTemplateIconId(iconId);
                    setTemplateIconUrl(iconUrl);
                  }}
                  triggerText={templateIconId ? "Change Icon" : "Select Icon"}
                  size="md"
                />
                {templateIconUrl && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <img src={templateIconUrl} alt="Selected icon" className="w-6 h-6 object-contain" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Template icon selected</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTemplateIconId(null);
                        setTemplateIconUrl(null);
                      }}
                      className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSaveAsTemplateModal(false);
                resetTemplateModal();
              }}
              disabled={saveAsTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => saveAsTemplateMutation.mutate({ 
                category: templateCategory, 
                templateName: templateName || formula.name,
                iconId: templateIconId,
                iconUrl: templateIconUrl
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
