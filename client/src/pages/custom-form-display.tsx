import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

import { apiRequest } from "@/lib/queryClient";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";
import MeasureMapTerraImproved from "@/components/measure-map-terra-improved";
import { GoogleMapsLoader } from "@/components/google-maps-loader";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { CollapsiblePhotoMeasurement } from "@/components/collapsible-photo-measurement";
import BookingCalendar from "@/components/booking-calendar";
import ServiceCardDisplay from "@/components/service-card-display";
import { ChevronDown, ChevronUp, Map } from "lucide-react";
import type { Formula, DesignSettings, ServiceCalculation, BusinessSettings, CustomForm } from "@shared/schema";
import { areAllVisibleVariablesCompleted, evaluateConditionalLogic, getDefaultValueForHiddenVariable } from "@shared/conditional-logic";

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
}

interface CustomFormResponse {
  form: CustomForm;
  formulas: Formula[];
}

// Collapsible Measure Map Component
function CollapsibleMeasureMap({ measurementType, unit, onMeasurementComplete }: {
  measurementType: string;
  unit: string;
  onMeasurementComplete: (measurement: { value: number; unit: string }) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
        data-testid="button-toggle-measure-map"
      >
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">
            Measure Tool - {measurementType === 'area' ? 'Measure Area' : 'Measure Distance'}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-0">
          <MeasureMapTerraImproved
            measurementType={measurementType as "area" | "distance"}
            unit={unit as "sqft" | "sqm" | "ft" | "m"}
            onMeasurementComplete={onMeasurementComplete}
          />
        </div>
      )}
    </div>
  );
}

// Helper function to convert YouTube URLs to embed format
function convertToEmbedUrl(url: string): string {
  if (!url) return '';
  
  // If it's already an embed URL, return it
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Handle various YouTube URL formats
  let videoId = '';
  
  // Handle youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  }
  // Handle youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }
  // Handle youtube.com/watch?v=VIDEO_ID with other parameters
  else if (url.includes('youtube.com/') && url.includes('v=')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v') || '';
  }
  
  // If we found a video ID, return the embed URL
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // If it's not a recognizable YouTube URL, return the original
  return url;
}

