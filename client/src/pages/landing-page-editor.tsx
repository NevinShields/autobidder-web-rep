import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import LandingPageView, { type LandingPagePublicData } from "@/components/landing-page-view";
import type { Formula, LandingPage } from "@shared/schema";
import { Copy, ExternalLink, LayoutTemplate, Loader2, Monitor, Save, Smartphone, Tablet, Wand2 } from "lucide-react";

type LandingTemplateKey =
  | "bubble-shark"
  | "noir-edge"
  | "fresh-deck"
  | "halo-glass"
  | "sunline-studio"
  | "volt-viking"
  | "atlas-pro"
  | "mono-grid"
  | "epoxy-strata"
  | "luxe-coat";

type LandingTheme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  buttonTextColor: string;
  heroImageUrl: string | null;
  heroOverlayColor: string;
  heroOverlayOpacity: number;
  showFaqSection: boolean;
  showBeforeAfterSection: boolean;
  showVoltageReliabilitySection: boolean;
  sunlineStudioContent: SunlineStudioContent;
  epoxyStrataContent: EpoxyStrataContent;
  voltVikingContent: VoltVikingContent;
};

type BeforeAfterGalleryItem = {
  label: string;
  caption: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  enabled: boolean;
};

type SunlineStudioContent = {
  heroSectionLabel: string;
  heroBody: string;
};

type SunlineStudioTextKey = keyof SunlineStudioContent;

type EpoxyStrataStat = {
  label: string;
  value: string;
};

type EpoxyStrataContent = {
  navSystemsLabel: string;
  navTransformationLabel: string;
  navProcessLabel: string;
  navQuoteLabel: string;
  navButtonLabel: string;
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleAccent: string;
  heroTitleLine2: string;
  heroSecondaryCtaLabel: string;
  heroScrollLabel: string;
  transformationTitleLine1: string;
  transformationTitleLine2: string;
  transformationBody: string;
  transformationBeforeLabel: string;
  transformationAfterLabel: string;
  transformationStats: EpoxyStrataStat[];
  systemsEyebrow: string;
  systemsHeading: string;
  galleryHeading: string;
  gallerySubheading: string;
  galleryCardEyebrow: string;
  beforeAfterEyebrow: string;
  beforeAfterHeading: string;
  processHeading: string;
  reviewsHeading: string;
  faqEyebrow: string;
  faqHeading: string;
  quoteTitleLine1: string;
  quoteTitleLine2: string;
  quoteBody: string;
  availabilityNote: string;
  footerTagline: string;
};

type EpoxyStrataTextKey = Exclude<keyof EpoxyStrataContent, "transformationStats">;

type VoltVikingFeature = {
  title: string;
  body: string;
};

type VoltVikingContent = {
  navServicesLabel: string;
  navAboutLabel: string;
  navReviewsLabel: string;
  navFaqLabel: string;
  navButtonLabel: string;
  mobileButtonLabel: string;
  heroTitleLine1: string;
  heroTitleAccent: string;
  heroTitleLine2: string;
  heroBody: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;
  aboutEyebrow: string;
  aboutHeadingLine1: string;
  aboutHeadingLine2: string;
  aboutBody: string;
  aboutButtonLabel: string;
  aboutChecklist: string[];
  servicesHeading: string;
  servicesSubheading: string;
  philosophyHeading: string;
  philosophySubheading: string;
  philosophyItems: VoltVikingFeature[];
  guaranteeTitleLine1: string;
  guaranteeAccent: string;
  guaranteeBody: string;
  guaranteeButtonLabel: string;
  guaranteeCardTitle: string;
  processHeading: string;
  processSubheading: string;
  faqHeading: string;
  faqSubheading: string;
  serviceAreaHeading: string;
  serviceAreaBody: string;
  serviceAreaButtonLabel: string;
  hqLabel: string;
  hqAddress: string;
  serviceAreaCities: string[];
  footerBody: string;
  footerNavHeading: string;
  footerNavLinks: string[];
  footerContactHeading: string;
  footerContactButtonLabel: string;
  footerCopyright: string;
  footerLegalLinks: string[];
};

type VoltVikingTextKey = Exclude<
  keyof VoltVikingContent,
  "aboutChecklist" | "philosophyItems" | "serviceAreaCities" | "footerNavLinks" | "footerLegalLinks"
>;

const MAX_LANDING_SERVICES = 10;
type PreviewViewport = "desktop" | "tablet" | "mobile";

const TEMPLATE_OPTIONS: Array<{ key: LandingTemplateKey; label: string; description: string }> = [
  { key: "bubble-shark",label: "Bubble Shark",description: "Playful animated style with bold sections." },
  { key: "noir-edge",   label: "Noir Edge",   description: "Dark luxury editorial with numbered services and neon accent." },
  { key: "fresh-deck",  label: "Fresh Deck",  description: "Warm bold maximalist with oversized type and card grid." },
  { key: "halo-glass",  label: "Halo Glass",  description: "Luminous glassmorphism with layered gradients and soft cards." },
  { key: "sunline-studio", label: "Sunline Studio", description: "Swiss-inspired editorial layout with warm paper tones, bold framing, and structured storytelling." },
  { key: "volt-viking", label: "Voltage", description: "High-energy electrician style with a bold hero, dark utility panels, and orange action accents." },
  { key: "atlas-pro",   label: "Atlas Pro",   description: "Corporate premium with stat highlights and crisp hierarchy." },
  { key: "mono-grid",   label: "Mono Grid",   description: "Minimal monochrome editorial with clean blocks and strong type." },
  { key: "epoxy-strata",label: "Epoxy Strata",description: "Industrial epoxy/coatings style with bold proof bars and system cards." },
  { key: "luxe-coat",   label: "Luxe Coat",   description: "Cinematic luxury epoxy layout with transformation slider and gallery." },
];

const VISIBLE_TEMPLATE_OPTIONS = TEMPLATE_OPTIONS.filter((template) => template.key !== "luxe-coat");

const PREVIEW_VIEWPORT_OPTIONS: Array<{ key: PreviewViewport; label: string; maxWidthClass: string }> = [
  { key: "desktop", label: "Desktop", maxWidthClass: "max-w-[1280px]" },
  { key: "tablet", label: "Tablet", maxWidthClass: "max-w-[820px]" },
  { key: "mobile", label: "Mobile", maxWidthClass: "max-w-[420px]" },
];

const DEFAULT_SUNLINE_STUDIO_CONTENT: SunlineStudioContent = {
  heroSectionLabel: "Editorial Landing Page",
  heroBody: "A crisp, design-forward service page that balances trust, speed, and instant quote access without looking like a generic contractor template.",
};

const DEFAULT_EPOXY_STRATA_CONTENT: EpoxyStrataContent = {
  navSystemsLabel: "Systems",
  navTransformationLabel: "Transformation",
  navProcessLabel: "Process",
  navQuoteLabel: "Quote",
  navButtonLabel: "Consultation",
  heroEyebrow: "Architectural Grade Surfaces",
  heroTitleLine1: "Luxury",
  heroTitleAccent: "Engineered",
  heroTitleLine2: "Perfection",
  heroSecondaryCtaLabel: "Explore Gallery",
  heroScrollLabel: "Scroll",
  transformationTitleLine1: "From Cracked",
  transformationTitleLine2: "To Showroom",
  transformationBody: "We combine heavy-duty surface prep with premium resin systems to produce floors that read as design pieces but perform like commercial infrastructure.",
  transformationBeforeLabel: "Before",
  transformationAfterLabel: "After",
  transformationStats: [
    { label: "Durability", value: "20+ Years" },
    { label: "Install Time", value: "24-48 Hrs" },
    { label: "Resistance", value: "Industrial" },
  ],
  systemsEyebrow: "Our Expertise",
  systemsHeading: "Premium Systems",
  galleryHeading: "Recent Projects",
  gallerySubheading: "Curated selections of our finest installations.",
  galleryCardEyebrow: "Recent Installation",
  beforeAfterEyebrow: "Before & After",
  beforeAfterHeading: "Transformation Pairs",
  processHeading: "The Process",
  reviewsHeading: "Client Authority",
  faqEyebrow: "FAQ",
  faqHeading: "Common Questions",
  quoteTitleLine1: "Your Concrete",
  quoteTitleLine2: "Reimagined.",
  quoteBody: "Schedule your free on-site design consultation and estimate today.",
  availabilityNote: "Limited install spots available this month",
  footerTagline: "Premium Epoxy Systems",
};

const DEFAULT_VOLT_VIKING_CONTENT: VoltVikingContent = {
  navServicesLabel: "Services",
  navAboutLabel: "About",
  navReviewsLabel: "Reviews",
  navFaqLabel: "FAQ",
  navButtonLabel: "Call Now",
  mobileButtonLabel: "(555) VOLT-VKNG",
  heroTitleLine1: "Legendary",
  heroTitleAccent: "Electrical",
  heroTitleLine2: "Services",
  heroBody: "Powering your home with the strength and precision of the North. Trusted by thousands for safety, speed, and integrity.",
  heroPrimaryCtaLabel: "Book Service Now",
  heroSecondaryCtaLabel: "See Our Work",
  aboutEyebrow: "Our Mission",
  aboutHeadingLine1: "When You Need",
  aboutHeadingLine2: "Trusted Electricians",
  aboutBody: "We aren't just another electrical company. We are a brotherhood of craftsmen dedicated to securing your home's power. Our team brings decades of combined experience to every job, ensuring that your lighting, panels, and circuits are nothing short of legendary.",
  aboutButtonLabel: "Learn More About Us",
  aboutChecklist: [
    "Licensed & Insured Professionals",
    "Transparent Up-Front Pricing",
    "Same-Day Service Availability",
    "100% Satisfaction Guaranteed",
  ],
  servicesHeading: "We're Glad You're Here.",
  servicesSubheading: "How can we help?",
  philosophyHeading: "We Don't Just Fix.",
  philosophySubheading: "We Build Long-Term Reliability For Your Fortress.",
  philosophyItems: [
    { title: "Safety First", body: "Every connection is tested and verified to exceed modern safety standards." },
    { title: "Rapid Response", body: "We value your time. We show up when we say we will, or the first hour is on us." },
    { title: "Elite Craft", body: "Master-level electrical work performed by certified industry leaders." },
    { title: "Tough as Nails", body: "We use only industrial-grade parts that stand the test of time." },
  ],
  guaranteeTitleLine1: "100% Satisfaction",
  guaranteeAccent: "Guarantee",
  guaranteeBody: "If you aren't thrilled with our service, we'll keep working until you are. No excuses. No extra charges. Just legendary service.",
  guaranteeButtonLabel: "Book Your Service",
  guaranteeCardTitle: "SERVICE VAN",
  processHeading: "Our Simple 3 Step Process",
  processSubheading: "",
  faqHeading: "Common Questions",
  faqSubheading: "Knowledge is Power",
  serviceAreaHeading: "Serving Our Community",
  serviceAreaBody: "We serve the entire tri-state area. Wherever you are, our fleet of rapid-response vans is never more than a short drive away.",
  serviceAreaButtonLabel: "See Full Service Area",
  hqLabel: "Main Headquarters",
  hqAddress: "123 Service Way, Electric City, EC 90210",
  serviceAreaCities: [
    "North Ridge",
    "South Shield",
    "Electric Bay",
    "Forge Town",
    "Copper Creek",
    "Voltage Village",
    "Ampere Isle",
    "Ohm Valley",
  ],
  footerBody: "Providing legendary electrical services with a commitment to integrity, safety, and master craftsmanship. Your home is your fortress, and we are here to protect its power.",
  footerNavHeading: "Navigation",
  footerNavLinks: [
    "Residential Services",
    "Commercial Electrical",
    "Emergency Response",
    "About Our Team",
    "Client Reviews",
  ],
  footerContactHeading: "Contact",
  footerContactButtonLabel: "Contact Us",
  footerCopyright: "© 2024 Your Electrical Company. All rights reserved.",
  footerLegalLinks: ["Privacy Policy", "Terms of Service", "Accessibility"],
};

