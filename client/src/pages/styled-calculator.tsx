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
  const [currentPhase, setCurrentPhase] = useState<"services" | "configure" | "contact" | "pricing" | "booking">("services");
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    howDidYouHear: ""
  });
  const [selectedUpsells, setSelectedUpsells] = useState<Record<number, number[]>>({});
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

  // Get icon size based on settings
  const getIconSize = () => {
    const styles = componentStyles.serviceSelector || {};
    const sizeUnit = styles.iconSizeUnit || 'preset';
    
    if (sizeUnit === 'pixels') {
      return `${styles.iconSizePixels || 32}px`;
    } else if (sizeUnit === 'percent') {
      return `${styles.iconSizePercent || 100}%`;
    } else {
      // Preset sizes
      const iconSize = styles.iconSize || 'xl';
      const presetSizes = {
        sm: '16px',
        md: '20px', 
        lg: '24px',
        xl: '32px'
      };
      return presetSizes[iconSize as keyof typeof presetSizes] || '32px';
    }
  };

  // Get layout class based on icon position
  const getServiceCardLayoutClass = () => {
    const styles = componentStyles.serviceSelector || {};
    const position = styles.iconPosition || 'left';
    
    switch (position) {
      case 'left':
        return 'flex items-center space-x-3';
      case 'right':
        return 'flex items-center space-x-3 flex-row-reverse space-x-reverse';
      case 'top':
        return 'flex flex-col items-center space-y-2';
      case 'bottom':
        return 'flex flex-col-reverse items-center space-y-2 space-y-reverse';
      default:
        return 'flex items-center space-x-3';
    }
  };

  // Get text alignment based on icon position
  const getTextAlignment = () => {
    const styles = componentStyles.serviceSelector || {};
    const position = styles.iconPosition || 'left';
    
    if (position === 'top' || position === 'bottom') {
      return 'text-center';
    }
    return '';
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Navigation helpers
  const handleNextPhase = () => {
    if (currentPhase === "services" && selectedServices.length > 0) {
      setCurrentPhase("configure");
      setCurrentServiceIndex(0);
    } else if (currentPhase === "configure") {
      // Check if guided mode - for now assume not guided
      setCurrentPhase("contact");
    } else if (currentPhase === "contact") {
      setCurrentPhase("pricing");
    } else if (currentPhase === "pricing") {
      setCurrentPhase("booking");
    }
  };

  const handlePrevPhase = () => {
    if (currentPhase === "configure") {
      setCurrentPhase("services");
    } else if (currentPhase === "contact") {
      setCurrentPhase("configure");
    } else if (currentPhase === "pricing") {
      setCurrentPhase("contact");
    } else if (currentPhase === "booking") {
      setCurrentPhase("pricing");
    }
  };

  const handleNextService = () => {
    if (currentServiceIndex < selectedServices.length - 1) {
      setCurrentServiceIndex(prev => prev + 1);
    } else {
      handleNextPhase();
    }
  };

  const handlePrevService = () => {
    if (currentServiceIndex > 0) {
      setCurrentServiceIndex(prev => prev - 1);
    }
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

  // Render different phases
  const renderPhaseContent = () => {
    switch (currentPhase) {
      case "services":
        return (
          <div>
            <div style={getCardStyle('questionCard')} className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Services</h1>
              <p className="text-gray-600">Choose the services you need for your property</p>
            </div>

            <div style={getCardStyle('questionCard')} className="mb-6">
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
                    <div className={getServiceCardLayoutClass()}>
                      <div 
                        className="flex-shrink-0"
                        style={{ fontSize: getIconSize() }}
                      >
                        {service.icon}
                      </div>
                      <div className={`flex-1 ${getTextAlignment()}`}>
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

            {selectedServices.length > 0 && (
              <div className="text-center">
                <Button 
                  onClick={handleNextPhase}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg"
                >
                  Next - Configure Services ({selectedServices.length})
                </Button>
              </div>
            )}
          </div>
        );

      case "configure":
        const currentService = services.find(s => s.id === selectedServices[currentServiceIndex]);
        const currentFormula = selectedFormulas.data?.find((f: Formula) => f.id === selectedServices[currentServiceIndex]);
        
        if (!currentService || !currentFormula) {
          return <div>Loading service configuration...</div>;
        }

        return (
          <div>
            <div style={getCardStyle('questionCard')} className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="mr-2" style={{ fontSize: getIconSize() }}>{currentService.icon}</span>
                  <h1 className="text-2xl font-bold text-gray-900">{currentService.name} Configuration</h1>
                </div>
                <div className="text-sm text-gray-500">
                  Step {currentServiceIndex + 1} of {selectedServices.length}
                </div>
              </div>
              <p className="text-gray-600">Please provide details for your {currentService.name.toLowerCase()} service</p>
            </div>

            <div style={getCardStyle('questionCard')} className="mb-6">
              {currentFormula.variables.map((variable) => (
                <div key={variable.id} className="mb-6">
                  <Label className="text-base font-medium text-gray-900 mb-3 block">
                    {variable.name}
                  </Label>
                  
                  {variable.type === 'dropdown' && variable.options ? (
                    <Select 
                      onValueChange={(value) => setServiceVariables(prev => ({
                        ...prev,
                        [selectedServices[currentServiceIndex]]: { 
                          ...prev[selectedServices[currentServiceIndex]], 
                          [variable.id]: value 
                        }
                      }))}
                      value={serviceVariables[selectedServices[currentServiceIndex]]?.[variable.id] || ""}
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
                            serviceVariables[selectedServices[currentServiceIndex]]?.[variable.id] === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setServiceVariables(prev => ({
                            ...prev,
                            [selectedServices[currentServiceIndex]]: { 
                              ...prev[selectedServices[currentServiceIndex]], 
                              [variable.id]: option.value 
                            }
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
                      value={serviceVariables[selectedServices[currentServiceIndex]]?.[variable.id] || ""}
                      onChange={(e) => setServiceVariables(prev => ({
                        ...prev,
                        [selectedServices[currentServiceIndex]]: { 
                          ...prev[selectedServices[currentServiceIndex]], 
                          [variable.id]: variable.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                        }
                      }))}
                      style={getInputStyle('textInput')}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={currentServiceIndex > 0 ? handlePrevService : handlePrevPhase}
                variant="outline"
                className="px-6 py-2"
              >
                {currentServiceIndex > 0 ? 'Previous Service' : 'Back to Services'}
              </Button>
              <Button 
                onClick={handleNextService}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                {currentServiceIndex < selectedServices.length - 1 ? 'Next Service' : 'Continue to Contact'}
              </Button>
            </div>
          </div>
        );

      case "contact":
        return (
          <div>
            <div style={getCardStyle('questionCard')} className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h1>
              <p className="text-gray-600">Please provide your contact details to receive your quote</p>
            </div>

            <div style={getCardStyle('questionCard')} className="mb-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium text-gray-900 mb-2 block">Name *</Label>
                  <Input
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    style={getInputStyle('textInput')}
                  />
                </div>
                <div>
                  <Label className="text-base font-medium text-gray-900 mb-2 block">Email *</Label>
                  <Input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                    style={getInputStyle('textInput')}
                  />
                </div>
                <div>
                  <Label className="text-base font-medium text-gray-900 mb-2 block">Phone *</Label>
                  <Input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    style={getInputStyle('textInput')}
                  />
                </div>
                <div>
                  <Label className="text-base font-medium text-gray-900 mb-2 block">Property Address</Label>
                  <Input
                    value={leadForm.address}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your property address"
                    style={getInputStyle('textInput')}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={handlePrevPhase}
                variant="outline"
                className="px-6 py-2"
              >
                Back to Configuration
              </Button>
              <Button 
                onClick={handleNextPhase}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                disabled={!leadForm.name || !leadForm.email || !leadForm.phone}
              >
                Continue to Pricing
              </Button>
            </div>
          </div>
        );

      case "pricing":
        return (
          <div>
            <div style={getCardStyle('questionCard')} className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Quote</h1>
              <p className="text-gray-600">Review your services and pricing details</p>
            </div>

            <div style={getCardStyle('pricingCard')} className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Breakdown</h3>
              {selectedServices.map((serviceId) => {
                const service = services.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="mr-2" style={{ fontSize: getIconSize() }}>{service?.icon}</span>
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
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={handlePrevPhase}
                variant="outline"
                className="px-6 py-2"
              >
                Back to Contact
              </Button>
              <Button 
                onClick={handleNextPhase}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
              >
                Accept & Book Service
              </Button>
            </div>
          </div>
        );

      case "booking":
        return (
          <div>
            <div style={getCardStyle('questionCard')} className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule Your Service</h1>
              <p className="text-gray-600">Choose a convenient date and time for your service</p>
            </div>

            <div style={getCardStyle('questionCard')} className="mb-6 text-center">
              <p className="text-gray-600 mb-4">Booking calendar will be implemented here</p>
              <div className="p-8 bg-gray-100 rounded-lg">
                <p className="text-lg font-medium">Calendar Component</p>
                <p className="text-sm text-gray-500 mt-2">Date picker and time slot selection</p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={handlePrevPhase}
                variant="outline"
                className="px-6 py-2"
              >
                Back to Pricing
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        );

      default:
        return <div>Unknown phase</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className={`${currentPhase === "services" ? "text-blue-600 font-medium" : ""}`}>
              1. Services
            </div>
            <div className={`${currentPhase === "configure" ? "text-blue-600 font-medium" : ""}`}>
              2. Configure
            </div>
            <div className={`${currentPhase === "contact" ? "text-blue-600 font-medium" : ""}`}>
              3. Contact
            </div>
            <div className={`${currentPhase === "pricing" ? "text-blue-600 font-medium" : ""}`}>
              4. Pricing
            </div>
            <div className={`${currentPhase === "booking" ? "text-blue-600 font-medium" : ""}`}>
              5. Booking
            </div>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${
                  currentPhase === "services" ? "20%" :
                  currentPhase === "configure" ? "40%" :
                  currentPhase === "contact" ? "60%" :
                  currentPhase === "pricing" ? "80%" :
                  "100%"
                }%` 
              }}
            />
          </div>
        </div>

        {renderPhaseContent()}

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-white rounded-lg border">
          <h4 className="font-semibold mb-2">Debug Information:</h4>
          <div className="text-xs text-gray-600 space-y-2">
            <p>Current Phase: {currentPhase}</p>
            <p>Selected services: [{selectedServices.join(', ')}]</p>
            <p>Current service index: {currentServiceIndex}</p>
            <p>Component styles loaded: {!!componentStyles ? 'Yes' : 'No'}</p>
            <p>Icon position: {componentStyles.serviceSelector?.iconPosition || 'left'}</p>
            <p>Icon size unit: {componentStyles.serviceSelector?.iconSizeUnit || 'preset'}</p>
            <p>Icon size: {getIconSize()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}