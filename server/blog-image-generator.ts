import OpenAI, { toFile } from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return null;
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export type BlogGeneratedImageType = "hero" | "team" | "before" | "after";

export interface GenerateSingleBlogImageInput {
  imageType: Exclude<BlogGeneratedImageType, "after"> | "after";
  prompt: string;
  serviceName?: string;
  targetCity?: string;
  businessName?: string;
  companyLogoUrl?: string;
}

export interface GenerateBeforeAfterPairInput {
  scenePrompt: string;
  beforeStatePrompt: string;
  afterStatePrompt: string;
  serviceName?: string;
  targetCity?: string;
  businessName?: string;
}

export interface GeneratedBlogImageAsset {
  imageType: BlogGeneratedImageType;
  caption: string;
  mimeType: string;
  buffer: Buffer;
}

function buildRealismDirectives(): string {
  return [
    "Style: highly photorealistic documentary photography.",
    "Use realistic materials, textures, shadows, and natural lighting.",
    "Do not make the image look like CGI, illustration, concept art, or a stock montage.",
    "No text overlays, no watermarks, no split screens, no collage layout, no labels baked into the image.",
    "Keep perspective physically plausible and service results believable.",
  ].join(" ");
}

function buildBrandingDirectives(input: {
  imageType: BlogGeneratedImageType;
  businessName?: string;
  companyLogoUrl?: string;
}): string {
  if (input.imageType !== "team") {
    return "";
  }

  const businessName = input.businessName?.trim();
  const hasLogoReference = Boolean(input.companyLogoUrl?.trim());

  if (!businessName && !hasLogoReference) {
    return "";
  }

  return [
    "Branding: make the crew look like they belong to the same real local company.",
    businessName ? `Use ${businessName} as the company name for believable shirt, jacket, hat, or vehicle branding.` : "",
    hasLogoReference
      ? "A company logo reference exists. Recreate it only as a small, realistic branded mark on uniforms, safety gear, or vehicle signage if it fits naturally in the scene."
      : "",
    "Keep the logo or branding subtle, physically plausible, and consistent across visible crew members. Do not turn the image into an ad or graphic mockup.",
  ].filter(Boolean).join(" ");
}

function buildSinglePrompt(input: GenerateSingleBlogImageInput): string {
  const roleMap: Record<BlogGeneratedImageType, string> = {
    hero: "hero image",
    team: "crew / team image",
    before: "before-service example image",
    after: "after-service example image",
  };

  const context = [
    input.serviceName ? `Service: ${input.serviceName}.` : "",
    input.targetCity ? `Location context: ${input.targetCity}.` : "",
  ].filter(Boolean).join(" ");

  return [
    `Create one ${roleMap[input.imageType]} for a service business blog post.`,
    context,
    buildRealismDirectives(),
    buildBrandingDirectives({
      imageType: input.imageType,
      businessName: input.businessName,
      companyLogoUrl: input.companyLogoUrl,
    }),
    input.imageType === "team"
      ? "If people appear, they should look like a real crew candidly working or preparing to work. Avoid uncanny faces, exaggerated smiles, or staged corporate stock-photo posing."
      : "",
    input.imageType === "hero"
      ? "Compose it like a polished website hero image that will look strong above the fold on screen. Use a wide horizontal composition, clear focal subject, balanced negative space, and framing that survives responsive cropping on desktop and mobile. Avoid overly tight close-ups, awkward edge crops, and clutter near the margins."
      : "",
    input.prompt.trim(),
  ].filter(Boolean).join("\n\n");
}

function buildBeforePrompt(input: GenerateBeforeAfterPairInput): string {
  const context = [
    input.serviceName ? `Service: ${input.serviceName}.` : "",
    input.targetCity ? `Location context: ${input.targetCity}.` : "",
  ].filter(Boolean).join(" ");

  return [
    "Create a photorealistic BEFORE image for a service business before/after comparison.",
    context,
    buildRealismDirectives(),
    "Show the untreated condition only. The scene must feel like a real property photo taken by a professional with a stable camera.",
    "Important: compose the scene in a way that can later be turned into an AFTER image from the exact same viewpoint.",
    `Base scene: ${input.scenePrompt.trim()}`,
    `Before condition to show: ${input.beforeStatePrompt.trim()}`,
  ].join("\n\n");
}

function buildAfterEditPrompt(input: GenerateBeforeAfterPairInput): string {
  const context = [
    input.serviceName ? `Service performed: ${input.serviceName}.` : "",
    input.targetCity ? `Location context: ${input.targetCity}.` : "",
  ].filter(Boolean).join(" ");

  return [
    "Edit the provided BEFORE image into a photorealistic AFTER image.",
    context,
    buildRealismDirectives(),
    "Keep the exact same camera angle, framing, architecture, hardscape, objects, weather, and overall scene composition.",
    "Only change what would realistically be changed by the service result. Do not move objects or alter the property layout.",
    `Base scene: ${input.scenePrompt.trim()}`,
    `After condition to show: ${input.afterStatePrompt.trim()}`,
  ].join("\n\n");
}

function getPreferredImageSize(imageType: BlogGeneratedImageType): "1536x1024" | "1024x1536" | "1024x1024" {
  if (imageType === "hero" || imageType === "before" || imageType === "after") {
    return "1536x1024";
  }

  return "1024x1024";
}

async function generateImageBuffer(prompt: string, imageType: BlogGeneratedImageType): Promise<Buffer> {
  const client = getOpenAI();
  if (!client) {
    throw new Error("OPENAI_API_KEY is not configured for image generation");
  }

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    size: getPreferredImageSize(imageType),
    quality: "high",
    output_format: "png",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image generation returned no image data");
  }

  return Buffer.from(b64, "base64");
}

async function editImageBuffer(source: Buffer, prompt: string, imageType: BlogGeneratedImageType): Promise<Buffer> {
  const client = getOpenAI();
  if (!client) {
    throw new Error("OPENAI_API_KEY is not configured for image generation");
  }

  const file = await toFile(source, "before.png", { type: "image/png" });
  const response = await client.images.edit({
    model: "gpt-image-1",
    image: file,
    prompt,
    size: getPreferredImageSize(imageType),
    quality: "high",
    output_format: "png",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image edit returned no image data");
  }

  return Buffer.from(b64, "base64");
}

export async function generateSingleBlogImage(input: GenerateSingleBlogImageInput): Promise<GeneratedBlogImageAsset> {
  const prompt = buildSinglePrompt(input);
  const buffer = await generateImageBuffer(prompt, input.imageType);

  return {
    imageType: input.imageType,
    caption: input.imageType === "team" ? "AI-generated crew image" : `AI-generated ${input.imageType} image`,
    mimeType: "image/png",
    buffer,
  };
}

export async function generateBeforeAfterPair(input: GenerateBeforeAfterPairInput): Promise<GeneratedBlogImageAsset[]> {
  const beforeBuffer = await generateImageBuffer(buildBeforePrompt(input), "before");
  const afterBuffer = await editImageBuffer(beforeBuffer, buildAfterEditPrompt(input), "after");

  return [
    {
      imageType: "before",
      caption: "AI-generated before image",
      mimeType: "image/png",
      buffer: beforeBuffer,
    },
    {
      imageType: "after",
      caption: "AI-generated after image",
      mimeType: "image/png",
      buffer: afterBuffer,
    },
  ];
}
