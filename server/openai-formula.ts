import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OPENAI_API_KEY is not configured. Please provide a valid OpenAI API key to use AI formula generation.');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

interface Variable {
  id: string;
  name: string;
  type: 'number' | 'select' | 'text' | 'multiple-choice' | 'dropdown';
  unit?: string;
  options?: Array<{
    id?: string;
    label: string;
    value: string | number;
    numericValue?: number;
    defaultUnselectedValue?: number;
  }>;
  defaultValue?: string | number | boolean | Array<string | number>;
  allowMultipleSelection?: boolean;
  conditionalLogic?: any;
}

export interface AIFormulaResponse {
  name: string;
  title: string;
  description: string;
  bulletPoints: string[];
  formula: string;
  variables: Variable[];
  iconUrl: string;
}

export async function refineObjectDescription(description: string, measurementType: string): Promise<string> {
  try {
    const client = getOpenAI();
    
    const systemPrompt = `You are an expert at creating precise, AI-optimized prompts for computer vision measurement systems. Your job is to transform a basic object description into a detailed, structured prompt that helps AI accurately measure objects from photos.

GOAL: Create a prompt that enables AI to:
1. Identify the specific object in photos
2. Use standard reference dimensions to estimate measurements
3. Account for perspective and scale indicators

KEY PRINCIPLES:
- Be extremely specific about the object type and its typical context
- Include average/standard dimensions when known (helps AI calibration)
- Mention common reference objects that might appear in photos (doors, windows, people, vehicles, etc.)
- Specify the measurement context (residential, commercial, indoor, outdoor)
- Include material/construction details if relevant to size
- Mention typical viewing angles for this object type

STANDARD REFERENCE DIMENSIONS TO LEVERAGE:
- Standard door: 7 feet tall, 3 feet wide
- Brick: 8 inches long, 2.5 inches tall
- Sidewalk: 5 feet wide
- Person: 5.5-6 feet tall
- Standard garage door: 7-8 feet tall
- Window: typically 3-5 feet wide
- Car: 15-16 feet long, 6 feet wide
- Ceiling height: 8-9 feet (residential), 10-12 feet (commercial)

OUTPUT FORMAT:
Return ONLY the refined description as plain text - no explanations, no extra commentary.
The refined description should be 2-4 sentences that will help AI vision models make accurate measurements.`;

    const userPrompt = `Current description: "${description}"
Measurement type needed: ${measurementType}

Refine this into a precise, AI-optimized prompt for measuring ${measurementType} from photos.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const refinedDescription = completion.choices[0]?.message?.content?.trim();
    
    if (!refinedDescription) {
      throw new Error('No response from OpenAI');
    }

    return refinedDescription;
  } catch (error) {
    console.error('OpenAI object description refinement error:', error);
    throw new Error('Failed to refine object description with OpenAI: ' + (error as Error).message);
  }
}

export async function editCustomCSS(currentCSS: string, editDescription: string): Promise<string> {
  try {
    const client = getOpenAI();
    const targetSelector = extractTargetSelector(editDescription);
    const isTargetedEdit = Boolean(targetSelector);

    const systemPrompt = isTargetedEdit
      ? `You are an expert CSS editor.

You are editing ONE target selector in an existing stylesheet.

RULES:
1. Only edit the target selector and direct state variants of it:
   :hover, :focus, :focus-visible, :active, :disabled, .selected, ::before, ::after.
2. Do not output unrelated selectors.
3. Preserve existing declarations unless the request asks to change them.
4. Add a missing state block only when needed to satisfy the request.
5. Do not include #autobidder-form prefix.
6. Return ONLY CSS code. No markdown, no explanation.
7. Keep accessible contrast when changing backgrounds.`
      : `You are an expert CSS editor for an interactive pricing calculator stylesheet.

RULES:
1. Make surgical edits only for the user's request.
2. Keep unrelated selectors, declarations, and structure intact.
3. Do not re-theme or rewrite the whole stylesheet.
4. Do not add new selector blocks unless explicitly needed by the request.
5. Return the complete updated CSS.
6. Do not include #autobidder-form prefix.
7. Return ONLY CSS code. No markdown, no explanation.
8. Keep accessible contrast when changing backgrounds.`;

    const scopedSourceCSS = targetSelector
      ? (extractRelevantTargetCSS(currentCSS, targetSelector) || `${targetSelector} {\n  /* target styles */\n}`)
      : currentCSS;

    const userPrompt = targetSelector
      ? `Target selector:
${targetSelector}

Existing CSS for this selector:
${scopedSourceCSS}

Change requested:
${editDescription}

Return only CSS rules for ${targetSelector} and direct state variants.`
      : `Current CSS:
${currentCSS}

Change requested:
${editDescription}

Please update the CSS to reflect this change while preserving all other existing styles.`;

    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 2500
    });

    const editedCSS = completion.choices[0]?.message?.content?.trim();
    
    if (!editedCSS) {
      throw new Error('No CSS generated from OpenAI');
    }

    // Remove markdown code block formatting if present
    let cleanCSS = editedCSS;
    if (cleanCSS.startsWith('```css')) {
      cleanCSS = cleanCSS.replace(/```css\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanCSS.startsWith('```')) {
      cleanCSS = cleanCSS.replace(/```\n?/g, '');
    }

    const normalizedCurrent = normalizeCSS(currentCSS);

    if (targetSelector) {
      const enforcedPatchCSS = enforceReadableContrast(cleanCSS.trim());
      const mergedTargetedCSS = mergeTargetedPatchIntoCSS(currentCSS, enforcedPatchCSS, targetSelector);
      if (normalizeCSS(mergedTargetedCSS) === normalizedCurrent) {
        return applyEditHeuristics(currentCSS, editDescription);
      }
      return mergedTargetedCSS;
    }

    const enforcedCSS = enforceReadableContrast(cleanCSS.trim());
    if (normalizeCSS(enforcedCSS) === normalizedCurrent) {
      return enforceReadableContrast(applyEditHeuristics(currentCSS, editDescription));
    }

    const heuristicPatched = applyEditHeuristics(enforcedCSS, editDescription);
    return enforceReadableContrast(heuristicPatched);
  } catch (error) {
    console.error('OpenAI CSS editing error:', error);
    throw new Error('Failed to edit CSS with OpenAI: ' + (error as Error).message);
  }
}

export async function generateCustomCSS(styleDescription: string): Promise<string> {
  try {
    const client = getOpenAI();
    
    const systemPrompt = `You are an expert CSS designer specializing in modern web form styling. Generate custom CSS based on user descriptions for an interactive pricing calculator form.

AVAILABLE CSS CLASSES TO TARGET:

FORM & CONTAINER CLASSES:
- .ab-form-container - Main form wrapper (use compound selector: #autobidder-form.ab-form-container)
- .ab-question-card - Individual question containers (wraps each input field)

SERVICE & PRICING CARDS:
- .ab-service-card - Service selection cards (can have .selected state)
- .ab-service-title - Service card titles/names
- .ab-service-accordion - Collapsible service header buttons (for multiple services)
- .ab-pricing-card - Pricing summary cards on results page (outer wrapper)
- .ab-pricing-card-price - Price badge on pricing card
- .ab-pricing-card-icon - Service icon on pricing card
- .ab-pricing-card-title - Service title on pricing card
- .ab-pricing-card-description - Service description on pricing card
- .ab-pricing-card-bullet-icon - Bullet point icons (circular backgrounds, supports different icon types: checkmark, star, circle, arrow, plus, diamond, heart)
- .ab-pricing-card-bullet-text - Bullet point text on pricing card

DISCOUNTS & MESSAGES:
- .ab-discount-section - Discount selection wrapper
- .ab-discount-title - Discount section title
- .ab-discount-subtitle - Discount helper text
- .ab-discount-grid - Discount grid
- .ab-discount-card - Discount card
- .ab-discount-name - Discount name
- .ab-discount-description - Discount description
- .ab-discount-percent - Discount percent text
- .ab-discount-applied - Applied badge
- .ab-discount-savings - Discount savings panel
- .ab-discount-savings-title - Savings title
- .ab-discount-savings-row - Savings row
- .ab-discount-savings-total - Savings total
- .ab-discount-line - Discount line item (pricing summary)
- .ab-discount-line-label - Discount line label
- .ab-discount-line-value - Discount line value
- .ab-pricing-disclaimer - Pricing disclaimer wrapper
- .ab-pricing-disclaimer-text - Pricing disclaimer text
- .ab-pricing-disclaimer-label - Pricing disclaimer label
- .ab-customer-summary - Customer summary wrapper
- .ab-customer-summary-title - Customer summary title
- .ab-customer-summary-line - Customer summary line

INPUT CLASSES:
- .ab-input - All input fields (base class for all inputs)
- .ab-number-input - Number input fields specifically
- .ab-text-input - Text input fields specifically
- .ab-textarea - Textarea elements (notes, comments, multiline text)
- .ab-select - Dropdown select trigger elements
- .ab-select-content - Dropdown menu content container
- .ab-checkbox - Checkbox inputs
- .ab-address-input - Address autocomplete inputs
- .ab-file-input - File upload inputs

SLIDER CLASSES (all slider-related elements):
- .ab-slider - Range slider input
- .ab-slider-value - Current value display (e.g., "150")
- .ab-slider-unit - Unit label (e.g., "sq ft")
- .ab-slider-min - Minimum value label
- .ab-slider-max - Maximum value label

LABEL & TEXT CLASSES:
- .ab-question-label - Question/field labels (primary label for each question)
- .ab-label - All labels (generic, including multiple choice option labels)

BUTTON CLASSES:
- .ab-button - All buttons (can have .ab-button-primary class)

MULTIPLE CHOICE:
- .ab-multiple-choice - Multiple choice option cards (can have .selected state)
- .ab-multiple-choice-label - Multiple choice option text inside cards

BOOKING CALENDAR CLASSES:
- .ab-calendar-nav - Calendar navigation buttons (prev/next month)
- .ab-calendar-nav-prev - Previous month button
- .ab-calendar-nav-next - Next month button
- .ab-calendar-month-title - Month and year title display
- .ab-calendar-day-header - Day name headers (Sun, Mon, Tue, etc.)
- .ab-calendar-date - Individual date buttons (can have .selected state)
- .ab-time-slot - Available time slot buttons

STATE & UTILITY CLASSES:
- .selected - Selected state (for cards, calendar dates, multiple choice)
- .disabled - Disabled state
- .ab-error - Error messages and validation feedback

IMPORTANT STRUCTURAL NOTES:
- Service containers (outer wrappers) are transparent by default
- Question card styles (.ab-question-card) apply to individual input field containers only
- When custom CSS is active, inline styles are removed to give CSS full control
- Both .ab-service-card and .ab-multiple-choice can have the .selected class when chosen by the user

AVAILABLE CSS VARIABLES (can use or override):
--ab-primary-color
--ab-button-bg
--ab-button-text-color
--ab-button-hover-bg
--ab-button-border-radius
--ab-input-border-color
--ab-input-border-radius
--ab-service-selector-bg
--ab-service-selector-border-color
--ab-service-selector-border-radius
--ab-service-selector-active-bg
--ab-service-selector-hover-bg
--ab-multiple-choice-border-color
--ab-multiple-choice-active-bg
--ab-multiple-choice-hover-bg
--ab-label-color
--ab-label-font-family
--ab-label-font-weight
--ab-label-font-size
--ab-service-title-color
--ab-service-title-font-family
--ab-service-title-font-weight
--ab-service-title-font-size
--ab-pricing-card-bg
--ab-pricing-card-border-radius
--ab-pricing-card-border-color
--ab-pricing-card-border-width
--ab-pricing-card-shadow
--ab-pricing-card-padding

REQUIRED COVERAGE:
Generate CSS blocks for most core selectors so the output feels complete. At minimum include blocks for:
.ab-form-container, .ab-question-card, .ab-button, .ab-button-primary,
.ab-input, .ab-text-input, .ab-number-input, .ab-textarea, .ab-select, .ab-select-content, .ab-checkbox,
.ab-service-card, .ab-service-title, .ab-service-accordion,
.ab-multiple-choice, .ab-multichoice-card,
.ab-pricing-card, .ab-pricing-card-price, .ab-pricing-card-title, .ab-pricing-card-description, .ab-pricing-card-bullet-icon, .ab-pricing-card-bullet-text,
.ab-question-label, .ab-label,
.ab-calendar-nav, .ab-calendar-date, .ab-time-slot,
.ab-discount-section, .ab-discount-card, .ab-discount-savings, .ab-discount-line,
.ab-pricing-disclaimer, .ab-customer-summary.

RULES:
1. Make the CSS clean, readable, and grouped by section (container, inputs, buttons, service cards, multiple choice, pricing, calendar, labels).
2. Favor consistent spacing, borders, and shadows across components.
3. Return ONLY CSS code, no markdown or explanations.
4. Ensure good contrast between text and backgrounds.
--ab-multiple-choice-hover-bg
--ab-label-color
--ab-label-font-family
--ab-label-font-weight
--ab-label-font-size
--ab-service-title-color
--ab-service-title-font-family
--ab-service-title-font-weight
--ab-service-title-font-size
--ab-pricing-card-bg
--ab-pricing-card-border-radius
--ab-pricing-card-border-color
--ab-pricing-card-border-width
--ab-pricing-card-shadow
--ab-pricing-card-padding

CSS SCOPING:
- All CSS will be automatically scoped to #autobidder-form, so you don't need to include that prefix
- Just write .ab-button { ... } and it will become #autobidder-form .ab-button { ... }
- You CAN use pseudo-classes like :hover, :focus, :active
- You CAN use pseudo-elements like ::before, ::after
- You CAN use @media queries for responsive design
- You CAN use @keyframes for animations
- You CAN target state classes like .selected

IMPORTANT RULES:
1. Generate complete, production-ready CSS
2. Include hover states, focus states, and transitions
3. Use modern CSS features (flexbox, grid, custom properties, etc.)
4. Make it responsive with media queries when appropriate
5. Add smooth transitions for interactive elements
6. Consider accessibility (focus indicators, contrast). If you set a background color, set a contrasting text color.
7. Return ONLY the CSS code - no explanations or markdown formatting
8. Do not include #autobidder-form prefix (it's added automatically)
9. Avoid text colors that are close to the background. Inputs and pricing cards must always be highly readable.

EXAMPLE OUTPUT (for "glassmorphism"):
.ab-service-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.ab-button {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  transition: all 0.3s ease;
}

.ab-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate custom CSS for this design style: ${styleDescription}` }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const generatedCSS = completion.choices[0]?.message?.content?.trim();
    
    if (!generatedCSS) {
      throw new Error('No CSS generated from OpenAI');
    }

    // Remove markdown code block formatting if present
    let cleanCSS = generatedCSS;
    if (cleanCSS.startsWith('```css')) {
      cleanCSS = cleanCSS.replace(/```css\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanCSS.startsWith('```')) {
      cleanCSS = cleanCSS.replace(/```\n?/g, '');
    }

    return enforceReadableContrast(cleanCSS.trim());
  } catch (error) {
    console.error('OpenAI CSS generation error:', error);
    throw new Error('Failed to generate CSS with OpenAI: ' + (error as Error).message);
  }
}

function enforceReadableContrast(css: string): string {
  const contrastTargets = [
    '.ab-input',
    '.ab-number-input',
    '.ab-text-input',
    '.ab-textarea',
    '.ab-select',
    '.ab-select-content',
    '.ab-button',
    '.ab-button-primary',
    '.ab-question-card',
    '.ab-service-card',
    '.ab-multiple-choice',
    '.ab-pricing-card',
    '.ab-pricing-card-title',
    '.ab-pricing-card-description',
    '.ab-pricing-card-price',
    '.ab-pricing-card-bullet-text',
    '.ab-label',
    '.ab-question-label',
  ];

  const scopedAtRules = ['@media', '@supports', '@container', '@layer'];
  const backgroundBySelector = new Map<string, string>();

  const parseColor = (value: string): { r: number; g: number; b: number } | null => {
    const cleaned = value.trim().toLowerCase();
    const hexMatch = cleaned.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b };
      }
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    const rgbMatch = cleaned.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(',').map(part => parseFloat(part.trim()));
      if (parts.length >= 3 && parts.every(part => Number.isFinite(part))) {
        return { r: Math.min(255, Math.max(0, parts[0])), g: Math.min(255, Math.max(0, parts[1])), b: Math.min(255, Math.max(0, parts[2])) };
      }
    }
    return null;
  };

  const luminance = (color: { r: number; g: number; b: number }): number => {
    const channel = (value: number) => {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  };

  const contrastRatio = (foreground: { r: number; g: number; b: number }, background: { r: number; g: number; b: number }) => {
    const foregroundLum = luminance(foreground);
    const backgroundLum = luminance(background);
    const lighter = Math.max(foregroundLum, backgroundLum);
    const darker = Math.min(foregroundLum, backgroundLum);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const pickTextColor = (background: { r: number; g: number; b: number }) => {
    const lightText = { r: 255, g: 255, b: 255 };
    const darkText = { r: 17, g: 24, b: 39 }; // #111827
    return contrastRatio(lightText, background) >= contrastRatio(darkText, background) ? '#FFFFFF' : '#111827';
  };

  const shouldAdjust = (selector: string) => contrastTargets.some(target => selector.includes(target));

  const updateRule = (selector: string, body: string): string => {
    if (!shouldAdjust(selector)) {
      return `${selector}{${body}}`;
    }

    const declarations = body.split(';').map(part => part.trim()).filter(Boolean);
    let backgroundValue: string | null = null;
    let colorValue: string | null = null;
    const newDeclarations: string[] = [];

    for (const declaration of declarations) {
      const [propertyRaw, ...valueParts] = declaration.split(':');
      if (!propertyRaw || valueParts.length === 0) {
        newDeclarations.push(declaration);
        continue;
      }
      const property = propertyRaw.trim().toLowerCase();
      const value = valueParts.join(':').trim();

      if (property === 'background-color' || property === 'background') {
        const parsedBackground = parseColor(value);
        if (parsedBackground) {
          backgroundValue = value;
        }
      }

      if (property === 'color') {
        colorValue = value;
      }

      newDeclarations.push(`${propertyRaw.trim()}: ${value}`);
    }

    if (!backgroundValue) {
      for (const baseSelector of ['.ab-pricing-card', '.ab-question-card', '.ab-service-card', '.ab-multiple-choice', '.ab-input']) {
        if (selector.includes(baseSelector)) {
          const stored = backgroundBySelector.get(baseSelector);
          if (stored) {
            backgroundValue = stored;
          }
          break;
        }
      }
    }

    const parsedBackground = backgroundValue ? parseColor(backgroundValue) : null;
    const parsedColor = colorValue ? parseColor(colorValue) : null;

    if (parsedBackground) {
      if (selector.includes('.ab-pricing-card')) {
        backgroundBySelector.set('.ab-pricing-card', backgroundValue!);
      } else if (selector.includes('.ab-question-card')) {
        backgroundBySelector.set('.ab-question-card', backgroundValue!);
      } else if (selector.includes('.ab-service-card')) {
        backgroundBySelector.set('.ab-service-card', backgroundValue!);
      } else if (selector.includes('.ab-multiple-choice')) {
        backgroundBySelector.set('.ab-multiple-choice', backgroundValue!);
      } else if (selector.includes('.ab-input')) {
        backgroundBySelector.set('.ab-input', backgroundValue!);
      }
    }

    if (parsedBackground) {
      const preferredColor = pickTextColor(parsedBackground);
      const shouldReplace = !parsedColor || contrastRatio(parsedColor, parsedBackground) < 4.5;
      if (shouldReplace) {
        const filtered = newDeclarations.filter(decl => !decl.toLowerCase().startsWith('color:'));
        filtered.push(`color: ${preferredColor}`);
        return `${selector}{${filtered.join('; ')}}`;
      }
    }

    return `${selector}{${newDeclarations.join('; ')}}`;
  };

  const process = (input: string): string => {
    const output: string[] = [];
    let buffer = '';
    let selectorBuffer = '';
    let braceDepth = 0;
    let insideRule = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '{') {
        if (braceDepth === 0) {
          selectorBuffer = buffer.trim();
          buffer = '';
          insideRule = true;
        } else {
          buffer += char;
        }
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0 && insideRule) {
          const selector = selectorBuffer.trim();
          if (selector.startsWith('@') && scopedAtRules.some(rule => selector.toLowerCase().startsWith(rule))) {
            output.push(`${selector}{${process(buffer)}}`);
          } else {
            output.push(updateRule(selector, buffer));
          }
          buffer = '';
          selectorBuffer = '';
          insideRule = false;
        } else {
          buffer += char;
        }
      } else {
        buffer += char;
      }
    }

    if (buffer.trim()) {
      output.push(buffer);
    }

    return output.join('');
  };

  return process(css);
}

function normalizeCSS(css: string): string {
  return css.replace(/\s+/g, ' ').trim();
}

type ParsedCSSRule = {
  selector: string;
  body: string;
  start: number;
  end: number;
  isAtRule: boolean;
};

function parseTopLevelCSSRules(css: string): ParsedCSSRule[] {
  const rules: ParsedCSSRule[] = [];
  let index = 0;

  const skipWhitespaceAndComments = () => {
    while (index < css.length) {
      if (/\s/.test(css[index])) {
        index++;
        continue;
      }
      if (css[index] === '/' && css[index + 1] === '*') {
        index += 2;
        while (index < css.length && !(css[index] === '*' && css[index + 1] === '/')) {
          index++;
        }
        if (index < css.length) {
          index += 2;
        }
        continue;
      }
      break;
    }
  };

  while (index < css.length) {
    skipWhitespaceAndComments();
    if (index >= css.length) break;

    const selectorStart = index;
    let selectorEnd = -1;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inComment = false;

    for (; index < css.length; index++) {
      const char = css[index];
      const next = css[index + 1];

      if (inComment) {
        if (char === '*' && next === '/') {
          inComment = false;
          index++;
        }
        continue;
      }

      if (inSingleQuote) {
        if (char === '\\') {
          index++;
          continue;
        }
        if (char === "'") {
          inSingleQuote = false;
        }
        continue;
      }

      if (inDoubleQuote) {
        if (char === '\\') {
          index++;
          continue;
        }
        if (char === '"') {
          inDoubleQuote = false;
        }
        continue;
      }

      if (char === '/' && next === '*') {
        inComment = true;
        index++;
        continue;
      }

      if (char === "'") {
        inSingleQuote = true;
        continue;
      }

      if (char === '"') {
        inDoubleQuote = true;
        continue;
      }

      if (char === '{') {
        selectorEnd = index;
        break;
      }
    }

    if (selectorEnd === -1) break;

    const selector = css.slice(selectorStart, selectorEnd).trim();
    index = selectorEnd + 1;
    const bodyStart = index;
    let depth = 1;
    inSingleQuote = false;
    inDoubleQuote = false;
    inComment = false;

    for (; index < css.length; index++) {
      const char = css[index];
      const next = css[index + 1];

      if (inComment) {
        if (char === '*' && next === '/') {
          inComment = false;
          index++;
        }
        continue;
      }

      if (inSingleQuote) {
        if (char === '\\') {
          index++;
          continue;
        }
        if (char === "'") {
          inSingleQuote = false;
        }
        continue;
      }

      if (inDoubleQuote) {
        if (char === '\\') {
          index++;
          continue;
        }
        if (char === '"') {
          inDoubleQuote = false;
        }
        continue;
      }

      if (char === '/' && next === '*') {
        inComment = true;
        index++;
        continue;
      }

      if (char === "'") {
        inSingleQuote = true;
        continue;
      }

      if (char === '"') {
        inDoubleQuote = true;
        continue;
      }

      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          break;
        }
      }
    }

    if (depth !== 0) break;

    const ruleEnd = index + 1;
    const body = css.slice(bodyStart, index).trim();

    if (selector) {
      rules.push({
        selector,
        body,
        start: selectorStart,
        end: ruleEnd,
        isAtRule: selector.startsWith('@'),
      });
    }

    index = ruleEnd;
  }

  return rules;
}

function normalizeSelector(selector: string): string {
  return selector.replace(/\s+/g, ' ').trim();
}

function splitSelectorList(selectorText: string): string[] {
  return selectorText
    .split(',')
    .map(selector => normalizeSelector(selector))
    .filter(Boolean);
}

function extractTargetSelector(description: string): string | null {
  const explicitMatch = description.match(/^\s*Target selector:\s*([^\n]+)\s*$/im);
  if (explicitMatch?.[1]?.trim()) {
    return explicitMatch[1].trim();
  }

  // Fallback: if the user references a specific `.ab-*` selector inline, treat it as targeted.
  const inlineSelectorMatch = description.match(/(^|[\s,(])(\.ab-[a-z0-9_-]+)/i);
  return inlineSelectorMatch?.[2]?.trim() || null;
}

function selectorStartsWithTarget(selector: string, targetSelector: string): boolean {
  const normalizedSelector = normalizeSelector(selector);
  const normalizedTarget = normalizeSelector(targetSelector);
  if (!normalizedSelector || !normalizedTarget) return false;

  const prefixedTarget = normalizeSelector(`#autobidder-form ${normalizedTarget}`);
  const candidates = [normalizedTarget, prefixedTarget];
  const boundaryChars = [' ', ':', '.', '[', '>', '+', '~'];

  return candidates.some(candidate => {
    if (!normalizedSelector.startsWith(candidate)) {
      return false;
    }
    const nextChar = normalizedSelector.charAt(candidate.length);
    return nextChar === '' || boundaryChars.includes(nextChar);
  });
}

function ruleIsAllowedForTarget(selectorText: string, targetSelector: string): boolean {
  const selectors = splitSelectorList(selectorText);
  if (!selectors.length) return false;
  return selectors.every(selector => selectorStartsWithTarget(selector, targetSelector));
}

function extractRelevantTargetCSS(css: string, targetSelector: string): string {
  if (!css.trim()) return '';

  const relevantRules = parseTopLevelCSSRules(css).filter(
    rule => !rule.isAtRule && ruleIsAllowedForTarget(rule.selector, targetSelector)
  );

  if (!relevantRules.length) return '';

  return relevantRules.map(rule => `${rule.selector}{${rule.body}}`).join('\n\n');
}

function upsertTopLevelRule(css: string, selector: string, body: string): string {
  const normalizedSelector = normalizeSelector(selector);
  const rules = parseTopLevelCSSRules(css);
  const existingRule = rules.find(
    rule => !rule.isAtRule && normalizeSelector(rule.selector) === normalizedSelector
  );
  const replacement = `${selector}{${body}}`;

  if (existingRule) {
    return `${css.slice(0, existingRule.start)}${replacement}${css.slice(existingRule.end)}`;
  }

  return css.trim()
    ? `${css.trimEnd()}\n\n${replacement}`
    : replacement;
}

function mergeTargetedPatchIntoCSS(currentCSS: string, patchCSS: string, targetSelector: string): string {
  if (!patchCSS.trim()) return currentCSS;

  const allowedRules = parseTopLevelCSSRules(patchCSS).filter(
    rule => !rule.isAtRule && ruleIsAllowedForTarget(rule.selector, targetSelector)
  );

  if (!allowedRules.length) {
    return currentCSS;
  }

  let mergedCSS = currentCSS;
  for (const rule of allowedRules) {
    mergedCSS = upsertTopLevelRule(mergedCSS, rule.selector, rule.body);
  }

  return mergedCSS;
}

function applyEditHeuristics(css: string, description: string): string {
  const lowered = description.toLowerCase();
  const color = extractColorFromDescription(description);
  if (!color) return css;

  let updated = css.trim();

  const ensureRule = (rule: string) => {
    if (!updated) {
      updated = rule.trim();
      return;
    }
    updated = `${updated}\n\n${rule.trim()}`;
  };

  if (lowered.includes('button') && lowered.includes('hover')) {
    const textColor = color.toLowerCase() === '#000000' ? '#FFFFFF' : '#111827';
    if (!updated.includes('.ab-button:hover')) {
      ensureRule(`
.ab-button:hover {
  background-color: ${color};
  border-color: ${color};
  color: ${textColor};
}
      `);
    }
  }

  const isPricingCheckbox = lowered.includes('pricing') && lowered.includes('card') && lowered.includes('checkbox');
  const isPricingBullet = lowered.includes('pricing') && lowered.includes('card') && lowered.includes('bullet');
  if (isPricingCheckbox || isPricingBullet) {
    if (!updated.includes('.ab-pricing-card-bullet-icon')) {
      ensureRule(`
.ab-pricing-card-bullet-icon {
  background-color: ${color};
}
      `);
    }
  }

  if (lowered.includes('checkbox') && !isPricingCheckbox) {
    if (!updated.includes('.ab-checkbox')) {
      ensureRule(`
.ab-checkbox {
  accent-color: ${color};
  border-color: ${color};
}
      `);
    }
  }

  return updated;
}

function extractColorFromDescription(description: string): string | null {
  const hexMatch = description.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hexMatch) {
    return `#${hexMatch[1].toUpperCase()}`;
  }

  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    blue: '#2563EB',
    red: '#DC2626',
    green: '#16A34A',
    purple: '#7C3AED',
    orange: '#F97316',
    yellow: '#F59E0B',
    gray: '#6B7280',
    grey: '#6B7280',
  };

  const lowered = description.toLowerCase();
  for (const [name, value] of Object.entries(colorMap)) {
    if (lowered.includes(name)) {
      return value;
    }
  }

  return null;
}

export async function generateFormula(description: string): Promise<AIFormulaResponse> {
  try {
    const client = getOpenAI();
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const systemPrompt = `You are an expert contractor pricing consultant. Create a comprehensive pricing calculator based on the user's description.

IMPORTANT RULES:
1. Variable IDs must be camelCase (e.g., "squareFootage", "materialType", "laborHours")
2. Formula must use ONLY variable IDs (not variable names)
3. Every variable in "variables" must appear at least once in the formula (use variableId or variableId_optionId)
4. Use realistic contractor pricing (research actual market rates)
5. Include 3-8 relevant variables that affect pricing
6. Use appropriate units (sq ft, linear ft, hours, etc.)
7. EVERY dropdown/multiple-choice option MUST have a numericValue field - this is the number used in the formula
8. Create compelling service descriptions and 4-6 bullet points highlighting key benefits
9. Provide a relevant emoji icon (e.g., 🏠, 🔧, 🎨)

*** CRITICAL FORMULA REQUIREMENT ***
The formula field MUST be simple arithmetic using ONLY:
- Addition (+) and multiplication (*)
- Variable IDs (which get replaced with numbers)

FORBIDDEN in formulas (will cause errors):
- NO parentheses: ( )
- NO ternary operators: ? :
- NO comparison operators: === == !== != > < >= <=
- NO division: /
- NO subtraction: -
- NO string comparisons
- NO boolean logic

CORRECT formula: "squareFootage * 4 + gutterType + storyCount * 25 + basePrice"
WRONG formula: "(squareFootage * rate) + (gutterType === 'premium' ? 50 : 0)"

Each variable's numericValue IS the pricing - the formula just combines them.

CRITICAL: PRIORITIZE THESE INPUT TYPES (IN ORDER OF PREFERENCE)
- MOST PREFERRED: number inputs (for measurements, quantities, counts - these are essential for accurate pricing)
- SECOND CHOICE: multiple-choice (with images - perfect for visual selections like materials, styles, features)
- THIRD CHOICE: dropdown (for lists without images - quality levels, service tiers, complexity)
- DO NOT USE: checkbox inputs (they don't work well in this system)

NUMBER INPUT GUIDELINES (USE FREQUENTLY):
- Use number inputs for: square footage, linear footage, room counts, quantities, hours, dimensions
- Perfect for: area measurements, perimeter lengths, number of items, labor hours, room counts
- Examples: "Square Footage", "Number of Windows", "Linear Feet of Fencing", "Number of Rooms"
- Number inputs provide the most accurate pricing calculations

MULTIPLE-CHOICE INPUT GUIDELINES (USE FREQUENTLY):
- Use multiple-choice for: material selections, style choices, finish options, service packages, feature bundles
- Perfect for: siding types, flooring materials, paint finishes, roofing materials, landscaping styles, fencing materials
- Examples: "Brick vs Vinyl vs Wood siding", "Modern vs Traditional vs Rustic style", "Standard vs Premium vs Luxury package"
- ALWAYS use multiple-choice instead of dropdown for: materials, styles, finishes, design options, service tiers
- Multiple-choice displays beautifully with images - much better user experience than dropdowns

DROPDOWN GUIDELINES (USE MODERATELY):
- Use for: quality tiers, size categories, time frames, complexity levels when there are many options
- Examples: "Basic/Standard/Premium quality", "Small/Medium/Large project", "1-3 days/1 week/2+ weeks"

IMPORTANT: Do NOT use checkbox inputs. Convert any yes/no options to multiple-choice with "Yes"/"No" options instead.

CONDITIONAL QUESTIONS (SMART FOLLOW-UPS):
- Use conditional logic to show/hide questions based on previous answers
- Perfect for: follow-up details, size specifications, optional features
- Examples: "Property Type" → if "Residential" → "Number of Stories"
- MODERN FORMAT (preferred - supports multiple conditions):
  {
    "conditionalLogic": {
      "enabled": true,
      "operator": "AND", // OPTIONAL: "AND" (default) or "OR" for combining multiple conditions
      "conditions": [ // array of conditions - each needs unique id
        {
          "id": "cond-1", // REQUIRED: unique string ID for this condition
          "dependsOnVariable": "hasGarage", // REQUIRED: ID of the variable to check
          "condition": "equals", // REQUIRED: equals|not_equals|greater_than|less_than|contains|is_empty|is_not_empty
          "expectedValue": true // OPTIONAL: single value (for equals, not_equals, greater_than, less_than)
          // OR "expectedValues": ["value1", "value2"] // OPTIONAL: array (for contains operator)
        }
      ],
      "defaultValue": "" // OPTIONAL: value when hidden (can be string, number, boolean, or array)
    }
  }
- Supported operators (for condition field):
  * equals - variable equals expectedValue
  * not_equals - variable does not equal expectedValue
  * greater_than - variable > expectedValue (numeric comparison)
  * less_than - variable < expectedValue (numeric comparison)
  * contains - variable contains any value from expectedValues array
  * is_empty - variable is empty/null (no expectedValue needed)
  * is_not_empty - variable has a value (no expectedValue needed)
- Multiple conditions example (OR logic):
  {
    "conditionalLogic": {
      "enabled": true,
      "operator": "OR",
      "conditions": [
        {"id": "c1", "dependsOnVariable": "propertyType", "condition": "equals", "expectedValue": "commercial"},
        {"id": "c2", "dependsOnVariable": "projectSize", "condition": "greater_than", "expectedValue": 5000}
      ]
    }
  }
- Contains operator example (checking multiple values):
  {
    "conditionalLogic": {
      "enabled": true,
      "conditions": [
        {
          "id": "c1", 
          "dependsOnVariable": "materialType", 
          "condition": "contains", 
          "expectedValues": ["premium", "luxury"]
        }
      ]
    }
  }
- LEGACY FORMAT (still supported - for single condition only):
  {
    "conditionalLogic": {
      "enabled": true,
      "dependsOnVariable": "hasGarage", // REQUIRED: ID of variable to check
      "condition": "equals", // REQUIRED: operator to use
      "expectedValue": true, // OPTIONAL: single value to compare
      // OR "expectedValues": ["val1", "val2"], // OPTIONAL: array for contains
      "defaultValue": "" // OPTIONAL: value when hidden
    }
  }
  Note: Legacy format supports only ONE condition. Use modern format for multiple conditions.
- Common patterns:
  * Property type → specific measurements for that type
  * Service tier → additional customization options
  * Multiple choice → follow-up for specific selections
  * Material selection → related options for that material

RESPONSE FORMAT: JSON with these exact fields:
{
  "name": "Service Name",
  "title": "Customer-facing calculator title",
  "description": "2-3 sentence description of the service",
  "bulletPoints": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
  "formula": "SIMPLE formula with + and * ONLY",
  "variables": [array of variable objects],
  "iconUrl": "https://icon-url-or-emoji"
}

CRITICAL FORMULA RULES (MUST FOLLOW):
- Formula MUST use ONLY + (addition) and * (multiplication)
- NEVER use: parentheses (), ternary operators (? :), === or ==, division /, subtraction -
- All dropdown/multiple-choice options MUST have numericValue that gets used directly in the formula
- GOOD formula example: "squareFootage * 3 + gutterType + difficultyLevel + basePrice"
- BAD formula (NEVER DO THIS): "(squareFootage * rate) + (type === 'premium' ? 100 : 0)"
- The formula is evaluated by replacing variable IDs with their numericValue, then computing the math

VARIABLE STRUCTURE:
{
  "id": "camelCaseId",
  "name": "Display Name",
  "type": "number|multiple-choice|dropdown|select",
  "unit": "optional unit",
  "allowMultipleSelection": true, // OPTIONAL for multiple-choice when options can be toggled independently
  "options": [{"id": "option_id", "label": "Option", "value": "value", "numericValue": 123, "defaultUnselectedValue": 0}],
  "defaultValue": "optional default",
  "conditionalLogic": { // OPTIONAL - add when question should show/hide based on other answers
    "enabled": true,
    "operator": "AND",
    "conditions": [{
      "id": "cond-1",
      "dependsOnVariable": "otherVariableId",
      "condition": "equals",
      "expectedValue": "someValue"
    }],
    "defaultValue": 0
  }
}

Create realistic pricing that reflects actual market rates for contractors.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Create a pricing calculator for: ${description}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);
    
    // Validate the response structure
    if (!result.name || !result.title || !result.formula || !Array.isArray(result.variables)) {
      throw new Error('Invalid AI response structure');
    }

    // Ensure required fields have defaults
    result.description = result.description || '';
    result.bulletPoints = Array.isArray(result.bulletPoints) ? result.bulletPoints : [];
    result.iconUrl = result.iconUrl || '';

    return result as AIFormulaResponse;
  } catch (error) {
    console.error('AI formula generation error:', error);
    throw new Error('Failed to generate formula with AI: ' + (error as Error).message);
  }
}

export async function editFormula(
  currentFormula: AIFormulaResponse,
  editInstructions: string
): Promise<AIFormulaResponse> {
  try {
    const client = getOpenAI();

    const systemPrompt = `You are an expert contractor pricing consultant. Edit an existing pricing calculator based on the user's instructions.

IMPORTANT RULES:
1. Variable IDs must be camelCase (e.g., "squareFootage", "materialType", "laborHours")
2. Formula must use ONLY variable IDs (not variable names)
3. Every variable in "variables" must appear at least once in the formula (use variableId or variableId_optionId)
4. Use realistic contractor pricing
5. Use simple arithmetic formulas with + and * only
6. Preserve unchanged parts of the current calculator unless user asks otherwise
7. For multi-select multiple-choice variables, use:
   - "allowMultipleSelection": true
   - option-level IDs in options[].id (snake_case)
   - formula references like variableId_optionId when needed
8. Every dropdown/multiple-choice option must include numericValue
9. If multi-select options are used in multiplication, include defaultUnselectedValue: 1 for those options

RESPONSE FORMAT: Return valid JSON with these fields:
{
  "name": "Service Name",
  "title": "Customer-facing calculator title",
  "description": "2-3 sentence description",
  "bulletPoints": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
  "formula": "simple_formula_using_ids",
  "variables": [
    {
      "id": "camelCaseId",
      "name": "Display Name",
      "type": "number|multiple-choice|dropdown|select",
      "unit": "optional unit",
      "allowMultipleSelection": true,
      "options": [
        {
          "id": "option_id",
          "label": "Option",
          "value": "option_value",
          "numericValue": 123,
          "defaultUnselectedValue": 0
        }
      ],
      "defaultValue": "optional default",
      "conditionalLogic": {
        "enabled": true
      }
    }
  ],
  "iconUrl": "emoji_or_url"
}`;

    const currentFormulaJson = JSON.stringify(currentFormula, null, 2);
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Current Formula:\n${currentFormulaJson}\n\nEdit Instructions:\n${editInstructions}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);
    if (!result.name || !result.title || !result.formula || !Array.isArray(result.variables)) {
      throw new Error('Invalid AI response structure');
    }

    result.description = result.description || '';
    result.bulletPoints = Array.isArray(result.bulletPoints) ? result.bulletPoints : [];
    result.iconUrl = result.iconUrl || '';

    return result as AIFormulaResponse;
  } catch (error) {
    console.error('AI formula edit error:', error);
    throw new Error('Failed to edit formula with AI: ' + (error as Error).message);
  }
}

// Function to search for relevant icons using a simple mapping
export function getServiceIcon(serviceName: string): string {
  const iconMap: Record<string, string> = {
    // Cleaning services
    'clean': '🧽',
    'wash': '💧',
    'pressure': '💨',
    'roof': '🏠',
    'gutter': '🏠',
    'window': '🪟',
    'patio': '🏡',
    'driveway': '🛣️',
    'pool': '🏊',
    'sidewalk': '🚶',
    
    // Construction services
    'kitchen': '🍳',
    'bathroom': '🛁',
    'remodel': '🔨',
    'renovation': '🏗️',
    'paint': '🎨',
    'deck': '🏡',
    'landscape': '🌿',
    'roofing': '🏠',
    'hvac': '❄️',
    'floor': '🪵',
    'electrical': '⚡',
    'plumbing': '🔧',
    
    // Default fallbacks
    'service': '🔧',
    'repair': '🔧',
    'install': '🔧',
    'maintenance': '⚙️',
  };

  const serviceLower = serviceName.toLowerCase();
  
  // Find matching icon based on keywords
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (serviceLower.includes(keyword)) {
      return icon;
    }
  }
  
  // Default service icon
  return '🔧';
}
