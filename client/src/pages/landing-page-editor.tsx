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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import LandingPageView, { type LandingPagePublicData } from "@/components/landing-page-view";
import type { Formula, LandingPage } from "@shared/schema";
import { Copy, ExternalLink, Eye, LayoutTemplate, Loader2, Monitor, Save, Smartphone, Tablet, Wand2 } from "lucide-react";

type LandingTemplateKey =
  | "classic"
  | "split"
  | "spotlight"
  | "bubble-shark"
  | "noir-edge"
  | "fresh-deck"
  | "halo-glass"
  | "atlas-pro"
  | "mono-grid"
  | "epoxy-strata";

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
};

const MAX_LANDING_SERVICES = 10;
type PreviewViewport = "desktop" | "tablet" | "mobile";

const TEMPLATE_OPTIONS: Array<{ key: LandingTemplateKey; label: string; description: string }> = [
  { key: "classic",     label: "Classic",     description: "Clean hero with side quote form." },
  { key: "split",       label: "Split",       description: "Bold split layout for high-contrast branding." },
  { key: "spotlight",   label: "Spotlight",   description: "Centered hero with focused quote card." },
  { key: "bubble-shark",label: "Bubble Shark",description: "Playful animated style with bold sections." },
  { key: "noir-edge",   label: "Noir Edge",   description: "Dark luxury editorial with numbered services and neon accent." },
  { key: "fresh-deck",  label: "Fresh Deck",  description: "Warm bold maximalist with oversized type and card grid." },
  { key: "halo-glass",  label: "Halo Glass",  description: "Luminous glassmorphism with layered gradients and soft cards." },
  { key: "atlas-pro",   label: "Atlas Pro",   description: "Corporate premium with stat highlights and crisp hierarchy." },
  { key: "mono-grid",   label: "Mono Grid",   description: "Minimal monochrome editorial with clean blocks and strong type." },
  { key: "epoxy-strata",label: "Epoxy Strata",description: "Industrial epoxy/coatings style with bold proof bars and system cards." },
];

const PREVIEW_VIEWPORT_OPTIONS: Array<{ key: PreviewViewport; label: string; maxWidthClass: string }> = [
  { key: "desktop", label: "Desktop", maxWidthClass: "max-w-[1280px]" },
  { key: "tablet", label: "Tablet", maxWidthClass: "max-w-[820px]" },
  { key: "mobile", label: "Mobile", maxWidthClass: "max-w-[420px]" },
];

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

  return next;
}

