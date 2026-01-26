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

export type IconStyle = 'flat' | 'outlined' | 'gradient' | '3d';

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
 * Generates an icon using Gemini Nano Banana (gemini-2.5-flash-image)
 */
export async function generateIcon(
  prompt: string,
  style: IconStyle = 'flat'
): Promise<IconGenerationResult> {
  const ai = getGenAI();

  const styleDescriptions: Record<IconStyle, string> = {
    flat: 'flat design, minimal, solid colors, no shadows, clean vector style',
    outlined: 'outline style, thin lines, minimal fill, clean stroke design',
    gradient: 'gradient colors, smooth color transitions, modern gradient style',
    '3d': '3D rendered, slight depth, soft shadows, dimensional appearance'
  };

  const enhancedPrompt = `Create a simple icon for: ${prompt}.
Style: ${styleDescriptions[style]}.
Requirements:
- Square format, centered design
- Simple, recognizable symbol
- Clean white or light solid background
- Professional quality suitable for a web application
- No text or labels in the icon
- Single focused subject
- High contrast for visibility at small sizes`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: enhancedPrompt,
    });

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
 */
export async function generateBulkIcons(
  context: string,
  options: Array<{ id: string; label: string }>,
  style: IconStyle = 'flat'
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
        const result = await generateIcon(prompt, style);
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
