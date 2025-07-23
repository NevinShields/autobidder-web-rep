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

export interface AIFormulaResponse {
  name: string;
  title: string;
  description: string;
  bulletPoints: string[];
  formula: string;
  variables: Variable[];
  iconUrl: string;
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
      "type": "number|dropdown|checkbox",
      "unit": "sq ft|hours|lbs|etc (max 15 chars)",
      "defaultValue": number,
      "options": [{"label": "Option Name", "value": "option_value", "numericValue": 123}] // only for dropdown
    }
  ],
  "iconUrl": "relevant emoji like 🏠, 🔧, 🎨, etc."
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
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
                      }
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
      contents: `Create a pricing calculator for: ${description}

Make it realistic and professional for actual contractor use.`,
    });

    const rawJson = response.text;
    
    if (!rawJson) {
      throw new Error('Empty response from Gemini');
    }

    // Clean up the response to ensure valid JSON
    let cleanJson = rawJson.trim();
    
    // Remove any potential markdown formatting
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(cleanJson);
    
    // Validate the response structure
    if (!result.name || !result.title || !result.formula || !Array.isArray(result.variables)) {
      throw new Error('Invalid AI response structure');
    }
    
    // Ensure required fields have defaults
    result.description = result.description || '';
    result.bulletPoints = Array.isArray(result.bulletPoints) ? result.bulletPoints : [];
    result.iconUrl = result.iconUrl || '🔧';
    
    // Validate and truncate unit fields to max 15 characters
    if (result.variables && Array.isArray(result.variables)) {
      result.variables.forEach((variable: any) => {
        if (variable.unit && variable.unit.length > 15) {
          variable.unit = variable.unit.substring(0, 15);
        }
      });
    }

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
      "type": "number|dropdown|checkbox",
      "unit": "sq ft|hours|lbs|etc (max 15 chars)",
      "defaultValue": number,
      "options": [{"label": "Option Name", "value": "option_value", "numericValue": 123}] // only for dropdown
    }
  ],
  "iconUrl": "relevant emoji like 🏠, 🔧, 🎨, etc."
}`;

    const currentFormulaJson = JSON.stringify(currentFormula, null, 2);
    
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
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
                      }
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
      contents: `Current Formula:
${currentFormulaJson}

Edit Instructions: ${editInstructions}

Please modify the formula according to the instructions. You can add, remove, or modify variables, update the description and bullet points, and adjust the pricing formula as needed.`
    });

    const rawJson = response.text;
    
    if (!rawJson) {
      throw new Error('Empty response from Gemini');
    }

    // Clean up the response to ensure valid JSON
    let cleanJson = rawJson.trim();
    
    // Remove any potential markdown formatting
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(cleanJson);
    
    // Validate the response structure
    if (!result.name || !result.title || !result.formula || !Array.isArray(result.variables)) {
      throw new Error('Invalid AI response structure');
    }
    
    // Ensure required fields have defaults
    result.description = result.description || '';
    result.bulletPoints = Array.isArray(result.bulletPoints) ? result.bulletPoints : [];
    result.iconUrl = result.iconUrl || '🔧';
    
    // Validate and truncate unit fields to max 15 characters
    if (result.variables && Array.isArray(result.variables)) {
      result.variables.forEach((variable: any) => {
        if (variable.unit && variable.unit.length > 15) {
          variable.unit = variable.unit.substring(0, 15);
        }
      });
    }

    return result as AIFormulaResponse;
  } catch (error) {
    console.error('AI formula edit error:', error);
    throw new Error('Failed to edit formula with AI: ' + (error as Error).message);
  }
}