import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Globe,
  Settings,
  Image as ImageIcon,
  Filter,
  AlertCircle,
  ClipboardCheck,
  FileCheck,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  stage: string; // "open", "booked", "completed", "lost"
}

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadDetailsModal({ lead, isOpen, onClose }: LeadDetailsModalProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(null);
  const [showCreateEstimateDialog, setShowCreateEstimateDialog] = useState(false);
  const [estimateMessage, setEstimateMessage] = useState("Thank you for your interest in our services. Please find the detailed estimate below.");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch photo measurements for this lead
  const { data: photoMeasurements = [], isLoading: isLoadingMeasurements, isError: isMeasurementsError } = useQuery<any[]>({
    queryKey: [`/api/photo-measurements/lead/${lead?.id}`],
    enabled: !!lead?.id && isOpen,
  });

  // Fetch estimates for this lead
  const { data: estimates = [] } = useQuery<any[]>({
    queryKey: [`/api/leads/${lead?.id}/estimates`],
    enabled: !!lead?.id && isOpen,
  });

  // Fetch work orders for this user
  const { data: allWorkOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/work-orders"],
    enabled: isOpen,
  });

  // Filter work orders that belong to this lead's estimates
  const leadWorkOrders = allWorkOrders.filter((wo: any) => 
    estimates.some((est: any) => est.id === wo.estimateId)
  );

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, stage, leadType }: { leadId: number; stage: string; leadType: 'single' | 'multi' }) => {
      const endpoint = leadType === 'multi' ? `/api/multi-service-leads/${leadId}` : `/api/leads/${leadId}`;
      const res = await apiRequest("PATCH", endpoint, { stage });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Status Updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update lead status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Workflow mutations
  const approveEstimateMutation = useMutation({
    mutationFn: async ({ estimateId, notes }: { estimateId: number; notes?: string }) => {
      return await apiRequest("POST", `/api/estimates/${estimateId}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}/estimates`] });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({
        title: "Estimate Approved",
        description: "Estimate has been approved and is ready to send to customer.",
      });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve estimate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: async ({ estimateId, revisionNotes }: { estimateId: number; revisionNotes: string }) => {
      return await apiRequest("POST", `/api/estimates/${estimateId}/request-revision`, { revisionNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}/estimates`] });
      setShowRevisionDialog(false);
      setRevisionNotes("");
      toast({
        title: "Revision Requested",
        description: "Revision has been requested for this estimate.",
      });
    },
    onError: () => {
      toast({
        title: "Request Failed",
        description: "Failed to request revision. Please try again.",
        variant: "destructive",
      });
    },
  });

  const convertToWorkOrderMutation = useMutation({
    mutationFn: async ({ estimateId, scheduledDate }: { estimateId: number; scheduledDate?: string }) => {
      return await apiRequest("POST", `/api/estimates/${estimateId}/convert-to-work-order`, { scheduledDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}/estimates`] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setShowScheduleDialog(false);
      setScheduledDate("");
      toast({
        title: "Work Order Created",
        description: "Estimate has been converted to a work order.",
      });
    },
    onError: () => {
      toast({
        title: "Conversion Failed",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async ({ workOrderId }: { workOrderId: number }) => {
      return await apiRequest("POST", `/api/work-orders/${workOrderId}/convert-to-invoice`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}/estimates`] });
      toast({
        title: "Invoice Created",
        description: "Work order has been converted to an invoice.",
      });
    },
    onError: () => {
      toast({
        title: "Conversion Failed",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createEstimateMutation = useMutation({
    mutationFn: async ({ businessMessage }: { businessMessage: string }) => {
      if (!lead) throw new Error("No lead selected");
      
      const endpoint = lead.type === 'multi' 
        ? `/api/multi-service-leads/${lead.id}/estimate`
        : `/api/leads/${lead.id}/estimate`;
      
      return await apiRequest("POST", endpoint, { businessMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}/estimates`] });
      setShowCreateEstimateDialog(false);
      setEstimateMessage("Thank you for your interest in our services. Please find the detailed estimate below.");
      toast({
        title: "Estimate Created",
        description: "A new estimate has been created for this lead.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create estimate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (!lead) return;
    updateStatusMutation.mutate({
      leadId: lead.id,
      stage: newStatus,
      leadType: lead.type
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'booked': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'lost': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'booked': return 'Booked';
      case 'completed': return 'Completed';
      case 'lost': return 'Lost';
      default: return status;
    }
  };

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

  const { data: businessSettings } = useQuery({
    queryKey: ["/api/business-settings"],
  });

  const googleMapsApiKey = (config as { googleMapsApiKey?: string })?.googleMapsApiKey || '';

  // Calculate proper tax amount using business settings
  const calculateTaxAmount = () => {
    const settings = businessSettings as any; // Type assertion to handle the styling property
    if (!settings?.styling?.enableSalesTax) return 0;
    
    // Calculate subtotal (service prices - discounts)
    const serviceTotal = processedLead?.type === 'multi' && processedLead.services 
      ? processedLead.services.reduce((sum, service) => sum + service.calculatedPrice, 0)
      : (processedLead?.calculatedPrice || 0) * 100; // Convert back to cents for calculation
    
    const discountTotal = (processedLead?.bundleDiscountAmount || 0) + 
      (processedLead?.appliedDiscounts?.reduce((sum, discount) => sum + discount.amount, 0) || 0);
    
    const subtotal = serviceTotal - discountTotal;
    const taxRate = settings.styling.salesTaxRate || 0;
    
    return Math.round(subtotal * (taxRate / 100));
  };

  const calculatedTaxAmount = calculateTaxAmount();

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
              </div>
              <div className="text-sm font-normal text-gray-500">
                {format(new Date(processedLead.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
              </div>
            </div>
          </DialogTitle>
          
          {/* Status Dropdown */}
          <div className="flex items-center gap-2 mt-3">
            <Settings className="h-4 w-4 text-gray-500" />
            <Select
              value={processedLead.stage || 'open'}
              onValueChange={handleStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className={`w-32 h-8 border ${getStatusColor(processedLead.stage || 'open')}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open" data-testid="status-open">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Open
                  </div>
                </SelectItem>
                <SelectItem value="booked" data-testid="status-booked">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Booked
                  </div>
                </SelectItem>
                <SelectItem value="completed" data-testid="status-completed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Completed
                  </div>
                </SelectItem>
                <SelectItem value="lost" data-testid="status-lost">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Lost
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogDescription className="mt-2">
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
                          
                          {/* Tax line for single services */}
                          {processedLead.taxAmount && processedLead.taxAmount > 0 && processedLead.totalServices === 1 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 font-medium">Sales Tax:</span>
                                <span className="text-blue-600 font-medium">
                                  +${(processedLead.taxAmount / 100).toLocaleString()}
                                </span>
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
                        
                        {/* Tax line for single services */}
                        {processedLead.taxAmount && processedLead.taxAmount > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-700 font-medium">Sales Tax:</span>
                              <span className="text-blue-600 font-medium">
                                +${(processedLead.taxAmount / 100).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Pricing Summary Section */}
                  <div className="mt-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">Pricing Breakdown:</h5>
                    <div className="space-y-2">
                      
                      {/* Bundle Discount */}
                      {processedLead.bundleDiscountAmount && processedLead.bundleDiscountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700">Bundle Discount (Multiple Services):</span>
                          <span className="font-medium text-green-600">
                            -${(processedLead.bundleDiscountAmount / 100).toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {/* Customer Discounts */}
                      {processedLead.appliedDiscounts && processedLead.appliedDiscounts.length > 0 && processedLead.appliedDiscounts.map((discount, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-green-700">{discount.name} ({discount.percentage}%):</span>
                          <span className="font-medium text-green-600">
                            -${(discount.amount / 100).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      
                      {/* Tax - Always show, calculated from business settings */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-700">
                          {(businessSettings as any)?.styling?.salesTaxLabel || 'Sales Tax'} 
                          {(businessSettings as any)?.styling?.enableSalesTax && (businessSettings as any)?.styling?.salesTaxRate 
                            ? ` (${(businessSettings as any).styling.salesTaxRate}%)` 
                            : ''}:
                        </span>
                        <span className="font-medium text-blue-600">
                          +${(calculatedTaxAmount / 100).toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Total line */}
                      <div className="pt-2 border-t border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Final Total:</span>
                          <span className="text-lg font-bold text-green-600">
                            ${processedLead.calculatedPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>

                {/* Note: Pricing breakdown now shown above in services section */}
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

          {/* Photo Measurements / Images */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Images {!isLoadingMeasurements && `(${photoMeasurements.length})`}
                </CardTitle>
                {!isLoadingMeasurements && photoMeasurements.some((m: any) => m.tags && m.tags.length > 0) && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={selectedTagFilter} onValueChange={setSelectedTagFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Images</SelectItem>
                        {Array.from(new Set(photoMeasurements.flatMap((m: any) => m.tags || []))).map((tag: any) => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
                {isLoadingMeasurements ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading images...</p>
                    </div>
                  </div>
                ) : isMeasurementsError ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center text-red-600">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Failed to load images</p>
                    </div>
                  </div>
                ) : photoMeasurements.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">No images available for this lead</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photoMeasurements
                      .filter((m: any) => selectedTagFilter === "all" || (m.tags && m.tags.includes(selectedTagFilter)))
                      .map((measurement: any) => (
                        <div key={measurement.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                          <div className="aspect-video bg-gray-100 relative">
                            {measurement.customerImageUrls && measurement.customerImageUrls[0] && (
                              <img
                                src={measurement.customerImageUrls[0]}
                                alt="Photo measurement"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {measurement.formulaName || 'Unknown Service'}
                              </Badge>
                              <span className="text-lg font-bold text-blue-600">
                                {measurement.estimatedValue} {measurement.estimatedUnit}
                              </span>
                            </div>
                            {measurement.tags && measurement.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {measurement.tags.map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {measurement.explanation && (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {measurement.explanation}
                              </p>
                            )}
                            {measurement.confidence !== undefined && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span>Confidence:</span>
                                <span className={measurement.confidence >= 80 ? "text-green-600 font-medium" : measurement.confidence >= 60 ? "text-yellow-600 font-medium" : "text-red-600 font-medium"}>
                                  {measurement.confidence}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

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

          {/* Workflow Management - Estimate → Work Order → Invoice */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Workflow Management
                </div>
                {estimates && estimates.length === 0 && (
                  <Button
                    size="sm"
                    onClick={() => setShowCreateEstimateDialog(true)}
                    disabled={createEstimateMutation.isPending}
                    data-testid="button-create-estimate"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Estimate
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {estimates && estimates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No estimates yet. Create an estimate to start the workflow.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {estimates.map((estimate: any) => (
                    <div key={estimate.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">Estimate #{estimate.estimateNumber}</h4>
                          <p className="text-sm text-gray-600">${(estimate.totalAmount / 100).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge 
                            variant="outline"
                            className={
                              estimate.ownerApprovalStatus === 'approved' 
                                ? 'border-green-500 text-green-700' 
                                : estimate.ownerApprovalStatus === 'revision_requested'
                                ? 'border-yellow-500 text-yellow-700'
                                : 'border-gray-500 text-gray-700'
                            }
                          >
                            {estimate.ownerApprovalStatus === 'approved' 
                              ? 'Approved' 
                              : estimate.ownerApprovalStatus === 'revision_requested'
                              ? 'Revision Requested'
                              : 'Pending Review'}
                          </Badge>
                          {estimate.status && (
                            <Badge variant="secondary" className="text-xs">
                              {estimate.status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Owner Notes */}
                      {estimate.ownerNotes && (
                        <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-900">Owner Notes: </span>
                          <span className="text-blue-800">{estimate.ownerNotes}</span>
                        </div>
                      )}

                      {/* Revision Notes */}
                      {estimate.revisionNotes && (
                        <div className="mb-3 p-2 bg-yellow-50 rounded text-sm">
                          <span className="font-medium text-yellow-900">Revision Needed: </span>
                          <span className="text-yellow-800">{estimate.revisionNotes}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {estimate.ownerApprovalStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveEstimateMutation.mutate({ estimateId: estimate.id })}
                              disabled={approveEstimateMutation.isPending}
                              data-testid={`button-approve-estimate-${estimate.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Estimate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEstimateId(estimate.id);
                                setShowRevisionDialog(true);
                              }}
                              data-testid={`button-request-revision-${estimate.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Request Revision
                            </Button>
                          </>
                        )}

                        {estimate.ownerApprovalStatus === 'approved' && estimate.status !== 'accepted' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedEstimateId(estimate.id);
                              setShowScheduleDialog(true);
                            }}
                            disabled={convertToWorkOrderMutation.isPending}
                            data-testid={`button-convert-to-work-order-${estimate.id}`}
                          >
                            <FileCheck className="h-4 w-4 mr-2" />
                            Convert to Work Order
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/estimate/${estimate.estimateNumber}`, '_blank')}
                          data-testid={`button-view-estimate-${estimate.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Estimate
                        </Button>
                      </div>

                      {/* Show associated work order if exists */}
                      {(() => {
                        const workOrder = leadWorkOrders.find((wo: any) => wo.estimateId === estimate.id);
                        if (!workOrder) return null;
                        
                        return (
                          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-medium text-purple-900">Work Order #{workOrder.id}</h5>
                                <p className="text-xs text-purple-700">
                                  Status: {workOrder.status || 'Pending'}
                                </p>
                                {workOrder.scheduledDate && (
                                  <p className="text-xs text-purple-700">
                                    Scheduled: {new Date(workOrder.scheduledDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              {workOrder.status === 'completed' && !workOrder.invoiceId && (
                                <Button
                                  size="sm"
                                  onClick={() => convertToInvoiceMutation.mutate({ workOrderId: workOrder.id })}
                                  disabled={convertToInvoiceMutation.isPending}
                                  data-testid={`button-convert-to-invoice-${workOrder.id}`}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Convert to Invoice
                                </Button>
                              )}
                              {workOrder.invoiceId && (
                                <Badge variant="outline" className="border-green-500 text-green-700">
                                  Invoice Created
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Estimate Dialog */}
        <Dialog open={showCreateEstimateDialog} onOpenChange={setShowCreateEstimateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Estimate</DialogTitle>
              <DialogDescription>
                Create a new estimate for this lead. You can customize the message that will be sent to the customer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="estimate-message">Business Message</Label>
                <Textarea
                  id="estimate-message"
                  placeholder="Thank you for your interest..."
                  value={estimateMessage}
                  onChange={(e) => setEstimateMessage(e.target.value)}
                  rows={4}
                  data-testid="input-estimate-message"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateEstimateDialog(false)}
                disabled={createEstimateMutation.isPending}
                data-testid="button-cancel-create-estimate"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createEstimateMutation.mutate({ businessMessage: estimateMessage })}
                disabled={createEstimateMutation.isPending}
                data-testid="button-submit-create-estimate"
              >
                {createEstimateMutation.isPending ? "Creating..." : "Create Estimate"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Revision Dialog */}
        <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Estimate Revision</DialogTitle>
              <DialogDescription>
                Provide details about what needs to be changed in this estimate.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="revision-notes">Revision Notes</Label>
                <Textarea
                  id="revision-notes"
                  placeholder="Describe what changes are needed..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={4}
                  data-testid="textarea-revision-notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedEstimateId && revisionNotes.trim()) {
                    requestRevisionMutation.mutate({ 
                      estimateId: selectedEstimateId, 
                      revisionNotes 
                    });
                  }
                }}
                disabled={!revisionNotes.trim() || requestRevisionMutation.isPending}
                data-testid="button-submit-revision"
              >
                Submit Revision Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Work Order Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert to Work Order</DialogTitle>
              <DialogDescription>
                Optionally schedule a date for this work order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-date">Scheduled Date (Optional)</Label>
                <Input
                  id="scheduled-date"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  data-testid="input-scheduled-date"
                />
                <p className="text-xs text-gray-500">Leave blank to create without scheduling</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedEstimateId) {
                    convertToWorkOrderMutation.mutate({ 
                      estimateId: selectedEstimateId, 
                      scheduledDate: scheduledDate || undefined 
                    });
                  }
                }}
                disabled={convertToWorkOrderMutation.isPending}
                data-testid="button-submit-work-order"
              >
                Create Work Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}