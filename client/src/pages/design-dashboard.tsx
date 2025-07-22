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
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Palette, Type, Square, MousePointer } from "lucide-react";
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
  inputShadow: 'none',
  inputFontSize: 'base',
  inputTextColor: '#374151',
  multiChoiceImageSize: 'md',
  multiChoiceImageShadow: 'sm',
  multiChoiceImageBorderRadius: 8,
  multiChoiceCardBorderRadius: 8,
  multiChoiceCardShadow: 'none',
  multiChoiceSelectedColor: '#3B82F6',
  multiChoiceSelectedBgColor: '#EBF8FF',
  multiChoiceHoverBgColor: '#F7FAFC',
  serviceSelectorWidth: 800,
  serviceSelectorBorderRadius: 12,
  serviceSelectorShadow: 'lg',
  serviceSelectorBackgroundColor: '#FFFFFF',
  serviceSelectorBorderWidth: 1,
  serviceSelectorBorderColor: '#E5E7EB',
  serviceSelectorHoverBgColor: '#F9FAFB',
  serviceSelectorHoverBorderColor: '#D1D5DB',
  serviceSelectorSelectedBgColor: '#EBF8FF',
  serviceSelectorSelectedBorderColor: '#3B82F6',
  serviceSelectorTitleFontSize: 'lg',
  serviceSelectorDescriptionFontSize: 'sm',
  serviceSelectorIconSize: 'lg',
  serviceSelectorPadding: 'lg',
  serviceSelectorGap: 'md',
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

  const textSizeOptions = [
    { label: 'Small', value: 'sm' },
    { label: 'Base', value: 'base' },
    { label: 'Large', value: 'lg' }
  ];

  const fontWeightOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Medium', value: 'medium' },
    { label: 'Semi Bold', value: 'semibold' },
    { label: 'Bold', value: 'bold' }
  ];

  const buttonStyleOptions = [
    { label: 'Rounded', value: 'rounded' },
    { label: 'Square', value: 'square' },
    { label: 'Pill', value: 'pill' }
  ];

  // Generate dynamic styles for preview
  const containerStyles = {
    width: `${styling.containerWidth}px`,
    height: `${styling.containerHeight}px`,
    borderRadius: `${styling.containerBorderRadius}px`,
    borderWidth: `${styling.containerBorderWidth}px`,
    borderColor: styling.containerBorderColor,
    backgroundColor: styling.backgroundColor,
    color: styling.textColor,
  };
  
  // Font family CSS class mapping
  const fontFamilyClasses = {
    'inter': 'font-inter',
    'roboto': 'font-roboto', 
    'open-sans': 'font-open-sans',
    'lato': 'font-lato',
    'montserrat': 'font-montserrat'
  };

  const shadowClasses = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  };

  const fontSizeClasses = {
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg'
  };

  const fontWeightClasses = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold'
  };

  const paddingClasses = {
    'sm': 'px-3 py-2',
    'md': 'px-4 py-3',
    'lg': 'px-6 py-4'
  };

  const buttonStyles = {
    backgroundColor: styling.primaryColor,
    borderRadius: styling.buttonStyle === 'pill' ? '9999px' : 
                  styling.buttonStyle === 'square' ? '0px' : 
                  `${styling.buttonBorderRadius}px`,
  };

  const inputStyles = {
    borderRadius: `${styling.inputBorderRadius}px`,
    borderWidth: `${styling.inputBorderWidth}px`,
    borderColor: styling.inputBorderColor,
    backgroundColor: styling.inputBackgroundColor,
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Design Controls */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Design Dashboard</h1>
                <p className="text-gray-600">Customize the appearance of your forms and calculators</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
                <Button onClick={() => window.open('/services', '_blank')}>
                  <MousePointer className="w-4 h-4 mr-2" />
                  Preview Form
                </Button>
              </div>
            </div>

            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Square className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableLeadCapture"
                    checked={enableLeadCapture}
                    onCheckedChange={(checked) => setEnableLeadCapture(!!checked)}
                  />
                  <Label htmlFor="enableLeadCapture">Enable lead capture</Label>
                </div>
              </CardContent>
            </Card>

            {/* Design Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Design Customization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="container" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="container">Container</TabsTrigger>
                    <TabsTrigger value="typography">Typography</TabsTrigger>
                    <TabsTrigger value="buttons">Buttons</TabsTrigger>
                    <TabsTrigger value="inputs">Inputs</TabsTrigger>
                    <TabsTrigger value="multichoice">Options</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                  </TabsList>

                  <TabsContent value="container" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Dimensions</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Width</Label>
                            <Select
                              value={styling.containerWidth?.toString() || "600"}
                              onValueChange={(value) => {
                                if (value === 'full') {
                                  handleStylingChange('containerWidth', 'full');
                                } else if (value.endsWith('%')) {
                                  handleStylingChange('containerWidth', value);
                                } else {
                                  handleStylingChange('containerWidth', parseInt(value));
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="300">300px</SelectItem>
                                <SelectItem value="400">400px</SelectItem>
                                <SelectItem value="500">500px</SelectItem>
                                <SelectItem value="600">600px</SelectItem>
                                <SelectItem value="700">700px</SelectItem>
                                <SelectItem value="800">800px</SelectItem>
                                <SelectItem value="900">900px</SelectItem>
                                <SelectItem value="full">Full Width</SelectItem>
                                <SelectItem value="50%">50%</SelectItem>
                                <SelectItem value="60%">60%</SelectItem>
                                <SelectItem value="70%">70%</SelectItem>
                                <SelectItem value="80%">80%</SelectItem>
                                <SelectItem value="90%">90%</SelectItem>
                                <SelectItem value="100%">100%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Height</Label>
                            <Select
                              value={styling.containerHeight?.toString() || "800"}
                              onValueChange={(value) => {
                                if (value === 'auto') {
                                  handleStylingChange('containerHeight', 'auto');
                                } else if (value.endsWith('%')) {
                                  handleStylingChange('containerHeight', value);
                                } else {
                                  handleStylingChange('containerHeight', parseInt(value));
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="400">400px</SelectItem>
                                <SelectItem value="600">600px</SelectItem>
                                <SelectItem value="800">800px</SelectItem>
                                <SelectItem value="1000">1000px</SelectItem>
                                <SelectItem value="1200">1200px</SelectItem>
                                <SelectItem value="auto">Auto Height</SelectItem>
                                <SelectItem value="50%">50%</SelectItem>
                                <SelectItem value="60%">60%</SelectItem>
                                <SelectItem value="70%">70%</SelectItem>
                                <SelectItem value="80%">80%</SelectItem>
                                <SelectItem value="90%">90%</SelectItem>
                                <SelectItem value="100%">100%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Border & Shadow</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Border Radius</Label>
                            <Slider
                              value={[styling.containerBorderRadius]}
                              onValueChange={([value]) => handleStylingChange('containerBorderRadius', value)}
                              max={50}
                              min={0}
                              step={1}
                              className="mt-1"
                            />
                            <span className="text-xs text-gray-500">{styling.containerBorderRadius}px</span>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Shadow</Label>
                            <Select value={styling.containerShadow} onValueChange={(value) => handleStylingChange('containerShadow', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {shadowOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Colors</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Background Color</Label>
                            <div className="flex items-center space-x-2">
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
                          <div>
                            <Label className="text-xs text-gray-600">Border Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.containerBorderColor}
                                onChange={(e) => handleStylingChange('containerBorderColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.containerBorderColor}
                                onChange={(e) => handleStylingChange('containerBorderColor', e.target.value)}
                                placeholder="#E5E7EB"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="typography" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Font Family</Label>
                        <Select value={styling.fontFamily} onValueChange={(value) => handleStylingChange('fontFamily', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-600">Font Size</Label>
                          <Select value={styling.fontSize} onValueChange={(value) => handleStylingChange('fontSize', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {textSizeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Font Weight</Label>
                          <Select value={styling.fontWeight} onValueChange={(value) => handleStylingChange('fontWeight', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontWeightOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Text Color</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Input
                            type="color"
                            value={styling.textColor}
                            onChange={(e) => handleStylingChange('textColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={styling.textColor}
                            onChange={(e) => handleStylingChange('textColor', e.target.value)}
                            placeholder="#374151"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="buttons" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Primary Color</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Input
                            type="color"
                            value={styling.primaryColor}
                            onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={styling.primaryColor}
                            onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                            placeholder="#1976D2"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-600">Button Style</Label>
                          <Select value={styling.buttonStyle} onValueChange={(value) => handleStylingChange('buttonStyle', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {buttonStyleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Padding</Label>
                          <Select value={styling.buttonPadding} onValueChange={(value) => handleStylingChange('buttonPadding', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sizeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-600">Font Weight</Label>
                          <Select value={styling.buttonFontWeight} onValueChange={(value) => handleStylingChange('buttonFontWeight', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontWeightOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Shadow</Label>
                          <Select value={styling.buttonShadow} onValueChange={(value) => handleStylingChange('buttonShadow', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {shadowOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="inputs" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Border Radius</Label>
                        <Slider
                          value={[styling.inputBorderRadius]}
                          onValueChange={([value]) => handleStylingChange('inputBorderRadius', value)}
                          max={50}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                        <span className="text-xs text-gray-500">{styling.inputBorderRadius}px</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-600">Border Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={styling.inputBorderColor}
                              onChange={(e) => handleStylingChange('inputBorderColor', e.target.value)}
                              className="w-12 h-8 p-1 border rounded"
                            />
                            <Input
                              value={styling.inputBorderColor}
                              onChange={(e) => handleStylingChange('inputBorderColor', e.target.value)}
                              placeholder="#D1D5DB"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Focus Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={styling.inputFocusColor}
                              onChange={(e) => handleStylingChange('inputFocusColor', e.target.value)}
                              className="w-12 h-8 p-1 border rounded"
                            />
                            <Input
                              value={styling.inputFocusColor}
                              onChange={(e) => handleStylingChange('inputFocusColor', e.target.value)}
                              placeholder="#3B82F6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Background Color</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Input
                            type="color"
                            value={styling.inputBackgroundColor}
                            onChange={(e) => handleStylingChange('inputBackgroundColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                          />
                          <Input
                            value={styling.inputBackgroundColor}
                            onChange={(e) => handleStylingChange('inputBackgroundColor', e.target.value)}
                            placeholder="#FFFFFF"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Padding</Label>
                        <Select value={styling.inputPadding} onValueChange={(value) => handleStylingChange('inputPadding', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sizeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Border Width</Label>
                        <Slider
                          value={[styling.inputBorderWidth]}
                          onValueChange={([value]) => handleStylingChange('inputBorderWidth', value)}
                          max={5}
                          min={1}
                          step={1}
                          className="mt-2"
                        />
                        <span className="text-xs text-gray-500">{styling.inputBorderWidth}px</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-600">Font Size</Label>
                          <Select value={styling.inputFontSize || 'base'} onValueChange={(value) => handleStylingChange('inputFontSize', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="xs">Extra Small</SelectItem>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                              <SelectItem value="xl">Extra Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Text Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={styling.inputTextColor || '#374151'}
                              onChange={(e) => handleStylingChange('inputTextColor', e.target.value)}
                              className="w-12 h-8 p-1 border rounded"
                            />
                            <Input
                              value={styling.inputTextColor || '#374151'}
                              onChange={(e) => handleStylingChange('inputTextColor', e.target.value)}
                              placeholder="#374151"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Shadow</Label>
                        <Select value={styling.inputShadow} onValueChange={(value) => handleStylingChange('inputShadow', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {shadowOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="multichoice" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Image Settings</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Image Size</Label>
                            <Select value={styling.multiChoiceImageSize} onValueChange={(value) => handleStylingChange('multiChoiceImageSize', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sm">Small (32px)</SelectItem>
                                <SelectItem value="md">Medium (48px)</SelectItem>
                                <SelectItem value="lg">Large (64px)</SelectItem>
                                <SelectItem value="xl">Extra Large (80px)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Image Shadow</Label>
                            <Select value={styling.multiChoiceImageShadow} onValueChange={(value) => handleStylingChange('multiChoiceImageShadow', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {shadowOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Border & Styling</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Image Border Radius</Label>
                            <Slider
                              value={[styling.multiChoiceImageBorderRadius]}
                              onValueChange={([value]) => handleStylingChange('multiChoiceImageBorderRadius', value)}
                              max={50}
                              min={0}
                              step={1}
                              className="mt-1"
                            />
                            <span className="text-xs text-gray-500">{styling.multiChoiceImageBorderRadius}px</span>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Card Border Radius</Label>
                            <Slider
                              value={[styling.multiChoiceCardBorderRadius]}
                              onValueChange={([value]) => handleStylingChange('multiChoiceCardBorderRadius', value)}
                              max={50}
                              min={0}
                              step={1}
                              className="mt-1"
                            />
                            <span className="text-xs text-gray-500">{styling.multiChoiceCardBorderRadius}px</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Selection Behavior</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Card Shadow</Label>
                            <Select value={styling.multiChoiceCardShadow} onValueChange={(value) => handleStylingChange('multiChoiceCardShadow', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {shadowOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Selected Border Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.multiChoiceSelectedColor}
                                onChange={(e) => handleStylingChange('multiChoiceSelectedColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.multiChoiceSelectedColor}
                                onChange={(e) => handleStylingChange('multiChoiceSelectedColor', e.target.value)}
                                placeholder="#3B82F6"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Background Colors</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Selected Background</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.multiChoiceSelectedBgColor}
                                onChange={(e) => handleStylingChange('multiChoiceSelectedBgColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.multiChoiceSelectedBgColor}
                                onChange={(e) => handleStylingChange('multiChoiceSelectedBgColor', e.target.value)}
                                placeholder="#EBF8FF"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Hover Background</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.multiChoiceHoverBgColor}
                                onChange={(e) => handleStylingChange('multiChoiceHoverBgColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.multiChoiceHoverBgColor}
                                onChange={(e) => handleStylingChange('multiChoiceHoverBgColor', e.target.value)}
                                placeholder="#F7FAFC"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="services" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Service Selector Dimensions</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Container Width</Label>
                            <Slider
                              value={[styling.serviceSelectorWidth]}
                              onValueChange={([value]) => handleStylingChange('serviceSelectorWidth', value)}
                              max={1200}
                              min={300}
                              step={50}
                              className="mt-1"
                            />
                            <span className="text-xs text-gray-500">{styling.serviceSelectorWidth}px</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Border & Shadow</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Border Radius</Label>
                            <Slider
                              value={[styling.serviceSelectorBorderRadius]}
                              onValueChange={([value]) => handleStylingChange('serviceSelectorBorderRadius', value)}
                              max={50}
                              min={0}
                              step={1}
                              className="mt-1"
                            />
                            <span className="text-xs text-gray-500">{styling.serviceSelectorBorderRadius}px</span>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Shadow</Label>
                            <Select value={styling.serviceSelectorShadow} onValueChange={(value) => handleStylingChange('serviceSelectorShadow', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {shadowOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Colors</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Background Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.serviceSelectorBackgroundColor}
                                onChange={(e) => handleStylingChange('serviceSelectorBackgroundColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.serviceSelectorBackgroundColor}
                                onChange={(e) => handleStylingChange('serviceSelectorBackgroundColor', e.target.value)}
                                placeholder="#FFFFFF"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Border Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.serviceSelectorBorderColor}
                                onChange={(e) => handleStylingChange('serviceSelectorBorderColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.serviceSelectorBorderColor}
                                onChange={(e) => handleStylingChange('serviceSelectorBorderColor', e.target.value)}
                                placeholder="#E5E7EB"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Hover Effects</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Hover Background</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.serviceSelectorHoverBgColor}
                                onChange={(e) => handleStylingChange('serviceSelectorHoverBgColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.serviceSelectorHoverBgColor}
                                onChange={(e) => handleStylingChange('serviceSelectorHoverBgColor', e.target.value)}
                                placeholder="#F9FAFB"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Hover Border Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.serviceSelectorHoverBorderColor}
                                onChange={(e) => handleStylingChange('serviceSelectorHoverBorderColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.serviceSelectorHoverBorderColor}
                                onChange={(e) => handleStylingChange('serviceSelectorHoverBorderColor', e.target.value)}
                                placeholder="#D1D5DB"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Selection States</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Selected Background</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.serviceSelectorSelectedBgColor}
                                onChange={(e) => handleStylingChange('serviceSelectorSelectedBgColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.serviceSelectorSelectedBgColor}
                                onChange={(e) => handleStylingChange('serviceSelectorSelectedBgColor', e.target.value)}
                                placeholder="#EBF8FF"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Selected Border Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={styling.serviceSelectorSelectedBorderColor}
                                onChange={(e) => handleStylingChange('serviceSelectorSelectedBorderColor', e.target.value)}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={styling.serviceSelectorSelectedBorderColor}
                                onChange={(e) => handleStylingChange('serviceSelectorSelectedBorderColor', e.target.value)}
                                placeholder="#3B82F6"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Typography</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Title Font Size</Label>
                            <Select value={styling.serviceSelectorTitleFontSize} onValueChange={(value) => handleStylingChange('serviceSelectorTitleFontSize', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sm">Small</SelectItem>
                                <SelectItem value="base">Base</SelectItem>
                                <SelectItem value="lg">Large</SelectItem>
                                <SelectItem value="xl">Extra Large</SelectItem>
                                <SelectItem value="2xl">2X Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Description Font Size</Label>
                            <Select value={styling.serviceSelectorDescriptionFontSize} onValueChange={(value) => handleStylingChange('serviceSelectorDescriptionFontSize', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="xs">Extra Small</SelectItem>
                                <SelectItem value="sm">Small</SelectItem>
                                <SelectItem value="base">Base</SelectItem>
                                <SelectItem value="lg">Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Layout & Spacing</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <Label className="text-xs text-gray-600">Icon Size</Label>
                            <Select value={styling.serviceSelectorIconSize} onValueChange={(value) => handleStylingChange('serviceSelectorIconSize', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sm">Small</SelectItem>
                                <SelectItem value="md">Medium</SelectItem>
                                <SelectItem value="lg">Large</SelectItem>
                                <SelectItem value="xl">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Padding</Label>
                            <Select value={styling.serviceSelectorPadding} onValueChange={(value) => handleStylingChange('serviceSelectorPadding', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sm">Small</SelectItem>
                                <SelectItem value="md">Medium</SelectItem>
                                <SelectItem value="lg">Large</SelectItem>
                                <SelectItem value="xl">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Gap Between Items</Label>
                            <Select value={styling.serviceSelectorGap} onValueChange={(value) => handleStylingChange('serviceSelectorGap', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sm">Small</SelectItem>
                                <SelectItem value="md">Medium</SelectItem>
                                <SelectItem value="lg">Large</SelectItem>
                                <SelectItem value="xl">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Border Width</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          <div>
                            <Slider
                              value={[styling.serviceSelectorBorderWidth]}
                              onValueChange={([value]) => handleStylingChange('serviceSelectorBorderWidth', value)}
                              max={10}
                              min={0}
                              step={1}
                              className="mt-1"
                            />
                            <span className="text-xs text-gray-500">{styling.serviceSelectorBorderWidth}px</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              className="w-full" 
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Design Settings'}
            </Button>
          </div>

          {/* Live Preview */}
          {showPreview && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div 
                      className={`border overflow-auto ${shadowClasses[styling.containerShadow]} ${fontSizeClasses[styling.fontSize]} ${fontWeightClasses[styling.fontWeight]} ${fontFamilyClasses[styling.fontFamily]}`}
                      style={containerStyles}
                    >
                      <div className="p-6 h-full">
                        <div className="text-center mb-6">
                          <h1 className="text-2xl font-bold mb-2">{businessName || 'Your Business Name'}</h1>
                          <p className="text-sm opacity-80">Sample Form Preview</p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Service Type</label>
                            <div 
                              className={`w-full border ${paddingClasses[styling.inputPadding]} text-left`}
                              style={inputStyles}
                            >
                              Select a service...
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Project Size</label>
                            <div 
                              className={`w-full border ${paddingClasses[styling.inputPadding]} text-left`}
                              style={inputStyles}
                            >
                              Choose size...
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Additional Options</label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border border-gray-300 rounded"></div>
                                <span className="text-sm">Option 1</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border border-gray-300 rounded"></div>
                                <span className="text-sm">Option 2</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4">
                            <button
                              className={`w-full text-white font-medium ${paddingClasses[styling.buttonPadding]} transition-colors`}
                              style={buttonStyles}
                            >
                              Calculate Price
                            </button>
                          </div>

                          <div className="text-center pt-4 border-t border-gray-200">
                            <div className="text-2xl font-bold mb-2">$2,450</div>
                            <p className="text-sm opacity-70">Estimated Price</p>
                          </div>

                          {enableLeadCapture && (
                            <div className="space-y-3 pt-4 border-t border-gray-200">
                              <h3 className="font-medium text-center">Get Your Quote</h3>
                              <div>
                                <div 
                                  className={`w-full border ${paddingClasses[styling.inputPadding]} text-left`}
                                  style={inputStyles}
                                >
                                  Your Name
                                </div>
                              </div>
                              <div>
                                <div 
                                  className={`w-full border ${paddingClasses[styling.inputPadding]} text-left`}
                                  style={inputStyles}
                                >
                                  Email Address
                                </div>
                              </div>
                              <button
                                className={`w-full text-white font-medium ${paddingClasses[styling.buttonPadding]} transition-colors`}
                                style={buttonStyles}
                              >
                                Submit Quote Request
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}