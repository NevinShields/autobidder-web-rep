import { useState } from "react";
import { Variable } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Upload } from "lucide-react";
import { nanoid } from "nanoid";

interface AddVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVariable: (variable: Variable) => void;
}

export default function AddVariableModal({ isOpen, onClose, onAddVariable }: AddVariableModalProps) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [type, setType] = useState<Variable["type"]>("number");
  const [unit, setUnit] = useState("");
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false);
  const [options, setOptions] = useState([{ label: "", value: "", numericValue: 0, image: "" }]);
  // Slider specific state
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(100);
  const [step, setStep] = useState<number>(1);
  // Checkbox specific state
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
            // Generate option ID for multiple-choice with multiple selections
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
      // Add slider properties
      min: type === 'slider' ? min : undefined,
      max: type === 'slider' ? max : undefined,
      step: type === 'slider' ? step : undefined,
      // Add checkbox properties
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

  // Auto-generate ID from name
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Variable</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="variable-name">Variable Name</Label>
            <Input
              id="variable-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Square Footage"
            />
          </div>
          <div>
            <Label htmlFor="variable-id">Variable ID</Label>
            <Input
              id="variable-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g., squareFootage"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in formulas. Auto-generated from name if empty.
            </p>
          </div>
          <div>
            <Label htmlFor="variable-type">Variable Type</Label>
            <Select value={type} onValueChange={(value: Variable["type"]) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
                <SelectItem value="dropdown">Dropdown (Single Choice)</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice (with Images)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!needsOptions && !needsSliderConfig && !needsCheckboxConfig && (
            <div>
              <Label htmlFor="variable-unit">Unit (Optional) - Max 15 chars</Label>
              <Input
                id="variable-unit"
                value={unit}
                onChange={(e) => {
                  const value = e.target.value.substring(0, 15);
                  setUnit(value);
                }}
                placeholder="e.g., sq ft, linear ft"
                maxLength={15}
              />
            </div>
          )}

          {/* Checkbox Configuration */}
          {needsCheckboxConfig && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Checkbox Values</Label>
              <p className="text-xs text-gray-500">
                Define what values to use in formulas when the checkbox is checked or unchecked.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="checked-value" className="text-xs">Value When Selected</Label>
                  <Input
                    id="checked-value"
                    value={checkedValue}
                    onChange={(e) => setCheckedValue(e.target.value)}
                    placeholder="e.g., 1, 100, 500"
                    className="text-sm"
                    data-testid="input-checked-value"
                  />
                  <p className="text-xs text-gray-400 mt-1">Default: 1</p>
                </div>
                <div>
                  <Label htmlFor="unchecked-value" className="text-xs">Value When Not Selected</Label>
                  <Input
                    id="unchecked-value"
                    value={uncheckedValue}
                    onChange={(e) => setUncheckedValue(e.target.value)}
                    placeholder="e.g., 0, 50, 200"
                    className="text-sm"
                    data-testid="input-unchecked-value"
                  />
                  <p className="text-xs text-gray-400 mt-1">Default: 0</p>
                </div>
              </div>
            </div>
          )}

          {/* Slider Configuration */}
          {needsSliderConfig && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Slider Configuration</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="slider-min" className="text-xs">Min Value</Label>
                  <Input
                    id="slider-min"
                    type="number"
                    value={min}
                    onChange={(e) => setMin(Number(e.target.value))}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="slider-max" className="text-xs">Max Value</Label>
                  <Input
                    id="slider-max"
                    type="number"
                    value={max}
                    onChange={(e) => setMax(Number(e.target.value))}
                    placeholder="100"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="slider-step" className="text-xs">Step</Label>
                  <Input
                    id="slider-step"
                    type="number"
                    value={step}
                    onChange={(e) => setStep(Number(e.target.value))}
                    placeholder="1"
                    min="0.01"
                    step="0.01"
                    className="text-sm"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="slider-unit">Unit (Optional) - Max 15 chars</Label>
                <Input
                  id="slider-unit"
                  value={unit}
                  onChange={(e) => {
                    const value = e.target.value.substring(0, 15);
                    setUnit(value);
                  }}
                  placeholder="e.g., sq ft, %"
                  maxLength={15}
                />
              </div>
            </div>
          )}

          {/* Multiple Selection Toggle for Multiple Choice */}
          {type === 'multiple-choice' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allow-multiple"
                  checked={allowMultipleSelection}
                  onCheckedChange={(checked) => setAllowMultipleSelection(checked === true)}
                />
                <Label htmlFor="allow-multiple">Allow multiple selections</Label>
              </div>
              {allowMultipleSelection && (
                <p className="text-xs text-blue-600 ml-6">
                  When enabled, each option can be referenced individually in formulas using {id || 'variableId'}_optionId (e.g., {id || 'features'}_deck). Each option will have its own numeric value that can be used in calculations.
                </p>
              )}
            </div>
          )}

          {/* Options Configuration */}
          {needsOptions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Option {index + 1}</span>
                      {options.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          placeholder="Option Label"
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          className="text-base h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Value (optional)</Label>
                        <Input
                          placeholder="Custom value"
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                          className="text-base h-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">
                        Numeric Value (for formulas)
                        {type === 'multiple-choice' && allowMultipleSelection && option.label && (
                          <span className="text-blue-600 font-medium"> - Use as {id || 'variableId'}_{option.label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}</span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={option.numericValue}
                        onChange={(e) => updateOption(index, 'numericValue', parseFloat(e.target.value) || 0)}
                        className="text-base h-10"
                      />
                      {type === 'multiple-choice' && allowMultipleSelection && (
                        <p className="text-xs text-gray-500 mt-1">
                          Each option has its own value in formulas. Selected options = their value, unselected = 0.
                        </p>
                      )}
                    </div>
                    
                    {type === 'multiple-choice' && (
                      <div>
                        <Label className="text-xs">Image (optional)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(index, e)}
                            className="text-base h-10"
                            id={`image-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`image-${index}`)?.click()}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                        {option.image && (
                          <img 
                            src={option.image} 
                            alt="Option preview" 
                            className="mt-2 h-20 w-20 object-cover rounded border"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name}>
            Add Variable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
