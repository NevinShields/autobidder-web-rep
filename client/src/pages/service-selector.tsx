import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calculator, ShoppingCart, ArrowRight, User, Mail, Phone, Receipt, Percent, MapPin, MessageSquare, HeadphonesIcon, Home, Loader2, Search } from "lucide-react";
import EnhancedVariableInput from "@/components/enhanced-variable-input";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";
import ServiceCardDisplay from "@/components/service-card-display";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Formula, ServiceCalculation, BusinessSettings, PropertyAttributes } from "@shared/schema";



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
  const [currentStep, setCurrentStep] = useState<"selection" | "address" | "configuration" | "contact" | "pricing">("selection");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyAttributes, setPropertyAttributes] = useState<PropertyAttributes>({});
  const [propertySnapshotId, setPropertySnapshotId] = useState<number | null>(null);
  const [isResolvingProperty, setIsResolvingProperty] = useState(false);
  const [propertyAutofillSkipped, setPropertyAutofillSkipped] = useState(false);
  const [prefilledFields, setPrefilledFields] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const search = useSearch();

  // Get user ID from URL parameters (for public forms)
  const urlParams = new URLSearchParams(search);
  const userId = urlParams.get('userId');
  const landingPageId = urlParams.get('landingPageId');

  const { data: formulas, isLoading: formulasLoading } = useQuery({
    queryKey: userId ? ["/api/public/formulas", userId] : ["/api/formulas"],
    queryFn: async () => {
      if (userId) {
        // Use public API for specific user (filters active formulas only)
        const res = await fetch(`/api/public/formulas?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch formulas');
        return res.json();
      } else {
        // Use authenticated API for current user
        const res = await fetch('/api/formulas');
        if (!res.ok) throw new Error('Failed to fetch formulas');
        return res.json();
      }
    }
  });

  const { data: businessSettings, isLoading: settingsLoading } = useQuery({
    queryKey: userId ? ["/api/public/business-settings", userId] : ["/api/business-settings"],
    queryFn: async () => {
      if (userId) {
        // Use public API for specific user
        const res = await fetch(`/api/public/business-settings?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch business settings');
        return res.json();
      } else {
        // Use authenticated API for current user
        const res = await fetch('/api/business-settings');
        if (!res.ok) throw new Error('Failed to fetch business settings');
        return res.json();
      }
    }
  });

  // Determine if address step should be shown
  const shouldShowAddressStep = useMemo(() => {
    if (!(businessSettings as any)?.styling?.enablePropertyAutofill) return false;
    return selectedServices.some(serviceId => {
      const formula = (formulas as Formula[] | undefined)?.find(f => f.id === serviceId);
      return formula?.variables?.some((v: any) => v.prefillSourceKey);
    });
  }, [selectedServices, formulas, businessSettings]);

  // Apply property data prefill to service variables
  const applyPropertyPrefill = (attributes: PropertyAttributes) => {
    const newPrefilledFields: Record<string, string> = {};

    console.log('[PropertyPrefill] Received attributes:', JSON.stringify(attributes));
    console.log('[PropertyPrefill] Selected services:', selectedServices);

    // Collect all prefill values first, then apply in a single state update
    const prefillUpdates: Array<{ serviceId: number; variableId: string; value: any; connectionKey?: string }> = [];

    selectedServices.forEach(serviceId => {
      const formula = (formulas as Formula[] | undefined)?.find(f => f.id === serviceId);
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
              const svc = (formulas as Formula[] | undefined)?.find(f => f.id === svcId);
              svc?.variables?.forEach((v: any) => {
                if (v.connectionKey === connectionKey && !(svcId === serviceId && v.id === variableId)) {
                  const connExisting = updated[svcId]?.[v.id];
                  if (connExisting === undefined || connExisting === '' || connExisting === 0) {
                    console.log(`[PropertyPrefill] ConnectionKey propagation: setting ${v.id} in service ${svcId} = ${value}`);
                    updated[svcId] = {
                      ...updated[svcId],
                      [v.id]: value,
                    };
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
      setPropertyAttributes(data.attributes || {});
      setPropertySnapshotId(data.snapshotId);

      // Apply prefill
      const attrs = data.attributes || {};
      const attrCount = Object.keys(attrs).length;
      applyPropertyPrefill(attrs);

      if (attrCount > 0) {
        toast({
          title: "Property data loaded",
          description: `Found ${attrCount} property attribute${attrCount !== 1 ? 's' : ''}. Check browser console for details.`,
        });
      } else {
        toast({
          title: "No property data found",
          description: "No measurement data available for this address. You can fill in the details manually.",
          variant: "destructive",
        });
      }

      setCurrentStep('configuration');
    } catch (error) {
      console.error('Property resolve error:', error);
      toast({
        title: "Could not load property data",
        description: "You can still fill in the details manually.",
        variant: "destructive",
      });
      setCurrentStep('configuration');
    } finally {
      setIsResolvingProperty(false);
    }
  };

  // Handle URL parameter for preselecting a formula
  useEffect(() => {
    const params = new URLSearchParams(search);
    const formulaParam = params.get('formula');
    
    if (formulaParam && formulas) {
      const targetFormula = (formulas as Formula[]).find(f => f.embedId === formulaParam);
      if (targetFormula && !selectedServices.includes(targetFormula.id)) {
        handleServiceToggle(targetFormula.id);
        // If only one service is preselected, skip to configuration step
        setCurrentStep("configuration");
      }
    }
  }, [formulas, search]);

  const submitMultiServiceLeadMutation = useMutation({
    mutationFn: async (data: {
      services: ServiceCalculation[];
      totalPrice: number;
      leadInfo: LeadFormData;
      appliedDiscounts?: Array<{ name: string; type: "percentage" | "fixed"; value: number; amount: number }>;
      selectedUpsells?: Array<{ id: string; name: string; percentage: number; amount: number }>;
      bundleDiscount?: number;
      taxAmount?: number;
      subtotal?: number;
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
        appliedDiscounts: data.appliedDiscounts || [],
        selectedUpsells: data.selectedUpsells || [],
        bundleDiscountAmount: data.bundleDiscount ?? 0,
        taxAmount: data.taxAmount ?? 0,
        subtotal: data.subtotal ?? data.totalPrice,
      };
      return apiRequest("POST", "/api/multi-service-leads", payload);
    },
    onSuccess: () => {
      toast({
        title: "Quote request submitted successfully!",
        description: "We'll get back to you with detailed pricing soon.",
      });
      if (landingPageId) {
        apiRequest("POST", "/api/landing-page/events", {
          landingPageId: Number(landingPageId),
          type: "lead_submit",
          metadata: { source: "multi_service" }
        }).catch(() => {});
      }
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
    // Find the connectionKey for this variable
    const formula = (formulas as Formula[] | undefined)?.find(f => f.id === formulaId);
    const variable = formula?.variables?.find((v: any) => v.id === variableId);
    const connKey = (variable as any)?.connectionKey;

    setServiceVariables(prev => {
      const updated = {
        ...prev,
        [formulaId]: {
          ...prev[formulaId],
          [variableId]: value
        }
      };

      // If variable has a connectionKey, sync to all other services with matching key
      if (connKey) {
        selectedServices.forEach(svcId => {
          const svc = (formulas as Formula[] | undefined)?.find(f => f.id === svcId);
          svc?.variables?.forEach((v: any) => {
            if (v.connectionKey === connKey && !(svcId === formulaId && v.id === variableId)) {
              updated[svcId] = {
                ...updated[svcId],
                [v.id]: value
              };
            }
          });
        });
      }

      return updated;
    });
  };

  const calculateServicePrice = (formula: Formula) => {
    try {
      if (!formula.formula || formula.formula.trim() === '') {
        console.warn(`No formula found for ${formula.name}`);
        setServiceCalculations(prev => ({
          ...prev,
          [formula.id]: 0
        }));
        return;
      }

      let formulaExpression = formula.formula;
      const variables = serviceVariables[formula.id] || {};
      
      console.log(`Calculating price for ${formula.name}:`, {
        formula: formula.formula,
        variables,
        formulaVariables: formula.variables
      });
      
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
        } else if (variable.type === 'number' || variable.type === 'slider' || variable.type === 'stepper') {
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

      console.log(`Final formula expression for ${formula.name}:`, formulaExpression);

      const result = Function(`"use strict"; return (${formulaExpression})`)();
      const calculatedPrice = Math.round(Number(result) || 0);
      
      console.log(`Calculated price for ${formula.name}:`, calculatedPrice);
      
      setServiceCalculations(prev => ({
        ...prev,
        [formula.id]: calculatedPrice
      }));
    } catch (error) {
      console.error('Formula calculation error:', error, {
        formula: formula.name,
        formulaExpression: formula.formula,
        variables: serviceVariables[formula.id]
      });
      
      // Set price to 0 on error
      setServiceCalculations(prev => ({
        ...prev,
        [formula.id]: 0
      }));
      
      toast({
        title: "Calculation error",
        description: `Error calculating price for ${formula.name}. Please check the formula.`,
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
        calculatedPrice: Math.round((serviceCalculations[formulaId] || 0) * 100) // Convert to cents for database storage
      };
    });

    // Calculate pricing breakdown
    const appliedDiscounts = [];
    if (bundleDiscount > 0) {
      appliedDiscounts.push({
        name: 'Bundle Discount',
        type: 'percentage' as const,
        value: (businessSettings as BusinessSettings)?.styling?.bundleDiscountPercent || 10,
        amount: Math.round(bundleDiscount * 100) // Convert to cents
      });
    }

    submitMultiServiceLeadMutation.mutate({
      services,
      totalPrice: Math.round(totalAmount * 100), // Convert to cents for database storage
      appliedDiscounts,
      selectedUpsells: [], // TODO: Add upsells when implemented
      bundleDiscount: Math.round(bundleDiscount * 100), // Convert to cents
      taxAmount: Math.round(taxAmount * 100), // Convert to cents
      subtotal: Math.round(subtotal * 100), // Convert to cents
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
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
  };

  const fontWeightClasses = {
    'light': 'font-light',
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold'
  };

  const paddingClasses = {
    'sm': 'px-3 py-2',
    'md': 'px-4 py-3',
    'lg': 'px-6 py-4',
    'xl': 'px-8 py-5',
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
            className={`mx-auto border overflow-hidden ${shadowClasses[styling.containerShadow]} ${fontSizeClasses[styling.fontSize] || 'text-base'} ${fontWeightClasses[styling.fontWeight] || 'font-medium'} w-full max-w-none sm:max-w-2xl lg:max-w-4xl`}
            style={{
              borderRadius: `${styling.containerBorderRadius}px`,
              borderWidth: `${styling.containerBorderWidth}px`,
              borderColor: styling.containerBorderColor,
              backgroundColor: styling.backgroundColor,
              color: styling.textColor,
              fontFamily: styling.fontFamily.replace('-', ' '),
              width: '100%',
              height: 'auto',
              maxWidth: '100%'
            }}
          >
            <div className="p-3 sm:p-6 h-full">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold mb-2">{settings.businessName}</h1>
                <p className="text-xs sm:text-sm opacity-80">Select your services and get a custom quote</p>
              </div>

              {/* Progress Steps - Mobile Optimized */}
              {(() => {
                let stepNum = 1;
                const steps: { key: string; label: string; num: number }[] = [
                  { key: 'selection', label: 'Select', num: stepNum++ },
                ];
                if (shouldShowAddressStep) {
                  steps.push({ key: 'address', label: 'Address', num: stepNum++ });
                }
                steps.push({ key: 'configuration', label: 'Configure', num: stepNum++ });
                if (settings.enableLeadCapture) {
                  steps.push({ key: 'contact', label: 'Contact', num: stepNum++ });
                }
                steps.push({ key: 'pricing', label: 'Quote', num: stepNum++ });

                return (
                  <div className="flex items-center justify-center mb-6 sm:mb-8 space-x-2 sm:space-x-4 overflow-x-auto pb-2">
                    {steps.map((step, i) => (
                      <div key={step.key} className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                        {i > 0 && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 flex-shrink-0" />}
                        <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === step.key ? 'text-current' : 'opacity-50'} flex-shrink-0`}>
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === step.key ? 'bg-current text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {step.num}
                          </div>
                          <span className="text-xs whitespace-nowrap">{step.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Step Content */}
              <div className="flex-1">
                {currentStep === 'selection' && (
                  <EnhancedServiceSelector
                    formulas={availableFormulas}
                    selectedServices={selectedServices}
                    onServiceToggle={handleServiceToggle}
                    onContinue={() => setCurrentStep(shouldShowAddressStep ? 'address' : 'configuration')}
                    styling={{
                      containerBorderRadius: styling.containerBorderRadius,
                      containerShadow: styling.containerShadow,
                      primaryColor: styling.primaryColor,
                      textColor: styling.textColor,
                      backgroundColor: styling.backgroundColor,
                      buttonPadding: paddingClasses[styling.buttonPadding] || paddingClasses.lg,
                      serviceSelectorWidth: styling.serviceSelectorWidth,
                      serviceSelectorBorderRadius: styling.serviceSelectorBorderRadius,
                      serviceSelectorShadow: styling.serviceSelectorShadow,
                      serviceSelectorBackgroundColor: styling.serviceSelectorBackgroundColor,
                      serviceSelectorBorderWidth: styling.serviceSelectorBorderWidth,
                      serviceSelectorBorderColor: styling.serviceSelectorBorderColor,
                      serviceSelectorHoverBackgroundColor: (styling as any).serviceSelectorHoverBgColor,
                      serviceSelectorHoverBorderColor: styling.serviceSelectorHoverBorderColor,
                      serviceSelectorSelectedBgColor: styling.serviceSelectorSelectedBgColor,
                      serviceSelectorSelectedBorderColor: styling.serviceSelectorSelectedBorderColor,
                      serviceSelectorTitleFontSize: styling.serviceSelectorTitleFontSize,
                      serviceSelectorDescriptionFontSize: styling.serviceSelectorDescriptionFontSize,
                      serviceSelectorTitleLineHeight: styling.serviceSelectorTitleLineHeight,
                      serviceSelectorDescriptionLineHeight: styling.serviceSelectorDescriptionLineHeight,
                      serviceSelectorTitleLetterSpacing: styling.serviceSelectorTitleLetterSpacing,
                      serviceSelectorDescriptionLetterSpacing: styling.serviceSelectorDescriptionLetterSpacing,
                      serviceSelectorIconSize: styling.serviceSelectorIconSize,
                      serviceSelectorPadding: styling.serviceSelectorPadding,
                      serviceSelectorGap: styling.serviceSelectorGap,
                    }}
                  />
                )}

                {currentStep === 'address' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        Property Address
                      </h2>
                      <button
                        onClick={() => setCurrentStep('selection')}
                        className="text-xs sm:text-sm opacity-70 hover:opacity-100 transition-opacity"
                      >
                        ← Back
                      </button>
                    </div>

                    <p className="text-sm opacity-80">
                      Enter the property address to automatically fill in measurements and details.
                    </p>

                    <div className="space-y-3">
                      <Label htmlFor="property-address">Property Address</Label>
                      <Input
                        id="property-address"
                        type="text"
                        placeholder="e.g., 123 Main St, Springfield, IL 62701"
                        value={propertyAddress}
                        onChange={(e) => {
                          const nextAddress = e.target.value;
                          setPropertyAddress(nextAddress);
                          setLeadForm(prev => {
                            // Keep contact address synced from ATTOM input,
                            // but preserve a manually-entered different contact address.
                            if (prev.address && prev.address.trim() && prev.address.trim() !== propertyAddress.trim()) {
                              return prev;
                            }
                            return { ...prev, address: nextAddress };
                          });
                        }}
                        className="w-full"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handlePropertyResolve}
                        disabled={!propertyAddress.trim() || isResolvingProperty}
                        className="flex-1"
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
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setPropertyAutofillSkipped(true);
                          setCurrentStep('configuration');
                        }}
                        className="text-sm"
                      >
                        Skip this step
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 'configuration' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold">Configure Your Services</h2>
                      <button
                        onClick={() => setCurrentStep(shouldShowAddressStep ? 'address' : 'selection')}
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
                                  value={serviceVariables[serviceId]?.[variable.id]}
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
                                  prefillSource={prefilledFields[`${serviceId}_${variable.id}`]}
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
                            if (propertyAddress.trim()) {
                              setLeadForm(prev => {
                                if (prev.address && prev.address.trim()) return prev;
                                return { ...prev, address: propertyAddress.trim() };
                              });
                            }
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
                      <Card className="p-4 sm:p-6 bg-gray-50">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-4">
                            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                            <h3 className="text-base sm:text-lg font-semibold">Quote Summary</h3>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm sm:text-base">
                            <span>Subtotal ({selectedServices.length} services)</span>
                            <span className="font-medium sm:font-normal">${subtotal.toLocaleString()}</span>
                          </div>

                          {bundleDiscount > 0 && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-green-600 text-sm sm:text-base">
                              <span className="flex items-center gap-1">
                                <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
                                Bundle Discount ({(businessSettings as BusinessSettings)?.styling?.bundleDiscountPercent}% off)
                              </span>
                              <span className="font-medium sm:font-normal">-${bundleDiscount.toLocaleString()}</span>
                            </div>
                          )}

                          {taxAmount > 0 && (
                            <>
                              <Separator />
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                                <span>Subtotal after discount</span>
                                <span className="font-medium sm:font-normal">${discountedSubtotal.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                                <span className="break-words">{(businessSettings as BusinessSettings)?.styling?.salesTaxLabel || 'Sales Tax'} ({(businessSettings as BusinessSettings)?.styling?.salesTaxRate}%)</span>
                                <span className="font-medium sm:font-normal">${taxAmount.toLocaleString()}</span>
                              </div>
                            </>
                          )}

                          <Separator />
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-lg sm:text-xl font-bold">
                            <span>Total</span>
                            <span style={{ color: styling.primaryColor }}>${totalAmount.toLocaleString()}</span>
                          </div>
                          
                          {/* Disclaimer */}
                          {(businessSettings as BusinessSettings)?.styling?.enableDisclaimer && (businessSettings as BusinessSettings)?.styling?.disclaimerText && (
                            <div className="text-center mt-3 pt-2">
                              <p className="text-xs text-gray-500 italic">
                                {(businessSettings as BusinessSettings)?.styling?.disclaimerText}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Submit Button */}
                    <div className="text-center pt-4">
                      <button
                        onClick={handleSubmitQuoteRequest}
                        disabled={submitMultiServiceLeadMutation.isPending}
                        className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base text-white font-semibold rounded-lg transition-all ${
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
