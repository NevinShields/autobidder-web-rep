import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Settings, 
  Save, 
  RotateCcw, 
  Monitor, 
  Smartphone,
  Grid2x2,
  Palette,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DesignSettings, StylingOptions } from "@shared/schema";
import VisualComponentEditor from "@/components/visual-component-editor";
import ThemeEditor from "@/components/theme-editor";

// Default styling options
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
  inputHeight: 40,
  inputWidth: 'full',
  multiChoiceImageSize: 'lg',
  multiChoiceImageShadow: 'md',
  multiChoiceImageBorderRadius: 12,
  multiChoiceCardBorderRadius: 12,
  multiChoiceCardShadow: 'sm',
  multiChoiceSelectedColor: '#2563EB',
  multiChoiceSelectedBgColor: '#EFF6FF',
  multiChoiceHoverBgColor: '#F8FAFC',
  multiChoiceLayout: 'grid',
  multipleChoiceActiveBackgroundColor: '#3B82F6',
  multipleChoiceActiveBorderColor: '#2563EB',
  multipleChoiceHoverBackgroundColor: '#F3F4F6',
  multipleChoiceHoverBorderColor: '#D1D5DB',
  questionCardBackgroundColor: '#FFFFFF',
  questionCardBorderRadius: 12,
  questionCardBorderWidth: 1,
  questionCardBorderColor: '#E5E7EB',
  questionCardShadow: 'sm',
  questionCardPadding: 'lg',
  serviceSelectorWidth: 900,
  serviceSelectorCardSize: 'lg',
  serviceSelectorCardsPerRow: 'auto',
  serviceSelectorBorderRadius: 16,
  serviceSelectorShadow: 'xl',
  serviceSelectorBackgroundColor: '#FFFFFF',
  serviceSelectorBorderWidth: 0,
  serviceSelectorBorderColor: '#E5E7EB',
  serviceSelectorSelectedBgColor: '#EFF6FF',
  serviceSelectorSelectedBorderColor: '#2563EB',
  serviceSelectorTitleFontSize: 'xl',
  serviceSelectorDescriptionFontSize: 'base',
  serviceSelectorTitleLineHeight: 'normal',
  serviceSelectorDescriptionLineHeight: 'normal',
  serviceSelectorTitleLetterSpacing: 'normal',
  serviceSelectorDescriptionLetterSpacing: 'normal',
  serviceSelectorIconSize: 'xl',
  serviceSelectorIconPosition: 'left',
  serviceSelectorIconSizeUnit: 'preset',
  serviceSelectorIconPixelSize: 48,
  serviceSelectorIconPercentSize: 30,
  serviceSelectorPadding: 'xl',
  serviceSelectorGap: 'lg',
  serviceSelectorContentAlignment: 'center',
  serviceSelectorActiveBackgroundColor: '#3B82F6',
  serviceSelectorActiveBorderColor: '#2563EB',
  serviceSelectorHoverBackgroundColor: '#F8FAFC',
  serviceSelectorHoverBorderColor: '#D1D5DB',
  pricingCardBackgroundColor: '#FFFFFF',
  pricingCardBorderRadius: 12,
  pricingCardBorderWidth: 1,
  pricingCardBorderColor: '#E5E7EB',
  pricingCardShadow: 'sm',
  pricingCardPadding: 'lg',
  containerPadding: 'lg',
  containerMargin: 'auto',
  containerMaxWidth: 'none',
  containerMinHeight: 'auto',
  headerAlignment: 'center',
  headerSpacing: 'md',
  headerBackgroundColor: 'transparent',
  headerBorderRadius: 0,
  headerShadow: 'none',
  headerPadding: 'md',
  footerAlignment: 'center',
  footerSpacing: 'md',
  footerBackgroundColor: 'transparent',
  footerBorderRadius: 0,
  footerShadow: 'none',
  footerPadding: 'md',
  formSpacing: 'md',
  formAlignment: 'left',
  formBackgroundColor: 'transparent',
  formBorderRadius: 0,
  formShadow: 'none',
  formPadding: 'none',
  formAnimationStyle: 'none'
};

