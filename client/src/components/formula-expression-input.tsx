import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, Decoration, ViewPlugin, type ViewUpdate, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import type { Variable } from "@shared/schema";
import { AlertTriangle, Eye, FileCode2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildFormulaGuide,
  type FormulaGuideResult,
  type FormulaGuideToken,
  type FormulaVariableReference,
} from "@/lib/formula-visual-guide";

interface FormulaExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  variables: Variable[];
  placeholder?: string;
  className?: string;
}

type EditorMode = "raw" | "guide";

const PAREN_TONES = [
  "border-stone-200 bg-stone-100/90 text-stone-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-200",
  "border-amber-200 bg-amber-100/90 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  "border-sky-200 bg-sky-100/90 text-sky-800 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-200",
  "border-emerald-200 bg-emerald-100/90 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
  "border-rose-200 bg-rose-100/90 text-rose-800 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-200",
];

function createVariableHighlightExtension(variables: Variable[]) {
  const variableMark = Decoration.mark({ class: "formula-cm-variable" });

  const buildDecorations = (expression: string) => {
    const builder = new RangeSetBuilder<Decoration>();
    const guide = buildFormulaGuide(expression, variables);

    guide.tokens.forEach((token) => {
      if (token.kind === "variable") {
        builder.add(token.start, token.end, variableMark);
      }
    });

    return builder.finish();
  };

  return ViewPlugin.fromClass(class {
    decorations;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view.state.doc.toString());
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.decorations = buildDecorations(update.state.doc.toString());
      }
    }
  }, {
    decorations: (plugin) => plugin.decorations,
  });
}

const formulaEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "0.875rem",
  },
  ".cm-scroller": {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    lineHeight: "1.6",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "0.75rem",
    caretColor: "#292524",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
  ".cm-line": {
    padding: 0,
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(251, 191, 36, 0.28) !important",
  },
  "&.cm-focused": {
    outline: "none",
  },
  "&.cm-editor": {
    minHeight: "180px",
  },
});

export default function FormulaExpressionInput({
  value,
  onChange,
  variables,
  placeholder = "e.g., squareFootage * 25 + laborHours * 85",
  className = "",
}: FormulaExpressionInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<EditorMode>("raw");
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  const [hoveredParenPairId, setHoveredParenPairId] = useState<string | null>(null);

  const guide = buildFormulaGuide(value, variables);

  const editorExtensions = useMemo(() => ([
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorState.allowMultipleSelections.of(true),
    EditorView.lineWrapping,
    cmPlaceholder(placeholder),
    formulaEditorTheme,
    createVariableHighlightExtension(variables),
  ]), [placeholder, variables]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-[20px] border border-stone-200/80 bg-gradient-to-br from-white via-white to-amber-50/50 p-3 shadow-[0_24px_80px_-48px_rgba(120,53,15,0.45)] sm:rounded-[24px] sm:p-4 dark:border-stone-700/80 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Formula Expression Editor
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Raw mode is now a real editor with wrapped syntax coloring. Visual Guide keeps the structural preview without changing the stored formula.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 rounded-[18px] border border-stone-200 bg-white/90 p-1 shadow-sm md:inline-flex md:w-auto md:rounded-full dark:border-stone-700 dark:bg-stone-900/80">
            <button
              type="button"
              onClick={() => setMode("raw")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-xs font-semibold transition-colors md:rounded-full md:py-1.5",
                mode === "raw"
                  ? "bg-stone-900 text-white dark:bg-amber-300 dark:text-stone-950"
                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
              )}
              aria-pressed={mode === "raw"}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              Raw
            </button>
            <button
              type="button"
              onClick={() => setMode("guide")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-xs font-semibold transition-colors md:rounded-full md:py-1.5",
                mode === "guide"
                  ? "bg-stone-900 text-white dark:bg-amber-300 dark:text-stone-950"
                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
              )}
              aria-pressed={mode === "guide"}
            >
              <Eye className="h-3.5 w-3.5" />
              Visual Guide
            </button>
          </div>
        </div>

        {mode === "guide" && (
          <div className="mb-3 rounded-2xl border border-stone-200/80 bg-stone-50/80 px-3 py-2 md:hidden dark:border-stone-700 dark:bg-stone-900/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Mobile Guide Mode
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  The raw editor is hidden below to keep the guide readable on smaller screens.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode("raw")}
                className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Edit Raw
              </button>
            </div>
          </div>
        )}

        <div className={cn(mode === "guide" ? "hidden md:block" : "block")}>
          <div
            className={cn(
              "formula-codemirror rounded-[16px] border bg-white/90 sm:rounded-[18px] dark:bg-stone-900/90",
              isFocused
                ? "border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]"
                : "border-stone-300/80 dark:border-stone-700",
            )}
          >
            <CodeMirror
              value={value}
              height="auto"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: true,
                indentOnInput: false,
              }}
              extensions={editorExtensions}
              onChange={(nextValue) => onChange(nextValue)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        </div>

        {mode === "guide" && (
          <FormulaVisualGuide
            guide={guide}
            expression={value}
            selectedVariableId={selectedVariableId}
            onSelectVariable={setSelectedVariableId}
            hoveredParenPairId={hoveredParenPairId}
            onHoverParen={setHoveredParenPairId}
          />
        )}
      </div>
    </div>
  );
}

