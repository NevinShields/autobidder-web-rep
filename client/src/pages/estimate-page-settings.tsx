import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Eye, FileIcon, Image as ImageIcon, Palette, Paperclip, Play, Layout, Building2, Upload, Trash2, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BusinessSettings } from "@shared/schema";

type EstimateAttachment = {
  url: string;
  name?: string;
  type: "image" | "pdf" | "file";
  category?: "terms" | "insurance" | "custom";
};

type EstimatePageSettings = {
  defaultLayoutId?: string;
  defaultTheme?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  defaultAttachments?: EstimateAttachment[];
  defaultShowBusinessLogo?: boolean;
  defaultLogoUrl?: string;
  defaultShowBusinessName?: boolean;
  defaultShowBusinessAddress?: boolean;
  defaultShowBusinessEmail?: boolean;
  defaultShowBusinessPhone?: boolean;
  defaultShowAcceptDecline?: boolean;
  defaultMessage?: string;
  defaultVideoUrl?: string;
  defaultShowVideo?: boolean;
  defaultIncludeAttachments?: boolean;
};

const defaultEstimatePageSettings: EstimatePageSettings = {
  defaultLayoutId: "classic",
  defaultTheme: {
    primaryColor: "#2563eb",
    accentColor: "#16a34a",
    backgroundColor: "#ffffff",
    textColor: "#111827",
  },
  defaultAttachments: [],
  defaultShowBusinessLogo: false,
  defaultLogoUrl: "",
  defaultShowBusinessName: false,
  defaultShowBusinessAddress: false,
  defaultShowBusinessEmail: false,
  defaultShowBusinessPhone: false,
  defaultShowAcceptDecline: true,
  defaultMessage: "",
  defaultVideoUrl: "",
  defaultShowVideo: true,
  defaultIncludeAttachments: true,
};

const attachmentSections = {
  terms: {
    label: "Terms & Conditions",
    description: "Attach the terms customers should review before approving.",
  },
  insurance: {
    label: "Insurance",
    description: "Provide proof of insurance or certification documents.",
  },
  custom: {
    label: "Custom Files",
    description: "Add any additional files and name them for customers.",
  },
} as const;

