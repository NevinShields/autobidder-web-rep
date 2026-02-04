import { useState, useMemo } from "react";
import { Variable, Formula } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, Hash, Type, CheckSquare, SlidersHorizontal, ChevronDown, List, Image, X, Video, ImageIcon, HelpCircle, Link2, Search, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { nanoid } from "nanoid";

interface AddVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVariable: (variable: Variable) => void;
  otherFormulas?: Formula[];
}

interface LinkableVariable {
  variable: Variable;
  formulaId: number;
  formulaName: string;
  connectionKey: string;
}

const variableTypeConfig = {
  number: { icon: Hash, label: "Number", description: "Numeric input for calculations" },
  stepper: { icon: Plus, label: "Stepper", description: "Number input with +/- controls" },
  text: { icon: Type, label: "Text", description: "Text input field" },
  checkbox: { icon: CheckSquare, label: "Checkbox", description: "Yes/No toggle option" },
  slider: { icon: SlidersHorizontal, label: "Slider", description: "Range slider with min/max" },
  dropdown: { icon: ChevronDown, label: "Dropdown", description: "Single selection from list" },
  "multiple-choice": { icon: Image, label: "Multiple Choice", description: "Options with images" },
};

export default function AddVariableModal({ isOpen, onClose, onAddVariable, otherFormulas = [] }: AddVariableModalProps) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);
  const [type, setType] = useState<Variable["type"]>("number");
  const [unit, setUnit] = useState("");
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false);
  const [options, setOptions] = useState([{ label: "", value: "", numericValue: 0, image: "" }]);
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(100);
  const [step, setStep] = useState<number>(1);
  const [checkedValue, setCheckedValue] = useState<string>("1");
  const [uncheckedValue, setUncheckedValue] = useState<string>("0");
  const [tooltip, setTooltip] = useState("");
  const [tooltipVideoUrl, setTooltipVideoUrl] = useState("");
  const [tooltipImageUrl, setTooltipImageUrl] = useState("");
  const [showHelpSection, setShowHelpSection] = useState(false);
  const [connectionKey, setConnectionKey] = useState("");
  const [showConnectionKeySection, setShowConnectionKeySection] = useState(false);
  const [linkSearchTerm, setLinkSearchTerm] = useState("");
  const [isLinkingVariable, setIsLinkingVariable] = useState(false);

  // Build list of linkable variables from other services
  const linkableVariables = useMemo(() => {
    const variables: LinkableVariable[] = [];
    otherFormulas.forEach(formula => {
      formula.variables?.forEach(variable => {
        // Include variables that either have a connectionKey OR could be linked
        // (we'll create a connectionKey based on the variable name if they select it)
        const autoConnectionKey = variable.connectionKey ||
          variable.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
        variables.push({
          variable,
          formulaId: formula.id,
          formulaName: formula.name,
          connectionKey: autoConnectionKey
        });
      });
    });
    return variables;
  }, [otherFormulas]);

  // Filter linkable variables based on search term
  const filteredLinkableVariables = useMemo(() => {
    if (!linkSearchTerm.trim()) return linkableVariables;
    const term = linkSearchTerm.toLowerCase();
    return linkableVariables.filter(lv =>
      lv.variable.name.toLowerCase().includes(term) ||
      lv.formulaName.toLowerCase().includes(term) ||
      lv.connectionKey.toLowerCase().includes(term)
    );
  }, [linkableVariables, linkSearchTerm]);

  // Handler for selecting a variable to link with
  const handleSelectLinkableVariable = async (linkable: LinkableVariable) => {
    // Pre-fill the form with the selected variable's properties
    setName(linkable.variable.name);
    if (!idManuallyEdited) {
      setId(linkable.variable.id);
    }
    setType(linkable.variable.type);
    setUnit(linkable.variable.unit || "");
    setConnectionKey(linkable.connectionKey);

    // Copy type-specific settings
    if (linkable.variable.type === 'slider' || linkable.variable.type === 'stepper') {
      setMin(linkable.variable.min || 0);
      setMax(linkable.variable.max || 100);
      if (linkable.variable.type === 'slider') {
        setStep(linkable.variable.step || 1);
      }
    }
    if (linkable.variable.type === 'checkbox') {
      setCheckedValue(linkable.variable.checkedValue?.toString() || "1");
      setUncheckedValue(linkable.variable.uncheckedValue?.toString() || "0");
    }
    if (linkable.variable.type === 'multiple-choice') {
      setAllowMultipleSelection(linkable.variable.allowMultipleSelection || false);
    }
    if (linkable.variable.options) {
      setOptions(linkable.variable.options.map(opt => ({
        label: opt.label || "",
        value: opt.value?.toString() || "",
        numericValue: opt.numericValue || 0,
        image: opt.image || ""
      })));
    }
    if (linkable.variable.tooltip) {
      setTooltip(linkable.variable.tooltip);
      setShowHelpSection(true);
    }
    if (linkable.variable.tooltipVideoUrl) {
      setTooltipVideoUrl(linkable.variable.tooltipVideoUrl);
      setShowHelpSection(true);
    }
    if (linkable.variable.tooltipImageUrl) {
      setTooltipImageUrl(linkable.variable.tooltipImageUrl);
      setShowHelpSection(true);
    }

    // If the source variable doesn't have a connectionKey, update it
    if (!linkable.variable.connectionKey) {
      setIsLinkingVariable(true);
      try {
        // Find the source formula
        const sourceFormula = otherFormulas.find(f => f.id === linkable.formulaId);
        if (sourceFormula) {
          // Update the variable in the source formula with the connectionKey
          const updatedVariables = sourceFormula.variables?.map(v =>
            v.id === linkable.variable.id
              ? { ...v, connectionKey: linkable.connectionKey }
              : v
          );

          // Save the updated formula using fetch directly
          const response = await fetch(`/api/formulas/${linkable.formulaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ variables: updatedVariables })
          });

          if (!response.ok) {
            throw new Error('Failed to update source formula');
          }

          console.log(`Variable "${linkable.variable.name}" in ${linkable.formulaName} linked with key "${linkable.connectionKey}"`);
        }
      } catch (error) {
        console.error('Failed to update source variable:', error);
        // Variable was copied but source wasn't updated - user may need to manually set connection key
      } finally {
        setIsLinkingVariable(false);
      }
    }
  };

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
      min: type === 'slider' || type === 'stepper' ? min : undefined,
      max: type === 'slider' || type === 'stepper' ? max : undefined,
      step: type === 'slider' ? step : undefined,
      checkedValue: type === 'checkbox' ? (checkedValue || undefined) : undefined,
      uncheckedValue: type === 'checkbox' ? (uncheckedValue || undefined) : undefined,
      tooltip: tooltip.trim() || undefined,
      tooltipVideoUrl: tooltipVideoUrl.trim() || undefined,
      tooltipImageUrl: tooltipImageUrl.trim() || undefined,
      connectionKey: connectionKey.trim() || undefined,
    };

    onAddVariable(variable);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setId("");
    setIdManuallyEdited(false);
    setType("number");
    setUnit("");
    setAllowMultipleSelection(false);
    setOptions([{ label: "", value: "", numericValue: 0, image: "" }]);
    setMin(0);
    setMax(100);
    setStep(1);
    setCheckedValue("1");
    setUncheckedValue("0");
    setTooltip("");
    setTooltipVideoUrl("");
    setTooltipImageUrl("");
    setShowHelpSection(false);
    setConnectionKey("");
    setShowConnectionKeySection(false);
    setLinkSearchTerm("");
    setIsLinkingVariable(false);
    onClose();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate ID from name unless user has manually edited the ID field
    if (!idManuallyEdited) {
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
  const needsStepperConfig = type === 'stepper';
  const needsCheckboxConfig = type === 'checkbox';
  const TypeIcon = variableTypeConfig[type as keyof typeof variableTypeConfig]?.icon || Hash;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-gray-50/80 dark:bg-gray-800/80">
          <DialogTitle className="text-lg font-semibold">Add New Variable</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Create a variable for your pricing formula
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="variable-name" className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
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
              <Label htmlFor="variable-id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Variable ID
              </Label>
              <Input
                id="variable-id"
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  setIdManuallyEdited(true);
                }}
                placeholder="Auto-generated from name"
                className="mt-1.5 h-11 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Used in formulas like: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">{id || 'variableid'} * 10</code>
              </p>
            </div>
          </div>

          {/* Variable Type Section */}
          <div className="pt-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Variable Type</Label>
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
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
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
          {!needsOptions && !needsSliderConfig && !needsStepperConfig && !needsCheckboxConfig && (
            <div className="pt-2">
              <Label htmlFor="variable-unit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <CheckSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Checkbox Values</Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Set numeric values for formula calculations when checked or unchecked.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <Label htmlFor="checked-value" className="text-xs font-medium text-green-700 dark:text-green-300 block mb-1.5">
                    When Checked
                  </Label>
                  <Input
                    id="checked-value"
                    value={checkedValue}
                    onChange={(e) => setCheckedValue(e.target.value)}
                    placeholder="1"
                    className="h-10"
                    data-testid="input-checked-value"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <Label htmlFor="unchecked-value" className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1.5">
                    When Unchecked
                  </Label>
                  <Input
                    id="unchecked-value"
                    value={uncheckedValue}
                    onChange={(e) => setUncheckedValue(e.target.value)}
                    placeholder="0"
                    className="h-10"
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
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slider Range</Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="slider-min" className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">Min</Label>
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
                  <Label htmlFor="slider-max" className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">Max</Label>
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
                  <Label htmlFor="slider-step" className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">Step</Label>
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
                <Label htmlFor="slider-unit" className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">
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

          {/* Stepper Configuration */}
          {needsStepperConfig && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stepper Range</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="stepper-min" className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">Min</Label>
                  <Input
                    id="stepper-min"
                    type="number"
                    value={min}
                    onChange={(e) => setMin(Number(e.target.value))}
                    placeholder="0"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="stepper-max" className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">Max</Label>
                  <Input
                    id="stepper-max"
                    type="number"
                    value={max}
                    onChange={(e) => setMax(Number(e.target.value))}
                    placeholder="10"
                    className="h-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="stepper-unit" className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5">
                  Unit Label <span className="text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="stepper-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value.substring(0, 15))}
                  placeholder="e.g., items"
                  maxLength={15}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* Multiple Selection Toggle */}
          {type === 'multiple-choice' && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="allow-multiple"
                  checked={allowMultipleSelection}
                  onCheckedChange={(checked) => setAllowMultipleSelection(checked === true)}
                />
                <div>
                  <Label htmlFor="allow-multiple" className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
                    Allow multiple selections
                  </Label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
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
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</Label>
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
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3"
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
                            <label className="w-12 h-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <Upload className="w-4 h-4 text-gray-400 dark:text-gray-500" />
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
                          className="flex-shrink-0 h-10 w-10 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
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

          {/* Help Content Section - Collapsible */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowHelpSection(!showHelpSection)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Help Content</Label>
                <span className="text-xs text-gray-400">(optional)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showHelpSection ? 'rotate-180' : ''}`} />
            </button>

            {showHelpSection && (
              <div className="mt-3 space-y-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 block">Help Text</Label>
                  <Textarea
                    value={tooltip}
                    onChange={(e) => setTooltip(e.target.value)}
                    placeholder="Add a description to help users understand this question..."
                    className="text-sm min-h-[60px]"
                    maxLength={200}
                  />
                  <span className="text-xs text-gray-400">{tooltip.length}/200</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Video URL
                    </Label>
                    <Input
                      value={tooltipVideoUrl}
                      onChange={(e) => setTooltipVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Image URL
                    </Label>
                    <Input
                      value={tooltipImageUrl}
                      onChange={(e) => setTooltipImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Video and image will be shown to users when they click the help icon.
                </p>
              </div>
            )}
          </div>

          {/* Connection Key Section - Collapsible */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowConnectionKeySection(!showConnectionKeySection)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Link Variable</Label>
                <span className="text-xs text-gray-400">(optional)</span>
                {connectionKey && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {connectionKey}
                  </Badge>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showConnectionKeySection ? 'rotate-180' : ''}`} />
            </button>

            {showConnectionKeySection && (
              <div className="mt-3 space-y-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Link this variable to sync values across services. When customers enter a value in one service, it auto-fills in linked services.
                </p>

                {/* Show linkable variables from other services */}
                {linkableVariables.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Copy from another service
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input
                        value={linkSearchTerm}
                        onChange={(e) => setLinkSearchTerm(e.target.value)}
                        placeholder="Search variables..."
                        className="h-8 text-xs pl-8"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-gray-800 p-1.5 relative">
                      {isLinkingVariable && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10 rounded-md">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Linking variable...</span>
                          </div>
                        </div>
                      )}
                      {filteredLinkableVariables.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">No matching variables found</p>
                      ) : (
                        filteredLinkableVariables.map((linkable, index) => {
                          const TypeIconEl = variableTypeConfig[linkable.variable.type as keyof typeof variableTypeConfig]?.icon || Hash;
                          const hasConnectionKey = !!linkable.variable.connectionKey;
                          return (
                            <button
                              key={`${linkable.formulaId}-${linkable.variable.id}-${index}`}
                              type="button"
                              onClick={() => handleSelectLinkableVariable(linkable)}
                              disabled={isLinkingVariable}
                              className="w-full text-left px-2.5 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group disabled:opacity-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <TypeIconEl className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {linkable.variable.name}
                                  </span>
                                  {hasConnectionKey && (
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                      linked
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                  {linkable.formulaName}
                                </span>
                              </div>
                              <div className="mt-0.5 ml-5.5">
                                <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">
                                  {linkable.connectionKey}
                                </code>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Manual connection key input */}
                <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                  <Label className="text-xs text-blue-600 dark:text-blue-400 mb-1.5 block">
                    {linkableVariables.length > 0 ? 'Or enter a custom connection key' : 'Connection Key'}
                  </Label>
                  <Input
                    value={connectionKey}
                    onChange={(e) => setConnectionKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="e.g., house_sqft, stories, property_height"
                    className="h-9 text-sm font-mono"
                  />
                  <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">
                    Variables with the same key will sync across services
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t bg-gray-50/80 dark:bg-gray-800/80 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
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
