import { useState } from "react";
import { Variable } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Upload, Hash, Type, CheckSquare, SlidersHorizontal, ChevronDown, List, Image, X } from "lucide-react";
import { nanoid } from "nanoid";

interface AddVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVariable: (variable: Variable) => void;
}

const variableTypeConfig = {
  number: { icon: Hash, label: "Number", description: "Numeric input for calculations" },
  text: { icon: Type, label: "Text", description: "Text input field" },
  checkbox: { icon: CheckSquare, label: "Checkbox", description: "Yes/No toggle option" },
  slider: { icon: SlidersHorizontal, label: "Slider", description: "Range slider with min/max" },
  dropdown: { icon: ChevronDown, label: "Dropdown", description: "Single selection from list" },
  "multiple-choice": { icon: Image, label: "Multiple Choice", description: "Options with images" },
};

export default function AddVariableModal({ isOpen, onClose, onAddVariable }: AddVariableModalProps) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [type, setType] = useState<Variable["type"]>("number");
  const [unit, setUnit] = useState("");
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false);
  const [options, setOptions] = useState([{ label: "", value: "", numericValue: 0, image: "" }]);
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(100);
  const [step, setStep] = useState<number>(1);
  const [checkedValue, setCheckedValue] = useState<string>("1");
  const [uncheckedValue, setUncheckedValue] = useState<string>("0");

  const handleSubmit = () => {
    if (!name) return;

    const variableId = id.trim() || nanoid();

    const variable: Variable = {
      id: variableId,
      name,
      type,
      unit: unit || undefined,
      allowMultipleSelection: type === 'multiple-choice' ? allowMultipleSelection : undefined,
      options: (type === 'select' || type === 'dropdown' || type === 'multiple-choice')
        ? options.filter(opt => opt.label.trim()).map(opt => {
            const optionId = (type === 'multiple-choice' && allowMultipleSelection)
              ? opt.label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
              : undefined;

            return {
              id: optionId,
              label: opt.label.trim(),
              value: opt.value || opt.label.trim(),
              numericValue: opt.numericValue || 0,
              image: opt.image || undefined
            };
          })
        : undefined,
      min: type === 'slider' ? min : undefined,
      max: type === 'slider' ? max : undefined,
      step: type === 'slider' ? step : undefined,
      checkedValue: type === 'checkbox' ? (checkedValue || undefined) : undefined,
      uncheckedValue: type === 'checkbox' ? (uncheckedValue || undefined) : undefined,
    };

    onAddVariable(variable);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setId("");
    setType("number");
    setUnit("");
    setAllowMultipleSelection(false);
    setOptions([{ label: "", value: "", numericValue: 0, image: "" }]);
    setMin(0);
    setMax(100);
    setStep(1);
    setCheckedValue("1");
    setUncheckedValue("0");
    onClose();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!id) {
      const autoId = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      setId(autoId);
    }
  };

  const addOption = () => {
    setOptions([...options, { label: "", value: "", numericValue: 0, image: "" }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = options.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt
    );
    setOptions(updatedOptions);
  };

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateOption(index, 'image', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const needsOptions = ['select', 'dropdown', 'multiple-choice'].includes(type);
  const needsSliderConfig = type === 'slider';
  const needsCheckboxConfig = type === 'checkbox';
  const TypeIcon = variableTypeConfig[type as keyof typeof variableTypeConfig]?.icon || Hash;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-gray-50/80">
          <DialogTitle className="text-lg font-semibold">Add New Variable</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Create a variable for your pricing formula
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="variable-name" className="text-sm font-medium text-gray-700">
                Variable Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="variable-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Square Footage"
                className="mt-1.5 h-11"
              />
            </div>

            <div>
              <Label htmlFor="variable-id" className="text-sm font-medium text-gray-700">
                Variable ID
              </Label>
              <Input
                id="variable-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Auto-generated from name"
                className="mt-1.5 h-11 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Used in formulas like: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{id || 'variableid'} * 10</code>
              </p>
            </div>
          </div>

          {/* Variable Type Section */}
          <div className="pt-2">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Variable Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(variableTypeConfig).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key as Variable["type"])}
                    className={`
                      flex flex-col items-center p-3 rounded-lg border-2 transition-all text-left
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit Field (for number/text types) */}
          {!needsOptions && !needsSliderConfig && !needsCheckboxConfig && (
            <div className="pt-2">
              <Label htmlFor="variable-unit" className="text-sm font-medium text-gray-700">
                Unit Label <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="variable-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value.substring(0, 15))}
                placeholder="e.g., sq ft, hours, items"
                maxLength={15}
                className="mt-1.5 h-11"
              />
            </div>
          )}

          {/* Checkbox Configuration */}
          {needsCheckboxConfig && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium text-gray-700">Checkbox Values</Label>
              </div>
              <p className="text-xs text-gray-500">
                Set numeric values for formula calculations when checked or unchecked.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <Label htmlFor="checked-value" className="text-xs font-medium text-green-700 block mb-1.5">
                    When Checked
                  </Label>
                  <Input
                    id="checked-value"
                    value={checkedValue}
                    onChange={(e) => setCheckedValue(e.target.value)}
                    placeholder="1"
                    className="h-10 bg-white"
                    data-testid="input-checked-value"
                  />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <Label htmlFor="unchecked-value" className="text-xs font-medium text-gray-600 block mb-1.5">
                    When Unchecked
                  </Label>
                  <Input
                    id="unchecked-value"
                    value={uncheckedValue}
                    onChange={(e) => setUncheckedValue(e.target.value)}
                    placeholder="0"
                    className="h-10 bg-white"
                    data-testid="input-unchecked-value"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Slider Configuration */}
          {needsSliderConfig && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium text-gray-700">Slider Range</Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="slider-min" className="text-xs text-gray-600 block mb-1.5">Min</Label>
                  <Input
                    id="slider-min"
                    type="number"
                    value={min}
                    onChange={(e) => setMin(Number(e.target.value))}
                    placeholder="0"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="slider-max" className="text-xs text-gray-600 block mb-1.5">Max</Label>
                  <Input
                    id="slider-max"
                    type="number"
                    value={max}
                    onChange={(e) => setMax(Number(e.target.value))}
                    placeholder="100"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="slider-step" className="text-xs text-gray-600 block mb-1.5">Step</Label>
                  <Input
                    id="slider-step"
                    type="number"
                    value={step}
                    onChange={(e) => setStep(Number(e.target.value))}
                    placeholder="1"
                    min="0.01"
                    step="0.01"
                    className="h-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="slider-unit" className="text-xs text-gray-600 block mb-1.5">
                  Unit Label <span className="text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="slider-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value.substring(0, 15))}
                  placeholder="e.g., sq ft, %"
                  maxLength={15}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* Multiple Selection Toggle */}
          {type === 'multiple-choice' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="allow-multiple"
                  checked={allowMultipleSelection}
                  onCheckedChange={(checked) => setAllowMultipleSelection(checked === true)}
                />
                <div>
                  <Label htmlFor="allow-multiple" className="text-sm font-medium text-blue-900 cursor-pointer">
                    Allow multiple selections
                  </Label>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Each option can be selected independently with its own price value
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Options Configuration */}
          {needsOptions && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm font-medium text-gray-700">Options</Label>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-3 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Image upload for multiple-choice */}
                      {type === 'multiple-choice' && (
                        <div className="flex-shrink-0">
                          {option.image ? (
                            <div className="relative">
                              <img
                                src={option.image}
                                alt="Option"
                                className="w-12 h-12 object-cover rounded-lg border"
                              />
                              <button
                                type="button"
                                onClick={() => updateOption(index, 'image', '')}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                              <Upload className="w-4 h-4 text-gray-400" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(index, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      )}

                      {/* Option inputs */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Option label"
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          type="number"
                          placeholder="Price value"
                          value={option.numericValue || ''}
                          onChange={(e) => updateOption(index, 'numericValue', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>

                      {/* Delete button */}
                      {options.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="flex-shrink-0 h-10 w-10 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t bg-gray-50/80 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={handleClose} className="h-10 sm:w-auto w-full">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name} className="h-10 sm:w-auto w-full">
            <TypeIcon className="w-4 h-4 mr-2" />
            Add Variable
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
