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
import { Copy, ExternalLink, Code, Eye, Settings, Palette, Monitor, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import type { Formula } from "@shared/schema";

export default function EmbedCode() {
  const { toast } = useToast();
  const [selectedFormula, setSelectedFormula] = useState<string>("");
  const [embedWidth, setEmbedWidth] = useState("800");
  const [embedHeight, setEmbedHeight] = useState("100%");
  const [showBorder, setShowBorder] = useState(true);
  const [borderRadius, setBorderRadius] = useState("8");
  const [responsive, setResponsive] = useState(true);

  const { data: formulas } = useQuery({
    queryKey: ["/api/formulas"],
  });

  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
  });

  const formulaList = (formulas as Formula[]) || [];
  const activeFormulas = formulaList.filter(f => f.isActive && f.isDisplayed);

  // Get selected formula details
  const selectedFormulaData = activeFormulas.find(f => f.id.toString() === selectedFormula);

  // Generate embed URLs
  const baseUrl = window.location.origin;
  const singleFormulaUrl = selectedFormulaData ? `${baseUrl}/embed/${selectedFormulaData.embedId}` : "";

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Embed Code Generator</h1>
          <p className="text-gray-600">Generate iframe embed codes for your pricing calculators</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Embed Settings */}
            <Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Single Calculator Embed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="formula">Select Calculator</Label>
                  <Select value={selectedFormula} onValueChange={setSelectedFormula}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a calculator..." />
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
                      <Badge variant="secondary">{selectedFormulaData.name}</Badge>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generateSingleFormulaIframe(), "Single calculator embed code")}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Code
                        </Button>
                      </div>
                      <Textarea
                        value={generateSingleFormulaIframe()}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Styled Calculator Embed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generateStyledCalculatorIframe(), "Styled calculator embed code")}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>
                  <Textarea
                    value={generateStyledCalculatorIframe()}
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
            <Card>
              <CardHeader>
                <CardTitle>Usage Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Website Integration</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Copy the embed code and paste it into your website's HTML where you want the calculator to appear.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Works with WordPress, Squarespace, Wix, and custom websites</li>
                    <li>Responsive design adapts to your site's layout</li>
                    <li>No additional setup or API keys required</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Scrolling & Mobile</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Iframes are automatically set to scrollable (overflow: auto)</li>
                    <li>Minimum recommended height: 600px for mobile devices</li>
                    <li>Content will scroll within the iframe if it exceeds the height</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Customization</h4>
                  <p className="text-sm text-gray-600">
                    Use the Design Dashboard to customize colors, fonts, and styling. Changes will automatically apply to all embedded calculators.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}