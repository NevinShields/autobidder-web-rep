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
  blogType: string; // "job_showcase", "job_type_keyword_targeting", "pricing_keyword_targeting", "faq_educational"
  serviceName: string;
  businessName?: string;
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
    duration?: string;
    notes?: string;
    images: string[];
  };
  talkingPoints: string[];
  tonePreference: string; // "professional", "friendly", "technical"
  designStyle?: string;
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
const BLOG_MIN_WORD_COUNT = 650;
const BLOG_TARGET_LOCATION_MENTIONS = 3;
const BLOG_MAX_GENERIC_PHRASES = 2;

interface BlogQualityAssessment {
  wordCount: number;
  locationMentions: number;
  talkingPointsCovered: number;
  talkingPointsTotal: number;
  jobFactsCovered: number;
  jobFactsTotal: number;
  genericPhraseHits: string[];
  firstParagraphHasKeyword: boolean;
  issues: string[];
}

export interface SectionRegenerateInput {
  sectionId?: string;
  sectionType: string;
  existingContent: BlogContentSection[];
  blogType: string;
  serviceName: string;
  businessName?: string;
  targetCity: string;
  tonePreference: string;
  context?: string;
}

export interface TextExpansionInput {
  blogType: string;
  serviceName: string;
  businessName?: string;
  targetCity: string;
  tonePreference: string;
  sectionType: string;
  fieldLabel: string;
  currentText: string;
  context?: string;
}

function collectJobSpecificFacts(input: BlogGenerationInput): string[] {
  const mergedNotes = [input.jobData?.notes, input.jobNotes]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join("\n");

  if (!mergedNotes) return [];

  const seen = new Set<string>();
  const facts: string[] = [];
  for (const rawFact of splitGuidanceNotes(mergedNotes)) {
    const fact = String(rawFact || "").trim();
    if (!fact) continue;
    const normalized = normalizeGuidanceText(fact);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    facts.push(fact);
  }

  return facts.slice(0, 10);
}

