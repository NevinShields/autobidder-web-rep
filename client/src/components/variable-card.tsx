import { useState } from "react";
import { Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { X, Edit3, Check, DollarSign, Settings, Plus, Trash2, GripVertical, Upload, Image, Zap, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { getAvailableDependencies, getConditionLabel, getAvailableConditions } from "@shared/conditional-logic";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

interface VariableCardProps {
  variable: Variable;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Variable>) => void;
  allVariables?: Variable[]; // For conditional logic dependencies
}

interface SortableOptionItemProps {
  option: { label: string; value: string | number; numericValue?: number; image?: string };
  index: number;
  onUpdate: (index: number, updates: { label?: string; numericValue?: number; value?: string | number; image?: string }) => void;
  onDelete: (index: number) => void;
}

function SortableOptionItem({ option, index, onUpdate, onDelete }: SortableOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `option-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert('Please select an image smaller than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        onUpdate(index, { image: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 rounded border p-3 space-y-3"
    >
      {/* Header Row - Drag Handle, Image, and Delete */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex-shrink-0 p-1"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          
          {/* Image preview and upload */}
          <div className="flex flex-col items-center">
            {option.image ? (
              <div className="relative">
                <img 
                  src={option.image} 
                  alt={option.label} 
                  className="w-10 h-10 object-cover rounded border-2 border-gray-300"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate(index, { image: '' })}
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-red-400 hover:text-red-600 bg-white rounded-full border"
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          className="text-red-400 hover:text-red-600 p-2 h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Input Fields - Stacked on Mobile, Side by Side on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-600 block mb-1">Option Label</Label>
          <Input
            placeholder="Enter option name"
            value={option.label}
            onChange={(e) => {
              const label = e.target.value;
              // Auto-generate value from label (lowercase, replace spaces with underscores)
              const baseValue = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
              // Ensure uniqueness by appending index to prevent duplicate values
              const value = baseValue + '_' + index;
              onUpdate(index, { label, value });
            }}
            className="h-9 text-sm"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-600 block mb-1">Price Value</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={option.numericValue || ''}
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
              onUpdate(index, { numericValue: value });
            }}
            className="h-9 text-sm"
          />
        </div>
      </div>
      
      {/* Generated Value Display */}
      {option.label && (
        <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
          <span className="text-xs text-blue-700">
            Generated ID: <code className="font-mono">{option.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + index}</code>
          </span>
        </div>
      )}
    </div>
  );
}

// Helper functions for default value configuration
function getDefaultValuePlaceholder(variableType: string): string {
  switch (variableType) {
    case 'number':
    case 'slider':
      return 'e.g., 1 (for multiplication) or 0 (for addition)';
    case 'checkbox':
      return 'true or false';
    case 'select':
    case 'dropdown':
      return 'Enter option value';
    case 'multiple-choice':
      return 'Enter comma-separated values';
    default:
      return 'Enter default value';
  }
}

function getDefaultValueDescription(variableType: string): string {
  switch (variableType) {
    case 'number':
    case 'slider':
      return 'Use 1 for multiplication formulas, 0 for addition formulas';
    case 'checkbox':
      return 'Value when checkbox is hidden (true/false)';
    case 'select':
    case 'dropdown':
      return 'Use 1 for multiplication, 0 for addition, or select a specific option';
    case 'multiple-choice':
      return 'Default selected values when hidden';
    default:
      return 'Value to use when this variable is hidden';
  }
}

export default function VariableCard({ variable, onDelete, onUpdate, allVariables = [] }: VariableCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(variable.name);
  const [isEditingId, setIsEditingId] = useState(false);
  const [editId, setEditId] = useState(variable.id);
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [editUnit, setEditUnit] = useState(variable.unit || '');
  const [isEditingType, setIsEditingType] = useState(false);
  const [editType, setEditType] = useState(variable.type);
  const [showPricingDetails, setShowPricingDetails] = useState(false);  
  const [showConditionalLogic, setShowConditionalLogic] = useState(false);
  const [isEditingTooltip, setIsEditingTooltip] = useState(false);
  const [editTooltip, setEditTooltip] = useState(variable.tooltip || '');
  // Slider editing state
  const [isEditingSlider, setIsEditingSlider] = useState(false);
  const [editMin, setEditMin] = useState(variable.min || 0);
  const [editMax, setEditMax] = useState(variable.max || 100);
  const [editStep, setEditStep] = useState(variable.step || 1);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSaveName = () => {
    if (onUpdate && editName.trim() && editName !== variable.name) {
      onUpdate(variable.id, { name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setEditName(variable.name);
  };

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

  const handleSaveTooltip = () => {
    if (onUpdate) {
      const trimmedTooltip = editTooltip.trim();
      onUpdate(variable.id, { tooltip: trimmedTooltip || undefined });
    }
    setIsEditingTooltip(false);
  };

  const handleCancelTooltipEdit = () => {
    setIsEditingTooltip(false);
    setEditTooltip(variable.tooltip || '');
  };

  const handleSaveUnit = () => {
    if (onUpdate) {
      // Limit to 15 characters
      const trimmedUnit = editUnit.trim().substring(0, 15);
      onUpdate(variable.id, { unit: trimmedUnit || undefined });
    }
    setIsEditingUnit(false);
  };

  const handleCancelUnitEdit = () => {
    setIsEditingUnit(false);
    setEditUnit(variable.unit || '');
  };

  const handleSaveType = () => {
    if (onUpdate && editType !== variable.type) {
      // When changing type, handle options properly
      const needsOptions = ['select', 'dropdown', 'multiple-choice'].includes(editType);
      const hadOptions = ['select', 'dropdown', 'multiple-choice'].includes(variable.type);
      
      let updates: Partial<Variable> = { type: editType };
      
      if (needsOptions && !hadOptions) {
        // Adding options for first time
        updates.options = [{ label: "Option 1", value: "option_1", numericValue: 0, image: "" }];
      } else if (!needsOptions && hadOptions) {
        // Removing options when switching to non-option types
        updates.options = undefined;
      } else if (needsOptions && hadOptions) {
        // Keep existing options when switching between option-based types
        // Ensure all options have required properties
        updates.options = (variable.options || []).map(option => ({
          label: option.label || "Option",
          value: option.value || "option",
          numericValue: option.numericValue || 0,
          image: option.image || ""
        }));
      }
      
      // Handle special type-specific properties
      if (editType === 'slider') {
        updates.min = variable.min || 0;
        updates.max = variable.max || 100;
        updates.step = variable.step || 1;
      } else if (editType === 'checkbox') {
        // Checkbox doesn't need options array
        updates.options = undefined;
      }
      
      try {
        console.log('Changing variable type from', variable.type, 'to', editType);
        console.log('Variable updates:', updates);
        onUpdate(variable.id, updates);
        console.log('Variable type update successful');
      } catch (error) {
        console.error('Error updating variable type from', variable.type, 'to', editType, ':', error);
        alert(`Error changing variable type: ${(error as Error)?.message || 'Unknown error'}`);
        // Don't change the edit state if there was an error
        return;
      }
    }
    setIsEditingType(false);
  };

  const handleCancelTypeEdit = () => {
    setIsEditingType(false);
    setEditType(variable.type);
  };

  const handleSaveSlider = () => {
    if (onUpdate) {
      const trimmedUnit = editUnit.trim().substring(0, 15);
      onUpdate(variable.id, { 
        min: editMin, 
        max: editMax, 
        step: editStep,
        unit: trimmedUnit || undefined
      });
    }
    setIsEditingSlider(false);
  };

  const handleCancelSliderEdit = () => {
    setIsEditingSlider(false);
    setEditMin(variable.min || 0);
    setEditMax(variable.max || 100);
    setEditStep(variable.step || 1);
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

  const handleOptionUpdate = (optionIndex: number, updates: { label?: string; numericValue?: number; value?: string | number; image?: string }) => {
    if (!onUpdate || !variable.options) return;
    
    const updatedOptions = variable.options.map((option, index) => 
      index === optionIndex 
        ? { ...option, ...updates }
        : option
    );
    
    onUpdate(variable.id, { options: updatedOptions });
  };

  const handleAddOption = () => {
    if (!onUpdate) return;
    
    const optionNumber = (variable.options?.length || 0) + 1;
    const newOption = {
      label: `Option ${optionNumber}`,
      value: `option_${optionNumber}`,
      numericValue: 0,
      image: ""
    };
    
    const updatedOptions = [...(variable.options || []), newOption];
    onUpdate(variable.id, { options: updatedOptions });
  };

  const handleDeleteOption = (optionIndex: number) => {
    if (!onUpdate || !variable.options) return;
    
    const updatedOptions = variable.options.filter((_, index) => index !== optionIndex);
    onUpdate(variable.id, { options: updatedOptions });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !variable.options || !onUpdate) return;

    const activeIndex = parseInt(active.id.toString().replace('option-', ''));
    const overIndex = parseInt(over.id.toString().replace('option-', ''));

    if (activeIndex !== overIndex) {
      const reorderedOptions = arrayMove(variable.options, activeIndex, overIndex);
      onUpdate(variable.id, { options: reorderedOptions });
    }
  };

  // Conditional logic handlers
  const handleConditionalLogicChange = (updates: Partial<NonNullable<Variable['conditionalLogic']>>) => {
    if (!onUpdate) return;
    
    const currentLogic = variable.conditionalLogic || { enabled: false };
    const updatedLogic = { ...currentLogic, ...updates };
    
    onUpdate(variable.id, { conditionalLogic: updatedLogic });
  };

  const toggleConditionalLogic = (enabled: boolean) => {
    if (!enabled) {
      // Clear all conditional logic when disabled
      onUpdate?.(variable.id, { conditionalLogic: { enabled: false } });
    } else {
      // Initialize with default values when enabled - use new multi-condition format
      onUpdate?.(variable.id, { 
        conditionalLogic: { 
          enabled: true,
          operator: 'AND',
          conditions: [{
            id: crypto.randomUUID(),
            dependsOnVariable: '',
            condition: 'equals',
            expectedValue: ''
          }],
          defaultValue: variable.type === 'number' ? 0 : ''
        } 
      });
    }
  };

  const addCondition = () => {
    if (!onUpdate || !variable.conditionalLogic) return;
    
    const newCondition = {
      id: crypto.randomUUID(),
      dependsOnVariable: '',
      condition: 'equals' as const,
      expectedValue: ''
    };
    
    const currentConditions = variable.conditionalLogic.conditions || [];
    handleConditionalLogicChange({ 
      conditions: [...currentConditions, newCondition] 
    });
  };

  const removeCondition = (conditionId: string) => {
    if (!onUpdate || !variable.conditionalLogic?.conditions) return;
    
    const updatedConditions = variable.conditionalLogic.conditions.filter(c => c.id !== conditionId);
    handleConditionalLogicChange({ conditions: updatedConditions });
  };

  const updateCondition = (conditionId: string, updates: any) => {
    if (!onUpdate || !variable.conditionalLogic?.conditions) return;
    
    const updatedConditions = variable.conditionalLogic.conditions.map(c => 
      c.id === conditionId ? { ...c, ...updates } : c
    );
    handleConditionalLogicChange({ conditions: updatedConditions });
  };

  // Check if this variable type supports options
  const hasOptions = ['select', 'dropdown', 'multiple-choice', 'checkbox'].includes(variable.type);
  const hasOptionsWithPricing = variable.options && ['select', 'dropdown', 'multiple-choice'].includes(variable.type);
  const hasPricingValues = variable.options?.some(option => option.numericValue !== undefined);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        {isEditingName ? (
          <div className="flex items-center space-x-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-sm font-medium h-8 flex-1"
              placeholder="Variable name"
              maxLength={50}
              data-testid={`input-variable-name-${variable.id}`}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveName}
              className="text-green-600 hover:text-green-700 p-1"
              data-testid={`button-save-name-${variable.id}`}
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelNameEdit}
              className="text-gray-400 hover:text-gray-600 p-1"
              data-testid={`button-cancel-name-${variable.id}`}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div 
            className="flex items-center space-x-2 flex-1 cursor-pointer" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            data-testid={`button-toggle-collapse-${variable.id}`}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              data-testid={`button-chevron-${variable.id}`}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            <span className="text-sm font-medium text-gray-900">{variable.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
                setEditName(variable.name);
              }}
              className="text-gray-400 hover:text-blue-500 p-1"
              data-testid={`button-edit-name-${variable.id}`}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(variable.id)}
          className="text-gray-400 hover:text-red-500 p-1"
          data-testid={`button-delete-${variable.id}`}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      {!isCollapsed && (
        <>
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

          {/* Tooltip/Description Section */}
          <div className="mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-gray-500" />
                <label className="text-xs text-gray-600 font-medium">Help Text (Optional):</label>
              </div>
              {!isEditingTooltip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingTooltip(true);
                    setEditTooltip(variable.tooltip || '');
                  }}
                  className="text-gray-400 hover:text-blue-500 p-1"
                  data-testid={`button-edit-tooltip-${variable.id}`}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>
            {isEditingTooltip ? (
              <div className="space-y-2 mt-1">
                <Textarea
                  value={editTooltip}
                  onChange={(e) => setEditTooltip(e.target.value)}
                  className="text-xs min-h-[60px] px-2 py-1.5"
                  placeholder="Add a description to help users understand this question..."
                  maxLength={200}
                  data-testid={`textarea-tooltip-${variable.id}`}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{editTooltip.length}/200</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveTooltip}
                      className="text-green-600 hover:text-green-700 px-2 py-1 h-7"
                      data-testid={`button-save-tooltip-${variable.id}`}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelTooltipEdit}
                      className="text-gray-400 hover:text-gray-600 px-2 py-1 h-7"
                      data-testid={`button-cancel-tooltip-${variable.id}`}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-1.5 rounded">
                {variable.tooltip || <span className="text-gray-400 italic">No help text set</span>}
              </div>
            )}
          </div>

          {/* Variable Details - Mobile Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
            {/* Type Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-600 font-medium">Type:</label>
                {!isEditingType && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingType(true);
                      setEditType(variable.type);
                    }}
                    className="text-gray-400 hover:text-blue-500 p-1 h-6 w-6"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              {isEditingType ? (
                <div className="space-y-2">
                  <Select value={editType} onValueChange={(value: typeof editType) => setEditType(value)}>
                    <SelectTrigger className="text-xs h-8 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="slider">Slider</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="select">Select (Legacy)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveType}
                      className="text-green-600 hover:text-green-700 px-2 py-1 h-7"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelTypeEdit}
                      className="text-gray-400 hover:text-gray-600 px-2 py-1 h-7"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 px-3 py-2 rounded-md">
                  <span className="text-gray-900 font-medium capitalize">{variable.type}</span>
                </div>
              )}
            </div>

            {/* Multiple Selection Toggle for multiple-choice type */}
            {variable.type === 'multiple-choice' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-gray-600 font-medium text-sm">Selection Mode:</label>
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-md flex items-center justify-between">
                  <span className="text-gray-900 font-medium text-sm">
                    {variable.allowMultipleSelection ? 'Multiple Selection' : 'Single Selection'}
                  </span>
                  <Switch
                    checked={variable.allowMultipleSelection || false}
                    onCheckedChange={(checked) => {
                      onUpdate({
                        ...variable,
                        allowMultipleSelection: checked
                      });
                    }}
                    data-testid="switch-multiple-selection"
                  />
                </div>
              </div>
            )}
            
            {/* Unit/Options/Range Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-600 font-medium">
                  {['select', 'dropdown', 'multiple-choice'].includes(variable.type) ? 'Options:' : 
                   variable.type === 'slider' ? 'Range:' : 'Unit:'}
                </label>
                {!['select', 'dropdown', 'multiple-choice', 'slider'].includes(variable.type) && !isEditingUnit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingUnit(true);
                      setEditUnit(variable.unit || '');
                    }}
                    className="text-gray-400 hover:text-blue-500 p-1 h-6 w-6"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
                {variable.type === 'slider' && !isEditingSlider && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingSlider(true);
                      setEditMin(variable.min || 0);
                      setEditMax(variable.max || 100);
                      setEditStep(variable.step || 1);
                    }}
                    className="text-gray-400 hover:text-blue-500 p-1 h-6 w-6"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {hasOptions ? (
                <div className="bg-gray-100 px-3 py-2 rounded-md flex items-center justify-between">
                  <span className="text-gray-900 font-medium">{variable.options?.length || 0} options</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPricingDetails(!showPricingDetails)}
                    className="text-gray-400 hover:text-blue-500 p-1 h-6 w-6"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              ) : isEditingUnit ? (
                <div className="space-y-2">
                  <Input
                    value={editUnit}
                    onChange={(e) => {
                      const value = e.target.value.substring(0, 15); // Limit to 15 characters
                      setEditUnit(value);
                    }}
                    className="text-xs h-8 px-2"
                    placeholder="Unit (e.g., sq ft)"
                    maxLength={15}
                  />
                  <div className="flex items-center space-x-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveUnit}
                      className="text-green-600 hover:text-green-700 px-2 py-1 h-7"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelUnitEdit}
                      className="text-gray-400 hover:text-gray-600 px-2 py-1 h-7"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : variable.type === 'slider' ? (
                isEditingSlider ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500 block mb-1">Min</Label>
                        <Input
                          type="number"
                          value={editMin}
                          onChange={(e) => setEditMin(Number(e.target.value))}
                          className="text-xs h-8 px-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 block mb-1">Max</Label>
                        <Input
                          type="number"
                          value={editMax}
                          onChange={(e) => setEditMax(Number(e.target.value))}
                          className="text-xs h-8 px-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 block mb-1">Step</Label>
                        <Input
                          type="number"
                          value={editStep}
                          onChange={(e) => setEditStep(Number(e.target.value))}
                          className="text-xs h-8 px-2"
                          step="0.01"
                          min="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 block mb-1">Unit (Optional)</Label>
                      <Input
                        value={editUnit}
                        onChange={(e) => {
                          const value = e.target.value.substring(0, 15);
                          setEditUnit(value);
                        }}
                        className="text-xs h-8 px-2"
                        placeholder="e.g., sq ft, %"
                        maxLength={15}
                      />
                    </div>
                    <div className="flex items-center space-x-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveSlider}
                        className="text-green-600 hover:text-green-700 px-2 py-1 h-7"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelSliderEdit}
                        className="text-gray-400 hover:text-gray-600 px-2 py-1 h-7"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 px-3 py-2 rounded-md">
                    <div className="text-gray-900 font-medium text-xs">
                      {variable.min || 0} - {variable.max || 100}
                    </div>
                    <div className="text-gray-600 text-xs">
                      Step: {variable.step || 1}{variable.unit && ` • Unit: ${variable.unit}`}
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-gray-100 px-3 py-2 rounded-md">
                  <span className="text-gray-900 font-medium">{variable.unit || 'No unit set'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Options Configuration Section */}
          {hasOptions && showPricingDetails && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-3 h-3 text-gray-500" />
                  <label className="text-xs text-gray-600 font-medium">
                    {variable.type === 'checkbox' ? 'Checkbox Options' : 'Option Settings'}
                  </label>
                  {hasOptionsWithPricing && hasPricingValues && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Pricing Set
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {variable.options && variable.options.length > 0 && (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={variable.options.map((_, index) => `option-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {variable.options.map((option, index) => (
                        <SortableOptionItem
                          key={`option-${index}`}
                          option={option}
                          index={index}
                          onUpdate={handleOptionUpdate}
                          onDelete={handleDeleteOption}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              
              {(!variable.options || variable.options.length === 0) && (
                <div className="text-center py-3 text-gray-400 border-2 border-dashed border-gray-200 rounded">
                  <p className="text-xs">No options yet</p>
                  <p className="text-xs mt-1">Click "Add" to get started</p>
                </div>
              )}
            </div>
          )}

          {/* Pricing Details Section */}
          {hasOptionsWithPricing && !showPricingDetails && (
            <div className="pt-2 border-t border-gray-200">
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 leading-tight">
                      Drag to reorder • Set labels and pricing values:
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {variable.options && variable.options.length > 0 && (
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={variable.options.map((_, index) => `option-${index}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1.5">
                          {variable.options.map((option, index) => (
                            <SortableOptionItem
                              key={`option-${index}`}
                              option={option}
                              index={index}
                              onUpdate={handleOptionUpdate}
                              onDelete={handleDeleteOption}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                  
                  {(!variable.options || variable.options.length === 0) && (
                    <div className="text-center py-3 text-gray-400 border-2 border-dashed border-gray-200 rounded">
                      <p className="text-xs">No options yet</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddOption}
                        className="mt-2 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add First Option
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2 space-y-0.5 leading-tight">
                    <p>Use these values in formulas like: {variable.id} * quantity</p>
                    {variable.type === 'multiple-choice' && variable.allowMultipleSelection && (
                      <p className="text-amber-600">⚠️ Multiple selection: formulas will sum all selected values</p>
                    )}
                    <p className="text-gray-300">Values are auto-generated from labels and hidden from users</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Logic Section */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-gray-500" />
                <label className="text-xs text-gray-600 font-medium">Conditional Display</label>
                {variable.conditionalLogic?.enabled && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {variable.conditionalLogic?.enabled ? 'On' : 'Off'}
                </span>
                <Switch
                  checked={variable.conditionalLogic?.enabled || false}
                  onCheckedChange={toggleConditionalLogic}
                />
              </div>
            </div>

            {variable.conditionalLogic?.enabled && (
              <div className="space-y-4 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 leading-tight font-medium">
                    Show this variable when:
                  </p>
                  
                  {/* AND/OR Operator Selector - only show if multiple conditions */}
                  {(variable.conditionalLogic.conditions?.length || 0) > 1 && (
                    <Select
                      value={variable.conditionalLogic.operator || 'AND'}
                      onValueChange={(value) => handleConditionalLogicChange({ operator: value as 'AND' | 'OR' })}
                    >
                      <SelectTrigger className="text-xs h-7 w-24" data-testid="select-operator">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND" className="text-xs">ALL (AND)</SelectItem>
                        <SelectItem value="OR" className="text-xs">ANY (OR)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Conditions List */}
                <div className="space-y-3">
                  {(variable.conditionalLogic.conditions || []).map((cond, index) => (
                    <div key={cond.id} className="bg-white p-3 rounded border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          Condition {index + 1}
                        </span>
                        {(variable.conditionalLogic.conditions?.length || 0) > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(cond.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            data-testid={`button-remove-condition-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      {/* Variable Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Variable:</Label>
                        <Select
                          value={cond.dependsOnVariable || ''}
                          onValueChange={(value) => updateCondition(cond.id, { dependsOnVariable: value })}
                        >
                          <SelectTrigger className="text-sm h-9" data-testid={`select-variable-${index}`}>
                            <SelectValue placeholder="Select variable..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableDependencies(variable, allVariables).map((dep) => (
                              <SelectItem key={dep.id} value={dep.id} className="text-sm">
                                {dep.name} ({dep.type})
                              </SelectItem>
                            ))}
                            {getAvailableDependencies(variable, allVariables).length === 0 && (
                              <div className="px-2 py-1 text-sm text-gray-500">
                                No variables available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Condition Selection */}
                      {cond.dependsOnVariable && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Condition:</Label>
                          <Select
                            value={cond.condition || ''}
                            onValueChange={(value) => updateCondition(cond.id, { condition: value })}
                          >
                            <SelectTrigger className="text-sm h-9" data-testid={`select-condition-${index}`}>
                              <SelectValue placeholder="Select condition..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const dependentVar = allVariables.find(v => v.id === cond.dependsOnVariable);
                                const availableConditions = dependentVar ? getAvailableConditions(dependentVar.type) : [];
                                return availableConditions.map((condition) => (
                                  <SelectItem key={condition} value={condition} className="text-sm">
                                    {getConditionLabel(condition)}
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Expected Value */}
                      {cond.condition && !['is_empty', 'is_not_empty'].includes(cond.condition) && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Expected value:</Label>
                          {(() => {
                            const dependentVar = allVariables.find(v => v.id === cond.dependsOnVariable);
                            
                            // For select/dropdown variables, show options as dropdown
                            if (dependentVar && ['select', 'dropdown', 'multiple-choice'].includes(dependentVar.type) && dependentVar.options) {
                              return (
                                <Select
                                  value={String(cond.expectedValue || '')}
                                  onValueChange={(value) => updateCondition(cond.id, { expectedValue: value })}
                                >
                                  <SelectTrigger className="text-sm h-9" data-testid={`select-expected-value-${index}`}>
                                    <SelectValue placeholder="Select value..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dependentVar.options.map((option, optIndex) => (
                                      <SelectItem key={optIndex} value={String(option.value)} className="text-sm">
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            }
                            
                            // For checkbox variables
                            if (dependentVar && dependentVar.type === 'checkbox') {
                              return (
                                <Select
                                  value={String(cond.expectedValue || '')}
                                  onValueChange={(value) => updateCondition(cond.id, { expectedValue: value === 'true' })}
                                >
                                  <SelectTrigger className="text-sm h-9" data-testid={`select-expected-value-${index}`}>
                                    <SelectValue placeholder="Select value..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true" className="text-sm">Checked</SelectItem>
                                    <SelectItem value="false" className="text-sm">Unchecked</SelectItem>
                                  </SelectContent>
                                </Select>
                              );
                            }
                            
                            // For number/text variables, show input
                            return (
                              <Input
                                type={dependentVar?.type === 'number' ? 'number' : 'text'}
                                value={String(cond.expectedValue || '')}
                                onChange={(e) => {
                                  const value = dependentVar?.type === 'number' ? 
                                    parseFloat(e.target.value) || 0 : e.target.value;
                                  updateCondition(cond.id, { expectedValue: value });
                                }}
                                className="text-sm h-9"
                                placeholder="Enter value..."
                                data-testid={`input-expected-value-${index}`}
                              />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Condition Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCondition}
                  className="w-full text-xs h-8"
                  data-testid="button-add-condition"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Condition
                </Button>

                {/* Default Value Input - for when variable is hidden */}
                {(variable.conditionalLogic.conditions && variable.conditionalLogic.conditions.length > 0) && (
                  <div className="space-y-2 pt-3 border-t border-blue-300">
                    <Label className="text-sm text-gray-700 font-medium">
                      Default value when hidden:
                    </Label>
                    {(() => {
                      // For number/slider variables, show helpful dropdown with common values
                      if (variable.type === 'number' || variable.type === 'slider') {
                        return (
                          <div className="flex gap-1">
                            <Select
                              value={variable.conditionalLogic.defaultValue?.toString() || ''}
                              onValueChange={(value) => handleConditionalLogicChange({ defaultValue: Number(value) })}
                            >
                              <SelectTrigger className="text-xs h-6 flex-1">
                                <SelectValue placeholder="Quick select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0" className="text-xs">0 (for addition formulas)</SelectItem>
                                <SelectItem value="1" className="text-xs">1 (for multiplication formulas)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={variable.conditionalLogic.defaultValue?.toString() || ''}
                              onChange={(e) => {
                                const value = Number(e.target.value) || 0;
                                handleConditionalLogicChange({ defaultValue: value });
                              }}
                              placeholder="Custom"
                              className="text-xs h-6 w-16"
                            />
                          </div>
                        );
                      }
                      
                      // For checkbox variables
                      if (variable.type === 'checkbox') {
                        return (
                          <Select
                            value={variable.conditionalLogic.defaultValue?.toString() || 'false'}
                            onValueChange={(value) => handleConditionalLogicChange({ defaultValue: value === 'true' })}
                          >
                            <SelectTrigger className="text-xs h-6">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="false" className="text-xs">Unchecked (false)</SelectItem>
                              <SelectItem value="true" className="text-xs">Checked (true)</SelectItem>
                            </SelectContent>
                          </Select>
                        );
                      }
                      
                      // For select/dropdown variables, show options
                      if ((variable.type === 'select' || variable.type === 'dropdown') && variable.options) {
                        return (
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              <Select
                                value="__QUICK__"
                                onValueChange={(value) => {
                                  if (value === '0' || value === '1') {
                                    handleConditionalLogicChange({ defaultValue: value });
                                  }
                                }}
                              >
                                <SelectTrigger className="text-xs h-6 w-20">
                                  <SelectValue placeholder="Quick" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0" className="text-xs">0 (addition)</SelectItem>
                                  <SelectItem value="1" className="text-xs">1 (multiply)</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={variable.conditionalLogic.defaultValue?.toString() || '__NONE__'}
                                onValueChange={(value) => {
                                  const actualValue = value === '__NONE__' ? '' : value;
                                  handleConditionalLogicChange({ defaultValue: actualValue });
                                }}
                              >
                                <SelectTrigger className="text-xs h-6 flex-1">
                                  <SelectValue placeholder="Select default option..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__NONE__" className="text-xs">None (empty)</SelectItem>
                                  {variable.options.map((option, index) => (
                                    <SelectItem key={index} value={option.value.toString()} className="text-xs">
                                      {option.label} (value: {option.numericValue || 0})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      }
                      
                      // For other variable types, show text input
                      return (
                        <Input
                          value={variable.conditionalLogic.defaultValue?.toString() || ''}
                          onChange={(e) => {
                            handleConditionalLogicChange({ defaultValue: e.target.value });
                          }}
                          placeholder={getDefaultValuePlaceholder(variable.type)}
                          className="text-xs h-6"
                        />
                      );
                    })()}
                    <p className="text-xs text-gray-500">
                      {getDefaultValueDescription(variable.type)}
                    </p>
                  </div>
                )}

                {getAvailableDependencies(variable, allVariables).length === 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    ⚠️ Add more variables above this one to enable conditional logic
                  </div>
                )}
              </div>
            )}
          </div>
            </>
      )}
    </div>
  );
}
