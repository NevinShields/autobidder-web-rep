import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, FileText, Calendar } from "lucide-react";

export default function ProposalViewPage() {
  const { leadId } = useParams();

  // Fetch lead data including selected services
  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: [`/api/multi-service-leads/${leadId}`],
    retry: false,
  });

  // Fetch proposal template
  const { data: proposal, isLoading: proposalLoading } = useQuery({
    queryKey: [`/api/proposals/public/${lead?.businessOwnerId}`],
    enabled: !!lead?.businessOwnerId,
    retry: false,
  });

  // Fetch business settings for branding
  const { data: businessSettings, isLoading: businessLoading } = useQuery({
    queryKey: [`/api/public/business-settings/${lead?.businessOwnerId}`],
    enabled: !!lead?.businessOwnerId,
    retry: false,
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
  const styling = proposal?.styling || {
    primaryColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    borderRadius: 12,
    fontFamily: "inter"
  };

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ 
        backgroundColor: styling.backgroundColor,
        fontFamily: styling.fontFamily,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {proposal?.showCompanyLogo && businessSettings?.businessName && (
            <div className="mb-6">
              <h1 
                className="text-3xl font-bold"
                style={{ color: styling.primaryColor }}
              >
                {businessSettings.businessName}
              </h1>
            </div>
          )}
          
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: styling.textColor }}
          >
            {proposal?.title || "Service Proposal"}
          </h2>
          
          {proposal?.subtitle && (
            <p 
              className="text-lg mb-4"
              style={{ color: styling.textColor }}
            >
              {proposal.subtitle}
            </p>
          )}
          
          {proposal?.headerText && (
            <p 
              className="mb-6"
              style={{ color: styling.textColor }}
            >
              {proposal.headerText}
            </p>
          )}
        </div>

        {/* Video */}
        {proposal?.videoUrl && (
          <div className="mb-8">
            <Card style={{ borderRadius: `${styling.borderRadius}px` }}>
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
          <Card className="mb-8" style={{ borderRadius: `${styling.borderRadius}px` }}>
            <CardHeader>
              <CardTitle style={{ color: styling.textColor }}>Services Requested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-center p-4 rounded-lg"
                    style={{ backgroundColor: `${styling.primaryColor}10` }}
                  >
                    <div>
                      <h4 
                        className="font-semibold"
                        style={{ color: styling.textColor }}
                      >
                        {service.formulaName}
                      </h4>
                      {service.variables && Object.keys(service.variables).length > 0 && (
                        <div className="text-sm mt-1" style={{ color: styling.textColor + '80' }}>
                          {Object.entries(service.variables).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-bold" style={{ color: styling.primaryColor }}>
                      ${service.calculatedPrice?.toLocaleString() || '0'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total */}
        {proposal?.showTotal && (
          <Card className="mb-8" style={{ borderRadius: `${styling.borderRadius}px` }}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span 
                  className="text-xl font-semibold"
                  style={{ color: styling.textColor }}
                >
                  Total Investment:
                </span>
                <span 
                  className="text-3xl font-bold"
                  style={{ color: styling.primaryColor }}
                >
                  ${totalPrice.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Text */}
        {proposal?.customText && (
          <Card className="mb-8" style={{ borderRadius: `${styling.borderRadius}px` }}>
            <CardContent className="p-6">
              <div 
                className="prose max-w-none"
                style={{ color: styling.textColor }}
                dangerouslySetInnerHTML={{ __html: proposal.customText.replace(/\n/g, '<br>') }}
              />
            </CardContent>
          </Card>
        )}

        {/* PDF Documents */}
        {(proposal?.termsAndConditionsPdfUrl || proposal?.insurancePdfUrl) && (
          <Card className="mb-8" style={{ borderRadius: `${styling.borderRadius}px` }}>
            <CardHeader>
              <CardTitle style={{ color: styling.textColor }}>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposal?.termsAndConditionsPdfUrl && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: styling.primaryColor }} />
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
                  <FileText className="w-5 h-5" style={{ color: styling.primaryColor }} />
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
          <Card style={{ borderRadius: `${styling.borderRadius}px` }}>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: styling.textColor }}
                >
                  What would you like to do next?
                </h3>
                <p style={{ color: styling.textColor + '80' }}>
                  Please let us know your decision regarding this proposal.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleAccept}
                  className="flex items-center gap-2 px-8 py-3"
                  style={{
                    backgroundColor: styling.primaryColor,
                    color: '#FFFFFF',
                    borderRadius: `${styling.borderRadius / 2}px`,
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
                    borderColor: styling.primaryColor,
                    color: styling.primaryColor,
                    borderRadius: `${styling.borderRadius / 2}px`,
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
        <div className="text-center mt-8 text-sm" style={{ color: styling.textColor + '60' }}>
          <p>
            Powered by {businessSettings?.businessName || 'Autobidder'} • 
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}