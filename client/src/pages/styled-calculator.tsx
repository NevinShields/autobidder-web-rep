import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";
import MeasureMap from "@/components/measure-map";
import type { Formula, DesignSettings, ServiceCalculation, BusinessSettings } from "@shared/schema";

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
}

interface StyledCalculatorProps {
  formula?: Formula;
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

export default function StyledCalculator(props: any = {}) {
  const { formula: propFormula } = props;
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
  const [currentStep, setCurrentStep] = useState<"selection" | "configuration" | "contact" | "pricing" | "scheduling">("selection");
  const { toast } = useToast();
  const search = useSearch();

  // Get userId from URL parameters for public access
  const searchParams = new URLSearchParams(search);
  const userId = searchParams.get('userId');
  const isPublicAccess = !!userId;



  // Fetch design settings - use appropriate endpoint based on access type
  const { data: designSettings, isLoading: isLoadingDesign } = useQuery<DesignSettings>({
    queryKey: isPublicAccess ? ['/api/public/design-settings', userId] : ['/api/design-settings'],
    queryFn: isPublicAccess 
      ? () => fetch(`/api/public/design-settings?userId=${userId}`).then(res => res.json())
      : () => apiRequest("GET", "/api/design-settings"),
  });

  // Fetch formulas - use appropriate endpoint based on access type
  const { data: formulas, isLoading: isLoadingFormulas } = useQuery<Formula[]>({
    queryKey: isPublicAccess ? ['/api/public/formulas', userId] : ['/api/formulas'],
    queryFn: isPublicAccess 
      ? () => fetch(`/api/public/formulas?userId=${userId}`).then(res => res.json())
      : () => apiRequest("GET", "/api/formulas"),
    enabled: !propFormula, // Only fetch if no formula prop provided
  });

  // Fetch business settings - use appropriate endpoint based on access type
  const { data: businessSettings } = useQuery<BusinessSettings>({
    queryKey: isPublicAccess ? ['/api/public/business-settings', userId] : ['/api/business-settings'],
    queryFn: isPublicAccess 
      ? () => fetch(`/api/public/business-settings?userId=${userId}`).then(res => res.json())
      : () => apiRequest("GET", "/api/business-settings"),
    onSuccess: (data) => {
      console.log('Business settings loaded:', data);
      console.log('Discounts available:', data?.discounts);
      console.log('Active discounts:', data?.discounts?.filter(d => d.isActive));
    }
  });

  // Use provided formula or first available formula
  const formula = propFormula || (formulas && formulas.length > 0 ? formulas[0] : null);

  // Submit lead mutation
  const submitMultiServiceLeadMutation = useMutation({
    mutationFn: async (data: {
      services: ServiceCalculation[];
      totalPrice: number;
      leadInfo: LeadFormData;
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
        businessOwnerId: isPublicAccess ? userId : undefined,
      };
      
      // Use public endpoint if accessing publicly
      const endpoint = isPublicAccess ? "/api/public/multi-service-leads" : "/api/multi-service-leads";
      return apiRequest("POST", endpoint, payload);
    },
    onSuccess: () => {
      toast({
        title: "Quote request submitted successfully!",
        description: "We'll get back to you with detailed pricing soon.",
      });
      // Move to pricing page instead of resetting
      setCurrentStep("pricing");
    },
    onError: () => {
      toast({
        title: "Failed to submit quote request",
        variant: "destructive",
      });
    },
  });

  if (isLoadingDesign || isLoadingFormulas) {
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

  if (!formula) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">No Calculator Available</h2>
        <p className="text-gray-600">You need to create a calculator first to preview it here.</p>
        <Button className="mt-4" onClick={() => window.location.href = '/formulas'}>
          Create Calculator
        </Button>
      </div>
    );
  }

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
        } else if (variable.type === 'number') {
          value = Number(value) || 0;
        } else if (variable.type === 'checkbox') {
          value = value ? 1 : 0;
        } else {
          value = 0;
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
      return 0;
    }
  };

  const proceedToConfiguration = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "Please select at least one service",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep("configuration");
  };

  const proceedToContact = () => {
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
      // Use Google Maps Geocoding and Distance Matrix API
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

  const calculateDiscountAmount = (subtotal: number) => {
    if (!businessSettings?.discounts || selectedDiscounts.length === 0) {
      return 0;
    }

    const activeDiscounts = businessSettings.discounts.filter(d => 
      d.isActive && selectedDiscounts.includes(d.id)
    );

    if (businessSettings.allowDiscountStacking) {
      // Stack all selected discounts
      return activeDiscounts.reduce((total, discount) => {
        return total + (subtotal * (discount.percentage / 100));
      }, 0);
    } else {
      // Use the single selected discount
      const discount = activeDiscounts[0];
      return discount ? subtotal * (discount.percentage / 100) : 0;
    }
  };

  const handleSubmitLead = () => {
    const missingFields: string[] = [];
    const formSettings = businessSettings?.styling;
    
    // Check each field only if it's enabled and required
    if (formSettings?.requireName !== false && !leadForm.name) {
      missingFields.push(formSettings?.nameLabel || 'Name');
    }
    if (formSettings?.requireEmail !== false && !leadForm.email) {
      missingFields.push(formSettings?.emailLabel || 'Email');
    }
    if (formSettings?.enablePhone && formSettings?.requirePhone && !leadForm.phone) {
      missingFields.push(formSettings?.phoneLabel || 'Phone');
    }
    if (formSettings?.enableAddress && formSettings?.requireAddress && !leadForm.address) {
      missingFields.push(formSettings?.addressLabel || 'Address');
    }
    if (formSettings?.enableHowDidYouHear && formSettings?.requireHowDidYouHear && !leadForm.howDidYouHear) {
      missingFields.push(formSettings?.howDidYouHearLabel || 'How did you hear about us');
    }

    if (missingFields.length > 0) {
      toast({
        title: "Please fill in all required fields",
        description: `Missing: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const services: ServiceCalculation[] = selectedServices.map(serviceId => {
      const service = formulas?.find(f => f.id === serviceId);
      return {
        formulaId: serviceId,
        formulaName: service?.title || '',
        variables: serviceVariables[serviceId] || {},
        calculatedPrice: serviceCalculations[serviceId] || 0
      };
    });

    // Calculate total price with discounts and distance fees
    const subtotal = Object.values(serviceCalculations).reduce((sum, price) => sum + price, 0);
    const bundleDiscount = (businessSettings?.styling?.showBundleDiscount && selectedServices.length > 1)
      ? Math.round(subtotal * ((businessSettings.styling.bundleDiscountPercent || 0) / 100))
      : 0;
    const customerDiscountAmount = calculateDiscountAmount(subtotal);
    const discountedSubtotal = subtotal - bundleDiscount - customerDiscountAmount;
    
    // Calculate distance fee
    let distanceFee = 0;
    if (distanceInfo && businessSettings?.enableDistancePricing) {
      if (businessSettings.distancePricingType === 'dollar') {
        distanceFee = Math.round(distanceInfo.fee * 100) / 100;
      } else {
        distanceFee = Math.round(discountedSubtotal * distanceInfo.fee * 100) / 100;
      }
    }
    
    const subtotalWithDistance = discountedSubtotal + distanceFee;
    const taxAmount = businessSettings?.styling?.enableSalesTax 
      ? Math.round(subtotalWithDistance * ((businessSettings.styling.salesTaxRate || 0) / 100))
      : 0;
    const totalPrice = subtotalWithDistance + taxAmount;

    // Prepare discount information for submission
    const appliedDiscountData = businessSettings?.discounts
      ?.filter(d => d.isActive && selectedDiscounts.includes(d.id))
      ?.map(discount => ({
        id: discount.id,
        name: discount.name,
        percentage: discount.percentage,
        amount: Math.round(subtotal * (discount.percentage / 100) * 100) // Convert to cents
      })) || [];

    submitMultiServiceLeadMutation.mutate({
      services,
      totalPrice,
      leadInfo: leadForm,
      distanceInfo: distanceInfo ? {
        distance: distanceInfo.distance,
        fee: distanceFee,
        message: distanceInfo.message
      } : undefined,
      appliedDiscounts: appliedDiscountData,
      bundleDiscountAmount: Math.round(bundleDiscount * 100) // Convert to cents
    });
  };

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
                Select Your Services
              </h1>
              <p className="text-gray-600">
                Choose the services you'd like a quote for
              </p>
            </div>
            
            <EnhancedServiceSelector
              formulas={formulas || []}
              selectedServices={selectedServices}
              onServiceToggle={handleServiceToggle}
              componentStyles={componentStyles}
              styling={{
                ...styling,
                // Map service selector specific styles
                serviceSelectorBackgroundColor: componentStyles.serviceSelector?.backgroundColor,
                serviceSelectorBorderColor: componentStyles.serviceSelector?.borderColor,
                serviceSelectorBorderWidth: componentStyles.serviceSelector?.borderWidth,
                serviceSelectorBorderRadius: componentStyles.serviceSelector?.borderRadius,
                serviceSelectorShadow: componentStyles.serviceSelector?.shadow,
                serviceSelectorPadding: componentStyles.serviceSelector?.padding,
                serviceSelectorHeight: componentStyles.serviceSelector?.height,
                serviceSelectorWidth: componentStyles.serviceSelector?.width,
                serviceSelectorActiveBackgroundColor: componentStyles.serviceSelector?.activeBackgroundColor,
                serviceSelectorActiveBorderColor: componentStyles.serviceSelector?.activeBorderColor,
                serviceSelectorHoverBackgroundColor: componentStyles.serviceSelector?.hoverBackgroundColor,
                serviceSelectorHoverBorderColor: componentStyles.serviceSelector?.hoverBorderColor,
              }}
            />
            
            <Button
              onClick={proceedToConfiguration}
              className="w-full mt-6"
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
              Continue
            </Button>
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
                      <MeasureMap
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
                            toast({
                              title: "Measurement Applied",
                              description: `${measurement.value} ${measurement.unit} has been applied to ${areaVariable.name}`,
                            });
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
                    value={leadForm.address}
                    onChange={(e) => {
                      const newAddress = e.target.value;
                      setLeadForm(prev => ({ ...prev, address: newAddress }));
                      // Calculate distance when address changes (with debounce)
                      if (newAddress.length > 10) {
                        // Clear any existing timeout
                        const timeoutId = setTimeout(() => {
                          calculateDistance(newAddress);
                        }, 1000);
                        // Store timeout ID for cleanup if needed
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
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                    style={getInputStyles()}
                    className="min-h-[80px] resize-y w-full"
                    rows={3}
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
                    value={leadForm.howDidYouHear || ''}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, howDidYouHear: e.target.value }))}
                    required={businessSettings?.styling?.requireHowDidYouHear}
                    style={getInputStyles()}
                    className="w-full"
                  >
                    <option value="">Select an option...</option>
                    {(businessSettings?.styling?.howDidYouHearOptions || []).map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmitLead}
              disabled={submitMultiServiceLeadMutation.isPending}
              className="w-full"
              style={getButtonStyles('primary')}
              onMouseEnter={(e) => {
                if (!submitMultiServiceLeadMutation.isPending) {
                  const hoverStyles = {
                    backgroundColor: styling.buttonHoverBackgroundColor || '#1d4ed8',
                    color: styling.buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                    borderColor: styling.buttonHoverBorderColor || styling.buttonHoverBackgroundColor || '#1d4ed8',
                  };
                  Object.assign(e.target.style, hoverStyles);
                }
              }}
              onMouseLeave={(e) => {
                const normalStyles = getButtonStyles('primary');
                Object.assign(e.target.style, normalStyles);
              }}
            >
              {submitMultiServiceLeadMutation.isPending ? 'Submitting...' : 'Submit Quote Request'}
            </Button>
          </div>
        );

      case "pricing":
        // Calculate pricing with discounts, distance fees, and tax (exclude negative prices)
        const subtotal = Object.values(serviceCalculations).reduce((sum, price) => sum + Math.max(0, price), 0);
        const bundleDiscount = (businessSettings?.styling?.showBundleDiscount && selectedServices.length > 1)
          ? Math.round(subtotal * ((businessSettings.styling.bundleDiscountPercent || 0) / 100))
          : 0;
        const customerDiscountAmount = calculateDiscountAmount(subtotal);
        const discountedSubtotal = subtotal - bundleDiscount - customerDiscountAmount;
        
        // Calculate distance fee
        let distanceFee = 0;
        if (distanceInfo && businessSettings?.enableDistancePricing) {
          if (businessSettings.distancePricingType === 'dollar') {
            distanceFee = Math.round(distanceInfo.fee * 100) / 100; // Fixed dollar amount
          } else {
            distanceFee = Math.round(discountedSubtotal * distanceInfo.fee * 100) / 100; // Percentage of subtotal
          }
        }
        
        const subtotalWithDistance = discountedSubtotal + distanceFee;
        const taxAmount = businessSettings?.styling?.enableSalesTax 
          ? Math.round(subtotalWithDistance * ((businessSettings.styling.salesTaxRate || 0) / 100))
          : 0;
        const finalTotalPrice = subtotalWithDistance + taxAmount;


        
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: styling.primaryColor || '#2563EB' }}
              >
                Your Quote is Ready!
              </h1>
              <p className="text-gray-600">
                Here's your personalized pricing breakdown
              </p>
            </div>

            {/* Detailed Pricing Card */}
            <div 
              className="p-8 rounded-lg mb-6"
              style={{
                backgroundColor: componentStyles.pricingCard?.backgroundColor || styling.resultBackgroundColor || '#F3F4F6',
                borderRadius: `${componentStyles.pricingCard?.borderRadius || styling.containerBorderRadius || 12}px`,
                borderWidth: `${componentStyles.pricingCard?.borderWidth || 1}px`,
                borderColor: componentStyles.pricingCard?.borderColor || '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: getShadowValue(componentStyles.pricingCard?.shadow || 'sm'),
                padding: `${componentStyles.pricingCard?.padding || 32}px`,
              }}
            >
              {/* Service Pricing Cards */}
              <div className="space-y-6 mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8" style={{ color: styling.textColor || '#1F2937' }}>
                  Your Service Packages
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {selectedServices.map((serviceId) => {
                    const service = formulas?.find(f => f.id === serviceId);
                    const servicePrice = serviceCalculations[serviceId] || 0;
                    const serviceVars = serviceVariables[serviceId] || {};
                    
                    if (!service) return null;
                    
                    // Handle negative or zero prices gracefully
                    const displayPrice = Math.max(0, servicePrice);
                    const hasPricingIssue = servicePrice <= 0;

                    // Get service variables for features list
                    const serviceFeatures = Object.entries(serviceVars)
                      .filter(([key, value]) => {
                        if (!value || value === '') return false;
                        const variable = service.variables?.find(v => v.id === key);
                        return variable && variable.type !== 'text'; // Exclude basic text inputs
                      })
                      .map(([key, value]) => {
                        const variable = service.variables?.find(v => v.id === key);
                        if (!variable) return null;
                        
                        let displayValue = value;
                        if (typeof value === 'boolean') {
                          displayValue = value ? 'Yes' : 'No';
                        } else if (variable.type === 'multiple-choice' || variable.type === 'dropdown') {
                          const option = variable.options?.find(opt => opt.value === value);
                          if (option) displayValue = option.label;
                        }
                        
                        return {
                          name: variable.name,
                          value: displayValue
                        };
                      })
                      .filter(Boolean);

                    return (
                      <div 
                        key={serviceId}
                        className="relative overflow-hidden transition-all duration-300 hover:scale-105 shadow-xl"
                        style={{
                          borderRadius: '16px',
                          backgroundColor: styling.pricingCardBackgroundColor || '#FFFFFF',
                          borderWidth: '1px',
                          borderColor: styling.pricingCardBorderColor || '#E5E7EB',
                          borderStyle: 'solid'
                        }}
                      >
                        {/* Header with service name and standard badge */}
                        <div className="text-center pb-4 relative p-6">
                          <div className="absolute top-4 right-4">
                            <div 
                              className="text-xs font-medium px-3 py-1 rounded-full"
                              style={{
                                backgroundColor: styling.primaryColor || '#3B82F6',
                                color: '#FFFFFF'
                              }}
                            >
                              Standard
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <h4 className="text-lg sm:text-xl font-bold mb-1" style={{ color: styling.textColor || '#1F2937' }}>
                              {service.name}
                            </h4>
                            {service.title && (
                              <p className="text-sm text-gray-600 mb-3">{service.title}</p>
                            )}
                            
                            {/* Price Display */}
                            <div className="mb-4">
                              <div className="flex items-baseline justify-center gap-1">
                                <span 
                                  className="text-4xl sm:text-5xl font-bold"
                                  style={{ color: hasPricingIssue ? '#EF4444' : styling.textColor || '#1F2937' }}
                                >
                                  {hasPricingIssue ? 'Price Error' : `$${displayPrice.toLocaleString()}`}
                                </span>
                                {!hasPricingIssue && <span className="text-lg text-gray-500 ml-1">total</span>}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {hasPricingIssue 
                                  ? 'Please check your input values' 
                                  : 'Based on your selections'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 pb-6">
                          {/* Features List */}
                          <div className="space-y-3 mb-6">
                            <p className="text-sm font-semibold text-gray-700">
                              What's included:
                            </p>
                            
                            {serviceFeatures.length > 0 ? (
                              <ul className="space-y-2">
                                {serviceFeatures.slice(0, 6).map((feature, index) => (
                                  <li key={index} className="flex items-start gap-3 text-sm">
                                    <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                                      ✓
                                    </div>
                                    <span className="text-gray-700">
                                      <span className="font-medium">{feature.name}:</span> {feature.value}
                                    </span>
                                  </li>
                                ))}
                                
                                {/* Standard service features */}
                                <li className="flex items-start gap-3 text-sm">
                                  <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                                    ✓
                                  </div>
                                  <span className="text-gray-700">Professional service</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                  <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                                    ✓
                                  </div>
                                  <span className="text-gray-700">Quality guarantee</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                  <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                                    ✓
                                  </div>
                                  <span className="text-gray-700">Free consultation</span>
                                </li>
                              </ul>
                            ) : (
                              <ul className="space-y-2">
                                <li className="flex items-start gap-3 text-sm">
                                  <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                                    ✓
                                  </div>
                                  <span className="text-gray-700">Professional {service.name.toLowerCase()} service</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                  <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                                    ✓
                                  </div>
                                  <span className="text-gray-700">Quality materials and workmanship</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                  <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                                    ✓
                                  </div>
                                  <span className="text-gray-700">Free consultation</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                  <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                                    ✓
                                  </div>
                                  <span className="text-gray-700">Satisfaction guarantee</span>
                                </li>
                              </ul>
                            )}
                          </div>


                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount Selection */}
              {businessSettings?.discounts && businessSettings.discounts.filter(d => d.isActive).length > 0 && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: styling.textColor || '#1F2937' }}>
                    Available Discounts
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {businessSettings.allowDiscountStacking 
                      ? "Select all discounts you qualify for (they can be combined)" 
                      : "Select one discount you qualify for"
                    }
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {businessSettings.discounts.filter(d => d.isActive).map((discount) => (
                      <div
                        key={discount.id}
                        onClick={() => handleDiscountToggle(discount.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedDiscounts.includes(discount.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {discount.name}
                            </div>
                            {discount.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {discount.description}
                              </div>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <div className="text-lg font-bold text-green-600">
                              {discount.percentage}% OFF
                            </div>
                            {selectedDiscounts.includes(discount.id) && (
                              <div className="text-sm text-green-600 font-medium">
                                Applied
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    
                    return (
                      <div key={serviceId} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <span className="text-base" style={{ color: styling.textColor || '#1F2937' }}>
                            {service?.title || `Service ${serviceId}`}
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
                      ${finalTotalPrice.toLocaleString()}
                    </span>
                  </div>
                  {bundleDiscount > 0 && (
                    <p className="text-sm text-green-600 font-medium text-right mt-1">
                      You save ${bundleDiscount.toLocaleString()} with our bundle discount!
                    </p>
                  )}
                </div>
              </div>

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
              <Button
                onClick={() => setCurrentStep("scheduling")}
                className="flex-1"
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
                Schedule Service
              </Button>
              <Button
                onClick={() => {
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
                    backgroundColor: styling.buttonHoverBackgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
                    color: styling.buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                    borderColor: styling.buttonHoverBorderColor || styling.buttonHoverBackgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
                  };
                  Object.assign(e.target.style, hoverStyles);
                }}
                onMouseLeave={(e) => {
                  const normalStyles = getButtonStyles('outline');
                  Object.assign(e.target.style, normalStyles);
                }}
              >
                Start New Quote
              </Button>
            </div>
          </div>
        );

      case "scheduling":
        // Calculate final pricing for scheduling step (exclude negative prices)
        const schedulingSubtotal = Object.values(serviceCalculations).reduce((sum, price) => sum + Math.max(0, price), 0);
        const schedulingBundleDiscount = (businessSettings?.styling?.showBundleDiscount && selectedServices.length > 1)
          ? Math.round(schedulingSubtotal * ((businessSettings.styling.bundleDiscountPercent || 0) / 100))
          : 0;
        const schedulingDiscountedSubtotal = schedulingSubtotal - schedulingBundleDiscount;
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

            {/* Scheduling Message */}
            <div className="text-center p-8 bg-green-50 rounded-lg">
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Quote Submitted Successfully!
              </h3>
              <p className="text-green-700 mb-4">
                We'll contact you within 24 hours to schedule your appointment and confirm the final details.
              </p>
              <p className="text-sm text-green-600">
                You'll receive a confirmation email at <strong>{leadForm.email}</strong>
              </p>
            </div>

            {/* Contact Information */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2" style={{ color: styling.textColor || '#1F2937' }}>
                Need to make changes?
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Call us or reply to your confirmation email
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    setSelectedServices([]);
                    setServiceVariables({});
                    setServiceCalculations({});
                    setLeadForm({ name: "", email: "", phone: "", address: "", notes: "" });
                    setCurrentStep("selection");
                  }}
                  style={{
                    ...getButtonStyles('primary'),
                    padding: '12px 24px',
                    fontSize: '16px',
                  }}
                  onMouseEnter={(e) => {
                    const hoverStyles = {
                      backgroundColor: styling.buttonHoverBackgroundColor || '#1d4ed8',
                      color: styling.buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
                      borderColor: styling.buttonHoverBorderColor || styling.buttonHoverBackgroundColor || '#1d4ed8',
                    };
                    Object.assign(e.target.style, hoverStyles);
                  }}
                  onMouseLeave={(e) => {
                    const normalStyles = {
                      ...getButtonStyles('primary'),
                      padding: '12px 24px',
                      fontSize: '16px',
                    };
                    Object.assign(e.target.style, normalStyles);
                  }}
                >
                  Get Another Quote
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div 
        className="max-w-4xl w-full mx-auto"
        style={{
          backgroundColor: styling.backgroundColor || '#FFFFFF',
          borderRadius: `${styling.containerBorderRadius || 16}px`,
          padding: '24px',
          boxShadow: styling.containerShadow === 'xl' 
            ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        {renderCurrentStep()}
      </div>
    </div>
  );
}