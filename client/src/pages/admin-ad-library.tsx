import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AdLibraryItemRecord } from "@/components/ad-library/ad-library-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Upload } from "lucide-react";

type AdminBrandingRequest = {
  id: number;
  businessName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  brandColors?: string[];
  notes?: string | null;
  internalNotes?: string | null;
  status: "draft" | "submitted" | "in_progress" | "completed" | "delivered";
  selectedCount: number;
  selectedItems: AdLibraryItemRecord[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    organizationName?: string | null;
    plan?: string | null;
  } | null;
};

type ItemFormState = {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  styleTags: string;
  serviceTags: string;
  tags: string;
  previewImageUrl: string;
  assetFileUrl: string;
  assetFileName: string;
  featured: boolean;
  active: boolean;
  downloadable: boolean;
  premiumOnly: boolean;
  customizable: boolean;
  sortOrder: number;
  internalNotes: string;
};

type AdLibraryItemMutationPayload = Omit<ItemFormState, "styleTags" | "serviceTags" | "tags"> & {
  styleTags: string[];
  serviceTags: string[];
  tags: string[];
};

type BulkImportFormState = {
  category: string;
  styleTags: string;
  serviceTags: string;
  tags: string;
  featured: boolean;
  active: boolean;
  downloadable: boolean;
  premiumOnly: boolean;
  customizable: boolean;
};

type BulkImportDraft = {
  key: string;
  title: string;
  previewFile: File | null;
  assetFile: File | null;
};

const initialFormState: ItemFormState = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  category: "",
  styleTags: "",
  serviceTags: "",
  tags: "",
  previewImageUrl: "",
  assetFileUrl: "",
  assetFileName: "",
  featured: false,
  active: true,
  downloadable: false,
  premiumOnly: false,
  customizable: false,
  sortOrder: 0,
  internalNotes: "",
};

const initialBulkImportState: BulkImportFormState = {
  category: "",
  styleTags: "",
  serviceTags: "",
  tags: "",
  featured: false,
  active: true,
  downloadable: true,
  premiumOnly: false,
  customizable: true,
};

function normalizeTagList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
}

function titleFromFilename(name: string) {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusBadgeClass(status: AdminBrandingRequest["status"]) {
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

async function uploadAdminAsset(file: File): Promise<{ url: string; originalName: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/admin/ad-library/upload-asset", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to upload asset");
  }
  return payload;
}

