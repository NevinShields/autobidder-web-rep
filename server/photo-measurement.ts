import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OPENAI_API_KEY is not configured. Please provide a valid OpenAI API key to use photo measurement.');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export interface MeasurementRequest {
  images: string[]; // base64 encoded images
  referenceObject: string; // e.g., "door"
  referenceMeasurement: number; // e.g., 7
  referenceUnit: string; // e.g., "feet"
  targetObject: string; // what to measure, e.g., "house wall", "deck", "patio"
  measurementType: 'area' | 'length' | 'width' | 'height' | 'perimeter';
}

export interface MeasurementResult {
  value: number;
  unit: string;
  confidence: number; // 0-100
  explanation: string;
  warnings: string[];
}

export async function analyzePhotoMeasurement(
  request: MeasurementRequest
): Promise<MeasurementResult> {
  try {
    const client = getOpenAI();

    // Prepare the system prompt
    const systemPrompt = `You are an expert at estimating measurements from photographs. 
You will be given one or more photos with a known reference measurement, and you need to estimate another measurement in the photo.

INSTRUCTIONS:
1. Identify the reference object in the photo with the known measurement
2. Use the reference to establish scale
3. Estimate the requested measurement of the target object
4. Consider perspective, angles, and distortion
5. Provide a confidence score (0-100) based on:
   - Photo quality and clarity
   - Visibility of reference and target
   - Perspective and angle issues
   - Partial occlusion or obstruction
6. List any warnings or factors that affect accuracy
7. Explain your reasoning briefly

IMPORTANT ACCURACY NOTES:
- Photo-based measurements are estimates, typically ±10-20% accuracy
- Best for rough quotes and planning, not final billing
- Multiple photos from different angles improve accuracy
- Photos taken perpendicular to surface are most accurate

Return your response as JSON in this exact format:
{
  "value": estimated_measurement_as_number,
  "unit": "appropriate_unit (sqft, sq ft, linear ft, ft, etc)",
  "confidence": confidence_score_0_to_100,
  "explanation": "brief explanation of how you calculated",
  "warnings": ["warning1", "warning2"]
}`;

    // Prepare the user message with images
    const imageMessages = request.images.map((base64Image) => ({
      type: "image_url" as const,
      image_url: {
        url: base64Image.startsWith('data:') 
          ? base64Image 
          : `data:image/jpeg;base64,${base64Image}`,
      },
    }));

    const userPrompt = `Reference Object: ${request.referenceObject}
Reference Measurement: ${request.referenceMeasurement} ${request.referenceUnit}

Target Object to Measure: ${request.targetObject}
Measurement Type: ${request.measurementType}

Please analyze the photo(s) and provide an estimate for the ${request.measurementType} of the ${request.targetObject}.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            ...imageMessages,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const result = JSON.parse(content);

    // Validate the response structure
    if (
      typeof result.value !== 'number' ||
      typeof result.unit !== 'string' ||
      typeof result.confidence !== 'number' ||
      typeof result.explanation !== 'string' ||
      !Array.isArray(result.warnings)
    ) {
      throw new Error('Invalid AI response structure');
    }

    // Ensure confidence is between 0-100
    result.confidence = Math.max(0, Math.min(100, result.confidence));

    return result as MeasurementResult;
  } catch (error) {
    console.error('Photo measurement analysis error:', error);
    throw new Error('Failed to analyze photo measurement: ' + (error as Error).message);
  }
}
