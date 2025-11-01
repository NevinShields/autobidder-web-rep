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

export async function editCustomCSS(currentCSS: string, editDescription: string): Promise<string> {
  try {
    const client = getOpenAI();
    
    const systemPrompt = `You are an expert CSS designer specializing in modern web form styling. Edit existing CSS based on user's change requests for an interactive pricing calculator form.

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
- .ab-pricing-card-bullet-icon - Bullet point icons on pricing card
- .ab-pricing-card-bullet-text - Bullet point text on pricing card

INPUT CLASSES:
- .ab-input - All input fields
- .ab-number-input - Number input fields specifically
- .ab-text-input - Text input fields specifically
- .ab-select - Dropdown select elements

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

BOOKING CALENDAR CLASSES:
- .ab-calendar-nav - Calendar navigation buttons (prev/next month)
- .ab-calendar-nav-prev - Previous month button
- .ab-calendar-nav-next - Next month button
- .ab-calendar-month-title - Month and year title display
- .ab-calendar-day-header - Day name headers (Sun, Mon, Tue, etc.)
- .ab-calendar-date - Individual date buttons (can have .selected state)
- .ab-time-slot - Available time slot buttons

IMPORTANT STRUCTURAL NOTES:
- Service containers (outer wrappers) are transparent by default
- Question card styles (.ab-question-card) apply to individual input field containers only
- When custom CSS is active, inline styles are removed to give CSS full control

IMPORTANT RULES:
1. Preserve the existing CSS structure and only modify what the user requests
2. Keep all existing selectors and properties unless specifically asked to remove them
3. When asked to change a property (e.g., color, size), update the relevant CSS rules
4. When asked to add new styles, append them to existing rules or create new ones as appropriate
5. Return the complete, updated CSS - not just the changes
6. Do not include #autobidder-form prefix (it's added automatically)
7. Return ONLY the CSS code - no explanations or markdown formatting

EXAMPLE:
User asks: "Make buttons bigger and change cards to red"
Current CSS: .ab-button { padding: 8px; } .ab-service-card { background: blue; }
Output: .ab-button { padding: 16px; font-size: 1.2rem; } .ab-service-card { background: #DC2626; }`;

    const userPrompt = `Current CSS:
${currentCSS}

Change requested: ${editDescription}

Please update the CSS to reflect this change while preserving all other existing styles.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2500
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

    return cleanCSS.trim();
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
- .ab-pricing-card-bullet-icon - Bullet point icons on pricing card
- .ab-pricing-card-bullet-text - Bullet point text on pricing card

INPUT CLASSES:
- .ab-input - All input fields
- .ab-number-input - Number input fields specifically
- .ab-text-input - Text input fields specifically
- .ab-select - Dropdown select elements

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

BOOKING CALENDAR CLASSES:
- .ab-calendar-nav - Calendar navigation buttons (prev/next month)
- .ab-calendar-nav-prev - Previous month button
- .ab-calendar-nav-next - Next month button
- .ab-calendar-month-title - Month and year title display
- .ab-calendar-day-header - Day name headers (Sun, Mon, Tue, etc.)
- .ab-calendar-date - Individual date buttons (can have .selected state)
- .ab-time-slot - Available time slot buttons

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

CONDITIONAL QUESTIONS (SMART FOLLOW-UPS):
- Use conditional logic to show/hide questions based on previous answers
- Perfect for: follow-up details, size specifications, optional features
- Examples: "Do you have a garage?" → if yes → "Garage size: 1-car/2-car/3-car"
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
  * Yes/No checkbox → detailed follow-up question
  * Property type → specific measurements for that type
  * Service tier → additional customization options
  * Multiple choice → follow-up for specific selections

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