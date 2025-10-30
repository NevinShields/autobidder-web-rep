import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calculator, User, Mail, Phone, Receipt, Percent, MapPin, MessageSquare, HeadphonesIcon, Calendar, ChevronDown, ChevronUp, Map } from "lucide-react";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import ServiceCardDisplay from "@/components/service-card-display";
import StepByStepForm from "@/components/step-by-step-form";
import { CollapsiblePhotoMeasurement } from "@/components/collapsible-photo-measurement";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Formula, BusinessSettings, StylingOptions } from "@shared/schema";

// Lazy load heavy components to improve initial loading performance
const BookingCalendar = lazy(() => import("@/components/booking-calendar"));
const ImageUpload = lazy(() => import("@/components/image-upload"));
const MeasureMapTerraImproved = lazy(() => import("@/components/measure-map-terra-improved"));
const GoogleMapsLoader = lazy(() => import("@/components/google-maps-loader").then(module => ({ default: module.GoogleMapsLoader })));
const GooglePlacesAutocomplete = lazy(() => import("@/components/google-places-autocomplete").then(module => ({ default: module.GooglePlacesAutocomplete })));

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
}

interface ServicePricing {
  formulaId: number;
  formulaName: string;
  variables: Record<string, any>;
  calculatedPrice: number;
}

