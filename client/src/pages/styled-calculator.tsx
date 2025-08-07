import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Formula } from "@shared/schema";

interface ComponentStyles {
  textInput?: {
    width: string;
    height: number;
    margin: number;
    shadow: string;
    padding: number;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    backgroundColor: string;
  };
  dropdown?: {
    width: string;
    height: number;
    margin: number;
    shadow: string;
    padding: number;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    backgroundColor: string;
  };
  serviceSelector?: {
    width: string;
    height: number;
    margin: number;
    shadow: string;
    padding: number;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    backgroundColor: string;
  };
  questionCard?: {
    width: string;
    height: number;
    margin: number;
    shadow: string;
    padding: number;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    backgroundColor: string;
  };
  pricingCard?: {
    width: string;
    height: number;
    margin: number;
    shadow: string;
    padding: number;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    backgroundColor: string;
  };
}

interface Formula {
  id: number;
  name: string;
  title: string;
  description: string;
  variables: Array<{
    id: string;
    name: string;
    type: string;
    options?: Array<{ label: string; value: any }>;
  }>;
}

interface Service {
  id: number;
  name: string;
  icon: string;
  description: string;
  formulaId: number;
}

interface BusinessSettings {
  componentStyles: ComponentStyles;
}

// Helper function to get service icon based on name
const getServiceIcon = (serviceName: string): string => {
  const name = serviceName.toLowerCase();
  if (name.includes('house') || name.includes('home')) return "🏠";
  if (name.includes('driveway') || name.includes('concrete')) return "🚗";
  if (name.includes('deck') || name.includes('patio')) return "🏗️";
  if (name.includes('roof')) return "🏘️";
  if (name.includes('fence') || name.includes('railing')) return "🚧";
  if (name.includes('gutter')) return "🏠";
  if (name.includes('window')) return "🪟";
  if (name.includes('pressure') || name.includes('wash')) return "💧";
  return "🔧"; // Default icon
};

