import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calculator, User, Mail, Phone, Receipt, Percent } from "lucide-react";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Formula, BusinessSettings, StylingOptions } from "@shared/schema";

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
}

interface ServicePricing {
  formulaId: number;
  formulaName: string;
  variables: Record<string, any>;
  calculatedPrice: number;
}

export default function EmbedForm() {
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [serviceVariables, setServiceVariables] = useState<Record<number, Record<string, any>>>({});
  const [serviceCalculations, setServiceCalculations] = useState<Record<number, number>>({});
  const [leadForm, setLeadForm] = useState<LeadFormData>({ name: "", email: "", phone: "" });
  const [showPricing, setShowPricing] = useState(false);
  const [currentStep, setCurrentStep] = useState<"services" | "contact" | "results">("services");
  const { toast } = useToast();

  // Fetch formulas and settings
  const { data: formulas, isLoading: formulasLoading } = useQuery({
    queryKey: ["/api/formulas"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/business-settings"],
  });

  const availableFormulas = (formulas as Formula[]) || [];
  const businessSettings = settings as BusinessSettings;
  const styling = businessSettings?.styling || {} as StylingOptions;

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
    onSuccess: () => {
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
    setServiceVariables(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [variableId]: value
      }
    }));

    // Recalculate price for this service
    const formula = availableFormulas.find(f => f.id === serviceId);
    if (formula?.formula) {
      try {
        const variables = { ...serviceVariables[serviceId], [variableId]: value };
        let formulaExpression = formula.formula;
        
        Object.entries(variables).forEach(([key, val]) => {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          formulaExpression = formulaExpression.replace(regex, String(Number(val) || 0));
        });
        
        const result = Function(`"use strict"; return (${formulaExpression})`)();
        const price = Math.round(Number(result) || 0);
        
        setServiceCalculations(prev => ({
          ...prev,
          [serviceId]: price
        }));
      } catch (error) {
        console.error('Formula calculation error:', error);
      }
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
    if (!leadForm.name || !leadForm.email) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email address.",
        variant: "destructive",
      });
      return;
    }

    const leadData = {
      customerName: leadForm.name,
      customerEmail: leadForm.email,
      customerPhone: leadForm.phone || null,
      services: selectedServices.map(serviceId => {
        const formula = availableFormulas.find(f => f.id === serviceId);
        return {
          formulaId: serviceId,
          formulaName: formula?.name || "Unknown Service",
          variables: serviceVariables[serviceId] || {},
          calculatedPrice: serviceCalculations[serviceId] || 0
        };
      }),
      totalAmount,
      subtotal,
      bundleDiscount,
      taxAmount,
      notes: `Multi-service quote request with ${selectedServices.length} services selected.`
    };

    submitMultiServiceLeadMutation.mutate(leadData);
  };

  // Handle contact-first flow
  useEffect(() => {
    if (styling.requireContactFirst && selectedServices.length > 0 && !leadForm.name) {
      setCurrentStep("contact");
    } else if (!styling.requireContactFirst && selectedServices.length > 0 && subtotal > 0) {
      setShowPricing(true);
    }
  }, [selectedServices, styling.requireContactFirst, subtotal, leadForm.name]);

  // Get service icon
  const getServiceIcon = (formula: Formula) => {
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

  // Styling variables
  const containerStyles = {
    backgroundColor: styling.backgroundColor || '#ffffff',
    color: styling.textColor || '#000000',
    borderRadius: `${styling.containerBorderRadius || 8}px`,
    borderWidth: `${styling.containerBorderWidth || 1}px`,
    borderColor: styling.containerBorderColor || '#e5e7eb',
    width: typeof styling.containerWidth === 'string' && styling.containerWidth === 'full' ? '100%' : `${styling.containerWidth || 600}px`,
    maxWidth: '100%',
    height: typeof styling.containerHeight === 'string' && styling.containerHeight === 'auto' ? 'auto' : `${styling.containerHeight || 800}px`,
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

  const buttonStyles = {
    backgroundColor: styling.primaryColor || '#3b82f6',
    borderRadius: styling.buttonStyle === 'pill' ? '9999px' : 
                  styling.buttonStyle === 'square' ? '0px' : 
                  `${styling.buttonBorderRadius || 8}px`,
  };

  const inputStyles = {
    backgroundColor: styling.inputBackgroundColor || '#ffffff',
    borderColor: styling.inputBorderColor || '#d1d5db',
    borderRadius: `${styling.inputBorderRadius || 8}px`,
  };

  if (formulasLoading || !businessSettings) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div 
            className={`border overflow-hidden ${shadowClasses[styling.containerShadow || 'md']}`}
            style={containerStyles}
          >
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: styling.textColor }}>
                  {businessSettings.businessName}
                </h1>
                <p className="text-lg opacity-80">Get Your Custom Quote</p>
              </div>

              {/* Services Step */}
              {currentStep === "services" && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold mb-2">Select Your Services</h2>
                    <p className="text-sm opacity-70">Choose the services you're interested in</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableFormulas.map((formula) => (
                      <Card 
                        key={formula.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedServices.includes(formula.id) 
                            ? 'ring-2 ring-offset-2' 
                            : 'hover:shadow-lg'
                        }`}
                        style={{
                          borderColor: selectedServices.includes(formula.id) 
                            ? styling.primaryColor 
                            : styling.containerBorderColor,
                        }}
                        onClick={() => handleServiceToggle(formula.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                              style={{ 
                                backgroundColor: `${styling.primaryColor || '#3b82f6'}20`,
                                color: styling.primaryColor || '#3b82f6'
                              }}
                            >
                              {getServiceIcon(formula)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-lg">{formula.name}</h3>
                                <Checkbox 
                                  checked={selectedServices.includes(formula.id)}
                                  onChange={() => handleServiceToggle(formula.id)}
                                />
                              </div>
                              {formula.title && (
                                <p className="text-sm opacity-70 mb-2">{formula.title}</p>
                              )}
                              <p className="text-xs opacity-60">
                                {formula.variables.length} customization options
                              </p>
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
                          if (styling.requireContactFirst) {
                            setCurrentStep("contact");
                          } else {
                            // Standard flow: show configuration immediately
                            setShowPricing(true);
                            // Stay on services step but show configuration section
                          }
                        }}
                        style={buttonStyles}
                        size="lg"
                        className="text-white px-8"
                      >
                        {styling.requireContactFirst ? "Continue" : "Configure Services"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Step */}
              {currentStep === "contact" && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold mb-2">Your Contact Information</h2>
                    <p className="text-sm opacity-70">
                      {styling.requireContactFirst 
                        ? "We'll need your details to provide accurate pricing"
                        : "Almost done! Just need your contact details for the quote"
                      }
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                        style={inputStyles}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                        style={inputStyles}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                        style={inputStyles}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={() => {
                          if (styling.requireContactFirst && leadForm.name && leadForm.email) {
                            // Move to service configuration step
                            setCurrentStep("services");
                            setShowPricing(true);
                          } else if (leadForm.name && leadForm.email) {
                            handleSubmitQuoteRequest();
                          }
                        }}
                        style={buttonStyles}
                        size="lg"
                        className="w-full text-white"
                        disabled={!leadForm.name || !leadForm.email}
                      >
                        {styling.requireContactFirst ? "Continue to Services" : "Get My Quote"}
                      </Button>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setCurrentStep("services")}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                      ← Back to services
                    </button>
                  </div>
                </div>
              )}

              {/* Service Configuration with Pricing (shown after contact in contact-first flow OR immediately in standard flow) */}
              {showPricing && currentStep === "services" && (styling.requireContactFirst ? leadForm.name : true) && (
                <div className="space-y-6 mt-8 pt-8 border-t border-opacity-20">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold mb-2">Configure Your Services</h2>
                    <p className="text-sm opacity-70">Customize each service to get accurate pricing</p>
                  </div>

                  {selectedServices.map((serviceId) => {
                    const formula = availableFormulas.find(f => f.id === serviceId);
                    if (!formula) return null;

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
                          {serviceCalculations[serviceId] && (
                            <div className="text-right">
                              <div className="text-xl font-bold" style={{ color: styling.textColor }}>
                                ${serviceCalculations[serviceId].toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {formula.variables.map((variable) => (
                            <EnhancedVariableInput
                              key={variable.id}
                              variable={variable}
                              value={serviceVariables[serviceId]?.[variable.id] || ''}
                              onChange={(value) => handleVariableChange(serviceId, variable.id, value)}
                              styling={{
                                inputBorderRadius: styling.inputBorderRadius || 8,
                                inputBorderColor: styling.inputBorderColor || '#d1d5db',
                                inputBackgroundColor: styling.inputBackgroundColor || '#ffffff',
                                inputFocusColor: styling.inputFocusColor || '#3b82f6',
                                primaryColor: styling.primaryColor || '#3b82f6',
                              }}
                            />
                          ))}
                        </div>
                      </Card>
                    );
                  })}

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
                            if (styling.requireContactFirst || (leadForm.name && leadForm.email)) {
                              handleSubmitQuoteRequest();
                            } else {
                              setCurrentStep("contact");
                            }
                          }}
                          disabled={submitMultiServiceLeadMutation.isPending}
                          style={buttonStyles}
                          size="lg"
                          className="w-full text-white mt-6"
                        >
                          {submitMultiServiceLeadMutation.isPending ? 'Submitting...' : 
                           (styling.requireContactFirst || (leadForm.name && leadForm.email)) ? 'Submit Quote Request' : 'Get Quote'}
                        </Button>

                        <p className="text-xs text-center opacity-60 mt-3">
                          We'll contact you within 24 hours to discuss your project details
                        </p>
                      </div>
                    </Card>
                  )}
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
  );
}