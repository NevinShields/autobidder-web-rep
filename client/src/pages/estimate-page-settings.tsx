import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BusinessSettings } from "@shared/schema";

type EstimateAttachment = {
  url: string;
  name?: string;
  type: "image" | "pdf";
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
  defaultVideoUrl?: string;
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
  defaultVideoUrl: "",
  defaultIncludeAttachments: true,
};

export default function EstimatePageSettings() {
  const [estimatePageSettings, setEstimatePageSettings] = useState<EstimatePageSettings>(defaultEstimatePageSettings);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentType, setNewAttachmentType] = useState<"image" | "pdf">("image");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isLoading } = useQuery({
    queryKey: ["/api/business-settings"],
    onSuccess: (data: BusinessSettings) => {
      if (!data) return;
      setEstimatePageSettings({
        ...defaultEstimatePageSettings,
        ...(data as any).estimatePageSettings,
        defaultTheme: {
          ...defaultEstimatePageSettings.defaultTheme,
          ...(data as any).estimatePageSettings?.defaultTheme,
        },
        defaultAttachments: (data as any).estimatePageSettings?.defaultAttachments || [],
      });
    },
  });

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
    onError: () => {
      toast({
        title: "Failed to save estimate page defaults",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate({
      estimatePageSettings,
    });
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estimate Page Editor</h1>
              <p className="text-gray-600 mt-1">Set your default layout, colors, and attachments.</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Layout & Theme Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-3">
                <Label>Attachments (Images / PDFs)</Label>
                {(estimatePageSettings.defaultAttachments || []).length === 0 && (
                  <p className="text-sm text-gray-500">No default attachments yet.</p>
                )}
                <div className="space-y-2">
                  {(estimatePageSettings.defaultAttachments || []).map((attachment, index) => (
                    <div key={`${attachment.url}-${index}`} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.name || attachment.url}</p>
                        <p className="text-xs text-gray-500">{attachment.type.toUpperCase()}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEstimatePageSettings((prev) => ({
                            ...prev,
                            defaultAttachments: (prev.defaultAttachments || []).filter((_, i) => i !== index),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Attachment URL"
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                  />
                  <Input
                    placeholder="Display name (optional)"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                  />
                  <select
                    value={newAttachmentType}
                    onChange={(e) => setNewAttachmentType(e.target.value as "image" | "pdf")}
                    className="border border-gray-200 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="image">Image</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!newAttachmentUrl.trim()) return;
                    setEstimatePageSettings((prev) => ({
                      ...prev,
                      defaultAttachments: [
                        ...(prev.defaultAttachments || []),
                        {
                          url: newAttachmentUrl.trim(),
                          name: newAttachmentName.trim() || undefined,
                          type: newAttachmentType,
                        },
                      ],
                    }));
                    setNewAttachmentUrl("");
                    setNewAttachmentName("");
                    setNewAttachmentType("image");
                  }}
                  disabled={!newAttachmentUrl.trim()}
                >
                  Add Attachment
                </Button>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
