import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";
import type { Formula, DesignSettings, ServiceCalculation } from "@shared/schema";

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
}

interface StyledCalculatorProps {
  formula?: Formula;
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
    notes: ""
  });
  const [currentStep, setCurrentStep] = useState<"selection" | "configuration" | "contact" | "pricing">("selection");
  const { toast } = useToast();

  // Fetch design settings from new API
  const { data: designSettings, isLoading: isLoadingDesign } = useQuery<DesignSettings>({
    queryKey: ['/api/design-settings'],
  });

  // Fetch formulas if no formula is provided (for standalone page usage)
  const { data: formulas, isLoading: isLoadingFormulas } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
    enabled: !propFormula, // Only fetch if no formula prop provided
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
      setLeadForm({ name: "", email: "", phone: "", address: "", notes: "" });
      setCurrentStep("selection");
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

  const handleSubmitLead = () => {
    if (!leadForm.name || !leadForm.email || !leadForm.phone) {
      toast({
        title: "Please fill in all required fields",
        description: "Name, email, and phone are required.",
        variant: "destructive",
      });
      return;
    }

    const services: ServiceCalculation[] = selectedServices.map(serviceId => {
      const service = formulas?.find(f => f.id === serviceId);
      return {
        formulaId: serviceId,
        serviceName: service?.title || '',
        variables: serviceVariables[serviceId] || {},
        calculatedPrice: serviceCalculations[serviceId] || 0
      };
    });

    const totalPrice = Object.values(serviceCalculations).reduce((sum, price) => sum + price, 0);

    submitMultiServiceLeadMutation.mutate({
      services,
      totalPrice,
      leadInfo: leadForm
    });
  };

  // Get styling from design settings - map to the format components expect
  const styling = designSettings?.styling || {};
  const componentStyles = designSettings?.componentStyles || {};
  
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
  
  // Map component styles to the proper format for components
  const mappedComponentStyles = {
    textInput: componentStyles.textInput,
    dropdown: componentStyles.dropdown,
    multipleChoice: componentStyles.multipleChoice,
    pricingCard: componentStyles.pricingCard,
    questionCard: componentStyles.questionCard
  };

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
              style={{
                backgroundColor: styling.primaryColor || '#2563EB',
                borderRadius: `${styling.buttonBorderRadius || 12}px`,
                padding: '16px 24px',
                fontSize: '18px',
                fontWeight: '600',
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
                  <div className="space-y-4">
                    {service.variables.map((variable) => (
                      <EnhancedVariableInput
                        key={variable.id}
                        variable={variable}
                        value={serviceVariables[serviceId]?.[variable.id]}
                        onChange={(value) => handleServiceVariableChange(serviceId, variable.id, value)}
                        styling={styling}
                        componentStyles={mappedComponentStyles}
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
              style={{
                backgroundColor: styling.primaryColor || '#2563EB',
                borderRadius: `${styling.buttonBorderRadius || 12}px`,
                padding: '16px 24px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              Get Quote
            </Button>
          </div>
        );

      case "contact":
        const totalPrice = Object.values(serviceCalculations).reduce((sum, price) => sum + price, 0);
        
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

            {/* Price Preview */}
            <div 
              className="p-6 text-center rounded-lg mb-6"
              style={{
                backgroundColor: componentStyles.pricingCard?.backgroundColor || styling.resultBackgroundColor || '#F3F4F6',
                borderRadius: `${componentStyles.pricingCard?.borderRadius || styling.containerBorderRadius || 12}px`,
                borderWidth: `${componentStyles.pricingCard?.borderWidth || 1}px`,
                borderColor: componentStyles.pricingCard?.borderColor || '#E5E7EB',
                borderStyle: 'solid',
                boxShadow: getShadowValue(componentStyles.pricingCard?.shadow || 'sm'),
                padding: `${componentStyles.pricingCard?.padding || 24}px`,
              }}
            >
              <h3 
                className="text-3xl font-bold"
                style={{ color: styling.primaryColor || '#2563EB' }}
              >
                ${totalPrice.toLocaleString()}
              </h3>
              <p className="text-gray-600 mt-1">Estimated Total</p>
            </div>

            {/* Contact Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" style={{ color: styling.textColor || '#374151' }}>Name *</Label>
                <Input
                  id="name"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    backgroundColor: componentStyles.textInput?.backgroundColor || '#FFFFFF',
                    borderRadius: `${componentStyles.textInput?.borderRadius || 8}px`,
                    borderWidth: `${componentStyles.textInput?.borderWidth || 1}px`,
                    borderColor: componentStyles.textInput?.borderColor || '#E5E7EB',
                    borderStyle: 'solid',
                    padding: `${componentStyles.textInput?.padding || 12}px`,
                    boxShadow: getShadowValue(componentStyles.textInput?.shadow || 'sm'),
                    fontSize: '1rem',
                    color: '#374151',
                    height: `${componentStyles.textInput?.height || 40}px`,
                  }}
                />
              </div>
              <div>
                <Label htmlFor="email" style={{ color: styling.textColor || '#374151' }}>Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{
                    backgroundColor: componentStyles.textInput?.backgroundColor || '#FFFFFF',
                    borderRadius: `${componentStyles.textInput?.borderRadius || 8}px`,
                    borderWidth: `${componentStyles.textInput?.borderWidth || 1}px`,
                    borderColor: componentStyles.textInput?.borderColor || '#E5E7EB',
                    borderStyle: 'solid',
                    padding: `${componentStyles.textInput?.padding || 12}px`,
                    boxShadow: getShadowValue(componentStyles.textInput?.shadow || 'sm'),
                    fontSize: '1rem',
                    color: '#374151',
                    height: `${componentStyles.textInput?.height || 40}px`,
                  }}
                />
              </div>
              <div>
                <Label htmlFor="phone" style={{ color: styling.textColor || '#374151' }}>Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  style={{
                    backgroundColor: componentStyles.textInput?.backgroundColor || '#FFFFFF',
                    borderRadius: `${componentStyles.textInput?.borderRadius || 8}px`,
                    borderWidth: `${componentStyles.textInput?.borderWidth || 1}px`,
                    borderColor: componentStyles.textInput?.borderColor || '#E5E7EB',
                    borderStyle: 'solid',
                    padding: `${componentStyles.textInput?.padding || 12}px`,
                    boxShadow: getShadowValue(componentStyles.textInput?.shadow || 'sm'),
                    fontSize: '1rem',
                    color: '#374151',
                    height: `${componentStyles.textInput?.height || 40}px`,
                  }}
                />
              </div>
              <div>
                <Label htmlFor="address" style={{ color: styling.textColor || '#374151' }}>Address</Label>
                <Input
                  id="address"
                  value={leadForm.address}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, address: e.target.value }))}
                  style={{
                    backgroundColor: componentStyles.textInput?.backgroundColor || '#FFFFFF',
                    borderRadius: `${componentStyles.textInput?.borderRadius || 8}px`,
                    borderWidth: `${componentStyles.textInput?.borderWidth || 1}px`,
                    borderColor: componentStyles.textInput?.borderColor || '#E5E7EB',
                    borderStyle: 'solid',
                    padding: `${componentStyles.textInput?.padding || 12}px`,
                    boxShadow: getShadowValue(componentStyles.textInput?.shadow || 'sm'),
                    fontSize: '1rem',
                    color: '#374151',
                    height: `${componentStyles.textInput?.height || 40}px`,
                  }}
                />
              </div>
              <div>
                <Label htmlFor="notes" style={{ color: styling.textColor || '#374151' }}>Additional Notes</Label>
                <Input
                  id="notes"
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{
                    backgroundColor: componentStyles.textInput?.backgroundColor || '#FFFFFF',
                    borderRadius: `${componentStyles.textInput?.borderRadius || 8}px`,
                    borderWidth: `${componentStyles.textInput?.borderWidth || 1}px`,
                    borderColor: componentStyles.textInput?.borderColor || '#E5E7EB',
                    borderStyle: 'solid',
                    padding: `${componentStyles.textInput?.padding || 12}px`,
                    boxShadow: getShadowValue(componentStyles.textInput?.shadow || 'sm'),
                    fontSize: '1rem',
                    color: '#374151',
                    height: `${componentStyles.textInput?.height || 40}px`,
                  }}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmitLead}
              disabled={submitMultiServiceLeadMutation.isPending}
              className="w-full"
              style={{
                backgroundColor: styling.primaryColor || '#2563EB',
                borderRadius: `${styling.buttonBorderRadius || 12}px`,
                padding: '16px 24px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              {submitMultiServiceLeadMutation.isPending ? 'Submitting...' : 'Submit Quote Request'}
            </Button>
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