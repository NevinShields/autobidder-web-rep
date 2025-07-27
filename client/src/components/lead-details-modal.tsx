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

  const { data: config } = useQuery({
    queryKey: ["/api/config"],
  });

  const googleMapsApiKey = (config as { googleMapsApiKey?: string })?.googleMapsApiKey || '';

  if (!lead) return null;

  const handleCall = () => {
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    }
  };

  const handleText = () => {
    if (lead.phone) {
      window.location.href = `sms:${lead.phone}`;
    }
  };

  const handleEmail = () => {
    const subject = `Follow up on your ${lead.serviceNames} quote`;
    const body = `Hi ${lead.name},\n\nThank you for your interest in our services. I wanted to follow up on your recent quote for ${lead.serviceNames}.\n\nYour quoted price: $${lead.calculatedPrice.toLocaleString()}\n\nPlease let me know if you have any questions or would like to move forward.\n\nBest regards`;
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleMaps = () => {
    if (lead.address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const handleStreetView = () => {
    if (lead.address) {
      const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(lead.address)}`;
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
                {lead.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                {lead.name}
                <Badge variant={lead.type === 'multi' ? 'default' : 'secondary'}>
                  {lead.type === 'multi' ? 'Multi Service' : 'Single Service'}
                </Badge>
              </div>
              <div className="text-sm font-normal text-gray-500">
                {format(new Date(lead.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Lead details and quick actions for {lead.name}
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
                    <span className="text-sm text-gray-600 break-all">{lead.email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(lead.email, 'email')}
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

                {lead.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{lead.phone}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(lead.phone!, 'phone')}
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

                {lead.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Address</span>
                      <p className="text-sm text-gray-600 mt-1">{lead.address}</p>
                    </div>
                  </div>
                )}

                {lead.ipAddress && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">IP Address</span>
                    </div>
                    <span className="text-sm text-gray-600 font-mono">{lead.ipAddress}</span>
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
                    disabled={!lead.phone}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    onClick={handleText}
                    disabled={!lead.phone}
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
                    disabled={!lead.address}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Maps
                  </Button>
                </div>
                {lead.address && (
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
                    ${lead.calculatedPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Total Quote ({lead.totalServices} service{lead.totalServices > 1 ? 's' : ''})
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Services Requested:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {lead.serviceNames}
                  </p>
                </div>

                {lead.type === 'multi' && lead.services && lead.services.length > 1 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Service Breakdown:</h4>
                    <div className="space-y-2">
                      {lead.services.map((service, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span className="text-gray-700">{service.formulaName}</span>
                          <span className="font-medium text-green-600">
                            ${service.calculatedPrice.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(lead.notes || lead.howDidYouHear || (lead.variables && Object.keys(lead.variables).length > 0)) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {lead.notes}
                    </p>
                  </div>
                )}

                {lead.howDidYouHear && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">How they heard about us:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {lead.howDidYouHear}
                    </p>
                  </div>
                )}

                {lead.variables && Object.keys(lead.variables).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Quote Variables:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(lead.variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium text-gray-800">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Map Actions */}
          {lead.address && (
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
                    <p className="text-gray-600 mb-4">{lead.address}</p>
                    
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
                      src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(lead.address || '')}&zoom=15&maptype=roadmap`}
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
                                <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address || '')}', '_blank')" 
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