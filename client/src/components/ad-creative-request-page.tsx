import type { ChangeEvent, FormEvent, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  Brush,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  LayoutGrid,
  Rocket,
  Send,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

const EXAMPLE_ADS = [
  {
    id: 1,
    title: "Instant Quote Hook",
    description: "A direct-response concept built to push homeowners toward your pricing funnel quickly.",
    category: "Lead Gen",
  },
  {
    id: 2,
    title: "Before-and-After Offer",
    description: "A results-focused layout that pairs social proof with a fast next step.",
    category: "Proof Ad",
  },
  {
    id: 3,
    title: "Seasonal Promotion Graphic",
    description: "A timely creative angle you can rotate during high-demand parts of the season.",
    category: "Seasonal",
  },
  {
    id: 4,
    title: "Service Spotlight Post",
    description: "A single-service concept that makes the offer easy to scan on Facebook and Instagram.",
    category: "Service Focus",
  },
  {
    id: 5,
    title: "Branded Trust Builder",
    description: "A cleaner educational ad style that emphasizes professionalism and credibility.",
    category: "Branding",
  },
  {
    id: 6,
    title: "Traffic Driver Carousel",
    description: "A multi-post concept style that gives you more variety for ongoing promotion.",
    category: "Campaign Pack",
  },
] as const;

const BENEFITS = [
  {
    icon: Rocket,
    title: "Ready-to-run ad concepts",
    description: "Skip the blank canvas and start with proven Autobidder-style concepts built for action.",
  },
  {
    icon: Brush,
    title: "Customized with your brand",
    description: "We use your business details, logo, and visual direction so the creatives feel like yours.",
  },
  {
    icon: Target,
    title: "Designed to drive pricing funnel traffic",
    description: "Every request is framed around helping users click through and reach your instant pricing experience.",
  },
] as const;

const FAQS = [
  {
    question: "What do I need to submit?",
    answer:
      "The basics are your business name, contact information, website, service type, and any branding notes. A logo and a few business photos help us make the creative feel more customized.",
  },
  {
    question: "What kinds of ads will I receive?",
    answer:
      "You will receive branded concepts based on Autobidder ad angles that are intended to help contractors promote their pricing funnels faster and more consistently.",
  },
  {
    question: "How is the $49 plan different?",
    answer:
      "The free request gives users a starting set of custom graphics. The $49 plan adds 20 more unique posts in the same style for broader rotation across paid and organic campaigns.",
  },
  {
    question: "Can I use these for Facebook and Instagram?",
    answer:
      "Yes. The concepts are meant to be useful across the main social placements contractors typically use, including Facebook and Instagram promotion.",
  },
] as const;

const UPSELL_CTA_PATH = "/upgrade";

type CreativeRequestFormState = {
  businessName: string;
  contactName: string;
  email: string;
  websiteUrl: string;
  industry: string;
  notes: string;
};

const initialFormState: CreativeRequestFormState = {
  businessName: "",
  contactName: "",
  email: "",
  websiteUrl: "",
  industry: "",
  notes: "",
};

const surfaceClassName =
  "rounded-[20px] border border-slate-200/70 bg-white/85 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.28)] backdrop-blur-sm transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/75 dark:shadow-[0_18px_45px_-24px_rgba(2,6,23,0.9)]";

const primaryButtonClassName =
  "rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 text-white shadow-[0_16px_30px_-16px_rgba(234,88,12,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500 hover:shadow-[0_22px_40px_-18px_rgba(234,88,12,0.95)]";

const secondaryButtonClassName =
  "rounded-xl border border-amber-200/70 bg-white/85 px-5 text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/80 dark:border-amber-500/20 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/80";

type AuthUserLike = {
  id?: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  organizationName?: string | null;
  businessInfo?: {
    businessName?: string | null;
    businessType?: string | null;
    industry?: string | null;
    website?: string | null;
  } | null;
} | null;

function buildPrefillFromUser(user: AuthUserLike): Partial<CreativeRequestFormState> {
  if (!user) return {};

  const businessName =
    user.businessInfo?.businessName?.trim() ||
    user.organizationName?.trim() ||
    "";

  const contactName = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean).join(" ");
  const industry =
    user.businessInfo?.industry?.trim() ||
    user.businessInfo?.businessType?.trim() ||
    "";

  return {
    businessName,
    contactName,
    email: user.email?.trim() || "",
    websiteUrl: user.businessInfo?.website?.trim() || "",
    industry,
  };
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <div className="inline-flex items-center rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
        {eyebrow}
      </div>
      <h2
        className="text-3xl tracking-tight text-slate-950 sm:text-4xl dark:text-white"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
        {description}
      </p>
    </div>
  );
}

