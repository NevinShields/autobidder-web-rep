import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calculator, ShoppingCart, ArrowRight, User, Mail, Phone, Receipt, Percent, MapPin, MessageSquare, HeadphonesIcon } from "lucide-react";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";
import ServiceCardDisplay from "@/components/service-card-display";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Formula, ServiceCalculation, BusinessSettings } from "@shared/schema";



interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
}

export default function ServiceSelector() {
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
  const [currentStep, setCurrentStep] = useState<"selection" | "configuration" | "contact" | "pricing">("selection");
  const { toast } = useToast();

  const { data: formulas, isLoading: formulasLoading } = useQuery({
    queryKey: ["/api/formulas"],
  });

  const { data: businessSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/business-settings"],
  });

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
      };
      return apiRequest("POST", "/api/multi-service-leads", payload);
    },
    onSuccess: () => {
      toast({
        title: "Quote request submitted successfully!",
        description: "We'll get back to you with detailed pricing soon.",
      });
      // Reset form
      setSelectedServices([]);
      setServiceVariables({});
      setServiceCalculations({});
      setLeadForm({ name: "", email: "", phone: "", address: "", notes: "", howDidYouHear: "" });
    },
    onError: () => {
      toast({
        title: "Failed to submit quote request",
        variant: "destructive",
      });
    },
  });

  const handleServiceToggle = (formulaId: number) => {
    if (selectedServices.includes(formulaId)) {
      setSelectedServices(prev => prev.filter(id => id !== formulaId));
      // Remove variables and calculations for this service
      setServiceVariables(prev => {
        const updated = { ...prev };
        delete updated[formulaId];
        return updated;
      });
      setServiceCalculations(prev => {
        const updated = { ...prev };
        delete updated[formulaId];
        return updated;
      });
    } else {
      setSelectedServices(prev => [...prev, formulaId]);
      // Initialize variables for this service
      setServiceVariables(prev => ({
        ...prev,
        [formulaId]: {}
      }));
    }
  };

  const handleVariableChange = (formulaId: number, variableId: string, value: any) => {
    setServiceVariables(prev => ({
      ...prev,
      [formulaId]: {
        ...prev[formulaId],
        [variableId]: value
      }
    }));
  };

  const calculateServicePrice = (formula: Formula) => {
    try {
      let formulaExpression = formula.formula;
      const variables = serviceVariables[formula.id] || {};
      
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
      const calculatedPrice = Math.round(result);
      
      setServiceCalculations(prev => ({
        ...prev,
        [formula.id]: calculatedPrice
      }));
    } catch (error) {
      console.error('Formula calculation error:', error);
      toast({
        title: "Calculation error",
        description: `Error calculating price for ${formula.name}`,
        variant: "destructive",
      });
    }
  };

  const getTotalPrice = () => {
    return Object.values(serviceCalculations).reduce((sum, price) => sum + price, 0);
  };

  // Pricing calculations matching embed-form
  const subtotal = selectedServices.reduce((total, serviceId) => {
    return total + (serviceCalculations[serviceId] || 0);
  }, 0);

  const bundleDiscount = (businessSettings as BusinessSettings)?.styling?.showBundleDiscount && selectedServices.length > 1 
    ? Math.round(subtotal * ((businessSettings as BusinessSettings)?.styling?.bundleDiscountPercent || 10) / 100)
    : 0;

  const discountedSubtotal = subtotal - bundleDiscount;

  const taxAmount = (businessSettings as BusinessSettings)?.styling?.enableSalesTax 
    ? Math.round(discountedSubtotal * ((businessSettings as BusinessSettings)?.styling?.salesTaxRate || 8.25) / 100)
    : 0;

  const totalAmount = discountedSubtotal + taxAmount;

  // Get service icon matching embed-form logic
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
          className="w-8 h-8 object-contain"
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

  const handleSubmitQuoteRequest = () => {
    if (!leadForm.name || !leadForm.email || selectedServices.length === 0) {
      toast({
        title: "Please fill in all required fields and select at least one service",
        variant: "destructive",
      });
      return;
    }

    const services: ServiceCalculation[] = selectedServices.map(formulaId => {
      const formula = (formulas as Formula[])?.find(f => f.id === formulaId);
      return {
        formulaId,
        formulaName: formula?.name || "Unknown Service",
        variables: serviceVariables[formulaId] || {},
        calculatedPrice: serviceCalculations[formulaId] || 0
      };
    });

    submitMultiServiceLeadMutation.mutate({
      services,
      totalPrice: getTotalPrice(),
      leadInfo: leadForm
    });
  };

  if (formulasLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading services...</div>
      </div>
    );
  }

  const availableFormulas = (formulas as Formula[]) || [];
  const settings = (businessSettings as BusinessSettings) || null;
  const totalPrice = getTotalPrice();
  
  // If no business settings exist, show setup message
  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Setup Required</h2>
            <p className="text-gray-600 mb-4">Business settings need to be configured first.</p>
            <Button onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const styling = settings.styling;
  
  // Generate dynamic styles
  const containerStyles = {
    width: `${styling.containerWidth}px`,
    height: `${styling.containerHeight}px`,
    borderRadius: `${styling.containerBorderRadius}px`,
    borderWidth: `${styling.containerBorderWidth}px`,
    borderColor: styling.containerBorderColor,
    backgroundColor: styling.backgroundColor,
    color: styling.textColor,
    fontFamily: styling.fontFamily.replace('-', ' '),
  };

  const shadowClasses = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  };

  const fontSizeClasses = {
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg'
  };

  const fontWeightClasses = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold'
  };

  const paddingClasses = {
    'sm': 'px-3 py-2',
    'md': 'px-4 py-3',
    'lg': 'px-6 py-4'
  };

  const buttonStyles = {
    backgroundColor: styling.primaryColor,
    borderRadius: styling.buttonStyle === 'pill' ? '9999px' : 
                  styling.buttonStyle === 'square' ? '0px' : 
                  `${styling.buttonBorderRadius}px`,
  };

  const inputStyles = {
    borderRadius: `${styling.inputBorderRadius}px`,
    borderWidth: `${styling.inputBorderWidth || 1}px`,
    borderColor: styling.inputBorderColor,
    backgroundColor: styling.inputBackgroundColor,
    boxShadow: styling.inputShadow === 'none' ? 'none' : 
              styling.inputShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
              styling.inputShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)' :
              styling.inputShadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)' :
              'none',
    color: styling.inputTextColor || styling.textColor,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex justify-center mb-4 sm:mb-8">
          <div 
            className={`mx-auto border overflow-hidden ${shadowClasses[styling.containerShadow]} ${fontSizeClasses[styling.fontSize]} ${fontWeightClasses[styling.fontWeight]} w-full max-w-none sm:max-w-2xl lg:max-w-4xl`}
            style={{
              ...containerStyles,
              width: window.innerWidth < 640 ? '100%' : `${styling.containerWidth}px`,
              height: 'auto',
              minHeight: window.innerWidth < 640 ? 'auto' : `${styling.containerHeight}px`,
            }}
          >
            <div className="p-3 sm:p-6 h-full">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold mb-2">{settings.businessName}</h1>
                <p className="text-xs sm:text-sm opacity-80">Select your services and get a custom quote</p>
              </div>

              {/* Progress Steps - Mobile Optimized */}
              <div className="flex items-center justify-center mb-6 sm:mb-8 space-x-2 sm:space-x-4 overflow-x-auto pb-2">
                <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'selection' ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'selection' ? 'bg-current text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <span className="text-xs whitespace-nowrap">Select</span>
                </div>
                
                {/* Standard flow: Services -> Configure -> Contact -> Quote */}
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 flex-shrink-0" />
                <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'configuration' ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'configuration' ? 'bg-current text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                  <span className="text-xs whitespace-nowrap">Configure</span>
                </div>
                {settings.enableLeadCapture && (
                  <>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 flex-shrink-0" />
                    <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'contact' ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'contact' ? 'bg-current text-white' : 'bg-gray-200 text-gray-600'}`}>
                        3
                      </div>
                      <span className="text-xs whitespace-nowrap">Contact</span>
                    </div>
                  </>
                )}
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 flex-shrink-0" />
                <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'pricing' ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'pricing' ? 'bg-current text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {settings.enableLeadCapture ? '4' : '3'}
                  </div>
                  <span className="text-xs whitespace-nowrap">Quote</span>
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1">
                {currentStep === 'selection' && (
                  <EnhancedServiceSelector
                    formulas={availableFormulas}
                    selectedServices={selectedServices}
                    onServiceToggle={handleServiceToggle}
                    onContinue={() => setCurrentStep('configuration')}
                    styling={{
                      containerBorderRadius: styling.containerBorderRadius,
                      containerShadow: styling.containerShadow,
                      primaryColor: styling.primaryColor,
                      textColor: styling.textColor,
                      backgroundColor: styling.backgroundColor,
                      buttonPadding: paddingClasses[styling.buttonPadding],
                      serviceSelectorWidth: styling.serviceSelectorWidth,
                      serviceSelectorBorderRadius: styling.serviceSelectorBorderRadius,
                      serviceSelectorShadow: styling.serviceSelectorShadow,
                      serviceSelectorBackgroundColor: styling.serviceSelectorBackgroundColor,
                      serviceSelectorBorderWidth: styling.serviceSelectorBorderWidth,
                      serviceSelectorBorderColor: styling.serviceSelectorBorderColor,
                      serviceSelectorHoverBgColor: styling.serviceSelectorHoverBgColor,
                      serviceSelectorHoverBorderColor: styling.serviceSelectorHoverBorderColor,
                      serviceSelectorSelectedBgColor: styling.serviceSelectorSelectedBgColor,
                      serviceSelectorSelectedBorderColor: styling.serviceSelectorSelectedBorderColor,
                      serviceSelectorTitleFontSize: styling.serviceSelectorTitleFontSize,
                      serviceSelectorDescriptionFontSize: styling.serviceSelectorDescriptionFontSize,
                      serviceSelectorIconSize: styling.serviceSelectorIconSize,
                      serviceSelectorPadding: styling.serviceSelectorPadding,
                      serviceSelectorGap: styling.serviceSelectorGap,
                    }}
                  />
                )}

                {currentStep === 'configuration' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold">Configure Your Services</h2>
                      <button
                        onClick={() => setCurrentStep('selection')}
                        className="text-xs sm:text-sm opacity-70 hover:opacity-100 transition-opacity"
                      >
                        ← Back
                      </button>
                    </div>

                    {selectedServices.map((serviceId) => {
                      const formula = availableFormulas.find(f => f.id === serviceId);
                      if (!formula) return null;

                      return (
                        <div key={serviceId} className="border border-opacity-20 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="font-medium text-sm sm:text-base">{formula.name}</h3>
                            {serviceCalculations[serviceId] && (
                              <div className="font-semibold text-sm sm:text-base">
                                ${serviceCalculations[serviceId].toLocaleString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2 sm:space-y-3">
                            {formula.variables.map((variable) => (
                              <div key={variable.id}>
                                <EnhancedVariableInput
                                  variable={variable}
                                  value={serviceVariables[serviceId]?.[variable.id] || ''}
                                  onChange={(value) => handleVariableChange(serviceId, variable.id, value)}
                                  styling={{
                                    inputBorderRadius: styling.inputBorderRadius,
                                    inputBorderWidth: styling.inputBorderWidth || 1,
                                    inputBorderColor: styling.inputBorderColor,
                                    inputBackgroundColor: styling.inputBackgroundColor,
                                    inputFocusColor: styling.inputFocusColor,
                                    inputShadow: styling.inputShadow || 'none',
                                    inputTextColor: styling.inputTextColor,
                                    primaryColor: styling.primaryColor,
                                    textColor: styling.textColor,
                                    backgroundColor: styling.backgroundColor,
                                    multiChoiceImageSize: styling.multiChoiceImageSize,
                                    multiChoiceImageShadow: styling.multiChoiceImageShadow,
                                    multiChoiceImageBorderRadius: styling.multiChoiceImageBorderRadius,
                                    multiChoiceCardBorderRadius: styling.multiChoiceCardBorderRadius,
                                    multiChoiceCardShadow: styling.multiChoiceCardShadow,
                                    multiChoiceSelectedColor: styling.multiChoiceSelectedColor,
                                    multiChoiceSelectedBgColor: styling.multiChoiceSelectedBgColor,
                                    multiChoiceHoverBgColor: styling.multiChoiceHoverBgColor,
                                    multiChoiceLayout: styling.multiChoiceLayout,
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Always show Next button - don't require calculations to proceed */}
                    <div className="border-t border-opacity-20 pt-3 sm:pt-4 mt-4 sm:mt-6">
                      {totalPrice > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <span className="font-semibold text-sm sm:text-base">Total Estimate:</span>
                            <span className="text-lg sm:text-xl font-bold">${totalPrice.toLocaleString()}</span>
                          </div>
                          
                          {styling.showPriceBreakdown && selectedServices.length > 1 && (
                            <div className="space-y-2 mb-4 text-sm opacity-80">
                              {selectedServices.map((serviceId) => {
                                const formula = availableFormulas.find(f => f.id === serviceId);
                                const price = serviceCalculations[serviceId];
                                if (!formula || !price) return null;
                                return (
                                  <div key={serviceId} className="flex justify-between">
                                    <span>{formula.name}</span>
                                    <span>${price.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (settings.enableLeadCapture) {
                            setCurrentStep('contact');
                          } else {
                            setCurrentStep('pricing');
                          }
                        }}
                        className={`w-full text-white font-medium ${paddingClasses[styling.buttonPadding]} rounded transition-colors`}
                        style={buttonStyles}
                        disabled={submitMultiServiceLeadMutation.isPending}
                      >
                        {settings.enableLeadCapture ? 'Continue to Contact' : 'View Your Quote'}
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'contact' && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold">Contact Information</h2>
                      <button
                        onClick={() => setCurrentStep('configuration')}
                        className="text-xs sm:text-sm opacity-70 hover:opacity-100 transition-opacity"
                      >
                        ← Back
                      </button>
                    </div>

                    {/* Show pricing summary */}
                    {totalPrice > 0 && (
                      <div className="border border-opacity-20 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                        <h3 className="font-medium mb-2 text-sm sm:text-base">Your Quote Summary</h3>
                        <div className="text-xl sm:text-2xl font-bold mb-2">${totalPrice.toLocaleString()}</div>
                        {selectedServices.length > 1 && (
                          <div className="text-xs sm:text-sm opacity-80">
                            {selectedServices.length} services selected
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                          style={inputStyles}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                          style={inputStyles}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                          style={inputStyles}
                        />
                      </div>

                      {/* Additional form fields matching embed-form */}
                      {(businessSettings as BusinessSettings)?.styling?.enableAddress && (
                        <div>
                          <Label htmlFor="address">
                            {(businessSettings as BusinessSettings)?.styling?.addressLabel || 'Address'}
                            {(businessSettings as BusinessSettings)?.styling?.requireAddress && ' *'}
                          </Label>
                          <Input
                            id="address"
                            type="text"
                            value={leadForm.address || ''}
                            onChange={(e) => setLeadForm({...leadForm, address: e.target.value})}
                            style={inputStyles}
                          />
                        </div>
                      )}

                      {(businessSettings as BusinessSettings)?.styling?.enableNotes && (
                        <div>
                          <Label htmlFor="notes">
                            {(businessSettings as BusinessSettings)?.styling?.notesLabel || 'Additional Notes'}
                          </Label>
                          <Input
                            id="notes"
                            type="text"
                            value={leadForm.notes || ''}
                            onChange={(e) => setLeadForm({...leadForm, notes: e.target.value})}
                            style={inputStyles}
                            placeholder="Tell us more about your project..."
                          />
                        </div>
                      )}

                      {(businessSettings as BusinessSettings)?.styling?.enableHowDidYouHear && (
                        <div>
                          <Label htmlFor="howDidYouHear">
                            {(businessSettings as BusinessSettings)?.styling?.howDidYouHearLabel || 'How did you hear about us?'}
                            {(businessSettings as BusinessSettings)?.styling?.requireHowDidYouHear && ' *'}
                          </Label>
                          <Input
                            id="howDidYouHear"
                            type="text"
                            value={leadForm.howDidYouHear || ''}
                            onChange={(e) => setLeadForm({...leadForm, howDidYouHear: e.target.value})}
                            style={inputStyles}
                            placeholder="Google, Facebook, referral, etc."
                          />
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setCurrentStep('pricing');
                        }}
                        className={`w-full text-white font-medium ${paddingClasses[styling.buttonPadding]} rounded transition-colors`}
                        style={buttonStyles}
                        disabled={!leadForm.name || !leadForm.email}
                      >
                        View Your Quote
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'pricing' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold mb-2">Your Custom Quote</h2>
                      <p className="text-sm opacity-70">Review your selected services and pricing</p>
                    </div>

                    {/* Service Cards Display */}
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
                      showPricing={true}
                    />

                    {/* Pricing Summary */}
                    {totalAmount > 0 && (
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
                                Bundle Discount ({(businessSettings as BusinessSettings)?.styling?.bundleDiscountPercent}% off)
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
                                <span>{(businessSettings as BusinessSettings)?.styling?.salesTaxLabel || 'Sales Tax'} ({(businessSettings as BusinessSettings)?.styling?.salesTaxRate}%)</span>
                                <span>${taxAmount.toLocaleString()}</span>
                              </div>
                            </>
                          )}

                          <Separator />
                          <div className="flex justify-between text-xl font-bold">
                            <span>Total</span>
                            <span style={{ color: styling.primaryColor }}>${totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Submit Button */}
                    <div className="text-center pt-4">
                      <button
                        onClick={handleSubmitQuoteRequest}
                        disabled={submitMultiServiceLeadMutation.isPending}
                        className={`w-full sm:w-auto px-8 py-4 text-white font-semibold rounded-lg transition-all ${
                          submitMultiServiceLeadMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                        }`}
                        style={buttonStyles}
                      >
                        {submitMultiServiceLeadMutation.isPending ? 'Submitting...' : 'Request This Quote'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}