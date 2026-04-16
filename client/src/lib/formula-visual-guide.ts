import type { Variable } from "@shared/schema";

export type FormulaGuideTokenKind =
  | "number"
  | "variable"
  | "identifier"
  | "function"
  | "operator"
  | "paren"
  | "unknown";

export interface FormulaVariableReference {
  id: string;
  label: string;
  type?: string;
  tooltip?: string;
  defaultValue?: string | number | boolean | Array<string | number>;
}

export interface FormulaGuideToken {
  id: string;
  kind: FormulaGuideTokenKind;
  raw: string;
  display: string;
  start: number;
  end: number;
  depth: number;
  operator?: "+" | "-" | "*" | "/" | ",";
  parenSide?: "open" | "close";
  pairId?: string;
  variableId?: string;
}

export interface FormulaGuideWarning {
  id: string;
  message: string;
  severity: "error" | "warning";
}

export interface FormulaGuideGroup {
  id: string;
  tokens: FormulaGuideToken[];
}

export interface FormulaGuideResult {
  tokens: FormulaGuideToken[];
  groups: FormulaGuideGroup[];
  warnings: FormulaGuideWarning[];
  variableMap: Map<string, FormulaVariableReference>;
}

interface VariableReferenceIndex {
  ids: string[];
  map: Map<string, FormulaVariableReference>;
}

interface MatchedVariable {
  id: string;
  length: number;
}

function toOptionId(rawValue: unknown, fallbackIndex: number): string {
  const base = String(rawValue ?? "").trim().toLowerCase();
  const normalized = base
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return normalized || `option_${fallbackIndex}`;
}

function isBoundary(char: string | undefined): boolean {
  return !char || /\s/.test(char) || /[+\-*/(),]/.test(char);
}

function isNumberStart(expression: string, index: number): boolean {
  const char = expression[index];
  if (/\d/.test(char)) {
    return true;
  }

  return char === "." && /\d/.test(expression[index + 1] ?? "");
}

function buildVariableIndex(variables: Variable[]): VariableReferenceIndex {
  const map = new Map<string, FormulaVariableReference>();

  variables.forEach((variable) => {
    map.set(variable.id, {
      id: variable.id,
      label: variable.name || variable.id,
      type: variable.type,
      tooltip: variable.tooltip,
      defaultValue: variable.defaultValue,
    });

    if (variable.type === "multiple-choice" && variable.allowMultipleSelection && variable.options) {
      variable.options.forEach((option, index) => {
        const optionId = toOptionId(option.id ?? option.value ?? option.label, index + 1);
        const derivedId = `${variable.id}_${optionId}`;
        map.set(derivedId, {
          id: derivedId,
          label: `${variable.name || variable.id}: ${option.label}`,
          type: `${variable.type} option`,
          defaultValue: option.numericValue ?? option.value,
        });
      });
    }
  });

  const ids = Array.from(map.keys()).sort((left, right) => right.length - left.length);
  return { ids, map };
}

function matchVariableAt(
  expression: string,
  index: number,
  variableIds: string[],
): MatchedVariable | null {
  for (const variableId of variableIds) {
    if (!expression.startsWith(variableId, index)) {
      continue;
    }

    const before = expression[index - 1];
    const after = expression[index + variableId.length];

    if (isBoundary(before) && isBoundary(after)) {
      return {
        id: variableId,
        length: variableId.length,
      };
    }
  }

  return null;
}

