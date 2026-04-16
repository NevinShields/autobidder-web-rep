import { useState, useEffect } from "react";
import { Formula, PriceConstraintRule, Variable, VariableCondition, UpsellItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, Save, Plus, Video, Image, Sparkles, Wand2, Loader2, Map, GripVertical, BookOpen, X, Camera, Trash2, Upload, ChevronDown, ChevronUp, Settings2, Pencil, ImageIcon, Zap, Copy } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import VariableCard from "./variable-card";
import RepeatableGroupCard from "./repeatable-group-card";
import AddVariableModal from "./add-variable-modal";
import FormulaDemoPreview from "./formula-demo-preview";
import IconSelector from "./icon-selector";
import AIIconGeneratorModal from "./ai-icon-generator-modal";
import { TemplateLibraryButton } from "./template-library";
import { ObjectUploader } from "@/components/ObjectUploader";
import FormulaExpressionInput from "./formula-expression-input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getAvailableConditions, getConditionLabel } from "@shared/conditional-logic";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
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

const AI_FORMULA_EXAMPLES = [
  "House cleaning with bedroom count, bathrooms, add-ons, and first-time deep clean pricing.",
  "Bathroom renovation with square footage, tile tier, fixtures, demo, and labor complexity.",
  "Tree removal with a repeatable group for each tree using height, diameter, haul-away, and stump grinding.",
  "Lawn care with lot size, mowing frequency, edging, and seasonal cleanup options.",
];

const AI_GENERATION_STEPS = [
  "Reading your service details",
  "Structuring pricing variables",
  "Drafting the formula logic",
  "Packaging the builder setup",
];

function buildOptimizedFormulaPrompt(serviceContext: string, existingDraft: string): string {
  const trimmedContext = serviceContext.trim();
  const trimmedDraft = existingDraft.trim();

  return [
    "I am using the Autobidder AI Formula Builder to create a pricing calculator.",
    "Help me write the best possible service description to paste into that tool.",
    "",
    "Your job:",
    "Write one detailed prompt that the Autobidder AI Formula Builder can use directly.",
    "The prompt should describe the calculator clearly enough that it can generate the service title, description, variables, pricing logic, optional add-ons, and any useful follow-up questions.",
    "",
    "What to include in the prompt you write:",
    "- The exact service being sold",
    "- The main pricing drivers",
    "- Any size, quantity, square footage, room count, linear footage, or time-based inputs if relevant",
    "- Material, package, or quality tiers if relevant",
    "- Optional add-ons or upsells if relevant",
    "- Complexity, accessibility, condition, or labor factors if relevant",
    "- Any minimum price, starting price, or pricing rules if known",
    "- Any useful conditional follow-up questions if some answers should reveal more questions",
    "",
    "Output requirements:",
    "- Return only the final prompt text I should paste into Autobidder",
    "- Do not explain your reasoning",
    "- Do not use bullet points in the final prompt unless they make the request clearer",
    "- Make the final prompt specific, practical, and structured for a pricing calculator",
    "",
    trimmedContext
      ? `Service-specific context to use:\n${trimmedContext}`
      : "Service-specific context to use:\n[Replace this with the service details, pricing factors, and business rules you want included.]",
    trimmedDraft
      ? `Current rough draft to improve:\n${trimmedDraft}`
      : "",
  ].filter(Boolean).join("\n");
}

// Sortable Variable Card Component
function SortableVariableCard({ variable, index, totalVariables, onDelete, onUpdate, allVariables, onAIAssistVariable, activeAIAssistTargetId, onMoveVariable }: {
  variable: Variable;
  index: number;
  totalVariables: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Variable>) => void;
  allVariables: Variable[];
  onAIAssistVariable?: (variable: Variable, prompt: string, parentVariable?: Variable) => Promise<void>;
  activeAIAssistTargetId?: string | null;
  onMoveVariable: (variableId: string, direction: "up" | "down") => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-10 hidden cursor-grab text-gray-400 transition-colors hover:text-gray-600 active:cursor-grabbing sm:block"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* Variable Card with left padding for drag handle */}
      <div className="pl-0 sm:pl-8">
        {variable.type === "repeatable-group" ? (
          <RepeatableGroupCard
            variable={variable}
            onDelete={onDelete}
            onUpdate={onUpdate}
            allVariables={allVariables}
            onAIAssistVariable={onAIAssistVariable}
            activeAIAssistTargetId={activeAIAssistTargetId}
            onMoveUp={() => onMoveVariable(variable.id, "up")}
            onMoveDown={() => onMoveVariable(variable.id, "down")}
            canMoveUp={index > 0}
            canMoveDown={index < totalVariables - 1}
          />
        ) : (
          <VariableCard
            variable={variable}
            onDelete={onDelete}
            onUpdate={onUpdate}
            allVariables={allVariables}
            onAIAssistVariable={onAIAssistVariable}
            activeAIAssistTargetId={activeAIAssistTargetId}
            onMoveUp={() => onMoveVariable(variable.id, "up")}
            onMoveDown={() => onMoveVariable(variable.id, "down")}
            canMoveUp={index > 0}
            canMoveDown={index < totalVariables - 1}
          />
        )}
	      </div>
	    </div>
	  );
	}

function RefinePromptButton({ formula, onUpdate }: { formula: Formula; onUpdate: (formula: Partial<Formula>) => void }) {
  const [isRefining, setIsRefining] = useState(false);
  const { toast } = useToast();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!formula.photoMeasurementSetup?.objectDescription?.trim() || isRefining}
      onClick={async () => {
        if (!formula.photoMeasurementSetup?.objectDescription?.trim()) return;
        
        setIsRefining(true);
        try {
          const response = await fetch('/api/photo-measurement/refine-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: formula.photoMeasurementSetup.objectDescription,
              measurementType: formula.photoMeasurementSetup.measurementType || 'area'
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            const setup = formula.photoMeasurementSetup!;
            onUpdate({ 
              photoMeasurementSetup: {
                ...setup,
                objectDescription: data.refinedDescription
              }
            });
            toast({
              title: "Prompt Refined!",
              description: "Your description has been optimized for better AI measurement accuracy."
            });
          } else {
            toast({
              variant: "destructive",
              title: "Refinement Failed",
              description: data.message || "Could not refine the prompt"
            });
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to refine prompt"
          });
        } finally {
          setIsRefining(false);
        }
      }}
      className="h-7 text-xs"
    >
      {isRefining ? (
        <>
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Refining...
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 mr-1" />
          Refine Prompt
        </>
      )}
    </Button>
  );
}

type PriceConstraintType = "min" | "max";

function createEmptyPriceConstraintRule(): PriceConstraintRule {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    operator: "AND",
    conditions: [
      {
        id: crypto.randomUUID(),
        dependsOnVariable: "",
        condition: "equals",
        expectedValue: "",
      },
    ],
    value: 0,
  };
}

function formatConstraintValue(valueInCents: number | null | undefined): string {
  if (valueInCents === null || valueInCents === undefined) {
    return "";
  }

  return (valueInCents / 100).toString();
}

function createEmptyUpsellCondition(): VariableCondition {
  return {
    id: crypto.randomUUID(),
    dependsOnVariable: "",
    condition: "equals",
    expectedValue: "",
  };
}

interface FormulaBuilderProps {
  formula: Formula;
  onUpdate: (formula: Partial<Formula>) => void;
  onSave: () => void;
  onPreview: () => void;
  isSaving?: boolean;
  allFormulas?: Formula[];
}

type AIEditMode = "targeted" | "rebuild";

