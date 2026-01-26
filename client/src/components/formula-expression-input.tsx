import { useRef, useState } from "react";

interface FormulaExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  variables: Array<{ id: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export default function FormulaExpressionInput({
  value,
  onChange,
  variables,
  placeholder = "e.g., squareFootage * 25 + laborHours * 85",
  className = "",
}: FormulaExpressionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync scroll between textarea and highlight overlay
  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Build regex pattern from variable IDs
  const getHighlightedHtml = (text: string): string => {
    if (!text || variables.length === 0) {
      return escapeHtml(text) || '<span class="text-gray-400">' + escapeHtml(placeholder) + '</span>';
    }

    // Get all variable IDs, including multi-select option IDs
    const allVariableIds: string[] = [];
    variables.forEach((variable: any) => {
      // Add base variable ID
      allVariableIds.push(variable.id);

      // For multi-select variables, also add individual option IDs
      if (variable.type === 'multiple-choice' && variable.allowMultipleSelection && variable.options) {
        variable.options.forEach((option: any, optIndex: number) => {
          const optionId = option.id || option.value || `option_${optIndex}`;
          allVariableIds.push(`${variable.id}_${optionId}`);
        });
      }
    });

    // Sort by length (longest first) to avoid partial matches
    const sortedIds = allVariableIds.sort((a, b) => b.length - a.length);

    // Create a regex pattern that matches any variable ID as a whole word
    const pattern = new RegExp(
      `\\b(${sortedIds.map(escapeRegex).join('|')})\\b`,
      'g'
    );

    // Replace variable names with highlighted spans
    const highlighted = escapeHtml(text).replace(pattern, (match) => {
      // Check if it's a valid variable
      const isValid = allVariableIds.includes(match);
      if (isValid) {
        return `<span class="text-blue-600 dark:text-blue-400">${match}</span>`;
      }
      return match;
    });

    return highlighted;
  };

  // Escape HTML special characters
  const escapeHtml = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  };

  // Escape regex special characters
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Highlighted overlay - positioned behind the textarea */}
      <div
        ref={highlightRef}
        className="absolute inset-0 p-3 text-sm font-mono whitespace-pre-wrap break-words overflow-hidden pointer-events-none text-gray-900 dark:text-gray-100 border border-transparent rounded-md"
        style={{
          wordBreak: 'break-word',
          lineHeight: '1.5',
        }}
        dangerouslySetInnerHTML={{ __html: getHighlightedHtml(value) }}
        aria-hidden="true"
      />

      {/* Actual textarea - transparent text but handles input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=""
        className={`
          relative w-full min-h-[80px] p-3
          border rounded-md text-sm font-mono resize-y
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isFocused ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}
          bg-transparent
          text-transparent caret-gray-900 dark:caret-gray-100
          selection:bg-blue-200 dark:selection:bg-blue-800
        `}
        style={{
          WebkitTextFillColor: 'transparent',
          lineHeight: '1.5',
        }}
        id="formula-expression"
      />

      {/* Background layer for proper styling */}
      <div
        className="absolute inset-0 -z-10 bg-white dark:bg-gray-700 rounded-md"
        aria-hidden="true"
      />
    </div>
  );
}
