import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { BusinessSettings, StylingOptions } from "@shared/schema";
import VisualComponentEditor from "@/components/visual-component-editor";
import ThemeEditor from "@/components/theme-editor";

// Default component styles
const defaultComponentStyles = {
  serviceSelector: {
    borderColor: '#E5E7EB',
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    shadow: 'xl',
    height: 120,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 16,
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
    shadow: 'sm',
    height: 80,
    width: 'full',
    padding: 12,
    margin: 4,
    borderRadius: 12,
  },
  slider: {
    borderColor: '#2563EB',
    borderWidth: 0,
    backgroundColor: '#2563EB',
    shadow: 'none',
    height: 8,
    width: 'full',
    padding: 0,
    margin: 8,
    borderRadius: 4,
  },
  questionCard: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadow: 'sm',
    height: 160,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 12,
  },
  questionContainer: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
    shadow: 'md',
    height: 200,
    width: 'full',
    padding: 20,
    margin: 12,
    borderRadius: 16,
  },
  pricingCard: {
    borderColor: '#E5E7EB',
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    shadow: 'lg',
    height: 100,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 12,
  },
};

const componentDefinitions = [
  {
    id: 'service-selector',
    title: 'Service Selectors',
    description: 'Main service selection cards that customers use to choose services',
    type: 'service-selector' as const,
  },
  {
    id: 'text-input',
    title: 'Text Input Fields',
    description: 'Text input fields for customer information and measurements',
    type: 'text-input' as const,
  },
  {
    id: 'dropdown',
    title: 'Dropdown Fields',
    description: 'Dropdown selection fields for options and categories',
    type: 'dropdown' as const,
  },
  {
    id: 'multiple-choice',
    title: 'Multiple Choice Selectors',
    description: 'Visual multiple-choice options with images and descriptions',
    type: 'multiple-choice' as const,
  },
  {
    id: 'slider',
    title: 'Slider Inputs',
    description: 'Range slider inputs for numeric values (color effects only)',
    type: 'slider' as const,
  },
  {
    id: 'question-card',
    title: 'Question Cards',
    description: 'Individual question containers with titles and inputs',
    type: 'question-card' as const,
  },
  {
    id: 'question-container',
    title: 'Question Pack Container',
    description: 'Container that groups multiple related questions together',
    type: 'question-container' as const,
  },
  {
    id: 'pricing-card',
    title: 'Pricing Card',
    description: 'Price display card showing calculated totals and breakdowns',
    type: 'pricing-card' as const,
  },
];

// Helper function to convert kebab-case to camelCase
const kebabToCamelCase = (str: string): string => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

// Helper function to convert camelCase to kebab-case
const camelToKebabCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

