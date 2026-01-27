import { GoogleGenAI, Modality } from "@google/genai";

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

interface MultiIconGenerationResult {
  images: Array<{ imageBase64: string; mimeType: string }>;
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
 * Generates 4 icon variations using Gemini's image generation model
 * Uses direct image-to-image approach for better style matching
 * @param prompt - Description of what the icon should represent
 * @param styleDescription - Optional custom style description
 * @param referenceImage - Optional reference image (base64 data URL) to match style
 * @param variationCount - Number of variations to generate (default 4)
 */
export async function generateIconVariations(
  prompt: string,
  styleDescription: string = '',
  referenceImage?: string,
  variationCount: number = 4
): Promise<MultiIconGenerationResult> {
  const ai = getGenAI();

  // Build prompt parts array (similar to the new icon-generator approach)
  const basePromptParts: any[] = [];

  // Add reference image directly if provided (no text conversion step)
  if (referenceImage) {
    const matches = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const mimeType = matches[1];
      const base64Data = matches[2];

      basePromptParts.push({ text: "STYLE REFERENCE IMAGE (Extract the aesthetic directly from this):" });
      basePromptParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }
  }

  // Build the main prompt with strict rendering requirements
  const styleText = styleDescription.trim() || 'clean, professional, modern icon design';

  const mainPrompt = `
You are a professional digital asset creator. Your task is to generate a high-fidelity icon strictly following the user's provided style and subject.

**SUBJECT**: "${prompt}"
**STYLE**: "${styleText}"

**CRITICAL RENDERING REQUIREMENTS:**
1. **NO TEXT**: Do not include any words, letters, numbers, or typographical characters of any kind. The icon must be a pure visual symbol or object.
2. **STRICT ADHERENCE**: Do not add any artistic themes (like western or modern) unless specified in the prompt above.
3. **MAXIMIZE SIZE**: The icon subject must be LARGE and prominent. It MUST fill at least 90% of the image frame. Use only a very narrow, minimal black border (approx 5%) on all sides.
4. **ISOLATION**: The icon MUST be rendered on a PURE, SOLID, FLAT BLACK BACKGROUND (#000000).
5. **NO BACKGROUND TEXTURE**: The black background must be 100% solid with zero gradients, noise, or lighting effects.
6. **NO CHECKERBOARDS**: Never draw a transparency grid or checkerboard pattern.
7. **QUALITY**: Use studio-quality rendering. If the style is 3D, use cinematic lighting. If it is 2D, use clean vector-style lines.
8. **CENTERED**: The object must be centered.
  `;

  basePromptParts.push({ text: mainPrompt });

  // Generate multiple variations in parallel
  const generationPromises = Array(variationCount).fill(0).map(async (_, i) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation',
        contents: { parts: [...basePromptParts, { text: `Variation ${i + 1}` }] },
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (!part?.inlineData?.data) {
        throw new Error(`Failed to generate variation ${i + 1}`);
      }

      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      };
    } catch (error) {
      console.error(`Variation ${i + 1} failed:`, error);
      throw error;
    }
  });

  const results = await Promise.allSettled(generationPromises);
  const successfulImages = results
    .filter((r): r is PromiseFulfilledResult<{ imageBase64: string; mimeType: string }> => r.status === 'fulfilled')
    .map(r => r.value);

  if (successfulImages.length === 0) {
    throw new Error('Failed to generate any icon variations');
  }

  return { images: successfulImages };
}

/**
 * Refines an existing icon based on user feedback
 * @param baseIconData - Base64 data of the icon to refine
 * @param refinementPrompt - User's refinement instructions
 * @param originalStyleDescription - Original style description for context
 * @param originalReferenceImage - Original reference image for style consistency
 */
export async function refineIcon(
  baseIconData: string,
  refinementPrompt: string,
  originalStyleDescription: string = '',
  originalReferenceImage?: string
): Promise<MultiIconGenerationResult> {
  const ai = getGenAI();

  const promptParts: any[] = [];

  // Add original style reference if available
  if (originalReferenceImage) {
    const matches = originalReferenceImage.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      promptParts.push({ text: "ORIGINAL STYLE CONTEXT:" });
      promptParts.push({
        inlineData: { mimeType: matches[1], data: matches[2] }
      });
    }
  }

  // Add current icon version
  promptParts.push({ text: "CURRENT ICON VERSION:" });
  promptParts.push({
    inlineData: { mimeType: 'image/png', data: baseIconData }
  });

  const mainPrompt = `
**USER REFINEMENT REQUEST:** "${refinementPrompt}"

**INSTRUCTIONS:**
1. Modify the current icon based on the feedback while strictly maintaining the user's requested style: "${originalStyleDescription || 'professional icon design'}".
2. **NO TEXT**: Ensure there are no words, letters, or numbers in the refined versions.
3. **MAXIMIZE SIZE**: Ensure the refined icon continues to fill the majority of the frame with minimal black padding.
4. Continue to use a SOLID PURE BLACK BACKGROUND (#000000).
5. Output refined variations based on the feedback.
  `;

  promptParts.push({ text: mainPrompt });

  // Generate 4 refined variations
  const refinementPromises = Array(4).fill(0).map(async (_, i) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation',
        contents: { parts: [...promptParts, { text: `Refined Variation ${i + 1}` }] },
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (!part?.inlineData?.data) {
        throw new Error(`Refinement ${i + 1} failed`);
      }

      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      };
    } catch (error) {
      console.error(`Refinement ${i + 1} failed:`, error);
      throw error;
    }
  });

  const results = await Promise.allSettled(refinementPromises);
  const successfulImages = results
    .filter((r): r is PromiseFulfilledResult<{ imageBase64: string; mimeType: string }> => r.status === 'fulfilled')
    .map(r => r.value);

  if (successfulImages.length === 0) {
    throw new Error('Failed to generate any refined variations');
  }

  return { images: successfulImages };
}

/**
 * Legacy single-icon generation for backwards compatibility
 * Internally uses generateIconVariations and returns the first result
 */
export async function generateIcon(
  prompt: string,
  styleDescription: string = '',
  referenceImage?: string
): Promise<IconGenerationResult> {
  const result = await generateIconVariations(prompt, styleDescription, referenceImage, 1);
  return result.images[0];
}

/**
 * Generates multiple icons for multiple choice options
 * Uses the improved generation approach with better style matching
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
        // Use the new generateIcon which internally uses the improved approach
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
