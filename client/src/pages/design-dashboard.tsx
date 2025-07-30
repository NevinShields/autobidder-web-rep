import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
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
import { Switch } from "@/components/ui/switch";
import { 
  Eye, Palette, Type, Square, MousePointer, 
  Layout, Paintbrush, Monitor, Smartphone, 
  Settings, Save, RotateCcw, Wand2, Grid2x2
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
  // Form behavior settings
  showOneQuestionAtTime: false,
  showOneSectionAtTime: false,
  requireNextButtonClick: false,
  formAnimationStyle: 'slide' as const,
  serviceSelectorWidth: 900,
  serviceSelectorCardSize: 'lg',
  serviceSelectorCardsPerRow: 'auto',
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
  serviceSelectorTitleLineHeight: 'normal',
  serviceSelectorDescriptionLineHeight: 'normal',
  serviceSelectorTitleLetterSpacing: 'normal',
  serviceSelectorDescriptionLetterSpacing: 'normal',
  serviceSelectorIconSize: 'xl',
  serviceSelectorPadding: 'xl',
  serviceSelectorGap: 'lg',
  pricingCardBorderRadius: 12,
  pricingCardShadow: 'lg',
  pricingCardBorderWidth: 0,
  pricingCardBorderColor: '#E5E7EB',
  pricingCardBackgroundColor: '#FFFFFF',
  pricingTextColor: '#1F2937',
  pricingAccentColor: '#2563EB',
  enableBooking: true,
  showPriceBreakdown: true,
  includeLedCapture: true,
  showProgressGuide: true,
  showFormTitle: true,
  showFormSubtitle: true,
  showSectionTitles: true,
  showStepDescriptions: true,
  requireContactFirst: false,
  showBundleDiscount: false,
  bundleDiscountPercent: 10,
  enableSalesTax: false,
  salesTaxRate: 8.25,
  salesTaxLabel: 'Sales Tax',
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
  enableDisclaimer: false,
  disclaimerText: 'Prices are estimates and may vary based on specific requirements. Final pricing will be confirmed after consultation.',
};

