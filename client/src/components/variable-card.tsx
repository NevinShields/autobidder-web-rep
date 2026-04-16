import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Variable, PROPERTY_ATTRIBUTE_LABELS, PROPERTY_ATTRIBUTE_GROUPS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  X, Edit3, Check, DollarSign, Settings, Plus, Trash2, GripVertical, Upload,
  Zap, HelpCircle, ChevronDown, ChevronUp, Hash, Type, CheckSquare,
  SlidersHorizontal, List, Image, Copy, Video, ImageIcon, Sparkles, Loader2, Link2, Home, GalleryVerticalEnd, ArrowUp, ArrowDown
} from "lucide-react";
import AIIconGeneratorModal from "./ai-icon-generator-modal";
import IconSelector from "./icon-selector";
import { useToast } from "@/hooks/use-toast";
import { processIconWithBackgroundRemoval } from "@/lib/background-removal";
import { compressImage } from "@/lib/image-compress";
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

type OptionImageField = 'image' | 'questionCardImage';

type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  file?: (callback: (file: File) => void, errorCallback?: (error: DOMException) => void) => void;
  createReader?: () => {
    readEntries: (
      successCallback: (entries: FileSystemEntryLike[]) => void,
      errorCallback?: (error: DOMException) => void
    ) => void;
  };
};

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

interface VariableCardProps {
  variable: Variable;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Variable>) => void;
  allVariables?: Variable[];
  parentVariable?: Variable;
  onAIAssistVariable?: (variable: Variable, prompt: string, parentVariable?: Variable) => Promise<void>;
  activeAIAssistTargetId?: string | null;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

interface SortableOptionItemProps {
  option: { label: string; value: string | number; numericValue?: number; image?: string; questionCardImage?: string; id?: string; defaultUnselectedValue?: number };
  index: number;
  showIconImage?: boolean;
  showQuestionCardImage?: boolean;
  showDefaultUnselected?: boolean;
  dragActiveField?: OptionImageField | null;
  onUpdate: (index: number, updates: { label?: string; numericValue?: number; value?: string | number; image?: string; questionCardImage?: string; defaultUnselectedValue?: number }) => void;
  onDelete: (index: number) => void;
  onAIGenerate?: (index: number) => void;
  onOptionFileDrop?: (index: number, field: OptionImageField, files: File[]) => void;
  onOptionDragStateChange?: (state: { index: number; field: OptionImageField } | null) => void;
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

const variableAIPromptExamples: Record<string, string[]> = {
  number: [
    "Add a follow-up question after this one asking if there is a rush fee.",
    "Update this question so it works better for square footage pricing.",
  ],
  stepper: [
    "Change this into a clearer quantity picker and add a follow-up for oversized items.",
    "Make this better for counting rooms and add a premium quantity threshold.",
  ],
  text: [
    "Add a follow-up question after this one asking for more project details only when needed.",
    "Improve this question wording so customers know exactly what to enter.",
  ],
  checkbox: [
    "Turn this into a cleaner yes or no setup and add a follow-up question when yes is selected.",
    "Make this checkbox increase the price and show a follow-up detail question.",
  ],
  slider: [
    "Make this slider work better for project size and add a follow-up above a high value.",
    "Add clearer size ranges around this slider and a premium threshold follow-up question.",
  ],
  dropdown: [
    "Add options for Basic, Standard, Premium, and Luxury with realistic price values.",
    "Add a follow-up question after this dropdown when Premium or Luxury is selected.",
  ],
  select: [
    "Add a few more size options with realistic price values.",
    "Add a follow-up question after this field when the customer picks the highest tier.",
  ],
  "multiple-choice": [
    "Add three premium material options with realistic prices.",
    "Add a follow-up question after this variable when the customer picks the luxury option.",
  ],
};

const getVariableAIAssistDescription = (variable: Variable, parentVariable?: Variable) => {
  if (parentVariable) {
    return `Use AI to update this child question inside ${parentVariable.name} without rewriting the rest of the calculator.`;
  }

  if (['dropdown', 'multiple-choice', 'select'].includes(variable.type)) {
    return "Use AI to add options, refine labels, or insert a follow-up question after this variable.";
  }

  return "Use AI to refine this variable, adjust pricing behavior, or add a follow-up question right after it.";
};

function SortableOptionItem({
  option,
  index,
  showIconImage = false,
  showQuestionCardImage = false,
  showDefaultUnselected = false,
  dragActiveField = null,
  onUpdate,
  onDelete,
  onAIGenerate,
  onOptionFileDrop,
  onOptionDragStateChange,
}: SortableOptionItemProps) {
  const hasMediaOptions = showIconImage || showQuestionCardImage;
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
  const [showMediaControls, setShowMediaControls] = useState(false);

  const handleImageUpload = (field: OptionImageField, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onOptionFileDrop?.(index, field, [file]);
    }
  };

  const fieldShellClass =
    "rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80";

