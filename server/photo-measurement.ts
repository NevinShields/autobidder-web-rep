import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

function getAnthropic(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
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

async function analyzeWithClaude(
  setupConfig: {
    objectDescription: string;
    measurementType: string;
    referenceImages: Array<{
      image: string;
      description: string;
      measurement: string;
      unit: string;
    }>;
  },
  customerImages: string[]
): Promise<MeasurementResult> {
  const client = getAnthropic();

  // Build similar system prompt for Claude
  const systemPrompt = `You are an expert at estimating measurements from photographs. ${setupConfig.objectDescription}

Use your knowledge of standard dimensions (doors=7ft, windows=3-4ft, bricks=8in, etc.) to identify reference objects and estimate the ${setupConfig.measurementType}.

${customerImages.length > 1 ? `Analyze ALL ${customerImages.length} images together and combine insights.` : 'Analyze the image carefully.'}

Return JSON: {"value": number, "unit": "string", "confidence": 0-100, "explanation": "string", "warnings": []}`;

  // Convert images to Claude format
  const imageContent: any[] = [];

  // Add reference images
  setupConfig.referenceImages.forEach((refImg) => {
    const base64Data = refImg.image.replace(/^data:image\/\w+;base64,/, '');
    imageContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: base64Data,
      },
    });
  });

  // Add customer images
  customerImages.forEach((img) => {
    const base64Data = img.replace(/^data:image\/\w+;base64,/, '');
    imageContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: base64Data,
      },
    });
  });

  imageContent.push({
    type: "text",
    text: `Estimate the ${setupConfig.measurementType}. ${customerImages.length > 1 ? `There are ${customerImages.length} customer images to analyze together.` : ''}`
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: imageContent,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error("Unexpected response format from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid JSON response from Claude");
  }

  const result = JSON.parse(jsonMatch[0]);
  return {
    value: result.value,
    unit: result.unit,
    confidence: result.confidence,
    explanation: result.explanation,
    warnings: result.warnings || [],
  };
}

