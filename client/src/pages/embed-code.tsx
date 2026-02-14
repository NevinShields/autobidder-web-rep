import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, Code, Eye, Settings, Palette, Monitor, Smartphone, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import type { Formula, BusinessSettings } from "@shared/schema";

export default function EmbedCode() {
  const { toast } = useToast();
  const [selectedFormula, setSelectedFormula] = useState<string>("");
  const [embedWidth, setEmbedWidth] = useState("800");
  const [embedHeight, setEmbedHeight] = useState("100%");
  const [showBorder, setShowBorder] = useState(false);
  const [borderRadius, setBorderRadius] = useState("8");
  const [responsive, setResponsive] = useState(true);

  const { data: formulas } = useQuery({
    queryKey: ["/api/formulas"],
  });

  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
  });

  const { data: businessSettings } = useQuery<BusinessSettings>({
    queryKey: ["/api/business-settings"],
  });

  // Check if Facebook tracking is enabled
  const fbTrackingEnabled = businessSettings?.enableFacebookTracking && businessSettings?.fbPixelId;

  const formulaList = (formulas as Formula[]) || [];
  const activeFormulas = formulaList.filter(f => f.isActive && f.isDisplayed);

  // Get selected formula details
  const selectedFormulaData = activeFormulas.find(f => f.id.toString() === selectedFormula);

  // Generate embed URLs
  const baseUrl = window.location.origin;

  // Single service URL now uses styled-calculator with serviceId parameter
  const singleFormulaUrl = selectedFormulaData && user?.id
    ? `${baseUrl}/styled-calculator?userId=${user.id}&serviceId=${selectedFormulaData.id}`
    : selectedFormulaData
    ? `${baseUrl}/styled-calculator?serviceId=${selectedFormulaData.id}`
    : "";

  const styledCalculatorUrl = user?.id ? `${baseUrl}/styled-calculator?userId=${user.id}` : `${baseUrl}/styled-calculator`;

  // Generate iframe code for single formula
  const generateSingleFormulaIframe = () => {
    if (!selectedFormulaData) return "";
    
    const width = responsive ? "100%" : `${embedWidth}px`;
    const height = embedHeight.includes('%') ? embedHeight : `${embedHeight}px`;
    const border = showBorder ? `border: 1px solid #e5e7eb; border-radius: ${borderRadius}px;` : "border: none;";
    const maxWidth = responsive ? `max-width: ${embedWidth}px;` : "";
    const scrolling = "overflow: auto;";
    
    return `<iframe
  src="${singleFormulaUrl}"
  width="${width}"
  height="${height}"
  style="${border} ${maxWidth} ${scrolling}"
  frameborder="0"
  scrolling="auto"
  loading="lazy"
  title="${selectedFormulaData.title}">
</iframe>`;
  };

  // Generate iframe code for styled calculator
  const generateStyledCalculatorIframe = () => {
    const width = responsive ? "100%" : `${embedWidth}px`;
    const height = embedHeight.includes('%') ? embedHeight : `${embedHeight}px`;
    const border = showBorder ? `border: 1px solid #e5e7eb; border-radius: ${borderRadius}px;` : "border: none;";
    const maxWidth = responsive ? `max-width: ${embedWidth}px;` : "";
    const scrolling = "overflow: auto;";
    
    return `<iframe
  src="${styledCalculatorUrl}"
  width="${width}"
  height="${height}"
  style="${border} ${maxWidth} ${scrolling}"
  frameborder="0"
  scrolling="auto"
  loading="lazy"
  title="Styled Service Calculator">
</iframe>`;
  };

  // Generate Facebook tracking script for embedding alongside the calculator
  const generateFbTrackingScript = () => {
    if (!fbTrackingEnabled || !businessSettings?.fbPixelId) return '';

    return `<!-- Autobidder Facebook Conversion Tracking -->
<script>
(function() {
  // Initialize Facebook Pixel if not already present
  if (!window.fbq) {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${businessSettings.fbPixelId}');
    fbq('track', 'PageView');
  }

  // Listen for conversion events from Autobidder calculator
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'AUTOBIDDER_CONVERSION') {
      var data = event.data;
      // Fire Lead event with matching event_id for server-side deduplication
      fbq('trackSingle', data.pixel_id, 'Lead', {
        value: data.value,
        currency: data.currency || 'USD'
      }, { eventID: data.event_id });
    }
  });
})();
</script>
<!-- End Autobidder Facebook Conversion Tracking -->

`;
  };

  // Generate complete embed code with optional FB tracking
  const getFullEmbedCode = (iframeCode: string) => {
    if (fbTrackingEnabled) {
      return generateFbTrackingScript() + iframeCode;
    }
    return iframeCode;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const openPreview = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <DashboardLayout>
      <style>{`
        .embed-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.028'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 embed-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="mb-8 relative overflow-hidden rounded-2xl border border-amber-200/40 dark:border-amber-500/10 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-200/20 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/80 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-xl backdrop-blur-sm">
                <Code className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              </div>
              <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Embed Code Generator
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Generate iframe embed codes for your pricing calculators
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Embed Settings */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/70 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Embed Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={embedWidth}
                      onChange={(e) => setEmbedWidth(e.target.value)}
                      min="300"
                      max="1200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (px or %)</Label>
                    <Input
                      id="height"
                      type="text"
                      value={embedHeight}
                      onChange={(e) => setEmbedHeight(e.target.value)}
                      placeholder="e.g., 600 or 100%"
                    />
                  </div>
                </div>

                {/* Responsive */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <Label htmlFor="responsive">Responsive (100% width)</Label>
                  </div>
                  <Switch
                    id="responsive"
                    checked={responsive}
                    onCheckedChange={setResponsive}
                  />
                </div>

                {/* Border */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="border">Show Border</Label>
                  <Switch
                    id="border"
                    checked={showBorder}
                    onCheckedChange={setShowBorder}
                  />
                </div>

                {/* Border Radius */}
                {showBorder && (
                  <div>
                    <Label htmlFor="borderRadius">Border Radius (px)</Label>
                    <Input
                      id="borderRadius"
                      type="number"
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(e.target.value)}
                      min="0"
                      max="20"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Single Formula Embed */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/70 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Single Service Embed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Embed a single service calculator using the same premium styled design. Perfect for service-specific landing pages.
                </p>

                <div>
                  <Label htmlFor="formula">Select Service</Label>
                  <Select value={selectedFormula} onValueChange={setSelectedFormula}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeFormulas.map((formula) => (
                        <SelectItem key={formula.id} value={formula.id.toString()}>
                          {formula.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFormulaData && (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">{selectedFormulaData.name}</Badge>
                      <Badge variant="outline" className="text-xs">Styled Calculator</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreview(singleFormulaUrl)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Embed Code</Label>
                        <div className="flex items-center gap-2">
                          {fbTrackingEnabled && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <Share2 className="h-3 w-3 mr-1" />
                              FB Tracking
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(getFullEmbedCode(generateSingleFormulaIframe()), "Single calculator embed code")}
                            className="flex items-center gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            Copy Code
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={getFullEmbedCode(generateSingleFormulaIframe())}
                        readOnly
                        className="font-mono text-sm h-32"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Direct URL</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(singleFormulaUrl, "Calculator URL")}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy URL
                        </Button>
                      </div>
                      <Input value={singleFormulaUrl} readOnly className="font-mono text-sm" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Styled Calculator Embed */}
          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/70 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Styled Calculator Embed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Embed the modern styled calculator with custom themes, interactive components, and guided step-by-step flow.
                </p>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Premium Design</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreview(styledCalculatorUrl)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Embed Code</Label>
                    <div className="flex items-center gap-2">
                      {fbTrackingEnabled && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <Share2 className="h-3 w-3 mr-1" />
                          FB Tracking
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getFullEmbedCode(generateStyledCalculatorIframe()), "Styled calculator embed code")}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={getFullEmbedCode(generateStyledCalculatorIframe())}
                    readOnly
                    className="font-mono text-sm h-32"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Direct URL</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(styledCalculatorUrl, "Styled calculator URL")}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </Button>
                  </div>
                  <Input value={styledCalculatorUrl} readOnly className="font-mono text-sm" />
                </div>
              </CardContent>
            </Card>

            {/* Usage Instructions */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/70 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Usage Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Website Integration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Copy the embed code and paste it into your website's HTML where you want the calculator to appear.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Works with WordPress, Squarespace, Wix, and custom websites</li>
                    <li>Responsive design adapts to your site's layout</li>
                    <li>No additional setup or API keys required</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Scrolling & Mobile</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Iframes are automatically set to scrollable (overflow: auto)</li>
                    <li>Minimum recommended height: 600px for mobile devices</li>
                    <li>Content will scroll within the iframe if it exceeds the height</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Customization</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use the Design Dashboard to customize colors, fonts, and styling. Changes will automatically apply to all embedded calculators.
                  </p>
                </div>

                {fbTrackingEnabled && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                    <Share2 className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Meta Tracking Enabled:</strong> Your embed code includes Facebook Pixel initialization and conversion tracking.
                      Lead events will be sent via both client-side Pixel and server-side Conversions API for optimal attribution.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
