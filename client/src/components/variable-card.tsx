import { useState, useRef } from "react";
import { Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  X, Edit3, Check, DollarSign, Settings, Plus, Trash2, GripVertical, Upload,
  Zap, HelpCircle, ChevronDown, ChevronUp, Hash, Type, CheckSquare,
  SlidersHorizontal, List, Image, Copy, Video, ImageIcon, Sparkles, Loader2
} from "lucide-react";
import AIIconGeneratorModal from "./ai-icon-generator-modal";
import { useToast } from "@/hooks/use-toast";
import { processIconWithBackgroundRemoval } from "@/lib/background-removal";
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
  allVariables?: Variable[];
}

interface SortableOptionItemProps {
  option: { label: string; value: string | number; numericValue?: number; image?: string; id?: string; defaultUnselectedValue?: number };
  index: number;
  showImage?: boolean;
  showDefaultUnselected?: boolean;
  onUpdate: (index: number, updates: { label?: string; numericValue?: number; value?: string | number; image?: string; defaultUnselectedValue?: number }) => void;
  onDelete: (index: number) => void;
  onAIGenerate?: (index: number) => void;
}

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  number: { icon: Hash, label: "Number", color: "bg-blue-100 text-blue-700 border-blue-200" },
  stepper: { icon: Plus, label: "Stepper", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  text: { icon: Type, label: "Text", color: "bg-gray-100 text-gray-700 border-gray-200" },
  checkbox: { icon: CheckSquare, label: "Checkbox", color: "bg-green-100 text-green-700 border-green-200" },
  slider: { icon: SlidersHorizontal, label: "Slider", color: "bg-purple-100 text-purple-700 border-purple-200" },
  dropdown: { icon: List, label: "Dropdown", color: "bg-orange-100 text-orange-700 border-orange-200" },
  "multiple-choice": { icon: Image, label: "Multiple Choice", color: "bg-pink-100 text-pink-700 border-pink-200" },
  select: { icon: List, label: "Select", color: "bg-orange-100 text-orange-700 border-orange-200" },
};

