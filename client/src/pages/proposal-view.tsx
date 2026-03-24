import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SubmittedVariableDetails from "@/components/submitted-variable-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, FileText, Calendar } from "lucide-react";
import type { Formula } from "@shared/schema";

interface ProposalServiceLine {
  formulaId?: number;
  formulaName?: string;
  calculatedPrice?: number;
  variables?: Record<string, unknown>;
  appliedDiscounts?: Array<{
    name?: string;
    percentage?: number;
    amount?: number;
  }>;
  selectedUpsells?: Array<{
    name?: string;
    percentageOfMain?: number;
    percentage?: number;
    amount?: number;
  }>;
}

interface PublicLeadData {
  businessOwnerId?: string;
  totalPrice?: number;
  services?: ProposalServiceLine[];
}

interface ProposalStyling {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;
}

interface PublicProposalData {
  styling?: Partial<ProposalStyling>;
  showCompanyLogo?: boolean;
  title?: string;
  subtitle?: string;
  headerText?: string;
  videoUrl?: string;
  showServiceBreakdown?: boolean;
  showTotal?: boolean;
  customText?: string;
  termsAndConditionsPdfUrl?: string;
  insurancePdfUrl?: string;
  enableAcceptReject?: boolean;
  acceptButtonText?: string;
  rejectButtonText?: string;
}

interface PublicBusinessSettingsData {
  businessName?: string;
}

