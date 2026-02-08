import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { BlogContentSection, BlogComplianceFlags, SeoChecklistItem, BlogLayoutSection, BlogInternalLink } from "@shared/schema";

// AI Provider initialization
let claude: Anthropic | null = null;
let gemini: GoogleGenAI | null = null;
let openai: OpenAI | null = null;

function getClaude(): Anthropic | null {
  if (!claude) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    claude = new Anthropic({ apiKey });
  }
  return claude;
}

function getGemini(): GoogleGenAI | null {
  if (!gemini) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    gemini = new GoogleGenAI({ apiKey });
  }
  return gemini;
}

function getOpenAI(): OpenAI | null {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Types
export interface BlogGenerationInput {
  blogType: string; // "job_showcase", "expert_opinion", "seasonal_tip", "faq_educational"
  serviceName: string;
  serviceDescription?: string;
  targetCity: string;
  targetNeighborhood?: string;
  targetKeyword?: string;
  goal: string; // "rank_seo", "educate", "convert"
  primaryServiceId?: number | null;
  workOrderId?: number | null;
  jobNotes?: string;
  layoutTemplateId?: number | null;
  jobData?: {
    title: string;
    customerAddress: string;
    completedDate: string;
    notes?: string;
    images: string[];
  };
  talkingPoints: string[];
  tonePreference: string; // "professional", "friendly", "technical"
  layoutTemplate: BlogLayoutSection[];
  images?: BlogImageRenderInput[];
  internalLinks?: BlogInternalLink[];
  videoUrl?: string;
  facebookPostUrl?: string;
  gmbPostUrl?: string;
  ctaButtonEnabled?: boolean | null;
  ctaButtonUrl?: string | null;
}

export interface BlogImageRenderInput {
  url: string;
  imageType: string;
  caption?: string;
  imageStyle?: string;
}

export interface KeywordSuggestionInput {
  targetKeyword: string;
  targetCity?: string;
  blogType?: string;
  tonePreference?: string;
  serviceName?: string;
}

export interface KeywordSuggestionOutput {
  talkingPoints: string[];
  contextSummary: string;
  angleIdeas: string[];
}

export interface BlogGenerationOutput {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: BlogContentSection[];
  suggestedSlug: string;
  seoScore: number;
  seoChecklist: SeoChecklistItem[];
}

const BLOG_FAQ_MIN_DEFAULT = 4;
const BLOG_FAQ_TARGET_DEFAULT = 5;

export interface SectionRegenerateInput {
  sectionType: string;
  existingContent: BlogContentSection[];
  blogType: string;
  serviceName: string;
  targetCity: string;
  tonePreference: string;
  context?: string;
}

// Blog generation system prompt
function getBlogSystemPrompt(input: BlogGenerationInput): string {
  const primaryKeyword = (input.targetKeyword || input.serviceName || "").trim();
  const blogTypeDescriptions: Record<string, string> = {
    job_showcase: "a case study showcasing a completed job with before/after details and results",
    expert_opinion: "an expert opinion piece establishing authority on a topic in your industry",
    seasonal_tip: "seasonal tips and advice relevant to homeowners in the area",
    faq_educational: "an educational FAQ-style post answering common customer questions"
  };

  const toneDescriptions: Record<string, string> = {
    professional: "professional, authoritative, and trustworthy",
    friendly: "warm, approachable, and conversational",
    technical: "detailed, technical, and informative"
  };

  const goalDescriptions: Record<string, string> = {
    rank_seo: "ranking well in local search results for the target location",
    educate: "educating potential customers about the service",
    convert: "converting readers into leads with strong calls to action"
  };

return `You are an expert SEO content writer specializing in local service businesses.
Create ${blogTypeDescriptions[input.blogType] || "a blog post"} for a ${input.serviceName} business.

PRIMARY SEO KEYWORD: ${primaryKeyword}

TARGET LOCATION: ${input.targetCity}${input.targetNeighborhood ? `, specifically the ${input.targetNeighborhood} area` : ""}

TONE: Write in a ${toneDescriptions[input.tonePreference] || "professional"} tone.

PRIMARY GOAL: The content should focus on ${goalDescriptions[input.goal] || "providing value to readers"}.

${input.serviceDescription ? `SERVICE DESCRIPTION: ${input.serviceDescription}` : ""}

${input.jobData ? `
JOB DETAILS TO REFERENCE:
- Job Title: ${input.jobData.title}
- Location: ${input.jobData.customerAddress}
- Completed: ${input.jobData.completedDate}
${input.jobData.notes ? `- Notes: ${input.jobData.notes}` : ""}
${input.jobData.images.length > 0 ? `- Images available: ${input.jobData.images.length} photos` : ""}
` : ""}

${input.jobNotes?.trim() ? `
USER NOTES AND CONSTRAINTS (HIGHEST PRIORITY):
${input.jobNotes.trim()}
` : ""}

${input.images && input.images.length > 0 ? `
IMAGES PROVIDED BY THE USER — embed these in the content using the exact placeholder format {{IMAGE:<type>}}:
${input.images.map(img => `- {{IMAGE:${img.imageType}}} — "${img.caption || img.imageType + ' image'}"`).join("\n")}
Place these image placeholders in appropriate locations within the content. For example, place {{IMAGE:hero}} near the top, {{IMAGE:before}} in the before section, {{IMAGE:after}} in the after section, etc.
Use every provided image placeholder at least once. Do not omit uploaded images.
` : ""}

${input.talkingPoints.length > 0 ? `
MANDATORY TALKING POINTS (cover every point directly in final content):
${input.talkingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}
` : ""}

${input.internalLinks && input.internalLinks.length > 0 ? `
INTERNAL LINKS TO INCLUDE NATURALLY IN RELEVANT SECTIONS:
${input.internalLinks.map((link, i) => `${i + 1}. ${link.anchorText}: ${link.url}`).join("\n")}
` : ""}

${input.videoUrl ? `VIDEO URL TO REFERENCE IN THE CONTENT: ${input.videoUrl}` : ""}
${input.facebookPostUrl ? `FACEBOOK POST URL TO REFERENCE IN THE CONTENT: ${input.facebookPostUrl}` : ""}
${input.gmbPostUrl ? `GOOGLE BUSINESS PROFILE POST URL TO REFERENCE IN THE CONTENT: ${input.gmbPostUrl}` : ""}

REQUIRED SECTIONS (based on template):
${input.layoutTemplate.map(s => `- ${s.label} (${s.type})${s.required ? " [REQUIRED]" : ""}`).join("\n")}

GUIDANCE ADHERENCE REQUIREMENTS:
1. Treat USER NOTES AND CONSTRAINTS as factual project context. Do not ignore, contradict, or replace them with generic filler.
2. Cover every MANDATORY TALKING POINT explicitly in the written content.
3. When details are uncertain, keep claims conservative and aligned with user-provided notes.

SEO REQUIREMENTS:
1. Include the target city/location naturally throughout the content (2-4 times)
2. Use the PRIMARY SEO KEYWORD in the title and first paragraph
3. Include relevant keywords naturally
4. Write a compelling meta title (50-60 characters) and meta description (150-160 characters)
5. Create a URL-friendly slug
6. Aim for 800-1500 words total
7. If an FAQ section is included, provide 4-5 useful question/answer pairs

COMPLIANCE REQUIREMENTS:
- Avoid absolute claims like "best", "guaranteed", "always works"
- Include appropriate disclaimers for results
- Add safety warnings where relevant to the service
- Include credibility indicators (experience, certifications mentioned if relevant)

Respond with a JSON object containing:
{
  "title": "Blog post title",
  "metaTitle": "SEO meta title (50-60 chars)",
  "metaDescription": "SEO meta description (150-160 chars)",
  "excerpt": "Brief excerpt for previews (100-150 chars)",
  "suggestedSlug": "url-friendly-slug",
  "content": [
    {
      "id": "unique-id",
      "type": "section-type",
      "content": { section-specific content },
      "isLocked": false
    }
  ]
}

SECTION CONTENT FORMATS:
- hero: { "headline": "...", "subheadline": "...", "imageUrl": null }
- text: { "heading": "...", "body": "..." }
- job_summary: { "projectType": "...", "location": "...", "duration": "...", "highlights": ["..."] }
- before_after: { "beforeDescription": "...", "afterDescription": "...", "improvements": ["..."] }
- process_timeline: { "steps": [{ "title": "...", "description": "...", "duration": "..." }] }
- pricing_factors: { "intro": "...", "factors": [{ "name": "...", "description": "...", "impact": "low|medium|high" }] }
- faq: { "questions": [{ "question": "...", "answer": "..." }] }
- cta: { "heading": "...", "body": "...", "buttonText": "...", "buttonUrl": null }`;
}

// Main generation function with provider fallback
export async function generateBlogContent(input: BlogGenerationInput): Promise<BlogGenerationOutput> {
  const providers = [
    { name: 'OpenAI', fn: () => generateWithOpenAI(input) },
    { name: 'Claude', fn: () => generateWithClaude(input) },
    { name: 'Gemini', fn: () => generateWithGemini(input) }
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`📝 Attempting blog generation with ${provider.name}...`);
      const result = await provider.fn();
      if (result) {
        console.log(`✅ Blog generated successfully with ${provider.name}`);
        const contentWithGuaranteedImages = ensureUploadedImagesInContent(result.content, input.images);
        const contentWithDefaultFaqs = ensureDefaultFaqEntries(contentWithGuaranteedImages, input);
        const contentWithGuidance = ensureUserGuidanceCoverage(contentWithDefaultFaqs, input);
        const normalizedResult = {
          ...result,
          content: contentWithGuidance
        };

        // Calculate SEO score and checklist
        const { score, checklist } = calculateSeoScore(normalizedResult, input);
        return {
          ...normalizedResult,
          seoScore: score,
          seoChecklist: checklist
        };
      }
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('All AI providers failed to generate blog content');
}

export async function suggestKeywordContext(input: KeywordSuggestionInput): Promise<KeywordSuggestionOutput> {
  const keyword = input.targetKeyword?.trim();
  if (!keyword) {
    throw new Error("targetKeyword is required");
  }

  const locationText = input.targetCity?.trim()
    ? `in ${input.targetCity.trim()}`
    : "for local customers";
  const serviceText = input.serviceName?.trim()
    ? `for a ${input.serviceName.trim()} business`
    : "for a local service business";
  const toneText = input.tonePreference?.trim() || "professional";

  const prompt = `You are a local SEO strategist. Generate low-friction blog planning ideas ${locationText} ${serviceText}.
Target keyword: "${keyword}"
Blog type: "${input.blogType || "general"}"
Tone: "${toneText}"

Return strictly JSON in this shape:
{
  "talkingPoints": ["..."],
  "contextSummary": "...",
  "angleIdeas": ["..."]
}

Rules:
- talkingPoints: 4-6 short, practical points that can each become a section
- contextSummary: 2-3 sentences the writer can paste as job/context notes
- angleIdeas: 3-5 compelling angles/headlines tied to the keyword
- Do not include markdown.`;

  const providers = [
    { name: 'OpenAI', fn: () => suggestWithOpenAI(prompt) },
    { name: 'Claude', fn: () => suggestWithClaude(prompt) },
    { name: 'Gemini', fn: () => suggestWithGemini(prompt) }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) return result;
    } catch (error) {
      console.error(`${provider.name} keyword suggestion failed:`, error);
    }
  }

  return buildFallbackKeywordSuggestions(keyword, input.targetCity);
}