export async function analyzeWithSetupConfig(
  setupConfig: {
    objectDescription: string;
    measurementType: string;
    referenceImages: Array<{
      image: string;
      description: string;
      measurement: string;
      unit: string;
    }>;
  },
  customerImages: string[]
): Promise<MeasurementResult> {
  // Try OpenAI first (GPT-4o has best vision capabilities)
  try {
    console.log('Attempting photo measurement with OpenAI GPT-4o...');
    const client = getOpenAI();

    // Build the system prompt prioritizing general knowledge
    const systemPrompt = `You are an expert at estimating measurements from photographs using your extensive knowledge of typical object dimensions.

KNOWN STANDARD DIMENSIONS (PRIMARY REFERENCE - use these first):

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

BUSINESS OWNER CONTEXT:
Object Description: ${setupConfig.objectDescription}

${setupConfig.referenceImages.length > 0 
  ? `SUPPLEMENTARY CALIBRATION DATA (${setupConfig.referenceImages.length} optional calibration images provided):\n${setupConfig.referenceImages.map((ref, i) => 
      `${i + 1}. ${ref.description} - Measurement: ${ref.measurement} ${ref.unit}`
    ).join('\n')}`
  : 'No calibration images provided - rely entirely on your knowledge of standard dimensions.'
}

INSTRUCTIONS:
1. **PRIMARY APPROACH**: Use your knowledge of standard dimensions to identify reference objects in the customer images
2. **SECONDARY VALIDATION**: ${setupConfig.referenceImages.length > 0 
    ? 'Review the business owner\'s calibration examples to validate or refine your estimates' 
    : 'No calibration images provided - rely entirely on standard dimensions'}
3. You will receive ${setupConfig.referenceImages.length > 0 
    ? `${setupConfig.referenceImages.length} calibration image(s) first (optional reference), then ` 
    : ''}${customerImages.length} customer image(s) to measure
4. **Prioritize general knowledge** - Look for standard objects (doors, bricks, people, etc.) in customer images to establish scale
5. **MULTI-IMAGE ANALYSIS ${customerImages.length > 1 ? `(YOU HAVE ${customerImages.length} CUSTOMER IMAGES)` : '(SINGLE IMAGE)'}**:
${customerImages.length > 1 
  ? `   ⚠️ CRITICAL: You must analyze ALL ${customerImages.length} customer images together as a complete set:
   - START by examining EACH image individually - identify what's shown, the angle, and any reference objects
   - LOOK for standard objects (doors, windows, bricks, vehicles, people, etc.) in EVERY image
   - CROSS-REFERENCE measurements found across different images to verify consistency
   - USE the clearest or most perpendicular view as your primary measurement source
   - VALIDATE your estimate by comparing measurements derived from different angles
   - COMBINE insights from all ${customerImages.length} images to produce the single most accurate estimate
   - In your explanation, specifically state: which images you used, what you saw in each, which view was most reliable, and how you integrated information from multiple angles
   - If different images suggest different measurements, explain the discrepancy and your reasoning for the final value`
  : '   - Analyze the single customer image carefully to identify reference objects and establish scale\n   - Use any visible standard objects to make your measurement\n   - Note in your explanation that you only had one view, which may limit accuracy'}
6. Consider perspective, angles, and distortion in the customer images
7. Provide a confidence score (0-100) based on:
   - Photo quality and clarity of customer images
   - Presence of recognizable standard reference objects
   - How well estimates align with typical dimensions
   - Perspective and angle issues
   - ${customerImages.length > 1 ? `Consistency of measurements across all ${customerImages.length} images (multiple views increase confidence)` : 'Single image limitations (only one view available)'}
8. List any warnings or factors that affect accuracy
9. Explain your reasoning in detail, focusing on:
   - Which standard objects you identified in which images
   ${customerImages.length > 1 ? `- How you analyzed and integrated information from all ${customerImages.length} customer images\n   - Which specific image(s) provided the most reliable measurement data and why\n   - Any differences you noticed between images and how you resolved them` : '- That you only had one image to work with'}

ACCURACY NOTES:
- Rely on your knowledge of standard dimensions as the foundation
- Use calibration examples to validate, not as primary measurement source
- Multiple customer images from different angles improve accuracy
- Typical accuracy: ±10-20% with identifiable standard objects
- Best for rough quotes and planning, not final billing

Return your response as JSON in this exact format:
{
  "value": estimated_measurement_as_number,
  "unit": "appropriate_unit (sqft, sq ft, linear ft, ft, etc)",
  "confidence": confidence_score_0_to_100,
  "explanation": "brief explanation focusing on which standard objects you identified and how you calculated",
  "warnings": ["warning1", "warning2"]
}`;

    // Prepare images: reference images first, then customer images
    const imageMessages: Array<{ type: "image_url"; image_url: { url: string } }> = [];
    
    // Add reference/training images
    setupConfig.referenceImages.forEach((refImg) => {
      imageMessages.push({
        type: "image_url" as const,
        image_url: {
          url: refImg.image.startsWith('data:')
            ? refImg.image
            : `data:image/jpeg;base64,${refImg.image}`,
        },
      });
    });
    
    // Add customer images
    customerImages.forEach((img) => {
      imageMessages.push({
        type: "image_url" as const,
        image_url: {
          url: img.startsWith('data:')
            ? img
            : `data:image/jpeg;base64,${img}`,
        },
      });
    });

    const userPrompt = setupConfig.referenceImages.length > 0
      ? `CALIBRATION IMAGES (optional reference): The first ${setupConfig.referenceImages.length} image(s) are business owner examples for calibration/validation.

CUSTOMER IMAGES TO MEASURE: The remaining ${customerImages.length} image(s) are from the customer showing the object to measure.

TASK: Estimate the ${setupConfig.measurementType} of the object in the customer images.

PRIMARY APPROACH: Identify standard objects in the customer images (doors, windows, bricks, people, etc.) to establish scale using your knowledge of typical dimensions.

SECONDARY VALIDATION: Use the calibration examples to validate your estimates if needed.

${customerImages.length > 1 
  ? `🔴 CRITICAL - MULTI-IMAGE ANALYSIS REQUIRED 🔴

You have ${customerImages.length} customer images to analyze. This is NOT optional - you MUST:

1. EXAMINE each of the ${customerImages.length} images individually first
2. IDENTIFY what's visible in each image (angles, distances, reference objects)
3. LOOK for standard-sized objects (doors, windows, bricks, vehicles, people) in EACH image
4. COMPARE measurements derived from different images to verify consistency
5. SELECT the most reliable view(s) for your primary measurement
6. INTEGRATE all ${customerImages.length} images' information into ONE final measurement

In your explanation, you MUST describe:
- What you saw in each of the ${customerImages.length} images
- Which image(s) you relied on most and why
- How measurements from different angles compared
- How you arrived at your final single measurement by combining all views

Do NOT just analyze one image - use ALL ${customerImages.length} images together!`
  : 'SINGLE IMAGE: Analyze this one image carefully to find reference objects and make your measurement.'}

Prioritize general knowledge of standard dimensions over the calibration data.`
      : `CUSTOMER IMAGES TO MEASURE: All ${customerImages.length} image(s) are from the customer showing the object to measure.

TASK: Estimate the ${setupConfig.measurementType} of the object in the customer images.

NO CALIBRATION IMAGES PROVIDED: Use your knowledge of standard dimensions exclusively. Identify standard objects in the images (doors, windows, bricks, people, sidewalks, etc.) to establish scale.

${customerImages.length > 1 
  ? `🔴 CRITICAL - MULTI-IMAGE ANALYSIS REQUIRED 🔴

You have ${customerImages.length} customer images to analyze. This is NOT optional - you MUST:

1. EXAMINE each of the ${customerImages.length} images individually first
2. IDENTIFY what's visible in each image (angles, distances, reference objects)
3. LOOK for standard-sized objects (doors, windows, bricks, vehicles, people) in EACH image
4. COMPARE measurements derived from different images to verify consistency
5. SELECT the most reliable view(s) for your primary measurement
6. INTEGRATE all ${customerImages.length} images' information into ONE final measurement

In your explanation, you MUST describe:
- What you saw in each of the ${customerImages.length} images
- Which image(s) you relied on most and why
- How measurements from different angles compared
- How you arrived at your final single measurement by combining all views

Do NOT just analyze one image - use ALL ${customerImages.length} images together!`
  : 'SINGLE IMAGE: Focus on finding recognizable objects with known dimensions to make your estimate as accurate as possible.'}`;

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
      max_tokens: 1000,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }

    const result = JSON.parse(jsonMatch[0]);

    console.log('OpenAI photo measurement successful');
    return {
      value: result.value,
      unit: result.unit,
      confidence: result.confidence,
      explanation: result.explanation,
      warnings: result.warnings || [],
    };
  } catch (openaiError) {
    console.warn('OpenAI photo measurement failed, falling back to Claude:', openaiError);

    // Fallback to Claude if OpenAI fails
    try {
      const result = await analyzeWithClaude(setupConfig, customerImages);
      console.log('Claude photo measurement fallback successful');
      return result;
    } catch (claudeError) {
      console.error('Both OpenAI and Claude photo measurement failed');
      console.error('OpenAI error:', openaiError);
      console.error('Claude error:', claudeError);

      // Provide informative error message
      let errorMessage = "Failed to analyze measurements. ";
      if (openaiError instanceof Error && openaiError.message.includes('OPENAI_API_KEY')) {
        errorMessage += "OpenAI API is not configured. ";
      }
      if (claudeError instanceof Error && claudeError.message.includes('ANTHROPIC_API_KEY')) {
        errorMessage += "Claude API is not configured either. Please contact support.";
      } else {
        errorMessage += "Please try again with different photos or contact support.";
      }

      throw new Error(errorMessage);
    }
  }
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
- **When using multiple reference images**: Examine all of them to understand scale from different angles
- **When analyzing multiple target images**: YOU MUST examine EVERY target image, identify reference objects in each, cross-reference measurements across all views, and integrate insights from all angles into one final measurement
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
- **When analyzing multiple photos**: YOU MUST examine EVERY image individually, look for reference objects in each one, cross-reference measurements from different angles, use the clearest view for primary measurement, validate consistency across all images, and combine all insights into one final measurement. Explain which images you used and how.
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
- Multiple photos from different angles improve accuracy - YOU MUST analyze ALL provided photos together
- Photos taken perpendicular to surface are most accurate
- When multiple images are provided, examine each one and integrate all information into your final measurement

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

