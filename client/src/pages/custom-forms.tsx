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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { nanoid } from "nanoid";
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

  // Create custom form mutation
  const createFormMutation = useMutation({
    mutationFn: async (formData: InsertCustomForm) => {
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
    onError: () => {
      toast({
        title: "Failed to create custom form",
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

  const handleCreateForm = () => {
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

    const formData: InsertCustomForm = {
      name: formName.trim(),
      description: formDescription.trim(),
      embedId: nanoid(),
      isActive: true,
      selectedServices,
      styling: defaultStyling as any,
      formSettings: defaultFormSettings as any,
    };

    createFormMutation.mutate(formData);
  };

  const copyEmbedUrl = (embedId: string) => {
    const embedUrl = `${window.location.origin}/custom-form/${embedId}`;
    navigator.clipboard.writeText(embedUrl);
    toast({
      title: "Embed URL copied to clipboard",
    });
  };

  if (formsLoading || formulasLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div>Loading custom forms...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Custom Forms</h1>
            <p className="text-gray-600 mt-2">Create multiple independent forms with different services and designs</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Form
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Custom Form</DialogTitle>
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Forms</p>
                  <p className="text-3xl font-bold text-gray-900">{customForms.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Forms</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {customForms.filter((form) => form.isActive).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">From custom forms</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms Grid */}
        {customForms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No custom forms yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first custom form to test different designs and service combinations on various landing pages.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customForms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow duration-200">
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
                          <a href={`/custom-form/${form.embedId}`} target="_blank" rel="noopener noreferrer">
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