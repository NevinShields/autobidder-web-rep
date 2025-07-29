import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import FormulaBuilderComponent from "@/components/formula-builder";
import CalculatorPreview from "@/components/calculator-preview";
import SingleServicePreviewModal from "@/components/single-service-preview-modal";
import { TemplateLibraryButton } from "@/components/template-library";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Formula } from "@shared/schema";

export default function FormulaBuilder() {
  const { id } = useParams<{ id: string }>();
  const [showPreview, setShowPreview] = useState(false);
  const [showSingleServicePreview, setShowSingleServicePreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: formula, isLoading } = useQuery({
    queryKey: ["/api/formulas", id],
    enabled: id !== "new",
  });

  const [currentFormula, setCurrentFormula] = useState<Formula | null>(null);

  // Update currentFormula when formula data is loaded or when creating new
  useEffect(() => {
    if (formula && !currentFormula && id !== "new") {
      setCurrentFormula(formula as Formula);
    } else if (id === "new" && !currentFormula) {
      const defaultFormula: Formula = {
        id: 0,
        userId: null,
        name: "New Formula",
        title: "Pricing Calculator",
        description: "",
        bulletPoints: [],
        variables: [],
        formula: "",
        styling: {
          containerWidth: 400,
          containerHeight: 600,
          containerBorderRadius: 16,
          containerShadow: 'lg',
          containerBorderWidth: 0,
          containerBorderColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
          fontFamily: 'inter',
          fontSize: 'base',
          fontWeight: 'medium',
          textColor: '#1F2937',
          primaryColor: '#2563EB',
          buttonStyle: 'rounded',
          buttonBorderRadius: 12,
          buttonPadding: 'lg',
          buttonFontWeight: 'semibold',
          buttonShadow: 'md',
          inputBorderRadius: 10,
          inputBorderWidth: 2,
          inputBorderColor: '#E5E7EB',
          inputFocusColor: '#2563EB',
          inputPadding: 'lg',
          inputBackgroundColor: '#F9FAFB',
          inputShadow: 'sm',
          inputFontSize: 'base',
          inputTextColor: '#1F2937',
          inputHeight: 40,
          inputWidth: 'full',
          multiChoiceImageSize: 'lg',
          multiChoiceImageShadow: 'md',
          multiChoiceImageBorderRadius: 12,
          multiChoiceCardBorderRadius: 12,
          multiChoiceCardShadow: 'sm',
          multiChoiceSelectedColor: '#2563EB',
          multiChoiceSelectedBgColor: '#EFF6FF',
          multiChoiceHoverBgColor: '#F8FAFC',
          multiChoiceLayout: 'grid',
          serviceSelectorWidth: 900,
          serviceSelectorCardSize: 'lg',
          serviceSelectorCardsPerRow: 'auto',
          serviceSelectorBorderRadius: 16,
          serviceSelectorShadow: 'xl',
          serviceSelectorBackgroundColor: '#FFFFFF',
          serviceSelectorBorderWidth: 0,
          serviceSelectorBorderColor: '#E5E7EB',
          serviceSelectorHoverBgColor: '#F8FAFC',
          serviceSelectorHoverBorderColor: '#C7D2FE',
          serviceSelectorSelectedBgColor: '#EFF6FF',
          serviceSelectorSelectedBorderColor: '#2563EB',
          serviceSelectorTitleFontSize: 'xl',
          serviceSelectorDescriptionFontSize: 'base',
          serviceSelectorTitleLineHeight: 'normal',
          serviceSelectorDescriptionLineHeight: 'normal',
          serviceSelectorTitleLetterSpacing: 'normal',
          serviceSelectorDescriptionLetterSpacing: 'normal',
          serviceSelectorIconSize: 'xl',
          serviceSelectorPadding: 'xl',
          serviceSelectorGap: 'lg',
          
          // Pricing card styling
          pricingCardBorderRadius: 12,
          pricingCardShadow: 'lg',
          pricingCardBorderWidth: 0,
          pricingCardBorderColor: '#E5E7EB',
          pricingCardBackgroundColor: '#FFFFFF',
          pricingTextColor: '#1F2937',
          pricingAccentColor: '#2563EB',
          
          showPriceBreakdown: true,
          includeLedCapture: true,
          requireContactFirst: false,
          showBundleDiscount: false,
          bundleDiscountPercent: 10,
          enableSalesTax: false,
          salesTaxRate: 8.25,
          salesTaxLabel: 'Sales Tax',
          showProgressGuide: true,
          requireName: true,
          requireEmail: true,
          requirePhone: false,
          enableAddress: false,
          requireAddress: false,
          enableNotes: false,
          enableHowDidYouHear: false,
          requireHowDidYouHear: false,
          howDidYouHearOptions: ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other'],
          nameLabel: 'Full Name',
          emailLabel: 'Email Address',
          phoneLabel: 'Phone Number',
          addressLabel: 'Address',
          notesLabel: 'Additional Notes',
          howDidYouHearLabel: 'How did you hear about us?',
          enablePhone: false,
          showFormTitle: true,
          showFormSubtitle: true,
          showSectionTitles: true,
          showStepDescriptions: true,
          enableDisclaimer: false,
          disclaimerText: '',
          enableBooking: true,
          enableImageUpload: false,
          imageUploadLabel: 'Upload Images',
          imageUploadHelperText: 'Select images to help us understand your project better',
          maxImages: 3,
          requireImageUpload: false,
          imageUploadDescription: '',
          maxImageSize: 5,
          allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        isActive: true,
        isDisplayed: true,
        embedId: "",
        guideVideoUrl: null,
        showImage: false,
        imageUrl: null,
        iconUrl: null,
        iconId: null,
        enableMeasureMap: false,
        measureMapType: "area",
        measureMapUnit: "sqft",
        upsellItems: [],
        enableDistancePricing: false,
        distancePricingType: "per_mile",
        distancePricingRate: 0,
        serviceRadius: 50,
      };
      setCurrentFormula(defaultFormula);
    }
  }, [formula, currentFormula, id]);

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



  if (isLoading && id !== "new") {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!currentFormula && id !== "new") {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">Formula not found</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentFormula && (
          <>
            <FormulaBuilderComponent
              formula={currentFormula}
              onUpdate={handleUpdate}
              onSave={handleSave}
              onPreview={() => setShowSingleServicePreview(true)}
              isSaving={saveFormulaMutation.isPending}
            />

            {/* Single Service Preview Modal */}
            <SingleServicePreviewModal
              isOpen={showSingleServicePreview}
              onClose={() => setShowSingleServicePreview(false)}
              formula={currentFormula}
            />

            {/* Full Calculator Preview (keep for reference) */}
            {showPreview && (
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Full Calculator Preview</h2>
                  <p className="text-sm text-gray-500">Preview the complete customer experience with contact forms</p>
                </div>
                <div className="p-6">
                  <CalculatorPreview formula={currentFormula} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