export default function ProposalViewPage() {
  const { leadId } = useParams();

  // Fetch lead data including selected services
  const { data: lead, isLoading: leadLoading } = useQuery<PublicLeadData>({
    queryKey: [`/api/multi-service-leads/${leadId}`],
    retry: false,
  });

  // Fetch proposal template
  const { data: proposal, isLoading: proposalLoading } = useQuery<PublicProposalData>({
    queryKey: [`/api/proposals/public/${lead?.businessOwnerId}`],
    enabled: !!lead?.businessOwnerId,
    retry: false,
  });

  // Fetch business settings for branding
  const { data: businessSettings, isLoading: businessLoading } = useQuery<PublicBusinessSettingsData>({
    queryKey: [`/api/public/business-settings/${lead?.businessOwnerId}`],
    enabled: !!lead?.businessOwnerId,
    retry: false,
  });

  const { data: formulas = [] } = useQuery<Formula[]>({
    queryKey: ["/api/public/formulas", lead?.businessOwnerId],
    enabled: !!lead?.businessOwnerId,
    retry: false,
    queryFn: async () => {
      const res = await fetch('/api/public/formulas?userId=' + lead?.businessOwnerId);
      if (!res.ok) throw new Error("Failed to fetch formulas");
      return res.json();
    },
  });

  if (leadLoading || proposalLoading || businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600">This proposal link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    // TODO: Implement accept proposal logic
    console.log('Accepting proposal for lead:', leadId);
  };

  const handleReject = async () => {
    // TODO: Implement reject proposal logic
    console.log('Rejecting proposal for lead:', leadId);
  };

  const totalPrice = lead.totalPrice || 0;
  const services = lead.services || [];
  const formulasById = new Map(formulas.map((formula) => [formula.id, formula]));
  const styling: ProposalStyling = {
    primaryColor: proposal?.styling?.primaryColor || "#2563EB",
    backgroundColor: proposal?.styling?.backgroundColor || "#FFFFFF",
    textColor: proposal?.styling?.textColor || "#1F2937",
    borderRadius: proposal?.styling?.borderRadius ?? 12,
    fontFamily: proposal?.styling?.fontFamily || "inter",
  };
  const fallbackStyling: ProposalStyling = {
    primaryColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    borderRadius: 12,
    fontFamily: "inter"
  };
  const resolvedStyling = styling || fallbackStyling;

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ 
        backgroundColor: resolvedStyling.backgroundColor,
        fontFamily: resolvedStyling.fontFamily,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {proposal?.showCompanyLogo && businessSettings?.businessName && (
            <div className="mb-6">
              <h1 
                className="text-3xl font-bold"
                style={{ color: resolvedStyling.primaryColor }}
              >
                {businessSettings.businessName}
              </h1>
            </div>
          )}
          
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: resolvedStyling.textColor }}
          >
            {proposal?.title || "Service Proposal"}
          </h2>
          
          {proposal?.subtitle && (
            <p 
              className="text-lg mb-4"
              style={{ color: resolvedStyling.textColor }}
            >
              {proposal.subtitle}
            </p>
          )}
          
          {proposal?.headerText && (
            <p 
              className="mb-6"
              style={{ color: resolvedStyling.textColor }}
            >
              {proposal.headerText}
            </p>
          )}
        </div>

        {/* Video */}
        {proposal?.videoUrl && (
          <div className="mb-8">
            <Card style={{ borderRadius: `${resolvedStyling.borderRadius}px` }}>
              <CardContent className="p-6">
                <div className="aspect-video">
                  <iframe
                    src={proposal.videoUrl}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                    title="Proposal Video"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Service Breakdown */}
        {proposal?.showServiceBreakdown && services.length > 0 && (
          <Card className="mb-8" style={{ borderRadius: `${resolvedStyling.borderRadius}px` }}>
            <CardHeader>
              <CardTitle style={{ color: resolvedStyling.textColor }}>Services Requested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service: ProposalServiceLine, index: number) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: `${resolvedStyling.primaryColor}10` }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 
                          className="font-semibold"
                          style={{ color: resolvedStyling.textColor }}
                        >
                          {service.formulaName}
                        </h4>
                        {service.variables && Object.keys(service.variables).length > 0 && (
                          <div className="text-sm mt-2" style={{ color: resolvedStyling.textColor + '80' }}>
                            <SubmittedVariableDetails
                              values={service.variables as Record<string, any>}
                              formula={service.formulaId ? formulasById.get(service.formulaId) : undefined}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-bold" style={{ color: resolvedStyling.primaryColor }}>
                        ${service.calculatedPrice?.toLocaleString() || '0'}
                      </div>
                    </div>
                    
                    {/* Display applied discounts for this service */}
                    {service.appliedDiscounts && service.appliedDiscounts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-red-600 mb-2">Applied Discounts:</h5>
                        {service.appliedDiscounts.map((discount: any, discountIndex: number) => (
                          <div key={discountIndex} className="flex justify-between text-sm text-red-600">
                            <span>{discount.name} (-{discount.percentage}%)</span>
                            <span>-${((discount.amount || 0) / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Display selected upsells for this service */}
                    {service.selectedUpsells && service.selectedUpsells.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-green-600 mb-2">Selected Add-ons:</h5>
                        {service.selectedUpsells.map((upsell: any, upsellIndex: number) => (
                          <div key={upsellIndex} className="flex justify-between text-sm text-green-600">
                            <span>{upsell.name} (+{upsell.percentageOfMain || upsell.percentage}%)</span>
                            <span>+${((upsell.amount || 0) / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total */}
        {proposal?.showTotal && (
          <Card className="mb-8" style={{ borderRadius: `${resolvedStyling.borderRadius}px` }}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span 
                  className="text-xl font-semibold"
                  style={{ color: resolvedStyling.textColor }}
                >
                  Total Investment:
                </span>
                <span 
                  className="text-3xl font-bold"
                  style={{ color: resolvedStyling.primaryColor }}
                >
                  ${totalPrice.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Text */}
        {proposal?.customText && (
          <Card className="mb-8" style={{ borderRadius: `${resolvedStyling.borderRadius}px` }}>
            <CardContent className="p-6">
              <div 
                className="prose max-w-none"
                style={{ color: resolvedStyling.textColor }}
                dangerouslySetInnerHTML={{ __html: proposal.customText.replace(/\n/g, '<br>') }}
              />
            </CardContent>
          </Card>
        )}

        {/* PDF Documents */}
        {(proposal?.termsAndConditionsPdfUrl || proposal?.insurancePdfUrl) && (
          <Card className="mb-8" style={{ borderRadius: `${resolvedStyling.borderRadius}px` }}>
            <CardHeader>
              <CardTitle style={{ color: resolvedStyling.textColor }}>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposal?.termsAndConditionsPdfUrl && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: resolvedStyling.primaryColor }} />
                  <a
                    href={proposal.termsAndConditionsPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Terms and Conditions
                  </a>
                </div>
              )}
              {proposal?.insurancePdfUrl && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: resolvedStyling.primaryColor }} />
                  <a
                    href={proposal.insurancePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Insurance Information
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Accept/Reject Buttons */}
        {proposal?.enableAcceptReject && (
          <Card style={{ borderRadius: `${resolvedStyling.borderRadius}px` }}>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: resolvedStyling.textColor }}
                >
                  What would you like to do next?
                </h3>
                <p style={{ color: resolvedStyling.textColor + '80' }}>
                  Please let us know your decision regarding this proposal.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleAccept}
                  className="flex items-center gap-2 px-8 py-3"
                  style={{
                    backgroundColor: resolvedStyling.primaryColor,
                    color: '#FFFFFF',
                    borderRadius: `${resolvedStyling.borderRadius / 2}px`,
                  }}
                >
                  <Check className="w-5 h-5" />
                  {proposal?.acceptButtonText || "Accept Proposal"}
                </Button>
                
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="flex items-center gap-2 px-8 py-3"
                  style={{
                    borderColor: resolvedStyling.primaryColor,
                    color: resolvedStyling.primaryColor,
                    borderRadius: `${resolvedStyling.borderRadius / 2}px`,
                  }}
                >
                  <X className="w-5 h-5" />
                  {proposal?.rejectButtonText || "Decline Proposal"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm" style={{ color: resolvedStyling.textColor + '60' }}>
          <p>
            Powered by {businessSettings?.businessName || 'Autobidder'} • 
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
