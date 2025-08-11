import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, Upload, FileText, Video, Settings, Palette } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Proposal, InsertProposal } from "@shared/schema";

interface ProposalFormData {
  title: string;
  subtitle: string;
  headerText: string;
  videoUrl: string;
  customText: string;
  termsAndConditionsPdfUrl: string;
  insurancePdfUrl: string;
  showCompanyLogo: boolean;
  showServiceBreakdown: boolean;
  showDiscounts: boolean;
  showUpsells: boolean;
  showTotal: boolean;
  enableAcceptReject: boolean;
  acceptButtonText: string;
  rejectButtonText: string;
  styling: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    fontFamily: string;
  };
}

const defaultFormData: ProposalFormData = {
  title: "Service Proposal",
  subtitle: "",
  headerText: "",
  videoUrl: "",
  customText: "",
  termsAndConditionsPdfUrl: "",
  insurancePdfUrl: "",
  showCompanyLogo: true,
  showServiceBreakdown: true,
  showDiscounts: true,
  showUpsells: true,
  showTotal: true,
  enableAcceptReject: true,
  acceptButtonText: "Accept Proposal",
  rejectButtonText: "Decline Proposal",
  styling: {
    primaryColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    borderRadius: 12,
    fontFamily: "inter"
  }
};

export default function ProposalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ProposalFormData>(defaultFormData);

  // Fetch existing proposal
  const { data: proposal, isLoading } = useQuery({
    queryKey: ["/api/proposals"],
    retry: false,
  });

  // Create/Update proposal mutation
  const saveProposalMutation = useMutation({
    mutationFn: async (data: ProposalFormData) => {
      if (proposal?.id) {
        // Update existing proposal
        return await apiRequest(`/api/proposals/${proposal.id}`, {
          method: "PATCH",
          body: JSON.stringify(data)
        });
      } else {
        // Create new proposal
        return await apiRequest("/api/proposals", {
          method: "POST", 
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your proposal settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save proposal settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load proposal data when fetched
  useEffect(() => {
    if (proposal) {
      setFormData({
        title: proposal.title || "Service Proposal",
        subtitle: proposal.subtitle || "",
        headerText: proposal.headerText || "",
        videoUrl: proposal.videoUrl || "",
        customText: proposal.customText || "",
        termsAndConditionsPdfUrl: proposal.termsAndConditionsPdfUrl || "",
        insurancePdfUrl: proposal.insurancePdfUrl || "",
        showCompanyLogo: proposal.showCompanyLogo ?? true,
        showServiceBreakdown: proposal.showServiceBreakdown ?? true,
        showDiscounts: proposal.showDiscounts ?? true,
        showUpsells: proposal.showUpsells ?? true,
        showTotal: proposal.showTotal ?? true,
        enableAcceptReject: proposal.enableAcceptReject ?? true,
        acceptButtonText: proposal.acceptButtonText || "Accept Proposal",
        rejectButtonText: proposal.rejectButtonText || "Decline Proposal",
        styling: proposal.styling || defaultFormData.styling
      });
    }
  }, [proposal]);

  const handleSave = () => {
    saveProposalMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ProposalFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStylingChange = (field: keyof ProposalFormData['styling'], value: any) => {
    setFormData(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposal Templates</h1>
          <p className="text-gray-600 mt-1">
            Customize how your proposals appear to customers after they complete your forms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveProposalMutation.isPending}
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveProposalMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="media">
            <Video className="w-4 h-4 mr-2" />
            Media & Files
          </TabsTrigger>
          <TabsTrigger value="display">
            <Settings className="w-4 h-4 mr-2" />
            Display Options
          </TabsTrigger>
          <TabsTrigger value="styling">
            <Palette className="w-4 h-4 mr-2" />
            Styling
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Content</CardTitle>
              <CardDescription>
                Customize the text content and messaging for your proposals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Proposal Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Service Proposal"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    placeholder="Professional services for your project"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="headerText">Header Message</Label>
                <Textarea
                  id="headerText"
                  value={formData.headerText}
                  onChange={(e) => handleInputChange('headerText', e.target.value)}
                  placeholder="Thank you for your interest! Here's your customized proposal..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="customText">Custom Description</Label>
                <Textarea
                  id="customText"
                  value={formData.customText}
                  onChange={(e) => handleInputChange('customText', e.target.value)}
                  placeholder="Add additional details about your services, company, or this specific proposal..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="acceptButtonText">Accept Button Text</Label>
                  <Input
                    id="acceptButtonText"
                    value={formData.acceptButtonText}
                    onChange={(e) => handleInputChange('acceptButtonText', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rejectButtonText">Decline Button Text</Label>
                  <Input
                    id="rejectButtonText"
                    value={formData.rejectButtonText}
                    onChange={(e) => handleInputChange('rejectButtonText', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media & Files Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video & Documents</CardTitle>
              <CardDescription>
                Add videos and PDF documents to enhance your proposals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="videoUrl">Proposal Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  placeholder="https://www.youtube.com/embed/your-video-id"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Add a YouTube, Vimeo, or other video to explain your services
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Document Uploads</h4>
                
                <div>
                  <Label htmlFor="termsAndConditionsPdfUrl">Terms & Conditions PDF</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="termsAndConditionsPdfUrl"
                      value={formData.termsAndConditionsPdfUrl}
                      onChange={(e) => handleInputChange('termsAndConditionsPdfUrl', e.target.value)}
                      placeholder="https://example.com/terms.pdf"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="insurancePdfUrl">Insurance Certificate PDF</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="insurancePdfUrl"
                      value={formData.insurancePdfUrl}
                      onChange={(e) => handleInputChange('insurancePdfUrl', e.target.value)}
                      placeholder="https://example.com/insurance.pdf"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Options Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Control what information appears in your proposals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Company Logo</Label>
                    <p className="text-sm text-gray-500">Show your business logo in proposals</p>
                  </div>
                  <Switch
                    checked={formData.showCompanyLogo}
                    onCheckedChange={(value) => handleInputChange('showCompanyLogo', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Service Breakdown</Label>
                    <p className="text-sm text-gray-500">Display detailed list of selected services</p>
                  </div>
                  <Switch
                    checked={formData.showServiceBreakdown}
                    onCheckedChange={(value) => handleInputChange('showServiceBreakdown', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Discounts</Label>
                    <p className="text-sm text-gray-500">Show applied discounts and savings</p>
                  </div>
                  <Switch
                    checked={formData.showDiscounts}
                    onCheckedChange={(value) => handleInputChange('showDiscounts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Upsell Items</Label>
                    <p className="text-sm text-gray-500">Display selected add-ons and upgrades</p>
                  </div>
                  <Switch
                    checked={formData.showUpsells}
                    onCheckedChange={(value) => handleInputChange('showUpsells', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Total Price</Label>
                    <p className="text-sm text-gray-500">Show final project total</p>
                  </div>
                  <Switch
                    checked={formData.showTotal}
                    onCheckedChange={(value) => handleInputChange('showTotal', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Accept/Reject Buttons</Label>
                    <p className="text-sm text-gray-500">Allow customers to accept or decline proposals</p>
                  </div>
                  <Switch
                    checked={formData.enableAcceptReject}
                    onCheckedChange={(value) => handleInputChange('enableAcceptReject', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Styling Tab */}
        <TabsContent value="styling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Styling</CardTitle>
              <CardDescription>
                Customize the appearance and branding of your proposals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.styling.primaryColor}
                      onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={formData.styling.primaryColor}
                      onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                      placeholder="#2563EB"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.styling.backgroundColor}
                      onChange={(e) => handleStylingChange('backgroundColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={formData.styling.backgroundColor}
                      onChange={(e) => handleStylingChange('backgroundColor', e.target.value)}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.styling.textColor}
                      onChange={(e) => handleStylingChange('textColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={formData.styling.textColor}
                      onChange={(e) => handleStylingChange('textColor', e.target.value)}
                      placeholder="#1F2937"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="borderRadius">Border Radius (px)</Label>
                  <Input
                    id="borderRadius"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.styling.borderRadius}
                    onChange={(e) => handleStylingChange('borderRadius', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={formData.styling.fontFamily}
                  onValueChange={(value) => handleStylingChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="open-sans">Open Sans</SelectItem>
                    <SelectItem value="lato">Lato</SelectItem>
                    <SelectItem value="montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (Fixed Bottom) */}
      <div className="sticky bottom-4 flex justify-center pt-6">
        <Button 
          onClick={handleSave}
          disabled={saveProposalMutation.isPending}
          size="lg"
          className="shadow-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveProposalMutation.isPending ? "Saving Changes..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}