// Blog generation system prompt
function getBlogSystemPrompt(input: BlogGenerationInput): string {
  const primaryKeyword = (input.targetKeyword || input.serviceName || "").trim();
  const targetLocation = (input.targetCity || "").trim() || "your service area";
  const businessName = (input.businessName || "").trim();
  const blogTypeDescriptions: Record<string, string> = {
    job_showcase: "a case study showcasing a completed job with before/after details and results",
    job_type_keyword_targeting: "a keyword-targeting service page style post focused on a specific job type or property type",
    pricing_keyword_targeting: "a pricing-focused SEO page targeting cost and price keywords for a service in a specific area",
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
  const jobSpecificFacts = collectJobSpecificFacts(input);

return `You are an expert SEO content writer specializing in local service businesses.
Create ${blogTypeDescriptions[input.blogType] || "a blog post"} for a ${input.serviceName} business.

PRIMARY SEO KEYWORD: ${primaryKeyword}

TARGET LOCATION: ${targetLocation}${input.targetNeighborhood ? `, specifically the ${input.targetNeighborhood} area` : ""}

TONE: Write in a ${toneDescriptions[input.tonePreference] || "professional"} tone.

PRIMARY GOAL: The content should focus on ${goalDescriptions[input.goal] || "providing value to readers"}.

${businessName ? `BUSINESS NAME TO USE WHEN BRAND NAME IS NEEDED: ${businessName}` : ""}

${input.serviceDescription ? `SERVICE DESCRIPTION: ${input.serviceDescription}` : ""}

${input.jobData ? `
JOB DETAILS TO REFERENCE:
- Job Title: ${input.jobData.title}
- Location: ${input.jobData.customerAddress}
- Completed: ${input.jobData.completedDate}
${input.jobData.duration ? `- Duration: ${input.jobData.duration}` : ""}
${input.jobData.notes ? `- Notes: ${input.jobData.notes}` : ""}
${input.jobData.images.length > 0 ? `- Images available: ${input.jobData.images.length} photos` : ""}
` : ""}

${input.jobNotes?.trim() ? `
USER NOTES AND CONSTRAINTS (HIGHEST PRIORITY):
${input.jobNotes.trim()}
` : ""}

${jobSpecificFacts.length > 0 ? `
JOB-SPECIFIC FACTS TO INCLUDE IN THE DRAFT (MANDATORY):
${jobSpecificFacts.map((fact, index) => `${index + 1}. ${fact}`).join("\n")}
` : ""}

${input.images && input.images.length > 0 ? `
IMAGES PROVIDED BY THE USER — embed these in the content using the exact placeholder format {{IMAGE:<type>}}:
${input.images.map(img => `- {{IMAGE:${img.imageType}}} — "${img.caption || img.imageType + ' image'}"`).join("\n")}
Place these image placeholders in appropriate locations within the content. For example, place {{IMAGE:hero}} near the top, {{IMAGE:before}} in the before section, {{IMAGE:after}} in the after section, etc.
If multiple before/after images are uploaded, include multiple {{IMAGE:before}} and {{IMAGE:after}} placeholders in order so each set appears in the draft.
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
4. If JOB-SPECIFIC FACTS are provided, weave every fact into relevant sections (or very close paraphrases) and avoid generic filler.
5. For job_showcase posts, make the before/after and process details concrete and project-specific.
6. For job_type_keyword_targeting posts, focus on the property type/job type keyword, common scope, customer concerns, typical process, and why the service matters for that type of property.
7. For pricing_keyword_targeting posts, focus on realistic price ranges, what changes cost, typical service tiers, and area-specific expectations. Include concrete table and chart data that is plausible but conservative.
8. Never output placeholders such as [Your Company Name], [Company Name], [Business Name], [Phone Number], [Email Address], or similar bracketed template text.
9. ${businessName ? `If the copy needs a business name, use "${businessName}" exactly.` : `If no business name is provided, avoid placeholders and use natural wording such as "our team" or "the company".`}

SEO REQUIREMENTS:
1. Include the target city/location naturally throughout the content when one is provided
2. Use the PRIMARY SEO KEYWORD in the title and first paragraph
3. Include relevant keywords naturally
4. Write a compelling meta title (50-60 characters) and meta description (150-160 characters)
5. Create a URL-friendly slug
6. Aim for 800-1500 words total
7. If an FAQ section is included, provide 4-5 useful question/answer pairs

QUALITY REQUIREMENTS:
1. Avoid generic filler, vague marketing language, and empty claims.
2. Make each section feel specific to the service, location, and scenario instead of reusable boilerplate.
3. Use concrete operational details where relevant: surfaces, property types, customer concerns, prep work, equipment, timeline considerations, pricing drivers, and realistic outcomes.
4. Do not write broad introductions that say little. Start with a strong, useful first paragraph.
5. In text-heavy sections, provide at least 2 substantial paragraphs or an equivalent amount of detail.
6. For pricing sections, use grounded and conservative ranges, then explain what makes the price move up or down.
7. For FAQs, answers should be direct and useful, not one-sentence filler.
8. Preserve every uploaded image placeholder exactly if one appears in the content.
9. Do not use markdown formatting in copy. Never use **bold**, *italic*, bullet markers, heading markers, or other markdown syntax inside paragraph text.

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
- pricing_table: { "heading": "...", "columns": ["...", "...", "..."], "rows": [{ "label": "...", "priceRange": "...", "details": "..." }] }
- pricing_chart: { "heading": "...", "bars": [{ "label": "...", "value": 350, "displayValue": "$350", "description": "..." }] }
- faq: { "questions": [{ "question": "...", "answer": "..." }] }
- cta: { "heading": "...", "body": "...", "buttonText": "...", "buttonUrl": null }
- autobidder_form: { "heading": "...", "body": "...", "buttonText": "..." }
- map_embed: { "heading": "...", "body": "...", "locationLabel": "...", "embedHtml": "<iframe ...></iframe>", "mapUrl": "https://www.google.com/maps/..." }`;
}

function getBlogPolishPrompt(
  input: BlogGenerationInput,
  draft: Omit<BlogGenerationOutput, "seoScore" | "seoChecklist">,
  assessment: BlogQualityAssessment
): string {
  const issueList = assessment.issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n");
  const genericHits = assessment.genericPhraseHits.length > 0
    ? assessment.genericPhraseHits.join(", ")
    : "none detected";
  const jobFacts = collectJobSpecificFacts(input);

  return `You are revising a structured local-service blog draft to improve specificity, usefulness, and conversion quality.

Keep the same JSON shape and the same section types. Rewrite weak sections so they feel written for this exact service, keyword, and location.

SERVICE: ${input.serviceName}
PRIMARY SEO KEYWORD: ${(input.targetKeyword || input.serviceName || "").trim()}
TARGET LOCATION: ${(input.targetCity || "").trim() || "your service area"}${input.targetNeighborhood ? ` (${input.targetNeighborhood})` : ""}
BLOG TYPE: ${input.blogType}
TONE: ${input.tonePreference}
GOAL: ${input.goal}

TALKING POINTS TO COVER:
${(input.talkingPoints || []).map((point, index) => `${index + 1}. ${point}`).join("\n") || "None provided"}

JOB-SPECIFIC FACTS TO PRESERVE:
${jobFacts.map((fact, index) => `${index + 1}. ${fact}`).join("\n") || "None provided"}

CURRENT DRAFT QUALITY SIGNALS:
- Estimated word count: ${assessment.wordCount}
- Location mentions: ${assessment.locationMentions}
- Talking points covered: ${assessment.talkingPointsCovered}/${assessment.talkingPointsTotal}
- Job facts covered: ${assessment.jobFactsCovered}/${assessment.jobFactsTotal}
- Keyword in first paragraph: ${assessment.firstParagraphHasKeyword ? "yes" : "no"}
- Generic phrase hits: ${genericHits}

FIX THESE ISSUES:
${issueList}

REVISION RULES:
1. Preserve the existing section ids where possible.
2. Keep image placeholders like {{IMAGE:hero}} exactly unchanged when present.
3. Keep claims conservative and realistic.
4. Add substance, not fluff. Replace vague wording with concrete service details, buyer concerns, process details, and decision-making guidance.
5. Make the first paragraph stronger and ensure it uses the primary keyword naturally.
6. Keep meta title, meta description, excerpt, and slug SEO-friendly.
7. Return strictly valid JSON only.

CURRENT DRAFT JSON:
${JSON.stringify(draft, null, 2)}`;
}

// Main generation function with provider fallback
export async function generateBlogContent(input: BlogGenerationInput): Promise<BlogGenerationOutput> {
  const availableProviders = [
    { name: 'OpenAI', available: !!getOpenAI() },
    { name: 'Claude', available: !!getClaude() },
    { name: 'Gemini', available: !!getGemini() }
  ];

  if (!availableProviders.some((provider) => provider.available)) {
    throw new Error('No AI providers are configured on the server.');
  }

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
        const normalizedResult = normalizeGeneratedBlogOutput(result, input);
        const improvedResult = await improveBlogDraftIfNeeded(normalizedResult, input);

        // Calculate SEO score and checklist
        const { score, checklist } = calculateSeoScore(improvedResult, input);
        return {
          ...improvedResult,
          seoScore: score,
          seoChecklist: checklist
        };
      }
      console.warn(`⚠️ ${provider.name} returned no content.`);
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('All AI providers failed to generate blog content');
}

function normalizeGeneratedBlogOutput(
  result: Omit<BlogGenerationOutput, "seoScore" | "seoChecklist">,
  input: BlogGenerationInput
): Omit<BlogGenerationOutput, "seoScore" | "seoChecklist"> {
  const placeholderSanitizedResult = replaceTemplatePlaceholdersInOutput(result, input);
  const contentWithGuaranteedImages = ensureUploadedImagesInContent(placeholderSanitizedResult.content, input.images);
  const contentWithDefaultFaqs = ensureDefaultFaqEntries(contentWithGuaranteedImages, input);
  const contentWithMapEmbed = ensureMapEmbedSection(contentWithDefaultFaqs, input);
  const contentWithGuidance = ensureUserGuidanceCoverage(contentWithMapEmbed, input);

  return {
    ...placeholderSanitizedResult,
    content: contentWithGuidance
  };
}

function replaceTemplatePlaceholdersInOutput(
  result: Omit<BlogGenerationOutput, "seoScore" | "seoChecklist">,
  input: BlogGenerationInput
): Omit<BlogGenerationOutput, "seoScore" | "seoChecklist"> {
  const businessName = (input.businessName || "").trim();
  const replacementName = businessName || "our team";
  const stripInlineMarkdown = (value: string): string => value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
  const replaceText = (value: string): string => stripInlineMarkdown(
    value
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim()
  )
    .replace(/\[(?:your\s+)?company\s+name\]/gi, replacementName)
    .replace(/\[(?:your\s+)?business\s+name\]/gi, replacementName)
    .replace(/\[company\s+name\]/gi, replacementName)
    .replace(/\[business\s+name\]/gi, replacementName)
    .replace(/\[(?:your\s+)?phone\s+number\]/gi, "")
    .replace(/\[(?:your\s+)?email(?:\s+address)?\]/gi, "")
    .replace(/\[(?:insert|add)\s+[^\]]+\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === "string") {
      return replaceText(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitizeValue(entry)])
      );
    }
    return value;
  };

  return {
    title: replaceText(result.title),
    metaTitle: replaceText(result.metaTitle),
    metaDescription: replaceText(result.metaDescription),
    excerpt: replaceText(result.excerpt),
    suggestedSlug: result.suggestedSlug,
    content: sanitizeValue(result.content) as BlogContentSection[],
  };
}

async function improveBlogDraftIfNeeded(
  draft: Omit<BlogGenerationOutput, "seoScore" | "seoChecklist">,
  input: BlogGenerationInput
): Promise<Omit<BlogGenerationOutput, "seoScore" | "seoChecklist">> {
  const assessment = assessBlogDraftQuality(draft, input);
  if (assessment.issues.length === 0) {
    return draft;
  }

  console.log(`[Blog] Draft quality polish requested: ${assessment.issues.join(" | ")}`);
  const polished = await polishBlogDraft(input, draft, assessment);
  if (!polished) {
    return draft;
  }

  return normalizeGeneratedBlogOutput(polished, input);
}

async function polishBlogDraft(
  input: BlogGenerationInput,
  draft: Omit<BlogGenerationOutput, "seoScore" | "seoChecklist">,
  assessment: BlogQualityAssessment
): Promise<Omit<BlogGenerationOutput, "seoScore" | "seoChecklist"> | null> {
  const prompt = getBlogPolishPrompt(input, draft, assessment);
  const providers = [
    { name: "OpenAI", fn: () => polishWithOpenAI(prompt) },
    { name: "Claude", fn: () => polishWithClaude(prompt) },
    { name: "Gemini", fn: () => polishWithGemini(prompt) }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) {
        console.log(`[Blog] Draft polished with ${provider.name}`);
        return result;
      }
    } catch (error) {
      console.error(`[Blog] ${provider.name} polish failed:`, error);
    }
  }

  return null;
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

async function polishWithClaude(prompt: string): Promise<Omit<BlogGenerationOutput, 'seoScore' | 'seoChecklist'> | null> {
  const client = getClaude();
  if (!client) return null;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }]
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') return null;
  return parseGenerationResponse(textContent.text);
}

async function polishWithGemini(prompt: string): Promise<Omit<BlogGenerationOutput, 'seoScore' | 'seoChecklist'> | null> {
  const client = getGemini();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });

  if (!response.text) return null;
  return parseGenerationResponse(response.text);
}

async function polishWithOpenAI(prompt: string): Promise<Omit<BlogGenerationOutput, 'seoScore' | 'seoChecklist'> | null> {
  const client = getOpenAI();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4096
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return null;
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

function buildGoogleMapsEmbedUrl(locationLabel?: string | null): string | null {
  const normalized = (locationLabel || "").trim();
  if (!normalized || normalized.toLowerCase() === "your service area") {
    return null;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(normalized)}&output=embed`;
}

function buildGoogleMapsEmbedHtml(locationLabel?: string | null): string {
  const embedUrl = buildGoogleMapsEmbedUrl(locationLabel);
  if (!embedUrl) return "";
  return `<iframe src="${embedUrl}" width="100%" height="420" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

function extractMapIframeSrc(embedHtml?: unknown): string | null {
  if (typeof embedHtml !== "string" || !embedHtml.trim()) return null;
  const match = embedHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (!match?.[1]) return null;
  const safeUrl = sanitizeUrl(match[1]);
  if (!safeUrl) return null;

  try {
    const parsed = new URL(safeUrl);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const output = parsed.searchParams.get("output")?.toLowerCase();

    // Reject opaque Google Maps embed variants that rely on `pb`, since malformed
    // values cause the "Invalid 'pb' parameter" error in the published blog.
    if (parsed.searchParams.has("pb")) {
      return null;
    }

    const isGoogleMapsHost =
      host === "www.google.com" ||
      host === "google.com" ||
      host.endsWith(".google.com");

    const isSafeEmbedShape =
      path === "/maps" && output === "embed";

    if (!isGoogleMapsHost || !isSafeEmbedShape) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function ensureMapEmbedSection(
  content: BlogContentSection[],
  input: BlogGenerationInput
): BlogContentSection[] {
  const targetCity = (input.targetCity || "").trim();
  if (!targetCity || targetCity.toLowerCase() === "your service area") {
    return content;
  }

  const embedHtml = buildGoogleMapsEmbedHtml(targetCity);
  if (!embedHtml) return content;

  let clonedContent: BlogContentSection[];
  try {
    clonedContent = JSON.parse(JSON.stringify(content)) as BlogContentSection[];
  } catch {
    return content;
  }

  const mapSectionContent = {
    heading: `${targetCity} Service Area Map`,
    body: `Use the map below to see ${targetCity} and the surrounding service area referenced in this post.`,
    locationLabel: targetCity,
    embedHtml,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetCity)}`,
  };

  const existingIndex = clonedContent.findIndex((section) => section.type === "map_embed");
  if (existingIndex >= 0) {
    const section = clonedContent[existingIndex];
    const sectionContent = (section.content && typeof section.content === "object")
      ? section.content as Record<string, unknown>
      : {};
    const nextLocationLabel = typeof sectionContent.locationLabel === "string" && sectionContent.locationLabel.trim()
      ? sectionContent.locationLabel.trim()
      : targetCity;
    clonedContent[existingIndex] = {
      ...section,
      content: {
        ...mapSectionContent,
        ...sectionContent,
        locationLabel: nextLocationLabel,
        embedHtml: extractMapIframeSrc(sectionContent.embedHtml)
          ? String(sectionContent.embedHtml)
          : buildGoogleMapsEmbedHtml(nextLocationLabel),
        mapUrl: sanitizeUrl(typeof sectionContent.mapUrl === "string" ? sectionContent.mapUrl : "")
          || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextLocationLabel)}`,
      },
    };
    return clonedContent;
  }

  const ctaIndex = clonedContent.findIndex((section) => section.type === "cta");
  const nextSection: BlogContentSection = {
    id: `map-${Date.now()}`,
    type: "map_embed",
    content: mapSectionContent,
    isLocked: false,
  };

  if (ctaIndex >= 0) {
    clonedContent.splice(ctaIndex, 0, nextSection);
  } else {
    clonedContent.push(nextSection);
  }

  return clonedContent;
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

  for (const noteLine of splitGuidanceNotes(input.jobData?.notes)) {
    const key = normalizeGuidanceText(noteLine);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(noteLine);
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

function extractReadableText(content: BlogContentSection[]): string {
  const chunks: string[] = [];

  for (const section of content) {
    if (!section || typeof section !== "object") continue;

    switch (section.type) {
      case "hero":
        pushString(chunks, section.content?.headline);
        pushString(chunks, section.content?.subheadline);
        break;
      case "text":
        pushString(chunks, section.content?.heading);
        pushString(chunks, section.content?.body);
        break;
      case "job_summary":
        pushString(chunks, section.content?.projectType);
        pushString(chunks, section.content?.location);
        pushString(chunks, section.content?.duration);
        pushArrayStrings(chunks, section.content?.highlights);
        break;
      case "before_after":
        pushString(chunks, section.content?.beforeDescription);
        pushString(chunks, section.content?.afterDescription);
        pushArrayStrings(chunks, section.content?.improvements);
        break;
      case "process_timeline":
        if (Array.isArray(section.content?.steps)) {
          for (const step of section.content.steps) {
            pushString(chunks, step?.title);
            pushString(chunks, step?.description);
            pushString(chunks, step?.duration);
          }
        }
        break;
      case "pricing_factors":
        pushString(chunks, section.content?.intro);
        if (Array.isArray(section.content?.factors)) {
          for (const factor of section.content.factors) {
            pushString(chunks, factor?.name);
            pushString(chunks, factor?.description);
            pushString(chunks, factor?.impact);
          }
        }
        break;
      case "pricing_table":
        pushString(chunks, section.content?.heading);
        pushArrayStrings(chunks, section.content?.columns);
        if (Array.isArray(section.content?.rows)) {
          for (const row of section.content.rows) {
            pushString(chunks, row?.label);
            pushString(chunks, row?.priceRange);
            pushString(chunks, row?.details);
          }
        }
        break;
      case "pricing_chart":
        pushString(chunks, section.content?.heading);
        if (Array.isArray(section.content?.bars)) {
          for (const bar of section.content.bars) {
            pushString(chunks, bar?.label);
            pushString(chunks, bar?.displayValue);
            pushString(chunks, bar?.description);
          }
        }
        break;
      case "faq":
        if (Array.isArray(section.content?.questions)) {
          for (const item of section.content.questions) {
            pushString(chunks, item?.question);
            pushString(chunks, item?.answer);
          }
        }
        break;
      case "cta":
      case "autobidder_form":
        pushString(chunks, section.content?.heading);
        pushString(chunks, section.content?.body);
        pushString(chunks, section.content?.buttonText);
        break;
      case "map_embed":
        pushString(chunks, section.content?.heading);
        pushString(chunks, section.content?.body);
        pushString(chunks, section.content?.locationLabel);
        break;
      default:
        if (typeof section.content === "string") {
          pushString(chunks, section.content);
        }
    }
  }

  return chunks.join("\n").trim();
}

function pushString(target: string[], value: unknown): void {
  if (typeof value === "string" && value.trim()) {
    target.push(value.trim());
  }
}

function pushArrayStrings(target: string[], value: unknown): void {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    pushString(target, item);
  }
}

function countWordEstimate(text: string): number {
  return text
    .replace(/\{\{IMAGE:[^}]+\}\}/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function countPhraseMatches(text: string, phrase: string): number {
  if (!text || !phrase) return 0;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.match(new RegExp(escaped, "gi"));
  return matches ? matches.length : 0;
}

function countCoveredItems(text: string, items: string[]): number {
  const normalizedText = normalizeGuidanceText(text);
  let count = 0;

  for (const item of items) {
    const normalizedItem = normalizeGuidanceText(item);
    if (normalizedItem && normalizedText.includes(normalizedItem)) {
      count += 1;
    }
  }

  return count;
}

function getFirstParagraph(content: BlogContentSection[]): string {
  for (const section of content) {
    const candidates: string[] = [];

    if (section.type === "hero" && typeof section.content?.subheadline === "string") {
      candidates.push(section.content.subheadline);
    }

    if (section.type === "text" && typeof section.content?.body === "string") {
      candidates.push(section.content.body);
    }

    for (const candidate of candidates) {
      const paragraph = candidate
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .find(Boolean);
      if (paragraph) return paragraph;
    }
  }

  return "";
}

function assessBlogDraftQuality(
  output: Omit<BlogGenerationOutput, "seoScore" | "seoChecklist">,
  input: BlogGenerationInput
): BlogQualityAssessment {
  const readableText = extractReadableText(output.content);
  const normalizedText = normalizeGuidanceText(readableText);
  const wordCount = countWordEstimate(readableText);
  const targetCity = (input.targetCity || "").trim();
  const primaryKeyword = (input.targetKeyword || input.serviceName || "").trim().toLowerCase();
  const talkingPoints = (input.talkingPoints || []).map((item) => String(item).trim()).filter(Boolean);
  const jobFacts = collectJobSpecificFacts(input);
  const firstParagraph = getFirstParagraph(output.content).toLowerCase();
  const genericPhrases = [
    "it is important to understand",
    "there are several factors",
    "one of the most important",
    "homeowners should know",
    "can vary depending on",
    "tailored to your specific needs",
    "in today s world",
    "for many property owners",
  ];
  const genericPhraseHits = genericPhrases.filter((phrase) => normalizedText.includes(phrase));
  const locationMentions = targetCity ? countPhraseMatches(readableText, targetCity) : 0;
  const talkingPointsCovered = countCoveredItems(readableText, talkingPoints);
  const jobFactsCovered = countCoveredItems(readableText, jobFacts);
  const firstParagraphHasKeyword = primaryKeyword.length > 0 && firstParagraph.includes(primaryKeyword);

  const issues: string[] = [];
  if (wordCount < BLOG_MIN_WORD_COUNT) {
    issues.push(`Increase depth. Draft is only about ${wordCount} words and needs more substance.`);
  }
  if (targetCity && locationMentions < BLOG_TARGET_LOCATION_MENTIONS) {
    issues.push(`Mention ${targetCity} more naturally throughout the post.`);
  }
  if (!firstParagraphHasKeyword && primaryKeyword) {
    issues.push(`Use the primary keyword "${primaryKeyword}" naturally in the first paragraph.`);
  }
  if (talkingPoints.length > 0 && talkingPointsCovered < talkingPoints.length) {
    issues.push(`Cover every talking point directly. Currently covered ${talkingPointsCovered} of ${talkingPoints.length}.`);
  }
  if (jobFacts.length > 0 && jobFactsCovered < jobFacts.length) {
    issues.push(`Weave in all job-specific facts. Currently covered ${jobFactsCovered} of ${jobFacts.length}.`);
  }
  if (genericPhraseHits.length > BLOG_MAX_GENERIC_PHRASES) {
    issues.push(`Replace generic filler language with concrete details. Problem phrases: ${genericPhraseHits.join(", ")}.`);
  }

  const faqSection = output.content.find((section) => section.type === "faq");
  const faqCount = normalizeFaqEntries(faqSection?.content?.questions).length;
  if (faqSection && faqCount < BLOG_FAQ_MIN_DEFAULT) {
    issues.push(`Expand the FAQ so it has at least ${BLOG_FAQ_MIN_DEFAULT} useful entries.`);
  }

  return {
    wordCount,
    locationMentions,
    talkingPointsCovered,
    talkingPointsTotal: talkingPoints.length,
    jobFactsCovered,
    jobFactsTotal: jobFacts.length,
    genericPhraseHits,
    firstParagraphHasKeyword,
    issues,
  };
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
  const businessName = (input.businessName || "").trim();
  const prompt = `You are an expert SEO content writer. Regenerate ONLY the ${input.sectionType} section for a ${input.blogType} blog post about ${input.serviceName} in ${input.targetCity}.

TONE: ${input.tonePreference}
${businessName ? `BUSINESS NAME TO USE WHEN BRAND NAME IS NEEDED: ${businessName}` : ""}

${input.context ? `ADDITIONAL CONTEXT: ${input.context}` : ""}

Current content structure:
${JSON.stringify(input.existingContent.map(s => ({ type: s.type, id: s.id })), null, 2)}

Generate a new version of the ${input.sectionType} section. Respond with a JSON object:
{
  "id": "${input.sectionId || "keep-existing-id"}",
  "type": "${input.sectionType}",
  "content": { section-specific content },
  "isLocked": false
}

Use the appropriate content format for the section type as described in the main generation instructions.
Never output placeholders such as [Your Company Name], [Company Name], [Business Name], [Phone Number], or [Email Address].
${businessName ? `If the copy needs a business name, use "${businessName}" exactly.` : `If no business name is available, use natural wording such as "our team" or "the company".`}`;

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

export async function expandBlogText(input: TextExpansionInput): Promise<string> {
  const businessName = (input.businessName || "").trim();
  const prompt = `You are an expert SEO content writer for local service businesses.

Expand the existing ${input.fieldLabel} copy for the ${input.sectionType} section of a ${input.blogType} blog post.

Business/service: ${input.serviceName}
${businessName ? `Business name: ${businessName}` : ""}
Target location: ${input.targetCity}
Tone: ${input.tonePreference}

REQUIREMENTS:
1. Keep the meaning and factual claims consistent with the original text.
2. Expand the writing with more specificity, clarity, and helpful detail.
3. Do not invent concrete facts, prices, measurements, timelines, or guarantees that are not already supported by the source text.
4. Preserve paragraph formatting and return plain text only.
5. Avoid filler, repetition, hype, and vague generic language.
6. Keep the result appropriate for direct insertion into the same field.
7. Never output placeholders such as [Your Company Name], [Company Name], [Business Name], [Phone Number], or [Email Address].
8. ${businessName ? `If the copy needs a business name, use "${businessName}" exactly.` : `If no business name is available, use natural wording such as "our team" or "the company".`}

${input.context ? `ADDITIONAL CONTEXT:\n${input.context}\n` : ""}

CURRENT TEXT:
${input.currentText.trim()}

Return only the expanded text. Do not use JSON. Do not use markdown fences.`;

  const providers = [
    { name: 'Claude', fn: () => expandTextWithClaude(prompt) },
    { name: 'Gemini', fn: () => expandTextWithGemini(prompt) },
    { name: 'OpenAI', fn: () => expandTextWithOpenAI(prompt) }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) return result;
    } catch (error) {
      console.error(`${provider.name} text expansion failed:`, error);
    }
  }

  throw new Error('All AI providers failed to expand text');
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

async function expandTextWithClaude(prompt: string): Promise<string | null> {
  const client = getClaude();
  if (!client) return null;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }]
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') return null;
  return normalizeExpandedText(textContent.text);
}

async function expandTextWithGemini(prompt: string): Promise<string | null> {
  const client = getGemini();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });

  if (!response.text) return null;
  return normalizeExpandedText(response.text);
}

async function expandTextWithOpenAI(prompt: string): Promise<string | null> {
  const client = getOpenAI();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return null;
  return normalizeExpandedText(text);
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

function normalizeExpandedText(text: string): string {
  const stripped = text.replace(/```(?:[\w-]+)?\s*([\s\S]*?)```/g, "$1").trim();
  return stripped.replace(/\n{3,}/g, "\n\n").trim();
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
  const readableText = extractReadableText(output.content);
  const wordCount = countWordEstimate(readableText);
  const firstParagraph = getFirstParagraph(output.content).toLowerCase();
  const qualityAssessment = assessBlogDraftQuality(output, input);

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
  if (targetCity.length > 0) {
    const hasLocationInTitle = output.title.toLowerCase().includes(targetCity);
    checklist.push({
      id: 'location-title',
      label: 'Target location in title',
      isPassed: hasLocationInTitle
    });
    totalPoints += 10;
    if (hasLocationInTitle) earnedPoints += 10;
  }

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
  const hasGoodLength = wordCount >= 800;
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

  const hasKeywordInFirstParagraph = primaryKeyword.length > 0 && firstParagraph.includes(primaryKeyword);
  checklist.push({
    id: 'keyword-first-paragraph',
    label: 'Primary keyword in first paragraph',
    isPassed: hasKeywordInFirstParagraph
  });
  totalPoints += 5;
  if (hasKeywordInFirstParagraph) earnedPoints += 5;

  if (targetCity.length > 0) {
    const hasRepeatedLocationSignal = qualityAssessment.locationMentions >= BLOG_TARGET_LOCATION_MENTIONS;
    checklist.push({
      id: 'location-coverage',
      label: 'Target location mentioned throughout content',
      isPassed: hasRepeatedLocationSignal
    });
    totalPoints += 5;
    if (hasRepeatedLocationSignal) earnedPoints += 5;
  }

  const hasTalkingPointCoverage = qualityAssessment.talkingPointsTotal === 0
    || qualityAssessment.talkingPointsCovered >= qualityAssessment.talkingPointsTotal;
  checklist.push({
    id: 'talking-point-coverage',
    label: 'All talking points covered',
    isPassed: hasTalkingPointCoverage
  });
  totalPoints += 5;
  if (hasTalkingPointCoverage) earnedPoints += 5;

  const score = Math.round((earnedPoints / totalPoints) * 100);

  return { score, checklist };
}

// Convert blog content to HTML for Duda
export interface BlogHtmlEnhancements {
  designStyle?: string;
  internalLinks?: BlogInternalLink[];
  videoUrl?: string;
  facebookPostUrl?: string;
  gmbPostUrl?: string;
  ctaButtonEnabled?: boolean;
  ctaButtonUrl?: string;
  autobidderFormUrl?: string;
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

interface BlogPricingTableEntry {
  heading: string;
  rows: Array<{
    label: string;
    priceRange: string;
    details: string;
  }>;
}

interface ResolvedBlogImage {
  src: string;
  alt: string;
  style: string;
}

interface ResolvedBeforeAfterPair {
  before: ResolvedBlogImage;
  after: ResolvedBlogImage;
}

export type BlogDesignStyle = "classic_blue" | "warm_sunset" | "forest_clean";

function normalizeBlogDesignStyle(value?: string | null): BlogDesignStyle {
  if (value === "warm_sunset" || value === "forest_clean" || value === "classic_blue") {
    return value;
  }
  return "classic_blue";
}

export function getBlogDesignCssSnippet(style?: string | null): string {
  const baseCss = `
.blog-job-summary {
  max-width: 900px;
  margin: 0 auto;
  padding: 36px 28px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(248, 251, 255, 0.96) 0%, rgba(239, 247, 255, 0.96) 100%);
  border: 1px solid rgba(17, 72, 120, 0.12);
  box-shadow:
    0 18px 50px rgba(19, 41, 61, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  position: relative;
  overflow: hidden;
}
.blog-job-summary::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #0f4c81, #2e86de, #7fc8ff);
}
.blog-job-summary::after {
  content: "";
  position: absolute;
  top: -80px;
  right: -80px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(127, 200, 255, 0.22) 0%, rgba(127, 200, 255, 0) 70%);
  pointer-events: none;
}
.blog-job-summary h2 {
  margin: 0 0 24px;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.1;
  color: #13293d;
  letter-spacing: -0.02em;
}
.blog-summary-lines {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}
.blog-summary-lines p {
  margin: 0;
  padding: 18px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow: 0 10px 24px rgba(19, 41, 61, 0.06);
  color: #4b5b6b;
  font-size: 16px;
  line-height: 1.6;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.blog-summary-lines p:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(19, 41, 61, 0.10);
  border-color: rgba(46, 134, 222, 0.18);
}
.blog-summary-lines b {
  display: block;
  margin-bottom: 6px;
  color: #0f4c81;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.blog-job-summary h3 {
  margin: 0 0 16px;
  font-size: 22px;
  line-height: 1.2;
  color: #13293d;
}
.blog-highlights {
  display: grid;
  gap: 14px;
}
.blog-highlights p {
  position: relative;
  margin: 0;
  padding: 18px 18px 18px 54px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow: 0 10px 24px rgba(19, 41, 61, 0.06);
  color: #4b5b6b;
  font-size: 16px;
  line-height: 1.7;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.blog-highlights p:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(19, 41, 61, 0.10);
  border-color: rgba(46, 134, 222, 0.18);
}
.blog-highlights p::before {
  content: "✓";
  position: absolute;
  top: 18px;
  left: 18px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f4c81, #2e86de);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(46, 134, 222, 0.25);
}
.blog-hero img,
.blog-image-grid img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 22px;
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow:
    0 18px 40px rgba(19, 41, 61, 0.10),
    inset 0 1px 0 rgba(255,255,255,0.65);
  background: #ffffff;
}
.blog-image-grid {
  display: grid;
  gap: 16px;
}
.blog-images h2 {
  margin: 0 0 18px;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.1;
  color: #13293d;
}
.blog-before-after {
  max-width: 950px;
  margin: 0 auto;
  padding: 44px 22px;
}
.before-after-slider {
  position: relative;
}
.before-after-slider + .before-after-slider {
  margin-top: 18px;
}
.before-after-stage {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 26px;
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow:
    0 18px 44px rgba(19, 41, 61, 0.10),
    inset 0 1px 0 rgba(255,255,255,0.75);
  background: #dbe7f3;
}
.before-after-stage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.before-after-base,
.before-after-overlay {
  position: absolute;
  inset: 0;
}
.before-after-overlay {
  width: 50%;
  overflow: hidden;
  border-right: 2px solid rgba(255,255,255,0.95);
}
.before-after-overlay img {
  width: 100%;
  height: 100%;
  max-width: none;
}
.before-after-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 0;
  pointer-events: none;
}
.before-after-divider::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -1px;
  width: 2px;
  background: rgba(255,255,255,0.98);
  box-shadow: 0 0 0 1px rgba(19, 41, 61, 0.06);
}
.before-after-handle {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f4c81, #2e86de);
  box-shadow: 0 12px 28px rgba(46, 134, 222, 0.24);
}
.before-after-handle::before,
.before-after-handle::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-top: 2px solid #ffffff;
  border-right: 2px solid #ffffff;
}
.before-after-handle::before {
  left: 14px;
  transform: translateY(-50%) rotate(225deg);
}
.before-after-handle::after {
  right: 14px;
  transform: translateY(-50%) rotate(45deg);
}
.before-after-badge {
  position: absolute;
  top: 18px;
  z-index: 2;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(19, 41, 61, 0.75);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}
