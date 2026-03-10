import { useState, useEffect, lazy, Suspense, memo, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";
import { ChevronDown, ChevronUp, Map, Search, User, Mail, Phone, MapPin, X, Home, Loader2 } from "lucide-react";
import type { Formula, DesignSettings, ServiceCalculation, BusinessSettings, Lead, PropertyAttributes } from "@shared/schema";
import { areAllVisibleVariablesCompleted, evaluateConditionalLogic, getDefaultValueForHiddenVariable } from "@shared/conditional-logic";
import { injectCSSVariables } from "@shared/css-variables";

// Lazy load heavy components for better performance
const EnhancedVariableInput = lazy(() => import("@/components/enhanced-variable-input"));
const CollapsiblePhotoMeasurement = lazy(() =>
  import("@/components/collapsible-photo-measurement").then((module) => ({
    default: module.CollapsiblePhotoMeasurement,
  }))
);
const GoogleMapsLoader = lazy(() =>
  import("@/components/google-maps-loader").then((module) => ({
    default: module.GoogleMapsLoader,
  }))
);
const GooglePlacesAutocomplete = lazy(() =>
  import("@/components/google-places-autocomplete").then((module) => ({
    default: module.GooglePlacesAutocomplete,
  }))
);
const MeasureMapTerraImproved = lazy(() => import("@/components/measure-map-terra-improved"));
const BookingCalendar = lazy(() => import("@/components/booking-calendar-v2"));

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
  permissionToContact?: boolean;
  uploadedImages?: string[];
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
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="text-sm text-gray-600">Loading map tool...</p>
                </div>
              </div>
            }
          >
            <GoogleMapsLoader>
              <MeasureMapTerraImproved
                measurementType={measurementType as "area" | "distance"}
                unit={unit as "sqft" | "sqm" | "ft" | "m"}
                onMeasurementComplete={onMeasurementComplete}
              />
            </GoogleMapsLoader>
          </Suspense>
        </div>
      )}
    </div>
  );
});

// Helper function to render bullet point icons based on type
function renderBulletIcon(iconType: string = 'checkmark') {
  const iconMap: Record<string, JSX.Element> = {
    checkmark: (
      <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" />
    ),
    star: (
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    ),
    circle: (
      <circle cx="12" cy="12" r="5" fill="currentColor" />
    ),
    arrow: (
      <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    ),
    plus: (
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    ),
    diamond: (
      <path fill="currentColor" d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
    ),
    heart: (
      <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    ),
  };

  return iconMap[iconType] || iconMap.checkmark;
}

// Helper function to convert hex color + alpha to rgba
function hexToRgba(hex: string, alpha: number = 100): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = alpha / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Helper type for pricing card props
interface PricingCardProps {
  service: any;
  displayPrice: number;
  hasPricingIssue: boolean;
  serviceFeatures: any[];
  styling: any;
  componentStyles: any;
  hasCustomCSS: boolean;
  renderBulletIconFn: (type: string) => JSX.Element;
}

