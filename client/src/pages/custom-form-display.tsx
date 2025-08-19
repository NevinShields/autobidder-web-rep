import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";
import MeasureMap from "@/components/measure-map";
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

export default function CustomFormDisplay() {
  const [match, params] = useRoute<{ accountId: string; slug: string }>("/f/:accountId/:slug");
  
  // Extract URL parameters
  const accountId = params?.accountId;
  const slug = params?.slug;
  
  // Check if this is an embed request
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbed = urlParams.get('embed') === '1';

  // State matching primary form exactly
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch custom form data
  const { data: formData, isLoading, error } = useQuery<CustomFormResponse>({
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
    enabled: !!accountId,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch business settings for the account
  const { data: businessSettings, isLoading: isLoadingBusiness } = useQuery<BusinessSettings>({
    queryKey: ['/api/public/business-settings', accountId],
    queryFn: () => fetch(`/api/public/business-settings?userId=${accountId}`).then(res => res.json()),
    enabled: !!accountId,
  });

  // Extract formulas from form data
  const formulas = formData?.formulas || [];
  const form = formData?.form;

  // Auto-select services from the custom form
  useEffect(() => {
    if (form?.serviceIds && selectedServices.length === 0) {
      setSelectedServices(form.serviceIds);
    }
  }, [form?.serviceIds, selectedServices.length]);

  // Submit lead mutation (same as primary form)
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
      setSubmittedLeadId(data.id);
      
      if (businessSettings?.enableBooking) {
        setCurrentStep("scheduling");
      } else {
        toast({
          title: "Quote request submitted!",
          description: "We'll get back to you soon with a detailed estimate.",
        });
      }
    },
  });

  // Calculate price for a service (same logic as primary form)
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

  // Pricing calculations (same as primary form)
  const subtotal = selectedServices.reduce((total, serviceId) => {
    return total + (serviceCalculations[serviceId] || 0);
  }, 0);

  const bundleDiscount = businessSettings?.styling?.showBundleDiscount && selectedServices.length > 1 
    ? Math.round(subtotal * (businessSettings?.styling?.bundleDiscountPercent || 10) / 100)
    : 0;

  const discountedSubtotal = subtotal - bundleDiscount;

  const taxAmount = businessSettings?.styling?.enableSalesTax 
    ? Math.round(discountedSubtotal * (businessSettings?.styling?.salesTaxRate || 8.25) / 100)
    : 0;

  const totalAmount = discountedSubtotal + taxAmount;

  // Get service icon (same logic as primary form)
  const getServiceIcon = (formula: Formula) => {
    if (formula.iconUrl) {
      if (formula.iconUrl.length <= 4) {
        return formula.iconUrl;
      }
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="w-8 h-8 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
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

  const handleSubmitQuoteRequest = () => {
    if (!leadForm.name || !leadForm.email || selectedServices.length === 0) {
      toast({
        title: "Please fill in all required fields and select at least one service",
        variant: "destructive",
      });
      return;
    }

    const services: ServiceCalculation[] = selectedServices.map(formulaId => {
      const formula = formulas?.find(f => f.id === formulaId);
      return {
        formulaId,
        formulaName: formula?.name || "Unknown Service",
        variables: serviceVariables[formulaId] || {},
        calculatedPrice: Math.round((serviceCalculations[formulaId] || 0) * 100)
      };
    });

    const appliedDiscounts = [];
    if (bundleDiscount > 0) {
      appliedDiscounts.push({
        name: 'Bundle Discount',
        type: 'percentage' as const,
        value: businessSettings?.styling?.bundleDiscountPercent || 10,
        amount: Math.round(bundleDiscount * 100)
      });
    }

    submitMultiServiceLeadMutation.mutate({
      services,
      totalPrice: Math.round(totalAmount * 100),
      leadInfo: leadForm,
      distanceInfo: distanceInfo || undefined,
      appliedDiscounts: appliedDiscounts.map(discount => ({
        id: 'bundle-discount',
        name: discount.name,
        percentage: discount.value,
        amount: discount.amount
      })),
      bundleDiscountAmount: bundleDiscount > 0 ? Math.round(bundleDiscount * 100) : undefined,
    });
  };

  if (!match) return null;
  
  if (isLoading || isLoadingDesign || isLoadingBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <div>Loading calculator...</div>
        </div>
      </div>
    );
  }

  if (error || !formData || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Form Not Found</h2>
              <p className="text-muted-foreground">
                {error?.message || "The requested form could not be loaded."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Form Unavailable</h2>
              <p className="text-muted-foreground">
                This form is currently disabled.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Apply design settings to component styles
  const componentStyles = {
    serviceSelector: {
      borderRadius: designSettings?.styling?.serviceSelectorBorderRadius || 8,
      borderWidth: designSettings?.styling?.serviceSelectorBorderWidth || 1,
      borderColor: designSettings?.styling?.serviceSelectorBorderColor || '#e5e7eb',
      backgroundColor: designSettings?.styling?.serviceSelectorBackgroundColor || '#ffffff',
      activeBackgroundColor: designSettings?.styling?.serviceSelectorSelectedBgColor || '#f3f4f6',
      activeBorderColor: designSettings?.styling?.serviceSelectorSelectedBorderColor || '#3b82f6',
      hoverBackgroundColor: designSettings?.styling?.serviceSelectorHoverBackgroundColor || '#f9fafb',
      hoverBorderColor: designSettings?.styling?.serviceSelectorHoverBorderColor || '#d1d5db',
      fontSize: designSettings?.styling?.serviceSelectorTitleFontSize || '16px',
      textColor: designSettings?.styling?.textColor || '#374151',
      selectedTextColor: designSettings?.styling?.textColor || '#1f2937',
    }
  };

  return (
    <div style={{
      backgroundColor: designSettings?.styling?.backgroundColor || '#ffffff',
      minHeight: '100vh',
      padding: isEmbed ? '16px' : '24px'
    }}>
      <div style={{ 
        maxWidth: `${designSettings?.styling?.serviceSelectorWidth || 800}px`,
        margin: '0 auto',
        gap: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {currentStep === "selection" && (
          <Card>
            <CardContent className="p-0">
              <EnhancedServiceSelector
                formulas={formulas}
                selectedServices={selectedServices}
                onServiceToggle={(formulaId) => {
                  setSelectedServices(prev => 
                    prev.includes(formulaId) 
                      ? prev.filter(id => id !== formulaId)
                      : [...prev, formulaId]
                  );
                }}
                onContinue={() => {
                  if (selectedServices.length === 0) {
                    toast({
                      title: "Please select at least one service",
                      variant: "destructive",
                    });
                    return;
                  }
                  setCurrentStep("configuration");
                }}
                styling={designSettings?.styling}
                componentStyles={componentStyles}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === "configuration" && selectedServices.length > 0 && (
          <div className="space-y-6">
            {selectedServices.map(serviceId => {
              const formula = formulas.find(f => f.id === serviceId);
              if (!formula) return null;

              const variables = serviceVariables[serviceId] || {};
              
              return (
                <Card key={serviceId} style={{
                  borderRadius: `${designSettings?.styling?.containerBorderRadius || 8}px`,
                  boxShadow: designSettings?.styling?.containerShadow === 'none' ? 'none' : 
                             designSettings?.styling?.containerShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' :
                             designSettings?.styling?.containerShadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' :
                             designSettings?.styling?.containerShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' :
                             designSettings?.styling?.containerShadow === 'xl' ? '0 20px 25px rgba(0,0,0,0.1)' : 
                             '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl">{getServiceIcon(formula)}</div>
                      <div>
                        <h3 className="text-lg font-semibold">{formula.name}</h3>
                        {formula.description && (
                          <p className="text-sm text-muted-foreground">{formula.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {formula.variables.map(variable => {
                        const isVisible = evaluateConditionalLogic(variable.conditionalLogic || [], variables, variables);
                        if (!isVisible) return null;

                        return (
                          <EnhancedVariableInput
                            key={variable.id}
                            variable={variable}
                            value={variables[variable.id]}
                            onChange={(value) => {
                              const newVariables = {
                                ...variables,
                                [variable.id]: value
                              };
                              
                              setServiceVariables(prev => ({
                                ...prev,
                                [serviceId]: newVariables
                              }));
                              
                              calculatePrice(formula, newVariables);
                            }}
                            styling={{}}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Service Total:</span>
                        <span className="text-lg font-bold" style={{ 
                          color: designSettings?.styling?.primaryColor || '#3b82f6' 
                        }}>
                          ${serviceCalculations[serviceId]?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("selection")}
                className="flex-1"
              >
                ← Back to Services
              </Button>
              <Button
                onClick={() => {
                  // Check if all required variables are filled
                  const allCompleted = selectedServices.every(serviceId => {
                    const formula = formulas.find(f => f.id === serviceId);
                    if (!formula) return false;
                    return areAllVisibleVariablesCompleted(formula.variables, serviceVariables[serviceId] || {});
                  });

                  if (!allCompleted) {
                    toast({
                      title: "Please complete all required fields",
                      variant: "destructive",
                    });
                    return;
                  }
                  setCurrentStep("contact");
                }}
                className="flex-1"
                style={{
                  backgroundColor: designSettings?.styling?.primaryColor || '#3b82f6',
                  color: designSettings?.styling?.buttonTextColor || '#ffffff'
                }}
              >
                Continue to Contact Info →
              </Button>
            </div>
          </div>
        )}

        {currentStep === "contact" && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={leadForm.address}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="notes">Additional Notes</Label>
                <Input
                  id="notes"
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("configuration")}
                  className="flex-1"
                >
                  ← Back
                </Button>
                <Button
                  onClick={() => setCurrentStep("pricing")}
                  className="flex-1"
                  style={{
                    backgroundColor: designSettings?.styling?.primaryColor || '#3b82f6',
                    color: designSettings?.styling?.primaryButtonTextColor || '#ffffff'
                  }}
                >
                  View Pricing →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "pricing" && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">Price Summary</h2>
              
              <div className="space-y-4">
                {selectedServices.map(serviceId => {
                  const formula = formulas.find(f => f.id === serviceId);
                  if (!formula) return null;

                  return (
                    <div key={serviceId} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{getServiceIcon(formula)}</div>
                        <span className="font-medium">{formula.name}</span>
                      </div>
                      <span className="font-semibold">
                        ${serviceCalculations[serviceId]?.toLocaleString() || '0'}
                      </span>
                    </div>
                  );
                })}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  
                  {bundleDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Bundle Discount ({businessSettings?.styling?.bundleDiscountPercent}%):</span>
                      <span>-${bundleDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({businessSettings?.styling?.salesTaxRate}%):</span>
                      <span>${taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span style={{ color: designSettings?.styling?.primaryColor || '#3b82f6' }}>
                      ${totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("contact")}
                  className="flex-1"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleSubmitQuoteRequest}
                  disabled={submitMultiServiceLeadMutation.isPending}
                  className="flex-1"
                  style={{
                    backgroundColor: designSettings?.styling?.primaryColor || '#3b82f6',
                    color: designSettings?.styling?.primaryButtonTextColor || '#ffffff'
                  }}
                >
                  {submitMultiServiceLeadMutation.isPending ? "Submitting..." : "Request Quote"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "scheduling" && submittedLeadId && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">Schedule Your Appointment</h2>
              <BookingCalendar
                leadId={submittedLeadId}
                businessOwnerId={accountId}
                onBookingConfirmed={() => {
                  setBookingConfirmed(true);
                  toast({
                    title: "Appointment booked!",
                    description: "We'll send you a confirmation email shortly.",
                  });
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}