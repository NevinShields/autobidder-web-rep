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
  referenceObject?: string; // e.g., "door" - optional for auto-detect mode
  referenceMeasurement?: number; // e.g., 7 - optional for auto-detect mode
  referenceUnit?: string; // e.g., "feet" - optional for auto-detect mode
  referenceImages?: string[]; // optional: user-provided reference images with known measurements
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

    // Determine mode: custom reference images, manual reference, or auto-detect
    const hasReferenceImages = request.referenceImages && request.referenceImages.length > 0;
    const hasManualReference = request.referenceObject && request.referenceMeasurement;
    const isAutoDetectMode = !hasReferenceImages && !hasManualReference;

    // Prepare the system prompt
    const systemPrompt = hasReferenceImages
      ? `You are an expert at estimating measurements from photographs using user-provided reference images.

CUSTOM REFERENCE MODE - You will be given reference image(s) with known measurements, plus target images to measure.

INSTRUCTIONS:
1. Carefully examine the reference image(s) to identify the object with the known measurement: "${request.referenceObject || 'the reference object'}"
2. Use this reference measurement (${request.referenceMeasurement || 'N/A'} ${request.referenceUnit || ''}) to establish scale
3. Compare the reference image with the target images to understand relative scale
4. Estimate the requested measurement of the target object in the target images
5. Consider perspective, angles, and distortion in both reference and target images
6. Provide a confidence score (0-100) based on:
   - Photo quality and clarity of both reference and target images
   - Visibility and clarity of reference object
   - Similarity in perspective/distance between reference and target
   - Ability to establish consistent scale
7. List any warnings or factors that affect accuracy
8. Explain your reasoning, including how you used the reference image

IMPORTANT ACCURACY NOTES:
- Reference images help establish more accurate scale, typically ±10-15% accuracy
- Best results when reference and target images have similar perspective and distance
- Multiple reference images from different angles improve accuracy
- Best for rough quotes and planning, not final billing

Return your response as JSON in this exact format:
{
  "value": estimated_measurement_as_number,
  "unit": "appropriate_unit (sqft, sq ft, linear ft, ft, etc)",
  "confidence": confidence_score_0_to_100,
  "explanation": "brief explanation including how you used the reference image(s) to calculate",
  "warnings": ["warning1", "warning2"]
}`
      : isAutoDetectMode 
      ? `You are an expert at estimating measurements from photographs using your knowledge of typical object dimensions.

AUTO-DETECT MODE - You will analyze photos and automatically identify common objects to establish scale.

KNOWN STANDARD DIMENSIONS (use these as reference):

DOORS & WINDOWS:
- Standard door: 7 feet (84 inches) tall, 3 feet (36 inches) wide
- Garage door (single): 7 feet tall, 9 feet wide
- Garage door (double): 7 feet tall, 16 feet wide
- Window (standard): 3-4 feet wide, 4-5 feet tall
- Sliding glass door: 6.5-8 feet tall, 6-8 feet wide

BUILDING MATERIALS:
- Standard brick: 8 inches long, 4 inches tall, 2.5 inches deep
- Cinder block: 16 inches long, 8 inches tall
- Roof shingle (asphalt): 12 inches wide, 36 inches long
- Vinyl siding panel: 12 feet long (height varies)
- 2x4 lumber: 3.5 inches wide, 1.5 inches thick
- Deck board: 5.5 inches wide (standard)
- Fence picket: 3.5-5.5 inches wide
- Paver/brick (patio): 8x4 inches or 12x12 inches

EXTERIOR FEATURES:
- Fence post: 4x4 inches (typical)
- Mailbox: 18-22 inches tall
- Light switch/outlet: 4.5 inches tall, 2.75 inches wide
- Electrical outlet box: 4 inches tall
- Stair step/riser: 7-8 inches tall, 10-11 inches deep (tread)
- Handrail height: 34-38 inches from floor
- Gutter: 5 inches wide (standard)
- Downspout: 2x3 inches or 3x4 inches

REFERENCE OBJECTS:
- Person (average): 5.5-6 feet tall
- Car (sedan): 15 feet long, 6 feet wide, 5 feet tall
- Parking space: 9 feet wide, 18 feet long
- Kitchen counter: 36 inches tall, 24 inches deep
- Ceiling (residential): 8-9 feet
- Floor tile (standard): 12x12 inches or 16x16 inches
- Sidewalk (average): 5 feet wide

INSTRUCTIONS:
1. Scan the photo for recognizable objects with standard dimensions
2. Automatically identify the best reference object(s) to establish scale
3. Use that scale to estimate the requested measurement
4. Consider perspective, angles, and distortion
5. Provide a confidence score (0-100) based on:
   - Photo quality and clarity
   - Reliability of auto-detected reference
   - Visibility of target object
   - Perspective and angle issues
6. List any warnings about accuracy
7. Explain which object(s) you used as reference and your reasoning

IMPORTANT ACCURACY NOTES:
- Auto-detected measurements assume standard dimensions (not all doors are exactly 7 feet)
- Accuracy typically ±15-25% with auto-detection
- Best for rough quotes and planning, not final billing
- Multiple photos from different angles improve accuracy
- If no clear reference objects are visible, provide best estimate with low confidence

Return your response as JSON in this exact format:
{
  "value": estimated_measurement_as_number,
  "unit": "appropriate_unit (sqft, sq ft, linear ft, ft, etc)",
  "confidence": confidence_score_0_to_100,
  "explanation": "brief explanation including which object(s) you used as reference and how you calculated",
  "warnings": ["warning1", "warning2"]
}`
      : `You are an expert at estimating measurements from photographs. 
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
    const imageMessages: Array<{ type: "image_url"; image_url: { url: string } }> = [];
    
    // Add reference images first if provided
    if (hasReferenceImages && request.referenceImages) {
      request.referenceImages.forEach((base64Image) => {
        imageMessages.push({
          type: "image_url" as const,
          image_url: {
            url: base64Image.startsWith('data:')
              ? base64Image
              : `data:image/jpeg;base64,${base64Image}`,
          },
        });
      });
    }
    
    // Add target images
    request.images.forEach((base64Image) => {
      imageMessages.push({
        type: "image_url" as const,
        image_url: {
          url: base64Image.startsWith('data:')
            ? base64Image
            : `data:image/jpeg;base64,${base64Image}`,
        },
      });
    });

    const userPrompt = hasReferenceImages
      ? `CUSTOM REFERENCE MODE: The first ${request.referenceImages!.length} image(s) are REFERENCE images showing the "${request.referenceObject || 'reference object'}" with a known measurement of ${request.referenceMeasurement || 'N/A'} ${request.referenceUnit || ''}.

The remaining images are TARGET images to measure.

Target Object to Measure: ${request.targetObject}
Measurement Type: ${request.measurementType}

Use the reference image(s) to establish scale, then analyze the target image(s) and provide an estimate for the ${request.measurementType} of the ${request.targetObject}.`
      : isAutoDetectMode
      ? `AUTO-DETECT MODE: Please automatically identify common objects in the photo(s) to establish scale.

Target Object to Measure: ${request.targetObject}
Measurement Type: ${request.measurementType}

Analyze the photo(s), identify reference objects with known standard dimensions, and provide an estimate for the ${request.measurementType} of the ${request.targetObject}.`
      : `Reference Object: ${request.referenceObject}
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
