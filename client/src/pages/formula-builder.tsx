import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import FormulaBuilderComponent from "@/components/formula-builder";
import CalculatorPreview from "@/components/calculator-preview";
import SingleServicePreviewModal from "@/components/single-service-preview-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator } from "lucide-react";
import { Formula } from "@shared/schema";

export default function FormulaBuilder() {
  const { id: routeId } = useParams<{ id?: string }>();
  const formulaId = routeId ?? "new";
  const [, setLocation] = useLocation();
  const [showPreview, setShowPreview] = useState(false);
  const [showSingleServicePreview, setShowSingleServicePreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: formula, isLoading } = useQuery({
    queryKey: ["/api/formulas", formulaId],
    enabled: formulaId !== "new",
  });

  // Fetch all formulas to allow linking variables across services
  const { data: allFormulas = [] } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  const [currentFormula, setCurrentFormula] = useState<Formula | null>(null);

  // Update currentFormula when formula data is loaded or when creating new
  useEffect(() => {
    if (formulaId !== "new" && formula && !Array.isArray(formula)) {
      const loadedFormula = formula as Formula;
      if (!currentFormula || currentFormula.id !== loadedFormula.id) {
        setCurrentFormula(loadedFormula);
      }
    } else if (formulaId === "new" && (!currentFormula || currentFormula.id !== 0)) {
      const defaultFormula = {
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
          serviceSelectorHoverBackgroundColor: '#F8FAFC',
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
        enablePhotoMeasurement: false,
        photoMeasurementSetup: null,
        upsellItems: [],
        enableDistancePricing: false,
        distancePricingType: "per_mile",
        distancePricingRate: 0,
        serviceRadius: 50,
        conditionalMinPrices: [],
        conditionalMaxPrices: [],
      } as unknown as Formula;
      setCurrentFormula(defaultFormula);
    }
  }, [formula, currentFormula, formulaId]);

  const saveFormulaMutation = useMutation({
    mutationFn: async (formulaData: any) => {
      const method = formulaId === "new" ? "POST" : "PATCH";
      const url = formulaId === "new" ? "/api/formulas" : `/api/formulas/${formulaId}`;
      console.log('Saving formula:', { url, method, dataSize: JSON.stringify(formulaData).length });
      const response = await apiRequest(method, url, formulaData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Save failed:', errorData);
        throw new Error(errorData.message || 'Failed to save formula');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Formula saved successfully!",
      });
      setCurrentFormula(data);
      queryClient.invalidateQueries({ queryKey: ["/api/formulas"] });

      // Redirect to the new formula's URL after creation to prevent duplicate saves
      if (formulaId === "new" && data.id) {
        setLocation(`/formula-builder/${data.id}`, { replace: true });
      }
    },
    onError: (error: any) => {
      console.error('Formula save error:', error);
      toast({
        title: "Error saving formula",
        description: error.message || "Please try again later.",
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



  if (isLoading && formulaId !== "new") {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentFormula && formulaId !== "new") {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-7xl mx-auto">
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/70">
            <CardContent className="p-6">
                <p className="text-slate-500 dark:text-slate-400">Formula not found</p>
            </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        .formula-builder-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.028'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="p-4 sm:p-6 lg:p-8 formula-builder-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-amber-200/40 dark:border-amber-500/10 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-200/20 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/80 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-xl backdrop-blur-sm">
                    <Calculator className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    {formulaId === "new" ? "Create Calculator" : "Edit Calculator"}
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  {currentFormula?.name || "New Formula"}: configure variables, pricing logic, and media settings.
                </p>
              </div>
              <Link href="/formulas">
                <Button variant="outline" className="h-10 rounded-full px-5 border-slate-300/80 bg-white/80 hover:bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-100 dark:hover:bg-slate-900/70">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Library
                </Button>
              </Link>
            </div>
          </div>

          {currentFormula && (
            <>
              <FormulaBuilderComponent
                formula={currentFormula}
                onUpdate={handleUpdate}
                onSave={handleSave}
                onPreview={() => setShowSingleServicePreview(true)}
                isSaving={saveFormulaMutation.isPending}
                allFormulas={allFormulas}
              />

              {/* Single Service Preview Modal */}
              <SingleServicePreviewModal
                isOpen={showSingleServicePreview}
                onClose={() => setShowSingleServicePreview(false)}
                formula={currentFormula}
              />

              {/* Full Calculator Preview (keep for reference) */}
              {showPreview && (
                <div className="mt-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/70 shadow-sm backdrop-blur">
                  <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-700/70">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Full Calculator Preview</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Preview the complete customer experience with contact forms</p>
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
    </DashboardLayout>
  );
}
