import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, Palette, Type, Square, MousePointer, 
  Layout, Paintbrush, Monitor, Smartphone, 
  Settings, Save, RotateCcw, Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BusinessSettings, StylingOptions } from "@shared/schema";

const defaultStyling: StylingOptions = {
  containerWidth: 700,
  containerHeight: 850,
  containerBorderRadius: 16,
  containerShadow: 'xl',
  containerBorderWidth: 0,
  containerBorderColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
  fontFamily: 'inter',
  fontSize: 'base',
  fontWeight: 'medium',
  textColor: '#1F2937',
  primaryColor: '#2563EB',
  buttonStyle: 'rounded',
  buttonBorderRadius: 12,
  buttonPadding: 'lg',
  buttonFontWeight: 'semibold',
  buttonShadow: 'md',
  inputBorderRadius: 10,
  inputBorderWidth: 2,
  inputBorderColor: '#E5E7EB',
  inputFocusColor: '#2563EB',
  inputPadding: 'lg',
  inputBackgroundColor: '#F9FAFB',
  inputShadow: 'sm',
  inputFontSize: 'base',
  inputTextColor: '#1F2937',
  multiChoiceImageSize: 'lg',
  multiChoiceImageShadow: 'md',
  multiChoiceImageBorderRadius: 12,
  multiChoiceCardBorderRadius: 12,
  multiChoiceCardShadow: 'sm',
  multiChoiceSelectedColor: '#2563EB',
  multiChoiceSelectedBgColor: '#EFF6FF',
  multiChoiceHoverBgColor: '#F8FAFC',
  serviceSelectorWidth: 900,
  serviceSelectorBorderRadius: 16,
  serviceSelectorShadow: 'xl',
  serviceSelectorBackgroundColor: '#FFFFFF',
  serviceSelectorBorderWidth: 0,
  serviceSelectorBorderColor: '#E5E7EB',
  serviceSelectorHoverBgColor: '#F8FAFC',
  serviceSelectorHoverBorderColor: '#C7D2FE',
  serviceSelectorSelectedBgColor: '#EFF6FF',
  serviceSelectorSelectedBorderColor: '#2563EB',
  serviceSelectorTitleFontSize: 'xl',
  serviceSelectorDescriptionFontSize: 'base',
  serviceSelectorIconSize: 'xl',
  serviceSelectorPadding: 'xl',
  serviceSelectorGap: 'lg',
  showPriceBreakdown: true,
  includeLedCapture: true,
  requireContactFirst: false,
  showBundleDiscount: false,
  bundleDiscountPercent: 10,
  enableSalesTax: false,
  salesTaxRate: 8.25,
  salesTaxLabel: 'Sales Tax',
  requireName: true,
  requireEmail: true,
  requirePhone: false,
  enableAddress: false,
  requireAddress: false,
  enableNotes: false,
  enableHowDidYouHear: false,
  requireHowDidYouHear: false,
  howDidYouHearOptions: ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other'],
  nameLabel: 'Full Name',
  emailLabel: 'Email Address',
  phoneLabel: 'Phone Number',
  addressLabel: 'Address',
  notesLabel: 'Additional Notes',
  howDidYouHearLabel: 'How did you hear about us?',
};