// Claude implementation
async function generateWithClaude(input: BlogGenerationInput): Promise<Omit<BlogGenerationOutput, 'seoScore' | 'seoChecklist'> | null> {
  const client = getClaude();
  if (!client) return null;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: getBlogSystemPrompt(input)
      }
    ]
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return parseGenerationResponse(textContent.text);
}

// Gemini implementation
async function generateWithGemini(input: BlogGenerationInput): Promise<Omit<BlogGenerationOutput, 'seoScore' | 'seoChecklist'> | null> {
  const client = getGemini();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: getBlogSystemPrompt(input)
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text content in Gemini response');
  }

  return parseGenerationResponse(text);
}

// OpenAI implementation
async function generateWithOpenAI(input: BlogGenerationInput): Promise<Omit<BlogGenerationOutput, 'seoScore' | 'seoChecklist'> | null> {
  const client = getOpenAI();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: getBlogSystemPrompt(input)
      }
    ],
    max_tokens: 4096
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error('No text content in OpenAI response');
  }

  return parseGenerationResponse(text);
}

async function suggestWithClaude(prompt: string): Promise<KeywordSuggestionOutput | null> {
  const client = getClaude();
  if (!client) return null;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') return null;
  return parseKeywordSuggestionResponse(textContent.text);
}

async function suggestWithGemini(prompt: string): Promise<KeywordSuggestionOutput | null> {
  const client = getGemini();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });

  if (!response.text) return null;
  return parseKeywordSuggestionResponse(response.text);
}

async function suggestWithOpenAI(prompt: string): Promise<KeywordSuggestionOutput | null> {
  const client = getOpenAI();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return null;
  return parseKeywordSuggestionResponse(text);
}

// Parse AI response
function parseGenerationResponse(text: string): Omit<BlogGenerationOutput, 'seoScore' | 'seoChecklist'> {
  // Extract JSON from response (may be wrapped in markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.title || !parsed.content || !Array.isArray(parsed.content)) {
      throw new Error('Missing required fields in response');
    }

    // Ensure each content section has required fields
    const content: BlogContentSection[] = parsed.content.map((section: any, index: number) => ({
      id: section.id || `section-${index}`,
      type: section.type || 'text',
      content: section.content || {},
      isLocked: section.isLocked || false
    }));

    return {
      title: parsed.title,
      metaTitle: parsed.metaTitle || parsed.title.substring(0, 60),
      metaDescription: parsed.metaDescription || parsed.excerpt || '',
      excerpt: parsed.excerpt || '',
      content,
      suggestedSlug: parsed.suggestedSlug || generateSlug(parsed.title)
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error(`Failed to parse blog generation response: ${error}`);
  }
}

function parseKeywordSuggestionResponse(text: string): KeywordSuggestionOutput {
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  const talkingPoints = Array.isArray(parsed.talkingPoints)
    ? parsed.talkingPoints.map((item: any) => String(item).trim()).filter(Boolean).slice(0, 6)
    : [];
  const angleIdeas = Array.isArray(parsed.angleIdeas)
    ? parsed.angleIdeas.map((item: any) => String(item).trim()).filter(Boolean).slice(0, 5)
    : [];
  const contextSummary = typeof parsed.contextSummary === "string" ? parsed.contextSummary.trim() : "";

  if (talkingPoints.length === 0 || !contextSummary) {
    throw new Error("Invalid suggestion response format");
  }

  return { talkingPoints, contextSummary, angleIdeas };
}