const DEFAULT_THEME: LandingTheme = {
  primaryColor: "#2563EB",
  accentColor: "#10B981",
  backgroundColor: "#F8FAFC",
  surfaceColor: "#FFFFFF",
  textColor: "#0F172A",
  mutedTextColor: "#475569",
  buttonTextColor: "#FFFFFF",
  heroImageUrl: null,
  heroOverlayColor: "#0F172A",
  heroOverlayOpacity: 45,
  showFaqSection: true,
  showBeforeAfterSection: true,
  showVoltageReliabilitySection: true,
  sunlineStudioContent: DEFAULT_SUNLINE_STUDIO_CONTENT,
  epoxyStrataContent: DEFAULT_EPOXY_STRATA_CONTENT,
  voltVikingContent: DEFAULT_VOLT_VIKING_CONTENT,
};

const LANDING_THEME_COLOR_KEYS: Array<keyof Pick<LandingTheme, "primaryColor" | "accentColor" | "backgroundColor" | "surfaceColor" | "textColor" | "mutedTextColor" | "buttonTextColor" | "heroOverlayColor">> = [
  "primaryColor",
  "accentColor",
  "backgroundColor",
  "surfaceColor",
  "textColor",
  "mutedTextColor",
  "buttonTextColor",
  "heroOverlayColor",
];

const EDITOR_CARD_CLASS =
  "overflow-hidden border border-white/70 bg-white/88 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/88 dark:shadow-none";
const EDITOR_CARD_HEADER_CLASS = "border-b border-slate-200/70 bg-gradient-to-r from-white via-amber-50/40 to-orange-50/40 pb-4 dark:border-slate-700/80 dark:bg-[linear-gradient(90deg,rgba(15,23,42,0.96),rgba(51,65,85,0.88),rgba(120,53,15,0.18))]";
const EDITOR_SECTION_LABEL_CLASS = "text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/70 dark:text-amber-300/70";
const EDITOR_SUBCARD_CLASS = "rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-950/45";
const EDITOR_SUBCARD_MUTED_CLASS = "rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700/80 dark:bg-slate-900/50";
const EDITOR_TOGGLE_STRIP_CLASS = "flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-950/45";

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#([0-9a-fA-F]{6})$/.test(value.trim());
}

function isLandingMediaUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) {
    return false;
  }
  return /^\/(objects|uploads)\//.test(trimmed) || /^https?:\/\//i.test(trimmed);
}

function sanitizeSlugInput(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return cleaned;
}

function sanitizeLandingTheme(input: unknown): LandingTheme {
  const next: LandingTheme = { ...DEFAULT_THEME };
  if (!input || typeof input !== "object") {
    return next;
  }

  for (const key of LANDING_THEME_COLOR_KEYS) {
    const candidate = (input as Record<string, unknown>)[key];
    if (isHexColor(candidate)) {
      next[key] = candidate.trim();
    }
  }

  if (isLandingMediaUrl((input as Record<string, unknown>).heroImageUrl)) {
    next.heroImageUrl = ((input as Record<string, unknown>).heroImageUrl as string).trim();
  } else if ((input as Record<string, unknown>).heroImageUrl === null) {
    next.heroImageUrl = null;
  }

  const rawOpacity = Number((input as Record<string, unknown>).heroOverlayOpacity);
  if (Number.isFinite(rawOpacity)) {
    next.heroOverlayOpacity = Math.min(100, Math.max(0, Math.round(rawOpacity)));
  }

  if (typeof (input as Record<string, unknown>).showFaqSection === "boolean") {
    next.showFaqSection = (input as Record<string, unknown>).showFaqSection as boolean;
  }

  if (typeof (input as Record<string, unknown>).showBeforeAfterSection === "boolean") {
    next.showBeforeAfterSection = (input as Record<string, unknown>).showBeforeAfterSection as boolean;
  }

  if (typeof (input as Record<string, unknown>).showVoltageReliabilitySection === "boolean") {
    next.showVoltageReliabilitySection = (input as Record<string, unknown>).showVoltageReliabilitySection as boolean;
  }

  const sunlineSource =
    (input as Record<string, unknown>).sunlineStudioContent &&
    typeof (input as Record<string, unknown>).sunlineStudioContent === "object"
      ? ((input as Record<string, unknown>).sunlineStudioContent as Record<string, unknown>)
      : {};
  const readSunlineText = (key: SunlineStudioTextKey, max: number) =>
    typeof sunlineSource[key] === "string"
      ? (sunlineSource[key] as string).slice(0, max)
      : DEFAULT_SUNLINE_STUDIO_CONTENT[key];
  next.sunlineStudioContent = {
    heroSectionLabel: readSunlineText("heroSectionLabel", 80),
    heroBody: readSunlineText("heroBody", 320),
  };

  const epoxySource =
    (input as Record<string, unknown>).epoxyStrataContent &&
    typeof (input as Record<string, unknown>).epoxyStrataContent === "object"
      ? ((input as Record<string, unknown>).epoxyStrataContent as Record<string, unknown>)
      : {};
  const readEpoxyText = (key: EpoxyStrataTextKey, max: number) =>
    typeof epoxySource[key] === "string"
      ? (epoxySource[key] as string).slice(0, max)
      : DEFAULT_EPOXY_STRATA_CONTENT[key];
  const rawStats = Array.isArray(epoxySource.transformationStats) ? epoxySource.transformationStats : [];
  next.epoxyStrataContent = {
    navSystemsLabel: readEpoxyText("navSystemsLabel", 60),
    navTransformationLabel: readEpoxyText("navTransformationLabel", 60),
    navProcessLabel: readEpoxyText("navProcessLabel", 60),
    navQuoteLabel: readEpoxyText("navQuoteLabel", 60),
    navButtonLabel: readEpoxyText("navButtonLabel", 60),
    heroEyebrow: readEpoxyText("heroEyebrow", 120),
    heroTitleLine1: readEpoxyText("heroTitleLine1", 80),
    heroTitleAccent: readEpoxyText("heroTitleAccent", 80),
    heroTitleLine2: readEpoxyText("heroTitleLine2", 80),
    heroSecondaryCtaLabel: readEpoxyText("heroSecondaryCtaLabel", 60),
    heroScrollLabel: readEpoxyText("heroScrollLabel", 30),
    transformationTitleLine1: readEpoxyText("transformationTitleLine1", 80),
    transformationTitleLine2: readEpoxyText("transformationTitleLine2", 80),
    transformationBody: readEpoxyText("transformationBody", 320),
    transformationBeforeLabel: readEpoxyText("transformationBeforeLabel", 30),
    transformationAfterLabel: readEpoxyText("transformationAfterLabel", 30),
    transformationStats: Array.from({ length: 3 }, (_, index) => {
      const item = rawStats[index];
      return {
        label:
          item && typeof item === "object" && typeof (item as Record<string, unknown>).label === "string"
            ? ((item as Record<string, unknown>).label as string).slice(0, 40)
            : DEFAULT_EPOXY_STRATA_CONTENT.transformationStats[index].label,
        value:
          item && typeof item === "object" && typeof (item as Record<string, unknown>).value === "string"
            ? ((item as Record<string, unknown>).value as string).slice(0, 40)
            : DEFAULT_EPOXY_STRATA_CONTENT.transformationStats[index].value,
      };
    }),
    systemsEyebrow: readEpoxyText("systemsEyebrow", 120),
    systemsHeading: readEpoxyText("systemsHeading", 120),
    galleryHeading: readEpoxyText("galleryHeading", 120),
    gallerySubheading: readEpoxyText("gallerySubheading", 200),
    galleryCardEyebrow: readEpoxyText("galleryCardEyebrow", 60),
    beforeAfterEyebrow: readEpoxyText("beforeAfterEyebrow", 120),
    beforeAfterHeading: readEpoxyText("beforeAfterHeading", 120),
    processHeading: readEpoxyText("processHeading", 120),
    reviewsHeading: readEpoxyText("reviewsHeading", 120),
    faqEyebrow: readEpoxyText("faqEyebrow", 60),
    faqHeading: readEpoxyText("faqHeading", 120),
    quoteTitleLine1: readEpoxyText("quoteTitleLine1", 80),
    quoteTitleLine2: readEpoxyText("quoteTitleLine2", 80),
    quoteBody: readEpoxyText("quoteBody", 240),
    availabilityNote: readEpoxyText("availabilityNote", 120),
    footerTagline: readEpoxyText("footerTagline", 120),
  };

  const voltSource =
    (input as Record<string, unknown>).voltVikingContent &&
    typeof (input as Record<string, unknown>).voltVikingContent === "object"
      ? ((input as Record<string, unknown>).voltVikingContent as Record<string, unknown>)
      : {};
  const normalizeLegacyVoltVikingText = (value: string) => {
    switch (value) {
      case "Get A Viking Now":
        return "Book Service Now";
      case "When In Need, Call Your":
        return "When You Need";
      case "Local Viking Electricians!":
        return "Trusted Electricians";
      case "VOLT VIKING VAN":
        return "SERVICE VAN";
      case "The Volt Vikings serve the entire tri-state area. Wherever you are, our fleet of rapid-response vans is never more than a short sail away.":
        return "We serve the entire tri-state area. Wherever you are, our fleet of rapid-response vans is never more than a short drive away.";
      case "123 Viking Forge Way, Electric City, VK 90210":
        return "123 Service Way, Electric City, EC 90210";
      case "North Viking":
        return "North Ridge";
      case "About the Vikings":
        return "About Our Team";
      case "© 2024 Volt Vikings Electrical. All rights reserved.":
        return "© 2024 Your Electrical Company. All rights reserved.";
      default:
        return value;
    }
  };
  const readVoltText = (key: VoltVikingTextKey, max: number) =>
    typeof voltSource[key] === "string"
      ? normalizeLegacyVoltVikingText(voltSource[key] as string).slice(0, max)
      : DEFAULT_VOLT_VIKING_CONTENT[key];
  const sanitizeStringList = (value: unknown, defaults: string[], maxItems: number, maxLength: number) =>
    Array.from({ length: maxItems }, (_, index) =>
      Array.isArray(value) && typeof value[index] === "string"
        ? normalizeLegacyVoltVikingText(value[index] as string).slice(0, maxLength)
        : defaults[index]
    );
  const rawPhilosophy = Array.isArray(voltSource.philosophyItems) ? voltSource.philosophyItems : [];
  next.voltVikingContent = {
    navServicesLabel: readVoltText("navServicesLabel", 60),
    navAboutLabel: readVoltText("navAboutLabel", 60),
    navReviewsLabel: readVoltText("navReviewsLabel", 60),
    navFaqLabel: readVoltText("navFaqLabel", 60),
    navButtonLabel: readVoltText("navButtonLabel", 60),
    mobileButtonLabel: readVoltText("mobileButtonLabel", 60),
    heroTitleLine1: readVoltText("heroTitleLine1", 80),
    heroTitleAccent: readVoltText("heroTitleAccent", 80),
    heroTitleLine2: readVoltText("heroTitleLine2", 80),
    heroBody: readVoltText("heroBody", 320),
    heroPrimaryCtaLabel: readVoltText("heroPrimaryCtaLabel", 60),
    heroSecondaryCtaLabel: readVoltText("heroSecondaryCtaLabel", 60),
    aboutEyebrow: readVoltText("aboutEyebrow", 80),
    aboutHeadingLine1: readVoltText("aboutHeadingLine1", 120),
    aboutHeadingLine2: readVoltText("aboutHeadingLine2", 120),
    aboutBody: readVoltText("aboutBody", 500),
    aboutButtonLabel: readVoltText("aboutButtonLabel", 80),
    aboutChecklist: sanitizeStringList(voltSource.aboutChecklist, DEFAULT_VOLT_VIKING_CONTENT.aboutChecklist, 4, 80),
    servicesHeading: readVoltText("servicesHeading", 120),
    servicesSubheading: readVoltText("servicesSubheading", 120),
    philosophyHeading: readVoltText("philosophyHeading", 120),
    philosophySubheading: readVoltText("philosophySubheading", 200),
    philosophyItems: Array.from({ length: 4 }, (_, index) => {
      const item = rawPhilosophy[index];
      return {
        title:
          item && typeof item === "object" && typeof (item as Record<string, unknown>).title === "string"
            ? ((item as Record<string, unknown>).title as string).slice(0, 80)
            : DEFAULT_VOLT_VIKING_CONTENT.philosophyItems[index].title,
        body:
          item && typeof item === "object" && typeof (item as Record<string, unknown>).body === "string"
            ? ((item as Record<string, unknown>).body as string).slice(0, 220)
            : DEFAULT_VOLT_VIKING_CONTENT.philosophyItems[index].body,
      };
    }),
    guaranteeTitleLine1: readVoltText("guaranteeTitleLine1", 120),
    guaranteeAccent: readVoltText("guaranteeAccent", 120),
    guaranteeBody: readVoltText("guaranteeBody", 320),
    guaranteeButtonLabel: readVoltText("guaranteeButtonLabel", 80),
    guaranteeCardTitle: readVoltText("guaranteeCardTitle", 80),
    processHeading: readVoltText("processHeading", 120),
    processSubheading: readVoltText("processSubheading", 200),
    faqHeading: readVoltText("faqHeading", 120),
    faqSubheading: readVoltText("faqSubheading", 120),
    serviceAreaHeading: readVoltText("serviceAreaHeading", 120),
    serviceAreaBody: readVoltText("serviceAreaBody", 320),
    serviceAreaButtonLabel: readVoltText("serviceAreaButtonLabel", 80),
    hqLabel: readVoltText("hqLabel", 80),
    hqAddress: readVoltText("hqAddress", 140),
    serviceAreaCities: sanitizeStringList(voltSource.serviceAreaCities, DEFAULT_VOLT_VIKING_CONTENT.serviceAreaCities, 8, 50),
    footerBody: readVoltText("footerBody", 420),
    footerNavHeading: readVoltText("footerNavHeading", 80),
    footerNavLinks: sanitizeStringList(voltSource.footerNavLinks, DEFAULT_VOLT_VIKING_CONTENT.footerNavLinks, 5, 80),
    footerContactHeading: readVoltText("footerContactHeading", 80),
    footerContactButtonLabel: readVoltText("footerContactButtonLabel", 80),
    footerCopyright: readVoltText("footerCopyright", 160),
    footerLegalLinks: sanitizeStringList(voltSource.footerLegalLinks, DEFAULT_VOLT_VIKING_CONTENT.footerLegalLinks, 3, 80),
  };

  return next;
}

