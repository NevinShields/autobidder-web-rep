import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { CustomForm, Formula } from "@shared/schema";
import EnhancedServiceSelector from "@/components/enhanced-service-selector";

// Interface for the API response
interface CustomFormResponse {
  form: CustomForm;
  formulas: Formula[];
}

export default function CustomFormDisplay() {
  const [match, params] = useRoute<{ accountId: string; slug: string }>("/f/:accountId/:slug");
  
  // Extract URL parameters
  const accountId = params?.accountId;
  const slug = params?.slug;
  
  // Debug logging
  console.log('CustomFormDisplay params:', { match, accountId, slug, pathname: window.location.pathname });
  
  // Check if this is an embed request
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbed = urlParams.get('embed') === '1';
  
  // Fetch form data
  const { data: formData, isLoading, error } = useQuery<CustomFormResponse>({
    queryKey: [`/api/public/forms/${accountId}/${slug}`],
    enabled: !!(accountId && slug),
  });

  // Debug logging for query
  console.log('Query state:', { 
    isLoading, 
    error, 
    hasData: !!formData, 
    queryKey: `/api/public/forms/${accountId}/${slug}` 
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`${isEmbed ? 'p-4' : 'min-h-screen'} flex items-center justify-center bg-gray-50`}>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading form...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !formData) {
    return (
      <div className={`${isEmbed ? 'p-4' : 'min-h-screen'} flex items-center justify-center bg-gray-50`}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Form Not Found</h2>
            <p className="text-gray-600">
              The form you're looking for doesn't exist or has been disabled.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { form, formulas } = formData;

  // Wrapper classes based on embed mode
  const wrapperClass = isEmbed 
    ? "p-4" 
    : "min-h-screen bg-gray-50 py-8";
  
  const containerClass = isEmbed 
    ? "w-full" 
    : "max-w-4xl mx-auto px-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Form Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{form.name}</CardTitle>
                {form.description && (
                  <p className="text-gray-600 mt-2">{form.description}</p>
                )}
              </div>
              <Badge variant="default">
                {formulas.length} Service{formulas.length !== 1 ? 's' : ''} Available
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Service Calculator */}
        <Card>
          <CardContent className="p-0">
            <EnhancedServiceSelector
              availableFormulas={formulas}
              isCustomForm={true}
              customFormId={form.id}
              customFormSlug={form.slug}
              customFormName={form.name}
              hideNonSelectedServices={true}
            />
          </CardContent>
        </Card>

        {/* Footer for non-embed mode */}
        {!isEmbed && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Powered by Autobidder</p>
          </div>
        )}
      </div>
    </div>
  );
}