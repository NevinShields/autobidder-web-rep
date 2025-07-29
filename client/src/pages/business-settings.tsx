import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Palette, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BusinessSettings, StylingOptions } from "@shared/schema";

const defaultStyling: StylingOptions = {
  containerWidth: 600,
  containerHeight: 800,
  containerBorderRadius: 12,
  containerShadow: 'lg',
  containerBorderWidth: 1,
  containerBorderColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
  fontFamily: 'inter',
  fontSize: 'base',
  fontWeight: 'normal',
  textColor: '#374151',
  primaryColor: '#1976D2',
  buttonStyle: 'rounded',
  buttonBorderRadius: 8,
  buttonPadding: 'md',
  buttonFontWeight: 'medium',
  buttonShadow: 'sm',
  inputBorderRadius: 6,
  inputBorderWidth: 1,
  inputBorderColor: '#D1D5DB',
  inputFocusColor: '#3B82F6',
  inputPadding: 'md',
  inputBackgroundColor: '#FFFFFF',
  showPriceBreakdown: true,
  includeLedCapture: true,
};

export default function BusinessSettings() {
  const [businessName, setBusinessName] = useState("");
  const [enableLeadCapture, setEnableLeadCapture] = useState(true);
  const [styling, setStyling] = useState<StylingOptions>(defaultStyling);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/business-settings"],
    onSuccess: (data: BusinessSettings) => {
      if (data) {
        setBusinessName(data.businessName);
        setEnableLeadCapture(data.enableLeadCapture);
        setStyling(data.styling);
      }
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: {
      businessName: string;
      enableLeadCapture: boolean;
      styling: StylingOptions;
    }) => {
      if (settings) {
        return apiRequest("PATCH", `/api/business-settings/${settings.id}`, data);
      } else {
        return apiRequest("POST", "/api/business-settings", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      toast({
        title: "Settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate({
      businessName,
      enableLeadCapture,
      styling,
    });
  };

  const updateStyling = (key: keyof StylingOptions, value: any) => {
    setStyling(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div>Loading settings...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
          <p className="text-gray-600 mt-2">Configure your multi-service pricing form</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="styling" className="flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Form Styling
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                  />
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="enableLeadCapture">Enable Lead Capture</Label>
                    <p className="text-sm text-gray-500">Show contact form after price calculation</p>
                  </div>
                  <Switch
                    id="enableLeadCapture"
                    checked={enableLeadCapture}
                    onCheckedChange={setEnableLeadCapture}
                    className="flex-shrink-0 self-start sm:self-auto"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="styling">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Container Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Container Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Width (px)</Label>
                      <Input
                        type="number"
                        min="300"
                        max="800"
                        value={styling.containerWidth}
                        onChange={(e) => updateStyling('containerWidth', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Height (px)</Label>
                      <Input
                        type="number"
                        min="400"
                        max="1200"
                        value={styling.containerHeight}
                        onChange={(e) => updateStyling('containerHeight', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={styling.backgroundColor}
                      onChange={(e) => updateStyling('backgroundColor', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Border Radius</Label>
                    <Input
                      type="range"
                      min="0"
                      max="50"
                      value={styling.containerBorderRadius}
                      onChange={(e) => updateStyling('containerBorderRadius', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-gray-500">{styling.containerBorderRadius}px</span>
                  </div>

                  <div>
                    <Label>Shadow</Label>
                    <Select 
                      value={styling.containerShadow} 
                      onValueChange={(value) => updateStyling('containerShadow', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Typography Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Font Family</Label>
                    <Select 
                      value={styling.fontFamily} 
                      onValueChange={(value) => updateStyling('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                        <SelectItem value="open-sans">Open Sans</SelectItem>
                        <SelectItem value="lato">Lato</SelectItem>
                        <SelectItem value="montserrat">Montserrat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Font Size</Label>
                      <Select 
                        value={styling.fontSize} 
                        onValueChange={(value) => updateStyling('fontSize', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Font Weight</Label>
                      <Select 
                        value={styling.fontWeight} 
                        onValueChange={(value) => updateStyling('fontWeight', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="semibold">Semibold</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={styling.textColor}
                      onChange={(e) => updateStyling('textColor', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Button Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Button Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Primary Color</Label>
                    <Input
                      type="color"
                      value={styling.primaryColor}
                      onChange={(e) => updateStyling('primaryColor', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Button Style</Label>
                    <Select 
                      value={styling.buttonStyle} 
                      onValueChange={(value) => updateStyling('buttonStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="pill">Pill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Padding</Label>
                      <Select 
                        value={styling.buttonPadding} 
                        onValueChange={(value) => updateStyling('buttonPadding', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Shadow</Label>
                      <Select 
                        value={styling.buttonShadow} 
                        onValueChange={(value) => updateStyling('buttonShadow', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Input Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Input Field Styling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={styling.inputBackgroundColor}
                      onChange={(e) => updateStyling('inputBackgroundColor', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Border Color</Label>
                    <Input
                      type="color"
                      value={styling.inputBorderColor}
                      onChange={(e) => updateStyling('inputBorderColor', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Focus Color</Label>
                    <Input
                      type="color"
                      value={styling.inputFocusColor}
                      onChange={(e) => updateStyling('inputFocusColor', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Border Radius</Label>
                    <Input
                      type="range"
                      min="0"
                      max="20"
                      value={styling.inputBorderRadius}
                      onChange={(e) => updateStyling('inputBorderRadius', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-gray-500">{styling.inputBorderRadius}px</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Form Preview</CardTitle>
                <p className="text-sm text-gray-500">This is how your multi-service form will appear to customers</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div 
                    className="border overflow-auto"
                    style={{
                      width: `${styling.containerWidth}px`,
                      height: `${styling.containerHeight}px`,
                      borderRadius: `${styling.containerBorderRadius}px`,
                      borderColor: styling.containerBorderColor,
                      backgroundColor: styling.backgroundColor,
                      color: styling.textColor,
                      fontFamily: styling.fontFamily.replace('-', ' '),
                    }}
                  >
                    <div className="p-6 h-full flex flex-col">
                      <h2 className="text-2xl font-bold mb-6 text-center">
                        {businessName || "Your Business Name"}
                      </h2>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <p>Multi-service form preview</p>
                          <p className="text-sm mt-2">Service blocks will appear here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending || !businessName.trim()}
            className="px-8"
          >
            {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}