function buildFallbackKeywordSuggestions(keyword: string, targetCity?: string): KeywordSuggestionOutput {
  const cityText = targetCity?.trim() ? ` in ${targetCity.trim()}` : "";
  return {
    talkingPoints: [
      `What ${keyword} includes and how it works`,
      `Common problems homeowners face with ${keyword}${cityText}`,
      `How to choose a reliable provider for ${keyword}`,
      `Typical timeline and what to expect during service`
    ],
    contextSummary: `This blog targets "${keyword}"${cityText} with practical, local guidance. Focus on real customer concerns, clear process expectations, and when to contact a professional.`,
    angleIdeas: [
      `${keyword}: What Homeowners Should Know`,
      `A Local Guide to ${keyword}${cityText}`,
      `How to Plan ${keyword} Without Surprises`
    ]
  };
}

// Generate URL slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

function ensureUploadedImagesInContent(
  content: BlogContentSection[],
  images?: BlogImageRenderInput[]
): BlogContentSection[] {
  if (!Array.isArray(images) || images.length === 0) return content;

  let clonedContent: BlogContentSection[];
  try {
    clonedContent = JSON.parse(JSON.stringify(content)) as BlogContentSection[];
  } catch {
    return content;
  }

  const uploadedImageTypes = images
    .filter((img): img is BlogImageRenderInput => !!img?.url)
    .map((img) => normalizeImageType(img.imageType));

  if (uploadedImageTypes.length === 0) {
    return clonedContent;
  }

  const existingByType = countImagePlaceholders(clonedContent);
  const placementCounters = new Map<string, number>();

  for (const imageType of uploadedImageTypes) {
    const existingCount = existingByType.get(imageType) || 0;
    if (existingCount > 0) {
      existingByType.set(imageType, existingCount - 1);
      continue;
    }

    const placeholder = `{{IMAGE:${imageType}}}`;
    placeImagePlaceholder(clonedContent, imageType, placeholder, placementCounters);
  }

  return clonedContent;
}

function ensureDefaultFaqEntries(
  content: BlogContentSection[],
  input: BlogGenerationInput
): BlogContentSection[] {
  const hasFaqSection = content.some((section) => section.type === "faq");
  if (!hasFaqSection) return content;

  let clonedContent: BlogContentSection[];
  try {
    clonedContent = JSON.parse(JSON.stringify(content)) as BlogContentSection[];
  } catch {
    return content;
  }

  for (const section of clonedContent) {
    if (section.type !== "faq") continue;

    const existing = normalizeFaqEntries((section as any)?.content?.questions);
    if (existing.length >= BLOG_FAQ_MIN_DEFAULT) continue;

    const fallbackFaqs = buildFallbackFaqEntries(input);
    const seenQuestions = new Set(existing.map((item) => item.question.trim().toLowerCase()));
    const nextQuestions = [...existing];

    for (const fallback of fallbackFaqs) {
      const key = fallback.question.trim().toLowerCase();
      if (!key || seenQuestions.has(key)) continue;
      nextQuestions.push(fallback);
      seenQuestions.add(key);
      if (nextQuestions.length >= BLOG_FAQ_TARGET_DEFAULT) break;
    }

    const sectionContent = (section.content && typeof section.content === "object")
      ? (section.content as Record<string, unknown>)
      : {};

    section.content = {
      ...sectionContent,
      questions: nextQuestions.slice(0, 12),
    };
  }

  return clonedContent;
}

function ensureUserGuidanceCoverage(
  content: BlogContentSection[],
  input: BlogGenerationInput
): BlogContentSection[] {
  const guidanceItems = buildGuidanceItems(input);
  if (guidanceItems.length === 0) return content;

  let clonedContent: BlogContentSection[];
  try {
    clonedContent = JSON.parse(JSON.stringify(content)) as BlogContentSection[];
  } catch {
    return content;
  }

  const serialized = normalizeGuidanceText(JSON.stringify(clonedContent));
  const missingItems = guidanceItems.filter((item) => {
    const normalizedItem = normalizeGuidanceText(item);
    return normalizedItem.length > 0 && !serialized.includes(normalizedItem);
  });

  if (missingItems.length === 0) {
    return clonedContent;
  }

  if (appendGuidanceToJobSummary(clonedContent, missingItems)) {
    return clonedContent;
  }

  appendGuidanceToTextSection(clonedContent, missingItems);
  return clonedContent;
}

function buildGuidanceItems(input: BlogGenerationInput): string[] {
  const items: string[] = [];
  const seen = new Set<string>();

  for (const point of input.talkingPoints || []) {
    const cleaned = String(point || "").trim();
    if (!cleaned) continue;
    const key = normalizeGuidanceText(cleaned);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(cleaned);
  }

  for (const noteLine of splitGuidanceNotes(input.jobNotes)) {
    const key = normalizeGuidanceText(noteLine);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(noteLine);
  }

  return items.slice(0, 10);
}

function splitGuidanceNotes(raw?: string): string[] {
  if (!raw || !raw.trim()) return [];

  const cleaned = raw
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, "").trim())
    .filter(Boolean);

  if (cleaned.length > 1) {
    return cleaned.slice(0, 5);
  }

  const single = cleaned[0];
  if (!single) return [];

  const sentenceParts = single
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 18);

  return sentenceParts.length > 0 ? sentenceParts.slice(0, 4) : [single];
}

function normalizeGuidanceText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function appendGuidanceToJobSummary(
  content: BlogContentSection[],
  missingItems: string[]
): boolean {
  const jobSummary = content.find((section) => section.type === "job_summary");
  if (!jobSummary || !jobSummary.content || typeof jobSummary.content !== "object") return false;

  const sectionContent = jobSummary.content as Record<string, unknown>;
  const highlights = Array.isArray(sectionContent.highlights)
    ? [...sectionContent.highlights.map((item) => String(item).trim()).filter(Boolean)]
    : [];
  const seenHighlights = new Set(highlights.map((item) => normalizeGuidanceText(item)));

  for (const item of missingItems) {
    const key = normalizeGuidanceText(item);
    if (!key || seenHighlights.has(key)) continue;
    highlights.push(item);
    seenHighlights.add(key);
  }

  jobSummary.content = {
    ...sectionContent,
    highlights: highlights.slice(0, 16),
  };

  return true;
}

function appendGuidanceToTextSection(
  content: BlogContentSection[],
  missingItems: string[]
): void {
  const guidanceText = missingItems
    .map((item) => (/[.!?]$/.test(item.trim()) ? item.trim() : `${item.trim()}.`))
    .join(" ");
  if (!guidanceText) return;

  const textSection = content.find((section) =>
    section.type === "text" &&
    section.content &&
    typeof section.content === "object"
  );

  if (textSection) {
    const sectionContent = textSection.content as Record<string, unknown>;
    const existingBody = typeof sectionContent.body === "string" ? sectionContent.body.trim() : "";
    textSection.content = {
      ...sectionContent,
      body: existingBody ? `${existingBody}\n\n${guidanceText}` : guidanceText,
    };
    return;
  }

  const guidanceSection: BlogContentSection = {
    id: `guidance-${content.length + 1}`,
    type: "text",
    content: {
      heading: "Project-Specific Details",
      body: guidanceText,
    },
    isLocked: false,
  };

  const ctaIndex = content.findIndex((section) => section.type === "cta");
  if (ctaIndex >= 0) {
    content.splice(ctaIndex, 0, guidanceSection);
    return;
  }

  content.push(guidanceSection);
}

