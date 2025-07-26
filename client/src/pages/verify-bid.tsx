import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, MessageSquare, DollarSign, MapPin, Mail, Phone, Calendar, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BidRequest } from "@shared/schema";
import AppHeader from "@/components/app-header";

export default function VerifyBidPage() {
  const { id } = useParams();
  const token = new URLSearchParams(window.location.search).get("token");
  const { toast } = useToast();

  const [bidRequest, setBidRequest] = useState<BidRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number | undefined>();
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [pdfText, setPdfText] = useState("");

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
      setFinalPrice(data.finalPrice || data.autoPrice);
      setEmailSubject(data.emailSubject || `Your estimate is ready - ${data.customerName}`);
      setEmailBody(data.emailBody || `Dear ${data.customerName},\n\nThank you for your interest in our services. Please find your detailed estimate attached.\n\nBest regards,\nYour Service Team`);
      setPdfText(data.pdfText || `Service estimate for ${data.customerName}`);
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
        finalPrice: finalPrice || bidRequest.autoPrice,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AppHeader />
      <div className="max-w-6xl mx-auto p-4 space-y-6">
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
                <p className="text-2xl font-bold text-green-600">${bidRequest.autoPrice.toLocaleString()}</p>
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
                        <span className="text-green-600 font-medium">${service.calculatedPrice.toLocaleString()}</span>
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
                Approve & Send
              </Button>
              
              <Button
                onClick={() => handleVerifyAction("revised")}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}