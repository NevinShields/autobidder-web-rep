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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import LandingPageView, { type LandingPagePublicData } from "@/components/landing-page-view";
import type { Formula, LandingPage } from "@shared/schema";

export default function LandingPageEditorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<LandingPage | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: pageData, isLoading, isError, error, refetch } = useQuery<LandingPage>({
    queryKey: ["/api/landing-page/me"],
  });

  const { data: formulas = [] } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  useEffect(() => {
    if (pageData) {
      setDraft(pageData);
      setDirty(false);
    }
  }, [pageData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<LandingPage>) => {
      const response = await apiRequest("PATCH", "/api/landing-page/me", payload);
      return response.json();
    },
    onSuccess: (data: LandingPage) => {
      setDraft(data);
      setDirty(false);
      setSaving(false);
      queryClient.invalidateQueries({ queryKey: ["/api/landing-page/me"] });
    },
    onError: (error: any) => {
      setSaving(false);
      toast({
        title: "Save failed",
        description: error.message || "Unable to save landing page",
        variant: "destructive",
      });
    }
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
    onError: (error: any) => {
      toast({
        title: "Publish failed",
        description: error.message || "Unable to publish",
        variant: "destructive",
      });
    }
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
    onError: (error: any) => {
      toast({
        title: "Unpublish failed",
        description: error.message || "Unable to unpublish",
        variant: "destructive",
      });
    }
  });

  const saveMutateRef = useRef(saveMutation.mutate);
  saveMutateRef.current = saveMutation.mutate;

  useEffect(() => {
    if (!dirty || !draft) return;
    setSaving(true);
    const timer = setTimeout(() => {
      const payload = buildPayload(draft);
      saveMutateRef.current(payload);
    }, 800);
    return () => clearTimeout(timer);
  }, [dirty, draft]);

  const updateDraft = (patch: Partial<LandingPage>) => {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  };

  const syncServicesFromFormulas = () => {
    if (!draft) return;
    const services = formulas.map((f, idx) => ({
      serviceId: f.id,
      name: f.name || f.title || "Service",
      enabled: true,
      sortOrder: idx,
    }));
    updateDraft({ services });
  };

  const toggleService = (formula: Formula) => {
    if (!draft) return;
    const services = (draft.services as any[] | null) || [];
    const idx = services.findIndex(s => s.serviceId === formula.id);
    if (idx >= 0) {
      const updated = [...services];
      updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
      updateDraft({ services: updated });
    } else {
      updateDraft({
        services: [
          ...services,
          { serviceId: formula.id, name: formula.name || formula.title || "Service", enabled: true, sortOrder: services.length }
        ]
      });
    }
  };

  const updateServiceName = (serviceId: number, name: string) => {
    if (!draft) return;
    const services = ((draft.services as any[]) || []).map(s =>
      s.serviceId === serviceId ? { ...s, name } : s
    );
    updateDraft({ services });
  };

  const moveService = (serviceId: number, direction: "up" | "down") => {
    if (!draft) return;
    const services = ((draft.services as any[]) || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
    const index = services.findIndex(s => s.serviceId === serviceId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;
    const [item] = services.splice(index, 1);
    services.splice(targetIndex, 0, item);
    const reordered = services.map((s, idx) => ({ ...s, sortOrder: idx }));
    updateDraft({ services: reordered });
  };

  const updateTrustChip = (index: number, patch: { label?: string; enabled?: boolean }) => {
    if (!draft) return;
    const chips = (draft.trustChips as any[]) || [
      { label: "Licensed & Insured", enabled: true },
      { label: "Same-Day Quotes", enabled: true },
      { label: "Top-Rated Service", enabled: true },
    ];
    const next = chips.slice(0, 3).map((chip, i) => i === index ? { ...chip, ...patch } : chip);
    updateDraft({ trustChips: next });
  };

  const updateHowItWorks = (index: number, patch: { title?: string; body?: string }) => {
    if (!draft) return;
    const steps = (draft.howItWorks as any[]) || [
      { title: "Tell us about your project", body: "Answer a few quick questions so we can tailor your quote." },
      { title: "Get instant pricing", body: "Use our calculator to see transparent, upfront estimates." },
      { title: "Schedule your service", body: "Pick a time that works best for you and we’ll take it from there." },
    ];
    const next = steps.slice(0, 3).map((step, i) => i === index ? { ...step, ...patch } : step);
    updateDraft({ howItWorks: next });
  };

  const addFaq = () => {
    if (!draft) return;
    const faqs = (draft.faqs as any[]) || [];
    if (faqs.length >= 6) return;
    updateDraft({ faqs: [...faqs, { question: "", answer: "" }] });
  };

  const updateFaq = (index: number, patch: { question?: string; answer?: string }) => {
    if (!draft) return;
    const faqs = ((draft.faqs as any[]) || []).map((faq, i) => i === index ? { ...faq, ...patch } : faq);
    updateDraft({ faqs });
  };

  const removeFaq = (index: number) => {
    if (!draft) return;
    const faqs = ((draft.faqs as any[]) || []).filter((_, i) => i !== index);
    updateDraft({ faqs });
  };

  const statusLabel = draft?.status === "published" ? "Published" : "Draft";
  const statusColor = draft?.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600";

  const primaryFormula = formulas.find(f => f.id === draft?.primaryServiceId);
  const calculatorConnected = Boolean(primaryFormula?.embedId && primaryFormula.isActive);
  const enabledServices = ((draft?.services as any[]) || []).filter(s => s.enabled);
  const canPublish = Boolean(draft?.businessName && enabledServices.length > 0 && draft?.primaryServiceId && calculatorConnected);

  const previewData = useMemo<LandingPagePublicData | null>(() => {
    if (!draft) return null;
    return {
      id: draft.id,
      userId: draft.userId,
      slug: draft.slug,
      businessName: draft.businessName || null,
      logoUrl: draft.logoUrl || null,
      tagline: draft.tagline || null,
      ctaLabel: draft.ctaLabel || null,
      trustChips: (draft.trustChips as any[]) || null,
      services: (draft.services as any[]) || null,
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Free Landing Page</h1>
            <p className="text-sm text-gray-500">Customize your Autoblogger landing page for directory leads.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </span>
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

        <div className="hidden lg:grid grid-cols-[1fr_420px] gap-6">
          <div className="rounded-xl overflow-hidden border bg-white">
            {previewData && <LandingPageView data={previewData} isPreview />}
          </div>
          <div className="space-y-4">
            {renderEditor()}
          </div>
        </div>

        <div className="lg:hidden">
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              {renderEditor()}
            </TabsContent>
            <TabsContent value="preview">
              <div className="rounded-xl overflow-hidden border bg-white">
                {previewData && <LandingPageView data={previewData} isPreview />}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );

  function renderEditor() {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Landing Page URL</Label>
              <Input value={`/l/${draft.slug}`} readOnly />
            </div>
            <div>
              <Label>Business Name *</Label>
              <Input value={draft.businessName || ""} onChange={(e) => updateDraft({ businessName: e.target.value })} />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={draft.logoUrl || ""} onChange={(e) => updateDraft({ logoUrl: e.target.value })} placeholder="https://" />
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
                <Switch
                  checked={Boolean((draft.trustChips as any[])?.[idx]?.enabled)}
                  onCheckedChange={(checked) => updateTrustChip(idx, { enabled: checked })}
                />
                <Input
                  value={(draft.trustChips as any[])?.[idx]?.label || ""}
                  onChange={(e) => updateTrustChip(idx, { label: e.target.value })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Services</CardTitle>
              <Button size="sm" variant="outline" onClick={syncServicesFromFormulas}>
                Sync from Calculators
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {formulas.map((formula) => {
              const service = ((draft.services as any[]) || []).find(s => s.serviceId === formula.id);
              return (
                <div key={formula.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={Boolean(service?.enabled)}
                        onCheckedChange={() => toggleService(formula)}
                      />
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
                    <Input
                      value={service.name}
                      onChange={(e) => updateServiceName(formula.id, e.target.value)}
                      placeholder="Service display name"
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calculator</CardTitle>
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
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>{formula.name || formula.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Multi-Service Selector</Label>
                <p className="text-xs text-gray-500">Allows visitors to choose multiple services</p>
              </div>
              <Switch
                checked={Boolean(draft.enableMultiService)}
                onCheckedChange={(checked) => updateDraft({ enableMultiService: checked })}
              />
            </div>
            <div className="text-xs text-gray-500">
              Calculator connected: {calculatorConnected ? "Yes" : "No"}
            </div>
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
                <Button size="sm" variant="ghost" onClick={() => removeFaq(idx)}>Remove</Button>
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
                saveMutation.mutate(buildPayload(draft));
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
    businessName: draft.businessName,
    logoUrl: draft.logoUrl,
    tagline: draft.tagline,
    ctaLabel: draft.ctaLabel,
    trustChips: draft.trustChips,
    services: draft.services,
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
