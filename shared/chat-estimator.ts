import type { Formula, Variable, VariableOption } from "./schema";
import { evaluateConditionalLogic } from "./conditional-logic";

export const CHAT_ESTIMATOR_SUPPORTED_TYPES = new Set([
  "checkbox",
  "dropdown",
  "multiple-choice",
  "number",
  "select",
  "stepper",
  "text",
]);

export type ChatEstimatorInputKind =
  | "yes_no"
  | "single_select"
  | "multi_select"
  | "number"
  | "short_text";

export interface ChatEstimatorQuestionOption {
  label: string;
  value: string | number;
}

export interface ChatEstimatorQuestionDescriptor {
  key: string;
  prompt: string;
  inputKind: ChatEstimatorInputKind;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: ChatEstimatorQuestionOption[];
}

export function getChatEstimatorWarnings(formula: Pick<
  Formula,
  "name" | "variables" | "enableMeasureMap" | "enablePhotoMeasurement"
>): string[] {
  const warnings: string[] = [];
  const unsupportedVariables = (formula.variables || []).filter(
    (variable) => !CHAT_ESTIMATOR_SUPPORTED_TYPES.has(variable.type),
  );

  if (unsupportedVariables.length > 0) {
    warnings.push(
      `Unsupported calculator question types: ${unsupportedVariables
        .map((variable) => `${variable.name} (${variable.type})`)
        .join(", ")}.`,
    );
  }

  if (formula.enableMeasureMap) {
    warnings.push("Measure Map inputs are not supported in Chat Estimator yet.");
  }

  if (formula.enablePhotoMeasurement) {
    warnings.push("Photo Measurement inputs are not supported in Chat Estimator yet.");
  }

  return warnings;
}

export function isChatEstimatorFormulaSupported(formula: Pick<
  Formula,
  "variables" | "enableMeasureMap" | "enablePhotoMeasurement"
>): boolean {
  return getChatEstimatorWarnings({
    ...formula,
    name: "",
  } as Formula).length === 0;
}

export function getChatEstimatorVisibleQuestions(
  variables: Variable[],
  answers: Record<string, any>,
): Variable[] {
  // The chat widget does not invent its own step order. It walks the same
  // calculator variable list and filters it through existing conditional logic.
  return variables.filter((variable) => {
    if (!CHAT_ESTIMATOR_SUPPORTED_TYPES.has(variable.type)) {
      return false;
    }
    if (!variable.conditionalLogic?.enabled) {
      return true;
    }
    return evaluateConditionalLogic(variable, answers, variables);
  });
}

export function getChatEstimatorNextQuestion(
  variables: Variable[],
  answers: Record<string, any>,
): Variable | null {
  const visibleQuestions = getChatEstimatorVisibleQuestions(variables, answers);
  return visibleQuestions.find((variable) => isQuestionUnanswered(variable, answers[variable.id])) || null;
}

export function getChatEstimatorProgress(
  variables: Variable[],
  answers: Record<string, any>,
  currentQuestionKey?: string | null,
): { current: number; total: number } {
  const visibleQuestions = getChatEstimatorVisibleQuestions(variables, answers);
  const total = visibleQuestions.length;
  if (!currentQuestionKey) {
    return { current: total > 0 ? 1 : 0, total };
  }

  const index = visibleQuestions.findIndex((variable) => variable.id === currentQuestionKey);
  return {
    current: index >= 0 ? index + 1 : Math.min(total, Object.keys(answers || {}).length + 1),
    total,
  };
}

export function getChatEstimatorQuestionDescriptor(variable: Variable): ChatEstimatorQuestionDescriptor {
  // This is the renderer mapping layer: one calculator variable becomes one chat step.
  return {
    key: variable.id,
    prompt: variable.name,
    inputKind: getInputKind(variable),
    required: variable.type !== "checkbox" && !(variable.type === "multiple-choice" && variable.allowMultipleSelection),
    min: variable.min,
    max: variable.max,
    step: variable.step,
    options: getQuestionOptions(variable.options),
  };
}

export function normalizeChatEstimatorAnswer(variable: Variable, rawAnswer: unknown): {
  value: any;
  error?: string;
} {
  switch (variable.type) {
    case "checkbox": {
      if (typeof rawAnswer === "boolean") {
        return { value: rawAnswer };
      }
      if (rawAnswer === "true" || rawAnswer === "yes" || rawAnswer === 1) {
        return { value: true };
      }
      if (rawAnswer === "false" || rawAnswer === "no" || rawAnswer === 0) {
        return { value: false };
      }
      return { value: false };
    }
    case "number":
    case "stepper": {
      const parsed = Number(rawAnswer);
      if (!Number.isFinite(parsed)) {
        return { value: null, error: "Please enter a valid number." };
      }
      if (typeof variable.min === "number" && parsed < variable.min) {
        return { value: null, error: `Please enter ${variable.min} or more.` };
      }
      if (typeof variable.max === "number" && parsed > variable.max) {
        return { value: null, error: `Please enter ${variable.max} or less.` };
      }
      return { value: parsed };
    }
    case "multiple-choice": {
      if (variable.allowMultipleSelection) {
        if (!Array.isArray(rawAnswer)) {
          return { value: [], error: "Please select one or more options." };
        }
        return { value: rawAnswer };
      }
      return { value: rawAnswer };
    }
    case "select":
    case "dropdown":
    case "text":
    default:
      return { value: rawAnswer };
  }
}

export function isQuestionUnanswered(variable: Variable, value: unknown): boolean {
  if (variable.type === "checkbox") {
    return value === undefined || value === null;
  }

  if (variable.type === "multiple-choice" && variable.allowMultipleSelection) {
    return !Array.isArray(value);
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null || value === "";
}

function getInputKind(variable: Variable): ChatEstimatorInputKind {
  if (variable.type === "checkbox") {
    return "yes_no";
  }

  if (variable.type === "multiple-choice" && variable.allowMultipleSelection) {
    return "multi_select";
  }

  if (variable.type === "select" || variable.type === "dropdown" || variable.type === "multiple-choice") {
    return "single_select";
  }

  if (variable.type === "number" || variable.type === "stepper") {
    return "number";
  }

  return "short_text";
}

function getQuestionOptions(options?: VariableOption[]): ChatEstimatorQuestionOption[] | undefined {
  if (!options || options.length === 0) {
    return undefined;
  }

  return options.map((option) => ({
    label: option.label,
    value: option.value,
  }));
}
