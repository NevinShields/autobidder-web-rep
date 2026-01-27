import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageFile } from '../types';

export const generateIcon = async (
  stylePrompt: string,
  styleImage: ImageFile | null,
  contentPrompt: string,
  contentImage: ImageFile | null
): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const basePromptParts: any[] = [];
  
  if (styleImage) {
    basePromptParts.push({ text: "STYLE REFERENCE IMAGE (Extract the aesthetic directly from this):" });
    basePromptParts.push({
      inlineData: {
        mimeType: styleImage.mimeType,
        data: styleImage.data,
      },
    });
  }

  if (contentImage) {
    basePromptParts.push({ text: "FORM/SUBJECT REFERENCE IMAGE (Follow this shape/composition):" });
    basePromptParts.push({
      inlineData: {
        mimeType: contentImage.mimeType,
        data: contentImage.data,
      },
    });
  }
  
  const mainPrompt = `
You are a professional digital asset creator. Your task is to generate a high-fidelity icon strictly following the user's provided style and subject.

**SUBJECT**: "${contentPrompt}"
**STYLE**: "${stylePrompt}"

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

  const generationPromises = Array(4).fill(0).map(async (_, i) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [...basePromptParts, { text: `Variation ${i + 1}` }] },
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) throw new Error("Failed to generate image variation.");
    return part.inlineData.data;
  });

  return Promise.all(generationPromises);
};

export const refineIcon = async (
  baseIconData: string,
  refinementPrompt: string,
  originalStylePrompt: string,
  originalStyleImage: ImageFile | null
): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const promptParts: any[] = [];
  
  if (originalStyleImage) {
    promptParts.push({ text: "ORIGINAL STYLE CONTEXT:" });
    promptParts.push({
      inlineData: { mimeType: originalStyleImage.mimeType, data: originalStyleImage.data },
    });
  }
  
  promptParts.push({ text: "CURRENT ICON VERSION:" });
  promptParts.push({
    inlineData: { mimeType: 'image/png', data: baseIconData },
  });
  
  const mainPrompt = `
**USER REFINEMENT REQUEST:** "${refinementPrompt}"

**INSTRUCTIONS:**
1. Modify the current icon based on the feedback while strictly maintaining the user's requested style: "${originalStylePrompt}".
2. **NO TEXT**: Ensure there are no words, letters, or numbers in the refined versions.
3. **MAXIMIZE SIZE**: Ensure the refined icon continues to fill the majority of the frame with minimal black padding.
4. Continue to use a SOLID PURE BLACK BACKGROUND (#000000).
5. Output 4 refined variations.
  `;

  promptParts.push({ text: mainPrompt });

  const refinementPromises = Array(4).fill(0).map(async (_, i) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [...promptParts, { text: `Refined Variation ${i + 1}` }] },
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) throw new Error("Refinement failed.");
    return part.inlineData.data;
  });

  return Promise.all(refinementPromises);
};