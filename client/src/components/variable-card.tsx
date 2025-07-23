import { useState } from "react";
import { Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Edit3, Check, DollarSign, Settings, Plus, Trash2, GripVertical, Upload, Image } from "lucide-react";
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
      className="flex items-center space-x-2 p-2 bg-gray-50 rounded border"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      
      {/* Image preview and upload */}
      <div className="flex flex-col items-center space-y-1">
        {option.image ? (
          <div className="relative">
            <img 
              src={option.image} 
              alt={option.label} 
              className="w-8 h-8 object-cover rounded border"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdate(index, { image: '' })}
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-red-400 hover:text-red-600 bg-white rounded-full border"
            >
              <X className="w-2 h-2" />
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
            <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400">
              <Upload className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        )}
      </div>
      
      <Input
        placeholder="Option label"
        value={option.label}
        onChange={(e) => {
          const label = e.target.value;
          // Auto-generate value from label (lowercase, replace spaces with underscores)
          const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          onUpdate(index, { label, value });
        }}
        className="flex-1 h-8 text-xs"
      />
      
      <Input
        type="number"
        placeholder="Price"
        value={option.numericValue || ''}
        onChange={(e) => {
          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
          onUpdate(index, { numericValue: value });
        }}
        className="w-20 h-8 text-xs"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(index)}
        className="text-red-400 hover:text-red-600 p-1"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default function VariableCard({ variable, onDelete, onUpdate }: VariableCardProps) {
  const [isEditingId, setIsEditingId] = useState(false);
  const [editId, setEditId] = useState(variable.id);
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [editUnit, setEditUnit] = useState(variable.unit || '');
  const [isEditingType, setIsEditingType] = useState(false);
  const [editType, setEditType] = useState(variable.type);
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      // When changing type, reset options if moving to/from option-based types
      const needsOptions = ['select', 'dropdown', 'multiple-choice', 'checkbox'].includes(editType);
      const hadOptions = ['select', 'dropdown', 'multiple-choice', 'checkbox'].includes(variable.type);
      
      let updates: Partial<Variable> = { type: editType };
      
      if (needsOptions && !hadOptions) {
        // Adding options for first time
        updates.options = [{ label: "Option 1", value: "option_1", numericValue: 0, image: "" }];
      } else if (!needsOptions && hadOptions) {
        // Removing options
        updates.options = undefined;
      }
      
      onUpdate(variable.id, updates);
    }
    setIsEditingType(false);
  };

  const handleCancelTypeEdit = () => {
    setIsEditingType(false);
    setEditType(variable.type);
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

  // Check if this variable type supports options
  const hasOptions = ['select', 'dropdown', 'multiple-choice', 'checkbox'].includes(variable.type);
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
          <div className="flex items-center justify-between">
            <label className="text-gray-600">Type:</label>
            {!isEditingType && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingType(true);
                  setEditType(variable.type);
                }}
                className="text-gray-400 hover:text-blue-500 p-0.5 h-4 w-4"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </Button>
            )}
          </div>
          {isEditingType ? (
            <div className="flex items-center space-x-1 mt-1">
              <Select value={editType} onValueChange={(value: typeof editType) => setEditType(value)}>
                <SelectTrigger className="text-xs h-5 px-1 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="select">Select (Legacy)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveType}
                className="text-green-600 hover:text-green-700 p-0.5 h-4 w-4"
              >
                <Check className="w-2.5 h-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelTypeEdit}
                className="text-gray-400 hover:text-gray-600 p-0.5 h-4 w-4"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </div>
          ) : (
            <span className="text-gray-900 ml-1 capitalize">{variable.type}</span>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-gray-600">
              {['select', 'dropdown', 'multiple-choice'].includes(variable.type) ? 'Options:' : 'Unit:'}
            </label>
            {!['select', 'dropdown', 'multiple-choice'].includes(variable.type) && !isEditingUnit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingUnit(true);
                  setEditUnit(variable.unit || '');
                }}
                className="text-gray-400 hover:text-blue-500 p-0.5 h-4 w-4"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </Button>
            )}
          </div>
          {hasOptions ? (
            <div className="flex items-center space-x-1">
              <span className="text-gray-900 ml-1">{variable.options?.length || 0}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPricingDetails(!showPricingDetails)}
                className="text-gray-400 hover:text-blue-500 p-0.5 h-4 w-4"
              >
                <Settings className="w-2.5 h-2.5" />
              </Button>
            </div>
          ) : isEditingUnit ? (
            <div className="flex items-center space-x-1 mt-1">
              <Input
                value={editUnit}
                onChange={(e) => {
                  const value = e.target.value.substring(0, 15); // Limit to 15 characters
                  setEditUnit(value);
                }}
                className="text-xs h-5 px-1 flex-1"
                placeholder="Unit (e.g., sq ft)"
                maxLength={15}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveUnit}
                className="text-green-600 hover:text-green-700 p-0.5 h-4 w-4"
              >
                <Check className="w-2.5 h-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelUnitEdit}
                className="text-gray-400 hover:text-gray-600 p-0.5 h-4 w-4"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </div>
          ) : (
            <span className="text-gray-900 ml-1">{variable.unit || 'N/A'}</span>
          )}
        </div>
      </div>

      {/* Options Configuration Section */}
      {hasOptions && showPricingDetails && (
        <div className="pt-3 border-t border-gray-200">
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
              Add Option
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
                <div className="space-y-2">
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
            <div className="text-center py-4 text-gray-400 border-2 border-dashed border-gray-200 rounded">
              <p className="text-xs">No options yet</p>
              <p className="text-xs mt-1">Click "Add Option" to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Pricing Details Section */}
      {hasOptionsWithPricing && !showPricingDetails && (
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Drag to reorder • Set labels and pricing values:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option
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
                    <div className="space-y-2">
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
                <div className="text-center py-4 text-gray-400 border-2 border-dashed border-gray-200 rounded">
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
              
              <div className="text-xs text-gray-400 mt-2 space-y-1">
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
    </div>
  );
}
