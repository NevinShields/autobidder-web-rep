import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert contractor pricing consultant. Create a realistic pricing calculator based on the user's description.

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
}`
        },
        {
          role: "user",
          content: `Create a pricing calculator for: ${description}

Make it realistic and professional for actual contractor use.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
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