export default function DesignDashboard() {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [componentStyles, setComponentStyles] = useState(() => {
    // Ensure all component styles have all required properties
    const initialStyles = { ...defaultComponentStyles };
    Object.keys(initialStyles).forEach(key => {
      initialStyles[key as keyof typeof initialStyles] = {
        ...initialStyles[key as keyof typeof initialStyles],
        borderColor: initialStyles[key as keyof typeof initialStyles].borderColor || '#E5E7EB',
        borderWidth: initialStyles[key as keyof typeof initialStyles].borderWidth ?? 1,
        backgroundColor: initialStyles[key as keyof typeof initialStyles].backgroundColor || '#FFFFFF',
        shadow: initialStyles[key as keyof typeof initialStyles].shadow || 'sm',
        height: initialStyles[key as keyof typeof initialStyles].height || 40,
        width: initialStyles[key as keyof typeof initialStyles].width || 'full',
        padding: initialStyles[key as keyof typeof initialStyles].padding ?? 12,
        margin: initialStyles[key as keyof typeof initialStyles].margin ?? 4,
        borderRadius: initialStyles[key as keyof typeof initialStyles].borderRadius ?? 8,
      };
    });
    return initialStyles;
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch business settings
  const { data: businessSettings, isLoading } = useQuery<BusinessSettings>({
    queryKey: ['/api/business-settings'],
  });

  const styling = (businessSettings as any)?.stylingOptions || {};

  // Load saved component styles when business settings are loaded
  useEffect(() => {
    if (businessSettings && (businessSettings as any).componentStyles) {
      try {
        const savedStyles = typeof (businessSettings as any).componentStyles === 'string' 
          ? JSON.parse((businessSettings as any).componentStyles)
          : (businessSettings as any).componentStyles;
        
        // Merge saved styles with defaults, ensuring all required properties exist
        const mergedStyles = { ...defaultComponentStyles };
        Object.keys(mergedStyles).forEach(key => {
          if (savedStyles[key]) {
            mergedStyles[key as keyof typeof mergedStyles] = {
              ...mergedStyles[key as keyof typeof mergedStyles],
              ...savedStyles[key],
              // Ensure required properties are never undefined
              borderColor: savedStyles[key].borderColor || mergedStyles[key as keyof typeof mergedStyles].borderColor || '#E5E7EB',
              borderWidth: savedStyles[key].borderWidth ?? mergedStyles[key as keyof typeof mergedStyles].borderWidth ?? 1,
              backgroundColor: savedStyles[key].backgroundColor || mergedStyles[key as keyof typeof mergedStyles].backgroundColor || '#FFFFFF',
              shadow: savedStyles[key].shadow || mergedStyles[key as keyof typeof mergedStyles].shadow || 'sm',
              height: savedStyles[key].height || mergedStyles[key as keyof typeof mergedStyles].height || 40,
              width: savedStyles[key].width || mergedStyles[key as keyof typeof mergedStyles].width || 'full',
              padding: savedStyles[key].padding ?? mergedStyles[key as keyof typeof mergedStyles].padding ?? 12,
              margin: savedStyles[key].margin ?? mergedStyles[key as keyof typeof mergedStyles].margin ?? 4,
              borderRadius: savedStyles[key].borderRadius ?? mergedStyles[key as keyof typeof mergedStyles].borderRadius ?? 8,
            };
          }
        });
        
        setComponentStyles(mergedStyles);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error parsing saved component styles:', error);
      }
    }
    
    // Load saved device view
    if (businessSettings && (businessSettings as any).deviceView) {
      setDeviceView((businessSettings as any).deviceView);
    }
  }, [businessSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedStyling: Partial<StylingOptions>) => {
      const response = await apiRequest("PUT", "/api/business-settings", {
        stylingOptions: updatedStyling
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-settings'] });
      setHasUnsavedChanges(false);
      toast({
        title: "Design saved successfully!",
        description: "Your design changes have been applied to all forms.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save design",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle styling changes
  const handleStylingChange = (key: keyof StylingOptions, value: any) => {
    const updatedStyling = { ...styling, [key]: value };
    setHasUnsavedChanges(true);
    
    // Save immediately for real-time updates
    saveMutation.mutate(updatedStyling);
  };

  // Handle component style changes
  const handleComponentStyleChange = (componentId: string, updates: any) => {
    const camelCaseKey = kebabToCamelCase(componentId);
    setComponentStyles(prev => ({
      ...prev,
      [camelCaseKey]: { ...prev[camelCaseKey as keyof typeof prev], ...updates }
    }));
    setHasUnsavedChanges(true);
  };

  // Save component styles
  const handleSaveComponentStyles = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest('PUT', '/api/component-styles', {
        componentStyles,
        deviceView,
      });
      
      // Invalidate business settings cache to reload saved component styles
      queryClient.invalidateQueries({ queryKey: ['/api/business-settings'] });
      
      setHasUnsavedChanges(false);
      toast({
        title: "Design Saved",
        description: "Your component styles have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving component styles:', error);
      toast({
        title: "Save Failed", 
        description: "Failed to save component styles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle component expansion
  const toggleComponent = (componentId: string) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  // Reset to defaults
  const handleReset = () => {
    setComponentStyles(defaultComponentStyles);
    setHasUnsavedChanges(false);
    toast({
      title: "Design reset to defaults",
      description: "All component styles have been restored to their default values.",
    });
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Form Design Studio</h1>
            <p className="text-gray-600 mt-1">
              Customize your forms with real-time visual editing and component-based design
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            {!hasUnsavedChanges && !isSaving && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
            <Button
              onClick={handleSaveComponentStyles}
              disabled={!hasUnsavedChanges || isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Design
                </>
              )}
            </Button>
            
            {/* Device Toggle */}
            <div className="flex rounded-md bg-gray-100 p-1">
              <Button
                variant={deviceView === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('desktop')}
                className="px-3"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={deviceView === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('mobile')}
                className="px-3"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Design Controls */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="components" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components" className="flex items-center space-x-2">
                  <Grid2x2 className="h-4 w-4" />
                  <span>Components</span>
                </TabsTrigger>
                <TabsTrigger value="themes" className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Themes</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="components" className="mt-6">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {componentDefinitions.map((component) => (
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
                </ScrollArea>
              </TabsContent>

              <TabsContent value="themes" className="mt-6">
                <ScrollArea className="h-[600px] pr-4">
                  <ThemeEditor
                    styling={styling}
                    onChange={handleStylingChange}
                  />
                </ScrollArea>
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
                        className="border rounded-lg p-3 text-center bg-white shadow-sm"
                        style={{
                          borderColor: componentStyles.pricingCard.borderColor,
                          borderRadius: `${componentStyles.pricingCard.borderRadius}px`,
                          backgroundColor: componentStyles.pricingCard.backgroundColor,
                        }}
                      >
                        <div className="text-lg font-bold text-green-600">$1,250</div>
                        <div className="text-xs text-gray-600">Total Cost</div>
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