function buildFallbackFaqEntries(input: BlogGenerationInput): BlogFaqEntry[] {
  const topic = (input.serviceName || input.targetKeyword || "this service").trim();
  const city = input.targetCity?.trim();
  const citySuffix = city ? ` in ${city}` : "";

  return [
    {
      question: `How do I know if I need ${topic}?`,
      answer: `Common signs include visible wear, performance issues, or recurring maintenance problems${citySuffix}. A quick inspection helps confirm what is needed.`,
    },
    {
      question: `How much does ${topic} usually cost${citySuffix}?`,
      answer: `Pricing depends on scope, property size, condition, and material requirements. The most accurate number comes from a local quote based on your specific project.`,
    },
    {
      question: `How long does a typical ${topic} project take?`,
      answer: `Smaller jobs are often completed in a single visit, while larger or more complex projects may take longer due to prep work, access, and weather conditions.`,
    },
    {
      question: `What should I do to prepare before service day?`,
      answer: `Clear access to work areas, move fragile items if needed, and share any property details in advance so the team can plan equipment and timing correctly.`,
    },
    {
      question: `Can I bundle this with other services to save time?`,
      answer: `Yes, bundling related services can reduce repeat setup and site visits, which often improves scheduling efficiency and overall value.`,
    },
  ];
}

function countImagePlaceholders(content: BlogContentSection[]): Map<string, number> {
  const counts = new Map<string, number>();
  const serialized = JSON.stringify(content);
  const pattern = /\{\{\s*IMAGE\s*:\s*([^}\s]+)\s*\}\}/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(serialized)) !== null) {
    const type = normalizeImageType(match[1]);
    counts.set(type, (counts.get(type) || 0) + 1);
  }
  return counts;
}

function findSectionByType(content: BlogContentSection[], type: BlogContentSection["type"]): BlogContentSection | undefined {
  return content.find((section) => section.type === type);
}

function appendToTextField(
  section: BlogContentSection,
  field: string,
  placeholder: string
): boolean {
  if (!section || typeof section.content !== "object" || !section.content) return false;
  const current = (section.content as any)[field];
  if (typeof current === "string" && current.includes(placeholder)) return true;
  if (typeof current === "string") {
    (section.content as any)[field] = current.trim().length > 0 ? `${current}\n${placeholder}` : placeholder;
    return true;
  }
  return false;
}

function setImageFieldIfEmpty(
  section: BlogContentSection | undefined,
  field: string,
  placeholder: string
): boolean {
  if (!section || typeof section.content !== "object" || !section.content) return false;
  const current = (section.content as any)[field];
  if (typeof current === "string" && current.trim().length > 0) {
    return current.includes(placeholder);
  }
  (section.content as any)[field] = placeholder;
  return true;
}

function appendToProcessStep(
  content: BlogContentSection[],
  placeholder: string,
  counters: Map<string, number>,
  counterKey: string
): boolean {
  const processSection = findSectionByType(content, "process_timeline");
  if (!processSection || typeof processSection.content !== "object" || !processSection.content) return false;

  const steps = (processSection.content as any).steps;
  if (!Array.isArray(steps) || steps.length === 0) return false;

  const currentIndex = counters.get(counterKey) || 0;
  const targetIndex = currentIndex % steps.length;
  counters.set(counterKey, currentIndex + 1);

  const step = steps[targetIndex];
  if (!step || typeof step !== "object") return false;
  const description = typeof step.description === "string" ? step.description : "";
  if (description.includes(placeholder)) return true;
  step.description = description.trim().length > 0 ? `${description}\n${placeholder}` : placeholder;
  return true;
}

function appendToGeneralContent(content: BlogContentSection[], placeholder: string): boolean {
  const textSection = findSectionByType(content, "text");
  if (textSection && appendToTextField(textSection, "body", placeholder)) return true;

  const jobSummary = findSectionByType(content, "job_summary");
  if (jobSummary && typeof jobSummary.content === "object" && jobSummary.content) {
    const highlights = (jobSummary.content as any).highlights;
    if (Array.isArray(highlights)) {
      if (!highlights.includes(placeholder)) highlights.push(placeholder);
      return true;
    }
  }

  const beforeAfter = findSectionByType(content, "before_after");
  if (beforeAfter && appendToTextField(beforeAfter, "beforeDescription", placeholder)) return true;

  const hero = findSectionByType(content, "hero");
  if (hero && appendToTextField(hero, "subheadline", placeholder)) return true;

  const ctaIndex = content.findIndex((section) => section.type === "cta");
  const supplementalSection: BlogContentSection = {
    id: `images-${content.length + 1}`,
    type: "text",
    content: {
      heading: "Project Photos",
      body: placeholder
    },
    isLocked: false
  };

  if (ctaIndex >= 0) {
    content.splice(ctaIndex, 0, supplementalSection);
  } else {
    content.push(supplementalSection);
  }

  return true;
}

function placeImagePlaceholder(
  content: BlogContentSection[],
  imageType: string,
  placeholder: string,
  counters: Map<string, number>
): boolean {
  const hero = findSectionByType(content, "hero");
  const beforeAfter = findSectionByType(content, "before_after");

  if (imageType === "hero") {
    if (setImageFieldIfEmpty(hero, "imageUrl", placeholder)) return true;
    return appendToGeneralContent(content, placeholder);
  }

  if (imageType === "before") {
    if (setImageFieldIfEmpty(beforeAfter, "imageUrlBefore", placeholder)) return true;
    if (beforeAfter && appendToTextField(beforeAfter, "beforeDescription", placeholder)) return true;
    return appendToGeneralContent(content, placeholder);
  }

  if (imageType === "after") {
    if (setImageFieldIfEmpty(beforeAfter, "imageUrlAfter", placeholder)) return true;
    if (beforeAfter && appendToTextField(beforeAfter, "afterDescription", placeholder)) return true;
    return appendToGeneralContent(content, placeholder);
  }

  if (imageType === "process" || imageType === "equipment" || imageType === "team") {
    if (appendToProcessStep(content, placeholder, counters, imageType)) return true;
    return appendToGeneralContent(content, placeholder);
  }

  return appendToGeneralContent(content, placeholder);
}

// Section regeneration
export async function regenerateSection(input: SectionRegenerateInput): Promise<BlogContentSection> {
  const prompt = `You are an expert SEO content writer. Regenerate ONLY the ${input.sectionType} section for a ${input.blogType} blog post about ${input.serviceName} in ${input.targetCity}.

TONE: ${input.tonePreference}

${input.context ? `ADDITIONAL CONTEXT: ${input.context}` : ""}

Current content structure:
${JSON.stringify(input.existingContent.map(s => ({ type: s.type, id: s.id })), null, 2)}

Generate a new version of the ${input.sectionType} section. Respond with a JSON object:
{
  "id": "unique-id",
  "type": "${input.sectionType}",
  "content": { section-specific content },
  "isLocked": false
}

Use the appropriate content format for the section type as described in the main generation instructions.`;

  const providers = [
    { name: 'Claude', fn: () => regenerateWithClaude(prompt) },
    { name: 'Gemini', fn: () => regenerateWithGemini(prompt) },
    { name: 'OpenAI', fn: () => regenerateWithOpenAI(prompt) }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) return result;
    } catch (error) {
      console.error(`${provider.name} section regeneration failed:`, error);
    }
  }

  throw new Error('All AI providers failed to regenerate section');
}

async function regenerateWithClaude(prompt: string): Promise<BlogContentSection | null> {
  const client = getClaude();
  if (!client) return null;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }]
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') return null;

  return parseSectionResponse(textContent.text);
}

async function regenerateWithGemini(prompt: string): Promise<BlogContentSection | null> {
  const client = getGemini();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });

  if (!response.text) return null;
  return parseSectionResponse(response.text);
}

async function regenerateWithOpenAI(prompt: string): Promise<BlogContentSection | null> {
  const client = getOpenAI();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return null;
  return parseSectionResponse(text);
}

