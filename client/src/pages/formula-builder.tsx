import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import AppHeader from "@/components/app-header";
import FormulaBuilderComponent from "@/components/formula-builder";
import CalculatorPreview from "@/components/calculator-preview";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Formula } from "@shared/schema";

export default function FormulaBuilder() {
  const { id } = useParams<{ id: string }>();
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: formula, isLoading } = useQuery({
    queryKey: ["/api/formulas", id],
    enabled: id !== "new",
  });

  const [currentFormula, setCurrentFormula] = useState<Formula | null>(null);

  // Update currentFormula when formula data is loaded
  if (formula && !currentFormula && id !== "new") {
    setCurrentFormula(formula as Formula);
  }

  const saveFormulaMutation = useMutation({
    mutationFn: async (formulaData: any) => {
      const method = id === "new" ? "POST" : "PATCH";
      const url = id === "new" ? "/api/formulas" : `/api/formulas/${id}`;
      const response = await apiRequest(method, url, formulaData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Formula saved successfully!",
      });
      setCurrentFormula(data);
      queryClient.invalidateQueries({ queryKey: ["/api/formulas"] });
    },
    onError: () => {
      toast({
        title: "Error saving formula",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = (updates: Partial<Formula>) => {
    if (currentFormula) {
      setCurrentFormula({ ...currentFormula, ...updates });
    }
  };

  const handleSave = () => {
    if (!currentFormula) return;
    saveFormulaMutation.mutate(currentFormula);
  };

  // For new formulas, create a default structure
  if (id === "new" && !currentFormula) {
    const defaultFormula: Formula = {
      id: 0,
      name: "New Formula",
      title: "Pricing Calculator",
      variables: [],
      formula: "",
      styling: {
        containerWidth: 400,
        containerHeight: 600,
        containerBorderRadius: 8,
        containerShadow: "md",
        containerBorderWidth: 1,
        containerBorderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
        fontFamily: "inter",
        fontSize: "base",
        fontWeight: "normal",
        textColor: "#374151",
        primaryColor: "#1976D2",
        buttonStyle: "rounded",
        buttonBorderRadius: 6,
        buttonPadding: "md",
        buttonFontWeight: "medium",
        buttonShadow: "sm",
        inputBorderRadius: 4,
        inputBorderWidth: 1,
        inputBorderColor: "#D1D5DB",
        inputFocusColor: "#3B82F6",
        inputPadding: "md",
        inputBackgroundColor: "#FFFFFF",
        inputShadow: "none",
        showPriceBreakdown: true,
        includeLedCapture: true,
        requireContactFirst: false,
        showBundleDiscount: false,
        bundleDiscountPercent: 10,
        enableSalesTax: false,
        salesTaxRate: 8.25,
        salesTaxLabel: "Sales Tax",
      },
      isActive: true,
      embedId: "",
      guideVideoUrl: null,
      showImage: false,
      imageUrl: null,
    };
    setCurrentFormula(defaultFormula);
  }

  if (isLoading && id !== "new") {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!currentFormula && id !== "new") {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">Formula not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentFormula && (
          <>
            <FormulaBuilderComponent
              formula={currentFormula}
              onUpdate={handleUpdate}
              onSave={handleSave}
              onPreview={() => setShowPreview(!showPreview)}
              isSaving={saveFormulaMutation.isPending}
            />

            {/* Calculator Preview */}
            {showPreview && (
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Calculator Preview</h2>
                  <p className="text-sm text-gray-500">Preview how your calculator will appear to customers</p>
                </div>
                <div className="p-6">
                  <CalculatorPreview formula={currentFormula} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
