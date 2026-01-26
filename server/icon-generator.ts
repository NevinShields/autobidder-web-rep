import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY is not configured. Please provide a valid Gemini API key to use AI icon generation.');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

interface IconGenerationResult {
  imageBase64: string;
  mimeType: string;
}

interface BulkIconResult {
  optionId: string;
  imageBase64: string;
  mimeType: string;
}

interface BulkIconError {
  optionId: string;
  error: string;
}

interface BulkGenerationResult {
  images: BulkIconResult[];
  errors: BulkIconError[];
}

/**
 * Analyzes a reference icon and returns a detailed style description
 * This is used as an intermediate step to better match icon styles
 * @param referenceImage - Reference image as base64 data URL
 * @returns Detailed text description of the icon's visual style
 */
async function analyzeIconStyle(referenceImage: string): Promise<string> {
  const ai = getGenAI();

  // Extract base64 data and mime type from data URL
  const matches = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid reference image format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const analysisPrompt = `You are an expert icon designer. Analyze this icon image and provide a VERY DETAILED and SPECIFIC description of its visual style that could be used to recreate the exact same style for a different subject.

Describe with extreme precision:

1. COLOR PALETTE: List the exact colors used with hex codes if possible (e.g., "primary: bright coral #FF6B4A, secondary: soft teal #4ECDC4, accent: white"). Note saturation levels (vivid/muted/pastel).

2. LINE WORK: Exact line thickness (hairline/thin/medium/thick/bold), stroke style (solid/dashed), corner treatment (sharp 90°/slightly rounded/fully rounded/pill-shaped), outline presence and color.

3. SHADING & DEPTH: Flat with no shading? Subtle gradients? Strong 3D with cast shadows? Cel-shaded with hard edges? Long shadows? Inner shadows? Highlight placement?

4. RENDERING TECHNIQUE: Vector/raster look? Minimalist/detailed? Geometric/organic? Illustrated/realistic? Glyph-style/filled?

5. PERSPECTIVE & COMPOSITION: Front-facing/isometric/3/4 view? Centered? How much padding around the subject?

6. SHAPE CHARACTERISTICS: Rounded shapes vs angular? Geometric primitives or organic forms? Thick chunky forms or delicate thin elements?

7. TEXTURE: Smooth/grainy/noisy? Any patterns?

8. BACKGROUND: Transparent/solid color/gradient? If colored, what color?

Write this as a single detailed paragraph that serves as EXACT INSTRUCTIONS for generating a matching icon. Be extremely specific - imagine you're writing a specification that an artist must follow precisely.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: analysisPrompt }
        ]
      }
    ]
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No style analysis generated');
  }

  const parts = candidates[0].content?.parts;
  if (!parts) {
    throw new Error('No content in style analysis');
  }

  // Extract text response
  for (const part of parts) {
    if (part.text) {
      return part.text;
    }
  }

  throw new Error('No text in style analysis response');
}

/**
 * Generates an icon using Gemini 3 Pro Image (most powerful model for style consistency)
 * @param prompt - Description of what the icon should represent
 * @param styleDescription - Optional custom style description (e.g., "flat minimalist", "3D realistic", "cartoon style")
 * @param referenceImage - Optional reference image (base64 data URL) to match style
 */
export async function generateIcon(
  prompt: string,
  styleDescription: string = '',
  referenceImage?: string
): Promise<IconGenerationResult> {
  const ai = getGenAI();

  // Build the prompt based on whether we have a reference image
  let enhancedPrompt: string;
  let analyzedStyle: string | null = null;

  if (referenceImage) {
    // Step 1: Analyze the reference image to extract detailed style description
    try {
      console.log('=== ICON GENERATION WITH REFERENCE ===');
      console.log('Subject prompt:', prompt);
      console.log('User style description:', styleDescription || '(none)');
      console.log('Reference image size:', Math.round(referenceImage.length / 1024), 'KB');
      console.log('Analyzing reference icon style...');
      analyzedStyle = await analyzeIconStyle(referenceImage);
      console.log('=== STYLE ANALYSIS RESULT ===');
      console.log(analyzedStyle);
      console.log('=== END STYLE ANALYSIS ===');
    } catch (error) {
      console.warn('Style analysis failed, will use image directly:', error);
      analyzedStyle = null;
    }
  }

  // Build prompt based on available information
  const additionalNotes = styleDescription.trim()
    ? `\nUser's additional style notes: ${styleDescription.trim()}`
    : '';

  if (referenceImage) {
    // With reference image - use both analyzed style AND the image for best results
    const styleSpec = analyzedStyle
      ? `\n\nDETAILED STYLE ANALYSIS OF THE REFERENCE:\n${analyzedStyle}`
      : '';

    // Structure prompt to emphasize style transfer
    enhancedPrompt = `TASK: Style Transfer Icon Generation

I am providing a REFERENCE ICON image. Your task is to create a NEW icon depicting "${prompt}" that looks like it was created by the SAME DESIGNER using the EXACT SAME visual style.

CRITICAL INSTRUCTION: Do NOT create a generic icon. The generated icon must be visually IDENTICAL in style to the reference - as if both icons came from the same icon pack or design system.
${styleSpec}${additionalNotes}

MANDATORY STYLE ELEMENTS TO COPY FROM REFERENCE:
1. COLOR SCHEME: Use the exact same colors (match hue, saturation, brightness precisely)
2. LINE WEIGHT: Match the exact stroke thickness and line quality
3. CORNER RADIUS: Copy the exact roundness/sharpness of corners
4. SHADING/GRADIENT: Replicate the exact lighting and depth style
5. FILL STYLE: Match solid fills, gradients, or transparency exactly
6. ICON DENSITY: Match how detailed/simple the icon is
7. PROPORTIONS: Match the visual weight and balance

OUTPUT: A new icon of "${prompt}" that is STYLISTICALLY IDENTICAL to the reference icon.

Format: Square, centered, no text.`;
  } else {
    // Standard prompt without reference
    const styleText = styleDescription.trim()
      ? `Style: ${styleDescription.trim()}.`
      : 'Style: clean, professional, modern icon design.';

    enhancedPrompt = `Create a simple icon for: ${prompt}.
${styleText}
Requirements:
- Square format, centered design
- Simple, recognizable symbol
- Clean white or light solid background
- Professional quality suitable for a web application
- No text or labels in the icon
- Single focused subject
- High contrast for visibility at small sizes`;
  }

  try {
    // Build content array
    let contents: any[];

    if (referenceImage) {
      // Always include reference image when available - Gemini 3 Pro handles it better
      const matches = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];

        // Put INSTRUCTIONS first, then the REFERENCE IMAGE
        // This way the model reads the task before seeing the reference
        contents = [
          {
            role: 'user',
            parts: [
              { text: enhancedPrompt },
              { text: "\n\nREFERENCE ICON (match this style exactly):" },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ];
      } else {
        contents = [
          {
            role: 'user',
            parts: [{ text: enhancedPrompt }]
          }
        ];
      }
    } else {
      contents = [
        {
          role: 'user',
          parts: [{ text: enhancedPrompt }]
        }
      ];
    }

    // Log the final prompt being sent
    console.log('=== FINAL GENERATION PROMPT ===');
    console.log(enhancedPrompt);
    console.log('=== END PROMPT ===');
    console.log('Including reference image in request:', referenceImage ? 'YES' : 'NO');
    console.log('Using model: gemini-3-pro-image-preview');

    // Use Gemini 3 Pro Image - most powerful model for style consistency
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: contents,
      config: {
        responseModalities: ['IMAGE'],
        // Request square 1:1 aspect ratio for icons
        // Note: Gemini may not always honor this but it's a hint
      }
    });

    console.log('=== GENERATION RESPONSE RECEIVED ===');
    console.log('Response candidates:', response.candidates?.length || 0);

    // Extract image data from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No response generated from AI');
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      throw new Error('No content parts in response');
    }

    for (const part of parts) {
      if (part.inlineData) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }

    throw new Error('No image data in response');
  } catch (error) {
    console.error('Icon generation error:', error);
    throw new Error(`Failed to generate icon: ${(error as Error).message}`);
  }
}