.before-after-badge.before {
  left: 18px;
}
.before-after-badge.after {
  right: 18px;
}
.before-after-range {
  position: absolute;
  inset: 0;
  z-index: 4;
  width: 100%;
  height: 100%;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: ew-resize;
  opacity: 0;
}
.before-after-range::-webkit-slider-runnable-track {
  height: 100%;
  background: transparent;
  border: 0;
}
.before-after-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: ew-resize;
}
.before-after-range::-moz-range-track {
  height: 100%;
  background: transparent;
  border: 0;
}
.before-after-range::-moz-range-thumb {
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: ew-resize;
}
.before-after-copy-grid {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}
.before-after-copy-card {
  padding: 20px 20px 18px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,250,255,0.98) 100%);
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow: 0 14px 36px rgba(19, 41, 61, 0.08);
}
.before-after-copy-card h3 {
  margin: 0 0 12px;
  font-size: 22px;
  line-height: 1.2;
  color: #13293d;
}
.before-after-copy-card p {
  margin: 0;
  font-size: 16px;
  line-height: 1.8;
  color: #4b5b6b;
}
@media (min-width: 900px) {
  .blog-image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .before-after-copy-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.blog-pricing-factors {
  max-width: 950px;
  margin: 0 auto;
  padding: 44px 22px;
  position: relative;
}
.blog-pricing-table,
.blog-pricing-chart,
.blog-autobidder-form {
  max-width: 950px;
  margin: 0 auto;
  padding: 44px 22px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(248, 251, 255, 0.96) 0%, rgba(239, 247, 255, 0.96) 100%);
  border: 1px solid rgba(17, 72, 120, 0.12);
  box-shadow:
    0 18px 50px rgba(19, 41, 61, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  position: relative;
  overflow: hidden;
}
.blog-pricing-table::before,
.blog-pricing-chart::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #0f4c81, #2e86de, #7fc8ff);
}
.blog-pricing-list,
.pricing-chart-bars {
  display: grid;
  gap: 20px;
}
.blog-pricing-item {
  position: relative;
  padding: 24px 24px 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,250,255,0.98) 100%);
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow:
    0 14px 36px rgba(19, 41, 61, 0.08),
    inset 0 1px 0 rgba(255,255,255,0.75);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.pricing-chart-row {
  margin: 0;
  padding: 18px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow: 0 10px 24px rgba(19, 41, 61, 0.06);
  color: #4b5b6b;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.blog-pricing-item:hover {
  transform: translateY(-4px);
  box-shadow:
    0 18px 44px rgba(19, 41, 61, 0.12),
    inset 0 1px 0 rgba(255,255,255,0.8);
  border-color: rgba(46, 134, 222, 0.18);
}
.pricing-chart-row:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(19, 41, 61, 0.10);
  border-color: rgba(46, 134, 222, 0.18);
}
.blog-pricing-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, #0f4c81, #2e86de, #7fc8ff);
}
.blog-pricing-item-header,
.pricing-chart-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.blog-pricing-item-header {
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.blog-pricing-item h3,
.pricing-chart-meta h3 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #13293d;
  letter-spacing: -0.01em;
}
.blog-pricing-item p,
.pricing-chart-meta p {
  margin: 0;
  color: #4b5b6b;
  font-size: 16px;
  line-height: 1.8;
}
.impact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  border: 1px solid transparent;
}
.impact-high {
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.12), rgba(255, 120, 120, 0.16));
  color: #b42318;
  border-color: rgba(220, 53, 69, 0.14);
  box-shadow: 0 8px 20px rgba(220, 53, 69, 0.10);
}
.impact-medium {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.14), rgba(255, 221, 87, 0.18));
  color: #8a5a00;
  border-color: rgba(255, 193, 7, 0.18);
  box-shadow: 0 8px 20px rgba(255, 193, 7, 0.10);
}
.impact-low {
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.12), rgba(80, 200, 120, 0.16));
  color: #146c43;
  border-color: rgba(25, 135, 84, 0.14);
  box-shadow: 0 8px 20px rgba(25, 135, 84, 0.10);
}
.blog-table-wrapper {
  overflow-x: auto;
}
.blog-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255,255,255,0.98);
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow:
    0 16px 36px rgba(19, 41, 61, 0.10),
    inset 0 1px 0 rgba(255,255,255,0.8);
}
.blog-table th,
.blog-table td {
  padding: 18px 20px;
  text-align: left;
  vertical-align: top;
}
.blog-table th {
  background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
  color: #0f4c81;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.blog-table thead th {
  box-shadow: inset 0 -1px 0 rgba(19, 41, 61, 0.08);
}
.blog-table td {
  color: #4b5b6b;
  font-size: 16px;
  line-height: 1.7;
  border-top: 1px solid rgba(19, 41, 61, 0.08);
}
.blog-table tbody th {
  color: #13293d;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.5;
  border-top: 1px solid rgba(19, 41, 61, 0.08);
  background: rgba(248, 251, 255, 0.58);
}
.blog-table td:nth-child(2) {
  color: #13293d;
  font-weight: 700;
  white-space: nowrap;
}
.pricing-chart-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f4c81, #2e86de);
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 8px 20px rgba(46, 134, 222, 0.24);
}
.pricing-chart-track {
  margin-top: 14px;
  height: 14px;
  border-radius: 999px;
  background: rgba(19, 41, 61, 0.08);
  overflow: hidden;
}
.pricing-chart-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #0f4c81, #2e86de, #7fc8ff);
  box-shadow: 0 10px 22px rgba(46, 134, 222, 0.24);
}
.blog-form-embed {
  overflow: hidden;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(19, 41, 61, 0.08);
  box-shadow: 0 12px 28px rgba(19, 41, 61, 0.08);
}
.blog-form-fallback {
  margin: 16px 0 0;
}
.blog-form-fallback a {
  color: #0f4c81;
  font-weight: 700;
  text-decoration: none;
}
.blog-form-fallback a:hover {
  text-decoration: underline;
}
.blog-faq {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: inherit;
}
.blog-section-heading {
  text-align: center;
  margin-bottom: 28px;
}
.blog-section-kicker {
  display: inline-block;
  padding: 6px 14px;
  margin-bottom: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #eaf4ff, #d9ecff);
  color: #0f4c81;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.blog-section-heading h2 {
  margin: 0 0 12px;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.1;
  color: #13293d;
}
.blog-section-intro {
  max-width: 700px;
  margin: 0 auto;
  font-size: 16px;
  line-height: 1.7;
  color: #5c6b7a;
}
.faq-accordion {
  display: grid;
  gap: 16px;
}
.faq-item {
  border: 1px solid rgba(19, 41, 61, 0.08);
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(19, 41, 61, 0.08);
  overflow: hidden;
  transition: all 0.25s ease;
}
.faq-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 36px rgba(19, 41, 61, 0.12);
  border-color: rgba(15, 76, 129, 0.18);
}
.faq-item summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px;
  font-size: 18px;
  font-weight: 700;
  color: #13293d;
}
.faq-item summary::-webkit-details-marker {
  display: none;
}
.faq-question-text {
  flex: 1;
}
.faq-expand-hint {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #0f4c81;
}
.faq-expand-hint::after {
  content: "+";
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f4c81, #1976c9);
  color: #fff;
  font-size: 18px;
  box-shadow: 0 8px 18px rgba(25, 118, 201, 0.28);
  transition: 0.25s ease;
}
.faq-item[open] {
  border-color: rgba(25, 118, 201, 0.2);
  box-shadow: 0 18px 40px rgba(19, 41, 61, 0.12);
}
.faq-item[open] summary {
  background: linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%);
}
.faq-item[open] .faq-expand-hint::after {
  content: "–";
}
.faq-answer {
  padding: 0 24px 24px;
  color: #4b5b6b;
  font-size: 16px;
  line-height: 1.75;
  font-weight: 400;
}
.faq-item[open] .faq-answer {
  animation: fadeDown 0.3s ease;
}
@keyframes fadeDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 767px) {
  .blog-job-summary {
    padding: 26px 18px;
    border-radius: 22px;
  }
  .blog-before-after,
  .blog-pricing-table,
  .blog-pricing-chart,
  .blog-autobidder-form,
  .blog-faq {
    padding: 26px 18px;
    border-radius: 22px;
  }
  .blog-pricing-factors {
    padding: 30px 14px;
  }
  .before-after-stage {
    border-radius: 20px;
  }
  .before-after-badge {
    top: 14px;
    padding: 7px 10px;
    font-size: 11px;
  }
  .before-after-badge.before {
    left: 14px;
  }
  .before-after-badge.after {
    right: 14px;
  }
  .before-after-copy-card {
    padding: 18px 16px 16px;
    border-radius: 18px;
  }
  .before-after-copy-card h3 {
    font-size: 20px;
  }
  .before-after-copy-card p {
    font-size: 15px;
    line-height: 1.75;
  }
  .blog-summary-lines {
    grid-template-columns: 1fr;
  }
  .blog-summary-lines p,
  .blog-highlights p,
  .pricing-chart-row {
    padding: 16px 16px;
  }
  .blog-pricing-item {
    padding: 20px 18px 18px;
    border-radius: 20px;
  }
  .blog-highlights p {
    padding-left: 50px;
  }
  .blog-highlights p::before {
    top: 16px;
    left: 16px;
  }
  .blog-pricing-item-header,
  .pricing-chart-meta,
  .faq-item summary {
    flex-direction: column;
    align-items: flex-start;
  }
  .blog-pricing-item h3 {
    font-size: 21px;
  }
  .blog-pricing-item p {
    font-size: 15px;
    line-height: 1.75;
  }
  .blog-table {
    border-radius: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  .blog-table-wrapper {
    overflow-x: visible;
  }
  .blog-table thead {
    display: none;
  }
  .blog-table,
  .blog-table tbody,
  .blog-table tr,
  .blog-table th,
  .blog-table td {
    display: block;
    width: 100%;
  }
  .blog-table tbody {
    display: grid;
    gap: 14px;
  }
  .blog-table tr {
    padding: 16px;
    border-radius: 18px;
    background: rgba(255,255,255,0.98);
    border: 1px solid rgba(19, 41, 61, 0.08);
    box-shadow:
      0 12px 28px rgba(19, 41, 61, 0.08),
      inset 0 1px 0 rgba(255,255,255,0.82);
  }
  .blog-table td,
  .blog-table tbody th {
    padding: 0;
    border: 0;
    background: transparent;
    white-space: normal;
  }
  .blog-table tbody th + td,
  .blog-table td + td {
    margin-top: 10px;
  }
  .blog-table tbody th::before,
  .blog-table td::before {
    content: attr(data-label);
    display: block;
    margin-bottom: 4px;
    color: #0f4c81;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .blog-table tbody th {
    font-size: 18px;
    line-height: 1.4;
  }
  .blog-table td:nth-child(2) {
    white-space: normal;
  }
  .blog-table td:nth-child(2)::before {
    color: #0f4c81;
  }
  .pricing-chart-value {
    font-size: 13px;
    padding: 7px 12px;
  }
  .pricing-chart-track {
    height: 12px;
  }
}`.trim();

  return `${baseCss}\n${getBlogDesignCssOverrides(style)}`.trim();
}

function getBlogDesignCssOverrides(style?: string | null): string {
  const normalizedStyle = normalizeBlogDesignStyle(style);

  if (normalizedStyle === "warm_sunset") {
    return `
.blog-job-summary,
.blog-pricing-table,
.blog-pricing-chart,
.blog-autobidder-form {
  background: linear-gradient(180deg, rgba(255, 249, 243, 0.98) 0%, rgba(255, 239, 227, 0.96) 100%);
  border-color: rgba(168, 85, 24, 0.12);
}
.blog-job-summary::before,
.blog-pricing-table::before,
.blog-pricing-chart::before,
.blog-pricing-item::before {
  background: linear-gradient(90deg, #c2410c, #ea580c, #fb923c);
}
.blog-job-summary::after {
  background: radial-gradient(circle, rgba(251, 191, 36, 0.18) 0%, rgba(251, 191, 36, 0) 70%);
}
.blog-job-summary h2,
.blog-job-summary h3,
.before-after-copy-card h3,
.blog-pricing-item h3,
.pricing-chart-meta h3,
.blog-section-heading h2,
.faq-item summary,
.blog-pricing-table h2,
.blog-pricing-chart h2 {
  color: #3b1f12;
}
.blog-summary-lines p,
.blog-highlights p,
.blog-pricing-item,
.pricing-chart-row,
.before-after-copy-card,
.blog-table {
  border-color: rgba(168, 85, 24, 0.10);
}
.blog-summary-lines p,
.blog-highlights p,
.blog-pricing-item p,
.pricing-chart-meta p,
.before-after-copy-card p,
.faq-answer,
.blog-section-intro,
.blog-table td {
  color: #6b4a36;
}
.blog-summary-lines b,
.blog-section-kicker,
.faq-expand-hint {
  color: #b45309;
}
.blog-section-kicker {
  background: linear-gradient(135deg, #fff1e6, #ffe4cf);
}
.blog-highlights p::before,
.before-after-handle,
.faq-expand-hint::after {
  background: linear-gradient(135deg, #c2410c, #f97316);
}
.before-after-stage,
.faq-item,
.blog-table {
  border-color: rgba(168, 85, 24, 0.10);
}
.faq-item[open] summary {
  background: linear-gradient(180deg, #fff8f1 0%, #fff1e8 100%);
}
.process-step {
  border-color: #fed7aa !important;
  background: radial-gradient(circle at top right, rgba(251,146,60,0.10), transparent 32%), linear-gradient(180deg, #ffffff 0%, #fff8f3 100%) !important;
  border-left-color: #ea580c !important;
}
.process-step-number {
  background: #fff7ed !important;
  color: #c2410c !important;
}
.duration {
  border-color: #fdba74 !important;
  color: #9a3412 !important;
}
.blog-table th {
  background: #fff7ed;
  color: #7c2d12;
  border-bottom-color: #fed7aa;
}
.blog-table td,
.blog-table tbody th {
  border-bottom-color: #fed7aa;
  color: #6b4a36;
}
.pricing-chart-track {
  background: #ffedd5;
}
.pricing-chart-fill {
  background: linear-gradient(135deg, #c2410c 0%, #fb923c 100%);
}
    `.trim();
  }

  if (normalizedStyle === "forest_clean") {
    return `
.blog-job-summary,
.blog-pricing-table,
.blog-pricing-chart,
.blog-autobidder-form {
  background: linear-gradient(180deg, rgba(245, 251, 247, 0.98) 0%, rgba(232, 245, 237, 0.96) 100%);
  border-color: rgba(22, 101, 52, 0.12);
}
.blog-job-summary::before,
.blog-pricing-table::before,
.blog-pricing-chart::before,
.blog-pricing-item::before {
  background: linear-gradient(90deg, #166534, #16a34a, #4ade80);
}
.blog-job-summary::after {
  background: radial-gradient(circle, rgba(74, 222, 128, 0.18) 0%, rgba(74, 222, 128, 0) 70%);
}
.blog-job-summary h2,
.blog-job-summary h3,
.before-after-copy-card h3,
.blog-pricing-item h3,
.pricing-chart-meta h3,
.blog-section-heading h2,
.faq-item summary,
.blog-pricing-table h2,
.blog-pricing-chart h2 {
  color: #163025;
}
.blog-summary-lines p,
.blog-highlights p,
.blog-pricing-item,
.pricing-chart-row,
.before-after-copy-card,
.blog-table {
  border-color: rgba(22, 101, 52, 0.10);
}
.blog-summary-lines p,
.blog-highlights p,
.blog-pricing-item p,
.pricing-chart-meta p,
.before-after-copy-card p,
.faq-answer,
.blog-section-intro,
.blog-table td {
  color: #426355;
}
.blog-summary-lines b,
.blog-section-kicker,
.faq-expand-hint {
  color: #166534;
}
.blog-section-kicker {
  background: linear-gradient(135deg, #e8f7ec, #d8f0df);
}
.blog-highlights p::before,
.before-after-handle,
.faq-expand-hint::after {
  background: linear-gradient(135deg, #166534, #16a34a);
}
.before-after-stage,
.faq-item,
.blog-table {
  border-color: rgba(22, 101, 52, 0.10);
}
.faq-item[open] summary {
  background: linear-gradient(180deg, #f5fbf7 0%, #eef8f2 100%);
}
.process-step {
  border-color: #bbf7d0 !important;
  background: radial-gradient(circle at top right, rgba(74,222,128,0.10), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f5fbf7 100%) !important;
  border-left-color: #16a34a !important;
}
.process-step-number {
  background: #ecfdf3 !important;
  color: #166534 !important;
}
.duration {
  border-color: #86efac !important;
  color: #166534 !important;
}
.blog-table th {
  background: #f0fdf4;
  color: #166534;
  border-bottom-color: #bbf7d0;
}
.blog-table td,
.blog-table tbody th {
  border-bottom-color: #bbf7d0;
  color: #426355;
}
.pricing-chart-track {
  background: #dcfce7;
}
.pricing-chart-fill {
  background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
}
    `.trim();
  }

  return "";
}

export function getBlogDesignHtmlSnippet(): string {
  return "";
}

export function stripEmbeddedBlogDesignStyles(html: string): string {
  return html.replace(/<style>[\s\S]*?\.ab-blog-content[\s\S]*?<\/style>/i, "").trim();
}

export function blogContentToHtml(
  content: BlogContentSection[],
  images?: BlogImageRenderInput[],
  enhancements?: BlogHtmlEnhancements
): string {
  const activeContent = (content || []).filter((section) => section?.enabled !== false);
  const normalizedImages = (images || [])
    .filter((img): img is BlogImageRenderInput => !!img?.url)
    .map((img) => ({
      url: img.url,
      imageType: normalizeImageType(img.imageType),
      caption: img.caption,
    }));
  const usedImageIndexes = new Set<number>();
  const faqEntries: BlogFaqEntry[] = [];
  const pricingTables: BlogPricingTableEntry[] = [];
  const effectiveCtaButtonEnabled = enhancements?.ctaButtonEnabled !== false;
  const effectiveCtaButtonUrl = sanitizeUrl(enhancements?.ctaButtonUrl);
  const autobidderFormUrl = sanitizeUrl(enhancements?.autobidderFormUrl);

  const htmlParts: string[] = [];

  for (const section of activeContent) {
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
            ${renderParagraphs(section.content.subheadline, "lead")}
            ${heroImageHtml}
          </header>
        `);
        break;

      case 'text':
        htmlParts.push(`
          <section class="blog-text">
            ${section.content.heading ? `
              <div class="blog-section-heading">
                <span class="blog-section-kicker">Article Section</span>
                <h2>${escapeHtml(section.content.heading)}</h2>
              </div>
            ` : ''}
            <div class="blog-copy">
              ${renderParagraphs(section.content.body)}
            </div>
          </section>
        `);
        break;

      case 'job_summary':
        const summaryCards = [
          { label: 'Project Type', value: section.content.projectType || '' },
          { label: 'Location', value: section.content.location || '' },
          { label: 'Duration', value: section.content.duration || '' },
        ].filter((item) => item.value);
        htmlParts.push(`
          <div style="margin:0px;">
            <section class="blog-job-summary">
              <h2>Project Overview</h2>
              <div class="blog-summary-lines" style="margin-bottom:${section.content.highlights?.length ? '28px' : '0'};">
              ${summaryCards.map((item) => `
                <p>
                  <b>${escapeHtml(item.label)}:</b>
                  ${escapeHtml(item.value)}
                </p>
              `).join("")}
              </div>
              ${section.content.highlights?.length ? `
                <h3>Highlights</h3>
                <div class="blog-highlights">
                  ${section.content.highlights.map((h: string) => `
                    <p>${escapeHtml(h)}</p>
                  `).join('')}
                </div>
              ` : ''}
            </section>
          </div>
        `);
        break;

      case 'before_after':
        const beforeImage = resolveImageValue(
          section.content.imageUrlBefore,
          normalizedImages,
          usedImageIndexes,
          "Before image"
        );
        const afterImage = resolveImageValue(
          section.content.imageUrlAfter,
          normalizedImages,
          usedImageIndexes,
          "After image"
        );
        if (!beforeImage || !afterImage) {
          break;
        }
        const beforeAfterPairs: ResolvedBeforeAfterPair[] = [
          { before: beforeImage, after: afterImage },
          ...resolveRemainingBeforeAfterPairs(normalizedImages, usedImageIndexes),
        ];
        htmlParts.push(`
          <section class="blog-before-after">
            <div class="blog-section-heading">
              <span class="blog-section-kicker">Before & After</span>
              <h2>See the Transformation</h2>
              ${section.content.improvements?.length ? `<p class="blog-section-intro">Drag the slider to compare the before and after results from the same viewpoint.</p>` : ""}
            </div>
            <div class="before-after-slider-group">
              ${beforeAfterPairs.map((pair, pairIndex) => `
                <div class="before-after-slider" id="before-after-${Math.random().toString(36).slice(2, 10)}-${pairIndex}">
                  <div class="before-after-stage">
                    <div class="before-after-base">
                      <img src="${pair.after.src}" alt="${pair.after.alt}" />
                    </div>
                    <div class="before-after-overlay" style="width:50%;">
                      <img src="${pair.before.src}" alt="${pair.before.alt}" />
                    </div>
                    <div class="before-after-divider" style="left:50%;">
                      <span class="before-after-handle"></span>
                    </div>
                    <span class="before-after-badge before">Before</span>
                    <span class="before-after-badge after">After</span>
                    <input
                      class="before-after-range"
                      type="range"
                      min="0"
                      max="100"
                      value="50"
                      aria-label="Before and after comparison slider"
                      oninput="(function(input){var root=input.closest('.before-after-slider');if(!root)return;var value=input.value+'%';var overlay=root.querySelector('.before-after-overlay');var divider=root.querySelector('.before-after-divider');if(overlay) overlay.style.width=value;if(divider) divider.style.left=value;})(this)"
                    />
                  </div>
                </div>
              `).join("")}
            </div>
            <div class="before-after-copy-grid">
              <section class="before-after-copy-card">
                <h3>Before</h3>
                <div class="blog-copy">
                  ${renderParagraphs(section.content.beforeDescription)}
                </div>
              </section>
              <section class="before-after-copy-card">
                <h3>After</h3>
                <div class="blog-copy">
                  ${renderParagraphs(section.content.afterDescription)}
                </div>
              </section>
            </div>
            ${section.content.improvements?.length ? `
              <h3 style="margin:18px 0 12px; color:#13293d; font-size:22px; line-height:1.2;">Key Improvements</h3>
              <div class="blog-improvements">
                ${section.content.improvements.map((i: string) => `<p>${escapeHtml(i)}</p>`).join('')}
              </div>
            ` : ''}
          </section>
        `);
        break;

      case 'process_timeline':
        const normalizedProcessSteps = Array.isArray(section.content.steps)
          ? section.content.steps.filter((step: any) =>
              (typeof step?.title === "string" && step.title.trim()) ||
              (typeof step?.description === "string" && step.description.trim()) ||
              (typeof step?.duration === "string" && step.duration.trim())
            )
          : [];
        if (normalizedProcessSteps.length === 0) {
          break;
        }
        htmlParts.push(`
          <section class="blog-process" style="border-radius:24px; padding:24px;">
            <div class="blog-section-heading" style="display:grid; gap:8px; margin-bottom:16px;">
              <span class="blog-section-kicker" style="display:inline-flex; align-items:center; width:fit-content; padding:4px 10px; border-radius:999px; background:#fff7ed; color:#c2410c; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Project Timeline</span>
              <h2 style="margin:0; color:#0f172a; letter-spacing:-0.02em;">How The Work Was Completed</h2>
              <p class="blog-section-intro" style="margin:0; color:#475569; line-height:1.7;">A step-by-step look at how this project moved from prep to final result.</p>
            </div>
            <div class="process-steps" style="margin:0; padding:0; display:grid; gap:16px;">
              ${normalizedProcessSteps.map((step: any, index: number) => `
                <section class="process-step" style="padding:20px; border-radius:22px; border:1px solid #dbeafe; background:radial-gradient(circle at top right, rgba(59,130,246,0.08), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); box-shadow:0 14px 30px rgba(15,23,42,0.07); border-left:6px solid #ea580c;">
                  <div class="process-step-topline" style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:10px;">
                    <span class="process-step-number" style="display:inline-flex; width:fit-content; padding:6px 12px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">Step ${index + 1}</span>
                    ${step.duration ? `<span class="duration" style="display:inline-flex; width:fit-content; padding:6px 11px; border-radius:999px; background:#ffffff; border:1px solid #bfdbfe; color:#1e40af; font-size:12px; font-weight:700; box-shadow:0 6px 14px rgba(37,99,235,0.08);">${escapeHtml(step.duration)}</span>` : ''}
                  </div>
                  <h3 style="margin:0 0 10px 0; color:#0f172a; font-size:1.2rem; line-height:1.3;">${escapeHtml(step.title || `Step ${index + 1}`)}</h3>
                  <div class="blog-copy" style="display:grid; gap:14px;">
                    ${renderParagraphs(step.description)}
                  </div>
                </section>
              `).join('')}
            </div>
          </section>
        `);
        break;

      case 'pricing_factors':
        const normalizedPricingFactors = Array.isArray(section.content.factors)
          ? section.content.factors.filter((factor: any) =>
              (typeof factor?.name === "string" && factor.name.trim()) ||
              (typeof factor?.description === "string" && factor.description.trim())
            )
          : [];
        if (!section.content.intro && normalizedPricingFactors.length === 0) {
          break;
        }
        htmlParts.push(`
          <section class="blog-pricing-factors">
            <div class="blog-section-heading">
              <span class="blog-section-kicker">Pricing Guide</span>
              <h2>What Affects Pricing</h2>
              ${section.content.intro ? `<p class="blog-section-intro">${escapeHtml(section.content.intro)}</p>` : ''}
            </div>
            <div class="blog-pricing-list">
              ${normalizedPricingFactors.map((factor: any) => `
                <section class="blog-pricing-item">
                  <div class="blog-pricing-item-header">
                    <h3>${escapeHtml(factor.name || 'Pricing Factor')}</h3>
                    <span class="impact impact-${factor.impact || 'medium'}">${escapeHtml((factor.impact || 'medium').toUpperCase())} impact</span>
                  </div>
                  ${factor.description ? `<p>${escapeHtml(factor.description)}</p>` : ''}
                </section>
              `).join('')}
            </div>
          </section>
        `);
        break;

      case 'pricing_table':
        const pricingTableColumns = Array.isArray(section.content.columns)
          ? section.content.columns.filter((column: any) => typeof column === "string" && column.trim()).slice(0, 3)
          : [];
        const pricingTableRows = Array.isArray(section.content.rows)
          ? section.content.rows.filter((row: any) =>
              (typeof row?.label === "string" && row.label.trim()) ||
              (typeof row?.priceRange === "string" && row.priceRange.trim()) ||
              (typeof row?.details === "string" && row.details.trim())
            )
          : [];
        if (pricingTableRows.length === 0) {
          break;
        }
        const pricingTableHeading = section.content.heading || "Typical Price Ranges";
        pricingTables.push({
          heading: pricingTableHeading,
          rows: pricingTableRows.map((row: any) => ({
            label: typeof row?.label === "string" ? row.label.trim() : "",
            priceRange: typeof row?.priceRange === "string" ? row.priceRange.trim() : "",
            details: typeof row?.details === "string" ? row.details.trim() : "",
          })).filter((row: { label: string; priceRange: string; details: string }) => row.label || row.priceRange || row.details),
        });
        htmlParts.push(`
          <section class="blog-pricing-table">
            <div class="blog-section-heading">
              <span class="blog-section-kicker">Price Ranges</span>
              <h2>${escapeHtml(pricingTableHeading)}</h2>
            </div>
            <div class="blog-table-wrapper">
              <table class="blog-table">
                <caption style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">
                  ${escapeHtml(pricingTableHeading)}
                </caption>
                <thead>
                  <tr>
                    ${(pricingTableColumns.length > 0 ? pricingTableColumns : ["Service Tier", "Typical Price", "What's Included"]).map((column: string) => `
                      <th scope="col">${escapeHtml(column)}</th>
                    `).join("")}
                  </tr>
                </thead>
                <tbody>
                  ${(() => {
                    const columns = (pricingTableColumns.length > 0 ? pricingTableColumns : ["Service Tier", "Typical Price", "What's Included"]);
                    const firstColumnLabel = escapeHtml(columns[0] || "Service Tier");
                    const secondColumnLabel = escapeHtml(columns[1] || "Typical Price");
                    const thirdColumnLabel = escapeHtml(columns[2] || "What's Included");
                    return pricingTableRows.map((row: any) => `
                    <tr>
                      <th scope="row" data-label="${firstColumnLabel}">${escapeHtml(row.label || "")}</th>
                      <td data-label="${secondColumnLabel}">${escapeHtml(row.priceRange || "")}</td>
                      <td data-label="${thirdColumnLabel}">${escapeHtml(row.details || "")}</td>
                    </tr>
                  `).join("");
                  })()}
                </tbody>
              </table>
            </div>
          </section>
        `);
        break;

      case 'pricing_chart':
        const pricingChartBars = Array.isArray(section.content.bars)
          ? section.content.bars.filter((bar: any) => typeof bar?.label === "string" && bar.label.trim())
          : [];
        const normalizedBars = pricingChartBars
          .map((bar: any) => {
            const numericValue = Number(bar?.value);
            return {
              label: typeof bar?.label === "string" ? bar.label.trim() : "",
              value: Number.isFinite(numericValue) ? numericValue : 0,
              displayValue: typeof bar?.displayValue === "string" && bar.displayValue.trim()
                ? bar.displayValue.trim()
                : (Number.isFinite(numericValue) ? `$${Math.round(numericValue)}` : ""),
              description: typeof bar?.description === "string" ? bar.description.trim() : "",
            };
          })
          .filter((bar: { label: string }) => bar.label);
        if (normalizedBars.length === 0) {
          break;
        }
        const maxBarValue = Math.max(...normalizedBars.map((bar: { value: number }) => bar.value), 0) || 1;
        htmlParts.push(`
          <section class="blog-pricing-chart">
            <div class="blog-section-heading">
              <span class="blog-section-kicker">Cost Comparison</span>
              <h2>${escapeHtml(section.content.heading || "Pricing Snapshot")}</h2>
            </div>
            <div class="pricing-chart-bars">
              ${normalizedBars.map((bar: { label: string; displayValue: string; description: string; value: number }) => `
                <div class="pricing-chart-row">
                  <div class="pricing-chart-meta">
                    <div>
                      <h3>${escapeHtml(bar.label)}</h3>
                      ${bar.description ? `<p>${escapeHtml(bar.description)}</p>` : ""}
                    </div>
                    ${bar.displayValue ? `<span class="pricing-chart-value">${escapeHtml(bar.displayValue)}</span>` : ""}
                  </div>
                  <div class="pricing-chart-track">
                    <div class="pricing-chart-fill" style="width:${Math.max(12, Math.round((bar.value / maxBarValue) * 100))}%"></div>
                  </div>
                </div>
              `).join("")}
            </div>
          </section>
        `);
        break;

      case 'map_embed':
        const mapLocationLabel = typeof section.content?.locationLabel === "string"
          ? section.content.locationLabel.trim()
          : "";
        const mapHeading = typeof section.content?.heading === "string" && section.content.heading.trim()
          ? section.content.heading.trim()
          : (mapLocationLabel ? `${mapLocationLabel} Service Area Map` : "Service Area Map");
        const mapBody = typeof section.content?.body === "string" && section.content.body.trim()
          ? section.content.body.trim()
          : (mapLocationLabel ? `Use the map below to see ${mapLocationLabel} and the surrounding service area referenced in this post.` : "Use the map below to view the area referenced in this post.");
        const mapEmbedSrc = extractMapIframeSrc(section.content?.embedHtml) || buildGoogleMapsEmbedUrl(mapLocationLabel);
        const mapUrl = sanitizeUrl(section.content?.mapUrl) || (mapLocationLabel ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapLocationLabel)}` : null);
        if (!mapEmbedSrc && !mapUrl) {
          break;
        }
        htmlParts.push(`
          <section class="blog-map-embed">
            <div class="blog-section-heading">
              <span class="blog-section-kicker">Location</span>
              <h2>${escapeHtml(mapHeading)}</h2>
              ${mapBody ? `<p class="blog-section-intro">${escapeHtml(mapBody)}</p>` : ""}
            </div>
            ${mapEmbedSrc ? `
              <div class="blog-map-frame" style="overflow:hidden;border-radius:24px;border:1px solid #dbe4f0;box-shadow:0 18px 36px rgba(15,23,42,0.08);background:#fff;">
                <iframe
                  src="${escapeHtml(mapEmbedSrc)}"
                  title="${escapeHtml(mapLocationLabel || 'Service area map')}"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  style="width:100%;height:420px;border:0;display:block;background:#fff;"
                ></iframe>
              </div>
            ` : ""}
            ${mapUrl ? `
              <p class="blog-map-link" style="margin-top:14px;">
                <a href="${escapeHtml(mapUrl)}" rel="noopener noreferrer" target="_blank">Open this location in Google Maps</a>
              </p>
            ` : ""}
          </section>
        `);
        break;

      case 'faq':
        const normalizedFaqEntries = normalizeFaqEntries(section.content.questions);
        if (normalizedFaqEntries.length === 0) {
          break;
        }
        faqEntries.push(...normalizedFaqEntries);
        htmlParts.push(`
          <section class="blog-faq">
            <div class="blog-section-heading">
              <span class="blog-section-kicker">FAQ</span>
              <h2>Frequently Asked Questions</h2>
              <p class="blog-section-intro">Click a question to expand the answer and see the details customers usually want before booking.</p>
            </div>
            <div class="faq-accordion">
              ${normalizedFaqEntries.map((q: BlogFaqEntry, index: number) => `
                <details class="faq-item" ${index === 0 ? "open" : ""}>
                  <summary>
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; width:100%;">
                      <div>
                        <span class="faq-question-text">${escapeHtml(q.question)}</span>
                        <span class="faq-expand-hint">Click to expand</span>
                      </div>
                    </div>
                  </summary>
                  <div class="faq-answer">
                    <div class="blog-copy">
                      ${renderParagraphs(q.answer)}
                    </div>
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
            <div class="blog-copy">
              ${renderParagraphs(section.content.body)}
            </div>
            ${effectiveCtaButtonEnabled ? `
              <a href="${escapeHtml(ctaButtonUrl)}" class="cta-button">
                ${escapeHtml(section.content.buttonText || 'Contact Us')}
              </a>
            ` : ""}
          </section>
        `);
        break;

      case 'autobidder_form':
        if (!autobidderFormUrl) {
          break;
        }
        htmlParts.push(`
          <section class="blog-autobidder-form">
            <div class="blog-section-heading">
              <span class="blog-section-kicker">Instant Quote</span>
              <h2>${escapeHtml(section.content.heading || "Get an Instant Quote")}</h2>
              ${section.content.body ? `<p class="blog-section-intro">${escapeHtml(section.content.body)}</p>` : ""}
            </div>
            <div class="blog-form-embed">
              <iframe
                src="${escapeHtml(autobidderFormUrl)}"
                title="Instant quote form"
                loading="lazy"
                style="width:100%;min-height:720px;border:0;background:#ffffff;"
              ></iframe>
            </div>
            <p class="blog-form-fallback">
              <a href="${escapeHtml(autobidderFormUrl)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(section.content.buttonText || "Open the quote form in a new tab")}
              </a>
            </p>
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
    pricingTables,
    localBusiness: enhancements?.localBusiness,
    facebookPostUrl: enhancements?.facebookPostUrl,
    gmbPostUrl: enhancements?.gmbPostUrl,
  });
  if (structuredDataHtml) {
    html += structuredDataHtml;
  }

  const designCss = getBlogDesignCssSnippet(enhancements?.designStyle);
  const scopedStyles = designCss ? `<style>${designCss}</style>` : "";

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
  pricingTables: BlogPricingTableEntry[];
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

  for (const table of input.pricingTables) {
    if (!table.rows.length) continue;

    scripts.push(
      toJsonLdScript({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: table.heading,
        itemListOrder: "https://schema.org/ItemListUnordered",
        numberOfItems: table.rows.length,
        itemListElement: table.rows.map((row, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: row.label || `Option ${index + 1}`,
            ...(row.details || row.priceRange
              ? { description: [row.priceRange, row.details].filter(Boolean).join(" — ") }
              : {}),
            ...(row.priceRange
              ? {
                  offers: {
                    "@type": "Offer",
                    priceSpecification: {
                      "@type": "PriceSpecification",
                      description: row.priceRange,
                    },
                  },
                }
              : {}),
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
  const resolved = resolveBlogImage(img, fallbackAlt, index, usedImageIndexes);
  return `<img src="${resolved.src}" alt="${resolved.alt}" />`;
}

function resolveBlogImage(
  img: BlogImageRenderInput,
  fallbackAlt: string,
  index: number,
  usedImageIndexes: Set<number>
): ResolvedBlogImage {
  usedImageIndexes.add(index);
  return {
    src: escapeHtml(img.url),
    alt: escapeHtml(img.caption || fallbackAlt || `${img.imageType} image`),
    style: "",
  };
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

function resolveImageForType(
  placeholderType: string,
  images: Array<BlogImageRenderInput>,
  usedImageIndexes: Set<number>,
  fallbackAlt: string
): ResolvedBlogImage | null {
  if (images.length === 0) return null;

  const normalizedType = normalizeImageType(placeholderType);

  const exactUnused = images.findIndex((img, idx) => !usedImageIndexes.has(idx) && img.imageType === normalizedType);
  if (exactUnused >= 0) {
    return resolveBlogImage(images[exactUnused], fallbackAlt, exactUnused, usedImageIndexes);
  }

  const anyUnused = images.findIndex((_img, idx) => !usedImageIndexes.has(idx));
  if (anyUnused >= 0) {
    return resolveBlogImage(images[anyUnused], fallbackAlt, anyUnused, usedImageIndexes);
  }

  const exactAny = images.findIndex((img) => img.imageType === normalizedType);
  if (exactAny >= 0) {
    return resolveBlogImage(images[exactAny], fallbackAlt, exactAny, usedImageIndexes);
  }

  return null;
}

function resolveImageValue(
  value: unknown,
  images: Array<BlogImageRenderInput>,
  usedImageIndexes: Set<number>,
  fallbackAlt: string
): ResolvedBlogImage | null {
  if (typeof value !== "string" || !value.trim()) return null;

  const placeholderType = parseImagePlaceholderToken(value);
  if (placeholderType) {
    return resolveImageForType(placeholderType, images, usedImageIndexes, fallbackAlt);
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
    return {
      src: escapeHtml(value),
      alt: escapeHtml(fallbackAlt || "Blog image"),
      style: "",
    };
  }

  return null;
}

function resolveRemainingBeforeAfterPairs(
  images: Array<BlogImageRenderInput>,
  usedImageIndexes: Set<number>
): ResolvedBeforeAfterPair[] {
  const unusedBeforeIndexes = images
    .map((img, index) => ({ img, index }))
    .filter(({ img, index }) => img.imageType === "before" && !usedImageIndexes.has(index));

  const unusedAfterIndexes = images
    .map((img, index) => ({ img, index }))
    .filter(({ img, index }) => img.imageType === "after" && !usedImageIndexes.has(index));

  const pairCount = Math.min(unusedBeforeIndexes.length, unusedAfterIndexes.length);
  const pairs: ResolvedBeforeAfterPair[] = [];

  for (let i = 0; i < pairCount; i += 1) {
    const beforeEntry = unusedBeforeIndexes[i];
    const afterEntry = unusedAfterIndexes[i];
    const before = resolveBlogImage(beforeEntry.img, "Before image", beforeEntry.index, usedImageIndexes);
    const after = resolveBlogImage(afterEntry.img, "After image", afterEntry.index, usedImageIndexes);
    pairs.push({ before, after });
  }

  return pairs;
}

function renderImageValue(
  value: unknown,
  images: Array<BlogImageRenderInput>,
  usedImageIndexes: Set<number>,
  fallbackAlt: string
): string {
  const resolved = resolveImageValue(value, images, usedImageIndexes, fallbackAlt);
  if (!resolved) return "";
  return `<img src="${resolved.src}" alt="${resolved.alt}" style="${resolved.style}" />`;
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

function renderParagraphs(text?: string | null, className?: string): string {
  if (!text || typeof text !== "string" || !text.trim()) return "";

  const normalizedText = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1");

  const paragraphs = normalizedText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => escapeHtml(paragraph).replace(/\n/g, "<br />"));

  if (paragraphs.length === 0) return "";

  const classAttr = className ? ` class="${className}"` : "";
  const paragraphStyle = className === "lead"
    ? "margin:0 0 12px 0; line-height:1.7; color:#334155; font-size:1.05rem;"
    : "margin:0 0 12px 0; line-height:1.7;";
  return paragraphs
    .map((paragraph, index) => {
      const isLast = index === paragraphs.length - 1;
      const styleAttr = ` style="${isLast ? paragraphStyle.replace('margin:0 0 12px 0;', 'margin:0;') : paragraphStyle}"`;
      return `<p${classAttr}${styleAttr}>${paragraph}</p>`;
    })
    .join("");
}

// Default layout templates
export const DEFAULT_LAYOUT_TEMPLATES: Array<{ name: string; blogType: string; sections: BlogLayoutSection[] }> = [
  {
    name: "Job Showcase Template",
    blogType: "job_showcase",
    sections: [
      { id: "hero", type: "hero", label: "Hero Section", required: true },
      { id: "job-summary", type: "job_summary", label: "Project Summary", required: true },
      { id: "project-details", type: "text", label: "Project Details", required: true },
      { id: "before-after", type: "before_after", label: "Before & After", required: true },
      { id: "process", type: "process_timeline", label: "Our Process", required: false },
      { id: "faq", type: "faq", label: "FAQ", required: false },
      { id: "map", type: "map_embed", label: "Service Area Map", required: false },
      { id: "cta", type: "cta", label: "Call to Action", required: true }
    ]
  },
  {
    name: "Job Type / Keyword Targeting Template",
    blogType: "job_type_keyword_targeting",
    sections: [
      { id: "hero", type: "hero", label: "Hero Section", required: true },
      { id: "job-type-overview", type: "text", label: "Job Type Overview", required: true },
      { id: "before-after", type: "before_after", label: "Before & After", required: false },
      { id: "pricing", type: "pricing_factors", label: "Pricing Factors", required: false },
      { id: "faq", type: "faq", label: "FAQ", required: true },
      { id: "map", type: "map_embed", label: "Service Area Map", required: false },
      { id: "cta", type: "cta", label: "Call to Action", required: true }
    ]
  },
  {
    name: "Pricing Keywords Targeting Template",
    blogType: "pricing_keyword_targeting",
    sections: [
      { id: "hero", type: "hero", label: "Hero Section", required: true },
      { id: "pricing-overview", type: "text", label: "Pricing Overview", required: true },
      { id: "pricing-table", type: "pricing_table", label: "Pricing Table", required: true },
      { id: "pricing-chart", type: "pricing_chart", label: "Pricing Chart", required: true },
      { id: "pricing-factors", type: "pricing_factors", label: "Pricing Factors", required: true },
      { id: "faq", type: "faq", label: "FAQ", required: true },
      { id: "map", type: "map_embed", label: "Service Area Map", required: false },
      { id: "cta", type: "cta", label: "Call to Action", required: true },
      { id: "autobidder-form", type: "autobidder_form", label: "Autobidder Form", required: false }
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
      { id: "map", type: "map_embed", label: "Service Area Map", required: false },
      { id: "cta", type: "cta", label: "Call to Action", required: true }
    ]
  }
];
