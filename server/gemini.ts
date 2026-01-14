import { GoogleGenAI } from "@google/genai";

let gemini: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!gemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY is not configured. Please provide a valid Gemini API key to use AI formula generation.');
    }
    gemini = new GoogleGenAI({ apiKey });
  }
  return gemini;
}

interface Variable {
  id: string;
  name: string;
  type: 'number' | 'select' | 'text' | 'multiple-choice' | 'dropdown';
  unit?: string;
  options?: Array<{
    label: string;
    value: string | number;
    numericValue?: number;
  }>;
  defaultValue?: string | number | boolean;
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

export async function generateFormula(description: string): Promise<AIFormulaResponse> {
  try {
    const client = getGemini();
    const systemPrompt = `You are an expert contractor pricing consultant. Create a comprehensive pricing calculator based on the user's description.

IMPORTANT RULES:
1. Variable IDs must be camelCase (e.g., "squareFootage", "materialType", "laborHours")
2. Formula must use ONLY variable IDs (not variable names)
3. Use realistic contractor pricing (research actual market rates)
4. Include 3-8 relevant variables that affect pricing
5. Use short units (max 15 chars): sq ft, linear ft, hours, lbs, etc.
6. For dropdown/select variables, include numericValue for calculations
7. Formula should be a mathematical expression using +, -, *, /, parentheses, and ternary operators
8. Boolean variables use ternary: (variableId ? cost : 0)
9. Create compelling service descriptions and 4-6 bullet points highlighting key benefits
10. Provide a relevant emoji icon that represents the service

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

Response format (JSON):
{
  "name": "Service Name",
  "title": "Customer-facing calculator title",
  "description": "2-3 sentence description of the service explaining what it includes",
  "bulletPoints": ["Professional benefit 1", "Quality benefit 2", "Value benefit 3", "Service benefit 4"],
  "formula": "mathematical expression using variable IDs",
  "variables": [
    {
      "id": "camelCaseId",
      "name": "Human Readable Name",
      "type": "number|multiple-choice|dropdown",
      "unit": "sq ft|hours|lbs|etc (max 15 chars)",
      "defaultValue": number,
      "options": [{"label": "Option Name", "value": "option_value", "numericValue": 123}], // only for dropdown/multiple-choice
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

    const response = await client.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            bulletPoints: { type: "array", items: { type: "string" } },
            formula: { type: "string" },
            iconUrl: { type: "string" },
            variables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  unit: { type: "string" },
                  defaultValue: { type: ["string", "number", "boolean"] },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        value: { type: ["string", "number"] },
                        numericValue: { type: "number" }
                      },
                      required: ["label", "value"]
                    }
                  }
                },
                required: ["id", "name", "type"]
              }
            }
          },
          required: ["name", "title", "description", "bulletPoints", "formula", "variables", "iconUrl"]
        }
      },
      contents: [{ role: "user", parts: [{ text: description }] }]
    });

    const content = response.response.text();
    if (!content) {
      throw new Error('Empty response from Gemini');
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
    const client = getGemini();
    const systemPrompt = `You are an expert contractor pricing consultant. Edit an existing pricing calculator based on the user's instructions.

IMPORTANT RULES:
1. Variable IDs must be camelCase (e.g., "squareFootage", "materialType", "laborHours")
2. Formula must use ONLY variable IDs (not variable names)
3. Use realistic contractor pricing (research actual market rates)
4. Use short units (max 15 chars): sq ft, linear ft, hours, lbs, etc.
5. For dropdown/select variables, include numericValue for calculations
6. Formula should be a mathematical expression using +, -, *, /, parentheses, and ternary operators
7. Boolean variables use ternary: (variableId ? cost : 0)
8. You can add, remove, or modify variables as needed
9. Update descriptions and bullet points to reflect changes
10. Maintain service quality and professionalism

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

Response format (JSON):
{
  "name": "Service Name",
  "title": "Customer-facing calculator title",
  "description": "2-3 sentence description of the service explaining what it includes",
  "bulletPoints": ["Professional benefit 1", "Quality benefit 2", "Value benefit 3", "Service benefit 4"],
  "formula": "mathematical expression using variable IDs",
  "variables": [
    {
      "id": "camelCaseId",
      "name": "Human Readable Name",
      "type": "number|multiple-choice|dropdown",
      "unit": "sq ft|hours|lbs|etc (max 15 chars)",
      "defaultValue": number,
      "options": [{"label": "Option Name", "value": "option_value", "numericValue": 123}], // only for dropdown/multiple-choice
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

    const currentFormulaJson = JSON.stringify(currentFormula, null, 2);
    
    const response = await client.generateContent({
      model: "gemini-2.0-flash-exp", 
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            bulletPoints: { type: "array", items: { type: "string" } },
            formula: { type: "string" },
            iconUrl: { type: "string" },
            variables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  unit: { type: "string" },
                  defaultValue: { type: ["string", "number", "boolean"] },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        value: { type: ["string", "number"] },
                        numericValue: { type: "number" }
                      },
                      required: ["label", "value"]
                    }
                  }
                },
                required: ["id", "name", "type"]
              }
            }
          },
          required: ["name", "title", "description", "bulletPoints", "formula", "variables", "iconUrl"]
        }
      },
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Current Formula:\n${currentFormulaJson}\n\nEdit Instructions:\n${editInstructions}` 
        }] 
      }]
    });

    const content = response.response.text();
    if (!content) {
      throw new Error('Empty response from Gemini');
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
    console.error('AI formula edit error:', error);
    throw new Error('Failed to edit formula with AI: ' + (error as Error).message);
  }
}