/**
 * Generates multiple icons for multiple choice options
 * @param context - The question/context for the icons (e.g., "Select your flooring type")
 * @param options - Array of options with id and label
 * @param styleDescription - Optional custom style description for all icons
 * @param referenceImage - Optional reference image (base64 data URL) to match style for all icons
 */
export async function generateBulkIcons(
  context: string,
  options: Array<{ id: string; label: string }>,
  styleDescription: string = '',
  referenceImage?: string
): Promise<BulkGenerationResult> {
  const results: BulkIconResult[] = [];
  const errors: BulkIconError[] = [];

  // Process in batches of 3 to avoid rate limiting
  const batchSize = 3;

  for (let i = 0; i < options.length; i += batchSize) {
    const batch = options.slice(i, i + batchSize);

    const batchPromises = batch.map(async (option) => {
      try {
        const prompt = `${option.label} - related to: ${context}`;
        const result = await generateIcon(prompt, styleDescription, referenceImage);
        return {
          success: true as const,
          optionId: option.id,
          imageBase64: result.imageBase64,
          mimeType: result.mimeType
        };
      } catch (error) {
        return {
          success: false as const,
          optionId: option.id,
          error: (error as Error).message
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    for (const result of batchResults) {
      if (result.success) {
        results.push({
          optionId: result.optionId,
          imageBase64: result.imageBase64,
          mimeType: result.mimeType
        });
      } else {
        errors.push({
          optionId: result.optionId,
          error: result.error
        });
      }
    }

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < options.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { images: results, errors };
}