function parseSectionResponse(text: string): BlogContentSection {
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  return {
    id: parsed.id || `section-${Date.now()}`,
    type: parsed.type,
    content: parsed.content,
    isLocked: false
  };
}

// Alt text generation for images
export async function generateAltText(imageUrl: string, context?: string): Promise<string> {
  const prompt = `Generate SEO-friendly alt text for an image. The image is from a service business blog post.
${context ? `Context: ${context}` : ""}

Requirements:
- Keep it under 125 characters
- Be descriptive but concise
- Include relevant keywords naturally
- Describe what's visible in the image

Respond with only the alt text, no quotes or additional formatting.`;

  const providers = [
    { name: 'Claude', fn: () => generateAltTextWithClaude(prompt, imageUrl) },
    { name: 'OpenAI', fn: () => generateAltTextWithOpenAI(prompt, imageUrl) }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) return result;
    } catch (error) {
      console.error(`${provider.name} alt text generation failed:`, error);
    }
  }

  // Fallback to generic alt text
  return context ? `Image related to ${context}` : "Service business image";
}

async function generateAltTextWithClaude(prompt: string, imageUrl: string): Promise<string | null> {
  const client = getClaude();
  if (!client) return null;

  // Claude can analyze images with vision
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: imageUrl
            }
          },
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ]
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent && textContent.type === 'text' ? textContent.text.trim() : null;
}

async function generateAltTextWithOpenAI(prompt: string, imageUrl: string): Promise<string | null> {
  const client = getOpenAI();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl }
          },
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ],
    max_tokens: 256
  });

  return response.choices[0]?.message?.content?.trim() || null;
}

// Compliance checking
export async function checkCompliance(content: string): Promise<BlogComplianceFlags> {
  const flags: BlogComplianceFlags = {
    hasAbsoluteClaims: false,
    hasSafetyDisclaimers: true,
    hasResultsDisclaimer: true,
    hasCredibilityBlock: false
  };

  const lowerContent = content.toLowerCase();

  // Check for absolute claims
  const absoluteClaims = ['best', 'guaranteed', '#1', 'number one', 'always', 'never fails', 'perfect'];
  flags.hasAbsoluteClaims = absoluteClaims.some(claim => lowerContent.includes(claim));

  // Check for safety disclaimers (should be present for relevant services)
  const safetyKeywords = ['safety', 'precaution', 'professional', 'licensed', 'insured', 'careful'];
  flags.hasSafetyDisclaimers = safetyKeywords.some(keyword => lowerContent.includes(keyword));

  // Check for results disclaimer
  const resultsKeywords = ['results may vary', 'individual results', 'typical results', 'based on'];
  flags.hasResultsDisclaimer = resultsKeywords.some(keyword => lowerContent.includes(keyword));

  // Check for credibility indicators
  const credibilityKeywords = ['years of experience', 'certified', 'licensed', 'trained', 'professional'];
  flags.hasCredibilityBlock = credibilityKeywords.some(keyword => lowerContent.includes(keyword));

  return flags;
}

// SEO Score calculation
export function calculateSeoScore(
  output: Omit<BlogGenerationOutput, 'seoScore' | 'seoChecklist'>,
  input: BlogGenerationInput
): { score: number; checklist: SeoChecklistItem[] } {
  const checklist: SeoChecklistItem[] = [];
  let totalPoints = 0;
  let earnedPoints = 0;
  const primaryKeyword = (input.targetKeyword || input.serviceName || "").trim().toLowerCase();
  const targetCity = (input.targetCity || "").trim().toLowerCase();

  // Check 1: Keyword in title
  const hasKeywordInTitle = primaryKeyword.length > 0 && output.title.toLowerCase().includes(primaryKeyword);
  checklist.push({
    id: 'keyword-title',
    label: 'Primary keyword in title',
    isPassed: hasKeywordInTitle
  });
  totalPoints += 15;
  if (hasKeywordInTitle) earnedPoints += 15;

  // Check 2: Location in title
  const hasLocationInTitle = targetCity.length > 0 && output.title.toLowerCase().includes(targetCity);
  checklist.push({
    id: 'location-title',
    label: 'Target location in title',
    isPassed: hasLocationInTitle
  });
  totalPoints += 10;
  if (hasLocationInTitle) earnedPoints += 10;

  // Check 3: Meta title length
  const metaTitleLength = output.metaTitle.length;
  const hasGoodMetaTitle = metaTitleLength >= 50 && metaTitleLength <= 60;
  checklist.push({
    id: 'meta-title-length',
    label: 'Meta title 50-60 characters',
    isPassed: hasGoodMetaTitle
  });
  totalPoints += 10;
  if (hasGoodMetaTitle) earnedPoints += 10;

  // Check 4: Meta description length
  const metaDescLength = output.metaDescription.length;
  const hasGoodMetaDesc = metaDescLength >= 150 && metaDescLength <= 160;
  checklist.push({
    id: 'meta-desc-length',
    label: 'Meta description 150-160 characters',
    isPassed: hasGoodMetaDesc
  });
  totalPoints += 10;
  if (hasGoodMetaDesc) earnedPoints += 10;

  // Check 5: Has FAQ section
  const hasFaq = output.content.some(s => s.type === 'faq');
  checklist.push({
    id: 'has-faq',
    label: 'FAQ section present',
    isPassed: hasFaq
  });
  totalPoints += 10;
  if (hasFaq) earnedPoints += 10;

  // Check 6: Has CTA section
  const hasCta = output.content.some(s => s.type === 'cta');
  checklist.push({
    id: 'has-cta',
    label: 'Call-to-action section present',
    isPassed: hasCta
  });
  totalPoints += 10;
  if (hasCta) earnedPoints += 10;

  // Check 7: Sufficient word count (estimate from content)
  const contentText = JSON.stringify(output.content);
  const wordCount = contentText.split(/\s+/).length;
  const hasGoodLength = wordCount >= 300; // Rough estimate
  checklist.push({
    id: 'word-count',
    label: 'Sufficient content length (800+ words)',
    isPassed: hasGoodLength
  });
  totalPoints += 15;
  if (hasGoodLength) earnedPoints += 15;

  // Check 8: Has excerpt
  const hasExcerpt = output.excerpt.length >= 50;
  checklist.push({
    id: 'has-excerpt',
    label: 'Excerpt present (50+ chars)',
    isPassed: hasExcerpt
  });
  totalPoints += 5;
  if (hasExcerpt) earnedPoints += 5;

  // Check 9: Slug is URL-friendly
  const hasGoodSlug = /^[a-z0-9-]+$/.test(output.suggestedSlug) && output.suggestedSlug.length <= 60;
  checklist.push({
    id: 'good-slug',
    label: 'URL-friendly slug',
    isPassed: hasGoodSlug
  });
  totalPoints += 5;
  if (hasGoodSlug) earnedPoints += 5;

  // Check 10: Multiple sections
  const hasMultipleSections = output.content.length >= 3;
  checklist.push({
    id: 'multiple-sections',
    label: 'Multiple content sections (3+)',
    isPassed: hasMultipleSections
  });
  totalPoints += 10;
  if (hasMultipleSections) earnedPoints += 10;

  const score = Math.round((earnedPoints / totalPoints) * 100);

  return { score, checklist };
}

// Convert blog content to HTML for Duda
export interface BlogHtmlEnhancements {
  internalLinks?: BlogInternalLink[];
  videoUrl?: string;
  facebookPostUrl?: string;
  gmbPostUrl?: string;
  ctaButtonEnabled?: boolean;
  ctaButtonUrl?: string;
  localBusiness?: BlogLocalBusinessSchema;
}

export interface BlogLocalBusinessSchema {
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  targetCity?: string;
}

interface BlogFaqEntry {
  question: string;
  answer: string;
}