// Collapsible Measure Map Component with lazy loading
function CollapsibleMeasureMap({ measurementType, unit, onMeasurementComplete }: {
  measurementType: string;
  unit: string;
  onMeasurementComplete: (measurement: { value: number; unit: string }) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldLoadMaps, setShouldLoadMaps] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && !shouldLoadMaps) {
      setShouldLoadMaps(true);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
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
        <div className="p-4">
          {shouldLoadMaps ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
                <div className="text-center">
                  <Map className="w-8 h-8 mx-auto mb-2 animate-pulse text-gray-400" />
                  <p className="text-sm text-gray-500">Loading map...</p>
                </div>
              </div>
            }>
              <GoogleMapsLoader>
                <MeasureMapTerraImproved
                  measurementType={measurementType}
                  unit={unit}
                  onMeasurementComplete={onMeasurementComplete}
                />
              </GoogleMapsLoader>
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
              <div className="text-center">
                <Map className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to load measurement tool</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmbedForm() {
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
  const [showPricing, setShowPricing] = useState(false);
  const [currentStep, setCurrentStep] = useState<"contact" | "services" | "configure" | "results">("services");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookedSlotId, setBookedSlotId] = useState<number | null>(null);
  const [sharedVariables, setSharedVariables] = useState<Record<string, any>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [photoMeasurements, setPhotoMeasurements] = useState<Array<{
    setupConfig: any;
    customerImageUrls: string[];
    estimatedValue: number;
    estimatedUnit: string;
    confidence: number;
    explanation: string;
    warnings: string[];
    formulaName?: string;
  }>>([]);
  const { toast } = useToast();
  const search = useSearch();

  // Get userId from URL parameters
  const searchParams = new URLSearchParams(search);
  const userId = searchParams.get('userId');

  // Show error if no userId provided
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Missing User ID</h1>
          <p className="text-gray-600">This embed form requires a valid user ID parameter.</p>
        </div>
      </div>
    );
  }

  // Fetch combined embed data with single optimized request
  const { data: embedData, isLoading: embedDataLoading } = useQuery({
    queryKey: ["/api/public/embed-data", userId],
    queryFn: () => fetch(`/api/public/embed-data?userId=${userId}`).then(res => res.json()),
  });

  // Extract data from combined response
  const formulas = embedData?.formulas || [];
  const settings = embedData?.businessSettings;

  // Use formulas directly as they are pre-filtered on the server
  const displayedFormulas = formulas;

  const availableFormulas = displayedFormulas;
  const businessSettings = settings as BusinessSettings;
  const styling = businessSettings?.styling || {} as StylingOptions;

  // Get connected variables across selected services
  const getConnectedVariables = () => {
    if (!availableFormulas || selectedServices.length === 0) return [];
    
    const connectedVars: Record<string, {
      connectionKey: string;
      variable: any;
      formulaIds: number[];
      name: string;
      type: string;
    }> = {};

    // Find variables with connectionKey across selected services
    selectedServices.forEach(serviceId => {
      const formula = availableFormulas.find(f => f.id === serviceId);
      if (formula?.variables) {
        formula.variables.forEach((variable: any) => {
          if (variable.connectionKey) {
            if (connectedVars[variable.connectionKey]) {
              // Add this formula to existing connected variable
              connectedVars[variable.connectionKey].formulaIds.push(serviceId);
            } else {
              // Create new connected variable entry
              connectedVars[variable.connectionKey] = {
                connectionKey: variable.connectionKey,
                variable: variable,
                formulaIds: [serviceId],
                name: variable.name,
                type: variable.type
              };
            }
          }
        });
      }
    });

    // Return only variables that appear in multiple services
    return Object.values(connectedVars).filter(cv => cv.formulaIds.length > 1);
  };

  // Get service-specific variables (excluding connected ones)
  const getServiceSpecificVariables = (formulaId: number) => {
    const formula = availableFormulas?.find(f => f.id === formulaId);
    if (!formula?.variables) return [];
    
    const connectedKeys = getConnectedVariables().map(cv => cv.connectionKey);
    return formula.variables.filter((variable: any) => 
      !variable.connectionKey || !connectedKeys.includes(variable.connectionKey)
    );
  };

  // Handle connected variable change
  const handleConnectedVariableChange = (connectionKey: string, value: any) => {
    setSharedVariables(prev => ({
      ...prev,
      [connectionKey]: value
    }));

    // Apply to all services that use this connected variable
    const connectedVar = getConnectedVariables().find(cv => cv.connectionKey === connectionKey);
    if (connectedVar) {
      connectedVar.formulaIds.forEach(formulaId => {
        const formula = availableFormulas?.find(f => f.id === formulaId);
        const variable = formula?.variables.find((v: any) => v.connectionKey === connectionKey);
        if (variable) {
          setServiceVariables(prev => ({
            ...prev,
            [formulaId]: {
              ...prev[formulaId],
              [variable.id]: value
            }
          }));
        }
      });
    }
  };

  // Submit lead mutation
  const submitMultiServiceLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const response = await fetch("/api/multi-service-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData)
      });
      if (!response.ok) {
        throw new Error('Failed to submit lead');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSubmittedLeadId(data.id);
      // Clear photo measurements after successful submission
      setPhotoMeasurements([]);
      toast({
        title: "Quote Request Submitted!",
        description: "We'll contact you within 24 hours with your custom quote.",
      });
      setCurrentStep("results");
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  // Handle contact form submission to proceed to services or submit quote
  const handleContactSubmit = () => {
    // Check required fields based on settings
    const errors = [];
    if (styling.requireName && !leadForm.name.trim()) errors.push("Name");
    if (styling.requireEmail && !leadForm.email.trim()) errors.push("Email");
    if (styling.requirePhone && !leadForm.phone.trim()) errors.push("Phone");
    if (styling.enableAddress && styling.requireAddress && !leadForm.address?.trim()) errors.push("Address");

    if (errors.length > 0) {
      toast({
        title: "Please fill in required information",
        description: `${errors.join(", ")} ${errors.length === 1 ? 'is' : 'are'} required to proceed.`,
        variant: "destructive",
      });
      return;
    }

    setContactSubmitted(true);
    setShowPricing(true); // Allow pricing to be shown after contact submission
    
    // If services are already selected, show pricing and go back to configure page
    if (selectedServices.length > 0) {
      setCurrentStep("configure");
      toast({
        title: `Thank you ${leadForm.name || 'for your information'}!`,
        description: "Here's your personalized pricing for the selected services.",
      });
    } else {
      // If no services selected yet, go to services
      setCurrentStep("services");
    }
  };

  // Handle service selection
  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Handle variable changes and calculations
  const handleVariableChange = (serviceId: number, variableId: string, value: any) => {
    console.log('🔍 handleVariableChange called:', { serviceId, variableId, value });
    
    setServiceVariables(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [variableId]: value
      }
    }));

    // Recalculate price for this service
    const formula = availableFormulas.find(f => f.id === serviceId);
    console.log('📋 Found formula:', { formulaId: serviceId, formulaName: formula?.name, hasFormula: !!formula?.formula });
    
    if (formula?.formula) {
      try {
        const variables = { ...serviceVariables[serviceId], [variableId]: value };
        let formulaExpression = formula.formula;
        
        console.log('🧮 Starting calculation:', { 
          originalFormula: formula.formula, 
          variables,
          formulaVariables: formula.variables?.map((v: any) => ({ id: v.id, type: v.type, name: v.name }))
        });
        
        // First, replace individual option references for multiple-choice with allowMultipleSelection
        formula.variables.forEach((variable: any) => {
          if (variable?.type === 'multiple-choice' && variable.allowMultipleSelection && variable.options) {
            const selectedValues = Array.isArray(variables[variable.id]) ? variables[variable.id] : [];
            
            variable.options.forEach((option: any) => {
              if (option.id) {
                const optionReference = `${variable.id}_${option.id}`;
                const isSelected = selectedValues.some((val: any) => val.toString() === option.value.toString());
                const optionValue = isSelected ? (option.numericValue || 0) : 0;
                
                formulaExpression = formulaExpression.replace(
                  new RegExp(`\\b${optionReference}\\b`, 'g'),
                  String(optionValue)
                );
                console.log(`🔄 Replaced ${optionReference} with ${optionValue} (selected: ${isSelected})`);
              }
            });
          }
        });
        
        // Then ensure all formula variables have default values
        formula.variables.forEach((variable: any) => {
          // Skip multiple-choice with allowMultipleSelection since we already handled individual options
          if (variable?.type === 'multiple-choice' && variable.allowMultipleSelection) {
            return; // Skip this variable, options already replaced
          }
          
          const regex = new RegExp(`\\b${variable.id}\\b`, 'g');
          const val = variables[variable.id];
          let numericValue = 0;
          
          if (variable?.type === 'multiple-choice' && variable.options) {
            // For multiple choice, sum up values from selected options (fallback or when allowMultipleSelection is false)
            if (Array.isArray(val)) {
              numericValue = val.reduce((sum: number, selectedValue: string) => {
                const selectedOption = variable.options.find((opt: any) => opt.value === selectedValue);
                return sum + (selectedOption?.numericValue || 0);
              }, 0);
            } else if (val !== undefined && val !== null && val !== '') {
              const selectedOption = variable.options.find((opt: any) => opt.value === val);
              numericValue = selectedOption?.numericValue || 0;
            }
          } else if (variable?.type === 'dropdown' && variable.options) {
            // For dropdown, use numericValue from the selected option
            if (val !== undefined && val !== null && val !== '') {
              const selectedOption = variable.options.find((opt: any) => opt.value === val);
              numericValue = selectedOption?.numericValue || Number(val) || 0;
            }
          } else if (variable?.type === 'select' && variable.options) {
            // For select, use multiplier or numeric value
            if (val !== undefined && val !== null && val !== '') {
              const selectedOption = variable.options.find((opt: any) => opt.value === val);
              numericValue = selectedOption?.multiplier || selectedOption?.numericValue || Number(val) || 0;
            }
          } else if (variable?.type === 'checkbox') {
            // For checkbox, use 1 if true, 0 if false
            numericValue = val ? 1 : 0;
          } else {
            // For number and text inputs
            numericValue = Number(val) || 0;
          }
          
          formulaExpression = formulaExpression.replace(regex, String(numericValue));
          console.log(`🔄 Replaced ${variable.id} (${variable.type}) with ${numericValue}`);
        });
        
        console.log('🏁 Final formula expression:', formulaExpression);
        const result = Function(`"use strict"; return (${formulaExpression})`)();
        let price = Math.round(Number(result) || 0);
        
        // Apply min/max price constraints if they exist
        if (formula.minPrice !== null && formula.minPrice !== undefined && price < formula.minPrice) {
          console.log(`📊 Applied minimum price constraint: ${price} -> ${formula.minPrice}`);
          price = formula.minPrice;
        }
        if (formula.maxPrice !== null && formula.maxPrice !== undefined && price > formula.maxPrice) {
          console.log(`📊 Applied maximum price constraint: ${price} -> ${formula.maxPrice}`);
          price = formula.maxPrice;
        }
        
        console.log('💰 Calculated price:', { result, price });
        
        setServiceCalculations(prev => ({
          ...prev,
          [serviceId]: price
        }));
      } catch (error) {
        console.error('❌ Formula calculation error:', error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error details:', { 
          serviceId, 
          formula: formula?.formula,
          finalExpression: formulaExpression,
          variables: serviceVariables[serviceId],
          availableVariables: formula.variables?.map((v: any) => v.id)
        });
        // Set price to 0 on error
        setServiceCalculations(prev => ({
          ...prev,
          [serviceId]: 0
        }));
      }
    } else {
      console.log('⚠️ No formula found for service or formula is empty');
    }
  };

  // Calculate totals
  const subtotal = selectedServices.reduce((sum, serviceId) => sum + (serviceCalculations[serviceId] || 0), 0);
  const bundleDiscount = styling.showBundleDiscount && selectedServices.length > 1 
    ? Math.round(subtotal * (styling.bundleDiscountPercent / 100))
    : 0;
  const discountedSubtotal = subtotal - bundleDiscount;
  const taxAmount = styling.enableSalesTax 
    ? Math.round(discountedSubtotal * (styling.salesTaxRate / 100))
    : 0;
  const totalAmount = discountedSubtotal + taxAmount;

  // Handle form submission
  const handleSubmitQuoteRequest = () => {
    // Check required fields based on settings - only validate if contact collection is enabled
    const hasRequiredContactFields = styling.requireName || styling.requireEmail || styling.requirePhone || 
                                   (styling.enableAddress && styling.requireAddress);
    
    if (hasRequiredContactFields) {
      const errors = [];
      if (styling.requireName && !leadForm.name.trim()) errors.push("Name");
      if (styling.requireEmail && !leadForm.email.trim()) errors.push("Email");
      if (styling.requirePhone && !leadForm.phone.trim()) errors.push("Phone");
      if (styling.enableAddress && styling.requireAddress && !leadForm.address?.trim()) errors.push("Address");
      if (styling.requireImageUpload && uploadedImages.length === 0) errors.push("Images");

      if (errors.length > 0) {
        toast({
          title: "Missing Information",
          description: `Please provide your ${errors.join(", ").toLowerCase()}.`,
          variant: "destructive",
        });
        return;
      }
    }

    const leadData = {
      name: leadForm.name,
      email: leadForm.email,
      phone: leadForm.phone || null,
      address: leadForm.address || null,
      notes: leadForm.notes || null,
      howDidYouHear: leadForm.howDidYouHear || null,
      uploadedImages: uploadedImages,
      photoMeasurements: photoMeasurements,
      services: selectedServices.map(serviceId => {
        const formula = availableFormulas.find(f => f.id === serviceId);
        return {
          formulaId: serviceId,
          formulaName: formula?.name || "Unknown Service",
          variables: serviceVariables[serviceId] || {},
          calculatedPrice: serviceCalculations[serviceId] || 0
        };
      }),
      totalPrice: totalAmount
    };

    submitMultiServiceLeadMutation.mutate(leadData);
  };

  // Handle flow progression - always start with services
  useEffect(() => {
    if (!businessSettings?.styling) return;
    
    // Always start with services selection
    if (currentStep !== "contact" && currentStep !== "configure" && currentStep !== "results") {
      setCurrentStep("services");
      setShowPricing(false);
    }
  }, [businessSettings]);

  // Check if all required variables for selected services are filled
  const areAllServiceVariablesComplete = () => {
    if (selectedServices.length === 0) return false;
    
    return selectedServices.every(serviceId => {
      const formula = availableFormulas.find(f => f.id === serviceId);
      if (!formula || !formula.variables) return true;
      
      const serviceVars = serviceVariables[serviceId] || {};
      
      return formula.variables.every((variable: any) => {
        // Check if this variable has a value
        const value = serviceVars[variable.id];
        
        // For different variable types, check if they have meaningful values
        if (variable.type === 'multiple-choice') {
          return Array.isArray(value) ? value.length > 0 : (value !== undefined && value !== null && value !== '');
        } else if (variable.type === 'checkbox') {
          return value !== undefined; // checkboxes can be false
        } else {
          return value !== undefined && value !== null && value !== '';
        }
      });
    });
  };

  // Update pricing visibility based on settings and contact submission
  useEffect(() => {
    if (!businessSettings?.styling) return;
    
    const requireContactFirst = businessSettings.styling.requireContactFirst;
    
    // Check if any contact fields are required
    const hasRequiredContactFields = styling.requireName || styling.requireEmail || styling.requirePhone || 
                                   (styling.enableAddress && styling.requireAddress) ||
                                   styling.requireHowDidYouHear;
    
    // Check if all service variables are complete
    const allVariablesComplete = areAllServiceVariablesComplete();
    
    // Show pricing if:
    // 1. Contact has been submitted, OR
    // 2. No contact fields are required AND all service variables are complete
    const shouldShowPricing = contactSubmitted || 
                             (!hasRequiredContactFields && allVariablesComplete);
    
    setShowPricing(shouldShowPricing);
  }, [businessSettings?.styling?.requireContactFirst, contactSubmitted, styling.requireName, styling.requireEmail, styling.requirePhone, styling.enableAddress, styling.requireAddress, styling.requireHowDidYouHear, selectedServices, serviceVariables, availableFormulas]);

  // Memoize grid and card classes for service selector
  const gridAndCardClasses = useMemo(() => {
    const cardsPerRow = styling.serviceSelectorCardsPerRow || 'auto';
    const cardSize = styling.serviceSelectorCardSize || 'lg';
    
    // Grid classes calculation
    let gridClasses = '';
    if (cardsPerRow !== 'auto') {
      // Fixed number of cards per row
      const gridColsMap = {
        '1': 'grid-cols-1',
        '2': 'grid-cols-2',
        '3': 'grid-cols-3',
        '4': 'grid-cols-4'
      };
      gridClasses = gridColsMap[cardsPerRow] || 'grid-cols-3';
    } else {
      // Auto-responsive based on card size
      switch (cardSize) {
        case 'sm':
          gridClasses = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
          break;
        case 'md':
          gridClasses = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
          break;
        case 'lg':
          gridClasses = 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
          break;
        case 'xl':
          gridClasses = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3';
          break;
        case '2xl':
          gridClasses = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2';
          break;
        default:
          gridClasses = 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      }
    }

    // Card size classes calculation
    let cardSizeClasses = '';
    switch (cardSize) {
      case 'sm':
        cardSizeClasses = 'min-h-[120px]';
        break;
      case 'md':
        cardSizeClasses = 'min-h-[140px]';
        break;
      case 'lg':
        cardSizeClasses = 'min-h-[160px]';
        break;
      case 'xl':
        cardSizeClasses = 'min-h-[180px]';
        break;
      case '2xl':
        cardSizeClasses = 'min-h-[200px]';
        break;
      default:
        cardSizeClasses = 'min-h-[160px]';
    }

    return { gridClasses, cardSizeClasses };
  }, [styling.serviceSelectorCardsPerRow, styling.serviceSelectorCardSize]);

  // Get service icon
  const getServiceIcon = (formula: Formula) => {
    // Use custom icon if provided
    if (formula.iconUrl) {
      // Check if it's an emoji (single character or unicode emoji)
      if (formula.iconUrl.length <= 4) {
        return formula.iconUrl;
      }
      // It's a URL, return as image
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="w-16 h-16 object-contain"
          onError={(e) => {
            // Fallback to default icon on error
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    
    // Default icon logic
    const name = formula.name.toLowerCase();
    if (name.includes('kitchen') || name.includes('remodel')) return '🏠';
    if (name.includes('wash') || name.includes('clean')) return '🧽';
    if (name.includes('paint')) return '🎨';
    if (name.includes('landscape') || name.includes('garden')) return '🌿';
    if (name.includes('roof')) return '🏘️';
    if (name.includes('plumb')) return '🔧';
    if (name.includes('electric')) return '⚡';
    if (name.includes('hvac') || name.includes('air')) return '❄️';
    return '⚙️';
  };

  // Helper function to handle width/height values  
  const getContainerDimension = (value: any, defaultValue: string | number) => {
    if (typeof value === 'string') {
      if (value === 'full' || value === 'auto') return value === 'full' ? '100%' : 'none';
      if (value.endsWith('%')) return value;
      return `${value}px`;
    }
    if (typeof value === 'number') return `${value}px`;
    return typeof defaultValue === 'string' ? defaultValue : `${defaultValue}px`;
  };

  // Text spacing helper functions
  const getTitleFontSizeClass = () => {
    const fontSizeClasses = {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'base': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl',
      '2xl': 'text-2xl'
    };
    return fontSizeClasses[styling.serviceSelectorTitleFontSize as keyof typeof fontSizeClasses] || 'text-sm';
  };

  const getTitleLineHeightClass = () => {
    const lineHeightClasses = {
      'tight': 'leading-tight',
      'snug': 'leading-snug',
      'normal': 'leading-normal',
      'relaxed': 'leading-relaxed',
      'loose': 'leading-loose'
    };
    return lineHeightClasses[styling.serviceSelectorTitleLineHeight as keyof typeof lineHeightClasses] || 'leading-tight';
  };

  const getTitleLetterSpacingClass = () => {
    const letterSpacingClasses = {
      'tighter': 'tracking-tighter',
      'tight': 'tracking-tight',
      'normal': 'tracking-normal',
      'wide': 'tracking-wide',
      'wider': 'tracking-wider',
      'widest': 'tracking-widest'
    };
    return letterSpacingClasses[styling.serviceSelectorTitleLetterSpacing as keyof typeof letterSpacingClasses] || 'tracking-normal';
  };

  // Styling variables
  const containerStyles = {
    backgroundColor: styling.backgroundColor || '#ffffff',
    color: styling.textColor || '#000000',
    borderRadius: `${styling.containerBorderRadius || 8}px`,
    borderWidth: `${styling.containerBorderWidth || 1}px`,
    borderColor: styling.containerBorderColor || '#e5e7eb',
    width: getContainerDimension(styling.containerWidth, 600),
    maxWidth: '100%',
    maxHeight: (styling.containerHeight as any) === 'auto' ? 'none' : getContainerDimension(styling.containerHeight, 800),
    fontFamily: styling.fontFamily || 'Inter',
    fontSize: styling.fontSize === 'sm' ? '14px' : styling.fontSize === 'lg' ? '18px' : '16px',
    fontWeight: styling.fontWeight || 'normal',
  };

  const shadowClasses = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  };

  const getBoxShadowValue = (shadowSize: string) => {
    switch (shadowSize) {
      case 'sm': return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      case 'md': return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      case 'lg': return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      case 'xl': return '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      default: return 'none';
    }
  };

  const buttonStyles = {
    backgroundColor: styling.primaryColor || '#3b82f6',
    borderRadius: styling.buttonStyle === 'pill' ? '9999px' : 
                  styling.buttonStyle === 'square' ? '0px' : 
                  `${styling.buttonBorderRadius || 8}px`,
    boxShadow: getBoxShadowValue(styling.buttonShadow || 'sm'),
  };

  const inputStyles = {
    backgroundColor: styling.inputBackgroundColor || '#ffffff',
    borderColor: styling.inputBorderColor || '#d1d5db',
    borderWidth: `${styling.inputBorderWidth || 1}px`,
    borderRadius: `${styling.inputBorderRadius || 8}px`,
    boxShadow: getBoxShadowValue(styling.inputShadow || 'none'),
    color: styling.inputTextColor || styling.textColor,
  };

  if (embedDataLoading || !businessSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Calculator className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex justify-center">
          <div 
            className={`border overflow-auto ${shadowClasses[styling.containerShadow || 'md']}`}
            style={containerStyles}
          >
            <div className="p-4 md:p-8">
              {/* Header */}
              {(styling.showFormTitle || styling.showFormSubtitle) && (
                <div className="text-center mb-6 md:mb-8">
                  {styling.showFormTitle && (
                    <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: styling.textColor }}>
                      {businessSettings.businessName}
                    </h1>
                  )}
                  {styling.showFormSubtitle && (
                    <p className="text-base md:text-lg opacity-80">Get Your Custom Quote</p>
                  )}
                </div>
              )}



              {/* Progress Guide - Only show if enabled */}
              {styling.showProgressGuide && (
                <div className="flex items-center justify-center mb-6 md:mb-8 space-x-2 md:space-x-4 overflow-x-auto pb-2">
                  {/* Step 1: Services */}
                  <div className={`flex items-center space-x-1 md:space-x-2 ${currentStep === 'services' ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                    <div 
                      className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep === 'services' ? 'text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                      style={{ backgroundColor: currentStep === 'services' ? styling.primaryColor : undefined }}
                    >
                      1
                    </div>
                    <span className="text-xs whitespace-nowrap">Services</span>
                  </div>
                  
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 opacity-50 flex-shrink-0" />
                  
                  {/* Step 2: Configure */}
                  <div className={`flex items-center space-x-1 md:space-x-2 ${currentStep === 'configure' ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                    <div 
                      className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep === 'configure' ? 'text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                      style={{ backgroundColor: currentStep === 'configure' ? styling.primaryColor : undefined }}
                    >
                      2
                    </div>
                    <span className="text-xs whitespace-nowrap">Configure</span>
                  </div>
                  
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 opacity-50 flex-shrink-0" />
                  
                  {/* Step 3: Contact */}
                  <div className={`flex items-center space-x-1 md:space-x-2 ${currentStep === 'contact' ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                    <div 
                      className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep === 'contact' ? 'text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                      style={{ backgroundColor: currentStep === 'contact' ? styling.primaryColor : undefined }}
                    >
                      3
                    </div>
                    <span className="text-xs whitespace-nowrap">Contact</span>
                  </div>
                  
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 opacity-50 flex-shrink-0" />
                  
                  {/* Step 4: Results */}
                  <div className={`flex items-center space-x-1 md:space-x-2 ${currentStep === 'results' ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                    <div 
                      className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep === 'results' ? 'text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                      style={{ backgroundColor: currentStep === 'results' ? styling.primaryColor : undefined }}
                    >
                      4
                    </div>
                    <span className="text-xs whitespace-nowrap">Results</span>
                  </div>
                </div>
              )}



              {/* Services Step */}
              {currentStep === "services" && (
                <div className="space-y-6">
                  {(styling.showSectionTitles || styling.showStepDescriptions) && (
                    <div className="text-center mb-4 md:mb-6">
                      {styling.showSectionTitles && (
                        <h2 className="text-lg md:text-xl font-semibold mb-2">Select Your Services</h2>
                      )}
                      {styling.showStepDescriptions && (
                        <p className="text-sm opacity-70">Choose the services you're interested in</p>
                      )}
                    </div>
                  )}

                  <div 
                    className={`grid ${gridAndCardClasses.gridClasses}`}
                    style={{ 
                      maxWidth: `${styling.serviceSelectorWidth || 900}px`,
                      margin: '0 auto',
                      gap: styling.serviceSelectorGap === 'sm' ? '0.5rem' :
                           styling.serviceSelectorGap === 'lg' ? '1.5rem' :
                           styling.serviceSelectorGap === 'xl' ? '2rem' : '1rem'
                    }}
                  >
                    {availableFormulas.map((formula) => (
                      <Card 
                        key={formula.id}
                        className={`cursor-pointer transition-all duration-200 hover:scale-105 ${gridAndCardClasses.cardSizeClasses} ${
                          styling.serviceSelectorShadow === 'none' ? '' :
                          styling.serviceSelectorShadow === 'sm' ? 'shadow-sm' :
                          styling.serviceSelectorShadow === 'md' ? 'shadow-md' :
                          styling.serviceSelectorShadow === 'lg' ? 'shadow-lg' :
                          styling.serviceSelectorShadow === 'xl' ? 'shadow-xl' : 'shadow-lg'
                        }`}
                        style={{
                          borderRadius: `${styling.serviceSelectorBorderRadius || 16}px`,
                          borderWidth: `${styling.serviceSelectorBorderWidth || 0}px`,
                          borderColor: selectedServices.includes(formula.id) 
                            ? styling.serviceSelectorSelectedBorderColor || styling.primaryColor
                            : styling.serviceSelectorBorderColor,
                          backgroundColor: selectedServices.includes(formula.id)
                            ? styling.serviceSelectorSelectedBgColor || '#EFF6FF'
                            : styling.serviceSelectorBackgroundColor || '#FFFFFF'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedServices.includes(formula.id)) {
                            e.currentTarget.style.backgroundColor = styling.serviceSelectorHoverBgColor || '#F8FAFC';
                            e.currentTarget.style.borderColor = styling.serviceSelectorHoverBorderColor || '#C7D2FE';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedServices.includes(formula.id)) {
                            e.currentTarget.style.backgroundColor = styling.serviceSelectorBackgroundColor || '#FFFFFF';
                            e.currentTarget.style.borderColor = styling.serviceSelectorBorderColor || '#E5E7EB';
                          }
                        }}
                        onClick={() => handleServiceToggle(formula.id)}
                      >
                        <CardContent 
                          className={
                            styling.serviceSelectorPadding === 'sm' ? 'p-3' :
                            styling.serviceSelectorPadding === 'md' ? 'p-4' :
                            styling.serviceSelectorPadding === 'lg' ? 'p-6' :
                            styling.serviceSelectorPadding === 'xl' ? 'p-8' : 'p-6'
                          }
                        >
                          {/* Service Image */}
                          {formula.showImage && formula.imageUrl && (
                            <div className="mb-4">
                              <img 
                                src={formula.imageUrl} 
                                alt={formula.name}
                                className="w-full h-32 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Mobile Layout: Improved spacing with text above icon */}
                          <div className="block md:hidden relative h-full">

                            
                            {/* Content with proper spacing */}
                            <div className={`flex flex-col items-center text-center h-full pt-8 pb-2 px-2 ${
                              styling.serviceSelectorContentAlignment === 'top' ? 'justify-start' :
                              styling.serviceSelectorContentAlignment === 'bottom' ? 'justify-end' :
                              'justify-center'
                            }`}>
                              {/* Service Name Above Icon */}
                              <h3 
                                className={`font-black mb-3 ${getTitleFontSizeClass()} ${getTitleLineHeightClass()} ${getTitleLetterSpacingClass()}`}
                                style={{ color: styling.textColor }}
                              >
                                {formula.name}
                              </h3>
                              
                              {/* Icon */}
                              <div 
                                className="w-full aspect-square max-w-[70%] text-6xl flex items-center justify-center"
                                style={{ 
                                  color: selectedServices.includes(formula.id) 
                                    ? styling.primaryColor 
                                    : styling.primaryColor || '#3b82f6'
                                }}
                              >
                                {getServiceIcon(formula)}
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout: Improved spacing with text above icon */}
                          <div className="hidden md:block relative h-full">

                            
                            {/* Content with proper spacing */}
                            <div className={`flex flex-col items-center text-center h-full pt-10 pb-4 px-4 ${
                              styling.serviceSelectorContentAlignment === 'top' ? 'justify-start' :
                              styling.serviceSelectorContentAlignment === 'bottom' ? 'justify-end' :
                              'justify-center'
                            }`}>
                              {/* Service Name Above Icon */}
                              <h3 className="font-black text-base lg:text-lg leading-[0.8] mb-4">
                                {formula.name}
                              </h3>
                              
                              {/* Icon */}
                              <div 
                                className="w-full aspect-square max-w-[70%] text-5xl lg:text-6xl flex items-center justify-center"
                                style={{ 
                                  color: selectedServices.includes(formula.id) 
                                    ? styling.primaryColor 
                                    : styling.primaryColor || '#3b82f6'
                                }}
                              >
                                {getServiceIcon(formula)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedServices.length > 0 && (
                    <div className="text-center pt-6 border-t border-opacity-20">
                      <div className="mb-4">
                        <Badge variant="secondary" className="px-4 py-2">
                          {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                        </Badge>
                      </div>
                      <Button
                        onClick={() => {
                          setCurrentStep("configure");
                          setShowPricing(true);
                        }}
                        style={buttonStyles}
                        size="lg"
                        className="text-white px-8"
                      >
                        Configure Services
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Step */}
              {currentStep === "contact" && (
                <div className="space-y-6">
                  {(styling.showSectionTitles || styling.showStepDescriptions) && (
                    <div className="text-center mb-6">
                      {styling.showSectionTitles && (
                        <h2 className="text-xl font-semibold mb-2">Your Contact Information</h2>
                      )}
                      {styling.showStepDescriptions && (
                        <p className="text-sm opacity-70">
                          {styling.requireContactFirst 
                            ? "We'll need your details to provide accurate pricing"
                            : "Almost done! Just need your contact details for the quote"
                          }
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Name Field - Show only if not explicitly disabled */}
                    {styling.requireName !== false && (
                      <div>
                        <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          {styling.nameLabel || 'Full Name'} {styling.requireName && '*'}
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.nameLabel || 'Full Name').toLowerCase()}`}
                          required={styling.requireName}
                        />
                      </div>
                    )}
                    
                    {/* Email Field - Show only if not explicitly disabled */}
                    {styling.requireEmail !== false && (
                      <div>
                        <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4" />
                          {styling.emailLabel || 'Email Address'} {styling.requireEmail && '*'}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.emailLabel || 'Email Address').toLowerCase()}`}
                          required={styling.requireEmail}
                        />
                      </div>
                    )}
                    
                    {/* Phone Field - Show only if enabled or required */}
                    {(styling.enablePhone !== false || styling.requirePhone) && (
                      <div>
                        <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4" />
                          {styling.phoneLabel || 'Phone Number'} {styling.requirePhone && '*'}
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.phoneLabel || 'Phone Number').toLowerCase()}`}
                          required={styling.requirePhone}
                        />
                      </div>
                    )}

                    {/* Address Field */}
                    {styling.enableAddress && (
                      <div>
                        <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          {styling.addressLabel || 'Address'} {styling.requireAddress && '*'}
                        </Label>
                        <GoogleMapsLoader>
                          <GooglePlacesAutocomplete
                            value={leadForm.address || ''}
                            onChange={(newAddress) => setLeadForm({...leadForm, address: newAddress})}
                            placeholder={`Enter your ${(styling.addressLabel || 'Address').toLowerCase()}`}
                            types={['address']}
                            componentRestrictions={{ country: 'us' }}
                            styling={styling}
                            componentStyles={styling.componentStyles}
                          />
                        </GoogleMapsLoader>
                      </div>
                    )}

                    {/* Notes Field */}
                    {styling.enableNotes && (
                      <div>
                        <Label htmlFor="notes" className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4" />
                          {styling.notesLabel || 'Additional Notes'}
                        </Label>
                        <textarea
                          id="notes"
                          value={leadForm.notes || ''}
                          onChange={(e) => setLeadForm({...leadForm, notes: e.target.value})}
                          style={{
                            ...inputStyles,
                            minHeight: '80px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                          placeholder={`${styling.notesLabel || 'Additional Notes'} (optional)`}
                          className="w-full px-3 py-2 rounded-md border"
                        />
                      </div>
                    )}

                    {/* How Did You Hear Field */}
                    {styling.enableHowDidYouHear && (
                      <div>
                        <Label htmlFor="howDidYouHear" className="flex items-center gap-2 mb-2">
                          <HeadphonesIcon className="w-4 h-4" />
                          {styling.howDidYouHearLabel || 'How did you hear about us?'} {styling.requireHowDidYouHear && '*'}
                        </Label>
                        <select
                          id="howDidYouHear"
                          value={leadForm.howDidYouHear || ''}
                          onChange={(e) => setLeadForm({...leadForm, howDidYouHear: e.target.value})}
                          style={inputStyles}
                          required={styling.requireHowDidYouHear}
                          className="w-full px-3 py-2 rounded-md border"
                        >
                          <option value="">Select an option...</option>
                          {(styling.howDidYouHearOptions || ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other']).map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Image Upload Field */}
                    {styling.enableImageUpload && (
                      <div>
                        <ImageUpload
                          maxImages={styling.maxImages || 5}
                          maxFileSize={styling.maxImageSize || 10}
                          label={styling.imageUploadLabel || 'Upload Images'}
                          description={styling.imageUploadDescription || 'Please upload relevant images to help us provide an accurate quote'}
                          helperText={styling.imageUploadHelperText || 'Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.'}
                          required={styling.requireImageUpload || false}
                          onUploadComplete={(urls) => setUploadedImages(urls)}
                        />
                      </div>
                    )}

                    <div className="pt-4">
                      <Button
                        onClick={() => {
                          // Validate required fields based on business settings and field visibility
                          const nameValid = !styling.requireName || (leadForm.name && leadForm.name.trim());
                          const emailValid = !styling.requireEmail || (leadForm.email && leadForm.email.trim());
                          
                          // Only validate phone if it's visible and required
                          const phoneVisible = styling.enablePhone !== false;
                          const phoneValid = !phoneVisible || !styling.requirePhone || (leadForm.phone && leadForm.phone.trim());
                          
                          const addressValid = !styling.enableAddress || !styling.requireAddress || Boolean(leadForm.address && leadForm.address.trim());
                          const howDidYouHearValid = !styling.requireHowDidYouHear || (leadForm.howDidYouHear && leadForm.howDidYouHear.trim());
                          const imagesValid = !styling.requireImageUpload || uploadedImages.length > 0;
                          

                          if (nameValid && emailValid && phoneValid && addressValid && howDidYouHearValid && imagesValid) {
                            handleContactSubmit();
                          } else {
                            toast({
                              title: "Missing Required Information",
                              description: "Please fill in all required fields marked with *",
                              variant: "destructive",
                            });
                          }
                        }}
                        style={buttonStyles}
                        size="lg"
                        className="w-full text-white"
                        disabled={submitMultiServiceLeadMutation.isPending}
                      >
                        {submitMultiServiceLeadMutation.isPending ? "Submitting..." : 
                          (styling.requireContactFirst && selectedServices.length === 0) ? "Continue" : "Submit Quote Request"}
                      </Button>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        if (styling.requireContactFirst && selectedServices.length === 0) {
                          // If this is initial contact capture and no services selected, don't show back button
                          return;
                        } else {
                          setCurrentStep("configure");
                        }
                      }}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                      style={{ 
                        display: (styling.requireContactFirst && selectedServices.length === 0) ? 'none' : 'block' 
                      }}
                    >
                      ← Back to configuration
                    </button>
                  </div>
                </div>
              )}

              {/* Service Configuration with Pricing */}
              {currentStep === "configure" && (
                <div className="space-y-6 mt-8 pt-8 border-t border-opacity-20">
                  {(styling.showSectionTitles || styling.showStepDescriptions) && (
                    <div className="text-center mb-6">
                      {styling.showSectionTitles && (
                        <h2 className="text-xl font-semibold mb-2">Configure Your Services</h2>
                      )}
                      {styling.showStepDescriptions && (
                        <p className="text-sm opacity-70">Customize each service to get accurate pricing</p>
                      )}
                    </div>
                  )}

                  {/* Show Service Cards with descriptions and benefits - only if pricing should be shown and has meaningful prices */}
                  {showPricing && selectedServices.length > 0 && subtotal > 0 && (!styling.requireContactFirst || contactSubmitted) && (
                    <ServiceCardDisplay
                      selectedServices={selectedServices.map(serviceId => {
                        const formula = availableFormulas.find(f => f.id === serviceId);
                        return {
                          formula: formula!,
                          calculatedPrice: serviceCalculations[serviceId] || 0,
                          variables: serviceVariables[serviceId] || {}
                        };
                      }).filter(service => service.formula)}
                      styling={styling}
                      showPricing={showPricing && (!styling.requireContactFirst || contactSubmitted)}
                    />
                  )}

                  {/* Connected Variables Section */}
                  {getConnectedVariables().length > 0 && (
                    <Card className="p-6 bg-blue-50 border-blue-200">
                      {(styling.showSectionTitles || styling.showStepDescriptions) && (
                        <div className="mb-4">
                          {styling.showSectionTitles && (
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                                ⚡
                              </div>
                              Shared Information
                            </h3>
                          )}
                          {styling.showStepDescriptions && (
                            <p className="text-sm text-gray-600 mt-1">
                              These details apply to multiple services you've selected
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getConnectedVariables().map((connectedVar) => (
                          <div key={connectedVar.connectionKey}>
                            <div className="mb-2">
                              <label className="text-sm font-medium">
                                {connectedVar.name}
                                <span className="text-xs text-gray-500 ml-2">
                                  (used in {connectedVar.formulaIds.length} services)
                                </span>
                              </label>
                            </div>
                            <EnhancedVariableInput
                              variable={connectedVar.variable}
                              value={sharedVariables[connectedVar.connectionKey] || connectedVar.variable.defaultValue || ''}
                              onChange={(value) => handleConnectedVariableChange(connectedVar.connectionKey, value)}
                              styling={styling}
                              allVariables={getConnectedVariables().map(cv => cv.variable)}
                              currentValues={{
                                ...sharedVariables,
                                ...Object.fromEntries(
                                  Object.entries(selectedServices).flatMap(([index, serviceId]) => 
                                    Object.entries(serviceVariables[serviceId] || {})
                                  )
                                )
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Service-Specific Configuration Variables */}
                  {selectedServices.map((serviceId) => {
                    const formula = availableFormulas.find(f => f.id === serviceId);
                    if (!formula) return null;
                    
                    const serviceSpecificVars = getServiceSpecificVariables(serviceId);
                    if (serviceSpecificVars.length === 0) return null;

                    return (
                      <Card key={serviceId} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                              style={{ 
                                backgroundColor: `${styling.primaryColor || '#3b82f6'}20`,
                                color: styling.primaryColor || '#3b82f6'
                              }}
                            >
                              {getServiceIcon(formula)}
                            </div>
                            <h3 className="font-semibold text-lg">{formula.name}</h3>
                          </div>
                          {serviceCalculations[serviceId] && (!styling.requireContactFirst || contactSubmitted) && (
                            <div className="text-right">
                              <div className="text-xl font-bold" style={{ color: styling.textColor }}>
                                ${serviceCalculations[serviceId].toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Show guide video if available and pricing not shown OR contact required but not submitted */}
                        {(!serviceCalculations[serviceId] || (styling.requireContactFirst && !contactSubmitted)) && formula.guideVideoUrl && (
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
                                Watch this helpful guide before configuring your {formula.name.toLowerCase()} service.
                              </p>
                              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                <iframe
                                  src={formula.guideVideoUrl}
                                  className="w-full h-full"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={`${formula.name} Guide Video`}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show Measure Map if enabled for this service */}
                        {formula.enableMeasureMap && (!serviceCalculations[serviceId] || (styling.requireContactFirst && !contactSubmitted)) && (
                          <div className="mb-6">
                            <CollapsibleMeasureMap
                              measurementType={formula.measureMapType || "area"}
                              unit={formula.measureMapUnit || "sqft"}
                              onMeasurementComplete={(measurement) => {
                                // Find the first area/size variable and auto-populate it
                                const areaVariable = serviceSpecificVars.find((v: any) => 
                                  v.name.toLowerCase().includes('size') || 
                                  v.name.toLowerCase().includes('area') || 
                                  v.name.toLowerCase().includes('square') ||
                                  v.name.toLowerCase().includes('sq')
                                );
                                
                                if (areaVariable) {
                                  handleVariableChange(serviceId, areaVariable.id, measurement.value);
                                  toast({
                                    title: "Measurement Applied",
                                    description: `${measurement.value} ${measurement.unit} has been applied to ${areaVariable.name}`,
                                  });
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Show Photo Measurement if enabled for this service */}
                        {formula.enablePhotoMeasurement && formula.photoMeasurementSetup && (!serviceCalculations[serviceId] || (styling.requireContactFirst && !contactSubmitted)) && (
                          <div className="mb-6">
                            <CollapsiblePhotoMeasurement
                              setup={formula.photoMeasurementSetup}
                              formulaName={formula.name}
                              onMeasurementComplete={(measurement) => {
                                // Find the first area/size variable and auto-populate it
                                const areaVariable = serviceSpecificVars.find((v: any) => 
                                  v.name.toLowerCase().includes('size') || 
                                  v.name.toLowerCase().includes('area') || 
                                  v.name.toLowerCase().includes('square') ||
                                  v.name.toLowerCase().includes('sq')
                                );
                                
                                if (areaVariable) {
                                  handleVariableChange(serviceId, areaVariable.id, measurement.value);
                                  toast({
                                    title: "Measurement Applied",
                                    description: `${measurement.value} ${measurement.unit} has been applied to ${areaVariable.name}`,
                                  });
                                }

                                // Save full photo measurement data
                                if (measurement.fullData) {
                                  setPhotoMeasurements(prev => [...prev, measurement.fullData!]);
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Only show variable inputs if pricing is not yet displayed OR contact is required but not submitted */}
                        {(!serviceCalculations[serviceId] || (styling.requireContactFirst && !contactSubmitted)) ? (
                          // Use step-by-step form if behavior settings are enabled
                          (styling.showOneQuestionAtTime || styling.showOneSectionAtTime) ? (
                            <StepByStepForm
                              variables={serviceSpecificVars}
                              values={serviceVariables[serviceId] || {}}
                              onChange={(variableId, value) => handleVariableChange(serviceId, variableId, value)}
                              styling={styling}
                              onComplete={() => {
                                // Trigger calculation or move to next service
                                console.log(`Completed configuration for service ${serviceId}`);
                              }}
                            />
                          ) : (
                            <div className="space-y-4">
                              {serviceSpecificVars.map((variable: any) => (
                                <EnhancedVariableInput
                                  key={variable.id}
                                  variable={variable}
                                  value={variable.type === 'multiple-choice' 
                                    ? (serviceVariables[serviceId]?.[variable.id] || [])
                                    : (serviceVariables[serviceId]?.[variable.id] || '')}
                                  onChange={(value) => handleVariableChange(serviceId, variable.id, value)}
                                  styling={{
                                    inputBorderRadius: styling.inputBorderRadius || 8,
                                    inputBorderWidth: styling.inputBorderWidth || 1,
                                    inputBorderColor: styling.inputBorderColor || '#d1d5db',
                                    inputBackgroundColor: styling.inputBackgroundColor || '#ffffff',
                                    inputFocusColor: styling.inputFocusColor || '#3b82f6',
                                    inputShadow: styling.inputShadow || 'none',
                                    inputTextColor: styling.inputTextColor,
                                    primaryColor: styling.primaryColor || '#3b82f6',
                                    textColor: styling.textColor,
                                    backgroundColor: styling.backgroundColor,
                                    multiChoiceImageSize: styling.multiChoiceImageSize || 'md',
                                    multiChoiceImageShadow: styling.multiChoiceImageShadow || 'sm',
                                    multiChoiceImageBorderRadius: styling.multiChoiceImageBorderRadius || 8,
                                    multiChoiceCardBorderRadius: styling.multiChoiceCardBorderRadius || 8,
                                    multiChoiceCardShadow: styling.multiChoiceCardShadow || 'none',
                                    multiChoiceSelectedColor: styling.multiChoiceSelectedColor || '#3B82F6',
                                    multiChoiceSelectedBgColor: styling.multiChoiceSelectedBgColor || '#EBF8FF',
                                    multiChoiceHoverBgColor: styling.multiChoiceHoverBgColor || '#F7FAFC',
                                    multiChoiceLayout: styling.multiChoiceLayout || 'grid',
                                  }}
                                  allVariables={formula.variables}
                                  currentValues={{
                                    ...sharedVariables,
                                    ...(serviceVariables[serviceId] || {})
                                  }}
                                />
                              ))}
                            </div>
                          )
                        ) : (
                          serviceCalculations[serviceId] && (!styling.requireContactFirst || contactSubmitted) ? (
                            <div className="text-sm opacity-70 mt-2 p-4 bg-green-50 rounded-lg border border-green-200">
                              ✅ Service configured and priced successfully
                            </div>
                          ) : (
                            styling.requireContactFirst && !contactSubmitted ? (
                              <div className="text-sm opacity-70 mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                💡 Complete your contact information to see pricing for this service
                              </div>
                            ) : null
                          )
                        )}
                      </Card>
                    );
                  })}

                  {/* Message when contact is required but not provided */}
                  {styling.requireContactFirst && !contactSubmitted && selectedServices.length > 0 && (
                    <Card className="p-6 text-center border-2 border-dashed" style={{ borderColor: styling.primaryColor + '40' }}>
                      <div className="space-y-4">
                        <div 
                          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                          style={{ backgroundColor: styling.primaryColor + '20' }}
                        >
                          <User className="w-8 h-8" style={{ color: styling.primaryColor }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: styling.textColor }}>
                            Ready to See Your Pricing?
                          </h3>
                          <p className="text-sm opacity-70 mb-4">
                            Please provide your contact information to view personalized pricing for your selected services.
                          </p>
                          <Button
                            onClick={() => setCurrentStep("contact")}
                            style={buttonStyles}
                            size="lg"
                            className="text-white"
                          >
                            Enter Contact Information
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Individual Service Pricing Cards - Subscription Style */}
                  {totalAmount > 0 && (!styling.requireContactFirst || contactSubmitted) && (
                    <div className="space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8" style={{ color: styling.textColor }}>
                        Your Service Packages
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
                        {selectedServices.map((serviceId) => {
                          const formula = availableFormulas.find(f => f.id === serviceId);
                          const calculatedPrice = serviceCalculations[serviceId] || 0;
                          const serviceVars = serviceVariables[serviceId] || {};
                          
                          if (!formula || calculatedPrice <= 0) return null;

                          // Get service variables for features list
                          const serviceFeatures = Object.entries(serviceVars)
                            .filter(([key, value]) => {
                              if (!value || value === '') return false;
                              const variable = formula.variables.find(v => v.id === key);
                              return variable && variable.type !== 'text'; // Exclude basic text inputs
                            })
                            .map(([key, value]) => {
                              const variable = formula.variables.find(v => v.id === key);
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
                            <Card 
                              key={serviceId}
                              className="relative overflow-hidden transition-all duration-300 hover:scale-105 shadow-xl"
                              style={{
                                borderRadius: '16px',
                                backgroundColor: styling.pricingCardBackgroundColor || '#FFFFFF',
                                borderWidth: '1px',
                                borderColor: styling.pricingCardBorderColor || '#E5E7EB'
                              }}
                            >
                              {/* Header with service name and standard badge */}
                              <CardHeader className="text-center pb-4 relative">
                                <div className="absolute top-4 right-4">
                                  <Badge 
                                    className="text-xs font-medium px-3 py-1"
                                    style={{
                                      backgroundColor: styling.primaryColor,
                                      color: '#FFFFFF',
                                      borderRadius: '20px'
                                    }}
                                  >
                                    Standard
                                  </Badge>
                                </div>
                                
                                <div className="mt-2">
                                  <h4 className="text-lg sm:text-xl font-bold mb-1" style={{ color: styling.textColor }}>
                                    {formula.name}
                                  </h4>
                                  {formula.title && (
                                    <p className="text-sm text-gray-600 mb-3">{formula.title}</p>
                                  )}
                                  {formula.description && (
                                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{formula.description}</p>
                                  )}
                                  
                                  {/* Price Display */}
                                  <div className="mb-4">
                                    <div className="flex items-baseline justify-center gap-1">
                                      <span 
                                        className="text-4xl sm:text-5xl font-bold"
                                        style={{ color: styling.textColor }}
                                      >
                                        ${calculatedPrice.toLocaleString()}
                                      </span>
                                      <span className="text-lg text-gray-500 ml-1">total</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Based on your selections
                                    </p>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="px-6 pb-6">
                                {/* Features List */}
                                <div className="space-y-3 mb-6">
                                  <p className="text-sm font-semibold text-gray-700">
                                    What's included:
                                  </p>
                                  
                                  {serviceFeatures.length > 0 ? (
                                    <ul className="space-y-2">
                                      {serviceFeatures.slice(0, 6).map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3 text-sm">
                                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                          <span className="text-gray-700">
                                            <span className="font-medium">{feature.name}:</span> {feature.value}
                                          </span>
                                        </li>
                                      ))}
                                      
                                      {/* Standard service features */}
                                      <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Professional service</span>
                                      </li>
                                      <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Quality guarantee</span>
                                      </li>
                                      <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Free consultation</span>
                                      </li>
                                    </ul>
                                  ) : (
                                    <ul className="space-y-2">
                                      <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Professional {formula.name.toLowerCase()} service</span>
                                      </li>
                                      <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Quality materials and workmanship</span>
                                      </li>
                                      <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Free consultation</span>
                                      </li>
                                      <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Satisfaction guarantee</span>
                                      </li>
                                    </ul>
                                  )}
                                </div>

                                {/* Service Details Button */}
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  style={{
                                    borderColor: styling.primaryColor,
                                    color: styling.primaryColor,
                                    borderRadius: `${styling.buttonBorderRadius || 8}px`
                                  }}
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pricing Summary - only show if contact not required or contact submitted */}
                  {totalAmount > 0 && (!styling.requireContactFirst || contactSubmitted) && (
                    <Card className="p-6 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                          <Receipt className="w-5 h-5" />
                          <h3 className="text-lg font-semibold">Quote Summary</h3>
                        </div>

                        <div className="flex justify-between text-base">
                          <span>Subtotal ({selectedServices.length} services)</span>
                          <span>${subtotal.toLocaleString()}</span>
                        </div>

                        {bundleDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="flex items-center gap-1">
                              <Percent className="w-4 h-4" />
                              Bundle Discount ({styling.bundleDiscountPercent}% off)
                            </span>
                            <span>-${bundleDiscount.toLocaleString()}</span>
                          </div>
                        )}

                        {taxAmount > 0 && (
                          <>
                            <Separator />
                            <div className="flex justify-between text-sm">
                              <span>Subtotal after discount</span>
                              <span>${discountedSubtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>{styling.salesTaxLabel || 'Sales Tax'} ({styling.salesTaxRate}%)</span>
                              <span>${taxAmount.toLocaleString()}</span>
                            </div>
                          </>
                        )}

                        <Separator />

                        <div className="flex justify-between text-xl font-bold pt-2" style={{ color: styling.textColor }}>
                          <span>Total</span>
                          <span>${totalAmount.toLocaleString()}</span>
                        </div>

                        {bundleDiscount > 0 && (
                          <div 
                            className="text-center p-3 rounded-lg text-sm font-medium mt-4"
                            style={{ 
                              backgroundColor: styling.primaryColor + '10',
                              color: styling.primaryColor 
                            }}
                          >
                            You saved ${bundleDiscount.toLocaleString()} with our bundle discount! 🎉
                          </div>
                        )}

                        <Button
                          onClick={() => {
                            // If contact already submitted, submit quote directly
                            if (contactSubmitted) {
                              handleSubmitQuoteRequest();
                            } else {
                              // Otherwise go to contact step first
                              setCurrentStep("contact");
                            }
                          }}
                          style={buttonStyles}
                          size="lg"
                          className="w-full text-white mt-6"
                        >
                          {contactSubmitted ? "Submit Quote Request" : "Get My Quote"}
                        </Button>

                        <p className="text-xs text-center opacity-60 mt-3">
                          We'll contact you within 24 hours to discuss your project details
                        </p>
                      </div>
                    </Card>
                  )}
                  
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setCurrentStep("services")}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                      ← Back to services
                    </button>
                  </div>
                </div>
              )}

              {/* Results Step */}
              {currentStep === "results" && (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: styling.textColor }}>
                      Quote Request Submitted!
                    </h2>
                    <p className="text-lg opacity-80 mb-6">
                      Thank you, {leadForm.name}! We've received your request.
                    </p>
                  </div>

                  <Card className="p-6 bg-gray-50 text-left max-w-md mx-auto">
                    <h3 className="font-semibold mb-3">What happens next?</h3>
                    <ul className="space-y-2 text-sm opacity-80">
                      <li>• We'll review your service requirements</li>
                      <li>• Our team will prepare a detailed quote</li>
                      <li>• You'll receive a follow-up within 24 hours</li>
                      <li>• We'll schedule a consultation if needed</li>
                    </ul>
                  </Card>

                  {/* Booking Calendar Section */}
                  {styling.enableBooking && !showBooking && !bookedSlotId && (
                    <div className="max-w-2xl mx-auto">
                      <Button
                        onClick={() => setShowBooking(true)}
                        style={buttonStyles}
                        size="lg"
                        className="text-white mb-4"
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        Schedule Appointment Now
                      </Button>
                      <p className="text-sm opacity-70">
                        Want to book your appointment in advance? Schedule a time that works for you.
                      </p>
                    </div>
                  )}

                  {styling.enableBooking && showBooking && !bookedSlotId && (
                    <div className="max-w-2xl mx-auto">
                      <BookingCalendar
                        businessOwnerId={userId}
                        leadId={submittedLeadId || undefined}
                        onBookingConfirmed={(slotId) => {
                          setBookedSlotId(slotId);
                          setShowBooking(false);
                        }}
                      />
                    </div>
                  )}

                  {styling.enableBooking && bookedSlotId && (
                    <Card className="p-6 bg-green-50 border-green-200 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-800">Appointment Scheduled!</h3>
                          <p className="text-sm text-green-600">Your appointment has been booked successfully.</p>
                        </div>
                      </div>
                      <p className="text-sm text-green-700">
                        We'll send you a confirmation email with all the details shortly.
                      </p>
                    </Card>
                  )}

                  <div className="pt-6">
                    <p className="text-sm opacity-70">
                      Questions? Contact us at{" "}
                      <a 
                        href={`mailto:info@example.com`}
                        className="underline"
                        style={{ color: styling.primaryColor }}
                      >
                        info@example.com
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </GoogleMapsLoader>
  );
}