export default function FormulaBuilderComponent({
  formula,
  onUpdate,
  onSave,
  onPreview,
  isSaving,
  allFormulas = []
}: FormulaBuilderProps) {
  const toOptionId = (rawValue: unknown, fallbackIndex: number): string => {
    const base = String(rawValue ?? '').trim().toLowerCase();
    const normalized = base
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    return normalized || `option_${fallbackIndex}`;
  };

  const upsellDependencyVariables = (formula.variables || []).filter(
    (variable) => variable.type !== "repeatable-group",
  );

  const updateUpsellItem = (upsellId: string, updater: (upsell: UpsellItem) => UpsellItem) => {
    const updated = (formula.upsellItems || []).map((upsell) => (
      upsell.id === upsellId ? updater(upsell as UpsellItem) : upsell
    ));
    onUpdate({ upsellItems: updated });
  };

  const toggleUpsellConditionalLogic = (upsellId: string, enabled: boolean) => {
    updateUpsellItem(upsellId, (upsell) => ({
      ...upsell,
      conditionalLogic: enabled
        ? {
            enabled: true,
            operator: upsell.conditionalLogic?.operator || "AND",
            conditions: upsell.conditionalLogic?.conditions?.length
              ? upsell.conditionalLogic.conditions
              : [createEmptyUpsellCondition()],
          }
        : {
            enabled: false,
            operator: upsell.conditionalLogic?.operator || "AND",
            conditions: upsell.conditionalLogic?.conditions || [createEmptyUpsellCondition()],
          },
    }));
  };

  const updateUpsellCondition = (
    upsellId: string,
    conditionUpdates: Partial<VariableCondition>,
  ) => {
    updateUpsellItem(upsellId, (upsell) => {
      const existingCondition = upsell.conditionalLogic?.conditions?.[0] || createEmptyUpsellCondition();
      return {
        ...upsell,
        conditionalLogic: {
          enabled: true,
          operator: upsell.conditionalLogic?.operator || "AND",
          conditions: [
            {
              ...existingCondition,
              ...conditionUpdates,
            },
          ],
        },
      };
    });
  };

  const containsToken = (expression: string, token: string): boolean => {
    if (!expression.trim() || !token.trim()) {
      return false;
    }

    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escapedToken}\\b`).test(expression);
  };

  const ensureUniqueOptionIds = (options: Array<any>) => {
    const used = new Set<string>();
    const withUniqueIds = options.map((option, index) => {
      const baseId = toOptionId(option?.id ?? option?.value ?? option?.label, index + 1);
      let uniqueId = baseId;
      let suffix = 2;
      while (used.has(uniqueId)) {
        uniqueId = `${baseId}_${suffix}`;
        suffix += 1;
      }
      used.add(uniqueId);
      return {
        ...option,
        id: uniqueId,
      };
    });

    const usedValues = new Set<string>();
    return withUniqueIds.map((option) => {
      const baseValue = String(option?.value ?? '').trim() || option.id;
      let uniqueValue = baseValue;
      let suffix = 2;
      while (usedValues.has(uniqueValue)) {
        uniqueValue = `${baseValue}_${suffix}`;
        suffix += 1;
      }
      usedValues.add(uniqueValue);
      return {
        ...option,
        value: uniqueValue,
      };
    });
  };

  const formulaVariables = Array.isArray(formula.variables) ? formula.variables : [];
  const formulaExpressionValue = typeof formula.formula === "string" ? formula.formula : "";
  const hasExistingFormula = formulaVariables.length > 0 || Boolean(formulaExpressionValue.trim());
  const repeatableGroupWarnings = formulaVariables
    .filter((variable) => variable.type === "repeatable-group" && variable.repeatableConfig?.countVariableId)
    .map((variable) => ({
      groupId: variable.id,
      groupName: variable.name,
      countVariableId: variable.repeatableConfig?.countVariableId || "",
    }))
    .filter(({ groupId, countVariableId }) => (
      containsToken(formulaExpressionValue, groupId) && containsToken(formulaExpressionValue, countVariableId)
    ));

  const [showVariableModal, setShowVariableModal] = useState(false);
  const [formulaExpression, setFormulaExpression] = useState(formulaExpressionValue);
  const [minPriceDollars, setMinPriceDollars] = useState(formula.minPrice ? (formula.minPrice / 100).toString() : '');
  const [maxPriceDollars, setMaxPriceDollars] = useState(formula.maxPrice ? (formula.maxPrice / 100).toString() : '');
  const [showMediaSection, setShowMediaSection] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiPromptContext, setAiPromptContext] = useState("");
  const [showOptimizedPromptHelper, setShowOptimizedPromptHelper] = useState(false);
  const [selectedAIProvider, setSelectedAIProvider] = useState("openai");
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [aiEditInstructions, setAiEditInstructions] = useState("");
  const [aiEditMode, setAiEditMode] = useState<AIEditMode>("targeted");
  const [activeAIAssistTargetId, setActiveAIAssistTargetId] = useState<string | null>(null);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [showIconGenerator, setShowIconGenerator] = useState(false);
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateIconId, setTemplateIconId] = useState<number | null>(formula.iconId || null);
  const [templateIconUrl, setTemplateIconUrl] = useState<string | null>(formula.iconUrl || null);
  const [bulletInput, setBulletInput] = useState("");
  const [aiGenerationStep, setAiGenerationStep] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const isTemplateAdmin = user?.email?.toLowerCase() === "admin@autobidder.org";
  const canSaveAsTemplate = isTemplateAdmin || Boolean((user as any)?.isImpersonating);

  // Sync local formulaExpression state when formula.formula changes (e.g., after AI generation)
  useEffect(() => {
    setFormulaExpression(formulaExpressionValue);
  }, [formulaExpressionValue]);

  useEffect(() => {
    setMinPriceDollars(formatConstraintValue(formula.minPrice));
  }, [formula.minPrice]);

  useEffect(() => {
    setMaxPriceDollars(formatConstraintValue(formula.maxPrice));
  }, [formula.maxPrice]);

  // Fetch template categories for the save as template dialog
  const { data: templateCategories } = useQuery<Array<{ id: number; name: string; isActive: boolean }>>({
    queryKey: ['/api/template-categories'],
  });

  // Reset template modal state
  const resetTemplateModal = () => {
    setTemplateCategory("");
    setTemplateName("");
    setTemplateIconId(formula.iconId || null);
    setTemplateIconUrl(formula.iconUrl || null);
  };

  // Save as Template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: async ({ category, templateName, iconId, iconUrl }: { 
      category: string; 
      templateName: string;
      iconId?: number | null;
      iconUrl?: string | null;
    }) => {
      const response = await apiRequest("POST", `/api/formulas/${formula.id}/save-as-template`, {
        category,
        templateName,
        iconId,
        iconUrl
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template saved successfully!",
        description: "Your formula has been added to the template library.",
      });
      setShowSaveAsTemplateModal(false);
      resetTemplateModal();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save template",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Drag and drop sensors with activation constraints to prevent blocking touch interactions
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Require 10px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Require 250ms hold before drag starts on touch devices
        tolerance: 5, // Allow 5px movement during the delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const variables = formulaVariables;
      const oldIndex = variables.findIndex((variable) => variable.id === active.id);
      const newIndex = variables.findIndex((variable) => variable.id === over.id);

      const reorderedVariables = arrayMove(variables, oldIndex, newIndex);
      onUpdate({ variables: reorderedVariables });
    }
  }

  const applyAIFormulaResult = (data: any) => {
    onUpdate({
      name: data.name,
      title: data.title,
      description: data.description,
      bulletPoints: data.bulletPoints,
      formula: data.formula,
      variables: data.variables,
      iconUrl: data.iconUrl
    });
  };

  const getVariableAssistTargetId = (variable: Variable, parentVariable?: Variable) => (
    parentVariable ? `${parentVariable.id}::${variable.id}` : variable.id
  );

  const buildScopedVariableAIPrompt = (
    variable: Variable,
    prompt: string,
    parentVariable?: Variable,
  ) => {
    const baseInstruction = [
      `Focus on the selected variable "${variable.name}" with id "${variable.id}" and type "${variable.type}".`,
      "Keep every unrelated variable, title, description, and pricing rule unchanged unless I explicitly ask otherwise.",
      "Use the smallest possible targeted change.",
      "If I ask for a conditional follow-up question, implement it with conditionalLogic on the new or updated question instead of changing the formula.",
      "If I ask to make an existing question conditional, update that existing question's conditionalLogic and keep its current name, type, options, images, and other settings intact.",
      "If I ask to add a new follow-up question, create the new question and put the conditionalLogic on the new question so it only appears when the triggering answer matches.",
      "Use the modern conditionalLogic format with enabled, operator, and a conditions array containing unique condition IDs.",
      "When a condition depends on an existing choice question, use the exact existing variable id for dependsOnVariable and the exact stored option value(s) for expectedValue or expectedValues.",
    ];

    if (['dropdown', 'multiple-choice', 'select'].includes(variable.type)) {
      baseInstruction.push(
        "If I ask to add or revise answer choices, update only the selected variable's options and preserve existing option IDs when possible.",
      );
    }

    if (parentVariable) {
      baseInstruction.push(
        `The selected variable is a child question inside the repeatable group "${parentVariable.name}" with id "${parentVariable.id}".`,
        `Return the change by replacing that top-level repeatable-group variable so its childVariables reflect the requested update.`,
        `If I ask to add a follow-up child question, insert it directly after child variable "${variable.id}" inside "${parentVariable.id}".`,
      );
    } else {
      baseInstruction.push(
        `If I ask to add a follow-up question, insert a new variable directly after "${variable.id}".`,
        `If I ask to make a new follow-up question depend on the selected question, set that new variable's conditionalLogic to depend on "${variable.id}" unless I explicitly name another dependency.`,
      );
    }

    return `${baseInstruction.join("\n")}\n\nRequested change:\n${prompt.trim()}`;
  };

  const generateAIFormulaMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", "/api/formulas/generate", { 
        description, 
        provider: selectedAIProvider 
      });
      return response.json();
    },
    onSuccess: (data) => {
      applyAIFormulaResult(data);
      setShowAIBuilder(false);
      setAiDescription("");
      toast({
        title: "AI Formula Generated!",
        description: "Complete service details, variables, and pricing formula created. Review and customize as needed.",
      });
    },
    onError: (error) => {
      console.error('AI generation error:', error);
      toast({
        title: "AI Generation Failed",
        description: error instanceof Error ? error.message : "Please try again with a different description.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!generateAIFormulaMutation.isPending) {
      setAiGenerationStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setAiGenerationStep((current) => (current + 1) % AI_GENERATION_STEPS.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [generateAIFormulaMutation.isPending]);

  const editAIFormulaMutation = useMutation({
    mutationFn: async (editInstructions: string) => {
      const currentFormula = {
        name: formula.name,
        title: formula.title,
        description: formula.description || '',
        bulletPoints: formula.bulletPoints || [],
        formula: formulaExpressionValue,
        variables: formulaVariables,
        iconUrl: formula.iconUrl || '🔧'
      };
      const response = await apiRequest("POST", "/api/formulas/edit", { 
        currentFormula, 
        editInstructions,
        editMode: aiEditMode,
        provider: selectedAIProvider 
      });
      return response.json();
    },
    onSuccess: (data) => {
      applyAIFormulaResult(data);
      setShowAIEditor(false);
      setAiEditInstructions("");
      toast({
        title: "AI Edit Complete!",
        description: aiEditMode === "targeted"
          ? "Only the requested formula changes were applied."
          : "The formula was rebuilt with your requested changes.",
      });
    },
    onError: (error) => {
      console.error('AI edit error:', error);
      toast({
        title: "AI Edit Failed",
        description: error instanceof Error ? error.message : "Please try again with different instructions.",
        variant: "destructive",
      });
    },
  });

  const variableAIAssistMutation = useMutation({
    mutationFn: async ({
      variable,
      prompt,
      parentVariable,
    }: {
      variable: Variable;
      prompt: string;
      parentVariable?: Variable;
    }) => {
      const currentFormula = {
        name: formula.name,
        title: formula.title,
        description: formula.description || '',
        bulletPoints: formula.bulletPoints || [],
        formula: formulaExpressionValue,
        variables: formulaVariables,
        iconUrl: formula.iconUrl || '🔧'
      };
      const response = await apiRequest("POST", "/api/formulas/edit", {
        currentFormula,
        editInstructions: buildScopedVariableAIPrompt(variable, prompt, parentVariable),
        editMode: "targeted",
        provider: selectedAIProvider,
      });
      return response.json();
    },
    onMutate: ({ variable, parentVariable }) => {
      setActiveAIAssistTargetId(getVariableAssistTargetId(variable, parentVariable));
    },
    onSuccess: (data, variables) => {
      applyAIFormulaResult(data);
      toast({
        title: "Variable updated with AI",
        description: `Applied a targeted AI update to ${variables.variable.name}.`,
      });
    },
    onError: (error) => {
      console.error('Variable AI assist error:', error);
      toast({
        title: "Variable AI update failed",
        description: error instanceof Error ? error.message : "Please try again with a more specific prompt.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setActiveAIAssistTargetId(null);
    },
  });

  const handleVariableAIAssist = async (
    variable: Variable,
    prompt: string,
    parentVariable?: Variable,
  ) => {
    await variableAIAssistMutation.mutateAsync({ variable, prompt, parentVariable });
  };

  const handleAddVariable = (variable: Variable) => {
    const updatedVariables = [...formulaVariables, variable];
    onUpdate({ variables: updatedVariables });
  };

  const handleDeleteVariable = (variableId: string) => {
    const updatedVariables = formulaVariables.filter(v => v.id !== variableId);
    onUpdate({ variables: updatedVariables });
  };

  const handleMoveVariable = (variableId: string, direction: "up" | "down") => {
    const currentIndex = formulaVariables.findIndex((variable) => variable.id === variableId);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= formulaVariables.length) {
      return;
    }

    onUpdate({
      variables: arrayMove(formulaVariables, currentIndex, nextIndex),
    });
  };

  const handleUpdateVariable = (oldId: string, updates: Partial<Variable>) => {
    try {
      console.log('Updating variable with ID:', oldId, 'Updates:', updates);
      
      const updatedVariables = formulaVariables.map((v) => {
        if (v.id !== oldId) return v;

        const merged = { ...v, ...updates } as Variable;
        if (merged.type === 'multiple-choice' && merged.allowMultipleSelection && Array.isArray(merged.options)) {
          return {
            ...merged,
            options: ensureUniqueOptionIds(merged.options),
          };
        }

        return merged;
      });
      
      console.log('Updated variables array:', updatedVariables);
      onUpdate({ variables: updatedVariables });
      
      console.log('Variable update successful');
    } catch (error) {
      console.error('Error in handleUpdateVariable:', error);
      toast({
        title: "Error updating variable",
        description: `Failed to update variable: ${(error as Error)?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };



  const handleFormulaChange = (newFormula: string) => {
    setFormulaExpression(newFormula);
    onUpdate({ formula: newFormula });
  };

  const handleMinPriceChange = (value: string) => {
    setMinPriceDollars(value);
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      onUpdate({ minPrice: null });
    } else {
      onUpdate({ minPrice: Math.round(numValue * 100) });
    }
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPriceDollars(value);
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      onUpdate({ maxPrice: null });
    } else {
      onUpdate({ maxPrice: Math.round(numValue * 100) });
    }
  };

  const getPriceConstraintDependencies = () =>
    formulaVariables.filter((variable) => variable.type !== "repeatable-group");

  const updateConstraintRules = (type: PriceConstraintType, rules: PriceConstraintRule[]) => {
    if (type === "min") {
      onUpdate({ conditionalMinPrices: rules });
      return;
    }

    onUpdate({ conditionalMaxPrices: rules });
  };

  const toggleConstraintRules = (type: PriceConstraintType, enabled: boolean) => {
    updateConstraintRules(type, enabled ? [createEmptyPriceConstraintRule()] : []);
  };

  const addConstraintRule = (type: PriceConstraintType) => {
    const currentRules = type === "min" ? (formula.conditionalMinPrices || []) : (formula.conditionalMaxPrices || []);
    updateConstraintRules(type, [...currentRules, createEmptyPriceConstraintRule()]);
  };

  const removeConstraintRule = (type: PriceConstraintType, ruleId: string) => {
    const currentRules = type === "min" ? (formula.conditionalMinPrices || []) : (formula.conditionalMaxPrices || []);
    updateConstraintRules(
      type,
      currentRules.filter((rule) => rule.id !== ruleId),
    );
  };

  const updateConstraintRule = (
    type: PriceConstraintType,
    ruleId: string,
    updates: Partial<PriceConstraintRule>,
  ) => {
    const currentRules = type === "min" ? (formula.conditionalMinPrices || []) : (formula.conditionalMaxPrices || []);
    updateConstraintRules(
      type,
      currentRules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
    );
  };

  const addConstraintCondition = (type: PriceConstraintType, ruleId: string) => {
    const ruleSet = type === "min" ? (formula.conditionalMinPrices || []) : (formula.conditionalMaxPrices || []);
    const rule = ruleSet.find((entry) => entry.id === ruleId);
    if (!rule) {
      return;
    }

    const nextCondition: VariableCondition = {
      id: crypto.randomUUID(),
      dependsOnVariable: "",
      condition: "equals",
      expectedValue: "",
    };

    updateConstraintRule(type, ruleId, {
      conditions: [...(rule.conditions || []), nextCondition],
    });
  };

  const removeConstraintCondition = (type: PriceConstraintType, ruleId: string, conditionId: string) => {
    const ruleSet = type === "min" ? (formula.conditionalMinPrices || []) : (formula.conditionalMaxPrices || []);
    const rule = ruleSet.find((entry) => entry.id === ruleId);
    if (!rule) {
      return;
    }

    updateConstraintRule(type, ruleId, {
      conditions: (rule.conditions || []).filter((condition) => condition.id !== conditionId),
    });
  };

  const updateConstraintCondition = (
    type: PriceConstraintType,
    ruleId: string,
    conditionId: string,
    updates: Partial<VariableCondition>,
  ) => {
    const ruleSet = type === "min" ? (formula.conditionalMinPrices || []) : (formula.conditionalMaxPrices || []);
    const rule = ruleSet.find((entry) => entry.id === ruleId);
    if (!rule) {
      return;
    }

    updateConstraintRule(type, ruleId, {
      conditions: (rule.conditions || []).map((condition) =>
        condition.id === conditionId ? { ...condition, ...updates } : condition,
      ),
    });
  };

  const getConstraintSummary = (rule: PriceConstraintRule, type: PriceConstraintType) => {
    const resolvedConditions = (rule.conditions || []).filter(
      (condition) => condition.dependsOnVariable && condition.condition,
    );

    if (resolvedConditions.length === 0) {
      return `Always use ${type === "min" ? "minimum" : "maximum"} $${(rule.value / 100).toFixed(2)}`;
    }

    const parts = resolvedConditions.map((condition) => {
      const dependency = formulaVariables.find((variable) => variable.id === condition.dependsOnVariable);
      const conditionLabel = getConditionLabel(condition.condition);
      const expectedLabel =
        condition.condition === "is_empty" || condition.condition === "is_not_empty"
          ? ""
          : ` ${String(condition.expectedValue ?? "")}`.trimEnd();

      return `${dependency?.name || condition.dependsOnVariable} ${conditionLabel}${expectedLabel ? ` ${expectedLabel}` : ""}`;
    });

    const joiner = ` ${rule.operator || "AND"} `;
    return `If ${parts.join(joiner)}, use ${type === "min" ? "minimum" : "maximum"} $${(rule.value / 100).toFixed(2)}`;
  };

  const renderConstraintSection = (
    type: PriceConstraintType,
    title: string,
    value: string,
    onValueChange: (nextValue: string) => void,
    description: string,
    rules: PriceConstraintRule[] | undefined,
  ) => {
    const enabled = (rules || []).length > 0;
    const tone = type === "min"
      ? {
          shell: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50 dark:border-emerald-900/70 dark:from-emerald-950/40 dark:via-slate-950 dark:to-emerald-900/20",
          accent: "text-emerald-700 dark:text-emerald-300",
          badge: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
          ruleBorder: "border-emerald-200/80 dark:border-emerald-900/70",
          soft: "bg-emerald-50/80 dark:bg-emerald-950/20",
          switchCopy: "Use smarter minimum floors for different job shapes.",
          emptyCopy: "Example: if square footage is under 500, use a $149 minimum. If over 2,000, use a $349 minimum.",
        }
      : {
          shell: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-100/50 dark:border-amber-900/70 dark:from-amber-950/40 dark:via-slate-950 dark:to-orange-900/20",
          accent: "text-amber-700 dark:text-amber-300",
          badge: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
          ruleBorder: "border-amber-200/80 dark:border-amber-900/70",
          soft: "bg-amber-50/80 dark:bg-amber-950/20",
          switchCopy: "Cap pricing differently for larger or more complex answers.",
          emptyCopy: "Example: if the customer selects a premium package, cap the quote at $1,200 instead of the default max.",
        };

    return (
      <div className={cn("min-w-0 space-y-4 rounded-2xl border p-4 shadow-sm", tone.shell)}>
        <div className="flex flex-col gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("font-medium", tone.badge)}>
                {type === "min" ? "Minimum logic" : "Maximum logic"}
              </Badge>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Pricing guardrail</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
              <p className="break-words text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
          <div className="w-fit max-w-full rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            {enabled ? `${rules?.length || 0} override${(rules?.length || 0) === 1 ? "" : "s"}` : "Default only"}
          </div>
        </div>

        <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-xl border border-white/70 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
            <div className="mb-2 flex flex-col gap-1">
              <Label htmlFor={`${type}-price`} className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Default fallback
              </Label>
              <span className={cn("text-xs font-medium", tone.accent)}>
                {type === "min" ? "Applied below threshold" : "Applied above threshold"}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <Input
                id={`${type}-price`}
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder="0.00"
                className="h-11 border-white/70 bg-white pl-7 text-base font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900"
                data-testid={`input-${type}-price`}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              This is the base {type} price used when no conditional override matches.
            </p>
          </div>

          <div className={cn("min-w-0 rounded-xl border p-4 shadow-sm", tone.ruleBorder, tone.soft)}>
            <div className="flex min-w-0 flex-col gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Conditional overrides
                </p>
                <p className="break-words text-xs text-slate-500 dark:text-slate-400">
                  {tone.switchCopy}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => toggleConstraintRules(type, checked)}
                data-testid={`switch-conditional-${type}-prices`}
              />
            </div>

            {!enabled && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300/80 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/30">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Add rule-based pricing only when you need it.
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {tone.emptyCopy}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleConstraintRules(type, true)}
                  className="mt-3 h-9 w-full text-sm sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Enable Conditional {type === "min" ? "Minimums" : "Maximums"}
                </Button>
              </div>
            )}

            {enabled && (
              <div className="mt-4 space-y-3">
                {(rules || []).map((rule, ruleIndex) => (
                  <div
                    key={rule.id}
                    className={cn(
                      "min-w-0 rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-slate-950/60",
                      tone.ruleBorder,
                    )}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            Rule {ruleIndex + 1}
                          </Badge>
                          <Badge variant="outline" className={cn("font-medium", tone.badge)}>
                            {rule.operator || "AND"} logic
                          </Badge>
                        </div>
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-slate-900 dark:text-slate-100">
                            {getConstraintSummary(rule, type)}
                          </p>
                          <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                            Matching answers override the default fallback above.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConstraintRule(type, rule.id)}
                        className="h-9 w-9 shrink-0 rounded-full p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[160px_minmax(0,1fr)]">
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                        <Label className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Override value
                        </Label>
                        <div className="relative mt-2">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formatConstraintValue(rule.value)}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value);
                              updateConstraintRule(type, rule.id, { value: Number.isFinite(amount) ? Math.round(amount * 100) : 0 });
                            }}
                            className="h-11 bg-white pl-7 text-base font-semibold dark:bg-slate-950"
                          />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          Use this {type} price when the rule matches.
                        </p>
                      </div>

                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-col gap-3">
                          <div className="min-w-0 flex-1">
                            <Label className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Match these conditions</Label>
                            <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                              Decide when this override becomes active.
                            </p>
                          </div>
                          {(rule.conditions?.length || 0) > 1 && (
                            <Select
                              value={rule.operator || "AND"}
                              onValueChange={(nextValue) => updateConstraintRule(type, rule.id, { operator: nextValue as "AND" | "OR" })}
                            >
                              <SelectTrigger className="h-9 w-full bg-white text-xs dark:bg-slate-950">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND" className="text-xs">Match ALL</SelectItem>
                                <SelectItem value="OR" className="text-xs">Match ANY</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {(rule.conditions || []).map((condition, conditionIndex) => {
                          const dependency = formulaVariables.find((variable) => variable.id === condition.dependsOnVariable);
                          const availableDependencies = getPriceConstraintDependencies();
                          const dependencyConditions = dependency ? getAvailableConditions(dependency.type) : [];
                          const isNumericDependency = ["number", "slider", "stepper"].includes(dependency?.type || "");

                          return (
                            <div key={condition.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-500 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                                    {conditionIndex + 1}
                                  </span>
                                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Condition</span>
                                </div>
                                {(rule.conditions?.length || 0) > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeConstraintCondition(type, rule.id, condition.id)}
                                    className="h-7 w-7 rounded-full p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid min-w-0 gap-2 2xl:grid-cols-3">
                                <div className="min-w-0">
                                <Select
                                  value={condition.dependsOnVariable || ""}
                                  onValueChange={(nextValue) => updateConstraintCondition(type, rule.id, condition.id, { dependsOnVariable: nextValue })}
                                >
                                  <SelectTrigger className="h-10 w-full min-w-0 bg-white text-sm dark:bg-slate-950">
                                    <SelectValue placeholder="Question or variable" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableDependencies.map((dependencyVariable) => (
                                      <SelectItem key={dependencyVariable.id} value={dependencyVariable.id} className="text-sm">
                                        {dependencyVariable.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                </div>

                                <div className="min-w-0">
                                <Select
                                  value={condition.condition || ""}
                                  onValueChange={(nextValue) => updateConstraintCondition(type, rule.id, condition.id, { condition: nextValue as VariableCondition["condition"] })}
                                  disabled={!condition.dependsOnVariable}
                                >
                                  <SelectTrigger className="h-10 w-full min-w-0 bg-white text-sm dark:bg-slate-950">
                                    <SelectValue placeholder="Comparison" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dependencyConditions.map((dependencyCondition) => (
                                      <SelectItem key={dependencyCondition} value={dependencyCondition} className="text-sm">
                                        {getConditionLabel(dependencyCondition)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                </div>

                                <div className="min-w-0">
                                {condition.condition && !["is_empty", "is_not_empty"].includes(condition.condition) ? (
                                  dependency && ["select", "dropdown", "multiple-choice"].includes(dependency.type) && dependency.options ? (
                                    <Select
                                      value={String(condition.expectedValue ?? "")}
                                      onValueChange={(nextValue) => updateConstraintCondition(type, rule.id, condition.id, { expectedValue: nextValue })}
                                    >
                                      <SelectTrigger className="h-10 w-full min-w-0 bg-white text-sm dark:bg-slate-950">
                                        <SelectValue placeholder="Expected value" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {dependency.options.map((option, optionIndex) => (
                                          <SelectItem key={`${dependency.id}-${optionIndex}`} value={String(option.value)} className="text-sm">
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : dependency?.type === "checkbox" ? (
                                    <Select
                                      value={String(condition.expectedValue ?? "")}
                                      onValueChange={(nextValue) => updateConstraintCondition(type, rule.id, condition.id, { expectedValue: nextValue === "true" })}
                                    >
                                      <SelectTrigger className="h-10 w-full min-w-0 bg-white text-sm dark:bg-slate-950">
                                        <SelectValue placeholder="Expected value" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="true" className="text-sm">Checked</SelectItem>
                                        <SelectItem value="false" className="text-sm">Unchecked</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      type={isNumericDependency ? "number" : "text"}
                                      className="h-10 w-full min-w-0 bg-white text-sm dark:bg-slate-950"
                                      value={String(condition.expectedValue ?? "")}
                                      onChange={(e) =>
                                        updateConstraintCondition(type, rule.id, condition.id, {
                                          expectedValue: isNumericDependency
                                            ? (e.target.value === "" ? "" : Number(e.target.value))
                                            : e.target.value,
                                        })
                                      }
                                      placeholder="Expected value"
                                    />
                                  )
                                ) : (
                                  <div className="flex min-w-0 h-10 items-center rounded-md border border-dashed border-slate-200 bg-white px-3 text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-950">
                                    No value needed for this comparison
                                  </div>
                                )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addConstraintCondition(type, rule.id)}
                          className="h-9 w-full border-dashed text-sm"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Another Condition
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={() => addConstraintRule(type)} className="h-10 w-full border-dashed bg-white/70 text-sm dark:bg-slate-950/30">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Conditional {type === "min" ? "Minimum" : "Maximum"} Rule
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingIcon(true);

    try {
      const formData = new FormData();
      formData.append('icon', file);

      const response = await fetch('/api/upload/icon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onUpdate({ iconUrl: result.iconUrl });
      
      toast({
        title: "Icon uploaded successfully",
        description: "Your custom icon has been saved"
      });
    } catch (error) {
      console.error('Icon upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload icon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const isGeneratingAIFormula = generateAIFormulaMutation.isPending;
  const isEditingAIFormula = editAIFormulaMutation.isPending;
  const currentAIGenerationStep = AI_GENERATION_STEPS[aiGenerationStep] ?? AI_GENERATION_STEPS[0];
  const optimizedFormulaPrompt = buildOptimizedFormulaPrompt(aiPromptContext, aiDescription);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Formula Builder */}
      <div className="w-full">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/70 shadow-sm backdrop-blur">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-700/70">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">Formula Builder</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{formula.name}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <TemplateLibraryButton />
                {canSaveAsTemplate && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSaveAsTemplateModal(true)}
                    className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/40 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Save as Template</span>
                    <span className="sm:hidden">Save</span>
                  </Button>
                )}
                {hasExistingFormula && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAIEditor((current) => !current);
                      setShowAIBuilder(false);
                    }}
                    className="text-xs sm:text-sm px-3 sm:px-4 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/40"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {showAIEditor ? "Hide AI Edit" : "AI Edit"}
                  </Button>
                )}
                <Button 
                  onClick={onSave} 
                  disabled={isSaving}
                  className="text-xs sm:text-sm px-3 sm:px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900"
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {isSaving ? (
                    <span className="hidden sm:inline">Saving...</span>
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* AI Formula Generator - Show for new formulas */}
          {(!formulaVariables.length && !formulaExpressionValue) && (
            <div className="p-4 sm:p-6 border-b border-slate-200/80 dark:border-slate-700/70">
              <Card className="relative overflow-hidden rounded-2xl border-slate-200/60 dark:border-slate-700/40 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm shadow-none">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                <div className="pointer-events-none absolute -top-20 right-0 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-8 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
                <CardHeader className="relative pb-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-transparent text-blue-700 shadow-sm dark:border-blue-400/20 dark:text-blue-200">
                          <Sparkles className={cn("h-5 w-5", isGeneratingAIFormula && "animate-pulse")} />
                        </div>
                        <div>
                          <CardTitle className="text-slate-900 dark:text-slate-100">Create Formula with AI</CardTitle>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Describe the service once and the builder will get a full pricing draft to refine.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                          Variables + formula
                        </Badge>
                        <Badge variant="secondary" className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                          Service description
                        </Badge>
                        <Badge variant="secondary" className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                          Fast first draft
                        </Badge>
                      </div>
                    </div>
                    {!showAIBuilder && (
                      <Button
                        onClick={() => setShowAIBuilder(true)}
                        className="h-11 rounded-xl bg-slate-900 px-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Formula with AI
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {!showAIBuilder ? (
                  <CardContent className="relative pt-0">
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Start with a short description and AI will draft the calculator structure for you.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Best results include scope, pricing drivers, material tiers, and optional add-ons.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {AI_FORMULA_EXAMPLES.slice(0, 2).map((example, index) => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => {
                              setAiDescription(example);
                              setShowAIBuilder(true);
                            }}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
                          >
                            Prompt {index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="relative space-y-5">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
                          <Label htmlFor="ai-provider" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            AI Provider
                          </Label>
                          <Select value={selectedAIProvider} onValueChange={setSelectedAIProvider}>
                            <SelectTrigger className="mt-3 h-11 rounded-xl border-slate-200 bg-white/90 text-slate-900 focus:border-blue-400 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100">
                              <SelectValue placeholder="Choose AI provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI (GPT-5) - Most Powerful</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

	                        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
	                          <div className="flex items-center justify-between gap-3">
	                            <Label htmlFor="ai-description" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
	                              Describe your service
                            </Label>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Include size, materials, complexity, and add-ons
                            </span>
                          </div>
                          <Textarea
                            id="ai-description"
                            value={aiDescription}
                            onChange={(e) => setAiDescription(e.target.value)}
                            placeholder="Create a bathroom renovation calculator that includes square footage, fixtures, tile tier, demo work, and labor complexity."
                            className="mt-3 min-h-[160px] rounded-xl border-slate-200 bg-white/90 text-sm leading-6 text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                          />
	                          <div className="mt-4 flex flex-wrap gap-2">
	                            {AI_FORMULA_EXAMPLES.map((example, index) => (
	                              <button
                                key={example}
                                type="button"
                                onClick={() => setAiDescription(example)}
                                disabled={isGeneratingAIFormula}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
	                              >
	                                Prompt {index + 1}
	                              </button>
	                            ))}
	                          </div>
	                        </div>

	                        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/70 p-4 dark:border-blue-500/20 dark:from-blue-950/20 dark:via-slate-900/80 dark:to-cyan-950/20">
	                          <button
	                            type="button"
	                            onClick={() => setShowOptimizedPromptHelper((current) => !current)}
	                            className="flex w-full items-start justify-between gap-3 text-left"
	                          >
	                            <div className="space-y-1">
	                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
	                                Optimized Prompt for ChatGPT / Claude / Gemini
	                              </p>
	                              <p className="text-sm text-slate-600 dark:text-slate-300">
	                                Use this when you want another AI tool to help write a stronger Formula Builder prompt before you paste it back here.
	                              </p>
	                            </div>
	                            <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-200">
	                              <span>{showOptimizedPromptHelper ? "Hide" : "Show"}</span>
	                              {showOptimizedPromptHelper ? (
	                                <ChevronUp className="h-4 w-4" />
	                              ) : (
	                                <ChevronDown className="h-4 w-4" />
	                              )}
	                            </div>
	                          </button>
	                          {showOptimizedPromptHelper && (
	                            <div className="mt-4 space-y-4">
	                              <div className="flex justify-end">
	                                <Button
	                                  type="button"
	                                  variant="outline"
	                                  size="sm"
	                                  onClick={async () => {
	                                    try {
	                                      await navigator.clipboard.writeText(optimizedFormulaPrompt);
	                                      toast({
	                                        title: "Prompt copied",
	                                        description: "Paste it into your AI tool of choice, then bring the improved result back here.",
	                                      });
	                                    } catch (error) {
	                                      console.error("Failed to copy optimized formula prompt:", error);
	                                      toast({
	                                        title: "Copy failed",
	                                        description: "Select the prompt manually and copy it.",
	                                        variant: "destructive",
	                                      });
	                                    }
	                                  }}
	                                  className="shrink-0 border-blue-200 bg-white/80 text-blue-700 hover:bg-blue-50 dark:border-blue-400/20 dark:bg-slate-950/50 dark:text-blue-200 dark:hover:bg-blue-500/10"
	                                >
	                                  <Copy className="mr-2 h-3.5 w-3.5" />
	                                  Copy Prompt
	                                </Button>
	                              </div>
	                              <div>
	                                <Label htmlFor="ai-prompt-context" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
	                                  Add service-specific context
	                                </Label>
	                                <Textarea
	                                  id="ai-prompt-context"
	                                  value={aiPromptContext}
	                                  onChange={(e) => setAiPromptContext(e.target.value)}
	                                  placeholder="Example: Residential pressure washing in Florida. We price by square footage, surface type, and stain severity. Minimum charge is 199. We offer driveway sealing, gutter brightening, and rush scheduling as add-ons."
	                                  className="mt-3 min-h-[120px] rounded-xl border-blue-100 bg-white/90 text-sm leading-6 text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-500/20 dark:border-blue-400/20 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500"
	                                />
	                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
	                                  Add the service, pricing drivers, minimums, upsells, complexity factors, and anything unique to the type of jobs you want this calculator to target.
	                                </p>
	                              </div>
	                              <div>
	                                <Label htmlFor="optimized-formula-prompt" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
	                                  Copy this into your AI tool
	                                </Label>
	                                <Textarea
	                                  id="optimized-formula-prompt"
	                                  readOnly
	                                  value={optimizedFormulaPrompt}
	                                  className="mt-3 min-h-[260px] rounded-xl border-slate-200 bg-white/95 font-mono text-xs leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100"
	                                />
	                              </div>
	                            </div>
	                          )}
	                        </div>

	                        <div className="flex flex-col gap-3 sm:flex-row">
	                          <Button
                            onClick={() => generateAIFormulaMutation.mutate(aiDescription)}
                            disabled={!aiDescription.trim() || isGeneratingAIFormula}
                            className="h-11 rounded-xl bg-slate-900 px-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:hover:translate-y-0 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                          >
                            {isGeneratingAIFormula ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Formula...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Formula
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowAIBuilder(false)}
                            disabled={isGeneratingAIFormula}
                            className="h-11 rounded-xl border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-4 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">What AI will build</p>
                            <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50/80 text-[11px] font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200">
                              Autofill
                            </Badge>
                          </div>
                          <div className="mt-4 space-y-3">
                            {["Service title and description", "Questions and pricing variables", "Formula logic and starting structure"].map((item) => (
                              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                                  <Sparkles className="h-3.5 w-3.5" />
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Generation status</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {isGeneratingAIFormula ? currentAIGenerationStep : "Ready when you are."}
                              </p>
                            </div>
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border",
                              isGeneratingAIFormula
                                ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200"
                                : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                            )}>
                              {isGeneratingAIFormula ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {AI_GENERATION_STEPS.map((step, index) => {
                              const isActive = isGeneratingAIFormula && index === aiGenerationStep;
                              const isCompleted = isGeneratingAIFormula && index < aiGenerationStep;

                              return (
                                <div
                                  key={step}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300",
                                    isActive
                                      ? "border-blue-200 bg-blue-50/80 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/10"
                                      : "border-slate-200/80 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-950/40",
                                    isCompleted && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/10"
                                  )}
                                >
                                  <div className="relative flex h-8 w-8 items-center justify-center">
                                    <div
                                      className={cn(
                                        "absolute h-8 w-8 rounded-full",
                                        isActive && "animate-ping bg-blue-400/20 dark:bg-blue-300/20"
                                      )}
                                    />
                                    <div
                                      className={cn(
                                        "relative h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600",
                                        isActive && "bg-blue-500 dark:bg-blue-300",
                                        isCompleted && "bg-emerald-500 dark:bg-emerald-300"
                                      )}
                                    />
                                  </div>
                                  <p
                                    className={cn(
                                      "text-sm text-slate-500 dark:text-slate-400",
                                      (isActive || isCompleted) && "text-slate-700 dark:text-slate-200"
                                    )}
                                  >
                                    {step}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {isGeneratingAIFormula && (
                            <div className="mt-4 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-700"
                                style={{ width: `${Math.min(((aiGenerationStep + 1) / AI_GENERATION_STEPS.length) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* AI Formula Editor - Show when user wants to edit existing formula */}
          {showAIEditor && (
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/70" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <Card className="relative overflow-hidden rounded-2xl border-amber-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(255,247,237,0.96),rgba(248,250,252,0.94))] shadow-[0_30px_90px_-48px_rgba(234,88,12,0.45)] dark:border-amber-500/15 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94),rgba(15,23,42,0.96))]">
                <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 translate-x-1/4 -translate-y-1/3 rounded-full bg-gradient-to-br from-amber-200/60 to-transparent blur-3xl dark:from-amber-500/10" />
                <CardHeader className="relative pb-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600/80 dark:text-amber-300/80">
                            AI Formula Edit
                          </p>
                          <CardTitle
                            className="text-2xl text-slate-900 dark:text-white"
                            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                          >
                            Edit this calculator with AI
                          </CardTitle>
                        </div>
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Use targeted edits for fast, precise changes. Ask AI to add pricing tweaks, insert follow-up questions, expand options, or rewrite the whole calculator only when you explicitly want a bigger rebuild.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Add options",
                          "Add follow-up question",
                          "Tweak pricing logic",
                          "Rebuild larger flow",
                        ].map((label) => (
                          <Badge
                            key={label}
                            variant="secondary"
                            className="rounded-full border border-amber-200/70 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-amber-500/20 dark:bg-slate-900/70 dark:text-slate-300"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-slate-700 dark:bg-slate-900/75">
                      <Label htmlFor="ai-provider-edit" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        AI Provider
                      </Label>
                      <Select value={selectedAIProvider} onValueChange={setSelectedAIProvider}>
                        <SelectTrigger className="mt-3 h-11 rounded-xl border-slate-200 bg-white/90 text-slate-900 focus:border-amber-400 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100">
                          <SelectValue placeholder="Choose AI provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI (GPT-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-slate-700 dark:bg-slate-900/75">
                      <Label htmlFor="ai-edit-mode" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Edit Mode
                      </Label>
                      <Select value={aiEditMode} onValueChange={(value) => setAiEditMode(value as AIEditMode)}>
                        <SelectTrigger
                          id="ai-edit-mode"
                          className="mt-3 h-11 rounded-xl border-slate-200 bg-white/90 text-slate-900 focus:border-amber-400 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                        >
                          <SelectValue placeholder="Choose edit mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="targeted">Targeted edit - keep everything else</SelectItem>
                          <SelectItem value="rebuild">Rebuild formula - larger rewrite</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {aiEditMode === "targeted"
                          ? "Use this for small exact changes. AI only patches the part you mention."
                          : "Use rebuild when you want AI to broadly restructure variables, copy, and pricing flow."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900/80">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="ai-edit-instructions" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          What should AI change?
                        </Label>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {aiEditMode === "targeted" ? "Best for one exact change at a time" : "Best for broader rewrites"}
                        </span>
                      </div>
                      <Textarea
                        id="ai-edit-instructions"
                        value={aiEditInstructions}
                        onChange={(e) => setAiEditInstructions(e.target.value)}
                        placeholder={aiEditMode === "targeted"
                          ? "e.g., 'Only update the formula so rush service adds 75. Do not rename or rewrite my other variables.'"
                          : "e.g., 'Rebuild this calculator for commercial window cleaning with better pricing tiers and clearer question wording.'"}
                        className="mt-3 min-h-[148px] rounded-2xl border-slate-200 bg-white/95 text-sm leading-6 text-slate-700 focus:border-amber-400 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100"
                      />
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(aiEditMode === "targeted"
                          ? [
                              "Add a rush fee option and only update the formula.",
                              "Add Premium and Luxury choices to my main service tier variable.",
                              "Add a follow-up question after property type when Commercial is selected.",
                            ]
                          : [
                              "Rebuild this calculator to better handle commercial jobs and larger projects.",
                              "Rewrite the pricing flow with clearer variables and stronger package tiers.",
                              "Restructure this formula to support more upsells and conditional follow-up questions.",
                            ]).map((example) => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => setAiEditInstructions(example)}
                            className="rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => editAIFormulaMutation.mutate(aiEditInstructions)}
                        disabled={!aiEditInstructions.trim() || isEditingAIFormula}
                        className="rounded-xl border-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700"
                      >
                        {isEditingAIFormula ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {aiEditMode === "targeted" ? "Applying Edit..." : "Rebuilding..."}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {aiEditMode === "targeted" ? "Apply Targeted Edit" : "Rebuild with AI"}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAIEditor(false)}
                        disabled={isEditingAIFormula}
                        className="rounded-xl border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Basic Details Section */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
                <Pencil className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">Service Identity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">How this service appears to your customers</p>
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/95">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
                {/* Icon */}
                <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <Label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Icon</Label>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Shown in selectors and previews</p>
                    </div>
                    {formula.iconUrl ? (
                      <button
                        onClick={() => onUpdate({ iconUrl: null, iconId: null })}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300"
                        aria-label="Remove icon"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950/70">
                      {formula.iconUrl ? (
                        <img src={formula.iconUrl} alt="Icon" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl">🔧</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Icon Source</Label>
                      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950/70">
                        <IconSelector
                          selectedIconId={formula.iconId || undefined}
                          onIconSelect={(iconId, iconUrl) => onUpdate({ iconId, iconUrl })}
                          triggerText="Library"
                          size="sm"
                          triggerVariant="outline"
                          triggerClassName="h-8 rounded-xl border-slate-200 px-3 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          className="bg-transparent border-none shadow-none"
                        />
                        <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          <Upload className="h-3 w-3" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('icon', file);
                                try {
                                  const response = await fetch('/api/upload/icon', { method: 'POST', body: formData });
                                  const data = await response.json();
                                  if (response.ok) {
                                    onUpdate({ iconUrl: data.iconUrl, iconId: null });
                                    toast({ title: "Icon uploaded" });
                                  }
                                } catch (error) {
                                  toast({ title: "Upload failed", variant: "destructive" });
                                }
                              }
                            }}
                          />
                        </label>
                        <a
                          href="/icon-generator"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 text-xs font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-700"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>AI</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Name */}
                <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <Label htmlFor="formula-name" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Service Name <span className="text-amber-600">*</span>
                  </Label>
                  <Input
                    id="formula-name"
                    value={formula.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="e.g. Kitchen Remodel"
                    className="h-10 w-full rounded-xl border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-950/80"
                  />
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Used in navigation and reports</p>
                </div>

                {/* Calculator Title */}
                <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <Label htmlFor="formula-title" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Calculator Title
                  </Label>
                  <Input
                    id="formula-title"
                    value={formula.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="e.g. Get Your Kitchen Remodel Quote"
                    className="h-10 w-full rounded-xl border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-950/80"
                  />
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Headline shown at the top of your embed</p>
                </div>
              </div>
            </div>

          </div>

          {/* Media & Advanced Settings - Collapsible */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowMediaSection(!showMediaSection)}
              className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Settings2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 block leading-tight">Media &amp; Settings</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Description, images, video, and smart features</span>
                </div>
                {(formula.description || (formula.bulletPoints && formula.bulletPoints.length > 0) || formula.guideVideoUrl || formula.showImage || formula.enableMeasureMap || formula.enablePhotoMeasurement) && (
                  <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">Active</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                <span className="hidden sm:inline">{showMediaSection ? 'Collapse' : 'Expand'}</span>
                {showMediaSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showMediaSection && (
              <div className="px-4 sm:px-6 pb-6 space-y-5">

                {/* Content Sub-section */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-1">
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Content</span>
                  </div>
                  {/* Description & Bullet Points */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="formula-description" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</Label>
                      <Textarea
                        id="formula-description"
                        value={formula.description || ""}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        placeholder="Briefly describe this service to help customers understand what's included..."
                        rows={3}
                        className="text-sm resize-none bg-white dark:bg-gray-900"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Shown below the calculator title</p>
                    </div>
                    <div>
                      <Label htmlFor="formula-bullet-input" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Highlights</Label>
                      <Input
                        id="formula-bullet-input"
                        value={bulletInput}
                        onChange={(e) => setBulletInput(e.target.value)}
                        placeholder="Type a highlight and press Enter..."
                        className="h-9 bg-white dark:bg-gray-900"
                        data-testid="input-bullet-point"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = bulletInput.trim();
                            if (!value) return;
                            const next = [...(formula.bulletPoints || []), value];
                            onUpdate({ bulletPoints: next });
                            setBulletInput("");
                          }
                        }}
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Press Enter to add. Shown as a feature list to customers.</p>
                      {(formula.bulletPoints || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5" data-testid="bullet-point-list">
                          {(formula.bulletPoints || []).map((point, index) => (
                            <div
                              key={`${point}-${index}`}
                              className="flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-xs text-blue-700 dark:text-blue-300"
                            >
                              <span>{point}</span>
                              <button
                                type="button"
                                className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
                                onClick={() => {
                                  const next = (formula.bulletPoints || []).filter((_, i) => i !== index);
                                  onUpdate({ bulletPoints: next });
                                }}
                                aria-label="Remove bullet point"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media Sub-section */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-1">
                    <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Media</span>
                  </div>
                  {/* Video & Image Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guide-video" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Guide Video URL</Label>
                      <Input
                        id="guide-video"
                        value={formula.guideVideoUrl || ''}
                        onChange={(e) => onUpdate({ guideVideoUrl: e.target.value || null })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="h-9 bg-white dark:bg-gray-900"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Embedded tutorial video for customers</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Service Image</Label>
                      <div className="flex items-center gap-3 h-9">
                        <Switch
                          id="show-image"
                          checked={formula.showImage}
                          onCheckedChange={(checked) => onUpdate({ showImage: checked })}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formula.showImage ? 'Visible to customers' : 'Hidden'}</span>
                        {formula.showImage && formula.imageUrl && (
                          <img src={formula.imageUrl} alt="Preview" className="w-8 h-8 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Display a photo alongside your calculator</p>
                    </div>
                  </div>

                  {formula.showImage && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex-1 min-w-0">
                        <Label className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block font-semibold">Upload Service Image</Label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
                                const data = await response.json();
                                if (response.ok) onUpdate({ imageUrl: data.url });
                              } catch (error) {
                                console.error('Error uploading image:', error);
                              }
                            }
                          }}
                          className="text-xs w-full dark:text-gray-200 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 cursor-pointer"
                        />
                      </div>
                      {formula.imageUrl && (
                        <div className="h-14 w-14 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800 flex-shrink-0 shadow-sm">
                          <img src={formula.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Smart Features Sub-section */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-1">
                    <Zap className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Smart Features</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Map className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Measure Map</span>
                          <Switch
                            checked={formula.enableMeasureMap || false}
                            onCheckedChange={(checked) => onUpdate({ enableMeasureMap: checked })}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Let customers draw areas on a map</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">AI Photo Measure</span>
                          <Switch
                            checked={formula.enablePhotoMeasurement || false}
                            onCheckedChange={(checked) => onUpdate({ enablePhotoMeasurement: checked })}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Measure from customer photos with AI</p>
                      </div>
                    </div>
                  </div>

                  {formula.enableMeasureMap && (
                    <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800/50">
                      <div className="flex items-center gap-3">
                        <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">Measurement Unit:</Label>
                        <Select
                          value={formula.measureMapUnit || "sqft"}
                          onValueChange={(value) => onUpdate({ measureMapUnit: value })}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sqft">Square Feet</SelectItem>
                            <SelectItem value="sqm">Square Meters</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {formula.enablePhotoMeasurement && (
                    <div className="bg-purple-50/80 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800/50 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs font-medium text-purple-700 dark:text-purple-300">Object Description</Label>
                            <RefinePromptButton formula={formula} onUpdate={onUpdate} />
                          </div>
                          <Textarea
                            value={formula.photoMeasurementSetup?.objectDescription || ''}
                            onChange={(e) => {
                              const setup = formula.photoMeasurementSetup || { objectDescription: '', measurementType: 'area' as const, referenceImages: [] };
                              onUpdate({ photoMeasurementSetup: { ...setup, objectDescription: e.target.value } });
                            }}
                            placeholder="E.g., 'Residential house roof'"
                            rows={2}
                            className="text-xs resize-none"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 block">Customer Instructions</Label>
                          <Textarea
                            value={formula.photoMeasurementSetup?.customerInstructions || ''}
                            onChange={(e) => {
                              const setup = formula.photoMeasurementSetup || { objectDescription: '', measurementType: 'area' as const, referenceImages: [] };
                              onUpdate({ photoMeasurementSetup: { ...setup, customerInstructions: e.target.value } });
                            }}
                            placeholder="E.g., 'Take photos from different angles'"
                            rows={2}
                            className="text-xs resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label className="text-xs font-medium text-purple-700 dark:text-purple-300">Measure:</Label>
                        <Select
                          value={formula.photoMeasurementSetup?.measurementType || "area"}
                          onValueChange={(value: 'area' | 'length' | 'width' | 'height' | 'perimeter') => {
                            const setup = formula.photoMeasurementSetup || { objectDescription: '', measurementType: 'area' as const, referenceImages: [] };
                            onUpdate({ photoMeasurementSetup: { ...setup, measurementType: value } });
                          }}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="area">Area (sq ft)</SelectItem>
                            <SelectItem value="length">Length (ft)</SelectItem>
                            <SelectItem value="width">Width (ft)</SelectItem>
                            <SelectItem value="height">Height (ft)</SelectItem>
                            <SelectItem value="perimeter">Perimeter (ft)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upsell Items */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block leading-tight">Upsell Items</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Optional add-ons offered to customers</span>
                      </div>
                      {(formula.upsellItems || []).length > 0 && (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">{formula.upsellItems?.length}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        const newUpsell = {
                          id: `upsell_${Date.now()}`,
                          name: "New Upsell",
                          description: "Add description",
                          category: "addon",
                          calculationType: "percentage_service" as const,
                          percentageOfMain: 15,
                          fixedAmount: 0,
                          isPopular: false,
                          iconUrl: "",
                          imageUrl: "",
                          tooltip: ""
                        };
                        onUpdate({ upsellItems: [...(formula.upsellItems || []), newUpsell] });
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {(formula.upsellItems || []).length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upsells created here are attached to this service. In multi-service quotes they are priced against this service unless you choose a different pricing mode.
                      </p>
                      {(formula.upsellItems || []).map((upsell, index) => (
                        <div key={upsell.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-2">
                          {(() => {
                            const upsellCondition = upsell.conditionalLogic?.conditions?.[0];
                            const dependency = upsellDependencyVariables.find((variable) => variable.id === upsellCondition?.dependsOnVariable);
                            const dependencyConditions = dependency ? getAvailableConditions(dependency.type) : [];
                            const isNumericDependency = ["number", "slider", "stepper"].includes(dependency?.type || "");

                            return (
                              <>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
                              <Input
                                value={upsell.name}
                                onChange={(e) => {
                                  const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? { ...u, name: e.target.value } : u);
                                  onUpdate({ upsellItems: updated });
                                }}
                                placeholder="Name"
                                className="h-8 text-xs"
                              />
                              <Select
                                value={upsell.calculationType || "percentage_service"}
                                onValueChange={(value) => {
                                  const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? {
                                    ...u,
                                    calculationType: value as "percentage_service" | "percentage_total" | "fixed_amount",
                                  } : u);
                                  onUpdate({ upsellItems: updated });
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage_service">% of service</SelectItem>
                                  <SelectItem value="percentage_total">% of total quote</SelectItem>
                                  <SelectItem value="fixed_amount">Fixed amount</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                value={(upsell.calculationType || "percentage_service") === "fixed_amount"
                                  ? (upsell.fixedAmount ?? 0)
                                  : upsell.percentageOfMain}
                                onChange={(e) => {
                                  const numericValue = Number(e.target.value) || 0;
                                  const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? {
                                    ...u,
                                    ...( (u.calculationType || "percentage_service") === "fixed_amount"
                                      ? { fixedAmount: numericValue }
                                      : { percentageOfMain: numericValue }),
                                  } : u);
                                  onUpdate({ upsellItems: updated });
                                }}
                                placeholder={(upsell.calculationType || "percentage_service") === "fixed_amount" ? "$" : "%"}
                                className="h-8 text-xs"
                              />
                              <Select
                                value={upsell.category}
                                onValueChange={(value) => {
                                  const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? { ...u, category: value } : u);
                                  onUpdate({ upsellItems: updated });
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="protection">Protection</SelectItem>
                                  <SelectItem value="addon">Add-on</SelectItem>
                                  <SelectItem value="upgrade">Upgrade</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={upsell.isPopular || false}
                                  onCheckedChange={(checked) => {
                                    const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? { ...u, isPopular: checked } : u);
                                    onUpdate({ upsellItems: updated });
                                  }}
                                />
                                <span className="text-xs text-gray-500">Popular</span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onUpdate({ upsellItems: (formula.upsellItems || []).filter(u => u.id !== upsell.id) })}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Input
                            value={upsell.description}
                            onChange={(e) => {
                              const updated = (formula.upsellItems || []).map(u => u.id === upsell.id ? { ...u, description: e.target.value } : u);
                              onUpdate({ upsellItems: updated });
                            }}
                            placeholder={(upsell.calculationType || "percentage_service") === "fixed_amount"
                              ? `Description ($${upsell.fixedAmount ?? 0} fixed)`
                              : `Description (${upsell.percentageOfMain}% ${(upsell.calculationType || "percentage_service") === "percentage_total" ? "of total quote" : "of this service"})`}
                            className="h-8 text-xs"
                          />
                          <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                  Conditional display
                                </p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                  Show this add-on only when a question is answered a certain way.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {upsell.conditionalLogic?.enabled && (
                                  <span className="text-[10px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-0.5">
                                    Active
                                  </span>
                                )}
                                <Switch
                                  checked={upsell.conditionalLogic?.enabled || false}
                                  onCheckedChange={(checked) => toggleUpsellConditionalLogic(upsell.id, checked)}
                                />
                              </div>
                            </div>

                            {upsell.conditionalLogic?.enabled && (
                              upsellDependencyVariables.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <Select
                                    value={upsellCondition?.dependsOnVariable || ""}
                                    onValueChange={(value) => updateUpsellCondition(upsell.id, {
                                      dependsOnVariable: value,
                                      condition: "equals",
                                      expectedValue: "",
                                    })}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Question" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {upsellDependencyVariables.map((variable) => (
                                        <SelectItem key={variable.id} value={variable.id} className="text-xs">
                                          {variable.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <Select
                                    value={upsellCondition?.condition || ""}
                                    onValueChange={(value) => updateUpsellCondition(upsell.id, {
                                      condition: value as VariableCondition["condition"],
                                    })}
                                    disabled={!upsellCondition?.dependsOnVariable}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {dependencyConditions.map((condition) => (
                                        <SelectItem key={condition} value={condition} className="text-xs">
                                          {getConditionLabel(condition)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {upsellCondition?.condition && !["is_empty", "is_not_empty"].includes(upsellCondition.condition) ? (
                                    dependency && ["select", "dropdown", "multiple-choice"].includes(dependency.type) && dependency.options ? (
                                      <Select
                                        value={String(upsellCondition.expectedValue ?? "")}
                                        onValueChange={(value) => updateUpsellCondition(upsell.id, { expectedValue: value })}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Value" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {dependency.options.map((option, optionIndex) => (
                                            <SelectItem key={`${upsell.id}-condition-option-${optionIndex}`} value={String(option.value)} className="text-xs">
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : dependency?.type === "checkbox" ? (
                                      <Select
                                        value={String(upsellCondition.expectedValue ?? "")}
                                        onValueChange={(value) => updateUpsellCondition(upsell.id, { expectedValue: value === "true" })}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Value" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="true" className="text-xs">Checked</SelectItem>
                                          <SelectItem value="false" className="text-xs">Unchecked</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        type={isNumericDependency ? "number" : "text"}
                                        value={String(upsellCondition.expectedValue ?? "")}
                                        onChange={(e) => updateUpsellCondition(upsell.id, {
                                          expectedValue: isNumericDependency ? (Number(e.target.value) || 0) : e.target.value,
                                        })}
                                        placeholder="Value"
                                        className="h-8 text-xs"
                                      />
                                    )
                                  ) : (
                                    <div className="h-8 rounded-md border border-dashed border-amber-300 dark:border-amber-700 flex items-center px-3 text-[11px] text-amber-700 dark:text-amber-300">
                                      No comparison value needed
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[11px] text-amber-800 dark:text-amber-200 rounded-md border border-amber-300 dark:border-amber-700 bg-white/70 dark:bg-amber-950/30 px-3 py-2">
                                  Add at least one question to this service before using upsell conditions.
                                </div>
                              )
                            )}
                          </div>
                              </>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Variables Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Variables</h3>
              {formulaVariables.length > 0 && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  Drag to reorder
                </p>
              )}
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={formulaVariables.map(v => v.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-4">
                  {formulaVariables.map((variable, index) => (
                    <SortableVariableCard
                      key={variable.id}
                      variable={variable}
                      index={index}
                      totalVariables={formulaVariables.length}
                      onDelete={handleDeleteVariable}
                      onUpdate={handleUpdateVariable}
                      allVariables={formulaVariables}
                      onAIAssistVariable={handleVariableAIAssist}
                      activeAIAssistTargetId={activeAIAssistTargetId}
                      onMoveVariable={handleMoveVariable}
                    />
                  ))}
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                    onClick={() => setShowVariableModal(true)}
                  >
                    <div className="text-center">
                      <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add Variable</p>
                    </div>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Formula Builder */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Pricing Formula</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="formula-expression" className="dark:text-gray-200">Formula Expression</Label>
                <FormulaExpressionInput
                  value={formulaExpression}
                  onChange={handleFormulaChange}
                  variables={formulaVariables}
                  placeholder="e.g., squareFootage * 25 + laborHours * 85"
                />
              </div>
              
              {/* Available Variables */}
              {formulaVariables.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">Available Variable IDs:</h4>
                  <div className="flex flex-wrap gap-1">
                    {formulaVariables.map((variable) => {
                      const insertVariable = (id: string) => {
                        const textarea = document.getElementById('formula-expression') as HTMLTextAreaElement;
                        if (textarea) {
                          const cursorPos = textarea.selectionStart;
                          const newValue = formulaExpression.slice(0, cursorPos) + id + formulaExpression.slice(cursorPos);
                          handleFormulaChange(newValue);
                          setTimeout(() => {
                            textarea.setSelectionRange(cursorPos + id.length, cursorPos + id.length);
                            textarea.focus();
                          }, 10);
                        }
                      };

                      const isMultiSelect = variable.type === 'multiple-choice' && variable.allowMultipleSelection;
                      
                      return (
                        <div key={variable.id} className="contents">
                          {/* Always show base variable ID */}
                          <code
                            className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                            onClick={() => insertVariable(variable.id)}
                          >
                            {variable.id}
                          </code>

                          {/* Show individual option IDs for multi-select multiple-choice */}
                          {isMultiSelect && variable.options?.map((option, optIndex) => {
                            const optionId = toOptionId(option.id ?? option.value ?? option.label, optIndex + 1);
                            return (
                              <code
                                key={`${variable.id}_${optionId}`}
                                className="inline-block px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs rounded cursor-pointer hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                                onClick={() => insertVariable(`${variable.id}_${optionId}`)}
                                title={`${option.label}: ${option.numericValue || 0}`}
                              >
                                {variable.id}_{optionId}
                              </code>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Click on a variable ID to insert it into your formula. <span className="text-green-700 dark:text-green-300 font-medium">Green IDs</span> are individual options from multi-select variables.
                  </p>
                </div>
              )}

              {repeatableGroupWarnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <h4 className="mb-2 font-medium">Repeatable Group Warning</h4>
                  <div className="space-y-1">
                    {repeatableGroupWarnings.map(({ groupId, groupName, countVariableId }) => (
                      <p key={`${groupId}-${countVariableId}`}>
                        <code>{groupId}</code> for {groupName} already contains the summed total for all repeated items.
                        Using it together with <code>{countVariableId}</code> in the main formula can double-count the price.
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Min/Max Price Constraints */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  {renderConstraintSection(
                    "min",
                    "Default Minimum Price (optional)",
                    minPriceDollars,
                    handleMinPriceChange,
                    "If no conditional minimum matches and the calculated price is below this, use this value instead.",
                    formula.conditionalMinPrices,
                  )}
                </div>
                <div className="lg:col-span-2">
                  {renderConstraintSection(
                    "max",
                    "Default Maximum Price (optional)",
                    maxPriceDollars,
                    handleMaxPriceChange,
                    "If no conditional maximum matches and the calculated price is above this, use this value instead.",
                    formula.conditionalMaxPrices,
                  )}
                </div>
              </div>
              
              {/* Formula Help */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p><strong className="dark:text-gray-300">Formula Tips:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use basic math operators: +, -, *, /, ( )</li>
                  <li>Reference variables by their ID (case-sensitive)</li>
                  <li>Select variables automatically use their multiplier values</li>
                  <li>Checkbox variables return true/false, multiply by costs</li>
                  <li>Repeatable group IDs already represent the total across all repeated items</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>



      <AddVariableModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        onAddVariable={handleAddVariable}
        otherFormulas={allFormulas.filter(f => f.id !== formula.id)}
        existingVariableIds={formulaVariables.map(v => v.id)}
      />

      {/* Save as Template Modal */}
      <Dialog open={showSaveAsTemplateModal} onOpenChange={(open) => {
        setShowSaveAsTemplateModal(open);
        if (!open) resetTemplateModal();
      }}>
        <DialogContent className="sm:max-w-[425px] border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-name" className="text-slate-700 dark:text-slate-300">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Kitchen Remodel Calculator"
                className="mt-1 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label htmlFor="template-category" className="text-slate-700 dark:text-slate-300">Category</Label>
              <Select value={templateCategory} onValueChange={setTemplateCategory}>
                <SelectTrigger className="mt-1 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  {templateCategories?.filter(c => c.isActive).map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Template Icon</Label>
              <div className="mt-1">
                <IconSelector
                  selectedIconId={templateIconId ?? undefined}
                  onIconSelect={(iconId, iconUrl) => {
                    setTemplateIconId(iconId);
                    setTemplateIconUrl(iconUrl);
                  }}
                  triggerText={templateIconId ? "Change Icon" : "Select Icon"}
                  size="md"
                  triggerVariant="outline"
                />
                {templateIconUrl && (
                  <div className="mt-2 flex items-center gap-2 rounded-md bg-gray-50 p-2 dark:bg-slate-800">
                    <img src={templateIconUrl} alt="Selected icon" className="w-6 h-6 object-contain" />
                    <span className="text-sm text-gray-600 dark:text-slate-400">Template icon selected</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTemplateIconId(null);
                        setTemplateIconUrl(null);
                      }}
                      className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSaveAsTemplateModal(false);
                resetTemplateModal();
              }}
              disabled={saveAsTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => saveAsTemplateMutation.mutate({ 
                category: templateCategory, 
                templateName: templateName || formula.name,
                iconId: templateIconId,
                iconUrl: templateIconUrl
              })}
              disabled={!templateCategory || saveAsTemplateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {saveAsTemplateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Icon Generator Modal */}
      <AIIconGeneratorModal
        isOpen={showIconGenerator}
        onClose={() => setShowIconGenerator(false)}
        onIconGenerated={(iconDataUrl) => {
          onUpdate({ iconUrl: iconDataUrl, iconId: null });
          setShowIconGenerator(false);
          toast({ title: "Icon generated successfully" });
        }}
        defaultPrompt={formula.name ? `Icon for ${formula.name} service` : ''}
        title="Generate Service Icon"
      />
    </div>
  );
}
