import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  Mail, 
  Calendar, 
  DollarSign, 
  User, 
  FileText,
  ExternalLink,
  Copy,
  CheckCircle,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Lead {
  id: number;
  formulaId?: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
  calculatedPrice: number;
  variables?: Record<string, any>;
  services?: Array<{
    formulaId: number;
    formulaName: string;
    variables: Record<string, any>;
    calculatedPrice: number;
  }>;
  totalPrice?: number;
  appliedDiscounts?: Array<{
    id: string;
    name: string;
    percentage: number;
    amount: number; // Amount in cents
  }>;
  bundleDiscountAmount?: number; // Amount in cents
  taxAmount?: number; // Tax amount in cents
  createdAt: string;
  type: 'single' | 'multi';
  formula?: {
    name: string;
    title: string;
  };
  serviceNames: string;
  totalServices: number;
  ipAddress?: string;
}

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadDetailsModal({ lead, isOpen, onClose }: LeadDetailsModalProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { toast } = useToast();

  // Process lead data to calculate serviceNames and totalServices if not provided
  const processedLead = lead ? {
    ...lead,
    serviceNames: lead.serviceNames || (lead.services?.map(s => s.formulaName).filter(Boolean).join(', ') || (lead.formula?.title || lead.formula?.name || 'Unknown Service')),
    totalServices: lead.totalServices || lead.services?.length || 1,
    calculatedPrice: lead.calculatedPrice / 100 // Convert from cents to dollars for display
  } : null;

  const { data: config } = useQuery({
    queryKey: ["/api/config"],
  });

  const googleMapsApiKey = (config as { googleMapsApiKey?: string })?.googleMapsApiKey || '';

  if (!processedLead) return null;

  const handleCall = () => {
    if (processedLead.phone) {
      window.location.href = `tel:${processedLead.phone}`;
    }
  };

  const handleText = () => {
    if (processedLead.phone) {
      window.location.href = `sms:${processedLead.phone}`;
    }
  };

  const handleEmail = () => {
    const subject = `Follow up on your ${processedLead.serviceNames} quote`;
    const body = `Hi ${processedLead.name},\n\nThank you for your interest in our services. I wanted to follow up on your recent quote for ${processedLead.serviceNames}.\n\nYour quoted price: $${processedLead.calculatedPrice.toLocaleString()}\n\nPlease let me know if you have any questions or would like to move forward.\n\nBest regards`;
    window.location.href = `mailto:${processedLead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleMaps = () => {
    if (processedLead.address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(processedLead.address)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const handleStreetView = () => {
    if (processedLead.address) {
      const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(processedLead.address)}`;
      window.open(streetViewUrl, '_blank');
    }
  };

  const copyToClipboard = async (text: string, type: 'phone' | 'email') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'phone') {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type === 'phone' ? 'Phone number' : 'Email address'} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {processedLead.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                {processedLead.name}
                <Badge variant={processedLead.type === 'multi' ? 'default' : 'secondary'}>
                  {processedLead.type === 'multi' ? 'Multi Service' : 'Single Service'}
                </Badge>
              </div>
              <div className="text-sm font-normal text-gray-500">
                {format(new Date(processedLead.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Lead details and quick actions for {processedLead.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information & Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 break-all">{processedLead.email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(processedLead.email, 'email')}
                      className="h-6 w-6 p-0"
                    >
                      {copiedEmail ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {processedLead.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{processedLead.phone}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(processedLead.phone!, 'phone')}
                        className="h-6 w-6 p-0"
                      >
                        {copiedPhone ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {processedLead.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Address</span>
                      <p className="text-sm text-gray-600 mt-1">{processedLead.address}</p>
                    </div>
                  </div>
                )}

                {processedLead.ipAddress && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">IP Address</span>
                    </div>
                    <span className="text-sm text-gray-600 font-mono">{processedLead.ipAddress}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleCall}
                    disabled={!processedLead.phone}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    onClick={handleText}
                    disabled={!processedLead.phone}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    onClick={handleEmail}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    onClick={handleMaps}
                    disabled={!processedLead.address}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Maps
                  </Button>
                </div>
                {processedLead.address && (
                  <Button
                    onClick={handleStreetView}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Street View
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    ${processedLead.calculatedPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Total Quote ({processedLead.totalServices} service{processedLead.totalServices > 1 ? 's' : ''})
                  </div>
                </div>

                {/* Detailed Service Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Services Requested & Customer Details:</h4>
                  <div className="space-y-4">
                    {processedLead.type === 'multi' && processedLead.services && processedLead.services.length > 0 ? (
                      // Multi-service layout with detailed breakdown
                      processedLead.services.map((service, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-semibold text-gray-900">{service.formulaName}</h5>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                ${(service.calculatedPrice / 100).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Service {index + 1}</div>
                            </div>
                          </div>
                          
                          {/* Service-specific variables if available */}
                          {service.variables && Object.keys(service.variables).length > 0 && (
                            <div className="mt-3">
                              <h6 className="text-xs font-medium text-gray-600 mb-2">Customer Selections:</h6>
                              <div className="grid grid-cols-1 gap-2">
                                {Object.entries(service.variables).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                                    <span className="text-gray-600 capitalize font-medium">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>
                                    <span className="text-gray-800 font-medium">
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      // Single service layout with detailed information
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-semibold text-gray-900">{processedLead.serviceNames}</h5>
                          <div className="text-lg font-bold text-green-600">
                            ${processedLead.calculatedPrice.toLocaleString()}
                          </div>
                        </div>
                        
                        {/* Single service variables */}
                        {processedLead.variables && Object.keys(processedLead.variables).length > 0 && (
                          <div className="mt-3">
                            <h6 className="text-xs font-medium text-gray-600 mb-2">Customer Selections & Answers:</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries(processedLead.variables).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                                  <span className="text-gray-600 capitalize font-medium">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Discount Information */}
                {((processedLead.appliedDiscounts && processedLead.appliedDiscounts.length > 0) || (processedLead.bundleDiscountAmount && processedLead.bundleDiscountAmount > 0)) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Discounts Applied:</h4>
                    <div className="space-y-2">
                      {/* Bundle Discount */}
                      {processedLead.bundleDiscountAmount && processedLead.bundleDiscountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm bg-green-50 p-2 rounded border border-green-200">
                          <span className="text-green-700">Bundle Discount (Multiple Services)</span>
                          <span className="font-medium text-green-600">
                            -${(processedLead.bundleDiscountAmount / 100).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {/* Customer Discounts */}
                      {processedLead.appliedDiscounts && processedLead.appliedDiscounts.length > 0 && processedLead.appliedDiscounts.map((discount, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-green-50 p-2 rounded border border-green-200">
                          <span className="text-green-700">{discount.name} ({discount.percentage}%)</span>
                          <span className="font-medium text-green-600">
                            -${(discount.amount / 100).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tax Information */}
                {processedLead.taxAmount && processedLead.taxAmount > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sales Tax:</h4>
                    <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded border border-blue-200">
                      <span className="text-blue-700">Sales Tax</span>
                      <span className="font-medium text-blue-600">
                        +${(processedLead.taxAmount / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(processedLead.notes || processedLead.howDidYouHear) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {processedLead.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {processedLead.notes}
                    </p>
                  </div>
                )}

                {processedLead.howDidYouHear && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">How they heard about us:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {processedLead.howDidYouHear}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Map Actions */}
          {processedLead.address && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Address:</span>
                    </div>
                    <p className="text-gray-600 mb-4">{processedLead.address}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        onClick={handleMaps}
                        className="w-full justify-start"
                        size="sm"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Open in Google Maps
                      </Button>
                      <Button
                        onClick={handleStreetView}
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Street View
                      </Button>
                    </div>
                  </div>
                  
                  {/* Embedded Google Map */}
                  <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(processedLead.address || '')}&zoom=15&maptype=roadmap`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Maps"
                      onError={(e) => {
                        // Fallback content if iframe fails
                        const target = e.target as HTMLIFrameElement;
                        if (target && target.parentElement) {
                          target.parentElement.innerHTML = `
                            <div class="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                              <div class="text-center p-6">
                                <div class="h-12 w-12 text-gray-400 mx-auto mb-3">📍</div>
                                <p class="text-gray-600 mb-4">Map preview not available</p>
                                <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(processedLead.address || '')}', '_blank')" 
                                        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                                  View on Google Maps
                                </button>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}