import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BusinessSettings, Formula } from "@shared/schema";
import { getChatEstimatorWarnings } from "@shared/chat-estimator";
import { Bot, Code2, Copy, Crown, Upload } from "lucide-react";

type ChatEstimatorSettings = NonNullable<BusinessSettings["chatEstimatorSettings"]>;

const DEFAULT_SETTINGS: ChatEstimatorSettings = {
  enabled: false,
  calculatorId: null,
  calculatorIds: [],
  useAllActiveCalculators: true,
  greetingMessage: "Hi there. I can walk you through a quick estimate.",
  widgetTitle: "Chat Estimator",
  launcherText: "Chat with us",
  primaryColor: "#2563eb",
  avatarLogoUrl: "",
  finalCtaBehavior: "contact_us",
};

export default function ChatEstimatorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mobilePreviewRef = useRef<HTMLDivElement | null>(null);
  const desktopPreviewRef = useRef<HTMLDivElement | null>(null);
  const [formState, setFormState] = useState<ChatEstimatorSettings>(DEFAULT_SETTINGS);

  const { data: user } = useQuery<{ id: string; plan?: string }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: formulas = [] } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  const { data: settings } = useQuery<BusinessSettings>({
    queryKey: ["/api/business-settings"],
  });

  useEffect(() => {
    if (settings?.chatEstimatorSettings) {
      setFormState({
        ...DEFAULT_SETTINGS,
        ...settings.chatEstimatorSettings,
      });
    }
  }, [settings]);

  const selectedFormula = useMemo(
    () => formulas.find((formula) => formula.id === Number(formState.calculatorId || 0)) || null,
    [formState.calculatorId, formulas],
  );

  const activeFormulas = useMemo(
    () => formulas.filter((formula) => formula.isActive !== false && formula.isDisplayed !== false),
    [formulas],
  );

  const selectedFormulaIds = useMemo(() => {
    if (formState.useAllActiveCalculators) {
      return activeFormulas.map((formula) => formula.id);
    }

    const configuredIds = Array.isArray(formState.calculatorIds)
      ? formState.calculatorIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
      : [];

    if (configuredIds.length > 0) {
      return configuredIds;
    }

    return formState.calculatorId ? [Number(formState.calculatorId)] : [];
  }, [activeFormulas, formState.calculatorId, formState.calculatorIds, formState.useAllActiveCalculators]);

  const selectedFormulas = useMemo(
    () => activeFormulas.filter((formula) => selectedFormulaIds.includes(formula.id)),
    [activeFormulas, selectedFormulaIds],
  );

  const warnings = useMemo(
    () => selectedFormulas.flatMap((formula) => getChatEstimatorWarnings(formula).map((warning) => `${formula.name}: ${warning}`)),
    [selectedFormulas],
  );

  const canAccess = user?.plan === "plus" || user?.plan === "plus_seo";

  const embedSnippet = useMemo(() => {
    if (!user?.id || selectedFormulaIds.length === 0) return "";
    const calculatorAttrs = selectedFormulaIds.length > 0
      ? ` data-calculator-ids="${selectedFormulaIds.join(",")}"`
      : "";
    return `<script src="${window.location.origin}/chat-widget.js" data-account-id="${user.id}"${calculatorAttrs}></script>`;
  }, [selectedFormulaIds, user?.id]);

  const previewSrcDoc = useMemo(() => {
    if (!user?.id || selectedFormulaIds.length === 0) return "";
    const attr = selectedFormulaIds.length > 0 ? ` data-calculator-ids="${selectedFormulaIds.join(",")}"` : "";
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(245, 158, 11, 0.24), transparent 26%),
          radial-gradient(circle at top right, rgba(234, 88, 12, 0.18), transparent 24%),
          linear-gradient(180deg, #fff7ed 0%, #f8fafc 24%, #e2e8f0 100%);
        min-height: 100vh;
      }
      .preview-shell {
        min-height: 100vh;
        padding: 28px;
        display: flex;
        align-items: stretch;
        justify-content: center;
      }
      .stage {
        width: min(100%, 1080px);
        min-height: calc(100vh - 56px);
        border-radius: 36px;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
        gap: 24px;
        padding: 24px;
        align-items: stretch;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.74), rgba(255,255,255,0.28)),
          rgba(255,255,255,0.46);
        border: 1px solid rgba(255,255,255,0.52);
        box-shadow: 0 32px 90px rgba(15, 23, 42, 0.18);
      }
      .hero {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 22px 22px 20px;
        border-radius: 28px;
        background: rgba(255,255,255,0.76);
        backdrop-filter: blur(18px);
        border: 1px solid rgba(255,255,255,0.6);
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
        min-height: 100%;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,0.9);
        color: #b45309;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      h1 {
        margin: 14px 0 8px;
        font-family: "Instrument Serif", Georgia, serif;
        font-size: 36px;
        line-height: 1;
        color: #0f172a;
      }
      p {
        margin: 0;
        color: #475569;
        line-height: 1.6;
        font-size: 14px;
      }
      .hero-copy {
        display: grid;
        gap: 14px;
      }
      .hero-notes {
        display: grid;
        gap: 10px;
        margin-top: 20px;
      }
      .note {
        padding: 14px 16px;
        border-radius: 20px;
        background: rgba(255,255,255,0.86);
        border: 1px solid rgba(255,255,255,0.65);
        color: #334155;
        font-size: 13px;
        line-height: 1.5;
      }
      .device-shell {
        min-width: 0;
        display: flex;
        flex-direction: column;
        border-radius: 32px;
        padding: 14px;
        background: rgba(255,255,255,0.5);
        border: 1px solid rgba(255,255,255,0.58);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 24px 60px rgba(15, 23, 42, 0.14);
        overflow: hidden;
      }
      .device-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 6px 14px;
        color: #64748b;
        font-size: 12px;
        letter-spacing: 0.04em;
      }
      .device-dots {
        display: inline-flex;
        gap: 6px;
      }
      .device-dots span {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.75);
      }
      .app-frame {
        flex: 1;
        min-height: 0;
        border-radius: 30px;
        overflow: hidden;
        background: rgba(255,255,255,0.72);
        border: 1px solid rgba(255,255,255,0.7);
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.16);
      }
      #ab-chat-preview-host {
        height: 100%;
      }
      .dock {
        display: flex;
        justify-content: center;
        margin-top: 18px;
      }
      .dock-pill {
        padding: 10px 16px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.7);
        color: white;
        font-size: 13px;
        letter-spacing: 0.02em;
        backdrop-filter: blur(14px);
      }
      @media (max-width: 900px) {
        .preview-shell {
          padding: 16px;
        }
        .stage {
          grid-template-columns: 1fr;
          min-height: auto;
          padding: 16px;
        }
        .hero {
          min-height: auto;
        }
        .app-frame {
          min-height: 680px;
        }
      }
    </style>
  </head>
  <body>
    <div class="preview-shell">
      <div class="stage">
        <div class="hero">
          <div class="hero-copy">
            <div class="eyebrow">Autobidder Preview</div>
            <h1>Native chat estimator</h1>
            <p>Review the live conversation inside a real app-style frame. The header, transcript, and composer now live in one contained shell instead of a floating widget overlay.</p>
          </div>
          <div class="hero-notes">
            <div class="note">Quick replies are rendered as messaging chips, not checkbox rows.</div>
            <div class="note">The conversation body owns scrolling, while the composer stays anchored at the bottom.</div>
          </div>
        </div>
        <div class="device-shell">
          <div class="device-topbar">
            <span>Live chat app preview</span>
            <div class="device-dots"><span></span><span></span><span></span></div>
          </div>
          <div class="app-frame">
            <div id="ab-chat-preview-host"></div>
          </div>
          <div class="dock">
            <div class="dock-pill">Interactive preview uses the real saved widget flow</div>
          </div>
        </div>
      </div>
    </div>
    <script src="${window.location.origin}/chat-widget.js" data-preview-mode="app" data-base-url="${window.location.origin}" data-account-id="${user.id}"${attr}></script>
  </body>