  const renderDropTarget = (field: OptionImageField, title: string) => {
    const value = field === 'image' ? option.image : option.questionCardImage;
    const isDragActive = dragActiveField === field;

    if (value) {
      return (
        <div className="relative group">
          <img
            src={value}
            alt={option.label}
            className="w-10 h-10 object-cover rounded-lg border dark:border-gray-600"
          />
          <button
            type="button"
            onClick={() => onUpdate(index, { [field]: '' })}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return (
      <label
        className={`w-10 h-10 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-900/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
        }`}
        title={title}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOptionDragStateChange?.({ index, field });
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOptionDragStateChange?.({ index, field });
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOptionDragStateChange?.(null);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const files = Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith('image/'));
          if (files.length > 0) {
            onOptionFileDrop?.(index, field, files);
          }
          onOptionDragStateChange?.(null);
        }}
      >
        <Upload className={`w-4 h-4 ${isDragActive ? 'text-amber-600 dark:text-amber-300' : 'text-gray-400'}`} />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleImageUpload(field, event)}
          className="hidden"
        />
      </label>
    );
  };

  const renderMediaPicker = (field: OptionImageField, label: string, title: string) => {
    const value = field === 'image' ? option.image : option.questionCardImage;

    return (
      <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-amber-50/60 p-3 shadow-[0_10px_30px_-24px_rgba(245,158,11,0.65)] dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/30">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="flex items-center gap-3">
          {renderDropTarget(field, title)}
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
              {value ? "Media attached" : title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Drop an image or open the library
            </p>
          </div>
        </div>
        <IconSelector
          onIconSelect={(_, iconUrl) => onUpdate(index, { [field]: iconUrl || '' })}
          triggerText={value ? "Change Media" : "Open Library"}
          size="sm"
          triggerVariant="outline"
          className="w-full"
          triggerClassName="h-8 w-full rounded-xl border-slate-200 bg-white/90 px-3 text-[11px] font-medium text-slate-700 hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-200"
        />
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_22px_60px_-34px_rgba(234,88,12,0.28)] dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-900"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100 active:cursor-grabbing dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
            title="Reorder option"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Option {index + 1}
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Configure answer, value, and media
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          className="h-9 w-9 flex-shrink-0 rounded-full p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40 self-start xl:self-auto"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)]">
          <div className={`${fieldShellClass} min-w-0`}>
            <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Answer
            </Label>
            <Input
              placeholder="Option label"
              value={option.label}
              onChange={(e) => {
                const label = e.target.value;
                const baseValue = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                const optionId = baseValue || `option_${index}`;
                onUpdate(index, { label, value: optionId });
              }}
              className="h-10 w-full rounded-xl border-slate-200 bg-white/95 text-sm shadow-none focus-visible:border-amber-400 focus-visible:ring-amber-200 dark:border-slate-700 dark:bg-slate-950/80"
            />
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Customer-facing option text.
            </p>
          </div>

          <div className={`${fieldShellClass} min-w-0`}>
            <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Value
            </Label>
            <Input
              type="number"
              placeholder="Price value"
              value={option.numericValue ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                onUpdate(index, { numericValue: value });
              }}
              className="h-10 w-full rounded-xl border-slate-200 bg-white/95 text-sm shadow-none focus-visible:border-amber-400 focus-visible:ring-amber-200 dark:border-slate-700 dark:bg-slate-950/80"
            />
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Numeric amount used in the formula.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {showDefaultUnselected ? (
            <div className={fieldShellClass}>
              <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Unselected State
              </Label>
              <Select
                value={String(option.defaultUnselectedValue ?? 0)}
                onValueChange={(val) => onUpdate(index, { defaultUnselectedValue: Number(val) })}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white/95 text-sm shadow-none focus:ring-amber-200 dark:border-slate-700 dark:bg-slate-950/80">
                  <SelectValue placeholder="Default when not selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Default: 0 (addition)</SelectItem>
                  <SelectItem value="1">Default: 1 (multiply)</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Controls the fallback formula value before selection.
              </p>
            </div>
          ) : null}

          {hasMediaOptions ? (
            showMediaControls ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowMediaControls(false)}
                  className="text-[11px] font-medium text-slate-500 transition-colors hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300"
                >
                  Hide media options
                </button>
                <div className="grid gap-3 md:grid-cols-2">
                  {showIconImage ? renderMediaPicker('image', 'Option Icon', 'Upload icon image') : null}
                  {showQuestionCardImage ? renderMediaPicker('questionCardImage', 'Question Card', 'Upload card image') : null}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMediaControls(true)}
                className="inline-flex items-center gap-1 self-start rounded-full px-1 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300"
              >
                <ImageIcon className="h-3 w-3" />
                {showIconImage && showQuestionCardImage
                  ? "Add icon or card media"
                  : showIconImage
                    ? "Add icon media"
                    : "Add card media"}
              </button>
            )
          ) : null}
        </div>
      </div>

    </div>
  );
}

