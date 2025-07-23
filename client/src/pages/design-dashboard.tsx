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
  multiChoiceLayout: 'grid',
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
    { label: 'Large', value: 'lg' },
    { label: 'Extra Large', value: 'xl' }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                Design Studio
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">Customize the look and feel of your pricing calculators</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setStyling(defaultStyling)}
                className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                size="sm"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Reset to Default</span>
                <span className="sm:hidden">Reset</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                size="sm"
              >
                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-8">
          
          {/* Design Controls Panel */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Tabs defaultValue="layout" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-4 sm:mb-6 h-auto">
                <TabsTrigger value="layout" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
                  <Layout className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Layout</span>
                  <span className="sm:hidden">Layout</span>
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
                  <Type className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Typography</span>
                  <span className="sm:hidden">Type</span>
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 col-span-2 sm:col-span-1">
                  <Paintbrush className="w-3 h-3 sm:w-4 sm:h-4" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="components" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 hidden sm:flex">
                  <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                  Components
                </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3 hidden sm:flex">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  Business
                </TabsTrigger>
              </TabsList>
              
              {/* Mobile Additional Tabs */}
              <div className="sm:hidden mb-4">
                <TabsList className="grid w-full grid-cols-2 h-auto">
                  <TabsTrigger value="components" className="flex items-center gap-1 text-xs py-2">
                    <Square className="w-3 h-3" />
                    Components
                  </TabsTrigger>
                  <TabsTrigger value="business" className="flex items-center gap-1 text-xs py-2">
                    <Settings className="w-3 h-3" />
                    Business
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                      Container Settings
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600">Control the size and appearance of your calculator container</p>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 pt-0">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Width</Label>
                          <div className="flex items-center gap-2 sm:gap-3 mt-2">
                            <Slider
                              value={[styling.containerWidth]}
                              onValueChange={(value) => handleStylingChange('containerWidth', value[0])}
                              max={1200}
                              min={300}
                              step={10}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[50px] sm:min-w-[60px] text-center text-xs">
                              {styling.containerWidth}px
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Height</Label>
                          <div className="flex items-center gap-2 sm:gap-3 mt-2">
                            <Slider
                              value={[styling.containerHeight]}
                              onValueChange={(value) => handleStylingChange('containerHeight', value[0])}
                              max={1200}
                              min={400}
                              step={10}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[50px] sm:min-w-[60px] text-center text-xs">
                              {styling.containerHeight}px
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Border Radius</Label>
                          <div className="flex items-center gap-2 sm:gap-3 mt-2">
                            <Slider
                              value={[styling.containerBorderRadius]}
                              onValueChange={(value) => handleStylingChange('containerBorderRadius', value[0])}
                              max={50}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[45px] sm:min-w-[50px] text-center text-xs">
                              {styling.containerBorderRadius}px
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Shadow</Label>
                          <Select value={styling.containerShadow} onValueChange={(value) => handleStylingChange('containerShadow', value)}>
                            <SelectTrigger className="mt-2 h-10">
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
              <TabsContent value="typography" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Type className="w-4 h-4 sm:w-5 sm:h-5" />
                      Font Settings
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600">Configure text appearance and typography</p>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Font Family</Label>
                        <Select value={styling.fontFamily} onValueChange={(value) => handleStylingChange('fontFamily', value)}>
                          <SelectTrigger className="mt-2 h-10">
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
                          <SelectTrigger className="mt-2 h-10">
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
              <TabsContent value="colors" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Paintbrush className="w-4 h-4 sm:w-5 sm:h-5" />
                      Color Scheme
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600">Set the color palette for your forms and calculators</p>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Primary Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="color"
                            value={styling.primaryColor}
                            onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                            className="w-10 h-10 sm:w-12 sm:h-10 p-1 border rounded"
                          />
                          <Input
                            value={styling.primaryColor}
                            onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                            placeholder="#2563EB"
                            className="flex-1 h-10"
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
                            className="w-10 h-10 sm:w-12 sm:h-10 p-1 border rounded"
                          />
                          <Input
                            value={styling.backgroundColor}
                            onChange={(e) => handleStylingChange('backgroundColor', e.target.value)}
                            placeholder="#FFFFFF"
                            className="flex-1 h-10"
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

                      <div>
                        <Label className="text-sm font-medium">Input Border Width</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.inputBorderWidth]}
                            onValueChange={(value) => handleStylingChange('inputBorderWidth', value[0])}
                            max={10}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[50px] text-center">
                            {styling.inputBorderWidth}px
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Input Border Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Input
                            type="color"
                            value={styling.inputBorderColor}
                            onChange={(e) => handleStylingChange('inputBorderColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={styling.inputBorderColor}
                            onChange={(e) => handleStylingChange('inputBorderColor', e.target.value)}
                            className="flex-1 text-sm"
                            placeholder="#E5E7EB"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Input Shadow</Label>
                        <Select
                          value={styling.inputShadow}
                          onValueChange={(value) => handleStylingChange('inputShadow', value)}
                        >
                          <SelectTrigger className="w-full">
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MousePointer className="w-5 h-5" />
                      Multiple Choice Options
                    </CardTitle>
                    <p className="text-sm text-gray-600">Customize the appearance of multiple choice selections</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Layout</Label>
                        <Select value={styling.multiChoiceLayout} onValueChange={(value) => handleStylingChange('multiChoiceLayout', value)}>
                          <SelectTrigger className="mt-2 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">Grid (Side by Side)</SelectItem>
                            <SelectItem value="single">Single Row</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Icon/Image Size</Label>
                        <Select value={styling.multiChoiceImageSize} onValueChange={(value) => handleStylingChange('multiChoiceImageSize', value)}>
                          <SelectTrigger className="mt-2 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sizeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Card Border Radius</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.multiChoiceCardBorderRadius]}
                            onValueChange={(value) => handleStylingChange('multiChoiceCardBorderRadius', value[0])}
                            max={30}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[50px] text-center">
                            {styling.multiChoiceCardBorderRadius}px
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Card Shadow</Label>
                        <Select value={styling.multiChoiceCardShadow} onValueChange={(value) => handleStylingChange('multiChoiceCardShadow', value)}>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Selected Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="color"
                            value={styling.multiChoiceSelectedColor}
                            onChange={(e) => handleStylingChange('multiChoiceSelectedColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={styling.multiChoiceSelectedColor}
                            onChange={(e) => handleStylingChange('multiChoiceSelectedColor', e.target.value)}
                            placeholder="#2563EB"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Selected Background</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="color"
                            value={styling.multiChoiceSelectedBgColor}
                            onChange={(e) => handleStylingChange('multiChoiceSelectedBgColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={styling.multiChoiceSelectedBgColor}
                            onChange={(e) => handleStylingChange('multiChoiceSelectedBgColor', e.target.value)}
                            placeholder="#EFF6FF"
                            className="flex-1"
                          />
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
            <Card className="sticky top-4 sm:top-8">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  Live Preview
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">See your changes in real-time</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative">
                  <div 
                    className="bg-gray-100 rounded-lg p-2 sm:p-4 min-h-[300px] sm:min-h-[400px] flex items-center justify-center"
                    style={{ backgroundColor: '#f3f4f6' }}
                  >
                    <div
                      className="bg-white rounded-lg shadow-lg p-3 sm:p-6 w-full max-w-xs sm:max-w-sm"
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
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: styling.textColor }}>
                        Sample Calculator
                      </h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="text-xs sm:text-sm font-medium mb-2 block" style={{ color: styling.textColor }}>
                            Text Input
                          </label>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            className="w-full px-2 sm:px-3 py-2 border rounded text-sm"
                            style={{
                              borderRadius: `${styling.inputBorderRadius}px`,
                              borderWidth: `${styling.inputBorderWidth}px`,
                              borderColor: styling.inputBorderColor,
                              backgroundColor: styling.inputBackgroundColor,
                              color: styling.inputTextColor || styling.textColor,
                              boxShadow: styling.inputShadow === 'none' ? 'none' : 
                                        styling.inputShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                        styling.inputShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)' :
                                        styling.inputShadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)' :
                                        'none'
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm font-medium mb-2 block" style={{ color: styling.textColor }}>
                            Number Input
                          </label>
                          <input
                            type="number"
                            placeholder="1000"
                            className="w-full px-2 sm:px-3 py-2 border rounded text-sm"
                            style={{
                              borderRadius: `${styling.inputBorderRadius}px`,
                              borderWidth: `${styling.inputBorderWidth}px`,
                              borderColor: styling.inputBorderColor,
                              backgroundColor: styling.inputBackgroundColor,
                              color: styling.inputTextColor || styling.textColor,
                              boxShadow: styling.inputShadow === 'none' ? 'none' : 
                                        styling.inputShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                        styling.inputShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)' :
                                        styling.inputShadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)' :
                                        'none'
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm font-medium mb-2 block" style={{ color: styling.textColor }}>
                            Dropdown
                          </label>
                          <select
                            className="w-full px-2 sm:px-3 py-2 border rounded text-sm appearance-none bg-no-repeat bg-right-2 bg-center"
                            style={{
                              borderRadius: `${styling.inputBorderRadius}px`,
                              borderWidth: `${styling.inputBorderWidth}px`,
                              borderColor: styling.inputBorderColor,
                              backgroundColor: styling.inputBackgroundColor,
                              color: styling.inputTextColor || styling.textColor,
                              boxShadow: styling.inputShadow === 'none' ? 'none' : 
                                        styling.inputShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                        styling.inputShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)' :
                                        styling.inputShadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)' :
                                        'none',
                              backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02IDhMMCA0SDEyTDYgOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K')"
                            }}
                          >
                            <option value="">Select option</option>
                            <option value="option1">Option 1</option>
                            <option value="option2">Option 2</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm font-medium mb-2 block" style={{ color: styling.textColor }}>
                            Service Options
                          </label>
                          <div className={styling.multiChoiceLayout === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                            {[
                              { name: 'Basic', icon: '🏠' },
                              { name: 'Premium', icon: '⭐' },
                              { name: 'Deluxe', icon: '💎' },
                              { name: 'Standard', icon: '📋' }
                            ].map((option, index) => (
                              <div
                                key={option.name}
                                className="border rounded p-1 sm:p-2 text-center cursor-pointer transition-colors hover:bg-blue-50"
                                style={{
                                  borderRadius: `${styling.multiChoiceCardBorderRadius}px`,
                                  borderColor: index === 0 ? styling.multiChoiceSelectedColor : styling.inputBorderColor,
                                  backgroundColor: index === 0 ? styling.multiChoiceSelectedBgColor : styling.backgroundColor,
                                  boxShadow: styling.multiChoiceCardShadow === 'none' ? 'none' : 
                                           styling.multiChoiceCardShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                           '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                              >
                                <div 
                                  className="mb-1"
                                  style={{
                                    fontSize: styling.multiChoiceImageSize === 'sm' ? '0.8rem' :
                                             styling.multiChoiceImageSize === 'md' ? '1.2rem' : 
                                             styling.multiChoiceImageSize === 'lg' ? '2rem' : 
                                             styling.multiChoiceImageSize === 'xl' ? '2.5rem' : '1.2rem'
                                  }}
                                >
                                  {option.icon}
                                </div>
                                <div 
                                  className="text-xs font-medium"
                                  style={{ color: index === 0 ? styling.multiChoiceSelectedColor : styling.textColor }}
                                >
                                  {option.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <button
                          className="w-full text-white font-medium py-2 px-3 sm:px-4 rounded transition-colors text-sm"
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
                  
                  <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2">
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