export function blogContentToHtml(
  content: BlogContentSection[],
  images?: BlogImageRenderInput[],
  enhancements?: BlogHtmlEnhancements
): string {
  const normalizedImages = (images || [])
    .filter((img): img is BlogImageRenderInput => !!img?.url)
    .map((img) => ({
      url: img.url,
      imageType: normalizeImageType(img.imageType),
      caption: img.caption,
      imageStyle: normalizeImageStyle(img.imageStyle),
    }));
  const usedImageIndexes = new Set<number>();
  const faqEntries: BlogFaqEntry[] = [];
  const effectiveCtaButtonEnabled = enhancements?.ctaButtonEnabled !== false;
  const effectiveCtaButtonUrl = sanitizeUrl(enhancements?.ctaButtonUrl);

  const htmlParts: string[] = [];

  for (const section of content) {
    switch (section.type) {
      case 'hero':
        const heroImageHtml = renderImageValue(
          section.content.imageUrl,
          normalizedImages,
          usedImageIndexes,
          section.content.headline || "Hero image"
        );
        htmlParts.push(`
          <header class="blog-hero">
            <h1>${escapeHtml(section.content.headline || '')}</h1>
            ${section.content.subheadline ? `<p class="lead">${escapeHtml(section.content.subheadline)}</p>` : ''}
            ${heroImageHtml}
          </header>
        `);
        break;

      case 'text':
        htmlParts.push(`
          <section class="blog-text">
            ${section.content.heading ? `<h2>${escapeHtml(section.content.heading)}</h2>` : ''}
            <p>${escapeHtml(section.content.body || '')}</p>
          </section>
        `);
        break;

      case 'job_summary':
        htmlParts.push(`
          <section class="blog-job-summary">
            <h2>Project Overview</h2>
            <div class="blog-summary-lines">
              <p><strong>Project Type:</strong> ${escapeHtml(section.content.projectType || '')}</p>
              <p><strong>Location:</strong> ${escapeHtml(section.content.location || '')}</p>
              <p><strong>Duration:</strong> ${escapeHtml(section.content.duration || '')}</p>
            </div>
            ${section.content.highlights?.length ? `
              <h3>Highlights</h3>
              <div class="blog-highlights">
                ${section.content.highlights.map((h: string) => `<p>${escapeHtml(h)}</p>`).join('')}
              </div>
            ` : ''}
          </section>
        `);
        break;

      case 'before_after':
        const beforeImageHtml = renderImageValue(
          section.content.imageUrlBefore,
          normalizedImages,
          usedImageIndexes,
          "Before image"
        );
        const afterImageHtml = renderImageValue(
          section.content.imageUrlAfter,
          normalizedImages,
          usedImageIndexes,
          "After image"
        );
        htmlParts.push(`
          <section class="blog-before-after">
            <h2>Before & After</h2>
            <div class="before">
              <h3>Before</h3>
              <p>${escapeHtml(section.content.beforeDescription || '')}</p>
              ${beforeImageHtml}
            </div>
            <div class="after">
              <h3>After</h3>
              <p>${escapeHtml(section.content.afterDescription || '')}</p>
              ${afterImageHtml}
            </div>
            ${section.content.improvements?.length ? `
              <h3>Key Improvements</h3>
              <div class="blog-improvements">
                ${section.content.improvements.map((i: string) => `<p>${escapeHtml(i)}</p>`).join('')}
              </div>
            ` : ''}
          </section>
        `);
        break;

      case 'process_timeline':
        htmlParts.push(`
          <section class="blog-process">
            <h2>Our Process</h2>
            <div class="process-steps">
              ${(section.content.steps || []).map((step: any, index: number) => `
                <section class="process-step">
                  <h3>Step ${index + 1}: ${escapeHtml(step.title || '')}</h3>
                  <p>${escapeHtml(step.description || '')}</p>
                  ${step.duration ? `<span class="duration">${escapeHtml(step.duration)}</span>` : ''}
                </section>
              `).join('')}
            </div>
          </section>
        `);
        break;

      case 'pricing_factors':
        htmlParts.push(`
          <section class="blog-pricing-factors">
            <h2>What Affects Pricing</h2>
            ${section.content.intro ? `<p>${escapeHtml(section.content.intro)}</p>` : ''}
            <div class="blog-pricing-list">
              ${(section.content.factors || []).map((factor: any) => `
                <section class="blog-pricing-item">
                  <strong>${escapeHtml(factor.name || '')}</strong>
                  <p>${escapeHtml(factor.description || '')}</p>
                  <span class="impact impact-${factor.impact || 'medium'}">Impact: ${escapeHtml(factor.impact || 'medium')}</span>
                </section>
              `).join('')}
            </div>
          </section>
        `);
        break;

      case 'faq':
        const normalizedFaqEntries = normalizeFaqEntries(section.content.questions);
        if (normalizedFaqEntries.length > 0) {
          faqEntries.push(...normalizedFaqEntries);
        }
        htmlParts.push(`
          <section class="blog-faq" itemscope itemtype="https://schema.org/FAQPage">
            <h2>Frequently Asked Questions</h2>
            <div class="faq-accordion">
              ${normalizedFaqEntries.map((q: BlogFaqEntry, index: number) => `
                <details class="faq-item" ${index === 0 ? "open" : ""} itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                  <summary itemprop="name">${escapeHtml(q.question)}</summary>
                  <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                    <p itemprop="text">${escapeHtml(q.answer)}</p>
                  </div>
                </details>
              `).join('')}
            </div>
          </section>
        `);
        break;

      case 'cta':
        const fallbackCtaButtonUrl = sanitizeUrl(section.content.buttonUrl) || "#contact";
        const ctaButtonUrl = effectiveCtaButtonUrl || fallbackCtaButtonUrl;
        htmlParts.push(`
          <section class="blog-cta">
            <h2>${escapeHtml(section.content.heading || 'Ready to Get Started?')}</h2>
            <p>${escapeHtml(section.content.body || '')}</p>
            ${effectiveCtaButtonEnabled ? `
              <a href="${escapeHtml(ctaButtonUrl)}" class="cta-button">
                ${escapeHtml(section.content.buttonText || 'Contact Us')}
              </a>
            ` : ""}
          </section>
        `);
        break;

      default:
        // Generic fallback
        if (typeof section.content === 'string') {
          htmlParts.push(`<section><p>${escapeHtml(section.content)}</p></section>`);
        }
    }
  }

  let html = htmlParts.join('\n');

  // Replace {{IMAGE:<type>}} placeholders with actual <img> tags
  if (normalizedImages.length > 0) {
    html = html.replace(/\{\{\s*IMAGE\s*:\s*([^}\s]+)\s*\}\}/gi, (_match, rawType: string) => {
      const imageTag = buildImageTagForType(rawType, normalizedImages, usedImageIndexes, `${rawType} image`);
      return imageTag || "";
    });

    // Append any still-unused images so every uploaded image appears in output.
    const fallbackImages = normalizedImages
      .map((img, index) => ({ img, index }))
      .filter(({ index }) => !usedImageIndexes.has(index))
      .map(({ img, index }) => buildImageTag(img, `${img.imageType} image`, index, usedImageIndexes))
      .filter(Boolean);

    if (fallbackImages.length > 0) {
      html += `
        <section class="blog-images">
          <h2>Project Photos</h2>
          <div class="blog-image-grid">
            ${fallbackImages.join("\n")}
          </div>
        </section>
      `;
    }

    // Clean up any remaining unmatched placeholders
    html = html.replace(/\{\{\s*IMAGE\s*:\s*[^}\s]+\s*\}\}/gi, '');
  }

  const enhancementHtml = buildEnhancementHtml(enhancements);
  if (enhancementHtml) {
    html += enhancementHtml;
  }

  const structuredDataHtml = buildStructuredDataHtml({
    faqEntries,
    localBusiness: enhancements?.localBusiness,
    facebookPostUrl: enhancements?.facebookPostUrl,
    gmbPostUrl: enhancements?.gmbPostUrl,
  });
  if (structuredDataHtml) {
    html += structuredDataHtml;
  }

  const scopedStyles = `
    <style>
      .ab-blog-content h1::before,
      .ab-blog-content h2::before,
      .ab-blog-content h3::before {
        content: none !important;
      }
      .ab-blog-content .process-steps {
        margin: 0 !important;
        padding: 0 !important;
      }
      .ab-blog-content .process-step {
        margin: 0 0 16px 0 !important;
      }
      .ab-blog-content img {
        max-width: 100%;
        height: auto;
      }
      .ab-blog-content .blog-before-after {
        display: grid;
        gap: 16px;
      }
      .ab-blog-content .blog-before-after .before,
      .ab-blog-content .blog-before-after .after {
        display: grid;
        gap: 10px;
      }
      .ab-blog-content .blog-images .blog-image-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
      }
      .ab-blog-content .blog-images .blog-image-grid img {
        display: block;
        width: 100%;
      }
      @media (min-width: 900px) {
        .ab-blog-content .blog-images .blog-image-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .ab-blog-content .blog-before-after {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
        }
        .ab-blog-content .blog-before-after > h2,
        .ab-blog-content .blog-before-after > h3,
        .ab-blog-content .blog-before-after > .blog-improvements {
          grid-column: 1 / -1;
        }
      }
      .ab-blog-content ul,
      .ab-blog-content ol {
        list-style: none !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
      }
      .ab-blog-content li::before,
      .ab-blog-content li::marker {
        content: none !important;
        display: none !important;
      }
      .ab-blog-content .faq-accordion {
        display: grid;
        gap: 12px;
      }
      .ab-blog-content .faq-item {
        border: 1px solid #d7e1ea;
        border-radius: 14px;
        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
        overflow: hidden;
      }
      .ab-blog-content .faq-item summary {
        list-style: none;
        cursor: pointer;
        position: relative;
        display: block;
        padding: 14px 52px 14px 16px;
        font-weight: 600;
        color: #0f172a;
        line-height: 1.45;
        transition: background-color 160ms ease;
      }
      .ab-blog-content .faq-item summary:hover {
        background: #f1f5f9;
      }
      .ab-blog-content .faq-item summary::-webkit-details-marker {
        display: none;
      }
      .ab-blog-content .faq-item summary::after {
        content: "+";
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        width: 22px;
        height: 22px;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        text-align: center;
        line-height: 20px;
        font-size: 14px;
        color: #334155;
        background: #ffffff;
      }
      .ab-blog-content .faq-item[open] summary::after {
        content: "-";
      }
      .ab-blog-content .faq-item[open] summary {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .ab-blog-content .faq-answer {
        padding: 14px 16px 16px 16px;
        color: #334155;
        line-height: 1.7;
        background: #ffffff;
      }
      .ab-blog-content .faq-answer p {
        margin: 0;
      }
    </style>
  `;

  return `${scopedStyles}<div class="ab-blog-content">${html}</div>`;
}

function sanitizeUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return value;
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeInternalLinks(links?: BlogInternalLink[]): BlogInternalLink[] {
  if (!Array.isArray(links)) return [];
  const normalized: BlogInternalLink[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    const safeUrl = sanitizeUrl(link?.url);
    if (!safeUrl) continue;
    const rawAnchorText = (link?.anchorText || "").trim();
    const anchorLooksLikeUrl = /^https?:\/\//i.test(rawAnchorText) || rawAnchorText.startsWith("/");
    const anchorText = !rawAnchorText || anchorLooksLikeUrl || rawAnchorText === safeUrl
      ? buildInternalLinkAnchorText(safeUrl)
      : rawAnchorText;
    const dedupeKey = `${safeUrl}|${anchorText.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push({ url: safeUrl, anchorText });
  }

  return normalized.slice(0, 8);
}

function buildInternalLinkAnchorText(url: string): string {
  const fallback = "Learn More";
  const toTitleCase = (value: string): string => {
    const cleaned = value
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) return "";
    return cleaned
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (url.startsWith("/")) {
    const pathWithoutQuery = url.split(/[?#]/)[0] || "";
    const segment = pathWithoutQuery.split("/").filter(Boolean).pop();
    return segment ? toTitleCase(segment) : fallback;
  }

  try {
    const parsed = new URL(url);
    const pathWithoutQuery = parsed.pathname.split(/[?#]/)[0] || "";
    const segment = pathWithoutQuery.split("/").filter(Boolean).pop();
    if (segment) {
      return toTitleCase(decodeURIComponent(segment));
    }
    const hostname = parsed.hostname.replace(/^www\./i, "");
    return toTitleCase(hostname) || fallback;
  } catch {
    return fallback;
  }
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      const watchId = parsed.searchParams.get("v");
      if (watchId) return `https://www.youtube.com/embed/${watchId}`;
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    }

    if (host === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }

  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes("vimeo.com")) return null;

    const segments = parsed.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1];
    if (id && /^\d+$/.test(id)) {
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }

  return null;
}

function buildEnhancementHtml(enhancements?: BlogHtmlEnhancements): string {
  if (!enhancements) return "";

  const internalLinks = normalizeInternalLinks(enhancements.internalLinks);
  const videoUrl = sanitizeUrl(enhancements.videoUrl);
  const facebookPostUrl = sanitizeUrl(enhancements.facebookPostUrl);
  const gmbPostUrl = sanitizeUrl(enhancements.gmbPostUrl);

  const parts: string[] = [];

  if (internalLinks.length > 0) {
    const linkLines = internalLinks
      .map((link) => `<p><a href="${escapeHtml(link.url)}" rel="noopener noreferrer">${escapeHtml(link.anchorText)}</a></p>`)
      .join("");
    parts.push(`
      <section class="blog-internal-links">
        <h2>Related Services and Resources</h2>
        ${linkLines}
      </section>
    `);
  }

  if (videoUrl) {
    const youtubeEmbed = getYouTubeEmbedUrl(videoUrl);
    const vimeoEmbed = getVimeoEmbedUrl(videoUrl);
    const embedUrl = youtubeEmbed || vimeoEmbed;

    if (embedUrl) {
      parts.push(`
        <section class="blog-video">
          <h2>Watch: Related Video</h2>
          <div class="video-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
            <iframe
              src="${escapeHtml(embedUrl)}"
              title="Related service video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
            ></iframe>
          </div>
        </section>
      `);
    } else {
      parts.push(`
        <section class="blog-video">
          <h2>Watch: Related Video</h2>
          <p><a href="${escapeHtml(videoUrl)}" rel="noopener noreferrer">View video</a></p>
        </section>
      `);
    }
  }

  if (facebookPostUrl || gmbPostUrl) {
    parts.push(`
      <section class="blog-social-updates">
        <h2>Recent Updates</h2>
        ${facebookPostUrl ? `<p><a href="${escapeHtml(facebookPostUrl)}" rel="noopener noreferrer">View our Facebook post</a></p>` : ""}
        ${gmbPostUrl ? `<p><a href="${escapeHtml(gmbPostUrl)}" rel="noopener noreferrer">View our Google Business Profile post</a></p>` : ""}
      </section>
    `);
  }

  return parts.join("\n");
}

