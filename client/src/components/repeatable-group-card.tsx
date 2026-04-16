import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RepeatableChildVariable, Variable } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Plus, ChevronDown, ChevronUp, Sparkles, Loader2, X, ArrowUp, ArrowDown } from "lucide-react";
import FormulaExpressionInput from "./formula-expression-input";
import VariableCard from "./variable-card";
import AddVariableModal from "./add-variable-modal";

interface RepeatableGroupCardProps {
  variable: Variable;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Variable>) => void;
  allVariables?: Variable[];
  onAIAssistVariable?: (variable: Variable, prompt: string, parentVariable?: Variable) => Promise<void>;
  activeAIAssistTargetId?: string | null;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
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
  onAIAssistVariable,
  activeAIAssistTargetId,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: RepeatableGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showGroupAIDialog, setShowGroupAIDialog] = useState(false);
  const [groupAIPrompt, setGroupAIPrompt] = useState("");

  const config = {
    ...defaultRepeatableConfig,
    ...(variable.repeatableConfig || {}),
    childVariables: variable.repeatableConfig?.childVariables || [],
  };
  const isGroupAIAssistPending = activeAIAssistTargetId === variable.id;

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

  const moveChildVariable = (childVariableId: string, direction: "up" | "down") => {
    const currentIndex = config.childVariables.findIndex((child) => child.id === childVariableId);
    if (currentIndex < 0) return;

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= config.childVariables.length) return;

    const nextChildVariables = [...config.childVariables];
    const [movedChild] = nextChildVariables.splice(currentIndex, 1);
    nextChildVariables.splice(nextIndex, 0, movedChild);
    updateConfig({ childVariables: nextChildVariables });
  };

  const handleGroupAIAssist = async () => {
    if (!onAIAssistVariable || !groupAIPrompt.trim()) {
      return;
    }

    await onAIAssistVariable(variable, groupAIPrompt);
    setShowGroupAIDialog(false);
    setGroupAIPrompt("");
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-white shadow-sm dark:border-amber-900/60 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-4 border-b border-amber-100 px-4 py-4 dark:border-amber-900/50">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/40">
              <Copy className="mr-1 h-3 w-3" />
              Repeatable Group
            </Badge>
            <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-slate-800 dark:text-slate-200">
              {variable.id}
            </code>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-slate-100">{variable.name}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Group total token: <code>{variable.id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(onMoveUp || onMoveDown) && (
            <div className="flex items-center gap-0.5 rounded-full border border-slate-200/80 bg-white/70 p-0.5 dark:border-slate-700 dark:bg-slate-900/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onMoveUp?.()}
                disabled={!canMoveUp}
                className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-35 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label={`Move ${variable.name} up`}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onMoveDown?.()}
                disabled={!canMoveDown}
                className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-35 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label={`Move ${variable.name} down`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {onAIAssistVariable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGroupAIDialog(true)}
              className="rounded-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
            >
              <Sparkles className="mr-1 h-4 w-4" />
              AI
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => setIsExpanded((value) => !value)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(variable.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300">
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
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
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

          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Child Questions</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
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
                config.childVariables.map((childVariable, childIndex) => (
                  <VariableCard
                    key={childVariable.id}
                    variable={childVariable}
                    onDelete={handleDeleteChildVariable}
                    onUpdate={handleUpdateChildVariable}
                    allVariables={config.childVariables}
                    parentVariable={variable}
                    onAIAssistVariable={onAIAssistVariable}
                    activeAIAssistTargetId={activeAIAssistTargetId}
                    onMoveUp={() => moveChildVariable(childVariable.id, "up")}
                    onMoveDown={() => moveChildVariable(childVariable.id, "down")}
                    canMoveUp={childIndex > 0}
                    canMoveDown={childIndex < config.childVariables.length - 1}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-slate-600 dark:text-slate-400">
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
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
              Each repeated item uses this formula. All item totals are then summed into <code>{variable.id}</code> for the main formula.
            </p>
          </div>
        </div>
      )}

      {showGroupAIDialog && typeof document !== "undefined" && createPortal(
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
                        Repeatable Group Assist
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
                    Keep this open while you inspect the group. Use it as a pinned AI bubble for child-variable updates.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowGroupAIDialog(false);
                    setGroupAIPrompt("");
                  }}
                  disabled={isGroupAIAssistPending}
                  className="h-9 w-9 shrink-0 rounded-full p-0 text-slate-500 hover:bg-white/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-4 backdrop-blur-sm dark:border-amber-500/20 dark:bg-slate-900/70">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Prompt ideas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "Add a child question for material type and update the per-item formula to include it.",
                      "Add a follow-up child question after the count to ask if haul-away is needed.",
                      "Improve this repeatable group so each item can capture size and condition more clearly.",
                    ].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setGroupAIPrompt(example)}
                        className="rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                    The builder stays interactive while this panel is open.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900/80">
                  <Label htmlFor={`group-ai-prompt-${variable.id}`} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    What should AI change?
                  </Label>
                  <Textarea
                    id={`group-ai-prompt-${variable.id}`}
                    value={groupAIPrompt}
                    onChange={(event) => setGroupAIPrompt(event.target.value)}
                    placeholder="Describe the child question, options, or repeated-item change you want AI to add."
                    className="mt-3 min-h-[132px] rounded-2xl border-slate-200 bg-white/95 text-sm leading-6 text-slate-700 focus-visible:border-amber-400 focus-visible:ring-amber-200 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 border-t border-amber-100/70 px-5 pb-5 pt-4 dark:border-amber-500/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGroupAIDialog(false);
                    setGroupAIPrompt("");
                  }}
                  disabled={isGroupAIAssistPending}
                  className="rounded-xl border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                >
                  Close
                </Button>
                <Button
                  onClick={handleGroupAIAssist}
                  disabled={!groupAIPrompt.trim() || isGroupAIAssistPending}
                  className="flex-1 rounded-xl border-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700"
                >
                  {isGroupAIAssistPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Apply Group Update
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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
