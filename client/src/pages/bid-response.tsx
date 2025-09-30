import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, MessageSquare, DollarSign, Calendar, MapPin, Phone, Mail, Video } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/app-header';
import type { Proposal } from '@shared/schema';

interface BidRequest {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: string;
  autoPrice: number;
  finalPrice?: number;
  bidStatus: string;
  services: Array<{
    formulaName: string;
    calculatedPrice: number;
    variables: Record<string, any>;
    appliedDiscounts?: Array<{
      name: string;
      type: 'percentage' | 'fixed';
      value: number;
      amount: number;
    }>;
    selectedUpsells?: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
    }>;
  }>;
  appliedDiscounts?: Array<{
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  }>;
  selectedUpsells?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
  }>;
  bundleDiscount?: number;
  taxAmount?: number;
  subtotal?: number;
  emailSubject?: string;
  emailBody?: string;
  businessOwnerId: string;
}

interface BidResponse {
  id: number;
  responseType: 'approve' | 'deny' | 'request_edits';
  message?: string;
  createdAt: string;
}

export default function BidResponsePage() {
  const [match, params] = useRoute('/bid-response/:token');
  const [bidRequest, setBidRequest] = useState<BidRequest | null>(null);
  const [existingResponse, setExistingResponse] = useState<BidResponse | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responseType, setResponseType] = useState<'approve' | 'deny' | 'request_edits' | null>(null);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (match && params?.token) {
      fetchBidRequest(params.token);
    }
  }, [match, params]);

  const fetchBidRequest = async (token: string) => {
    try {
      setLoading(true);
      
      // Get bid request by token
      const response = await apiRequest('GET', `/api/verify-bid/${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load bid request');
      }
      
      setBidRequest(data);
      
      // Fetch proposal settings for the business owner
      try {
        const proposalResponse = await apiRequest('GET', `/api/proposals/public/${data.businessOwnerId}`);
        if (proposalResponse.ok) {
          const proposalData = await proposalResponse.json();
          setProposal(proposalData);
        }
      } catch (error) {
        console.log('No proposal settings found, using defaults');
      }
      
      // Check for existing response (only if bid request loaded successfully)
      try {
        const responseData = await apiRequest('GET', `/api/bid-responses/${data.id}`);
        if (responseData.ok) {
          const responses = await responseData.json();
          if (responses.length > 0) {
            setExistingResponse(responses[0]);
          }
        }
      } catch (error) {
        // No existing response is fine, don't retry endlessly
        console.log('No existing response found');
      }
      
    } catch (error) {
      console.error('Error fetching bid request:', error);
      
      // Set bid request to null to stop further attempts
      setBidRequest(null);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to load bid request";
      
      toast({
        title: "Error",
        description: errorMessage.includes("not found") || errorMessage.includes("invalid token")
          ? "This bid link has expired or is invalid. Please check the link and try again."
          : "Failed to load bid information. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!bidRequest || !responseType) return;
    
    try {
      setSubmitting(true);
      
      const responseData = {
        bidRequestId: bidRequest.id,
        responseType,
        message: message.trim() || undefined,
      };
      
      const response = await apiRequest('POST', '/api/bid-responses', responseData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit response');
      }
      
      const newResponse = await response.json();
      setExistingResponse(newResponse);
      
      toast({
        title: "Response Submitted",
        description: `Your ${responseType.replace('_', ' ')} response has been sent successfully.`,
      });
      
      // Reset form
      setResponseType(null);
      setMessage('');
      
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading bid information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bidRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Bid Not Found</h2>
            <p className="text-gray-600 mb-4">
              The bid information could not be found. Please check your link or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  // Get styling from proposal or use defaults
  const styling = proposal?.styling || {
    primaryColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    borderRadius: 12,
    fontFamily: "inter"
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: styling.backgroundColor,
        color: styling.textColor,
        fontFamily: styling.fontFamily
      }}
    >
      <AppHeader />
      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: styling.textColor }}
            >
              {proposal?.title || "Service Quote Response"}
            </h1>
            {proposal?.subtitle && (
              <p className="text-lg mb-2" style={{ color: styling.textColor, opacity: 0.8 }}>
                {proposal.subtitle}
              </p>
            )}
            <p style={{ color: styling.textColor, opacity: 0.7 }}>
              {proposal?.headerText || "Please review your quote and provide your response"}
            </p>
          </div>

          {/* Proposal Video */}
          {proposal?.videoUrl && (
            <Card style={{ borderRadius: `${styling.borderRadius}px` }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="w-5 h-5" style={{ color: styling.primaryColor }} />
                  <h3 className="font-semibold" style={{ color: styling.textColor }}>
                    Watch Our Introduction
                  </h3>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={proposal.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Proposal Video"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Text */}
          {proposal?.customText && (
            <Card style={{ borderRadius: `${styling.borderRadius}px` }}>
              <CardContent className="p-6">
                <div 
                  className="prose max-w-none"
                  style={{ color: styling.textColor }}
                >
                  {proposal.customText.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Existing Response Alert */}
        {existingResponse && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Response Already Submitted</p>
                  <p className="text-sm text-green-700">
                    You submitted a "{existingResponse.responseType.replace('_', ' ')}" response on{' '}
                    {new Date(existingResponse.createdAt).toLocaleDateString()}
                  </p>
                  {existingResponse.message && (
                    <p className="text-sm text-green-700 mt-1">
                      Message: "{existingResponse.message}"
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quote Details */}
          <Card style={{ borderRadius: `${styling.borderRadius}px` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: styling.textColor }}>
                <DollarSign className="w-5 h-5" style={{ color: styling.primaryColor }} />
                Quote Details
              </CardTitle>
              <CardDescription style={{ color: styling.textColor, opacity: 0.7 }}>
                Review your service quote information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="font-medium" style={{ color: styling.textColor }}>Customer Information</h3>
                <div className="space-y-1 text-sm" style={{ color: styling.textColor, opacity: 0.7 }}>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {bidRequest.customerEmail}
                  </div>
                  {bidRequest.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {bidRequest.customerPhone}
                    </div>
                  )}
                  {bidRequest.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {bidRequest.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="space-y-2">
                <h3 className="font-medium" style={{ color: styling.textColor }}>Services Requested</h3>
                <div className="space-y-3">
                  {bidRequest.services.map((service, index) => (
                    <div 
                      key={index} 
                      className="p-4 border"
                      style={{ 
                        backgroundColor: `${styling.backgroundColor}${styling.backgroundColor === '#FFFFFF' ? 'F5' : ''}`,
                        borderRadius: `${styling.borderRadius}px`,
                        borderColor: `${styling.primaryColor}33`
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-medium text-lg">{service.formulaName}</span>
                        <Badge variant="secondary" className="text-sm font-semibold">
                          {formatPrice(service.calculatedPrice)}
                        </Badge>
                      </div>
                      
                      {/* Form Details */}
                      {service.variables && Object.keys(service.variables).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Selection Details:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(service.variables).map(([key, value]) => {
                              // Format the key to be more readable
                              const formattedKey = key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())
                                .trim();
                              
                              // Handle array values (from multi-select fields)
                              const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                              
                              return (
                                <div key={key} className="text-sm">
                                  <span className="text-gray-600">{formattedKey}:</span>
                                  <span className="ml-2 font-medium">{displayValue}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 border-t pt-4" style={{ borderColor: `${styling.primaryColor}33` }}>
                <h3 className="font-medium" style={{ color: styling.textColor }}>Pricing Breakdown</h3>
                
                {/* Service Subtotal */}
                <div className="space-y-2">
                  {bidRequest.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{service.formulaName}:</span>
                      <span>{formatPrice(service.calculatedPrice)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-medium">
                      {formatPrice(bidRequest.services.reduce((sum, service) => sum + service.calculatedPrice, 0))}
                    </span>
                  </div>
                </div>

                {/* Discounts */}
                {bidRequest.bundleDiscount && bidRequest.bundleDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Bundle Discount:</span>
                    <span>-{formatPrice(bidRequest.bundleDiscount)}</span>
                  </div>
                )}

                {bidRequest.appliedDiscounts && bidRequest.appliedDiscounts.length > 0 && (
                  <div className="space-y-1">
                    {bidRequest.appliedDiscounts.map((discount, index) => (
                      <div key={index} className="flex justify-between items-center text-sm text-green-600">
                        <span>{discount.name}:</span>
                        <span>-{formatPrice(discount.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tax */}
                {bidRequest.taxAmount && bidRequest.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded border border-blue-200">
                    <span className="text-blue-700 font-medium">Sales Tax:</span>
                    <span className="text-blue-600 font-medium">+{formatPrice(bidRequest.taxAmount)}</span>
                  </div>
                )}

                {/* Upsells */}
                {bidRequest.selectedUpsells && bidRequest.selectedUpsells.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Selected Add-ons:</span>
                    {bidRequest.selectedUpsells.map((upsell, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{upsell.name}:</span>
                        <span>+{formatPrice(upsell.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">Total Estimated Price:</span>
                  <span className="text-xl font-bold text-primary">{formatPrice(bidRequest.autoPrice)}</span>
                </div>
                
                {bidRequest.finalPrice && bidRequest.finalPrice !== bidRequest.autoPrice && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-700">Final Quote:</span>
                    <span className="text-xl font-bold text-green-700">{formatPrice(bidRequest.finalPrice)}</span>
                  </div>
                )}
              </div>

              {/* Quote Message */}
              {bidRequest.emailBody && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="font-medium">Message from Service Provider</h3>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                    {bidRequest.emailBody}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Form */}
          <Card style={{ borderRadius: `${styling.borderRadius}px` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: styling.textColor }}>
                <MessageSquare className="w-5 h-5" style={{ color: styling.primaryColor }} />
                Your Response
              </CardTitle>
              <CardDescription style={{ color: styling.textColor, opacity: 0.7 }}>
                {proposal?.enableAcceptReject ? "Let us know how you'd like to proceed" : "Provide your feedback"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!existingResponse ? (
                <>
                  {/* Response Options */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Choose your response:</Label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setResponseType('approve')}
                        className={`w-full p-4 text-left transition-colors ${
                          responseType === 'approve'
                            ? 'bg-green-50'
                            : 'hover:border-green-300'
                        }`}
                        style={{
                          borderRadius: `${styling.borderRadius}px`,
                          border: responseType === 'approve' 
                            ? `2px solid ${styling.primaryColor}` 
                            : '2px solid #E5E7EB'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5" style={{ color: styling.primaryColor }} />
                          <div>
                            <p className="font-medium" style={{ color: styling.textColor }}>
                              {proposal?.acceptButtonText || "Approve Quote"}
                            </p>
                            <p className="text-sm" style={{ color: styling.textColor, opacity: 0.7 }}>
                              I accept this quote and want to schedule the service
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setResponseType('request_edits')}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                          responseType === 'request_edits'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-yellow-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-800">Request Changes</p>
                            <p className="text-sm text-yellow-600">I have questions or need modifications to the quote</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setResponseType('deny')}
                        className={`w-full p-4 text-left transition-colors ${
                          responseType === 'deny'
                            ? 'bg-red-50'
                            : 'hover:border-red-300'
                        }`}
                        style={{
                          borderRadius: `${styling.borderRadius}px`,
                          border: responseType === 'deny' 
                            ? '2px solid #EF4444' 
                            : '2px solid #E5E7EB'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-800">
                              {proposal?.rejectButtonText || "Decline Quote"}
                            </p>
                            <p className="text-sm text-red-600">
                              I do not wish to proceed with this service
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Message Input */}
                  {responseType && (
                    <div className="space-y-2">
                      <Label htmlFor="message">
                        {responseType === 'approve' && 'Additional notes (optional):'}
                        {responseType === 'request_edits' && 'What changes would you like? (required):'}
                        {responseType === 'deny' && 'Reason for declining (optional):'}
                      </Label>
                      <Textarea
                        id="message"
                        placeholder={
                          responseType === 'approve'
                            ? 'Let us know any special instructions or preferred scheduling...'
                            : responseType === 'request_edits'
                            ? 'Please describe the changes you need...'
                            : 'Let us know why this quote doesn\'t work for you...'
                        }
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[100px]"
                        required={responseType === 'request_edits'}
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  {responseType && (
                    <Button
                      onClick={submitResponse}
                      disabled={submitting || (responseType === 'request_edits' && !message.trim())}
                      className="w-full"
                      style={{
                        backgroundColor: styling.primaryColor,
                        borderRadius: `${styling.borderRadius}px`
                      }}
                      data-testid="button-submit-response"
                    >
                      {submitting ? 'Submitting...' : 'Submit Response'}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Response Submitted</h3>
                  <p className="text-green-600">
                    Thank you for your response. The service provider will be in touch soon.
                  </p>
                  {existingResponse.responseType === 'approve' && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-700">
                        You approved this quote. The service provider will contact you to schedule the work.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}