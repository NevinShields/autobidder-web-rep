import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CalculatorPreview from "@/components/calculator-preview";
import type { Formula, DesignSettings } from "@shared/schema";

interface StyledCalculatorProps {
  formula?: Formula;
}

export default function StyledCalculator(props: any = {}) {
  const { formula: propFormula } = props;

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

  // Create enhanced formula with design settings for CalculatorPreview
  const enhancedFormula = {
    ...formula,
    componentStyles: designSettings?.componentStyles
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <CalculatorPreview formula={enhancedFormula as any} />
    </div>
  );
}