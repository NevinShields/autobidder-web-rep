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
import BookingCalendar from "@/components/booking-calendar";
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
    queryFn: () => fetch(`/api/public/design-settings?userId=${accountId}`).then(res => res.json()),
    enabled: !!accountId && !isLoadingCustomForm,
    staleTime: 0,
    cacheTime: 0,
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

  // Auto-select services from the custom form
  useEffect(() => {
    if (form?.serviceIds && selectedServices.length === 0) {
      setSelectedServices(form.serviceIds);
    }
  }, [form?.serviceIds, selectedServices.length]);

  // Get styling from design settings - map to the format components expect
  const styling = designSettings?.styling || {
    primaryColor: '#2563EB',
    textColor: '#374151',
    backgroundColor: '#FFFFFF',
    containerBorderRadius: 16,
    containerShadow: 'lg',
    buttonBorderRadius: 12,
    resultBackgroundColor: '#F3F4F6'
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
        services: data.services,
        totalPrice: data.totalPrice,
        distanceInfo: data.distanceInfo,
        appliedDiscounts: data.appliedDiscounts,
        bundleDiscountAmount: data.bundleDiscountAmount,
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

  // Helper function to create shadow value
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
    const baseStyles = {
      borderRadius: `${styling.buttonBorderRadius || 12}px`,
      padding: getButtonPadding(styling.buttonPadding),
      fontSize: '18px',
      fontWeight: styling.buttonFontWeight || '600',
      borderWidth: `${styling.buttonBorderWidth || 0}px`,
      borderStyle: 'solid' as const,
      boxShadow: getShadowValue(styling.buttonShadow || 'md'),
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer' as const,
    };

    if (variant === 'primary') {
      return {
        ...baseStyles,
        backgroundColor: styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
        color: styling.buttonTextColor || '#FFFFFF',
        borderColor: styling.buttonBorderColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
        borderColor: styling.buttonBorderColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
        borderWidth: `${Math.max(styling.buttonBorderWidth || 1, 1)}px`, // Ensure outline buttons have at least 1px border
      };
    }
  };

  // Helper function to get font size
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
                      <MeasureMapTerraImproved
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
                  backgroundColor: styling.buttonHoverBackgroundColor || '#1d4ed8',
                  color: styling.buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                  borderColor: styling.buttonHoverBorderColor || styling.buttonHoverBackgroundColor || '#1d4ed8',
                };
                Object.assign(e.target.style, hoverStyles);
              }}
              onMouseLeave={(e) => {
                const normalStyles = getButtonStyles('primary');
                Object.assign(e.target.style, normalStyles);
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
                  <Input
                    id="address"
                    data-testid="input-address"
                    value={leadForm.address}
                    onChange={(e) => {
                      const newAddress = e.target.value;
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
                    required={businessSettings?.styling?.requireAddress}
                    style={getInputStyles()}
                  />
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
                    distanceInfo,
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
                  backgroundColor: styling.buttonHoverBackgroundColor || '#1d4ed8',
                  color: styling.buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                  borderColor: styling.buttonHoverBorderColor || styling.buttonHoverBackgroundColor || '#1d4ed8',
                };
                Object.assign(e.target.style, hoverStyles);
              }}
              onMouseLeave={(e) => {
                const normalStyles = getButtonStyles('primary');
                Object.assign(e.target.style, normalStyles);
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
        // Calculate final pricing
        const subtotal = Object.values(serviceCalculations).reduce((sum, price) => sum + Math.max(0, price), 0);
        const bundleDiscount = (businessSettings?.styling?.showBundleDiscount && selectedServices.length > 1)
          ? Math.round(subtotal * ((businessSettings.styling.bundleDiscountPercent || 0) / 100))
          : 0;
        const discountedSubtotal = subtotal - bundleDiscount;
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
                Quote Complete!
              </h1>
              <p className="text-gray-600">
                Your quote has been submitted successfully
              </p>
            </div>

            {/* Quote Summary */}
            <Card 
              style={{
                backgroundColor: componentStyles.container?.backgroundColor || '#FFFFFF',
                borderRadius: `${componentStyles.container?.borderRadius || 8}px`,
                borderWidth: `${componentStyles.container?.borderWidth || 1}px`,
                borderColor: componentStyles.container?.borderColor || '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: getShadowValue(componentStyles.container?.shadow || 'sm'),
                padding: `${componentStyles.container?.padding || 24}px`,
              }}
            >
              <CardContent>
                <h3 className="text-lg font-semibold mb-4">Quote Summary</h3>
                
                <div className="space-y-3">
                  {selectedServices.map(serviceId => {
                    const formula = formulas.find(f => f.id === serviceId);
                    if (!formula) return null;
                    
                    return (
                      <div key={serviceId} className="flex justify-between items-center">
                        <span>{formula.name}</span>
                        <span className="font-semibold">
                          ${serviceCalculations[serviceId]?.toLocaleString() || '0'}
                        </span>
                      </div>
                    );
                  })}
                  
                  <hr />
                  
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  
                  {bundleDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Bundle Discount ({businessSettings.styling.bundleDiscountPercent}%):</span>
                      <span>-${bundleDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({businessSettings.styling.salesTaxRate}%):</span>
                      <span>${taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span style={{ color: styling.primaryColor }}>
                      ${finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Section */}
            {businessSettings?.enableBooking && submittedLeadId && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Schedule Your Appointment</h3>
                <BookingCalendar
                  leadId={submittedLeadId}
                  businessOwnerId={accountId}
                  onBookingConfirmed={() => {
                    setBookingConfirmed(true);
                    setCurrentStep("scheduling");
                  }}
                />
              </div>
            )}

            {/* Contact Information */}
            <div className="text-center text-sm text-gray-600">
              <p>
                We'll contact you within 24 hours to confirm your quote.
              </p>
              <p>
                Questions? Contact us at{" "}
                <a 
                  href={`mailto:${businessSettings?.styling?.contactEmail || 'info@example.com'}`}
                  className="underline"
                  style={{ color: styling.primaryColor }}
                >
                  {businessSettings?.styling?.contactEmail || 'info@example.com'}
                </a>
              </p>
            </div>
          </div>
        );

      case "scheduling":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: styling.primaryColor || '#2563EB' }}
              >
                Appointment Confirmed!
              </h1>
              <p className="text-gray-600">
                Your appointment has been successfully scheduled
              </p>
            </div>

            <div className="text-center">
              <p className="text-green-600 font-medium">
                ✓ Quote submitted and appointment booked
              </p>
              <p className="text-sm text-gray-600 mt-2">
                You'll receive a confirmation email shortly.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GoogleMapsLoader>
      <div 
        style={{
          backgroundColor: styling.backgroundColor || '#F9FAFB',
          minHeight: '100vh',
          padding: isEmbed ? '16px' : '24px',
          fontFamily: styling.fontFamily === 'inter' ? '"Inter", sans-serif' :
                      styling.fontFamily === 'roboto' ? '"Roboto", sans-serif' :
                      styling.fontFamily === 'opensans' ? '"Open Sans", sans-serif' :
                      styling.fontFamily === 'lato' ? '"Lato", sans-serif' :
                      styling.fontFamily === 'montserrat' ? '"Montserrat", sans-serif' :
                      styling.fontFamily === 'poppins' ? '"Poppins", sans-serif' :
                      '"Inter", sans-serif'
        }}
        className="min-h-screen"
      >
        <div 
          className="max-w-2xl mx-auto"
          style={{
            maxWidth: `${styling.containerWidth || 768}px`,
            backgroundColor: 'transparent',
          }}
        >
          {renderCurrentStep()}
        </div>
      </div>
    </GoogleMapsLoader>
  );
}