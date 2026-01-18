import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
// import { nanoid } from "nanoid";
import { Plus, FileText, Settings, Eye, Copy, ExternalLink, Edit, Trash2, MoreVertical, Globe, Users, Target, Code, Lock } from "lucide-react";
import type { CustomForm, InsertCustomForm, Formula, StylingOptions, CustomFormSettings } from "@shared/schema";

// Plans that have access to custom forms
const CUSTOM_FORMS_ALLOWED_PLANS = ['trial', 'standard', 'plus', 'plus_seo'];

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
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [configureForm, setConfigureForm] = useState<CustomForm | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has access to custom forms
  const userPlan = user?.plan || 'free';
  const hasAccess = CUSTOM_FORMS_ALLOWED_PLANS.includes(userPlan);

  // Fetch custom forms
  const { data: customForms = [], isLoading: formsLoading } = useQuery<CustomForm[]>({
    queryKey: ["/api/custom-forms"],
    enabled: hasAccess,
  });

  // Fetch available formulas/services
  const { data: formulas = [], isLoading: formulasLoading } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
    enabled: hasAccess,
  });

  // Generate URL-safe slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Update slug when name changes
  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!formSlug || formSlug === generateSlug(formName)) {
      setFormSlug(generateSlug(name));
    }
  };

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
      setFormSlug("");
      setFormDescription("");
      setSelectedServices([]);
      toast({
        title: "Custom form created successfully",
        description: "Your new form is ready to configure and embed.",
      });
    },
    onError: (error: any) => {
      console.error("Custom form creation error:", error);
      toast({
        title: "Failed to create custom form",
        description: error?.response?.data?.message || error.message || 'Unknown error',
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

    if (!formSlug.trim()) {
      toast({
        title: "Please enter a form slug",
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
        slug: formSlug.trim(),
        description: formDescription.trim() || undefined,
        enabled: true,
        serviceIds: selectedServices,
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

  const copyFormUrl = (form: CustomForm) => {
    // Get account slug (use email or ID for now)
    const accountSlug = user?.id || 'account';
    const formUrl = `${window.location.origin}/f/${accountSlug}/${form.slug}`;
    navigator.clipboard.writeText(formUrl);
    toast({
      title: "Form URL copied to clipboard",
    });
  };

  const copyEmbedCode = (form: CustomForm) => {
    // Get account slug (use email or ID for now)
    const accountSlug = user?.id || 'account';
    const embedUrl = `${window.location.origin}/f/${accountSlug}/${form.slug}?embed=1`;
    const embedCode = `<iframe src="${embedUrl}" width="600" height="800" frameborder="0" style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Embed code copied to clipboard",
    });
  };

  if (formsLoading || formulasLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div>Loading custom forms...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Show upgrade prompt for free users
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto mt-20">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Custom Forms</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Custom forms are not available on the free plan. Upgrade to create dedicated forms for different services.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/dashboard">
                      <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                    <Link href="/pricing">
                      <Button>View Plans</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile-First Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">Custom Forms</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">Create multiple independent forms with different services and designs</p>
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
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., House Washing Only"
                  />
                </div>
                
                <div>
                  <Label htmlFor="form-slug">URL Slug</Label>
                  <Input
                    id="form-slug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g., house-washing"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your form will be available at: /f/{user?.id || 'account'}/{formSlug || 'your-slug'}
                  </p>
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
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
                    {customForms.filter((form) => form.enabled).length}
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
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No custom forms yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
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
              <Card key={form.id} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{form.name}</CardTitle>
                      {form.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{form.description}</p>
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
                        <DropdownMenuItem onClick={() => copyFormUrl(form)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Form URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyEmbedCode(form)}>
                          <Code className="w-4 h-4 mr-2" />
                          Copy Embed Code
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/f/${user?.id || 'account'}/${form.slug}`} target="_blank" rel="noopener noreferrer">
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
                
                <CardContent className="overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between min-w-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">URL Slug</span>
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded truncate max-w-[120px] ml-2">/{form.slug}</code>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Services</span>
                      <Badge variant="secondary">
                        {form.serviceIds.length} selected
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                      <Badge variant={form.enabled ? "default" : "secondary"}>
                        {form.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(form.createdAt!).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="pt-4 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setConfigureForm(form)}
                        className="flex-1 min-w-0"
                      >
                        <Settings className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Configure</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyFormUrl(form)}
                        className="flex-1 min-w-0"
                      >
                        <Copy className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Copy URL</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Configuration Dialog */}
        <Dialog open={!!configureForm} onOpenChange={() => setConfigureForm(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure Form: {configureForm?.name}</DialogTitle>
              <DialogDescription>
                Manage your form settings, copy embed codes, and track performance.
              </DialogDescription>
            </DialogHeader>
            
            {configureForm && (
              <div className="space-y-6">
                {/* Form URLs and Embed Codes */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Share Your Form</h3>
                  
                  {/* Direct URL */}
                  <div>
                    <Label htmlFor="form-url">Direct Form URL</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="form-url"
                        value={`${window.location.origin}/f/${user?.id || 'account'}/${configureForm.slug}`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyFormUrl(configureForm)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this URL to let customers access your form directly
                    </p>
                  </div>

                  {/* Embed Code */}
                  <div>
                    <Label htmlFor="embed-code">Embed Code (iframe)</Label>
                    <div className="flex space-x-2 mt-1">
                      <Textarea
                        id="embed-code"
                        value={`<iframe src="${window.location.origin}/f/${user?.id || 'account'}/${configureForm.slug}?embed=1" width="600" height="800" frameborder="0" style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"></iframe>`}
                        readOnly
                        className="font-mono text-sm resize-none"
                        rows={4}
                      />
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyEmbedCode(configureForm)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Copy this code to embed the form on your website
                    </p>
                  </div>
                </div>

                {/* Form Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Form Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <Badge variant={configureForm.enabled ? "default" : "secondary"} className="ml-2">
                        {configureForm.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Services:</span>
                      <span className="ml-2">{configureForm.serviceIds.length} selected</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="ml-2">{new Date(configureForm.createdAt!).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2">{new Date(configureForm.updatedAt!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-4 flex justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(`/f/${user?.id || 'account'}/${configureForm.slug}`, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Preview Form
                    </Button>
                  </div>
                  <Button onClick={() => setConfigureForm(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}