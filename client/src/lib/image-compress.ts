/**
 * Resizes and compresses an image File or data URL using a canvas.
 * Returns a base64 data URL suitable for storage.
 *
 * @param source  A File, Blob, or existing data URL string
 * @param maxWidth  Maximum output width in pixels (default 256 for icons, 800 for card images)
 * @param maxHeight Maximum output height in pixels
 * @param quality  JPEG/WebP quality 0–1 (default 0.75)
 */
export async function compressImage(
  source: File | Blob | string,
  maxWidth = 256,
  maxHeight = 256,
  quality = 0.75
): Promise<string> {
  const dataUrl = typeof source === 'string'
    ? source
    : await readAsDataUrl(source);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width: origW, height: origH } = img;

      // Scale to fit within maxWidth × maxHeight while preserving aspect ratio
      const scale = Math.min(1, maxWidth / origW, maxHeight / origH);
      const w = Math.round(origW * scale);
      const h = Math.round(origH * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fall back to the original if canvas is unavailable
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      // Prefer WebP for smaller size; fall back to JPEG
      const outputType = canvas.toDataURL('image/webp').startsWith('data:image/webp')
        ? 'image/webp'
        : 'image/jpeg';

      const compressed = canvas.toDataURL(outputType, quality);

      // Only use the compressed version if it's actually smaller
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}
