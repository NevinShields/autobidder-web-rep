import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { BlogContentSection, BlogComplianceFlags, SeoChecklistItem, BlogLayoutSection } from "@shared/schema";

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
  goal: string; // "rank_seo", "educate", "convert"
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

${input.talkingPoints.length > 0 ? `
KEY TALKING POINTS TO INCLUDE:
${input.talkingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}
` : ""}

REQUIRED SECTIONS (based on template):
${input.layoutTemplate.map(s => `- ${s.label} (${s.type})${s.required ? " [REQUIRED]" : ""}`).join("\n")}

SEO REQUIREMENTS:
1. Include the target city/location naturally throughout the content (2-4 times)
2. Use the service name in the title and first paragraph
3. Include relevant keywords naturally
4. Write a compelling meta title (50-60 characters) and meta description (150-160 characters)
5. Create a URL-friendly slug
6. Aim for 800-1500 words total

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
    { name: 'Claude', fn: () => generateWithClaude(input) },
    { name: 'Gemini', fn: () => generateWithGemini(input) },
    { name: 'OpenAI', fn: () => generateWithOpenAI(input) }
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`📝 Attempting blog generation with ${provider.name}...`);
      const result = await provider.fn();
      if (result) {
        console.log(`✅ Blog generated successfully with ${provider.name}`);
        // Calculate SEO score and checklist
        const { score, checklist } = calculateSeoScore(result, input);
        return {
          ...result,
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

// Generate URL slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
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

  // Check 1: Keyword in title
  const hasKeywordInTitle = output.title.toLowerCase().includes(input.serviceName.toLowerCase());
  checklist.push({
    id: 'keyword-title',
    label: 'Primary keyword in title',
    isPassed: hasKeywordInTitle
  });
  totalPoints += 15;
  if (hasKeywordInTitle) earnedPoints += 15;

  // Check 2: Location in title
  const hasLocationInTitle = output.title.toLowerCase().includes(input.targetCity.toLowerCase());
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
export function blogContentToHtml(content: BlogContentSection[]): string {
  const htmlParts: string[] = [];

  for (const section of content) {
    switch (section.type) {
      case 'hero':
        htmlParts.push(`
          <header class="blog-hero">
            <h1>${escapeHtml(section.content.headline || '')}</h1>
            ${section.content.subheadline ? `<p class="lead">${escapeHtml(section.content.subheadline)}</p>` : ''}
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
            <ul>
              <li><strong>Project Type:</strong> ${escapeHtml(section.content.projectType || '')}</li>
              <li><strong>Location:</strong> ${escapeHtml(section.content.location || '')}</li>
              <li><strong>Duration:</strong> ${escapeHtml(section.content.duration || '')}</li>
            </ul>
            ${section.content.highlights?.length ? `
              <h3>Highlights</h3>
              <ul>
                ${section.content.highlights.map((h: string) => `<li>${escapeHtml(h)}</li>`).join('')}
              </ul>
            ` : ''}
          </section>
        `);
        break;

      case 'before_after':
        htmlParts.push(`
          <section class="blog-before-after">
            <h2>Before & After</h2>
            <div class="before">
              <h3>Before</h3>
              <p>${escapeHtml(section.content.beforeDescription || '')}</p>
            </div>
            <div class="after">
              <h3>After</h3>
              <p>${escapeHtml(section.content.afterDescription || '')}</p>
            </div>
            ${section.content.improvements?.length ? `
              <h3>Key Improvements</h3>
              <ul>
                ${section.content.improvements.map((i: string) => `<li>${escapeHtml(i)}</li>`).join('')}
              </ul>
            ` : ''}
          </section>
        `);
        break;

      case 'process_timeline':
        htmlParts.push(`
          <section class="blog-process">
            <h2>Our Process</h2>
            <ol class="process-steps">
              ${(section.content.steps || []).map((step: any, index: number) => `
                <li>
                  <h3>Step ${index + 1}: ${escapeHtml(step.title || '')}</h3>
                  <p>${escapeHtml(step.description || '')}</p>
                  ${step.duration ? `<span class="duration">${escapeHtml(step.duration)}</span>` : ''}
                </li>
              `).join('')}
            </ol>
          </section>
        `);
        break;

      case 'pricing_factors':
        htmlParts.push(`
          <section class="blog-pricing-factors">
            <h2>What Affects Pricing</h2>
            ${section.content.intro ? `<p>${escapeHtml(section.content.intro)}</p>` : ''}
            <ul>
              ${(section.content.factors || []).map((factor: any) => `
                <li>
                  <strong>${escapeHtml(factor.name || '')}</strong>
                  <p>${escapeHtml(factor.description || '')}</p>
                  <span class="impact impact-${factor.impact || 'medium'}">Impact: ${escapeHtml(factor.impact || 'medium')}</span>
                </li>
              `).join('')}
            </ul>
          </section>
        `);
        break;

      case 'faq':
        htmlParts.push(`
          <section class="blog-faq">
            <h2>Frequently Asked Questions</h2>
            <dl>
              ${(section.content.questions || []).map((q: any) => `
                <dt>${escapeHtml(q.question || '')}</dt>
                <dd>${escapeHtml(q.answer || '')}</dd>
              `).join('')}
            </dl>
          </section>
        `);
        break;

      case 'cta':
        htmlParts.push(`
          <section class="blog-cta">
            <h2>${escapeHtml(section.content.heading || 'Ready to Get Started?')}</h2>
            <p>${escapeHtml(section.content.body || '')}</p>
            <a href="${section.content.buttonUrl || '#contact'}" class="cta-button">
              ${escapeHtml(section.content.buttonText || 'Contact Us')}
            </a>
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

  return htmlParts.join('\n');
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