export default function EstimatePageSettings() {
  const [estimatePageSettings, setEstimatePageSettings] = useState<EstimatePageSettings>(defaultEstimatePageSettings);
  const [customAttachmentName, setCustomAttachmentName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: businessSettings, isLoading } = useQuery({
    queryKey: ["/api/business-settings"],
  });

  useEffect(() => {
    if (businessSettings) {
      const savedSettings = (businessSettings as any).estimatePageSettings || {};
      const normalizedAttachments = (savedSettings.defaultAttachments || []).map((attachment: EstimateAttachment) => ({
        ...attachment,
        category: attachment.category || "custom",
      }));
      setEstimatePageSettings({
        ...defaultEstimatePageSettings,
        ...savedSettings,
        defaultTheme: {
          ...defaultEstimatePageSettings.defaultTheme,
          ...savedSettings.defaultTheme,
        },
        defaultAttachments: normalizedAttachments,
      });
    }
  }, [businessSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { estimatePageSettings: EstimatePageSettings }) => {
      return apiRequest("PATCH", "/api/business-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      toast({
        title: "Settings Saved",
        description: "Your estimate page defaults have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error?.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate({
      estimatePageSettings,
    });
  };

  const getFileExtension = (fileName: string) => {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : "";
  };

  const getAttachmentType = (file: { type?: string; name?: string }) => {
    if (file.type?.startsWith("image/")) return "image";
    if (file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf")) return "pdf";
    return "file";
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    const loomMatch = url.match(/(?:loom\.com\/share\/)([a-zA-Z0-9]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }

    if (url.includes("embed") || url.endsWith(".mp4") || url.endsWith(".webm")) {
      return url;
    }

    return null;
  };

  const formatPreviewDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);

  const handleUploadComplete =
    (category: EstimateAttachment["category"], nameOverride?: string) =>
    async (result: any) => {
      const successfulUploads = result?.successful || [];
      if (successfulUploads.length === 0) {
        return;
      }

      const newAttachments: EstimateAttachment[] = [];

      for (const file of successfulUploads) {
        const objectPath = file.meta?.objectPath as string | undefined;
        if (!objectPath) {
          continue;
        }

        try {
          const response = await apiRequest("POST", "/api/objects/set-estimate-attachment-acl", {
            objectPath,
          });
          const data = await response.json();
          const normalizedPath = data?.objectPath || objectPath;

          newAttachments.push({
            url: normalizedPath,
            name: (nameOverride || file.name || "").trim() || undefined,
            type: getAttachmentType(file),
            category,
          });
        } catch (error: any) {
          toast({
            title: "Upload failed",
            description: error?.message || "Failed to finalize attachment upload.",
            variant: "destructive",
          });
        }
      }

      if (newAttachments.length > 0) {
        setEstimatePageSettings((prev) => ({
          ...prev,
          defaultAttachments: [...(prev.defaultAttachments || []), ...newAttachments],
        }));
        toast({ title: "Attachment uploaded" });
      }

      if (category === "custom") {
        setCustomAttachmentName("");
      }
    };

  const getUploadParameters = async (fileName: string) => {
    const fileExtension = getFileExtension(fileName);
    if (!fileExtension) {
      throw new Error("File extension is required.");
    }
    const response = await apiRequest("POST", "/api/objects/estimate-attachment-upload", {
      fileExtension,
    });
    const data = await response.json();
    return { method: "PUT" as const, url: data.uploadUrl as string, objectPath: data.objectPath as string };
  };

  const getLogoUploadParameters = async (fileName: string) => {
    const fileExtension = getFileExtension(fileName);
    if (!fileExtension) {
      throw new Error("File extension is required.");
    }
    const response = await apiRequest("POST", "/api/objects/estimate-attachment-upload", {
      fileExtension,
    });
    const data = await response.json();
    return { method: "PUT" as const, url: data.uploadUrl as string, objectPath: data.objectPath as string };
  };

  const previewTheme = {
    primaryColor: estimatePageSettings.defaultTheme?.primaryColor || "#2563eb",
    accentColor: estimatePageSettings.defaultTheme?.accentColor || "#16a34a",
    backgroundColor: estimatePageSettings.defaultTheme?.backgroundColor || "#ffffff",
    textColor: estimatePageSettings.defaultTheme?.textColor || "#111827",
  };

  const previewAttachments =
    estimatePageSettings.defaultIncludeAttachments === false
      ? []
      : estimatePageSettings.defaultAttachments || [];

  const previewEstimate = {
    estimateNumber: "EST-1024",
    customerName: "Alex Johnson",
    customerEmail: "alex@example.com",
    customerPhone: "(555) 555-1234",
    customerAddress: "123 Main St, Springfield",
    businessMessage: "Thanks for considering us. Here is a detailed estimate for your project.",
    createdAt: new Date(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    services: [
      { name: "Service A", description: "Primary service work", price: 12500 },
      { name: "Service B", description: "Optional add-on", price: 3500 },
    ],
  };
  const previewMessage =
    (estimatePageSettings.defaultMessage || "").trim() || previewEstimate.businessMessage;
  const previewSubtotal = previewEstimate.services.reduce((sum, service) => sum + service.price, 0);
  const previewTax = 0;
  const previewTotal = previewSubtotal + previewTax;
  const previewLayoutId = estimatePageSettings.defaultLayoutId || "classic";
  const previewIsMinimal = previewLayoutId === "minimal";
  const previewIsDetailed = previewLayoutId === "detailed";
  const previewCardClassName = previewIsMinimal || previewIsDetailed ? "shadow-sm border" : "shadow-lg";
  const previewHeaderClassName = previewIsMinimal || previewIsDetailed ? "border-b" : "border-b text-white";
  const previewHeaderStyle = previewIsMinimal
    ? { backgroundColor: previewTheme.backgroundColor, color: previewTheme.textColor }
    : previewIsDetailed
      ? { backgroundColor: previewTheme.backgroundColor, color: previewTheme.textColor, borderTop: `4px solid ${previewTheme.primaryColor}` }
      : { background: `linear-gradient(to right, ${previewTheme.primaryColor}, ${previewTheme.accentColor})` };
  const previewHeaderMutedClass = previewIsMinimal || previewIsDetailed ? "text-gray-500 dark:text-gray-400" : "text-white/80";
  const previewHeaderTitleClass = previewIsMinimal || previewIsDetailed ? "text-gray-900 dark:text-gray-100" : "text-white";
  const previewBusinessName = businessSettings?.businessName || "Your Business";
  const previewBusinessAddress = businessSettings?.businessAddress || "123 Business St, Springfield";
  const previewBusinessEmail = businessSettings?.businessEmail || "hello@yourbusiness.com";
  const previewBusinessPhone = businessSettings?.businessPhone || "(555) 555-0000";
  const previewShowBusinessLogo = estimatePageSettings.defaultShowBusinessLogo === true;
  const previewShowBusinessName = estimatePageSettings.defaultShowBusinessName === true;
  const previewShowBusinessAddress = estimatePageSettings.defaultShowBusinessAddress === true;
  const previewShowBusinessEmail = estimatePageSettings.defaultShowBusinessEmail === true;
  const previewShowBusinessPhone = estimatePageSettings.defaultShowBusinessPhone === true;
  const previewShowBusinessDetails =
    previewShowBusinessLogo ||
    previewShowBusinessName ||
    previewShowBusinessAddress ||
    previewShowBusinessEmail ||
    previewShowBusinessPhone;

  const attachmentAllowedFileTypes = ["image/*", "application/pdf", ".doc", ".docx"];
  const logoAllowedFileTypes = ["image/*"];

  const renderAttachmentList = (category: EstimateAttachment["category"]) => {
    const attachments = (estimatePageSettings.defaultAttachments || [])
      .map((attachment, index) => ({ attachment, index }))
      .filter(({ attachment }) => (attachment.category || "custom") === category);

    if (attachments.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400 italic px-2">No files added yet.</p>;
    }

    return (
      <div className="space-y-2">
        {attachments.map(({ attachment, index }) => (
          <div
            key={`${attachment.url}-${index}`}
            className="flex items-center justify-between border border-gray-200/60 dark:border-gray-700/40 rounded-xl p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0 text-blue-600">
                {attachment.type === "image" ? (
                  <ImageIcon className="h-5 w-5" />
                ) : (
                  <FileIcon className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {attachment.name || attachment.url.split('/').pop()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{attachment.type}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40"
              onClick={() =>
                setEstimatePageSettings((prev) => ({
                  ...prev,
                  defaultAttachments: (prev.defaultAttachments || []).filter(
                    (_, i) => i !== index
                  ),
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  const handleLogoUploadComplete = async (result: any) => {
    const successfulUploads = result?.successful || [];
    if (successfulUploads.length === 0) {
      return;
    }

    const file = successfulUploads[0];
    const objectPath = file.meta?.objectPath as string | undefined;
    if (!objectPath) {
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/objects/set-estimate-attachment-acl", {
        objectPath,
      });
      const data = await response.json();
      const normalizedPath = data?.objectPath || objectPath;
      setEstimatePageSettings((prev) => ({
        ...prev,
        defaultLogoUrl: normalizedPath,
        defaultShowBusinessLogo: true,
      }));
      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to finalize logo upload.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="animate-pulse rounded-2xl h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="animate-pulse rounded-2xl h-96 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
              <div className="animate-pulse rounded-2xl h-96 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes dash-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-stagger { animation: dash-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .dash-stagger-1 { animation-delay: 0ms; }
        .dash-stagger-2 { animation-delay: 60ms; }
        .dash-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 dash-grain min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Header */}
          <div className="dash-stagger dash-stagger-1 relative overflow-hidden rounded-2xl border border-blue-200/40 dark:border-blue-500/10 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/30 to-transparent dark:from-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600/70 dark:text-blue-400/60 font-semibold mb-2">Design Editor</p>
                <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Estimate Designer
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  Personalize the layout, branding, and standard attachments for every customer estimate.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 bg-white/50 backdrop-blur-sm border-white/20">
                      <Eye className="h-4 w-4 mr-2" />
                      Live Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
                    <DialogHeader className="p-6 border-b bg-white dark:bg-gray-900 flex-shrink-0">
                      <DialogTitle className="dark:text-gray-100" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Estimate Preview</DialogTitle>
                      <DialogDescription className="dark:text-gray-400">
                        This preview uses your current defaults and sample customer data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                      <div className={previewIsDetailed ? "grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] max-w-6xl mx-auto" : "space-y-6 max-w-4xl mx-auto"}>
                        <Card className={`${previewCardClassName} rounded-2xl border-gray-200/60 dark:border-gray-700/40 overflow-hidden`} style={{ backgroundColor: previewTheme.backgroundColor }}>
                          <CardHeader
                            className={`${previewHeaderClassName} dark:border-gray-700`}
                            style={previewHeaderStyle}
                          >
                            {previewIsDetailed ? (
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em] opacity-70">Detailed Estimate</p>
                                  <CardTitle className={`text-2xl font-bold mt-2 ${previewHeaderTitleClass}`} style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                                    Estimate #{previewEstimate.estimateNumber}
                                  </CardTitle>
                                  <p className="opacity-80">Prepared for {previewEstimate.customerName}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold">Confirmed Estimate</span>
                                  <span className="ml-2 text-sm opacity-70">Total</span>
                                  <span className="text-lg font-bold">{formatCurrency(previewTotal)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                  <CardTitle className={`text-3xl font-bold mb-2 ${previewHeaderTitleClass}`} style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                                    Professional Estimate
                                  </CardTitle>
                                  <p className={previewHeaderMutedClass}>
                                    Estimate #{previewEstimate.estimateNumber}
                                  </p>
                                </div>
                                <div className="text-left md:text-right text-sm">
                                  <p className={previewHeaderMutedClass}>Valid Until</p>
                                  <p className={`font-semibold ${previewHeaderTitleClass}`}>
                                    {formatPreviewDate(previewEstimate.validUntil)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </CardHeader>

                          <CardContent className={previewIsMinimal ? "p-6" : "p-8"}>
                            {previewShowBusinessDetails && (
                              <div className={`mb-8 ${previewIsDetailed ? "rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-900/50 p-6" : ""}`}>
                                <h3 className="text-lg font-bold mb-4" style={{ color: previewTheme.textColor, fontFamily: "'Instrument Serif', Georgia, serif" }}>
                                  Business Details
                                </h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                  {previewShowBusinessLogo && estimatePageSettings.defaultLogoUrl && (
                                    <img
                                      src={estimatePageSettings.defaultLogoUrl}
                                      alt={`${previewBusinessName} logo`}
                                      className="h-14 w-auto object-contain"
                                    />
                                  )}
                                  <div className="space-y-1 text-sm opacity-80" style={{ color: previewTheme.textColor }}>
                                    {previewShowBusinessName && (
                                      <div className="font-bold text-base">{previewBusinessName}</div>
                                    )}
                                    {previewShowBusinessAddress && <div>{previewBusinessAddress}</div>}
                                    {previewShowBusinessEmail && <div>{previewBusinessEmail}</div>}
                                    {previewShowBusinessPhone && <div>{previewBusinessPhone}</div>}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className={`mb-8 ${previewIsDetailed ? "rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-900/50 p-6" : ""}`}>
                              <h3 className="text-lg font-bold mb-4" style={{ color: previewTheme.textColor, fontFamily: "'Instrument Serif', Georgia, serif" }}>
                                Customer Information
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1">Name</p>
                                  <p className="font-medium">{previewEstimate.customerName}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1">Email</p>
                                  <p className="font-medium">{previewEstimate.customerEmail}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1">Phone</p>
                                  <p className="font-medium">{previewEstimate.customerPhone}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wider opacity-50 mb-1">Address</p>
                                  <p className="font-medium">{previewEstimate.customerAddress}</p>
                                </div>
                              </div>
                            </div>

                            {previewMessage && (
                              <div className={`mb-8 ${previewIsDetailed ? "rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-900/50 p-6" : ""}`}>
                                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Message</h3>
                                <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 p-5 rounded-2xl">
                                  <p className="leading-relaxed whitespace-pre-wrap text-sm" style={{ color: previewTheme.textColor }}>
                                    {previewMessage}
                                  </p>
                                </div>
                              </div>
                            )}

                            {previewAttachments.length > 0 && (
                              <div className={`mb-8 ${previewIsDetailed ? "rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-900/50 p-6" : ""}`}>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                                  <Paperclip className="w-5 h-5 text-blue-500" />
                                  Attachments
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {previewAttachments.map((attachment, index) => (
                                    <div
                                      key={`${attachment.url}-${index}`}
                                      className="flex items-center gap-3 p-3 border border-gray-200/60 dark:border-gray-700/40 rounded-xl bg-white dark:bg-gray-800"
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0">
                                        {attachment.type === "image" ? <ImageIcon className="w-5 h-5 text-blue-500" /> : <FileIcon className="w-5 h-5 text-blue-500" />}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{attachment.name || "Attachment"}</p>
                                        <p className="text-[10px] uppercase opacity-50 font-bold">{attachment.type}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className={`mb-8 ${previewIsDetailed ? "rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-900/50 p-6" : ""}`}>
                              <h3 className="text-lg font-bold mb-4" style={{ color: previewTheme.textColor, fontFamily: "'Instrument Serif', Georgia, serif" }}>
                                Services & Pricing
                              </h3>
                              <div className="space-y-3">
                                {previewEstimate.services.map((service, index) => (
                                  <div key={index} className="flex justify-between items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="min-w-0">
                                      <p className="font-bold" style={{ color: previewTheme.textColor }}>{service.name}</p>
                                      <p className="text-xs opacity-60 mt-0.5">{service.description}</p>
                                    </div>
                                    <p className="font-bold tabular-nums" style={{ color: previewTheme.textColor }}>{formatCurrency(service.price)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                              <div className="max-w-md ml-auto space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="opacity-60">Subtotal:</span>
                                  <span className="font-medium">{formatCurrency(previewSubtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold" style={{ color: previewTheme.textColor }}>
                                  <span>Total Amount:</span>
                                  <span className="tabular-nums">{formatCurrency(previewTotal)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                className="rounded-xl h-10 px-6 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 shadow-lg shadow-gray-900/10"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Designer Changes"}
              </Button>
            </div>
          </div>

          <div className="dash-stagger dash-stagger-2 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
              <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    <Layout className="h-5 w-5 text-blue-500" />
                    Layout & Visual Theme
                  </CardTitle>
                  <CardDescription>
                    Configure the structural layout and primary color scheme.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Layout Strategy</Label>
                    <Select
                      value={estimatePageSettings.defaultLayoutId || "classic"}
                      onValueChange={(value) =>
                        setEstimatePageSettings((prev) => ({ ...prev, defaultLayoutId: value }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700">
                        <SelectItem value="classic">Classic Modern</SelectItem>
                        <SelectItem value="minimal">Minimalist White</SelectItem>
                        <SelectItem value="detailed">Detailed Split-View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold">Color Palette</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {['primaryColor', 'accentColor', 'backgroundColor', 'textColor'].map((key) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                            {key.replace('Color', '').replace('default', '')}
                          </Label>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0" 
                              style={{ backgroundColor: (estimatePageSettings.defaultTheme as any)?.[key] || "#000" }}
                            />
                            <Input
                              type="color"
                              className="w-full h-10 p-1 cursor-pointer rounded-xl dark:bg-gray-900 dark:border-gray-700"
                              value={(estimatePageSettings.defaultTheme as any)?.[key] || "#000"}
                              onChange={(e) =>
                                setEstimatePageSettings((prev) => ({
                                  ...prev,
                                  defaultTheme: { ...prev.defaultTheme, [key]: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Default Global Message</Label>
                    <Textarea
                      value={estimatePageSettings.defaultMessage || ""}
                      onChange={(e) =>
                        setEstimatePageSettings((prev) => ({ ...prev, defaultMessage: e.target.value }))
                      }
                      placeholder="Add a consistent greeting or footer message..."
                      rows={4}
                      className="rounded-xl resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    <Building2 className="h-5 w-5 text-amber-500" />
                    Business Identity
                  </CardTitle>
                  <CardDescription>
                    Choose which brand assets appear on your estimates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gray-50/50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label className="text-base font-bold">Business Logo</Label>
                        <p className="text-xs text-gray-500">Enable brand visibility on top of every page.</p>
                      </div>
                      <Switch
                        checked={estimatePageSettings.defaultShowBusinessLogo === true}
                        onCheckedChange={(checked) =>
                          setEstimatePageSettings((prev) => ({ ...prev, defaultShowBusinessLogo: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="h-20 w-20 rounded-2xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden p-2">
                        {estimatePageSettings.defaultLogoUrl ? (
                          <img src={estimatePageSettings.defaultLogoUrl} className="max-h-full w-auto object-contain" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-300" />
                        )}
                      </div>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        allowedFileTypes={logoAllowedFileTypes}
                        onGetUploadParameters={(file) => getLogoUploadParameters(file.name)}
                        onComplete={handleLogoUploadComplete}
                      >
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-300 h-9">
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          Upload Logo
                        </Button>
                      </ObjectUploader>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Business Name", key: "defaultShowBusinessName" },
                      { label: "Full Address", key: "defaultShowBusinessAddress" },
                      { label: "Email Address", key: "defaultShowBusinessEmail" },
                      { label: "Phone Number", key: "defaultShowBusinessPhone" }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2 px-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        <Label className="text-xs font-bold">{item.label}</Label>
                        <Switch
                          checked={(estimatePageSettings as any)[item.key] === true}
                          onCheckedChange={(checked) =>
                            setEstimatePageSettings((prev) => ({ ...prev, [item.key]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    <Paperclip className="h-5 w-5 text-blue-500" />
                    Standard Attachments
                  </CardTitle>
                  <CardDescription>
                    Files automatically included with every new estimate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/40 flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-blue-900 dark:text-blue-100 font-bold">Default Attachments</Label>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                        Enable to auto-attach files to all new estimates.
                      </p>
                    </div>
                    <Switch
                      checked={estimatePageSettings.defaultIncludeAttachments !== false}
                      onCheckedChange={(checked) =>
                        setEstimatePageSettings((prev) => ({ ...prev, defaultIncludeAttachments: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-6">
                    {(["terms", "insurance", "custom"] as const).map((category) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{attachmentSections[category].label}</p>
                            <p className="text-xs text-gray-500">{attachmentSections[category].description}</p>
                          </div>
                          {category !== 'custom' && (
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              allowedFileTypes={attachmentAllowedFileTypes}
                              onGetUploadParameters={(file) => getUploadParameters(file.name)}
                              onComplete={handleUploadComplete(category)}
                            >
                              <Button variant="secondary" size="sm" className="rounded-xl h-8 px-3 text-[10px] uppercase font-bold tracking-widest bg-gray-100 hover:bg-gray-200">
                                <Upload className="h-3 w-3 mr-1.5" />
                                Upload
                              </Button>
                            </ObjectUploader>
                          )}
                        </div>
                        
                        {category === 'custom' && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="File name (e.g. Portfolio)"
                              value={customAttachmentName}
                              onChange={(e) => setCustomAttachmentName(e.target.value)}
                              className="h-9 rounded-xl text-xs bg-white dark:bg-gray-900"
                            />
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              allowedFileTypes={attachmentAllowedFileTypes}
                              onGetUploadParameters={(file) => getUploadParameters(file.name)}
                              onComplete={handleUploadComplete("custom", customAttachmentName)}
                              disabled={!customAttachmentName.trim()}
                            >
                              <Button variant="secondary" size="sm" className="rounded-xl h-9 px-4 text-xs font-bold" disabled={!customAttachmentName.trim()}>
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add
                              </Button>
                            </ObjectUploader>
                          </div>
                        )}
                        
                        {renderAttachmentList(category)}
                        <Separator className="last:hidden opacity-50" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    <Play className="h-5 w-5 text-red-500" />
                    Interactive Video
                  </CardTitle>
                  <CardDescription>
                    Add a personal touch with an embedded video greeting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">Enable Video Section</Label>
                    <Switch
                      checked={estimatePageSettings.defaultShowVideo !== false}
                      onCheckedChange={(checked) =>
                        setEstimatePageSettings((prev) => ({ ...prev, defaultShowVideo: checked }))
                      }
                    />
                  </div>
                  <div className={estimatePageSettings.defaultShowVideo === false ? 'opacity-40 pointer-events-none' : ''}>
                    <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1.5 block">Video URL</Label>
                    <Input
                      value={estimatePageSettings.defaultVideoUrl || ""}
                      onChange={(e) =>
                        setEstimatePageSettings((prev) => ({ ...prev, defaultVideoUrl: e.target.value }))
                      }
                      placeholder="YouTube, Loom, or Vimeo link..."
                      className="rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