// Video Component for displaying guide videos
function GuideVideo({ videoUrl, title }: { videoUrl: string; title: string }) {
  if (!videoUrl) return null;
  
  const embedUrl = convertToEmbedUrl(videoUrl);
  if (!embedUrl) return null;
  
  return (
    <div className="mb-6">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
        <iframe
          src={embedUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default function CustomFormDisplay() {
  const [match, params] = useRoute<{ accountId: string; slug: string }>("/f/:accountId/:slug");
  
  // Extract URL parameters
  const accountId = params?.accountId;
  const slug = params?.slug;
  
  // Check if this is an embed request
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbed = urlParams.get('embed') === '1';

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [serviceVariables, setServiceVariables] = useState<Record<number, Record<string, any>>>({});
  const [serviceCalculations, setServiceCalculations] = useState<Record<number, number>>({});
  const [leadForm, setLeadForm] = useState<LeadFormData>({ 
    name: "", 
    email: "", 
    phone: "",
    address: "",
    notes: "",
    howDidYouHear: ""
  });
  
  const [distanceInfo, setDistanceInfo] = useState<{
    distance: number;
    fee: number;
    message: string;
  } | null>(null);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<"selection" | "configuration" | "contact" | "pricing" | "scheduling">("selection");
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const queryClient = useQueryClient();

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Show error if no accountId or slug provided
  if (!accountId || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Invalid Form URL</h1>
          <p className="text-gray-600">This custom form URL is not valid.</p>
        </div>
      </div>
    );
  }

  // Fetch custom form data
  const { data: formData, isLoading: isLoadingCustomForm } = useQuery<CustomFormResponse>({
    queryKey: [`/api/public/forms/${accountId}/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/public/forms/${accountId}/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch form data');
      return res.json();
    },
    enabled: !!accountId && !!slug
  });

  // Fetch design settings for the account
  const { data: designSettings, isLoading: isLoadingDesign } = useQuery<DesignSettings>({
    queryKey: ['/api/public/design-settings', accountId],
    queryFn: async () => {
      const res = await fetch(`/api/public/design-settings?userId=${accountId}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to fetch design settings');
      const data = await res.json();
      console.log('Fetched design settings for custom form:', data);
      return data;
    },
    enabled: !!accountId && !isLoadingCustomForm,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch business settings for the account
  const { data: businessSettings } = useQuery<BusinessSettings>({
    queryKey: ['/api/public/business-settings', accountId],
    queryFn: () => fetch(`/api/public/business-settings?userId=${accountId}`).then(res => res.json()),
    enabled: !!accountId && !isLoadingCustomForm,
  });

  // Extract data from custom form response
  const formulas = formData?.formulas || [];
  const form = formData?.form;
  
  // Filter formulas to only show those that are displayed
  const displayedFormulas = formulas.filter((formula: any) => formula.isDisplayed !== false);

  // Services are not auto-selected - users must manually choose them

  // Get styling from design settings - map to the format components expect
  const styling = designSettings?.styling ? {
    ...designSettings.styling,
    // Apply defaults only for properties that are undefined
    serviceSelectorBackgroundColor: designSettings.styling.serviceSelectorBackgroundColor ?? designSettings.styling.backgroundColor ?? '#FFFFFF',
    serviceSelectorBorderColor: designSettings.styling.serviceSelectorBorderColor ?? '#E5E7EB',
    serviceSelectorBorderRadius: designSettings.styling.serviceSelectorBorderRadius ?? 16,
    serviceSelectorBorderWidth: designSettings.styling.serviceSelectorBorderWidth ?? 1,
    serviceSelectorSelectedBorderColor: designSettings.styling.serviceSelectorSelectedBorderColor ?? designSettings.styling.primaryColor ?? '#3B82F6',
    serviceSelectorSelectedBgColor: designSettings.styling.serviceSelectorSelectedBgColor ?? '#EFF6FF',
    serviceSelectorHoverBackgroundColor: designSettings.styling.serviceSelectorHoverBackgroundColor ?? '#F3F4F6',
    serviceSelectorHoverBorderColor: designSettings.styling.serviceSelectorHoverBorderColor ?? '#D1D5DB',
    serviceSelectorTextColor: designSettings.styling.serviceSelectorTextColor ?? designSettings.styling.textColor ?? '#374151',
    serviceSelectorSelectedTextColor: designSettings.styling.serviceSelectorSelectedTextColor ?? designSettings.styling.textColor ?? '#1f2937',
    serviceSelectorShadow: designSettings.styling.serviceSelectorShadow ?? 'lg',
    serviceSelectorPadding: designSettings.styling.serviceSelectorPadding ?? 'lg',
    serviceSelectorGap: designSettings.styling.serviceSelectorGap ?? 'md',
  } : {
    primaryColor: '#2563EB',
    textColor: '#374151',
    backgroundColor: '#FFFFFF',
    containerBorderRadius: 16,
    containerShadow: 'lg',
    buttonBorderRadius: 12,
    resultBackgroundColor: '#F3F4F6',
    // Default service selector styling
    serviceSelectorBackgroundColor: '#FFFFFF',
    serviceSelectorBorderColor: '#E5E7EB',
    serviceSelectorBorderRadius: 16,
    serviceSelectorBorderWidth: 1,
    serviceSelectorSelectedBorderColor: '#3B82F6',
    serviceSelectorSelectedBgColor: '#EFF6FF',
    serviceSelectorHoverBackgroundColor: '#F3F4F6',
    serviceSelectorHoverBorderColor: '#D1D5DB',
    serviceSelectorTextColor: '#374151',
    serviceSelectorSelectedTextColor: '#1f2937',
    serviceSelectorShadow: 'lg',
    serviceSelectorPadding: 'lg',
    serviceSelectorGap: 'md',
  };
  
  const componentStyles = designSettings?.componentStyles || {
    serviceSelector: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      borderRadius: 12,
      shadow: 'sm',
      padding: 24,
      height: 120,
      width: 200,
      activeBackgroundColor: '#EFF6FF',
      activeBorderColor: '#2563EB',
      hoverBackgroundColor: '#F9FAFB',
      hoverBorderColor: '#D1D5DB'
    },
    textInput: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      borderRadius: 8,
      shadow: 'sm',
      padding: 12,
      fontSize: 'base',
      textColor: '#374151',
      height: 40
    },
    questionCard: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      borderRadius: 12,
      shadow: 'sm',
      padding: 24,
      textAlign: 'left'
    },
    pricingCard: {
      backgroundColor: '#F3F4F6',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      borderRadius: 12,
      shadow: 'sm',
      padding: 24
    }
  };

  // Helper function to convert hex color + alpha to rgba
  const hexToRgba = (hex: string, alpha: number = 100): string => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = alpha / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  // Helper function to get shadow values
  const getShadowValue = (shadowSize: string) => {
    switch (shadowSize) {
      case 'sm': return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      case 'md': return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      case 'lg': return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      case 'xl': return '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      default: return 'none';
    }
  };

  // Helper function to get button padding values
  const getButtonPadding = (padding?: string) => {
    switch (padding) {
      case 'sm': return '8px 16px';
      case 'md': return '12px 20px';
      case 'lg': return '16px 24px';
      default: return '16px 24px';
    }
  };

  // Helper function to get comprehensive button styles
  const getButtonStyles = (variant: 'primary' | 'outline' = 'primary') => {
    // Prioritize componentStyles.button over styling for better design editor integration
    const buttonStyles = componentStyles.button;
    
    const baseStyles = {
      borderRadius: `${buttonStyles?.borderRadius || styling.buttonBorderRadius || 12}px`,
      padding: buttonStyles?.padding ? `${buttonStyles.padding}px` : getButtonPadding(styling.buttonPadding),
      fontSize: buttonStyles?.fontSize ? getFontSizeValue(buttonStyles.fontSize) : '18px',
      fontWeight: buttonStyles?.fontWeight || styling.buttonFontWeight || '600',
      borderWidth: `${buttonStyles?.borderWidth || styling.buttonBorderWidth || 0}px`,
      borderStyle: 'solid' as const,
      boxShadow: getShadowValue(buttonStyles?.shadow || styling.buttonShadow || 'md'),
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer' as const,
      height: buttonStyles?.height ? `${buttonStyles.height}px` : 'auto',
    };

    if (variant === 'primary') {
      return {
        ...baseStyles,
        backgroundColor: hexToRgba(
          buttonStyles?.backgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
          buttonStyles?.backgroundColorAlpha ?? 100
        ),
        color: hexToRgba(
          buttonStyles?.textColor || styling.buttonTextColor || '#FFFFFF',
          buttonStyles?.textColorAlpha ?? 100
        ),
        borderColor: hexToRgba(
          buttonStyles?.borderColor || styling.buttonBorderColor || buttonStyles?.backgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
          buttonStyles?.borderColorAlpha ?? 100
        ),
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: hexToRgba(
          buttonStyles?.backgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
          buttonStyles?.backgroundColorAlpha ?? 100
        ),
        borderColor: hexToRgba(
          buttonStyles?.borderColor || styling.buttonBorderColor || buttonStyles?.backgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
          buttonStyles?.borderColorAlpha ?? 100
        ),
        borderWidth: `${Math.max(buttonStyles?.borderWidth || styling.buttonBorderWidth || 1, 1)}px`, // Ensure outline buttons have at least 1px border
      };
    }
  };

  // Helper function to get font size values
  const getFontSizeValue = (fontSize: string): string => {
    switch (fontSize) {
      case 'xs': return '0.75rem';
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      case 'xl': return '1.25rem';
      case 'base':
      default: return '1rem';
    }
  };

  // Helper function to get complete input styles
  const getInputStyles = () => ({
    backgroundColor: componentStyles.textInput?.backgroundColor || '#FFFFFF',
    borderRadius: `${componentStyles.textInput?.borderRadius || 8}px`,
    borderWidth: `${componentStyles.textInput?.borderWidth || 1}px`,
    borderColor: componentStyles.textInput?.borderColor || '#E5E7EB',
    borderStyle: 'solid' as const,
    padding: `${componentStyles.textInput?.padding || 12}px`,
    boxShadow: getShadowValue(componentStyles.textInput?.shadow || 'sm'),
    fontSize: getFontSizeValue(componentStyles.textInput?.fontSize || 'base'),
    color: componentStyles.textInput?.textColor || '#374151',
    height: `${componentStyles.textInput?.height || 40}px`,
  });

  // Submit lead mutation
  const submitMultiServiceLeadMutation = useMutation({
    mutationFn: async (data: {
      services: ServiceCalculation[];
      totalPrice: number;
      leadInfo: LeadFormData;
      distanceInfo?: {
        distance: number;
        fee: number;
        message: string;
      };
      appliedDiscounts?: Array<{
        id: string;
        name: string;
        percentage: number;
        amount: number;
      }>;
      bundleDiscountAmount?: number;
      selectedUpsells?: Array<{
        id: string;
        name: string;
        percentage: number;
        amount: number;
      }>;
    }) => {
      const payload = {
        name: data.leadInfo.name,
        email: data.leadInfo.email,
        phone: data.leadInfo.phone,
        address: data.leadInfo.address,
        notes: data.leadInfo.notes,
        howDidYouHear: data.leadInfo.howDidYouHear,
        services: data.services.map(service => ({
          ...service,
          calculatedPrice: Math.round(service.calculatedPrice * 100) // Convert to cents
        })),
        totalPrice: Math.round(data.totalPrice * 100), // Convert to cents for database storage
        distanceInfo: data.distanceInfo,
        appliedDiscounts: data.appliedDiscounts,
        bundleDiscountAmount: data.bundleDiscountAmount ? Math.round(data.bundleDiscountAmount * 100) : undefined, // Convert to cents
        selectedUpsells: data.selectedUpsells,
        businessOwnerId: accountId,
      };
      
      return apiRequest("POST", "/api/multi-service-leads", payload);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      
      if (data?.id) {
        setSubmittedLeadId(data.id);
      }
      
      setCurrentStep("pricing");
    },
    onError: () => {
      console.error("Failed to submit quote request");
    },
  });

  const handleServiceToggle = (formulaId: number) => {
    if (selectedServices.includes(formulaId)) {
      setSelectedServices(prev => prev.filter(id => id !== formulaId));
      // Remove variables and calculations for this service
      setServiceVariables(prev => {
        const newVars = { ...prev };
        delete newVars[formulaId];
        return newVars;
      });
      setServiceCalculations(prev => {
        const newCalcs = { ...prev };
        delete newCalcs[formulaId];
        return newCalcs;
      });
    } else {
      setSelectedServices(prev => [...prev, formulaId]);
    }
  };

  const handleServiceVariableChange = (serviceId: number, variableId: string, value: any) => {
    setServiceVariables(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [variableId]: value
      }
    }));
  };

  const calculateServicePrice = (serviceId: number) => {
    const service = formulas?.find(f => f.id === serviceId);
    if (!service) return 0;

    try {
      let formulaExpression = service.formula;
      const variables = serviceVariables[serviceId] || {};
      
      service.variables.forEach((variable) => {
        let value = variables[variable.id];
        
        // Check if this variable should be visible based on conditional logic
        const shouldShow = !variable.conditionalLogic?.enabled || 
          evaluateConditionalLogic(variable, variables, service.variables);
        
        // If variable is hidden by conditional logic, use default value
        if (!shouldShow) {
          const defaultValue = getDefaultValueForHiddenVariable(variable);
          
          // Convert default value to numeric for calculation
          if (variable.type === 'checkbox') {
            value = defaultValue ? 1 : 0;
          } else if (variable.type === 'select' && variable.options) {
            const option = variable.options.find(opt => opt.value === defaultValue);
            value = option?.multiplier || option?.numericValue || 0;
          } else if (variable.type === 'dropdown' && variable.options) {
            const option = variable.options.find(opt => opt.value === defaultValue);
            value = option?.numericValue || 0;
          } else if (variable.type === 'multiple-choice' && variable.options) {
            // For multiple-choice, handle both array and single value defaults
            if (Array.isArray(defaultValue)) {
              // Sum up numericValue for each selected option in the array
              value = defaultValue.reduce((total: number, selectedValue: any) => {
                const option = variable.options?.find(opt => opt.value.toString() === selectedValue.toString());
                return total + (option?.numericValue || 0);
              }, 0);
            } else {
              // Try to find option by value first
              const option = variable.options.find(opt => opt.value === defaultValue);
              if (option) {
                value = option.numericValue || 0;
              } else {
                // If no option matches, treat defaultValue as a number (for multiplier use cases)
                value = Number(defaultValue) || 0;
              }
            }
          } else if (variable.type === 'number' || variable.type === 'slider') {
            value = Number(defaultValue) || 0;
          } else {
            value = 0; // Safe fallback for calculation
          }
        } else {
          // Handle case where single-select values are accidentally stored as arrays
          if (Array.isArray(value) && (variable.type === 'select' || variable.type === 'dropdown')) {
            value = value[0]; // Take the first value for single-select inputs
          }
          
          if (variable.type === 'select' && variable.options) {
            const option = variable.options.find(opt => opt.value === value);
            value = option?.multiplier || option?.numericValue || 0;
          } else if (variable.type === 'dropdown' && variable.options) {
            const option = variable.options.find(opt => opt.value === value);
            value = option?.numericValue || 0;
          } else if (variable.type === 'multiple-choice' && variable.options) {
            if (Array.isArray(value)) {
              value = value.reduce((total: number, selectedValue: string) => {
                const option = variable.options?.find(opt => opt.value.toString() === selectedValue);
                return total + (option?.numericValue || 0);
              }, 0);
            } else {
              value = 0;
            }
          } else if (variable.type === 'number' || variable.type === 'slider') {
            value = Number(value) || 0;
          } else if (variable.type === 'checkbox') {
            value = value ? 1 : 0;
          } else {
            value = 0;
          }
        }
        
        formulaExpression = formulaExpression.replace(
          new RegExp(`\\b${variable.id}\\b`, 'g'),
          String(value)
        );
      });
      
      const result = Function(`"use strict"; return (${formulaExpression})`)();
      return Math.round(result);
    } catch (error) {
      console.error('Formula calculation error:', error);
      console.error('Service ID:', serviceId);
      console.error('Service variables:', serviceVariables[serviceId]);
      return 0;
    }
  };

  const proceedToConfiguration = () => {
    if (selectedServices.length === 0) {
      return;
    }
    setCurrentStep("configuration");
  };

  const proceedToContact = () => {
    // Check if all visible variables for selected services are answered
    const allMissingVariables: string[] = [];

    for (const serviceId of selectedServices) {
      const service = formulas?.find(f => f.id === serviceId);
      if (!service) continue;

      const serviceVars = serviceVariables[serviceId] || {};
      const { isCompleted, missingVariables } = areAllVisibleVariablesCompleted(
        service.variables, 
        serviceVars
      );
      
      if (!isCompleted) {
        const serviceMissingVars = missingVariables.map(varName => `${service.title || service.name}: ${varName}`);
        allMissingVariables.push(...serviceMissingVars);
        
        console.log("Service:", service.title || service.name);
        console.log("Service variables:", service.variables);
        console.log("Service variable values:", serviceVars);
        console.log("Missing variables for this service:", missingVariables);
      }
    }

    if (allMissingVariables.length > 0) {
      console.log("Missing required variables:", allMissingVariables);
      console.error("Missing required variables - user should complete all visible fields first");
      
      const missingFieldElements = document.querySelectorAll('[data-missing-field]');
      missingFieldElements.forEach(el => el.removeAttribute('data-missing-field'));
      
      for (const serviceId of selectedServices) {
        const service = formulas?.find(f => f.id === serviceId);
        if (!service) continue;
        
        const serviceVars = serviceVariables[serviceId] || {};
        const { missingVariables } = areAllVisibleVariablesCompleted(service.variables, serviceVars);
        
        missingVariables.forEach(varName => {
          const variable = service.variables.find(v => v.name === varName);
          if (variable) {
            const fieldElement = document.querySelector(`[data-variable-id="${variable.id}"]`);
            if (fieldElement) {
              fieldElement.setAttribute('data-missing-field', 'true');
              fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        });
      }
      
      return;
    }

    // Calculate prices for all services
    const calculations: Record<number, number> = {};
    selectedServices.forEach(serviceId => {
      calculations[serviceId] = calculateServicePrice(serviceId);
    });
    setServiceCalculations(calculations);
    setCurrentStep("contact");
  };

  // Function to calculate distance between two addresses using Google Maps API
  const calculateDistance = async (customerAddress: string) => {
    const businessAddress = businessSettings?.businessAddress;
    console.log('Calculating distance:', { businessAddress, customerAddress, enableDistancePricing: businessSettings?.enableDistancePricing });
    
    if (!businessAddress || !customerAddress || !businessSettings?.enableDistancePricing) {
      console.log('Distance calculation skipped - missing requirements');
      setDistanceInfo(null);
      return;
    }

    try {
      console.log('Making distance calculation request...');
      const response = await fetch('/api/calculate-distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessAddress,
          customerAddress
        })
      });

      console.log('Distance API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Distance API response data:', data);
        
        const distance = data.distance; // distance in miles
        const serviceRadius = businessSettings.serviceRadius || 25;
        
        console.log(`Distance: ${distance} miles, Service radius: ${serviceRadius} miles`);
        
        if (distance <= serviceRadius) {
          console.log('Within service area - no travel fee');
          setDistanceInfo(null); // Within service area
          return;
        }

        const extraMiles = distance - serviceRadius;
        const pricingType = businessSettings.distancePricingType || 'dollar';
        const pricingRate = (businessSettings.distancePricingRate || 0) / 100; // Convert from stored format
        
        console.log(`Extra miles: ${extraMiles}, Pricing type: ${pricingType}, Rate: ${pricingRate}`);
        
        let fee = 0;
        let message = '';

        if (pricingType === 'dollar') {
          fee = Math.round(extraMiles * pricingRate * 100) / 100; // Fixed dollar amount per mile
          message = `Travel fee: $${fee.toFixed(2)} for ${extraMiles.toFixed(1)} miles beyond our ${serviceRadius}-mile service area ($${pricingRate.toFixed(2)} per mile)`;
        } else {
          // Percentage-based fee will be calculated based on subtotal later
          const percentage = pricingRate * extraMiles;
          message = `Travel fee: ${(percentage * 100).toFixed(1)}% surcharge for ${extraMiles.toFixed(1)} miles beyond our ${serviceRadius}-mile service area (${(pricingRate * 100).toFixed(1)}% per mile)`;
          fee = percentage; // Store as decimal percentage for later calculation
        }

        console.log('Setting distance info:', { distance, fee, message });
        setDistanceInfo({
          distance,
          fee,
          message
        });
      } else {
        const errorData = await response.json();
        console.error('Distance API error:', errorData);
        setDistanceInfo(null);
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      setDistanceInfo(null);
    }
  };

  const handleDiscountToggle = (discountId: string) => {
    if (businessSettings?.allowDiscountStacking) {
      // Allow multiple discounts
      setSelectedDiscounts(prev => 
        prev.includes(discountId) 
          ? prev.filter(id => id !== discountId)
          : [...prev, discountId]
      );
    } else {
      // Only allow one discount at a time
      setSelectedDiscounts(prev => 
        prev.includes(discountId) ? [] : [discountId]
      );
    }
  };

  const handleUpsellToggle = (upsellId: string) => {
    setSelectedUpsells(prev => 
      prev.includes(upsellId) 
        ? prev.filter(id => id !== upsellId)
        : [...prev, upsellId]
    );
  };


  if (isLoadingDesign || isLoadingCustomForm) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!formData || !businessSettings) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Form Not Found</h2>
        <p className="text-gray-600">This custom form doesn't exist or has been disabled.</p>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "selection":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: styling.primaryColor || '#2563EB' }}
              >
                {form?.name || 'Select Your Services'}
              </h1>
              <p className="text-gray-600">
                {form?.description || "Choose the services you'd like a quote for"}
              </p>
            </div>

            {/* Form Introduction Video */}
            {businessSettings?.guideVideos?.introVideo && (
              <GuideVideo 
                videoUrl={businessSettings.guideVideos.introVideo}
                title="How to Use Our Pricing Form"
              />
            )}
            
            <EnhancedServiceSelector
              formulas={displayedFormulas || []}
              selectedServices={selectedServices}
              onServiceToggle={handleServiceToggle}
              onContinue={proceedToConfiguration}
              hasCustomCSS={!!designSettings?.customCSS}
              componentStyles={componentStyles}
              styling={styling}
            />
          </div>
        );

      case "configuration":
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: styling.primaryColor || '#2563EB' }}
              >
                Service Configuration
              </h1>
              <p className="text-gray-600">
                Please provide details for your selected services
              </p>
            </div>
            
            {selectedServices.map(serviceId => {
              const service = formulas?.find(f => f.id === serviceId);
              if (!service) return null;
              
              return (
                <Card 
                  key={serviceId} 
                  className="p-6"
                  style={{
                    backgroundColor: componentStyles.questionCard?.backgroundColor || '#FFFFFF',
                    borderRadius: `${componentStyles.questionCard?.borderRadius || 8}px`,
                    borderWidth: `${componentStyles.questionCard?.borderWidth || 1}px`,
                    borderColor: componentStyles.questionCard?.borderColor || '#E5E7EB',
                    borderStyle: 'solid',
                    boxShadow: componentStyles.questionCard?.shadow === 'none' ? 'none' :
                               componentStyles.questionCard?.shadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                               componentStyles.questionCard?.shadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' :
                               componentStyles.questionCard?.shadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' :
                               componentStyles.questionCard?.shadow === 'xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' :
                               '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: `${componentStyles.questionCard?.padding || 24}px`,
                  }}
                >
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: styling.textColor || '#1F2937' }}
                  >
                    {service.title}
                  </h3>

                  {/* Show guide video if available */}
                  {service.guideVideoUrl && (
                    <div className="mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 5v10l8-5-8-5z"/>
                            </svg>
                          </div>
                          <h4 className="font-semibold text-blue-900">Service Guide Video</h4>
                        </div>
                        <p className="text-sm text-blue-700 mb-4">
                          Watch this helpful guide before configuring your {service.name.toLowerCase()} service.
                        </p>
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <iframe
                            src={convertToEmbedUrl(service.guideVideoUrl)}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={`${service.name} Guide Video`}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show Measure Map if enabled for this service */}
                  {service.enableMeasureMap && (
                    <div className="mb-6">
                      <CollapsibleMeasureMap
                        measurementType={service.measureMapType || "area"}
                        unit={service.measureMapUnit || "sqft"}
                        onMeasurementComplete={(measurement) => {
                          // Find the first area/size variable and auto-populate it
                          const areaVariable = service.variables.find((v: any) => 
                            v.name.toLowerCase().includes('size') || 
                            v.name.toLowerCase().includes('area') || 
                            v.name.toLowerCase().includes('square') ||
                            v.name.toLowerCase().includes('sq')
                          );
                          
                          if (areaVariable) {
                            handleServiceVariableChange(serviceId, areaVariable.id, measurement.value);
                            console.log(`Measurement applied: ${measurement.value} ${measurement.unit} to ${areaVariable.name}`);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Show Photo Measurement if enabled for this service */}
                  {service.enablePhotoMeasurement && service.photoMeasurementSetup && (
                    <div className="mb-6">
                      <CollapsiblePhotoMeasurement
                        setup={service.photoMeasurementSetup}
                        onMeasurementComplete={(measurement) => {
                          // Find the first area/size variable and auto-populate it
                          const areaVariable = service.variables.find((v: any) => 
                            v.name.toLowerCase().includes('size') || 
                            v.name.toLowerCase().includes('area') || 
                            v.name.toLowerCase().includes('square') ||
                            v.name.toLowerCase().includes('sq')
                          );
                          
                          if (areaVariable) {
                            handleServiceVariableChange(serviceId, areaVariable.id, measurement.value);
                            console.log(`Photo measurement applied: ${measurement.value} ${measurement.unit} to ${areaVariable.name}`);
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    {service.variables.map((variable) => (
                      <EnhancedVariableInput
                        key={variable.id}
                        variable={variable}
                        value={serviceVariables[serviceId]?.[variable.id]}
                        onChange={(value) => handleServiceVariableChange(serviceId, variable.id, value)}
                        styling={styling}
                        componentStyles={componentStyles}
                        allVariables={service.variables}
                        currentValues={serviceVariables[serviceId] || {}}
                      />
                    ))}
                  </div>
                </Card>
              );
            })}
            
            <Button
              onClick={proceedToContact}
              className="w-full"
              style={getButtonStyles('primary')}
              onMouseEnter={(e) => {
                const hoverStyles = {
                  backgroundColor: (styling as any).buttonHoverBackgroundColor || '#1d4ed8',
                  color: (styling as any).buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                  borderColor: (styling as any).buttonHoverBorderColor || (styling as any).buttonHoverBackgroundColor || '#1d4ed8',
                };
                Object.assign((e.target as HTMLElement).style, hoverStyles);
              }}
              onMouseLeave={(e) => {
                const normalStyles = getButtonStyles('primary');
                Object.assign((e.target as HTMLElement).style, normalStyles);
              }}
            >
              Get Quote
            </Button>
          </div>
        );

      case "contact":
        // Calculate pricing with discounts and tax for contact step (exclude negative prices)
        const contactSubtotal = Object.values(serviceCalculations).reduce((sum, price) => sum + Math.max(0, price), 0);
        const contactBundleDiscount = (businessSettings?.styling?.showBundleDiscount && selectedServices.length > 1)
          ? Math.round(contactSubtotal * ((businessSettings.styling.bundleDiscountPercent || 0) / 100))
          : 0;
        const contactDiscountedSubtotal = contactSubtotal - contactBundleDiscount;
        const contactTaxAmount = businessSettings?.styling?.enableSalesTax 
          ? Math.round(contactDiscountedSubtotal * ((businessSettings.styling.salesTaxRate || 0) / 100))
          : 0;
        const contactFinalTotal = contactDiscountedSubtotal + contactTaxAmount;
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: styling.primaryColor || '#2563EB' }}
              >
                Contact Information
              </h1>
              <p className="text-gray-600">
                We need your contact details to send you the quote
              </p>
            </div>

            {/* Contact Form */}
            <div className="space-y-4">
              {/* Name Field - Show if not explicitly disabled */}
              {businessSettings?.styling?.enableName !== false && (
                <div>
                  <Label htmlFor="name" style={{ color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.nameLabel || 'Name'} {businessSettings?.styling?.requireName !== false ? '*' : ''}
                  </Label>
                  <Input
                    id="name"
                    data-testid="input-name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    required={businessSettings?.styling?.requireName !== false}
                    style={getInputStyles()}
                  />
                </div>
              )}

              {/* Email Field - Show if not explicitly disabled */}
              {businessSettings?.styling?.enableEmail !== false && (
                <div>
                  <Label htmlFor="email" style={{ color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.emailLabel || 'Email'} {businessSettings?.styling?.requireEmail !== false ? '*' : ''}
                  </Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                    required={businessSettings?.styling?.requireEmail !== false}
                    style={getInputStyles()}
                  />
                </div>
              )}

              {/* Phone Field - Show only if enabled */}
              {businessSettings?.styling?.enablePhone && (
                <div>
                  <Label htmlFor="phone" style={{ color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.phoneLabel || 'Phone'} {businessSettings?.styling?.requirePhone ? '*' : ''}
                  </Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    required={businessSettings?.styling?.requirePhone}
                    style={getInputStyles()}
                  />
                </div>
              )}

              {/* Address Field - Show only if enabled */}
              {businessSettings?.styling?.enableAddress && (
                <div>
                  <Label htmlFor="address" style={{ color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.addressLabel || 'Address'} {businessSettings?.styling?.requireAddress ? '*' : ''}
                  </Label>
                  <GoogleMapsLoader>
                    <GooglePlacesAutocomplete
                      value={leadForm.address || ''}
                      onChange={(newAddress) => {
                        setLeadForm(prev => ({ ...prev, address: newAddress }));
                        // Calculate distance when address changes (with debounce)
                        if (newAddress.length > 10) {
                          const timeoutId = setTimeout(() => {
                            calculateDistance(newAddress);
                          }, 1000);
                        } else {
                          setDistanceInfo(null);
                        }
                      }}
                      placeholder={`Enter your ${(businessSettings?.styling?.addressLabel || 'Address').toLowerCase()}`}
                      types={['address']}
                      componentRestrictions={{ country: 'us' }}
                      styling={styling}
                      componentStyles={designSettings?.componentStyles}
                      className="data-[testid='input-address']"
                    />
                  </GoogleMapsLoader>
                </div>
              )}

              {/* Notes Field - Show only if enabled */}
              {businessSettings?.styling?.enableNotes && (
                <div>
                  <Label htmlFor="notes" style={{ color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.notesLabel || 'Additional Notes'}
                  </Label>
                  <textarea
                    id="notes"
                    data-testid="input-notes"
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                    style={{
                      ...getInputStyles(),
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    className="w-full px-3 py-2 rounded-md border"
                  />
                </div>
              )}

              {/* How Did You Hear Field - Show only if enabled */}
              {businessSettings?.styling?.enableHowDidYouHear && (
                <div>
                  <Label htmlFor="howDidYouHear" style={{ color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.howDidYouHearLabel || 'How did you hear about us?'} {businessSettings?.styling?.requireHowDidYouHear ? '*' : ''}
                  </Label>
                  <select
                    id="howDidYouHear"
                    data-testid="select-how-did-you-hear"
                    value={leadForm.howDidYouHear || ''}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, howDidYouHear: e.target.value }))}
                    required={businessSettings?.styling?.requireHowDidYouHear}
                    style={getInputStyles()}
                    className="w-full"
                  >
                    <option value="">Select an option...</option>
                    {(businessSettings?.styling?.howDidYouHearOptions || ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other']).map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={() => {
                // Validate required fields
                const nameValid = businessSettings?.styling?.enableName === false || !businessSettings?.styling?.requireName || leadForm.name.trim();
                const emailValid = businessSettings?.styling?.enableEmail === false || !businessSettings?.styling?.requireEmail || leadForm.email.trim();
                const phoneValid = !businessSettings?.styling?.enablePhone || !businessSettings?.styling?.requirePhone || leadForm.phone.trim();
                const addressValid = !businessSettings?.styling?.enableAddress || !businessSettings?.styling?.requireAddress || leadForm.address?.trim();
                const howDidYouHearValid = !businessSettings?.styling?.enableHowDidYouHear || !businessSettings?.styling?.requireHowDidYouHear || leadForm.howDidYouHear?.trim();

                if (nameValid && emailValid && phoneValid && addressValid && howDidYouHearValid) {
                  // Prepare service data for submission
                  const serviceData = selectedServices.map(serviceId => {
                    const formula = formulas.find(f => f.id === serviceId);
                    const variables = serviceVariables[serviceId] || {};
                    const calculatedPrice = serviceCalculations[serviceId] || 0;
                    
                    return {
                      formulaId: serviceId,
                      formulaName: formula?.name || '',
                      variables,
                      calculatedPrice
                    };
                  });

                  submitMultiServiceLeadMutation.mutate({
                    services: serviceData,
                    totalPrice: contactFinalTotal,
                    leadInfo: leadForm,
                    distanceInfo: distanceInfo || undefined,
                    bundleDiscountAmount: contactBundleDiscount,
                  });
                } else {
                  console.error("Missing required fields");
                }
              }}
              className="w-full"
              style={getButtonStyles('primary')}
              disabled={submitMultiServiceLeadMutation.isPending}
              onMouseEnter={(e) => {
                const hoverStyles = {
                  backgroundColor: (styling as any).buttonHoverBackgroundColor || '#1d4ed8',
                  color: (styling as any).buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                  borderColor: (styling as any).buttonHoverBorderColor || (styling as any).buttonHoverBackgroundColor || '#1d4ed8',
                };
                Object.assign((e.target as HTMLElement).style, hoverStyles);
              }}
              onMouseLeave={(e) => {
                const normalStyles = getButtonStyles('primary');
                Object.assign((e.target as HTMLElement).style, normalStyles);
              }}
            >
              {submitMultiServiceLeadMutation.isPending ? 'Submitting...' : 'Submit Quote Request'}
            </Button>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => setCurrentStep("configuration")}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to configuration
              </button>
            </div>
          </div>
        );

      case "pricing":
        // Calculate final pricing (exclude negative prices)
        const subtotal = Object.values(serviceCalculations).reduce((sum, price) => sum + Math.max(0, price), 0);
        
        // Calculate customer discount amount (if any discounts are selected)
        const customerDiscountAmount = (() => {
          if (!businessSettings?.discounts || selectedDiscounts.length === 0) return 0;
          
          const activeDiscounts = businessSettings.discounts.filter(d => selectedDiscounts.includes(d.id));
          if (activeDiscounts.length === 0) return 0;
          
          // Handle multiple discounts if enabled
          if (businessSettings.styling?.allowMultipleDiscounts) {
            return activeDiscounts.reduce((total, discount) => {
              return total + (subtotal * (discount.percentage / 100));
            }, 0);
          } else {
            // Use the single selected discount
            const discount = activeDiscounts[0];
            return discount ? subtotal * (discount.percentage / 100) : 0;
          }
        })();
        
        // Apply customer discounts first
        const afterCustomerDiscounts = subtotal - customerDiscountAmount;
        
        // Calculate bundle discount on the discounted subtotal
        const bundleDiscount = (businessSettings?.styling?.showBundleDiscount && selectedServices.length >= (businessSettings.styling.bundleMinServices || 2))
          ? Math.round(afterCustomerDiscounts * ((businessSettings.styling.bundleDiscountPercent || 0) / 100))
          : 0;
        
        // Calculate upsell prices
        const upsellTotal = selectedServices.reduce((acc, serviceId) => {
          const service = formulas?.find(f => f.id === serviceId);
          if (!service?.upsellItems) return acc;
          
          const serviceUpsells = service.upsellItems.filter(upsell => selectedUpsells.includes(upsell.id));
          const serviceUpsellTotal = serviceUpsells.reduce((sum, upsell) => {
            return sum + Math.round(subtotal * (upsell.percentageOfMain / 100));
          }, 0);
          
          return acc + serviceUpsellTotal;
        }, 0);
        
        // Calculate distance fee
        const distanceFee = distanceInfo?.fee || 0;
        
        const discountedSubtotal = afterCustomerDiscounts - bundleDiscount + upsellTotal + distanceFee;
        const taxAmount = businessSettings?.styling?.enableSalesTax 
          ? Math.round(discountedSubtotal * ((businessSettings.styling.salesTaxRate || 0) / 100))
          : 0;
        const finalTotal = discountedSubtotal + taxAmount;

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: styling.primaryColor || '#2563EB' }}
              >
                Your Quote
              </h1>
              <p className="text-gray-600">
                Review your service quote and pricing details
              </p>
            </div>

            {/* Service Cards Display */}
            <ServiceCardDisplay 
              selectedServices={selectedServices.map(serviceId => {
                const formula = formulas.find(f => f.id === serviceId);
                return {
                  formula: formula!,
                  calculatedPrice: Math.max(0, serviceCalculations[serviceId] || 0),
                  variables: serviceVariables[serviceId] || {}
                };
              }).filter(s => s.formula)}
              styling={styling as any}
              showPricing={true}
            />

            {/* Detailed Pricing Breakdown */}
            <div className="border-t border-gray-300 pt-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4" style={{ color: styling.textColor || '#1F2937' }}>
                Pricing Breakdown
              </h3>
              
              {/* Individual Service Line Items */}
              <div className="space-y-3">
                {selectedServices.map(serviceId => {
                  const service = formulas?.find(f => f.id === serviceId);
                  const price = Math.max(0, serviceCalculations[serviceId] || 0);
                  
                  // Use title first, then name as fallback, then service ID
                  const serviceName = service?.title || service?.name || `Service ${serviceId}`;
                  
                  return (
                    <div key={serviceId} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <span className="text-base" style={{ color: styling.textColor || '#1F2937' }}>
                          {serviceName}
                        </span>
                        {price === 0 && serviceCalculations[serviceId] <= 0 && (
                          <span className="ml-2 text-sm text-red-500">(Price Error)</span>
                        )}
                      </div>
                      <span className="text-base font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                        ${price.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-lg font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                  Subtotal:
                </span>
                <span className="text-lg font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                  ${subtotal.toLocaleString()}
                </span>
              </div>

              {/* Bundle Discount */}
              {bundleDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg text-green-600">
                    Bundle Discount ({businessSettings?.styling?.bundleDiscountPercent || 0}%):
                  </span>
                  <span className="text-lg font-medium text-green-600">
                    -${bundleDiscount.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Customer Discounts */}
              {customerDiscountAmount > 0 && (
                <div className="space-y-2">
                  {businessSettings?.discounts?.filter(d => d.isActive && selectedDiscounts.includes(d.id)).map((discount) => (
                    <div key={discount.id} className="flex justify-between items-center">
                      <span className="text-lg text-green-600">
                        {discount.name} ({discount.percentage}%):
                      </span>
                      <span className="text-lg font-medium text-green-600">
                        -${Math.round(subtotal * (discount.percentage / 100)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Distance Fee */}
              {distanceFee > 0 && distanceInfo && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-orange-600">
                      Travel Fee:
                    </span>
                    <span className="text-lg font-medium text-orange-600">
                      ${distanceFee.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-orange-600 leading-tight">
                    {distanceInfo.message}
                  </p>
                </div>
              )}

              {/* Selected Upsells */}
              {selectedUpsells.length > 0 && (
                <div className="space-y-2">
                  {selectedServices.map(serviceId => {
                    const service = formulas?.find(f => f.id === serviceId);
                    if (!service?.upsellItems) return null;
                    
                    return service.upsellItems.filter(u => selectedUpsells.includes(u.id)).map((upsell) => {
                      const upsellPrice = Math.round(subtotal * (upsell.percentageOfMain / 100));
                      return (
                        <div key={upsell.id} className="flex justify-between items-center">
                          <span className="text-lg text-orange-600">
                            {upsell.name}:
                          </span>
                          <span className="text-lg font-medium text-orange-600">
                            +${upsellPrice.toLocaleString()}
                          </span>
                        </div>
                      );
                    });
                  })}
                </div>
              )}

              {/* Sales Tax */}
              {taxAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-lg" style={{ color: styling.textColor || '#1F2937' }}>
                    Sales Tax ({businessSettings?.styling?.salesTaxRate || 0}%):
                  </span>
                  <span className="text-lg font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                    ${taxAmount.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Final Total */}
              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold" style={{ color: styling.textColor || '#1F2937' }}>
                    Total:
                  </span>
                  <span 
                    className="text-4xl font-bold"
                    style={{ color: styling.primaryColor || '#2563EB' }}
                  >
                    ${finalTotal.toLocaleString()}
                  </span>
                </div>
                {bundleDiscount > 0 && (
                  <p className="text-sm text-green-600 font-medium text-right mt-1">
                    You save ${bundleDiscount.toLocaleString()} with our bundle discount!
                  </p>
                )}
              </div>

              {/* Customer Discount Selection */}
              {businessSettings?.discounts && businessSettings.discounts.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: styling.textColor || '#1F2937' }}>
                    💰 Available Discounts
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {businessSettings.styling?.allowMultipleDiscounts ? 
                      'Select all applicable discounts:' : 
                      'Select one discount that applies to you:'
                    }
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {businessSettings.discounts.map((discount) => {
                      const isSelected = selectedDiscounts.includes(discount.id);
                      
                      return (
                        <div
                          key={discount.id}
                          onClick={() => {
                            if (businessSettings.styling?.allowMultipleDiscounts) {
                              // Multiple discounts allowed
                              if (isSelected) {
                                setSelectedDiscounts(prev => prev.filter(id => id !== discount.id));
                              } else {
                                setSelectedDiscounts(prev => [...prev, discount.id]);
                              }
                            } else {
                              // Single discount only
                              if (isSelected) {
                                setSelectedDiscounts([]);
                              } else {
                                setSelectedDiscounts([discount.id]);
                              }
                            }
                          }}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{discount.name}</h4>
                              {discount.description && (
                                <p className="text-sm text-gray-600 mt-1">{discount.description}</p>
                              )}
                              <div className="text-lg font-bold text-blue-600 mt-2">
                                {discount.percentage}% OFF
                              </div>
                            </div>
                            {isSelected && (
                              <div className="text-sm text-blue-600 font-medium">
                                ✓ Applied
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Show discount savings */}
                  {selectedDiscounts.length > 0 && (
                    <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                      <div className="text-sm font-medium text-green-800 mb-2">Discount Savings Applied:</div>
                      {businessSettings.discounts.filter(d => selectedDiscounts.includes(d.id)).map((discount) => (
                        <div key={discount.id} className="flex justify-between items-center text-sm">
                          <span className="text-green-700">{discount.name} ({discount.percentage}%):</span>
                          <span className="font-medium text-green-600">
                            -${Math.round(subtotal * (discount.percentage / 100)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {customerDiscountAmount > 0 && (
                        <div className="text-sm font-semibold text-green-800 mt-2 pt-2 border-t border-green-200">
                          Total Discount Savings: -${customerDiscountAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Upsell Items */}
              {(() => {
                // Collect all upsells from selected services
                const allUpsells = selectedServices.reduce((acc, serviceId) => {
                  const service = formulas?.find(f => f.id === serviceId);
                  if (service?.upsellItems) {
                    // Add service context to each upsell for better identification
                    const serviceUpsells = service.upsellItems.map(upsell => ({
                      ...upsell,
                      serviceId: service.id,
                      serviceName: service.name
                    }));
                    acc.push(...serviceUpsells);
                  }
                  return acc;
                }, [] as any[]);
                
                return allUpsells.length > 0 && (
                  <div className="mt-6 p-6 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: styling.textColor || '#1F2937' }}>
                      ⭐ Recommended Add-Ons
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Enhance your services with these popular add-ons
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allUpsells.map((upsell) => {
                      const upsellPrice = Math.round(subtotal * (upsell.percentageOfMain / 100));
                      const isSelected = selectedUpsells.includes(upsell.id);
                      
                      return (
                        <div
                          key={upsell.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUpsells(prev => prev.filter(id => id !== upsell.id));
                            } else {
                              setSelectedUpsells(prev => [...prev, upsell.id]);
                            }
                          }}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon/Image */}
                            <div className="flex-shrink-0">
                              {upsell.iconUrl ? (
                                <img 
                                  src={upsell.iconUrl} 
                                  alt={upsell.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : upsell.imageUrl ? (
                                <img 
                                  src={upsell.imageUrl} 
                                  alt={upsell.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-orange-200 rounded flex items-center justify-center">
                                  <span className="text-orange-600 text-sm font-semibold">+</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium text-gray-900 break-words">{upsell.name}</h4>
                                    {upsell.isPopular && (
                                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                        Popular
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 break-words leading-relaxed">{upsell.description}</p>
                                  {upsell.category && (
                                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded break-words">
                                      {upsell.category}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0 sm:ml-3">
                                  <div className="text-lg font-bold text-orange-600 whitespace-nowrap">
                                    +${upsellPrice.toLocaleString()}
                                  </div>
                                  {isSelected && (
                                    <div className="text-sm text-orange-600 font-medium mt-1 whitespace-nowrap">
                                      ✓ Added
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {upsell.tooltip && (
                                <div className="mt-2 text-xs text-gray-500 italic break-words leading-relaxed">
                                  💡 {upsell.tooltip}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                    {/* Show selected upsells total */}
                    {selectedUpsells.length > 0 && (
                      <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-300">
                        <div className="text-sm font-medium text-orange-800 mb-2">Add-ons Selected:</div>
                        {allUpsells.filter(u => selectedUpsells.includes(u.id)).map((upsell) => {
                          const upsellPrice = Math.round(subtotal * (upsell.percentageOfMain / 100));
                          return (
                            <div key={upsell.id} className="flex justify-between items-center text-sm">
                              <span className="text-orange-700">{upsell.name} ({upsell.serviceName}):</span>
                              <span className="font-medium text-orange-600">
                                +${upsellPrice.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                        <div className="text-sm font-semibold text-orange-800 mt-2 pt-2 border-t border-orange-200">
                          Total Add-ons: +${allUpsells.filter(u => selectedUpsells.includes(u.id))
                            .reduce((sum, upsell) => sum + Math.round(subtotal * (upsell.percentageOfMain / 100)), 0)
                            .toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Pricing Disclaimer */}
              {businessSettings?.styling?.enableDisclaimer && businessSettings.styling.disclaimerText && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: styling.primaryColor || '#3B82F6' }}>
                  <p className="text-sm text-gray-600">
                    <strong className="font-medium" style={{ color: styling.textColor || '#1F2937' }}>Important: </strong>
                    {businessSettings.styling.disclaimerText}
                  </p>
                </div>
              )}

              {/* Customer Info Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2" style={{ color: styling.textColor || '#1F2937' }}>
                  Quote for: {leadForm.name}
                </h4>
                <p className="text-sm text-gray-600">{leadForm.email}</p>
                <p className="text-sm text-gray-600">{leadForm.phone}</p>
                {leadForm.address && <p className="text-sm text-gray-600">{leadForm.address}</p>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {businessSettings?.enableBooking && (
                <Button
                  onClick={() => setCurrentStep("scheduling")}
                  className="flex-1"
                  style={getButtonStyles('primary')}
                  onMouseEnter={(e) => {
                    const hoverStyles = {
                      backgroundColor: (styling as any).buttonHoverBackgroundColor || '#1d4ed8',
                      color: (styling as any).buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                      borderColor: (styling as any).buttonHoverBorderColor || (styling as any).buttonHoverBackgroundColor || '#1d4ed8',
                    };
                    Object.assign((e.target as HTMLElement).style, hoverStyles);
                  }}
                  onMouseLeave={(e) => {
                    const normalStyles = getButtonStyles('primary');
                    Object.assign((e.target as HTMLElement).style, normalStyles);
                  }}
                >
                  Schedule Service
                </Button>
              )}
              {!businessSettings?.enableBooking && businessSettings?.styling?.enableCustomButton ? (
                <Button
                  onClick={() => {
                    if (businessSettings.styling.customButtonUrl) {
                      window.open(businessSettings.styling.customButtonUrl, '_blank');
                    } else {
                      // Default behavior - restart the form
                      setSelectedServices([]);
                      setServiceVariables({});
                      setServiceCalculations({});
                      setLeadForm({ name: "", email: "", phone: "", address: "", notes: "" });
                      setCurrentStep("selection");
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                  style={getButtonStyles('outline')}
                  onMouseEnter={(e) => {
                    const hoverStyles = {
                      backgroundColor: (styling as any).buttonHoverBackgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
                      color: (styling as any).buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                      borderColor: (styling as any).buttonHoverBorderColor || (styling as any).buttonHoverBackgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
                    };
                    Object.assign((e.target as HTMLElement).style, hoverStyles);
                  }}
                  onMouseLeave={(e) => {
                    const normalStyles = getButtonStyles('outline');
                    Object.assign((e.target as HTMLElement).style, normalStyles);
                  }}
                >
                  {businessSettings.styling.customButtonText || "Get Another Quote"}
                </Button>
              ) : !businessSettings?.enableBooking && (
                <Button
                  onClick={() => {
                    // Restart the form
                    setSelectedServices([]);
                    setServiceVariables({});
                    setServiceCalculations({});
                    setLeadForm({ name: "", email: "", phone: "", address: "", notes: "" });
                    setCurrentStep("selection");
                  }}
                  variant="outline"
                  className="flex-1"
                  style={getButtonStyles('outline')}
                  onMouseEnter={(e) => {
                    const hoverStyles = {
                      backgroundColor: (styling as any).buttonHoverBackgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
                      color: (styling as any).buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                      borderColor: (styling as any).buttonHoverBorderColor || (styling as any).buttonHoverBackgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
                    };
                    Object.assign((e.target as HTMLElement).style, hoverStyles);
                  }}
                  onMouseLeave={(e) => {
                    const normalStyles = getButtonStyles('outline');
                    Object.assign((e.target as HTMLElement).style, normalStyles);
                  }}
                >
                  Start New Quote
                </Button>
              )}
            </div>
          </div>
        );

      case "scheduling":
        // Calculate final pricing for scheduling step (exclude negative prices)
        const schedulingSubtotal = Object.values(serviceCalculations).reduce((sum, price) => sum + Math.max(0, price), 0);
        
        // Calculate customer discount amount (if any discounts are selected)
        const schedulingCustomerDiscountAmount = (() => {
          if (!businessSettings?.discounts || selectedDiscounts.length === 0) return 0;
          
          const activeDiscounts = businessSettings.discounts.filter(d => selectedDiscounts.includes(d.id));
          if (activeDiscounts.length === 0) return 0;
          
          // Handle multiple discounts if enabled
          if (businessSettings.styling?.allowMultipleDiscounts) {
            return activeDiscounts.reduce((total, discount) => {
              return total + (schedulingSubtotal * (discount.percentage / 100));
            }, 0);
          } else {
            // Use the single selected discount
            const discount = activeDiscounts[0];
            return discount ? schedulingSubtotal * (discount.percentage / 100) : 0;
          }
        })();
        
        // Apply customer discounts first
        const schedulingAfterCustomerDiscounts = schedulingSubtotal - schedulingCustomerDiscountAmount;
        
        const schedulingBundleDiscount = (businessSettings?.styling?.showBundleDiscount && selectedServices.length >= (businessSettings.styling.bundleMinServices || 2))
          ? Math.round(schedulingAfterCustomerDiscounts * ((businessSettings.styling.bundleDiscountPercent || 0) / 100))
          : 0;
        
        // Calculate upsell prices for scheduling
        const schedulingUpsellTotal = selectedServices.reduce((acc, serviceId) => {
          const service = formulas?.find(f => f.id === serviceId);
          if (!service?.upsellItems) return acc;
          
          const serviceUpsells = service.upsellItems.filter(upsell => selectedUpsells.includes(upsell.id));
          const serviceUpsellTotal = serviceUpsells.reduce((sum, upsell) => {
            return sum + Math.round(schedulingSubtotal * (upsell.percentageOfMain / 100));
          }, 0);
          
          return acc + serviceUpsellTotal;
        }, 0);
        
        // Calculate distance fee for scheduling
        const schedulingDistanceFee = distanceInfo?.fee || 0;
        
        const schedulingDiscountedSubtotal = schedulingAfterCustomerDiscounts - schedulingBundleDiscount + schedulingUpsellTotal + schedulingDistanceFee;
        const schedulingTaxAmount = businessSettings?.styling?.enableSalesTax 
          ? Math.round(schedulingDiscountedSubtotal * ((businessSettings.styling.salesTaxRate || 0) / 100))
          : 0;
        const schedulingFinalTotal = schedulingDiscountedSubtotal + schedulingTaxAmount;

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: styling.primaryColor || '#2563EB' }}
              >
                Schedule Your Service
              </h1>
              <p className="text-gray-600">
                Choose a convenient time for your service appointment
              </p>
            </div>

            {/* Schedule Page Video */}
            {businessSettings?.guideVideos?.scheduleVideo && (
              <GuideVideo 
                videoUrl={businessSettings.guideVideos.scheduleVideo}
                title="How to Schedule Your Appointment"
              />
            )}

            {/* Quote Summary */}
            <div 
              className="p-6 rounded-lg mb-6"
              style={{
                backgroundColor: componentStyles.pricingCard?.backgroundColor || '#F8F9FA',
                borderRadius: `${componentStyles.pricingCard?.borderRadius || 8}px`,
                borderWidth: `${componentStyles.pricingCard?.borderWidth || 1}px`,
                borderColor: componentStyles.pricingCard?.borderColor || '#E5E7EB',
                borderStyle: 'solid',
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold" style={{ color: styling.textColor || '#1F2937' }}>
                    Total: ${schedulingFinalTotal.toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedServices.length} service(s) selected
                    {schedulingBundleDiscount > 0 && (
                      <span className="text-green-600 font-medium"> • ${schedulingBundleDiscount.toLocaleString()} bundle savings!</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {!bookingConfirmed ? (
              /* Booking Calendar */
              <BookingCalendar
                onBookingConfirmed={(slotId) => {
                  setBookingConfirmed(true);
                }}
                leadId={submittedLeadId || undefined}
                businessOwnerId={accountId}
                customerInfo={{
                  name: leadForm.name,
                  email: leadForm.email,
                  phone: leadForm.phone
                }}
              />
            ) : (
              /* Booking Confirmation */
              <div className="text-center p-8 bg-green-50 rounded-lg">
                <div className="text-green-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Appointment Scheduled Successfully!
                </h3>
                <p className="text-green-700 mb-4">
                  Your appointment has been confirmed. You'll receive a confirmation email at <strong>{leadForm.email}</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                  <Button
                    onClick={() => {
                      setSelectedServices([]);
                      setServiceVariables({});
                      setServiceCalculations({});
                      setSelectedDiscounts([]);
                      setSelectedUpsells([]);
                      setLeadForm({ name: "", email: "", phone: "", address: "", notes: "", howDidYouHear: "" });
                      setSubmittedLeadId(null);
                      setBookingConfirmed(false);
                      setCurrentStep("selection");
                    }}
                    style={{
                      ...getButtonStyles('primary'),
                      padding: '12px 24px',
                      fontSize: '16px',
                    }}
                    onMouseEnter={(e) => {
                      const hoverStyles = {
                        backgroundColor: (styling as any).buttonHoverBackgroundColor || '#1d4ed8',
                        color: (styling as any).buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                        borderColor: (styling as any).buttonHoverBorderColor || (styling as any).buttonHoverBackgroundColor || '#1d4ed8',
                      };
                      Object.assign((e.target as HTMLElement).style, hoverStyles);
                    }}
                    onMouseLeave={(e) => {
                      const normalStyles = {
                        ...getButtonStyles('primary'),
                        padding: '12px 24px',
                        fontSize: '16px',
                      };
                      Object.assign((e.target as HTMLElement).style, normalStyles);
                    }}
                  >
                    Schedule Another Service
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Helper function to handle CSS values that could be strings or numbers
  const getCSSValue = (value: any, defaultValue: string | number, unit: string = 'px'): string => {
    if (value === undefined || value === null) {
      return typeof defaultValue === 'number' ? `${defaultValue}${unit}` : defaultValue;
    }
    if (typeof value === 'string') {
      return value; // Use string values as-is (e.g., "24px 12px", "0 auto")
    }
    return `${value}${unit}`; // Append unit to numeric values
  };

  return (
    <GoogleMapsLoader>
      <div 
        className="min-h-screen flex items-start justify-center p-1 sm:p-2"
        style={{ 
          margin: '0',
          fontFamily: styling.fontFamily === 'inter' ? '"Inter", sans-serif' :
                      styling.fontFamily === 'roboto' ? '"Roboto", sans-serif' :
                      styling.fontFamily === 'opensans' ? '"Open Sans", sans-serif' :
                      styling.fontFamily === 'lato' ? '"Lato", sans-serif' :
                      styling.fontFamily === 'montserrat' ? '"Montserrat", sans-serif' :
                      styling.fontFamily === 'poppins' ? '"Poppins", sans-serif' :
                      '"Inter", sans-serif'
        }}
      >
        <div 
          className="form-container w-full mx-auto"
          style={{
            maxWidth: getCSSValue(styling.containerWidth, 768),
            backgroundColor: (styling as any).containerBackgroundColor || styling.backgroundColor || 'transparent',
            borderRadius: getCSSValue(styling.containerBorderRadius, 16),
            borderWidth: getCSSValue((styling as any).containerBorderWidth, 0),
            borderColor: (styling as any).containerBorderColor || 'transparent',
            borderStyle: 'solid',
            padding: getCSSValue(styling.containerPadding, 8),
            margin: getCSSValue(styling.containerMargin, 0),
            boxShadow: styling.containerShadow === 'none' ? 'none' :
                      styling.containerShadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                      styling.containerShadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' :
                      styling.containerShadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' :
                      styling.containerShadow === 'xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' :
                      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          {renderCurrentStep()}
        </div>
      </div>
    </GoogleMapsLoader>
  );
}