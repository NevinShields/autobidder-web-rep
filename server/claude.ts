import Anthropic from "@anthropic-ai/sdk";

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
    const client = getClaude();
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
      "options": [{"label": "Option Name", "value": "option_value", "numericValue": 123}] // only for dropdown/multiple-choice
    }
  ],
  "iconUrl": "relevant emoji like 🏠, 🔧, 🎨, etc."
}`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
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
  editInstructions: string
): Promise<AIFormulaResponse> {
  try {
    const client = getClaude();
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
      "options": [{"label": "Option Name", "value": "option_value", "numericValue": 123}] // only for dropdown/multiple-choice
    }
  ],
  "iconUrl": "relevant emoji like 🏠, 🔧, 🎨, etc."
}`;

    const currentFormulaJson = JSON.stringify(currentFormula, null, 2);
    
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
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
    console.error('Claude formula edit error:', error);
    throw new Error('Failed to edit formula with Claude: ' + (error as Error).message);
  }
}

export async function generateCustomCSS(description: string): Promise<string> {
  try {
    const client = getClaude();
    const systemPrompt = `You are an expert CSS designer specializing in creating custom, visually stunning CSS for web forms and pricing calculators.

Your task is to generate custom CSS code that will be applied to specific component classes in a pricing calculator form.

AVAILABLE CSS CLASSES (you must target these):
- .service-selector - Service selection cards
- .text-input - Text and number input fields
- .dropdown - Dropdown select menus
- .multiple-choice - Multiple choice option cards
- .slider - Range slider inputs
- .question-card - Question container cards
- .pricing-card - Final pricing display card
- .button - Action buttons (submit, next, back)
- .form-container - Main form container

DESIGN REQUIREMENTS:
1. Create cohesive, professional designs that work well together
2. Use modern CSS features: gradients, shadows, transforms, transitions, animations
3. Ensure good contrast and readability
4. Make interactive elements visually responsive (hover, focus, active states)
5. Consider accessibility (don't rely only on color)
6. Use CSS variables for consistency when appropriate
7. Include smooth transitions for better UX
8. Make designs mobile-responsive where applicable

CSS GUIDELINES:
- Use modern properties: box-shadow, border-radius, transform, transition, filter, backdrop-filter
- Add hover and focus states for interactive elements
- Include subtle animations or transitions
- Use rgba() or hsla() for transparency effects
- Consider adding ::before or ::after pseudo-elements for creative effects
- Use flexbox/grid for layout improvements if needed

IMPORTANT:
- Generate ONLY valid CSS code
- Do NOT include explanations, comments, or markdown formatting
- Start directly with CSS selectors
- Target ALL 9 classes listed above in your design
- Make sure the design is cohesive and follows a unified theme

Example output format:
.service-selector {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.service-selector:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 50px rgba(102, 126, 234, 0.4);
}`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Create custom CSS for a ${description} design style. Generate complete CSS for all 9 component classes.`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text' || !content.text) {
      throw new Error('Empty response from Claude');
    }

    // Extract CSS from response (remove any markdown code blocks if present)
    let cssCode = content.text.trim();
    
    // Remove markdown code block if present
    cssCode = cssCode.replace(/^```css\n?/i, '').replace(/\n?```$/i, '');
    cssCode = cssCode.replace(/^```\n?/i, '').replace(/\n?```$/i, '');
    
    // Basic validation: check if it looks like CSS
    if (!cssCode.includes('{') || !cssCode.includes('}')) {
      throw new Error('Generated content does not appear to be valid CSS');
    }

    return cssCode;
  } catch (error) {
    console.error('Claude CSS generation error:', error);
    throw new Error('Failed to generate CSS with Claude: ' + (error as Error).message);
  }
}