function SortableOptionItem({ option, index, showImage = false, showDefaultUnselected = false, onUpdate, onDelete, onAIGenerate }: SortableOptionItemProps) {
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
      if (file.size > 2 * 1024 * 1024) {
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
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-3"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {showImage && (
        <div className="flex-shrink-0">
          {option.image ? (
            <div className="relative group">
              <img
                src={option.image}
                alt={option.label}
                className="w-10 h-10 object-cover rounded-lg border dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => onUpdate(index, { image: '' })}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="w-10 h-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Upload image">
              <Upload className="w-4 h-4 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      <div className={`flex-1 grid grid-cols-1 gap-2 min-w-0 ${showDefaultUnselected ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <Input
          placeholder="Option label"
          value={option.label}
          onChange={(e) => {
            const label = e.target.value;
            const baseValue = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const optionId = baseValue || `option_${index}`;
            onUpdate(index, { label, value: optionId, id: optionId });
          }}
          className="h-9 text-sm"
        />
        <Input
          type="number"
          placeholder="Price value"
          value={option.numericValue || ''}
          onChange={(e) => {
            const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
            onUpdate(index, { numericValue: value });
          }}
          className="h-9 text-sm"
        />
        {showDefaultUnselected && (
          <Select
            value={String(option.defaultUnselectedValue ?? 0)}
            onValueChange={(val) => onUpdate(index, { defaultUnselectedValue: Number(val) })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Default when not selected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Default: 0 (addition)</SelectItem>
              <SelectItem value="1">Default: 1 (multiply)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(index)}
        className="flex-shrink-0 h-9 w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function getDefaultValuePlaceholder(variableType: string): string {
  switch (variableType) {
    case 'number':
    case 'stepper':
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
    case 'stepper':
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
  const [showOptions, setShowOptions] = useState(false);
  const [showConditionalLogic, setShowConditionalLogic] = useState(false);
  const [isEditingTooltip, setIsEditingTooltip] = useState(false);
  const [editTooltip, setEditTooltip] = useState(variable.tooltip || '');
  const [editTooltipVideoUrl, setEditTooltipVideoUrl] = useState(variable.tooltipVideoUrl || '');
  const [editTooltipImageUrl, setEditTooltipImageUrl] = useState(variable.tooltipImageUrl || '');
  const [isEditingSlider, setIsEditingSlider] = useState(false);
  const [isEditingStepper, setIsEditingStepper] = useState(false);
  const [editMin, setEditMin] = useState(variable.min || 0);
  const [editMax, setEditMax] = useState(variable.max || 100);
  const [editStep, setEditStep] = useState(variable.step || 1);
  const [isEditingCheckbox, setIsEditingCheckbox] = useState(false);
  const [editCheckedValue, setEditCheckedValue] = useState(variable.checkedValue?.toString() || "1");
  const [editUncheckedValue, setEditUncheckedValue] = useState(variable.uncheckedValue?.toString() || "0");

  // AI Icon Generation state
  const [showSingleIconGenerator, setShowSingleIconGenerator] = useState(false);
  const [singleIconGeneratorIndex, setSingleIconGeneratorIndex] = useState<number | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ completed: 0, total: 0 });
  const [showBulkStyleDialog, setShowBulkStyleDialog] = useState(false);
  const [bulkStyleDescription, setBulkStyleDescription] = useState('');
  const [bulkReferenceImage, setBulkReferenceImage] = useState<string | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const TypeIcon = typeConfig[variable.type]?.icon || Hash;
  const typeColorClass = typeConfig[variable.type]?.color || "bg-gray-100 text-gray-700";
  const hasOptions = ['select', 'dropdown', 'multiple-choice'].includes(variable.type);
  const hasConditionalLogic = variable.conditionalLogic?.enabled;

  // Handler functions
  const handleSaveName = () => {
    if (onUpdate && editName.trim() && editName !== variable.name) {
      onUpdate(variable.id, { name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSaveId = () => {
    if (onUpdate && editId.trim() && editId !== variable.id) {
      onUpdate(variable.id, { id: editId.trim() });
    }
    setIsEditingId(false);
  };

  const handleSaveTooltip = () => {
    if (onUpdate) {
      onUpdate(variable.id, {
        tooltip: editTooltip.trim() || undefined,
        tooltipVideoUrl: editTooltipVideoUrl.trim() || undefined,
        tooltipImageUrl: editTooltipImageUrl.trim() || undefined
      });
    }
    setIsEditingTooltip(false);
  };

  const handleSaveUnit = () => {
    if (onUpdate) {
      onUpdate(variable.id, { unit: editUnit.trim().substring(0, 15) || undefined });
    }
    setIsEditingUnit(false);
  };

  const handleSaveType = () => {
    if (onUpdate && editType !== variable.type) {
      const needsOptions = ['select', 'dropdown', 'multiple-choice'].includes(editType);
      const hadOptions = ['select', 'dropdown', 'multiple-choice'].includes(variable.type);

      let updates: Partial<Variable> = { type: editType };

      if (needsOptions && !hadOptions) {
        updates.options = [{ id: "option_1", label: "Option 1", value: "option_1", numericValue: 0, image: "" }];
      } else if (!needsOptions && hadOptions) {
        updates.options = undefined;
      }

      if (editType === 'slider') {
        updates.min = variable.min || 0;
        updates.max = variable.max || 100;
        updates.step = variable.step || 1;
      }
      if (editType === 'stepper') {
        updates.min = variable.min ?? 0;
        updates.max = variable.max ?? 100;
        updates.step = undefined;
      }

      onUpdate(variable.id, updates);
    }
    setIsEditingType(false);
  };

  const handleSaveSlider = () => {
    if (onUpdate) {
      onUpdate(variable.id, {
        min: editMin,
        max: editMax,
        step: editStep,
        unit: editUnit.trim().substring(0, 15) || undefined
      });
    }
    setIsEditingSlider(false);
  };

  const handleSaveCheckbox = () => {
    if (onUpdate) {
      onUpdate(variable.id, {
        checkedValue: editCheckedValue.trim() || undefined,
        uncheckedValue: editUncheckedValue.trim() || undefined
      });
    }
    setIsEditingCheckbox(false);
  };

  const handleSaveStepper = () => {
    if (onUpdate) {
      onUpdate(variable.id, {
        min: editMin,
        max: editMax,
        unit: editUnit.trim().substring(0, 15) || undefined
      });
    }
    setIsEditingStepper(false);
  };

  const handleOptionUpdate = (index: number, updates: any) => {
    if (!onUpdate || !variable.options) return;
    const updatedOptions = variable.options.map((opt, i) => i === index ? { ...opt, ...updates } : opt);
    onUpdate(variable.id, { options: updatedOptions });
  };

  const handleAddOption = () => {
    if (!onUpdate) return;
    const num = (variable.options?.length || 0) + 1;
    const optionId = `option_${num}`;
    const newOption = { id: optionId, label: `Option ${num}`, value: optionId, numericValue: 0, image: "" };
    onUpdate(variable.id, { options: [...(variable.options || []), newOption] });
  };

  const handleDeleteOption = (index: number) => {
    if (!onUpdate || !variable.options) return;
    onUpdate(variable.id, { options: variable.options.filter((_, i) => i !== index) });
  };

  // AI Icon Generation handlers
  const handleOpenSingleIconGenerator = (index: number) => {
    setSingleIconGeneratorIndex(index);
    setShowSingleIconGenerator(true);
  };

  const handleSingleIconGenerated = (iconDataUrl: string) => {
    if (singleIconGeneratorIndex !== null && variable.options) {
      handleOptionUpdate(singleIconGeneratorIndex, { image: iconDataUrl });
    }
    setShowSingleIconGenerator(false);
    setSingleIconGeneratorIndex(null);
  };

  const openBulkGenerateDialog = () => {
    setBulkStyleDescription('');
    setBulkReferenceImage(null);
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
    setShowBulkStyleDialog(true);
  };

  const handleBulkReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image must be smaller than 5MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setBulkReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const removeBulkReferenceImage = () => {
    setBulkReferenceImage(null);
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const handleBulkGenerateIcons = async () => {
    if (!variable.options || variable.options.length === 0 || !onUpdate) return;

    setShowBulkStyleDialog(false);
    setIsBulkGenerating(true);
    setBulkProgress({ completed: 0, total: variable.options.length });

    try {
      const response = await fetch('/api/icons/generate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: variable.name,
          options: variable.options.map((opt, i) => ({
            id: opt.id || `option-${i}`,
            label: opt.label
          })),
          styleDescription: bulkStyleDescription,
          referenceImage: bulkReferenceImage || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate icons');
      }

      const data = await response.json();

      // Process each generated image - remove background client-side
      const updatedOptions = [...variable.options];
      let completed = 0;

      for (const img of data.images) {
        try {
          // Find the option index
          const optionIndex = variable.options.findIndex(
            (opt, i) => (opt.id || `option-${i}`) === img.optionId
          );

          if (optionIndex !== -1) {
            // Remove background client-side
            const processedDataUrl = await processIconWithBackgroundRemoval(img.imageBase64, img.mimeType);
            updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], image: processedDataUrl };
          }

          completed++;
          setBulkProgress({ completed, total: variable.options.length });
        } catch (bgError) {
          console.warn(`Background removal failed for option ${img.optionId}:`, bgError);
          // Use original image if background removal fails
          const optionIndex = variable.options.findIndex(
            (opt, i) => (opt.id || `option-${i}`) === img.optionId
          );
          if (optionIndex !== -1) {
            updatedOptions[optionIndex] = {
              ...updatedOptions[optionIndex],
              image: `data:${img.mimeType};base64,${img.imageBase64}`
            };
          }
          completed++;
          setBulkProgress({ completed, total: variable.options.length });
        }
      }

      onUpdate(variable.id, { options: updatedOptions });

      if (data.errors && data.errors.length > 0) {
        toast({
          title: `Generated ${data.images.length} icons`,
          description: `${data.errors.length} failed to generate`,
          variant: "default"
        });
      } else {
        toast({ title: `Generated ${data.images.length} icons successfully` });
      }
    } catch (error) {
      console.error('Bulk icon generation error:', error);
      toast({
        title: "Generation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsBulkGenerating(false);
      setBulkProgress({ completed: 0, total: 0 });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !variable.options || !onUpdate) return;
    const activeIndex = parseInt(active.id.toString().replace('option-', ''));
    const overIndex = parseInt(over.id.toString().replace('option-', ''));
    if (activeIndex !== overIndex) {
      onUpdate(variable.id, { options: arrayMove(variable.options, activeIndex, overIndex) });
    }
  };

  const handleConditionalLogicChange = (updates: Partial<NonNullable<Variable['conditionalLogic']>>) => {
    if (!onUpdate) return;
    const currentLogic = variable.conditionalLogic || { enabled: false };
    onUpdate(variable.id, { conditionalLogic: { ...currentLogic, ...updates } });
  };

  const toggleConditionalLogic = (enabled: boolean) => {
    if (!enabled) {
      onUpdate?.(variable.id, { conditionalLogic: { enabled: false } });
    } else {
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
          defaultValue: ['number', 'stepper', 'slider'].includes(variable.type) ? 0 : ''
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
    handleConditionalLogicChange({
      conditions: [...(variable.conditionalLogic.conditions || []), newCondition]
    });
  };

  const removeCondition = (conditionId: string) => {
    if (!onUpdate || !variable.conditionalLogic?.conditions) return;
    handleConditionalLogicChange({
      conditions: variable.conditionalLogic.conditions.filter(c => c.id !== conditionId)
    });
  };

  const updateCondition = (conditionId: string, updates: any) => {
    if (!onUpdate || !variable.conditionalLogic?.conditions) return;
    handleConditionalLogicChange({
      conditions: variable.conditionalLogic.conditions.map(c =>
        c.id === conditionId ? { ...c, ...updates } : c
      )
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Mobile: Show variable name on its own line above */}
        <div className="sm:hidden mb-2">
          {isEditingName ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm font-medium flex-1"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsEditingName(false); }}
              />
              <Button variant="ghost" size="sm" onClick={handleSaveName} className="h-8 w-8 p-0 text-green-600">
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setIsEditingName(false); setEditName(variable.name); }} className="h-8 w-8 p-0 text-gray-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{variable.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingName(true); setEditName(variable.name); }}
                className="text-gray-400 hover:text-blue-500 p-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5" onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}>
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>

          <Badge variant="outline" className={`${typeColorClass} border text-xs font-medium px-2 py-0.5 flex items-center gap-1`}>
            <TypeIcon className="w-3 h-3" />
            {typeConfig[variable.type]?.label || variable.type}
          </Badge>

          {/* Desktop: Show name inline */}
          {isEditingName ? (
            <div className="hidden sm:flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm font-medium flex-1"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsEditingName(false); }}
              />
              <Button variant="ghost" size="sm" onClick={handleSaveName} className="h-8 w-8 p-0 text-green-600">
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setIsEditingName(false); setEditName(variable.name); }} className="h-8 w-8 p-0 text-gray-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex flex-1 items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{variable.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingName(true); setEditName(variable.name); }}
                className="text-gray-400 hover:text-blue-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Spacer for mobile */}
          <div className="flex-1 sm:hidden" />

          {/* Status badges */}
          <div className="hidden sm:flex items-center gap-2">
            {hasOptions && variable.options?.length && (
              <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {variable.options.length} options
              </Badge>
            )}
            {hasConditionalLogic && (
              <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                <Zap className="w-3 h-3 mr-1" />
                Conditional
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(variable.id); }}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
          {/* Variable ID */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-500 flex-shrink-0">ID:</span>
              {isEditingId ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editId}
                    onChange={(e) => setEditId(e.target.value)}
                    className="h-7 text-xs font-mono flex-1"
                    autoFocus
                  />
                  <Button variant="ghost" size="sm" onClick={handleSaveId} className="h-7 w-7 p-0 text-green-600">
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditingId(false); setEditId(variable.id); }} className="h-7 w-7 p-0 text-gray-400">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <code className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded truncate">
                  {variable.id}
                </code>
              )}
            </div>
            {!isEditingId && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(variable.id)} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingId(true)} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500">
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Type & Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 font-medium">Type</Label>
              {isEditingType ? (
                <div className="space-y-2">
                  <Select value={editType} onValueChange={(value: typeof editType) => setEditType(value)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="stepper">Stepper</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="slider">Slider</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={handleSaveType} className="h-7 text-xs">Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setIsEditingType(false); setEditType(variable.type); }} className="h-7 text-xs">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between h-9 bg-gray-50 dark:bg-gray-700 rounded-lg px-3">
                  <span className="text-sm text-gray-900 dark:text-gray-200 capitalize">{typeConfig[variable.type]?.label || variable.type}</span>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingType(true)} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Unit (for number/text) */}
            {!hasOptions && variable.type !== 'slider' && variable.type !== 'stepper' && variable.type !== 'checkbox' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">Unit</Label>
                {isEditingUnit ? (
                  <div className="space-y-2">
                    <Input
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value.substring(0, 15))}
                      className="h-9 text-sm"
                      placeholder="e.g., sq ft"
                      maxLength={15}
                    />
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={handleSaveUnit} className="h-7 text-xs">Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setIsEditingUnit(false); setEditUnit(variable.unit || ''); }} className="h-7 text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between h-9 bg-gray-50 dark:bg-gray-700 rounded-lg px-3">
                    <span className="text-sm text-gray-900 dark:text-gray-200">{variable.unit || <span className="text-gray-400 dark:text-gray-500">None</span>}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setIsEditingUnit(true); setEditUnit(variable.unit || ''); }} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Slider Configuration */}
            {variable.type === 'slider' && (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-500 font-medium">Slider Range</Label>
                  {!isEditingSlider && (
                    <Button variant="ghost" size="sm" onClick={() => { setIsEditingSlider(true); setEditMin(variable.min || 0); setEditMax(variable.max || 100); setEditStep(variable.step || 1); setEditUnit(variable.unit || ''); }} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {isEditingSlider ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Min</Label>
                        <Input type="number" value={editMin} onChange={(e) => setEditMin(Number(e.target.value))} className="h-9 text-sm mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Max</Label>
                        <Input type="number" value={editMax} onChange={(e) => setEditMax(Number(e.target.value))} className="h-9 text-sm mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Step</Label>
                        <Input type="number" value={editStep} onChange={(e) => setEditStep(Number(e.target.value))} className="h-9 text-sm mt-1" step="0.01" min="0.01" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Unit (optional)</Label>
                      <Input value={editUnit} onChange={(e) => setEditUnit(e.target.value.substring(0, 15))} placeholder="e.g., sq ft" className="h-9 text-sm mt-1" maxLength={15} />
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={handleSaveSlider} className="h-7 text-xs">Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingSlider(false)} className="h-7 text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <div className="text-sm text-gray-900 dark:text-gray-200">{variable.min || 0} - {variable.max || 100}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Step: {variable.step || 1}{variable.unit && ` • Unit: ${variable.unit}`}</div>
                  </div>
                )}
              </div>
            )}

            {/* Stepper Configuration */}
            {variable.type === 'stepper' && (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-500 font-medium">Stepper Range</Label>
                  {!isEditingStepper && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingStepper(true);
                        setEditMin(variable.min ?? 0);
                        setEditMax(variable.max ?? 100);
                        setEditUnit(variable.unit || '');
                      }}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {isEditingStepper ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Min</Label>
                        <Input
                          type="number"
                          value={editMin}
                          onChange={(e) => setEditMin(Number(e.target.value))}
                          className="h-9 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Max</Label>
                        <Input
                          type="number"
                          value={editMax}
                          onChange={(e) => setEditMax(Number(e.target.value))}
                          className="h-9 text-sm mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Unit (optional)</Label>
                      <Input
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value.substring(0, 15))}
                        placeholder="e.g., items"
                        className="h-9 text-sm mt-1"
                        maxLength={15}
                      />
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={handleSaveStepper} className="h-7 text-xs">Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingStepper(false)} className="h-7 text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {variable.min ?? 0} - {variable.max ?? 100}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {variable.unit && `Unit: ${variable.unit}`}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Checkbox Configuration */}
            {variable.type === 'checkbox' && (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-500 font-medium">Formula Values</Label>
                  {!isEditingCheckbox && (
                    <Button variant="ghost" size="sm" onClick={() => { setIsEditingCheckbox(true); setEditCheckedValue(variable.checkedValue?.toString() || "1"); setEditUncheckedValue(variable.uncheckedValue?.toString() || "0"); }} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {isEditingCheckbox ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <Label className="text-xs text-green-700 font-medium">When Checked</Label>
                        <Input value={editCheckedValue} onChange={(e) => setEditCheckedValue(e.target.value)} placeholder="1" className="h-8 text-sm mt-1" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                        <Label className="text-xs text-gray-600 font-medium">When Unchecked</Label>
                        <Input value={editUncheckedValue} onChange={(e) => setEditUncheckedValue(e.target.value)} placeholder="0" className="h-8 text-sm mt-1" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={handleSaveCheckbox} className="h-7 text-xs">Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingCheckbox(false)} className="h-7 text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Checked:</span>
                      <code className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded text-xs font-mono">{variable.checkedValue || "1"}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Unchecked:</span>
                      <code className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded text-xs font-mono">{variable.uncheckedValue || "0"}</code>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help Text & Media */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Help Content
              </Label>
              {!isEditingTooltip && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsEditingTooltip(true);
                  setEditTooltip(variable.tooltip || '');
                  setEditTooltipVideoUrl(variable.tooltipVideoUrl || '');
                  setEditTooltipImageUrl(variable.tooltipImageUrl || '');
                }} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500">
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>
            {isEditingTooltip ? (
              <div className="space-y-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Help Text</Label>
                  <Textarea
                    value={editTooltip}
                    onChange={(e) => setEditTooltip(e.target.value)}
                    placeholder="Add a description to help users understand this question..."
                    className="text-sm min-h-[60px]"
                    maxLength={200}
                  />
                  <span className="text-xs text-gray-400 dark:text-gray-500">{editTooltip.length}/200</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Video URL
                    </Label>
                    <Input
                      value={editTooltipVideoUrl}
                      onChange={(e) => setEditTooltipVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Image URL
                    </Label>
                    <Input
                      value={editTooltipImageUrl}
                      onChange={(e) => setEditTooltipImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  <Button variant="outline" size="sm" onClick={handleSaveTooltip} className="h-7 text-xs">Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setIsEditingTooltip(false);
                    setEditTooltip(variable.tooltip || '');
                    setEditTooltipVideoUrl(variable.tooltipVideoUrl || '');
                    setEditTooltipImageUrl(variable.tooltipImageUrl || '');
                  }} className="h-7 text-xs">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {variable.tooltip || <span className="text-gray-400 dark:text-gray-500 italic">No help text</span>}
                </div>
                {(variable.tooltipVideoUrl || variable.tooltipImageUrl) && (
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {variable.tooltipVideoUrl && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Video className="w-3 h-3" />
                        Video
                      </span>
                    )}
                    {variable.tooltipImageUrl && (
                      <span className="flex items-center gap-1 text-green-600">
                        <ImageIcon className="w-3 h-3" />
                        Image
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multiple Selection Toggle */}
          {variable.type === 'multiple-choice' && (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
              <div>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Allow multiple selections</span>
                <p className="text-xs text-blue-700 dark:text-blue-300">Each option can be selected independently</p>
              </div>
              <Switch
                checked={variable.allowMultipleSelection || false}
                onCheckedChange={(checked) => onUpdate?.(variable.id, { allowMultipleSelection: checked })}
              />
            </div>
          )}

          {/* Options Section */}
          {hasOptions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                >
                  {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <Settings className="w-4 h-4" />
                  Options ({variable.options?.length || 0})
                </button>
                <Button variant="outline" size="sm" onClick={handleAddOption} className="h-8 text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>

              {showOptions && variable.options && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={variable.options.map((_, i) => `option-${i}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {variable.options.map((option, index) => (
                        <SortableOptionItem
                          key={`option-${index}`}
                          option={option}
                          index={index}
                          showImage={variable.type === 'multiple-choice'}
                          showDefaultUnselected={variable.type === 'multiple-choice' && variable.allowMultipleSelection}
                          onUpdate={handleOptionUpdate}
                          onDelete={handleDeleteOption}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {/* Conditional Logic Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowConditionalLogic(!showConditionalLogic)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                {showConditionalLogic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <Zap className="w-4 h-4" />
                Conditional Display
                {hasConditionalLogic && <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ml-1">Active</Badge>}
              </button>
              <Switch
                checked={variable.conditionalLogic?.enabled || false}
                onCheckedChange={toggleConditionalLogic}
              />
            </div>

            {showConditionalLogic && variable.conditionalLogic?.enabled && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Show this variable when:</p>
                  {(variable.conditionalLogic.conditions?.length || 0) > 1 && (
                    <Select
                      value={variable.conditionalLogic.operator || 'AND'}
                      onValueChange={(value) => handleConditionalLogicChange({ operator: value as 'AND' | 'OR' })}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND" className="text-xs">ALL</SelectItem>
                        <SelectItem value="OR" className="text-xs">ANY</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  {(variable.conditionalLogic.conditions || []).map((cond, index) => (
                    <div key={cond.id} className="bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-800 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Condition {index + 1}</span>
                        {(variable.conditionalLogic?.conditions?.length || 0) > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeCondition(cond.id)} className="h-6 w-6 p-0 text-red-500">
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      <Select value={cond.dependsOnVariable || ''} onValueChange={(value) => updateCondition(cond.id, { dependsOnVariable: value })}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select variable..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableDependencies(variable, allVariables).map((dep) => (
                            <SelectItem key={dep.id} value={dep.id} className="text-sm">{dep.name} ({dep.type})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {cond.dependsOnVariable && (
                        <Select value={cond.condition || ''} onValueChange={(value) => updateCondition(cond.id, { condition: value })}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select condition..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const depVar = allVariables.find(v => v.id === cond.dependsOnVariable);
                              return depVar ? getAvailableConditions(depVar.type).map((c) => (
                                <SelectItem key={c} value={c} className="text-sm">{getConditionLabel(c)}</SelectItem>
                              )) : null;
                            })()}
                          </SelectContent>
                        </Select>
                      )}

                      {cond.condition && !['is_empty', 'is_not_empty'].includes(cond.condition) && (
                        (() => {
                          const depVar = allVariables.find(v => v.id === cond.dependsOnVariable);
                          const isNumericDep = ['number', 'slider', 'stepper'].includes(depVar?.type || '');
                          if (depVar && ['select', 'dropdown', 'multiple-choice'].includes(depVar.type) && depVar.options) {
                            return (
                              <Select value={String(cond.expectedValue || '')} onValueChange={(value) => updateCondition(cond.id, { expectedValue: value })}>
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Select value..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {depVar.options.map((opt, i) => (
                                    <SelectItem key={i} value={String(opt.value)} className="text-sm">{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          }
                          if (depVar?.type === 'checkbox') {
                            return (
                              <Select value={String(cond.expectedValue || '')} onValueChange={(value) => updateCondition(cond.id, { expectedValue: value === 'true' })}>
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Select value..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true" className="text-sm">Checked</SelectItem>
                                  <SelectItem value="false" className="text-sm">Unchecked</SelectItem>
                                </SelectContent>
                              </Select>
                            );
                          }
                          return (
                            <Input
                              type={isNumericDep ? 'number' : 'text'}
                              value={String(cond.expectedValue || '')}
                              onChange={(e) => updateCondition(cond.id, { expectedValue: isNumericDep ? parseFloat(e.target.value) || 0 : e.target.value })}
                              className="h-9 text-sm"
                              placeholder="Enter value..."
                            />
                          );
                        })()
                      )}
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={addCondition} className="w-full h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Condition
                </Button>

                {(variable.conditionalLogic.conditions?.length || 0) > 0 && (
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-700 space-y-2">
                    <Label className="text-sm text-gray-700 dark:text-gray-200 font-medium">Default value when hidden:</Label>
                    {['number', 'slider', 'stepper'].includes(variable.type) ? (
                      <div className="flex gap-2">
                        <Select
                          value={variable.conditionalLogic.defaultValue?.toString() || ''}
                          onValueChange={(value) => handleConditionalLogicChange({ defaultValue: Number(value) })}
                        >
                          <SelectTrigger className="h-9 text-sm flex-1">
                            <SelectValue placeholder="Quick select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0" className="text-sm">0 (for addition)</SelectItem>
                            <SelectItem value="1" className="text-sm">1 (for multiplication)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={variable.conditionalLogic.defaultValue?.toString() || ''}
                          onChange={(e) => handleConditionalLogicChange({ defaultValue: Number(e.target.value) || 0 })}
                          placeholder="Custom"
                          className="h-9 text-sm w-24"
                        />
                      </div>
                    ) : variable.type === 'checkbox' ? (
                      <Select
                        value={variable.conditionalLogic.defaultValue?.toString() || 'false'}
                        onValueChange={(value) => handleConditionalLogicChange({ defaultValue: value === 'true' })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false" className="text-sm">Unchecked</SelectItem>
                          <SelectItem value="true" className="text-sm">Checked</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={variable.conditionalLogic.defaultValue?.toString() || ''}
                        onChange={(e) => handleConditionalLogicChange({ defaultValue: e.target.value })}
                        placeholder={getDefaultValuePlaceholder(variable.type)}
                        className="h-9 text-sm"
                      />
                    )}
                    <p className="text-xs text-gray-500">{getDefaultValueDescription(variable.type)}</p>
                  </div>
                )}

                {getAvailableDependencies(variable, allVariables).length === 0 && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 p-2 rounded border border-amber-300 dark:border-amber-700">
                    Add more variables above this one to enable conditional logic
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Icon Generator Modal for single option */}
      <AIIconGeneratorModal
        isOpen={showSingleIconGenerator}
        onClose={() => {
          setShowSingleIconGenerator(false);
          setSingleIconGeneratorIndex(null);
        }}
        onIconGenerated={handleSingleIconGenerated}
        defaultPrompt={
          singleIconGeneratorIndex !== null && variable.options?.[singleIconGeneratorIndex]
            ? `${variable.options[singleIconGeneratorIndex].label} - ${variable.name}`
            : ''
        }
        title="Generate Option Icon"
      />

      {/* Bulk Style Description Dialog */}
      <Dialog open={showBulkStyleDialog} onOpenChange={setShowBulkStyleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Generate All Icons
            </DialogTitle>
            <DialogDescription>
              Generate icons for all {variable.options?.length || 0} options in "{variable.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-style">Style Description (optional)</Label>
              <Input
                id="bulk-style"
                placeholder="e.g., flat minimalist, 3D realistic, cartoon style..."
                value={bulkStyleDescription}
                onChange={(e) => setBulkStyleDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleBulkGenerateIcons();
                  }
                }}
              />
              <p className="text-xs text-gray-500">
                Describe the visual style for all icons. Leave empty for default style.
              </p>
            </div>

            {/* Reference Image Upload */}
            <div className="space-y-2">
              <Label>Reference Icon (optional)</Label>
              <div className="flex items-center gap-3">
                {bulkReferenceImage ? (
                  <div className="relative group">
                    <img
                      src={bulkReferenceImage}
                      alt="Reference"
                      className="w-12 h-12 object-cover rounded-lg border-2 border-purple-200"
                    />
                    <button
                      type="button"
                      onClick={removeBulkReferenceImage}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBulkReferenceUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="flex-1">
                  <p className="text-xs text-gray-500">
                    Upload an existing icon to match its style for all generated icons
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkStyleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkGenerateIcons}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Icons
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
