import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { BusinessSettings } from "@shared/schema";
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
  XCircle,
  Plus,
  X,
  Edit,
  Link,
  Check,
  Tag,
  Ban
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import EditEstimateDialog from "./edit-estimate-dialog";
import { useLocation } from "wouter";
import { useAutomationApproval } from "@/hooks/useAutomationApproval";
import { AutomationConfirmationDialog } from "./AutomationConfirmationDialog";
import WorkOrderNotificationDialog from "./notifications/work-order-notification-dialog";
import SendBidDialog from "./notifications/send-bid-dialog";

interface Lead {
  id: number;
  formulaId?: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
  source?: string;
  calculatedPrice: number;
  variables?: Record<string, any>;
  uploadedImages?: string[];
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
  distanceInfo?: {
    distance: number;
    fee: number;
    message: string;
  };
  totalDistanceFee?: number; // Travel fee in cents
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
  const [copiedEstimateLink, setCopiedEstimateLink] = useState<number | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(null);
  const [showCreateEstimateDialog, setShowCreateEstimateDialog] = useState(false);
  const [estimateMessage, setEstimateMessage] = useState("Thank you for your interest in our services. Please find the detailed estimate below.");
  const [estimateCreationMethod, setEstimateCreationMethod] = useState<'choose' | 'calculator' | 'manual'>('choose');
  const [manualLineItems, setManualLineItems] = useState<Array<{ name: string; description: string; price: number }>>([
    { name: '', description: '', price: 0 }
  ]);
  const [editingEstimate, setEditingEstimate] = useState<any | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedAddress, setEditedAddress] = useState("");
  const [editedHowDidYouHear, setEditedHowDidYouHear] = useState("");
  const [editedSource, setEditedSource] = useState("");
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationWorkOrderData, setNotificationWorkOrderData] = useState<{
    workOrderId: number;
    estimateId: number;
    estimateNumber: string;
  } | null>(null);
  const [showSendBidDialog, setShowSendBidDialog] = useState(false);
  const [confirmedBidEstimate, setConfirmedBidEstimate] = useState<{
    estimateId: number;
    estimateNumber: string;
    totalAmount: number;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const copyEstimateLink = async (estimateNumber: string, estimateId: number) => {
    const url = `${window.location.origin}/estimate/${estimateNumber}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedEstimateLink(estimateId);
      toast({
        title: "Link Copied!",
        description: "The estimate link has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedEstimateLink(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };

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

  // Fetch available tags
  const { data: availableTags = [] } = useQuery<any[]>({
    queryKey: ["/api/lead-tags"],
    enabled: isOpen,
  });

  // Fetch tags assigned to this lead
  const { data: leadTags = [], refetch: refetchLeadTags } = useQuery<any[]>({
    queryKey: [`/api/leads/${lead?.id}/tags?isMultiService=${lead?.type === 'multi'}`],
    enabled: !!lead?.id && isOpen,
  });

  // Assign tag to lead mutation
  const assignTagMutation = useMutation({
    mutationFn: async ({ leadId, tagId, isMultiService }: { leadId: number; tagId: number; isMultiService: boolean }) => {
      return await apiRequest("POST", `/api/leads/${leadId}/tags`, { tagId, isMultiService });
    },
    onSuccess: () => {
      refetchLeadTags();
      queryClient.invalidateQueries({ queryKey: ["/api/leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads?includeTags=true"] });
      toast({
        title: "Tag Added",
        description: "Tag has been added to this lead.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Tag",
        description: error.message || "Could not add tag to lead.",
        variant: "destructive",
      });
    },
  });

  // Remove tag from lead mutation
  const removeTagMutation = useMutation({
    mutationFn: async ({ leadId, tagId, isMultiService }: { leadId: number; tagId: number; isMultiService: boolean }) => {
      return await apiRequest("DELETE", `/api/leads/${leadId}/tags/${tagId}?isMultiService=${isMultiService}`);
    },
    onSuccess: () => {
      refetchLeadTags();
      queryClient.invalidateQueries({ queryKey: ["/api/leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads?includeTags=true"] });
      toast({
        title: "Tag Removed",
        description: "Tag has been removed from this lead.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Remove Tag",
        description: error.message || "Could not remove tag from lead.",
        variant: "destructive",
      });
    },
  });

  // Block IP mutation
  const blockIpMutation = useMutation({
    mutationFn: async ({ ipAddress, reason }: { ipAddress: string; reason?: string }) => {
      return await apiRequest("POST", "/api/blocked-ips", { ipAddress, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-ips"] });
      toast({
        title: "IP Address Blocked",
        description: "This IP address has been blocked from submitting leads.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Block IP",
        description: error.message || "Could not block IP address.",
        variant: "destructive",
      });
    },
  });

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

  // Contact info update mutation
  const updateContactInfoMutation = useMutation({
    mutationFn: async ({ leadId, email, phone, address, howDidYouHear, source, leadType }: { 
      leadId: number; 
      email: string; 
      phone: string; 
      address: string;
      howDidYouHear: string;
      source: string;
      leadType: 'single' | 'multi';
    }) => {
      const endpoint = leadType === 'multi' ? `/api/multi-service-leads/${leadId}` : `/api/leads/${leadId}`;
      return await apiRequest("PATCH", endpoint, { email, phone, address, howDidYouHear, source });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      setIsEditingContact(false);
      toast({
        title: "Contact Info Updated",
        description: "Contact information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update contact information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditContact = () => {
    if (processedLead) {
      setEditedEmail(processedLead.email);
      setEditedPhone(processedLead.phone || "");
      setEditedAddress(processedLead.address || "");
      setEditedHowDidYouHear(processedLead.howDidYouHear || "");
      setEditedSource(processedLead.source || "calculator");
      setIsEditingContact(true);
    }
  };

  const handleSaveContact = () => {
    if (processedLead) {
      updateContactInfoMutation.mutate({
        leadId: processedLead.id,
        email: editedEmail,
        phone: editedPhone,
        address: editedAddress,
        howDidYouHear: editedHowDidYouHear,
        source: editedSource,
        leadType: processedLead.type,
      });
    }
  };

  const handleCancelEditContact = () => {
    setIsEditingContact(false);
    setEditedEmail("");
    setEditedPhone("");
    setEditedAddress("");
    setEditedHowDidYouHear("");
    setEditedSource("");
  };

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!lead) throw new Error("No lead selected");
      
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch(`/api/leads/${lead.id}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Image Uploaded",
        description: "Image has been added to this lead.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    },
  });

  // Image delete mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageIndex: number) => {
      if (!lead) throw new Error("No lead selected");
      
      const res = await fetch(`/api/leads/${lead.id}/images/${imageIndex}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Delete failed');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Image Deleted",
        description: "Image has been removed from this lead.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete image.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  // Workflow mutations
  const { approveMutation: approveEstimateMutation, DialogComponent: AutomationDialog } = useAutomationApproval({
    invalidateQueries: [
      [`/api/leads/${lead?.id}/estimates`],
      ["/api/estimates"]
    ],
  });

  const [confirmBidPendingRunIds, setConfirmBidPendingRunIds] = useState<number[]>([]);
  const [showConfirmBidAutomationDialog, setShowConfirmBidAutomationDialog] = useState(false);

  const confirmBidMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error("No lead selected");
      const res = await apiRequest("POST", `/api/leads/${lead.id}/confirm-bid`, {});
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}/estimates`] });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      
      // Store the confirmed estimate data for sending to customer
      if (data.estimate) {
        setConfirmedBidEstimate({
          estimateId: data.estimate.id,
          estimateNumber: data.estimate.estimateNumber,
          totalAmount: data.estimate.totalAmount,
        });
        setShowSendBidDialog(true);
      }
      
      // Handle pending automation runs if present
      if (data.pendingAutomationRunIds && data.pendingAutomationRunIds.length > 0) {
        setConfirmBidPendingRunIds(data.pendingAutomationRunIds);
        setShowConfirmBidAutomationDialog(true);
      }
    },
    onError: () => {
      toast({
        title: "Confirmation Failed",
        description: "Failed to confirm bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendBidToCustomerMutation = useMutation({
    mutationFn: async ({ estimateId, notifyEmail, notifySms, message }: {
      estimateId: number;
      notifyEmail: boolean;
      notifySms: boolean;
      message: string;
    }) => {
      const response = await fetch(`/api/estimates/${estimateId}/send-to-customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          notifyEmail,
          notifySms,
          message,
        }),
      });

      if (!response.ok && response.status !== 207) {
        throw new Error("Failed to send estimate");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setShowSendBidDialog(false);
      setConfirmedBidEstimate(null);
      
      // Handle partial success (207) or full success (200)
      if (data.errors && data.errors.length > 0) {
        const successChannels = [];
        if (data.emailSent) successChannels.push("email");
        if (data.smsSent) successChannels.push("SMS");
        
        if (successChannels.length > 0) {
          toast({
            title: "Bid Partially Sent",
            description: `Sent via ${successChannels.join(" and ")}, but ${data.errors.join(", ")}`,
          });
        } else {
          toast({
            title: "Failed to Send",
            description: data.errors.join(", "),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Bid Sent to Customer",
          description: "The confirmed bid has been sent to the customer.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Failed to send the bid to the customer. Please try again.",
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
    onSuccess: (workOrder: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}/estimates`] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setShowScheduleDialog(false);
      setScheduledDate("");
      
      // Find the estimate that was converted
      const estimate = estimates.find((est: any) => est.id === selectedEstimateId);
      
      if (estimate && workOrder) {
        // Store work order data and show notification dialog
        setNotificationWorkOrderData({
          workOrderId: workOrder.id,
          estimateId: estimate.id,
          estimateNumber: estimate.estimateNumber,
        });
        setShowNotificationDialog(true);
      } else {
        toast({
          title: "Work Order Created",
          description: "Estimate has been converted to a work order.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Conversion Failed",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ workOrderId, estimateId, notifyEmail, notifySms, message }: {
      workOrderId: number;
      estimateId: number;
      notifyEmail: boolean;
      notifySms: boolean;
      message: string;
    }) => {
      const response = await fetch(`/api/work-orders/${workOrderId}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          estimateId,
          notifyEmail,
          notifySms,
          message,
        }),
      });

      if (!response.ok && response.status !== 207) {
        throw new Error("Failed to send notification");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setShowNotificationDialog(false);
      setNotificationWorkOrderData(null);
      
      // Handle partial success (207) or full success (200)
      if (data.errors && data.errors.length > 0) {
        const successChannels = [];
        if (data.emailSent) successChannels.push("email");
        if (data.smsSent) successChannels.push("SMS");
        
        if (successChannels.length > 0) {
          toast({
            title: "Notification Partially Sent",
            description: `Sent via ${successChannels.join(" and ")}, but ${data.errors.join(", ")}`,
          });
        } else {
          toast({
            title: "Notification Failed",
            description: data.errors.join(", "),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Notification Sent",
          description: "Customer has been notified about the scheduled work order.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Notification Failed",
        description: "Failed to send notification. Please try again.",
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
    mutationFn: async ({ businessMessage, lineItems }: { 
      businessMessage: string; 
      lineItems: Array<{ name: string; description: string; price: number }>;
    }) => {
      if (!lead) throw new Error("No lead selected");
      
      // Manual line items - create estimate directly
      const estimateNumber = `EST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const services = lineItems?.map(item => ({
        name: item.name,
        description: item.description,
        price: Math.round(item.price * 100), // Convert to cents
        category: "Service"
      })) || [];
      
      const subtotal = services.reduce((sum, s) => sum + s.price, 0);
      
      const estimateData: any = {
        leadId: lead.type === 'single' ? lead.id : undefined,
        multiServiceLeadId: lead.type === 'multi' ? lead.id : undefined,
        estimateNumber,
        customerName: lead.name,
        customerEmail: lead.email,
        customerPhone: lead.phone || undefined,
        customerAddress: lead.address || undefined,
        businessMessage: businessMessage || undefined,
        services,
        subtotal,
        totalAmount: subtotal,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };
      
      return await apiRequest("POST", "/api/estimates", estimateData);
    },
    onSuccess: () => {
      if (lead) {
        queryClient.invalidateQueries({ queryKey: ['/api/leads', lead.id, 'estimates'] });
      }
      setShowCreateEstimateDialog(false);
      setEstimateMessage("Thank you for your interest in our services. Please find the detailed estimate below.");
      setEstimateCreationMethod('choose');
      setManualLineItems([{ name: '', description: '', price: 0 }]);
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

  // Get tax amount - prefer stored value, fallback to calculation from business settings
  const calculateTaxAmount = () => {
    // Use stored tax amount if available (shows what was actually calculated at submission time)
    if (processedLead?.taxAmount && processedLead.taxAmount > 0) {
      return processedLead.taxAmount;
    }

    // Fallback: calculate from current business settings
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 border-0 shadow-2xl p-0">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pr-14 rounded-t-2xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold text-xl">
                    {processedLead.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {processedLead.name}
                  </h2>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {format(new Date(processedLead.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <Select
                value={processedLead.stage || 'open'}
                onValueChange={handleStatusChange}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger className="w-32 h-9 bg-white/10 border-white/20 text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
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
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information & Quick Actions */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-600 dark:border-slate-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white dark:text-white">Contact Information</h3>
                </div>
                {!isEditingContact ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditContact}
                    data-testid="button-edit-contact"
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEditContact}
                      data-testid="button-cancel-edit-contact"
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveContact}
                      disabled={!editedEmail || updateContactInfoMutation.isPending}
                      data-testid="button-save-contact"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {updateContactInfoMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                {isEditingContact ? (
                  <>
                    <div>
                      <Label htmlFor="edit-email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        Email *
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="mt-1"
                        data-testid="input-edit-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        Phone
                      </Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="mt-1"
                        data-testid="input-edit-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-address" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        Address
                      </Label>
                      <Textarea
                        id="edit-address"
                        value={editedAddress}
                        onChange={(e) => setEditedAddress(e.target.value)}
                        placeholder="123 Main St, City, State ZIP"
                        rows={2}
                        className="mt-1"
                        data-testid="textarea-edit-address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-howDidYouHear" className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-500" />
                        How did you hear about us?
                      </Label>
                      <Select value={editedHowDidYouHear || ''} onValueChange={setEditedHowDidYouHear}>
                        <SelectTrigger id="edit-howDidYouHear" className="mt-1" data-testid="select-edit-how-did-you-hear">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {((businessSettings as any)?.styling?.howDidYouHearOptions || ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other']).map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-source" className="text-sm font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4 text-amber-500" />
                        Lead Source
                      </Label>
                      <Select value={editedSource} onValueChange={setEditedSource}>
                        <SelectTrigger id="edit-source" className="mt-1" data-testid="select-edit-source">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {((businessSettings as any)?.styling?.leadSourceOptions || ['Calculator', 'Duda', 'Custom Form', 'Manual']).map((option: string) => (
                            <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '_')}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 font-mono">{processedLead.ipAddress}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => blockIpMutation.mutate({
                              ipAddress: processedLead.ipAddress!,
                              reason: "spam"
                            })}
                            disabled={blockIpMutation.isPending}
                            title="Block this IP address"
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {processedLead.howDidYouHear && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">How they heard about us</span>
                        </div>
                        <span className="text-sm text-gray-600">{processedLead.howDidYouHear}</span>
                      </div>
                    )}

                    {processedLead.source && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">Lead Source</span>
                        </div>
                        <Badge variant="secondary">
                          {processedLead.source.charAt(0).toUpperCase() + processedLead.source.slice(1).replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleCall}
                    disabled={!processedLead.phone}
                    className="w-full justify-center bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                    size="sm"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    onClick={handleText}
                    disabled={!processedLead.phone}
                    variant="outline"
                    className="w-full justify-center border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    onClick={handleEmail}
                    variant="outline"
                    className="w-full justify-center border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                    size="sm"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    onClick={handleMaps}
                    disabled={!processedLead.address}
                    variant="outline"
                    className="w-full justify-center border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700"
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
                    className="w-full justify-center border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700 mt-2"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Street View
                  </Button>
                )}
              </div>

              {/* Tags Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </h4>

                {/* Current Tags */}
                <div className="flex flex-wrap gap-2">
                  {leadTags.length > 0 ? (
                    leadTags.map((tag: any) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="flex items-center gap-1 pr-1"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.displayName}
                        <button
                          onClick={() => removeTagMutation.mutate({
                            leadId: processedLead.id,
                            tagId: tag.id,
                            isMultiService: processedLead.type === 'multi'
                          })}
                          className="ml-1 hover:bg-gray-200 rounded p-0.5"
                          disabled={removeTagMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No tags assigned</span>
                  )}
                </div>

                {/* Add Tag Dropdown */}
                {availableTags.length > 0 && (
                  <Select
                    onValueChange={(tagId) => {
                      if (tagId) {
                        assignTagMutation.mutate({
                          leadId: processedLead.id,
                          tagId: parseInt(tagId),
                          isMultiService: processedLead.type === 'multi'
                        });
                      }
                    }}
                    value=""
                  >
                    <SelectTrigger className="w-full" data-testid="select-add-tag">
                      <SelectValue placeholder="Add a tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags
                        .filter((tag: any) => !leadTags.some((lt: any) => lt.id === tag.id))
                        .map((tag: any) => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.displayName}
                            </div>
                          </SelectItem>
                        ))}
                      {availableTags.filter((tag: any) => !leadTags.some((lt: any) => lt.id === tag.id)).length === 0 && (
                        <SelectItem value="none" disabled>
                          All tags assigned
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Pricing Details</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {/* Total Price Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-center shadow-lg shadow-emerald-500/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                  <div className="relative">
                    <div className="text-4xl font-bold text-white">
                      ${processedLead.calculatedPrice.toLocaleString()}
                    </div>
                    <div className="text-emerald-100 text-sm mt-1 font-medium">
                      Total Quote ({processedLead.totalServices} service{processedLead.totalServices > 1 ? 's' : ''})
                    </div>
                  </div>
                </div>

                {/* Detailed Service Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Services Requested & Customer Details:</h4>
                  <div className="space-y-4">
                    {processedLead.type === 'multi' && processedLead.services && processedLead.services.length > 0 ? (
                      // Multi-service layout with detailed breakdown
                      processedLead.services.map((service, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-semibold text-gray-900 dark:text-white">{service.formulaName}</h5>
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
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-semibold text-gray-900 dark:text-white">{processedLead.serviceNames}</h5>
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
                  <div className="mt-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Pricing Breakdown:</h5>
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
                      
                      {/* Travel Fee */}
                      {processedLead.totalDistanceFee && processedLead.totalDistanceFee > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-orange-700">
                            Travel Fee
                            {processedLead.distanceInfo?.distance && (
                              <span className="text-xs text-orange-600 ml-1">
                                ({processedLead.distanceInfo.distance.toFixed(1)} mi)
                              </span>
                            )}:
                          </span>
                          <span className="font-medium text-orange-600">
                            +${(processedLead.totalDistanceFee / 100).toLocaleString()}
                          </span>
                        </div>
                      )}
                      
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
                          <span className="font-semibold text-gray-800 dark:text-white">Final Total:</span>
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
            </div>
          </div>

          {/* Additional Information - Notes */}
          {processedLead.notes && (
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Notes</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-gray-700 p-4 rounded-xl leading-relaxed">
                  {processedLead.notes}
                </p>
              </div>
            </div>
          )}

          {/* Workflow Management - Estimate → Work Order → Invoice */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-xl">
                    <ClipboardCheck className="h-4 w-4 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Workflow Management</h3>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowCreateEstimateDialog(true)}
                  disabled={createEstimateMutation.isPending}
                  data-testid="button-create-estimate"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Estimate
                </Button>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-6">
                {/* Pre-Estimate Section - Pending Estimates or Calculator Completion */}
                {(() => {
                  const pendingEstimates = estimates?.filter((est: any) => est.ownerApprovalStatus === 'pending') || [];
                  const approvedEstimates = estimates?.filter((est: any) => est.ownerApprovalStatus === 'approved') || [];
                  const hasCalculatorData = processedLead.calculatedPrice > 0;
                  const hasBidBeenConfirmed = approvedEstimates.length > 0;
                  
                  // Show pending estimates if they exist, otherwise show calculator data (if no approved estimates)
                  if (pendingEstimates.length > 0) {
                    return (
                      <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/30">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Pre-Estimates (Awaiting Owner Review)</h3>
                          <Badge variant="outline" className="border-blue-500 text-blue-700 ml-auto">
                            {pendingEstimates.length} Pending
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {pendingEstimates.map((estimate: any) => (
                            <div key={estimate.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">Estimate #{estimate.estimateNumber}</h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Created {new Date(estimate.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-green-600">
                                    ${(estimate.totalAmount / 100).toLocaleString()}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Total Amount</p>
                                </div>
                              </div>

                              {/* Services breakdown if available */}
                              {estimate.services && estimate.services.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <h5 className="text-xs font-medium text-gray-600 mb-2">Services Included:</h5>
                                  <div className="space-y-2">
                                    {estimate.services.map((service: any, index: number) => (
                                      <div key={index} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                        <span className="text-gray-700">{service.name || service.description}</span>
                                        <span className="font-medium text-gray-900">
                                          ${((service.price || service.amount) / 100).toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="bg-blue-100 border border-blue-300 rounded p-3 mt-3">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                  <strong>Next Step:</strong> Review and approve this estimate to send to the customer.
                                </p>
                              </div>

                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => approveEstimateMutation.mutate({ estimateId: estimate.id })}
                                  disabled={approveEstimateMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                  data-testid={`button-approve-pre-estimate-${estimate.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve & Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedEstimateId(estimate.id);
                                    setShowRevisionDialog(true);
                                  }}
                                  data-testid={`button-request-revision-pre-${estimate.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Request Revision
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingEstimate(estimate);
                                  }}
                                  data-testid={`button-edit-pre-estimate-${estimate.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else if (hasCalculatorData && !hasBidBeenConfirmed) {
                    return (
                <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Pre-Estimate (Calculator Completion)</h3>
                    <Badge variant="outline" className="border-blue-500 text-blue-700 ml-auto">
                      Awaiting Review
                    </Badge>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {processedLead.type === 'multi' ? 'Multi-Service Quote' : processedLead.serviceNames}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {processedLead.totalServices} service{processedLead.totalServices > 1 ? 's' : ''} calculated
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${processedLead.calculatedPrice.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Total Amount</p>
                      </div>
                    </div>

                    {/* Service Breakdown */}
                    {processedLead.type === 'multi' && processedLead.services && processedLead.services.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Services Included:</h5>
                        <div className="space-y-2">
                          {processedLead.services.map((service, index) => (
                            <div key={index} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                              <span className="text-gray-700 dark:text-gray-200">{service.formulaName}</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                ${(service.calculatedPrice / 100).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discounts Applied */}
                    {processedLead.appliedDiscounts && processedLead.appliedDiscounts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Discounts Applied:</h5>
                        <div className="space-y-1">
                          {processedLead.appliedDiscounts.map((discount, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-green-700">{discount.name} ({discount.percentage}%)</span>
                              <span className="font-medium text-green-600">
                                -${(discount.amount / 100).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-800 rounded p-3 mb-3">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Next Step:</strong> Review this calculator estimate and create a formal estimate to send to the customer.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => confirmBidMutation.mutate()}
                      disabled={confirmBidMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-confirm-bid"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {confirmBidMutation.isPending ? "Confirming..." : "Confirm Bid"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Open manual line items with calculator data pre-filled
                        const services = processedLead.type === 'multi' && processedLead.services 
                          ? processedLead.services 
                          : [{
                              formulaName: processedLead.serviceNames,
                              calculatedPrice: processedLead.calculatedPrice * 100 // Convert to cents
                            }];
                        
                        const lineItems = services.map(service => ({
                          name: service.formulaName,
                          description: '',
                          price: service.calculatedPrice / 100 // Convert cents to dollars
                        }));
                        
                        setManualLineItems(lineItems);
                        setEstimateCreationMethod('manual');
                        setShowCreateEstimateDialog(true);
                      }}
                      data-testid="button-revise-bid"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Revise Bid
                    </Button>
                  </div>
                </div>
                    );
                  } else {
                    return null;
                  }
                })()}

                {/* Formal Estimates Section - Only Approved Estimates */}
                {(() => {
                  const approvedEstimates = estimates?.filter((est: any) => est.ownerApprovalStatus === 'approved') || [];
                  
                  if (approvedEstimates.length > 0) {
                    return (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Formal Estimates (Owner Confirmed)
                    </h3>
                    <div className="space-y-4">
                      {approvedEstimates.map((estimate: any) => (
                    <div key={estimate.id} className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Estimate #{estimate.estimateNumber}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">${(estimate.totalAmount / 100).toLocaleString()}</p>
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

                            {estimate.ownerNotes && (
                              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-sm">
                                <span className="font-medium text-blue-900 dark:text-blue-100">Owner Notes: </span>
                                <span className="text-blue-800 dark:text-blue-200">{estimate.ownerNotes}</span>
                              </div>
                            )}

                            {/* Revision Notes */}
                            {estimate.revisionNotes && (
                              <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-sm">
                                <span className="font-medium text-yellow-900 dark:text-yellow-100">Revision Needed: </span>
                                <span className="text-yellow-800 dark:text-yellow-200">{estimate.revisionNotes}</span>
                              </div>
                            )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {/* Primary Actions */}
                        {(estimate.ownerApprovalStatus === 'pending' || !leadWorkOrders.find((wo: any) => wo.estimateId === estimate.id)) && (
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
                                  Approve
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

                            {!leadWorkOrders.find((wo: any) => wo.estimateId === estimate.id) && (
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700"
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
                          </div>
                        )}

                        {/* Secondary Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingEstimate(estimate);
                            }}
                            data-testid={`button-edit-estimate-${estimate.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/estimate/${estimate.estimateNumber}`, '_blank')}
                            data-testid={`button-view-estimate-${estimate.id}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyEstimateLink(estimate.estimateNumber, estimate.id)}
                            data-testid={`button-copy-estimate-link-${estimate.id}`}
                          >
                            {copiedEstimateLink === estimate.id ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Link className="h-4 w-4 mr-1" />
                                Copy Link
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Show associated work order if exists */}
                      {(() => {
                        const workOrder = leadWorkOrders.find((wo: any) => wo.estimateId === estimate.id);
                        if (!workOrder) return null;
                        
                        return (
                                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0">
                                      <h5 className="font-medium text-purple-900 dark:text-purple-100 truncate">Work Order #{workOrder.id}</h5>
                                      <p className="text-xs text-purple-700 dark:text-purple-300">
                                        Status: {workOrder.status || 'Pending'}
                                      </p>
                                      {workOrder.scheduledDate && (
                                        <p className="text-xs text-purple-700 dark:text-purple-300">
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
                  </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No owner-confirmed estimates yet. Approve a pre-estimate to move it here.</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Photo Measurements / Images */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-xl">
                    <ImageIcon className="h-4 w-4 text-pink-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">
                    Images {!isLoadingMeasurements && `(${photoMeasurements.length + (processedLead.uploadedImages?.length || 0)})`}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="lead-image-upload"
                    disabled={uploadImageMutation.isPending}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-200 dark:border-slate-600"
                    onClick={() => document.getElementById('lead-image-upload')?.click()}
                    disabled={uploadImageMutation.isPending}
                    data-testid="button-upload-image"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {uploadImageMutation.isPending ? "Uploading..." : "Upload Image"}
                  </Button>
                  {!isLoadingMeasurements && photoMeasurements.some((m: any) => m.tags && m.tags.length > 0) && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5">
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
                ) : photoMeasurements.length === 0 && (!processedLead.uploadedImages || processedLead.uploadedImages.length === 0) ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">No images available for this lead. Upload images using the button above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Uploaded Images */}
                    {processedLead.uploadedImages?.map((imageUrl: string, index: number) => (
                      <div key={`uploaded-${index}`} className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm relative group">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative">
                          <img
                            src={imageUrl}
                            alt="Customer uploaded image"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteImageMutation.mutate(index)}
                            disabled={deleteImageMutation.isPending}
                            data-testid={`button-delete-image-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-3">
                          <Badge variant="secondary" className="text-xs">
                            Customer Upload
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {/* Photo Measurements */}
                    {photoMeasurements
                      .filter((m: any) => selectedTagFilter === "all" || (m.tags && m.tags.includes(selectedTagFilter)))
                      .map((measurement: any) => (
                        <div key={measurement.id} className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                          <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative">
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
                                {measurement.formulaName || 'Photo Measurement'}
                              </Badge>
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
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
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
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
            </div>
          </div>

          {/* Map Actions */}
          {processedLead.address && (
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <MapPin className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Location Actions</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                      <span className="font-medium text-slate-700 dark:text-gray-200">Address:</span>
                    </div>
                    <p className="text-slate-600 dark:text-gray-300 mb-4">{processedLead.address}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        onClick={handleMaps}
                        className="w-full justify-center bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Open in Google Maps
                      </Button>
                      <Button
                        onClick={handleStreetView}
                        variant="outline"
                        className="w-full justify-center border-slate-200 dark:border-slate-600"
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
              </div>
            </div>
          )}
        </div>

        {/* Create Estimate Dialog */}
        <Dialog open={showCreateEstimateDialog} onOpenChange={(open) => {
          setShowCreateEstimateDialog(open);
          if (!open) {
            setEstimateCreationMethod('choose');
            setManualLineItems([{ name: '', description: '', price: 0 }]);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Estimate</DialogTitle>
              <DialogDescription>
                {estimateCreationMethod === 'choose' && "Choose how you want to create this estimate"}
                {estimateCreationMethod === 'calculator' && "Create estimate from calculator data"}
                {estimateCreationMethod === 'manual' && "Create estimate with custom line items"}
              </DialogDescription>
            </DialogHeader>

            {/* Step 1: Choose Method */}
            {estimateCreationMethod === 'choose' && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      if (!lead) return;
                      
                      // Build query params for call screen
                      const params = new URLSearchParams({
                        leadId: lead.id.toString(),
                        prefillName: lead.name,
                        prefillEmail: lead.email,
                        ...(lead.phone && { prefillPhone: lead.phone }),
                        ...(lead.address && { prefillAddress: lead.address }),
                      });
                      
                      // Navigate to call screen
                      setLocation(`/call-screen?${params.toString()}`);
                      
                      // Close the dialog
                      setShowCreateEstimateDialog(false);
                      onClose();
                    }}
                    data-testid="option-calculator-estimate"
                  >
                    <CardContent className="p-6 text-center">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold mb-2">From Calculator</h3>
                      <p className="text-sm text-gray-600">
                        Calculate a new price using the call screen calculator
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setEstimateCreationMethod('manual')}
                    data-testid="option-manual-estimate"
                  >
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold mb-2">Manual Line Items</h3>
                      <p className="text-sm text-gray-600">
                        Create custom line items with your own pricing
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Manual Line Items Method */}
            {estimateCreationMethod === 'manual' && (
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <Label>Line Items</Label>
                  {manualLineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start border p-3 rounded">
                      <div className="col-span-4">
                        <Input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...manualLineItems];
                            newItems[index].name = e.target.value;
                            setManualLineItems(newItems);
                          }}
                          data-testid={`input-line-item-name-${index}`}
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...manualLineItems];
                            newItems[index].description = e.target.value;
                            setManualLineItems(newItems);
                          }}
                          data-testid={`input-line-item-description-${index}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.price === 0 ? '' : item.price}
                          onChange={(e) => {
                            const newItems = [...manualLineItems];
                            newItems[index].price = parseFloat(e.target.value) || 0;
                            setManualLineItems(newItems);
                          }}
                          data-testid={`input-line-item-price-${index}`}
                        />
                      </div>
                      <div className="col-span-1">
                        {manualLineItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newItems = manualLineItems.filter((_, i) => i !== index);
                              setManualLineItems(newItems);
                            }}
                            data-testid={`button-remove-line-item-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManualLineItems([...manualLineItems, { name: '', description: '', price: 0 }])}
                    data-testid="button-add-line-item"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-semibold">
                    Total: ${manualLineItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimate-message-manual">Business Message</Label>
                  <Textarea
                    id="estimate-message-manual"
                    placeholder="Thank you for your interest..."
                    value={estimateMessage}
                    onChange={(e) => setEstimateMessage(e.target.value)}
                    rows={3}
                    data-testid="input-estimate-message-manual"
                  />
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-between gap-2">
              {estimateCreationMethod !== 'choose' && (
                <Button
                  variant="outline"
                  onClick={() => setEstimateCreationMethod('choose')}
                  disabled={createEstimateMutation.isPending}
                  data-testid="button-back"
                >
                  Back
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateEstimateDialog(false)}
                  disabled={createEstimateMutation.isPending}
                  data-testid="button-cancel-create-estimate"
                >
                  Cancel
                </Button>
                {estimateCreationMethod === 'manual' && (
                  <Button
                    onClick={() => {
                      const isValid = manualLineItems.length > 0 && manualLineItems.every(item => item.name && item.price > 0);
                      
                      if (!isValid) {
                        toast({
                          title: "Validation Error",
                          description: "Please fill in all line items with name and price",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      createEstimateMutation.mutate({ 
                        businessMessage: estimateMessage,
                        lineItems: manualLineItems
                      });
                    }}
                    disabled={createEstimateMutation.isPending}
                    data-testid="button-submit-create-estimate"
                  >
                    {createEstimateMutation.isPending ? "Creating..." : "Create Estimate"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Estimate Dialog */}
        <EditEstimateDialog
          estimate={editingEstimate}
          open={!!editingEstimate}
          onOpenChange={(open) => {
            if (!open) {
              setEditingEstimate(null);
            }
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead?.id}/estimates`] });
          }}
        />

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

        <AutomationDialog />
        
        <AutomationConfirmationDialog
          isOpen={showConfirmBidAutomationDialog}
          onClose={() => {
            setShowConfirmBidAutomationDialog(false);
            setConfirmBidPendingRunIds([]);
          }}
          pendingRunIds={confirmBidPendingRunIds}
          onConfirmed={() => {
            toast({
              title: "Bid Confirmed",
              description: "Calculator estimate has been converted to an approved estimate and automations have been sent.",
            });
          }}
        />

        {/* Work Order Notification Dialog */}
        {notificationWorkOrderData && lead && (
          <WorkOrderNotificationDialog
            isOpen={showNotificationDialog}
            onClose={() => {
              setShowNotificationDialog(false);
              setNotificationWorkOrderData(null);
              toast({
                title: "Work Order Created",
                description: "Work order has been created successfully.",
              });
            }}
            onSend={async (data) => {
              if (!notificationWorkOrderData) return;
              await sendNotificationMutation.mutateAsync({
                workOrderId: notificationWorkOrderData.workOrderId,
                estimateId: notificationWorkOrderData.estimateId,
                ...data,
              });
            }}
            customerName={lead.name}
            customerEmail={lead.email}
            customerPhone={lead.phone}
            estimateLink={`${window.location.origin}/estimate/${notificationWorkOrderData.estimateNumber}`}
            defaultMessage={`Hi ${lead.name},\n\nGreat news! Your service has been scheduled. We're looking forward to working with you.\n\nYou can view all the details and your estimate using the link below.`}
            isPending={sendNotificationMutation.isPending}
          />
        )}

        {/* Send Confirmed Bid Dialog */}
        {confirmedBidEstimate && lead && (
          <SendBidDialog
            isOpen={showSendBidDialog}
            onClose={() => {
              setShowSendBidDialog(false);
              setConfirmedBidEstimate(null);
              toast({
                title: "Bid Confirmed",
                description: "Your bid has been confirmed successfully.",
              });
            }}
            onSend={async (data) => {
              if (!confirmedBidEstimate) return;
              await sendBidToCustomerMutation.mutateAsync({
                estimateId: confirmedBidEstimate.estimateId,
                ...data,
              });
            }}
            customerName={lead.name}
            customerEmail={lead.email}
            customerPhone={lead.phone}
            estimateLink={`${window.location.origin}/estimate/${confirmedBidEstimate.estimateNumber}`}
            totalAmount={confirmedBidEstimate.totalAmount}
            defaultMessage={`Hi ${lead.name},\n\nThank you for your interest in our services! We've prepared an estimate for you.\n\nYour total: $${(confirmedBidEstimate.totalAmount / 100).toLocaleString()}\n\nPlease review the details using the link below. Feel free to reach out if you have any questions!`}
            isPending={sendBidToCustomerMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}