function normalizeBeforeAfterGallery(input: unknown): BeforeAfterGalleryItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => ({
      label: typeof (item as any)?.label === "string" ? (item as any).label.trim().slice(0, 80) : "",
      caption: typeof (item as any)?.caption === "string" ? (item as any).caption.trim().slice(0, 240) : "",
      beforeImageUrl: isLandingMediaUrl((item as any)?.beforeImageUrl) ? (item as any).beforeImageUrl.trim() : null,
      afterImageUrl: isLandingMediaUrl((item as any)?.afterImageUrl) ? (item as any).afterImageUrl.trim() : null,
      enabled: Boolean((item as any)?.enabled),
    }))
    .slice(0, 3);
}

function normalizeLandingServiceIcon(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) {
    return null;
  }

  if (trimmed.length <= 4) {
    return trimmed;
  }

  return isLandingMediaUrl(trimmed) ? trimmed : null;
}

function normalizeServices(services: unknown): Array<{ serviceId: number; name: string; description?: string | null; enabled: boolean; sortOrder: number; iconUrl?: string | null; imageUrl?: string | null }> {
  if (!Array.isArray(services)) {
    return [];
  }

  const normalized = services
    .map((service, idx) => ({
      serviceId: Number((service as any)?.serviceId),
      name: typeof (service as any)?.name === "string" && (service as any).name.trim() ? (service as any).name.trim() : "Service",
      description: typeof (service as any)?.description === "string" && (service as any).description.trim() ? (service as any).description.trim().slice(0, 240) : null,
      enabled: Boolean((service as any)?.enabled),
      sortOrder: Number.isFinite(Number((service as any)?.sortOrder)) ? Number((service as any).sortOrder) : idx,
      iconUrl: normalizeLandingServiceIcon((service as any)?.iconUrl),
      imageUrl: isLandingMediaUrl((service as any)?.imageUrl) ? (service as any).imageUrl.trim() : null,
    }))
    .filter((service) => Number.isInteger(service.serviceId) && service.serviceId > 0)
    .filter((service, idx, arr) => arr.findIndex((candidate) => candidate.serviceId === service.serviceId) === idx)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, MAX_LANDING_SERVICES)
    .map((service, idx) => ({ ...service, sortOrder: idx }));

  return normalized;
}

function applyLandingDefaults(page: LandingPage): LandingPage {
  const templateKey: LandingTemplateKey =
    page.templateKey === "bubble-shark" ||
    page.templateKey === "noir-edge" ||
    page.templateKey === "fresh-deck" ||
    page.templateKey === "halo-glass" ||
    page.templateKey === "sunline-studio" ||
    page.templateKey === "volt-viking" ||
    page.templateKey === "atlas-pro" ||
    page.templateKey === "mono-grid" ||
    page.templateKey === "epoxy-strata" ||
    page.templateKey === "luxe-coat"
      ? page.templateKey
      : "atlas-pro";

  return {
    ...page,
    templateKey,
    theme: sanitizeLandingTheme(page.theme),
    services: normalizeServices(page.services),
    beforeAfterGallery: normalizeBeforeAfterGallery((page as any).beforeAfterGallery) as any,
  } as LandingPage;
}