</html>`;
  }, [selectedFormulaIds, user?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/business-settings", {
        chatEstimatorSettings: {
          ...formState,
          calculatorId: selectedFormulaIds[0] || null,
          calculatorIds: selectedFormulaIds,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      toast({
        title: "Chat Estimator saved",
        description: "Your chat widget settings are live.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save Chat Estimator",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const copySnippet = async () => {
    await navigator.clipboard.writeText(embedSnippet);
    toast({
      title: "Embed snippet copied",
      description: "Paste it into your website where the widget should load.",
    });
  };

  const getUploadParameters = async (fileName: string) => {
    const extension = fileName.includes(".") ? `.${fileName.split(".").pop()}` : ".png";
    const response = await apiRequest("POST", "/api/objects/reference-image-upload", {
      fileExtension: extension,
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadUrl,
      objectPath: data.objectPath,
    };
  };

  const handleUploadComplete = async (result: any) => {
    const uploaded = result?.successful?.[0];
    const objectPath = uploaded?.meta?.objectPath;
    if (!objectPath) return;

    const response = await apiRequest("POST", "/api/objects/set-reference-image-acl", {
      objectPath,
      userId: user?.id,
    });
    const data = await response.json();

    setFormState((current) => ({
      ...current,
      avatarLogoUrl: data.objectPath,
    }));

    toast({
      title: "Avatar uploaded",
      description: "Save the page to publish the new widget avatar.",
    });
  };

  const scrollToPreview = () => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
    const previewNode = isMobile ? mobilePreviewRef.current : desktopPreviewRef.current;
    previewNode?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Chat Estimator</h1>
              <p className="text-sm text-slate-600">
                Turn one existing calculator into an installable chat widget without changing the pricing logic.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={scrollToPreview}>
              Test Live Preview
            </Button>
          </div>
        </div>

        {!canAccess ? (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              Chat Estimator is available on the Plus and Plus SEO plans.
            </AlertDescription>
          </Alert>
        ) : null}

        <div ref={mobilePreviewRef} className="space-y-6 lg:hidden">
            <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur">
              <CardHeader>
                <CardTitle>Live Test</CardTitle>
                <CardDescription>
                  Test the real widget on this page without leaving the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
              <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50 to-white px-4 py-3 text-xs text-slate-700 shadow-sm">
                Larger preview stage enabled. The launcher appears inside the live shell so you can inspect the actual conversation comfortably.
              </div>
              <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
                {previewSrcDoc ? (
                  <iframe
                    key={`mobile:${selectedFormulaIds.join(",")}:${settings?.chatEstimatorSettings ? "saved" : "draft"}`}
                    title="Chat Estimator mobile preview"
                    srcDoc={previewSrcDoc}
                    className="h-[680px] w-full bg-white"
                  />
                ) : (
                  <div className="flex h-[320px] items-center justify-center bg-slate-50 text-sm text-slate-500">
                    Choose at least one service to load the live preview.
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                The preview uses the public widget script. Save changes if the public configuration needs to be refreshed first.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Widget Settings</CardTitle>
                <CardDescription>
                  These settings control the public chat widget that appears on your site.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <Label className="text-base font-medium">Enable Chat Estimator</Label>
                    <p className="text-sm text-slate-500">Visitors can pick one or more enabled services and go through them in one chat flow.</p>
                  </div>
                  <Switch
                    checked={formState.enabled === true}
                    disabled={!canAccess}
                    onCheckedChange={(checked) => setFormState((current) => ({ ...current, enabled: checked }))}
                  />
                </div>

                <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Services In Chat</Label>
                      <p className="text-sm text-slate-500">Choose one service or let Chat Estimator expose every active service.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-slate-600">Use all active</Label>
                      <Switch
                        checked={formState.useAllActiveCalculators === true}
                        disabled={!canAccess}
                        onCheckedChange={(checked) => setFormState((current) => ({ ...current, useAllActiveCalculators: checked }))}
                      />
                    </div>
                  </div>

                  {!formState.useAllActiveCalculators ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeFormulas.map((formula) => {
                        const checked = selectedFormulaIds.includes(formula.id);
                        return (
                          <label key={formula.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                setFormState((current) => {
                                  const currentIds = Array.isArray(current.calculatorIds) ? current.calculatorIds : [];
                                  const nextIds = nextChecked
                                    ? Array.from(new Set([...currentIds, formula.id]))
                                    : currentIds.filter((id) => id !== formula.id);
                                  return {
                                    ...current,
                                    calculatorIds: nextIds,
                                    calculatorId: nextIds[0] || null,
                                  };
                                });
                              }}
                              disabled={!canAccess}
                            />
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">{formula.name}</div>
                              {formula.title ? <div className="text-xs text-slate-500">{formula.title}</div> : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      {activeFormulas.length} active service{activeFormulas.length === 1 ? "" : "s"} will be available in the widget.
                    </div>
                  )}
                </div>

                {warnings.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {warnings.join(" ")}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Widget Title</Label>
                    <Input
                      value={formState.widgetTitle || ""}
                      onChange={(event) => setFormState((current) => ({ ...current, widgetTitle: event.target.value }))}
                      disabled={!canAccess}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Launcher Text</Label>
                    <Input
                      value={formState.launcherText || ""}
                      onChange={(event) => setFormState((current) => ({ ...current, launcherText: event.target.value }))}
                      disabled={!canAccess}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Greeting Message</Label>
                  <Textarea
                    rows={3}
                    value={formState.greetingMessage || ""}
                    onChange={(event) => setFormState((current) => ({ ...current, greetingMessage: event.target.value }))}
                    disabled={!canAccess}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Brand Color</Label>
                    <div className="flex gap-3">
                      <Input
                        type="color"
                        className="h-10 w-16 p-1"
                        value={formState.primaryColor || "#2563eb"}
                        onChange={(event) => setFormState((current) => ({ ...current, primaryColor: event.target.value }))}
                        disabled={!canAccess}
                      />
                      <Input
                        value={formState.primaryColor || ""}
                        onChange={(event) => setFormState((current) => ({ ...current, primaryColor: event.target.value }))}
                        disabled={!canAccess}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary CTA</Label>
                    <Select
                      value={formState.finalCtaBehavior || "contact_us"}
                      onValueChange={(value) =>
                        setFormState((current) => ({
                          ...current,
                          finalCtaBehavior: value as ChatEstimatorSettings["finalCtaBehavior"],
                        }))
                      }
                      disabled={!canAccess}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="book_now">Book Now</SelectItem>
                        <SelectItem value="send_estimate">Send Estimate</SelectItem>
                        <SelectItem value="contact_us">Contact Us</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Avatar / Logo</Label>
                      <p className="text-sm text-slate-500">Shown in the widget header.</p>
                    </div>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      allowedFileTypes={["image/*"]}
                      onGetUploadParameters={(file) => getUploadParameters(file.name)}
                      onComplete={handleUploadComplete}
                      disabled={!canAccess}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </ObjectUploader>
                  </div>
                  <Input
                    placeholder="https://..."
                    value={formState.avatarLogoUrl || ""}
                    onChange={(event) => setFormState((current) => ({ ...current, avatarLogoUrl: event.target.value }))}
                    disabled={!canAccess}
                  />
                </div>

                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!canAccess || saveMutation.isPending || selectedFormulaIds.length === 0}
                >
                  {saveMutation.isPending ? "Saving..." : "Save Chat Estimator"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div ref={desktopPreviewRef} className="hidden space-y-6 lg:block">
            <Card className="overflow-hidden border-white/70 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur">
              <CardHeader>
                <CardTitle>Embed Snippet</CardTitle>
                <CardDescription>
                  Install the widget with a single script tag.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                  <code className="block whitespace-pre-wrap break-all text-xs text-slate-700">
                    {embedSnippet || "Choose at least one service to generate the snippet."}
                  </code>
                </div>
                <Button variant="outline" onClick={copySnippet} disabled={!embedSnippet}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Snippet
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-white/70 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur">
              <CardHeader>
                <CardTitle>Live Test</CardTitle>
                <CardDescription>
                  Open the real widget here to test the chat flow without leaving the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50 to-white px-4 py-3 text-xs text-slate-700 lg:hidden">
                  This preview is pinned above the settings on mobile so you can test the widget without scrolling through the full form.
                </div>
                <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
                  {previewSrcDoc ? (
                    <iframe
                      key={`${selectedFormulaIds.join(",")}:${settings?.chatEstimatorSettings ? "saved" : "draft"}`}
                      title="Chat Estimator preview"
                      srcDoc={previewSrcDoc}
                      className="h-[760px] w-full bg-white"
                    />
                  ) : (
                    <div className="flex h-[320px] items-center justify-center bg-slate-50 text-sm text-slate-500">
                      Choose at least one service to load the live preview.
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  The preview uses the public widget script. Save changes if the public configuration needs to be refreshed first.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Implementation Notes</CardTitle>
                <CardDescription>
                  The widget uses your existing calculator schema and pricing formulas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  Visitors can choose one or multiple services, and each service keeps its original calculator step order.
                </p>
                <p>
                  Conditional visibility is evaluated against the same variable answers the normal form uses for each service.
                </p>
                <p>
                  Final pricing is calculated with the existing shared formula runtime and submitted through the existing lead flows.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>Plan: {user?.plan || "unknown"}</p>
                <p>Selected services: {selectedFormulas.length > 0 ? selectedFormulas.map((formula) => formula.name).join(", ") : "None"}</p>
                <p>Widget enabled: {formState.enabled ? "Yes" : "No"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
