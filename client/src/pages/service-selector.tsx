import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, ShoppingCart } from "lucide-react";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Formula, ServiceCalculation } from "@shared/schema";



interface LeadFormData {
  name: string;
  email: string;
  phone: string;
}

export default function ServiceSelector() {
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [serviceVariables, setServiceVariables] = useState<Record<number, Record<string, any>>>({});
  const [serviceCalculations, setServiceCalculations] = useState<Record<number, number>>({});
  const [leadForm, setLeadForm] = useState<LeadFormData>({ name: "", email: "", phone: "" });
  const { toast } = useToast();

  const { data: formulas, isLoading } = useQuery({
    queryKey: ["/api/formulas"],
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
      setLeadForm({ name: "", email: "", phone: "" });
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
          value = option?.multiplier || option?.numericValue || 1;
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
          new RegExp(variable.id, 'g'),
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading services...</div>
      </div>
    );
  }

  const availableFormulas = (formulas as Formula[]) || [];
  const totalPrice = getTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Your Custom Quote</h1>
          <p className="text-gray-600">Select the services you need and get an instant price estimate</p>
        </div>

        {/* Service Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Available Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableFormulas.map((formula) => (
                <div
                  key={formula.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedServices.includes(formula.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleServiceToggle(formula.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedServices.includes(formula.id)}
                      onChange={() => {}} // Handled by parent click
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{formula.name}</h3>
                      <p className="text-sm text-gray-500">{formula.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Services Configuration */}
        {selectedServices.length > 0 && (
          <div className="space-y-6 mb-6">
            {selectedServices.map(formulaId => {
              const formula = availableFormulas.find(f => f.id === formulaId);
              if (!formula) return null;

              return (
                <Card key={formulaId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{formula.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {formula.variables.map((variable) => (
                        <EnhancedVariableInput
                          key={variable.id}
                          variable={variable}
                          value={serviceVariables[formulaId]?.[variable.id]}
                          onChange={(value) => handleVariableChange(formulaId, variable.id, value)}
                          styling={formula.styling}
                        />
                      ))}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <Button
                          onClick={() => calculateServicePrice(formula)}
                          variant="outline"
                        >
                          Calculate Price
                        </Button>
                        {serviceCalculations[formulaId] && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Estimated Price</p>
                            <p className="text-xl font-bold text-green-600">
                              ${serviceCalculations[formulaId].toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Total and Lead Capture */}
        {selectedServices.length > 0 && totalPrice > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Your Quote Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Selected Services Summary */}
                <div className="space-y-2">
                  {selectedServices.map(formulaId => {
                    const formula = availableFormulas.find(f => f.id === formulaId);
                    const price = serviceCalculations[formulaId];
                    if (!formula || !price) return null;
                    
                    return (
                      <div key={formulaId} className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700">{formula.name}</span>
                        <span className="font-medium">${price.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                  <span className="text-xl font-bold text-gray-900">Total Estimate</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Contact Form */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-lg font-medium mb-4">Get Your Detailed Quote</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmitQuoteRequest}
                    disabled={submitMultiServiceLeadMutation.isPending}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    {submitMultiServiceLeadMutation.isPending 
                      ? "Submitting..." 
                      : `Request Detailed Quote - ${totalPrice.toLocaleString()}`
                    }
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}