export default function LandingPageEditorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<LandingPage | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [uploadingServiceId, setUploadingServiceId] = useState<number | null>(null);
  const [uploadingBeforeAfterKey, setUploadingBeforeAfterKey] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("mobile");
  const draftVersionRef = useRef(0);

  const { data: pageData, isLoading, isError, error, refetch } = useQuery<LandingPage>({
    queryKey: ["/api/landing-page/me"],
  });

  const { data: formulas = [] } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  const activeFormulas = useMemo(
    () => formulas.filter((formula) => formula.isActive !== false && formula.isDisplayed !== false),
    [formulas],
  );
  const fallbackPrimaryFormula = activeFormulas[0] || null;

  useEffect(() => {
    if (pageData && !dirty) {
      setDraft(applyLandingDefaults(pageData));
    }
  }, [pageData, dirty]);

  useEffect(() => {
    if (!draft || dirty || formulas.length === 0) return;

    const normalizedServices = normalizeServices(draft.services);
    const hasPrimaryService = Boolean(draft.primaryServiceId);
    const hasConfiguredServices = normalizedServices.length > 0;

    if (hasPrimaryService && hasConfiguredServices) {
      return;
    }

    const seededServices = hasConfiguredServices
      ? normalizedServices
      : activeFormulas.slice(0, MAX_LANDING_SERVICES).map((formula, index) => ({
          serviceId: formula.id,
          name: formula.name || formula.title || "Service",
          enabled: true,
          sortOrder: index,
          iconUrl: normalizeLandingServiceIcon(formula.iconUrl),
          imageUrl: null,
        }));

    const nextPrimaryServiceId = draft.primaryServiceId || seededServices[0]?.serviceId || null;

    if (!nextPrimaryServiceId && seededServices.length === 0) {
      return;
    }

    setDraft((prev) => {
      if (!prev) return prev;
      return applyLandingDefaults({
        ...prev,
        services: seededServices as any,
        primaryServiceId: nextPrimaryServiceId as any,
      } as LandingPage);
    });
  }, [draft, dirty, formulas, activeFormulas]);

  useEffect(() => {
    if (!draft || dirty || formulas.length === 0) return;

    const formulaIconById = new Map(
      formulas.map((formula) => [formula.id, normalizeLandingServiceIcon(formula.iconUrl)]),
    );
    const normalizedServices = normalizeServices(draft.services);
    const syncedServices = normalizedServices.map((service) => ({
      ...service,
      iconUrl: formulaIconById.get(service.serviceId) ?? service.iconUrl ?? null,
    }));

    const hasChanges = syncedServices.some((service, index) => service.iconUrl !== normalizedServices[index]?.iconUrl);
    if (!hasChanges) {
      return;
    }

    setDraft((prev) => {
      if (!prev) return prev;
      return applyLandingDefaults({
        ...prev,
        services: syncedServices as any,
      } as LandingPage);
    });
  }, [draft, dirty, formulas]);

  const saveMutation = useMutation({
    mutationFn: async (params: { payload: Partial<LandingPage>; version: number }) => {
      const response = await apiRequest("PATCH", "/api/landing-page/me", params.payload);
      return response.json();
    },
    onSuccess: (data: LandingPage, params: { payload: Partial<LandingPage>; version: number }) => {
      // Ignore stale autosave responses so newer local edits don't get reverted.
      if (params.version !== draftVersionRef.current) {
        return;
      }
      setDraft(applyLandingDefaults(data));
      setDirty(false);
      setSaving(false);
      queryClient.setQueryData(["/api/landing-page/me"], data);
    },
    onError: (err: any, params: { payload: Partial<LandingPage>; version: number }) => {
      if (params.version !== draftVersionRef.current) {
        return;
      }
      setSaving(false);
      toast({
        title: "Save failed",
        description: err.message || "Unable to save landing page",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/landing-page/me/publish", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/landing-page/me"] });
      toast({ title: "Landing page published" });
    },
    onError: (err: any) => {
      toast({
        title: "Publish failed",
        description: err.message || "Unable to publish",
        variant: "destructive",
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/landing-page/me/unpublish", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/landing-page/me"] });
      toast({ title: "Landing page unpublished" });
    },
    onError: (err: any) => {
      toast({
        title: "Unpublish failed",
        description: err.message || "Unable to unpublish",
        variant: "destructive",
      });
    },
  });

  const generateFaqsMutation = useMutation({
    mutationFn: async () => {
      if (!draft) {
        throw new Error("Landing page not ready");
      }
      const response = await apiRequest("POST", "/api/landing-page/me/generate-faqs", buildPayload(draft));
      return response.json() as Promise<{ faqs: Array<{ question: string; answer: string }>; theme?: Partial<LandingTheme> }>;
    },
    onSuccess: (data) => {
      updateDraft({
        faqs: (data.faqs || []) as any,
        theme: {
          ...currentTheme,
          ...(data.theme || {}),
          showFaqSection: true,
        } as any,
      });
      toast({
        title: "FAQs generated",
        description: "AI drafted FAQ content for this landing page.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "FAQ generation failed",
        description: err?.message || "Unable to generate FAQs right now.",
        variant: "destructive",
      });
    },
  });

  const saveMutateRef = useRef(saveMutation.mutate);
  saveMutateRef.current = saveMutation.mutate;

  useEffect(() => {
    if (!dirty || !draft) return;
    setSaving(true);
    const version = draftVersionRef.current;
    const timer = setTimeout(() => {
      saveMutateRef.current({ payload: buildPayload(draft), version });
    }, 800);
    return () => clearTimeout(timer);
  }, [dirty, draft]);

  const updateDraft = (patch: Partial<LandingPage>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch } as LandingPage;

      if ("templateKey" in patch) {
        next.templateKey =
          patch.templateKey === "bubble-shark" ||
          patch.templateKey === "noir-edge" ||
          patch.templateKey === "fresh-deck" ||
          patch.templateKey === "halo-glass" ||
          patch.templateKey === "sunline-studio" ||
          patch.templateKey === "volt-viking" ||
          patch.templateKey === "atlas-pro" ||
          patch.templateKey === "mono-grid"
          || patch.templateKey === "epoxy-strata"
          || patch.templateKey === "luxe-coat"
            ? patch.templateKey
            : "atlas-pro";
      }

      if ("theme" in patch) {
        next.theme = sanitizeLandingTheme(patch.theme);
      }

      if ("services" in patch) {
        next.services = normalizeServices(patch.services);
      }

      return next;
    });
    draftVersionRef.current += 1;
    setDirty(true);
  };

  const updateThemeColor = (key: keyof LandingTheme, value: string) => {
    if (!draft) return;
    const currentTheme = sanitizeLandingTheme(draft.theme);
    if (!isHexColor(value)) return;
    updateDraft({ theme: { ...currentTheme, [key]: value } as any });
  };

  const updateThemeSettings = (patch: Partial<LandingTheme>) => {
    if (!draft) return;
    const currentTheme = sanitizeLandingTheme(draft.theme);
    updateDraft({ theme: { ...currentTheme, ...patch } as any });
  };

  const updateSunlineStudioContent = (patch: Partial<SunlineStudioContent>) => {
    if (!draft) return;
    const currentTheme = sanitizeLandingTheme(draft.theme);
    updateDraft({
      theme: {
        ...currentTheme,
        sunlineStudioContent: {
          ...currentTheme.sunlineStudioContent,
          ...patch,
        },
      } as any,
    });
  };

  const updateEpoxyStrataContent = (patch: Partial<EpoxyStrataContent>) => {
    if (!draft) return;
    const currentTheme = sanitizeLandingTheme(draft.theme);
    updateDraft({
      theme: {
        ...currentTheme,
        epoxyStrataContent: {
          ...currentTheme.epoxyStrataContent,
          ...patch,
        },
      } as any,
    });
  };

  const updateEpoxyStrataStat = (index: number, patch: Partial<EpoxyStrataStat>) => {
    if (!draft) return;
    const currentTheme = sanitizeLandingTheme(draft.theme);
    const nextStats = Array.from({ length: 3 }, (_, statIndex) => {
      const currentStat =
        currentTheme.epoxyStrataContent.transformationStats[statIndex] ||
        DEFAULT_EPOXY_STRATA_CONTENT.transformationStats[statIndex];
      return statIndex === index ? { ...currentStat, ...patch } : currentStat;
    });
    updateEpoxyStrataContent({ transformationStats: nextStats });
  };

  const updateVoltVikingContent = (patch: Partial<VoltVikingContent>) => {
    if (!draft) return;
    const currentTheme = sanitizeLandingTheme(draft.theme);
    updateDraft({
      theme: {
        ...currentTheme,
        voltVikingContent: {
          ...currentTheme.voltVikingContent,
          ...patch,
        },
      } as any,
    });
  };

  const updateVoltVikingFeature = (index: number, patch: Partial<VoltVikingFeature>) => {
    if (!draft) return;
    const currentTheme = sanitizeLandingTheme(draft.theme);
    const nextItems = Array.from({ length: 4 }, (_, itemIndex) => {
      const currentItem =
        currentTheme.voltVikingContent.philosophyItems[itemIndex] ||
        DEFAULT_VOLT_VIKING_CONTENT.philosophyItems[itemIndex];
      return itemIndex === index ? { ...currentItem, ...patch } : currentItem;
    });
    updateVoltVikingContent({ philosophyItems: nextItems });
  };

  const updateVoltVikingList = (
    key: "aboutChecklist" | "serviceAreaCities" | "footerNavLinks" | "footerLegalLinks",
    value: string,
  ) => {
    const lines = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const limits: Record<typeof key, number> = {
      aboutChecklist: 4,
      serviceAreaCities: 8,
      footerNavLinks: 5,
      footerLegalLinks: 3,
    };
    const defaults = DEFAULT_VOLT_VIKING_CONTENT[key];
    const nextValues = Array.from({ length: limits[key] }, (_, index) => lines[index] || defaults[index]);
    updateVoltVikingContent({ [key]: nextValues } as Partial<VoltVikingContent>);
  };

  const uploadLandingImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/landing-page/upload-image", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      let message = "Failed to upload image";
      try {
        const data = await response.json();
        if (typeof data?.message === "string" && data.message.trim()) {
          message = data.message;
        }
      } catch {
        // keep default
      }
      throw new Error(message);
    }

    const payload = await response.json();
    if (!isLandingMediaUrl(payload?.imageUrl)) {
      throw new Error("Upload returned an invalid image URL");
    }

    return payload.imageUrl.trim();
  };

  const handleLogoFileSelected = async (file?: File | null) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const imageUrl = await uploadLandingImage(file);
      updateDraft({ logoUrl: imageUrl });
      toast({ title: "Logo uploaded" });
    } catch (error: any) {
      toast({
        title: "Logo upload failed",
        description: error?.message || "Unable to upload logo.",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleServiceImageSelected = async (serviceId: number, file?: File | null) => {
    if (!file || !draft) return;
    setUploadingServiceId(serviceId);
    try {
      const imageUrl = await uploadLandingImage(file);
      const services = normalizeServices(draft.services).map((service) =>
        service.serviceId === serviceId ? { ...service, imageUrl } : service,
      );
      updateDraft({ services: services as any });
      toast({ title: "Service image uploaded" });
    } catch (error: any) {
      toast({
        title: "Service image upload failed",
        description: error?.message || "Unable to upload service image.",
        variant: "destructive",
      });
    } finally {
      setUploadingServiceId(null);
    }
  };

  const handleHeroImageSelected = async (file?: File | null) => {
    if (!file) return;
    setHeroUploading(true);
    try {
      const imageUrl = await uploadLandingImage(file);
      updateThemeSettings({ heroImageUrl: imageUrl });
      toast({ title: "Hero image uploaded" });
    } catch (error: any) {
      toast({
        title: "Hero image upload failed",
        description: error?.message || "Unable to upload hero image.",
        variant: "destructive",
      });
    } finally {
      setHeroUploading(false);
    }
  };

  const syncServicesFromFormulas = () => {
    if (!draft) return;
    const existingById = new Map(
      normalizeServices(draft.services).map((service) => [service.serviceId, service]),
    );
    const services = formulas.slice(0, MAX_LANDING_SERVICES).map((f, idx) => ({
      serviceId: f.id,
      name: f.name || f.title || "Service",
      enabled: true,
      sortOrder: idx,
      iconUrl: normalizeLandingServiceIcon(f.iconUrl),
      imageUrl: existingById.get(f.id)?.imageUrl || null,
    }));
    updateDraft({ services: services as any });

    if (formulas.length > MAX_LANDING_SERVICES) {
      toast({
        title: "Service limit applied",
        description: `Only the first ${MAX_LANDING_SERVICES} calculators were synced to the landing page.`,
      });
    }
  };

  const toggleService = (formula: Formula) => {
    if (!draft) return;
    const services = normalizeServices(draft.services);
    const idx = services.findIndex((s) => s.serviceId === formula.id);
    const enabledCount = services.filter((s) => s.enabled).length;

    if (idx >= 0) {
      const target = services[idx];
      if (!target.enabled && enabledCount >= MAX_LANDING_SERVICES) {
        toast({
          title: "Service limit reached",
          description: `You can enable up to ${MAX_LANDING_SERVICES} services on this landing page.`,
          variant: "destructive",
        });
        return;
      }

      const updated = [...services];
      updated[idx] = { ...target, enabled: !target.enabled };
      const nextPrimaryServiceId =
        target.enabled && draft.primaryServiceId === formula.id
          ? (updated.find((service) => service.enabled && service.serviceId !== formula.id)?.serviceId ?? null)
          : draft.primaryServiceId;
      updateDraft({ services: updated as any, primaryServiceId: nextPrimaryServiceId as any });
      return;
    }

    if (enabledCount >= MAX_LANDING_SERVICES) {
      toast({
        title: "Service limit reached",
        description: `You can enable up to ${MAX_LANDING_SERVICES} services on this landing page.`,
        variant: "destructive",
      });
      return;
    }

    updateDraft({
      services: [
        ...services,
        {
          serviceId: formula.id,
          name: formula.name || formula.title || "Service",
          enabled: true,
          sortOrder: services.length,
          iconUrl: normalizeLandingServiceIcon(formula.iconUrl),
          imageUrl: null,
        },
      ] as any,
    });
  };

  const updateServiceName = (serviceId: number, name: string) => {
    if (!draft) return;
    const services = normalizeServices(draft.services).map((service) =>
      service.serviceId === serviceId ? { ...service, name } : service,
    );
    updateDraft({ services: services as any });
  };

  const clearServiceImage = (serviceId: number) => {
    if (!draft) return;
    const services = normalizeServices(draft.services).map((service) =>
      service.serviceId === serviceId ? { ...service, imageUrl: null } : service,
    );
    updateDraft({ services: services as any });
  };

  const updateServiceDescription = (serviceId: number, description: string) => {
    if (!draft) return;
    const services = normalizeServices(draft.services).map((service) =>
      service.serviceId === serviceId ? { ...service, description } : service,
    );
    updateDraft({ services: services as any });
  };

  const moveService = (serviceId: number, direction: "up" | "down") => {
    if (!draft) return;
    const services = normalizeServices(draft.services);
    const index = services.findIndex((s) => s.serviceId === serviceId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const next = [...services];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);

    updateDraft({
      services: next.map((service, idx) => ({ ...service, sortOrder: idx })) as any,
    });
  };

  const updateTrustChip = (index: number, patch: { label?: string; enabled?: boolean }) => {
    if (!draft) return;
    const chips = (draft.trustChips as any[]) || [
      { label: "Licensed & Insured", enabled: true },
      { label: "Same-Day Quotes", enabled: true },
      { label: "Top-Rated Service", enabled: true },
    ];
    const next = chips.slice(0, 3).map((chip, i) => (i === index ? { ...chip, ...patch } : chip));
    updateDraft({ trustChips: next as any });
  };

  const updateHowItWorks = (index: number, patch: { title?: string; body?: string }) => {
    if (!draft) return;
    const steps = (draft.howItWorks as any[]) || [
      { title: "Tell us about your project", body: "Answer a few quick questions so we can tailor your quote." },
      { title: "Get instant pricing", body: "Use our calculator to see transparent, upfront estimates." },
      { title: "Schedule your service", body: "Pick a time that works best for you and we’ll take it from there." },
    ];
    const next = steps.slice(0, 3).map((step, i) => (i === index ? { ...step, ...patch } : step));
    updateDraft({ howItWorks: next as any });
  };

  const updateBeforeAfterItem = (index: number, patch: Partial<BeforeAfterGalleryItem>) => {
    if (!draft) return;
    const current = normalizeBeforeAfterGallery((draft as any).beforeAfterGallery);
    const next = Array.from({ length: 3 }, (_, idx) => {
      const existing = current[idx] || {
        label: "",
        caption: "",
        beforeImageUrl: null,
        afterImageUrl: null,
        enabled: false,
      };
      return idx === index ? { ...existing, ...patch } : existing;
    });
    updateDraft({ beforeAfterGallery: next as any });
  };

  const clearBeforeAfterImage = (index: number, field: "beforeImageUrl" | "afterImageUrl") => {
    updateBeforeAfterItem(index, { [field]: null } as Partial<BeforeAfterGalleryItem>);
  };

  const handleBeforeAfterImageSelected = async (
    index: number,
    field: "beforeImageUrl" | "afterImageUrl",
    file?: File | null,
  ) => {
    if (!file) return;
    const key = `${index}-${field}`;
    setUploadingBeforeAfterKey(key);
    try {
      const imageUrl = await uploadLandingImage(file);
      updateBeforeAfterItem(index, { [field]: imageUrl, enabled: true } as Partial<BeforeAfterGalleryItem>);
      toast({ title: `${field === "beforeImageUrl" ? "Before" : "After"} image uploaded` });
    } catch (error: any) {
      toast({
        title: "Gallery image upload failed",
        description: error?.message || "Unable to upload gallery image.",
        variant: "destructive",
      });
    } finally {
      setUploadingBeforeAfterKey(null);
    }
  };

  const addFaq = () => {
    if (!draft) return;
    const faqs = (draft.faqs as any[]) || [];
    if (faqs.length >= 6) return;
    updateDraft({ faqs: [...faqs, { question: "", answer: "" }] as any });
  };

  const updateFaq = (index: number, patch: { question?: string; answer?: string }) => {
    if (!draft) return;
    const faqs = ((draft.faqs as any[]) || []).map((faq, i) => (i === index ? { ...faq, ...patch } : faq));
    updateDraft({ faqs: faqs as any });
  };

  const removeFaq = (index: number) => {
    if (!draft) return;
    const faqs = ((draft.faqs as any[]) || []).filter((_, i) => i !== index);
    updateDraft({ faqs: faqs as any });
  };

  const statusLabel = draft?.status === "published" ? "Published" : "Draft";
  const statusColor = draft?.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600";

  const primaryFormula = formulas.find((f) => f.id === draft?.primaryServiceId) || fallbackPrimaryFormula;
  const calculatorConnected = Boolean(primaryFormula?.embedId && primaryFormula.isActive);
  const enabledServices = normalizeServices(draft?.services).filter((service) => service.enabled);
  const canPublish = Boolean(
    draft?.businessName &&
      enabledServices.length > 0 &&
      enabledServices.length <= MAX_LANDING_SERVICES &&
      draft?.primaryServiceId &&
      calculatorConnected,
  );

  const previewData = useMemo<LandingPagePublicData | null>(() => {
    if (!draft) return null;

    return {
      id: draft.id,
      userId: draft.userId,
      slug: draft.slug,
      templateKey: (draft.templateKey as any) || "atlas-pro",
      theme: sanitizeLandingTheme(draft.theme),
      businessName: draft.businessName || null,
      logoUrl: draft.logoUrl || null,
      tagline: draft.tagline || null,
      ctaLabel: draft.ctaLabel || null,
      trustChips: (draft.trustChips as any[]) || null,
      services: normalizeServices(draft.services),
      primaryServiceId: draft.primaryServiceId || null,
      primaryServiceEmbedId: primaryFormula?.embedId || null,
      enableMultiService: Boolean(draft.enableMultiService),
      howItWorks: (draft.howItWorks as any[]) || null,
      faqs: (draft.faqs as any[]) || null,
      beforeAfterGallery: normalizeBeforeAfterGallery((draft as any).beforeAfterGallery) as any,
      phone: draft.phone || null,
      email: draft.email || null,
      serviceAreaText: draft.serviceAreaText || null,
      seoTitle: draft.seoTitle || null,
      seoDescription: draft.seoDescription || null,
      landingPageUrl: draft.slug ? `/l/${draft.slug}` : null,
      leadCapReached: false,
      autobidderBrandingRequired: true,
    };
  }, [draft, primaryFormula]);

  useEffect(() => {
    if (!draft?.slug || !previewData || typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(
        "landing_page_draft_preview",
        JSON.stringify({
          slug: draft.slug,
          data: previewData,
          savedAt: Date.now(),
        }),
      );
    } catch {
      // Ignore storage write failures; the inline editor preview will simply fall back.
    }
  }, [draft?.slug, previewData]);

  const previewMaxWidthClass = useMemo(
    () => PREVIEW_VIEWPORT_OPTIONS.find((option) => option.key === previewViewport)?.maxWidthClass || "max-w-[1280px]",
    [previewViewport],
  );
  const previewDeviceWidthClass = useMemo(() => {
    if (previewViewport === "mobile") return "w-[390px]";
    if (previewViewport === "tablet") return "w-[820px]";
    return "w-full";
  }, [previewViewport]);
  const livePath = draft?.slug ? `/l/${draft.slug}` : "";
  const previewFrameSrc = useMemo(() => {
    if (!draft?.slug) return "";
    const params = new URLSearchParams({
      preview: "1",
      editorPreview: "1",
      viewport: previewViewport,
      v: String(draftVersionRef.current),
    });
    return `/l/${draft.slug}?${params.toString()}`;
  }, [draft?.slug, previewViewport, previewData]);
  const liveUrl = useMemo(() => {
    if (!livePath) return "";
    if (typeof window === "undefined") return livePath;
    return `${window.location.origin}${livePath}`;
  }, [livePath]);
  const isPublished = draft?.status === "published";

  const copyLiveLink = async () => {
    if (!liveUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(liveUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = liveUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast({ title: "Link copied", description: liveUrl });
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy the landing page link.",
        variant: "destructive",
      });
    }
  };

  const openLivePage = () => {
    if (!draft?.slug) return;

    if (draft.status !== "published" && previewData) {
      try {
        localStorage.setItem(
          "landing_page_draft_preview",
          JSON.stringify({
            slug: draft.slug,
            data: previewData,
            savedAt: Date.now(),
          }),
        );
      } catch {
        // Ignore storage write errors and continue with server preview.
      }
    }

    const targetUrl = new URL(`/l/${draft.slug}`, window.location.origin);
    if (draft.status !== "published") {
      targetUrl.searchParams.set("preview", "1");
    }
    window.open(targetUrl.toString(), "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Unable to load landing page</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">{(error as any)?.message || "Please try again."}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!draft) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Landing page not ready yet</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">We’re setting up your landing page. Please refresh in a moment.</p>
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentTheme = sanitizeLandingTheme(draft.theme);
  const templateLabel = TEMPLATE_OPTIONS.find((template) => template.key === draft.templateKey)?.label || "Atlas Pro";
  const publishReadiness = [
    { label: "Business details", ready: Boolean(draft.businessName?.trim()) },
    { label: "At least one enabled service", ready: enabledServices.length > 0 },
    { label: "Primary calculator connected", ready: Boolean(draft.primaryServiceId && calculatorConnected) },
    { label: "Publish-safe service count", ready: enabledServices.length <= MAX_LANDING_SERVICES },
  ];
  const readinessCompleteCount = publishReadiness.filter((item) => item.ready).length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="relative isolate space-y-6">
          <div className="absolute inset-x-0 top-0 -z-10 h-64 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(234,88,12,0.14),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.7))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(234,88,12,0.12),_transparent_30%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.94))]" />

          <Card className="overflow-hidden border border-amber-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,237,0.92),rgba(248,250,252,0.92))] shadow-[0_30px_90px_-48px_rgba(234,88,12,0.45)] backdrop-blur-xl dark:border-amber-500/15 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94),rgba(15,23,42,0.96))] dark:shadow-none">
            <CardContent className="relative p-5 sm:p-6 lg:p-7">
              <div className="absolute inset-y-0 right-0 hidden w-72 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.22),_transparent_50%)] lg:block" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className={`${statusColor} border border-white/80 shadow-sm`}>
                        {statusLabel}
                      </Badge>
                      <Badge variant="outline" className="border-amber-200/70 bg-white/80 text-slate-700 dark:border-amber-400/20 dark:bg-slate-950/60 dark:text-slate-200">
                        <LayoutTemplate className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                        {templateLabel}
                      </Badge>
                      <Badge variant="outline" className="border-amber-200/70 bg-white/80 text-slate-700 dark:border-amber-400/20 dark:bg-slate-950/60 dark:text-slate-200">
                        <Wand2 className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                        {enabledServices.length} services enabled
                      </Badge>
                    </div>
                    <div>
                      <p className={EDITOR_SECTION_LABEL_CLASS}>Public Website Builder</p>
                      <h1
                        className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl"
                        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                      >
                        Shape a landing page that feels native to the dashboard.
                      </h1>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                        Tune layout, proof, and calculator setup from one workspace. The editor keeps the dashboard’s warm
                        accent system, rounded surfaces, and softer depth while you build the public-facing experience.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/80 bg-white/72 p-4 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/45 dark:shadow-none">
                      <p className={EDITOR_SECTION_LABEL_CLASS}>Autosave</p>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{saving ? "Saving now" : dirty ? "Unsaved edits" : "Up to date"}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Changes save automatically after a short delay.</p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/72 p-4 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/45 dark:shadow-none">
                      <p className={EDITOR_SECTION_LABEL_CLASS}>Publish Readiness</p>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                        {readinessCompleteCount}/{publishReadiness.length} complete
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Finish the required items before publishing.</p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/72 p-4 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/45 dark:shadow-none">
                      <p className={EDITOR_SECTION_LABEL_CLASS}>Live Path</p>
                      <p className="mt-2 truncate text-base font-semibold text-slate-900 dark:text-slate-100">{livePath || "/l/your-page"}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{isPublished ? "Published and shareable." : "Previewable before publish."}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:max-w-md lg:justify-end">
                  <Button variant="outline" onClick={openLivePage} disabled={!livePath} className="border-white/80 bg-white/80 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Live Landing Page
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/80 bg-white/80 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={() => {
                      if (!draft) return;
                      setSaving(true);
                      saveMutation.mutate({ payload: buildPayload(draft), version: draftVersionRef.current });
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  {draft.status !== "published" ? (
                    <Button
                      onClick={() => publishMutation.mutate()}
                      disabled={!canPublish}
                      className="border-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700"
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => unpublishMutation.mutate()} className="border-white/80 bg-white/80 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800">
                      Unpublish
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className={EDITOR_CARD_CLASS}>
              <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Publish Checklist</CardTitle>
                <CardDescription>Confirm the four required pieces before sending traffic to the page.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-5 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                {publishReadiness.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-950/45">
                    <span>{item.label}</span>
                    <Badge
                      variant="outline"
                      className={item.ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}
                    >
                      {item.ready ? "Ready" : "Needs work"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={EDITOR_CARD_CLASS}>
              <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Preview Controls</CardTitle>
                <CardDescription>Switch between the responsive breakpoints while editing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  {PREVIEW_VIEWPORT_OPTIONS.map((option) => {
                    const Icon = option.key === "desktop" ? Monitor : option.key === "tablet" ? Tablet : Smartphone;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setPreviewViewport(option.key)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                          previewViewport === option.key
                            ? "border-amber-500 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25"
                            : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-400/40 dark:hover:text-slate-100"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.6),rgba(255,255,255,0.96))] p-4 dark:border-slate-700/80 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.85),rgba(15,23,42,0.95))]">
                  <p className={EDITOR_SECTION_LABEL_CLASS}>Current Preview</p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{previewViewport[0].toUpperCase() + previewViewport.slice(1)} viewport</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Use the side-by-side preview on desktop or the dedicated preview tab on smaller screens.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_460px]">
            <div className="min-w-0">{renderEditor()}</div>
            <div className="min-w-0">{renderPreviewFrame()}</div>
          </div>

          <div className="lg:hidden">
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid h-auto grid-cols-2 rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-none">
                <TabsTrigger
                  value="edit"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  Edit
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-4">{renderEditor()}</TabsContent>
              <TabsContent value="preview" className="mt-4">
                {renderPreviewFrame(true)}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );

  function renderPreviewFrame(compact = false) {
    return (
      <Card
        className={`${EDITOR_CARD_CLASS} ${compact ? "min-h-[520px]" : "sticky top-24"}`}
      >
        <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Live Preview</CardTitle>
              <CardDescription>Responsive landing-page render inside the editor.</CardDescription>
            </div>
            <Badge variant="outline" className="border-amber-200 bg-white text-slate-700 dark:border-amber-400/25 dark:bg-slate-950/60 dark:text-slate-200">
              {previewViewport}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className={`${compact ? "h-[72vh]" : "h-[calc(100vh-14rem)] min-h-[640px]"} overflow-auto p-3 md:p-4`}>
          <div className="flex min-h-full items-start justify-center rounded-[1.5rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.10),transparent_35%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.9))] p-3 md:p-5 dark:border-slate-700/80 dark:bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.92))]">
            <div
              className={`overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.55)] dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-none ${previewViewport === "desktop" ? previewMaxWidthClass : previewDeviceWidthClass}`}
            >
              {previewFrameSrc ? (
                <iframe
                  key={previewFrameSrc}
                  title={`Landing page ${previewViewport} preview`}
                  src={previewFrameSrc}
                  className={`block border-0 bg-white dark:bg-slate-950 ${previewViewport === "mobile" ? "h-[780px]" : previewViewport === "tablet" ? "h-[980px]" : "min-h-[640px] h-[calc(100vh-18rem)] w-full"}`}
                  style={{
                    width: previewViewport === "desktop" ? "100%" : undefined,
                  }}
                />
              ) : previewData ? (
                <div className={`mx-auto w-full overflow-hidden ${previewMaxWidthClass}`}>
                  <LandingPageView data={previewData} isPreview previewViewport={previewViewport} />
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderEditor() {
    if (!draft) return null;

    return (
      <div className="space-y-4">
        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <CardTitle className="text-base font-semibold">Template & Colors</CardTitle>
            <CardDescription>Select a template and tune the landing-page palette.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="space-y-2">
              <p className={EDITOR_SECTION_LABEL_CLASS}>Layout Direction</p>
              <Label htmlFor="landing-template-picker">Template Picker</Label>
              <Select
                value={(draft.templateKey as LandingTemplateKey) || "atlas-pro"}
                onValueChange={(value) => updateDraft({ templateKey: value as any })}
              >
                <SelectTrigger id="landing-template-picker" data-testid="select-landing-template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {VISIBLE_TEMPLATE_OPTIONS.map((template) => (
                    <SelectItem key={template.key} value={template.key}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-slate-400">Pick a landing page layout, then fine tune with the color controls below.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {VISIBLE_TEMPLATE_OPTIONS.map((template) => {
                const active = draft.templateKey === template.key;
                return (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => updateDraft({ templateKey: template.key as any })}
                    className={`text-left rounded-2xl border p-4 transition ${
                      active
                        ? "border-amber-300 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,237,213,0.85))] shadow-[0_18px_36px_-28px_rgba(234,88,12,0.65)]"
                        : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-amber-400/40 dark:hover:bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{template.label}</div>
                      {active ? <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">Active</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{template.description}</div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-950/45">
              <p className={EDITOR_SECTION_LABEL_CLASS}>Palette</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use the warm dashboard accent direction first, then tune neutrals and overlays.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                { key: "primaryColor", label: "Primary" },
                { key: "accentColor", label: "Accent" },
                { key: "backgroundColor", label: "Background" },
                { key: "surfaceColor", label: "Surface" },
                { key: "textColor", label: "Text" },
                { key: "mutedTextColor", label: "Muted Text" },
                { key: "buttonTextColor", label: "Button Text" },
                { key: "heroOverlayColor", label: "Hero Overlay" },
              ] as Array<{ key: keyof Pick<LandingTheme, "primaryColor" | "accentColor" | "backgroundColor" | "surfaceColor" | "textColor" | "mutedTextColor" | "buttonTextColor" | "heroOverlayColor">; label: string }>).map((item) => (
                <div key={item.key} className="rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/80 dark:bg-slate-950/45">
                  <Label className="text-xs">{item.label}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="color"
                      value={currentTheme[item.key]}
                      onChange={(e) => updateThemeColor(item.key, e.target.value)}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={currentTheme[item.key]}
                      onChange={(e) => updateThemeColor(item.key, e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-950/45">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="hero-overlay-opacity">Hero Overlay Opacity</Label>
                <span className="text-xs text-slate-500">{currentTheme.heroOverlayOpacity}%</span>
              </div>
              <Input
                id="hero-overlay-opacity"
                type="range"
                min={0}
                max={100}
                step={1}
                value={currentTheme.heroOverlayOpacity}
                onChange={(e) => updateThemeSettings({ heroOverlayOpacity: Number(e.target.value) })}
                className="px-0"
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                onClick={() =>
                  updateDraft({
                    theme: {
                      ...DEFAULT_THEME,
                      heroImageUrl: currentTheme.heroImageUrl,
                      showFaqSection: currentTheme.showFaqSection,
                      showBeforeAfterSection: currentTheme.showBeforeAfterSection,
                      showVoltageReliabilitySection: currentTheme.showVoltageReliabilitySection,
                      epoxyStrataContent: currentTheme.epoxyStrataContent,
                      voltVikingContent: currentTheme.voltVikingContent,
                    } as any,
                  })
                }
              >
                Reset Colors
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <CardTitle className="text-base font-semibold">Basics</CardTitle>
            <CardDescription>Business details, landing URL, and primary CTA copy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div>
              <Label>Landing Page URL</Label>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">/l/</span>
                <Input
                  value={draft.slug || ""}
                  onChange={(e) => updateDraft({ slug: sanitizeSlugInput(e.target.value) })}
                  placeholder="your-landing-page"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" type="button" onClick={copyLiveLink} disabled={!liveUrl}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                {isPublished
                  ? "Your page is published and accessible at this URL."
                  : "Draft URLs can be copied now; visitors will only see the full page after publish."}
              </p>
            </div>
            <div>
              <Label>Business Name *</Label>
              <Input value={draft.businessName || ""} onChange={(e) => updateDraft({ businessName: e.target.value })} />
            </div>
            <div>
              <Label>Business Logo</Label>
              <div className="mt-2 space-y-3">
                {draft.logoUrl ? (
                  <img
                    src={draft.logoUrl}
                    alt={draft.businessName || "Business logo"}
                    className="h-16 w-auto rounded border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
                  />
                ) : (
                  <div className="text-xs text-gray-500 dark:text-slate-400">No logo uploaded yet.</div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      void handleLogoFileSelected(file);
                      e.currentTarget.value = "";
                    }}
                    disabled={logoUploading}
                  />
                  {draft.logoUrl ? (
                    <Button variant="outline" type="button" onClick={() => updateDraft({ logoUrl: null })} disabled={logoUploading}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">{logoUploading ? "Uploading logo..." : "PNG/JPG/WebP up to 10MB."}</p>
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={draft.tagline || ""} onChange={(e) => updateDraft({ tagline: e.target.value })} />
            </div>
            <div>
              <Label>Hero Image</Label>
              <div className="mt-2 space-y-3">
                {currentTheme.heroImageUrl ? (
                  <img
                    src={currentTheme.heroImageUrl}
                    alt={`${draft.businessName || "Landing page"} hero`}
                    className="h-32 w-full rounded-lg border border-slate-200 object-cover bg-white dark:border-slate-700 dark:bg-slate-900"
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-400">
                    No hero image uploaded yet. Templates will use their built-in background styles until you add one.
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      void handleHeroImageSelected(file);
                      e.currentTarget.value = "";
                    }}
                    disabled={heroUploading}
                  />
                  {currentTheme.heroImageUrl ? (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => updateThemeSettings({ heroImageUrl: null })}
                      disabled={heroUploading}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {heroUploading
                    ? "Uploading hero image..."
                    : "Shown in the hero section across templates. Use the overlay color and opacity controls above to improve text contrast."}
                </p>
              </div>
            </div>
            <div>
              <Label>Primary CTA</Label>
              <Input value={draft.ctaLabel || ""} onChange={(e) => updateDraft({ ctaLabel: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {draft.templateKey === "sunline-studio" ? (
          <Card className={EDITOR_CARD_CLASS}>
            <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
              <CardTitle className="text-base font-semibold">Sunline Studio Hero Copy</CardTitle>
              <CardDescription>Edit the hero text used only by the Sunline Studio template.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Hero</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Hero Section Label</Label>
                    <Input value={currentTheme.sunlineStudioContent.heroSectionLabel} onChange={(e) => updateSunlineStudioContent({ heroSectionLabel: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Hero Body</Label>
                    <Textarea value={currentTheme.sunlineStudioContent.heroBody} onChange={(e) => updateSunlineStudioContent({ heroBody: e.target.value })} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {draft.templateKey === "epoxy-strata" ? (
          <Card className={EDITOR_CARD_CLASS}>
            <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
              <CardTitle className="text-base font-semibold">Epoxy Template Copy</CardTitle>
              <CardDescription>Edit the text blocks used only by the Epoxy Strata template.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Navigation</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Systems Label</Label>
                    <Input value={currentTheme.epoxyStrataContent.navSystemsLabel} onChange={(e) => updateEpoxyStrataContent({ navSystemsLabel: e.target.value })} />
                  </div>
                  <div>
                    <Label>Transformation Label</Label>
                    <Input value={currentTheme.epoxyStrataContent.navTransformationLabel} onChange={(e) => updateEpoxyStrataContent({ navTransformationLabel: e.target.value })} />
                  </div>
                  <div>
                    <Label>Process Label</Label>
                    <Input value={currentTheme.epoxyStrataContent.navProcessLabel} onChange={(e) => updateEpoxyStrataContent({ navProcessLabel: e.target.value })} />
                  </div>
                  <div>
                    <Label>Quote Label</Label>
                    <Input value={currentTheme.epoxyStrataContent.navQuoteLabel} onChange={(e) => updateEpoxyStrataContent({ navQuoteLabel: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Desktop Nav Button Label</Label>
                    <Input value={currentTheme.epoxyStrataContent.navButtonLabel} onChange={(e) => updateEpoxyStrataContent({ navButtonLabel: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Hero</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Eyebrow</Label>
                    <Input value={currentTheme.epoxyStrataContent.heroEyebrow} onChange={(e) => updateEpoxyStrataContent({ heroEyebrow: e.target.value })} />
                  </div>
                  <div>
                    <Label>Headline Line 1</Label>
                    <Input value={currentTheme.epoxyStrataContent.heroTitleLine1} onChange={(e) => updateEpoxyStrataContent({ heroTitleLine1: e.target.value })} />
                  </div>
                  <div>
                    <Label>Headline Accent Line</Label>
                    <Input value={currentTheme.epoxyStrataContent.heroTitleAccent} onChange={(e) => updateEpoxyStrataContent({ heroTitleAccent: e.target.value })} />
                  </div>
                  <div>
                    <Label>Headline Line 2</Label>
                    <Input value={currentTheme.epoxyStrataContent.heroTitleLine2} onChange={(e) => updateEpoxyStrataContent({ heroTitleLine2: e.target.value })} />
                  </div>
                  <div>
                    <Label>Secondary CTA Label</Label>
                    <Input value={currentTheme.epoxyStrataContent.heroSecondaryCtaLabel} onChange={(e) => updateEpoxyStrataContent({ heroSecondaryCtaLabel: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Scroll Hint</Label>
                    <Input value={currentTheme.epoxyStrataContent.heroScrollLabel} onChange={(e) => updateEpoxyStrataContent({ heroScrollLabel: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Transformation Section</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Title Line 1</Label>
                    <Input value={currentTheme.epoxyStrataContent.transformationTitleLine1} onChange={(e) => updateEpoxyStrataContent({ transformationTitleLine1: e.target.value })} />
                  </div>
                  <div>
                    <Label>Title Line 2</Label>
                    <Input value={currentTheme.epoxyStrataContent.transformationTitleLine2} onChange={(e) => updateEpoxyStrataContent({ transformationTitleLine2: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Body</Label>
                    <Textarea value={currentTheme.epoxyStrataContent.transformationBody} onChange={(e) => updateEpoxyStrataContent({ transformationBody: e.target.value })} />
                  </div>
                  <div>
                    <Label>Before Label</Label>
                    <Input value={currentTheme.epoxyStrataContent.transformationBeforeLabel} onChange={(e) => updateEpoxyStrataContent({ transformationBeforeLabel: e.target.value })} />
                  </div>
                  <div>
                    <Label>After Label</Label>
                    <Input value={currentTheme.epoxyStrataContent.transformationAfterLabel} onChange={(e) => updateEpoxyStrataContent({ transformationAfterLabel: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {currentTheme.epoxyStrataContent.transformationStats.map((stat, index) => (
                    <div key={index} className={`space-y-2 ${EDITOR_SUBCARD_MUTED_CLASS}`}>
                      <Label>Stat {index + 1} Value</Label>
                      <Input value={stat.value} onChange={(e) => updateEpoxyStrataStat(index, { value: e.target.value })} />
                      <Label>Stat {index + 1} Label</Label>
                      <Input value={stat.label} onChange={(e) => updateEpoxyStrataStat(index, { label: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Section Labels</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Systems Eyebrow</Label>
                    <Input value={currentTheme.epoxyStrataContent.systemsEyebrow} onChange={(e) => updateEpoxyStrataContent({ systemsEyebrow: e.target.value })} />
                  </div>
                  <div>
                    <Label>Systems Heading</Label>
                    <Input value={currentTheme.epoxyStrataContent.systemsHeading} onChange={(e) => updateEpoxyStrataContent({ systemsHeading: e.target.value })} />
                  </div>
                  <div>
                    <Label>Gallery Heading</Label>
                    <Input value={currentTheme.epoxyStrataContent.galleryHeading} onChange={(e) => updateEpoxyStrataContent({ galleryHeading: e.target.value })} />
                  </div>
                  <div>
                    <Label>Gallery Card Badge</Label>
                    <Input value={currentTheme.epoxyStrataContent.galleryCardEyebrow} onChange={(e) => updateEpoxyStrataContent({ galleryCardEyebrow: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Gallery Subheading</Label>
                    <Input value={currentTheme.epoxyStrataContent.gallerySubheading} onChange={(e) => updateEpoxyStrataContent({ gallerySubheading: e.target.value })} />
                  </div>
                  <div>
                    <Label>Before / After Eyebrow</Label>
                    <Input value={currentTheme.epoxyStrataContent.beforeAfterEyebrow} onChange={(e) => updateEpoxyStrataContent({ beforeAfterEyebrow: e.target.value })} />
                  </div>
                  <div>
                    <Label>Before / After Heading</Label>
                    <Input value={currentTheme.epoxyStrataContent.beforeAfterHeading} onChange={(e) => updateEpoxyStrataContent({ beforeAfterHeading: e.target.value })} />
                  </div>
                  <div>
                    <Label>Process Heading</Label>
                    <Input value={currentTheme.epoxyStrataContent.processHeading} onChange={(e) => updateEpoxyStrataContent({ processHeading: e.target.value })} />
                  </div>
                  <div>
                    <Label>Reviews Heading</Label>
                    <Input value={currentTheme.epoxyStrataContent.reviewsHeading} onChange={(e) => updateEpoxyStrataContent({ reviewsHeading: e.target.value })} />
                  </div>
                  <div>
                    <Label>FAQ Eyebrow</Label>
                    <Input value={currentTheme.epoxyStrataContent.faqEyebrow} onChange={(e) => updateEpoxyStrataContent({ faqEyebrow: e.target.value })} />
                  </div>
                  <div>
                    <Label>FAQ Heading</Label>
                    <Input value={currentTheme.epoxyStrataContent.faqHeading} onChange={(e) => updateEpoxyStrataContent({ faqHeading: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Footer Tagline</Label>
                    <Input value={currentTheme.epoxyStrataContent.footerTagline} onChange={(e) => updateEpoxyStrataContent({ footerTagline: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Quote Section</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Quote Title Line 1</Label>
                    <Input value={currentTheme.epoxyStrataContent.quoteTitleLine1} onChange={(e) => updateEpoxyStrataContent({ quoteTitleLine1: e.target.value })} />
                  </div>
                  <div>
                    <Label>Quote Title Line 2</Label>
                    <Input value={currentTheme.epoxyStrataContent.quoteTitleLine2} onChange={(e) => updateEpoxyStrataContent({ quoteTitleLine2: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Quote Body</Label>
                    <Textarea value={currentTheme.epoxyStrataContent.quoteBody} onChange={(e) => updateEpoxyStrataContent({ quoteBody: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Availability Note</Label>
                    <Input value={currentTheme.epoxyStrataContent.availabilityNote} onChange={(e) => updateEpoxyStrataContent({ availabilityNote: e.target.value })} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {draft.templateKey === "volt-viking" ? (
          <Card className={EDITOR_CARD_CLASS}>
            <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
              <CardTitle className="text-base font-semibold">Voltage Copy</CardTitle>
              <CardDescription>Edit the text blocks used only by the Voltage template.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Navigation</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Services Label</Label><Input value={currentTheme.voltVikingContent.navServicesLabel} onChange={(e) => updateVoltVikingContent({ navServicesLabel: e.target.value })} /></div>
                  <div><Label>About Label</Label><Input value={currentTheme.voltVikingContent.navAboutLabel} onChange={(e) => updateVoltVikingContent({ navAboutLabel: e.target.value })} /></div>
                  <div><Label>Reviews Label</Label><Input value={currentTheme.voltVikingContent.navReviewsLabel} onChange={(e) => updateVoltVikingContent({ navReviewsLabel: e.target.value })} /></div>
                  <div><Label>FAQ Label</Label><Input value={currentTheme.voltVikingContent.navFaqLabel} onChange={(e) => updateVoltVikingContent({ navFaqLabel: e.target.value })} /></div>
                  <div><Label>Desktop Button Label</Label><Input value={currentTheme.voltVikingContent.navButtonLabel} onChange={(e) => updateVoltVikingContent({ navButtonLabel: e.target.value })} /></div>
                  <div><Label>Mobile Button Label</Label><Input value={currentTheme.voltVikingContent.mobileButtonLabel} onChange={(e) => updateVoltVikingContent({ mobileButtonLabel: e.target.value })} /></div>
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Hero</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Title Line 1</Label><Input value={currentTheme.voltVikingContent.heroTitleLine1} onChange={(e) => updateVoltVikingContent({ heroTitleLine1: e.target.value })} /></div>
                  <div><Label>Accent Word</Label><Input value={currentTheme.voltVikingContent.heroTitleAccent} onChange={(e) => updateVoltVikingContent({ heroTitleAccent: e.target.value })} /></div>
                  <div><Label>Title Line 2</Label><Input value={currentTheme.voltVikingContent.heroTitleLine2} onChange={(e) => updateVoltVikingContent({ heroTitleLine2: e.target.value })} /></div>
                  <div><Label>Primary Button</Label><Input value={currentTheme.voltVikingContent.heroPrimaryCtaLabel} onChange={(e) => updateVoltVikingContent({ heroPrimaryCtaLabel: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Hero Body</Label><Textarea value={currentTheme.voltVikingContent.heroBody} onChange={(e) => updateVoltVikingContent({ heroBody: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Secondary Button</Label><Input value={currentTheme.voltVikingContent.heroSecondaryCtaLabel} onChange={(e) => updateVoltVikingContent({ heroSecondaryCtaLabel: e.target.value })} /></div>
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>About</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Eyebrow</Label><Input value={currentTheme.voltVikingContent.aboutEyebrow} onChange={(e) => updateVoltVikingContent({ aboutEyebrow: e.target.value })} /></div>
                  <div><Label>Button Label</Label><Input value={currentTheme.voltVikingContent.aboutButtonLabel} onChange={(e) => updateVoltVikingContent({ aboutButtonLabel: e.target.value })} /></div>
                  <div><Label>Heading Line 1</Label><Input value={currentTheme.voltVikingContent.aboutHeadingLine1} onChange={(e) => updateVoltVikingContent({ aboutHeadingLine1: e.target.value })} /></div>
                  <div><Label>Heading Line 2</Label><Input value={currentTheme.voltVikingContent.aboutHeadingLine2} onChange={(e) => updateVoltVikingContent({ aboutHeadingLine2: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Body</Label><Textarea value={currentTheme.voltVikingContent.aboutBody} onChange={(e) => updateVoltVikingContent({ aboutBody: e.target.value })} /></div>
                  <div className="sm:col-span-2">
                    <Label>Checklist Items</Label>
                    <Textarea
                      value={currentTheme.voltVikingContent.aboutChecklist.join("\n")}
                      onChange={(e) => updateVoltVikingList("aboutChecklist", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Headings</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Services Heading</Label><Input value={currentTheme.voltVikingContent.servicesHeading} onChange={(e) => updateVoltVikingContent({ servicesHeading: e.target.value })} /></div>
                  <div><Label>Services Subheading</Label><Input value={currentTheme.voltVikingContent.servicesSubheading} onChange={(e) => updateVoltVikingContent({ servicesSubheading: e.target.value })} /></div>
                  <div><Label>Guarantee Line 1</Label><Input value={currentTheme.voltVikingContent.guaranteeTitleLine1} onChange={(e) => updateVoltVikingContent({ guaranteeTitleLine1: e.target.value })} /></div>
                  <div><Label>Guarantee Accent</Label><Input value={currentTheme.voltVikingContent.guaranteeAccent} onChange={(e) => updateVoltVikingContent({ guaranteeAccent: e.target.value })} /></div>
                  <div><Label>Process Heading</Label><Input value={currentTheme.voltVikingContent.processHeading} onChange={(e) => updateVoltVikingContent({ processHeading: e.target.value })} /></div>
                  <div><Label>Process Subheading</Label><Input value={currentTheme.voltVikingContent.processSubheading} onChange={(e) => updateVoltVikingContent({ processSubheading: e.target.value })} /></div>
                  <div><Label>FAQ Heading</Label><Input value={currentTheme.voltVikingContent.faqHeading} onChange={(e) => updateVoltVikingContent({ faqHeading: e.target.value })} /></div>
                  <div><Label>FAQ Subheading</Label><Input value={currentTheme.voltVikingContent.faqSubheading} onChange={(e) => updateVoltVikingContent({ faqSubheading: e.target.value })} /></div>
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className={EDITOR_SECTION_LABEL_CLASS}>Reliability Section</p>
                    <p className="text-xs text-slate-500">Control the "We Don't Just Fix" section and edit each card below.</p>
                  </div>
                  <div className={EDITOR_TOGGLE_STRIP_CLASS}>
                    <Switch
                      checked={Boolean(currentTheme.showVoltageReliabilitySection)}
                      onCheckedChange={(checked) =>
                        updateDraft({ theme: { ...currentTheme, showVoltageReliabilitySection: checked } as any })
                      }
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Show reliability section</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {currentTheme.showVoltageReliabilitySection
                    ? "This section is visible on the public landing page and its copy can be edited below."
                    : "This section is hidden on the public landing page until you enable it."}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div><Label>Section Heading</Label><Input value={currentTheme.voltVikingContent.philosophyHeading} onChange={(e) => updateVoltVikingContent({ philosophyHeading: e.target.value })} /></div>
                  <div><Label>Section Subheading</Label><Input value={currentTheme.voltVikingContent.philosophySubheading} onChange={(e) => updateVoltVikingContent({ philosophySubheading: e.target.value })} /></div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {currentTheme.voltVikingContent.philosophyItems.map((item, index) => (
                    <div key={index} className={`space-y-2 ${EDITOR_SUBCARD_MUTED_CLASS}`}>
                      <Label>Card {index + 1} Title</Label>
                      <Input value={item.title} onChange={(e) => updateVoltVikingFeature(index, { title: e.target.value })} />
                      <Label>Card {index + 1} Body</Label>
                      <Textarea value={item.body} onChange={(e) => updateVoltVikingFeature(index, { body: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={EDITOR_SUBCARD_CLASS}>
                <p className={EDITOR_SECTION_LABEL_CLASS}>Guarantee + Service Area + Footer</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label>Guarantee Body</Label><Textarea value={currentTheme.voltVikingContent.guaranteeBody} onChange={(e) => updateVoltVikingContent({ guaranteeBody: e.target.value })} /></div>
                  <div><Label>Guarantee Button</Label><Input value={currentTheme.voltVikingContent.guaranteeButtonLabel} onChange={(e) => updateVoltVikingContent({ guaranteeButtonLabel: e.target.value })} /></div>
                  <div><Label>Guarantee Card Title</Label><Input value={currentTheme.voltVikingContent.guaranteeCardTitle} onChange={(e) => updateVoltVikingContent({ guaranteeCardTitle: e.target.value })} /></div>
                  <div><Label>Service Area Heading</Label><Input value={currentTheme.voltVikingContent.serviceAreaHeading} onChange={(e) => updateVoltVikingContent({ serviceAreaHeading: e.target.value })} /></div>
                  <div><Label>Service Area Button</Label><Input value={currentTheme.voltVikingContent.serviceAreaButtonLabel} onChange={(e) => updateVoltVikingContent({ serviceAreaButtonLabel: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Service Area Body</Label><Textarea value={currentTheme.voltVikingContent.serviceAreaBody} onChange={(e) => updateVoltVikingContent({ serviceAreaBody: e.target.value })} /></div>
                  <div><Label>HQ Label</Label><Input value={currentTheme.voltVikingContent.hqLabel} onChange={(e) => updateVoltVikingContent({ hqLabel: e.target.value })} /></div>
                  <div><Label>HQ Address</Label><Input value={currentTheme.voltVikingContent.hqAddress} onChange={(e) => updateVoltVikingContent({ hqAddress: e.target.value })} /></div>
                  <div className="sm:col-span-2">
                    <Label>Service Area Cities</Label>
                    <Textarea value={currentTheme.voltVikingContent.serviceAreaCities.join("\n")} onChange={(e) => updateVoltVikingList("serviceAreaCities", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2"><Label>Footer Body</Label><Textarea value={currentTheme.voltVikingContent.footerBody} onChange={(e) => updateVoltVikingContent({ footerBody: e.target.value })} /></div>
                  <div><Label>Footer Nav Heading</Label><Input value={currentTheme.voltVikingContent.footerNavHeading} onChange={(e) => updateVoltVikingContent({ footerNavHeading: e.target.value })} /></div>
                  <div><Label>Footer Contact Heading</Label><Input value={currentTheme.voltVikingContent.footerContactHeading} onChange={(e) => updateVoltVikingContent({ footerContactHeading: e.target.value })} /></div>
                  <div><Label>Footer Contact Button</Label><Input value={currentTheme.voltVikingContent.footerContactButtonLabel} onChange={(e) => updateVoltVikingContent({ footerContactButtonLabel: e.target.value })} /></div>
                  <div><Label>Footer Copyright</Label><Input value={currentTheme.voltVikingContent.footerCopyright} onChange={(e) => updateVoltVikingContent({ footerCopyright: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Footer Nav Links</Label><Textarea value={currentTheme.voltVikingContent.footerNavLinks.join("\n")} onChange={(e) => updateVoltVikingList("footerNavLinks", e.target.value)} /></div>
                  <div className="sm:col-span-2"><Label>Footer Legal Links</Label><Textarea value={currentTheme.voltVikingContent.footerLegalLinks.join("\n")} onChange={(e) => updateVoltVikingList("footerLegalLinks", e.target.value)} /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <CardTitle className="text-base font-semibold">Trust Chips</CardTitle>
            <CardDescription>Short proof points used across the hero and support sections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/80 dark:bg-slate-950/45">
                <Switch checked={Boolean((draft.trustChips as any[])?.[idx]?.enabled)} onCheckedChange={(checked) => updateTrustChip(idx, { enabled: checked })} />
                <Input value={(draft.trustChips as any[])?.[idx]?.label || ""} onChange={(e) => updateTrustChip(idx, { label: e.target.value })} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Services ({enabledServices.length}/{MAX_LANDING_SERVICES} enabled)</CardTitle>
              <Button size="sm" variant="outline" className="border-amber-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" onClick={syncServicesFromFormulas}>
                Sync from Calculators
              </Button>
            </div>
            <CardDescription>Choose the services and imagery exposed on this page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {formulas.map((formula) => {
              const service = normalizeServices(draft.services).find((s) => s.serviceId === formula.id);
              return (
                <div key={formula.id} className="space-y-2 rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/80 dark:bg-slate-950/45">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={Boolean(service?.enabled)} onCheckedChange={() => toggleService(formula)} />
                      <span className="font-medium text-sm">{formula.name || formula.title}</span>
                    </div>
                    {service && (
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => moveService(formula.id, "up")}>↑</Button>
                        <Button size="icon" variant="ghost" onClick={() => moveService(formula.id, "down")}>↓</Button>
                      </div>
                    )}
                  </div>
                  {service && (
                    <div className="space-y-2">
                      <Input
                        value={service.name}
                        onChange={(e) => updateServiceName(formula.id, e.target.value)}
                        placeholder="Service display name"
                      />
                      <Textarea
                        value={service.description || ""}
                        onChange={(e) => updateServiceDescription(formula.id, e.target.value)}
                        placeholder="Optional service description"
                      />
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="h-28 w-full rounded-md border border-slate-200 object-cover dark:border-slate-700"
                        />
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            void handleServiceImageSelected(formula.id, file);
                            e.currentTarget.value = "";
                          }}
                          disabled={uploadingServiceId === formula.id}
                        />
                        {service.imageUrl ? (
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => clearServiceImage(formula.id)}
                            disabled={uploadingServiceId === formula.id}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {uploadingServiceId === formula.id ? "Uploading service image..." : "Optional image shown on landing service card."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-gray-500 dark:text-slate-400">Only enabled services appear on the landing page and selector embed. Max {MAX_LANDING_SERVICES}.</p>
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <CardTitle className="text-base font-semibold">Calculator Embed</CardTitle>
            <CardDescription>Set the default pricing form and selector behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div>
              <Label>Primary Service *</Label>
              <Select
                value={draft.primaryServiceId ? String(draft.primaryServiceId) : undefined}
                onValueChange={(value) => updateDraft({ primaryServiceId: value ? Number(value) : null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {enabledServices.map((service) => (
                    <SelectItem key={service.serviceId} value={String(service.serviceId)}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Multi-Service Selector</Label>
                <p className="text-xs text-gray-500 dark:text-slate-400">Embeds the service selector for chosen landing-page services.</p>
              </div>
              <Switch checked={Boolean(draft.enableMultiService)} onCheckedChange={(checked) => updateDraft({ enableMultiService: checked })} />
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">Calculator connected: {calculatorConnected ? "Yes" : "No"}</div>
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <CardTitle className="text-base font-semibold">How It Works</CardTitle>
            <CardDescription>Three steps repeated through the public landing-page layout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="space-y-2 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-950/45">
                <Label>Step {idx + 1} Title</Label>
                <Input value={(draft.howItWorks as any[])?.[idx]?.title || ""} onChange={(e) => updateHowItWorks(idx, { title: e.target.value })} />
                <Label>Step {idx + 1} Body</Label>
                <Textarea value={(draft.howItWorks as any[])?.[idx]?.body || ""} onChange={(e) => updateHowItWorks(idx, { body: e.target.value })} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">FAQs</CardTitle>
                <CardDescription>Show a dedicated FAQ section for this template and fill it manually or with AI.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={EDITOR_TOGGLE_STRIP_CLASS}>
                  <Switch
                    checked={Boolean(currentTheme.showFaqSection)}
                    onCheckedChange={(checked) =>
                      updateDraft({ theme: { ...currentTheme, showFaqSection: checked } as any })
                    }
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Show FAQ section</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateFaqsMutation.mutate()}
                  disabled={generateFaqsMutation.isPending || !draft.businessName || enabledServices.length === 0}
                >
                  {generateFaqsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate with AI
                </Button>
                <Button size="sm" variant="outline" onClick={addFaq} disabled={((draft.faqs as any[]) || []).length >= 6}>
                  Add FAQ
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <p className="text-xs text-slate-500">
              {currentTheme.showFaqSection
                ? "This FAQ section is enabled for the selected template."
                : "This FAQ section is hidden on the public landing page until you enable it."}
            </p>
            {((draft.faqs as any[]) || []).map((faq, idx) => (
              <div key={idx} className="space-y-2 rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/80 dark:bg-slate-950/45">
                <Input value={faq.question} onChange={(e) => updateFaq(idx, { question: e.target.value })} placeholder="Question" />
                <Textarea value={faq.answer} onChange={(e) => updateFaq(idx, { answer: e.target.value })} placeholder="Answer" />
                <Button size="sm" variant="ghost" onClick={() => removeFaq(idx)}>
                  Remove
                </Button>
              </div>
            ))}
            {((draft.faqs as any[]) || []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-400">
                No FAQs added yet. Add them manually or generate them with AI.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">Before & After Gallery</CardTitle>
                <CardDescription>Optional transformation gallery with up to three before/after sets.</CardDescription>
              </div>
              <div className={EDITOR_TOGGLE_STRIP_CLASS}>
                <Switch
                  checked={Boolean(currentTheme.showBeforeAfterSection)}
                  onCheckedChange={(checked) =>
                    updateDraft({ theme: { ...currentTheme, showBeforeAfterSection: checked } as any })
                  }
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Show gallery section</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <p className="text-xs text-slate-500">
              {currentTheme.showBeforeAfterSection
                ? "Enabled galleries will appear on the public landing page."
                : "The gallery is hidden until you enable it."}
            </p>
            {Array.from({ length: 3 }, (_, idx) => {
              const item = normalizeBeforeAfterGallery((draft as any).beforeAfterGallery)[idx] || {
                label: "",
                caption: "",
                beforeImageUrl: null,
                afterImageUrl: null,
                enabled: false,
              };
              return (
                <div key={idx} className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-950/45">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={EDITOR_SECTION_LABEL_CLASS}>Gallery Set {idx + 1}</p>
                      <p className="mt-1 text-sm text-slate-600">Upload one before image and one after image for this transformation.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={item.enabled} onCheckedChange={(checked) => updateBeforeAfterItem(idx, { enabled: checked })} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Enabled</span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Gallery Label</Label>
                      <Input
                        value={item.label}
                        onChange={(e) => updateBeforeAfterItem(idx, { label: e.target.value })}
                        placeholder="Garage floor refresh"
                      />
                    </div>
                    <div>
                      <Label>Caption</Label>
                      <Input
                        value={item.caption}
                        onChange={(e) => updateBeforeAfterItem(idx, { caption: e.target.value })}
                        placeholder="From worn surface to finished installation"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {([
                      { field: "beforeImageUrl", title: "Before Image" },
                      { field: "afterImageUrl", title: "After Image" },
                    ] as Array<{ field: "beforeImageUrl" | "afterImageUrl"; title: string }>).map((upload) => {
                      const isUploading = uploadingBeforeAfterKey === `${idx}-${upload.field}`;
                      const imageUrl = item[upload.field];
                      return (
                        <div key={upload.field} className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-3 dark:border-slate-700/80 dark:bg-slate-900/45">
                          <Label>{upload.title}</Label>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={upload.title}
                              className="h-44 w-full rounded-xl border border-slate-200 object-cover bg-white dark:border-slate-700 dark:bg-slate-900"
                            />
                          ) : (
                            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-400">
                              No image uploaded yet.
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                void handleBeforeAfterImageSelected(idx, upload.field, file);
                                e.currentTarget.value = "";
                              }}
                              disabled={isUploading}
                            />
                            {imageUrl ? (
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => clearBeforeAfterImage(idx, upload.field)}
                                disabled={isUploading}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">{isUploading ? "Uploading image..." : "PNG/JPG/WebP up to 10MB."}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <CardTitle className="text-base font-semibold">Contact</CardTitle>
            <CardDescription>Phone, email, and service-area information shown on the page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div>
              <Label>Phone</Label>
              <Input value={draft.phone || ""} onChange={(e) => updateDraft({ phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={draft.email || ""} onChange={(e) => updateDraft({ email: e.target.value })} />
            </div>
            <div>
              <Label>Service Area</Label>
              <Input value={draft.serviceAreaText || ""} onChange={(e) => updateDraft({ serviceAreaText: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardHeader className={EDITOR_CARD_HEADER_CLASS}>
            <CardTitle className="text-base font-semibold">SEO</CardTitle>
            <CardDescription>Metadata used for search snippets and page previews.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div>
              <Label>SEO Title</Label>
              <Input value={draft.seoTitle || ""} onChange={(e) => updateDraft({ seoTitle: e.target.value })} />
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{(draft.seoTitle || "").length} / 60</p>
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea value={draft.seoDescription || ""} onChange={(e) => updateDraft({ seoDescription: e.target.value })} />
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{(draft.seoDescription || "").length} / 155</p>
            </div>
          </CardContent>
        </Card>

        <Card className={EDITOR_CARD_CLASS}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{dirty ? "Unsaved" : "Saved"}</Badge>
              {saving && <span className="text-xs text-gray-500 dark:text-slate-400">Saving...</span>}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (!draft) return;
                setSaving(true);
                saveMutation.mutate({ payload: buildPayload(draft), version: draftVersionRef.current });
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}

function buildPayload(draft: LandingPage): Partial<LandingPage> {
  return {
    slug: sanitizeSlugInput(draft.slug),
    templateKey: (draft.templateKey as any) || "atlas-pro",
    theme: sanitizeLandingTheme(draft.theme),
    businessName: draft.businessName,
    logoUrl: draft.logoUrl,
    tagline: draft.tagline,
    ctaLabel: draft.ctaLabel,
    trustChips: draft.trustChips,
    services: normalizeServices(draft.services) as any,
    primaryServiceId: draft.primaryServiceId,
    enableMultiService: draft.enableMultiService,
    howItWorks: draft.howItWorks,
    faqs: draft.faqs,
    beforeAfterGallery: normalizeBeforeAfterGallery((draft as any).beforeAfterGallery) as any,
    phone: draft.phone,
    email: draft.email,
    serviceAreaText: draft.serviceAreaText,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
  };
}