export default function DesignDashboard() {
  const [businessName, setBusinessName] = useState("");
  const [enableLeadCapture, setEnableLeadCapture] = useState(true);
  const [styling, setStyling] = useState<StylingOptions>(defaultStyling);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Font size conversion functions
  const getFontSizeValue = (size: string) => {
    const sizeMap: { [key: string]: number } = {
      'xs': 12,
      'sm': 14,
      'base': 16,
      'lg': 18,
      'xl': 20,
      '2xl': 24
    };
    return sizeMap[size] || 16;
  };

  const getFontSizeFromValue = (value: number) => {
    const valueMap: { [key: number]: string } = {
      12: 'xs',
      14: 'sm',
      16: 'base',
      18: 'lg',
      20: 'xl',
      24: '2xl'
    };
    return valueMap[value] || 'base';
  };

  const getFontSizeLabel = (size: string) => {
    const labelMap: { [key: string]: string } = {
      'xs': '12px',
      'sm': '14px',
      'base': '16px',
      'lg': '18px',
      'xl': '20px',
      '2xl': '24px'
    };
    return labelMap[size] || '16px';
  };

  // Padding/spacing conversion functions for 1px increments
  const getPaddingValue = (padding: string | number) => {
    if (typeof padding === 'number') return padding;
    const paddingMap: { [key: string]: number } = {
      'xs': 4,
      'sm': 8,
      'md': 16,
      'lg': 20,
      'xl': 24,
      '2xl': 32
    };
    return paddingMap[padding] || 16;
  };

  const getPaddingFromValue = (value: number) => {
    // For values that match standard sizes, return the size name
    const valueMap: { [key: number]: string } = {
      4: 'xs',
      8: 'sm',
      16: 'md',
      20: 'lg',
      24: 'xl',
      32: '2xl'
    };
    return valueMap[value] || value.toString();
  };

  const getPaddingLabel = (padding: string | number) => {
    const paddingValue = getPaddingValue(padding);
    return `${paddingValue}px`;
  };



  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/business-settings"],
  });

  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
  });

  // Update state when settings data is loaded
  useEffect(() => {
    if (settings && typeof settings === 'object' && 'id' in settings) {
      const typedSettings = settings as BusinessSettings;
      setBusinessName(typedSettings.businessName);
      setEnableLeadCapture(typedSettings.enableLeadCapture);
      setStyling(typedSettings.styling);
    }
  }, [settings]);

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

  // Apply theme presets
  const applyTheme = (themeName: string) => {
    let themeSettings: Partial<StylingOptions> = {};
    
    switch (themeName) {
      case 'modern':
        themeSettings = {
          fontFamily: 'inter',
          containerBorderRadius: 16,
          containerShadow: 'lg',
          primaryColor: '#2563EB',
          buttonBorderRadius: 12,
          buttonShadow: 'md',
          inputBorderRadius: 10,
          inputShadow: 'sm',
          inputHeight: 48,
          inputFontSize: 'base',
          inputPadding: 'md',
          inputBackgroundColor: '#FFFFFF',
          inputBorderColor: '#D1D5DB',
          inputBorderWidth: 1,
          inputTextColor: '#374151',
          multiChoiceImageSize: 'lg',
          multiChoiceImageBorderRadius: 12,
          multiChoiceImageShadow: 'md',
          multiChoiceCardBorderRadius: 12,
          multiChoiceCardShadow: 'sm',
          multiChoiceSelectedColor: '#2563EB',
          multiChoiceSelectedBgColor: '#EFF6FF',
          multiChoiceHoverBgColor: '#F8FAFC',
          pricingCardBorderRadius: 16,
          pricingCardShadow: 'lg',
          pricingCardBorderWidth: 0,
          pricingCardBorderColor: '#E5E7EB',
          pricingCardBackgroundColor: '#FFFFFF',
          pricingTextColor: '#1F2937',
          pricingAccentColor: '#2563EB',
          serviceSelectorWidth: 900,
          serviceSelectorCardSize: 'lg',
          serviceSelectorCardsPerRow: 'auto',
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
          serviceSelectorGap: 'lg'
        };
        break;
      case 'professional':
        themeSettings = {
          fontFamily: 'roboto',
          containerBorderRadius: 8,
          containerShadow: 'md',
          primaryColor: '#4B5563',
          buttonBorderRadius: 6,
          buttonShadow: 'sm',
          inputBorderRadius: 6,
          inputShadow: 'none',
          inputHeight: 40,
          inputFontSize: 'sm',
          inputPadding: 'sm',
          inputBackgroundColor: '#F9FAFB',
          inputBorderColor: '#D1D5DB',
          inputBorderWidth: 1,
          inputTextColor: '#374151',
          multiChoiceImageSize: 'md',
          multiChoiceImageBorderRadius: 8,
          multiChoiceImageShadow: 'none',
          multiChoiceCardBorderRadius: 8,
          multiChoiceCardShadow: 'none',
          multiChoiceSelectedColor: '#4B5563',
          multiChoiceSelectedBgColor: '#F3F4F6',
          multiChoiceHoverBgColor: '#F9FAFB',
          serviceSelectorWidth: 800,
          serviceSelectorCardSize: 'md',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 8,
          serviceSelectorShadow: 'md',
          serviceSelectorBackgroundColor: '#F9FAFB',
          serviceSelectorBorderWidth: 1,
          serviceSelectorBorderColor: '#D1D5DB',
          serviceSelectorHoverBgColor: '#F3F4F6',
          serviceSelectorHoverBorderColor: '#9CA3AF',
          serviceSelectorSelectedBgColor: '#F3F4F6',
          serviceSelectorSelectedBorderColor: '#4B5563',
          serviceSelectorTitleFontSize: 'lg',
          serviceSelectorDescriptionFontSize: 'sm',
          serviceSelectorIconSize: 'lg',
          serviceSelectorPadding: 'lg',
          serviceSelectorGap: 'md',
          pricingCardBorderRadius: 8,
          pricingCardShadow: 'none',
          pricingCardBorderWidth: 1,
          pricingCardBorderColor: '#E5E7EB',
          pricingCardBackgroundColor: '#F9FAFB',
          pricingTextColor: '#374151',
          pricingAccentColor: '#4B5563'
        };
        break;
      case 'vibrant':
        themeSettings = {
          fontFamily: 'montserrat',
          containerBorderRadius: 20,
          containerShadow: 'xl',
          primaryColor: '#8B5CF6',
          buttonBorderRadius: 16,
          buttonShadow: 'lg',
          inputBorderRadius: 14,
          inputShadow: 'md',
          inputHeight: 52,
          inputFontSize: 'lg',
          inputPadding: 'lg',
          inputBackgroundColor: '#FFFFFF',
          inputBorderColor: '#C084FC',
          inputBorderWidth: 2,
          inputTextColor: '#1F2937',
          multiChoiceImageSize: 'xl',
          multiChoiceImageBorderRadius: 16,
          multiChoiceImageShadow: 'lg',
          multiChoiceCardBorderRadius: 16,
          multiChoiceCardShadow: 'md',
          multiChoiceSelectedColor: '#8B5CF6',
          multiChoiceSelectedBgColor: '#F3E8FF',
          multiChoiceHoverBgColor: '#FAF5FF',
          serviceSelectorWidth: 1000,
          serviceSelectorCardSize: 'xl',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 20,
          serviceSelectorShadow: 'xl',
          serviceSelectorBackgroundColor: '#FFFFFF',
          serviceSelectorBorderWidth: 0,
          serviceSelectorBorderColor: '#C084FC',
          serviceSelectorHoverBgColor: '#FAF5FF',
          serviceSelectorHoverBorderColor: '#DDD6FE',
          serviceSelectorSelectedBgColor: '#F3E8FF',
          serviceSelectorSelectedBorderColor: '#8B5CF6',
          serviceSelectorTitleFontSize: '2xl',
          serviceSelectorDescriptionFontSize: 'lg',
          serviceSelectorIconSize: 'xl',
          serviceSelectorPadding: 'xl',
          serviceSelectorGap: 'xl',
          pricingCardBorderRadius: 20,
          pricingCardShadow: 'lg',
          pricingCardBorderWidth: 0,
          pricingCardBorderColor: '#C084FC',
          pricingCardBackgroundColor: '#FFFFFF',
          pricingTextColor: '#1F2937',
          pricingAccentColor: '#8B5CF6'
        };
        break;
      case 'minimal':
        themeSettings = {
          fontFamily: 'open-sans',
          containerBorderRadius: 4,
          containerShadow: 'sm',
          primaryColor: '#10B981',
          buttonBorderRadius: 4,
          buttonShadow: 'none',
          inputBorderRadius: 4,
          inputShadow: 'none',
          inputHeight: 36,
          inputFontSize: 'sm',
          inputPadding: 'sm',
          inputBackgroundColor: '#FFFFFF',
          inputBorderColor: '#D1D5DB',
          inputBorderWidth: 1,
          inputTextColor: '#374151',
          multiChoiceImageSize: 'sm',
          multiChoiceImageBorderRadius: 4,
          multiChoiceImageShadow: 'none',
          multiChoiceCardBorderRadius: 4,
          multiChoiceCardShadow: 'none',
          multiChoiceSelectedColor: '#10B981',
          multiChoiceSelectedBgColor: '#ECFDF5',
          multiChoiceHoverBgColor: '#F0FDF4',
          serviceSelectorWidth: 700,
          serviceSelectorCardSize: 'sm',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 4,
          serviceSelectorShadow: 'sm',
          serviceSelectorBackgroundColor: '#FFFFFF',
          serviceSelectorBorderWidth: 1,
          serviceSelectorBorderColor: '#D1FAE5',
          serviceSelectorHoverBgColor: '#F0FDF4',
          serviceSelectorHoverBorderColor: '#BBF7D0',
          serviceSelectorSelectedBgColor: '#ECFDF5',
          serviceSelectorSelectedBorderColor: '#10B981',
          serviceSelectorTitleFontSize: 'base',
          serviceSelectorDescriptionFontSize: 'sm',
          serviceSelectorIconSize: 'md',
          serviceSelectorPadding: 'md',
          serviceSelectorGap: 'sm',
          pricingCardBorderRadius: 4,
          pricingCardShadow: 'none',
          pricingCardBorderWidth: 0,
          pricingCardBorderColor: '#10B981',
          pricingCardBackgroundColor: '#FFFFFF',
          pricingTextColor: '#065F46',
          pricingAccentColor: '#10B981'
        };
        break;
      case 'elegant':
        themeSettings = {
          fontFamily: 'lato',
          containerBorderRadius: 12,
          containerShadow: 'lg',
          primaryColor: '#D97706',
          buttonBorderRadius: 10,
          buttonShadow: 'md',
          inputBorderRadius: 8,
          inputShadow: 'sm',
          inputHeight: 44,
          inputFontSize: 'base',
          inputPadding: 'md',
          inputBackgroundColor: '#FFFBEB',
          inputBorderColor: '#FCD34D',
          inputBorderWidth: 1,
          inputTextColor: '#92400E',
          multiChoiceImageSize: 'lg',
          multiChoiceImageBorderRadius: 10,
          multiChoiceImageShadow: 'md',
          multiChoiceCardBorderRadius: 10,
          multiChoiceCardShadow: 'sm',
          multiChoiceSelectedColor: '#D97706',
          multiChoiceSelectedBgColor: '#FEF3C7',
          multiChoiceHoverBgColor: '#FFFBEB',
          serviceSelectorWidth: 850,
          serviceSelectorCardSize: 'lg',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 12,
          serviceSelectorShadow: 'lg',
          serviceSelectorBackgroundColor: '#FFFBEB',
          serviceSelectorBorderWidth: 0,
          serviceSelectorBorderColor: '#FCD34D',
          serviceSelectorHoverBgColor: '#FEF3C7',
          serviceSelectorHoverBorderColor: '#FBBF24',
          serviceSelectorSelectedBgColor: '#FEF3C7',
          serviceSelectorSelectedBorderColor: '#D97706',
          serviceSelectorTitleFontSize: 'xl',
          serviceSelectorDescriptionFontSize: 'base',
          serviceSelectorIconSize: 'lg',
          serviceSelectorPadding: 'lg',
          serviceSelectorGap: 'lg',
          pricingCardBorderRadius: 12,
          pricingCardShadow: 'md',
          pricingCardBorderWidth: 0,
          pricingCardBorderColor: '#D97706',
          pricingCardBackgroundColor: '#FFFBEB',
          pricingTextColor: '#92400E',
          pricingAccentColor: '#D97706'
        };
        break;
      case 'dark':
        themeSettings = {
          fontFamily: 'inter',
          containerBorderRadius: 20,
          containerShadow: 'xl',
          backgroundColor: '#111827',
          primaryColor: '#F59E0B',
          textColor: '#F9FAFB',
          buttonBorderRadius: 12,
          buttonShadow: 'lg',
          inputBorderRadius: 12,
          inputShadow: 'md',
          inputHeight: 48,
          inputFontSize: 'base',
          inputPadding: 'lg',
          inputBackgroundColor: '#1F2937',
          inputBorderColor: '#374151',
          inputBorderWidth: 1,
          inputTextColor: '#F9FAFB',
          multiChoiceImageSize: 'lg',
          multiChoiceImageBorderRadius: 16,
          multiChoiceImageShadow: 'lg',
          multiChoiceCardBorderRadius: 16,
          multiChoiceCardShadow: 'md',
          multiChoiceSelectedColor: '#F59E0B',
          multiChoiceSelectedBgColor: '#451A03',
          multiChoiceHoverBgColor: '#292524',
          serviceSelectorWidth: 900,
          serviceSelectorCardSize: 'lg',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 20,
          serviceSelectorShadow: 'xl',
          serviceSelectorBackgroundColor: '#1F2937',
          serviceSelectorBorderWidth: 1,
          serviceSelectorBorderColor: '#374151',
          serviceSelectorHoverBgColor: '#292524',
          serviceSelectorHoverBorderColor: '#FCD34D',
          serviceSelectorSelectedBgColor: '#451A03',
          serviceSelectorSelectedBorderColor: '#F59E0B',
          serviceSelectorTitleFontSize: 'xl',
          serviceSelectorDescriptionFontSize: 'base',
          serviceSelectorIconSize: 'xl',
          serviceSelectorPadding: 'xl',
          serviceSelectorGap: 'lg',
          pricingCardBorderRadius: 20,
          pricingCardShadow: 'lg',
          pricingCardBorderWidth: 1,
          pricingCardBorderColor: '#374151',
          pricingCardBackgroundColor: '#1F2937',
          pricingTextColor: '#F9FAFB',
          pricingAccentColor: '#F59E0B'
        };
        break;
      case 'retro':
        themeSettings = {
          fontFamily: 'montserrat',
          containerBorderRadius: 0,
          containerShadow: 'none',
          backgroundColor: '#FEF3C7',
          primaryColor: '#DC2626',
          textColor: '#7C2D12',
          buttonBorderRadius: 0,
          buttonShadow: 'none',
          inputBorderRadius: 0,
          inputShadow: 'none',
          inputHeight: 44,
          inputFontSize: 'lg',
          inputPadding: 'lg',
          inputBackgroundColor: '#FFFFFF',
          inputBorderColor: '#DC2626',
          inputBorderWidth: 3,
          inputTextColor: '#7C2D12',
          multiChoiceImageSize: 'lg',
          multiChoiceImageBorderRadius: 0,
          multiChoiceImageShadow: 'none',
          multiChoiceCardBorderRadius: 0,
          multiChoiceCardShadow: 'none',
          multiChoiceSelectedColor: '#DC2626',
          multiChoiceSelectedBgColor: '#FEE2E2',
          multiChoiceHoverBgColor: '#FEF2F2',
          serviceSelectorWidth: 850,
          serviceSelectorCardSize: 'lg',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 0,
          serviceSelectorShadow: 'none',
          serviceSelectorBackgroundColor: '#FFFFFF',
          serviceSelectorBorderWidth: 3,
          serviceSelectorBorderColor: '#DC2626',
          serviceSelectorHoverBgColor: '#FEF2F2',
          serviceSelectorHoverBorderColor: '#B91C1C',
          serviceSelectorSelectedBgColor: '#FEE2E2',
          serviceSelectorSelectedBorderColor: '#DC2626',
          serviceSelectorTitleFontSize: 'xl',
          serviceSelectorDescriptionFontSize: 'base',
          serviceSelectorIconSize: 'xl',
          serviceSelectorPadding: 'lg',
          serviceSelectorGap: 'md',
          pricingCardBorderRadius: 0,
          pricingCardShadow: 'none',
          pricingCardBorderWidth: 3,
          pricingCardBorderColor: '#DC2626',
          pricingCardBackgroundColor: '#FFFFFF',
          pricingTextColor: '#7C2D12',
          pricingAccentColor: '#DC2626'
        };
        break;
      case 'soft':
        themeSettings = {
          fontFamily: 'lato',
          containerBorderRadius: 24,
          containerShadow: 'sm',
          backgroundColor: '#FDF2F8',
          primaryColor: '#EC4899',
          textColor: '#831843',
          buttonBorderRadius: 20,
          buttonShadow: 'sm',
          inputBorderRadius: 16,
          inputShadow: 'sm',
          inputHeight: 50,
          inputFontSize: 'base',
          inputPadding: 'lg',
          inputBackgroundColor: '#FFFFFF',
          inputBorderColor: '#F9A8D4',
          inputBorderWidth: 1,
          inputTextColor: '#831843',
          multiChoiceImageSize: 'lg',
          multiChoiceImageBorderRadius: 20,
          multiChoiceImageShadow: 'sm',
          multiChoiceCardBorderRadius: 20,
          multiChoiceCardShadow: 'sm',
          multiChoiceSelectedColor: '#EC4899',
          multiChoiceSelectedBgColor: '#FCE7F3',
          multiChoiceHoverBgColor: '#FDF2F8',
          serviceSelectorWidth: 850,
          serviceSelectorCardSize: 'lg',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 24,
          serviceSelectorShadow: 'sm',
          serviceSelectorBackgroundColor: '#FFFFFF',
          serviceSelectorBorderWidth: 0,
          serviceSelectorBorderColor: '#F9A8D4',
          serviceSelectorHoverBgColor: '#FDF2F8',
          serviceSelectorHoverBorderColor: '#F472B6',
          serviceSelectorSelectedBgColor: '#FCE7F3',
          serviceSelectorSelectedBorderColor: '#EC4899',
          serviceSelectorTitleFontSize: 'xl',
          serviceSelectorDescriptionFontSize: 'base',
          serviceSelectorIconSize: 'lg',
          serviceSelectorPadding: 'lg',
          serviceSelectorGap: 'lg',
          pricingCardBorderRadius: 24,
          pricingCardShadow: 'sm',
          pricingCardBorderWidth: 0,
          pricingCardBorderColor: '#F9A8D4',
          pricingCardBackgroundColor: '#FFFFFF',
          pricingTextColor: '#831843',
          pricingAccentColor: '#EC4899'
        };
        break;
      case 'corporate':
        themeSettings = {
          fontFamily: 'roboto',
          containerBorderRadius: 4,
          containerShadow: 'sm',
          backgroundColor: '#F8FAFC',
          primaryColor: '#1E40AF',
          textColor: '#1E293B',
          buttonBorderRadius: 4,
          buttonShadow: 'none',
          inputBorderRadius: 4,
          inputShadow: 'none',
          inputHeight: 42,
          inputFontSize: 'sm',
          inputPadding: 'md',
          inputBackgroundColor: '#FFFFFF',
          inputBorderColor: '#CBD5E1',
          inputBorderWidth: 1,
          inputTextColor: '#475569',
          multiChoiceImageSize: 'md',
          multiChoiceImageBorderRadius: 4,
          multiChoiceImageShadow: 'none',
          multiChoiceCardBorderRadius: 4,
          multiChoiceCardShadow: 'none',
          multiChoiceSelectedColor: '#1E40AF',
          multiChoiceSelectedBgColor: '#DBEAFE',
          multiChoiceHoverBgColor: '#F1F5F9',
          serviceSelectorWidth: 750,
          serviceSelectorCardSize: 'md',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 4,
          serviceSelectorShadow: 'sm',
          serviceSelectorBackgroundColor: '#FFFFFF',
          serviceSelectorBorderWidth: 1,
          serviceSelectorBorderColor: '#E2E8F0',
          serviceSelectorHoverBgColor: '#F1F5F9',
          serviceSelectorHoverBorderColor: '#94A3B8',
          serviceSelectorSelectedBgColor: '#DBEAFE',
          serviceSelectorSelectedBorderColor: '#1E40AF',
          serviceSelectorTitleFontSize: 'lg',
          serviceSelectorDescriptionFontSize: 'sm',
          serviceSelectorIconSize: 'lg',
          serviceSelectorPadding: 'md',
          serviceSelectorGap: 'md',
          pricingCardBorderRadius: 4,
          pricingCardShadow: 'none',
          pricingCardBorderWidth: 1,
          pricingCardBorderColor: '#E2E8F0',
          pricingCardBackgroundColor: '#FFFFFF',
          pricingTextColor: '#1E293B',
          pricingAccentColor: '#1E40AF'
        };
        break;
      case 'luxury':
        themeSettings = {
          fontFamily: 'lato',
          containerBorderRadius: 8,
          containerShadow: 'xl',
          backgroundColor: '#1C1917',
          primaryColor: '#FBBF24',
          textColor: '#F5F5F4',
          buttonBorderRadius: 6,
          buttonShadow: 'lg',
          inputBorderRadius: 6,
          inputShadow: 'md',
          inputHeight: 46,
          inputFontSize: 'base',
          inputPadding: 'lg',
          inputBackgroundColor: '#292524',
          inputBorderColor: '#FBBF24',
          inputBorderWidth: 1,
          inputTextColor: '#F5F5F4',
          multiChoiceImageSize: 'lg',
          multiChoiceImageBorderRadius: 8,
          multiChoiceImageShadow: 'lg',
          multiChoiceCardBorderRadius: 8,
          multiChoiceCardShadow: 'md',
          multiChoiceSelectedColor: '#FBBF24',
          multiChoiceSelectedBgColor: '#451A03',
          multiChoiceHoverBgColor: '#292524',
          serviceSelectorWidth: 900,
          serviceSelectorCardSize: 'lg',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 8,
          serviceSelectorShadow: 'xl',
          serviceSelectorBackgroundColor: '#292524',
          serviceSelectorBorderWidth: 1,
          serviceSelectorBorderColor: '#44403C',
          serviceSelectorHoverBgColor: '#3C3631',
          serviceSelectorHoverBorderColor: '#FBBF24',
          serviceSelectorSelectedBgColor: '#451A03',
          serviceSelectorSelectedBorderColor: '#FBBF24',
          serviceSelectorTitleFontSize: 'xl',
          serviceSelectorDescriptionFontSize: 'base',
          serviceSelectorIconSize: 'xl',
          serviceSelectorPadding: 'xl',
          serviceSelectorGap: 'lg',
          pricingCardBorderRadius: 8,
          pricingCardShadow: 'xl',
          pricingCardBorderWidth: 1,
          pricingCardBorderColor: '#44403C',
          pricingCardBackgroundColor: '#292524',
          pricingTextColor: '#F5F5F4',
          pricingAccentColor: '#FBBF24'
        };
        break;
    }
    
    setStyling(prev => ({ ...prev, ...themeSettings }));
    
    toast({
      title: "Theme Applied",
      description: `${themeName.charAt(0).toUpperCase() + themeName.slice(1)} theme has been applied to your forms.`,
    });
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
      <DashboardLayout>
        <div className="p-6">
          <div>Loading design settings...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
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
            <Tabs defaultValue="themes" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-4 sm:mb-6 h-auto">
                <TabsTrigger value="themes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
                  <Wand2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Themes</span>
                  <span className="sm:hidden">Themes</span>
                </TabsTrigger>
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
                <TabsTrigger value="colors" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
                  <Paintbrush className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Colors</span>
                  <span className="sm:hidden">Colors</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
                  <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Components</span>
                  <span className="sm:hidden">Components</span>
                </TabsTrigger>
              </TabsList>

              {/* Themes Tab */}
              <TabsContent value="themes" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      Design Themes
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600">Choose from professionally designed themes or customize your own style</p>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {/* Modern Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-blue-300"
                        onClick={() => applyTheme('modern')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <div className="text-white font-semibold text-sm">Modern</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Inter</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Large</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">16px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Professional Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-gray-300"
                        onClick={() => applyTheme('professional')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-md flex items-center justify-center">
                              <div className="text-white font-semibold text-sm">Professional</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Roboto</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Medium</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">8px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Vibrant Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-purple-300"
                        onClick={() => applyTheme('vibrant')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                              <div className="text-white font-semibold text-sm">Vibrant</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Montserrat</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Extra Large</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">20px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Minimal Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-green-300"
                        onClick={() => applyTheme('minimal')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-green-400 to-green-500 rounded flex items-center justify-center">
                              <div className="text-white font-semibold text-sm">Minimal</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Open Sans</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Small</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">4px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Elegant Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-amber-300"
                        onClick={() => applyTheme('elegant')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                              <div className="text-white font-semibold text-sm">Elegant</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Lato</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Large</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">12px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-amber-600 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Dark Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-yellow-300"
                        onClick={() => applyTheme('dark')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center border border-gray-600">
                              <div className="text-yellow-400 font-semibold text-sm">Dark</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Inter</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Extra Large</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">20px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Retro Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-red-300"
                        onClick={() => applyTheme('retro')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-yellow-200 to-yellow-300 border-4 border-red-600 flex items-center justify-center">
                              <div className="text-red-700 font-bold text-sm">Retro</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Montserrat</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">None</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">0px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-red-600 rounded-none"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Soft Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-pink-300"
                        onClick={() => applyTheme('soft')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-pink-200 to-pink-300 rounded-3xl flex items-center justify-center">
                              <div className="text-pink-700 font-semibold text-sm">Soft</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Lato</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Small</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">24px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Corporate Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-blue-300"
                        onClick={() => applyTheme('corporate')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center">
                              <div className="text-blue-700 font-semibold text-sm">Corporate</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Roboto</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Small</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">4px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-blue-700 rounded-sm"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Luxury Theme */}
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-yellow-300"
                        onClick={() => applyTheme('luxury')}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="h-20 bg-gradient-to-br from-stone-800 to-stone-900 rounded-lg border-2 border-yellow-400 flex items-center justify-center">
                              <div className="text-yellow-400 font-bold text-sm">Luxury</div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Font:</span>
                                <span className="font-medium">Lato</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shadow:</span>
                                <span className="font-medium">Extra Large</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Radius:</span>
                                <span className="font-medium">8px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 text-center">
                        Click any theme to apply it instantly. You can further customize the settings in other tabs. <br />
                        <span className="font-medium">10 diverse themes</span> ranging from modern to luxury styles.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

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
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <Button
                                variant={styling.containerWidth === 400 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerWidth', 400)}
                                className="text-xs"
                              >
                                Narrow
                              </Button>
                              <Button
                                variant={styling.containerWidth === 600 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerWidth', 600)}
                                className="text-xs"
                              >
                                Standard
                              </Button>
                              <Button
                                variant={styling.containerWidth === 800 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerWidth', 800)}
                                className="text-xs"
                              >
                                Wide
                              </Button>
                              <Button
                                variant={styling.containerWidth === 1200 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerWidth', 1200)}
                                className="text-xs"
                              >
                                Full
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
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
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              <Button
                                variant={styling.containerBorderRadius === 0 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerBorderRadius', 0)}
                                className="text-xs"
                              >
                                None
                              </Button>
                              <Button
                                variant={styling.containerBorderRadius === 8 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerBorderRadius', 8)}
                                className="text-xs"
                              >
                                Small
                              </Button>
                              <Button
                                variant={styling.containerBorderRadius === 16 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerBorderRadius', 16)}
                                className="text-xs"
                              >
                                Medium
                              </Button>
                              <Button
                                variant={styling.containerBorderRadius === 24 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerBorderRadius', 24)}
                                className="text-xs"
                              >
                                Large
                              </Button>
                              <Button
                                variant={styling.containerBorderRadius === 50 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStylingChange('containerBorderRadius', 50)}
                                className="text-xs"
                              >
                                Round
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
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
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[getFontSizeValue(styling.fontSize)]}
                            onValueChange={(value) => handleStylingChange('fontSize', getFontSizeFromValue(value[0]))}
                            max={24}
                            min={12}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[60px] text-center">
                            {getFontSizeLabel(styling.fontSize)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Font Weight</Label>
                        <Select value={styling.fontWeight || 'normal'} onValueChange={(value) => handleStylingChange('fontWeight', value)}>
                          <SelectTrigger className="mt-2 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="semibold">Semi Bold</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="extrabold">Extra Bold</SelectItem>
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

                {/* Pricing Card Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Square className="w-5 h-5" />
                      Pricing Card Design
                    </CardTitle>
                    <p className="text-sm text-gray-600">Customize the appearance of pricing display cards</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Border Radius</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.pricingCardBorderRadius || 12]}
                            onValueChange={(value) => handleStylingChange('pricingCardBorderRadius', value[0])}
                            max={50}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[50px] text-center">
                            {styling.pricingCardBorderRadius || 12}px
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Shadow</Label>
                        <Select
                          value={styling.pricingCardShadow || 'lg'}
                          onValueChange={(value) => handleStylingChange('pricingCardShadow', value)}
                        >
                          <SelectTrigger className="w-full">
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

                      <div>
                        <Label className="text-sm font-medium">Border Width</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.pricingCardBorderWidth || 0]}
                            onValueChange={(value) => handleStylingChange('pricingCardBorderWidth', value[0])}
                            max={10}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[50px] text-center">
                            {styling.pricingCardBorderWidth || 0}px
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Border Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Input
                            type="color"
                            value={styling.pricingCardBorderColor || '#E5E7EB'}
                            onChange={(e) => handleStylingChange('pricingCardBorderColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={styling.pricingCardBorderColor || '#E5E7EB'}
                            onChange={(e) => handleStylingChange('pricingCardBorderColor', e.target.value)}
                            className="flex-1 text-sm"
                            placeholder="#E5E7EB"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Background Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Input
                            type="color"
                            value={styling.pricingCardBackgroundColor || '#FFFFFF'}
                            onChange={(e) => handleStylingChange('pricingCardBackgroundColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={styling.pricingCardBackgroundColor || '#FFFFFF'}
                            onChange={(e) => handleStylingChange('pricingCardBackgroundColor', e.target.value)}
                            className="flex-1 text-sm"
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Text Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Input
                            type="color"
                            value={styling.pricingTextColor || '#1F2937'}
                            onChange={(e) => handleStylingChange('pricingTextColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={styling.pricingTextColor || '#1F2937'}
                            onChange={(e) => handleStylingChange('pricingTextColor', e.target.value)}
                            className="flex-1 text-sm"
                            placeholder="#1F2937"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Accent Color (for pricing amounts)</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Input
                            type="color"
                            value={styling.pricingAccentColor || '#2563EB'}
                            onChange={(e) => handleStylingChange('pricingAccentColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={styling.pricingAccentColor || '#2563EB'}
                            onChange={(e) => handleStylingChange('pricingAccentColor', e.target.value)}
                            className="flex-1 text-sm"
                            placeholder="#2563EB"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Grid2x2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      Service Selector Design
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600">Customize the appearance of service selection cards</p>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    
                    {/* Layout & Sizing */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Layout & Sizing</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Container Width</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[styling.serviceSelectorWidth || 900]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorWidth', value[0])}
                              max={1200}
                              min={300}
                              step={10}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center text-xs">
                              {styling.serviceSelectorWidth || 900}px
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Card Size</Label>
                          <Select
                            value={styling.serviceSelectorCardSize || 'lg'}
                            onValueChange={(value) => handleStylingChange('serviceSelectorCardSize', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="md">Medium</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                              <SelectItem value="xl">Extra Large</SelectItem>
                              <SelectItem value="2xl">2X Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Cards Per Row</Label>
                          <Select
                            value={styling.serviceSelectorCardsPerRow || 'auto'}
                            onValueChange={(value) => handleStylingChange('serviceSelectorCardsPerRow', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto (Responsive)</SelectItem>
                              <SelectItem value="1">1 Card Per Row</SelectItem>
                              <SelectItem value="2">2 Cards Per Row</SelectItem>
                              <SelectItem value="3">3 Cards Per Row</SelectItem>
                              <SelectItem value="4">4 Cards Per Row</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Card Padding</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[getPaddingValue(styling.serviceSelectorPadding || 'xl')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorPadding', getPaddingFromValue(value[0]))}
                              max={24}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {getPaddingLabel(styling.serviceSelectorPadding || 'xl')}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Card Spacing</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[getPaddingValue(styling.serviceSelectorGap || 'lg')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorGap', getPaddingFromValue(value[0]))}
                              max={24}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {getPaddingLabel(styling.serviceSelectorGap || 'lg')}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Icon Size</Label>
                          <Select
                            value={styling.serviceSelectorIconSize || 'xl'}
                            onValueChange={(value) => handleStylingChange('serviceSelectorIconSize', value)}
                          >
                            <SelectTrigger className="mt-2">
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

                    <Separator />

                    {/* Card Styling */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Card Styling</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Border Radius</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[styling.serviceSelectorBorderRadius || 16]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorBorderRadius', value[0])}
                              max={50}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[50px] text-center text-xs">
                              {styling.serviceSelectorBorderRadius || 16}px
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Shadow</Label>
                          <Select
                            value={styling.serviceSelectorShadow || 'xl'}
                            onValueChange={(value) => handleStylingChange('serviceSelectorShadow', value)}
                          >
                            <SelectTrigger className="mt-2">
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

                        <div>
                          <Label className="text-sm font-medium">Border Width</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[styling.serviceSelectorBorderWidth || 0]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorBorderWidth', value[0])}
                              max={10}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[50px] text-center text-xs">
                              {styling.serviceSelectorBorderWidth || 0}px
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Colors */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Colors</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Background Color</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="color"
                              value={styling.serviceSelectorBackgroundColor || '#FFFFFF'}
                              onChange={(e) => handleStylingChange('serviceSelectorBackgroundColor', e.target.value)}
                              className="w-10 h-10 p-1 border rounded"
                            />
                            <Input
                              value={styling.serviceSelectorBackgroundColor || '#FFFFFF'}
                              onChange={(e) => handleStylingChange('serviceSelectorBackgroundColor', e.target.value)}
                              placeholder="#FFFFFF"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Border Color</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="color"
                              value={styling.serviceSelectorBorderColor || '#E5E7EB'}
                              onChange={(e) => handleStylingChange('serviceSelectorBorderColor', e.target.value)}
                              className="w-10 h-10 p-1 border rounded"
                            />
                            <Input
                              value={styling.serviceSelectorBorderColor || '#E5E7EB'}
                              onChange={(e) => handleStylingChange('serviceSelectorBorderColor', e.target.value)}
                              placeholder="#E5E7EB"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Hover Background</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="color"
                              value={styling.serviceSelectorHoverBgColor || '#F8FAFC'}
                              onChange={(e) => handleStylingChange('serviceSelectorHoverBgColor', e.target.value)}
                              className="w-10 h-10 p-1 border rounded"
                            />
                            <Input
                              value={styling.serviceSelectorHoverBgColor || '#F8FAFC'}
                              onChange={(e) => handleStylingChange('serviceSelectorHoverBgColor', e.target.value)}
                              placeholder="#F8FAFC"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Hover Border Color</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="color"
                              value={styling.serviceSelectorHoverBorderColor || '#C7D2FE'}
                              onChange={(e) => handleStylingChange('serviceSelectorHoverBorderColor', e.target.value)}
                              className="w-10 h-10 p-1 border rounded"
                            />
                            <Input
                              value={styling.serviceSelectorHoverBorderColor || '#C7D2FE'}
                              onChange={(e) => handleStylingChange('serviceSelectorHoverBorderColor', e.target.value)}
                              placeholder="#C7D2FE"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Selected Background</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="color"
                              value={styling.serviceSelectorSelectedBgColor || '#EFF6FF'}
                              onChange={(e) => handleStylingChange('serviceSelectorSelectedBgColor', e.target.value)}
                              className="w-10 h-10 p-1 border rounded"
                            />
                            <Input
                              value={styling.serviceSelectorSelectedBgColor || '#EFF6FF'}
                              onChange={(e) => handleStylingChange('serviceSelectorSelectedBgColor', e.target.value)}
                              placeholder="#EFF6FF"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Selected Border Color</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="color"
                              value={styling.serviceSelectorSelectedBorderColor || '#2563EB'}
                              onChange={(e) => handleStylingChange('serviceSelectorSelectedBorderColor', e.target.value)}
                              className="w-10 h-10 p-1 border rounded"
                            />
                            <Input
                              value={styling.serviceSelectorSelectedBorderColor || '#2563EB'}
                              onChange={(e) => handleStylingChange('serviceSelectorSelectedBorderColor', e.target.value)}
                              placeholder="#2563EB"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Typography */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Typography</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Title Font Size</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[getFontSizeValue(styling.serviceSelectorTitleFontSize || 'xl')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorTitleFontSize', getFontSizeFromValue(value[0]))}
                              max={24}
                              min={12}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {getFontSizeLabel(styling.serviceSelectorTitleFontSize || 'xl')}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Description Font Size</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[getFontSizeValue(styling.serviceSelectorDescriptionFontSize || 'base')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorDescriptionFontSize', getFontSizeFromValue(value[0]))}
                              max={20}
                              min={10}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {getFontSizeLabel(styling.serviceSelectorDescriptionFontSize || 'base')}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Title Line Height</Label>
                          <Select
                            value={styling.serviceSelectorTitleLineHeight || 'normal'}
                            onValueChange={(value) => handleStylingChange('serviceSelectorTitleLineHeight', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tight">Tight (1.25)</SelectItem>
                              <SelectItem value="snug">Snug (1.375)</SelectItem>
                              <SelectItem value="normal">Normal (1.5)</SelectItem>
                              <SelectItem value="relaxed">Relaxed (1.625)</SelectItem>
                              <SelectItem value="loose">Loose (2.0)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Description Line Height</Label>
                          <Select
                            value={styling.serviceSelectorDescriptionLineHeight || 'normal'}
                            onValueChange={(value) => handleStylingChange('serviceSelectorDescriptionLineHeight', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tight">Tight (1.25)</SelectItem>
                              <SelectItem value="snug">Snug (1.375)</SelectItem>
                              <SelectItem value="normal">Normal (1.5)</SelectItem>
                              <SelectItem value="relaxed">Relaxed (1.625)</SelectItem>
                              <SelectItem value="loose">Loose (2.0)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Title Letter Spacing</Label>
                          <Select
                            value={styling.serviceSelectorTitleLetterSpacing || 'normal'}
                            onValueChange={(value) => handleStylingChange('serviceSelectorTitleLetterSpacing', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tighter">Tighter (-0.05em)</SelectItem>
                              <SelectItem value="tight">Tight (-0.025em)</SelectItem>
                              <SelectItem value="normal">Normal (0em)</SelectItem>
                              <SelectItem value="wide">Wide (0.025em)</SelectItem>
                              <SelectItem value="wider">Wider (0.05em)</SelectItem>
                              <SelectItem value="widest">Widest (0.1em)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Description Letter Spacing</Label>
                          <Select
                            value={styling.serviceSelectorDescriptionLetterSpacing || 'normal'}
                            onValueChange={(value) => handleStylingChange('serviceSelectorDescriptionLetterSpacing', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tighter">Tighter (-0.05em)</SelectItem>
                              <SelectItem value="tight">Tight (-0.025em)</SelectItem>
                              <SelectItem value="normal">Normal (0em)</SelectItem>
                              <SelectItem value="wide">Wide (0.025em)</SelectItem>
                              <SelectItem value="wider">Wider (0.05em)</SelectItem>
                              <SelectItem value="widest">Widest (0.1em)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Completed Components Tab */}
              <TabsContent value="completed" className="space-y-6">
                {/* Service Selector Design */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid2x2 className="w-5 h-5" />
                      Service Selector
                    </CardTitle>
                    <p className="text-sm text-gray-600">Customize the service selection interface</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Layout & Sizing */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Layout & Auto-Sizing</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Container Width</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[styling.serviceSelectorWidth || 900]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorWidth', value[0])}
                              max={1200}
                              min={400}
                              step={10}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {styling.serviceSelectorWidth || 900}px
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Cards Per Row (Auto-Sizing)</Label>
                          <Select 
                            value={styling.serviceSelectorCardsPerRow || 'auto'} 
                            onValueChange={(value) => handleStylingChange('serviceSelectorCardsPerRow', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto-Responsive</SelectItem>
                              <SelectItem value="1">1 Column</SelectItem>
                              <SelectItem value="2">2 Columns</SelectItem>
                              <SelectItem value="3">3 Columns</SelectItem>
                              <SelectItem value="4">4 Columns</SelectItem>
                              <SelectItem value="5">5 Columns</SelectItem>
                              <SelectItem value="6">6 Columns</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Card Padding (1px increments)</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[getPaddingValue(styling.serviceSelectorPadding || 'xl')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorPadding', value[0])}
                              max={48}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {getPaddingValue(styling.serviceSelectorPadding || 'xl')}px
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Card Spacing (1px increments)</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[getPaddingValue(styling.serviceSelectorGap || 'lg')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorGap', value[0])}
                              max={32}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {getPaddingValue(styling.serviceSelectorGap || 'lg')}px
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Visual Design */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Visual Design</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Border Radius</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[styling.serviceSelectorBorderRadius || 16]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorBorderRadius', value[0])}
                              max={32}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {styling.serviceSelectorBorderRadius || 16}px
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Shadow</Label>
                          <Select 
                            value={styling.serviceSelectorShadow || 'xl'} 
                            onValueChange={(value) => handleStylingChange('serviceSelectorShadow', value)}
                          >
                            <SelectTrigger className="mt-2">
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
                          <Label className="text-sm font-medium">Background Color</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <div 
                              className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: styling.serviceSelectorBackgroundColor || '#FFFFFF' }}
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorBackgroundColor || '#FFFFFF'}
                              onChange={(e) => handleStylingChange('serviceSelectorBackgroundColor', e.target.value)}
                              placeholder="#FFFFFF"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Hover Background</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <div 
                              className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: styling.serviceSelectorHoverBgColor || '#F8FAFC' }}
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorHoverBgColor || '#F8FAFC'}
                              onChange={(e) => handleStylingChange('serviceSelectorHoverBgColor', e.target.value)}
                              placeholder="#F8FAFC"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Selected Background</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <div 
                              className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: styling.serviceSelectorSelectedBgColor || '#EFF6FF' }}
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorSelectedBgColor || '#EFF6FF'}
                              onChange={(e) => handleStylingChange('serviceSelectorSelectedBgColor', e.target.value)}
                              placeholder="#EFF6FF"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Selected Border Color</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <div 
                              className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: styling.serviceSelectorSelectedBorderColor || '#2563EB' }}
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorSelectedBorderColor || '#2563EB'}
                              onChange={(e) => handleStylingChange('serviceSelectorSelectedBorderColor', e.target.value)}
                              placeholder="#2563EB"
                              className="flex-1 h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Typography with Line Height Controls */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Typography</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Title Font Size</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[getFontSizeValue(styling.serviceSelectorTitleFontSize || 'xl')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorTitleFontSize', getFontSizeFromValue(value[0]))}
                              max={32}
                              min={12}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {getFontSizeValue(styling.serviceSelectorTitleFontSize || 'xl')}px
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Description Font Size</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[getFontSizeValue(styling.serviceSelectorDescriptionFontSize || 'base')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorDescriptionFontSize', getFontSizeFromValue(value[0]))}
                              max={24}
                              min={10}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {getFontSizeValue(styling.serviceSelectorDescriptionFontSize || 'base')}px
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Title Line Height (Below 1.0 Supported)</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[parseFloat(styling.serviceSelectorTitleLineHeight?.replace('leading-', '') || '1.5')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorTitleLineHeight', `leading-${value[0]}`)}
                              max={3}
                              min={0.8}
                              step={0.1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {parseFloat(styling.serviceSelectorTitleLineHeight?.replace('leading-', '') || '1.5')}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Description Line Height (Below 1.0 Supported)</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Slider
                              value={[parseFloat(styling.serviceSelectorDescriptionLineHeight?.replace('leading-', '') || '1.5')]}
                              onValueChange={(value) => handleStylingChange('serviceSelectorDescriptionLineHeight', `leading-${value[0]}`)}
                              max={3}
                              min={0.8}
                              step={0.1}
                              className="flex-1"
                            />
                            <Badge variant="secondary" className="min-w-[60px] text-center">
                              {parseFloat(styling.serviceSelectorDescriptionLineHeight?.replace('leading-', '') || '1.5')}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Icon Size</Label>
                          <Select 
                            value={styling.serviceSelectorIconSize || 'xl'} 
                            onValueChange={(value) => handleStylingChange('serviceSelectorIconSize', value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="md">Medium</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                              <SelectItem value="xl">Extra Large</SelectItem>
                              <SelectItem value="2xl">2X Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Cards Design */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Square className="w-5 h-5" />
                      Pricing Cards
                    </CardTitle>
                    <p className="text-sm text-gray-600">Customize pricing display cards</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Border Radius</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.pricingCardBorderRadius || 12]}
                            onValueChange={(value) => handleStylingChange('pricingCardBorderRadius', value[0])}
                            max={32}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[60px] text-center">
                            {styling.pricingCardBorderRadius || 12}px
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Shadow</Label>
                        <Select 
                          value={styling.pricingCardShadow || 'lg'} 
                          onValueChange={(value) => handleStylingChange('pricingCardShadow', value)}
                        >
                          <SelectTrigger className="mt-2">
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
                        <Label className="text-sm font-medium">Background Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div 
                            className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: styling.pricingCardBackgroundColor || '#FFFFFF' }}
                          />
                          <Input
                            type="text"
                            value={styling.pricingCardBackgroundColor || '#FFFFFF'}
                            onChange={(e) => handleStylingChange('pricingCardBackgroundColor', e.target.value)}
                            placeholder="#FFFFFF"
                            className="flex-1 h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Border Width</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.pricingCardBorderWidth || 0]}
                            onValueChange={(value) => handleStylingChange('pricingCardBorderWidth', value[0])}
                            max={8}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[60px] text-center">
                            {styling.pricingCardBorderWidth || 0}px
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Border Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div 
                            className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: styling.pricingCardBorderColor || '#E5E7EB' }}
                          />
                          <Input
                            type="text"
                            value={styling.pricingCardBorderColor || '#E5E7EB'}
                            onChange={(e) => handleStylingChange('pricingCardBorderColor', e.target.value)}
                            placeholder="#E5E7EB"
                            className="flex-1 h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Text Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div 
                            className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: styling.pricingTextColor || '#1F2937' }}
                          />
                          <Input
                            type="text"
                            value={styling.pricingTextColor || '#1F2937'}
                            onChange={(e) => handleStylingChange('pricingTextColor', e.target.value)}
                            placeholder="#1F2937"
                            className="flex-1 h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Accent Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div 
                            className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: styling.pricingAccentColor || '#2563EB' }}
                          />
                          <Input
                            type="text"
                            value={styling.pricingAccentColor || '#2563EB'}
                            onChange={(e) => handleStylingChange('pricingAccentColor', e.target.value)}
                            placeholder="#2563EB"
                            className="flex-1 h-10"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Cards Design */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Square className="w-5 h-5" />
                      Question Cards & Multiple Choice
                    </CardTitle>
                    <p className="text-sm text-gray-600">Customize form question elements</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Multiple Choice Layout</Label>
                        <Select 
                          value={styling.multiChoiceLayout || 'grid'} 
                          onValueChange={(value) => handleStylingChange('multiChoiceLayout', value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">Grid (Side by Side)</SelectItem>
                            <SelectItem value="single">Single Row</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Image/Icon Size</Label>
                        <Select 
                          value={styling.multiChoiceImageSize || 'lg'} 
                          onValueChange={(value) => handleStylingChange('multiChoiceImageSize', value)}
                        >
                          <SelectTrigger className="mt-2">
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
                        <Label className="text-sm font-medium">Card Border Radius</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.multiChoiceCardBorderRadius || 12]}
                            onValueChange={(value) => handleStylingChange('multiChoiceCardBorderRadius', value[0])}
                            max={32}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[60px] text-center">
                            {styling.multiChoiceCardBorderRadius || 12}px
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Card Shadow</Label>
                        <Select 
                          value={styling.multiChoiceCardShadow || 'sm'} 
                          onValueChange={(value) => handleStylingChange('multiChoiceCardShadow', value)}
                        >
                          <SelectTrigger className="mt-2">
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
                  </CardContent>
                </Card>

                {/* Video Design */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Guide Videos
                    </CardTitle>
                    <p className="text-sm text-gray-600">Video player appearance settings</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Video Container Border Radius</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.containerBorderRadius || 16]}
                            onValueChange={(value) => handleStylingChange('containerBorderRadius', value[0])}
                            max={32}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[60px] text-center">
                            {styling.containerBorderRadius || 16}px
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Video Container Shadow</Label>
                        <Select 
                          value={styling.containerShadow || 'xl'} 
                          onValueChange={(value) => handleStylingChange('containerShadow', value)}
                        >
                          <SelectTrigger className="mt-2">
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Components Tab - Buttons & Inputs only */}
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
                            <SelectItem value="xl">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Input Height</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[styling.inputHeight || 40]}
                            onValueChange={(value) => handleStylingChange('inputHeight', value[0])}
                            max={80}
                            min={30}
                            step={2}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[50px] text-center">
                            {styling.inputHeight || 40}px
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Input Font Size</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            value={[getFontSizeValue(styling.inputFontSize || 'base')]}
                            onValueChange={(value) => handleStylingChange('inputFontSize', getFontSizeFromValue(value[0]))}
                            max={20}
                            min={12}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="secondary" className="min-w-[60px] text-center">
                            {getFontSizeLabel(styling.inputFontSize || 'base')}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Input Width</Label>
                        <Select
                          value={styling.inputWidth || 'full'}
                          onValueChange={(value) => handleStylingChange('inputWidth', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">Small (200px)</SelectItem>
                            <SelectItem value="md">Medium (300px)</SelectItem>
                            <SelectItem value="lg">Large (400px)</SelectItem>
                            <SelectItem value="xl">Extra Large (500px)</SelectItem>
                            <SelectItem value="full">Full Width</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Input Background Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Input
                            type="color"
                            value={styling.inputBackgroundColor || '#FFFFFF'}
                            onChange={(e) => handleStylingChange('inputBackgroundColor', e.target.value)}
                            className="w-12 h-8 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={styling.inputBackgroundColor || '#FFFFFF'}
                            onChange={(e) => handleStylingChange('inputBackgroundColor', e.target.value)}
                            className="flex-1 text-sm"
                            placeholder="#FFFFFF"
                          />
                        </div>
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Form Display Options
                    </CardTitle>
                    <p className="text-sm text-gray-600">Control which elements appear on your pricing form</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Show Progress Guide</Label>
                          <p className="text-xs text-gray-600">Display the 4-step progress indicator</p>
                        </div>
                        <Switch
                          checked={styling.showProgressGuide}
                          onCheckedChange={(checked) => handleStylingChange('showProgressGuide', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Show Form Title</Label>
                          <p className="text-xs text-gray-600">Display the main title "Eco Clean Professional Services"</p>
                        </div>
                        <Switch
                          checked={styling.showFormTitle}
                          onCheckedChange={(checked) => handleStylingChange('showFormTitle', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Show Form Subtitle</Label>
                          <p className="text-xs text-gray-600">Display the subtitle "Get Your Custom Quote"</p>
                        </div>
                        <Switch
                          checked={styling.showFormSubtitle}
                          onCheckedChange={(checked) => handleStylingChange('showFormSubtitle', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Show Section Titles</Label>
                          <p className="text-xs text-gray-600">Display section titles like "Select Your Services"</p>
                        </div>
                        <Switch
                          checked={styling.showSectionTitles}
                          onCheckedChange={(checked) => handleStylingChange('showSectionTitles', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Show Step Descriptions</Label>
                          <p className="text-xs text-gray-600">Display descriptions like "Choose the services you're interested in"</p>
                        </div>
                        <Switch
                          checked={styling.showStepDescriptions}
                          onCheckedChange={(checked) => handleStylingChange('showStepDescriptions', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Form Behavior Tab */}
              <TabsContent value="behavior" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MousePointer className="w-5 h-5" />
                      Form Behavior Settings
                    </CardTitle>
                    <p className="text-sm text-gray-600">Configure how questions are presented to users</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Show one question at a time</Label>
                          <p className="text-xs text-gray-600">Present questions individually with smooth transitions</p>
                        </div>
                        <Switch
                          checked={styling.showOneQuestionAtTime}
                          onCheckedChange={(checked) => handleStylingChange('showOneQuestionAtTime', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Show one section at a time</Label>
                          <p className="text-xs text-gray-600">Group related questions into sections (takes priority over single questions)</p>
                        </div>
                        <Switch
                          checked={styling.showOneSectionAtTime}
                          onCheckedChange={(checked) => handleStylingChange('showOneSectionAtTime', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Require "Next" button click</Label>
                          <p className="text-xs text-gray-600">Manual navigation vs auto-advance when answered</p>
                        </div>
                        <Switch
                          checked={styling.requireNextButtonClick}
                          onCheckedChange={(checked) => handleStylingChange('requireNextButtonClick', checked)}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Animation Style</Label>
                        <Select
                          value={styling.formAnimationStyle}
                          onValueChange={(value: 'slide' | 'fade' | 'scale' | 'none') => handleStylingChange('formAnimationStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slide">Slide Transition</SelectItem>
                            <SelectItem value="fade">Fade Transition</SelectItem>
                            <SelectItem value="scale">Scale Transition</SelectItem>
                            <SelectItem value="none">No Animation</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-600">Choose the animation style for question transitions</p>
                      </div>
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
                  <div className="bg-gray-100 rounded-lg p-2 overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                    <iframe
                      src={`/embed-form?userId=${user?.id}`}
                      className="w-full h-[600px] border-0 rounded"
                      title="Live Form Preview"
                      style={{
                        transform: 'scale(0.8)',
                        transformOrigin: 'top left',
                        width: '125%',
                        height: '750px'
                      }}
                    />
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    Live Preview
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}