function FormulaVisualGuide({
  guide,
  expression,
  selectedVariableId,
  onSelectVariable,
  hoveredParenPairId,
  onHoverParen,
}: {
  guide: FormulaGuideResult;
  expression: string;
  selectedVariableId: string | null;
  onSelectVariable: (value: string | null) => void;
  hoveredParenPairId: string | null;
  onHoverParen: (value: string | null) => void;
}) {
  const errorCount = guide.warnings.filter((warning) => warning.severity === "error").length;
  const warningCount = guide.warnings.length - errorCount;
  const selectedCount = selectedVariableId
    ? guide.tokens.filter((token) => token.variableId === selectedVariableId).length
    : 0;

  return (
    <div className="mt-4 rounded-[18px] border border-stone-200/80 bg-stone-950/[0.02] p-3 sm:rounded-[22px] sm:p-4 dark:border-stone-700/80 dark:bg-white/[0.03]">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 dark:text-stone-200">
            <Eye className="h-3.5 w-3.5" />
            Live Visual Guide
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Top-level addition groups are split into separate cards, multiplication renders as ×, and variable references stay tied to the raw source expression.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {guide.groups.length || 0} additive group{guide.groups.length === 1 ? "" : "s"}
          </span>
          {selectedVariableId && (
            <button
              type="button"
              onClick={() => onSelectVariable(null)}
              className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/60"
            >
              {selectedCount} instance{selectedCount === 1 ? "" : "s"} of {selectedVariableId}
            </button>
          )}
          {guide.warnings.length > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {errorCount > 0 ? `${errorCount} error${errorCount === 1 ? "" : "s"}` : null}
              {errorCount > 0 && warningCount > 0 ? " • " : null}
              {warningCount > 0 ? `${warningCount} warning${warningCount === 1 ? "" : "s"}` : null}
            </span>
          )}
        </div>
      </div>

      {guide.warnings.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-3 dark:border-amber-900/70 dark:bg-amber-950/30">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Guide Warnings
          </div>
          <div className="space-y-2">
            {guide.warnings.map((warning) => (
              <div
                key={warning.id}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm",
                  warning.severity === "error"
                    ? "border-rose-200 bg-white text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/20 dark:text-rose-200"
                    : "border-amber-200 bg-white text-amber-800 dark:border-amber-900/70 dark:bg-stone-900/40 dark:text-amber-200",
                )}
              >
                {warning.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {expression.trim() ? (
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start">
          {guide.groups.map((group, index) => (
            <div key={group.id} className="contents">
              {index > 0 && (
                <div className="flex justify-center md:min-h-[96px] md:items-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-base font-semibold text-amber-700 shadow-sm md:h-9 md:w-9 md:text-lg dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    +
                  </span>
                </div>
              )}
              <div className="w-full min-w-0 flex-1 rounded-[18px] border border-stone-200 bg-white/90 p-3 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] sm:rounded-[20px] sm:p-4 md:min-w-[240px] dark:border-stone-700 dark:bg-stone-900/80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Group {index + 1}
                  </span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {group.tokens.filter((token) => token.kind === "variable").length} variable
                    {group.tokens.filter((token) => token.kind === "variable").length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {group.tokens.map((token) => (
                    <GuideTokenPill
                      key={token.id}
                      token={token}
                      variableReference={token.variableId ? guide.variableMap.get(token.variableId) : undefined}
                      selected={token.variableId ? token.variableId === selectedVariableId : token.pairId === hoveredParenPairId}
                      onSelectVariable={onSelectVariable}
                      onHoverParen={onHoverParen}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300/80 bg-white/70 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-400">
          Start typing a formula to see the structural guide.
        </div>
      )}
    </div>
  );
}

function GuideTokenPill({
  token,
  variableReference,
  selected,
  onSelectVariable,
  onHoverParen,
}: {
  token: FormulaGuideToken;
  variableReference?: FormulaVariableReference;
  selected: boolean;
  onSelectVariable: (value: string | null) => void;
  onHoverParen: (value: string | null) => void;
}) {
  if (token.kind === "operator") {
    return (
      <span className="text-lg font-semibold text-stone-500 dark:text-stone-300">
        {token.display}
      </span>
    );
  }

  if (token.kind === "paren") {
    const tone = PAREN_TONES[token.depth % PAREN_TONES.length];
    return (
      <span
        onMouseEnter={() => onHoverParen(token.pairId ?? null)}
        onMouseLeave={() => onHoverParen(null)}
        className={cn(
          "inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full border px-3 text-sm font-semibold transition-transform",
          tone,
          selected && "scale-105 ring-2 ring-amber-300/70 dark:ring-amber-600/60",
        )}
      >
        {token.display}
      </span>
    );
  }

  if (token.kind === "number") {
    return (
      <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-sm font-medium text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200">
        {token.display}
      </span>
    );
  }

  if (token.kind === "variable" && variableReference) {
    return (
      <button
        type="button"
        onClick={() => onSelectVariable(selected ? null : variableReference.id)}
        className={cn(
          "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all",
          selected
            ? "border-blue-400 bg-blue-50 shadow-sm dark:border-blue-400/70 dark:bg-blue-500/10"
            : "border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900/70 dark:bg-stone-950/50 dark:hover:border-blue-700",
        )}
      >
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-200">{token.display}</span>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {variableReference.label}
        </span>
      </button>
    );
  }

  return (
    <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-950/50 dark:text-stone-300">
      {token.display}
    </span>
  );
}