function CompactSectionHeader({
  icon: Icon,
  title,
  tooltip,
  action,
}: {
  icon: any;
  title: string;
  tooltip?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
          {tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  onClick={(event) => event.stopPropagation()}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex flex-shrink-0 items-center gap-1">{action}</div> : null}
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

export default function VariableCard({
  variable,
  onDelete,
  onUpdate,
  allVariables = [],
  parentVariable,
  onAIAssistVariable,
  activeAIAssistTargetId,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: VariableCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(variable.name);
  const [isEditingId, setIsEditingId] = useState(false);
  const [editId, setEditId] = useState(variable.id);
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [editUnit, setEditUnit] = useState(variable.unit || '');
  const [isEditingType, setIsEditingType] = useState(false);
  const [editType, setEditType] = useState(variable.type);
  const [showOptions, setShowOptions] = useState(['select', 'dropdown', 'multiple-choice'].includes(variable.type));
  const [showConditionalLogic, setShowConditionalLogic] = useState(false);
  const [showVariableUtilities, setShowVariableUtilities] = useState(false);
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
  const [isEditingConnectionKey, setIsEditingConnectionKey] = useState(false);
  const [editConnectionKey, setEditConnectionKey] = useState(variable.connectionKey || '');
  const [showVariableAIDialog, setShowVariableAIDialog] = useState(false);
  const [variableAIPrompt, setVariableAIPrompt] = useState("");

  // AI Icon Generation state
  const [showSingleIconGenerator, setShowSingleIconGenerator] = useState(false);
  const [singleIconGeneratorIndex, setSingleIconGeneratorIndex] = useState<number | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ completed: 0, total: 0 });
  const [showBulkStyleDialog, setShowBulkStyleDialog] = useState(false);
  const [bulkStyleDescription, setBulkStyleDescription] = useState('');
  const [bulkReferenceImage, setBulkReferenceImage] = useState<string | null>(null);
  const [bulkDropTargetField, setBulkDropTargetField] = useState<OptionImageField>('image');
  const [optionDragState, setOptionDragState] = useState<{ index: number; field: OptionImageField } | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const tooltipImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingTooltipImage, setIsUploadingTooltipImage] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const TypeIcon = typeConfig[variable.type]?.icon || Hash;
  const typeColorClass = typeConfig[variable.type]?.color || "bg-gray-100 text-gray-700";
  const variableAssistTargetId = parentVariable ? `${parentVariable.id}::${variable.id}` : variable.id;
  const isVariableAIAssistPending = activeAIAssistTargetId === variableAssistTargetId;
  const currentVariableAIPromptExamples = variableAIPromptExamples[variable.type] || variableAIPromptExamples.number;
  const hasOptions = ['select', 'dropdown', 'multiple-choice'].includes(variable.type);
  const hasConditionalLogic = variable.conditionalLogic?.enabled;
  const sectionShellClass =
    "rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80";
  const sectionLabelClass =
    "text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400";
  const utilityTileClass =
    "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-700 dark:bg-slate-800/60 sm:p-3";
  const hasMoveControls = Boolean(onMoveUp || onMoveDown);

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

  const handleTooltipImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploadingTooltipImage(true);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
      
      const presignedResponse = await fetch('/api/objects/reference-image-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileExtension })
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, objectPath } = await presignedResponse.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const aclResponse = await fetch('/api/objects/set-reference-image-acl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectPath })
      });

      if (!aclResponse.ok) {
        throw new Error('Failed to set image permissions');
      }

      const { publicUrl } = await aclResponse.json();
      setEditTooltipImageUrl(publicUrl);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error('Tooltip image upload error:', error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingTooltipImage(false);
      if (tooltipImageInputRef.current) {
        tooltipImageInputRef.current.value = '';
      }
    }
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
        updates.options = [{ id: "option_1", label: "Option 1", value: "option_1", numericValue: 0, image: "", questionCardImage: "" }];
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

  const handleSaveConnectionKey = () => {
    if (onUpdate) {
      onUpdate(variable.id, {
        connectionKey: editConnectionKey.trim() || undefined
      });
    }
    setIsEditingConnectionKey(false);
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

  const handleVariableImageUpload = (field: 'questionCardDefaultImage', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpdate) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Upload failed", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Upload failed", description: "Please select an image smaller than 2MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      onUpdate(variable.id, { [field]: loadEvent.target?.result as string });
      toast({ title: "Default image added" });
    };
    reader.onerror = () => {
      toast({ title: "Upload failed", description: "Unable to read the image.", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  const handleAddOption = () => {
    if (!onUpdate) return;
    const num = (variable.options?.length || 0) + 1;
    const optionId = `option_${num}`;
    const newOption = { id: optionId, label: `Option ${num}`, value: optionId, numericValue: 0, image: "", questionCardImage: "" };
    onUpdate(variable.id, { options: [...(variable.options || []), newOption] });
  };

  const handleDeleteOption = (index: number) => {
    if (!onUpdate || !variable.options) return;
    onUpdate(variable.id, { options: variable.options.filter((_, i) => i !== index) });
  };

  const readFileAsDataUrl = (file: File, field: OptionImageField = 'image'): Promise<string> => {
    // Icon images: cap at 256×256 @ 75% quality (~10–30 KB typical)
    // Card images: cap at 800×600 @ 80% quality (~40–100 KB typical)
    const [maxW, maxH, quality] = field === 'image'
      ? [256, 256, 0.75]
      : [800, 600, 0.80];
    return compressImage(file, maxW, maxH, quality);
  };

  const validateOptionImageFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return `${file.name}: not an image file`;
    }
    if (file.size > 2 * 1024 * 1024) {
      return `${file.name}: must be smaller than 2MB`;
    }
    return null;
  };

  const applyFilesToOptions = async (field: OptionImageField, files: File[]) => {
    if (!onUpdate || !variable.options || files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({ title: "No images found", description: "Drop image files or a folder containing images.", variant: "destructive" });
      return;
    }

    const validationError = imageFiles.map(validateOptionImageFile).find(Boolean);
    if (validationError) {
      toast({ title: "Upload failed", description: validationError, variant: "destructive" });
      return;
    }

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();

    const nextOptions = [...variable.options];
    const matchedOptionIndexes = new Set<number>();
    const remainingFiles: File[] = [];

    for (const file of imageFiles) {
      const fileKey = normalize(file.name);
      const matchIndex = nextOptions.findIndex((option, optionIndex) => {
        if (matchedOptionIndexes.has(optionIndex)) return false;
        const optionKeys = [option.label, String(option.value ?? ''), option.id ?? ''].map(normalize).filter(Boolean);
        return optionKeys.some((key) => key === fileKey);
      });

      if (matchIndex >= 0) {
        nextOptions[matchIndex] = {
          ...nextOptions[matchIndex],
          [field]: await readFileAsDataUrl(file, field),
        };
        matchedOptionIndexes.add(matchIndex);
      } else {
        remainingFiles.push(file);
      }
    }

    for (const file of remainingFiles) {
      const nextIndex = nextOptions.findIndex((option, optionIndex) => {
        if (matchedOptionIndexes.has(optionIndex)) return false;
        const existingValue = field === 'image' ? option.image : option.questionCardImage;
        return !existingValue;
      });
      if (nextIndex < 0) break;
      nextOptions[nextIndex] = {
        ...nextOptions[nextIndex],
        [field]: await readFileAsDataUrl(file, field),
      };
      matchedOptionIndexes.add(nextIndex);
    }

    onUpdate(variable.id, { options: nextOptions });

    toast({
      title: "Images added",
      description: `${Math.min(imageFiles.length, nextOptions.length)} ${field === 'image' ? 'icon' : 'card'} image${imageFiles.length === 1 ? '' : 's'} applied to options.`,
    });
  };

  const handleOptionFileDrop = async (index: number, field: OptionImageField, files: File[]) => {
    if (!onUpdate || !variable.options || files.length === 0) return;

    const file = files.find((candidate) => candidate.type.startsWith('image/'));
    if (!file) {
      toast({ title: "Upload failed", description: "Please drop an image file.", variant: "destructive" });
      return;
    }

    const validationError = validateOptionImageFile(file);
    if (validationError) {
      toast({ title: "Upload failed", description: validationError, variant: "destructive" });
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file, field);
      handleOptionUpdate(index, { [field]: dataUrl });
      toast({ title: "Image added", description: `${field === 'image' ? 'Icon' : 'Card'} image saved for ${variable.options[index]?.label || 'option'}.` });
    } catch (error) {
      console.error('Option image upload failed', error);
      toast({ title: "Upload failed", description: "Unable to read the dropped image.", variant: "destructive" });
    } finally {
      setOptionDragState(null);
    }
  };

  const readAllDirectoryEntries = async (directoryEntry: FileSystemEntryLike): Promise<File[]> => {
    if (!directoryEntry.isDirectory || !directoryEntry.createReader) return [];
    const reader = directoryEntry.createReader();
    const entries: FileSystemEntryLike[] = [];

    while (true) {
      const batch = await new Promise<FileSystemEntryLike[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
      if (batch.length === 0) break;
      entries.push(...batch);
    }

    const nestedFiles = await Promise.all(entries.map(extractFilesFromEntry));
    return nestedFiles.flat();
  };

  const extractFilesFromEntry = async (entry: FileSystemEntryLike): Promise<File[]> => {
    if (entry.isFile && entry.file) {
      return [
        await new Promise<File>((resolve, reject) => {
          entry.file?.(resolve, reject);
        }),
      ];
    }

    if (entry.isDirectory) {
      return readAllDirectoryEntries(entry);
    }

    return [];
  };

  const extractDroppedFiles = async (dataTransfer: DataTransfer): Promise<File[]> => {
    const items = Array.from(dataTransfer.items || []) as DataTransferItemWithEntry[];
    const entryItems = items.filter((item) => typeof item.webkitGetAsEntry === 'function');

    if (entryItems.length > 0) {
      const entryFiles = await Promise.all(
        entryItems.map(async (item) => {
          const entry = item.webkitGetAsEntry?.();
          return entry ? extractFilesFromEntry(entry) : [];
        })
      );
      const flattened = entryFiles.flat();
      if (flattened.length > 0) {
        return flattened;
      }
    }

    return Array.from(dataTransfer.files || []);
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
    const currentLogic: NonNullable<Variable['conditionalLogic']> = variable.conditionalLogic || {
      enabled: false,
      operator: 'AND',
      conditions: [],
    };
    onUpdate(variable.id, { conditionalLogic: { ...currentLogic, ...updates } as NonNullable<Variable['conditionalLogic']> });
  };

  const toggleConditionalLogic = (enabled: boolean) => {
    if (!enabled) {
      onUpdate?.(variable.id, { conditionalLogic: { enabled: false, operator: 'AND', conditions: [] } });
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

  const resolveConditionOptionValue = (
    depVar: Variable | undefined,
    rawValue: unknown,
    rawValues?: unknown,
  ) => {
    const resolvedRawValue = Array.isArray(rawValues) && rawValues.length > 0
      ? rawValues[0]
      : rawValue;

    if (!depVar?.options || resolvedRawValue === undefined || resolvedRawValue === null) {
      return String(resolvedRawValue ?? '');
    }

    const rawString = String(resolvedRawValue).trim();
    const loweredRawString = rawString.toLowerCase();
    const match = depVar.options.find((option) => {
      if (option.value === resolvedRawValue || option.id === resolvedRawValue || option.label === resolvedRawValue) {
        return true;
      }

      return [
        String(option.value ?? '').trim(),
        String(option.id ?? '').trim(),
        String(option.label ?? '').trim(),
      ].some((candidate) => candidate.toLowerCase() === loweredRawString);
    });

    return String(match?.value ?? resolvedRawValue);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleVariableAIAssist = async () => {
    if (!onAIAssistVariable || !variableAIPrompt.trim()) {
      return;
    }

    await onAIAssistVariable(variable, variableAIPrompt, parentVariable);
    setShowVariableAIDialog(false);
    setVariableAIPrompt("");
  };

  const moveControls = hasMoveControls ? (
    <div className="flex items-center gap-0.5 rounded-full border border-slate-200/80 bg-white/70 p-0.5 dark:border-slate-700 dark:bg-slate-900/60">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onMoveUp?.();
        }}
        disabled={!canMoveUp}
        className="h-7 w-7 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-35 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label={`Move ${variable.name} up`}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onMoveDown?.();
        }}
        disabled={!canMoveDown}
        className="h-7 w-7 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-35 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label={`Move ${variable.name} down`}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  ) : null;

  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.38)] transition-all duration-200 dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/95">
      {/* Header */}
      <div
        className="cursor-pointer bg-gradient-to-r from-white via-white to-amber-50/45 px-5 py-4 transition-colors hover:from-amber-50/70 hover:to-orange-50/70 dark:from-slate-900/95 dark:via-slate-900/95 dark:to-amber-950/20"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Mobile: Show variable name on its own line above */}
        <div className="sm:hidden mb-2">
          {isEditingName ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 flex-1 rounded-xl border-slate-200 bg-white/95 text-sm font-medium dark:border-slate-700 dark:bg-slate-950/80"
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="block break-words pr-1 text-base font-semibold leading-tight text-slate-900 dark:text-white">
                  {variable.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {moveControls}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditingName(true); setEditName(variable.name); }}
                  className="rounded-full p-1 text-slate-400 hover:bg-white/80 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-300"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden rounded-full border border-amber-200 bg-amber-50 p-1 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 sm:inline-flex" onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}>
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>

          <Badge variant="outline" className={`${typeColorClass} border text-[11px] font-medium px-2.5 py-1 flex items-center gap-1 rounded-full shadow-sm`}>
            <TypeIcon className="w-3 h-3" />
            {typeConfig[variable.type]?.label || variable.type}
          </Badge>

          {/* Desktop: Show name inline */}
          {isEditingName ? (
            <div className="hidden sm:flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 flex-1 rounded-xl border-slate-200 bg-white/95 text-sm font-medium dark:border-slate-700 dark:bg-slate-950/80"
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
              <span className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-white">
                {variable.name}
              </span>
              {moveControls}
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingName(true); setEditName(variable.name); }}
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-white/80 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-300"
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
              <Badge variant="secondary" className="rounded-full border border-slate-200 bg-white/80 text-[11px] text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {variable.options.length} options
              </Badge>
            )}
            {hasConditionalLogic && (
              <Badge variant="secondary" className="rounded-full border border-amber-200 bg-amber-50 text-[11px] text-amber-700 shadow-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <Zap className="w-3 h-3 mr-1" />
                Conditional
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onAIAssistVariable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVariableAIDialog(true);
                    }}
                    className="h-9 w-9 rounded-full p-0 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-300"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  {getVariableAIAssistDescription(variable, parentVariable)}
                </TooltipContent>
              </Tooltip>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(variable.id); }}
              className="h-9 w-9 rounded-full p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="space-y-4 border-t border-slate-200/80 bg-gradient-to-b from-slate-50/70 to-white px-5 pb-5 pt-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/95">
          {/* Variable ID */}
          <div className={`${sectionShellClass} flex items-center justify-between`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`${sectionLabelClass} flex-shrink-0`}>ID</span>
              {isEditingId ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editId}
                    onChange={(e) => setEditId(e.target.value)}
                    className="h-8 flex-1 rounded-xl border-slate-200 bg-white/95 text-xs font-mono dark:border-slate-700 dark:bg-slate-950/80"
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
                <code className="truncate rounded-full bg-amber-50 px-3 py-1 text-xs font-mono text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {variable.id}
                </code>
              )}
            </div>
            {!isEditingId && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(variable.id)} className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingId(true)} className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30">
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Type & Configuration Grid */}
          <div className={`${sectionShellClass} grid grid-cols-1 gap-3 sm:grid-cols-2`}>
            {/* Type Selector */}
            <div className="space-y-1.5">
              <Label className={sectionLabelClass}>Type</Label>
              {isEditingType ? (
                <div className="space-y-2">
                  <Select value={editType} onValueChange={(value: typeof editType) => setEditType(value)}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white/95 text-sm dark:border-slate-700 dark:bg-slate-950/80">
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
                <div className="flex h-10 items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-3 dark:border-slate-700 dark:bg-slate-950/70">
                  <span className="text-sm text-slate-900 dark:text-slate-200 capitalize">{typeConfig[variable.type]?.label || variable.type}</span>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingType(true)} className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30">
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

          <div className={sectionShellClass}>
            <CompactSectionHeader
              icon={Sparkles}
              title="Variable Utilities"
              tooltip="Keep supporting settings in one place. Tiles expand only when they need more room."
              action={(
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVariableUtilities((current) => !current)}
                  className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  {showVariableUtilities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
            />
            {showVariableUtilities ? (
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-2">
              <div className={`${isEditingTooltip ? "lg:col-span-2" : ""} ${utilityTileClass}`}>
                <CompactSectionHeader
                  icon={HelpCircle}
                  title="Help"
                  tooltip="Optional guidance content shown to users for this variable. Add supporting text, a video URL, or an image."
                  action={!isEditingTooltip ? (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setIsEditingTooltip(true);
                      setEditTooltip(variable.tooltip || '');
                      setEditTooltipVideoUrl(variable.tooltipVideoUrl || '');
                      setEditTooltipImageUrl(variable.tooltipImageUrl || '');
                    }} className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  ) : null}
                />
                {isEditingTooltip ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label className={`${sectionLabelClass} mb-1 block`}>Help Text</Label>
                      <Textarea
                        value={editTooltip}
                        onChange={(e) => setEditTooltip(e.target.value)}
                        placeholder="Add a description to help users understand this question..."
                        className="min-h-[60px] rounded-xl border-slate-200 bg-white/95 text-sm dark:border-slate-700 dark:bg-slate-950/80"
                        maxLength={200}
                      />
                      <span className="text-xs text-slate-400 dark:text-slate-500">{editTooltip.length}/200</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label className={`${sectionLabelClass} mb-1 flex items-center gap-1`}>
                          <Video className="w-3 h-3" />
                          Video URL
                        </Label>
                        <Input
                          value={editTooltipVideoUrl}
                          onChange={(e) => setEditTooltipVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="h-9 rounded-xl border-slate-200 bg-white/95 text-xs dark:border-slate-700 dark:bg-slate-950/80"
                        />
                      </div>
                      <div>
                        <Label className={`${sectionLabelClass} mb-1 flex items-center gap-1`}>
                          <ImageIcon className="w-3 h-3" />
                          Image
                        </Label>
                        <input
                          ref={tooltipImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleTooltipImageUpload}
                          className="hidden"
                        />
                        {editTooltipImageUrl ? (
                          <div className="flex items-center gap-2">
                            <div className="relative group">
                              <img
                                src={editTooltipImageUrl}
                                alt="Tooltip preview"
                                className="h-10 w-10 rounded-lg border border-slate-200 object-cover dark:border-slate-600"
                              />
                              <button
                                type="button"
                                onClick={() => setEditTooltipImageUrl('')}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => tooltipImageInputRef.current?.click()}
                              disabled={isUploadingTooltipImage}
                              className="h-8 rounded-xl text-xs"
                            >
                              {isUploadingTooltipImage ? <Loader2 className="w-3 h-3 animate-spin" /> : "Change"}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => tooltipImageInputRef.current?.click()}
                            disabled={isUploadingTooltipImage}
                            className="h-9 w-full rounded-xl text-xs"
                          >
                            {isUploadingTooltipImage ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3 mr-1" />
                                Upload Image
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={handleSaveTooltip} className="h-8 rounded-xl text-xs">Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setIsEditingTooltip(false);
                        setEditTooltip(variable.tooltip || '');
                        setEditTooltipVideoUrl(variable.tooltipVideoUrl || '');
                        setEditTooltipImageUrl(variable.tooltipImageUrl || '');
                      }} className="h-8 rounded-xl text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                      {variable.tooltip || <span className="italic text-slate-400 dark:text-slate-500">No help text</span>}
                    </div>
                    {(variable.tooltipVideoUrl || variable.tooltipImageUrl) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {variable.tooltipVideoUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                            <Video className="w-3 h-3" />
                            Video
                          </span>
                        ) : null}
                        {variable.tooltipImageUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <ImageIcon className="w-3 h-3" />
                            Image
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`${isEditingConnectionKey ? "lg:col-span-2" : ""} ${utilityTileClass}`}>
                <CompactSectionHeader
                  icon={Link2}
                  title="Link"
                  tooltip="Variables with the same connection key sync their values across services."
                  action={!isEditingConnectionKey ? (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setIsEditingConnectionKey(true);
                      setEditConnectionKey(variable.connectionKey || '');
                    }} className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  ) : null}
                />
                {isEditingConnectionKey ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Variables with the same connection key sync their values across services. <strong>Note:</strong> To auto-fill from property data, use Prefill below instead.
                    </p>
                    <div>
                      <Label className={`${sectionLabelClass} mb-1 block text-blue-600 dark:text-blue-400`}>Connection Key</Label>
                      <Input
                        value={editConnectionKey}
                        onChange={(e) => setEditConnectionKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                        placeholder="e.g., house_sqft, stories"
                        className="h-9 rounded-xl border-blue-200 bg-white/95 text-xs font-mono dark:border-blue-800 dark:bg-slate-950/80"
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={handleSaveConnectionKey} className="h-8 rounded-xl text-xs">Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setIsEditingConnectionKey(false);
                        setEditConnectionKey(variable.connectionKey || '');
                      }} className="h-8 rounded-xl text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    {variable.connectionKey ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded-full bg-blue-50 px-3 py-1 text-xs font-mono text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {variable.connectionKey}
                        </code>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Syncs across services</span>
                      </div>
                    ) : (
                      <span className="text-sm italic text-slate-400 dark:text-slate-500">Not linked</span>
                    )}
                  </div>
                )}
              </div>

              <div className={utilityTileClass}>
                <CompactSectionHeader
                  icon={Home}
                  title="Prefill"
                  tooltip="Use address lookup data to auto-fill this variable when a customer enters a property."
                />
                <div className="mt-3">
                  {variable.prefillSourceKey ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800">
                        {PROPERTY_ATTRIBUTE_LABELS[variable.prefillSourceKey] || variable.prefillSourceKey}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate?.(variable.id, { prefillSourceKey: null })}
                        className="h-6 w-6 rounded-full p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={(value) => onUpdate?.(variable.id, { prefillSourceKey: value })}>
                      <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-xs dark:border-slate-700 dark:bg-slate-950/80">
                        <SelectValue placeholder="Select property attribute..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROPERTY_ATTRIBUTE_GROUPS).map(([group, keys]) => (
                          <SelectGroup key={group}>
                            <SelectLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400">{group}</SelectLabel>
                            {keys.map((key) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                {PROPERTY_ATTRIBUTE_LABELS[key]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {variable.type === 'multiple-choice' ? (
                <div className={utilityTileClass}>
                  <CompactSectionHeader
                    icon={CheckSquare}
                    title="Multi-Select"
                    tooltip="Allow users to pick more than one option at a time."
                  />
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <div>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Allow multiple</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Each option can be selected independently</p>
                    </div>
                    <Switch
                      checked={variable.allowMultipleSelection || false}
                      onCheckedChange={(checked) => onUpdate?.(variable.id, { allowMultipleSelection: checked })}
                    />
                  </div>
                </div>
              ) : null}

              <div className={`lg:col-span-2 ${utilityTileClass}`}>
                <CompactSectionHeader
                  icon={GalleryVerticalEnd}
                  title="Default Card Image"
                  tooltip="Fallback media shown on the question before a specific option card image takes over."
                />
                <div className="mt-3 flex flex-col gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Shows on this question by default until an option-specific card image is available.
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {variable.questionCardDefaultImage ? (
                      <div className="relative group">
                        <img
                          src={variable.questionCardDefaultImage}
                          alt="Default question card"
                          className="h-14 w-14 rounded-lg border border-slate-200 object-cover dark:border-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdate?.(variable.id, { questionCardDefaultImage: undefined })}
                          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 px-3 text-xs font-medium text-slate-600 hover:border-amber-400 hover:bg-amber-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-amber-900/20">
                        <Upload className="mr-1 h-3 w-3" />
                        {variable.questionCardDefaultImage ? 'Change' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => handleVariableImageUpload('questionCardDefaultImage', event)}
                        />
                      </label>
                      <IconSelector
                        onIconSelect={(_, iconUrl) => {
                          if (!onUpdate) return;
                          onUpdate(variable.id, { questionCardDefaultImage: iconUrl || undefined });
                          if (iconUrl) {
                            toast({ title: "Default image added" });
                          }
                        }}
                        triggerText={variable.questionCardDefaultImage ? "Library" : "Choose from library"}
                        size="sm"
                        triggerVariant="outline"
                        triggerClassName="h-9 rounded-lg px-3 text-xs"
                      />
                      {variable.questionCardDefaultImage ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg px-3 text-xs text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                          onClick={() => onUpdate?.(variable.id, { questionCardDefaultImage: undefined })}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : null}
          </div>

          {/* Options Section */}
          {hasOptions && (
            <div className={sectionShellClass}>
              <CompactSectionHeader
                icon={Settings}
                title={`Options (${variable.options?.length || 0})`}
                tooltip="Manage selectable answers, formula values, and optional media for this variable."
                action={(
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOptions(!showOptions)}
                    className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                  >
                    {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
              />

              {showOptions && variable.options && (
                <div className="mt-3">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={variable.options.map((_, i) => `option-${i}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {(variable.type === 'multiple-choice' || variable.type === 'dropdown') && (
                        <div
                          className="rounded-xl border border-dashed border-amber-300/80 bg-amber-50/70 p-3 dark:border-amber-700/70 dark:bg-amber-950/20"
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onDrop={async (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const droppedFiles = await extractDroppedFiles(event.dataTransfer);
                            await applyFilesToOptions(bulkDropTargetField, droppedFiles);
                          }}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                Drop a folder or multiple images to fill option media
                              </p>
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                Files match option labels first. Anything unmatched fills the remaining empty slots in order.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={bulkDropTargetField === 'image' ? 'unstyled' : 'outline'}
                                size="sm"
                                className={bulkDropTargetField === 'image' ? 'h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'h-8 rounded-lg'}
                                onClick={() => setBulkDropTargetField('image')}
                              >
                                Fill Icons
                              </Button>
                              <Button
                                type="button"
                                variant={bulkDropTargetField === 'questionCardImage' ? 'unstyled' : 'outline'}
                                size="sm"
                                className={bulkDropTargetField === 'questionCardImage' ? 'h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'h-8 rounded-lg'}
                                onClick={() => setBulkDropTargetField('questionCardImage')}
                              >
                                Fill Cards
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                    <div className="space-y-2">
                      {variable.options.map((option, index) => (
                        <SortableOptionItem
                          key={`option-${index}`}
                          option={option}
                          index={index}
                          showIconImage={variable.type === 'multiple-choice'}
                          showQuestionCardImage={variable.type === 'multiple-choice' || variable.type === 'dropdown'}
                          showDefaultUnselected={variable.type === 'multiple-choice' && variable.allowMultipleSelection}
                          dragActiveField={optionDragState?.index === index ? optionDragState.field : null}
                          onUpdate={handleOptionUpdate}
                          onDelete={handleDeleteOption}
                          onOptionFileDrop={handleOptionFileDrop}
                          onOptionDragStateChange={setOptionDragState}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddOption}
                        className="mt-1 h-10 w-full rounded-xl border-dashed text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Option
                      </Button>
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>
                </div>
              )}
            </div>
          )}

          {/* Conditional Logic Section */}
          <div className={sectionShellClass}>
            <CompactSectionHeader
              icon={Zap}
              title="Conditional Display"
              tooltip="Control when this variable appears, based on values from other variables."
              action={(
                <>
                  {hasConditionalLogic ? <Badge variant="secondary" className="rounded-full border border-amber-200 bg-amber-50 text-[11px] text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Active</Badge> : null}
                  <Switch
                    checked={variable.conditionalLogic?.enabled || false}
                    onCheckedChange={toggleConditionalLogic}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConditionalLogic(!showConditionalLogic)}
                    className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                  >
                    {showConditionalLogic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </>
              )}
            />

            {showConditionalLogic && variable.conditionalLogic?.enabled && (
              <div className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-900/20">
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
                              <Select
                                value={resolveConditionOptionValue(depVar, cond.expectedValue, cond.expectedValues)}
                                onValueChange={(value) => updateCondition(
                                  cond.id,
                                  cond.condition === 'contains'
                                    ? { expectedValue: value, expectedValues: [value] }
                                    : { expectedValue: value, expectedValues: undefined },
                                )}
                              >
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

      {showVariableAIDialog && typeof document !== "undefined" && createPortal(
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-end p-3 sm:p-4">
          <div
            className="pointer-events-auto relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-amber-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,237,0.96),rgba(248,250,252,0.96))] shadow-[0_40px_90px_-48px_rgba(234,88,12,0.45)] dark:border-amber-500/15 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(15,23,42,0.98))]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/3 rounded-full bg-gradient-to-br from-amber-200/55 to-transparent blur-3xl dark:from-amber-500/10" />
            <div className="relative flex max-h-[min(78vh,720px)] flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-amber-100/70 px-5 pb-4 pt-5 dark:border-amber-500/10">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600/80 dark:text-amber-300/80">
                        Variable Assist
                      </p>
                      <h3
                        className="truncate text-xl text-slate-900 dark:text-white"
                        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                      >
                        Edit {variable.name}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 pr-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Keep this open while you scroll. Use it as a quick AI bubble for scoped edits.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowVariableAIDialog(false);
                    setVariableAIPrompt("");
                  }}
                  disabled={isVariableAIAssistPending}
                  className="h-9 w-9 shrink-0 rounded-full p-0 text-slate-500 hover:bg-white/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-4 backdrop-blur-sm dark:border-amber-500/20 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Selected Variable
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {variable.name}
                      </p>
                    </div>
                    <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <TypeIcon className="mr-1 h-3 w-3" />
                      {typeConfig[variable.type]?.label || variable.type}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {parentVariable
                      ? `This question lives inside the repeatable group ${parentVariable.name}.`
                      : "AI can update this variable's options or insert a follow-up question after it."}
                  </p>
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    Reference the builder while typing. This panel stays pinned to the corner.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900/80">
                  <Label htmlFor={`variable-ai-prompt-${variableAssistTargetId}`} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    What should AI change?
                  </Label>
                  <Textarea
                    id={`variable-ai-prompt-${variableAssistTargetId}`}
                    value={variableAIPrompt}
                    onChange={(event) => setVariableAIPrompt(event.target.value)}
                    placeholder="Describe the exact options or follow-up question you want AI to add."
                    className="mt-3 min-h-[132px] rounded-2xl border-slate-200 bg-white/95 text-sm leading-6 text-slate-700 focus-visible:border-amber-400 focus-visible:ring-amber-200 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentVariableAIPromptExamples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setVariableAIPrompt(example)}
                        className="rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-amber-100/70 px-5 pb-5 pt-4 dark:border-amber-500/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVariableAIDialog(false);
                    setVariableAIPrompt("");
                  }}
                  disabled={isVariableAIAssistPending}
                  className="rounded-xl border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                >
                  Close
                </Button>
                <Button
                  onClick={handleVariableAIAssist}
                  disabled={!variableAIPrompt.trim() || isVariableAIAssistPending}
                  className="flex-1 rounded-xl border-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700"
                >
                  {isVariableAIAssistPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Apply Variable Update
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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
