import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  Globe,
  CheckCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
  Layout,
  Search,
  Target,
  DollarSign,
  Briefcase,
  Video as VideoIcon,
  Settings,
  Upload,
  Trash2,
  Loader2
} from "lucide-react";
import { FaFacebookF, FaGoogle } from "react-icons/fa6";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BlogPost, BlogContentSection, Formula, WorkOrder, BlogLayoutTemplate } from "@shared/schema";

const BLOG_TYPES = [
  { value: "job_showcase", label: "Job Showcase", description: "Showcase a completed project with before/after details", icon: Briefcase },
  { value: "job_type_keyword_targeting", label: "Job Type / Keyword Targeting", description: "Create SEO pages for specific job types like apartment complexes or gas stations", icon: Target },
  { value: "pricing_keyword_targeting", label: "Pricing Keywords Targeting", description: "Create pricing and cost pages for a service in a specific area", icon: DollarSign },
  { value: "faq_educational", label: "FAQ/Educational", description: "Answer common customer questions", icon: Search }
];

const MAX_BLOG_IMAGES = 10;

const BLOG_DESIGN_STYLES = [
  {
    value: "classic_blue",
    label: "Classic Blue",
    description: "Clean blue cards and FAQ styling close to the current default look.",
  },
  {
    value: "warm_sunset",
    label: "Warm Sunset",
    description: "Warmer terracotta and amber accents for a softer, higher-touch presentation.",
  },
  {
    value: "forest_clean",
    label: "Forest Clean",
    description: "Fresh green accents for a crisp, service-oriented look.",
  },
] as const;

const GOALS = [
  { value: "rank_seo", label: "Rank in Local Search", description: "Focus on local SEO keywords" },
  { value: "educate", label: "Educate Customers", description: "Provide valuable information" },
  { value: "convert", label: "Convert Leads", description: "Strong calls to action" }
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "technical", label: "Technical" }
];

const WIZARD_STEPS = [
  { id: "type", label: "Type", icon: FileText },
  { id: "strategy", label: "Strategy", icon: Target },
  { id: "editor", label: "Editor", icon: Layout },
  { id: "seo", label: "SEO Review", icon: Search },
  { id: "publish", label: "Publish", icon: Globe }
];

const PRICING_RANGE_PREFIX = "Price Range:";
const PRICING_NOTES_PREFIX = "Pricing Notes:";

function formatWorkOrderDuration(minutes?: number | null): string {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(hours === 1 ? "1 hour" : `${hours} hours`);
  }

  if (remainingMinutes > 0) {
    parts.push(remainingMinutes === 1 ? "1 minute" : `${remainingMinutes} minutes`);
  }

  return parts.join(" ");
}

function parsePricingKeywordNotes(raw?: string | null): { priceRange: string; notes: string } {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    return { priceRange: "", notes: "" };
  }

  const priceRangeMatch = value.match(/^Price Range:\s*(.+)$/im);
  const notesMatch = value.match(/^Pricing Notes:\s*([\s\S]*)$/im);

  if (!priceRangeMatch && !notesMatch) {
    return { priceRange: "", notes: value };
  }

  return {
    priceRange: priceRangeMatch?.[1]?.trim() || "",
    notes: notesMatch?.[1]?.trim() || "",
  };
}

function buildPricingKeywordNotes(priceRange: string, notes: string): string {
  const parts = [
    priceRange.trim() ? `${PRICING_RANGE_PREFIX} ${priceRange.trim()}` : "",
    notes.trim() ? `${PRICING_NOTES_PREFIX}\n${notes.trim()}` : "",
  ].filter(Boolean);

  return parts.join("\n\n");
}

function withEnabledSections(sections: BlogContentSection[] = []): BlogContentSection[] {
  return sections.map((section) => ({
    ...section,
    enabled: section.enabled !== false,
  }));
}

function createSectionId(type: BlogContentSection["type"]): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultSection(type: BlogContentSection["type"]): BlogContentSection {
  const base = {
    id: createSectionId(type),
    type,
    isLocked: false,
    enabled: true,
  } as const;

  switch (type) {
    case "text":
      return {
        ...base,
        content: {
          heading: "New Paragraph Section",
          body: "",
        },
      };
    case "faq":
      return {
        ...base,
        content: {
          questions: Array.from({ length: 4 }, () => ({ question: "", answer: "" })),
        },
      };
    case "process_timeline":
      return {
        ...base,
        content: {
          steps: Array.from({ length: 3 }, () => ({ title: "", description: "", duration: "" })),
        },
      };
    case "map_embed":
      return {
        ...base,
        content: {
          heading: "Service Area Map",
          body: "",
          locationLabel: "",
          embedHtml: "",
          mapUrl: "",
        },
      };
    default:
      return {
        ...base,
        content: {},
      };
  }
}

function ensureLayoutHasParagraphSection(sections: any[] = []): any[] {
  const normalizedSections = Array.isArray(sections) ? [...sections] : [];
  const hasTextSection = normalizedSections.some((section) => section?.type === "text");

  if (hasTextSection) {
    return normalizedSections;
  }

  return [
    ...normalizedSections,
    {
      id: "paragraph-section",
      type: "text",
      label: "Paragraph Section",
      required: true,
    },
  ];
}

function buildSuggestedHeroImagePrompt(input: {
  serviceName?: string;
  targetKeyword?: string;
  targetCity?: string;
  blogType?: string;
}): string {
  const serviceOrKeyword = input.serviceName?.trim() || input.targetKeyword?.trim() || "a local service";
  const city = input.targetCity?.trim();

  const blogTypeContext: Record<string, string> = {
    job_showcase: "Show a polished real-world result at a residential or commercial property immediately after service.",
    job_type_keyword_targeting: "Make the setting clearly match the property type or job type being targeted.",
    pricing_keyword_targeting: "Use a realistic on-site service scene that visually supports a pricing or estimate article.",
    faq_educational: "Use a realistic service-related scene that feels educational, credible, and locally relevant.",
  };

  return [
    `Photorealistic wide website hero image for ${serviceOrKeyword}${city ? ` in ${city}` : ""}.`,
    "Clean horizontal composition for above-the-fold screen display with a strong focal subject and balanced negative space.",
    "Natural lighting, realistic textures, believable service result, and no text overlay.",
    blogTypeContext[input.blogType || ""] || "",
  ].filter(Boolean).join(" ");
}

function buildSuggestedCrewImagePrompt(input: {
  serviceName?: string;
  targetKeyword?: string;
  targetCity?: string;
  businessName?: string;
  hasLogo?: boolean;
}): string {
  const serviceOrKeyword = input.serviceName?.trim() || input.targetKeyword?.trim() || "a local service";
  const city = input.targetCity?.trim();
  const businessName = input.businessName?.trim();

  return [
    `Photorealistic crew image for ${serviceOrKeyword}${city ? ` in ${city}` : ""}.`,
    "Show a real service crew candidly working or preparing to work on site.",
    "Natural lighting, realistic uniforms and equipment, believable environment, no staged corporate stock-photo posing.",
    businessName ? `Make the crew feel branded for ${businessName}.` : "",
    input.hasLogo ? "If branding appears, use the company logo subtly and realistically on uniforms, hats, or a vehicle." : "",
  ].join(" ");
}

function buildSuggestedBeforeAfterScenePrompt(input: {
  serviceName?: string;
  targetKeyword?: string;
  targetCity?: string;
  blogType?: string;
}): string {
  const serviceOrKeyword = input.serviceName?.trim() || input.targetKeyword?.trim() || "a local service";
  const city = input.targetCity?.trim();

  return [
    `Photorealistic property scene for a ${serviceOrKeyword}${city ? ` project in ${city}` : ""}.`,
    "Use a stable, eye-level camera angle with clear view of the treated surfaces and enough surrounding context for a before/after comparison slider.",
    input.blogType === "job_showcase" ? "Make it feel like a real completed customer job." : "Make it feel like a realistic service example scene.",
  ].join(" ");
}

function buildSuggestedBeforeStatePrompt(input: { serviceName?: string; targetKeyword?: string }): string {
  const serviceOrKeyword = input.serviceName?.trim() || input.targetKeyword?.trim() || "the service";
  return `Show the scene before ${serviceOrKeyword}, with visible dirt, buildup, staining, wear, or the untreated condition on the main surfaces.`;
}

function buildSuggestedAfterStatePrompt(input: { serviceName?: string; targetKeyword?: string }): string {
  const serviceOrKeyword = input.serviceName?.trim() || input.targetKeyword?.trim() || "the service";
  return `Show the exact same scene after ${serviceOrKeyword}, with only the surfaces realistically improved and cleaned while the camera angle and surroundings stay the same.`;
}


function StrategySectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 ${className}`}>
      <CardHeader className="border-b border-slate-200/70 bg-slate-50/80 pb-5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {eyebrow}
              </p>
            )}
            <CardTitle className="text-lg text-slate-950 dark:text-slate-50">{title}</CardTitle>
            {description && (
              <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
              </CardDescription>
            )}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6">{children}</CardContent>
    </Card>
  );
}

function StrategyField({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 ${className}`}>
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</Label>
        {hint ? (
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function normalizeGoogleMapsLocationLabel(value: string): string {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes("google.") || !parsed.pathname.includes("/maps")) {
      return trimmed;
    }

    const candidates = [
      parsed.searchParams.get("q"),
      parsed.searchParams.get("query"),
      parsed.searchParams.get("destination"),
    ].filter((candidate): candidate is string => Boolean(candidate && candidate.trim()));

    let label = candidates[0] || "";
    if (!label) {
      const pathMatch = parsed.pathname.match(/\/(?:place|search)\/([^\/]+)/i);
      label = pathMatch?.[1] || "";
    }

    label = decodeURIComponent(label)
      .replace(/\+/g, " ")
      .replace(/@.*$/, "")
      .replace(/\s+/g, " ")
      .trim();

    return label || trimmed;
  } catch {
    return trimmed;
  }
}

