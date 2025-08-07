import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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
  basePrice: number;
}

interface BusinessSettings {
  componentStyles: ComponentStyles;
}

export default function StyledCalculator() {
  const [values, setValues] = useState<Record<string, any>>({});
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  
  // Sample services data
  const sampleServices: Service[] = [
    {
      id: 1,
      name: "House Washing",
      icon: "🏠",
      description: "Complete exterior house cleaning",
      basePrice: 299
    },
    {
      id: 2,
      name: "Driveway Cleaning",
      icon: "🚗",
      description: "Pressure wash driveway and walkways",
      basePrice: 150
    },
    {
      id: 3,
      name: "Deck Cleaning",
      icon: "🏗️",
      description: "Deep clean and restore deck",
      basePrice: 199
    },
    {
      id: 4,
      name: "Roof Washing",
      icon: "🏘️",
      description: "Gentle roof cleaning and treatment",
      basePrice: 399
    }
  ];
  
  // Fetch formula data (using the House Washing formula as example)
  const { data: formula, isLoading: formulaLoading } = useQuery<Formula>({
    queryKey: ["/api/formulas/54"],
  });

  // Fetch business settings with component styles
  const { data: businessSettings, isLoading: settingsLoading } = useQuery<BusinessSettings>({
    queryKey: ["/api/business-settings"],
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

  if (formulaLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!formula) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Calculator Not Found</h1>
          <p className="text-gray-500">Unable to load the calculator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div style={getCardStyle('questionCard')} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{formula.title}</h1>
          <p className="text-gray-600">{formula.description}</p>
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
            {sampleServices.map((service) => (
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
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ${service.basePrice}
                    </p>
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

        {/* Variables */}
        {formula.variables.map((variable) => (
          <div key={variable.id} style={getCardStyle('questionCard')} className="mb-4">
            <Label className="text-base font-medium text-gray-900 mb-3 block">
              {variable.name}
            </Label>
            
            {variable.type === 'dropdown' && variable.options ? (
              <Select 
                onValueChange={(value) => setValues(prev => ({ ...prev, [variable.id]: value }))}
              >
                <SelectTrigger 
                  style={getInputStyle('dropdown')}
                  className={`border-0 ${getWidthClass(componentStyles.dropdown?.width || 'full')}`}
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {variable.options.map((option) => (
                    <SelectItem key={option.label} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={variable.type === 'number' ? 'number' : 'text'}
                placeholder={`Enter ${variable.name.toLowerCase()}`}
                value={values[variable.id] || ''}
                onChange={(e) => setValues(prev => ({ ...prev, [variable.id]: e.target.value }))}
                style={getInputStyle('textInput')}
                className={`border-0 ${getWidthClass(componentStyles.textInput?.width || 'full')}`}
              />
            )}
          </div>
        ))}

        {/* Pricing Card */}
        <div style={getCardStyle('pricingCard')} className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Estimated Price</h3>
          {selectedServices.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              <p className="mb-2">Selected Services:</p>
              {selectedServices.map(serviceId => {
                const service = sampleServices.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} className="flex justify-between">
                    <span>{service?.name}</span>
                    <span>${service?.basePrice}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-3xl font-bold text-green-600 mb-4">
            ${selectedServices.reduce((total, serviceId) => {
              const service = sampleServices.find(s => s.id === serviceId);
              return total + (service?.basePrice || 0);
            }, 0).toFixed(2)}
          </div>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={selectedServices.length === 0}
          >
            {selectedServices.length === 0 ? 'Select Services First' : 'Get Quote'}
          </Button>
        </div>

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