function normalizeFaqEntries(rawQuestions: unknown): BlogFaqEntry[] {
  if (!Array.isArray(rawQuestions)) return [];
  const normalized: BlogFaqEntry[] = [];
  const seen = new Set<string>();

  for (const item of rawQuestions) {
    const question = typeof (item as any)?.question === "string" ? (item as any).question.trim() : "";
    const answer = typeof (item as any)?.answer === "string" ? (item as any).answer.trim() : "";
    if (!question || !answer) continue;
    const dedupeKey = `${question.toLowerCase()}|${answer.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push({ question, answer });
  }

  return normalized.slice(0, 12);
}

function buildStructuredDataHtml(input: {
  faqEntries: BlogFaqEntry[];
  localBusiness?: BlogLocalBusinessSchema;
  facebookPostUrl?: string;
  gmbPostUrl?: string;
}): string {
  const scripts: string[] = [];

  if (input.faqEntries.length > 0) {
    scripts.push(
      toJsonLdScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: input.faqEntries.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: entry.answer,
          },
        })),
      })
    );
  }

  const localBusinessSchema = buildLocalBusinessSchema(
    input.localBusiness,
    input.facebookPostUrl,
    input.gmbPostUrl
  );
  if (localBusinessSchema) {
    scripts.push(toJsonLdScript(localBusinessSchema));
  }

  return scripts.join("\n");
}

function buildLocalBusinessSchema(
  localBusiness?: BlogLocalBusinessSchema,
  facebookPostUrl?: string,
  gmbPostUrl?: string
): Record<string, unknown> | null {
  const businessName = (localBusiness?.businessName || "").trim();
  if (!businessName) return null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: businessName,
  };

  const businessPhone = (localBusiness?.businessPhone || "").trim();
  const businessEmail = (localBusiness?.businessEmail || "").trim();
  const businessAddress = (localBusiness?.businessAddress || "").trim();
  const targetCity = (localBusiness?.targetCity || "").trim();

  if (businessPhone) schema.telephone = businessPhone;
  if (businessEmail) schema.email = businessEmail;
  if (businessAddress) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: businessAddress,
    };
  }
  if (targetCity) schema.areaServed = targetCity;

  const sameAs = [sanitizeUrl(facebookPostUrl), sanitizeUrl(gmbPostUrl)].filter(
    (url): url is string => !!url && /^https?:\/\//i.test(url)
  );
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

function toJsonLdScript(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function normalizeImageType(value?: string): string {
  return (value || "hero").trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function normalizeImageStyle(value?: string): "default" | "rounded" | "rounded_shadow" {
  const normalized = (value || "default").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "rounded" || normalized === "rounded_shadow") {
    return normalized;
  }
  return "default";
}

function getImageInlineStyle(imageStyle?: string): string {
  const base = "max-width:100%;height:auto;";
  const normalized = normalizeImageStyle(imageStyle);
  if (normalized === "rounded") {
    return `${base}border-radius:14px;`;
  }
  if (normalized === "rounded_shadow") {
    return `${base}border-radius:14px;box-shadow:0 10px 24px rgba(17,24,39,0.20);`;
  }
  return base;
}

function parseImagePlaceholderToken(value: string): string | null {
  const match = value.match(/\{\{\s*IMAGE\s*:\s*([^}\s]+)\s*\}\}/i);
  return match ? normalizeImageType(match[1]) : null;
}

function buildImageTag(
  img: BlogImageRenderInput,
  fallbackAlt: string,
  index: number,
  usedImageIndexes: Set<number>
): string {
  usedImageIndexes.add(index);
  const alt = escapeHtml(img.caption || fallbackAlt || `${img.imageType} image`);
  return `<img src="${escapeHtml(img.url)}" alt="${alt}" style="${getImageInlineStyle(img.imageStyle)}" />`;
}

function buildImageTagForType(
  placeholderType: string,
  images: Array<BlogImageRenderInput>,
  usedImageIndexes: Set<number>,
  fallbackAlt: string
): string {
  if (images.length === 0) return "";

  const normalizedType = normalizeImageType(placeholderType);

  const exactUnused = images.findIndex((img, idx) => !usedImageIndexes.has(idx) && img.imageType === normalizedType);
  if (exactUnused >= 0) {
    return buildImageTag(images[exactUnused], fallbackAlt, exactUnused, usedImageIndexes);
  }

  const anyUnused = images.findIndex((_img, idx) => !usedImageIndexes.has(idx));
  if (anyUnused >= 0) {
    return buildImageTag(images[anyUnused], fallbackAlt, anyUnused, usedImageIndexes);
  }

  const exactAny = images.findIndex((img) => img.imageType === normalizedType);
  if (exactAny >= 0) {
    return buildImageTag(images[exactAny], fallbackAlt, exactAny, usedImageIndexes);
  }

  return "";
}

function renderImageValue(
  value: unknown,
  images: Array<BlogImageRenderInput>,
  usedImageIndexes: Set<number>,
  fallbackAlt: string
): string {
  if (typeof value !== "string" || !value.trim()) return "";

  const placeholderType = parseImagePlaceholderToken(value);
  if (placeholderType) {
    return buildImageTagForType(placeholderType, images, usedImageIndexes, fallbackAlt);
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
    const alt = escapeHtml(fallbackAlt || "Blog image");
    return `<img src="${escapeHtml(value)}" alt="${alt}" style="${getImageInlineStyle("default")}" />`;
  }

  return "";
}

function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => escapeMap[char] || char);
}

// Default layout templates
export const DEFAULT_LAYOUT_TEMPLATES: Array<{ name: string; blogType: string; sections: BlogLayoutSection[] }> = [
  {
    name: "Job Showcase Template",
    blogType: "job_showcase",
    sections: [
      { id: "hero", type: "hero", label: "Hero Section", required: true },
      { id: "job-summary", type: "job_summary", label: "Project Summary", required: true },
      { id: "before-after", type: "before_after", label: "Before & After", required: true },
      { id: "process", type: "process_timeline", label: "Our Process", required: false },
      { id: "faq", type: "faq", label: "FAQ", required: false },
      { id: "cta", type: "cta", label: "Call to Action", required: true }
    ]
  },
  {
    name: "Expert Opinion Template",
    blogType: "expert_opinion",
    sections: [
      { id: "hero", type: "hero", label: "Hero Section", required: true },
      { id: "intro", type: "text", label: "Introduction", required: true },
      { id: "main-points", type: "text", label: "Main Points", required: true },
      { id: "pricing-factors", type: "pricing_factors", label: "Cost Factors", required: false },
      { id: "faq", type: "faq", label: "FAQ", required: true },
      { id: "cta", type: "cta", label: "Call to Action", required: true }
    ]
  },
  {
    name: "Seasonal Tips Template",
    blogType: "seasonal_tip",
    sections: [
      { id: "hero", type: "hero", label: "Hero Section", required: true },
      { id: "intro", type: "text", label: "Seasonal Overview", required: true },
      { id: "tips", type: "process_timeline", label: "Tips & Steps", required: true },
      { id: "faq", type: "faq", label: "FAQ", required: false },
      { id: "cta", type: "cta", label: "Call to Action", required: true }
    ]
  },
  {
    name: "FAQ Educational Template",
    blogType: "faq_educational",
    sections: [
      { id: "hero", type: "hero", label: "Hero Section", required: true },
      { id: "intro", type: "text", label: "Introduction", required: true },
      { id: "faq", type: "faq", label: "Comprehensive FAQ", required: true },
      { id: "pricing-factors", type: "pricing_factors", label: "Pricing Guide", required: false },
      { id: "cta", type: "cta", label: "Call to Action", required: true }
    ]
  }
];
