import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, MessageSquare, DollarSign, MapPin, Mail, Phone, Calendar, ExternalLink, Edit3, X, Plus, Send, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BidRequest } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";

export default function VerifyBidPage() {
  const { id } = useParams();
  const token = new URLSearchParams(window.location.search).get("token");
  const { toast } = useToast();

  // Format price from cents to dollars
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const [bidRequest, setBidRequest] = useState<BidRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number | undefined>();
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [pdfText, setPdfText] = useState("");
  
  // Revision dialog state
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionLineItems, setRevisionLineItems] = useState<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>([]);
  const [revisionDescription, setRevisionDescription] = useState("");

  useEffect(() => {
    if (id) {
      fetchBidRequest();
    }
  }, [id, token]);

  const fetchBidRequest = async () => {
    try {
      setLoading(true);
      const url = token ? `/api/bids/${id}?token=${token}` : `/api/bids/${id}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      
      setBidRequest(data);
      setFinalPrice((data.finalPrice || data.autoPrice) / 100); // Convert cents to dollars for input
      setEmailSubject(data.emailSubject || `Your estimate is ready - ${data.customerName}`);
      setEmailBody(data.emailBody || `Dear ${data.customerName},\n\nThank you for your interest in our services. Please find your detailed estimate attached.\n\nBest regards,\nYour Service Team`);
      setPdfText(data.pdfText || `Service estimate for ${data.customerName}`);
      
      // Initialize revision line items - break down services properly
      let initialLineItems = [];
      
      console.log('Bid request data for pricing:', data); // Debug log
      
      if (data.services && Array.isArray(data.services) && data.services.length > 0) {
        // Multi-service lead - create line items for each service
        initialLineItems = data.services.map((service: any, index: number) => {
          // Use individual service price if available, otherwise divide total evenly
          let individualPrice = 0;
          
          if (typeof service.calculatedPrice === 'number') {
            individualPrice = service.calculatedPrice / 100; // Convert cents to dollars
          } else if (typeof service.price === 'number') {
            individualPrice = service.price / 100; // Convert cents to dollars
          } else if (data.autoPrice && data.services.length > 0) {
            individualPrice = (data.autoPrice / data.services.length) / 100; // Convert cents to dollars
          }
          
          return {
            id: `service_${index}`,
            description: service.formulaName || service.name || service.serviceName || service.title || `Service ${index + 1}`,
            quantity: 1,
            unitPrice: individualPrice,
            total: individualPrice
          };
        });
      } else if (data.leadData && typeof data.leadData === 'object') {
        // Single service lead from leadData
        const serviceName = data.leadData.serviceName || data.leadData.service || 'Service';
        initialLineItems = [{
          id: 'main_service',
          description: serviceName,
          quantity: 1,
          unitPrice: (data.autoPrice || 0) / 100, // Convert cents to dollars
          total: (data.autoPrice || 0) / 100 // Convert cents to dollars
        }];
      } else {
        // Fallback - single line item
        initialLineItems = [{
          id: 'main_service',
          description: data.serviceName || 'Service',
          quantity: 1,
          unitPrice: (data.autoPrice || 0) / 100, // Convert cents to dollars
          total: (data.autoPrice || 0) / 100 // Convert cents to dollars
        }];
      }
      
      setRevisionLineItems(initialLineItems);
    } catch (error) {
      console.error("Error fetching bid request:", error);
      toast({
        title: "Error",
        description: "Failed to load bid request. Please check the link and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAction = async (status: "approved" | "revised" | "need_more_info") => {
    if (!bidRequest) return;
    
    try {
      setSubmitting(true);
      
      const updateData = {
        bidStatus: status,
        finalPrice: Math.round((finalPrice || (bidRequest.autoPrice / 100)) * 100), // Convert dollars to cents
        emailSubject,
        emailBody,
        pdfText
      };

      const response = await apiRequest("POST", `/api/bids/${bidRequest.id}/verify`, updateData);
      const updatedBidRequest = await response.json();
      
      setBidRequest(updatedBidRequest);
      
      toast({
        title: "Success",
        description: `Bid has been ${status === "approved" ? "approved" : status === "revised" ? "revised" : "marked for more information"}.`,
      });
    } catch (error) {
      console.error("Error updating bid:", error);
      toast({
        title: "Error",
        description: "Failed to update bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevisionClick = () => {
    setShowRevisionDialog(true);
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setRevisionLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const addLineItem = () => {
    const newId = String(revisionLineItems.length);
    setRevisionLineItems(prev => [...prev, {
      id: newId,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const removeLineItem = (id: string) => {
    setRevisionLineItems(prev => prev.filter(item => item.id !== id));
  };

  const getTotalRevisionPrice = () => {
    return revisionLineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleRevisionSubmit = async () => {
    try {
      setSubmitting(true);
      
      const revisedPrice = getTotalRevisionPrice();
      setFinalPrice(revisedPrice);
      
      const updateData = {
        bidStatus: "revised",
        finalPrice: Math.round(revisedPrice * 100), // Convert dollars to cents
        emailSubject,
        emailBody,
        pdfText,
        revisionLineItems,
        revisionDescription
      };

      const response = await apiRequest("POST", `/api/bids/${bidRequest?.id}/verify`, updateData);
      const updatedBidRequest = await response.json();
      
      setBidRequest(updatedBidRequest);
      setShowRevisionDialog(false);
      
      toast({
        title: "Success",
        description: "Price revision has been saved and updated.",
      });
    } catch (error) {
      console.error("Error updating revision:", error);
      toast({
        title: "Error",
        description: "Failed to save price revision. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToCustomer = async () => {
    if (!bidRequest) return;
    
    try {
      setSubmitting(true);
      
      // Update the bid request with current email content
      const updateData = {
        bidStatus: "sent_to_customer",
        finalPrice: finalPrice || bidRequest.autoPrice,
        emailSubject,
        emailBody,
        pdfText
      };

      const response = await apiRequest("POST", `/api/bids/${bidRequest.id}/send-to-customer`, updateData);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send to customer');
      }
      
      setBidRequest(result.bidRequest);
      
      toast({
        title: "Sent to Customer",
        description: `Quote has been sent to ${bidRequest.customerEmail}. They can now approve, decline, or request changes.`,
      });
    } catch (error: any) {
      console.error("Error sending to customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send quote to customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bid request...</p>
        </div>
      </div>
    );
  }

  if (!bidRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Bid Request Not Found</h2>
            <p className="text-muted-foreground">
              The bid request could not be found or the link may have expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "revised":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Revised</Badge>;
      case "need_more_info":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">More Info Needed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Bid Verification</CardTitle>
                <p className="text-muted-foreground mt-1">Review and verify the customer estimate</p>
              </div>
              {getStatusBadge(bidRequest.bidStatus)}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="font-medium">{bidRequest.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{bidRequest.customerEmail}</p>
                    <a href={`mailto:${bidRequest.customerEmail}`} className="text-primary hover:text-primary/80">
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              
              {bidRequest.customerPhone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{bidRequest.customerPhone}</p>
                    <a href={`tel:${bidRequest.customerPhone}`} className="text-primary hover:text-primary/80">
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {bidRequest.address && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{bidRequest.address}</p>
                    {bidRequest.streetViewUrl && (
                      <a href={bidRequest.streetViewUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Submitted</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{new Date(bidRequest.createdAt).toLocaleDateString()}</p>
                </div>
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
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Original Calculated Price</Label>
                <p className="text-2xl font-bold text-green-600">{formatPrice(bidRequest.autoPrice)}</p>
              </div>
              
              <div>
                <Label htmlFor="finalPrice">Final Price</Label>
                <Input
                  id="finalPrice"
                  type="number"
                  value={finalPrice || ""}
                  onChange={(e) => setFinalPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Enter final price"
                />
              </div>

              {bidRequest.services && bidRequest.services.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Services Requested</Label>
                  <div className="space-y-2 mt-2">
                    {bidRequest.services.map((service, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="font-medium">{service.formulaName}</span>
                        <span className="text-green-600 font-medium">{formatPrice(service.calculatedPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email Customization */}
        <Card>
          <CardHeader>
            <CardTitle>Email Customization</CardTitle>
            <p className="text-sm text-muted-foreground">Customize the email that will be sent to the customer</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emailSubject">Email Subject</Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject line"
              />
            </div>
            
            <div>
              <Label htmlFor="emailBody">Email Body</Label>
              <Textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email message to customer"
                rows={6}
              />
            </div>
            
            <div>
              <Label htmlFor="pdfText">PDF Description</Label>
              <Input
                id="pdfText"
                value={pdfText}
                onChange={(e) => setPdfText(e.target.value)}
                placeholder="Description for PDF document"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleVerifyAction("approved")}
                disabled={submitting || bidRequest.bidStatus === "approved"}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              
              <Button
                onClick={handleRevisionClick}
                disabled={submitting}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Revise Price
              </Button>
              
              <Button
                onClick={() => handleVerifyAction("need_more_info")}
                disabled={submitting}
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-50"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Request More Info
              </Button>
              
              <Button
                onClick={handleSendToCustomer}
                disabled={submitting}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Customer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Price Revision Dialog */}
        <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Revise Price Estimate
              </DialogTitle>
              <DialogDescription>
                Edit line items, quantities, and pricing for this estimate. You can add or remove items and provide revision notes.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Line Items</Label>
                  <Button onClick={addLineItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {revisionLineItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg">
                      <div className="col-span-5">
                        <Label className="text-xs text-gray-500">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Service description"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.1"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">Unit Price</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">Total</Label>
                        <div className="mt-1 px-3 py-2 bg-gray-50 rounded border text-sm font-medium">
                          ${item.total.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {revisionLineItems.length > 1 && (
                          <Button
                            onClick={() => removeLineItem(item.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Estimate</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${getTotalRevisionPrice().toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Revision Description */}
              <div>
                <Label className="text-base font-semibold">Revision Notes</Label>
                <Textarea
                  value={revisionDescription}
                  onChange={(e) => setRevisionDescription(e.target.value)}
                  placeholder="Explain the changes made to the original estimate..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRevisionDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevisionSubmit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? "Saving..." : "Save Revision"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}