// Default component styles
const defaultComponentStyles = {
  serviceSelector: {
    borderColor: '#E5E7EB',
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    activeBackgroundColor: '#3B82F6',
    activeBorderColor: '#2563EB',
    hoverBackgroundColor: '#F8FAFC',
    hoverBorderColor: '#D1D5DB',
    shadow: 'xl',
    height: 120,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 16,
    iconPosition: 'left',
    iconSize: 48,
    showImage: true,
  },
  textInput: {
    borderColor: '#E5E7EB', 
    borderWidth: 2,
    backgroundColor: '#F9FAFB',
    shadow: 'sm',
    height: 40,
    width: 'full',
    padding: 12,
    margin: 4,
    borderRadius: 10,
  },
  dropdown: {
    borderColor: '#E5E7EB',
    borderWidth: 2, 
    backgroundColor: '#F9FAFB',
    shadow: 'sm',
    height: 40,
    width: 'full',
    padding: 12,
    margin: 4,
    borderRadius: 10,
  },
  multipleChoice: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    activeBackgroundColor: '#3B82F6',
    activeBorderColor: '#2563EB',
    hoverBackgroundColor: '#F3F4F6',
    hoverBorderColor: '#D1D5DB',
    shadow: 'sm',
    height: 80,
    width: 'full',
    padding: 12,
    margin: 4,
    borderRadius: 12,
    showImage: true,
  },
  pricingCard: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadow: 'sm',
    height: 120,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 12,
  },
  questionCard: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadow: 'sm',
    height: 100,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 12,
  },
};

// Component configurations for the visual editor
const componentConfigs = [
  {
    id: 'service-selector',
    title: 'Service Selector Cards',
    description: 'Customize the appearance of service selection cards',
    type: 'service-selector' as const,
    icon: Grid2x2,
  },
  {
    id: 'text-input',
    title: 'Text Input Fields',
    description: 'Style text input fields and number inputs',
    type: 'text-input' as const,
    icon: Settings,
  },
  {
    id: 'dropdown',
    title: 'Dropdown Menus',
    description: 'Customize dropdown selection menus',
    type: 'dropdown' as const,
    icon: Settings,
  },
  {
    id: 'multiple-choice',
    title: 'Multiple Choice Options',
    description: 'Style multiple choice selection cards',
    type: 'multiple-choice' as const,
    icon: Grid2x2,
  },
  {
    id: 'pricing-card',
    title: 'Pricing Display',
    description: 'Customize the final pricing card appearance',
    type: 'pricing-card' as const,
    icon: Palette,
  },
  {
    id: 'question-card',
    title: 'Question Cards',
    description: 'Style question container cards',
    type: 'question-card' as const,
    icon: Settings,
  },
];

// Helper functions
const kebabToCamelCase = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

const camelToKebabCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

