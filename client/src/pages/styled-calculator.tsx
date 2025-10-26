import { useState, useEffect, lazy, Suspense, memo, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

import { apiRequest } from "@/lib/queryClient";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";
import { GoogleMapsLoader } from "@/components/google-maps-loader";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { CollapsiblePhotoMeasurement } from "@/components/collapsible-photo-measurement";
import { ChevronDown, ChevronUp, Map } from "lucide-react";
import type { Formula, DesignSettings, ServiceCalculation, BusinessSettings, Lead } from "@shared/schema";
import { areAllVisibleVariablesCompleted, evaluateConditionalLogic, getDefaultValueForHiddenVariable } from "@shared/conditional-logic";
import { injectCSSVariables } from "@shared/css-variables";

// Lazy load heavy components for better performance
const MeasureMapTerraImproved = lazy(() => import("@/components/measure-map-terra-improved"));
const BookingCalendar = lazy(() => import("@/components/booking-calendar-v2"));

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
  isCallScreenMode?: boolean;
}

// Collapsible Measure Map Component - Memoized for performance
const CollapsibleMeasureMap = memo(function CollapsibleMeasureMap({ measurementType, unit, onMeasurementComplete }: {
  measurementType: string;
  unit: string;
  onMeasurementComplete: (measurement: { value: number; unit: string }) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggleExpanded}
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
          <GoogleMapsLoader>
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="text-sm text-gray-600">Loading map tool...</p>
                </div>
              </div>
            }>
              <MeasureMapTerraImproved
                measurementType={measurementType}
                unit={unit}
                onMeasurementComplete={onMeasurementComplete}
              />
            </Suspense>
          </GoogleMapsLoader>
        </div>
      )}
    </div>
  );
});

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

