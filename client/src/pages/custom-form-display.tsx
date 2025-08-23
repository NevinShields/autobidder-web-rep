import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calculator, User, Mail, Phone, Receipt, Percent, MapPin, MessageSquare, HeadphonesIcon, Calendar } from "lucide-react";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import ServiceCardDisplay from "@/components/service-card-display";
import BookingCalendar from "@/components/booking-calendar";
import MeasureMapTerraImproved from "@/components/measure-map-terra-improved";
import { GoogleMapsLoader } from "@/components/google-maps-loader";
import ImageUpload from "@/components/image-upload";
import StepByStepForm from "@/components/step-by-step-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Formula, BusinessSettings, StylingOptions, CustomForm } from "@shared/schema";

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

interface CustomFormResponse {
  form: CustomForm;
  formulas: Formula[];
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
  const [showPricing, setShowPricing] = useState(false);
  const [currentStep, setCurrentStep] = useState<"contact" | "services" | "configure" | "results">("services");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookedSlotId, setBookedSlotId] = useState<number | null>(null);
  const [sharedVariables, setSharedVariables] = useState<Record<string, any>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { toast } = useToast();

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
  const { data: formData, isLoading: formulasLoading } = useQuery<CustomFormResponse>({
    queryKey: [`/api/public/forms/${accountId}/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/public/forms/${accountId}/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch form data');
      return res.json();
    },
    enabled: !!accountId && !!slug
  });

  // Fetch business settings for the account
  const { data: settings } = useQuery({
    queryKey: ["/api/public/business-settings", accountId],
    queryFn: () => fetch(`/api/public/business-settings?userId=${accountId}`).then(res => res.json()),
    enabled: !!accountId,
  });

  // Extract data from custom form response
  const formulas = formData?.formulas || [];
  const form = formData?.form;
  
  // Filter formulas to only show those that are displayed
  const displayedFormulas = formulas.filter((formula: any) => formula.isDisplayed !== false);

  const availableFormulas = displayedFormulas;
  const businessSettings = settings as BusinessSettings;
  const styling = businessSettings?.styling || {} as StylingOptions;

  // Auto-select services from the custom form
  useEffect(() => {
    if (form?.serviceIds && selectedServices.length === 0) {
      setSelectedServices(form.serviceIds);
    }
  }, [form?.serviceIds, selectedServices.length]);

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
        body: JSON.stringify({
          ...leadData,
          businessOwnerId: accountId
        })
      });
      if (!response.ok) {
        throw new Error('Failed to submit lead');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSubmittedLeadId(data.id);
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

    // If this is for contact-first flow or no services selected yet, proceed to services
    if (styling.requireContactFirst || selectedServices.length === 0) {
      setCurrentStep("services");
    } else {
      // Otherwise submit the quote request
      handleSubmitQuoteRequest();
    }
  };

  // Submit final quote request
  const handleSubmitQuoteRequest = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "No services selected",
        description: "Please select at least one service.",
        variant: "destructive",
      });
      return;
    }

    // Prepare service data for submission
    const serviceData = selectedServices.map(serviceId => {
      const formula = availableFormulas.find(f => f.id === serviceId);
      const variables = serviceVariables[serviceId] || {};
      const calculatedPrice = serviceCalculations[serviceId] || 0;
      
      return {
        formulaId: serviceId,
        formulaName: formula?.name || '',
        variables,
        calculatedPrice
      };
    });

    const subtotal = selectedServices.reduce((total, serviceId) => {
      return total + (serviceCalculations[serviceId] || 0);
    }, 0);

    submitMultiServiceLeadMutation.mutate({
      name: leadForm.name,
      email: leadForm.email,
      phone: leadForm.phone,
      address: leadForm.address,
      notes: leadForm.notes,
      howDidYouHear: leadForm.howDidYouHear,
      services: serviceData,
      totalPrice: subtotal,
      uploadedImages
    });
  };

  // Toggle service selection
  const handleServiceToggle = (formulaId: number) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(formulaId);
      if (isSelected) {
        // Remove service and its variables
        setServiceVariables(prevVars => {
          const newVars = { ...prevVars };
          delete newVars[formulaId];
          return newVars;
        });
        setServiceCalculations(prevCalcs => {
          const newCalcs = { ...prevCalcs };
          delete newCalcs[formulaId];
          return newCalcs;
        });
        return prev.filter(id => id !== formulaId);
      } else {
        return [...prev, formulaId];
      }
    });
  };

  // Calculate price for a service
  const calculatePrice = (formula: Formula, variables: Record<string, any>) => {
    try {
      if (!formula.formula) return 0;
      
      let formulaExpression = formula.formula;
      
      formula.variables.forEach((variable) => {
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
      const calculatedPrice = Math.round(Number(result) || 0);
      
      setServiceCalculations(prev => ({
        ...prev,
        [formula.id]: calculatedPrice
      }));
    } catch (error) {
      console.error('Formula calculation error:', error);
      setServiceCalculations(prev => ({
        ...prev,
        [formula.id]: 0
      }));
    }
  };

  // Handle variable change for a specific service
  const handleVariableChange = (serviceId: number, variableId: string, value: any) => {
    const newVariables = {
      ...serviceVariables[serviceId],
      [variableId]: value
    };
    
    setServiceVariables(prev => ({
      ...prev,
      [serviceId]: newVariables
    }));

    // Recalculate price for this service
    const formula = availableFormulas.find(f => f.id === serviceId);
    if (formula) {
      calculatePrice(formula, newVariables);
    }
  };

  if (formulasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your form.</p>
        </div>
      </div>
    );
  }

  if (!formData || !businessSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Form Not Found</h1>
          <p className="text-gray-600">This custom form doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  // Calculate subtotal and other pricing
  const subtotal = selectedServices.reduce((total, serviceId) => {
    return total + (serviceCalculations[serviceId] || 0);
  }, 0);

  // Apply bundle discount if applicable
  const bundleDiscount = styling.showBundleDiscount && selectedServices.length >= (styling.bundleMinServices || 2)
    ? Math.round(subtotal * ((styling.bundleDiscountPercent || 10) / 100))
    : 0;

  // Calculate tax
  const afterDiscount = subtotal - bundleDiscount;
  const taxAmount = styling.enableSalesTax 
    ? Math.round(afterDiscount * ((styling.salesTaxRate || 0) / 100))
    : 0;

  const totalAmount = afterDiscount + taxAmount;

  // Styling helpers
  const containerStyles = {
    backgroundColor: styling.backgroundColor || '#ffffff',
    minHeight: '100vh',
    fontFamily: styling.fontFamily === 'inter' ? '"Inter", sans-serif' :
                styling.fontFamily === 'roboto' ? '"Roboto", sans-serif' :
                styling.fontFamily === 'opensans' ? '"Open Sans", sans-serif' :
                styling.fontFamily === 'lato' ? '"Lato", sans-serif' :
                styling.fontFamily === 'montserrat' ? '"Montserrat", sans-serif' :
                styling.fontFamily === 'poppins' ? '"Poppins", sans-serif' :
                '"Inter", sans-serif'
  };

  const cardStyles = {
    borderRadius: `${styling.containerBorderRadius || 12}px`,
    boxShadow: styling.containerShadow === 'none' ? 'none' : 
               styling.containerShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' :
               styling.containerShadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' :
               styling.containerShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' :
               styling.containerShadow === 'xl' ? '0 20px 25px rgba(0,0,0,0.1)' : 
               '0 1px 3px rgba(0,0,0,0.1)',
    borderWidth: `${styling.containerBorderWidth || 1}px`,
    borderColor: styling.containerBorderColor || '#e5e7eb'
  };

  const buttonStyles = {
    backgroundColor: styling.primaryColor || '#3b82f6',
    color: styling.buttonTextColor || '#ffffff',
    borderRadius: `${styling.buttonBorderRadius || 8}px`,
    padding: styling.buttonPadding === 'sm' ? '8px 16px' :
             styling.buttonPadding === 'md' ? '12px 24px' :
             styling.buttonPadding === 'lg' ? '16px 32px' :
             styling.buttonPadding === 'xl' ? '20px 40px' : '12px 24px',
    fontWeight: styling.buttonFontWeight || 'medium',
    boxShadow: styling.buttonShadow === 'none' ? 'none' :
              styling.buttonShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' :
              styling.buttonShadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' :
              styling.buttonShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' :
              styling.buttonShadow === 'xl' ? '0 20px 25px rgba(0,0,0,0.1)' : 
              '0 1px 3px rgba(0,0,0,0.1)'
  };

  const inputStyles = {
    borderRadius: `${styling.inputBorderRadius || 6}px`,
    borderWidth: `${styling.inputBorderWidth || 1}px`,
    borderColor: styling.inputBorderColor || '#d1d5db',
    backgroundColor: styling.inputBackgroundColor || '#ffffff',
    padding: styling.inputPadding === 'sm' ? '8px 12px' :
             styling.inputPadding === 'md' ? '12px 16px' :
             styling.inputPadding === 'lg' ? '16px 20px' : '12px 16px'
  };

  // Service icon helper
  const getServiceIcon = (formula: Formula) => {
    if (formula.iconId && formula.iconUrl) {
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.textContent = '⚙️';
            }
          }}
        />
      );
    }
    
    if (formula.iconUrl) {
      if (formula.iconUrl.length <= 4) {
        return formula.iconUrl;
      }
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.textContent = '⚙️';
            }
          }}
        />
      );
    }
    
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

  return (
    <GoogleMapsLoader>
    <div style={containerStyles} className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          
          {/* Header Section */}
          {!isEmbed && form?.name && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2" style={{ color: styling.textColor }}>
                {form.name}
              </h1>
              {form.description && (
                <p className="text-gray-600">{form.description}</p>
              )}
            </div>
          )}

          {/* Contact Step (if contact-first is enabled) */}
          {styling.requireContactFirst && currentStep === "contact" && (
            <Card style={cardStyles}>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {(styling.showSectionTitles || styling.showStepDescriptions) && (
                    <div className="text-center mb-6">
                      {styling.showSectionTitles && (
                        <h2 className="text-xl font-semibold mb-2">Your Contact Information</h2>
                      )}
                      {styling.showStepDescriptions && (
                        <p className="text-sm opacity-70">
                          We'll need your details to provide accurate pricing
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Contact form fields */}
                    {styling.requireName !== false && (
                      <div>
                        <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          {styling.nameLabel || 'Full Name'} {styling.requireName && '*'}
                        </Label>
                        <Input
                          id="name"
                          data-testid="input-name"
                          type="text"
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.nameLabel || 'Full Name').toLowerCase()}`}
                          required={styling.requireName}
                        />
                      </div>
                    )}
                    
                    {styling.requireEmail !== false && (
                      <div>
                        <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4" />
                          {styling.emailLabel || 'Email Address'} {styling.requireEmail && '*'}
                        </Label>
                        <Input
                          id="email"
                          data-testid="input-email"
                          type="email"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.emailLabel || 'Email Address').toLowerCase()}`}
                          required={styling.requireEmail}
                        />
                      </div>
                    )}
                    
                    {(styling.enablePhone !== false || styling.requirePhone) && (
                      <div>
                        <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4" />
                          {styling.phoneLabel || 'Phone Number'} {styling.requirePhone && '*'}
                        </Label>
                        <Input
                          id="phone"
                          data-testid="input-phone"
                          type="tel"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.phoneLabel || 'Phone Number').toLowerCase()}`}
                          required={styling.requirePhone}
                        />
                      </div>
                    )}

                    {styling.enableAddress && (
                      <div>
                        <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          {styling.addressLabel || 'Address'} {styling.requireAddress && '*'}
                        </Label>
                        <Input
                          id="address"
                          data-testid="input-address"
                          type="text"
                          value={leadForm.address || ''}
                          onChange={(e) => setLeadForm({...leadForm, address: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.addressLabel || 'Address').toLowerCase()}`}
                          required={styling.requireAddress}
                        />
                      </div>
                    )}

                    <div className="pt-4">
                      <Button
                        data-testid="button-continue"
                        onClick={handleContactSubmit}
                        style={buttonStyles}
                        size="lg"
                        className="w-full text-white"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Selection Step */}
          {currentStep === "services" && (!styling.requireContactFirst || contactSubmitted) && (
            <Card style={cardStyles}>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {(styling.showSectionTitles || styling.showStepDescriptions) && (
                    <div className="text-center mb-6">
                      {styling.showSectionTitles && (
                        <h2 className="text-xl font-semibold mb-2">Select Your Services</h2>
                      )}
                      {styling.showStepDescriptions && (
                        <p className="text-sm opacity-70">
                          Choose the services you're interested in
                        </p>
                      )}
                    </div>
                  )}

                  <div className={`grid gap-4 ${
                    availableFormulas.length === 1 ? 'grid-cols-1' :
                    availableFormulas.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  }`}>
                    {availableFormulas.map((formula) => (
                      <Card
                        key={formula.id}
                        data-testid={`card-service-${formula.id}`}
                        className={`cursor-pointer transition-all duration-200 hover:scale-105 min-h-[260px] ${
                          styling.serviceSelectorShadow === 'none' ? '' :
                          styling.serviceSelectorShadow === 'sm' ? 'shadow-sm' :
                          styling.serviceSelectorShadow === 'md' ? 'shadow-md' :
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
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center h-full pt-10 pb-4 px-4 justify-center">
                            <h3 className="font-black text-base lg:text-lg leading-[0.8] mb-4">
                              {formula.name}
                            </h3>
                            
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
                        data-testid="button-configure-services"
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
              </CardContent>
            </Card>
          )}

          {/* Configuration Step */}
          {currentStep === "configure" && selectedServices.length > 0 && showPricing && (
            <div className="space-y-6">
              {/* Connected Variables Section */}
              {getConnectedVariables().length > 0 && (
                <Card style={cardStyles}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Shared Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getConnectedVariables().map((connectedVar) => (
                        <EnhancedVariableInput
                          key={connectedVar.connectionKey}
                          variable={connectedVar.variable}
                          value={sharedVariables[connectedVar.connectionKey]}
                          onChange={(value) => handleConnectedVariableChange(connectedVar.connectionKey, value)}
                          styling={styling}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service-Specific Configuration */}
              {selectedServices.map(serviceId => {
                const formula = availableFormulas.find(f => f.id === serviceId);
                if (!formula) return null;

                const serviceSpecificVars = getServiceSpecificVariables(serviceId);
                if (serviceSpecificVars.length === 0) return null;

                return (
                  <Card key={serviceId} style={cardStyles}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="text-2xl">{getServiceIcon(formula)}</div>
                        <div>
                          <div>{formula.name}</div>
                          {serviceCalculations[serviceId] !== undefined && (
                            <div className="text-lg font-bold text-green-600">
                              ${serviceCalculations[serviceId].toLocaleString()}
                            </div>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {serviceSpecificVars.map(variable => (
                          <EnhancedVariableInput
                            key={variable.id}
                            variable={variable}
                            value={serviceVariables[serviceId]?.[variable.id]}
                            onChange={(value) => handleVariableChange(serviceId, variable.id, value)}
                            styling={styling}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <Button
                  data-testid="button-back-to-services"
                  variant="outline"
                  onClick={() => setCurrentStep("services")}
                  className="flex-1"
                >
                  ← Back to Services
                </Button>
                
                {!styling.requireContactFirst && (
                  <Button
                    data-testid="button-continue-to-contact"
                    onClick={() => setCurrentStep("contact")}
                    style={buttonStyles}
                    className="flex-1 text-white"
                  >
                    Continue to Contact →
                  </Button>
                )}
                
                {styling.requireContactFirst && (
                  <Button
                    data-testid="button-submit-quote"
                    onClick={handleSubmitQuoteRequest}
                    style={buttonStyles}
                    className="flex-1 text-white"
                    disabled={submitMultiServiceLeadMutation.isPending}
                  >
                    {submitMultiServiceLeadMutation.isPending ? "Submitting..." : "Submit Quote Request"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Contact Step (if not contact-first) */}
          {!styling.requireContactFirst && currentStep === "contact" && (
            <Card style={cardStyles}>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {(styling.showSectionTitles || styling.showStepDescriptions) && (
                    <div className="text-center mb-6">
                      {styling.showSectionTitles && (
                        <h2 className="text-xl font-semibold mb-2">Your Contact Information</h2>
                      )}
                      {styling.showStepDescriptions && (
                        <p className="text-sm opacity-70">
                          Almost done! Just need your contact details for the quote
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Same contact form fields as above */}
                    {styling.requireName !== false && (
                      <div>
                        <Label htmlFor="name-step2" className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          {styling.nameLabel || 'Full Name'} {styling.requireName && '*'}
                        </Label>
                        <Input
                          id="name-step2"
                          data-testid="input-name-final"
                          type="text"
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.nameLabel || 'Full Name').toLowerCase()}`}
                          required={styling.requireName}
                        />
                      </div>
                    )}
                    
                    {styling.requireEmail !== false && (
                      <div>
                        <Label htmlFor="email-step2" className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4" />
                          {styling.emailLabel || 'Email Address'} {styling.requireEmail && '*'}
                        </Label>
                        <Input
                          id="email-step2"
                          data-testid="input-email-final"
                          type="email"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.emailLabel || 'Email Address').toLowerCase()}`}
                          required={styling.requireEmail}
                        />
                      </div>
                    )}
                    
                    {(styling.enablePhone !== false || styling.requirePhone) && (
                      <div>
                        <Label htmlFor="phone-step2" className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4" />
                          {styling.phoneLabel || 'Phone Number'} {styling.requirePhone && '*'}
                        </Label>
                        <Input
                          id="phone-step2"
                          data-testid="input-phone-final"
                          type="tel"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.phoneLabel || 'Phone Number').toLowerCase()}`}
                          required={styling.requirePhone}
                        />
                      </div>
                    )}

                    {styling.enableAddress && (
                      <div>
                        <Label htmlFor="address-step2" className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          {styling.addressLabel || 'Address'} {styling.requireAddress && '*'}
                        </Label>
                        <Input
                          id="address-step2"
                          data-testid="input-address-final"
                          type="text"
                          value={leadForm.address || ''}
                          onChange={(e) => setLeadForm({...leadForm, address: e.target.value})}
                          style={inputStyles}
                          placeholder={`Enter your ${(styling.addressLabel || 'Address').toLowerCase()}`}
                          required={styling.requireAddress}
                        />
                      </div>
                    )}

                    {styling.enableNotes && (
                      <div>
                        <Label htmlFor="notes" className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4" />
                          {styling.notesLabel || 'Additional Notes'}
                        </Label>
                        <textarea
                          id="notes"
                          data-testid="input-notes"
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
                        data-testid="button-submit-final"
                        onClick={() => {
                          const nameValid = !styling.requireName || (leadForm.name && leadForm.name.trim());
                          const emailValid = !styling.requireEmail || (leadForm.email && leadForm.email.trim());
                          const phoneVisible = styling.enablePhone !== false;
                          const phoneValid = !phoneVisible || !styling.requirePhone || (leadForm.phone && leadForm.phone.trim());
                          const addressValid = !styling.enableAddress || !styling.requireAddress || Boolean(leadForm.address && leadForm.address.trim());
                          const imagesValid = !styling.requireImageUpload || uploadedImages.length > 0;
                          
                          if (nameValid && emailValid && phoneValid && addressValid && imagesValid) {
                            handleSubmitQuoteRequest();
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
                        {submitMultiServiceLeadMutation.isPending ? "Submitting..." : "Submit Quote Request"}
                      </Button>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      data-testid="button-back-to-configure"
                      onClick={() => setCurrentStep("configure")}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                      ← Back to configuration
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Step */}
          {currentStep === "results" && (
            <Card style={cardStyles}>
              <CardContent className="p-6">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: styling.textColor }}>
                      Quote Request Submitted!
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {styling.thankYouMessage || "Thank you for your interest! We'll review your requirements and contact you soon."}
                    </p>
                  </div>

                  {/* Quote Summary */}
                  <div className="bg-gray-50 rounded-lg p-6 text-left">
                    <h3 className="text-lg font-semibold mb-4">Quote Summary</h3>
                    
                    <div className="space-y-3">
                      {selectedServices.map(serviceId => {
                        const formula = availableFormulas.find(f => f.id === serviceId);
                        if (!formula) return null;
                        
                        return (
                          <div key={serviceId} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getServiceIcon(formula)}</span>
                              <span>{formula.name}</span>
                            </div>
                            <span className="font-semibold">
                              ${serviceCalculations[serviceId]?.toLocaleString() || '0'}
                            </span>
                          </div>
                        );
                      })}
                      
                      <Separator />
                      
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toLocaleString()}</span>
                      </div>
                      
                      {bundleDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Bundle Discount ({styling.bundleDiscountPercent}%):</span>
                          <span>-${bundleDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Tax ({styling.salesTaxRate}%):</span>
                          <span>${taxAmount.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total:</span>
                        <span style={{ color: styling.primaryColor }}>
                          ${totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Section */}
                  {businessSettings?.enableBooking && submittedLeadId && !showBooking && (
                    <div>
                      <Button
                        data-testid="button-schedule-appointment"
                        onClick={() => setShowBooking(true)}
                        style={buttonStyles}
                        size="lg"
                        className="text-white"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Appointment
                      </Button>
                    </div>
                  )}

                  {showBooking && submittedLeadId && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Schedule Your Appointment</h3>
                      <BookingCalendar
                        leadId={submittedLeadId}
                        businessOwnerId={accountId}
                        onBookingConfirmed={() => {
                          setShowBooking(false);
                          setBookedSlotId(submittedLeadId);
                          toast({
                            title: "Appointment booked!",
                            description: "We'll send you a confirmation email shortly.",
                          });
                        }}
                      />
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="text-sm text-gray-600">
                    <p>
                      Questions? Contact us at{" "}
                      <a 
                        href={`mailto:${styling.contactEmail || 'info@example.com'}`}
                        className="underline"
                        style={{ color: styling.primaryColor }}
                      >
                        {styling.contactEmail || 'info@example.com'}
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </GoogleMapsLoader>
  );
}