import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import LandingPageView, { type LandingPagePublicData } from "@/components/landing-page-view";
import type { Formula, LandingPage } from "@shared/schema";

type LandingTemplateKey =
  | "classic"
  | "split"
  | "spotlight"
  | "bubble-shark"
  | "noir-edge"
  | "fresh-deck"
  | "halo-glass"
  | "atlas-pro"
  | "mono-grid";

type LandingTheme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  buttonTextColor: string;
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
};

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

  for (const key of Object.keys(DEFAULT_THEME) as Array<keyof LandingTheme>) {
    const candidate = (input as Record<string, unknown>)[key];
    if (isHexColor(candidate)) {
      next[key] = candidate.trim();
    }
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
    page.templateKey === "mono-grid"
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
  const [uploadingServiceId, setUploadingServiceId] = useState<number | null>(null);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const draftVersionRef = useRef(0);

  const { data: pageData, isLoading, isError, error, refetch } = useQuery<LandingPage>({
    queryKey: ["/api/landing-page/me"],
  });

  const { data: formulas = [] } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  useEffect(() => {
    if (pageData && !dirty) {
      setDraft(applyLandingDefaults(pageData));
    }
  }, [pageData, dirty]);

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

  const primaryFormula = formulas.find((f) => f.id === draft?.primaryServiceId);
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landing Page Builder</h1>
            <p className="text-sm text-gray-500">Choose a template, set colors, and embed up to 10 of your calculator services.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>{statusLabel}</span>
            <Button variant="outline" onClick={() => setFullPreviewOpen(true)}>
              Full Screen Preview
            </Button>
            {draft.status !== "published" ? (
              <Button onClick={() => publishMutation.mutate()} disabled={!canPublish}>
                Publish
              </Button>
            ) : (
              <Button variant="outline" onClick={() => unpublishMutation.mutate()}>
                Unpublish
              </Button>
            )}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-[1fr_440px] gap-6">
          {renderPreviewFrame()}
          <div className="space-y-4">{renderEditor()}</div>
        </div>

        <div className="lg:hidden">
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">{renderEditor()}</TabsContent>
            <TabsContent value="preview">
              {renderPreviewFrame(true)}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={fullPreviewOpen} onOpenChange={setFullPreviewOpen}>
        <DialogContent className="w-[98vw] max-w-none h-[95vh] max-h-[95vh] p-0 overflow-hidden">
          <div className="h-full min-h-0">{renderPreviewFrame(true, true)}</div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );

  function renderPreviewFrame(compact = false, fullScreen = false) {
    return (
      <div
        className={`rounded-xl border bg-slate-100/70 overflow-hidden ${
          fullScreen ? "h-full min-h-0 flex flex-col" : compact ? "h-[72vh] min-h-[520px]" : "h-[calc(100vh-7.5rem)] min-h-[640px]"
        }`}
      >
        <div className="border-b bg-white px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Live Render</p>
            <p className="text-xs text-gray-500">Responsive preview inside the editor.</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-1 overflow-x-auto">
            {PREVIEW_VIEWPORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setPreviewViewport(option.key)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                  previewViewport === option.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${fullScreen ? "flex-1 min-h-0" : "h-[calc(100%-54px)]"} overflow-auto p-3 md:p-4`}>
          <div className={`mx-auto rounded-xl border bg-white shadow-sm overflow-hidden w-full ${previewMaxWidthClass}`}>
            {previewData ? <LandingPageView data={previewData} isPreview previewViewport={previewViewport} /> : null}
          </div>
        </div>
      </div>
    );
  }

  function renderEditor() {
    if (!draft) return null;

    const isPublished = draft.status === "published";

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
      if (!draft.slug) return;

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

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Template & Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="landing-template-picker">Template Picker</Label>
              <select
                id="landing-template-picker"
                data-testid="select-landing-template"
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                value={(draft.templateKey as LandingTemplateKey) || "classic"}
                onChange={(e) => updateDraft({ templateKey: e.target.value as any })}
              >
                {TEMPLATE_OPTIONS.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.label}
                  </option>
                ))}
              </select>
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
              {[
                { key: "primaryColor", label: "Primary" },
                { key: "accentColor", label: "Accent" },
                { key: "backgroundColor", label: "Background" },
                { key: "surfaceColor", label: "Surface" },
                { key: "textColor", label: "Text" },
                { key: "mutedTextColor", label: "Muted Text" },
                { key: "buttonTextColor", label: "Button Text" },
              ].map((item) => (
                <div key={item.key}>
                  <Label className="text-xs">{item.label}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="color"
                      value={currentTheme[item.key as keyof LandingTheme]}
                      onChange={(e) => updateThemeColor(item.key as keyof LandingTheme, e.target.value)}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={currentTheme[item.key as keyof LandingTheme]}
                      onChange={(e) => updateThemeColor(item.key as keyof LandingTheme, e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => updateDraft({ theme: DEFAULT_THEME as any })}>
              Reset Colors
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
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
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={openLivePage}
                  disabled={!livePath}
                >
                  View Live Landing Page
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
              <Label>Primary CTA</Label>
              <Input value={draft.ctaLabel || ""} onChange={(e) => updateDraft({ ctaLabel: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trust Chips</CardTitle>
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Services ({enabledServices.length}/{MAX_LANDING_SERVICES} enabled)</CardTitle>
              <Button size="sm" variant="outline" onClick={syncServicesFromFormulas}>
                Sync from Calculators
              </Button>
            </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Calculator Embed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Primary Service *</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={draft.primaryServiceId || ""}
                onChange={(e) => updateDraft({ primaryServiceId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Select a service</option>
                {enabledServices.map((service) => (
                  <option key={service.serviceId} value={service.serviceId}>
                    {service.name}
                  </option>
                ))}
              </select>
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

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>FAQs</CardTitle>
              <Button size="sm" variant="outline" onClick={addFaq} disabled={((draft.faqs as any[]) || []).length >= 6}>
                Add FAQ
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {((draft.faqs as any[]) || []).map((faq, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <Input value={faq.question} onChange={(e) => updateFaq(idx, { question: e.target.value })} placeholder="Question" />
                <Textarea value={faq.answer} onChange={(e) => updateFaq(idx, { answer: e.target.value })} placeholder="Answer" />
                <Button size="sm" variant="ghost" onClick={() => removeFaq(idx)}>
                  Remove
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
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

        <Card>
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
