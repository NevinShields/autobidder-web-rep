import { useState } from "react";
import { Formula, Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
          value = option?.multiplier || 1;
        } else if (variable.type === 'number') {
          value = Number(value) || 0;
        } else if (variable.type === 'checkbox') {
          value = value ? 1 : 0;
        }
        
        formulaExpression = formulaExpression.replace(
          new RegExp(variable.id, 'g'),
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
      calculatedPrice,
      variables: values,
    });
  };

  const renderVariable = (variable: Variable) => {
    switch (variable.type) {
      case 'number':
        return (
          <Input
            type="number"
            placeholder={`Enter ${variable.name.toLowerCase()}`}
            value={values[variable.id] || ""}
            onChange={(e) => setValues({ ...values, [variable.id]: e.target.value })}
            className={`${inputPaddingClass}`}
            style={{
              ...inputStyles,
              '--tw-ring-color': formula.styling.inputFocusColor,
            } as React.CSSProperties}
          />
        );
      case 'select':
        return (
          <Select
            value={values[variable.id] || ""}
            onValueChange={(value) => setValues({ ...values, [variable.id]: value })}
          >
            <SelectTrigger 
              className={`${inputPaddingClass}`}
              style={inputStyles}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'text':
        return (
          <Input
            type="text"
            placeholder={`Enter ${variable.name.toLowerCase()}`}
            value={values[variable.id] || ""}
            onChange={(e) => setValues({ ...values, [variable.id]: e.target.value })}
            className={`${inputPaddingClass}`}
            style={{
              ...inputStyles,
              '--tw-ring-color': formula.styling.inputFocusColor,
            } as React.CSSProperties}
          />
        );
      default:
        return null;
    }
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

  const buttonStyles = {
    backgroundColor: formula.styling.primaryColor,
    borderRadius: formula.styling.buttonStyle === 'pill' ? '9999px' : 
                  formula.styling.buttonStyle === 'square' ? '0px' : 
                  `${formula.styling.buttonBorderRadius}px`,
  };

  const inputStyles = {
    borderRadius: `${formula.styling.inputBorderRadius}px`,
    borderWidth: `${formula.styling.inputBorderWidth}px`,
    borderColor: formula.styling.inputBorderColor,
    backgroundColor: formula.styling.inputBackgroundColor,
  };

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
        {formula.variables.map((variable) => (
          <div key={variable.id}>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              {variable.name}
              {variable.unit && ` (${variable.unit})`}
            </Label>
            {renderVariable(variable)}
          </div>
        ))}

        <Button 
          onClick={calculatePrice}
          className={`w-full text-white transition-colors ${buttonShadowClass} ${buttonPaddingClass} ${buttonFontWeightClass}`}
          style={buttonStyles}
        >
          Calculate Price
        </Button>

        {calculatedPrice !== null && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="text-center">
              <p className="text-sm text-gray-600">Estimated Total</p>
              <p className="text-2xl font-bold text-green-700">
                ${calculatedPrice.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Price may vary based on specific requirements
              </p>
            </div>
          </div>
        )}

        {formula.styling.includeLedCapture && calculatedPrice !== null && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Get Detailed Quote</h4>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Your Name"
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
                placeholder="Email Address"
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
                placeholder="Phone Number"
                className={`text-sm ${inputPaddingClass}`}
                style={{
                  ...inputStyles,
                  '--tw-ring-color': formula.styling.inputFocusColor,
                } as React.CSSProperties}
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              />
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
                {submitLeadMutation.isPending ? "Submitting..." : "Request Detailed Quote"}
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
