import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AdLibraryCard, type AdLibraryItemRecord } from "@/components/ad-library/ad-library-card";
import { AdLibraryFilters } from "@/components/ad-library/ad-library-filters";
import { AdLibraryDetailDialog } from "@/components/ad-library/ad-library-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Crown, Download, ImagePlus, Lock, SearchX, Send, Sparkles } from "lucide-react";

type LibraryResponse = {
  items: AdLibraryItemRecord[];
  filters: {
    categories: string[];
    styleTags: string[];
    serviceTags: string[];
  };
  access: {
    canCustomize: boolean;
    canAccessPremium: boolean;
    maxSelections: number;
    plan: string;
  };
};

type BrandingRequest = {
  id: number;
  businessName?: string | null;
  logoUrl?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  brandColors?: string[];
  notes?: string | null;
  status: "draft" | "submitted" | "in_progress" | "completed" | "delivered";
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  selectedCount: number;
  selectedItems: AdLibraryItemRecord[];
};

type BrandingFormState = {
  businessName: string;
  phoneNumber: string;
  email: string;
  website: string;
  brandColors: string;
  notes: string;
  logoUrl: string;
};

const initialFormState: BrandingFormState = {
  businessName: "",
  phoneNumber: "",
  email: "",
  website: "",
  brandColors: "",
  notes: "",
  logoUrl: "",
};

function statusBadgeClass(status: BrandingRequest["status"]) {
  switch (status) {
    case "draft":
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
    case "submitted":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "delivered":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300";
  }
}

async function uploadLogoFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to upload logo");
  }
  return payload.url;
}

