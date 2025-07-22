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
  formula: string;
  variables: Variable[];
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
    const systemPrompt = `You are an expert contractor pricing consultant. Create a realistic pricing calculator based on the user's description.

IMPORTANT RULES:
1. Variable IDs must be camelCase (e.g., "squareFootage", "materialType", "laborHours")
2. Formula must use ONLY variable IDs (not variable names)
3. Use realistic contractor pricing (research actual market rates)
4. Include 3-8 relevant variables
5. Use appropriate units (sq ft, linear ft, hours, etc.)
6. For dropdown/select variables, include numericValue for calculations
7. Formula should be a mathematical expression using +, -, *, /, parentheses, and ternary operators
8. Boolean variables use ternary: (variableId ? cost : 0)

Response format (JSON):
{
  "name": "Service Name",
  "title": "Descriptive title for the service",
  "formula": "mathematical expression using variable IDs",
  "variables": [
    {
      "id": "camelCaseId",
      "name": "Human Readable Name",
      "type": "number|dropdown|checkbox",
      "unit": "sq ft|linear ft|hours|etc",
      "defaultValue": number,
      "options": [{"label": "Option Name", "value": "option_value", "numericValue": 123}] // only for dropdown
    }
  ]
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
            formula: { type: "string" },
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
          required: ["name", "title", "formula", "variables"]
        }
      },
      contents: `Create a pricing calculator for: ${description}

Make it realistic and professional for actual contractor use.`,
    });

    const rawJson = response.text;
    
    if (!rawJson) {
      throw new Error('Empty response from Gemini');
    }

    const result = JSON.parse(rawJson);
    
    // Validate the response structure
    if (!result.name || !result.title || !result.formula || !Array.isArray(result.variables)) {
      throw new Error('Invalid AI response structure');
    }

    return result as AIFormulaResponse;
  } catch (error) {
    console.error('AI formula generation error:', error);
    throw new Error('Failed to generate formula with AI: ' + (error as Error).message);
  }
}