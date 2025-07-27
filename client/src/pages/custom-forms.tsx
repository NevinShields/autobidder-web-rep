import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// import { nanoid } from "nanoid";
import { Plus, FileText, Settings, Eye, Copy, ExternalLink, Edit, Trash2, MoreVertical, Globe, Users, Target } from "lucide-react";
import type { CustomForm, InsertCustomForm, Formula, StylingOptions, CustomFormSettings } from "@shared/schema";

// Default styling for new custom forms
const defaultStyling: Partial<StylingOptions> = {
  containerWidth: 600,
  containerHeight: 800,
  containerBorderRadius: 12,
  containerShadow: 'lg',
  containerBorderWidth: 1,
  containerBorderColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
  fontFamily: 'inter',
  fontSize: 'base',
  fontWeight: 'normal',
  textColor: '#374151',
  primaryColor: '#1976D2',
  buttonStyle: 'rounded',
  buttonBorderRadius: 8,
  buttonPadding: 'md',
  buttonFontWeight: 'medium',
  buttonShadow: 'sm',
  inputBorderRadius: 6,
  inputBorderWidth: 1,
  inputBorderColor: '#D1D5DB',
  inputFocusColor: '#3B82F6',
  inputPadding: 'md',
  inputBackgroundColor: '#FFFFFF',
  showPriceBreakdown: true,
  includeLedCapture: true,
};

// Default form settings for new custom forms
const defaultFormSettings: Partial<CustomFormSettings> = {
  requireContactFirst: false,
  showProgressGuide: true,
  showBundleDiscount: false,
  bundleDiscountPercent: 10,
  bundleMinServices: 2,
  enableSalesTax: false,
  salesTaxRate: 8.25,
  salesTaxLabel: "Sales Tax",
  leadCaptureMessage: "Get your custom quote today! We'll contact you within 24 hours.",
  thankYouMessage: "Thank you for your interest! We'll review your requirements and contact you soon.",
  contactEmail: "info@example.com",
  businessDescription: "Professional services with competitive pricing and quality guarantee.",
  requireName: true,
  requireEmail: true,
  requirePhone: false,
  enablePhone: true,
  enableAddress: false,
  requireAddress: false,
  enableNotes: false,
  enableHowDidYouHear: false,
  requireHowDidYouHear: false,
  howDidYouHearOptions: ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other'],
  nameLabel: 'Full Name',
  emailLabel: 'Email Address',
  phoneLabel: 'Phone Number',
  addressLabel: 'Address',
  notesLabel: 'Additional Notes',
  howDidYouHearLabel: 'How did you hear about us?',
};

export default function CustomForms() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch custom forms
  const { data: customForms = [], isLoading: formsLoading } = useQuery<CustomForm[]>({
    queryKey: ["/api/custom-forms"],
  });

  // Fetch available formulas/services
  const { data: formulas = [], isLoading: formulasLoading } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
  });

  // Create custom form mutation
  const createFormMutation = useMutation({
    mutationFn: async (formData: InsertCustomForm) => {
      console.log("Creating form with data:", formData);
      return apiRequest("POST", "/api/custom-forms", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-forms"] });
      setIsCreateDialogOpen(false);
      setFormName("");
      setFormDescription("");
      setSelectedServices([]);
      toast({
        title: "Custom form created successfully",
        description: "Your new form is ready to configure and embed.",
      });
    },
    onError: (error) => {
      console.error("Custom form creation error:", error);
      toast({
        title: "Failed to create custom form",
        description: `Error: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Delete custom form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/custom-forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-forms"] });
      toast({
        title: "Custom form deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete custom form",
        variant: "destructive",
      });
    },
  });

  const handleCreateForm = async () => {
    if (!formName.trim()) {
      toast({
        title: "Please enter a form name",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Please select at least one service",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = {
        name: formName.trim(),
        description: formDescription.trim(),
        embedId: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isActive: true,
        selectedServices,
        styling: {},
        formSettings: {},
      };

      console.log("About to create form with data:", formData);
      createFormMutation.mutate(formData as any);
    } catch (error) {
      console.error("Error in handleCreateForm:", error);
      toast({
        title: "Failed to create form",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const copyEmbedUrl = (embedId: string) => {
    const embedUrl = user?.id ? `${window.location.origin}/custom-form/${embedId}?userId=${user.id}` : `${window.location.origin}/custom-form/${embedId}`;
    navigator.clipboard.writeText(embedUrl);
    toast({
      title: "Embed URL copied to clipboard",
    });
  };

  if (formsLoading || formulasLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div>Loading custom forms...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile-First Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Custom Forms</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Create multiple independent forms with different services and designs</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full sm:w-auto shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Create New Form
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Custom Form</DialogTitle>
                <DialogDescription>
                  Create a new custom form with specific services for testing on different landing pages.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="form-name">Form Name</Label>
                  <Input
                    id="form-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Landing Page Form"
                  />
                </div>
                
                <div>
                  <Label htmlFor="form-description">Description (Optional)</Label>
                  <Textarea
                    id="form-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of this form's purpose"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Select Services</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {formulas.map((formula) => (
                      <div key={formula.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`service-${formula.id}`}
                          checked={selectedServices.includes(formula.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices(prev => [...prev, formula.id]);
                            } else {
                              setSelectedServices(prev => prev.filter(id => id !== formula.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`service-${formula.id}`} className="text-sm font-medium">
                          {formula.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedServices.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateForm} disabled={createFormMutation.isPending}>
                    {createFormMutation.isPending ? "Creating..." : "Create Form"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Forms</p>
                  <p className="text-3xl font-bold text-blue-900">{customForms.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Active Forms</p>
                  <p className="text-3xl font-bold text-green-900">
                    {customForms.filter((form) => form.isActive).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Leads</p>
                  <p className="text-3xl font-bold text-purple-900">0</p>
                  <p className="text-xs text-purple-600">From custom forms</p>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms Grid */}
        {customForms.length === 0 ? (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No custom forms yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first custom form to test different designs and service combinations on various landing pages.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customForms.map((form) => (
              <Card key={form.id} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{form.name}</CardTitle>
                      {form.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{form.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/custom-forms/${form.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Form
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyEmbedUrl(form.embedId)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Embed URL
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={user?.id ? `/custom-form/${form.embedId}?userId=${user.id}` : `/custom-form/${form.embedId}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Preview Form
                          </a>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Form
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Custom Form</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{form.name}"? This action cannot be undone and will also delete all associated leads.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteFormMutation.mutate(form.id)} className="bg-red-600 hover:bg-red-700">
                                Delete Form
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Services</span>
                      <Badge variant="secondary">
                        {form.selectedServices.length} selected
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm text-gray-900">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="pt-4 flex space-x-2">
                      <Link href={`/custom-forms/${form.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyEmbedUrl(form.embedId)}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}