export default function BlogPostEditorPage() {
  const { id: routeId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postId, setPostId] = useState<string | undefined>(routeId && routeId !== "new" ? routeId : undefined);
  const id = postId || (routeId && routeId !== "new" ? routeId : undefined);
  const isEditing = !!id;

  // Sync routeId changes to postId (e.g. after navigation)
  useEffect(() => {
    if (routeId && routeId !== "new") {
      setPostId(routeId);
    }
  }, [routeId]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [blogType, setBlogType] = useState<string>("");
  const [primaryServiceId, setPrimaryServiceId] = useState<number | null>(null);
  const [targetCity, setTargetCity] = useState("");
  const [targetNeighborhood, setTargetNeighborhood] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [goal, setGoal] = useState("rank_seo");
  const [tonePreference, setTonePreference] = useState("professional");
  const [designStyle, setDesignStyle] = useState("classic_blue");
  const [workOrderId, setWorkOrderId] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState("");
  const [jobDuration, setJobDuration] = useState("");
  const [jobNotes, setJobNotes] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>([""]);
  const [layoutTemplateId, setLayoutTemplateId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [includeFaqSection, setIncludeFaqSection] = useState(true);
  const [includeAutobidderForm, setIncludeAutobidderForm] = useState(false);

  // Generated content state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<BlogContentSection[]>([]);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [seoChecklist, setSeoChecklist] = useState<Array<{ id: string; label: string; isPassed: boolean }>>([]);
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());

  // Publishing state
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [internalLinks, setInternalLinks] = useState<Array<{ anchorText: string; url: string }>>([{ anchorText: "", url: "" }]);
  const [videoUrl, setVideoUrl] = useState("");
  const [facebookPostUrl, setFacebookPostUrl] = useState("");
  const [gmbPostUrl, setGmbPostUrl] = useState("");
  const [useGlobalCtaSettings, setUseGlobalCtaSettings] = useState(true);
  const [postCtaButtonEnabled, setPostCtaButtonEnabled] = useState(true);
  const [postCtaButtonUrl, setPostCtaButtonUrl] = useState("");
  const [globalCtaEnabled, setGlobalCtaEnabled] = useState(true);
  const [globalCtaUrl, setGlobalCtaUrl] = useState("");
  const [defaultBusinessName, setDefaultBusinessName] = useState("");
  const [defaultBusinessPhone, setDefaultBusinessPhone] = useState("");
  const [defaultBusinessEmail, setDefaultBusinessEmail] = useState("");
  const [defaultBusinessAddress, setDefaultBusinessAddress] = useState("");
  const [defaultBlogLogoUrl, setDefaultBlogLogoUrl] = useState("");
  const [businessDefaultsOpen, setBusinessDefaultsOpen] = useState(false);

  // Uploaded images state
  const [uploadedImages, setUploadedImages] = useState<{
    id?: number;
    preview: string;
    url?: string;
    imageType: string;
    imageStyle: "default" | "rounded" | "rounded_shadow";
    caption: string;
    uploading: boolean;
  }[]>([]);
  const [heroImagePrompt, setHeroImagePrompt] = useState("");
  const [heroImagePromptTouched, setHeroImagePromptTouched] = useState(false);
  const [crewImagePrompt, setCrewImagePrompt] = useState("");
  const [crewImagePromptTouched, setCrewImagePromptTouched] = useState(false);
  const [beforeAfterScenePrompt, setBeforeAfterScenePrompt] = useState("");
  const [beforeAfterScenePromptTouched, setBeforeAfterScenePromptTouched] = useState(false);
  const [beforeStatePrompt, setBeforeStatePrompt] = useState("");
  const [beforeStatePromptTouched, setBeforeStatePromptTouched] = useState(false);
  const [afterStatePrompt, setAfterStatePrompt] = useState("");
  const [afterStatePromptTouched, setAfterStatePromptTouched] = useState(false);

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false);
  const [businessLogoUploading, setBusinessLogoUploading] = useState(false);
  const [expandingFieldKey, setExpandingFieldKey] = useState<string | null>(null);
  const [generatingImageKind, setGeneratingImageKind] = useState<string | null>(null);
  const [suggestedTalkingPoints, setSuggestedTalkingPoints] = useState<string[]>([]);
  const [suggestedAngles, setSuggestedAngles] = useState<string[]>([]);
  const [suggestedContext, setSuggestedContext] = useState("");
  const lastSuggestionKeyRef = useRef("");
  const [photoLibraryOpen, setPhotoLibraryOpen] = useState(false);
  const [photoLibraryMode, setPhotoLibraryMode] = useState<"blog" | "featured">("blog");
  const [photoLibrarySearch, setPhotoLibrarySearch] = useState("");
  const beforeSetInputRef = useRef<HTMLInputElement | null>(null);
  const afterSetInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingBeforeSetFiles, setPendingBeforeSetFiles] = useState<File[]>([]);
  const [pendingAfterSetFiles, setPendingAfterSetFiles] = useState<File[]>([]);
  const isKeywordTargetingType = blogType === "job_type_keyword_targeting";
  const isPricingKeywordType = blogType === "pricing_keyword_targeting";
  const isStructuredSeoType = isKeywordTargetingType || isPricingKeywordType;

  // Fetch existing post if editing
  const { data: existingPost, isLoading: isLoadingPost } = useQuery<BlogPost & { sectionLocks: any[]; images?: any[] }>({
    queryKey: [`/api/blog-posts/${id}`],
    enabled: !!id,
  });

  // Fetch services/formulas
  const { data: formulas = [] } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  // Fetch work orders
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/blog-posts/sources/work-orders"],
  });

  // Fetch layout templates
  const { data: layoutTemplates = [] } = useQuery<BlogLayoutTemplate[]>({
    queryKey: ["/api/blog-layout-templates"],
  });

  const defaultLayoutTemplate = useMemo(
    () => layoutTemplates.find(t => t.blogType === blogType) || layoutTemplates.find(t => !t.blogType),
    [layoutTemplates, blogType]
  );
  const hasBeforeAfterImagePair = useMemo(() => {
    const hasBefore = uploadedImages.some((img) => !img.uploading && !!img.url && img.imageType === "before");
    const hasAfter = uploadedImages.some((img) => !img.uploading && !!img.url && img.imageType === "after");
    return hasBefore && hasAfter;
  }, [uploadedImages]);
  const effectiveLayoutSections = useMemo(() => {
    const sections = (selectedTemplate?.sections || defaultLayoutTemplate?.sections || []) as any[];
    const filteredSections = sections.filter((section) => {
      if (section.type === "faq" && isKeywordTargetingType && !includeFaqSection) {
        return false;
      }
      if (section.type === "autobidder_form" && !includeAutobidderForm) {
        return false;
      }
      if (section.type === "before_after" && !hasBeforeAfterImagePair) {
        return false;
      }
      return true;
    });
    return ensureLayoutHasParagraphSection(filteredSections);
  }, [selectedTemplate, defaultLayoutTemplate, isKeywordTargetingType, includeFaqSection, includeAutobidderForm, hasBeforeAfterImagePair]);

  const { data: businessSettings } = useQuery<any>({
    queryKey: ["/api/business-settings"],
  });

  const { data: photoMeasurements = [] } = useQuery<any[]>({
    queryKey: ["/api/photo-measurements"],
  });

  const { data: leadsForPhotos = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const { data: multiServiceLeadsForPhotos = [] } = useQuery<any[]>({
    queryKey: ["/api/multi-service-leads"],
  });

  const photoLibraryImages = useMemo(() => {
    const fromLeadUploads = [...leadsForPhotos, ...multiServiceLeadsForPhotos].flatMap((lead: any, leadIndex: number) =>
      (lead.uploadedImages || []).filter(Boolean).map((url: string, index: number) => ({
        key: `lead-${lead.id || leadIndex}-${index}-${url}`,
        url,
        title: lead.name || lead.email || "Customer Upload",
        subtitle: "Customer Upload",
        createdAt: lead.createdAt || null,
      }))
    );

    const fromMeasurements = photoMeasurements.flatMap((measurement: any) =>
      (measurement.customerImageUrls || []).filter(Boolean).map((url: string, index: number) => ({
        key: `measurement-${measurement.id}-${index}-${url}`,
        url,
        title: measurement.formulaName || measurement.setupConfig?.objectDescription || "Photo Measurement",
        subtitle: (measurement.tags || []).slice(0, 2).join(", ") || "Photo Measurement",
        createdAt: measurement.createdAt || null,
      }))
    );

    const uniqueByUrl = new Map<string, {
      key: string;
      url: string;
      title: string;
      subtitle: string;
      createdAt: string | null;
    }>();

    [...fromLeadUploads, ...fromMeasurements].forEach((img) => {
      if (!img.url || uniqueByUrl.has(img.url)) return;
      uniqueByUrl.set(img.url, img);
    });

    return Array.from(uniqueByUrl.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [leadsForPhotos, multiServiceLeadsForPhotos, photoMeasurements]);

  const filteredPhotoLibraryImages = useMemo(() => {
    const term = photoLibrarySearch.trim().toLowerCase();
    if (!term) return photoLibraryImages;
    return photoLibraryImages.filter((img) =>
      `${img.title} ${img.subtitle} ${img.url}`.toLowerCase().includes(term)
    );
  }, [photoLibraryImages, photoLibrarySearch]);

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      const parsedPricingNotes = existingPost.blogType === "pricing_keyword_targeting"
        ? parsePricingKeywordNotes(existingPost.jobNotes || "")
        : null;
      const existingJobSummary = (existingPost.content as BlogContentSection[] || []).find((section) => section.type === "job_summary");
      setBlogType(existingPost.blogType);
      setPrimaryServiceId(existingPost.primaryServiceId);
      setTargetCity(existingPost.targetCity || "");
      setTargetNeighborhood(existingPost.targetNeighborhood || "");
      setTargetKeyword(existingPost.targetKeyword || "");
      setGoal(existingPost.goal || "rank_seo");
      setTonePreference(existingPost.tonePreference || "professional");
      setDesignStyle((existingPost as any).designStyle || "classic_blue");
      setWorkOrderId(existingPost.workOrderId);
      setPriceRange(parsedPricingNotes?.priceRange || "");
      setJobDuration(typeof existingJobSummary?.content?.duration === "string" ? existingJobSummary.content.duration : "");
      setJobNotes(parsedPricingNotes ? parsedPricingNotes.notes : (existingPost.jobNotes || ""));
      setTalkingPoints(existingPost.talkingPoints as string[] || [""]);
      setLayoutTemplateId(existingPost.layoutTemplateId);
      setIncludeFaqSection((existingPost.content as BlogContentSection[] || []).some((section) => section.type === "faq"));
      setIncludeAutobidderForm((existingPost.content as BlogContentSection[] || []).some((section) => section.type === "autobidder_form"));
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setMetaTitle(existingPost.metaTitle || "");
      setMetaDescription(existingPost.metaDescription || "");
      setExcerpt(existingPost.excerpt || "");
      setContent(withEnabledSections(existingPost.content as BlogContentSection[]));
      setSeoScore(existingPost.seoScore);
      setSeoChecklist(existingPost.seoChecklist as any[] || []);
      setCategory(existingPost.category || "");
      setTags(existingPost.tags as string[] || []);
      setFeaturedImageUrl(existingPost.featuredImageUrl || "");
      setInternalLinks((existingPost.internalLinks as Array<{ anchorText: string; url: string }> || []).length > 0
        ? existingPost.internalLinks as Array<{ anchorText: string; url: string }>
        : [{ anchorText: "", url: "" }]);
      setVideoUrl(existingPost.videoUrl || "");
      setFacebookPostUrl(existingPost.facebookPostUrl || "");
      setGmbPostUrl(existingPost.gmbPostUrl || "");
      const hasPerPostCtaOverride = existingPost.ctaButtonEnabled !== null || !!existingPost.ctaButtonUrl;
      setUseGlobalCtaSettings(!hasPerPostCtaOverride);
      setPostCtaButtonEnabled(existingPost.ctaButtonEnabled ?? true);
      setPostCtaButtonUrl(existingPost.ctaButtonUrl || "");
      setLockedSections(new Set(existingPost.sectionLocks?.map((l: any) => l.sectionId) || []));
      setUploadedImages(
        (existingPost.images || []).map((img: any) => ({
          id: img.id,
          preview: img.processedUrl || img.originalUrl,
          url: img.processedUrl || img.originalUrl,
          imageType: img.imageType || "hero",
          imageStyle: (img.imageStyle || "default") as "default" | "rounded" | "rounded_shadow",
          caption: img.caption || "",
          uploading: false,
        }))
      );
      // Skip to editor step if editing
      setCurrentStep(2);
    }
  }, [existingPost]);

  useEffect(() => {
    if (!businessSettings) return;
    setGlobalCtaEnabled(businessSettings.blogCtaEnabled ?? true);
    setGlobalCtaUrl(businessSettings.blogCtaUrl || "");
    setDefaultBusinessName(businessSettings.businessName || "");
    setDefaultBusinessPhone(businessSettings.businessPhone || "");
    setDefaultBusinessEmail(businessSettings.businessEmail || "");
    setDefaultBusinessAddress(businessSettings.businessAddress || "");
    setDefaultBlogLogoUrl(businessSettings.blogLogoUrl || "");
  }, [businessSettings]);

  useEffect(() => {
    if (layoutTemplates.length === 0) return;

    if (layoutTemplateId) {
      const matchedTemplate = layoutTemplates.find(t => t.id === layoutTemplateId);
      if (matchedTemplate && (!blogType || !matchedTemplate.blogType || matchedTemplate.blogType === blogType)) {
        setSelectedTemplate(matchedTemplate);
        return;
      }
    }

    if (blogType && defaultLayoutTemplate) {
      setSelectedTemplate(defaultLayoutTemplate);
      if (layoutTemplateId !== defaultLayoutTemplate.id) {
        setLayoutTemplateId(defaultLayoutTemplate.id > 0 ? defaultLayoutTemplate.id : null);
      }
    }
  }, [layoutTemplates, layoutTemplateId, blogType, defaultLayoutTemplate]);

  useEffect(() => {
    if (!isStructuredSeoType) return;
    setGoal("rank_seo");
    setTonePreference("professional");
    setWorkOrderId(null);
  }, [isStructuredSeoType]);

  useEffect(() => {
    if (blogType !== "job_showcase" || !workOrderId || jobDuration.trim()) return;
    const selectedWorkOrder = workOrders.find((wo) => wo.id === workOrderId);
    if (!selectedWorkOrder) return;

    const formattedDuration = formatWorkOrderDuration(selectedWorkOrder.duration);
    if (formattedDuration) {
      setJobDuration(formattedDuration);
    }
  }, [blogType, workOrderId, workOrders, jobDuration]);

  useEffect(() => {
    if (targetKeyword.trim() || !primaryServiceId) return;
    const fallbackKeyword = formulas.find(f => f.id === primaryServiceId)?.name;
    if (fallbackKeyword) {
      setTargetKeyword(fallbackKeyword);
    }
  }, [formulas, primaryServiceId, targetKeyword]);

  useEffect(() => {
    const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || "";
    const suggestedPrompt = buildSuggestedHeroImagePrompt({
      serviceName,
      targetKeyword,
      targetCity,
      blogType,
    });

    if (!suggestedPrompt) return;
    if (heroImagePromptTouched && heroImagePrompt.trim()) return;

    setHeroImagePrompt(suggestedPrompt);
  }, [formulas, primaryServiceId, targetKeyword, targetCity, blogType, heroImagePromptTouched, heroImagePrompt]);

  useEffect(() => {
    const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || "";
    const suggestedPrompt = buildSuggestedCrewImagePrompt({
      serviceName,
      targetKeyword,
      targetCity,
      businessName: defaultBusinessName,
      hasLogo: Boolean(defaultBlogLogoUrl.trim()),
    });

    if (!suggestedPrompt) return;
    if (crewImagePromptTouched && crewImagePrompt.trim()) return;

    setCrewImagePrompt(suggestedPrompt);
  }, [formulas, primaryServiceId, targetKeyword, targetCity, defaultBusinessName, defaultBlogLogoUrl, crewImagePromptTouched, crewImagePrompt]);

  useEffect(() => {
    const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || "";
    const suggestedScenePrompt = buildSuggestedBeforeAfterScenePrompt({
      serviceName,
      targetKeyword,
      targetCity,
      blogType,
    });
    const suggestedBeforePrompt = buildSuggestedBeforeStatePrompt({
      serviceName,
      targetKeyword,
    });
    const suggestedAfterPrompt = buildSuggestedAfterStatePrompt({
      serviceName,
      targetKeyword,
    });

    if ((!beforeAfterScenePromptTouched || !beforeAfterScenePrompt.trim()) && suggestedScenePrompt) {
      setBeforeAfterScenePrompt(suggestedScenePrompt);
    }
    if ((!beforeStatePromptTouched || !beforeStatePrompt.trim()) && suggestedBeforePrompt) {
      setBeforeStatePrompt(suggestedBeforePrompt);
    }
    if ((!afterStatePromptTouched || !afterStatePrompt.trim()) && suggestedAfterPrompt) {
      setAfterStatePrompt(suggestedAfterPrompt);
    }
  }, [
    formulas,
    primaryServiceId,
    targetKeyword,
    targetCity,
    blogType,
    beforeAfterScenePromptTouched,
    beforeAfterScenePrompt,
    beforeStatePromptTouched,
    beforeStatePrompt,
    afterStatePromptTouched,
    afterStatePrompt,
  ]);

  const suggestContextMutation = useMutation({
    mutationFn: async () => {
      const selectedService = formulas.find(f => f.id === primaryServiceId);
      const response = await apiRequest("POST", "/api/blog-posts/suggest-keyword-context", {
        targetKeyword: targetKeyword.trim(),
        targetCity: targetCity.trim() || undefined,
        blogType,
        tonePreference,
        serviceName: selectedService?.name || undefined,
      });
      return await response.json() as {
        talkingPoints?: string[];
        contextSummary?: string;
        angleIdeas?: string[];
      };
    },
    onSuccess: (data) => {
      const nextTalkingPoints = (data.talkingPoints || []).filter(Boolean);
      setSuggestedTalkingPoints(nextTalkingPoints);
      setSuggestedAngles((data.angleIdeas || []).filter(Boolean));
      setSuggestedContext(data.contextSummary || "");
    },
    onError: () => {
      lastSuggestionKeyRef.current = "";
    },
  });

  useEffect(() => {
    const keyword = targetKeyword.trim();
    if (keyword.length < 3 || !blogType) return;

    const suggestionKey = `${blogType}|${keyword.toLowerCase()}|${targetCity.trim().toLowerCase()}|${tonePreference}`;
    if (lastSuggestionKeyRef.current === suggestionKey) return;

    const timer = setTimeout(() => {
      lastSuggestionKeyRef.current = suggestionKey;
      suggestContextMutation.mutate();
    }, 500);

    return () => clearTimeout(timer);
  }, [targetKeyword, targetCity, blogType, tonePreference]);

  const buildCombinedJobNotes = () => {
    if (isPricingKeywordType) {
      return buildPricingKeywordNotes(priceRange, jobNotes);
    }

    const selectedWorkOrder = workOrders.find(w => w.id === workOrderId);
    return [selectedWorkOrder?.instructions?.trim(), jobNotes.trim()]
      .filter((value): value is string => Boolean(value))
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .join("\n\n");
  };

  const ensureImageCapacity = (incomingCount: number) => {
    const remainingSlots = MAX_BLOG_IMAGES - uploadedImages.length;
    if (incomingCount <= remainingSlots) {
      return true;
    }

    toast({
      title: "Image limit reached",
      description: `You can upload up to ${MAX_BLOG_IMAGES} images for this post.`,
      variant: "destructive",
    });
    return false;
  };

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const serviceName = formulas.find(f => f.id === primaryServiceId)?.name || targetKeyword.trim();
      const selectedWorkOrder = workOrders.find(w => w.id === workOrderId);
      const combinedJobNotes = buildCombinedJobNotes();

      const input = {
        blogType,
        primaryServiceId,
        targetKeyword: targetKeyword.trim(),
        serviceName,
        serviceDescription: formulas.find(f => f.id === primaryServiceId)?.description,
        targetCity: targetCity.trim() || undefined,
        targetNeighborhood: isStructuredSeoType ? undefined : (targetNeighborhood || undefined),
        goal,
        tonePreference,
        designStyle,
        workOrderId,
        jobNotes: combinedJobNotes || undefined,
        layoutTemplateId: selectedTemplate?.id > 0 ? selectedTemplate.id : null,
        talkingPoints: talkingPoints.filter(p => p.trim()),
        layoutTemplate: effectiveLayoutSections,
        jobData: selectedWorkOrder ? {
          title: selectedWorkOrder.title,
          customerAddress: selectedWorkOrder.customerAddress || "",
          completedDate: selectedWorkOrder.completedDate ? format(new Date(selectedWorkOrder.completedDate), "MMMM d, yyyy") : "",
          duration: jobDuration.trim() || formatWorkOrderDuration(selectedWorkOrder.duration) || undefined,
          notes: combinedJobNotes || undefined,
          images: []
        } : (blogType === "job_showcase" && jobDuration.trim()
          ? {
              title: serviceName,
              customerAddress: targetCity.trim() || "",
              completedDate: "",
              duration: jobDuration.trim(),
              notes: combinedJobNotes || undefined,
              images: []
            }
          : undefined),
        images: uploadedImages
          .filter(img => img.url && !img.uploading)
          .map(img => ({ url: img.url!, imageType: img.imageType, imageStyle: img.imageStyle, caption: img.caption })),
        internalLinks: internalLinks
          .map(link => ({ anchorText: link.anchorText.trim(), url: link.url.trim() }))
          .filter(link => link.url),
        videoUrl: videoUrl.trim() || undefined,
        facebookPostUrl: facebookPostUrl.trim() || undefined,
        gmbPostUrl: gmbPostUrl.trim() || undefined,
        ctaButtonEnabled: useGlobalCtaSettings ? null : postCtaButtonEnabled,
        ctaButtonUrl: useGlobalCtaSettings ? null : (postCtaButtonUrl.trim() || null),
      };

      const response = await apiRequest("POST", "/api/blog-posts/generate-content", input);
      return await response.json();
    },
    onSuccess: async (data: any) => {
      setTitle(data.title);
      setSlug(data.slug);
      setMetaTitle(data.metaTitle || "");
      setMetaDescription(data.metaDescription || "");
      setExcerpt(data.excerpt || "");
      setContent(withEnabledSections(data.content || []));
      setSeoScore(data.seoScore ?? null);
      setSeoChecklist(data.seoChecklist || []);
      setCurrentStep(2); // Move to editor step
      if (data.id) {
        setPostId(String(data.id));
        if (!isEditing) {
          navigate(`/blog-posts/${data.id}/edit`);
        }
        await persistUploadedImagesToPost(data.id);
      }
      toast({
        title: "Content Generated",
        description: "Your blog content has been generated. Review and edit as needed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    }
  });

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async (publish: boolean = false) => {
      const data = {
        blogType,
        primaryServiceId,
        targetCity: targetCity.trim() || null,
        targetNeighborhood: targetNeighborhood || null,
        targetKeyword: targetKeyword.trim() || null,
        goal,
        tonePreference,
        designStyle,
        workOrderId,
        jobNotes: buildCombinedJobNotes(),
        talkingPoints: talkingPoints.filter(p => p.trim()),
        layoutTemplateId,
        title,
        slug,
        metaTitle,
        metaDescription,
        excerpt,
        content,
        seoScore,
        seoChecklist,
        category: category || null,
        tags,
        featuredImageUrl: featuredImageUrl || null,
        internalLinks: internalLinks
          .map(link => ({ anchorText: link.anchorText.trim(), url: link.url.trim() }))
          .filter(link => link.url),
        videoUrl: videoUrl.trim() || null,
        facebookPostUrl: facebookPostUrl.trim() || null,
        gmbPostUrl: gmbPostUrl.trim() || null,
        ctaButtonEnabled: useGlobalCtaSettings ? null : postCtaButtonEnabled,
        ctaButtonUrl: useGlobalCtaSettings ? null : (postCtaButtonUrl.trim() || null),
        status: publish ? "published" : "draft"
      };

      if (isEditing) {
        const response = await apiRequest("PATCH", `/api/blog-posts/${id}`, data);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/blog-posts", data);
        return await response.json();
      }
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      if (data.id) {
        setPostId(String(data.id));
        await persistUploadedImagesToPost(data.id);
      }
      toast({
        title: "Saved",
        description: "Blog post saved successfully.",
      });
      if (!isEditing) {
        navigate("/blog-posts");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    }
  });

  // Sync to website mutation
  const syncToWebsiteMutation = useMutation({
    mutationFn: async (blogPostId: string) => {
      const response = await apiRequest("POST", `/api/blog-posts/${blogPostId}/sync-to-duda`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({
        title: "Synced to Website",
        description: `Blog post synced successfully. Website post ID: ${data.dudaPostId}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync blog post to website",
        variant: "destructive",
      });
    }
  });

  // Regenerate section mutation
  const regenerateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, sectionType, context }: { sectionId: string; sectionType: string; context?: string }) => {
      const response = await apiRequest("POST", `/api/blog-posts/${id}/regenerate-section`, {
        sectionId,
        sectionType,
        context
      });
      return await response.json() as BlogContentSection;
    },
    onSuccess: (newSection: BlogContentSection, variables) => {
      setContent(prev => prev.map(s =>
        s.id === variables.sectionId
          ? { ...newSection, id: variables.sectionId, enabled: s.enabled !== false }
          : s
      ));
      toast({
        title: "Section Regenerated",
        description: "The section has been regenerated with new content.",
      });
    },
    onError: () => {
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate section",
        variant: "destructive",
      });
    }
  });

  const expandTextMutation = useMutation({
    mutationFn: async ({ endpoint, payload }: {
      endpoint: string;
      payload: Record<string, unknown>;
      sectionType: string;
      fieldLabel: string;
      currentText: string;
      context?: string;
      onApply: (value: string) => void;
    }) => {
      const response = await apiRequest("POST", endpoint, payload);
      return await response.json() as { text: string };
    },
    onSuccess: (data, variables) => {
      variables.onApply(data.text);
      toast({
        title: "Expanded with AI",
        description: "The text field was expanded with more detail.",
      });
    },
    onError: () => {
      toast({
        title: "Expansion Failed",
        description: "Failed to expand this text field.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setExpandingFieldKey(null);
    }
  });

  const saveBusinessDefaultsMutation = useMutation({
    mutationFn: async (overrides?: {
      businessName?: string | null;
      businessPhone?: string | null;
      businessEmail?: string | null;
      businessAddress?: string | null;
      blogCtaEnabled?: boolean;
      blogCtaUrl?: string | null;
      blogLogoUrl?: string | null;
      silent?: boolean;
    }) => {
      const response = await apiRequest("PATCH", "/api/business-settings", {
        businessName: overrides?.businessName ?? (defaultBusinessName.trim() || ""),
        businessPhone: overrides?.businessPhone ?? (defaultBusinessPhone.trim() || ""),
        businessEmail: overrides?.businessEmail ?? (defaultBusinessEmail.trim() || ""),
        businessAddress: overrides?.businessAddress ?? (defaultBusinessAddress.trim() || ""),
        blogCtaEnabled: overrides?.blogCtaEnabled ?? globalCtaEnabled,
        blogCtaUrl: overrides?.blogCtaUrl ?? (globalCtaUrl.trim() || null),
        blogLogoUrl: overrides?.blogLogoUrl ?? (defaultBlogLogoUrl.trim() || null),
      });
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      if (variables?.silent) return;
      toast({
        title: "Business Defaults Saved",
        description: "Your blog defaults will be reused for future posts and image generation.",
      });
    },
    onError: (error: any, variables) => {
      if (variables?.silent) return;
      toast({
        title: "Failed to Save Business Defaults",
        description: error?.message || "Could not save the default business details.",
        variant: "destructive",
      });
    }
  });

  const effectiveCtaEnabled = useGlobalCtaSettings ? globalCtaEnabled : postCtaButtonEnabled;
  const effectiveCtaUrl = (useGlobalCtaSettings ? globalCtaUrl : postCtaButtonUrl).trim();

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleSave = (publish: boolean = false) => {
    saveMutation.mutate(publish);
  };

  const handleSaveAndSync = async () => {
    // Save the post first (as draft), then sync to website
    const data = {
      blogType,
      primaryServiceId,
      targetCity: targetCity.trim() || null,
      targetNeighborhood: targetNeighborhood || null,
      targetKeyword: targetKeyword.trim() || null,
      goal,
      tonePreference,
      designStyle,
      workOrderId,
      jobNotes: buildCombinedJobNotes(),
      talkingPoints: talkingPoints.filter(p => p.trim()),
      layoutTemplateId,
      title,
      slug,
      metaTitle,
      metaDescription,
      excerpt,
      content,
      seoScore,
      seoChecklist,
      category: category || null,
      tags,
      featuredImageUrl: featuredImageUrl || null,
      internalLinks: internalLinks
        .map(link => ({ anchorText: link.anchorText.trim(), url: link.url.trim() }))
        .filter(link => link.url),
      videoUrl: videoUrl.trim() || null,
      facebookPostUrl: facebookPostUrl.trim() || null,
      gmbPostUrl: gmbPostUrl.trim() || null,
      ctaButtonEnabled: useGlobalCtaSettings ? null : postCtaButtonEnabled,
      ctaButtonUrl: useGlobalCtaSettings ? null : (postCtaButtonUrl.trim() || null),
      status: "draft"
    };

    try {
      let savedPost: any;
      if (isEditing) {
        const response = await apiRequest("PATCH", `/api/blog-posts/${id}`, data);
        savedPost = await response.json();
      } else {
        const response = await apiRequest("POST", "/api/blog-posts", data);
        savedPost = await response.json();
      }

      const savedId = savedPost.id ? String(savedPost.id) : id;
      if (savedId) {
        setPostId(savedId);
        await persistUploadedImagesToPost(Number(savedId));
        queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
        toast({
          title: "Saved",
          description: "Blog post saved. Syncing to website...",
        });
        await syncToWebsiteMutation.mutateAsync(savedId);
        navigate("/blog-posts");
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save blog post before syncing",
        variant: "destructive",
      });
    }
  };

  const uploadSingleImage = async (
    file: File,
    options?: {
      imageType?: string;
      imageStyle?: "default" | "rounded" | "rounded_shadow";
      caption?: string;
    }
  ) => {
    const imageType = options?.imageType || "hero";
    const imageStyle = options?.imageStyle || "default";
    const caption = options?.caption || "";
    const preview = URL.createObjectURL(file);
    let insertIndex = -1;

    setUploadedImages((prev) => {
      insertIndex = prev.length;
      return [...prev, {
        preview,
        imageType,
        imageStyle,
        caption,
        uploading: true,
      }];
    });

    const formData = new FormData();
    formData.append("image", file);
    formData.append("imageType", imageType);
    formData.append("imageStyle", imageStyle);
    formData.append("caption", caption);
    if (postId) {
      formData.append("blogPostId", postId);
    }

    try {
      const response = await fetch("/api/blog-images/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      setUploadedImages((prev) => prev.map((img, idx) =>
        idx === insertIndex
          ? {
              ...img,
              id: result.id,
              url: result.processedUrl || result.originalUrl,
              preview: result.processedUrl || result.originalUrl || img.preview,
              imageStyle: (result.imageStyle || img.imageStyle || "default") as "default" | "rounded" | "rounded_shadow",
              uploading: false,
            }
          : img
      ));
    } catch (error) {
      URL.revokeObjectURL(preview);
      setUploadedImages((prev) => prev.filter((_, idx) => idx !== insertIndex));
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    const nextFiles = Array.from(files).slice(0, MAX_BLOG_IMAGES);
    if (!ensureImageCapacity(nextFiles.length)) return;
    for (const file of nextFiles) {
      await uploadSingleImage(file, {
        imageType: "hero",
        imageStyle: "default",
        caption: "",
      });
    }
  };

  const handleBeforeAfterSetUpload = async () => {
    if (pendingBeforeSetFiles.length === 0 && pendingAfterSetFiles.length === 0) return;
    if (!ensureImageCapacity(pendingBeforeSetFiles.length + pendingAfterSetFiles.length)) return;

    if (pendingBeforeSetFiles.length !== pendingAfterSetFiles.length) {
      toast({
        title: "Before/After count mismatch",
        description: "Uploading available images in order. For clean sets, select matching before and after counts.",
      });
    }

    const pairCount = Math.max(pendingBeforeSetFiles.length, pendingAfterSetFiles.length);
    for (let i = 0; i < pairCount; i++) {
      const beforeFile = pendingBeforeSetFiles[i];
      const afterFile = pendingAfterSetFiles[i];

      if (beforeFile) {
        await uploadSingleImage(beforeFile, {
          imageType: "before",
          imageStyle: "default",
          caption: `Before photo set ${i + 1}`,
        });
      }

      if (afterFile) {
        await uploadSingleImage(afterFile, {
          imageType: "after",
          imageStyle: "default",
          caption: `After photo set ${i + 1}`,
        });
      }
    }

    setPendingBeforeSetFiles([]);
    setPendingAfterSetFiles([]);
    if (beforeSetInputRef.current) beforeSetInputRef.current.value = "";
    if (afterSetInputRef.current) afterSetInputRef.current.value = "";
  };

  const removeUploadedImage = async (index: number) => {
    const img = uploadedImages[index];
    if (!img) return;

    try {
      if (img.id) {
        await apiRequest("DELETE", `/api/blog-images/${img.id}`);
      }

      setUploadedImages(prev => {
        const nextImage = prev[index];
        if (nextImage?.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(nextImage.preview);
        }
        return prev.filter((_, i) => i !== index);
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to remove image.",
        variant: "destructive",
      });
    }
  };

  const handleFeaturedImageUpload = async (file: File | null) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("imageType", "hero");
    formData.append("imageStyle", "default");
    formData.append("caption", "Featured image");
    if (postId) {
      formData.append("blogPostId", postId);
    }

    setFeaturedImageUploading(true);
    try {
      const response = await fetch("/api/blog-images/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      setFeaturedImageUrl(result.processedUrl || result.originalUrl || "");
      toast({
        title: "Featured image uploaded",
        description: "The featured image is ready for publish/sync.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload featured image.",
        variant: "destructive",
      });
    } finally {
      setFeaturedImageUploading(false);
    }
  };

  const handleBusinessLogoUpload = async (file: File | null) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setBusinessLogoUploading(true);
    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      const nextUrl = typeof result?.url === "string" ? result.url : "";
      if (!nextUrl) {
        throw new Error("Upload returned an invalid image URL");
      }

      setDefaultBlogLogoUrl(nextUrl);
      saveBusinessDefaultsMutation.mutate({ blogLogoUrl: nextUrl, silent: true });
      toast({
        title: "Logo uploaded",
        description: "The logo was uploaded and saved for future blogs and crew images.",
      });
    } catch (error) {
      toast({
        title: "Logo upload failed",
        description: "Failed to upload the company logo.",
        variant: "destructive",
      });
    } finally {
      setBusinessLogoUploading(false);
    }
  };

  const getImageExtensionFromMimeType = (mimeType: string): string => {
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/webp") return ".webp";
    if (mimeType === "image/gif") return ".gif";
    return ".jpg";
  };

  const uploadImageFromLibraryUrl = async ({
    imageUrl,
    imageType,
    imageStyle,
    caption,
    blogPostId,
  }: {
    imageUrl: string;
    imageType: string;
    imageStyle: "default" | "rounded" | "rounded_shadow";
    caption: string;
    blogPostId?: string;
  }) => {
    const sourceResponse = await fetch(imageUrl, { credentials: "include" });
    if (!sourceResponse.ok) {
      throw new Error(`Failed to fetch library image (${sourceResponse.status})`);
    }

    const blob = await sourceResponse.blob();
    const contentType = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    const extension = getImageExtensionFromMimeType(contentType);
    const file = new File([blob], `library-image-${Date.now()}${extension}`, { type: contentType });

    const formData = new FormData();
    formData.append("image", file);
    formData.append("imageType", imageType);
    formData.append("imageStyle", imageStyle);
    formData.append("caption", caption);
    if (blogPostId) {
      formData.append("blogPostId", blogPostId);
    }

    const uploadResponse = await fetch("/api/blog-images/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!uploadResponse.ok) {
      throw new Error("Failed to copy library image into blog media");
    }

    return uploadResponse.json();
  };

  const persistUploadedImagesToPost = async (blogPostId: number) => {
    const snapshot = [...uploadedImages];
    for (let index = 0; index < snapshot.length; index++) {
      const img = snapshot[index];
      if (!img.url || img.uploading) continue;

      try {
        if (img.id) {
          await apiRequest("PATCH", `/api/blog-images/${img.id}`, {
            blogPostId,
            imageType: img.imageType,
            imageStyle: img.imageStyle,
            caption: img.caption,
          });
          continue;
        }

        const response = await apiRequest("POST", `/api/blog-posts/${blogPostId}/images`, {
          originalUrl: img.url,
          processedUrl: img.url,
          imageType: img.imageType,
          imageStyle: img.imageStyle,
          caption: img.caption,
          altText: img.caption || null,
          sourceType: "lead",
        });
        const created = await response.json();
        setUploadedImages((prev) => prev.map((existing, existingIndex) =>
          existingIndex === index
            ? {
                ...existing,
                id: created.id,
                url: created.processedUrl || created.originalUrl || existing.url,
                preview: created.processedUrl || created.originalUrl || existing.preview,
              }
            : existing
        ));
      } catch (error) {
        console.error("Failed to persist image metadata:", error);
      }
    }
  };

  const openPhotoLibrary = (mode: "blog" | "featured") => {
    setPhotoLibraryMode(mode);
    setPhotoLibrarySearch("");
    setPhotoLibraryOpen(true);
  };

  const handlePhotoLibrarySelect = async (image: { url: string; title: string }) => {
    if (photoLibraryMode === "featured") {
      setFeaturedImageUploading(true);
      try {
        const result = await uploadImageFromLibraryUrl({
          imageUrl: image.url,
          imageType: "hero",
          imageStyle: "default",
          caption: "Featured image",
          blogPostId: postId,
        });
        setFeaturedImageUrl(result.processedUrl || result.originalUrl || image.url);
        setPhotoLibraryOpen(false);
        toast({
          title: "Featured image selected",
          description: "Photo library image copied and set as featured image.",
        });
      } catch (error) {
        toast({
          title: "Featured image copy failed",
          description: "Could not copy this library image. Try another image.",
          variant: "destructive",
        });
      } finally {
        setFeaturedImageUploading(false);
      }
      return;
    }

    if (!ensureImageCapacity(1)) return;

    const nextImageStyle: "default" | "rounded" | "rounded_shadow" = "default";
    const nextCaption = image.title || "";
    let insertIndex = -1;
    let nextImageType = "process";

    setUploadedImages((prev) => {
      insertIndex = prev.length;
      nextImageType = prev.length === 0 ? "hero" : "process";
      return [...prev, {
        preview: image.url,
        url: image.url,
        imageType: nextImageType,
        imageStyle: nextImageStyle,
        caption: nextCaption,
        uploading: true,
      }];
    });

    try {
      const result = await uploadImageFromLibraryUrl({
        imageUrl: image.url,
        imageType: nextImageType,
        imageStyle: nextImageStyle,
        caption: nextCaption,
        blogPostId: postId,
      });
      setUploadedImages((prev) => prev.map((existing, existingIndex) =>
        existingIndex === insertIndex
          ? {
              ...existing,
              id: result.id,
              url: result.processedUrl || result.originalUrl || existing.url,
              preview: result.processedUrl || result.originalUrl || existing.preview,
              uploading: false,
            }
          : existing
      ));
    } catch (error) {
      setUploadedImages((prev) => prev.map((existing, existingIndex) =>
        existingIndex === insertIndex
          ? { ...existing, uploading: false }
          : existing
      ));
      toast({
        title: "Library image copy failed",
        description: "Using the original image URL instead. If it fails on publish, pick another image.",
        variant: "destructive",
      });
    }
  };

  const updateImageMeta = (index: number, field: 'imageType' | 'caption', value: string) => {
    setUploadedImages(prev => prev.map((img, i) =>
      i === index ? { ...img, [field]: value } : img
    ));
  };

  const useUploadedImageAsFeatured = (index: number) => {
    const selectedImage = uploadedImages[index];
    const selectedUrl = selectedImage?.url || selectedImage?.preview || "";
    if (!selectedUrl || selectedImage?.uploading) {
      return;
    }

    setFeaturedImageUrl(selectedUrl);
    setUploadedImages((prev) => prev.map((img, i) =>
      i === index
        ? { ...img, imageType: "hero" }
        : img
    ));
    toast({
      title: "Featured image selected",
      description: "This image will be used as the featured image for the blog post.",
    });
  };

  const appendGeneratedImages = (images: Array<{
    id: number;
    originalUrl: string;
    processedUrl?: string | null;
    imageType: string;
    imageStyle?: string | null;
    caption?: string | null;
  }>) => {
    setUploadedImages((prev) => [
      ...prev,
      ...images.map((image) => ({
        id: image.id,
        preview: image.processedUrl || image.originalUrl,
        url: image.processedUrl || image.originalUrl,
        imageType: image.imageType,
        imageStyle: (image.imageStyle || "default") as "default" | "rounded" | "rounded_shadow",
        caption: image.caption || "",
        uploading: false,
      })),
    ]);
  };

  const generateBlogImages = async (payload: Record<string, unknown>, kind: string) => {
    setGeneratingImageKind(kind);
    try {
      const response = await apiRequest("POST", "/api/blog-images/generate", {
        ...payload,
        blogPostId: postId || null,
        serviceName: formulas.find((f) => f.id === primaryServiceId)?.name || targetKeyword.trim() || undefined,
        targetCity: targetCity.trim() || undefined,
      });
      const result = await response.json();
      appendGeneratedImages(Array.isArray(result) ? result : []);
      toast({
        title: "Images generated",
        description: kind === "before_after_pair"
          ? "Generated a matched before and after image pair."
          : "Generated a new blog image.",
      });
    } catch (error: any) {
      toast({
        title: "Image generation failed",
        description: error?.message || "Failed to generate images.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImageKind(null);
    }
  };

  const updateInternalLink = (index: number, field: "anchorText" | "url", value: string) => {
    setInternalLinks(prev => prev.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const addInternalLink = () => {
    setInternalLinks(prev => [...prev, { anchorText: "", url: "" }]);
  };

  const removeInternalLink = (index: number) => {
    setInternalLinks(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ anchorText: "", url: "" }];
    });
  };

  const handleTalkingPointChange = (index: number, value: string) => {
    const newPoints = [...talkingPoints];
    newPoints[index] = value;
    setTalkingPoints(newPoints);
  };

  const addTalkingPoint = () => {
    setTalkingPoints([...talkingPoints, ""]);
  };

  const removeTalkingPoint = (index: number) => {
    setTalkingPoints(talkingPoints.filter((_, i) => i !== index));
  };

  const toggleSectionLock = async (sectionId: string) => {
    const isLocked = lockedSections.has(sectionId);

    if (!id) {
      const newLocked = new Set(lockedSections);
      if (isLocked) {
        newLocked.delete(sectionId);
      } else {
        newLocked.add(sectionId);
      }
      setLockedSections(newLocked);
      return;
    }

    try {
      await apiRequest("POST", `/api/blog-posts/${id}/${isLocked ? "unlock-section" : "lock-section"}`, {
        sectionId,
      });

      setLockedSections((prev) => {
        const next = new Set(prev);
        if (isLocked) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        return next;
      });
      queryClient.invalidateQueries({ queryKey: [`/api/blog-posts/${id}`] });
    } catch (error: any) {
      toast({
        title: isLocked ? "Unlock Failed" : "Lock Failed",
        description: error.message || "Could not update section lock.",
        variant: "destructive",
      });
    }
  };

  const updateSectionContent = (sectionId: string, newContent: any) => {
    setContent(prev => prev.map(s =>
      s.id === sectionId ? { ...s, content: newContent } : s
    ));
  };

  const toggleSectionEnabled = (sectionId: string, enabled: boolean) => {
    setContent((prev) => prev.map((section) =>
      section.id === sectionId ? { ...section, enabled } : section
    ));
  };

  const addParagraphSection = () => {
    setContent((prev) => [
      ...prev,
      createDefaultSection("text"),
    ]);
  };

  const addGeneratedParagraphSection = () => {
    const newSection = createDefaultSection("text");
    setContent((prev) => [...prev, newSection]);

    if (!id) {
      toast({
        title: "Paragraph Section Added",
        description: "Save or generate the post first, then use regenerate to have AI fill this paragraph section.",
      });
      return;
    }

    regenerateSectionMutation.mutate({
      sectionId: newSection.id,
      sectionType: "text",
      context: "Create a brand-new additional paragraph section that complements the rest of the article. Provide a useful heading and 1-3 concise paragraphs. Avoid repeating other sections.",
    });
  };

  const requestFieldExpansion = ({
    fieldKey,
    sectionType,
    fieldLabel,
    currentText,
    context,
    onApply,
    allowDraft,
  }: {
    fieldKey: string;
    sectionType: string;
    fieldLabel: string;
    currentText: string;
    context?: string;
    onApply: (value: string) => void;
    allowDraft?: boolean;
  }) => {
    if (!currentText.trim()) return;
    const endpoint = id ? `/api/blog-posts/${id}/expand-text` : (allowDraft ? "/api/blog-posts/expand-text" : "");
    if (!endpoint) return;

    const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || targetKeyword.trim() || "";
    setExpandingFieldKey(fieldKey);
    expandTextMutation.mutate({
      endpoint,
      payload: id ? {
        sectionType,
        fieldLabel,
        currentText,
        context,
      } : {
        blogType,
        primaryServiceId,
        serviceName,
        targetCity: targetCity.trim() || undefined,
        tonePreference,
        sectionType,
        fieldLabel,
        currentText,
        context,
      },
      sectionType,
      fieldLabel,
      currentText,
      context,
      onApply,
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!blogType;
      case 1:
        if (isKeywordTargetingType) {
          return !!targetKeyword.trim();
        }
        if (isPricingKeywordType) {
          return !!targetKeyword.trim() && !!targetCity.trim() && !!priceRange.trim();
        }
        return !!targetKeyword.trim() && !!targetCity.trim() && !!goal && !!selectedTemplate;
      case 2: return !!title && content.length > 0;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const getStepValidationMessages = () => {
    if (currentStep !== 1) return [] as string[];

    const messages: string[] = [];
    if (!targetKeyword.trim()) {
      if (isKeywordTargetingType) {
        messages.push("Enter a job type or target keyword.");
      } else if (isPricingKeywordType) {
        messages.push("Enter a service type or pricing keyword.");
      } else {
        messages.push("Enter a target keyword.");
      }
    }

    if (isPricingKeywordType) {
      if (!targetCity.trim()) messages.push("Enter a target city.");
      if (!priceRange.trim()) messages.push("Enter a price range.");
    } else if (!isKeywordTargetingType) {
      if (!targetCity.trim()) messages.push("Enter a target city.");
      if (!goal) messages.push("Choose a primary goal.");
      if (!selectedTemplate) messages.push("Choose a layout template.");
    }

    return messages;
  };

  const goNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1 && canProceed()) {
      if (currentStep === 1 && content.length === 0) {
        // Generate content before going to editor
        handleGenerate();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoadingPost) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Type selection
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>What type of blog post do you want to create?</h2>
              <RadioGroup value={blogType} onValueChange={setBlogType} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BLOG_TYPES.map(type => (
                  <Label
                    key={type.value}
                    className={`flex items-start gap-4 p-4 border dark:border-slate-700 rounded-lg cursor-pointer transition-colors ${
                      blogType === type.value ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30' : 'hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    <RadioGroupItem value={type.value} className="mt-1 h-4 w-4 shrink-0 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <type.icon className="h-5 w-5 text-amber-600" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{type.description}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 1: { // Strategy (targeting + content + layout)
        const strategyDescription = isKeywordTargetingType
          ? "Enter the job type keyword, optionally add a service city, and decide whether the generated page should include an FAQ section."
          : isPricingKeywordType
            ? "Target a pricing keyword for a specific city, define the expected range, list the main cost drivers, and choose whether to embed your autobidder form."
            : "Set the search intent, add real context, and shape the draft so it reads like a polished page instead of generic AI copy.";
        const keywordLabel = isKeywordTargetingType
          ? "Job Type / Target Keyword"
          : isPricingKeywordType
            ? "Service Type / Pricing Keyword"
            : "Target Keyword";
        const keywordPlaceholder = isKeywordTargetingType
          ? "e.g., apartment complex cleaning, gas station pressure washing"
          : isPricingKeywordType
            ? "e.g., house washing cost, roof cleaning prices"
            : "e.g., roof cleaning cost philadelphia";
        const keywordHint = isKeywordTargetingType
          ? "Use the job or property type you want this page to rank for."
          : isPricingKeywordType
            ? "Use the phrase customers search when they want cost or pricing information."
            : "Use any keyword phrase, even if it does not map directly to a service in your account.";
        const cityLabel = isKeywordTargetingType ? "Service City (Optional)" : "Target City";
        const cityHint = isKeywordTargetingType
          ? "Add a city to localize the page, or leave it broad for wider keyword coverage."
          : isPricingKeywordType
            ? "Pricing pages work best when tied to a specific city or service area."
            : "Use a city when this post should support local rankings.";
        const notesLabel = isKeywordTargetingType
          ? "Notes"
          : isPricingKeywordType
            ? "Pricing Notes (Optional)"
            : "Job Notes / Context";
        const notesPlaceholder = isKeywordTargetingType
          ? "Add notes about the property type, use cases, pain points, scope, and what makes this job type different."
          : isPricingKeywordType
            ? "Add pricing assumptions, service tiers, minimum charges, exclusions, or local market context."
            : "Add notes, constraints, customer concerns, results, or other context.";
        const talkingPointsLabel = isPricingKeywordType ? "Price Factors" : "Key Talking Points";
        const talkingPointsHint = isPricingKeywordType
          ? "List the variables that move pricing up or down so the draft can explain the range credibly."
          : "List the ideas, proof points, and details the draft should hit so it feels grounded in your business.";
        const blogTypeConfig = BLOG_TYPES.find((type) => type.value === blogType);
        const goalLabel = GOALS.find((item) => item.value === goal)?.label || "Rank in Local Search";

        return (
          <div className="space-y-8">
            <StrategySectionCard
              eyebrow="Strategy"
              title="Build the brief before you generate"
              description={strategyDescription}
              action={
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-950/60"
                  onClick={() => suggestContextMutation.mutate()}
                  disabled={!targetKeyword.trim() || suggestContextMutation.isPending}
                >
                  {suggestContextMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Refresh AI Ideas
                </Button>
              }
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  {blogTypeConfig?.label || "Blog Strategy"}
                </Badge>
                {targetKeyword.trim() && (
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {targetKeyword.trim()}
                  </Badge>
                )}
                {targetCity.trim() && (
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {targetCity.trim()}
                  </Badge>
                )}
                {!isStructuredSeoType && (
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {goalLabel}
                  </Badge>
                )}
              </div>
            </StrategySectionCard>

            <StrategySectionCard
              eyebrow="Business Defaults"
              title="Saved business details for every new blog"
              description="Set your core business info once so new posts and crew-image prompts can reuse it automatically."
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => setBusinessDefaultsOpen((prev) => !prev)}
                  >
                    {businessDefaultsOpen ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-950/60"
                    onClick={() => saveBusinessDefaultsMutation.mutate(undefined)}
                    disabled={saveBusinessDefaultsMutation.isPending || businessLogoUploading}
                  >
                    {saveBusinessDefaultsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saveBusinessDefaultsMutation.isPending ? "Saving..." : "Save Defaults"}
                  </Button>
                </div>
              }
            >
              {!businessDefaultsOpen ? (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                  <span>Business defaults are hidden by default to keep the strategy step compact.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setBusinessDefaultsOpen(true)}
                  >
                    Open
                  </Button>
                </div>
              ) : (
              <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Company Logo</Label>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Used as the saved brand reference for future blogs and crew image generation.
                  </p>

                  <div
                    className="mt-4 flex min-h-[220px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 transition-colors hover:border-amber-400 dark:border-slate-700 dark:bg-slate-950"
                    onClick={() => document.getElementById("blog-default-logo-upload")?.click()}
                  >
                    {defaultBlogLogoUrl ? (
                      <img
                        src={defaultBlogLogoUrl}
                        alt="Business logo preview"
                        className="max-h-40 max-w-full object-contain"
                      />
                    ) : businessLogoUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                        <p className="text-sm text-slate-600 dark:text-slate-300">Click to upload your logo</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">PNG, JPG, or WebP up to 5MB</p>
                      </div>
                    )}
                    <input
                      id="blog-default-logo-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={e => handleBusinessLogoUpload(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">{defaultBlogLogoUrl || "No logo saved yet"}</p>
                    {defaultBlogLogoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 rounded-full"
                        onClick={() => {
                          setDefaultBlogLogoUrl("");
                          saveBusinessDefaultsMutation.mutate({ blogLogoUrl: null, silent: true });
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <StrategyField label="Business Name" hint="Used in blog sections and as the company name for branded crew imagery.">
                    <Input
                      value={defaultBusinessName}
                      onChange={e => setDefaultBusinessName(e.target.value)}
                      placeholder="Your business name"
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </StrategyField>

                  <StrategyField label="Contact Page URL" hint="Saved as the default destination for blog CTAs so you do not have to add it to every post.">
                    <Input
                      value={globalCtaUrl}
                      onChange={e => setGlobalCtaUrl(e.target.value)}
                      onBlur={() => saveBusinessDefaultsMutation.mutate({ blogCtaUrl: globalCtaUrl.trim() || null, silent: true })}
                      placeholder="https://yourdomain.com/contact"
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </StrategyField>

                  <StrategyField label="Business Phone" hint="Used when blog sections or CTAs need a default phone number.">
                    <Input
                      value={defaultBusinessPhone}
                      onChange={e => setDefaultBusinessPhone(e.target.value)}
                      placeholder="(555) 555-5555"
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </StrategyField>

                  <StrategyField label="Business Email" hint="Saved for future CTA and contact context in generated posts.">
                    <Input
                      value={defaultBusinessEmail}
                      onChange={e => setDefaultBusinessEmail(e.target.value)}
                      placeholder="hello@yourbusiness.com"
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </StrategyField>

                  <StrategyField label="Business Address" hint="Useful for local context and any sections that reference your service area." className="lg:col-span-2">
                    <Input
                      value={defaultBusinessAddress}
                      onChange={e => setDefaultBusinessAddress(e.target.value)}
                      placeholder="123 Main St, City, State"
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </StrategyField>

                  <StrategyField label="Global CTA Enabled" hint="Turn this off if you do not want new posts to inherit the saved contact page link." className="lg:col-span-2">
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Use the saved contact link by default</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Posts can still override this later in publish settings.</p>
                      </div>
                      <Switch
                        checked={globalCtaEnabled}
                        onCheckedChange={setGlobalCtaEnabled}
                      />
                    </div>
                  </StrategyField>
                </div>
              </div>
              )}
            </StrategySectionCard>

            <StrategySectionCard
              eyebrow="Targeting"
              title="Search intent and positioning"
              description="Give the post a clear job to do so the generated draft is aligned on keyword, location, and commercial intent from the start."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <StrategyField label={keywordLabel} hint={keywordHint} className="lg:col-span-2">
                  <Input
                    value={targetKeyword}
                    onChange={e => setTargetKeyword(e.target.value)}
                    placeholder={keywordPlaceholder}
                    className="h-12 rounded-xl border-slate-200 bg-white text-base shadow-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </StrategyField>

                {!isKeywordTargetingType && (
                  <StrategyField
                    label={isPricingKeywordType ? "Service Type" : "Related Service (Optional)"}
                    hint={isPricingKeywordType ? "Tie this pricing page to a service in your account if you want tighter alignment." : "Link a service when you want the draft to borrow more service-specific language."}
                  >
                    <Select value={primaryServiceId?.toString() || "none"} onValueChange={v => setPrimaryServiceId(v === "none" ? null : parseInt(v))}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <SelectValue placeholder={isPricingKeywordType ? "Select the service this pricing page is about" : "Select a service"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked service</SelectItem>
                        {formulas.map(formula => (
                          <SelectItem key={formula.id} value={formula.id.toString()}>
                            {formula.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </StrategyField>
                )}

                <StrategyField label={cityLabel} hint={`${cityHint} You can also paste a Google Maps location URL and it will be normalized into the city/location name.`}>
                  <Input
                    value={targetCity}
                    onChange={e => setTargetCity(e.target.value)}
                    onBlur={() => {
                      const normalized = normalizeGoogleMapsLocationLabel(targetCity);
                      if (normalized && normalized !== targetCity) {
                        setTargetCity(normalized);
                      }
                    }}
                    placeholder="e.g., Philadelphia or paste a Google Maps location URL"
                    className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </StrategyField>

                {!isKeywordTargetingType && (
                  <StrategyField
                    label={isPricingKeywordType ? "Price Range" : "Neighborhood (Optional)"}
                    hint={isPricingKeywordType ? "Use the range or framing you want the article to reinforce." : "Use a neighborhood only when local nuance matters to the story or SEO angle."}
                  >
                    {isPricingKeywordType ? (
                      <Input
                        value={priceRange}
                        onChange={e => setPriceRange(e.target.value)}
                        placeholder="e.g., $250-$650, most jobs land between $300 and $500"
                        className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    ) : (
                      <Input
                        value={targetNeighborhood}
                        onChange={e => setTargetNeighborhood(e.target.value)}
                        placeholder="e.g., Center City"
                        className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    )}
                  </StrategyField>
                )}

                {!isStructuredSeoType && (
                  <StrategyField label="Tone Preference" hint="Choose how the finished draft should sound to readers.">
                    <Select value={tonePreference} onValueChange={setTonePreference}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map(tone => (
                          <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </StrategyField>
                )}

                <StrategyField label="Design Style" hint="Choose the card and FAQ styling bundle that will be sent as the blog CSS snippet on sync.">
                  <Select value={designStyle} onValueChange={setDesignStyle}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOG_DESIGN_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {BLOG_DESIGN_STYLES.find((style) => style.value === designStyle)?.description}
                  </p>
                </StrategyField>

                {!isStructuredSeoType && (
                  <StrategyField label="Primary Goal" hint="Set the business outcome you want the article to bias toward." className="lg:col-span-2">
                    <RadioGroup value={goal} onValueChange={setGoal} className="grid gap-3 md:grid-cols-3">
                      {GOALS.map(item => (
                        <Label
                          key={item.value}
                          className={`flex min-h-[92px] cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                            goal === item.value
                              ? 'border-amber-400 bg-amber-50 shadow-sm dark:border-amber-700 dark:bg-amber-950/30'
                              : 'border-slate-200 bg-slate-50/70 hover:border-amber-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                          }`}
                        >
                          <RadioGroupItem value={item.value} className="mt-1 h-4 w-4 shrink-0 rounded-full" />
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
                            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  </StrategyField>
                )}

                {isKeywordTargetingType && (
                  <StrategyField label="FAQ Section" hint="Add a question-and-answer block near the end of the page for additional long-tail coverage." className="lg:col-span-2">
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Include FAQ Section</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Useful when the post should capture related questions around the same topic.</p>
                      </div>
                      <Switch
                        id="keyword-faq-toggle"
                        checked={includeFaqSection}
                        onCheckedChange={setIncludeFaqSection}
                      />
                    </div>
                  </StrategyField>
                )}

                {isPricingKeywordType && (
                  <StrategyField label="Conversion Module" hint="Decide whether readers should see your quoting widget inside the article." className="lg:col-span-2">
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3 dark:border-sky-900/50 dark:bg-sky-950/20">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Include Autobidder Form</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Embed your instant quote calculator so visitors can request pricing without leaving the page.</p>
                      </div>
                      <Switch
                        id="pricing-autobidder-toggle"
                        checked={includeAutobidderForm}
                        onCheckedChange={setIncludeAutobidderForm}
                      />
                    </div>
                  </StrategyField>
                )}
              </div>
            </StrategySectionCard>

            {(suggestedTalkingPoints.length > 0 || suggestedAngles.length > 0 || suggestedContext) && (
              <StrategySectionCard
                eyebrow="AI Assist"
                title="Suggested angles and context"
                description="Use these ideas to speed up briefing. Add only the ones that sharpen the story."
                className="border-amber-200/80 dark:border-amber-900/40"
              >
                <div className="space-y-5">
                  {suggestedTalkingPoints.length > 0 && (
                    <div>
                      <Label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {isPricingKeywordType ? "Suggested Price Factors" : "Suggested Talking Points"}
                      </Label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {suggestedTalkingPoints.map((point, idx) => (
                          <Button
                            key={`${point}-${idx}`}
                            variant="outline"
                            size="sm"
                            className="h-auto rounded-full border-slate-200 bg-white px-3 py-1.5 text-left whitespace-normal shadow-sm dark:border-slate-700 dark:bg-slate-950"
                            onClick={() => {
                              setTalkingPoints(prev => {
                                const next = prev.filter(p => p.trim().length > 0);
                                if (next.includes(point)) return next;
                                return [...next, point];
                              });
                            }}
                          >
                            + {point}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestedContext && (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                      <Label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Suggested Context</Label>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{suggestedContext}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 rounded-full"
                        onClick={() => setJobNotes((prev) => prev.trim().length > 0 ? `${prev}\n\n${suggestedContext}` : suggestedContext)}
                      >
                        Use Suggested Context in Notes
                      </Button>
                    </div>
                  )}

                  {suggestedAngles.length > 0 && (
                    <div>
                      <Label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Suggested Angles</Label>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {suggestedAngles.map((angle, idx) => (
                          <div key={`${angle}-${idx}`} className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                            {angle}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </StrategySectionCard>
            )}

            <StrategySectionCard
              eyebrow="Inputs"
              title="Context the writer can actually use"
              description="Capture the specifics that make the generated sections feel considered, credible, and hard to confuse with a template."
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                <div className="space-y-4">
                  {blogType === "job_showcase" && workOrders.length > 0 && (
                    <StrategyField label="Completed Job (Optional)" hint="Pull in a real job when you want the article grounded in an actual project.">
                      <Select value={workOrderId?.toString() || "none"} onValueChange={v => setWorkOrderId(v === "none" ? null : parseInt(v))}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                          <SelectValue placeholder="Select a work order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No job selected, use notes below</SelectItem>
                          {workOrders.map(wo => (
                            <SelectItem key={wo.id} value={wo.id.toString()}>
                              {wo.title} - {wo.customerAddress}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </StrategyField>
                  )}

                  {blogType === "job_showcase" && (
                    <StrategyField label="Project Duration (Optional)" hint="This helps prefill the project summary for job showcase posts.">
                      <Input
                        value={jobDuration}
                        onChange={e => setJobDuration(e.target.value)}
                        placeholder="Example: 1 day, 4 hours, or 2 visits"
                        className="h-12 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                      />
                    </StrategyField>
                  )}

                  <StrategyField label={notesLabel} hint="Use notes for facts, edge cases, customer concerns, proof, constraints, and anything the draft should not miss.">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Draft guidance</p>
                      {jobNotes.trim() && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                          disabled={expandingFieldKey === "draft:jobNotes"}
                          onClick={() => requestFieldExpansion({
                            fieldKey: "draft:jobNotes",
                            sectionType: "notes",
                            fieldLabel: isPricingKeywordType ? "Pricing Notes" : "Job Notes",
                            currentText: jobNotes,
                            context: targetKeyword.trim() ? `Target keyword: ${targetKeyword.trim()}` : undefined,
                            onApply: setJobNotes,
                            allowDraft: true,
                          })}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          {expandingFieldKey === "draft:jobNotes" ? "Expanding..." : "Expand with AI"}
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={jobNotes}
                      onChange={e => setJobNotes(e.target.value)}
                      placeholder={notesPlaceholder}
                      rows={7}
                      className="min-h-[180px] rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </StrategyField>
                </div>

                <div className="space-y-4">
                  <StrategyField label={talkingPointsLabel} hint={talkingPointsHint}>
                    <div className="space-y-3">
                      {talkingPoints.map((point, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-900/50">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                            {index + 1}
                          </div>
                          <Input
                            value={point}
                            onChange={e => handleTalkingPointChange(index, e.target.value)}
                            placeholder={isPricingKeywordType ? `Price factor ${index + 1}` : `Talking point ${index + 1}`}
                            className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
                          />
                          {talkingPoints.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeTalkingPoint(index)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="rounded-full" onClick={addTalkingPoint}>
                        {isPricingKeywordType ? "Add Price Factor" : "Add Talking Point"}
                      </Button>
                    </div>
                  </StrategyField>

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">What makes a stronger brief</p>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      <p>Include specifics you would want a writer or strategist to know before drafting.</p>
                      <p>Use talking points for structure and notes for nuance, objections, proof, and edge cases.</p>
                      <p>The more concrete the inputs are, the less cleanup you will need in the editor step.</p>
                    </div>
                  </div>
                </div>
              </div>
            </StrategySectionCard>

            <StrategySectionCard
              eyebrow="Assets"
              title="Media, links, and supporting proof"
              description="Organize the images and on-site references the draft should use so the finished post feels integrated with the rest of your site."
            >
              <Accordion type="multiple" className="w-full space-y-3">
                <AccordionItem value="asset-image-upload" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/60 px-0 dark:border-slate-800 dark:bg-slate-900/40">
                  <AccordionTrigger className="px-5 py-4 text-left hover:no-underline">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Image Uploads</div>
                      <p className="text-sm font-normal leading-6 text-slate-500 dark:text-slate-400">
                        {uploadedImages.length > 0
                          ? `${uploadedImages.length} image${uploadedImages.length === 1 ? "" : "s"} attached for placement and featured-image use.`
                          : `Upload up to ${MAX_BLOG_IMAGES} images and tag them for AI placement.`}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-0">
                    <div className="space-y-4">
                      {!hasBeforeAfterImagePair && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          The Before & After section is only included when this post has at least one uploaded image tagged `Before` and one tagged `After`.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => openPhotoLibrary("blog")}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Choose from Photo Library
                        </Button>
                      </div>

                      {(blogType === "job_showcase" || isKeywordTargetingType) && (
                        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => beforeSetInputRef.current?.click()}
                            >
                              Select Before ({pendingBeforeSetFiles.length})
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => afterSetInputRef.current?.click()}
                            >
                              Select After ({pendingAfterSetFiles.length})
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-full"
                              onClick={handleBeforeAfterSetUpload}
                              disabled={pendingBeforeSetFiles.length === 0 && pendingAfterSetFiles.length === 0}
                            >
                              Upload Before/After Set
                            </Button>
                          </div>
                          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                            Use matching before and after selections to upload paired image sets in order.
                          </p>
                          <input
                            ref={beforeSetInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => setPendingBeforeSetFiles(Array.from(e.target.files || []))}
                          />
                          <input
                            ref={afterSetInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => setPendingAfterSetFiles(Array.from(e.target.files || []))}
                          />
                        </div>
                      )}

                      <div
                        className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center transition-colors hover:border-amber-400 dark:border-slate-700 dark:bg-slate-900/40"
                        onClick={() => document.getElementById('blog-image-upload')?.click()}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleImageUpload(e.dataTransfer.files);
                        }}
                      >
                        <Upload className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag and drop images here, or click to browse</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">JPG, PNG, or WebP. Max 5MB each, {MAX_BLOG_IMAGES} images total.</p>
                        <input
                          id="blog-image-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={e => handleImageUpload(e.target.files)}
                        />
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="grid gap-3 lg:grid-cols-2">
                          {uploadedImages.map((img, index) => (
                            <div key={index} className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                              <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
                                {img.uploading ? (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-slate-400 dark:text-slate-500" />
                                  </div>
                                ) : (
                                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <Select
                                  value={img.imageType}
                                  onValueChange={v => updateImageMeta(index, 'imageType', v)}
                                >
                                  <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hero">Hero / Featured</SelectItem>
                                    <SelectItem value="before">Before</SelectItem>
                                    <SelectItem value="after">After</SelectItem>
                                    <SelectItem value="process">Process / In-Progress</SelectItem>
                                    <SelectItem value="equipment">Equipment</SelectItem>
                                    <SelectItem value="team">Team</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={img.caption}
                                  onChange={e => updateImageMeta(index, 'caption', e.target.value)}
                                  placeholder="Caption or usage note for AI context"
                                  className="h-9 rounded-xl border-slate-200 bg-white text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant={featuredImageUrl === (img.url || img.preview) ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-full"
                                    disabled={img.uploading}
                                    onClick={() => useUploadedImageAsFeatured(index)}
                                  >
                                    {featuredImageUrl === (img.url || img.preview) ? "Featured Image" : "Use as Featured"}
                                  </Button>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full"
                                onClick={() => removeUploadedImage(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="asset-image-generation" className="overflow-hidden rounded-2xl border border-sky-200/80 bg-sky-50/50 px-0 dark:border-sky-900/40 dark:bg-sky-950/20">
                  <AccordionTrigger className="px-5 py-4 text-left hover:no-underline">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Image Generation</div>
                      <p className="text-sm font-normal leading-6 text-slate-500 dark:text-slate-400">
                        Generate realistic hero, crew, and matched before/after scenes from the strategy inputs.
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-0">
                    <div className="space-y-4">
                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                          <div className="flex items-center justify-between gap-3">
                            <Label>Hero Image Prompt</Label>
                            {heroImagePromptTouched && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || "";
                                  setHeroImagePrompt(buildSuggestedHeroImagePrompt({
                                    serviceName,
                                    targetKeyword,
                                    targetCity,
                                    blogType,
                                  }));
                                  setHeroImagePromptTouched(false);
                                }}
                              >
                                Reset Suggestion
                              </Button>
                            )}
                          </div>
                          <Textarea
                            value={heroImagePrompt}
                            onChange={(e) => {
                              setHeroImagePrompt(e.target.value);
                              setHeroImagePromptTouched(true);
                            }}
                            rows={3}
                            placeholder="Example: Clean wide exterior photo of a freshly serviced patio at a suburban home, natural morning light, polished but realistic."
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            This prompt is auto-suggested from your strategy inputs once you choose a service. You can edit it before generating.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={generatingImageKind === "hero" || uploadedImages.length >= MAX_BLOG_IMAGES}
                            onClick={() => {
                              if (!ensureImageCapacity(1)) return;
                              generateBlogImages(
                                {
                                  mode: "single",
                                  imageType: "hero",
                                  prompt:
                                    heroImagePrompt.trim() ||
                                    `Photorealistic hero image for ${targetKeyword.trim() || "a service business blog"} in ${targetCity.trim() || "a local service area"}.`,
                                },
                                "hero"
                              );
                            }}
                          >
                            {generatingImageKind === "hero" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Hero
                          </Button>
                        </div>

                        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                          <div className="flex items-center justify-between gap-3">
                            <Label>Crew Image Prompt</Label>
                            {crewImagePromptTouched && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || "";
                                  setCrewImagePrompt(buildSuggestedCrewImagePrompt({
                                    serviceName,
                                    targetKeyword,
                                    targetCity,
                                    businessName: defaultBusinessName,
                                    hasLogo: Boolean(defaultBlogLogoUrl.trim()),
                                  }));
                                  setCrewImagePromptTouched(false);
                                }}
                              >
                                Reset Suggestion
                              </Button>
                            )}
                          </div>
                          <Textarea
                            value={crewImagePrompt}
                            onChange={(e) => {
                              setCrewImagePrompt(e.target.value);
                              setCrewImagePromptTouched(true);
                            }}
                            rows={3}
                            placeholder="Example: Real service crew preparing equipment outside a residential property, candid action shot, realistic uniforms and tools."
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            This prompt is auto-suggested from your strategy inputs and saved business defaults. If a logo is saved, the crew image prompt will bias toward realistic branded uniforms or vehicle signage.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={generatingImageKind === "crew" || uploadedImages.length >= MAX_BLOG_IMAGES}
                            onClick={() => {
                              if (!ensureImageCapacity(1)) return;
                              generateBlogImages(
                                {
                                  mode: "single",
                                  imageType: "crew",
                                  prompt:
                                    crewImagePrompt.trim() ||
                                    `Photorealistic crew image for ${targetKeyword.trim() || "a local service business"}, candid and realistic.`,
                                },
                                "crew"
                              );
                            }}
                          >
                            {generatingImageKind === "crew" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Crew
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <Label>Before / After Scene Prompt</Label>
                            {beforeAfterScenePromptTouched && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || "";
                                  setBeforeAfterScenePrompt(buildSuggestedBeforeAfterScenePrompt({
                                    serviceName,
                                    targetKeyword,
                                    targetCity,
                                    blogType,
                                  }));
                                  setBeforeAfterScenePromptTouched(false);
                                }}
                              >
                                Reset Suggestion
                              </Button>
                            )}
                          </div>
                          <Textarea
                            value={beforeAfterScenePrompt}
                            onChange={(e) => {
                              setBeforeAfterScenePrompt(e.target.value);
                              setBeforeAfterScenePromptTouched(true);
                            }}
                            rows={3}
                            placeholder="Describe the exact property scene, camera angle, and surfaces. Example: Straight-on backyard patio photo at eye level with pavers, retaining wall, and nearby landscaping."
                          />
                        </div>
                        <div className="grid gap-3 xl:grid-cols-2">
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <Label>Before Condition</Label>
                              {beforeStatePromptTouched && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => {
                                    const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || "";
                                    setBeforeStatePrompt(buildSuggestedBeforeStatePrompt({
                                      serviceName,
                                      targetKeyword,
                                    }));
                                    setBeforeStatePromptTouched(false);
                                  }}
                                >
                                  Reset Suggestion
                                </Button>
                              )}
                            </div>
                            <Textarea
                              value={beforeStatePrompt}
                              onChange={(e) => {
                                setBeforeStatePrompt(e.target.value);
                                setBeforeStatePromptTouched(true);
                              }}
                              rows={3}
                              placeholder="Example: Patio surface is dull with algae streaks, dirt buildup, and dark staining in the joints."
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <Label>After Condition</Label>
                              {afterStatePromptTouched && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => {
                                    const serviceName = formulas.find((f) => f.id === primaryServiceId)?.name || "";
                                    setAfterStatePrompt(buildSuggestedAfterStatePrompt({
                                      serviceName,
                                      targetKeyword,
                                    }));
                                    setAfterStatePromptTouched(false);
                                  }}
                                >
                                  Reset Suggestion
                                </Button>
                              )}
                            </div>
                            <Textarea
                              value={afterStatePrompt}
                              onChange={(e) => {
                                setAfterStatePrompt(e.target.value);
                                setAfterStatePromptTouched(true);
                              }}
                              rows={3}
                              placeholder="Example: Same patio after professional cleaning, brighter pavers, removed algae, cleaner joints, same framing and lighting."
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            disabled={generatingImageKind === "before_after_pair" || uploadedImages.length > MAX_BLOG_IMAGES - 2}
                            onClick={() => {
                              if (!ensureImageCapacity(2)) return;
                              generateBlogImages(
                                {
                                  mode: "before_after_pair",
                                  scenePrompt:
                                    beforeAfterScenePrompt.trim() ||
                                    `Realistic property photo for ${targetKeyword.trim() || "a service blog"} in ${targetCity.trim() || "a local area"}.`,
                                  beforeStatePrompt:
                                    beforeStatePrompt.trim() ||
                                    "Show the property before the service result, with visible dirt, staining, buildup, or untreated surfaces.",
                                  afterStatePrompt:
                                    afterStatePrompt.trim() ||
                                    "Show the exact same scene after the service result, with only the treated surfaces improved.",
                                },
                                "before_after_pair"
                              );
                            }}
                          >
                            {generatingImageKind === "before_after_pair" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Before / After Pair
                          </Button>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            The after image is generated from the before image so the scene stays matched for the slider.
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="asset-internal-links" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/60 px-0 dark:border-slate-800 dark:bg-slate-900/40">
                  <AccordionTrigger className="px-5 py-4 text-left hover:no-underline">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Internal Links</div>
                      <p className="text-sm font-normal leading-6 text-slate-500 dark:text-slate-400">
                        {internalLinks.filter((link) => link.anchorText.trim() || link.url.trim()).length > 0
                          ? `${internalLinks.filter((link) => link.anchorText.trim() || link.url.trim()).length} internal link${internalLinks.filter((link) => link.anchorText.trim() || link.url.trim()).length === 1 ? "" : "s"} added.`
                          : "Add destination pages the post should reinforce so the article contributes to your site structure."}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-0">
                    <StrategyField label="Internal Links" hint="Add destination pages the post should reinforce so the article contributes to your site structure.">
                      <div className="space-y-2">
                        {internalLinks.map((link, index) => (
                          <div key={index} className="grid items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2 md:grid-cols-[1fr_1.4fr_auto] dark:border-slate-800 dark:bg-slate-900/50">
                            <Input
                              value={link.anchorText}
                              onChange={e => updateInternalLink(index, "anchorText", e.target.value)}
                              placeholder="Anchor text"
                              className="h-10 rounded-xl border-0 bg-white shadow-none dark:bg-slate-950"
                            />
                            <Input
                              value={link.url}
                              onChange={e => updateInternalLink(index, "url", e.target.value)}
                              placeholder="https://yourdomain.com/service-page or /service-page"
                              className="h-10 rounded-xl border-0 bg-white shadow-none dark:bg-slate-950"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => removeInternalLink(index)}
                              disabled={internalLinks.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="rounded-full" onClick={addInternalLink}>
                          Add Internal Link
                        </Button>
                      </div>
                    </StrategyField>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="asset-supporting-embeds" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/60 px-0 dark:border-slate-800 dark:bg-slate-900/40">
                  <AccordionTrigger className="px-5 py-4 text-left hover:no-underline">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Supporting Embeds</div>
                      <p className="text-sm font-normal leading-6 text-slate-500 dark:text-slate-400">
                        {[videoUrl, facebookPostUrl, gmbPostUrl].filter((value) => value.trim()).length > 0
                          ? `${[videoUrl, facebookPostUrl, gmbPostUrl].filter((value) => value.trim()).length} supporting embed${[videoUrl, facebookPostUrl, gmbPostUrl].filter((value) => value.trim()).length === 1 ? "" : "s"} ready.`
                          : "Optional social and video links can add proof, richer media, and alternate paths back into your brand."}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-0">
                    <StrategyField label="Supporting Embeds" hint="Optional social and video links can add proof, richer media, and alternate paths back into your brand.">
                      <div className="space-y-3">
                        <Input
                          value={videoUrl}
                          onChange={e => setVideoUrl(e.target.value)}
                          placeholder="YouTube or Vimeo URL"
                          className="h-11 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                        />
                        <Input
                          value={facebookPostUrl}
                          onChange={e => setFacebookPostUrl(e.target.value)}
                          placeholder="Facebook post URL"
                          className="h-11 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                        />
                        <Input
                          value={gmbPostUrl}
                          onChange={e => setGmbPostUrl(e.target.value)}
                          placeholder="Google Business post URL"
                          className="h-11 rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>
                    </StrategyField>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </StrategySectionCard>

            {!isStructuredSeoType && (
              <StrategySectionCard
                eyebrow="Structure"
                title="Layout template"
                description="Choose the section flow before generation so the draft lands in the right shape on the first pass."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {layoutTemplates.filter(t => !t.blogType || t.blogType === blogType).map(template => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer rounded-3xl border transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300/60 dark:border-amber-700 dark:bg-amber-950/20 dark:ring-amber-900/50'
                          : 'border-slate-200/80 bg-white hover:border-amber-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900/50'
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setLayoutTemplateId(template.id > 0 ? template.id : null);
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          {selectedTemplate?.id === template.id && (
                            <CheckCircle className="h-5 w-5 text-amber-600" />
                          )}
                          {template.name}
                        </CardTitle>
                        {template.description && (
                          <CardDescription>{template.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {(template.sections as any[])?.map((section, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <div className={`h-2 w-2 rounded-full ${section.required ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                              <span>{section.label}</span>
                              {section.required && <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Required</Badge>}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </StrategySectionCard>
            )}
          </div>
        );
      }

      case 2: // Editor

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Edit Content</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? "Hide Preview" : "Preview"}
                </Button>
                <Button variant="outline" onClick={() => handleSave(false)} disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </div>

            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="meta">Meta & SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Blog post title"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label>URL Slug</Label>
                  <Input
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="url-friendly-slug"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">Block Controls</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Toggle blocks on or off before saving. Add paragraph sections whenever you need more body copy.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={addParagraphSection}>
                        Add Paragraph Section
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addGeneratedParagraphSection}
                        disabled={regenerateSectionMutation.isPending}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Paragraph Section
                      </Button>
                    </div>
                  </div>
                </div>

                <Accordion type="multiple" className="w-full">
                  {content.map((section, index) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex w-full items-center justify-between gap-3 pr-2">
                          <div className={`flex items-center gap-2 ${section.enabled === false ? "opacity-50" : ""}`}>
                            {lockedSections.has(section.id) ? (
                              <Lock className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Unlock className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                            )}
                            <span className="capitalize">{section.type.replace(/_/g, " ")}</span>
                            {section.enabled === false && (
                              <Badge variant="outline" className="text-xs">Off</Badge>
                            )}
                          </div>
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {section.enabled === false ? "Disabled" : "Enabled"}
                            </span>
                            <Switch
                              checked={section.enabled !== false}
                              onCheckedChange={(checked) => toggleSectionEnabled(section.id, checked)}
                            />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className={`space-y-4 p-2 ${section.enabled === false ? "opacity-60" : ""}`}>
                          {section.enabled === false && (
                            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3 text-sm text-gray-600 dark:text-slate-300">
                              This block is turned off and will not appear in the saved blog until you turn it back on.
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSectionLock(section.id)}
                            >
                              {lockedSections.has(section.id) ? (
                                <>
                                  <Unlock className="h-4 w-4 mr-1" />
                                  Unlock
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-1" />
                                  Lock
                                </>
                              )}
                            </Button>
                            {isEditing && !lockedSections.has(section.id) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => regenerateSectionMutation.mutate({ sectionId: section.id, sectionType: section.type })}
                                disabled={regenerateSectionMutation.isPending}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Regenerate
                              </Button>
                            )}
                          </div>
                          {renderSectionEditor(section, lockedSections.has(section.id) || section.enabled === false)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="meta" className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={metaTitle}
                    onChange={e => setMetaTitle(e.target.value)}
                    placeholder="SEO title (50-60 characters)"
                    maxLength={70}
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{metaTitle.length}/60 characters</p>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    value={metaDescription}
                    onChange={e => setMetaDescription(e.target.value)}
                    placeholder="SEO description (150-160 characters)"
                    maxLength={170}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{metaDescription.length}/160 characters</p>
                </div>

                <div>
                  <Label>Excerpt</Label>
                  <Textarea
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    placeholder="Short excerpt for previews"
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 3: // SEO Review
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>SEO Review</h2>

            {seoScore !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>SEO Score</span>
                    <span className={`text-2xl ${
                      seoScore >= 80 ? 'text-green-600' :
                      seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{seoScore}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={seoScore} className="h-3 mb-4" />
                  <div className="space-y-2">
                    {seoChecklist.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.isPassed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className={item.isPassed ? 'text-gray-700 dark:text-slate-300' : 'text-red-700'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900">
                  <div className="text-amber-600 text-sm truncate">{targetCity} | Your Business</div>
                  <div className="text-lg font-medium text-amber-800 hover:underline cursor-pointer truncate">
                    {metaTitle || title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                    {metaDescription || excerpt}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4: // Publish
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Publish Settings</h2>

            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Input
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g., Tips & Guides"
                />
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tags.join(", ")}
                  onChange={e => setTags(e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                  placeholder="e.g., cleaning, maintenance, tips"
                />
              </div>

              <div>
                <Label className="mb-2 block">Featured Image</Label>
                <div
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("featured-image-upload")?.click()}
                >
                  {featuredImageUploading ? (
                    <Loader2 className="h-8 w-8 mx-auto text-gray-400 dark:text-slate-400 mb-2 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-slate-400 mb-2" />
                  )}
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {featuredImageUploading ? "Uploading..." : "Click to upload a featured image"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">JPG, PNG, or WebP (max 5MB)</p>
                  <input
                    id="featured-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={e => handleFeaturedImageUpload(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openPhotoLibrary("featured")}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose from Photo Library
                  </Button>
                </div>

                {featuredImageUrl && (
                  <div className="mt-3 border dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-900/60 flex items-center gap-3">
                    <img
                      src={featuredImageUrl}
                      alt="Featured preview"
                      className="w-20 h-20 object-cover rounded border dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Featured image selected</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{featuredImageUrl}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFeaturedImageUrl("")}
                      disabled={featuredImageUploading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2 border-t dark:border-slate-700">
                <h3 className="text-base font-semibold">CTA Controls</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Configure a global CTA destination and optionally override it for this post.
                </p>

                <div className="rounded-lg border dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Global CTA Enabled</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Used by posts that keep global defaults enabled.</p>
                    </div>
                    <Switch
                      checked={globalCtaEnabled}
                      onCheckedChange={setGlobalCtaEnabled}
                    />
                  </div>
                  <div>
                    <Label>Global CTA URL</Label>
                    <Input
                      value={globalCtaUrl}
                      onChange={(e) => setGlobalCtaUrl(e.target.value)}
                      placeholder="https://yourdomain.com/contact"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => saveBusinessDefaultsMutation.mutate(undefined)}
                      disabled={saveBusinessDefaultsMutation.isPending}
                    >
                      {saveBusinessDefaultsMutation.isPending ? "Saving..." : "Save Global CTA"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border dark:border-slate-700 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Use Global CTA Settings</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Turn off to override CTA behavior for this post only.</p>
                    </div>
                    <Switch
                      checked={useGlobalCtaSettings}
                      onCheckedChange={setUseGlobalCtaSettings}
                    />
                  </div>

                  {!useGlobalCtaSettings && (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Show CTA Button on This Post</p>
                        </div>
                        <Switch
                          checked={postCtaButtonEnabled}
                          onCheckedChange={setPostCtaButtonEnabled}
                        />
                      </div>
                      <div>
                        <Label>CTA URL (Per Post)</Label>
                        <Input
                          value={postCtaButtonUrl}
                          onChange={(e) => setPostCtaButtonUrl(e.target.value)}
                          placeholder="https://yourdomain.com/contact"
                        />
                      </div>
                    </>
                  )}

                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Effective CTA: {effectiveCtaEnabled ? "Enabled" : "Disabled"}{effectiveCtaEnabled ? ` (${effectiveCtaUrl || "Uses section/default URL"})` : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t dark:border-slate-700">
                <h3 className="text-base font-semibold">SEO Enhancements</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Add internal links and external proof assets to strengthen on-page SEO and user trust.
                </p>

                <div className="space-y-2">
                  <Label className="mb-2 block">Internal Links</Label>
                  {internalLinks.map((link, index) => (
                    <div key={`publish-link-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
                      <Input
                        value={link.anchorText}
                        onChange={e => updateInternalLink(index, "anchorText", e.target.value)}
                        placeholder="Anchor text"
                      />
                      <Input
                        value={link.url}
                        onChange={e => updateInternalLink(index, "url", e.target.value)}
                        placeholder="https://yourdomain.com/page or /page"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInternalLink(index)}
                        disabled={internalLinks.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addInternalLink}>
                    Add Internal Link
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700">
                        <VideoIcon className="h-3 w-3" />
                      </span>
                      Video URL (Optional)
                    </Label>
                    <Input
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="YouTube or Vimeo URL"
                    />
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700">
                        <FaFacebookF className="h-2.5 w-2.5" />
                      </span>
                      Facebook Post URL (Optional)
                    </Label>
                    <Input
                      value={facebookPostUrl}
                      onChange={e => setFacebookPostUrl(e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                        <FaGoogle className="h-2.5 w-2.5" />
                      </span>
                      Google Business Post URL (Optional)
                    </Label>
                    <Input
                      value={gmbPostUrl}
                      onChange={e => setGmbPostUrl(e.target.value)}
                      placeholder="Google post URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saveMutation.isPending}
                    className="flex-1 w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={handleSaveAndSync}
                    disabled={saveMutation.isPending || syncToWebsiteMutation.isPending}
                    className="flex-1 w-full"
                  >
                    {syncToWebsiteMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    {syncToWebsiteMutation.isPending ? "Syncing..." : "Save & Sync"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSectionEditor = (section: BlogContentSection, isLocked: boolean) => {
    const handleChange = (field: string, value: any) => {
      if (isLocked) return;
      updateSectionContent(section.id, { ...section.content, [field]: value });
    };

    const renderExpandWithAiButton = (
      fieldKey: string,
      fieldLabel: string,
      currentText: string,
      onApply: (value: string) => void,
      context?: string,
      allowDraft?: boolean
    ) => {
      if (!currentText.trim() || (!id && !allowDraft)) return null;

      return (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          disabled={isLocked || expandingFieldKey === fieldKey}
          onClick={() => requestFieldExpansion({
            fieldKey,
            sectionType: section.type,
            fieldLabel,
            currentText,
            context,
            onApply,
            allowDraft,
          })}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {expandingFieldKey === fieldKey ? "Expanding..." : "Expand with AI"}
        </Button>
      );
    };

    switch (section.type) {
      case "hero":
        return (
          <div className="space-y-3">
            <div>
              <Label>Headline</Label>
              <Input
                value={section.content?.headline || ""}
                onChange={e => handleChange("headline", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Subheadline</Label>
              <Input
                value={section.content?.subheadline || ""}
                onChange={e => handleChange("subheadline", e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-3">
            <div>
              <Label>Heading</Label>
              <Input
                value={section.content?.heading || ""}
                onChange={e => handleChange("heading", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label>Body Paragraphs</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Use a blank line between paragraphs
                  </span>
                  {renderExpandWithAiButton(
                    `${section.id}:body`,
                    "Body Paragraphs",
                    section.content?.body || "",
                    (value) => handleChange("body", value),
                    section.content?.heading ? `Heading: ${section.content.heading}` : undefined
                  )}
                </div>
              </div>
              <Textarea
                value={section.content?.body || ""}
                onChange={e => handleChange("body", e.target.value)}
                rows={8}
                disabled={isLocked}
                placeholder="Write the body copy here. Press Enter twice to start a new paragraph."
              />
            </div>
          </div>
        );

      case "job_summary":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Project Type</Label>
                <Input
                  value={section.content?.projectType || ""}
                  onChange={e => handleChange("projectType", e.target.value)}
                  disabled={isLocked}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={section.content?.location || ""}
                  onChange={e => handleChange("location", e.target.value)}
                  disabled={isLocked}
                />
              </div>
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                value={section.content?.duration || ""}
                onChange={e => handleChange("duration", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Highlights (one per line)</Label>
              <Textarea
                value={(section.content?.highlights || []).join("\n")}
                onChange={e => handleChange("highlights", e.target.value.split("\n").filter(Boolean))}
                rows={4}
                disabled={isLocked}
              />
            </div>
          </div>
        );

      case "process_timeline":
        const processSteps = (Array.isArray(section.content?.steps) && section.content.steps.length > 0)
          ? section.content.steps
          : Array.from({ length: 3 }, () => ({ title: "", description: "", duration: "" }));
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-4">
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Build the timeline as individual steps. Each card becomes a styled step in the published blog.
              </p>
            </div>
            {processSteps.map((step: any, i: number) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                    Step {i + 1}
                  </div>
                  {processSteps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const nextSteps = processSteps.filter((_: any, index: number) => index !== i);
                        handleChange("steps", nextSteps);
                      }}
                      disabled={isLocked}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
                  <div>
                    <Label>Step Title</Label>
                    <Input
                      value={step.title || ""}
                      onChange={e => {
                        const nextSteps = [...processSteps];
                        nextSteps[i] = { ...nextSteps[i], title: e.target.value };
                        handleChange("steps", nextSteps);
                      }}
                      disabled={isLocked}
                      placeholder="Example: Surface prep and masking"
                    />
                  </div>
                  <div>
                    <Label>Duration (Optional)</Label>
                    <Input
                      value={step.duration || ""}
                      onChange={e => {
                        const nextSteps = [...processSteps];
                        nextSteps[i] = { ...nextSteps[i], duration: e.target.value };
                        handleChange("steps", nextSteps);
                      }}
                      disabled={isLocked}
                      placeholder="2 hours"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Label>Description</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        Use a blank line between paragraphs
                      </span>
                      {renderExpandWithAiButton(
                        `${section.id}:step:${i}:description`,
                        `Step ${i + 1} Description`,
                        step.description || "",
                        (value) => {
                          const nextSteps = [...processSteps];
                          nextSteps[i] = { ...nextSteps[i], description: value };
                          handleChange("steps", nextSteps);
                        },
                        step.title ? `Step title: ${step.title}` : undefined
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={step.description || ""}
                    onChange={e => {
                      const nextSteps = [...processSteps];
                      nextSteps[i] = { ...nextSteps[i], description: e.target.value };
                      handleChange("steps", nextSteps);
                    }}
                    rows={4}
                    disabled={isLocked}
                    placeholder="Explain what happened during this step, what equipment or prep was needed, and why it mattered."
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChange("steps", [...processSteps, { title: "", description: "", duration: "" }])}
              disabled={isLocked}
            >
              Add Step
            </Button>
          </div>
        );

      case "faq":
        const faqQuestions = (Array.isArray(section.content?.questions) && section.content.questions.length > 0)
          ? section.content.questions
          : Array.from({ length: 4 }, () => ({ question: "", answer: "" }));
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/30 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Published FAQs render as click-to-expand cards. Write short, specific questions and fuller answers.
              </p>
            </div>
            {faqQuestions.map((q: any, i: number) => (
              <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
                    FAQ {i + 1}
                  </p>
                </div>
                <div>
                  <Label>Question {i + 1}</Label>
                  <Input
                    value={q.question || ""}
                    onChange={e => {
                      const newQuestions = [...(section.content?.questions || [])];
                      newQuestions[i] = { ...newQuestions[i], question: e.target.value };
                      handleChange("questions", newQuestions);
                    }}
                    disabled={isLocked}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Label>Answer</Label>
                    {renderExpandWithAiButton(
                      `${section.id}:faq:${i}:answer`,
                      `FAQ ${i + 1} Answer`,
                      q.answer || "",
                      (value) => {
                        const newQuestions = [...(section.content?.questions || [])];
                        newQuestions[i] = { ...newQuestions[i], answer: value };
                        handleChange("questions", newQuestions);
                      },
                      q.question ? `Question: ${q.question}` : undefined
                    )}
                  </div>
                  <Textarea
                    value={q.answer || ""}
                    onChange={e => {
                      const newQuestions = [...(section.content?.questions || [])];
                      newQuestions[i] = { ...newQuestions[i], answer: e.target.value };
                      handleChange("questions", newQuestions);
                    }}
                    rows={4}
                    disabled={isLocked}
                    placeholder="Answer this clearly. Add a blank line if you want multiple paragraphs."
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case "pricing_factors":
        const pricingFactors = (Array.isArray(section.content?.factors) && section.content.factors.length > 0)
          ? section.content.factors
          : Array.from({ length: 3 }, () => ({ name: "", description: "", impact: "medium" }));
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label>Intro</Label>
                {renderExpandWithAiButton(
                  `${section.id}:intro`,
                  "Pricing Intro",
                  section.content?.intro || "",
                  (value) => handleChange("intro", value)
                )}
              </div>
              <Textarea
                value={section.content?.intro || ""}
                onChange={e => handleChange("intro", e.target.value)}
                rows={3}
                disabled={isLocked}
                placeholder="Explain how scope, condition, access, or size changes the price."
              />
            </div>
            <div className="space-y-3">
              {pricingFactors.map((factor: any, i: number) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                    Factor {i + 1}
                  </p>
                  <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={factor.name || ""}
                        onChange={e => {
                          const nextFactors = [...(section.content?.factors || [])];
                          nextFactors[i] = { ...nextFactors[i], name: e.target.value };
                          handleChange("factors", nextFactors);
                        }}
                        disabled={isLocked}
                        placeholder="e.g., Surface area"
                      />
                    </div>
                    <div>
                      <Label>Impact</Label>
                      <Select
                        value={factor.impact || "medium"}
                        onValueChange={(value) => {
                          const nextFactors = [...(section.content?.factors || [])];
                          nextFactors[i] = { ...nextFactors[i], impact: value };
                          handleChange("factors", nextFactors);
                        }}
                        disabled={isLocked}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Label>Description</Label>
                      {renderExpandWithAiButton(
                        `${section.id}:factor:${i}:description`,
                        `Pricing Factor ${i + 1} Description`,
                        factor.description || "",
                        (value) => {
                          const nextFactors = [...(section.content?.factors || [])];
                          nextFactors[i] = { ...nextFactors[i], description: value };
                          handleChange("factors", nextFactors);
                        },
                        factor.name ? `Factor name: ${factor.name}` : undefined
                      )}
                    </div>
                    <Textarea
                      value={factor.description || ""}
                      onChange={e => {
                        const nextFactors = [...(section.content?.factors || [])];
                        nextFactors[i] = { ...nextFactors[i], description: e.target.value };
                        handleChange("factors", nextFactors);
                      }}
                      rows={3}
                      disabled={isLocked}
                      placeholder="Describe how this factor changes the price or scope."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "pricing_table":
        const pricingTableColumns = (Array.isArray(section.content?.columns) && section.content.columns.length > 0)
          ? section.content.columns
          : ["Service Tier", "Typical Price", "What's Included"];
        const pricingTableRows = (Array.isArray(section.content?.rows) && section.content.rows.length > 0)
          ? section.content.rows
          : Array.from({ length: 3 }, () => ({ label: "", priceRange: "", details: "" }));
        return (
          <div className="space-y-4">
            <div>
              <Label>Heading</Label>
              <Input
                value={section.content?.heading || ""}
                onChange={e => handleChange("heading", e.target.value)}
                disabled={isLocked}
                placeholder="Typical Price Ranges"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {pricingTableColumns.map((column: string, i: number) => (
                <div key={i}>
                  <Label>Column {i + 1}</Label>
                  <Input
                    value={column || ""}
                    onChange={e => {
                      const nextColumns = [...pricingTableColumns];
                      nextColumns[i] = e.target.value;
                      handleChange("columns", nextColumns);
                    }}
                    disabled={isLocked}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {pricingTableRows.map((row: any, i: number) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                    Row {i + 1}
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={row.label || ""}
                        onChange={e => {
                          const nextRows = [...pricingTableRows];
                          nextRows[i] = { ...nextRows[i], label: e.target.value };
                          handleChange("rows", nextRows);
                        }}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <Label>Price Range</Label>
                      <Input
                        value={row.priceRange || ""}
                        onChange={e => {
                          const nextRows = [...pricingTableRows];
                          nextRows[i] = { ...nextRows[i], priceRange: e.target.value };
                          handleChange("rows", nextRows);
                        }}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <Label>Details</Label>
                      <Input
                        value={row.details || ""}
                        onChange={e => {
                          const nextRows = [...pricingTableRows];
                          nextRows[i] = { ...nextRows[i], details: e.target.value };
                          handleChange("rows", nextRows);
                        }}
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "pricing_chart":
        const pricingChartBars = (Array.isArray(section.content?.bars) && section.content.bars.length > 0)
          ? section.content.bars
          : Array.from({ length: 4 }, () => ({ label: "", value: 0, displayValue: "", description: "" }));
        return (
          <div className="space-y-4">
            <div>
              <Label>Heading</Label>
              <Input
                value={section.content?.heading || ""}
                onChange={e => handleChange("heading", e.target.value)}
                disabled={isLocked}
                placeholder="Pricing Snapshot"
              />
            </div>
            <div className="space-y-3">
              {pricingChartBars.map((bar: any, i: number) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
                    Bar {i + 1}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={bar.label || ""}
                        onChange={e => {
                          const nextBars = [...pricingChartBars];
                          nextBars[i] = { ...nextBars[i], label: e.target.value };
                          handleChange("bars", nextBars);
                        }}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <Label>Display Value</Label>
                      <Input
                        value={bar.displayValue || ""}
                        onChange={e => {
                          const nextBars = [...pricingChartBars];
                          nextBars[i] = { ...nextBars[i], displayValue: e.target.value };
                          handleChange("bars", nextBars);
                        }}
                        disabled={isLocked}
                        placeholder="$350"
                      />
                    </div>
                    <div>
                      <Label>Numeric Value</Label>
                      <Input
                        type="number"
                        value={bar.value ?? 0}
                        onChange={e => {
                          const nextBars = [...pricingChartBars];
                          nextBars[i] = { ...nextBars[i], value: Number(e.target.value || 0) };
                          handleChange("bars", nextBars);
                        }}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={bar.description || ""}
                        onChange={e => {
                          const nextBars = [...pricingChartBars];
                          nextBars[i] = { ...nextBars[i], description: e.target.value };
                          handleChange("bars", nextBars);
                        }}
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "cta":
        return (
          <div className="space-y-3">
            <div>
              <Label>Heading</Label>
              <Input
                value={section.content?.heading || ""}
                onChange={e => handleChange("heading", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label>Body</Label>
                {renderExpandWithAiButton(
                  `${section.id}:body`,
                  "CTA Body",
                  section.content?.body || "",
                  (value) => handleChange("body", value),
                  section.content?.heading ? `Heading: ${section.content.heading}` : undefined
                )}
              </div>
              <Textarea
                value={section.content?.body || ""}
                onChange={e => handleChange("body", e.target.value)}
                rows={2}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={section.content?.buttonText || ""}
                onChange={e => handleChange("buttonText", e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );

      case "autobidder_form":
        return (
          <div className="space-y-3">
            <div>
              <Label>Heading</Label>
              <Input
                value={section.content?.heading || ""}
                onChange={e => handleChange("heading", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label>Body</Label>
                {renderExpandWithAiButton(
                  `${section.id}:body`,
                  "Form Body",
                  section.content?.body || "",
                  (value) => handleChange("body", value),
                  section.content?.heading ? `Heading: ${section.content.heading}` : undefined
                )}
              </div>
              <Textarea
                value={section.content?.body || ""}
                onChange={e => handleChange("body", e.target.value)}
                rows={3}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Fallback Link Text</Label>
              <Input
                value={section.content?.buttonText || ""}
                onChange={e => handleChange("buttonText", e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );

      case "map_embed":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-4">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                This section renders an embedded Google Map inside the blog. Edit the copy, location label, or paste a fresh Google Maps embed snippet.
              </p>
            </div>
            <div>
              <Label>Heading</Label>
              <Input
                value={section.content?.heading || ""}
                onChange={e => handleChange("heading", e.target.value)}
                disabled={isLocked}
                placeholder="Service Area Map"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label>Body</Label>
                {renderExpandWithAiButton(
                  `${section.id}:body`,
                  "Map Body",
                  section.content?.body || "",
                  (value) => handleChange("body", value),
                  section.content?.locationLabel ? `Location: ${section.content.locationLabel}` : undefined
                )}
              </div>
              <Textarea
                value={section.content?.body || ""}
                onChange={e => handleChange("body", e.target.value)}
                rows={3}
                disabled={isLocked}
                placeholder="Use the map below to view the service area referenced in this post."
              />
            </div>
            <div>
              <Label>Location Label</Label>
              <Input
                value={section.content?.locationLabel || ""}
                onChange={e => handleChange("locationLabel", e.target.value)}
                disabled={isLocked}
                placeholder="Philadelphia"
              />
            </div>
            <div>
              <Label>Google Maps URL (Optional)</Label>
              <Input
                value={section.content?.mapUrl || ""}
                onChange={e => handleChange("mapUrl", e.target.value)}
                disabled={isLocked}
                placeholder="https://www.google.com/maps/..."
              />
            </div>
            <div>
              <Label>Embed HTML</Label>
              <Textarea
                value={section.content?.embedHtml || ""}
                onChange={e => handleChange("embedHtml", e.target.value)}
                rows={5}
                disabled={isLocked}
                placeholder="Paste the Google Maps iframe embed code here"
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label>Content (JSON)</Label>
            <Textarea
              value={JSON.stringify(section.content, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateSectionContent(section.id, parsed);
                } catch {}
              }}
              rows={8}
              disabled={isLocked}
              className="font-mono text-sm"
            />
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <style>{`
        .blog-editor-grain {
          position: relative;
          background:
            radial-gradient(circle at 0% 0%, rgba(245, 158, 11, 0.12) 0%, transparent 38%),
            radial-gradient(circle at 100% 0%, rgba(234, 88, 12, 0.09) 0%, transparent 32%),
            linear-gradient(180deg, #fffef9 0%, #ffffff 28%, #ffffff 100%);
        }
        .dark .blog-editor-grain {
          background:
            radial-gradient(circle at 0% 0%, rgba(245, 158, 11, 0.16) 0%, transparent 38%),
            radial-gradient(circle at 100% 0%, rgba(234, 88, 12, 0.12) 0%, transparent 34%),
            linear-gradient(180deg, #020617 0%, #0b1220 24%, #020617 100%);
        }
        .blog-editor-grain::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(rgba(148, 163, 184, 0.08) 0.6px, transparent 0.6px);
          background-size: 4px 4px;
          opacity: 0.32;
        }
        .dark .blog-editor-grain::before {
          background-image: radial-gradient(rgba(148, 163, 184, 0.14) 0.7px, transparent 0.7px);
          opacity: 0.22;
        }
      `}</style>
      <div className="blog-editor-grain relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-900 dark:text-slate-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/50 bg-gradient-to-r from-amber-50 via-white to-orange-50 dark:from-amber-950/40 dark:via-slate-900/85 dark:to-orange-950/30 p-5 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-600/80 font-semibold mb-1">Content Studio</p>
            <h1 className="text-3xl text-gray-900 dark:text-slate-100 leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {isEditing ? "Edit Blog Post" : "Create Blog Post"}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {isEditing ? title : "Generate SEO-optimized content for your website"}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/blog-posts")} className="border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30">
            Back to Blog Posts
          </Button>
        </div>

        {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {WIZARD_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 cursor-pointer ${
                index <= currentStep ? 'text-amber-700 dark:text-amber-300' : 'text-gray-400 dark:text-slate-400'
              }`}
              onClick={() => index < currentStep && setCurrentStep(index)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index === currentStep
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30'
                  : index < currentStep
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-100 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className="hidden md:inline text-sm font-medium">{step.label}</span>
            </div>
          ))}
        </div>
        <Progress value={((currentStep + 1) / WIZARD_STEPS.length) * 100} className="h-1 bg-slate-200 dark:bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-600" />
      </div>

      {/* Step content */}
      <Card className="border-slate-200/70 dark:border-slate-800/90 bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm shadow-sm">
        <CardContent className="pt-6">
          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Sparkles className="h-12 w-12 text-amber-600 animate-pulse mb-4" />
              <p className="text-lg font-medium">Generating your blog content...</p>
              <p className="text-slate-500 dark:text-slate-400">This may take a moment</p>
            </div>
          ) : (
            renderStepContent()
          )}
        </CardContent>
      </Card>

      <Dialog open={photoLibraryOpen} onOpenChange={setPhotoLibraryOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Photo Library</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Choose from the same images available on the `/photos` page.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
            <Input
              value={photoLibrarySearch}
              onChange={(e) => setPhotoLibrarySearch(e.target.value)}
              placeholder="Search by customer, service, tag, or URL"
              className="pl-9"
            />
          </div>
          <div className="overflow-y-auto pr-1">
            {filteredPhotoLibraryImages.length === 0 ? (
              <div className="border dark:border-slate-700 rounded-lg p-8 text-center text-sm text-gray-500 dark:text-slate-400">
                No matching photos found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPhotoLibraryImages.map((img) => (
                  <div key={img.key} className="border dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                    <div className="aspect-video bg-gray-100 dark:bg-slate-800">
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium truncate">{img.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{img.subtitle}</p>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => handlePhotoLibrarySelect({ url: img.url, title: img.title })}
                      >
                        {photoLibraryMode === "featured" ? "Set as Featured Image" : "Add to Blog Images"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      {!generateMutation.isPending && (
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => navigate("/blog-posts") : goBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          <div className="flex flex-col items-end gap-2">
            {currentStep < WIZARD_STEPS.length - 1 && (
              <Button onClick={goNext} disabled={!canProceed()}>
                {currentStep === 1 && content.length === 0 ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
            {!canProceed() && getStepValidationMessages().length > 0 && (
              <p className="max-w-sm text-right text-xs text-amber-700 dark:text-amber-300">
                {getStepValidationMessages().join(" ")}
              </p>
            )}
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