export default function DesignDashboard() {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [styling, setStyling] = useState<StylingOptions>(defaultStyling);
  const [componentStyles, setComponentStyles] = useState(defaultComponentStyles);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Throttling for API calls
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch design settings from new API
  const { data: designSettings, isLoading } = useQuery<DesignSettings>({
    queryKey: ['/api/design-settings'],
  });

  // Load saved design settings
  useEffect(() => {
    if (designSettings) {
      try {
        // Load styling
        if (designSettings.styling) {
          setStyling({ ...defaultStyling, ...designSettings.styling });
        }
        
        // Load component styles
        if (designSettings.componentStyles) {
          const savedComponentStyles = typeof designSettings.componentStyles === 'string' 
            ? JSON.parse(designSettings.componentStyles)
            : designSettings.componentStyles;
          
          // Merge with defaults to ensure all properties exist
          const mergedStyles = { ...defaultComponentStyles };
          Object.keys(mergedStyles).forEach(key => {
            if (savedComponentStyles[key]) {
              mergedStyles[key as keyof typeof mergedStyles] = {
                ...mergedStyles[key as keyof typeof mergedStyles],
                ...savedComponentStyles[key],
              };
            }
          });
          
          setComponentStyles(mergedStyles);
        }
        
        // Load device view
        if (designSettings.deviceView) {
          setDeviceView(designSettings.deviceView as 'desktop' | 'mobile');
        }
        
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error loading design settings:', error);
        toast({
          title: "Error Loading Design Settings",
          description: "Failed to load saved design settings. Using defaults.",
          variant: "destructive",
        });
      }
    }
  }, [designSettings, toast]);

  // Cleanup throttle timeout on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  // Save mutation for design settings
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", "/api/design-settings", {
        styling,
        componentStyles,
        deviceView
      });
      return response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setIsSaving(false);
      toast({
        title: "Design Saved",
        description: "Your design changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/design-settings'] });
    },
    onError: (error) => {
      setIsSaving(false);
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save design changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle styling changes (themes tab)
  const handleStylingChange = useCallback((updates: Partial<StylingOptions>) => {
    setStyling(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle component style changes
  const handleComponentStyleChange = useCallback((componentId: string, updates: any) => {
    const camelCaseId = kebabToCamelCase(componentId);
    setComponentStyles(prev => ({
      ...prev,
      [camelCaseId]: {
        ...prev[camelCaseId as keyof typeof prev],
        ...updates,
      },
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Toggle component expansion
  const toggleComponent = useCallback((componentId: string) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  }, []);

  // Save changes
  const handleSave = useCallback(() => {
    if (!hasUnsavedChanges || isSaving) return;
    
    setIsSaving(true);
    saveMutation.mutate();
  }, [hasUnsavedChanges, isSaving, saveMutation]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setStyling(defaultStyling);
    setComponentStyles(defaultComponentStyles);
    setDeviceView('desktop');
    setHasUnsavedChanges(true);
    toast({
      title: "Design Reset",
      description: "All design settings have been reset to defaults.",
    });
  }, [toast]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Design Dashboard</h1>
              <p className="text-gray-600">Customize your calculator's appearance and styling</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Device View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                    deviceView === 'desktop' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm">Desktop</span>
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                    deviceView === 'mobile' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm">Mobile</span>
                </button>
              </div>

              {/* Action Buttons */}
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button 
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="relative"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : hasUnsavedChanges ? (
                  <AlertCircle className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                You have unsaved changes. Click "Save Changes" to apply your updates.
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="components" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Components</span>
                </TabsTrigger>
                <TabsTrigger value="themes" className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Themes</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="components" className="mt-6">
                <div className="space-y-6">
                  {componentConfigs.map((component) => (
                    <VisualComponentEditor
                      key={component.id}
                      title={component.title}
                      description={component.description}
                      componentType={component.type}
                      isExpanded={expandedComponents.has(component.id)}
                      onToggle={() => toggleComponent(component.id)}
                      style={componentStyles[kebabToCamelCase(component.id) as keyof typeof componentStyles]}
                      onStyleChange={(updates) => handleComponentStyleChange(component.id, updates)}
                      onRealTimeChange={(updates) => handleComponentStyleChange(component.id, updates)}
                      styling={styling}
                      onStylingChange={
                        (component.type === 'service-selector' || component.type === 'multiple-choice') 
                          ? handleStylingChange 
                          : undefined
                      }
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="themes" className="mt-6">
                <ThemeEditor
                  styling={styling}
                  onChange={handleStylingChange}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Live Preview</span>
                  <Badge variant="secondary" className="ml-auto">
                    {deviceView === 'desktop' ? 'Desktop' : 'Mobile'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className={`mx-auto border-2 rounded-lg overflow-hidden bg-gray-50 ${
                    deviceView === 'desktop' ? 'w-full' : 'w-64 mx-auto'
                  }`}
                  style={{ 
                    height: deviceView === 'desktop' ? '400px' : '500px',
                    minHeight: '300px'
                  }}
                >
                  <div className="p-4 space-y-4 h-full overflow-y-auto">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Form Preview</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Real-time preview of your design changes
                      </p>
                    </div>
                    
                    {/* Sample Components */}
                    <div className="space-y-3">
                      {/* Service Selector Preview */}
                      <div 
                        className="border rounded-lg p-3 bg-white shadow-sm text-center"
                        style={{
                          borderColor: componentStyles.serviceSelector.borderColor,
                          borderRadius: `${componentStyles.serviceSelector.borderRadius}px`,
                          backgroundColor: componentStyles.serviceSelector.backgroundColor,
                        }}
                      >
                        <div className="text-sm font-semibold">Sample Service</div>
                        <div className="text-xs text-gray-600">Service description</div>
                      </div>

                      {/* Text Input Preview */}
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Sample Input"
                        style={{
                          borderColor: componentStyles.textInput.borderColor,
                          borderRadius: `${componentStyles.textInput.borderRadius}px`,
                          backgroundColor: componentStyles.textInput.backgroundColor,
                          height: `${Math.min(componentStyles.textInput.height, 48)}px`,
                        }}
                        disabled
                      />

                      {/* Multiple Choice Preview */}
                      <div className="space-y-2">
                        {[1, 2].map(i => (
                          <div
                            key={i}
                            className="flex items-center p-2 border rounded"
                            style={{
                              borderColor: componentStyles.multipleChoice.borderColor,
                              borderRadius: `${componentStyles.multipleChoice.borderRadius}px`,
                              backgroundColor: componentStyles.multipleChoice.backgroundColor,
                            }}
                          >
                            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2" />
                            <span className="text-xs">Option {i}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing Card Preview */}
                      <div 
                        className="border rounded-lg p-3 bg-white text-center"
                        style={{
                          borderColor: componentStyles.pricingCard.borderColor,
                          borderRadius: `${componentStyles.pricingCard.borderRadius}px`,
                          backgroundColor: componentStyles.pricingCard.backgroundColor,
                        }}
                      >
                        <div className="text-lg font-bold text-blue-600">$250</div>
                        <div className="text-xs text-gray-600">Estimated Price</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}