// Pricing Card Layout Renderer - renders 4 different layouts
function renderPricingCardLayout(
  layout: 'classic' | 'modern' | 'minimal' | 'compact',
  props: PricingCardProps
) {
  const { service, displayPrice, hasPricingIssue, serviceFeatures, styling, componentStyles, hasCustomCSS, renderBulletIconFn } = props;
  
  const bulletPoints = service.bulletPoints && service.bulletPoints.length > 0 
    ? service.bulletPoints 
    : serviceFeatures.length > 0 
      ? serviceFeatures.slice(0, 4).map((f: any) => `${f.name}: ${f.value}`)
      : [
          `Professional ${service.name.toLowerCase()} service`,
          'Quality materials and workmanship',
          'Satisfaction guarantee'
        ];

  const renderBulletList = (compact = false) => (
    <ul className={compact ? "space-y-1.5" : "space-y-3"}>
      {bulletPoints.slice(0, compact ? 3 : 4).map((point: string, index: number) => (
        <li key={index} className="flex items-center gap-2">
          <span 
            className="ab-pricing-card-bullet-icon flex-shrink-0 rounded-full flex items-center justify-center"
            style={hasCustomCSS ? {} : { 
              backgroundColor: styling.pricingBulletIconColor || styling.primaryColor || '#3B82F6',
              width: `${compact ? 16 : (styling.pricingBulletIconSize || 20)}px`,
              height: `${compact ? 16 : (styling.pricingBulletIconSize || 20)}px`
            }}
          >
            <svg 
              className="text-white" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ 
                width: `${(compact ? 16 : (styling.pricingBulletIconSize || 20)) * 0.6}px`, 
                height: `${(compact ? 16 : (styling.pricingBulletIconSize || 20)) * 0.6}px` 
              }}
            >
              {renderBulletIconFn(styling.pricingBulletIconType || 'checkmark')}
            </svg>
          </span>
          <span className={`ab-pricing-card-bullet-text ${compact ? 'text-xs' : 'text-sm'} font-medium`} style={hasCustomCSS ? {} : { color: styling.textColor || '#1F2937' }}>
            {point}
          </span>
        </li>
      ))}
    </ul>
  );

  switch (layout) {
    case 'modern':
      return (
        <div className="relative p-6 text-center">
          {/* Large Price Display at Top */}
          <div 
            className="ab-pricing-card-price text-3xl font-bold mb-4"
            style={hasCustomCSS ? {} : { color: styling.primaryColor || '#2563EB' }}
          >
            {hasPricingIssue ? 'Error' : `$${displayPrice.toLocaleString()}`}
          </div>
          
          {/* Centered Icon */}
          {componentStyles.pricingCard?.showServiceIcon !== false && service.iconUrl && (
            <div className="flex justify-center mb-3">
              <img 
                src={service.iconUrl} 
                alt={service.name}
                className="ab-pricing-card-icon w-16 h-16 object-cover rounded-full border-4 flex-shrink-0"
                style={hasCustomCSS ? {} : { borderColor: `${styling.primaryColor || '#2563EB'}30` }}
              />
            </div>
          )}
          
          {/* Service Title */}
          <h4 
            className="ab-pricing-card-title text-xl font-bold mb-2"
            style={hasCustomCSS ? {} : { color: styling.textColor || '#1F2937' }}
          >
            {service.name}
          </h4>
          
          {/* Divider */}
          <div className="w-16 h-1 mx-auto mb-4 rounded" style={hasCustomCSS ? {} : { backgroundColor: styling.primaryColor || '#2563EB' }} />
          
          {/* Description */}
          <p 
            className="ab-pricing-card-description text-sm mb-4 leading-relaxed"
            style={hasCustomCSS ? {} : { color: styling.textColor ? `${styling.textColor}90` : '#4B5563' }}
          >
            {service.title || service.description || `Professional ${service.name.toLowerCase()} service.`}
          </p>
          
          {/* Features List */}
          <div className="text-left">
            {renderBulletList()}
          </div>
        </div>
      );

    case 'minimal':
      return (
        <div className="relative p-5">
          {/* Header Row with Icon, Title, and Price */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              {componentStyles.pricingCard?.showServiceIcon !== false && service.iconUrl && (
                <img 
                  src={service.iconUrl} 
                  alt={service.name}
                  className="ab-pricing-card-icon w-10 h-10 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <h4 
                className="ab-pricing-card-title text-lg font-semibold"
                style={hasCustomCSS ? {} : { color: styling.textColor || '#1F2937' }}
              >
                {service.name}
              </h4>
            </div>
            <div 
              className="ab-pricing-card-price text-xl font-bold px-4 py-1 rounded-full"
              style={hasCustomCSS ? {} : { 
                color: styling.primaryColor || '#2563EB',
                backgroundColor: `${styling.primaryColor || '#2563EB'}15`
              }}
            >
              {hasPricingIssue ? 'Error' : `$${displayPrice.toLocaleString()}`}
            </div>
          </div>
          
          {/* Thin Divider */}
          <div className="border-t mb-4" style={hasCustomCSS ? {} : { borderColor: '#E5E7EB' }} />
          
          {/* Description */}
          <p 
            className="ab-pricing-card-description text-sm mb-4 leading-relaxed"
            style={hasCustomCSS ? {} : { color: styling.textColor ? `${styling.textColor}80` : '#6B7280' }}
          >
            {service.title || service.description || `Professional ${service.name.toLowerCase()} service designed to meet your needs.`}
          </p>
          
          {/* Inline Features */}
          <div className="flex flex-wrap gap-2">
            {bulletPoints.slice(0, 3).map((point: string, index: number) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={hasCustomCSS ? {} : { 
                  backgroundColor: `${styling.primaryColor || '#3B82F6'}10`,
                  color: styling.textColor || '#1F2937'
                }}
              >
                <span
                  className="ab-pricing-card-bullet-icon flex-shrink-0 rounded-full flex items-center justify-center"
                  style={hasCustomCSS ? {} : {
                    backgroundColor: styling.pricingBulletIconColor || styling.primaryColor || '#3B82F6',
                    width: '14px',
                    height: '14px'
                  }}
                >
                  <svg
                    className="text-white"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: '9px', height: '9px' }}
                  >
                    {renderBulletIconFn(styling.pricingBulletIconType || 'checkmark')}
                  </svg>
                </span>
                <span className="ab-pricing-card-bullet-text">
                  {point.length > 30 ? point.substring(0, 30) + '...' : point}
                </span>
              </span>
            ))}
          </div>
        </div>
      );

    case 'compact':
      return (
        <div className="relative p-4">
          {/* Compact Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {componentStyles.pricingCard?.showServiceIcon !== false && service.iconUrl && (
                <img 
                  src={service.iconUrl} 
                  alt={service.name}
                  className="ab-pricing-card-icon w-8 h-8 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h4 
                  className="ab-pricing-card-title text-base font-semibold truncate"
                  style={hasCustomCSS ? {} : { color: styling.textColor || '#1F2937' }}
                >
                  {service.name}
                </h4>
              </div>
            </div>
            <div 
              className="ab-pricing-card-price text-lg font-bold flex-shrink-0"
              style={hasCustomCSS ? {} : { color: styling.primaryColor || '#2563EB' }}
            >
              {hasPricingIssue ? 'Err' : `$${displayPrice.toLocaleString()}`}
            </div>
          </div>
          
          {/* Brief Description */}
          <p 
            className="ab-pricing-card-description text-xs mb-3 line-clamp-2"
            style={hasCustomCSS ? {} : { color: styling.textColor ? `${styling.textColor}70` : '#6B7280' }}
          >
            {service.title || service.description || `Professional ${service.name.toLowerCase()} service.`}
          </p>
          
          {/* Compact Features */}
          {renderBulletList(true)}
        </div>
      );

    case 'classic':
    default:
      return (
        <div 
          className="relative p-5 pt-10"
          style={hasCustomCSS ? {} : {
            backgroundColor: hexToRgba(
              componentStyles.pricingCard?.backgroundColor || '#FFFFFF',
              Math.max(0, (componentStyles.pricingCard?.backgroundColorAlpha ?? 100) - 85)
            ),
            borderRadius: `${Math.max(0, (componentStyles.pricingCard?.borderRadius || 16) - 4)}px`
          }}
        >
          {/* Price positioned absolutely at top-right */}
          <div 
            className="ab-pricing-card-price absolute top-0 right-0 flex items-center px-3 py-2 text-xl font-semibold ml-[0px] mr-[0px] mt-[-5px] mb-[-5px]"
            style={hasCustomCSS ? {} : {
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
            {componentStyles.pricingCard?.showServiceIcon !== false && service.iconUrl && (
              <img 
                src={service.iconUrl} 
                alt={service.name}
                className="ab-pricing-card-icon w-12 h-12 object-cover rounded-lg flex-shrink-0"
              />
            )}
            
            <h4 
              className="ab-pricing-card-title text-xl font-semibold"
              style={hasCustomCSS ? {} : { color: styling.textColor || '#1F2937' }}
            >
              {service.name}
            </h4>
          </div>

          {/* Description */}
          <p 
            className="ab-pricing-card-description text-sm mb-4 leading-relaxed"
            style={hasCustomCSS ? {} : { color: styling.textColor ? `${styling.textColor}90` : '#4B5563' }}
          >
            {service.title || service.description || `Professional ${service.name.toLowerCase()} service designed to meet your specific needs with quality materials and expert craftsmanship.`}
          </p>

          {/* Features List */}
          <div className="mb-5">
            {renderBulletList()}
          </div>
        </div>
      );
  }
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

export default function StyledCalculator(props: any = {}) {
  const { formula: propFormula, isCallScreenMode = false } = props;
  const search = useSearch();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  // Get URL parameters first
  const searchParams = new URLSearchParams(search);
  const userId = searchParams.get('userId');
  const queryServiceIds = searchParams.get('serviceIds');
  const customFormServiceFilterIds = queryServiceIds
    ? queryServiceIds.split(',').map((id) => Number(id.trim())).filter((id) => Number.isFinite(id))
    : [];
  const isPublicAccess = !!userId;

  // Debug: Log auth state
  console.log('[styled-calculator] Auth state:', {
    authUser: authUser ? `id=${authUser.id}, email=${authUser.email}` : 'null',
    userId,
    isPublicAccess,
    queryEnabled: !!authUser && !isPublicAccess
  });
  
  // Determine effective business owner ID - use URL param for public access, or authenticated user ID
  const effectiveBusinessOwnerId = isPublicAccess ? userId : authUser?.id;
  
  // Call screen specific params
  const skipLead = searchParams.get('skipLead') === 'true';
  const prefillLeadId = searchParams.get('leadId');
  const prefillName = searchParams.get('prefillName');
  const prefillEmail = searchParams.get('prefillEmail');
  const prefillPhone = searchParams.get('prefillPhone');
  const prefillAddress = searchParams.get('prefillAddress');

  // Single service embed mode - only show one specific service
  const singleServiceId = searchParams.get('serviceId') || searchParams.get('formulaId');
  const isSingleServiceMode = !!singleServiceId;
  
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [cartServiceIds, setCartServiceIds] = useState<number[]>([]); // Services added to cart for checkout

  // Toggle a service in/out of the cart
  const toggleServiceInCart = (serviceId: number) => {
    setCartServiceIds(prev => {
      if (prev.includes(serviceId)) {
        // Don't allow removing last service from cart
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  };

  const [serviceVariables, setServiceVariables] = useState<Record<number, Record<string, any>>>({});
  const [serviceCalculations, setServiceCalculations] = useState<Record<number, number>>({});
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());
  const [leadForm, setLeadForm] = useState<LeadFormData>({ 
    name: prefillName || "", 
    email: prefillEmail || "", 
    phone: prefillPhone || "",
    address: prefillAddress || "",
    notes: "",
    howDidYouHear: "",
    permissionToContact: false,
    uploadedImages: []
  });
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  
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
  const [currentStep, setCurrentStep] = useState<"selection" | "address" | "configuration" | "contact" | "pricing" | "scheduling">("selection");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyAttributes, setPropertyAttributes] = useState<PropertyAttributes>({});
  const [propertySnapshotId, setPropertySnapshotId] = useState<number | null>(null);
  const [isResolvingProperty, setIsResolvingProperty] = useState(false);
  const [propertyAutofillSkipped, setPropertyAutofillSkipped] = useState(false);
  const [prefilledFields, setPrefilledFields] = useState<Record<string, string>>({});
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  // Call screen mode state
  const [callScreenLeadMode, setCallScreenLeadMode] = useState<"select" | "new">("select");
  const [selectedLeadOption, setSelectedLeadOption] = useState<"existing" | "new" | "skip">("new");
  const [selectedCallScreenLeadId, setSelectedCallScreenLeadId] = useState<number | null>(null);
  const [selectedCallScreenLeadType, setSelectedCallScreenLeadType] = useState<"single" | "multi">("single");
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const isSubmittingLeadRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);

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
      return fetch(`/api/public/calculator-data?${params}`, { credentials: 'include' }).then(res => res.json());
    },
    enabled: !!userId || (isCustomForm && !!embedId),
    staleTime: 30 * 1000, // Cache for 30 seconds to avoid redundant requests
    gcTime: 60 * 1000, // Keep in garbage collection cache for 60 seconds
  });

  // Fetch authenticated user's data (for logged-in users viewing their own calculator)
  const { data: authenticatedData, isLoading: isLoadingAuthData, error: authDataError } = useQuery({
    queryKey: ['/api/public/calculator-data', 'authenticated', authUser?.id],
    queryFn: async () => {
      console.log('[styled-calculator] Fetching authenticated calculator data for user:', authUser?.id);
      const res = await fetch('/api/public/calculator-data', { credentials: 'include' });
      const data = await res.json();
      console.log('[styled-calculator] Response:', res.status, data);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch calculator data');
      }
      return data;
    },
    enabled: !!authUser && !isPublicAccess,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
  });

  // Use authenticated data when logged in and not in public access mode
  const useAuthenticatedData = !!authUser && !isPublicAccess;
  
  // Extract data from combined response - prioritize authenticated data when logged in
  const allFormulas = useAuthenticatedData
    ? (authenticatedData?.formulas || [])
    : (calculatorData?.formulas || []);

  // Filter to single service if in single service embed mode
  const formulas = useMemo(() => {
    if (customFormServiceFilterIds.length > 0) {
      const filtered = allFormulas.filter((f: Formula) => customFormServiceFilterIds.includes(Number(f.id)));
      return filtered.length > 0 ? filtered : allFormulas;
    }
    if (isSingleServiceMode && singleServiceId) {
      const serviceIdNum = parseInt(singleServiceId, 10);
      const filtered = allFormulas.filter((f: Formula) => f.id === serviceIdNum);
      return filtered.length > 0 ? filtered : allFormulas;
    }
    return allFormulas;
  }, [allFormulas, customFormServiceFilterIds, isSingleServiceMode, singleServiceId]);
  const businessSettings = useAuthenticatedData
    ? (authenticatedData?.businessSettings || null)
    : (calculatorData?.businessSettings || null);
  const designSettings = useAuthenticatedData
    ? (authenticatedData?.designSettings || null)
    : (calculatorData?.designSettings || null);
  const customForm = calculatorData?.customForm || null;
  const showAutobidderBranding = isCallScreenMode
    ? false  // Don't show branding in call screen mode
    : useAuthenticatedData
      ? (authenticatedData?.showAutobidderBranding || false)
      : (calculatorData?.showAutobidderBranding || false);
  
  // Fetch leads for call screen mode (only when in call screen mode)
  const { data: singleLeads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    enabled: isCallScreenMode && !isPublicAccess,
  });

  // Fetch multi-service leads for call screen mode
  const { data: multiServiceLeads = [] } = useQuery<any[]>({
    queryKey: ['/api/multi-service-leads'],
    enabled: isCallScreenMode && !isPublicAccess,
  });

  // Combine and normalize leads for search
  const allLeads = useMemo(() => {
    const single = singleLeads.map(lead => ({
      ...lead,
      leadType: 'single' as const,
      displayName: lead.name || 'Unknown',
      displayEmail: lead.email || '',
      displayPhone: lead.phone || '',
      displayAddress: lead.address || '',
    }));
    const multi = multiServiceLeads.map((lead: any) => ({
      ...lead,
      leadType: 'multi' as const,
      displayName: lead.name || 'Unknown',
      displayEmail: lead.email || '',
      displayPhone: lead.phone || '',
      displayAddress: lead.address || '',
    }));
    return [...single, ...multi].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [singleLeads, multiServiceLeads]);

  // Filter leads based on search term
  const filteredLeads = useMemo(() => {
    if (!leadSearchTerm.trim()) return allLeads;
    const term = leadSearchTerm.toLowerCase();
    return allLeads.filter(lead =>
      lead.displayName.toLowerCase().includes(term) ||
      lead.displayEmail.toLowerCase().includes(term) ||
      lead.displayPhone.toLowerCase().includes(term) ||
      lead.displayAddress.toLowerCase().includes(term)
    );
  }, [allLeads, leadSearchTerm]);

  // Keep backwards compatibility
  const leads = singleLeads;

  // Get the user ID for data fetching (from URL param or custom form)
  const effectiveUserId = isCustomForm && customForm ? customForm.userId : userId;
  const effectiveIsPublicAccess = !!effectiveUserId;

  // Session tracking state
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [sessionTracked, setSessionTracked] = useState(false);
  const [pageViewTracked, setPageViewTracked] = useState(false);

  // Track calculator session when calculator loads (for stats)
  useEffect(() => {
    // Only track if we have formulas and haven't tracked yet
    if (!formulas || formulas.length === 0 || sessionTracked || isCallScreenMode) return;

    const trackSession = async () => {
      try {
        // Track sessions for all active formulas
        for (const formula of formulas) {
          await fetch('/api/calculator-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              formulaId: formula.id,
              sessionId: `${formula.id}-${sessionId}`,
              referrer: document.referrer || null,
              totalSteps: formula.variables?.length || 1
            })
          });
        }
        setSessionTracked(true);
      } catch (error) {
        // Silent fail - don't disrupt user experience
        console.log('Session tracking failed:', error);
      }
    };

    trackSession();
  }, [formulas, sessionId, sessionTracked, isCallScreenMode]);

  // Track page view when page loads (for stats)
  useEffect(() => {
    // Only track if we have a userId and haven't tracked yet
    if (!effectiveUserId || pageViewTracked || isCallScreenMode) return;

    const trackPageView = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        await fetch('/api/page-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formulaId: formulas?.[0]?.id || null,
            userId: effectiveUserId,
            sessionId: sessionId,
            pageType: isCustomForm ? 'custom_form' : 'calculator',
            utmSource: urlParams.get('utm_source'),
            utmMedium: urlParams.get('utm_medium'),
            utmCampaign: urlParams.get('utm_campaign')
          })
        });
        setPageViewTracked(true);
      } catch (error) {
        // Silent fail
        console.log('Page view tracking failed:', error);
      }
    };

    trackPageView();
  }, [effectiveUserId, pageViewTracked, sessionId, formulas, isCustomForm, isCallScreenMode]);

  // Track step progress for analytics
  useEffect(() => {
    if (!formulas || formulas.length === 0 || !sessionTracked || isCallScreenMode) return;

    // Map step names to step numbers
    const stepMap: Record<string, number> = {
      selection: 1,
      address: 2,
      configuration: 3,
      contact: 4,
      pricing: 5,
      scheduling: 6
    };

    const stepNumber = stepMap[currentStep] || 1;

    const trackStepProgress = async () => {
      try {
        for (const formula of formulas) {
          await fetch(`/api/calculator-sessions/${formula.id}-${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lastStepReached: stepNumber,
              // Mark completed if they reach pricing or scheduling
              completed: stepNumber >= 4 ? true : undefined
            })
          });
        }
      } catch (error) {
        // Silent fail
        console.log('Step tracking failed:', error);
      }
    };

    trackStepProgress();
  }, [currentStep, formulas, sessionId, sessionTracked, isCallScreenMode]);

  // Use provided formula or first available formula
  const formula = propFormula || (formulas && formulas.length > 0 ? formulas[0] : null);

  // Submit lead mutation
  const submitMultiServiceLeadMutation = useMutation({
    retry: false,
    mutationFn: async (data: {
      services: ServiceCalculation[];
      totalPrice: number;
      leadInfo: LeadFormData;
      distanceInfo?: {
        distance: number;
        fee: number;
        distanceFee?: number;
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
      taxAmount?: number;
      subtotal?: number;
      photoMeasurements?: any[];
      submissionId?: string;
    }) => {
      const payload = {
        name: data.leadInfo.name,
        email: data.leadInfo.email,
        phone: data.leadInfo.phone,
        address: data.leadInfo.address,
        notes: data.leadInfo.notes,
        howDidYouHear: data.leadInfo.howDidYouHear,
        uploadedImages: data.leadInfo.uploadedImages || [],
        services: data.services,
        totalPrice: data.totalPrice,
        photoMeasurements: data.photoMeasurements,
        distanceInfo: data.distanceInfo,
        appliedDiscounts: data.appliedDiscounts,
        bundleDiscountAmount: data.bundleDiscountAmount,
        selectedUpsells: data.selectedUpsells,
        taxAmount: data.taxAmount,
        subtotal: data.subtotal,
        businessOwnerId: isPublicAccess ? userId : undefined,
        submissionId: data.submissionId,
      };
      
      // Use the same endpoint for both public and authenticated access
      return apiRequest("POST", "/api/multi-service-leads", payload);
    },
    onSuccess: async (response: Response, variables) => {
      const data = await response.json();

      // Invalidate leads cache to ensure new lead appears
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });

      // Store the lead ID for booking
      if (data?.id) {
        setSubmittedLeadId(data.id);
      }

      // Clear photo measurements after successful submission
      setPhotoMeasurements([]);

      // Facebook Hybrid Tracking: Send Lead event via client-side postMessage + server-side CAPI
      const fbConfig = businessSettings?.facebookTracking;
      if (fbConfig?.enabled && fbConfig?.pixelId && effectiveBusinessOwnerId) {
        // Generate unique event ID for deduplication between Pixel and CAPI
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        const leadValue = (variables.totalPrice || 0) / 100; // Convert cents to dollars

        // 1. PostMessage to parent window for client-side Pixel tracking (for embedded iframes)
        if (window.parent !== window) {
          try {
            window.parent.postMessage({
              type: 'AUTOBIDDER_CONVERSION',
              event_id: eventId,
              pixel_id: fbConfig.pixelId,
              value: leadValue,
              currency: 'USD'
            }, '*');
          } catch (err) {
            console.log('[FB Tracking] PostMessage failed:', err);
          }
        }

        // 2. Server-side CAPI call for improved attribution
        try {
          await fetch('/api/facebook-capi/track-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessOwnerId: effectiveBusinessOwnerId,
              eventId,
              userData: {
                email: variables.leadInfo.email,
                phone: variables.leadInfo.phone,
                firstName: variables.leadInfo.name?.split(' ')[0],
                lastName: variables.leadInfo.name?.split(' ').slice(1).join(' '),
                clientUserAgent: navigator.userAgent,
              },
              customData: {
                value: leadValue,
                currency: 'USD',
              },
            }),
          });
        } catch (err) {
          console.log('[FB CAPI] Server-side tracking failed:', err);
        }
      }

      // Mark sessions as converted (for stats tracking)
      if (formulas && formulas.length > 0) {
        try {
          for (const formula of formulas) {
            await fetch(`/api/calculator-sessions/${formula.id}-${sessionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ converted: true, completed: true })
            });
          }
        } catch (error) {
          // Silent fail
          console.log('Session conversion tracking failed:', error);
        }
      }
    },
    onError: (error: any) => {
      console.error("Failed to submit quote request:", error);
      if (error?.message?.includes("Access denied") || error?.message?.includes("unable to process")) {
        toast({
          title: "Unable to process request",
          description: "Please contact support if this continues.",
          variant: "destructive",
        });
      }
      isSubmittingLeadRef.current = false;
      submissionIdRef.current = null;
    },
  });

  // Create estimate for existing lead mutation
  const createEstimateForLeadMutation = useMutation({
    mutationFn: async (data: {
      leadId: number;
      leadType: "single" | "multi";
      services: ServiceCalculation[];
      totalPrice: number;
      leadInfo: LeadFormData;
      distanceInfo?: { distance: number; fee: number; message: string };
      appliedDiscounts?: Array<{ id: string; name: string; percentage: number; amount: number }>;
      bundleDiscountAmount?: number;
      selectedUpsells?: Array<{ id: string; name: string; percentage: number; amount: number }>;
      taxAmount?: number;
    }) => {
      const estimateNumber = `EST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Convert services to estimate format
      const estimateServices = data.services.map(service => ({
        name: service.formulaName,
        description: `Service configuration`,
        price: service.calculatedPrice, // Already in cents
        category: "Service",
        variables: service.variables
      }));

      const estimateData = {
        leadId: data.leadType === 'single' ? data.leadId : undefined,
        multiServiceLeadId: data.leadType === 'multi' ? data.leadId : undefined,
        estimateNumber,
        customerName: data.leadInfo.name,
        customerEmail: data.leadInfo.email,
        customerPhone: data.leadInfo.phone || undefined,
        customerAddress: data.leadInfo.address || undefined,
        services: estimateServices,
        subtotal: data.services.reduce((sum, s) => sum + s.calculatedPrice, 0),
        totalAmount: data.totalPrice,
        appliedDiscounts: data.appliedDiscounts,
        bundleDiscountAmount: data.bundleDiscountAmount,
        distanceInfo: data.distanceInfo,
        taxAmount: data.taxAmount,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      return apiRequest("POST", "/api/estimates", estimateData);
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      // Invalidate the specific lead's estimates to update the customer modal
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${variables.leadId}/estimates`] });
      }
    },
    onError: (error: any) => {
      console.error("Failed to create estimate:", error);
    },
  });

  // Mutation to update lead with pricing selections (discounts, upsells) after they're selected on pricing page
  const updateLeadPricingMutation = useMutation({
    mutationFn: async (data: {
      leadId: number;
      appliedDiscounts: Array<{ id: string; name: string; percentage: number; amount: number }>;
      selectedUpsells: Array<{ id: string; name: string; percentage: number; amount: number }>;
      bundleDiscountAmount: number;
      taxAmount: number;
      subtotal: number;
      totalPrice: number;
    }) => {
      return apiRequest("PATCH", `/api/multi-service-leads/${data.leadId}/pricing-selections`, {
        appliedDiscounts: data.appliedDiscounts,
        selectedUpsells: data.selectedUpsells,
        bundleDiscountAmount: data.bundleDiscountAmount,
        taxAmount: data.taxAmount,
        subtotal: data.subtotal,
        totalPrice: data.totalPrice,
      });
    },
    onSuccess: async (response: Response) => {
      const data = await response.json();
      console.log('Lead pricing selections updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
    },
    onError: (error: any) => {
      console.error("Failed to update lead pricing selections:", error);
    },
  });

  // Sync cart with selections - all selected services start in the cart by default
  useEffect(() => {
    const isCartEnabled = businessSettings?.enableServiceCart === true;
    const hasMultipleServices = selectedServices.length > 1;

    // Auto-sync cart when cart feature is disabled or only one service selected
    if (!isCartEnabled || !hasMultipleServices) {
      setCartServiceIds(selectedServices);
    }
    // When cart is enabled with multiple services:
    // - Add any newly selected services to the cart
    // - Remove any deselected services from the cart
    else {
      setCartServiceIds(prev => {
        // Find services that were deselected (in cart but not in selectedServices)
        const stillSelected = prev.filter(id => selectedServices.includes(id));
        // Find newly selected services (in selectedServices but not in cart)
        const newlySelected = selectedServices.filter(id => !prev.includes(id));
        // Combine: keep services that are still selected + add newly selected ones
        return [...stillSelected, ...newlySelected];
      });
    }
  }, [selectedServices, businessSettings?.enableServiceCart]);

  // Single service mode: auto-select the service and skip to configuration
  const [singleServiceInitialized, setSingleServiceInitialized] = useState(false);
  useEffect(() => {
    if (isSingleServiceMode && formulas.length === 1 && !singleServiceInitialized) {
      const serviceId = formulas[0].id;
      setSelectedServices([serviceId]);
      setCartServiceIds([serviceId]);
      setExpandedServices(new Set([serviceId]));
      // Check if address step should show for this single service
      const hasPropertyMappings = businessSettings?.styling?.enablePropertyAutofill &&
        formulas[0].variables?.some((v: any) => v.prefillSourceKey);
      setCurrentStep(hasPropertyMappings ? "address" : "configuration");
      setSingleServiceInitialized(true);
    }
  }, [isSingleServiceMode, formulas, singleServiceInitialized]);

  // Pre-fill connected variables when services are selected
  // This ensures that when a user selects a new service, any variables with matching
  // connectionKey values get pre-populated from already-answered variables in other services
  useEffect(() => {
    if (selectedServices.length < 2 || !formulas) return;

    // Build connection map for selected services
    const connectionMap: Record<string, Array<{ serviceId: number; variableId: string }>> = {};
    selectedServices.forEach(serviceId => {
      const service = formulas?.find((f: Formula) => f.id === serviceId);
      service?.variables?.forEach((variable: any) => {
        if (variable.connectionKey) {
          if (!connectionMap[variable.connectionKey]) {
            connectionMap[variable.connectionKey] = [];
          }
          connectionMap[variable.connectionKey].push({
            serviceId,
            variableId: variable.id
          });
        }
      });
    });

    setServiceVariables(prev => {
      const updated = { ...prev };
      let hasChanges = false;

      Object.entries(connectionMap).forEach(([connectionKey, variables]) => {
        // Only process if there are multiple services with this connection key
        if (variables.length < 2) return;

        // Find first answered value for this connectionKey
        const existingAnswer = variables.find(({ serviceId, variableId }) =>
          prev[serviceId]?.[variableId] !== undefined && prev[serviceId]?.[variableId] !== ''
        );

        if (existingAnswer) {
          const value = prev[existingAnswer.serviceId][existingAnswer.variableId];
          // Apply to all unanswered variables with same connectionKey
          variables.forEach(({ serviceId, variableId }) => {
            if (updated[serviceId]?.[variableId] === undefined || updated[serviceId]?.[variableId] === '') {
              updated[serviceId] = {
                ...updated[serviceId],
                [variableId]: value
              };
              hasChanges = true;
            }
          });
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [selectedServices, formulas]);

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
      const service = formulas?.find((f: any) => f.id === serviceId);
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

  // Update lead with pricing selections when discounts/upsells change on pricing page
  useEffect(() => {
    console.log('Pricing selections useEffect triggered:', {
      currentStep,
      submittedLeadId,
      selectedDiscounts,
      selectedUpsells
    });

    // Only run when on pricing page with a submitted lead
    if (currentStep !== 'pricing' || !submittedLeadId) {
      console.log('Skipping update - conditions not met:', { currentStep, submittedLeadId });
      return;
    }

    // Debounce the update to avoid too many API calls
    const timeoutId = setTimeout(() => {
      console.log('Debounce timeout fired, preparing update...');
      // Calculate current pricing with selections
      const subtotal = cartServiceIds.reduce((sum, serviceId) => sum + Math.max(0, serviceCalculations[serviceId] || 0), 0);
      const bundleDiscount = (businessSettings?.styling?.showBundleDiscount && cartServiceIds.length > 1)
        ? Math.round(subtotal * ((businessSettings.styling.bundleDiscountPercent || 0) / 100))
        : 0;

      // Get applied discounts
      const appliedDiscountData = businessSettings?.discounts
        ?.filter((d: any) => d.isActive && selectedDiscounts.includes(d.id))
        ?.map((discount: any) => ({
          id: discount.id,
          name: discount.name,
          percentage: discount.percentage,
          amount: Math.round(subtotal * (discount.percentage / 100) * 100)
        })) || [];

      // Get upsell amounts
      const allUpsells = cartServiceIds.reduce((acc: any[], serviceId) => {
        const service = formulas?.find((f: any) => f.id === serviceId);
        if (service?.upsellItems) {
          acc.push(...service.upsellItems);
        }
        return acc;
      }, []);

      const selectedUpsellData = allUpsells
        ?.filter((u: any) => selectedUpsells.includes(u.id))
        ?.map((upsell: any) => ({
          id: upsell.id,
          name: upsell.name,
          percentage: upsell.percentageOfMain,
          amount: Math.round(subtotal * (upsell.percentageOfMain / 100) * 100)
        })) || [];

      const customerDiscountAmount = appliedDiscountData.reduce((sum: number, d: any) => sum + d.amount, 0) / 100;
      const upsellTotal = selectedUpsellData.reduce((sum, u) => sum + u.amount, 0) / 100;
      const discountedSubtotal = subtotal - bundleDiscount - customerDiscountAmount + upsellTotal;

      const taxAmount = businessSettings?.styling?.enableSalesTax
        ? Math.round(discountedSubtotal * ((businessSettings.styling.salesTaxRate || 0) / 100))
        : 0;
      const totalPrice = discountedSubtotal + taxAmount;

      // Update the lead with current selections
      const updatePayload = {
        leadId: submittedLeadId,
        appliedDiscounts: appliedDiscountData,
        selectedUpsells: selectedUpsellData,
        bundleDiscountAmount: Math.round(bundleDiscount * 100),
        taxAmount: Math.round(taxAmount * 100),
        subtotal: Math.round(subtotal * 100),
        totalPrice: Math.round(totalPrice * 100),
      };
      console.log('Updating lead with pricing selections:', updatePayload);
      updateLeadPricingMutation.mutate(updatePayload);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [currentStep, submittedLeadId, selectedDiscounts, selectedUpsells, cartServiceIds, serviceCalculations, businessSettings, formulas]);

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
        
        #autobidder-form .ab-service-card:hover:where(:not(.selected)) {
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

        #autobidder-form .ab-calendar-container {
          background-color: var(--ab-calendar-container-bg, var(--ab-question-card-bg, #FFFFFF));
        }
        
        /* Form container styles */
        #autobidder-form.ab-form-container {
          background: var(--ab-background-color, transparent);
          border-radius: var(--ab-container-border-radius, 16px);
          padding: var(--ab-container-padding, 8px);
          margin: var(--ab-container-margin, 0px);
          box-shadow: var(--ab-container-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
          border-width: var(--ab-container-border-width, 0px);
          border-color: var(--ab-container-border-color, #E5E7EB);
          border-style: solid;
        }
        
        /* Question label styles */
        #autobidder-form .ab-label,
        #autobidder-form .ab-question-label {
          color: var(--ab-label-color, #374151);
          font-family: var(--ab-label-font-family, 'Inter, sans-serif');
          font-weight: var(--ab-label-font-weight, 500);
          font-size: var(--ab-label-font-size, 0.875rem);
        }
        
        /* Service title styles */
        #autobidder-form .ab-service-title {
          color: var(--ab-service-title-color, #374151);
          font-family: var(--ab-service-title-font-family, 'Inter, sans-serif');
          font-weight: var(--ab-service-title-font-weight, 900);
          font-size: var(--ab-service-title-font-size, 0.875rem);
        }

        #autobidder-form .ab-service-accordion-text {
          color: var(--ab-service-accordion-text-color, inherit);
        }
        
        /* Pricing card styles */
        #autobidder-form .ab-pricing-card {
          background-color: var(--ab-pricing-card-bg, #FFFFFF);
          border-radius: var(--ab-pricing-card-border-radius, 16px);
          border-color: var(--ab-pricing-card-border-color, #E5E7EB);
          border-width: var(--ab-pricing-card-border-width, 1px);
          border-style: solid;
          box-shadow: var(--ab-pricing-card-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
          padding: var(--ab-pricing-card-padding, 10px);
        }
        
        #autobidder-form .ab-pricing-card.pricing-card:hover {
          transform: var(--ab-pricing-card-hover-transform, none);
        }
        
        /* Pricing card child element styles */
        #autobidder-form .ab-pricing-card-price {
          background-color: var(--ab-pricing-card-price-bg, transparent);
          color: var(--ab-pricing-card-price-color, inherit);
        }
        
        #autobidder-form .ab-pricing-card-title {
          color: var(--ab-pricing-card-title-color, inherit);
          font-family: var(--ab-pricing-card-title-font-family, inherit);
          font-weight: var(--ab-pricing-card-title-font-weight, inherit);
        }
        
        #autobidder-form .ab-pricing-card-description {
          color: var(--ab-pricing-card-description-color, inherit);
        }
        
        #autobidder-form .ab-pricing-card-bullet-icon {
          background-color: var(--ab-pricing-card-bullet-icon-bg, inherit);
        }
        
        #autobidder-form .ab-pricing-card-bullet-text {
          color: var(--ab-pricing-card-bullet-text-color, inherit);
        }

        /* Progress bar styles */
        #autobidder-form .ab-progress-label {
          color: var(--ab-label-color, #374151);
        }

        #autobidder-form .ab-progress-percentage {
          color: var(--ab-primary-color, #2563EB);
        }

        #autobidder-form .ab-progress-track {
          background-color: var(--ab-progress-track-bg, #E5E7EB);
          height: var(--ab-progress-track-height, 8px);
          border-radius: 9999px;
          overflow: hidden;
        }

        #autobidder-form .ab-progress-fill {
          background-color: var(--ab-primary-color, #2563EB);
        }

        #autobidder-form .ab-address-nav-button {
          color: var(--ab-primary-color, #2563EB);
        }
        
        /* Slider styles */
        #autobidder-form .ab-slider {
          height: var(--slider-height, 8px);
        }
        
        #autobidder-form .ab-slider [role="slider"] {
          background-color: var(--slider-thumb-bg, #2563EB);
          border-radius: var(--slider-thumb-border-radius, 50%);
          width: var(--slider-thumb-size, 16px);
          height: var(--slider-thumb-size, 16px);
        }
        
        #autobidder-form .ab-slider-value {
          color: var(--ab-slider-value-color, inherit);
        }
        
        #autobidder-form .ab-slider-unit {
          color: var(--ab-slider-unit-color, inherit);
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
        
        // If selector already includes the root, don't double-prefix
        if (selector.includes('#autobidder-form')) return selector;

        // Ensure .ab-form-container targets the root element (it IS the root)
        if (selector.includes('.ab-form-container')) {
          return selector.replace(/\.ab-form-container/g, '#autobidder-form.ab-form-container');
        }

        return selector
          .split(',')
          .map(s => {
            const sel = s.trim();
            
            // Special case: .ab-form-container IS the #autobidder-form element
            if (sel === '.ab-form-container' || sel.startsWith('.ab-form-container:') || sel.startsWith('.ab-form-container.')) {
              // Replace .ab-form-container with #autobidder-form.ab-form-container
              return sel.replace('.ab-form-container', '#autobidder-form.ab-form-container');
            }
            
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

  // Determine if address step should be shown
  const shouldShowAddressStep = useMemo(() => {
    if (!businessSettings?.styling?.enablePropertyAutofill) return false;
    return selectedServices.some(serviceId => {
      const formula = formulas?.find((f: Formula) => f.id === serviceId);
      return formula?.variables?.some((v: any) => v.prefillSourceKey);
    });
  }, [selectedServices, formulas, businessSettings]);

  // Check loading state for both public and authenticated data
  const isLoading = isLoadingCalculatorData || isLoadingAuthData;
  
  if (isLoading) {
    return (
      <div className="force-light-mode max-w-3xl mx-auto p-3 sm:p-6">
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/40 shadow-sm">
          <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />
          <div className="p-4 sm:p-6 animate-pulse">
            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 mb-4" />
            <div className="h-7 bg-amber-100 rounded-md w-52 mb-2" />
            <div className="h-4 bg-amber-100/80 rounded-md w-72 max-w-full mb-6" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-amber-200/60 bg-white/85 p-3"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 mb-3" />
                  <Skeleton className="h-3 w-16 mb-2 bg-amber-100" />
                  <Skeleton className="h-2.5 w-10 bg-amber-100/80" />
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-32 bg-amber-100" />
              <Skeleton className="h-11 w-full rounded-xl bg-amber-100/90" />
              <Skeleton className="h-11 w-full rounded-xl bg-amber-100/90" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!formula) {
    return (
      <div className="force-light-mode max-w-2xl mx-auto p-6 text-center">
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
    // Find the connectionKey for this variable
    const service = formulas?.find((f: Formula) => f.id === serviceId);
    const variable = service?.variables?.find((v: any) => v.id === variableId);
    const connectionKey = variable?.connectionKey;

    setServiceVariables(prev => {
      const updated = {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          [variableId]: value
        }
      };

      // If variable has a connectionKey, sync to all other services with matching key
      if (connectionKey) {
        // Build connection map inline to avoid hook issues
        const connectionMap: Record<string, Array<{ serviceId: number; variableId: string }>> = {};
        selectedServices.forEach(svcId => {
          const svc = formulas?.find((f: Formula) => f.id === svcId);
          svc?.variables?.forEach((v: any) => {
            if (v.connectionKey) {
              if (!connectionMap[v.connectionKey]) {
                connectionMap[v.connectionKey] = [];
              }
              connectionMap[v.connectionKey].push({
                serviceId: svcId,
                variableId: v.id
              });
            }
          });
        });

        const connectedVars = connectionMap[connectionKey] || [];

        connectedVars.forEach(({ serviceId: connectedServiceId, variableId: connectedVarId }) => {
          // Skip the current variable (already updated above)
          if (connectedServiceId === serviceId && connectedVarId === variableId) return;

          updated[connectedServiceId] = {
            ...updated[connectedServiceId],
            [connectedVarId]: value
          };
        });
      }

      return updated;
    });
  };

  // Apply property data prefill to service variables
  const applyPropertyPrefill = (attributes: PropertyAttributes) => {
    const newPrefilledFields: Record<string, string> = {};

    console.log('[PropertyPrefill] Received attributes:', JSON.stringify(attributes));
    console.log('[PropertyPrefill] Selected services:', selectedServices);

    // Collect all prefill values first, then apply in a single state update
    // to avoid stale closure issues when reading serviceVariables
    const prefillUpdates: Array<{ serviceId: number; variableId: string; value: any; connectionKey?: string }> = [];

    selectedServices.forEach(serviceId => {
      const formula = formulas?.find((f: Formula) => f.id === serviceId);
      if (!formula?.variables) {
        console.log(`[PropertyPrefill] Service ${serviceId}: no formula or variables found`);
        return;
      }

      formula.variables.forEach((variable: any) => {
        if (!variable.prefillSourceKey) {
          console.log(`[PropertyPrefill] Variable "${variable.name}" (${variable.id}, type=${variable.type}): no prefillSourceKey set, skipping. connectionKey=${variable.connectionKey || 'none'}`);
          return;
        }
        const attrValue = (attributes as any)[variable.prefillSourceKey];
        console.log(`[PropertyPrefill] Variable "${variable.name}" (${variable.id}, type=${variable.type}): prefillSourceKey="${variable.prefillSourceKey}", attrValue=${attrValue}, connectionKey=${variable.connectionKey || 'none'}`);
        if (attrValue === undefined || attrValue === null) return;

        // Type conversion based on variable type
        let convertedValue: any = attrValue;
        if (['number', 'slider', 'stepper'].includes(variable.type)) {
          convertedValue = typeof attrValue === 'number' ? attrValue : parseFloat(attrValue);
          if (isNaN(convertedValue)) return;
        } else if (['select', 'dropdown'].includes(variable.type) && variable.options) {
          const strValue = String(attrValue).toLowerCase();
          let matchedOption = variable.options.find((opt: any) =>
            String(opt.label).toLowerCase().includes(strValue) ||
            String(opt.value).toLowerCase().includes(strValue) ||
            strValue.includes(String(opt.label).toLowerCase())
          );
          // Story count normalization for options like "One story", "Two stories", etc.
          if (!matchedOption && variable.prefillSourceKey === 'stories') {
            const parsedStories = typeof attrValue === 'number'
              ? attrValue
              : Number.parseFloat(String(attrValue));
            if (Number.isFinite(parsedStories)) {
              const storyCount = Math.round(parsedStories);
              const numberWords: Record<number, string> = {
                1: 'one',
                2: 'two',
                3: 'three',
                4: 'four',
                5: 'five',
                6: 'six',
                7: 'seven',
                8: 'eight',
                9: 'nine',
                10: 'ten',
              };
              const word = numberWords[storyCount];
              const storySignals = [
                `${storyCount} story`,
                `${storyCount} stories`,
                `${storyCount}-story`,
                `${storyCount}story`,
                `${storyCount}st story`,
                `${storyCount}nd story`,
                `${storyCount}rd story`,
                `${storyCount}th story`,
                `story ${storyCount}`,
                `stories ${storyCount}`,
                word ? `${word} story` : '',
                word ? `${word} stories` : '',
                word ? `${word}-story` : '',
                storyCount === 1 ? 'single story' : '',
                storyCount === 2 ? 'double story' : '',
                storyCount === 3 ? 'triple story' : '',
              ].filter(Boolean);

              matchedOption = variable.options.find((opt: any) => {
                const label = String(opt.label || '').toLowerCase();
                const value = String(opt.value || '').toLowerCase();
                const numericValue = Number.parseFloat(String(opt.numericValue ?? ''));
                const multiplier = Number.parseFloat(String(opt.multiplier ?? ''));
                return storySignals.some((signal) => label.includes(signal) || value.includes(signal))
                  || (Number.isFinite(numericValue) && Math.round(numericValue) === storyCount)
                  || (Number.isFinite(multiplier) && Math.round(multiplier) === storyCount);
              });
            }
          }
          if (matchedOption) {
            // Select/Dropdown options are stored/rendered as strings in the UI component.
            convertedValue = String(matchedOption.value);
          } else {
            return;
          }
        } else if (variable.type === 'multiple-choice' && variable.options) {
          // ATTOM strings are often free-form (e.g. "BRICK", "brick veneer", "brick;vinyl").
          // Match against option labels/values and set the multiple-choice value shape expected by the UI.
          const raw = String(attrValue || '').trim().toLowerCase();
          if (!raw) return;

          const tokens = raw
            .split(/[;,/|]+/)
            .map((t: string) => t.trim())
            .filter(Boolean);
          const candidates = tokens.length > 0 ? tokens : [raw];
          const expandedCandidates = [...candidates];
          if (variable.prefillSourceKey === 'stories') {
            const parsedStories = typeof attrValue === 'number'
              ? attrValue
              : Number.parseFloat(String(attrValue));
            if (Number.isFinite(parsedStories)) {
              const storyCount = Math.round(parsedStories);
              const numberWords: Record<number, string> = {
                1: 'one',
                2: 'two',
                3: 'three',
                4: 'four',
                5: 'five',
                6: 'six',
                7: 'seven',
                8: 'eight',
                9: 'nine',
                10: 'ten',
              };
              const word = numberWords[storyCount];
              expandedCandidates.push(
                `${storyCount}`,
                `${storyCount} story`,
                `${storyCount} stories`,
                `${storyCount}-story`,
                `${storyCount}story`,
                `${storyCount}st story`,
                `${storyCount}nd story`,
                `${storyCount}rd story`,
                `${storyCount}th story`,
                `story ${storyCount}`,
                `stories ${storyCount}`,
                ...(word ? [`${word}`, `${word} story`, `${word} stories`, `${word}-story`] : []),
                ...(storyCount === 1 ? ['single', 'single story'] : []),
                ...(storyCount === 2 ? ['double', 'double story'] : []),
                ...(storyCount === 3 ? ['triple', 'triple story'] : [])
              );
            }
          }

          const matchedOptions = variable.options.filter((opt: any) => {
            const label = String(opt.label || '').toLowerCase();
            const value = String(opt.value || '').toLowerCase();
            return expandedCandidates.some((candidate: string) =>
              label === candidate ||
              value === candidate ||
              label.includes(candidate) ||
              value.includes(candidate) ||
              candidate.includes(label) ||
              candidate.includes(value)
            );
          });

          if (matchedOptions.length === 0) return;

          if (variable.allowMultipleSelection) {
            convertedValue = matchedOptions.map((opt: any) => opt.value.toString());
          } else {
            // Keep value shape consistent with EnhancedVariableInput (always string[] for multiple-choice)
            convertedValue = [matchedOptions[0].value.toString()];
          }
        }

        prefillUpdates.push({
          serviceId,
          variableId: variable.id,
          value: convertedValue,
          connectionKey: variable.connectionKey,
        });
        newPrefilledFields[`${serviceId}_${variable.id}`] = variable.prefillSourceKey;
      });
    });

    // Apply all prefill values in a single state update
    console.log('[PropertyPrefill] Total prefill updates to apply:', prefillUpdates.length, prefillUpdates.map(u => `${u.variableId}=${u.value}`));
    if (prefillUpdates.length > 0) {
      setServiceVariables(prev => {
        const updated = { ...prev };

        for (const { serviceId, variableId, value, connectionKey } of prefillUpdates) {
          console.log(`[PropertyPrefill] Setting ${variableId} = ${value} (type: ${typeof value})`);
          updated[serviceId] = {
            ...updated[serviceId],
            [variableId]: value,
          };

          // Propagate via connectionKey to other services
          if (connectionKey) {
            selectedServices.forEach(svcId => {
              const svc = formulas?.find((f: Formula) => f.id === svcId);
              svc?.variables?.forEach((v: any) => {
                if (v.connectionKey === connectionKey && !(svcId === serviceId && v.id === variableId)) {
                  const connExisting = updated[svcId]?.[v.id];
                  if (connExisting === undefined || connExisting === '' || connExisting === 0) {
                    console.log(`[PropertyPrefill] ConnectionKey propagation: setting ${v.id} in service ${svcId} = ${value}`);
                    updated[svcId] = {
                      ...updated[svcId],
                      [v.id]: value,
                    };
                    // Also mark connected variables as prefilled
                    newPrefilledFields[`${svcId}_${v.id}`] = connectionKey;
                  }
                }
              });
            });
          }
        }

        console.log('[PropertyPrefill] Final serviceVariables after prefill:', JSON.stringify(updated));
        return updated;
      });
    } else {
      console.log('[PropertyPrefill] No prefill updates to apply. Check that variables have "Prefill from Property Data" configured (not just Connection Key).');
    }

    setPrefilledFields(newPrefilledFields);
  };

  // Resolve property data from address
  const handlePropertyResolve = async () => {
    if (!propertyAddress.trim()) return;

    setIsResolvingProperty(true);
    try {
      const response = await fetch('/api/property/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: propertyAddress,
          formulaIds: selectedServices,
        }),
      });

      if (!response.ok) throw new Error('Failed to resolve property');

      const data = await response.json();
      const attrs = data.attributes || {};
      const attrCount = Object.keys(attrs).length;
      console.log('[PropertyPrefill] API response - source:', data.source, ', attributes count:', attrCount, ', attributes:', JSON.stringify(attrs));
      setPropertyAttributes(attrs);
      setPropertySnapshotId(data.snapshotId);

      applyPropertyPrefill(attrs);
      setCurrentStep('configuration');
    } catch (error) {
      console.error('Property resolve error:', error);
      setCurrentStep('configuration');
    } finally {
      setIsResolvingProperty(false);
    }
  };

  // Check if a service has all required variables filled
  const isServiceComplete = (serviceId: number) => {
    const service = formulas?.find((f: any) => f.id === serviceId);
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
    const service = formulas?.find((f: any) => f.id === serviceId);
    if (!service) return 0;

    const toOptionId = (rawValue: unknown, fallbackIndex: number): string => {
      const base = String(rawValue ?? '').trim().toLowerCase();
      const normalized = base
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40);
      return normalized || `option_${fallbackIndex}`;
    };

    try {
      let formulaExpression = service.formula;
      const variables = serviceVariables[serviceId] || {};
      
      // First, replace individual option references for multiple-choice with allowMultipleSelection
      service.variables.forEach((variable: any) => {
        if (variable.type === 'multiple-choice' && variable.allowMultipleSelection && variable.options) {
          const selectedValues = Array.isArray(variables[variable.id]) ? variables[variable.id] : [];
          
          variable.options.forEach((option: any, optionIndex: number) => {
            const optionId = toOptionId(option.id ?? option.value, optionIndex + 1);
            if (optionId) {
              const optionReference = `${variable.id}_${optionId}`;
              const isSelected = selectedValues.some((val: any) => val.toString() === option.value.toString());
              // Use defaultUnselectedValue if set, otherwise default to 0 (for addition formulas)
              const unselectedDefault = option.defaultUnselectedValue !== undefined ? option.defaultUnselectedValue : 0;
              const optionValue = isSelected ? (option.numericValue || 0) : unselectedDefault;
              
              formulaExpression = formulaExpression.replace(
                new RegExp(`\\b${optionReference}\\b`, 'g'),
                String(optionValue)
              );
            }
          });
        }
      });
      
      service.variables.forEach((variable: any) => {
        // For multiple-choice with allowMultipleSelection, also handle the variable ID itself (sum of selected values)
        // This is needed when the formula uses variableId directly instead of variableId_optionId
        if (variable.type === 'multiple-choice' && variable.allowMultipleSelection) {
          const selectedValues = Array.isArray(variables[variable.id]) ? variables[variable.id] : [];
          // Calculate sum of selected options' numeric values
          const sumOfSelected = selectedValues.reduce((total: number, selectedValue: any) => {
            const option = variable.options?.find((opt: any) => opt.value.toString() === selectedValue.toString());
            return total + (option?.numericValue || 0);
          }, 0);
          // Replace the variable ID itself with the sum (for formulas that use variableId directly)
          formulaExpression = formulaExpression.replace(
            new RegExp(`\\b${variable.id}\\b`, 'g'),
            String(sumOfSelected)
          );
          return; // Skip the rest of this iteration
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
            const checkedVal = variable.checkedValue !== undefined ? variable.checkedValue : 1;
            const uncheckedVal = variable.uncheckedValue !== undefined ? variable.uncheckedValue : 0;
            value = defaultValue ? checkedVal : uncheckedVal;
          } else if (variable.type === 'select' && variable.options) {
            const option = variable.options.find((opt: any) => opt.value === defaultValue);
            value = option?.multiplier || option?.numericValue || Number(defaultValue) || 0;
          } else if (variable.type === 'dropdown' && variable.options) {
            const option = variable.options.find((opt: any) => opt.value === defaultValue);
            value = option?.numericValue || Number(defaultValue) || 0;
          } else if (variable.type === 'multiple-choice' && variable.options) {
            // For multiple-choice, handle both array and single value defaults
            if (Array.isArray(defaultValue)) {
              // Sum up numericValue for each selected option in the array
              value = defaultValue.reduce((total: number, selectedValue: any) => {
                const option = variable.options?.find((opt: any) => opt.value.toString() === selectedValue.toString());
                return total + (option?.numericValue || 0);
              }, 0);
            } else {
              // Try to find option by value first
              const option = variable.options.find((opt: any) => opt.value === defaultValue);
              if (option) {
                value = option.numericValue || 0;
              } else {
                // If no option matches, treat defaultValue as a number (for multiplier use cases)
                value = Number(defaultValue) || 0;
              }
            }
          } else if (variable.type === 'number' || variable.type === 'slider' || variable.type === 'stepper') {
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
            const option = variable.options.find((opt: any) => opt.value === value);
            value = option?.multiplier || option?.numericValue || 0;
          } else if (variable.type === 'dropdown' && variable.options) {
            const option = variable.options.find((opt: any) => opt.value === value);
            value = option?.numericValue || 0;
          } else if (variable.type === 'multiple-choice' && variable.options) {
            if (Array.isArray(value)) {
              value = value.reduce((total: number, selectedValue: string) => {
                const option = variable.options?.find((opt: any) => opt.value.toString() === selectedValue);
                return total + (option?.numericValue || 0);
              }, 0);
            } else if (value !== undefined && value !== null && value !== '') {
              // Defensive fallback: handle scalar values (e.g. legacy/state-preloaded data)
              const option = variable.options.find((opt: any) => opt.value.toString() === value.toString());
              value = option?.numericValue || Number(value) || 0;
            } else {
              value = 0;
            }
          } else if (variable.type === 'number' || variable.type === 'slider' || variable.type === 'stepper') {
            value = Number(value) || 0;
          } else if (variable.type === 'checkbox') {
            const checkedVal = variable.checkedValue !== undefined ? variable.checkedValue : 1;
            const uncheckedVal = variable.uncheckedValue !== undefined ? variable.uncheckedValue : 0;
            value = value ? checkedVal : uncheckedVal;
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
      let finalPrice = Math.round(result);
      
      // Apply min/max price constraints (stored in cents in database)
      if (service.minPrice !== null && service.minPrice !== undefined) {
        const minPriceDollars = service.minPrice / 100;
        if (finalPrice < minPriceDollars) {
          finalPrice = minPriceDollars;
        }
      }
      if (service.maxPrice !== null && service.maxPrice !== undefined) {
        const maxPriceDollars = service.maxPrice / 100;
        if (finalPrice > maxPriceDollars) {
          finalPrice = maxPriceDollars;
        }
      }
      
      return Math.round(finalPrice);
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
    if (shouldShowAddressStep && !propertyAutofillSkipped && Object.keys(propertyAttributes).length === 0) {
      setCurrentStep("address");
    } else {
      setCurrentStep("configuration");
    }
  };

  const proceedToContact = () => {
    // If property address was collected earlier, use it to prefill the contact address field
    // (while preserving any existing contact address value).
    if (businessSettings?.styling?.enableAddress && propertyAddress.trim()) {
      setLeadForm(prev => {
        if (prev.address && prev.address.trim()) return prev;
        return { ...prev, address: propertyAddress.trim() };
      });
    }

    // Check if all visible variables for selected services are answered
    const allMissingVariables: string[] = [];

    for (const serviceId of selectedServices) {
      const service = formulas?.find((f: any) => f.id === serviceId);
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
        const service = formulas?.find((f: any) => f.id === serviceId);
        if (!service) continue;
        
        const serviceVars = serviceVariables[serviceId] || {};
        const { missingVariables } = areAllVisibleVariablesCompleted(service.variables, serviceVars);
        
        missingVariables.forEach(varName => {
          // Find the variable by name and add visual indicator
          const variable = service.variables.find((v: any) => v.name === varName);
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
          message = `Travel fee: ${percentage.toFixed(1)}% surcharge for ${extraMiles.toFixed(1)} miles beyond our ${serviceRadius}-mile service area (${pricingRate.toFixed(1)}% per mile)`;
          fee = percentage / 100; // Store as decimal for later calculation (e.g., 0.0982 for 9.82%)
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

    const activeDiscounts = businessSettings.discounts.filter((d: any) => 
      d.isActive && selectedDiscounts.includes(d.id)
    );

    if (businessSettings.allowDiscountStacking) {
      // Stack all selected discounts
      return activeDiscounts.reduce((total: number, discount: any) => {
        return total + (subtotal * (discount.percentage / 100));
      }, 0);
    } else {
      // Use the single selected discount
      const discount = activeDiscounts[0];
      return discount ? subtotal * (discount.percentage / 100) : 0;
    }
  };

  const handleSubmitLead = () => {
    if (submitMultiServiceLeadMutation.isPending || isSubmittingLeadRef.current) {
      return;
    }
    isSubmittingLeadRef.current = true;
    const missingFields: string[] = [];
    const formSettings = businessSettings?.styling;
    
    // Check each field only if it's enabled and required
    if (formSettings?.enableName !== false && formSettings?.requireName !== false && !leadForm.name) {
      missingFields.push(formSettings?.nameLabel || 'Name');
    }
    if (formSettings?.enableEmail !== false && formSettings?.requireEmail !== false && !leadForm.email) {
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
    if (formSettings?.enablePermissionToContact && formSettings?.requirePermissionToContact && !leadForm.permissionToContact) {
      missingFields.push(formSettings?.permissionToContactLabel || 'Permission to contact');
    }

    if (missingFields.length > 0) {
      // Silently prevent submission - no toast for iframe embedding
      console.log("Missing required fields:", missingFields);
      isSubmittingLeadRef.current = false;
      return;
    }

    // Use cart services for submission when cart is enabled
    const services: ServiceCalculation[] = cartServiceIds.map(serviceId => {
      const service = formulas?.find((f: any) => f.id === serviceId);
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
      ?.filter((d: any) => d.isActive && selectedDiscounts.includes(d.id))
      ?.map((discount: any) => ({
        id: discount.id,
        name: discount.name,
        percentage: discount.percentage,
        amount: Math.round(subtotal * (discount.percentage / 100) * 100) // Convert to cents
      })) || [];

    // Prepare upsell information for submission - collect from all cart services
    const allUpsellsForSubmission = cartServiceIds.reduce((acc: any[], serviceId) => {
      const service = formulas?.find((f: any) => f.id === serviceId);
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
        fee: Math.round(distanceInfo.fee * 100), // Legacy field: dollars->cents for fixed fee, or percent*100 for percent mode
        distanceFee: Math.round(distanceFee * 100), // Canonical travel fee in cents (always)
        message: distanceInfo.message
      } : undefined,
      appliedDiscounts: appliedDiscountData,
      bundleDiscountAmount: Math.round(bundleDiscount * 100), // Convert to cents
      selectedUpsells: selectedUpsellData,
      taxAmount: Math.round(taxAmount * 100),
      subtotal: Math.round(subtotal * 100) // Convert to cents
    };
    if (!submissionIdRef.current) {
      submissionIdRef.current = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
    const submissionDataWithId = {
      ...submissionData,
      submissionId: submissionIdRef.current
    };

    console.log('Submitting lead data:', submissionData);
    console.log('Selected discounts state:', selectedDiscounts);
    console.log('Business settings discounts:', businessSettings?.discounts);

    // Show pricing page immediately while submission happens in background
    setCurrentStep("pricing");

    // Check if we're adding an estimate to an existing lead (call screen mode)
    if (isCallScreenMode && selectedLeadOption === "existing" && selectedCallScreenLeadId) {
      // Create estimate for existing lead
      createEstimateForLeadMutation.mutate({
        leadId: selectedCallScreenLeadId,
        leadType: selectedCallScreenLeadType,
        ...submissionData
      });
    } else {
      // Submit as new lead
      submitMultiServiceLeadMutation.mutate(submissionDataWithId);
    }
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

  const applyButtonHoverStyles = (variant: 'primary' | 'outline') => (e: React.MouseEvent<HTMLElement>) => {
    if (designSettings?.customCSS) return;
    const hoverStyles = variant === 'outline'
      ? {
          backgroundColor: styling.buttonHoverBackgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
          color: styling.buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
          borderColor: styling.buttonHoverBorderColor || styling.buttonHoverBackgroundColor || styling.buttonBackgroundColor || styling.primaryColor || '#2563EB',
        }
      : {
          backgroundColor: styling.buttonHoverBackgroundColor || '#1d4ed8',
          color: styling.buttonHoverTextColor || styling.buttonTextColor || '#FFFFFF',
          borderColor: styling.buttonHoverBorderColor || styling.buttonHoverBackgroundColor || '#1d4ed8',
        };
    Object.assign(e.currentTarget.style, hoverStyles);
  };

  const applyButtonNormalStyles = (variant: 'primary' | 'outline') => (e: React.MouseEvent<HTMLElement>) => {
    if (designSettings?.customCSS) return;
    const normalStyles = getButtonStyles(variant);
    Object.assign(e.currentTarget.style, normalStyles);
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
                    className="ab-form-title text-3xl font-bold mb-2"
                    style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
                  >
                    {businessSettings?.styling?.selectionTitle || 'Select Your Services'}
                  </h1>
                )}
                {businessSettings?.styling?.showFormSubtitle !== false && (
                  <p className="ab-form-subtitle text-gray-600">
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
              onMouseEnter={applyButtonHoverStyles('primary')}
              onMouseLeave={applyButtonNormalStyles('primary')}
            >
              Continue
            </Button>
          </div>
        );

      case "address":
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h1
                className="ab-form-title text-2xl font-bold mb-2 flex items-center justify-center gap-2"
                style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
              >
                <Home className="w-6 h-6" />
                Property Address
              </h1>
              <p className="ab-form-subtitle text-gray-600 text-sm">
                Enter the property address to automatically fill in measurements and details.
              </p>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="property-address"
                className="ab-label ab-question-label ab-address-input-label"
                style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
              >
                Property Address
              </Label>
              <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                <GoogleMapsLoader>
                  <GooglePlacesAutocomplete
                    value={propertyAddress}
                    onChange={(newAddress) => {
                      setPropertyAddress(newAddress);
                      setLeadForm(prev => {
                        // Keep the contact address synced from ATTOM input,
                        // but don't overwrite a different address the user already entered.
                        if (prev.address && prev.address.trim() && prev.address.trim() !== propertyAddress.trim()) {
                          return prev;
                        }
                        return { ...prev, address: newAddress };
                      });
                    }}
                    placeholder="e.g., 123 Main St, Springfield, IL 62701"
                    className="w-full"
                    styling={styling}
                    componentStyles={componentStyles}
                    hasCustomCSS={!!designSettings?.customCSS}
                  />
                </GoogleMapsLoader>
              </Suspense>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handlePropertyResolve}
                disabled={!propertyAddress.trim() || isResolvingProperty}
                className="ab-button ab-button-primary button w-full"
                style={getButtonStyles('primary')}
                onMouseEnter={applyButtonHoverStyles('primary')}
                onMouseLeave={applyButtonNormalStyles('primary')}
              >
                {isResolvingProperty ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Looking up property...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Look Up Property Data
                  </>
                )}
              </Button>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep("selection")}
                  className="ab-address-nav-button ab-address-back-button text-sm opacity-70 hover:opacity-100 transition-opacity"
                  style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    setPropertyAutofillSkipped(true);
                    setCurrentStep("configuration");
                  }}
                  className="ab-address-nav-button ab-address-skip-button text-sm opacity-70 hover:opacity-100 transition-opacity"
                  style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
                >
                  Skip this step →
                </button>
              </div>
            </div>
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
                    className="ab-form-title text-3xl font-bold mb-2"
                    style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
                  >
                    {businessSettings.styling.configurationTitle}
                  </h1>
                )}
                {businessSettings?.styling?.showFormSubtitle !== false && businessSettings?.styling?.configurationSubtitle && businessSettings.styling.configurationSubtitle.trim() && (
                  <p className="ab-form-subtitle text-gray-600">
                    {businessSettings.styling.configurationSubtitle}
                  </p>
                )}
              </div>
            )}
            
            {selectedServices.map((serviceId, index) => {
              const service = formulas?.find((f: any) => f.id === serviceId);
              if (!service) return null;
              
              const isExpanded = expandedServices.has(serviceId) || selectedServices.length === 1;
              const isComplete = isServiceComplete(serviceId);
              const showCollapsible = selectedServices.length >= 2;
              
              return (
                <Card 
                  key={serviceId} 
                  className="overflow-hidden"
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    borderWidth: '0px',
                    borderColor: 'transparent',
                    borderStyle: 'solid',
                    boxShadow: 'none',
                  }}
                >
                  {/* Collapsible Header - Only show if multiple services */}
                  {showCollapsible && (
                    <button
                      onClick={() => toggleServiceExpansion(serviceId)}
                      className="ab-service-accordion w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      style={designSettings?.customCSS ? {} : {
                        backgroundColor: isExpanded ? 'transparent' : '#F9FAFB',
                        borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
                      }}
                      data-testid={`button-toggle-service-${serviceId}`}
                    >
                      <div className="text-left flex-1">
                        <h3 
                          className="ab-service-accordion-text text-xl font-semibold"
                          style={designSettings?.customCSS ? {} : { color: styling.textColor || '#1F2937' }}
                        >
                          {service.name}
                        </h3>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 flex-shrink-0 ml-4" style={{ color: styling.textColor || '#6B7280' }} />
                      ) : (
                        <ChevronDown className="w-5 h-5 flex-shrink-0 ml-4" style={{ color: styling.textColor || '#6B7280' }} />
                      )}
                    </button>
                  )}

                  {/* Content - Always show for single service, conditionally for multiple */}
                  {isExpanded && (
                    <div style={{ padding: '24px' }}>
                      {/* Title for single service (no collapsible header) */}
                      {!showCollapsible && (
                        <>
                          <h3 
                            className="ab-service-accordion-text text-xl font-semibold mb-2"
                            style={{ color: styling.textColor || '#1F2937' }}
                          >
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="ab-service-accordion-text text-sm text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                          )}
                        </>
                      )}
                      
                      {/* Description for multiple services (with collapsible header) */}
                      {showCollapsible && service.description && (
                        <p className="ab-service-accordion-text text-sm text-gray-600 mb-4 leading-relaxed">{service.description}</p>
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
                      <Suspense
                        fallback={(
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="h-6 w-40 bg-gray-200 rounded mb-3 animate-pulse"></div>
                            <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
                          </div>
                        )}
                      >
                        <CollapsiblePhotoMeasurement
                          setup={service.photoMeasurementSetup}
                          formulaName={service.name}
                          businessOwnerId={effectiveBusinessOwnerId || ''}
                          onMeasurementComplete={(measurement) => {
                            // Find the best matching variable based on measurement type
                            const measurementType = service.photoMeasurementSetup?.measurementType || 'area';
                            let targetVariable;

                            if (measurementType === 'area') {
                              // For area measurements, look for area/size/square footage variables
                              targetVariable = service.variables.find((v: any) =>
                                ['number', 'slider', 'stepper'].includes(v.type) && (
                                  v.name.toLowerCase().includes('size') ||
                                  v.name.toLowerCase().includes('area') ||
                                  v.name.toLowerCase().includes('square') ||
                                  v.name.toLowerCase().includes('sq') ||
                                  v.name.toLowerCase().includes('footage')
                                )
                              );
                            } else if (['length', 'width', 'height', 'perimeter'].includes(measurementType)) {
                              // For linear measurements, look for matching dimension variables
                              targetVariable = service.variables.find((v: any) =>
                                ['number', 'slider', 'stepper'].includes(v.type) && (
                                  v.name.toLowerCase().includes(measurementType) ||
                                  v.name.toLowerCase().includes('distance') ||
                                  v.name.toLowerCase().includes('dimension')
                                )
                              );
                            }

                            // Fallback to first number variable if no match found
                            if (!targetVariable) {
                              targetVariable = service.variables.find((v: any) => ['number', 'slider', 'stepper'].includes(v.type));
                            }

                            if (targetVariable) {
                              handleServiceVariableChange(serviceId, targetVariable.id, measurement.value);
                              console.log(`Photo measurement applied: ${measurement.value} ${measurement.unit} to ${targetVariable.name}`);
                            } else {
                              console.warn('No suitable variable found for photo measurement auto-population');
                            }

                            // Save full photo measurement data
                            if (measurement.fullData) {
                              setPhotoMeasurements(prev => [...prev, measurement.fullData!]);
                            }
                          }}
                        />
                      </Suspense>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Suspense
                      fallback={(
                        <div className="space-y-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      )}
                    >
                      {service.variables.map((variable: any) => (
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
                          prefillSource={prefilledFields[`${serviceId}_${variable.id}`]}
                        />
                      ))}
                    </Suspense>
                  </div>
                </div>
              )}
                </Card>
              );
            })}
            
            <Button
              onClick={proceedToContact}
              className="ab-button ab-button-primary button w-full"
              data-testid="button-get-quote"
              style={getButtonStyles('primary')}
              onMouseEnter={applyButtonHoverStyles('primary')}
              onMouseLeave={applyButtonNormalStyles('primary')}
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
          const selectedLead = allLeads.find(lead =>
            lead.id === selectedCallScreenLeadId && lead.leadType === selectedCallScreenLeadType
          );
          
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
                        {allLeads.length > 0 ? (
                          <>
                            {/* Search Input */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="text"
                                placeholder="Search by name, email, phone, or address..."
                                value={leadSearchTerm}
                                onChange={(e) => setLeadSearchTerm(e.target.value)}
                                className="pl-10 pr-10"
                              />
                              {leadSearchTerm && (
                                <button
                                  onClick={() => setLeadSearchTerm("")}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            {/* Selected Lead Display */}
                            {selectedLead && (
                              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-blue-600" />
                                      <span className="font-semibold text-gray-900">{selectedLead.name}</span>
                                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                                        Selected
                                      </span>
                                    </div>
                                    {selectedLead.email && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="h-3.5 w-3.5" />
                                        {selectedLead.email}
                                      </div>
                                    )}
                                    {selectedLead.phone && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="h-3.5 w-3.5" />
                                        {selectedLead.phone}
                                      </div>
                                    )}
                                    {selectedLead.address && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {selectedLead.address}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedCallScreenLeadId(null);
                                      setSelectedCallScreenLeadType("single");
                                      setLeadForm(prev => ({
                                        name: "",
                                        email: "",
                                        phone: "",
                                        address: prev.address?.trim() || propertyAddress.trim(),
                                        notes: "",
                                        howDidYouHear: ""
                                      }));
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Lead List */}
                            {!selectedLead && (
                              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                {filteredLeads.length > 0 ? (
                                  filteredLeads.map((lead) => (
                                    <button
                                      key={`${lead.leadType}-${lead.id}`}
                                      onClick={() => {
                                        setSelectedCallScreenLeadId(lead.id);
                                        setSelectedCallScreenLeadType(lead.leadType);
                                        setLeadForm({
                                          name: lead.displayName,
                                          email: lead.displayEmail,
                                          phone: lead.displayPhone,
                                          address: lead.displayAddress,
                                          notes: "",
                                          howDidYouHear: ""
                                        });
                                      }}
                                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium text-gray-900">{lead.displayName}</div>
                                          <div className="text-sm text-gray-500">{lead.displayEmail}</div>
                                          {lead.displayPhone && (
                                            <div className="text-sm text-gray-500">{lead.displayPhone}</div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            lead.leadType === 'multi'
                                              ? 'bg-purple-100 text-purple-700'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {lead.leadType === 'multi' ? 'Multi-service' : 'Single'}
                                          </span>
                                          <div className="text-xs text-gray-400 mt-1">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-gray-500 text-sm">
                                    No leads found matching "{leadSearchTerm}"
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-gray-500 text-center">
                              {allLeads.length} total customer{allLeads.length !== 1 ? 's' : ''} in database
                            </p>
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
                    setLeadForm(prev => ({
                      name: "",
                      email: "",
                      phone: "",
                      address: prev.address?.trim() || propertyAddress.trim(),
                      notes: "",
                      howDidYouHear: ""
                    }));
                  }
                }}
                disabled={selectedLeadOption === "existing" && !selectedCallScreenLeadId}
                className="ab-button ab-button-primary button w-full"
                data-testid="button-lead-option-continue"
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
                    className="ab-form-title text-3xl font-bold mb-2"
                    style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
                  >
                    {businessSettings.styling.contactTitle}
                  </h1>
                )}
                {businessSettings?.styling?.showFormSubtitle !== false && businessSettings?.styling?.contactSubtitle && businessSettings.styling.contactSubtitle.trim() && (
                  <p className="ab-form-subtitle text-gray-600">
                    {businessSettings.styling.contactSubtitle}
                  </p>
                )}
              </div>
            )}

            {/* Contact Form */}
            <div className="space-y-4">
              {/* Name Field - Show if not explicitly disabled */}
              {businessSettings?.styling?.enableName !== false && (
                <div className="ab-question-card">
                  <Label htmlFor="name" className="ab-label ab-question-label" style={hasCustomCSS ? {} : { color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.nameLabel || 'Name'} {businessSettings?.styling?.requireName !== false ? '*' : ''}
                  </Label>
                  <Input
                    id="name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    required={businessSettings?.styling?.requireName !== false}
                    style={hasCustomCSS ? {} : getInputStyles()}
                    className="ab-input ab-text-input"
                  />
                </div>
              )}

              {/* Email Field - Show if not explicitly disabled */}
              {businessSettings?.styling?.enableEmail !== false && (
                <div className="ab-question-card">
                  <Label htmlFor="email" className="ab-label ab-question-label" style={hasCustomCSS ? {} : { color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.emailLabel || 'Email'} {businessSettings?.styling?.requireEmail !== false ? '*' : ''}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                    required={businessSettings?.styling?.requireEmail !== false}
                    style={hasCustomCSS ? {} : getInputStyles()}
                    className="ab-input ab-text-input"
                  />
                </div>
              )}

              {/* Phone Field - Show only if enabled */}
              {businessSettings?.styling?.enablePhone && (
                <div className="ab-question-card">
                  <Label htmlFor="phone" className="ab-label ab-question-label" style={hasCustomCSS ? {} : { color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.phoneLabel || 'Phone'} {businessSettings?.styling?.requirePhone ? '*' : ''}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    required={businessSettings?.styling?.requirePhone}
                    style={hasCustomCSS ? {} : getInputStyles()}
                    className="ab-input ab-text-input"
                  />
                </div>
              )}

              {/* Address Field - Show only if enabled */}
              {businessSettings?.styling?.enableAddress && (
                <div className="ab-question-card">
                  <Label htmlFor="address" className="ab-label ab-question-label" style={hasCustomCSS ? {} : { color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.addressLabel || 'Address'} {businessSettings?.styling?.requireAddress ? '*' : ''}
                  </Label>
                  <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                    <GoogleMapsLoader>
                      <GooglePlacesAutocomplete
                        value={leadForm.address || ""}
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
                        hasCustomCSS={hasCustomCSS}
                      />
                    </GoogleMapsLoader>
                  </Suspense>
                </div>
              )}

              {/* Notes Field - Show only if enabled */}
              {businessSettings?.styling?.enableNotes && (
                <div className="ab-question-card">
                  <Label htmlFor="notes" className="ab-label ab-question-label" style={hasCustomCSS ? {} : { color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.notesLabel || 'Additional Notes'}
                  </Label>
                  <textarea
                    id="notes"
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                    style={hasCustomCSS ? {} : getInputStyles()}
                    className="ab-input ab-textarea min-h-[80px] resize-y w-full"
                    rows={3}
                  />
                </div>
              )}

              {/* How Did You Hear Field - Show only if enabled */}
              {businessSettings?.styling?.enableHowDidYouHear && (
                <div className="ab-question-card">
                  <Label htmlFor="howDidYouHear" className="ab-label ab-question-label" style={hasCustomCSS ? {} : { color: styling.textColor || '#374151' }}>
                    {businessSettings?.styling?.howDidYouHearLabel || 'How did you hear about us?'} {businessSettings?.styling?.requireHowDidYouHear ? '*' : ''}
                  </Label>
                  <select
                    id="howDidYouHear"
                    value={leadForm.howDidYouHear || ''}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, howDidYouHear: e.target.value }))}
                    required={businessSettings?.styling?.requireHowDidYouHear}
                    style={hasCustomCSS ? {} : getInputStyles()}
                    className="ab-select w-full"
                  >
                    <option value="">Select an option...</option>
                    {(businessSettings?.styling?.howDidYouHearOptions || []).map((option: string, index: number) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}

              {businessSettings?.styling?.enablePermissionToContact && (
                <div className="ab-question-card">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="permissionToContact"
                      checked={Boolean(leadForm.permissionToContact)}
                      onCheckedChange={(checked) => setLeadForm(prev => ({ ...prev, permissionToContact: checked === true }))}
                      className="mt-0.5"
                    />
                    <Label htmlFor="permissionToContact" className="ab-label ab-question-label leading-relaxed cursor-pointer" style={hasCustomCSS ? {} : { color: styling.textColor || '#374151' }}>
                      {businessSettings?.styling?.permissionToContactLabel || 'Permission to contact me'} {businessSettings?.styling?.requirePermissionToContact ? '*' : ''}
                    </Label>
                  </div>
                </div>
              )}

              {/* Image Upload Field - Show only if enabled */}
              {businessSettings?.styling?.enableImageUpload && (
                <div className="ab-question-card">
                  <Label htmlFor="images" className="ab-label ab-question-label" style={hasCustomCSS ? {} : { color: styling.textColor || '#374151' }}>
                    Upload Images {businessSettings?.styling?.requireImageUpload ? '*' : ''}
                  </Label>
                  <div className="mt-2">
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        
                        setImageUploadLoading(true);
                        const newImages: string[] = [];
                        
                        for (const file of files) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            newImages.push(base64);
                            if (newImages.length === files.length) {
                              setLeadForm(prev => ({
                                ...prev,
                                uploadedImages: [...(prev.uploadedImages || []), ...newImages]
                              }));
                              setImageUploadLoading(false);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={imageUploadLoading}
                      className="ab-input ab-file-input block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      data-testid="input-file-images"
                    />
                    <p className="text-xs text-gray-500 mt-1">You can upload multiple images (JPG, PNG, etc.)</p>
                  </div>
                  
                  {/* Display uploaded images */}
                  {(leadForm.uploadedImages || []).length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Uploaded Images ({(leadForm.uploadedImages || []).length})</p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {(leadForm.uploadedImages || []).map((image: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLeadForm(prev => ({
                                  ...prev,
                                  uploadedImages: (prev.uploadedImages || []).filter((_, i) => i !== index)
                                }));
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid="button-remove-image"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmitLead}
              disabled={submitMultiServiceLeadMutation.isPending}
              className="ab-button ab-button-primary button w-full"
              data-testid="button-submit-quote"
              style={getButtonStyles('primary')}
              onMouseEnter={(e) => {
                if (!submitMultiServiceLeadMutation.isPending) {
                  applyButtonHoverStyles('primary')(e);
                }
              }}
              onMouseLeave={(e) => {
                applyButtonNormalStyles('primary')(e);
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
          const service = formulas?.find((f: any) => f.id === serviceId);
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
                    className="ab-form-title text-3xl font-bold mb-2"
                    style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
                  >
                    {businessSettings.styling.pricingTitle}
                  </h1>
                )}
                {businessSettings?.styling?.showFormSubtitle !== false && businessSettings?.styling?.pricingSubtitle && businessSettings.styling.pricingSubtitle.trim() && (
                  <p className="ab-form-subtitle text-gray-600">
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
              className="ab-pricing-card ab-pricing-summary-card p-8 rounded-lg mb-6"
              style={hasCustomCSS ? undefined : {
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
                <h3
                  className="ab-pricing-section-title text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8"
                  style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                >
                  Your Service Packages
                </h3>

                {/* Cart status indicator when cart mode is enabled with multiple services */}
                {businessSettings?.enableServiceCart && selectedServices.length > 1 && (
                  <p
                    className="ab-pricing-cart-status text-center text-sm mb-4"
                    style={hasCustomCSS ? undefined : { color: styling.textColor ? `${styling.textColor}99` : '#6B7280' }}
                  >
                    {cartServiceIds.length} of {selectedServices.length} services selected for checkout
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {selectedServices.map((serviceId) => {
                    const service = formulas?.find((f: any) => f.id === serviceId);
                    const servicePrice = serviceCalculations[serviceId] || 0;
                    const serviceVars = serviceVariables[serviceId] || {};

                    if (!service) return null;

                    // Handle negative or zero prices gracefully
                    const displayPrice = Math.max(0, servicePrice);
                    const hasPricingIssue = servicePrice <= 0;

                    // Cart mode variables
                    const isCartEnabled = businessSettings?.enableServiceCart && selectedServices.length > 1;
                    const isInCart = cartServiceIds.includes(serviceId);
                    const isLastInCart = cartServiceIds.length === 1 && isInCart;

                    // Get service variables for features list
                    const serviceFeatures = Object.entries(serviceVars)
                      .filter(([key, value]) => {
                        if (!value || value === '') return false;
                        const variable = service.variables?.find((v: any) => v.id === key);
                        return variable && variable.type !== 'text'; // Exclude basic text inputs
                      })
                      .map(([key, value]) => {
                        const variable = service.variables?.find((v: any) => v.id === key);
                        if (!variable) return null;

                        let displayValue = value;
                        if (typeof value === 'boolean') {
                          displayValue = value ? 'Yes' : 'No';
                        } else if (variable.type === 'multiple-choice' || variable.type === 'dropdown') {
                          const option = variable.options?.find((opt: any) => opt.value === value);
                          if (option) displayValue = option.label;
                        }

                        return {
                          name: variable.name,
                          value: displayValue
                        };
                      })
                      .filter(Boolean);

                    const cardLayout = (styling.pricingCardLayout || 'classic') as 'classic' | 'modern' | 'minimal' | 'compact';

                    return (
                      <div
                        key={serviceId}
                        className="ab-pricing-card pricing-card relative overflow-hidden transition-all duration-300"
                        style={hasCustomCSS ? {} : {
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
                          padding: cardLayout === 'classic' ? '10px' : '0',
                          // Reduce opacity for non-carted services when cart mode is enabled
                          opacity: isCartEnabled && !isInCart ? 0.6 : 1,
                        }}
                      >
                        {renderPricingCardLayout(cardLayout, {
                          service,
                          displayPrice,
                          hasPricingIssue,
                          serviceFeatures: serviceFeatures as any[],
                          styling,
                          componentStyles,
                          hasCustomCSS,
                          renderBulletIconFn: renderBulletIcon
                        })}

                        {/* Cart toggle button - only show when cart mode is enabled with multiple services */}
                        {isCartEnabled && (
                          <div className="px-4 pb-4 pt-2">
                            <button
                              onClick={() => toggleServiceInCart(serviceId)}
                              disabled={isLastInCart}
                              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isInCart
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                              } ${isLastInCart ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={isLastInCart ? 'At least one service must remain in cart' : ''}
                            >
                              {isInCart ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  In Cart {isLastInCart ? '' : '- Remove'}
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add to Cart
                                </span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>



              {/* Detailed Pricing Breakdown */}
              <div className="border-t border-gray-300 pt-6 space-y-4">
                <h3
                  className="ab-pricing-breakdown-title text-lg font-semibold mb-4"
                  style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                >
                  Pricing Breakdown
                </h3>
                
                {/* Individual Service Line Items */}
                <div className="space-y-3">
                  {cartServiceIds.map(serviceId => {
                    const service = formulas?.find((f: any) => f.id === serviceId);
                    const price = Math.max(0, serviceCalculations[serviceId] || 0);
                    
                    // Use formula name first, then title as fallback, then service ID
                    const serviceName = service?.name || service?.title || `Service ${serviceId}`;
                    
                    return (
                      <div key={serviceId} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <span
                            className="ab-pricing-line-item-name text-base"
                            style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                          >
                            {serviceName}
                          </span>
                          {price === 0 && serviceCalculations[serviceId] <= 0 && (
                            <span className="ml-2 text-sm text-red-500">(Price Error)</span>
                          )}
                        </div>
                        <span
                          className="ab-pricing-line-item-value text-base font-medium"
                          style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                        >
                          ${price.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span
                    className="ab-pricing-subtotal-label text-lg font-medium"
                    style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                  >
                    Subtotal:
                  </span>
                  <span
                    className="ab-pricing-subtotal-value text-lg font-medium"
                    style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                  >
                    ${subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Bundle Discount */}
                {bundleDiscount > 0 && (
                  <div className="ab-discount-line flex justify-between items-center">
                    <span className="ab-discount-line-label text-lg text-green-600">
                      Bundle Discount ({businessSettings?.styling?.bundleDiscountPercent || 0}%):
                    </span>
                    <span className="ab-discount-line-value text-lg font-medium text-green-600">
                      -${bundleDiscount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Customer Discounts */}
                {customerDiscountAmount > 0 && (
                  <div className="ab-discount-lines space-y-2">
                    {businessSettings?.discounts?.filter((d: any) => d.isActive && selectedDiscounts.includes(d.id)).map((discount: any) => (
                      <div key={discount.id} className="ab-discount-line flex justify-between items-center">
                        <span className="ab-discount-line-label text-lg text-green-600">
                          {discount.name} ({discount.percentage}%):
                        </span>
                        <span className="ab-discount-line-value text-lg font-medium text-green-600">
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
                    const service = formulas?.find((f: any) => f.id === serviceId);
                    if (service?.upsellItems) {
                      const serviceUpsells = service.upsellItems.map((upsell: any) => ({
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
                    <span
                      className="ab-pricing-tax-label text-lg"
                      style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                    >
                      Sales Tax ({businessSettings?.styling?.salesTaxRate || 0}%):
                    </span>
                    <span
                      className="ab-pricing-tax-value text-lg font-medium"
                      style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                    >
                      ${taxAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Final Total */}
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span
                      className="ab-pricing-total-label text-xl font-bold"
                      style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                    >
                      Total:
                    </span>
                    <span 
                      className="ab-pricing-total-value text-4xl font-bold"
                      style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
                    >
                      ${finalTotalPrice.toLocaleString()}
                    </span>
                  </div>
                  {bundleDiscount > 0 && (
                    <p className="ab-discount-savings-note text-sm text-green-600 font-medium text-right mt-1">
                      You save ${bundleDiscount.toLocaleString()} with our bundle discount!
                    </p>
                  )}
                </div>
              </div>

              {/* Discount Selection */}
              {businessSettings?.discounts && businessSettings.discounts.filter((d: any) => d.isActive).length > 0 && (
                <div className="ab-discount-section mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3
                    className="ab-discount-title text-lg font-semibold mb-4"
                    style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                  >
                    💰 Available Discounts
                  </h3>
                  <p className="ab-discount-subtitle text-sm text-gray-600 mb-4">
                    {businessSettings.allowDiscountStacking 
                      ? "Select all discounts you qualify for (they can be combined)" 
                      : "Select one discount you qualify for"
                    }
                  </p>
                  <div className="ab-discount-grid grid grid-cols-1 md:grid-cols-2 gap-3">
                    {businessSettings.discounts.filter((d: any) => d.isActive).map((discount: any) => (
                      <div
                        key={discount.id}
                        onClick={() => handleDiscountToggle(discount.id)}
                        className={`ab-discount-card p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedDiscounts.includes(discount.id)
                            ? 'border-green-500 bg-green-50 selected'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="ab-discount-name font-medium text-gray-900">
                              {discount.name}
                            </div>
                            {discount.description && (
                              <div className="ab-discount-description text-sm text-gray-600 mt-1">
                                {discount.description}
                              </div>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <div className="ab-discount-percent text-lg font-bold text-green-600">
                              {discount.percentage}% OFF
                            </div>
                            {selectedDiscounts.includes(discount.id) && (
                              <div className="ab-discount-applied text-sm text-green-600 font-medium">
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
                    <div className="ab-discount-savings mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                      <div className="ab-discount-savings-title text-sm font-medium text-green-800 mb-2">Discount Savings Applied:</div>
                      {businessSettings.discounts.filter((d: any) => selectedDiscounts.includes(d.id)).map((discount: any) => (
                        <div key={discount.id} className="ab-discount-savings-row flex justify-between items-center text-sm">
                          <span className="ab-discount-savings-label text-green-700">{discount.name} ({discount.percentage}%):</span>
                          <span className="ab-discount-savings-value font-medium text-green-600">
                            -${Math.round(subtotal * (discount.percentage / 100)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {customerDiscountAmount > 0 && (
                        <div className="ab-discount-savings-total text-sm font-semibold text-green-800 mt-2 pt-2 border-t border-green-200">
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
                    const service = formulas?.find((f: any) => f.id === serviceId);
                    if (service?.upsellItems) {
                      // Add service context to each upsell for better identification
                      const serviceUpsells = service.upsellItems.map((upsell: any) => ({
                      ...upsell,
                      serviceId: service.id,
                      serviceName: service.name
                    }));
                    acc.push(...serviceUpsells);
                  }
                  return acc;
                }, [] as any[]);
                
                return allUpsells.length > 0 && (
                  <div className="ab-upsell-section mt-6 p-6 bg-orange-50 rounded-lg border border-orange-200">
                    <h3
                      className="ab-upsell-heading text-lg font-semibold mb-4"
                      style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                    >
                      ⭐ Recommended Add-Ons
                    </h3>
                    <p className="ab-upsell-subtitle text-sm text-gray-600 mb-4">
                      Enhance your services with these popular add-ons
                    </p>
                    <div className="ab-upsell-grid grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className={`ab-upsell-card p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${
                            isSelected
                              ? 'ab-upsell-card-selected border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="ab-upsell-content flex items-start gap-3">
                            {/* Icon/Image */}
                            <div className="ab-upsell-icon flex-shrink-0">
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
                                <div className="ab-upsell-icon-fallback w-8 h-8 bg-orange-200 rounded flex items-center justify-center">
                                  <span className="text-orange-600 text-sm font-semibold">+</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="ab-upsell-main flex-1 min-w-0">
                              <div className="ab-upsell-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="ab-upsell-title-row flex items-center gap-2 flex-wrap">
                                    <h4 className="ab-upsell-title font-medium text-gray-900 break-words">{upsell.name}</h4>
                                    {upsell.isPopular && (
                                      <span className="ab-upsell-popular-badge bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                        Popular
                                      </span>
                                    )}
                                  </div>
                                  <p className="ab-upsell-description text-sm text-gray-600 mt-1 break-words leading-relaxed">{upsell.description}</p>
                                  {upsell.category && (
                                    <span className="ab-upsell-category inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded break-words">
                                      {upsell.category}
                                    </span>
                                  )}
                                </div>
                                <div className="ab-upsell-price-wrap text-right flex-shrink-0 sm:ml-3">
                                  <div className="ab-upsell-price text-lg font-bold text-orange-600 whitespace-nowrap">
                                    +${upsellPrice.toLocaleString()}
                                  </div>
                                  {isSelected && (
                                    <div className="ab-upsell-added text-sm text-orange-600 font-medium mt-1 whitespace-nowrap">
                                      ✓ Added
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {upsell.tooltip && (
                                <div className="ab-upsell-tooltip mt-2 text-xs text-gray-500 italic break-words leading-relaxed">
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
                      <div className="ab-upsell-selected-summary mt-4 p-3 bg-orange-100 rounded-lg border border-orange-300">
                        <div className="ab-upsell-selected-title text-sm font-medium text-orange-800 mb-2">Add-ons Selected:</div>
                        {allUpsells.filter(u => selectedUpsells.includes(u.id)).map((upsell) => {
                          const upsellPrice = Math.round(subtotal * (upsell.percentageOfMain / 100));
                          return (
                            <div key={upsell.id} className="ab-upsell-selected-row flex justify-between items-center text-sm">
                              <span className="ab-upsell-selected-name text-orange-700">{upsell.name} ({upsell.serviceName}):</span>
                              <span className="ab-upsell-selected-price font-medium text-orange-600">
                                +${upsellPrice.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                        <div className="ab-upsell-selected-total text-sm font-semibold text-orange-800 mt-2 pt-2 border-t border-orange-200">
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
                <div
                  className="ab-pricing-disclaimer mt-6 p-4 bg-gray-50 rounded-lg border-l-4"
                  style={hasCustomCSS ? undefined : { borderLeftColor: styling.primaryColor || '#3B82F6' }}
                >
                  <p className="ab-pricing-disclaimer-text text-sm text-gray-600">
                    <strong
                      className="ab-pricing-disclaimer-label font-medium"
                      style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                    >
                      Important:
                    </strong>{' '}
                    {businessSettings.styling.disclaimerText}
                  </p>
                </div>
              )}

              {/* Customer Info Summary */}
              <div className="ab-customer-summary mt-6 p-4 bg-gray-50 rounded-lg">
                <h4
                  className="ab-customer-summary-title font-semibold mb-2"
                  style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                >
                  Quote for: {leadForm.name}
                </h4>
                <p className="ab-customer-summary-line text-sm text-gray-600">{leadForm.email}</p>
                <p className="ab-customer-summary-line text-sm text-gray-600">{leadForm.phone}</p>
                {leadForm.address && <p className="ab-customer-summary-line text-sm text-gray-600">{leadForm.address}</p>}
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {businessSettings?.enableBooking && (
                <Button
                  onClick={() => setCurrentStep("scheduling")}
                  className="ab-button ab-button-primary button flex-1"
                  data-testid="button-schedule-service"
                  style={getButtonStyles('primary')}
                  onMouseEnter={applyButtonHoverStyles('primary')}
                  onMouseLeave={applyButtonNormalStyles('primary')}
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
                      setPropertyAddress("");
                      setPropertyAttributes({});
                      setPropertyAutofillSkipped(false);
                      setPrefilledFields({});
                      setCurrentStep("selection");
                    }
                  }}
                  variant="outline"
                  className="button flex-1"
                  style={getButtonStyles('outline')}
                  onMouseEnter={applyButtonHoverStyles('outline')}
                  onMouseLeave={applyButtonNormalStyles('outline')}
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
                    setPropertyAddress("");
                    setPropertyAttributes({});
                    setPropertyAutofillSkipped(false);
                    setPrefilledFields({});
                    setCurrentStep("selection");
                  }}
                  variant="outline"
                  className="button flex-1"
                  style={getButtonStyles('outline')}
                  onMouseEnter={applyButtonHoverStyles('outline')}
                  onMouseLeave={applyButtonNormalStyles('outline')}
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
                className="ab-form-title text-3xl font-bold mb-2"
                style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
              >
                Schedule Your Service
              </h1>
              <p className="ab-form-subtitle text-gray-600">
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
              className="ab-pricing-card ab-pricing-summary-card p-6 rounded-lg mb-6"
              style={hasCustomCSS ? undefined : {
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
                  <h3 className="font-semibold">
                    <span
                      className="ab-pricing-total-label"
                      style={hasCustomCSS ? undefined : { color: styling.textColor || '#1F2937' }}
                    >
                      Total:
                    </span>{" "}
                    <span
                      className="ab-pricing-total-value"
                      style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
                    >
                      ${schedulingFinalTotal.toLocaleString()}
                    </span>
                  </h3>
                  <p className="ab-pricing-cart-status text-sm text-gray-600">
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
                  businessOwnerId={effectiveBusinessOwnerId}
                  customerInfo={{
                    name: leadForm.name,
                    email: leadForm.email,
                    phone: leadForm.phone,
                    address: leadForm.address
                  }}
                  serviceName={
                    formulas
                      ? selectedServices
                          .map((id: number) => {
                            const service = formulas.find((f: any) => f.id === id);
                            return service?.name || service?.title || "";
                          })
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
                          setPropertyAddress("");
                          setPropertyAttributes({});
                          setPropertyAutofillSkipped(false);
                          setPrefilledFields({});
                          setCurrentStep("selection");
                        }
                      }}
                      style={{
                        ...getButtonStyles('primary'),
                        padding: '12px 24px',
                        fontSize: '16px',
                      }}
                      onMouseEnter={applyButtonHoverStyles('primary')}
                      onMouseLeave={(e) => {
                        if (designSettings?.customCSS) return;
                        const normalStyles = {
                          ...getButtonStyles('primary'),
                          padding: '12px 24px',
                          fontSize: '16px',
                        };
                        Object.assign(e.currentTarget.style, normalStyles);
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
    const hasAddress = shouldShowAddressStep;
    switch (currentStep) {
      case "selection":
        // 0-25% during service selection - fills as services are selected
        const totalServices = formulas?.length || 1;
        const selectionProgress = selectedServices.length > 0
          ? Math.min(hasAddress ? 20 : 25, (selectedServices.length / totalServices) * (hasAddress ? 20 : 25))
          : 0;
        return selectionProgress;
      case "address":
        return 30;
      case "configuration":
        return hasAddress ? 55 : 50;
      case "contact":
        return 75;
      case "pricing":
        return 100;
      case "scheduling":
        return 100;
      default:
        return 0;
    }
  };

  const getProgressLabel = () => {
    const hasAddress = shouldShowAddressStep;
    switch (currentStep) {
      case "selection":
        return "Step 1: Select Services";
      case "address":
        return "Step 2: Property Address";
      case "configuration":
        return hasAddress ? "Step 3: Configure Services" : "Step 2: Configure Services";
      case "contact":
        return hasAddress ? "Step 4: Contact Information" : "Step 3: Contact Information";
      case "pricing":
        return hasAddress ? "Step 5: Review Quote" : "Step 4: Review Quote";
      case "scheduling":
        return hasAddress ? "Step 5: Schedule Appointment" : "Step 4: Schedule Appointment";
      default:
        return "Getting Started";
    }
  };

  const progressPercentage = getFormProgress();

  const hasCustomCSS = !!designSettings?.customCSS;

  return (
    <div className="force-light-mode min-h-screen flex items-start justify-center p-0" style={{ margin: '0' }}>
      <div 
        id="autobidder-form"
        className="ab-form-container form-container max-w-5xl w-full mx-auto"
        style={hasCustomCSS ? {} : {
          backgroundColor: styling.backgroundColor || 'transparent',
          borderRadius: `${styling.containerBorderRadius || 16}px`,
          padding: 0,
          margin: `${styling.containerMargin || 0}px`,
          boxShadow: styling.containerShadow === 'xl' 
            ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        {/* Progress Bar - Only show when showProgressGuide is enabled */}
        {businessSettings?.styling?.showProgressGuide && (
          <div className="ab-progress mb-6 px-2" data-testid="progress-bar-container">
            <div className="flex items-center justify-between mb-2">
              <span
                className="ab-progress-label text-sm font-medium"
                style={hasCustomCSS ? undefined : { color: styling.textColor || '#374151' }}
              >
                {getProgressLabel()}
              </span>
              <span
                className="ab-progress-percentage text-sm font-medium"
                style={hasCustomCSS ? undefined : { color: styling.primaryColor || '#2563EB' }}
              >
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div 
              className="ab-progress-track w-full h-2 rounded-full overflow-hidden"
              style={hasCustomCSS ? undefined : { backgroundColor: '#E5E7EB' }}
              data-testid="progress-bar-track"
            >
              <div
                className="ab-progress-fill h-full transition-all duration-300 ease-out"
                style={hasCustomCSS
                  ? { width: `${progressPercentage}%` }
                  : {
                      width: `${progressPercentage}%`,
                      backgroundColor: styling.primaryColor || '#2563EB',
                    }}
                data-testid="progress-bar-fill"
              />
            </div>
          </div>
        )}
        
        {renderCurrentStep()}

        {/* Autobidder Branding - Shown for free plan users */}
        {showAutobidderBranding && (
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col items-center justify-center gap-2">
            <a
              href="https://rep.autobidder.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#2563EB"/>
                <path d="M8 16c0-2.2 1.8-4 4-4 1.5 0 2.8.8 3.5 2l.5.8.5-.8c.7-1.2 2-2 3.5-2 2.2 0 4 1.8 4 4s-1.8 4-4 4c-1.5 0-2.8-.8-3.5-2l-.5-.8-.5.8c-.7 1.2-2 2-3.5 2-2.2 0-4-1.8-4-4z" fill="none" stroke="white" strokeWidth="2"/>
              </svg>
              <span className="text-sm font-medium">Powered by Autobidder</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