export function buildFormulaGuide(expression: string, variables: Variable[]): FormulaGuideResult {
  const { ids: variableIds, map: variableMap } = buildVariableIndex(variables);
  const tokens: FormulaGuideToken[] = [];
  const warnings: FormulaGuideWarning[] = [];
  const warningKeys = new Set<string>();
  const parenStack: Array<{ pairId: string }> = [];
  let index = 0;
  let depth = 0;
  let tokenCount = 0;
  let parenCount = 0;

  const pushWarning = (message: string, severity: "error" | "warning") => {
    const key = `${severity}:${message}`;
    if (warningKeys.has(key)) {
      return;
    }

    warningKeys.add(key);
    warnings.push({
      id: `warning-${warnings.length + 1}`,
      message,
      severity,
    });
  };

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const variableMatch = matchVariableAt(expression, index, variableIds);
    if (variableMatch) {
      tokens.push({
        id: `token-${tokenCount + 1}`,
        kind: "variable",
        raw: variableMatch.id,
        display: variableMatch.id,
        start: index,
        end: index + variableMatch.length,
        depth,
        variableId: variableMatch.id,
      });
      tokenCount += 1;
      index += variableMatch.length;
      continue;
    }

    if (isNumberStart(expression, index)) {
      const start = index;
      let hasDecimal = false;

      while (index < expression.length) {
        const current = expression[index];
        if (current === ".") {
          if (hasDecimal) {
            break;
          }
          hasDecimal = true;
          index += 1;
          continue;
        }

        if (!/\d/.test(current)) {
          break;
        }

        index += 1;
      }

      const raw = expression.slice(start, index);
      tokens.push({
        id: `token-${tokenCount + 1}`,
        kind: "number",
        raw,
        display: raw,
        start,
        end: index,
        depth,
      });
      tokenCount += 1;
      continue;
    }

    if (/[+\-*/,]/.test(char)) {
      tokens.push({
        id: `token-${tokenCount + 1}`,
        kind: "operator",
        raw: char,
        display: char === "*" ? "×" : char,
        start: index,
        end: index + 1,
        depth,
        operator: char as "+" | "-" | "*" | "/" | ",",
      });
      tokenCount += 1;
      index += 1;
      continue;
    }

    if (char === "(") {
      const pairId = `paren-${parenCount + 1}`;
      parenStack.push({ pairId });
      tokens.push({
        id: `token-${tokenCount + 1}`,
        kind: "paren",
        raw: char,
        display: char,
        start: index,
        end: index + 1,
        depth,
        parenSide: "open",
        pairId,
      });
      tokenCount += 1;
      parenCount += 1;
      depth += 1;
      index += 1;
      continue;
    }

    if (char === ")") {
      const match = parenStack.pop();
      if (!match) {
        pushWarning("There is an unmatched closing parenthesis.", "error");
      }

      tokens.push({
        id: `token-${tokenCount + 1}`,
        kind: "paren",
        raw: char,
        display: char,
        start: index,
        end: index + 1,
        depth,
        parenSide: "close",
        pairId: match?.pairId,
      });
      tokenCount += 1;
      depth = Math.max(depth - 1, 0);
      index += 1;
      continue;
    }

    const start = index;
    while (index < expression.length && !isBoundary(expression[index])) {
      index += 1;
    }

    const raw = expression.slice(start, index);
    const nextNonWhitespace = expression.slice(index).match(/\S/)?.[0];
    const isIdentifier = /^[A-Za-z_][A-Za-z0-9_.-]*$/.test(raw);
    const kind: FormulaGuideTokenKind = isIdentifier
      ? nextNonWhitespace === "("
        ? "function"
        : "identifier"
      : "unknown";

    tokens.push({
      id: `token-${tokenCount + 1}`,
      kind,
      raw,
      display: raw,
      start,
      end: index,
      depth,
    });
    tokenCount += 1;
  }

  while (parenStack.length > 0) {
    parenStack.pop();
    pushWarning("There is an unmatched opening parenthesis.", "error");
  }

  const groups: FormulaGuideGroup[] = [];
  let currentGroup: FormulaGuideToken[] = [];

  tokens.forEach((token) => {
    if (token.kind === "operator" && token.operator === "+" && token.depth === 0) {
      if (currentGroup.length > 0) {
        groups.push({
          id: `group-${groups.length + 1}`,
          tokens: currentGroup,
        });
        currentGroup = [];
      }
      return;
    }

    currentGroup.push(token);
  });

  if (currentGroup.length > 0) {
    groups.push({
      id: `group-${groups.length + 1}`,
      tokens: currentGroup,
    });
  }

  let expectOperand = true;
  let previousToken: FormulaGuideToken | null = null;

  tokens.forEach((token) => {
    if (token.kind === "operator") {
      if (expectOperand) {
        if (token.operator !== "+" && token.operator !== "-") {
          pushWarning(`"${token.raw}" cannot appear here.`, "error");
        }
        previousToken = token;
        return;
      }

      expectOperand = true;
      previousToken = token;
      return;
    }

    if (token.kind === "paren") {
      if (token.parenSide === "open") {
        if (!expectOperand && previousToken?.kind !== "function") {
          pushWarning('There is a missing operator before "(".', "error");
        }
        expectOperand = true;
      } else {
        if (expectOperand && previousToken?.parenSide !== "open") {
          pushWarning('A closing parenthesis appears before the group is complete.', "error");
        }
        expectOperand = false;
      }

      previousToken = token;
      return;
    }

    if (!expectOperand && previousToken?.kind !== "function") {
      pushWarning(`There is a missing operator before "${token.raw}".`, "error");
    }

    if (token.kind === "identifier") {
      pushWarning(`"${token.raw}" is not matched to an available variable.`, "warning");
    }

    if (token.kind === "unknown") {
      pushWarning(`"${token.raw}" could not be tokenized cleanly.`, "warning");
    }

    expectOperand = false;
    previousToken = token;
  });

  const lastToken = tokens[tokens.length - 1];

  if (tokens.length > 0 && expectOperand && lastToken?.kind === "operator") {
    pushWarning("The expression ends with an operator.", "error");
  }

  tokens.forEach((token, tokenIndex) => {
    if (token.kind !== "function") {
      return;
    }

    const nextToken = tokens[tokenIndex + 1];
    if (nextToken?.kind !== "paren" || nextToken.parenSide !== "open") {
      pushWarning(`"${token.raw}" looks like a function but is missing "(".`, "warning");
    }
  });

  return {
    tokens,
    groups,
    warnings,
    variableMap,
  };
}
