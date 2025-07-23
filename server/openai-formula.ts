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
    const client = getOpenAI();
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const systemPrompt = `You are an expert contractor pricing consultant. Create a comprehensive pricing calculator based on the user's description.

IMPORTANT RULES:
1. Variable IDs must be camelCase (e.g., "squareFootage", "materialType", "laborHours")
2. Formula must use ONLY variable IDs (not variable names)
3. Use realistic contractor pricing (research actual market rates)
4. Include 3-8 relevant variables that affect pricing
5. Use appropriate units (sq ft, linear ft, hours, etc.)
6. For dropdown/select variables, include numericValue for calculations
7. Formula should be a mathematical expression using +, -, *, /, parentheses, and ternary operators
8. Boolean variables use ternary: (variableId ? cost : 0)
9. Create compelling service descriptions and 4-6 bullet points highlighting key benefits
10. Provide a relevant icon URL from a professional icon service (preferably from lucide icons, heroicons, or similar)

RESPONSE FORMAT: JSON with these exact fields:
{
  "name": "Service Name",
  "title": "Customer-facing calculator title",
  "description": "2-3 sentence description of the service",
  "bulletPoints": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
  "formula": "mathematical expression using variable IDs",
  "variables": [array of variable objects],
  "iconUrl": "https://icon-url-or-emoji"
}

VARIABLE STRUCTURE:
{
  "id": "camelCaseId",
  "name": "Display Name",
  "type": "number|select|checkbox|dropdown|multiple-choice",
  "unit": "optional unit",
  "options": [{"label": "Option", "value": "value", "numericValue": 123}],
  "defaultValue": "optional default"
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
      temperature: 0.7,
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