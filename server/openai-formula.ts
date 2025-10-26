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

export async function generateCustomCSS(styleDescription: string): Promise<string> {
  try {
    const client = getOpenAI();
    
    const systemPrompt = `You are an expert CSS designer specializing in modern web form styling. Generate custom CSS based on user descriptions for an interactive pricing calculator form.

AVAILABLE CSS CLASSES TO TARGET:
- .ab-form-container - Main form wrapper
- .ab-service-card - Service selection cards (can have .selected state)
- .ab-button - All buttons (can have .ab-button-primary class)
- .ab-input - All input fields
- .ab-number-input - Number input fields specifically
- .ab-text-input - Text input fields specifically
- .ab-select - Dropdown select elements
- .ab-multiple-choice - Multiple choice option containers
- .ab-question-card - Individual question containers

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
6. Consider accessibility (focus indicators, contrast)
7. Return ONLY the CSS code - no explanations or markdown formatting
8. Do not include #autobidder-form prefix (it's added automatically)

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

    return cleanCSS.trim();
  } catch (error) {
    console.error('OpenAI CSS generation error:', error);
    throw new Error('Failed to generate CSS with OpenAI: ' + (error as Error).message);
  }
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

CRITICAL: PRIORITIZE INTERACTIVE INPUT TYPES WITH VISUAL ENGAGEMENT
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
  "type": "dropdown|multiple-choice|checkbox|number|select",
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