export default function AdminAdLibraryPage() {
  const { isSuperAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdLibraryItemRecord | null>(null);
  const [formState, setFormState] = useState<ItemFormState>(initialFormState);
  const [previewUploadFile, setPreviewUploadFile] = useState<File | null>(null);
  const [assetUploadFile, setAssetUploadFile] = useState<File | null>(null);
  const [bulkImportFiles, setBulkImportFiles] = useState<File[]>([]);
  const [bulkImportState, setBulkImportState] = useState<BulkImportFormState>(initialBulkImportState);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [requestNotes, setRequestNotes] = useState<Record<number, string>>({});
  const [requestStatuses, setRequestStatuses] = useState<Record<number, AdminBrandingRequest["status"]>>({});

  const { data: items = [], isLoading: itemsLoading } = useQuery<AdLibraryItemRecord[]>({
    queryKey: ["/api/admin/ad-library"],
    enabled: isSuperAdmin,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<AdminBrandingRequest[]>({
    queryKey: ["/api/admin/ad-library/requests"],
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: AdLibraryItemMutationPayload) => {
      const response = await apiRequest("POST", "/api/admin/ad-library", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-library"] });
      setDialogOpen(false);
      setEditingItem(null);
      setFormState(initialFormState);
      setPreviewUploadFile(null);
      setAssetUploadFile(null);
      toast({ title: "Ad created", description: "The new ad library item is live in admin." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create ad", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AdLibraryItemMutationPayload }) => {
      const response = await apiRequest("PATCH", `/api/admin/ad-library/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-library"] });
      setDialogOpen(false);
      setEditingItem(null);
      setFormState(initialFormState);
      setPreviewUploadFile(null);
      setAssetUploadFile(null);
      toast({ title: "Ad updated", description: "The ad library item was updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update ad", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/ad-library/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-library"] });
      toast({ title: "Ad removed", description: "The ad library item was deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete ad", description: error.message, variant: "destructive" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/ad-library/seed-sample");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-library"] });
      toast({ title: "Sample ads created", description: `${data.createdCount} sample items were added.` });
    },
    onError: (error: Error) => {
      toast({ title: "Seed failed", description: error.message, variant: "destructive" });
    },
  });

  const requestUpdateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: { status: AdminBrandingRequest["status"]; internalNotes: string } }) => {
      const response = await apiRequest("PATCH", `/api/admin/ad-library/requests/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-library/requests"] });
      toast({ title: "Request updated", description: "Branding request changes were saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update request", description: error.message, variant: "destructive" });
    },
  });

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(b.featured) - Number(a.featured) || (a.sortOrder || 0) - (b.sortOrder || 0)),
    [items]
  );

  const bulkImportDrafts = useMemo<BulkImportDraft[]>(() => {
    const grouped = new Map<string, { imageFiles: File[]; otherFiles: File[] }>();

    for (const file of bulkImportFiles) {
      const key = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
      const existing = grouped.get(key) || { imageFiles: [], otherFiles: [] };
      if (isImageFile(file)) {
        existing.imageFiles.push(file);
      } else {
        existing.otherFiles.push(file);
      }
      grouped.set(key, existing);
    }

    const drafts: BulkImportDraft[] = [];

    for (const [key, value] of grouped.entries()) {
      const previewFile = value.imageFiles[0] || null;
      const assetFile = value.otherFiles[0] || value.imageFiles[0] || null;
      if (!previewFile && !assetFile) {
        continue;
      }

      const sourceName = assetFile?.name || previewFile?.name || key;
      drafts.push({
        key,
        title: titleFromFilename(sourceName),
        previewFile,
        assetFile,
      });
    }

    return drafts.sort((a, b) => a.title.localeCompare(b.title));
  }, [bulkImportFiles]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormState(initialFormState);
    setPreviewUploadFile(null);
    setAssetUploadFile(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: AdLibraryItemRecord) => {
    setEditingItem(item);
    setFormState({
      title: item.title || "",
      slug: item.slug || "",
      shortDescription: item.shortDescription || "",
      fullDescription: item.fullDescription || "",
      category: item.category || "",
      styleTags: (item.styleTags || []).join(", "),
      serviceTags: (item.serviceTags || []).join(", "),
      tags: (item.tags || []).join(", "),
      previewImageUrl: item.previewImageUrl || "",
      assetFileUrl: item.assetFileUrl || "",
      assetFileName: item.assetFileName || "",
      featured: item.featured,
      active: item.active,
      downloadable: item.downloadable,
      premiumOnly: item.premiumOnly,
      customizable: item.customizable,
      sortOrder: item.sortOrder || 0,
      internalNotes: (item as any).internalNotes || "",
    });
    setPreviewUploadFile(null);
    setAssetUploadFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      let previewImageUrl = formState.previewImageUrl;
      let assetFileUrl = formState.assetFileUrl;
      let assetFileName = formState.assetFileName;

      if (previewUploadFile) {
        const result = await uploadAdminAsset(previewUploadFile);
        previewImageUrl = result.url;
      }

      if (assetUploadFile) {
        const result = await uploadAdminAsset(assetUploadFile);
        assetFileUrl = result.url;
        assetFileName = result.originalName;
      }

      const payload = {
        ...formState,
        previewImageUrl,
        assetFileUrl,
        assetFileName,
        styleTags: formState.styleTags.split(",").map((value) => value.trim()).filter(Boolean),
        serviceTags: formState.serviceTags.split(",").map((value) => value.trim()).filter(Boolean),
        tags: formState.tags.split(",").map((value) => value.trim()).filter(Boolean),
      };

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message || "Failed to upload asset", variant: "destructive" });
    }
  };

  const handleBulkImport = async () => {
    if (bulkImportDrafts.length === 0) {
      toast({
        title: "No importable ads found",
        description: "Choose a folder with image files or ad source files first.",
        variant: "destructive",
      });
      return;
    }

    setBulkImporting(true);

    try {
      let createdCount = 0;

      for (const [index, draft] of bulkImportDrafts.entries()) {
        let previewImageUrl = "";
        let assetFileUrl = "";
        let assetFileName = "";

        if (draft.previewFile) {
          const previewUpload = await uploadAdminAsset(draft.previewFile);
          previewImageUrl = previewUpload.url;
        }

        if (draft.assetFile) {
          const assetUpload = await uploadAdminAsset(draft.assetFile);
          assetFileUrl = assetUpload.url;
          assetFileName = assetUpload.originalName;
        }

        const payload: AdLibraryItemMutationPayload = {
          title: draft.title,
          slug: "",
          shortDescription: "",
          fullDescription: "",
          category: bulkImportState.category,
          styleTags: normalizeTagList(bulkImportState.styleTags),
          serviceTags: normalizeTagList(bulkImportState.serviceTags),
          tags: normalizeTagList(bulkImportState.tags),
          previewImageUrl,
          assetFileUrl,
          assetFileName,
          featured: bulkImportState.featured,
          active: bulkImportState.active,
          downloadable: bulkImportState.downloadable && Boolean(assetFileUrl),
          premiumOnly: bulkImportState.premiumOnly,
          customizable: bulkImportState.customizable,
          sortOrder: index,
          internalNotes: `Bulk imported on ${new Date().toISOString()}`,
        };

        await apiRequest("POST", "/api/admin/ad-library", payload);
        createdCount += 1;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-library"] });
      setBulkImportFiles([]);
      setBulkImportState(initialBulkImportState);
      toast({
        title: "Folder imported",
        description: `${createdCount} ad${createdCount === 1 ? "" : "s"} created from the selected folder.`,
      });
    } catch (error: any) {
      toast({
        title: "Bulk import failed",
        description: error?.message || "The folder could not be imported.",
        variant: "destructive",
      });
    } finally {
      setBulkImporting(false);
    }
  };

  if (!isLoading && !isSuperAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        <section className="rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98)_55%,_rgba(224,231,255,0.82))] p-8 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.98)_55%,_rgba(30,41,59,0.98))]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge className="border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Admin</Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">Ad Library Manager</h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Manage premium ad inventory, white-label downloads, and manual branding requests from one operational surface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                Seed Sample Ads
              </Button>
              <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Ad
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Bulk Import
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Upload an entire folder of ads</h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Choose a folder and Autobidder will group files by matching filename. Images become previews, and any matching non-image file is attached as the downloadable asset.
              </p>
            </div>
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              disabled={bulkImporting || bulkImportDrafts.length === 0}
              onClick={handleBulkImport}
            >
              <Upload className="mr-2 h-4 w-4" />
              {bulkImporting ? "Importing..." : `Import ${bulkImportDrafts.length || ""} Ads`}
            </Button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ad Folder</Label>
                <Input
                  type="file"
                  multiple
                  onChange={(event) => setBulkImportFiles(Array.from(event.target.files || []))}
                  {...({ webkitdirectory: "", directory: "" } as any)}
                />
                <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                  Example: `Summer House Wash Promo.png` plus `Summer House Wash Promo.psd` will import as one ad item.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Category</Label>
                  <Input
                    value={bulkImportState.category}
                    onChange={(event) => setBulkImportState((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Lead Generation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Tags</Label>
                  <Input
                    value={bulkImportState.tags}
                    onChange={(event) => setBulkImportState((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="Featured, Spring Campaign"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Style Tags</Label>
                  <Input
                    value={bulkImportState.styleTags}
                    onChange={(event) => setBulkImportState((current) => ({ ...current, styleTags: event.target.value }))}
                    placeholder="Modern, Bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Service Tags</Label>
                  <Input
                    value={bulkImportState.serviceTags}
                    onChange={(event) => setBulkImportState((current) => ({ ...current, serviceTags: event.target.value }))}
                    placeholder="Pressure Washing, House Washing"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { key: "featured", label: "Featured" },
                  { key: "active", label: "Active" },
                  { key: "downloadable", label: "Downloadable" },
                  { key: "premiumOnly", label: "Premium Only" },
                  { key: "customizable", label: "Customizable" },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
                  >
                    <span>{toggle.label}</span>
                    <input
                      type="checkbox"
                      checked={(bulkImportState as any)[toggle.key]}
                      onChange={(event) =>
                        setBulkImportState((current) => ({ ...current, [toggle.key]: event.target.checked }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Import Preview</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{bulkImportDrafts.length} items detected</div>
              </div>

              {bulkImportDrafts.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                  No files selected yet. Choose a folder to preview the ads that will be created.
                </div>
              ) : (
                <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {bulkImportDrafts.map((draft) => (
                    <div
                      key={draft.key}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{draft.title}</div>
                      <div className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                        Preview: {draft.previewFile?.name || "None"}<br />
                        Asset: {draft.assetFile?.name || "None"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
            <TabsTrigger value="items" className="rounded-xl">Library Items</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-xl">Branding Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-5">
            {itemsLoading ? (
              <Card className="rounded-[24px] border border-slate-200/70 bg-white/95 dark:border-slate-800 dark:bg-slate-950/80">
                <CardContent className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading ad inventory...</CardContent>
              </Card>
            ) : sortedItems.length === 0 ? (
              <Card className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-950/60">
                <CardContent className="p-8 text-center text-sm leading-7 text-slate-500 dark:text-slate-400">
                  No ad library items yet. Add your first ad or seed sample content for local testing.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {sortedItems.map((item) => (
                  <Card key={item.id} className="rounded-[24px] border border-slate-200/70 bg-white/95 dark:border-slate-800 dark:bg-slate-950/80">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.slug}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.featured && <Badge>Featured</Badge>}
                          {!item.active && <Badge variant="outline">Inactive</Badge>}
                          {item.premiumOnly && <Badge variant="outline">Paid</Badge>}
                          {item.downloadable && <Badge variant="outline">Downloadable</Badge>}
                          {item.customizable && <Badge variant="outline">Customizable</Badge>}
                        </div>
                      </div>

                      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.shortDescription || "No short description yet."}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {[...(item.serviceTags || []), ...(item.styleTags || []), ...(item.tags || [])].slice(0, 6).map((tag) => (
                          <span key={`${item.id}-${tag}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Downloads: <span className="font-semibold text-slate-900 dark:text-white">{item.downloadCount || 0}</span>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => openEditDialog(item)}>Edit</Button>
                          <Button variant="outline" className="text-red-600 hover:text-red-600" onClick={() => deleteMutation.mutate(item.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <Card className="rounded-[24px] border border-slate-200/70 bg-white/95 dark:border-slate-800 dark:bg-slate-950/80">
                <CardContent className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading branding requests...</CardContent>
              </Card>
            ) : requests.length === 0 ? (
              <Card className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-950/60">
                <CardContent className="p-8 text-center text-sm leading-7 text-slate-500 dark:text-slate-400">
                  No branding requests have been submitted yet.
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card key={request.id} className="rounded-[24px] border border-slate-200/70 bg-white/95 dark:border-slate-800 dark:bg-slate-950/80">
                  <CardContent className="space-y-5 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-slate-950 dark:text-white">
                          {request.user?.organizationName || request.businessName || "Branding Request"} #{request.id}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {(request.user?.firstName || "")} {(request.user?.lastName || "")} • {request.user?.email || request.email || "No email"} • Plan: {request.user?.plan || "unknown"}
                        </div>
                      </div>
                      <Badge className={statusBadgeClass(request.status)}>{request.status.replace("_", " ")}</Badge>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          Selected ads ({request.selectedCount})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {request.selectedItems.map((item) => (
                            <span key={`${request.id}-${item.id}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                              {item.title}
                            </span>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                          <div><span className="font-medium text-slate-900 dark:text-white">Business:</span> {request.businessName || "Not provided"}</div>
                          <div><span className="font-medium text-slate-900 dark:text-white">Phone:</span> {request.phoneNumber || "Not provided"}</div>
                          <div><span className="font-medium text-slate-900 dark:text-white">Website:</span> {request.website || "Not provided"}</div>
                          <div><span className="font-medium text-slate-900 dark:text-white">Brand colors:</span> {(request.brandColors || []).join(", ") || "Not provided"}</div>
                          <div><span className="font-medium text-slate-900 dark:text-white">Notes:</span> {request.notes || "None"}</div>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={requestStatuses[request.id] || request.status}
                            onValueChange={(value: AdminBrandingRequest["status"]) =>
                              setRequestStatuses((current) => ({ ...current, [request.id]: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Internal Notes</Label>
                          <Textarea
                            value={requestNotes[request.id] ?? request.internalNotes ?? ""}
                            onChange={(event) => setRequestNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                            className="min-h-[120px]"
                          />
                        </div>

                        <Button
                          className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                          onClick={() => requestUpdateMutation.mutate({
                            id: request.id,
                            payload: {
                              status: requestStatuses[request.id] || request.status,
                              internalNotes: requestNotes[request.id] ?? request.internalNotes ?? "",
                            },
                          })}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Request Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white sm:max-w-4xl dark:border-slate-800 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Ad Library Item" : "Create Ad Library Item"}</DialogTitle>
            <DialogDescription>
              Manage premium availability, download access, customization eligibility, and creative metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={formState.slug} onChange={(event) => setFormState((current) => ({ ...current, slug: event.target.value }))} placeholder="auto-from-title" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea value={formState.shortDescription} onChange={(event) => setFormState((current) => ({ ...current, shortDescription: event.target.value }))} className="min-h-[96px]" />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea value={formState.fullDescription} onChange={(event) => setFormState((current) => ({ ...current, fullDescription: event.target.value }))} className="min-h-[140px]" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={formState.category} onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={formState.sortOrder} onChange={(event) => setFormState((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Style Tags</Label>
                <Input value={formState.styleTags} onChange={(event) => setFormState((current) => ({ ...current, styleTags: event.target.value }))} placeholder="Modern, Bold, Glassmorphism" />
              </div>

              <div className="space-y-2">
                <Label>Service Tags</Label>
                <Input value={formState.serviceTags} onChange={(event) => setFormState((current) => ({ ...current, serviceTags: event.target.value }))} placeholder="Pressure Washing, House Washing" />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={formState.tags} onChange={(event) => setFormState((current) => ({ ...current, tags: event.target.value }))} placeholder="Featured, Free Download" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preview Image URL</Label>
                <Input value={formState.previewImageUrl} onChange={(event) => setFormState((current) => ({ ...current, previewImageUrl: event.target.value }))} />
                <div className="flex items-center gap-3">
                  <Input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(event) => setPreviewUploadFile(event.target.files?.[0] || null)} />
                  <Upload className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Downloadable Asset URL</Label>
                <Input value={formState.assetFileUrl} onChange={(event) => setFormState((current) => ({ ...current, assetFileUrl: event.target.value }))} />
                <div className="flex items-center gap-3">
                  <Input type="file" onChange={(event) => setAssetUploadFile(event.target.files?.[0] || null)} />
                  <Upload className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asset File Name</Label>
                <Input value={formState.assetFileName} onChange={(event) => setFormState((current) => ({ ...current, assetFileName: event.target.value }))} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "featured", label: "Featured" },
                  { key: "active", label: "Active" },
                  { key: "downloadable", label: "Downloadable" },
                  { key: "premiumOnly", label: "Premium Only" },
                  { key: "customizable", label: "Customizable" },
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                    <span>{toggle.label}</span>
                    <input
                      type="checkbox"
                      checked={(formState as any)[toggle.key]}
                      onChange={(event) => setFormState((current) => ({ ...current, [toggle.key]: event.target.checked }))}
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea value={formState.internalNotes} onChange={(event) => setFormState((current) => ({ ...current, internalNotes: event.target.value }))} className="min-h-[130px]" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900" onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              {editingItem ? "Save Changes" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