The remaining ${request.images.length} image(s) are TARGET images to measure.

Target Object to Measure: ${request.targetObject}
Measurement Type: ${request.measurementType}

Use the reference image(s) to establish scale, then analyze the target image(s) and provide an estimate for the ${request.measurementType} of the ${request.targetObject}.

${request.images.length > 1 ? `🔴 MULTI-IMAGE REQUIREMENT 🔴
You have ${request.images.length} target images. You MUST:
- Examine EACH of the ${request.images.length} target images individually
- Identify what's visible in each image and at what angle
- Look for the reference scale in each image
- Cross-reference measurements from different angles
- Use the clearest/best angle for your primary measurement
- Integrate insights from ALL ${request.images.length} images into ONE final measurement
- In your explanation: state what you saw in each image and which you relied on most` : 'Analyze the single target image carefully.'}`
      : isAutoDetectMode
      ? `AUTO-DETECT MODE: Please automatically identify common objects in the ${request.images.length} photo(s) to establish scale.

Target Object to Measure: ${request.targetObject}
Measurement Type: ${request.measurementType}

Analyze the photo(s), identify reference objects with known standard dimensions, and provide an estimate for the ${request.measurementType} of the ${request.targetObject}.

${request.images.length > 1 ? `🔴 MULTI-IMAGE REQUIREMENT 🔴
You have ${request.images.length} images. You MUST:
- Examine EACH of the ${request.images.length} images individually
- Look for standard objects (doors, windows, bricks, vehicles, people) in EVERY image
- Identify what's visible in each image and at what angle
- Cross-reference measurements found in different images
- Use the clearest/best angle for your primary measurement
- Integrate insights from ALL ${request.images.length} images into ONE final measurement
- In your explanation: describe what you saw in each image, which reference objects you found in each, and which image(s) provided the most reliable measurement data` : 'Analyze the single image carefully to find reference objects.'}`
      : `Reference Object: ${request.referenceObject}
Reference Measurement: ${request.referenceMeasurement} ${request.referenceUnit}

Target Object to Measure: ${request.targetObject}
Measurement Type: ${request.measurementType}

Please analyze the ${request.images.length} photo(s) and provide an estimate for the ${request.measurementType} of the ${request.targetObject}.

${request.images.length > 1 ? `🔴 MULTI-IMAGE REQUIREMENT 🔴
You have ${request.images.length} images. You MUST:
- Examine EACH of the ${request.images.length} images individually
- Find the reference object (${request.referenceObject}) and target in each image
- Cross-reference the scale across different views
- Use multiple angles to validate your measurement
- Integrate insights from ALL ${request.images.length} images into ONE final measurement
- In your explanation: describe which image(s) showed the reference object most clearly and which you used for the final measurement` : 'Analyze the single image to find the reference object and measure the target.'}`;

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
