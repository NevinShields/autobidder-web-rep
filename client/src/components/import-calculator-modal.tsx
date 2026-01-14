import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { StoredCalculator, clearCalculator } from '@/lib/calculator-storage';
import { Calculator, Sparkles, ArrowRight, X, CheckCircle } from 'lucide-react';

interface ImportCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculator: StoredCalculator;
}

// Default styling options for imported formulas
const DEFAULT_STYLING = {
  containerWidth: 700,
  containerHeight: 850,
  containerBorderRadius: 16,
  containerShadow: 'xl',
  backgroundColor: '#FFFFFF',
  fontFamily: 'inter',
  fontSize: 'base',
  textColor: '#1F2937',
  primaryColor: '#2563EB',
  buttonStyle: 'rounded',
  buttonBorderRadius: 12,
  buttonPadding: 12,
  buttonBackgroundColor: '#2563EB',
  buttonTextColor: '#FFFFFF',
  buttonShadow: 'md',
  inputBorderColor: '#E5E7EB',
  inputBackgroundColor: '#FFFFFF',
  inputBorderRadius: 8,
  inputFocusColor: '#2563EB',
  inputHeight: 44,
  showBulletPoints: true,
  bulletPointIcon: 'check',
  bulletPointColor: '#22C55E',
  showServiceDescription: true,
  showServiceIcon: true,
  serviceIconSize: 48,
  pricingCardBackgroundColor: '#F0FDF4',
  pricingTextColor: '#065F46',
  pricingAccentColor: '#22C55E',
  pricingCardBorderRadius: 12,
  enableAnimations: true,
};

export default function ImportCalculatorModal({ isOpen, onClose, calculator }: ImportCalculatorModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async () => {
      const formula = calculator.formula;

      const formulaData = {
        name: formula.name,
        title: formula.title,
        description: formula.description,
        bulletPoints: formula.bulletPoints,
        formula: formula.formula,
        variables: formula.variables,
        iconUrl: formula.iconUrl,
        styling: DEFAULT_STYLING,
        isActive: true,
        isDisplayed: true,
      };

      const response = await fetch('/api/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formulaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import calculator');
      }

      return response.json();
    },
    onSuccess: (data) => {
      clearCalculator();
      toast({
        title: 'Calculator Imported!',
        description: 'Your calculator has been added to your account.',
      });
      onClose();
      // Navigate to the formula builder for the new formula
      setLocation(`/formula-builder/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Could not import the calculator. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  const handleDiscard = () => {
    clearCalculator();
    toast({
      title: 'Calculator Discarded',
      description: 'Starting fresh. You can create new calculators in the dashboard.',
    });
    onClose();
  };

  const formula = calculator.formula;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            You Created a Calculator!
          </DialogTitle>
          <DialogDescription>
            Would you like to import the calculator you built into your account?
          </DialogDescription>
        </DialogHeader>

        {/* Calculator Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 my-4">
          <div className="flex items-start gap-3">
            {formula.iconUrl && (
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm shrink-0">
                {formula.iconUrl.startsWith('http') ? (
                  <img src={formula.iconUrl} alt={formula.name} className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-2xl">{formula.iconUrl}</span>
                )}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{formula.title || formula.name}</h3>
              {formula.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{formula.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Calculator className="w-3 h-3" />
                <span>{formula.variables.length} variables</span>
              </div>
            </div>
          </div>

          {/* Bullet Points */}
          {formula.bulletPoints && formula.bulletPoints.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {formula.bulletPoints.slice(0, 4).map((point, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                >
                  <CheckCircle className="w-3 h-3" />
                  {point}
                </span>
              ))}
              {formula.bulletPoints.length > 4 && (
                <span className="text-xs text-gray-500">+{formula.bulletPoints.length - 4} more</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDiscard} className="sm:order-1">
            <X className="w-4 h-4 mr-2" />
            Start Fresh
          </Button>
          <Button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 sm:order-2"
          >
            {importMutation.isPending ? (
              'Importing...'
            ) : (
              <>
                Import Calculator
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