export default function StyledCalculator(props: any = {}) {
  const { formula: propFormula, isCallScreenMode = false } = props;
  const search = useSearch();
  const queryClient = useQueryClient();
  
  // Get URL parameters first
  const searchParams = new URLSearchParams(search);
  const userId = searchParams.get('userId');
  const isPublicAccess = !!userId;
  
  // Call screen specific params
  const skipLead = searchParams.get('skipLead') === 'true';
  const prefillLeadId = searchParams.get('leadId');
  const prefillName = searchParams.get('prefillName');
  const prefillEmail = searchParams.get('prefillEmail');
  const prefillPhone = searchParams.get('prefillPhone');
  const prefillAddress = searchParams.get('prefillAddress');
  
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [cartServiceIds, setCartServiceIds] = useState<number[]>([]); // Services added to cart for checkout
  const [serviceVariables, setServiceVariables] = useState<Record<number, Record<string, any>>>({});
  const [serviceCalculations, setServiceCalculations] = useState<Record<number, number>>({});
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());
  const [leadForm, setLeadForm] = useState<LeadFormData>({ 
    name: prefillName || "", 
    email: prefillEmail || "", 
    phone: prefillPhone || "",
    address: prefillAddress || "",
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
  const [currentStep, setCurrentStep] = useState<"selection" | "configuration" | "contact" | "pricing" | "scheduling">("selection");
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  // Call screen mode state
  const [callScreenLeadMode, setCallScreenLeadMode] = useState<"select" | "new">("select");
  const [selectedLeadOption, setSelectedLeadOption] = useState<"existing" | "new" | "skip">("new");
  const [selectedCallScreenLeadId, setSelectedCallScreenLeadId] = useState<number | null>(null);

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Check if this is a custom form by looking at the current URL
  const currentPath = window.location.pathname;
  const isCustomForm = currentPath.includes('/custom-form/');
  const embedId = isCustomForm ? currentPath.split('/custom-form/')[1] : null;

  // Override body background for iframe embedding
  useEffect(() => {
    const originalBackground = document.body.style.background;
    document.body.style.background = 'transparent';
    
    return () => {
      document.body.style.background = originalBackground;
    };
  }, []);

  // Single optimized API call to fetch all calculator data (for public/embedded access)
  const { data: calculatorData, isLoading: isLoadingCalculatorData } = useQuery({
    queryKey: ['/api/public/calculator-data', userId, embedId],
    queryFn: () => {
      const params = new URLSearchParams({ userId: userId! });
      if (isCustomForm && embedId) {
        params.append('customFormId', embedId);
      }
      return fetch(`/api/public/calculator-data?${params}`).then(res => res.json());
    },
    enabled: !!userId || (isCustomForm && !!embedId),
    staleTime: 0, // Always fetch fresh
    gcTime: 0, // No cache
  });

  // Fetch authenticated user's data for call screen mode
  const { data: authenticatedData, isLoading: isLoadingAuthData } = useQuery({
    queryKey: ['/api/public/calculator-data', 'authenticated'],
    queryFn: () => fetch('/api/public/calculator-data').then(res => res.json()),
    enabled: isCallScreenMode && !isPublicAccess,
    staleTime: 0,
    gcTime: 0,
  });

  // Extract data from combined response - prioritize authenticated data for call screen
  const formulas = isCallScreenMode && !isPublicAccess 
    ? (authenticatedData?.formulas || [])
    : (calculatorData?.formulas || []);
  const businessSettings = isCallScreenMode && !isPublicAccess
    ? (authenticatedData?.businessSettings || null)
    : (calculatorData?.businessSettings || null);
  const designSettings = isCallScreenMode && !isPublicAccess
    ? (authenticatedData?.designSettings || null)
    : (calculatorData?.designSettings || null);
  const customForm = calculatorData?.customForm || null;
  
  // Fetch leads for call screen mode (only when in call screen mode)
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    enabled: isCallScreenMode && !isPublicAccess,
  });

  // Get the user ID for data fetching (from URL param or custom form)
  const effectiveUserId = isCustomForm && customForm ? customForm.userId : userId;
  const effectiveIsPublicAccess = !!effectiveUserId;

  // Use provided formula or first available formula
  const formula = propFormula || (formulas && formulas.length > 0 ? formulas[0] : null);

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
        photoMeasurements: data.photoMeasurements,
        distanceInfo: data.distanceInfo,
        appliedDiscounts: data.appliedDiscounts,
        bundleDiscountAmount: data.bundleDiscountAmount,
        selectedUpsells: data.selectedUpsells,
        businessOwnerId: isPublicAccess ? userId : undefined,
      };
      
      // Use the same endpoint for both public and authenticated access
      return apiRequest("POST", "/api/multi-service-leads", payload);
    },
    onSuccess: (data: any) => {
      // Invalidate leads cache to ensure new lead appears
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      
      // Store the lead ID for booking
      if (data?.id) {
        setSubmittedLeadId(data.id);
      }
      
      // Clear photo measurements after successful submission
      setPhotoMeasurements([]);
    },
    onError: () => {
      // Silently handle error - no toast for iframe embedding
      console.error("Failed to submit quote request");
    },
  });

  // Sync cart with selections when cart mode is disabled or only one service
  useEffect(() => {
    const isCartEnabled = businessSettings?.enableServiceCart === true;
    const hasMultipleServices = selectedServices.length > 1;
    
    // Auto-sync cart when cart feature is disabled or only one service selected
    if (!isCartEnabled || !hasMultipleServices) {
      setCartServiceIds(selectedServices);
    }
    // When cart is enabled and multiple services, only sync if cart is empty (initial load)
    else if (cartServiceIds.length === 0 && selectedServices.length > 0) {
      setCartServiceIds(selectedServices);
    }
  }, [selectedServices, businessSettings?.enableServiceCart, cartServiceIds.length]);

  // Auto-expand/collapse logic for multi-service flow
  useEffect(() => {
    // Only run if auto-expand/collapse is enabled
    if (!businessSettings?.enableAutoExpandCollapse) {
      // If disabled, expand all services
      if (currentStep === 'configuration' && selectedServices.length >= 2) {
        setExpandedServices(new Set(selectedServices));
      }
      return;
    }

    if (currentStep !== 'configuration' || selectedServices.length < 2) {
      return;
    }

    // Helper function to check if a service is complete
    const isServiceComplete = (serviceId: number) => {
      const service = formulas?.find(f => f.id === serviceId);
      if (!service) return false;
      const variables = serviceVariables[serviceId] || {};
      const { isCompleted } = areAllVisibleVariablesCompleted(service.variables, variables);
      return isCompleted;
    };

    // Initialize: expand first service if nothing is expanded
    if (expandedServices.size === 0) {
      setExpandedServices(new Set([selectedServices[0]]));
      return;
    }

    // Debounce the auto-collapse check to prevent collapsing while user is typing
    const timeoutId = setTimeout(() => {
      // Check if any expanded service just became complete
      const currentExpandedArray = Array.from(expandedServices);
      for (const serviceId of currentExpandedArray) {
        if (isServiceComplete(serviceId)) {
          // Find the next incomplete service
          const currentIndex = selectedServices.indexOf(serviceId);
          const nextIncompleteService = selectedServices.slice(currentIndex + 1).find(id => !isServiceComplete(id));
          
          if (nextIncompleteService) {
            // Collapse current and expand next
            setExpandedServices(new Set([nextIncompleteService]));
            return;
          } else {
            // All services are complete, collapse all
            setExpandedServices(new Set());
            return;
          }
        }
      }
    }, 800); // Wait 800ms after user stops typing before auto-collapsing

    return () => clearTimeout(timeoutId);
  }, [serviceVariables, currentStep, selectedServices, formulas, businessSettings?.enableAutoExpandCollapse]);

  // Inject CSS variables from design settings - must be before early returns to maintain hook order
  useEffect(() => {
    if (designSettings?.styling) {
      injectCSSVariables(designSettings.styling, 'autobidder-form');
    }
  }, [designSettings?.styling]);

  // Inject default styles using CSS variables when custom CSS exists
  useEffect(() => {
    const styleId = 'default-button-styles';
    
    if (designSettings?.customCSS) {
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      // Default styles using CSS variables - can be overridden by custom CSS
      styleElement.textContent = `
        /* Button styles */
        #autobidder-form .ab-button {
          background-color: var(--ab-button-bg, #2563EB);
          color: var(--ab-button-text-color, #FFFFFF);
          border-color: var(--ab-button-border-color, #2563EB);
          border-radius: var(--ab-button-border-radius, 12px);
          border-width: var(--ab-button-border-width, 0px);
          border-style: solid;
          padding: var(--ab-button-padding, 12px 24px);
          font-size: var(--ab-button-font-size, 18px);
          font-weight: var(--ab-button-font-weight, 600);
          box-shadow: var(--ab-button-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        }
        
        #autobidder-form .ab-button:hover {
          background-color: var(--ab-button-hover-bg, #1d4ed8);
          color: var(--ab-button-hover-text-color, #FFFFFF);
          border-color: var(--ab-button-hover-border-color, #1d4ed8);
        }
        
        /* Service card styles */
        #autobidder-form .ab-service-card {
          background-color: var(--ab-service-selector-bg, #FFFFFF);
          border-color: var(--ab-service-selector-border-color, #E5E7EB);
          border-radius: var(--ab-service-selector-border-radius, 16px);
          border-width: var(--ab-service-selector-border-width, 1px);
          border-style: solid;
        }
        
        #autobidder-form .ab-service-card.selected {
          background-color: var(--ab-service-selector-active-bg, #EFF6FF);
          border-color: var(--ab-service-selector-active-border-color, #3B82F6);
          border-width: var(--ab-service-selector-border-width, 2px);
        }
        
        #autobidder-form .ab-service-card:hover:not(.selected) {
          background-color: var(--ab-service-selector-hover-bg, #F3F4F6);
          border-color: var(--ab-service-selector-hover-border-color, #D1D5DB);
        }
        
        /* Input styles */
        #autobidder-form .ab-input,
        #autobidder-form .ab-number-input,
        #autobidder-form .ab-text-input {
          border-color: var(--ab-input-border-color, #D1D5DB);
          border-radius: var(--ab-input-border-radius, 8px);
          border-width: var(--ab-input-border-width, 1px);
          padding: var(--ab-input-padding, 8px 12px);
        }
        
        #autobidder-form .ab-input:focus,
        #autobidder-form .ab-number-input:focus,
        #autobidder-form .ab-text-input:focus {
          border-color: var(--ab-primary-color, #3B82F6);
          outline: none;
        }
        
        /* Select styles */
        #autobidder-form .ab-select {
          border-color: var(--ab-input-border-color, #D1D5DB);
          border-radius: var(--ab-input-border-radius, 8px);
          border-width: var(--ab-input-border-width, 1px);
        }
        
        /* Multiple choice styles */
        #autobidder-form .ab-multiple-choice {
          border-color: var(--ab-multiple-choice-border-color, #D1D5DB);
          border-radius: var(--ab-multiple-choice-border-radius, 12px);
          border-width: var(--ab-multiple-choice-border-width, 2px);
          border-style: solid;
          background-color: var(--ab-multiple-choice-bg, transparent);
        }
        
        #autobidder-form .ab-multiple-choice.selected {
          background-color: var(--ab-multiple-choice-active-bg, #3B82F6);
          border-color: var(--ab-multiple-choice-active-border-color, #2563EB);
          color: var(--ab-multiple-choice-active-text-color, #FFFFFF);
        }
        
        #autobidder-form .ab-multiple-choice:hover:not(.selected) {
          background-color: var(--ab-multiple-choice-hover-bg, #F3F4F6);
          border-color: var(--ab-multiple-choice-hover-border-color, #D1D5DB);
        }
        
        /* Question card styles */
        #autobidder-form .ab-question-card {
          background-color: var(--ab-question-card-bg, #FFFFFF);
          border-radius: var(--ab-question-card-border-radius, 12px);
          border-color: var(--ab-question-card-border-color, #E5E7EB);
          border-width: var(--ab-question-card-border-width, 1px);
          border-style: solid;
          padding: var(--ab-question-card-padding, 24px);
          box-shadow: var(--ab-question-card-shadow, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
        }
      `;
    } else {
      // Remove default styles when custom CSS is not present
      const element = document.getElementById(styleId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }

    return () => {
      const element = document.getElementById(styleId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [designSettings?.customCSS]);

  // Apply custom CSS if available - scoped to form container
  useEffect(() => {
    const customCSS = designSettings?.customCSS;
    if (!customCSS) return;

    const styleId = 'custom-calculator-css';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    try {
      // Create or update style element
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      // Helper function to prefix a selector with the scope
      const prefixSelector = (selector: string): string => {
        // Skip :root
        if (selector.trim() === ':root') return selector;
        
        return selector
          .split(',')
          .map(s => {
            const sel = s.trim();
            // Handle pseudo-elements and pseudo-classes
            if (sel.includes(':')) {
              const [base, ...pseudo] = sel.split(':');
              return `#autobidder-form ${base}:${pseudo.join(':')}`;
            }
            return `#autobidder-form ${sel}`;
          })
          .join(', ');
      };
      
      // Recursive function to scope CSS, handling nested @-rules
      const scopeCSS = (css: string, depth: number = 0): string => {
        const result: string[] = [];
        let buffer = '';
        let braceDepth = 0;
        let inRule = false;
        let currentSelector = '';
        let isAtRule = false;
        let shouldScopeContent = false;
        
        // @-rules that contain selector lists and should have their content scoped
        const scopableAtRules = ['@media', '@supports', '@container', '@layer'];
        
        // @-rules that should not have their content scoped (they have special syntax)
        // @keyframes, @font-face, @page, @property, etc.
        
        for (let i = 0; i < css.length; i++) {
          const char = css[i];
          
          if (char === '{') {
            braceDepth++;
            if (braceDepth === 1) {
              // Start of a rule
              currentSelector = buffer.trim();
              isAtRule = currentSelector.startsWith('@');
              
              if (isAtRule) {
                // Check if this @-rule should have its content scoped
                shouldScopeContent = scopableAtRules.some(rule => 
                  currentSelector.toLowerCase().startsWith(rule)
                );
                
                // For @-rules, keep the @-rule as-is
                result.push(currentSelector + ' {');
              } else {
                // Regular rule - prefix the selector
                result.push(prefixSelector(currentSelector) + ' {');
              }
              
              buffer = '';
              inRule = true;
            } else {
              buffer += char;
            }
          } else if (char === '}') {
            braceDepth--;
            if (braceDepth === 0) {
              // End of a rule
              if (isAtRule) {
                if (shouldScopeContent) {
                  // Recursively scope the content inside scopable @-rules
                  result.push(scopeCSS(buffer, depth + 1));
                } else {
                  // For non-scopable @-rules (like @keyframes), keep content as-is
                  result.push(buffer);
                }
              } else {
                // Regular rule - just add the declarations
                result.push(buffer);
              }
              result.push('}');
              buffer = '';
              inRule = false;
              currentSelector = '';
              isAtRule = false;
              shouldScopeContent = false;
            } else {
              buffer += char;
            }
          } else {
            buffer += char;
          }
        }
        
        // Handle any remaining content
        if (buffer.trim()) {
          result.push(buffer);
        }
        
        return result.join('');
      };
      
      const scopedCSS = scopeCSS(customCSS);
      styleElement.textContent = scopedCSS;
    } catch (error) {
      console.error('Error applying custom CSS, reverting to editor settings:', error);
      // Remove the custom CSS element on error to revert to editor settings
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    }

    // Cleanup on unmount or when customCSS changes
    return () => {
      const element = document.getElementById(styleId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [designSettings?.customCSS]);

  // Check loading state for both public and authenticated data
  const isLoading = isLoadingCalculatorData || isLoadingAuthData;
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-2 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-72 mb-6"></div>
          <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          </div>
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

  // Check if a service has all required variables filled
  const isServiceComplete = (serviceId: number) => {
    const service = formulas?.find(f => f.id === serviceId);
    if (!service) return false;

    const variables = serviceVariables[serviceId] || {};
    const { isCompleted } = areAllVisibleVariablesCompleted(service.variables, variables);
    return isCompleted;
  };

  // Toggle service section expansion
  const toggleServiceExpansion = (serviceId: number) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const calculateServicePrice = (serviceId: number) => {
    const service = formulas?.find(f => f.id === serviceId);
    if (!service) return 0;

    try {
      let formulaExpression = service.formula;
      const variables = serviceVariables[serviceId] || {};
      
      // First, replace individual option references for multiple-choice with allowMultipleSelection
      service.variables.forEach((variable) => {
        if (variable.type === 'multiple-choice' && variable.allowMultipleSelection && variable.options) {
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
            }
          });
        }
      });
      
      service.variables.forEach((variable) => {
        // Skip multiple-choice with allowMultipleSelection since we already handled individual options
        if (variable.type === 'multiple-choice' && variable.allowMultipleSelection) {
          return; // Skip this variable, options already replaced
        }
        
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
      // Silently prevent progression - no toast for iframe embedding
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
        // Add service title prefix to missing variables for debugging
        const serviceMissingVars = missingVariables.map(varName => `${service.title || service.name}: ${varName}`);
        allMissingVariables.push(...serviceMissingVars);
        
        // Debug logging to understand the issue
        console.log("Service:", service.title || service.name);
        console.log("Service variables:", service.variables);
        console.log("Service variable values:", serviceVars);
        console.log("Missing variables for this service:", missingVariables);
      }
    }

    if (allMissingVariables.length > 0) {
      // Log missing variables for debugging
      console.log("Missing required variables:", allMissingVariables);
      
      // Provide user feedback instead of silently failing
      console.error("Missing required variables - user should complete all visible fields first");
      
      // Find and highlight missing fields by adding a visual indicator
      // This will help users identify what they need to complete
      const missingFieldElements = document.querySelectorAll('[data-missing-field]');
      missingFieldElements.forEach(el => el.removeAttribute('data-missing-field'));
      
      // Add data attributes to missing fields to help with styling
      for (const serviceId of selectedServices) {
        const service = formulas?.find(f => f.id === serviceId);
        if (!service) continue;
        
        const serviceVars = serviceVariables[serviceId] || {};
        const { missingVariables } = areAllVisibleVariablesCompleted(service.variables, serviceVars);
        
        missingVariables.forEach(varName => {
          // Find the variable by name and add visual indicator
          const variable = service.variables.find(v => v.name === varName);
          if (variable) {
            // Find the input element and add visual indicator
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
    
    // Skip to pricing if skipLead is enabled (for call screen mode)
    if (skipLead) {
      setCurrentStep("pricing");
    } else {
      setCurrentStep("contact");
    }
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
      // Silently prevent submission - no toast for iframe embedding
      console.log("Missing required fields:", missingFields);
      return;
    }

    // Use cart services for submission when cart is enabled
    const services: ServiceCalculation[] = cartServiceIds.map(serviceId => {
      const service = formulas?.find(f => f.id === serviceId);
      return {
        formulaId: serviceId,
        formulaName: service?.name || service?.title || 'Unknown Service',
        variables: serviceVariables[serviceId] || {},
        calculatedPrice: Math.round((serviceCalculations[serviceId] || 0) * 100) // Convert dollars to cents
      };
    });

    // Calculate total price with discounts and distance fees
    const subtotal = cartServiceIds.reduce((sum, serviceId) => sum + Math.max(0, serviceCalculations[serviceId] || 0), 0);
    const bundleDiscount = (businessSettings?.styling?.showBundleDiscount && cartServiceIds.length > 1)
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

    // Prepare upsell information for submission - collect from all selected services
    const allUpsellsForSubmission = selectedServices.reduce((acc: any[], serviceId) => {
      const service = formulas?.find(f => f.id === serviceId);
      if (service?.upsellItems) {
        acc.push(...service.upsellItems);
      }
      return acc;
    }, []);
    
    const selectedUpsellData = allUpsellsForSubmission
      ?.filter((u: any) => selectedUpsells.includes(u.id))
      ?.map((upsell: any) => ({
        id: upsell.id,
        name: upsell.name,
        percentage: upsell.percentageOfMain,
        amount: Math.round(subtotal * (upsell.percentageOfMain / 100) * 100) // Convert to cents
      })) || [];

    const submissionData = {
      services,
      totalPrice: Math.round(totalPrice * 100), // Convert to cents for database storage
      leadInfo: leadForm,
      photoMeasurements: photoMeasurements,
      distanceInfo: distanceInfo ? {
        distance: distanceInfo.distance,
        fee: distanceFee,
        message: distanceInfo.message
      } : undefined,
      appliedDiscounts: appliedDiscountData,
      bundleDiscountAmount: Math.round(bundleDiscount * 100), // Convert to cents
      selectedUpsells: selectedUpsellData
    };

    console.log('Submitting lead data:', submissionData);
    
    // Show pricing page immediately while submission happens in background
    setCurrentStep("pricing");
    
    // Submit in background
    submitMultiServiceLeadMutation.mutate(submissionData);
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
  
  // Helper function to convert hex color + alpha to rgba
  const hexToRgba = (hex: string, alpha: number = 100): string => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = alpha / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
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
    // If custom CSS exists, use CSS variables instead of inline styles to allow CSS overrides
    if (designSettings?.customCSS) {
      // Return minimal inline styles, let CSS variables and custom CSS handle the rest
      return {
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer' as const,
      };
    }
    
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
    backgroundColor: hexToRgba(
      componentStyles.textInput?.backgroundColor || '#FFFFFF',
      componentStyles.textInput?.backgroundColorAlpha ?? 100
    ),
    borderRadius: `${componentStyles.textInput?.borderRadius || 8}px`,
    borderWidth: `${componentStyles.textInput?.borderWidth || 1}px`,
    borderColor: hexToRgba(
      componentStyles.textInput?.borderColor || '#E5E7EB',
      componentStyles.textInput?.borderColorAlpha ?? 100
    ),
    borderStyle: 'solid' as const,
    padding: `${componentStyles.textInput?.padding || 12}px`,
    boxShadow: getShadowValue(componentStyles.textInput?.shadow || 'sm'),
    fontSize: getFontSizeValue(componentStyles.textInput?.fontSize || 'base'),
    color: hexToRgba(
      componentStyles.textInput?.textColor || '#374151',
      componentStyles.textInput?.textColorAlpha ?? 100
    ),
    height: `${componentStyles.textInput?.height || 40}px`,
  });

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "selection":
        return (
          <div className="space-y-6">
            {/* Conditionally render title and subtitle based on business settings */}
            {(businessSettings?.styling?.showFormTitle !== false || businessSettings?.styling?.showFormSubtitle !== false) && (
              <div className="text-center mb-8">
                {businessSettings?.styling?.showFormTitle !== false && (
                  <h1 
                    className="text-3xl font-bold mb-2"
                    style={{ color: styling.primaryColor || '#2563EB' }}
                  >
                    {businessSettings?.styling?.selectionTitle || 'Select Your Services'}
                  </h1>
                )}
                {businessSettings?.styling?.showFormSubtitle !== false && (
                  <p className="text-gray-600">
                    {businessSettings?.styling?.selectionSubtitle || "Choose the services you'd like a quote for"}
                  </p>
                )}
              </div>
            )}

            {/* Form Introduction Video */}
            {businessSettings?.guideVideos?.introVideo && (
              <GuideVideo 
                videoUrl={businessSettings.guideVideos.introVideo}
                title="How to Use Our Pricing Form"
              />
            )}
            
            <EnhancedServiceSelector
              formulas={formulas || []}
              selectedServices={selectedServices}
              onServiceToggle={handleServiceToggle}
              hasCustomCSS={!!designSettings?.customCSS}
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
              className="ab-button ab-button-primary button w-full mt-6"
              data-testid="button-proceed-to-configuration"
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
            {/* Conditionally render title and subtitle based on business settings */}
            {(businessSettings?.styling?.showFormTitle !== false || businessSettings?.styling?.showFormSubtitle !== false) && (
              <div className="text-center mb-8">
                {businessSettings?.styling?.showFormTitle !== false && businessSettings?.styling?.configurationTitle && businessSettings.styling.configurationTitle.trim() && (
                  <h1 
                    className="text-3xl font-bold mb-2"
                    style={{ color: styling.primaryColor || '#2563EB' }}
                  >
                    {businessSettings.styling.configurationTitle}
                  </h1>
                )}
                {businessSettings?.styling?.showFormSubtitle !== false && businessSettings?.styling?.configurationSubtitle && businessSettings.styling.configurationSubtitle.trim() && (
                  <p className="text-gray-600">
                    {businessSettings.styling.configurationSubtitle}
                  </p>
                )}
              </div>
            )}
            
            {selectedServices.map((serviceId, index) => {
              const service = formulas?.find(f => f.id === serviceId);
              if (!service) return null;
              
              const isExpanded = expandedServices.has(serviceId) || selectedServices.length === 1;
              const isComplete = isServiceComplete(serviceId);
              const showCollapsible = selectedServices.length >= 2;
              
              return (
                <Card 
                  key={serviceId} 
                  className="overflow-hidden"
                  style={{
                    backgroundColor: hexToRgba(
                      componentStyles.questionCard?.backgroundColor || '#FFFFFF',
                      componentStyles.questionCard?.backgroundColorAlpha ?? 100
                    ),
                    borderRadius: `${componentStyles.questionCard?.borderRadius || 8}px`,
                    borderWidth: `${componentStyles.questionCard?.borderWidth || 1}px`,
                    borderColor: hexToRgba(
                      componentStyles.questionCard?.borderColor || '#E5E7EB',
                      componentStyles.questionCard?.borderColorAlpha ?? 100
                    ),
                    borderStyle: 'solid',
                    boxShadow: componentStyles.questionCard?.shadow === 'none' ? 'none' :
                               componentStyles.questionCard?.shadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                               componentStyles.questionCard?.shadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' :
                               componentStyles.questionCard?.shadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' :
                               componentStyles.questionCard?.shadow === 'xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' :
                               '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* Collapsible Header - Only show if multiple services */}
                  {showCollapsible && (
                    <button
                      onClick={() => toggleServiceExpansion(serviceId)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      style={{
                        backgroundColor: isExpanded ? 'transparent' : '#F9FAFB',
                        borderBottom: isExpanded ? `1px solid ${componentStyles.questionCard?.borderColor || '#E5E7EB'}` : 'none',
                      }}
                      data-testid={`button-toggle-service-${serviceId}`}
                    >
                      <h3 
                        className="text-xl font-semibold"
                        style={{ color: styling.textColor || '#1F2937' }}
                      >
                        {service.name}
                      </h3>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" style={{ color: styling.textColor || '#6B7280' }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: styling.textColor || '#6B7280' }} />
                      )}
                    </button>
                  )}

                  {/* Content - Always show for single service, conditionally for multiple */}
                  {isExpanded && (
                    <div style={{ padding: `${componentStyles.questionCard?.padding || 24}px` }}>
                      {/* Title for single service (no collapsible header) */}
                      {!showCollapsible && (
                        <h3 
                          className="text-xl font-semibold mb-4"
                          style={{ color: styling.textColor || '#1F2937' }}
                        >
                          {service.name}
                        </h3>
                      )}

                  {/* Show service image if enabled */}
                  {service.showImage && service.imageUrl && (
                    <div className="mb-6">
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-auto object-cover"
                          style={{ maxHeight: '400px' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

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
                            // Silently apply measurement - no toast for iframe embedding
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
                        formulaName={service.name}
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
                          
                          // Save full photo measurement data
                          if (measurement.fullData) {
                            setPhotoMeasurements(prev => [...prev, measurement.fullData!]);
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
                        hasCustomCSS={!!designSettings?.customCSS}
                      />
                    ))}
                  </div>
                </div>
              )}
                </Card>
              );
            })}
            
            <Button
              onClick={proceedToContact}
              className="button w-full"
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
        
        // Handle call screen mode lead selection (show options screen)
        if (isCallScreenMode && callScreenLeadMode === "select") {
          const selectedLead = leads.find(lead => lead.id === selectedCallScreenLeadId);
          
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2" style={{ color: styling.primaryColor || '#2563EB' }}>
                  Lead Information
                </h2>
                <p className="text-gray-600">Choose how to handle lead information for this quote</p>
              </div>
              
              <div className="space-y-4">
                {/* Existing Lead Option */}
                <Card className={selectedLeadOption === "existing" ? "border-blue-500 border-2" : ""}>
                  <CardContent className="pt-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="lead-mode"
                        checked={selectedLeadOption === "existing"}
                        onChange={() => {
                          setSelectedLeadOption("existing");
                          setSelectedCallScreenLeadId(null);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Choose Existing Lead</div>
                        <p className="text-sm text-gray-600 mt-1">Select a lead from your database to auto-fill their information</p>
                      </div>
                    </label>
                    
                    {selectedLeadOption === "existing" && (
                      <div className="mt-4 space-y-4">
                        {leads.length > 0 ? (
                          <>
                            <select
                              value={selectedCallScreenLeadId?.toString() || ""}
                              onChange={(e) => {
                                const leadId = parseInt(e.target.value);
                                setSelectedCallScreenLeadId(leadId);
                                const lead = leads.find(l => l.id === leadId);
                                if (lead) {
                                  setLeadForm({
                                    name: lead.name || "",
                                    email: lead.email || "",
                                    phone: lead.phone || "",
                                    address: lead.address || "",
                                    notes: "",
                                    howDidYouHear: ""
                                  });
                                }
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="">Select a lead...</option>
                              {leads.map((lead) => (
                                <option key={lead.id} value={lead.id}>
                                  {lead.name} - {lead.email}
                                </option>
                              ))}
                            </select>
                            
                            {selectedLead && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="space-y-2 text-sm">
                                  <div><strong>Name:</strong> {selectedLead.name}</div>
                                  {selectedLead.email && <div><strong>Email:</strong> {selectedLead.email}</div>}
                                  {selectedLead.phone && <div><strong>Phone:</strong> {selectedLead.phone}</div>}
                                  {selectedLead.address && <div><strong>Address:</strong> {selectedLead.address}</div>}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No existing leads found</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* New Lead Option */}
                <Card className={selectedLeadOption === "new" ? "border-blue-500 border-2" : ""}>
                  <CardContent className="pt-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="lead-mode"
                        checked={selectedLeadOption === "new"}
                        onChange={() => setSelectedLeadOption("new")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Enter New Lead</div>
                        <p className="text-sm text-gray-600 mt-1">Collect the customer's information through the contact form</p>
                      </div>
                    </label>
                  </CardContent>
                </Card>
                
                {/* Skip Lead Option */}
                <Card className={selectedLeadOption === "skip" ? "border-blue-500 border-2" : ""}>
                  <CardContent className="pt-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="lead-mode"
                        checked={selectedLeadOption === "skip"}
                        onChange={() => setSelectedLeadOption("skip")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Skip Lead (Pricing Only)</div>
                        <p className="text-sm text-gray-600 mt-1">Get pricing instantly without capturing lead information</p>
                        <div className="mt-2 inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          No lead will be saved
                        </div>
                      </div>
                    </label>
                  </CardContent>
                </Card>
              </div>
              
              <Button
                onClick={() => {
                  if (selectedLeadOption === "skip") {
                    setCurrentStep("pricing");
                  } else if (selectedLeadOption === "existing" && selectedCallScreenLeadId) {
                    // Existing lead selected, proceed to submit
                    handleSubmitLead();
                  } else if (selectedLeadOption === "new") {
                    // Switch to showing the normal contact form
                    setCallScreenLeadMode("new");
                    setLeadForm({ name: "", email: "", phone: "", address: "", notes: "", howDidYouHear: "" });
                  }
                }}
                disabled={selectedLeadOption === "existing" && !selectedCallScreenLeadId}
                className="button w-full"
                style={getButtonStyles('primary')}
              >
                {selectedLeadOption === "skip" ? "View Pricing" : 
                 selectedLeadOption === "existing" ? "Submit with Existing Lead" :
                 "Continue"}
              </Button>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            {/* Conditionally render title and subtitle based on business settings */}
            {(businessSettings?.styling?.showFormTitle !== false || businessSettings?.styling?.showFormSubtitle !== false) && (
              <div className="text-center mb-8">
                {businessSettings?.styling?.showFormTitle !== false && businessSettings?.styling?.contactTitle && businessSettings.styling.contactTitle.trim() && (
                  <h1 
                    className="text-3xl font-bold mb-2"
                    style={{ color: styling.primaryColor || '#2563EB' }}
                  >
                    {businessSettings.styling.contactTitle}
                  </h1>
                )}
                {businessSettings?.styling?.showFormSubtitle !== false && businessSettings?.styling?.contactSubtitle && businessSettings.styling.contactSubtitle.trim() && (
                  <p className="text-gray-600">
                    {businessSettings.styling.contactSubtitle}
                  </p>
                )}
              </div>
            )}

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
                  <GoogleMapsLoader>
                    <GooglePlacesAutocomplete
                      value={leadForm.address}
                      onChange={(newAddress) => {
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
                      placeholder={businessSettings?.styling?.addressLabel || 'Enter your address...'}
                      types={['address']}
                      componentRestrictions={{ country: 'us' }}
                      styling={styling}
                      componentStyles={designSettings?.componentStyles}
                      className="w-full"
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
              className="button w-full"
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
        // Use cart services for pricing when cart is enabled
        const subtotal = cartServiceIds.reduce((sum, serviceId) => sum + Math.max(0, serviceCalculations[serviceId] || 0), 0);
        const bundleDiscount = (businessSettings?.styling?.showBundleDiscount && cartServiceIds.length > 1)
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
        
        // Calculate upsell amount from all selected services
        const allUpsellsForPricing = selectedServices.reduce((acc: any[], serviceId) => {
          const service = formulas?.find(f => f.id === serviceId);
          if (service?.upsellItems) {
            acc.push(...service.upsellItems);
          }
          return acc;
        }, []);
        
        const upsellAmount = selectedUpsells.length > 0
          ? allUpsellsForPricing
              .filter((u: any) => selectedUpsells.includes(u.id))
              .reduce((sum: number, upsell: any) => sum + Math.round(subtotal * (upsell.percentageOfMain / 100)), 0)
          : 0;
        
        const subtotalWithDistanceAndUpsells = discountedSubtotal + distanceFee + upsellAmount;
        const taxAmount = businessSettings?.styling?.enableSalesTax 
          ? Math.round(subtotalWithDistanceAndUpsells * ((businessSettings.styling.salesTaxRate || 0) / 100))
          : 0;
        const finalTotalPrice = subtotalWithDistanceAndUpsells + taxAmount;


        
        return (
          <div className="space-y-6">
            {/* Conditionally render title and subtitle based on business settings */}
            {(businessSettings?.styling?.showFormTitle !== false || businessSettings?.styling?.showFormSubtitle !== false) && (
              <div className="text-center mb-8">
                {businessSettings?.styling?.showFormTitle !== false && businessSettings?.styling?.pricingTitle && businessSettings.styling.pricingTitle.trim() && (
                  <h1 
                    className="text-3xl font-bold mb-2"
                    style={{ color: styling.primaryColor || '#2563EB' }}
                  >
                    {businessSettings.styling.pricingTitle}
                  </h1>
                )}
                {businessSettings?.styling?.showFormSubtitle !== false && businessSettings?.styling?.pricingSubtitle && businessSettings.styling.pricingSubtitle.trim() && (
                  <p className="text-gray-600">
                    {businessSettings.styling.pricingSubtitle}
                  </p>
                )}
              </div>
            )}
            {/* Pricing Page Video */}
            {businessSettings?.guideVideos?.pricingVideo && (
              <GuideVideo 
                videoUrl={businessSettings.guideVideos.pricingVideo}
                title="Understanding Your Quote"
              />
            )}
            {/* Detailed Pricing Card */}
            <div 
              className="p-8 rounded-lg mb-6"
              style={{
                backgroundColor: 'transparent',
                borderRadius: `${styling.containerBorderRadius || 12}px`,
                borderWidth: '1px',
                borderColor: '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                padding: '32px',
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
                        className="pricing-card relative overflow-hidden transition-all duration-300 hover:scale-105"
                        style={{
                          borderRadius: `${componentStyles.pricingCard?.borderRadius || 16}px`,
                          backgroundColor: hexToRgba(
                            componentStyles.pricingCard?.backgroundColor || '#FFFFFF',
                            componentStyles.pricingCard?.backgroundColorAlpha ?? 100
                          ),
                          borderWidth: `${componentStyles.pricingCard?.borderWidth || 1}px`,
                          borderColor: hexToRgba(
                            componentStyles.pricingCard?.borderColor || '#E5E7EB',
                            componentStyles.pricingCard?.borderColorAlpha ?? 100
                          ),
                          borderStyle: 'solid',
                          boxShadow: getShadowValue(componentStyles.pricingCard?.shadow || 'xl'),
                          padding: '10px'
                        }}
                      >
                        {/* Inner container with background */}
                        <div 
                          className="relative p-5 pt-10"
                          style={{
                            backgroundColor: hexToRgba(
                              componentStyles.pricingCard?.backgroundColor || '#FFFFFF',
                              Math.max(0, (componentStyles.pricingCard?.backgroundColorAlpha ?? 100) - 85)
                            ),
                            borderRadius: `${Math.max(0, (componentStyles.pricingCard?.borderRadius || 16) - 4)}px`
                          }}
                        >
                          {/* Price positioned absolutely at top-right */}
                          <div 
                            className="absolute top-0 right-0 flex items-center px-3 py-2 text-xl font-semibold ml-[0px] mr-[0px] mt-[-5px] mb-[-5px]"
                            style={{
                              backgroundColor: styling.primaryColor ? `${styling.primaryColor}30` : '#3B82F630',
                              color: styling.textColor || '#1F2937',
                              borderRadius: '99em 0 0 99em'
                            }}
                          >
                            <span>
                              {hasPricingIssue ? 'Error' : `$${displayPrice.toLocaleString()}`}
                            </span>
                          </div>

                          {/* Service Icon & Title */}
                          <div className="flex items-center gap-3 mb-3">
                            {/* Service Icon */}
                            {componentStyles.pricingCard?.showServiceIcon !== false && service.iconUrl && (
                              <img 
                                src={service.iconUrl} 
                                alt={service.name}
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            
                            {/* Service Title */}
                            <h4 
                              className="text-xl font-semibold"
                              style={{ color: styling.textColor || '#1F2937' }}
                            >
                              {service.name}
                            </h4>
                          </div>

                          {/* Description */}
                          <p 
                            className="text-sm mb-4 leading-relaxed"
                            style={{ color: styling.textColor ? `${styling.textColor}90` : '#4B5563' }}
                          >
                            {service.title || service.description || `Professional ${service.name.toLowerCase()} service designed to meet your specific needs with quality materials and expert craftsmanship.`}
                          </p>

                          {/* Features List */}
                          <div className="mb-5">
                            <ul className="space-y-3">
                              {/* Show custom bullet points from formula builder first */}
                              {service.bulletPoints && service.bulletPoints.length > 0 ? (
                                service.bulletPoints.map((bulletPoint, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <span 
                                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: styling.primaryColor || '#3B82F6' }}
                                    >
                                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                                      </svg>
                                    </span>
                                    <span className="text-sm font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                                      {bulletPoint}
                                    </span>
                                  </li>
                                ))
                              ) : (
                                /* Fallback to service features if no custom bullet points */
                                serviceFeatures.length > 0 ? (
                                  <>
                                    {serviceFeatures.slice(0, 4).map((feature, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <span 
                                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                          style={{ backgroundColor: styling.primaryColor || '#3B82F6' }}
                                        >
                                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                                          </svg>
                                        </span>
                                        <span className="text-sm font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                                          <strong>{feature.name}:</strong> {feature.value}
                                        </span>
                                      </li>
                                    ))}
                                  </>
                                ) : (
                                  /* Default bullet points as final fallback */
                                  <>
                                    <li className="flex items-center gap-2">
                                      <span 
                                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: styling.primaryColor || '#3B82F6' }}
                                      >
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                                        </svg>
                                      </span>
                                      <span className="text-sm font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                                        Professional {service.name.toLowerCase()} service
                                      </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <span 
                                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: styling.primaryColor || '#3B82F6' }}
                                      >
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                                        </svg>
                                      </span>
                                      <span className="text-sm font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                                        Quality materials and workmanship
                                      </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <span 
                                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: styling.primaryColor || '#3B82F6' }}
                                      >
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                                        </svg>
                                      </span>
                                      <span className="text-sm font-medium" style={{ color: styling.textColor || '#1F2937' }}>
                                        Satisfaction guarantee
                                      </span>
                                    </li>
                                  </>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>



              {/* Detailed Pricing Breakdown */}
              <div className="border-t border-gray-300 pt-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: styling.textColor || '#1F2937' }}>
                  Pricing Breakdown
                </h3>
                
                {/* Individual Service Line Items */}
                <div className="space-y-3">
                  {cartServiceIds.map(serviceId => {
                    const service = formulas?.find(f => f.id === serviceId);
                    const price = Math.max(0, serviceCalculations[serviceId] || 0);
                    
                    // Use formula name first, then title as fallback, then service ID
                    const serviceName = service?.name || service?.title || `Service ${serviceId}`;
                    
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
                {(() => {
                  // Collect all upsells from cart services for line items
                  const allUpsellsForLineItems = cartServiceIds.reduce((acc, serviceId) => {
                    const service = formulas?.find(f => f.id === serviceId);
                    if (service?.upsellItems) {
                      const serviceUpsells = service.upsellItems.map(upsell => ({
                        ...upsell,
                        serviceId: service.id,
                        serviceName: service.name
                      }));
                      acc.push(...serviceUpsells);
                    }
                    return acc;
                  }, [] as any[]);

                  return selectedUpsells.length > 0 && allUpsellsForLineItems.length > 0 && (
                    <div className="space-y-2">
                      {allUpsellsForLineItems.filter(u => selectedUpsells.includes(u.id)).map((upsell) => {
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
                      })}
                    </div>
                  );
                })()}

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

              {/* Discount Selection */}
              {businessSettings?.discounts && businessSettings.discounts.filter(d => d.isActive).length > 0 && (
                <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: styling.textColor || '#1F2937' }}>
                    💰 Available Discounts
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
                                ✓ Applied
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                // Collect all upsells from cart services
                const allUpsells = cartServiceIds.reduce((acc, serviceId) => {
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
                  className="button flex-1"
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
                  className="button flex-1"
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
                  className="button flex-1"
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
              )}
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
                backgroundColor: hexToRgba(
                  componentStyles.pricingCard?.backgroundColor || '#F8F9FA',
                  componentStyles.pricingCard?.backgroundColorAlpha ?? 100
                ),
                borderRadius: `${componentStyles.pricingCard?.borderRadius || 8}px`,
                borderWidth: `${componentStyles.pricingCard?.borderWidth || 1}px`,
                borderColor: hexToRgba(
                  componentStyles.pricingCard?.borderColor || '#E5E7EB',
                  componentStyles.pricingCard?.borderColorAlpha ?? 100
                ),
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
              (<Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-sm text-gray-600">Loading calendar...</p>
                  </div>
                </div>
              }>
                <BookingCalendar
                  onBookingConfirmed={(slotId) => {
                    setBookingConfirmed(true);
                  }}
                  leadId={submittedLeadId || undefined}
                  businessOwnerId={isPublicAccess ? userId : undefined}
                  customerInfo={{
                    name: leadForm.name,
                    email: leadForm.email,
                    phone: leadForm.phone
                  }}
                  serviceName={
                    formulas
                      ? selectedServices
                          .map(id => formulas.find(f => f.id === id)?.serviceName)
                          .filter(Boolean)
                          .join(', ')
                      : undefined
                  }
                />
              </Suspense>)
            ) : (
              /* Booking Confirmation */
              (<div className="text-center p-8 bg-green-50 rounded-lg">
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
                {businessSettings?.enableCustomButton && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <Button
                      className="button"
                      onClick={() => {
                        if (businessSettings.customButtonUrl) {
                          window.open(businessSettings.customButtonUrl, '_blank');
                        } else {
                          setSelectedServices([]);
                          setServiceVariables({});
                          setServiceCalculations({});
                          setSelectedDiscounts([]);
                          setSelectedUpsells([]);
                          setLeadForm({ name: "", email: "", phone: "", address: "", notes: "", howDidYouHear: "" });
                          setSubmittedLeadId(null);
                          setBookingConfirmed(false);
                          setCurrentStep("selection");
                        }
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
                      {businessSettings.customButtonText || 'Get Another Quote'}
                    </Button>
                  </div>
                )}
              </div>)
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate progress bar percentage based on form completion
  const getFormProgress = () => {
    switch (currentStep) {
      case "selection":
        // 0-25% during service selection - fills as services are selected
        const totalServices = formulas?.length || 1;
        const selectionProgress = selectedServices.length > 0 
          ? Math.min(25, (selectedServices.length / totalServices) * 25)
          : 0;
        return selectionProgress;
      case "configuration":
        return 50; // 50% when configuring services
      case "contact":
        return 75; // 75% when entering contact info
      case "pricing":
        return 100; // 100% when viewing pricing
      case "scheduling":
        return 100; // 100% when scheduling
      default:
        return 0;
    }
  };

  const getProgressLabel = () => {
    switch (currentStep) {
      case "selection":
        return "Step 1: Select Services";
      case "configuration":
        return "Step 2: Configure Services";
      case "contact":
        return "Step 3: Contact Information";
      case "pricing":
        return "Step 4: Review Quote";
      case "scheduling":
        return "Step 4: Schedule Appointment";
      default:
        return "Getting Started";
    }
  };

  const progressPercentage = getFormProgress();

  return (
    <div className="min-h-screen flex items-start justify-center p-1 sm:p-2" style={{ margin: '0' }}>
      <div 
        id="autobidder-form"
        className="ab-form-container form-container max-w-4xl w-full mx-auto"
        style={{
          backgroundColor: styling.backgroundColor || 'transparent',
          borderRadius: `${styling.containerBorderRadius || 16}px`,
          padding: `${styling.containerPadding || 8}px`,
          margin: `${styling.containerMargin || 0}px`,
          boxShadow: styling.containerShadow === 'xl' 
            ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        {/* Progress Bar - Only show when showProgressGuide is enabled */}
        {businessSettings?.styling?.showProgressGuide && (
          <div className="mb-6 px-2" data-testid="progress-bar-container">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: styling.textColor || '#374151' }}>
                {getProgressLabel()}
              </span>
              <span className="text-sm font-medium" style={{ color: styling.primaryColor || '#2563EB' }}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div 
              className="w-full rounded-full overflow-hidden"
              style={{ 
                backgroundColor: '#E5E7EB',
                height: '8px'
              }}
              data-testid="progress-bar-track"
            >
              <div
                className="h-full transition-all duration-300 ease-out"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: styling.primaryColor || '#2563EB',
                }}
                data-testid="progress-bar-fill"
              />
            </div>
          </div>
        )}
        
        {renderCurrentStep()}
      </div>
    </div>
  );
}