export default function AdLibraryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const defaultsHydratedRef = useRef(false);
  const draftHydratedIdRef = useRef<number | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [styleTag, setStyleTag] = useState("");
  const [serviceTag, setServiceTag] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("featured");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeItem, setActiveItem] = useState<AdLibraryItemRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [brandingForm, setBrandingForm] = useState<BrandingFormState>(initialFormState);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: libraryData, isLoading } = useQuery<LibraryResponse>({
    queryKey: ["/api/ad-library"],
  });

  const { data: requests = [] } = useQuery<BrandingRequest[]>({
    queryKey: ["/api/ad-library/requests"],
  });

  const { data: businessSettings } = useQuery<any>({
    queryKey: ["/api/business-settings"],
  });

  useEffect(() => {
    const draft = requests.find((request) => request.status === "draft");
    if (draft && draftHydratedIdRef.current !== draft.id) {
      setBrandingForm({
        businessName: draft.businessName || businessSettings?.businessName || (user as any)?.organizationName || "",
        phoneNumber: draft.phoneNumber || businessSettings?.businessPhone || "",
        email: draft.email || businessSettings?.businessEmail || (user as any)?.email || "",
        website: draft.website || (user as any)?.businessInfo?.website || "",
        brandColors: draft.brandColors?.join(", ") || [
          businessSettings?.styling?.primaryColor,
          businessSettings?.styling?.accentColor,
        ].filter(Boolean).join(", "),
        notes: draft.notes || "",
        logoUrl: draft.logoUrl || businessSettings?.blogLogoUrl || "",
      });
      setSelectedIds(draft.selectedItems?.map((item) => item.id) || []);
      draftHydratedIdRef.current = draft.id;
      defaultsHydratedRef.current = true;
      return;
    }

    if (defaultsHydratedRef.current || (!user && !businessSettings)) {
      return;
    }

    setBrandingForm({
      businessName: businessSettings?.businessName || (user as any)?.organizationName || "",
      phoneNumber: businessSettings?.businessPhone || "",
      email: businessSettings?.businessEmail || (user as any)?.email || "",
      website: (user as any)?.businessInfo?.website || "",
      brandColors: [
        businessSettings?.styling?.primaryColor,
        businessSettings?.styling?.accentColor,
      ].filter(Boolean).join(", "),
      notes: "",
      logoUrl: businessSettings?.blogLogoUrl || "",
    });
    defaultsHydratedRef.current = true;
  }, [businessSettings, requests, user]);

  const items = libraryData?.items || [];
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchText = search.trim().toLowerCase();
      const matchesSearch = !searchText || [
        item.title,
        item.shortDescription,
        item.fullDescription,
        item.category,
        ...(item.styleTags || []),
        ...(item.serviceTags || []),
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText));

      const matchesCategory = !category || item.category === category;
      const matchesStyle = !styleTag || (item.styleTags || []).includes(styleTag);
      const matchesService = !serviceTag || (item.serviceTags || []).includes(serviceTag);
      const matchesAvailability =
        !availability ||
        (availability === "free" && !item.premiumOnly) ||
        (availability === "premium" && item.premiumOnly) ||
        (availability === "downloadable" && item.downloadable) ||
        (availability === "customizable" && item.customizable);

      return matchesSearch && matchesCategory && matchesStyle && matchesService && matchesAvailability;
    }).sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === "most_popular") {
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      }
      return Number(b.featured) - Number(a.featured) || (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  }, [availability, category, items, search, serviceTag, sort, styleTag]);

  const selectedItems = useMemo(
    () => selectedIds
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean) as AdLibraryItemRecord[],
    [items, selectedIds]
  );

  const latestDraft = requests.find((request) => request.status === "draft") || null;
  const canCustomize = libraryData?.access?.canCustomize || false;
  const maxSelections = libraryData?.access?.maxSelections || 10;

  const downloadMutation = useMutation({
    mutationFn: async (item: AdLibraryItemRecord) => {
      const response = await apiRequest("POST", `/api/ad-library/${item.id}/download`);
      return response.json();
    },
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.fileUrl;
      link.download = data.fileName || "ad-asset";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      queryClient.invalidateQueries({ queryKey: ["/api/ad-library"] });
      toast({ title: "Download started", description: "Your ad asset is ready to use." });
    },
    onError: (error: Error) => {
      toast({ title: "Download unavailable", description: error.message, variant: "destructive" });
    },
  });

  const requestMutation = useMutation({
    mutationFn: async ({ status }: { status: "draft" | "submitted" }) => {
      let logoUrl = brandingForm.logoUrl || null;
      if (logoFile) {
        logoUrl = await uploadLogoFile(logoFile);
      }

      const response = await apiRequest("POST", "/api/ad-library/requests", {
        requestId: latestDraft?.id,
        adIds: selectedIds,
        businessName: brandingForm.businessName,
        logoUrl,
        phoneNumber: brandingForm.phoneNumber,
        email: brandingForm.email,
        website: brandingForm.website,
        brandColors: brandingForm.brandColors.split(",").map((color) => color.trim()).filter(Boolean),
        notes: brandingForm.notes,
        status,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-library/requests"] });
      setLogoFile(null);
      if (variables.status === "submitted") {
        setReviewOpen(false);
        setSelectedIds([]);
        toast({
          title: "Branding request submitted",
          description: "Your selected ads were sent to the Autobidder team for manual customization.",
        });
      } else {
        toast({ title: "Draft saved", description: "Your branding selections were saved as a draft." });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
    },
  });

  const openDetails = (item: AdLibraryItemRecord) => {
    setActiveItem(item);
    setDetailOpen(true);
  };

  const handleToggleSelect = (item: AdLibraryItemRecord) => {
    if (!canCustomize) {
      setLocation("/upgrade");
      return;
    }

    setSelectedIds((current) => {
      if (current.includes(item.id)) {
        return current.filter((id) => id !== item.id);
      }

      if (current.length >= maxSelections) {
        toast({
          title: "Selection limit reached",
          description: `You can select up to ${maxSelections} ads per branding request.`,
          variant: "destructive",
        });
        return current;
      }

      return [...current, item.id];
    });
  };

  const emptyState = !isLoading && filteredItems.length === 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98)_55%,_rgba(239,246,255,0.98))] p-8 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.32)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(135deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.98)_55%,_rgba(12,74,110,0.82))]">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
            <div className="space-y-5">
              <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                White-label ads for pressure washing marketing
              </Badge>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">Ad Library</h1>
                <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                  Download ready-to-use graphics in minutes, or choose your favorite concepts and let the Autobidder team customize them with your branding.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {canCustomize ? (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                    Choose up to {maxSelections} ads for custom branding
                  </div>
                ) : (
                  <Button onClick={() => setLocation("/upgrade")} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to choose 10 for custom branding
                  </Button>
                )}
              </div>
            </div>

            <Card className="rounded-[28px] border border-white/70 bg-white/75 shadow-none dark:border-slate-800 dark:bg-slate-950/60">
              <CardContent className="space-y-4 p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">What you get</div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-7 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Download white-label ads instantly when they are unlocked for your plan.
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm leading-7 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                  Select favorites and submit your branding request for manual customization.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  Your request history stays visible here so you always know what is draft, submitted, in progress, or delivered.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <AdLibraryFilters
          search={search}
          category={category}
          styleTag={styleTag}
          serviceTag={serviceTag}
          availability={availability}
          sort={sort}
          options={libraryData?.filters || { categories: [], styleTags: [], serviceTags: [] }}
          onChange={(next) => {
            if (next.search !== undefined) setSearch(next.search);
            if (next.category !== undefined) setCategory(next.category);
            if (next.styleTag !== undefined) setStyleTag(next.styleTag);
            if (next.serviceTag !== undefined) setServiceTag(next.serviceTag);
            if (next.availability !== undefined) setAvailability(next.availability);
            if (next.sort !== undefined) setSort(next.sort);
          }}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                    <div className="aspect-[5/4] animate-pulse bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-3 p-5">
                      <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : emptyState ? (
              <Card className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-950/60">
                <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-900">
                    <SearchX className="h-8 w-8 text-slate-500 dark:text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xl font-semibold text-slate-950 dark:text-white">No ads match these filters</div>
                    <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                      Try broadening your search or clearing a few filters to see more campaign-ready graphics.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setSearch("");
                    setCategory("");
                    setStyleTag("");
                    setServiceTag("");
                    setAvailability("");
                    setSort("featured");
                  }}>
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {filteredItems.map((item) => (
                  <AdLibraryCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    canCustomize={canCustomize}
                    onView={openDetails}
                    onToggleSelect={handleToggleSelect}
                    onDownload={(selectedItem) => downloadMutation.mutate(selectedItem)}
                    onUpgrade={() => setLocation("/upgrade")}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-6 rounded-[28px] border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-950 dark:text-white">Selected for Branding</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedIds.length} of {maxSelections} selected
                    </div>
                  </div>
                  <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    {selectedIds.length}/{maxSelections}
                  </div>
                </div>

                {canCustomize ? (
                  <>
                    {selectedItems.length > 0 ? (
                      <div className="space-y-3">
                        {selectedItems.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                              <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.category || "Ad concept"}</div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleToggleSelect(item)}>Remove</Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                        Select your favorite ads and submit your branding request when you are ready.
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={selectedItems.length === 0 || requestMutation.isPending}
                        onClick={() => requestMutation.mutate({ status: "draft" })}
                      >
                        Save Draft
                      </Button>
                      <Button
                        className="flex-1 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                        disabled={selectedItems.length === 0}
                        onClick={() => setReviewOpen(true)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit Branding Request
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-7 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      Upgrade to choose up to 10 ads we’ll customize with your logo, contact details, and brand colors.
                    </div>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500" onClick={() => setLocation("/upgrade")}>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Access
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Branding Request History</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Track drafts, submitted requests, and completed deliveries.</p>
            </div>
          </div>

          {requests.length === 0 ? (
            <Card className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-950/60">
              <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-900">
                  <ImagePlus className="h-8 w-8 text-slate-500 dark:text-slate-300" />
                </div>
                <div className="text-xl font-semibold text-slate-950 dark:text-white">No branding requests yet</div>
                <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Select a few ad concepts, review your branding details, and submit your first customization request here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {requests.map((request) => (
                <Card key={request.id} className="rounded-[24px] border border-slate-200/70 bg-white/95 dark:border-slate-800 dark:bg-slate-950/80">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-slate-950 dark:text-white">
                          {request.businessName || "Branding Request"} #{request.id}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {request.selectedCount} ad{request.selectedCount === 1 ? "" : "s"} selected
                        </div>
                      </div>
                      <Badge className={statusBadgeClass(request.status)}>{request.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {request.selectedItems.map((item) => (
                        <span key={`${request.id}-${item.id}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {item.title}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {request.status === "draft"
                        ? "Draft saved. You can keep refining the selection before submitting."
                        : request.status === "submitted"
                        ? "Submitted successfully. The Autobidder team will prepare your branded versions manually."
                        : request.status === "in_progress"
                        ? "Your selected ads are currently being customized."
                        : request.status === "completed"
                        ? "The customization work is complete and ready for delivery review."
                        : "Delivered. Your branded assets are ready."}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <AdLibraryDetailDialog
        item={activeItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        selected={!!activeItem && selectedIds.includes(activeItem.id)}
        canCustomize={canCustomize}
        onToggleSelect={handleToggleSelect}
        onDownload={(item) => downloadMutation.mutate(item)}
        onUpgrade={() => setLocation("/upgrade")}
      />

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white sm:max-w-3xl dark:border-slate-800 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tight text-slate-950 dark:text-white">Review Branding Request</DialogTitle>
            <DialogDescription className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              Confirm your selected ads and branding details before submission.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Selected Ads</div>
              {selectedItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.shortDescription || item.category || "Ad concept"}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={brandingForm.businessName} onChange={(event) => setBrandingForm((current) => ({ ...current, businessName: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={brandingForm.phoneNumber} onChange={(event) => setBrandingForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={brandingForm.email} onChange={(event) => setBrandingForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={brandingForm.website} onChange={(event) => setBrandingForm((current) => ({ ...current, website: event.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brand Colors</Label>
                <Input
                  value={brandingForm.brandColors}
                  onChange={(event) => setBrandingForm((current) => ({ ...current, brandColors: event.target.value }))}
                  placeholder="#2563EB, #F59E0B, #0F172A"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <Input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} />
                {brandingForm.logoUrl && !logoFile && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">Using saved logo on file.</div>
                )}
                {logoFile && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">New logo selected: {logoFile.name}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={brandingForm.notes}
                  onChange={(event) => setBrandingForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Share offers, tone, local market details, or any brand preferences."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:justify-between">
            <Button variant="outline" disabled={requestMutation.isPending} onClick={() => requestMutation.mutate({ status: "draft" })}>
              Save Draft
            </Button>
            <Button
              disabled={requestMutation.isPending || selectedItems.length === 0}
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              onClick={() => requestMutation.mutate({ status: "submitted" })}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {requestMutation.isPending ? "Submitting..." : "Submit Branding Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