function normalizeServices(services: unknown): Array<{ serviceId: number; name: string; enabled: boolean; sortOrder: number; imageUrl?: string | null }> {
  if (!Array.isArray(services)) {
    return [];
  }

  const normalized = services
    .map((service, idx) => ({
      serviceId: Number((service as any)?.serviceId),
      name: typeof (service as any)?.name === "string" && (service as any).name.trim() ? (service as any).name.trim() : "Service",
      enabled: Boolean((service as any)?.enabled),
      sortOrder: Number.isFinite(Number((service as any)?.sortOrder)) ? Number((service as any).sortOrder) : idx,
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
    page.templateKey === "split" ||
    page.templateKey === "spotlight" ||
    page.templateKey === "bubble-shark" ||
    page.templateKey === "noir-edge" ||
    page.templateKey === "fresh-deck" ||
    page.templateKey === "halo-glass" ||
    page.templateKey === "atlas-pro" ||
    page.templateKey === "mono-grid" ||
    page.templateKey === "epoxy-strata"
      ? page.templateKey
      : "classic";

  return {
    ...page,
    templateKey,
    theme: sanitizeLandingTheme(page.theme),
    services: normalizeServices(page.services),
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
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("mobile");
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
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
          patch.templateKey === "split" ||
          patch.templateKey === "spotlight" ||
          patch.templateKey === "bubble-shark" ||
          patch.templateKey === "classic" ||
          patch.templateKey === "noir-edge" ||
          patch.templateKey === "fresh-deck" ||
          patch.templateKey === "halo-glass" ||
          patch.templateKey === "atlas-pro" ||
          patch.templateKey === "mono-grid"
            ? patch.templateKey
            : "classic";
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
      templateKey: (draft.templateKey as any) || "classic",
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

  const previewMaxWidthClass = useMemo(
    () => PREVIEW_VIEWPORT_OPTIONS.find((option) => option.key === previewViewport)?.maxWidthClass || "max-w-[1280px]",
    [previewViewport],
  );
  const livePath = draft?.slug ? `/l/${draft.slug}` : "";
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
          <h1 className="text-xl font-semibold text-gray-900">Unable to load landing page</h1>
          <p className="text-sm text-gray-500">{(error as any)?.message || "Please try again."}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!draft) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Landing page not ready yet</h1>
          <p className="text-sm text-gray-500">We’re setting up your landing page. Please refresh in a moment.</p>
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentTheme = sanitizeLandingTheme(draft.theme);
  const templateLabel = TEMPLATE_OPTIONS.find((template) => template.key === draft.templateKey)?.label || "Classic";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Card className="mb-6 border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={statusColor}>{statusLabel}</Badge>
                <Badge variant="outline" className="border-slate-200 bg-white/80 text-slate-600">
                  <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" />
                  {templateLabel}
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-white/80 text-slate-600">
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  {enabledServices.length} services enabled
                </Badge>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Landing Page Builder</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Build a public landing page with the same dashboard styling patterns used across the app.
                  Pick a template, tune branding, and connect the pricing form tied to this account.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Button variant="outline" onClick={openLivePage} disabled={!livePath} className="bg-white">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live Landing Page
              </Button>
              <Button variant="outline" onClick={() => setFullPreviewOpen(true)} className="bg-white">
                <Eye className="mr-2 h-4 w-4" />
                Full Screen Preview
              </Button>
              <Button
                variant="outline"
                className="bg-white"
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
                <Button onClick={() => publishMutation.mutate()} disabled={!canPublish}>
                  Publish
                </Button>
              ) : (
                <Button variant="outline" onClick={() => unpublishMutation.mutate()} className="bg-white">
                  Unpublish
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Page Status</CardTitle>
              <CardDescription>Publishing requirements and current editor state.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span>Autosave</span>
                <span className="font-medium text-slate-900">{saving ? "Saving..." : dirty ? "Unsaved changes" : "Up to date"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span>Calculator</span>
                <span className="font-medium text-slate-900">{calculatorConnected ? "Connected" : "Needs attention"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span>URL</span>
                <span className="truncate pl-3 font-medium text-slate-900">{livePath || "Not ready yet"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Preview Controls</CardTitle>
              <CardDescription>Switch between the three responsive breakpoints while editing.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              {PREVIEW_VIEWPORT_OPTIONS.map((option) => {
                const Icon = option.key === "desktop" ? Monitor : option.key === "tablet" ? Tablet : Smartphone;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPreviewViewport(option.key)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      previewViewport === option.key
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="min-w-0">{renderEditor()}</div>
          <div className="min-w-0">{renderPreviewFrame()}</div>
        </div>

        <div className="lg:hidden">
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-4">{renderEditor()}</TabsContent>
            <TabsContent value="preview" className="mt-4">
              {renderPreviewFrame(true)}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={fullPreviewOpen} onOpenChange={setFullPreviewOpen}>
        <DialogContent className="h-[95vh] max-h-[95vh] w-[98vw] max-w-none overflow-hidden p-0">
          <div className="h-full min-h-0">{renderPreviewFrame(true, true)}</div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );

  function renderPreviewFrame(compact = false, fullScreen = false) {
    return (
      <Card
        className={`overflow-hidden border-slate-200 bg-white shadow-sm ${
          fullScreen ? "flex h-full min-h-0 flex-col" : compact ? "min-h-[520px]" : "sticky top-24"
        }`}
      >
        <CardHeader className="border-b border-slate-200 bg-slate-50/80 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold text-slate-900">Live Preview</CardTitle>
              <CardDescription>Responsive landing-page render inside the editor.</CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
              {previewViewport}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className={`${fullScreen ? "flex-1 min-h-0" : compact ? "h-[72vh]" : "h-[calc(100vh-14rem)] min-h-[640px]"} overflow-auto p-3 md:p-4`}>
          <div className={`mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${previewMaxWidthClass}`}>
            {previewData ? <LandingPageView data={previewData} isPreview previewViewport={previewViewport} /> : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderEditor() {
    if (!draft) return null;

    return (
      <div className="space-y-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Template & Colors</CardTitle>
            <CardDescription>Select a template and tune the landing-page palette.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="landing-template-picker">Template Picker</Label>
              <Select
                value={(draft.templateKey as LandingTemplateKey) || "classic"}
                onValueChange={(value) => updateDraft({ templateKey: value as any })}
              >
                <SelectTrigger id="landing-template-picker" data-testid="select-landing-template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((template) => (
                    <SelectItem key={template.key} value={template.key}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Pick a landing page layout, then fine tune with the color controls below.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TEMPLATE_OPTIONS.map((template) => {
                const active = draft.templateKey === template.key;
                return (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => updateDraft({ templateKey: template.key as any })}
                    className={`text-left rounded-md border p-3 transition ${active ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{template.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <div key={item.key}>
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

            <div className="space-y-2">
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

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateDraft({
                  theme: {
                    ...DEFAULT_THEME,
                    heroImageUrl: currentTheme.heroImageUrl,
                    showFaqSection: currentTheme.showFaqSection,
                  } as any,
                })
              }
            >
              Reset Colors
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Basics</CardTitle>
            <CardDescription>Business details, landing URL, and primary CTA copy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Landing Page URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">/l/</span>
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
              <p className="text-xs text-gray-500 mt-2">
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
                    className="h-16 w-auto rounded border p-1 bg-white"
                  />
                ) : (
                  <div className="text-xs text-gray-500">No logo uploaded yet.</div>
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
                <p className="text-xs text-gray-500">{logoUploading ? "Uploading logo..." : "PNG/JPG/WebP up to 10MB."}</p>
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
                    className="h-32 w-full rounded-lg border object-cover bg-white"
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-xs text-slate-500">
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
                <p className="text-xs text-gray-500">
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

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Trust Chips</CardTitle>
            <CardDescription>Short proof points used across the hero and support sections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Switch checked={Boolean((draft.trustChips as any[])?.[idx]?.enabled)} onCheckedChange={(checked) => updateTrustChip(idx, { enabled: checked })} />
                <Input value={(draft.trustChips as any[])?.[idx]?.label || ""} onChange={(e) => updateTrustChip(idx, { label: e.target.value })} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Services ({enabledServices.length}/{MAX_LANDING_SERVICES} enabled)</CardTitle>
              <Button size="sm" variant="outline" onClick={syncServicesFromFormulas}>
                Sync from Calculators
              </Button>
            </div>
            <CardDescription>Choose the services and imagery exposed on this page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formulas.map((formula) => {
              const service = normalizeServices(draft.services).find((s) => s.serviceId === formula.id);
              return (
                <div key={formula.id} className="border rounded-lg p-3 space-y-2">
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
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-28 object-cover rounded-md border"
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
                      <p className="text-xs text-gray-500">
                        {uploadingServiceId === formula.id ? "Uploading service image..." : "Optional image shown on landing service card."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-gray-500">Only enabled services appear on the landing page and selector embed. Max {MAX_LANDING_SERVICES}.</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Calculator Embed</CardTitle>
            <CardDescription>Set the default pricing form and selector behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <p className="text-xs text-gray-500">Embeds the service selector for chosen landing-page services.</p>
              </div>
              <Switch checked={Boolean(draft.enableMultiService)} onCheckedChange={(checked) => updateDraft({ enableMultiService: checked })} />
            </div>
            <div className="text-xs text-gray-500">Calculator connected: {calculatorConnected ? "Yes" : "No"}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">How It Works</CardTitle>
            <CardDescription>Three steps repeated through the public landing-page layout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="space-y-2">
                <Label>Step {idx + 1} Title</Label>
                <Input value={(draft.howItWorks as any[])?.[idx]?.title || ""} onChange={(e) => updateHowItWorks(idx, { title: e.target.value })} />
                <Label>Step {idx + 1} Body</Label>
                <Textarea value={(draft.howItWorks as any[])?.[idx]?.body || ""} onChange={(e) => updateHowItWorks(idx, { body: e.target.value })} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">FAQs</CardTitle>
                <CardDescription>Show a dedicated FAQ section for this template and fill it manually or with AI.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Switch
                    checked={Boolean(currentTheme.showFaqSection)}
                    onCheckedChange={(checked) =>
                      updateDraft({ theme: { ...currentTheme, showFaqSection: checked } as any })
                    }
                  />
                  <span className="text-sm font-medium text-slate-700">Show FAQ section</span>
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
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500">
              {currentTheme.showFaqSection
                ? "This FAQ section is enabled for the selected template."
                : "This FAQ section is hidden on the public landing page until you enable it."}
            </p>
            {((draft.faqs as any[]) || []).map((faq, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <Input value={faq.question} onChange={(e) => updateFaq(idx, { question: e.target.value })} placeholder="Question" />
                <Textarea value={faq.answer} onChange={(e) => updateFaq(idx, { answer: e.target.value })} placeholder="Answer" />
                <Button size="sm" variant="ghost" onClick={() => removeFaq(idx)}>
                  Remove
                </Button>
              </div>
            ))}
            {((draft.faqs as any[]) || []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No FAQs added yet. Add them manually or generate them with AI.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Contact</CardTitle>
            <CardDescription>Phone, email, and service-area information shown on the page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">SEO</CardTitle>
            <CardDescription>Metadata used for search snippets and page previews.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>SEO Title</Label>
              <Input value={draft.seoTitle || ""} onChange={(e) => updateDraft({ seoTitle: e.target.value })} />
              <p className="text-xs text-gray-500 mt-1">{(draft.seoTitle || "").length} / 60</p>
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea value={draft.seoDescription || ""} onChange={(e) => updateDraft({ seoDescription: e.target.value })} />
              <p className="text-xs text-gray-500 mt-1">{(draft.seoDescription || "").length} / 155</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{dirty ? "Unsaved" : "Saved"}</Badge>
              {saving && <span className="text-xs text-gray-500">Saving...</span>}
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
    templateKey: (draft.templateKey as any) || "classic",
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
    phone: draft.phone,
    email: draft.email,
    serviceAreaText: draft.serviceAreaText,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
  };
}
