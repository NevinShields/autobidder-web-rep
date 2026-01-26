import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";

export interface BackgroundRemovalResult {
  blob: Blob;
  dataUrl: string;
}

/**
 * Removes background from an image using @imgly/background-removal
 * Runs entirely in browser via WebAssembly - no server costs
 */
export async function removeBackground(
  imageSource: string | Blob | ArrayBuffer
): Promise<BackgroundRemovalResult> {
  try {
    // Remove background using imgly library
    const blob = await imglyRemoveBackground(imageSource, {
      output: {
        format: "image/png",
        quality: 0.9
      }
    });

    // Convert blob to data URL for display/storage
    const dataUrl = await blobToDataUrl(blob);

    return { blob, dataUrl };
  } catch (error) {
    console.error('Background removal failed:', error);
    throw new Error(`Failed to remove background: ${(error as Error).message}`);
  }
}

/**
 * Converts a base64 string to a Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  // Handle data URL format
  let base64Data = base64;
  if (base64.startsWith('data:')) {
    const parts = base64.split(',');
    base64Data = parts[1];
    // Extract mime type from data URL if present
    const mimeMatch = parts[0].match(/data:([^;]+)/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
  }

  const byteCharacters = atob(base64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Converts a Blob to a data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Processes an image from base64, removes background, and returns data URL
 * This is the main function to use for icon processing
 */
export async function processIconWithBackgroundRemoval(
  base64Image: string,
  mimeType: string = 'image/png'
): Promise<string> {
  // Convert base64 to data URL format if needed
  let dataUrl = base64Image;
  if (!base64Image.startsWith('data:')) {
    dataUrl = `data:${mimeType};base64,${base64Image}`;
  }

  // Remove background
  const result = await removeBackground(dataUrl);

  return result.dataUrl;
}