export default function DesignDashboard() {
  const [businessName, setBusinessName] = useState("");
  const [enableLeadCapture, setEnableLeadCapture] = useState(true);
  const [styling, setStyling] = useState<StylingOptions>(defaultStyling);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/business-settings"],
  });

  // Update state when settings data is loaded
  if (settings && typeof settings === 'object' && 'id' in settings && businessName === "" && styling === defaultStyling) {
    const typedSettings = settings as BusinessSettings;
    setBusinessName(typedSettings.businessName);
    setEnableLeadCapture(typedSettings.enableLeadCapture);
    setStyling(typedSettings.styling);
  }

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: {
      businessName: string;
      enableLeadCapture: boolean;
      styling: StylingOptions;
    }) => {
      if (settings && typeof settings === 'object' && 'id' in settings) {
        const typedSettings = settings as BusinessSettings;
        return apiRequest("PATCH", `/api/business-settings/${typedSettings.id}`, data);
      } else {
        return apiRequest("POST", "/api/business-settings", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      toast({
        title: "Design settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save design settings",
        variant: "destructive",
      });
    },
  });

  const handleStylingChange = (key: keyof StylingOptions, value: any) => {
    setStyling(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate({
      businessName,
      enableLeadCapture,
      styling,
    });
  };

  const shadowOptions = [
    { label: 'None', value: 'none' },
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
    { label: 'Extra Large', value: 'xl' }
  ];

  const fontOptions = [
    { label: 'Inter', value: 'inter' },
    { label: 'Roboto', value: 'roboto' },
    { label: 'Open Sans', value: 'open-sans' },
    { label: 'Lato', value: 'lato' },
    { label: 'Montserrat', value: 'montserrat' }
  ];

  const sizeOptions = [
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>Loading design settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      {/* Header Section */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Palette className="w-8 h-8 text-blue-600" />
                Design Studio
              </h1>
              <p className="text-gray-600 mt-1">Customize the look and feel of your pricing calculators</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setStyling(defaultStyling)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Design Controls Panel */}
          <div className="xl:col-span-2 space-y-6">
            <Tabs defaultValue="layout" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="layout" className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Typography
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="components" className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Components
                </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Business
                </TabsTrigger>
              </TabsList>

              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Container Settings
                    </CardTitle>
                    <p className="text-sm text-gray-600">Control the size and appearance of your calculator container</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Width</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[styling.containerWidth]}
                              onValueChange={(value) => handleStylingChange('containerWidth', value[0])}
                              max={1200}
                              min={300}
                              step={10}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {styling.containerWidth}px
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Height</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[styling.containerHeight]}
                              onValueChange={(value) => handleStylingChange('containerHeight', value[0])}
                              max={1200}
                              min={400}
                              step={10}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {styling.containerHeight}px
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Border Radius</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[styling.containerBorderRadius]}
                              onValueChange={(value) => handleStylingChange('containerBorderRadius', value[0])}
                              max={50}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[50px] text-center">
                              {styling.containerBorderRadius}px
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Shadow</Label>
                          <Select value={styling.containerShadow} onValueChange={(value) => handleStylingChange('containerShadow', value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {shadowOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Typography Tab */}
              <TabsContent value="typography" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      Font Settings
                    </CardTitle>
                    <p className="text-sm text-gray-600">Configure text appearance and typography</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Font Family</Label>
                        <Select value={styling.fontFamily} onValueChange={(value) => handleStylingChange('fontFamily', value)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Select value={styling.fontSize} onValueChange={(value) => handleStylingChange('fontSize', value)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">Small</SelectItem>
                            <SelectItem value="base">Base</SelectItem>
                            <SelectItem value="lg">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paintbrush className="w-5 h-5" />
                      Color Scheme
                    </CardTitle>
                    <p className="text-sm text-gray-600">Set the color palette for your forms and calculators</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Primary Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="color"
                            value={styling.primaryColor}
                            onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={styling.primaryColor}
                            onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                            placeholder="#2563EB"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Background Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="color"
                            value={styling.backgroundColor}
                            onChange={(e) => handleStylingChange('backgroundColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={styling.backgroundColor}
                            onChange={(e) => handleStylingChange('backgroundColor', e.target.value)}
                            placeholder="#FFFFFF"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Components Tab */}
              <TabsContent value="components" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Square className="w-5 h-5" />
                      Buttons & Inputs
                    </CardTitle>
                    <p className="text-sm text-gray-600">Customize interactive elements</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Button Style</Label>
                        <Select value={styling.buttonStyle} onValueChange={(value) => handleStylingChange('buttonStyle', value)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="pill">Pill</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Input Border Radius</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.inputBorderRadius]}
                            onValueChange={(value) => handleStylingChange('inputBorderRadius', value[0])}
                            max={30}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[50px] text-center">
                            {styling.inputBorderRadius}px
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Tab */}
              <TabsContent value="business" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Business Information
                    </CardTitle>
                    <p className="text-sm text-gray-600">Configure your business details</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Enter your business name"
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          <div className="xl:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <p className="text-sm text-gray-600">See your changes in real-time</p>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div 
                    className="bg-gray-100 rounded-lg p-4 min-h-[400px] flex items-center justify-center"
                    style={{ backgroundColor: '#f3f4f6' }}
                  >
                    <div
                      className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm"
                      style={{
                        borderRadius: `${styling.containerBorderRadius}px`,
                        backgroundColor: styling.backgroundColor,
                        boxShadow: styling.containerShadow === 'none' ? 'none' : 
                                 styling.containerShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                 styling.containerShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                                 styling.containerShadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' :
                                 '0 25px 25px -5px rgb(0 0 0 / 0.25)'
                      }}
                    >
                      <h3 className="text-lg font-semibold mb-4" style={{ color: styling.textColor }}>
                        Sample Calculator
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            placeholder="Sample input"
                            className="w-full px-3 py-2 border rounded"
                            style={{
                              borderRadius: `${styling.inputBorderRadius}px`,
                              borderColor: styling.inputBorderColor,
                              backgroundColor: styling.inputBackgroundColor,
                              color: styling.inputTextColor || styling.textColor
                            }}
                          />
                        </div>
                        
                        <button
                          className="w-full text-white font-medium py-2 px-4 rounded transition-colors"
                          style={{
                            backgroundColor: styling.primaryColor,
                            borderRadius: styling.buttonStyle === 'pill' ? '9999px' : 
                                          styling.buttonStyle === 'square' ? '0px' : 
                                          `${styling.buttonBorderRadius}px`
                          }}
                        >
                          Calculate Price
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      Preview
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}