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
          />
        );
      case 'select':
        return (
          <Select
            value={values[variable.id] || ""}
            onValueChange={(value) => setValues({ ...values, [variable.id]: value })}
          >
            <SelectTrigger>
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto border border-gray-200 rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{formula.title}</h3>
      
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
          className="w-full bg-primary text-white hover:bg-blue-700 transition-colors font-medium"
          style={{ backgroundColor: formula.styling.primaryColor }}
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
                className="text-sm"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Email Address"
                className="text-sm"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
              />
              <Input
                type="tel"
                placeholder="Phone Number"
                className="text-sm"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              />
              <Button
                onClick={handleSubmitLead}
                disabled={submitLeadMutation.isPending}
                className="w-full bg-accent text-white hover:bg-orange-600 transition-colors text-sm"
                style={{ backgroundColor: '#FF9800' }}
              >
                {submitLeadMutation.isPending ? "Submitting..." : "Request Detailed Quote"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
