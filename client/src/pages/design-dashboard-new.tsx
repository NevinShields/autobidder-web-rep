import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
  Loader2,
  MousePointer,
  ChevronDown,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DesignSettings, StylingOptions } from "@shared/schema";
import VisualComponentEditor from "@/components/visual-component-editor";
import ThemeEditor from "@/components/theme-editor";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const highlightCSS = (value: string) => {
  const escaped = escapeHtml(value);
  const patterns: Array<{ regex: RegExp; className: string }> = [
    { regex: /\/\*[\s\S]*?\*\//g, className: "css-token-comment" },
    { regex: /"[^"\n]*"|'[^'\n]*'/g, className: "css-token-string" },
    { regex: /#[0-9a-fA-F]{3,8}\b/g, className: "css-token-color" },
    { regex: /@\w[\w-]*/g, className: "css-token-atrule" },
    { regex: /\b\d+(\.\d+)?(px|rem|em|%|vh|vw|deg|s|ms)?\b/g, className: "css-token-number" },
    { regex: /(^|\n|\s)([a-zA-Z-]+)(?=\s*:)/g, className: "css-token-property" },
    { regex: /(^|\n)\s*([^{\n]+)(?=\s*\{)/g, className: "css-token-selector" },
  ];

  let highlighted = escaped;
  patterns.forEach(({ regex, className }) => {
    highlighted = highlighted.replace(regex, (match, prefix) => {
      if (className === "css-token-property" && typeof prefix === "string") {
        const property = match.replace(prefix, "");
        return `${prefix}<span class="${className}">${property}</span>`;
      }
      if (className === "css-token-selector" && typeof prefix === "string") {
        const selector = match.replace(prefix, "");
        return `${prefix}<span class="${className}">${selector.trim()}</span>`;
      }
      return `<span class="${className}">${match}</span>`;
    });
  });

  return highlighted;
};

const formatCustomCSS = (value: string) => {
  if (!value.trim()) return value;
  let formatted = value.replace(/\}\s*(?=[.#a-zA-Z])/g, '}\n');
  formatted = formatted.replace(/;\s*(?=\})/g, ';\n');
  return formatted;
};

// Default styling options
const defaultStyling: StylingOptions = {
  containerWidth: 700,
  containerHeight: 850,
  containerBorderRadius: 16,
  containerShadow: 'xl',
  containerBorderWidth: 0,
  containerBorderColor: '#E5E7EB',
  containerPadding: 8,
  containerMargin: 0,
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
  buttonBackgroundColor: '#2563EB',
  buttonTextColor: '#FFFFFF',
  buttonBorderWidth: 0,
  buttonBorderColor: '#2563EB',
  buttonHoverBackgroundColor: '#1d4ed8',
  buttonHoverTextColor: '#FFFFFF',
  buttonHoverBorderColor: '#1d4ed8',
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
  serviceSelectorIconPosition: 'top',
  serviceSelectorIconSizeUnit: 'preset',
  serviceSelectorIconPixelSize: 48,
  serviceSelectorIconPercentSize: 30,
  serviceSelectorMaxHeight: 300,
  serviceSelectorLineHeight: 20,
  serviceSelectorPadding: 'xl',
  serviceSelectorGap: 'lg',
  serviceSelectorContentAlignment: 'center',
  serviceSelectorActiveBackgroundColor: '#3B82F6',
  serviceSelectorActiveBorderColor: '#2563EB',
  serviceSelectorHoverBackgroundColor: '#F8FAFC',
  serviceSelectorHoverBorderColor: '#D1D5DB',
  pricingCardBorderRadius: 12,
  pricingCardShadow: 'lg',
  pricingCardBorderWidth: 0,
  pricingCardBorderColor: '#E5E7EB',
  pricingCardBackgroundColor: '#FFFFFF',
  pricingTextColor: '#1F2937',
  pricingAccentColor: '#2563EB',
  pricingIconVisible: true,
  pricingTextAlignment: 'left',
  pricingBulletIconType: 'checkmark',
  pricingBulletIconSize: 20,
  showPriceBreakdown: true,
  includeLedCapture: true,
  requireContactFirst: false,
  showBundleDiscount: false,
  bundleDiscountPercent: 10,
  enableSalesTax: false,
  salesTaxRate: 8.25,
  salesTaxLabel: 'Sales Tax',
  showProgressGuide: true,
  showFormTitle: true,
  showFormSubtitle: true,
  enableDisclaimer: false,
  disclaimerText: 'Prices are estimates and may vary based on specific requirements. Final pricing will be confirmed after consultation.',
  showSectionTitles: true,
  showStepDescriptions: true,
  enableBooking: true,
  requireName: true,
  requireEmail: true,
  requirePhone: false,
  enablePhone: true,
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
  enableImageUpload: false,
  requireImageUpload: false,
  imageUploadLabel: 'Upload Images',
  imageUploadDescription: 'Please upload relevant images to help us provide an accurate quote',
  maxImages: 5,
  maxImageSize: 10,
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  imageUploadHelperText: 'Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.',
  showOneQuestionAtTime: false,
  showOneSectionAtTime: false,
  requireNextButtonClick: false,
  formAnimationStyle: 'slide',
  enableCustomButton: false,
  customButtonText: 'Get Another Quote',
  customButtonUrl: ''
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
    showServiceIcon: true,
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
  slider: {
    borderColor: '#E5E7EB',
    borderWidth: 0,
    backgroundColor: '#2563EB',
    trackBackgroundColor: '#E2E8F0',
    shadow: 'none',
    height: 8,
    width: 'full',
    padding: 0,
    margin: 0,
    borderRadius: 999,
    thumbColor: '#2563EB',
    thumbSize: 20,
    thumbBorderRadius: 50,
  },
  button: {
    borderColor: '#2563EB',
    borderWidth: 0,
    backgroundColor: '#2563EB',
    shadow: 'md',
    height: 48,
    width: 'auto',
    padding: 16,
    margin: 4,
    borderRadius: 12,
    textColor: '#FFFFFF',
    fontSize: 'base',
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
    id: 'multiple-choice',
    title: 'Multiple Choice Options',
    description: 'Style multiple choice selection cards',
    type: 'multiple-choice' as const,
    icon: Grid2x2,
  },
  {
    id: 'slider',
    title: 'Slider Inputs',
    description: 'Customize slider/range input appearance',
    type: 'slider' as const,
    icon: Settings,
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
  {
    id: 'button',
    title: 'Action Buttons',
    description: 'Customize the appearance of form buttons',
    type: 'button' as const,
    icon: MousePointer,
  },
];

// Helper functions
const kebabToCamelCase = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

const camelToKebabCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

const mergeComponentStyles = (styles: any) => {
  let parsed = styles;
  if (typeof styles === 'string') {
    try {
      parsed = JSON.parse(styles);
    } catch (error) {
      console.warn('Failed to parse component styles:', error);
      parsed = {};
    }
  }
  const mergedStyles = { ...defaultComponentStyles };
  Object.keys(mergedStyles).forEach(key => {
    if (parsed?.[key]) {
      mergedStyles[key as keyof typeof mergedStyles] = {
        ...mergedStyles[key as keyof typeof mergedStyles],
        ...parsed[key],
      };
    }
  });
  return mergedStyles;
};

export default function DesignDashboard() {

  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [styling, setStyling] = useState<StylingOptions>(defaultStyling);
  const [componentStyles, setComponentStyles] = useState(defaultComponentStyles);
  const [customCSS, setCustomCSS] = useState('');
  const [customCSSError, setCustomCSSError] = useState('');
  const cssHighlightRef = useRef<HTMLPreElement | null>(null);
  const cssInputRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightedCSS = useMemo(() => highlightCSS(customCSS || ''), [customCSS]);
  const [isFormContainerExpanded, setIsFormContainerExpanded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCSS, setIsGeneratingCSS] = useState(false);
  const [aiCSSError, setAiCSSError] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Throttling for API calls
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch design settings from new API
  const { data: designSettings, isLoading } = useQuery<DesignSettings>({
    queryKey: ['/api/design-settings'],
  });
  const hasRestoredBackupRef = useRef(false);

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
          setComponentStyles(mergeComponentStyles(designSettings.componentStyles));
        }
        
        // Load custom CSS
        if (designSettings.customCSS) {
          setCustomCSS(formatCustomCSS(designSettings.customCSS));
        }
        
        // Store a local backup so settings don't appear "lost" if a future fetch fails
        try {
          localStorage.setItem(
            'design-settings-backup',
            JSON.stringify({
              styling: designSettings.styling,
              componentStyles: designSettings.componentStyles,
              customCSS: designSettings.customCSS || '',
            })
          );
        } catch (storageError) {
          console.warn('Failed to store design settings backup:', storageError);
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

  // Restore backup if design settings failed to load
  useEffect(() => {
    if (!designSettings && !isLoading && !hasRestoredBackupRef.current) {
      hasRestoredBackupRef.current = true;
      try {
        const backup = localStorage.getItem('design-settings-backup');
        if (!backup) return;
        const parsed = JSON.parse(backup);
        if (parsed?.styling) {
          setStyling({ ...defaultStyling, ...parsed.styling });
        }
        if (parsed?.componentStyles) {
          setComponentStyles(mergeComponentStyles(parsed.componentStyles));
        }
        if (typeof parsed?.customCSS === 'string') {
          setCustomCSS(parsed.customCSS);
        }
        toast({
          title: "Loaded Backup Design",
          description: "Using your last known design settings from this device.",
        });
      } catch (error) {
        console.warn('Failed to restore design settings backup:', error);
      }
    }
  }, [designSettings, isLoading, toast]);

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
        customCSS: customCSS.trim() || null
      });
      return response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setIsSaving(false);
      try {
        localStorage.setItem(
          'design-settings-backup',
          JSON.stringify({
            styling,
            componentStyles,
            customCSS: customCSS || '',
          })
        );
      } catch (storageError) {
        console.warn('Failed to update design settings backup:', storageError);
      }
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
        description: error instanceof Error ? error.message : "Failed to save design changes. Please try again.",
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

  // Handle custom CSS changes with validation
  const handleCustomCSSChange = useCallback((value: string) => {
    setCustomCSS(value);
    setHasUnsavedChanges(true);
    
    // Basic CSS validation
    if (value.trim()) {
      try {
        // Create a temporary style element to test CSS validity
        const tempStyle = document.createElement('style');
        tempStyle.textContent = value;
        document.head.appendChild(tempStyle);
        
        // If no errors, clear error state
        setCustomCSSError('');
        
        // Clean up
        document.head.removeChild(tempStyle);
      } catch (error) {
        setCustomCSSError('Invalid CSS syntax detected');
      }
    } else {
      setCustomCSSError('');
    }
  }, []);


  useEffect(() => {
    if (cssInputRef.current && cssHighlightRef.current) {
      cssHighlightRef.current.scrollTop = cssInputRef.current.scrollTop;
      cssHighlightRef.current.scrollLeft = cssInputRef.current.scrollLeft;
    }
  }, [customCSS]);

  // Handle AI CSS generation
  const handleGenerateCSS = useCallback(async (description: string) => {
    setIsGeneratingCSS(true);
    setAiCSSError('');
    
    try {
      const response = await apiRequest("POST", "/api/design-settings/generate-css", {
        description
      });
      const data = await response.json();
      
      if (data.css) {
        setCustomCSS(formatCustomCSS(data.css));
        setHasUnsavedChanges(true);
        toast({
          title: "CSS Generated!",
          description: "AI has generated custom CSS based on your description.",
        });
      }
    } catch (error) {
      console.error('CSS generation error:', error);
      setAiCSSError(error instanceof Error ? error.message : 'Failed to generate CSS. Please try again.');
    } finally {
      setIsGeneratingCSS(false);
    }
  }, [toast]);

  // Handle AI CSS editing
  const handleEditCSS = useCallback(async (editDescription: string) => {
    setIsGeneratingCSS(true);
    setAiCSSError('');
    
    try {
      const response = await apiRequest("POST", "/api/design-settings/edit-css", {
        currentCSS: customCSS,
        editDescription
      });
      const data = await response.json();
      
      if (data.css) {
        setCustomCSS(formatCustomCSS(data.css));
        setHasUnsavedChanges(true);
        toast({
          title: "CSS Edited!",
          description: "AI has updated your CSS based on your request.",
        });
        // Clear the input field
        const input = document.querySelector('[data-testid="input-ai-css-edit"]') as HTMLInputElement;
        if (input) input.value = '';
      }
    } catch (error) {
      console.error('CSS editing error:', error);
      setAiCSSError(error instanceof Error ? error.message : 'Failed to edit CSS. Please try again.');
      toast({
        title: "Edit Failed",
        description: error instanceof Error ? error.message : "Failed to edit CSS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCSS(false);
    }
  }, [customCSS, toast]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setStyling(defaultStyling);
    setComponentStyles(defaultComponentStyles);
    setCustomCSS('');
    setCustomCSSError('');
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
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Design Dashboard</h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Customize your calculator's appearance and styling</p>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              {/* Action Buttons */}
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleReset} className="flex-1 sm:flex-none">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
                
                <Button 
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="relative flex-1 sm:flex-none"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : hasUnsavedChanges ? (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  <span className="sm:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
                </Button>
              </div>
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
        <div className="w-full">
          {/* Editor Panel - Full Width */}
          <div className="w-full">
            <Tabs defaultValue="components" className="w-full">
              <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="inline-flex w-auto min-w-fit rounded-full bg-slate-100/80 dark:bg-gray-800/70 p-1 shadow-sm ring-1 ring-slate-200/70 dark:ring-gray-700/70 backdrop-blur">
                  <TabsTrigger
                    value="components"
                    className="h-10 rounded-full px-5 text-sm font-medium text-slate-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-white"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Components
                  </TabsTrigger>
                  <TabsTrigger
                    value="themes"
                    className="h-10 rounded-full px-5 text-sm font-medium text-slate-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-white"
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Themes
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom-css"
                    className="h-10 rounded-full px-5 text-sm font-medium text-slate-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Custom CSS
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="components" className="mt-6">
                <div className="space-y-6">
                  {/* Form Container Design */}
                  <Card className="mb-4">
                    <CardHeader className="pb-2 pt-0">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 -m-2 rounded"
                        onClick={() => setIsFormContainerExpanded(!isFormContainerExpanded)}
                      >
                        <div className="flex items-center space-x-3">
                          {isFormContainerExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <div className="flex flex-col justify-center">
                            <CardTitle className="text-base">Form Container</CardTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Customize the main form container spacing and appearance</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {isFormContainerExpanded && (
                      <CardContent className="pt-2">
                        <div className="space-y-3">
                          {/* Colors Row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-medium">Background Color</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="color"
                                  value={styling.backgroundColor || '#FFFFFF'}
                                  onChange={(e) => handleStylingChange({ backgroundColor: e.target.value })}
                                  className="w-12 h-8 p-1 border rounded cursor-pointer"
                                />
                                <Input
                                  type="text"
                                  value={styling.backgroundColor || '#FFFFFF'}
                                  onChange={(e) => handleStylingChange({ backgroundColor: e.target.value })}
                                  className="flex-1 text-xs h-8"
                                  placeholder="#FFFFFF"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Border Color</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="color"
                                  value={styling.containerBorderColor || '#E5E7EB'}
                                  onChange={(e) => handleStylingChange({ containerBorderColor: e.target.value })}
                                  className="w-12 h-8 p-1 border rounded cursor-pointer"
                                />
                                <Input
                                  type="text"
                                  value={styling.containerBorderColor || '#E5E7EB'}
                                  onChange={(e) => handleStylingChange({ containerBorderColor: e.target.value })}
                                  className="flex-1 text-xs h-8"
                                  placeholder="#E5E7EB"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Border Radius */}
                          <div>
                            <Label className="text-xs font-medium">Border Radius</Label>
                            <div className="flex items-center gap-3 mt-1">
                              <Slider
                                value={[styling.containerBorderRadius || 16]}
                                onValueChange={(value) => handleStylingChange({ containerBorderRadius: value[0] })}
                                max={50}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="min-w-[50px] text-center text-xs text-gray-500">
                                {styling.containerBorderRadius || 16}px
                              </span>
                            </div>
                          </div>

                          {/* Padding & Margin Row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-medium">Padding</Label>
                              <div className="flex items-center gap-3 mt-1">
                                <Slider
                                  value={[styling.containerPadding || 8]}
                                  onValueChange={(value) => handleStylingChange({ containerPadding: value[0] })}
                                  max={100}
                                  min={0}
                                  step={1}
                                  className="flex-1"
                                />
                                <span className="min-w-[50px] text-center text-xs text-gray-500">
                                  {styling.containerPadding || 8}px
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Margin</Label>
                              <div className="flex items-center gap-3 mt-1">
                                <Slider
                                  value={[styling.containerMargin || 0]}
                                  onValueChange={(value) => handleStylingChange({ containerMargin: value[0] })}
                                  max={100}
                                  min={0}
                                  step={1}
                                  className="flex-1"
                                />
                                <span className="min-w-[50px] text-center text-xs text-gray-500">
                                  {styling.containerMargin || 0}px
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

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
                        (component.type === 'service-selector' || component.type === 'multiple-choice' || component.type === 'pricing-card') 
                          ? (key: string, value: any) => handleStylingChange({ [key]: value })
                          : undefined
                      }
                    />
                  ))}
                  
                  {/* Custom CSS Section */}
                  
                </div>
              </TabsContent>

              <TabsContent value="themes" className="mt-6">
                <ThemeEditor
                  designSettings={{ styling, componentStyles }}
                  onChange={(updates) => {
                    if (updates.styling) {
                      handleStylingChange(updates.styling);
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="custom-css" className="mt-6">
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Custom CSS</CardTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Generate or edit custom CSS that overrides component settings.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* CSS Class Reference & Examples */}
                      <div className="space-y-3">
                        {/* Class Reference */}
                        <details className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <summary className="text-xs font-semibold cursor-pointer text-blue-900 dark:text-blue-100">
                            📋 Available CSS Classes (click to expand)
                          </summary>
                          <div className="mt-3 space-y-3 text-xs font-mono">
                            {/* Form & Container */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Form & Container:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-form-container</span> - Form wrapper</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-question-card</span> - Question cards</div>
                              </div>
                            </div>
                            {/* Buttons */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Buttons:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-button</span> - All buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-button-primary</span> - Primary buttons</div>
                              </div>
                            </div>
                            {/* Input Fields */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Input Fields:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-input</span> - All inputs (base)</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-number-input</span> - Number inputs</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-text-input</span> - Text inputs</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-textarea</span> - Textareas</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-select</span> - Dropdown triggers</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-select-content</span> - Dropdown menu</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-checkbox</span> - Checkboxes</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-address-input</span> - Address inputs</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-file-input</span> - File uploads</div>
                              </div>
                            </div>
                            {/* Slider */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Slider:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider</span> - Range sliders</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider-value</span> - Slider value</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider-unit</span> - Slider unit</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider-min</span> - Min label</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider-max</span> - Max label</div>
                              </div>
                            </div>
                            {/* Labels */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Labels:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-label</span> - All labels</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-question-label</span> - Question labels</div>
                              </div>
                            </div>
                            {/* Service Cards */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Service Cards:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-service-card</span> - Service cards</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-service-title</span> - Service titles</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-service-accordion</span> - Accordion headers</div>
                              </div>
                            </div>
                            {/* Multiple Choice */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Multiple Choice:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-multiple-choice</span> - Choice cards</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-multichoice-card</span> - Choice cards (alt)</div>
                              </div>
                            </div>
                            {/* Pricing Cards */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Pricing Cards:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card</span> - Pricing cards</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-price</span> - Price badge</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-icon</span> - Service icon</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-title</span> - Service title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-description</span> - Description</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-bullet-icon</span> - Bullet icons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-bullet-text</span> - Bullet text</div>
                              </div>
                            </div>
                            {/* Calendar */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Booking Calendar:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-nav</span> - Nav buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-nav-prev</span> - Prev button</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-nav-next</span> - Next button</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-month-title</span> - Month title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-day-header</span> - Day headers</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-date</span> - Date buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-time-slot</span> - Time slots</div>
                              </div>
                            </div>
                            {/* State Classes */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">State & Utility:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.selected</span> - Selected state</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.disabled</span> - Disabled state</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-error</span> - Error messages</div>
                              </div>
                            </div>
                          </div>
                        </details>

                        {/* CSS Variables Info */}
                        <details className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                          <summary className="text-xs font-semibold cursor-pointer text-green-900 dark:text-green-100">
                            🎨 CSS Variables (click to expand)
                          </summary>
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-green-800 dark:text-green-200">Your design settings are available as CSS variables. Use them or override with your own values:</p>
                            <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                              <div><span className="text-green-600 dark:text-green-400">--ab-primary-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-button-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-button-text-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-button-hover-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-button-border-radius</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-input-border-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-input-border-radius</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-border-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-border-radius</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-active-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-hover-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-multiple-choice-border-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-multiple-choice-active-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-multiple-choice-hover-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-label-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-label-font-family</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-label-font-weight</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-label-font-size</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-title-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-title-font-family</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-title-font-weight</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-title-font-size</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-border-radius</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-border-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-border-width</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-shadow</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-padding</span></div>
                            </div>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-2 italic">✨ Custom CSS overrides inline styles - full control!</p>
                          </div>
                        </details>

                        {/* Examples Dropdown */}
                        <details className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <summary className="text-xs font-semibold cursor-pointer text-purple-900 dark:text-purple-100">
                            📚 Example CSS Patterns (click to expand)
                          </summary>
                          <div className="mt-3 space-y-3 text-xs">
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Hover Effects on Service Cards:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`.ab-service-card:hover {\n  transform: scale(1.05);\n  box-shadow: 0 10px 20px rgba(0,0,0,0.15);\n  border-color: #3B82F6;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Style Selected Service Cards:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`.ab-service-card.selected {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  border: 3px solid #764ba2;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Gradient Buttons:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`.ab-button-primary {\n  background: linear-gradient(to right, #3B82F6, #8B5CF6);\n  border: none;\n  transition: all 0.3s ease;\n}\n\n.ab-button-primary:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Custom Input Focus States:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`.ab-input:focus {\n  border-color: #8B5CF6;\n  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);\n  outline: none;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Customize Range Sliders:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`/* Style slider track and thumb */\n.ab-slider [role=\"slider\"] {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  width: 20px;\n  height: 20px;\n  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.5);\n}\n\n/* Style slider value display */\n.ab-slider-value {\n  font-weight: 700;\n  color: #667eea;\n  font-size: 1.25rem;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Customize Question Labels & Service Titles:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`/* Style question labels */\n.ab-question-label {\n  font-family: 'Georgia', serif;\n  font-weight: 600;\n  font-size: 1rem;\n  color: #1E40AF;\n}\n\n/* Style service titles */\n.ab-service-title {\n  font-family: 'Roboto', sans-serif;\n  font-weight: 700;\n  color: #DC2626;\n  text-transform: uppercase;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Customize Pricing Cards:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`/* Style pricing card wrapper */\n.ab-pricing-card {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  border: 2px solid #764ba2;\n  border-radius: 20px;\n  box-shadow: 0 25px 50px rgba(118, 75, 162, 0.3);\n}\n\n/* Style price badge */\n.ab-pricing-card-price {\n  background: #F59E0B !important;\n  color: white !important;\n  font-size: 1.5rem;\n}\n\n/* Style service title on card */\n.ab-pricing-card-title {\n  font-family: 'Georgia', serif;\n  color: white;\n  text-shadow: 0 2px 4px rgba(0,0,0,0.2);\n}\n\n/* Style bullet icons */\n.ab-pricing-card-bullet-icon {\n  background: #10B981 !important;\n}`}</code></pre>
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* AI CSS Generation */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">AI CSS Generator</h4>
                          <Badge variant="secondary" className="text-xs">New ✨</Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          Describe the design style you want and AI will generate custom CSS for you
                        </p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Neumorphism, Glassmorphism, Dark mode with neon accents..."
                            className="text-sm flex-1"
                            data-testid="input-ai-css-description"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget as HTMLInputElement;
                                if (input.value.trim()) {
                                  handleGenerateCSS(input.value);
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector('[data-testid="input-ai-css-description"]') as HTMLInputElement;
                              if (input?.value.trim()) {
                                handleGenerateCSS(input.value);
                              }
                            }}
                            disabled={isGeneratingCSS}
                            data-testid="button-generate-css"
                          >
                            {isGeneratingCSS ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                        {aiCSSError && (
                          <p className="text-xs text-red-600 mt-2">{aiCSSError}</p>
                        )}
                      </div>

                      {/* CSS Textarea */}
                      <div>
                        <Label className="text-sm font-medium">Custom CSS Code</Label>
                        <div className="css-editor-wrapper mt-2">
                          <pre
                            ref={cssHighlightRef}
                            className="css-editor-highlight"
                            aria-hidden="true"
                            dangerouslySetInnerHTML={{
                              __html: highlightedCSS || "",
                            }}
                          />
                          <Textarea
                            ref={cssInputRef}
                            value={customCSS}
                            onChange={(e) => handleCustomCSSChange(e.target.value)}
                            onScroll={(e) => {
                              if (cssHighlightRef.current) {
                                cssHighlightRef.current.scrollTop = e.currentTarget.scrollTop;
                                cssHighlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
                              }
                            }}
                            className="css-editor-input font-mono text-xs min-h-[200px]"
                            placeholder={`/* Add your custom CSS here. Examples:\n\n/* Style service cards */\n.ab-service-card {\n  border: 2px solid #3B82F6;\n  border-radius: 12px;\n}\n\n.ab-service-card:hover {\n  transform: scale(1.05);\n  box-shadow: 0 10px 20px rgba(0,0,0,0.15);\n}\n\n/* Style buttons */\n.ab-button-primary {\n  background: linear-gradient(to right, #3B82F6, #8B5CF6);\n  border: none;\n}\n\n.ab-button-primary:hover {\n  transform: translateY(-2px);\n}\n\n/* Style inputs */\n.ab-input:focus {\n  border-color: #8B5CF6;\n  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);\n}\n*/`}
                          />
                        </div>
                        {customCSSError && (
                          <p className="text-xs text-red-600 mt-1">{customCSSError}</p>
                        )}

                        {/* AI Edit CSS Feature */}
                        {customCSS && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-blue-600" />
                              <h5 className="text-xs font-semibold text-blue-900">AI Edit CSS</h5>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Describe changes you want to make to your existing CSS
                            </p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g., Make buttons bigger, Change cards to red, Add glow effect..."
                                className="text-sm flex-1"
                                data-testid="input-ai-css-edit"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.currentTarget as HTMLInputElement;
                                    if (input.value.trim()) {
                                      handleEditCSS(input.value);
                                    }
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const input = document.querySelector('[data-testid="input-ai-css-edit"]') as HTMLInputElement;
                                  if (input?.value.trim()) {
                                    handleEditCSS(input.value);
                                  }
                                }}
                                disabled={isGeneratingCSS}
                                data-testid="button-edit-css"
                              >
                                {isGeneratingCSS ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Editing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Edit
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          ⚠️ Custom CSS will override editor settings. If errors occur, styles will revert to editor settings.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