function HeroSection({
  onScrollToForm,
  onScrollToExamples,
}: {
  onScrollToForm: () => void;
  onScrollToExamples: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-amber-100/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-6 py-8 shadow-[0_24px_70px_-36px_rgba(234,88,12,0.45)] sm:px-8 sm:py-10 lg:px-10 lg:py-12 dark:border-amber-500/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-500/10" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-slate-900/70 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Marketing Creative Pack
          </div>

          <div className="space-y-4">
            <h1
              className="max-w-4xl text-4xl leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Get Free Custom Ad Graphics for Your Business
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
              Autobidder wants users to succeed and get the most out of the platform. Request a free set of branded ad creatives based on proven Autobidder concepts so you can start sending traffic to your pricing funnel faster.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className={primaryButtonClassName} onClick={onScrollToForm}>
              Request Free Ad Graphics
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="unstyled" className={secondaryButtonClassName} onClick={onScrollToExamples}>
              View Example Ads
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            {[
              "Free branded creative request",
              "Built around proven Autobidder ad angles",
              "Upgrade path for 20 more unique posts",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className={`${surfaceClassName} overflow-hidden`}>
          <CardContent className="p-0">
            <div className="border-b border-slate-200/70 bg-white/80 px-5 py-4 dark:border-slate-800/80 dark:bg-slate-950/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Creative request preview</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">What users get from this page</p>
                </div>
                <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  Free Offer
                </Badge>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-[22px] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 dark:border-amber-500/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 text-white shadow-[0_16px_24px_-16px_rgba(234,88,12,0.9)]">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Free custom set</p>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      A starter set of custom graphics based on Autobidder concepts, tailored to your business details.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Best for",
                    value: "Driving traffic to your instant pricing funnel",
                  },
                  {
                    label: "$49 plan bonus",
                    value: "20 additional unique posts in the same style",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/60"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">What makes this useful</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Contractors often know they need marketing, but do not have ready-to-run creatives. This page gives them a fast path to launch.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Why This Exists"
        title="Autobidder helps users promote their pricing funnels faster"
        description="Autobidder works best when users actively drive traffic into their instant pricing experience. Many contractors know they need marketing, but do not have polished creatives ready to go. This page closes that gap with practical assets they can request directly inside the dashboard."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <Card
              key={benefit.title}
              className={`${surfaceClassName} group overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)]`}
            >
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_14px_24px_-18px_rgba(234,88,12,0.9)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{benefit.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function ExampleGallerySection({ sectionRef }: { sectionRef: RefObject<HTMLDivElement> }) {
  return (
    <div ref={sectionRef} className="space-y-6 scroll-mt-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Example Gallery"
          title="Example Ad Concepts"
          description="Use these placeholder cards to showcase the kinds of creative directions users can request. Replace the sample visuals and copy later with real ad examples once they are ready."
        />

        <div className="rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300">
          Replace the sample cards below with real ad images when they are available.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EXAMPLE_ADS.map((example, index) => (
          <Card
            key={example.id}
            className={`${surfaceClassName} group overflow-hidden hover:-translate-y-1 hover:shadow-[0_26px_65px_-30px_rgba(15,23,42,0.3)]`}
          >
            <CardContent className="p-0">
              <div className="relative overflow-hidden border-b border-slate-200/70 bg-slate-50/70 px-5 py-5 dark:border-slate-800/80 dark:bg-slate-900/70">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 opacity-90 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
                <div className="absolute left-5 top-5">
                  <Badge className="border-amber-200 bg-white/90 text-amber-700 dark:border-amber-500/20 dark:bg-slate-950/70 dark:text-amber-300">
                    {example.category}
                  </Badge>
                </div>
                <div className="relative mt-10 overflow-hidden rounded-[22px] border border-dashed border-amber-200/80 bg-white/85 p-4 shadow-inner dark:border-amber-500/20 dark:bg-slate-950/70">
                  <div className="aspect-[4/3] rounded-[18px] bg-gradient-to-br from-slate-100 via-white to-amber-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950" />
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5">
                    <div className="flex justify-between">
                      <div className="rounded-full border border-white/90 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-400">
                        Sample {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-2 text-white shadow-lg">
                        <ImagePlus className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/90 bg-white/90 p-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
                      <div
                        className="text-lg text-slate-950 dark:text-white"
                        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                      >
                        Add real preview
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Placeholder visual for future creative samples
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{example.title}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    Concept
                  </span>
                </div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{example.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FileUploadField({
  id,
  label,
  helperText,
  files,
  multiple = false,
  accept,
  onFilesSelected,
}: {
  id: string;
  label: string;
  helperText: string;
  files: File[];
  multiple?: boolean;
  accept?: string;
  onFilesSelected: (files: File[]) => void;
}) {
  const fileLabel = useMemo(() => {
    if (files.length === 0) return "No files selected yet";
    if (files.length === 1) return files[0].name;
    return `${files.length} files selected`;
  }, [files]);

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-amber-500/30 dark:hover:bg-slate-900"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_14px_24px_-18px_rgba(234,88,12,0.9)]">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{fileLabel}</p>
            <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{helperText}</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file) => (
              <span
                key={`${id}-${file.name}-${file.lastModified}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                {file.name}
              </span>
            ))}
          </div>
        )}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          const nextFiles = Array.from(event.target.files || []);
          onFilesSelected(nextFiles);
        }}
      />
    </div>
  );
}

function RequestFormSection({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLDivElement>;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formState, setFormState] = useState(initialFormState);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hydratedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = user && typeof user === "object" && "id" in user && typeof user.id === "string" ? user.id : null;
    if (!userId || hydratedUserIdRef.current === userId) return;

    const prefill = buildPrefillFromUser(user as AuthUserLike);

    setFormState((current) => ({
      businessName: current.businessName || prefill.businessName || "",
      contactName: current.contactName || prefill.contactName || "",
      email: current.email || prefill.email || "",
      websiteUrl: current.websiteUrl || prefill.websiteUrl || "",
      industry: current.industry || prefill.industry || "",
      notes: current.notes,
    }));

    hydratedUserIdRef.current = userId;
  }, [user]);

  const handleChange =
    (field: keyof CreativeRequestFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Replace this placeholder submit flow with the real creative request endpoint.
      // Include the text fields plus uploaded asset metadata once backend wiring is available.
      await new Promise((resolve) => window.setTimeout(resolve, 900));

      // TODO: Upload logoFiles and photoFiles to storage before creating the request record.
      // Keep these arrays available so the backend integration can preserve the current UX.
      console.log("Creative request payload", {
        ...formState,
        logoFiles,
        photoFiles,
      });

      setIsSubmitted(true);
      setFormState(initialFormState);
      setLogoFiles([]);
      setPhotoFiles([]);

      toast({
        title: "Request received",
        description: "Your free ad creative request has been captured.",
      });
    } catch (error) {
      console.error("Failed to submit creative request", error);
      toast({
        title: "Submission failed",
        description: "There was a problem sending the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={sectionRef} className="scroll-mt-24 space-y-6">
      <SectionHeading
        eyebrow="Free Request"
        title="Request your free custom ad graphics here"
        description="Tell us about your business, upload your brand assets, and share anything we should know about your preferred style. The form is structured so backend wiring can be added later without changing the page layout."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <Card className={`${surfaceClassName} overflow-hidden`}>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 dark:border-amber-500/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Simple request flow</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Submit the essentials and Autobidder can turn your brand details into custom ad graphics based on proven concepts.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  "Share your business information and service type",
                  "Upload your logo and business photos if you have them",
                  "Add any notes about your brand or preferred angle",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{item}</p>
                  </div>
                ))}
              </div>

              <Separator className="bg-slate-200/70 dark:bg-slate-800/80" />

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Primary goal", value: "Get more visitors into your instant pricing experience" },
                  { label: "Best use", value: "Facebook ads, Instagram posts, and branded promotion" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/60"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${surfaceClassName} overflow-hidden`}>
          <CardContent className="p-6">
            {isSubmitted ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-emerald-200 bg-emerald-50/80 px-6 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_18px_35px_-20px_rgba(16,185,129,0.9)]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3
                  className="mt-6 text-3xl text-slate-950 dark:text-white"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  Request received
                </h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">
                  We captured the request for your free custom ad graphics. This placeholder flow is ready for real backend wiring when you add the submission endpoint.
                </p>
                <Button
                  className={`mt-6 ${primaryButtonClassName}`}
                  onClick={() => setIsSubmitted(false)}
                >
                  Submit another request
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Business name
                    </Label>
                    <Input
                      id="businessName"
                      value={formState.businessName}
                      onChange={handleChange("businessName")}
                      placeholder="Example Exterior Cleaning Co."
                      required
                      className="h-12 rounded-xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Name
                    </Label>
                    <Input
                      id="contactName"
                      value={formState.contactName}
                      onChange={handleChange("contactName")}
                      placeholder="Your name"
                      required
                      className="h-12 rounded-xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-950/50"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange("email")}
                      placeholder="you@business.com"
                      required
                      className="h-12 rounded-xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Website URL
                    </Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={formState.websiteUrl}
                      onChange={handleChange("websiteUrl")}
                      placeholder="https://yourwebsite.com"
                      className="h-12 rounded-xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-950/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Industry / service type
                  </Label>
                  <Input
                    id="industry"
                    value={formState.industry}
                    onChange={handleChange("industry")}
                    placeholder="Pressure washing, roofing, landscaping, painting, etc."
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-950/50"
                  />
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <FileUploadField
                    id="logoUpload"
                    label="Upload logo"
                    helperText="SVG, PNG, or JPG. One file is enough for the placeholder flow."
                    files={logoFiles}
                    accept=".svg,.png,.jpg,.jpeg,.webp"
                    onFilesSelected={setLogoFiles}
                  />
                  <FileUploadField
                    id="photoUpload"
                    label="Upload business photos"
                    helperText="Add a few photos you want reflected in the creative direction."
                    files={photoFiles}
                    accept=".png,.jpg,.jpeg,.webp"
                    multiple
                    onFilesSelected={setPhotoFiles}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Notes / brand preferences
                  </Label>
                  <Textarea
                    id="notes"
                    value={formState.notes}
                    onChange={handleChange("notes")}
                    placeholder="Share any brand colors, ad angles, offers, or notes that would help customize the graphics."
                    className="min-h-[140px] rounded-xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-950/50"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-xs leading-6 text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-400">
                  TODO: Wire this form to the real creative request endpoint and upload handler. The current submit action is local-only so layout and UX can be reviewed first.
                </div>

                <Button type="submit" disabled={isSubmitting} className={`h-12 w-full ${primaryButtonClassName}`}>
                  {isSubmitting ? "Submitting request..." : "Send My Free Creative Request"}
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UpsellSection() {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="$49 Plan Upgrade"
        title="Want more content to promote your business?"
        description="Users on the $49 plan can get 20 additional unique posts in this same style. It is positioned as a larger creative pack for businesses that want more content variation for paid ads, social posting, and ongoing campaign rotation."
      />

      <Card className="overflow-hidden rounded-[28px] border border-amber-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_28px_70px_-34px_rgba(15,23,42,0.8)] dark:border-amber-500/20">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(234,88,12,0.18),transparent_30%)]" />
              <div className="relative space-y-6">
                <Badge className="border-amber-200/20 bg-white/10 text-amber-200">Premium Content Pack</Badge>
                <div className="space-y-3">
                  <h3
                    className="text-3xl sm:text-4xl"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                  >
                    Upgrade to the $49 plan to unlock 20 more unique branded posts
                  </h3>
                  <p className="max-w-2xl text-sm leading-7 text-slate-200/90 sm:text-base">
                    This is the next step for users who want more variation, more posting consistency, and a deeper library of concepts to support both paid traffic and organic visibility.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "20 more unique branded post concepts",
                    "More variation for social media",
                    "Better content rotation for paid ads and organic posting",
                  ].map((benefit) => (
                    <div key={benefit} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-100 backdrop-blur-sm">
                      {benefit}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className={primaryButtonClassName}>
                    <Link href={UPSELL_CTA_PATH}>
                      Upgrade to Get 20 More Posts
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="flex items-center text-sm text-slate-300">
                    TODO: Update this CTA if you want to send users to direct checkout instead of the upgrade page.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:border-l lg:border-t-0">
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                  Offer snapshot
                </p>
                <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-300">Plan price</p>
                      <div
                        className="text-5xl text-white"
                        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                      >
                        $49
                      </div>
                    </div>
                    <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">Most practical next step</Badge>
                  </div>
                  <Separator className="my-5 bg-white/10" />
                  <div className="space-y-3 text-sm text-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <span>Free custom creative set</span>
                      <span className="font-semibold text-white">Included</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>20 extra unique posts</span>
                      <span className="font-semibold text-white">Included</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Broader campaign rotation</span>
                      <span className="font-semibold text-white">Included</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Details"
        title="Common questions"
        description="A short FAQ keeps the page useful and gives users confidence about what they need to submit and how the upgrade offer differs from the free request."
      />

      <Card className={`${surfaceClassName} overflow-hidden`}>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`faq-${index}`}
                className="border-slate-200/70 dark:border-slate-800/80"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline dark:text-white">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}

export default function AdCreativeRequestPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-8 lg:space-y-10">
          <HeroSection
            onScrollToForm={() => scrollToSection(formRef)}
            onScrollToExamples={() => scrollToSection(examplesRef)}
          />
          <BenefitsSection />
          <ExampleGallerySection sectionRef={examplesRef} />
          <RequestFormSection sectionRef={formRef} />
          <UpsellSection />
          <FaqSection />
        </div>
      </div>
    </div>
  );
}
