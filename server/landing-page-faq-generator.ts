import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";

export interface LandingPageFaqInput {
  businessName: string;
  tagline?: string | null;
  serviceAreaText?: string | null;
  ctaLabel?: string | null;
  services: string[];
}

type FaqItem = { question: string; answer: string };

let openai: OpenAI | null = null;
let gemini: GoogleGenAI | null = null;
let claude: Anthropic | null = null;

function getOpenAI(): OpenAI | null {
  if (openai) return openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  openai = new OpenAI({ apiKey });
  return openai;
}

function getGemini(): GoogleGenAI | null {
  if (gemini) return gemini;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  gemini = new GoogleGenAI({ apiKey });
  return gemini;
}

function getClaude(): Anthropic | null {
  if (claude) return claude;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  claude = new Anthropic({ apiKey });
  return claude;
}

function buildPrompt(input: LandingPageFaqInput): string {
  return `Generate 5 concise, sales-safe FAQs for a public service landing page.

Business name: ${input.businessName}
Tagline: ${input.tagline || "Not provided"}
Service area: ${input.serviceAreaText || "Not provided"}
Primary CTA: ${input.ctaLabel || "Get Instant Quote"}
Services:
${input.services.map((service) => `- ${service}`).join("\n")}

Requirements:
- Write for homeowners or local customers considering these services.
- Focus on quote expectations, scheduling, pricing transparency, service area, and service-specific objections.
- Keep answers practical and conversion-friendly, not fluffy.
- Avoid guarantees, legal claims, or fake specifics.
- Each answer should be 1-3 sentences.
- Return valid JSON only in this shape:
{"faqs":[{"question":"...","answer":"..."}]}`;
}

function extractJsonObject(raw: string): any {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain JSON");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

function normalizeFaqs(raw: any): FaqItem[] {
  const items = Array.isArray(raw?.faqs) ? raw.faqs : Array.isArray(raw) ? raw : [];
  return items
    .map((item: any): FaqItem => ({
      question: typeof item?.question === "string" ? item.question.trim() : "",
      answer: typeof item?.answer === "string" ? item.answer.trim() : "",
    }))
    .filter((item: FaqItem) => item.question && item.answer)
    .filter((item: FaqItem, index: number, arr: FaqItem[]) => arr.findIndex((candidate: FaqItem) => candidate.question.toLowerCase() === item.question.toLowerCase()) === index)
    .slice(0, 6);
}

async function generateWithOpenAI(input: LandingPageFaqInput): Promise<FaqItem[] | null> {
  const client = getOpenAI();
  if (!client) return null;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: "You generate FAQ JSON for contractor landing pages." },
      { role: "user", content: buildPrompt(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "landing_page_faqs",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            faqs: {
              type: "array",
              minItems: 4,
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" },
                },
                required: ["question", "answer"],
              },
            },
          },
          required: ["faqs"],
        },
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;
  return normalizeFaqs(extractJsonObject(content));
}

async function generateWithGemini(input: LandingPageFaqInput): Promise<FaqItem[] | null> {
  const client = getGemini();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          faqs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
              },
              required: ["question", "answer"],
            },
          },
        },
        required: ["faqs"],
      },
    },
    contents: buildPrompt(input),
  });

  const text = response.text;
  if (!text) return null;
  return normalizeFaqs(extractJsonObject(text));
}

async function generateWithClaude(input: LandingPageFaqInput): Promise<FaqItem[] | null> {
  const client = getClaude();
  if (!client) return null;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1200,
    temperature: 0.4,
    system: "Return valid JSON only.",
    messages: [{ role: "user", content: buildPrompt(input) }],
  });

  const text = response.content
    .map((block: any) => (typeof block?.text === "string" ? block.text : ""))
    .join("\n");
  if (!text.trim()) return null;
  return normalizeFaqs(extractJsonObject(text));
}

export async function generateLandingPageFaqs(input: LandingPageFaqInput): Promise<FaqItem[]> {
  const normalizedInput: LandingPageFaqInput = {
    businessName: input.businessName.trim(),
    tagline: input.tagline?.trim() || null,
    serviceAreaText: input.serviceAreaText?.trim() || null,
    ctaLabel: input.ctaLabel?.trim() || null,
    services: input.services.map((service) => service.trim()).filter(Boolean).slice(0, 10),
  };

  if (!normalizedInput.businessName) {
    throw new Error("Business name is required to generate FAQs");
  }

  if (normalizedInput.services.length === 0) {
    throw new Error("At least one service is required to generate FAQs");
  }

  const providers = [generateWithOpenAI, generateWithGemini, generateWithClaude];
  let lastError: unknown = null;

  for (const provider of providers) {
    try {
      const faqs = await provider(normalizedInput);
      if (faqs && faqs.length > 0) {
        return faqs;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No AI provider was able to generate FAQs");
}
