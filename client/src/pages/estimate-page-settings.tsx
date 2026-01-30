import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Eye, FileIcon, Image as ImageIcon, Palette, Paperclip, Play } from "lucide-react";
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
        title: "Estimate page defaults saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save estimate page defaults",
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

  const getPreviewAttachmentsForCategory = (category: EstimateAttachment["category"]) =>
    previewAttachments.filter((attachment) => (attachment.category || "custom") === category);

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
  const previewHeaderMutedClass = previewIsMinimal || previewIsDetailed ? "text-gray-500" : "text-white/80";
  const previewHeaderTitleClass = previewIsMinimal || previewIsDetailed ? "text-gray-900" : "text-white";
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
      return <p className="text-sm text-gray-500">No files added yet.</p>;
    }

    return (
      <div className="space-y-2">
        {attachments.map(({ attachment, index }) => (
          <div
            key={`${attachment.url}-${index}`}
            className="flex items-center justify-between border rounded-md p-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                {attachment.type === "image" ? (
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <FileIcon className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.name || attachment.url}
                </p>
                <p className="text-xs text-gray-500 uppercase">{attachment.type}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setEstimatePageSettings((prev) => ({
                  ...prev,
                  defaultAttachments: (prev.defaultAttachments || []).filter(
                    (_, i) => i !== index
                  ),
                }))
              }
            >
              Remove
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
      toast({ title: "Logo uploaded" });
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
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <div>Loading settings...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Palette className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Estimate Page Editor</h1>
                <p className="text-gray-600 mt-1">Set your default layout, colors, and attachments.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview Estimate Page
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Layout & Theme Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="estimate-layout-default">Layout Preset</Label>
                  <Select
                    value={estimatePageSettings.defaultLayoutId || "classic"}
                    onValueChange={(value) =>
                      setEstimatePageSettings((prev) => ({ ...prev, defaultLayoutId: value }))
                    }
                  >
                    <SelectTrigger id="estimate-layout-default">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={estimatePageSettings.defaultTheme?.primaryColor || "#2563eb"}
                    onChange={(e) =>
                      setEstimatePageSettings((prev) => ({
                        ...prev,
                        defaultTheme: { ...prev.defaultTheme, primaryColor: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <Input
                    type="color"
                    value={estimatePageSettings.defaultTheme?.accentColor || "#16a34a"}
                    onChange={(e) =>
                      setEstimatePageSettings((prev) => ({
                        ...prev,
                        defaultTheme: { ...prev.defaultTheme, accentColor: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={estimatePageSettings.defaultTheme?.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      setEstimatePageSettings((prev) => ({
                        ...prev,
                        defaultTheme: { ...prev.defaultTheme, backgroundColor: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={estimatePageSettings.defaultTheme?.textColor || "#111827"}
                    onChange={(e) =>
                      setEstimatePageSettings((prev) => ({
                        ...prev,
                        defaultTheme: { ...prev.defaultTheme, textColor: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estimate-default-message">Default Message</Label>
                <Textarea
                  id="estimate-default-message"
                  value={estimatePageSettings.defaultMessage || ""}
                  onChange={(e) =>
                    setEstimatePageSettings((prev) => ({ ...prev, defaultMessage: e.target.value }))
                  }
                  placeholder="Add a message that appears on every estimate..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <Label htmlFor="estimate-show-logo" className="text-sm font-medium">
                      Show Logo
                    </Label>
                    <p className="text-sm text-gray-500">Display your logo on the estimate.</p>
                  </div>
                  <Switch
                    id="estimate-show-logo"
                    checked={estimatePageSettings.defaultShowBusinessLogo === true}
                    onCheckedChange={(checked) =>
                      setEstimatePageSettings((prev) => ({ ...prev, defaultShowBusinessLogo: checked }))
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label>Logo File</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      allowedFileTypes={logoAllowedFileTypes}
                      onGetUploadParameters={(file) => getLogoUploadParameters(file.name)}
                      onComplete={handleLogoUploadComplete}
                      buttonClassName="whitespace-nowrap"
                    >
                      <span className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Upload Logo
                      </span>
                    </ObjectUploader>
                    {estimatePageSettings.defaultLogoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEstimatePageSettings((prev) => ({
                            ...prev,
                            defaultLogoUrl: "",
                            defaultShowBusinessLogo: false,
                          }))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {estimatePageSettings.defaultLogoUrl && (
                    <div className="flex items-center gap-3">
                      <img
                        src={estimatePageSettings.defaultLogoUrl}
                        alt="Business logo"
                        className="h-12 w-auto object-contain"
                      />
                      <span className="text-xs text-gray-500">Logo uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="estimate-show-name" className="text-sm font-medium">
                    Show Business Name
                  </Label>
                  <Switch
                    id="estimate-show-name"
                    checked={estimatePageSettings.defaultShowBusinessName === true}
                    onCheckedChange={(checked) =>
                      setEstimatePageSettings((prev) => ({ ...prev, defaultShowBusinessName: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="estimate-show-address" className="text-sm font-medium">
                    Show Address
                  </Label>
                  <Switch
                    id="estimate-show-address"
                    checked={estimatePageSettings.defaultShowBusinessAddress === true}
                    onCheckedChange={(checked) =>
                      setEstimatePageSettings((prev) => ({ ...prev, defaultShowBusinessAddress: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="estimate-show-email" className="text-sm font-medium">
                    Show Email
                  </Label>
                  <Switch
                    id="estimate-show-email"
                    checked={estimatePageSettings.defaultShowBusinessEmail === true}
                    onCheckedChange={(checked) =>
                      setEstimatePageSettings((prev) => ({ ...prev, defaultShowBusinessEmail: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="estimate-show-phone" className="text-sm font-medium">
                    Show Phone
                  </Label>
                  <Switch
                    id="estimate-show-phone"
                    checked={estimatePageSettings.defaultShowBusinessPhone === true}
                    onCheckedChange={(checked) =>
                      setEstimatePageSettings((prev) => ({ ...prev, defaultShowBusinessPhone: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="estimate-attachments-default">Include Default Attachments</Label>
                  <p className="text-sm text-gray-500">
                    Attach these by default when sending a confirmed estimate.
                  </p>
                </div>
                <Switch
                  id="estimate-attachments-default"
                  checked={estimatePageSettings.defaultIncludeAttachments !== false}
                  onCheckedChange={(checked) =>
                    setEstimatePageSettings((prev) => ({ ...prev, defaultIncludeAttachments: checked }))
                  }
                  className="flex-shrink-0 self-start sm:self-auto"
                />
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{attachmentSections.terms.label}</p>
                      <p className="text-sm text-gray-500">{attachmentSections.terms.description}</p>
                    </div>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      allowedFileTypes={attachmentAllowedFileTypes}
                      onGetUploadParameters={(file) => getUploadParameters(file.name)}
                      onComplete={handleUploadComplete("terms")}
                      buttonClassName="whitespace-nowrap"
                    >
                      <span className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Upload Terms
                      </span>
                    </ObjectUploader>
                  </div>
                  {renderAttachmentList("terms")}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{attachmentSections.insurance.label}</p>
                      <p className="text-sm text-gray-500">{attachmentSections.insurance.description}</p>
                    </div>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      allowedFileTypes={attachmentAllowedFileTypes}
                      onGetUploadParameters={(file) => getUploadParameters(file.name)}
                      onComplete={handleUploadComplete("insurance")}
                      buttonClassName="whitespace-nowrap"
                    >
                      <span className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Upload Insurance
                      </span>
                    </ObjectUploader>
                  </div>
                  {renderAttachmentList("insurance")}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{attachmentSections.custom.label}</p>
                      <p className="text-sm text-gray-500">{attachmentSections.custom.description}</p>
                    </div>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      allowedFileTypes={attachmentAllowedFileTypes}
                      onGetUploadParameters={(file) => getUploadParameters(file.name)}
                      onComplete={handleUploadComplete("custom", customAttachmentName)}
                      buttonClassName="whitespace-nowrap"
                      disabled={!customAttachmentName.trim()}
                    >
                      <span className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Upload Custom File
                      </span>
                    </ObjectUploader>
                  </div>
                  <div>
                    <Label htmlFor="custom-attachment-name">Custom file name</Label>
                    <Input
                      id="custom-attachment-name"
                      placeholder="Enter a display name"
                      value={customAttachmentName}
                      onChange={(e) => setCustomAttachmentName(e.target.value)}
                    />
                  </div>
                  {renderAttachmentList("custom")}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="estimate-video-toggle" className="text-sm font-medium">
                      Show Default Video
                    </Label>
                    <p className="text-sm text-gray-500">Toggle whether the video appears on new estimates.</p>
                  </div>
                  <Switch
                    id="estimate-video-toggle"
                    checked={estimatePageSettings.defaultShowVideo !== false}
                    onCheckedChange={(checked) =>
                      setEstimatePageSettings((prev) => ({ ...prev, defaultShowVideo: checked }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="estimate-video-default">Default Video Link</Label>
                  <Input
                    id="estimate-video-default"
                    value={estimatePageSettings.defaultVideoUrl || ""}
                    onChange={(e) =>
                      setEstimatePageSettings((prev) => ({ ...prev, defaultVideoUrl: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              className="px-8"
            >
              {saveSettingsMutation.isPending ? "Saving..." : "Save Defaults"}
            </Button>
          </div>

          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Estimate Page Preview</DialogTitle>
                <DialogDescription>
                  This preview uses your current defaults and sample data.
                </DialogDescription>
              </DialogHeader>

              <div className={previewIsDetailed ? "grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : "space-y-6"}>
                <Card className={previewCardClassName} style={{ backgroundColor: previewTheme.backgroundColor }}>
                  <CardHeader
                    className={previewHeaderClassName}
                    style={previewHeaderStyle}
                  >
                    {previewIsDetailed ? (
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Detailed Estimate</p>
                          <CardTitle className={`text-2xl font-bold mt-2 ${previewHeaderTitleClass}`}>
                            Estimate #{previewEstimate.estimateNumber}
                          </CardTitle>
                          <p className="text-gray-600">Prepared for {previewEstimate.customerName}</p>
                          <p className="text-gray-500 text-sm mt-2">Layout: {previewLayoutId}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Draft</span>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Confirmed Estimate</span>
                          <span className="ml-2 text-sm text-gray-500">Total</span>
                          <span className="text-lg font-semibold text-gray-900">{formatCurrency(previewTotal)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <CardTitle className={`text-2xl font-bold mb-2 ${previewHeaderTitleClass}`}>
                            Professional Estimate
                          </CardTitle>
                          <p className={previewHeaderMutedClass}>
                            Estimate #{previewEstimate.estimateNumber}
                          </p>
                          <p className={`${previewHeaderMutedClass} mt-2 text-sm`}>
                            Layout: {previewLayoutId}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className={previewHeaderMutedClass}>Issue Date</p>
                          <p className={`font-semibold ${previewHeaderTitleClass}`}>
                            {formatPreviewDate(previewEstimate.createdAt)}
                          </p>
                          <p className={`${previewHeaderMutedClass} mt-2`}>Valid Until</p>
                          <p className={`font-semibold ${previewHeaderTitleClass}`}>
                            {formatPreviewDate(previewEstimate.validUntil)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardHeader>

                <CardContent className={previewIsMinimal ? "p-6" : "p-8"}>
                    {previewShowBusinessDetails && (
                      <div className={`mb-8 ${previewIsDetailed ? "rounded-xl border border-slate-200 bg-white p-5" : ""}`}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: previewTheme.textColor }}>
                          Business Details
                        </h3>
                        <div className={previewIsDetailed ? "bg-transparent p-0" : "bg-gray-50 rounded-lg p-4"}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {previewShowBusinessLogo && estimatePageSettings.defaultLogoUrl && (
                              <img
                                src={estimatePageSettings.defaultLogoUrl}
                                alt={`${previewBusinessName} logo`}
                                className="h-12 w-auto object-contain"
                              />
                            )}
                            <div className="space-y-1 text-sm text-gray-700">
                              {previewShowBusinessName && (
                                <div className="font-semibold text-gray-900">{previewBusinessName}</div>
                              )}
                              {previewShowBusinessAddress && <div>{previewBusinessAddress}</div>}
                              {previewShowBusinessEmail && <div>{previewBusinessEmail}</div>}
                              {previewShowBusinessPhone && <div>{previewBusinessPhone}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={`mb-8 ${previewIsDetailed ? "rounded-xl border border-slate-200 bg-white p-5" : ""}`}>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: previewTheme.textColor }}>
                        Customer Information
                      </h3>
                      <div className={previewIsDetailed ? "bg-transparent p-0" : "bg-gray-50 rounded-lg p-4"}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium text-gray-900">{previewEstimate.customerName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{previewEstimate.customerEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{previewEstimate.customerPhone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium text-gray-900">{previewEstimate.customerAddress}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {previewMessage && (
                      <div className={`mb-8 ${previewIsDetailed ? "rounded-xl border border-slate-200 bg-white p-5" : ""}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Message</h3>
                        <div
                          className={
                            previewIsMinimal
                              ? "border border-gray-200 p-4 rounded-lg"
                              : previewIsDetailed
                                ? "rounded-lg border border-slate-200 bg-slate-50 p-4"
                                : "bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg"
                          }
                        >
                          <p className="leading-relaxed whitespace-pre-wrap" style={{ color: previewTheme.textColor }}>
                            {previewMessage}
                          </p>
                        </div>
                      </div>
                    )}

                    {estimatePageSettings.defaultShowVideo !== false &&
                      estimatePageSettings.defaultVideoUrl &&
                      getVideoEmbedUrl(estimatePageSettings.defaultVideoUrl) && (
                      <div className={`mb-8 ${previewIsDetailed ? "rounded-xl border border-slate-200 bg-white p-5" : ""}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Play className="w-5 h-5" style={{ color: previewTheme.primaryColor }} />
                          Video
                        </h3>
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-slate-200">
                          <iframe
                            src={getVideoEmbedUrl(estimatePageSettings.defaultVideoUrl)!}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Estimate Video Preview"
                          />
                        </div>
                      </div>
                    )}

                    {previewAttachments.length > 0 && (
                      <div className={`mb-8 ${previewIsDetailed ? "rounded-xl border border-slate-200 bg-white p-5" : ""}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Paperclip className="w-5 h-5" style={{ color: previewTheme.primaryColor }} />
                          Attachments
                        </h3>
                        <div className="space-y-4">
                          {(["terms", "insurance", "custom"] as const).map((category) => {
                            const categoryAttachments = getPreviewAttachmentsForCategory(category);
                            if (categoryAttachments.length === 0) return null;
                            return (
                              <div key={category} className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">
                                  {attachmentSections[category].label}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {categoryAttachments.map((attachment, index) => (
                                    <div
                                      key={`${attachment.url}-${index}`}
                                      className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                                    >
                                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        {attachment.type === "image" ? (
                                          <ImageIcon className="w-5 h-5 text-gray-500" />
                                        ) : (
                                          <FileIcon className="w-5 h-5 text-gray-500" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {attachment.name || "Attachment"}
                                        </p>
                                        <p className="text-xs text-gray-500 uppercase">{attachment.type}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className={`mb-8 ${previewIsDetailed ? "rounded-xl border border-slate-200 bg-white p-5" : ""}`}>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: previewTheme.textColor }}>
                        Services & Pricing
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                                Service
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                                Description
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-900">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewEstimate.services.map((service, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-200 px-4 py-3">
                                  <div className="font-medium text-gray-900">{service.name}</div>
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-gray-700">
                                  {service.description}
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-900">
                                  {formatCurrency(service.price)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {!previewIsDetailed && (
                      <>
                        <div className="border-t pt-6">
                          <div className="max-w-md ml-auto">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{formatCurrency(previewSubtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Tax:</span>
                                <span className="font-medium">{formatCurrency(previewTax)}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                                <span>Total:</span>
                                <span>{formatCurrency(previewTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t text-center text-gray-600">
                          <p className="text-sm">
                            This estimate is valid until {formatPreviewDate(previewEstimate.validUntil)}.
                          </p>
                          <p className="text-sm mt-2">
                            Thank you for choosing our services. We look forward to working with you!
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                {previewIsDetailed && (
                  <div className="space-y-6">
                    <Card className="shadow-sm border" style={{ backgroundColor: previewTheme.backgroundColor }}>
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="font-semibold text-gray-900">Draft</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Estimate Number</p>
                          <p className="font-semibold text-gray-900">{previewEstimate.estimateNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Issued</p>
                          <p className="font-semibold text-gray-900">{formatPreviewDate(previewEstimate.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valid Until</p>
                          <p className="font-semibold text-gray-900">{formatPreviewDate(previewEstimate.validUntil)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border" style={{ backgroundColor: previewTheme.backgroundColor }}>
                      <CardHeader>
                        <CardTitle className="text-lg">Line Items</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {previewEstimate.services.map((service, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{service.name}</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(service.price)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border" style={{ backgroundColor: previewTheme.backgroundColor }}>
                      <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border-t pt-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">{formatCurrency(previewSubtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Tax:</span>
                              <span className="font-medium">{formatCurrency(previewTax)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                              <span>Total:</span>
                              <span>{formatCurrency(previewTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
