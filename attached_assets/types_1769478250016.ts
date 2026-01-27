
export interface ImageFile {
  base64: string; // Full data URL for <img> src
  mimeType: string;
  data: string; // The raw base64 data for the API
}
