import { useMemo, useState } from "react";
import { RepeatableChildVariable, Variable } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Plus, ChevronDown, ChevronUp } from "lucide-react";
import FormulaExpressionInput from "./formula-expression-input";
import VariableCard from "./variable-card";
import AddVariableModal from "./add-variable-modal";

interface RepeatableGroupCardProps {
  variable: Variable;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Variable>) => void;
  allVariables?: Variable[];
}

const defaultRepeatableConfig = {
  countSourceMode: "variable" as const,
  fixedCount: 1,
  itemLabelTemplate: "Item {index}",
  instanceFormula: "",
  childVariables: [] as RepeatableChildVariable[],
};

export default function RepeatableGroupCard({
  variable,
  onDelete,
  onUpdate,
  allVariables = [],
}: RepeatableGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  const config = {
    ...defaultRepeatableConfig,
    ...(variable.repeatableConfig || {}),
    childVariables: variable.repeatableConfig?.childVariables || [],
  };

  const availableCountVariables = useMemo(() => {
    const currentIndex = allVariables.findIndex((item) => item.id === variable.id);
    const scopedVariables = currentIndex >= 0 ? allVariables.slice(0, currentIndex) : allVariables;
    return scopedVariables.filter((item) => item.type !== "repeatable-group");
  }, [allVariables, variable.id]);

  const updateVariable = (updates: Partial<Variable>) => {
    onUpdate?.(variable.id, updates);
  };

  const updateConfig = (updates: Partial<NonNullable<Variable["repeatableConfig"]>>) => {
    updateVariable({
      repeatableConfig: {
        ...config,
        ...updates,
      },
    });
  };

  const toRepeatableChildVariable = (childVariable: Variable | RepeatableChildVariable): RepeatableChildVariable => {
    if (childVariable.type === "repeatable-group") {
      throw new Error("Repeatable groups cannot be nested inside repeatable group child variables.");
    }

    const { repeatableConfig: _repeatableConfig, ...rest } = childVariable as Variable & { repeatableConfig?: unknown };
    return rest as RepeatableChildVariable;
  };

  const handleAddChildVariable = (childVariable: Variable) => {
    updateConfig({
      childVariables: [...config.childVariables, toRepeatableChildVariable(childVariable)],
    });
  };

  const handleDeleteChildVariable = (childVariableId: string) => {
    updateConfig({
      childVariables: config.childVariables.filter((child) => child.id !== childVariableId),
    });
  };

  const handleUpdateChildVariable = (childVariableId: string, updates: Partial<Variable>) => {
    updateConfig({
      childVariables: config.childVariables.map((child) => {
        if (child.id !== childVariableId) {
          return child;
        }

        return toRepeatableChildVariable({
          ...child,
          ...updates,
          type: updates.type === "repeatable-group" ? child.type : (updates.type ?? child.type),
        } as Variable);
      }),
    });
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-amber-100 px-4 py-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
              <Copy className="mr-1 h-3 w-3" />
              Repeatable Group
            </Badge>
            <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {variable.id}
            </code>
          </div>
          <div>
            <p className="font-medium text-gray-900">{variable.name}</p>
            <p className="text-sm text-gray-500">
              Group total token: <code>{variable.id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsExpanded((value) => !value)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(variable.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
            Delete
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Group Name</Label>
              <Input
                value={variable.name}
                onChange={(event) => updateVariable({ name: event.target.value })}
                placeholder="Trees"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Group Total Token</Label>
              <Input
                value={variable.id}
                onChange={(event) => updateVariable({ id: event.target.value })}
                placeholder="trees_total"
                className="font-mono"
              />
              <p className="mt-2 text-xs text-gray-500">
                This token already equals the sum of all repeated items. Use <code>{variable.id}</code> directly in the main formula instead of multiplying it by the count again.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Count Source</Label>
              <Select
                value={config.countSourceMode}
                onValueChange={(value: "variable" | "fixed") => updateConfig({ countSourceMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variable">Use another question</SelectItem>
                  <SelectItem value="fixed">Fixed number of items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.countSourceMode === "variable" ? (
              <div>
                <Label className="mb-1.5 block">Count Variable</Label>
                <Select
                  value={config.countVariableId || ""}
                  onValueChange={(value) => updateConfig({ countVariableId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a top-level variable" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCountVariables.map((countVariable) => (
                      <SelectItem key={countVariable.id} value={countVariable.id}>
                        {countVariable.name} ({countVariable.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="mb-1.5 block">Fixed Count</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.fixedCount ?? 1}
                  onChange={(event) => updateConfig({ fixedCount: Math.max(0, Number(event.target.value) || 0) })}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="mb-1.5 block">Minimum Instances</Label>
              <Input
                type="number"
                min={0}
                value={config.minInstances ?? ""}
                onChange={(event) => updateConfig({
                  minInstances: event.target.value === "" ? undefined : Math.max(0, Number(event.target.value) || 0),
                })}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Maximum Instances</Label>
              <Input
                type="number"
                min={0}
                value={config.maxInstances ?? ""}
                onChange={(event) => updateConfig({
                  maxInstances: event.target.value === "" ? undefined : Math.max(0, Number(event.target.value) || 0),
                })}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Item Label Template</Label>
              <Input
                value={config.itemLabelTemplate || ""}
                onChange={(event) => updateConfig({ itemLabelTemplate: event.target.value })}
                placeholder="Tree {index}"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea
              value={variable.tooltip || ""}
              onChange={(event) => updateVariable({ tooltip: event.target.value || undefined })}
              placeholder="Explain what each repeated item represents."
              rows={2}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">Child Questions</p>
                <p className="text-sm text-gray-500">
                  These questions repeat for each item in the group.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddChildModal(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Child Question
              </Button>
            </div>

            <div className="space-y-3">
              {config.childVariables.length > 0 ? (
                config.childVariables.map((childVariable) => (
                  <VariableCard
                    key={childVariable.id}
                    variable={childVariable}
                    onDelete={handleDeleteChildVariable}
                    onUpdate={handleUpdateChildVariable}
                    allVariables={config.childVariables}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                  Add the per-item questions here, such as height, diameter, haul-away, or stump grinding.
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Per-Item Formula</Label>
            <FormulaExpressionInput
              value={config.instanceFormula || ""}
              onChange={(value) => updateConfig({ instanceFormula: value })}
              variables={config.childVariables}
              placeholder="e.g., height * 12 + diameter * 8 + stump_grind"
            />
            <p className="mt-2 text-xs text-gray-500">
              Each repeated item uses this formula. All item totals are then summed into <code>{variable.id}</code> for the main formula.
            </p>
          </div>
        </div>
      )}

      <AddVariableModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onAddVariable={handleAddChildVariable}
        existingVariableIds={config.childVariables.map((child) => child.id)}
        allowRepeatableGroup={false}
      />
    </div>
  );
}