export default function StyledCalculator() {
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [serviceVariables, setServiceVariables] = useState<Record<number, Record<string, any>>>({});
  const [serviceCalculations, setServiceCalculations] = useState<Record<number, number>>({});
  const [showPricing, setShowPricing] = useState(false);
  
  // Use sample services for now - will be replaced with actual formulas
  const services: Service[] = [
    {
      id: 54, // House Washing formula ID
      name: "House Washing",
      icon: "🏠",
      description: "Complete exterior house cleaning service",
      formulaId: 54
    },
    {
      id: 55,
      name: "Driveway Cleaning", 
      icon: "🚗",
      description: "Pressure washing service for driveways",
      formulaId: 55
    },
    {
      id: 56,
      name: "Deck Cleaning",
      icon: "🏗️", 
      description: "Professional deck cleaning and restoration",
      formulaId: 56
    },
    {
      id: 57,
      name: "Roof Washing",
      icon: "🏘️",
      description: "Safe and effective roof cleaning",
      formulaId: 57
    }
  ];
  
  const servicesLoading = false;

  // Fetch business settings with component styles
  const { data: businessSettings, isLoading: settingsLoading } = useQuery<BusinessSettings>({
    queryKey: ["/api/business-settings"],
  });

  // Fetch individual formulas for selected services
  const selectedFormulas = useQuery({
    queryKey: ["/api/formulas", selectedServices],
    enabled: selectedServices.length > 0,
    queryFn: async () => {
      const formulas = await Promise.all(
        selectedServices.map(async (serviceId) => {
          const response = await fetch(`/api/formulas/${serviceId}`);
          if (response.ok) {
            return response.json();
          }
          return null;
        })
      );
      return formulas.filter(Boolean);
    },
  });

  const componentStyles = businessSettings?.componentStyles || {};

  // Helper functions for styling
  const getShadowValue = (shadow: string) => {
    const shadows = {
      none: "none",
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)"
    };
    return shadows[shadow as keyof typeof shadows] || shadows.sm;
  };

  const getWidthClass = (width: string) => {
    switch (width) {
      case 'sm': return 'w-48';
      case 'md': return 'w-80';
      case 'lg': return 'w-96';
      case 'xl': return 'w-[500px]';
      case '1/2': return 'w-1/2';
      case 'full': return 'w-full';
      default: return 'w-full';
    }
  };

  // Create styled components using the component styles
  const getInputStyle = (type: 'textInput' | 'dropdown') => {
    const styles = componentStyles[type];
    if (!styles) return {};

    return {
      backgroundColor: styles.backgroundColor,
      borderRadius: `${styles.borderRadius}px`,
      borderWidth: `${styles.borderWidth}px`,
      borderColor: styles.borderColor,
      borderStyle: styles.borderWidth > 0 ? 'solid' : 'none',
      padding: `${styles.padding}px`,
      boxShadow: getShadowValue(styles.shadow),
      height: `${styles.height}px`,
      margin: `${styles.margin}px`,
    };
  };

  const getCardStyle = (type: 'questionCard' | 'pricingCard') => {
    const styles = componentStyles[type];
    if (!styles) return {};

    return {
      backgroundColor: styles.backgroundColor,
      borderRadius: `${styles.borderRadius}px`,
      borderWidth: `${styles.borderWidth}px`,
      borderColor: styles.borderColor,
      borderStyle: styles.borderWidth > 0 ? 'solid' : 'none',
      padding: `${styles.padding}px`,
      boxShadow: getShadowValue(styles.shadow),
      minHeight: `${styles.height}px`,
      margin: `${styles.margin}px`,
    };
  };

  const getServiceSelectorStyle = () => {
    const styles = componentStyles.serviceSelector;
    if (!styles) return {};

    return {
      backgroundColor: styles.backgroundColor,
      borderRadius: `${styles.borderRadius}px`,
      borderWidth: `${styles.borderWidth}px`,
      borderColor: styles.borderColor,
      borderStyle: styles.borderWidth > 0 ? 'solid' : 'none',
      padding: `${styles.padding}px`,
      boxShadow: getShadowValue(styles.shadow),
      minHeight: `${styles.height}px`,
      margin: `${styles.margin}px`,
    };
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  if (servicesLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No Services Available</h1>
          <p className="text-gray-500">Unable to load services.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div style={getCardStyle('questionCard')} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Multi-Service Calculator</h1>
          <p className="text-gray-600">Select services and provide details to get your instant quote</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Component styles applied: {componentStyles ? 'Yes' : 'No'}</p>
            <p>Border settings: {componentStyles.textInput ? `${componentStyles.textInput.borderWidth}px ${componentStyles.textInput.borderColor}` : 'None'}</p>
          </div>
        </div>

        {/* Service Selector */}
        <div style={getCardStyle('questionCard')} className="mb-6">
          <Label className="text-base font-medium text-gray-900 mb-4 block">
            Select Services
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                style={getServiceSelectorStyle()}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedServices.includes(service.id)
                    ? 'ring-2 ring-blue-500 ring-opacity-50'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{service.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded border-2 ${
                      selectedServices.includes(service.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedServices.includes(service.id) && (
                        <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Configuration Sections - Only show for selected services */}
        {selectedServices.map((serviceId) => {
          const service = services.find(s => s.id === serviceId);
          const formula = selectedFormulas.data?.find((f: Formula) => f.id === serviceId);
          
          if (!service || !formula) return null;
          
          return (
            <div key={serviceId} style={getCardStyle('questionCard')} className="mb-6">
              <div className="flex items-center mb-4">
                <span className="text-xl mr-2">{service.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">{service.name} Configuration</h3>
              </div>
              
              {formula.variables.map((variable) => (
                <div key={variable.id} className="mb-4">
                  <Label className="text-base font-medium text-gray-900 mb-3 block">
                    {variable.name}
                  </Label>
                  
                  {variable.type === 'dropdown' && variable.options ? (
                    <Select 
                      onValueChange={(value) => setServiceVariables(prev => ({
                        ...prev,
                        [serviceId]: { ...prev[serviceId], [variable.id]: value }
                      }))}
                      value={serviceVariables[serviceId]?.[variable.id] || ""}
                    >
                      <SelectTrigger style={getInputStyle('dropdown')}>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {variable.options.map((option, index) => (
                          <SelectItem key={index} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : variable.type === 'multipleChoice' && variable.options ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {variable.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            serviceVariables[serviceId]?.[variable.id] === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setServiceVariables(prev => ({
                            ...prev,
                            [serviceId]: { ...prev[serviceId], [variable.id]: option.value }
                          }))}
                        >
                          <div className="font-medium">{option.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Input
                      type={variable.type === 'number' ? 'number' : 'text'}
                      placeholder={`Enter ${variable.name.toLowerCase()}`}
                      value={serviceVariables[serviceId]?.[variable.id] || ""}
                      onChange={(e) => setServiceVariables(prev => ({
                        ...prev,
                        [serviceId]: { 
                          ...prev[serviceId], 
                          [variable.id]: variable.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                        }
                      }))}
                      style={getInputStyle('textInput')}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {/* Calculate Quote Button - Only show when services selected */}
        {selectedServices.length > 0 && (
          <div style={getCardStyle('pricingCard')} className="text-center">
            <Button 
              onClick={() => setShowPricing(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              Calculate Quote for {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {/* Pricing Results - Only show after quote calculation */}
        {showPricing && selectedServices.length > 0 && (
          <div style={getCardStyle('pricingCard')} className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Quote</h3>
            {selectedServices.map((serviceId) => {
              const service = services.find(s => s.id === serviceId);
              return (
                <div key={serviceId} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="mr-2">{service?.icon}</span>
                      <span className="font-medium">{service?.name}</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      ${serviceCalculations[serviceId] || 250}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Estimate:</span>
                <span className="text-green-600">
                  ${selectedServices.reduce((total, serviceId) => 
                    total + (serviceCalculations[serviceId] || 250), 0
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                This quote is based on the selected services and your specific requirements.
              </p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-white rounded-lg border">
          <h4 className="font-semibold mb-2">Debug Information:</h4>
          <div className="text-xs text-gray-600 space-y-2">
            <p>Component styles loaded: {!!componentStyles ? 'Yes' : 'No'}</p>
            <p>Selected services: [{selectedServices.join(', ')}]</p>
            <p>Text input border: {componentStyles.textInput?.borderWidth}px {componentStyles.textInput?.borderColor}</p>
            <p>Service selector border: {componentStyles.serviceSelector?.borderWidth}px {componentStyles.serviceSelector?.borderColor}</p>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium">Component Styles JSON</summary>
            <pre className="text-xs text-gray-600 overflow-auto mt-2 p-2 bg-gray-50 rounded">
              {JSON.stringify({ 
                hasComponentStyles: !!componentStyles,
                textInputStyles: componentStyles.textInput,
                dropdownStyles: componentStyles.dropdown,
                serviceSelectorStyles: componentStyles.serviceSelector
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}