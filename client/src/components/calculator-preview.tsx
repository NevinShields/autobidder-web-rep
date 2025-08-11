import { useState } from "react";
import { Formula, Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import EnhancedVariableInput from "./enhanced-variable-input";

interface CalculatorPreviewProps {
  formula: Formula;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
}

export default function CalculatorPreview({ formula }: CalculatorPreviewProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormData>({ name: "", email: "", phone: "" });
  const [showPricing, setShowPricing] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const { toast } = useToast();

  // Parse component styles from business settings
  const componentStyles = (() => {
    try {
      if ((formula as any).componentStyles) {
        return typeof (formula as any).componentStyles === 'string' 
          ? JSON.parse((formula as any).componentStyles)
          : (formula as any).componentStyles;
      }
      return null;
    } catch (error) {
      console.error('Error parsing component styles:', error);
      return null;
    }
  })();

  const submitLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const response = await apiRequest("POST", "/api/leads", leadData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead submitted successfully!",
        description: "Thank you for your interest. We'll contact you soon.",
      });
      setLeadForm({ name: "", email: "", phone: "" });
    },
    onError: () => {
      toast({
        title: "Error submitting lead",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const calculatePrice = () => {
    try {
      // Simple formula evaluation for demo purposes
      // In a real app, you'd want a more robust formula parser
      let formulaExpression = formula.formula;
      
      // Replace variable names with their values
      formula.variables.forEach((variable) => {
        let value = values[variable.id];
        
        if (variable.type === 'select' && variable.options) {
          const option = variable.options.find(opt => opt.value === value);
          value = option?.multiplier || option?.numericValue || 0;
        } else if (variable.type === 'dropdown' && variable.options) {
          const option = variable.options.find(opt => opt.value === value);
          value = option?.numericValue || 0;
        } else if (variable.type === 'multiple-choice' && variable.options) {
          // Handle multiple selection - sum all selected numeric values
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

      // Simple evaluation (in production, use a safer formula parser)
      const result = Function(`"use strict"; return (${formulaExpression})`)();
      setCalculatedPrice(Math.round(result));
    } catch (error) {
      console.error('Formula calculation error:', error);
      toast({
        title: "Calculation error",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      });
    }
  };

  const handleGetPrice = () => {
    if (!leadForm.name || !leadForm.email) {
      toast({
        title: "Please fill in your contact information",
        description: "Name and email are required to see pricing.",
        variant: "destructive",
      });
      return;
    }

    // Calculate price and show pricing
    calculatePrice();
    setContactSubmitted(true);
    setShowPricing(true);

    toast({
      title: "Thank you!",
      description: "Here's your personalized pricing based on your requirements.",
    });
  };

  const handleSubmitLead = () => {
    if (!leadForm.name || !leadForm.email || calculatedPrice === null) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitLeadMutation.mutate({
      formulaId: formula.id,
      name: leadForm.name,
      email: leadForm.email,
      phone: leadForm.phone,
      calculatedPrice: Math.round(calculatedPrice * 100), // Convert to cents for database storage
      variables: values,
    });
  };

  const handleVariableChange = (variableId: string, value: any) => {
    setValues({ ...values, [variableId]: value });
  };

  // Generate dynamic styles based on formula styling options
  const containerStyles = {
    width: `${formula.styling.containerWidth}px`,
    height: `${formula.styling.containerHeight}px`,
    borderRadius: `${formula.styling.containerBorderRadius}px`,
    borderWidth: `${formula.styling.containerBorderWidth}px`,
    borderColor: formula.styling.containerBorderColor,
    backgroundColor: formula.styling.backgroundColor,
    color: formula.styling.textColor,
    fontFamily: formula.styling.fontFamily.replace('-', ' '),
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

  // Use component styles when available, fall back to formula styling
  const getInputStyles = () => {
    if (componentStyles?.['text-input']) {
      const textInputStyles = componentStyles['text-input'];
      return {
        borderRadius: `${textInputStyles.borderRadius || 8}px`,
        borderWidth: `${textInputStyles.borderWidth || 1}px`,
        borderColor: textInputStyles.borderColor || '#E5E7EB',
        backgroundColor: textInputStyles.backgroundColor || '#FFFFFF',
        height: `${textInputStyles.height || 40}px`,
        padding: `${textInputStyles.padding || 12}px`,
      };
    }
    // Fallback to formula styling
    return {
      borderRadius: `${formula.styling.inputBorderRadius}px`,
      borderWidth: `${formula.styling.inputBorderWidth}px`,
      borderColor: formula.styling.inputBorderColor,
      backgroundColor: formula.styling.inputBackgroundColor,
    };
  };

  const getButtonStyles = () => {
    if (componentStyles?.['pricing-card']) {
      // Use pricing card styles for buttons if available
      const pricingCardStyles = componentStyles['pricing-card'];
      return {
        backgroundColor: pricingCardStyles.backgroundColor || formula.styling.primaryColor,
        borderRadius: `${pricingCardStyles.borderRadius || 8}px`,
        borderColor: pricingCardStyles.borderColor || '#E5E7EB',
        borderWidth: `${pricingCardStyles.borderWidth || 1}px`,
        padding: `${pricingCardStyles.padding || 12}px`,
      };
    }
    // Fallback to formula styling
    return {
      backgroundColor: formula.styling.primaryColor,
      borderRadius: formula.styling.buttonStyle === 'pill' ? '9999px' : 
                    formula.styling.buttonStyle === 'square' ? '0px' : 
                    `${formula.styling.buttonBorderRadius}px`,
    };
  };

  const inputStyles = getInputStyles();
  const buttonStyles = getButtonStyles();

  const buttonShadowClass = shadowClasses[formula.styling.buttonShadow];
  const buttonPaddingClass = paddingClasses[formula.styling.buttonPadding];
  const buttonFontWeightClass = fontWeightClasses[formula.styling.buttonFontWeight];
  const inputPaddingClass = paddingClasses[formula.styling.inputPadding];

  return (
    <div 
      className={`mx-auto border overflow-auto ${shadowClasses[formula.styling.containerShadow]} ${fontSizeClasses[formula.styling.fontSize]} ${fontWeightClasses[formula.styling.fontWeight]}`}
      style={containerStyles}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">{formula.title}</h3>
      
      <div className="space-y-4">
        {/* Contact Form - Always shown first */}
        {!contactSubmitted && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Get Your Personalized Quote</h4>
            <p className="text-xs text-gray-600 mb-4">Fill in your contact details to see custom pricing for your project.</p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Your Name*"
                className={`text-sm ${inputPaddingClass}`}
                style={{
                  ...inputStyles,
                  '--tw-ring-color': formula.styling.inputFocusColor,
                } as React.CSSProperties}
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Email Address*"
                className={`text-sm ${inputPaddingClass}`}
                style={{
                  ...inputStyles,
                  '--tw-ring-color': formula.styling.inputFocusColor,
                } as React.CSSProperties}
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
              />
              <Input
                type="tel"
                placeholder="Phone Number (Optional)"
                className={`text-sm ${inputPaddingClass}`}
                style={{
                  ...inputStyles,
                  '--tw-ring-color': formula.styling.inputFocusColor,
                } as React.CSSProperties}
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              />
              <Button
                onClick={handleGetPrice}
                className={`w-full text-white transition-colors ${buttonShadowClass} ${buttonPaddingClass} ${buttonFontWeightClass}`}
                style={buttonStyles}
              >
                Get My Price
              </Button>
            </div>
          </div>
        )}

        {/* Project Variables - Shown after contact submission */}
        {contactSubmitted && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center">
              <p className="text-sm text-green-700">Thanks {leadForm.name}! Now let's customize your quote:</p>
            </div>
            
            {formula.variables.map((variable) => (
              <EnhancedVariableInput
                key={variable.id}
                variable={variable}
                value={values[variable.id]}
                onChange={(value) => {
                  handleVariableChange(variable.id, value);
                  // Recalculate price when variables change
                  setTimeout(() => calculatePrice(), 100);
                }}
                styling={formula.styling}
                componentStyles={componentStyles}
              />
            ))}
          </div>
        )}

        {/* Pricing Display - Subscription Style Card */}
        {showPricing && calculatedPrice !== null && (
          <div className="mt-6 max-w-sm mx-auto">
            <Card className="relative overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              {/* Header with service name and standard badge */}
              <CardHeader className="text-center pb-4 relative">
                <div className="absolute top-4 right-4">
                  <Badge 
                    className="text-xs font-medium px-3 py-1"
                    style={{
                      backgroundColor: formula.styling?.primaryColor || '#3B82F6',
                      color: '#FFFFFF',
                      borderRadius: '20px'
                    }}
                  >
                    Standard
                  </Badge>
                </div>
                
                <div className="mt-2">
                  <h4 className="text-lg font-bold mb-1" style={{ color: formula.styling?.textColor || '#1F2937' }}>
                    {formula.name}
                  </h4>
                  {formula.title && (
                    <p className="text-sm text-gray-600 mb-3">{formula.title}</p>
                  )}
                  
                  {/* Price Display */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span 
                        className="text-4xl font-bold"
                        style={{ color: formula.styling?.textColor || '#1F2937' }}
                      >
                        ${calculatedPrice.toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-500 ml-1">total</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Based on your selections
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                {/* Features List */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-semibold text-gray-700">
                    What's included:
                  </p>
                  
                  {/* Selected features from form inputs */}
                  <ul className="space-y-2">
                    {Object.entries(values).slice(0, 4).map(([key, value], index) => {
                      if (!value || value === '') return null;
                      const variable = formula.variables.find(v => v.id === key);
                      if (!variable) return null;
                      
                      let displayValue = value;
                      if (typeof value === 'boolean') {
                        displayValue = value ? 'Yes' : 'No';
                      } else if (variable.type === 'multiple-choice' || variable.type === 'dropdown') {
                        const option = variable.options?.find(opt => opt.value === value);
                        if (option) displayValue = option.label;
                      }
                      
                      return (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">
                            <span className="font-medium">{variable.name}:</span> {displayValue}
                          </span>
                        </li>
                      );
                    }).filter(Boolean)}
                    
                    {/* Standard service features */}
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Professional service</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Quality guarantee</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Free consultation</span>
                    </li>
                  </ul>
                </div>

                {/* Interactive Note */}
                <div className="text-center py-3 px-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-xs text-gray-600">
                    💡 Adjust the options above to see updated pricing
                  </p>
                </div>

                {/* Disclaimer */}
                {formula.styling?.enableDisclaimer && formula.styling?.disclaimerText && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 italic">
                      {formula.styling.disclaimerText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Final Lead Submission - Only shown after pricing is displayed */}
        {showPricing && calculatedPrice !== null && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Ready to Get Started?</h4>
            <p className="text-xs text-gray-600 mb-3">Click below to request a detailed proposal.</p>
            <Button
              onClick={handleSubmitLead}
              disabled={submitLeadMutation.isPending}
              className={`w-full text-white transition-colors text-sm ${buttonShadowClass} ${buttonPaddingClass} ${buttonFontWeightClass}`}
              style={{
                backgroundColor: '#FF9800',
                borderRadius: formula.styling.buttonStyle === 'pill' ? '9999px' : 
                              formula.styling.buttonStyle === 'square' ? '0px' : 
                              `${formula.styling.buttonBorderRadius}px`,
              }}
            >
              {submitLeadMutation.isPending ? "Submitting..." : "Request Detailed Proposal"}
            </Button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
