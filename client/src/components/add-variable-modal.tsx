import { useState } from "react";
import { Variable } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nanoid } from "nanoid";

interface AddVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVariable: (variable: Variable) => void;
}

export default function AddVariableModal({ isOpen, onClose, onAddVariable }: AddVariableModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Variable["type"]>("number");
  const [unit, setUnit] = useState("");

  const handleSubmit = () => {
    if (!name) return;

    const variable: Variable = {
      id: nanoid(),
      name,
      type,
      unit: unit || undefined,
    };

    onAddVariable(variable);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setType("number");
    setUnit("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Variable</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="variable-name">Variable Name</Label>
            <Input
              id="variable-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Square Footage"
            />
          </div>
          <div>
            <Label htmlFor="variable-type">Variable Type</Label>
            <Select value={type} onValueChange={(value: Variable["type"]) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="variable-unit">Unit (Optional)</Label>
            <Input
              id="variable-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g., sq ft, linear ft"
            />
          </div>
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
