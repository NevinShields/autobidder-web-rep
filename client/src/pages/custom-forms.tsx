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
    const formUrl = `${window.location.origin}${getDirectFormPath(form)}`;
    navigator.clipboard.writeText(formUrl);
    toast({
      title: "Form URL copied to clipboard",
    });
  };

  const copyEmbedCode = (form: CustomForm) => {
    const embedUrl = `${window.location.origin}${getDirectFormPath(form, { embed: true })}`;
    const embedCode = `<iframe src="${embedUrl}" width="600" height="800" frameborder="0" style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Embed code copied to clipboard",
    });
  };

  const getDirectFormPath = (form: CustomForm, options?: { embed?: boolean }) => {
    const params = new URLSearchParams();
    params.set("userId", form.accountId);
    if (Array.isArray(form.serviceIds) && form.serviceIds.length > 0) {
      params.set("serviceIds", form.serviceIds.join(","));
    }
    if (options?.embed) {
      params.set("embed", "1");
    }
    return `/custom-form/${form.id}?${params.toString()}`;
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
        <div className="p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-2xl mx-auto mt-16">
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm text-center py-16 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 flex items-center justify-center mx-auto mb-4 border border-gray-200/60 dark:border-gray-700/40">
                    <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Custom Forms</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Custom forms are not available on the free plan. Upgrade to create dedicated forms for different services.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/dashboard">
                      <Button variant="outline" className="rounded-full">Back to Dashboard</Button>
                    </Link>
                    <Link href="/pricing">
                      <Button className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20">View Plans</Button>
                    </Link>
                  </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes cf-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cf-stagger { animation: cf-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .cf-stagger-1 { animation-delay: 0ms; }
        .cf-stagger-2 { animation-delay: 60ms; }
        .cf-stagger-3 { animation-delay: 120ms; }
        .cf-stagger-4 { animation-delay: 180ms; }
        .cf-stagger-5 { animation-delay: 240ms; }
        .cf-card-hover { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
        .cf-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px -8px rgba(0,0,0,0.12); }
        .dark .cf-card-hover:hover { box-shadow: 0 8px 30px -8px rgba(0,0,0,0.4); }
        .cf-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 cf-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Hero Header */}
        <div className="cf-stagger cf-stagger-1 relative overflow-hidden rounded-2xl border border-amber-200/40 dark:border-amber-500/10 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8 mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-200/20 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-400/60 font-semibold mb-1">Forms</p>
                <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Custom Forms
                </h1>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  Create multiple independent forms with different services and designs
                </p>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white w-full sm:w-auto shadow-md shadow-amber-500/20 px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Form
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-br from-white/95 via-amber-50/60 to-orange-50/60 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-800/95 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-600" />
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Create Custom Form
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Create a new custom form with specific services for testing on different landing pages.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 px-6 pb-6">
                <div>
                  <Label htmlFor="form-name" className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Form Name</Label>
                  <Input
                    id="form-name"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., House Washing Only"
                    className="mt-1.5 rounded-xl border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80"
                  />
                </div>
                
                <div>
                  <Label htmlFor="form-slug" className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">URL Slug</Label>
                  <Input
                    id="form-slug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g., house-washing"
                    className="mt-1.5 rounded-xl border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your form URL will be generated as a direct /custom-form link after creation.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="form-description" className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Description (Optional)</Label>
                  <Textarea
                    id="form-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of this form's purpose"
                    rows={3}
                    className="mt-1.5 rounded-xl border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Select Services</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-amber-200/60 dark:border-amber-500/20 bg-white/80 dark:bg-gray-800/70 rounded-xl p-3 mt-1.5">
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
                        <label htmlFor={`service-${formula.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-200">
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

                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-full border-gray-200 dark:border-gray-700">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateForm} disabled={createFormMutation.isPending} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20">
                    {createFormMutation.isPending ? "Creating..." : "Create Form"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="cf-stagger cf-stagger-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="cf-card-hover relative overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 backdrop-blur-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Total Forms</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {customForms.length}
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="cf-card-hover relative overflow-hidden rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 backdrop-blur-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Active Forms</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {customForms.filter((form) => form.enabled).length}
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="cf-card-hover relative overflow-hidden rounded-2xl border border-violet-200/60 dark:border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 backdrop-blur-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Total Leads</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  0
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">From custom forms</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Forms Grid */}
        {customForms.length === 0 ? (
          <div className="cf-stagger cf-stagger-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 flex items-center justify-center mx-auto mb-4 border border-gray-200/60 dark:border-gray-700/40">
                <FileText className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>No custom forms yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Create your first custom form to test different designs and service combinations on various landing pages.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 px-6">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Form
              </Button>
          </div>
        ) : (
          <div className="cf-stagger cf-stagger-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customForms.map((form) => (
              <div key={form.id} className="cf-card-hover rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{form.name}</h3>
                      {form.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{form.description}</p>
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
                          <a href={getDirectFormPath(form)} target="_blank" rel="noopener noreferrer">
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
                          <AlertDialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-red-200/70 dark:border-red-500/30 bg-gradient-to-br from-white/95 via-red-50/70 to-orange-50/70 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-800/95 backdrop-blur-xl shadow-2xl shadow-red-500/10">
                            <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
                            <AlertDialogHeader>
                              <AlertDialogTitle className="px-6 pt-6 text-2xl text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                                Delete Custom Form
                              </AlertDialogTitle>
                              <AlertDialogDescription className="px-6 text-gray-600 dark:text-gray-400">
                                Are you sure you want to delete "{form.name}"? This action cannot be undone and will also delete all associated leads.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="px-6 pb-6">
                              <AlertDialogCancel className="rounded-full border-gray-200 dark:border-gray-700">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteFormMutation.mutate(form.id)} className="rounded-full bg-red-600 hover:bg-red-700">
                                Delete Form
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="px-5 pb-5 overflow-hidden">
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

                    <div className="pt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfigureForm(form)}
                        className="flex-1 min-w-0 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:border-amber-300 dark:hover:border-amber-700/40"
                      >
                        <Settings className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Configure</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyFormUrl(form)}
                        className="flex-1 min-w-0 rounded-lg border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:border-amber-300 dark:hover:border-amber-700/40"
                      >
                        <Copy className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Copy URL</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Configuration Dialog */}
        <Dialog open={!!configureForm} onOpenChange={() => setConfigureForm(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-br from-white/95 via-amber-50/60 to-orange-50/60 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-800/95 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-600" />
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Configure Form: {configureForm?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Manage your form settings, copy embed codes, and track performance.
              </DialogDescription>
            </DialogHeader>
            
            {configureForm && (
              <div className="space-y-6 px-6 pb-6">
                {/* Form URLs and Embed Codes */}
                <div className="space-y-4 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-white/75 dark:bg-gray-800/60 p-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Share Your Form</h3>
                  
                  {/* Direct URL */}
                  <div>
                    <Label htmlFor="form-url" className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Direct Form URL</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="form-url"
                        value={`${window.location.origin}${getDirectFormPath(configureForm)}`}
                        readOnly
                        className="font-mono text-sm rounded-xl border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyFormUrl(configureForm)}
                        className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10"
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
                    <Label htmlFor="embed-code" className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Embed Code (iframe)</Label>
                    <div className="flex space-x-2 mt-1">
                      <Textarea
                        id="embed-code"
                        value={`<iframe src="${window.location.origin}${getDirectFormPath(configureForm, { embed: true })}" width="600" height="800" frameborder="0" style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"></iframe>`}
                        readOnly
                        className="font-mono text-sm resize-none rounded-xl border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80"
                        rows={4}
                      />
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyEmbedCode(configureForm)}
                          className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10"
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
                <div className="rounded-2xl border border-gray-200/70 dark:border-gray-700/50 bg-white/75 dark:bg-gray-800/60 p-4">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Form Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge variant={configureForm.enabled ? "default" : "secondary"} className="ml-2">
                        {configureForm.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Services:</span>
                      <span className="ml-2">{configureForm.serviceIds.length} selected</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{new Date(configureForm.createdAt!).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <span className="ml-2">{new Date(configureForm.updatedAt!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-1 flex justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(getDirectFormPath(configureForm), '_blank');
                      }}
                      className="rounded-full border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Preview Form
                    </Button>
                  </div>
                  <Button onClick={() => setConfigureForm(null)} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20">
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
