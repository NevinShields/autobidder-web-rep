import Anthropic from "@anthropic-ai/sdk";
import { buildFormulaEditContext } from "./formula-ai-context";

let claude: Anthropic | null = null;

function getClaude(): Anthropic {
  if (!claude) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please provide a valid Anthropic API key to use Claude AI formula generation.');
    }
    claude = new Anthropic({ apiKey });
  }
  return claude;
}

interface RepeatableConfig {
  countSourceMode?: 'variable' | 'fixed';
  countVariableId?: string;
  fixedCount?: number;
  minInstances?: number;
  maxInstances?: number;
  itemLabelTemplate?: string;
  instanceFormula?: string;
  childVariables?: Variable[];
}

interface Variable {
  id: string;
  name: string;
  type: 'number' | 'select' | 'text' | 'multiple-choice' | 'dropdown' | 'repeatable-group';
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
  repeatableConfig?: RepeatableConfig;
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

type AIFormulaEditMode = 'targeted' | 'rebuild';

interface AIFormulaEditPatch {
  name?: string;
  title?: string;
  description?: string;
  bulletPoints?: string[];
  formula?: string;
  iconUrl?: string;
  variableOperations?: Array<
    | { type: 'add'; variable: Variable; afterVariableId?: string }
    | { type: 'replace'; variableId: string; variable: Variable }
    | { type: 'delete'; variableId: string }
  >;
}

export async function generateFormula(description: string): Promise<AIFormulaResponse> {
  try {
    const client = getClaude();
    const systemPrompt = `You are an expert contractor pricing consultant. Create a comprehensive pricing calculator based on the user's description.

IMPORTANT RULES:
1. Variable IDs must be camelCase (e.g., "squareFootage", "materialType", "laborHours")
2. Formula must use ONLY variable IDs (not variable names)
3. Every top-level variable in "variables" must appear at least once in the main formula. Exception: childVariables inside a repeatable-group must appear in repeatableConfig.instanceFormula, while the repeatable-group variable ID itself must appear in the main formula.
4. Use realistic contractor pricing (research actual market rates)
5. Include 3-8 relevant variables that affect pricing
6. Use short units (max 15 chars): sq ft, linear ft, hours, lbs, etc.
7. EVERY dropdown/multiple-choice option MUST have a numericValue field - this is the number used in the formula
8. Create compelling service descriptions and 4-6 bullet points highlighting key benefits
9. Provide a relevant emoji icon (e.g., 🏠, 🔧, 🎨)
10. When pricing repeated items like trees, windows, rooms, fixtures, fence panels, or posts, you may use a repeatable-group variable

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

REPEATABLE GROUP GUIDELINES:
- Use a "repeatable-group" variable when the service prices multiple similar items and each item needs the same sub-questions
- A repeatable group needs a top-level count question such as "numberOfTrees" or a fixed count
- Put the per-item questions inside "repeatableConfig.childVariables"
- Put the per-item pricing logic inside "repeatableConfig.instanceFormula"
- The repeatable-group variable ID is an aggregate token for the main formula. It already equals the SUM of all repeated item totals.
- Do NOT multiply a repeatable-group token by its count variable again in the main formula
- Good pattern:
  * top-level variable: "numberOfTrees"
  * repeatable-group variable: "treeDetails"
  * repeatableConfig.instanceFormula: "treeHeight * 20 + treeDiameter * 150"
  * main formula: "treeDetails + haulAway"

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

Response format (JSON):
{
  "name": "Service Name",
  "title": "Customer-facing calculator title",
  "description": "2-3 sentence description of the service explaining what it includes",
  "bulletPoints": ["Professional benefit 1", "Quality benefit 2", "Value benefit 3", "Service benefit 4"],
  "formula": "SIMPLE formula using + and * ONLY, e.g.: squareFootage * 4 + materialType + laborCost",
  "variables": [
    {
      "id": "camelCaseId",
      "name": "Human Readable Name",
      "type": "number|multiple-choice|dropdown|repeatable-group",
      "unit": "sq ft|hours|lbs|etc (max 15 chars)",
      "defaultValue": number,
      "allowMultipleSelection": true, // OPTIONAL for multiple-choice when options should be independently toggled
      "options": [{"id": "option_id", "label": "Option Name", "value": "option_value", "numericValue": 123, "defaultUnselectedValue": 0}], // only for dropdown/multiple-choice
      "repeatableConfig": {
        "countSourceMode": "variable",
        "countVariableId": "numberOfTrees",
        "itemLabelTemplate": "Tree {index}",
        "instanceFormula": "treeHeight * 20 + treeDiameter * 150",
        "childVariables": [
          {"id": "treeHeight", "name": "Tree Height", "type": "number", "unit": "ft"}
        ]
      },
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
  ],
  "iconUrl": "relevant emoji like 🏠, 🔧, 🎨, etc."
}`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Create a pricing calculator for: ${description}`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text' || !content.text) {
      throw new Error('Empty response from Claude');
    }

    // Extract JSON from response text (Claude might include explanatory text)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);
    
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
    console.error('Claude formula generation error:', error);
    throw new Error('Failed to generate formula with Claude: ' + (error as Error).message);
  }
}

export async function editFormula(
  currentFormula: AIFormulaResponse, 
  editInstructions: string,
  mode: AIFormulaEditMode = 'rebuild'
): Promise<AIFormulaResponse | AIFormulaEditPatch> {
  try {
    const client = getClaude();
    const baseRules = `IMPORTANT RULES:
1. Variable IDs must be camelCase
2. Formula must use ONLY variable IDs
3. Use realistic contractor pricing
4. Use simple arithmetic formulas with + and * only
5. Preserve unchanged parts of the current calculator unless the user explicitly asks otherwise
6. Every dropdown/multiple-choice option MUST have a numericValue field
7. Repeatable-group variables must use repeatableConfig and the main formula should reference the repeatable-group variable ID directly
8. Use conditionalLogic for follow-up questions and visibility rules, not formula syntax
9. Prefer the modern conditionalLogic format with "enabled", optional "operator", and a "conditions" array
10. Each conditionalLogic condition needs a unique string "id"
11. dependsOnVariable must exactly match an existing variable ID
12. expectedValue and expectedValues must use the dependency variable's stored option value(s), not rewritten labels`;

    const systemPrompt = mode === 'targeted'
      ? `You are an expert contractor pricing consultant. Make surgical edits to an existing pricing calculator.

${baseRules}

TARGETED EDIT MODE:
- Default to the SMALLEST possible change set.
- Do NOT rewrite the full calculator.
- Do NOT include the full variables array.
- Only add variableOperations for variables the user explicitly wants changed.
- If the request only changes pricing logic, return only "formula".
- If the user asks for a conditional follow-up question, return the affected variable with explicit conditionalLogic.
- If the user asks to make an existing question conditional, return a replace operation for that existing question and preserve its current shape while adding conditionalLogic.
- If the user asks to add a new conditional follow-up question, return an add operation for the new question and put the conditionalLogic on the new question.
- Place new follow-up questions immediately after the triggering variable unless the user says otherwise.
- If the target is inside a repeatable group, return a replace operation for the top-level repeatable-group variable with updated childVariables.
- Only update name/title/description/bulletPoints/iconUrl if explicitly requested or clearly required.

Response format (JSON):
{
  "formula": "optional changed formula",
  "name": "optional changed name",
  "title": "optional changed title",
  "description": "optional changed description",
  "bulletPoints": ["optional changed bullets"],
  "iconUrl": "optional changed icon",
  "variableOperations": [
    { "type": "replace", "variableId": "existingVariableId", "variable": { "id": "existingVariableId", "name": "Existing Question Name", "type": "number|multiple-choice|dropdown|repeatable-group", "conditionalLogic": { "enabled": true, "operator": "AND", "conditions": [{ "id": "cond-1", "dependsOnVariable": "triggerQuestionId", "condition": "equals", "expectedValue": "exactStoredOptionValue" }] } } },
    { "type": "add", "afterVariableId": "optionalExistingVariableId", "variable": { "id": "newConditionalQuestionId", "name": "Display Name", "type": "number|multiple-choice|dropdown|repeatable-group", "conditionalLogic": { "enabled": true, "operator": "AND", "conditions": [{ "id": "cond-1", "dependsOnVariable": "triggerQuestionId", "condition": "equals", "expectedValue": "exactStoredOptionValue" }] } } },
    { "type": "delete", "variableId": "existingVariableId" }
  ]
}`
      : `You are an expert contractor pricing consultant. Edit an existing pricing calculator based on the user's instructions.

${baseRules}

Response format (JSON):
{
  "name": "Service Name",
  "title": "Customer-facing calculator title",
  "description": "2-3 sentence description of the service",
  "bulletPoints": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
  "formula": "simple_formula_using_ids",
  "variables": [
    {
      "id": "camelCaseId",
      "name": "Display Name",
      "type": "number|multiple-choice|dropdown|repeatable-group"
    }
  ],
  "iconUrl": "emoji_or_url"
}`;

    const currentFormulaJson = buildFormulaEditContext(currentFormula, mode);
    
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: mode === 'targeted' ? 1600 : 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Current Formula:\n${currentFormulaJson}\n\nEdit Instructions:\n${editInstructions}`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text' || !content.text) {
      throw new Error('Empty response from Claude');
    }

    // Extract JSON from response text (Claude might include explanatory text)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);

    if (mode === 'targeted') {
      const hasTopLevelChange = ['name', 'title', 'description', 'bulletPoints', 'formula', 'iconUrl']
        .some((key) => Object.prototype.hasOwnProperty.call(result, key));
      const hasVariableOperations = Array.isArray(result.variableOperations) && result.variableOperations.length > 0;

      if (!hasTopLevelChange && !hasVariableOperations) {
        throw new Error('Invalid targeted AI response structure');
      }

      return result as AIFormulaEditPatch;
    }

    if (!result.name || !result.title || !result.formula || !Array.isArray(result.variables)) {
      throw new Error('Invalid AI response structure');
    }

    result.description = result.description || '';
    result.bulletPoints = Array.isArray(result.bulletPoints) ? result.bulletPoints : [];
    result.iconUrl = result.iconUrl || '';

    return result as AIFormulaResponse;
  } catch (error) {
    console.error('Claude formula edit error:', error);
    throw new Error('Failed to edit formula with Claude: ' + (error as Error).message);
  }
}
