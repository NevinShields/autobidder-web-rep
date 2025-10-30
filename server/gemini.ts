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
  type: 'number' | 'select' | 'checkbox' | 'text' | 'multiple-choice' | 'dropdown';
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

CRITICAL: PRIORITIZE MULTIPLE-CHOICE INPUTS WITH VISUAL ENGAGEMENT
- MOST PREFERRED: multiple-choice (with images - perfect for visual selections like materials, styles, features)
- SECOND CHOICE: dropdown (for lists without images - quality levels, service tiers, complexity)
- THIRD CHOICE: checkbox (only for simple yes/no add-ons)
- AVOID: number, text inputs unless absolutely necessary for measurements

MULTIPLE-CHOICE INPUT GUIDELINES (USE FREQUENTLY - PREFERRED OVER DROPDOWNS):
- Use multiple-choice for: material selections, style choices, finish options, service packages, feature bundles
- Perfect for: siding types, flooring materials, paint finishes, roofing materials, landscaping styles, fencing materials
- Examples: "Brick vs Vinyl vs Wood siding", "Modern vs Traditional vs Rustic style", "Standard vs Premium vs Luxury package"
- ALWAYS use multiple-choice instead of dropdown for: materials, styles, finishes, design options, service tiers
- Multiple-choice displays beautifully with images - much better user experience than dropdowns

DROPDOWN GUIDELINES (USE MODERATELY):
- Use for: quality tiers, size categories, time frames, complexity levels
- Examples: "Basic/Standard/Premium quality", "Small/Medium/Large project", "1-3 days/1 week/2+ weeks"

CHECKBOX GUIDELINES (USE SPARINGLY):
- Only for simple yes/no add-ons that don't need visual representation
- Examples: "Add cleanup service", "Include permit assistance", "Weekend work available"

AVOID number/text inputs except for: square footage, linear footage, room counts, exact measurements

CONDITIONAL QUESTIONS (SMART FOLLOW-UPS):
- Use conditional logic to show/hide questions based on previous answers
- Perfect for: follow-up details, size specifications, optional features
- Examples: "Do you have a garage?" → if yes → "Garage size: 1-car/2-car/3-car"
- Structure: Add conditionalLogic to a variable to control when it appears
  {
    "conditionalLogic": {
      "enabled": true,
      "operator": "AND", // or "OR" for multiple conditions
      "conditions": [{
        "id": "unique-id",
        "dependsOnVariable": "hasGarage", // ID of the question it depends on
        "condition": "equals", // equals, not_equals, greater_than, less_than, contains
        "expectedValue": true // value that triggers this question to show
      }],
      "defaultValue": "" // value to use when hidden
    }
  }
- Common patterns:
  * Yes/No checkbox → detailed follow-up question
  * Property type selection → specific measurements for that type
  * Service tier → additional customization options

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
      "type": "multiple-choice|dropdown|checkbox|number",
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

CRITICAL: PRIORITIZE MULTIPLE-CHOICE INPUTS WITH VISUAL ENGAGEMENT
- MOST PREFERRED: multiple-choice (with images - perfect for visual selections like materials, styles, features)
- SECOND CHOICE: dropdown (for lists without images - quality levels, service tiers, complexity)
- THIRD CHOICE: checkbox (only for simple yes/no add-ons)
- AVOID: number, text inputs unless absolutely necessary for measurements

MULTIPLE-CHOICE INPUT GUIDELINES (USE FREQUENTLY - PREFERRED OVER DROPDOWNS):
- Use multiple-choice for: material selections, style choices, finish options, service packages, feature bundles
- Perfect for: siding types, flooring materials, paint finishes, roofing materials, landscaping styles, fencing materials
- Examples: "Brick vs Vinyl vs Wood siding", "Modern vs Traditional vs Rustic style", "Standard vs Premium vs Luxury package"
- ALWAYS use multiple-choice instead of dropdown for: materials, styles, finishes, design options, service tiers
- Multiple-choice displays beautifully with images - much better user experience than dropdowns

DROPDOWN GUIDELINES (USE MODERATELY):
- Use for: quality tiers, size categories, time frames, complexity levels
- Examples: "Basic/Standard/Premium quality", "Small/Medium/Large project", "1-3 days/1 week/2+ weeks"

CHECKBOX GUIDELINES (USE SPARINGLY):
- Only for simple yes/no add-ons that don't need visual representation
- Examples: "Add cleanup service", "Include permit assistance", "Weekend work available"

AVOID number/text inputs except for: square footage, linear footage, room counts, exact measurements

CONDITIONAL QUESTIONS (SMART FOLLOW-UPS):
- Use conditional logic to show/hide questions based on previous answers
- Perfect for: follow-up details, size specifications, optional features
- Examples: "Do you have a garage?" → if yes → "Garage size: 1-car/2-car/3-car"
- Structure: Add conditionalLogic to a variable to control when it appears
  {
    "conditionalLogic": {
      "enabled": true,
      "operator": "AND", // or "OR" for multiple conditions
      "conditions": [{
        "id": "unique-id",
        "dependsOnVariable": "hasGarage", // ID of the question it depends on
        "condition": "equals", // equals, not_equals, greater_than, less_than, contains
        "expectedValue": true // value that triggers this question to show
      }],
      "defaultValue": "" // value to use when hidden
    }
  }
- Common patterns:
  * Yes/No checkbox → detailed follow-up question
  * Property type selection → specific measurements for that type
  * Service tier → additional customization options

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
      "type": "multiple-choice|dropdown|checkbox|number",
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