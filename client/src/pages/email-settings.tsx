import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Settings, FileText, Plus, Save, User, Building2, Phone, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { EmailSettings, EmailTemplate, BusinessSettings } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";

// Dynamic variables that are currently wired for customer data
const DYNAMIC_VARIABLES = [
  { name: 'Customer Name', variable: '{{customerName}}', icon: User },
  { name: 'Customer Email', variable: '{{customerEmail}}', icon: Mail },
  { name: 'Customer Phone', variable: '{{customerPhone}}', icon: Phone },
  { name: 'Customer Address', variable: '{{customerAddress}}', icon: MapPin },
];

const DEFAULT_TEMPLATES = [
  {
    id: 'lead-submitted',
    name: 'Lead Submitted Email',
    subject: 'Thank you for your {{serviceName}} inquiry - {{totalPrice}}',
    message: `Hi {{customerName}},

Thank you for your interest in our {{serviceName}} service. We've received your inquiry and will get back to you shortly.

Estimated Price: {{totalPrice}}
Service: {{serviceName}}
Date Submitted: {{currentDate}}

What happens next:
• We'll review your project details within 24 hours
• One of our specialists will contact you to discuss your needs
• We'll provide a detailed estimate and timeline

If you have any questions, feel free to contact us:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

Best regards,
The {{businessName}} Team`,
    description: 'Sent automatically when customers submit pricing inquiries',
    enabled: false
  },
  {
    id: 'bid-confirmed',
    name: 'Bid Confirmed Email',
    subject: 'Your Estimate is Ready - {{totalPrice}}',
    message: `Hi {{customerName}},

Great news! We've reviewed your request and prepared a detailed estimate for you.

Estimate Total: {{totalPrice}}

Please click the link below to view the full breakdown of services, pricing, and any applicable fees:

{{estimateLink}}

This estimate includes:
• Detailed service descriptions
• Travel fees (if applicable)
• Any discounts applied
• Tax calculations

To accept this estimate, simply click "Accept" on the estimate page. If you have any questions or would like to discuss modifications, please don't hesitate to reach out.

This estimate is valid for 30 days from the date of issue.

Contact Information:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

Thank you for choosing {{businessName}}!

Best regards,
The {{businessName}} Team`,
    description: 'Sent when you confirm and send a bid to the customer',
    enabled: false
  },
  {
    id: 'bid-revised',
    name: 'Revised Bid Email',
    subject: 'Updated Estimate - {{totalPrice}}',
    message: `Hi {{customerName}},

We've updated your estimate based on our review. Please find the revised pricing below.

New Estimate Total: {{totalPrice}}

Click the link below to view the updated estimate with all the details:

{{estimateLink}}

Changes in this revision:
• Updated pricing and service details
• Adjusted fees as discussed
• Current discounts applied

If you have any questions about the changes, please contact us. We're happy to walk you through the updated estimate.

Contact Information:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

Best regards,
The {{businessName}} Team`,
    description: 'Sent when you revise and resend a bid to the customer',
    enabled: false
  },
  {
    id: 'lead-booked',
    name: 'Appointment Booked Email',
    subject: 'Appointment Confirmed: {{serviceName}} on {{appointmentDate}}',
    message: `Hi {{customerName}},

Your appointment has been confirmed! We're looking forward to providing you with excellent service.

Appointment Details:
• Service: {{serviceName}}
• Date: {{appointmentDate}}
• Time: {{appointmentTime}}
• Location: {{customerAddress}}

Before your appointment:
• Please ensure easy access to the service area
• Have any relevant documents ready
• Contact us if you have any questions

Contact Information:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

We look forward to serving you!

Best regards,
The {{businessName}} Team`,
    description: 'Sent when customers book appointments or schedule services',
    enabled: false
  }
];

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("business");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  
  // Enhanced template state
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hasTemplateChanges, setHasTemplateChanges] = useState(false);

  const currentTemplate = selectedTemplate ? templates.find(t => t.id === selectedTemplate) : null;

  const updateTemplate = (templateId: string, updates: Partial<typeof DEFAULT_TEMPLATES[0]>) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, ...updates } : t
    ));
    setHasTemplateChanges(true);
  };

  const toggleTemplate = (templateId: string, enabled: boolean) => {
    updateTemplate(templateId, { enabled });
  };

  const insertVariable = (variable: string) => {
    if (!currentTemplate) return;
    
    const textarea = document.querySelector(`#message-${currentTemplate.id}`) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.slice(0, start) + variable + text.slice(end);
      
      updateTemplate(currentTemplate.id, { message: newText });
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleEnhancedTemplateSave = async () => {
    try {
      // Save each template to the backend
      for (const template of templates) {
        const templateData = {
          name: template.name,
          subject: template.subject,
          htmlContent: template.message,
          textContent: template.message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          triggerType: template.id,
          isActive: template.enabled
        };

        // Check if template already exists by triggerType
        const existingTemplates = emailTemplates || [];
        const existingTemplate = existingTemplates.find(t => t.triggerType === template.id);
        
        if (existingTemplate) {
          // Update existing template
          const res = await apiRequest("PUT", `/api/email-templates/${existingTemplate.id}`, templateData);
          if (!res.ok) throw new Error(`Failed to update template ${template.name}`);
        } else {
          // Create new template
          const res = await apiRequest("POST", "/api/email-templates", templateData);
          if (!res.ok) throw new Error(`Failed to create template ${template.name}`);
        }
      }
      
      // Refresh the templates data
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      
      toast({
        title: "Templates Saved",
        description: "Your email templates have been saved successfully."
      });
      
      setHasTemplateChanges(false);
    } catch (error) {
      console.error('Template save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "There was an error saving your templates. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Local state for form data
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    businessPhone: "",
    businessEmail: "",
  });
  
  const [emailForm, setEmailForm] = useState({
    businessEmail: "",
    replyToEmail: "",
    fromName: "",
    emailSignature: "",
  });

  // Email Settings Query
  const { data: emailSettings, isLoading: settingsLoading } = useQuery<EmailSettings>({
    queryKey: ["/api/email-settings"],
  });

  // Business Settings Query
  const { data: businessSettings, isLoading: businessLoading } = useQuery<BusinessSettings>({
    queryKey: ["/api/business-settings"],
  });

  // Email Templates Query
  const { data: emailTemplates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  // Update Email Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<EmailSettings>) => {
      const res = await apiRequest("PUT", "/api/email-settings", settings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({
        title: "Settings updated",
        description: "Your email settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update Business Settings Mutation
  const updateBusinessMutation = useMutation({
    mutationFn: async (settings: Partial<BusinessSettings>) => {
      const res = await apiRequest("PATCH", "/api/business-settings", settings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      toast({
        title: "Business settings updated",
        description: "Your business information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create/Update Template Mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const method = editingTemplate ? "PUT" : "POST";
      const url = editingTemplate ? `/api/email-templates/${editingTemplate.id}` : "/api/email-templates";
      const res = await apiRequest(method, url, template);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast({
        title: editingTemplate ? "Template updated" : "Template created",
        description: "Your email template has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete Template Mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const res = await apiRequest("DELETE", `/api/email-templates/${templateId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Template deleted",
        description: "The email template has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNotificationUpdate = (field: string, value: any) => {
    if (!emailSettings) return;
    
    const updatedSettings = {
      ...emailSettings,
      notifications: {
        ...emailSettings.notifications,
        [field]: value,
      },
    };
    
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleBusinessFormChange = (field: string, value: string) => {
    setBusinessForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmailFormChange = (field: string, value: string) => {
    setEmailForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveBusinessSettings = () => {
    updateBusinessMutation.mutate(businessForm);
  };

  const saveEmailSettings = () => {
    updateSettingsMutation.mutate(emailForm);
  };

  const openTemplateDialog = (template?: EmailTemplate) => {
    setEditingTemplate(template || null);
    setTemplateDialogOpen(true);
  };

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    triggerType: "custom" as const,
    isActive: true,
  });

  // Update local forms when data loads
  useEffect(() => {
    if (businessSettings) {
      setBusinessForm({
        businessName: businessSettings.businessName || "",
        businessPhone: businessSettings.businessPhone || "",
        businessEmail: businessSettings.businessEmail || "",
      });
    }
  }, [businessSettings]);

  useEffect(() => {
    if (emailSettings) {
      setEmailForm({
        businessEmail: emailSettings.businessEmail || "",
        replyToEmail: emailSettings.replyToEmail || "",
        fromName: emailSettings.fromName || "",
        emailSignature: emailSettings.emailSignature || "",
      });
    }
  }, [emailSettings]);

  // Sync local templates state with backend data when it loads
  useEffect(() => {
    if (emailTemplates && emailTemplates.length > 0) {
      // Convert backend templates to match the local template format
      const backendTemplates = emailTemplates.map(template => ({
        id: template.triggerType,
        name: template.name,
        subject: template.subject,
        message: template.htmlContent,
        description: getTemplateDescription(template.triggerType),
        enabled: template.isActive
      }));
      
      // Merge with default templates to ensure all expected templates exist
      const mergedTemplates = DEFAULT_TEMPLATES.map(defaultTemplate => {
        const backendTemplate = backendTemplates.find(bt => bt.id === defaultTemplate.id);
        return backendTemplate || defaultTemplate;
      });
      
      setTemplates(mergedTemplates);
    }
  }, [emailTemplates]);

  const getTemplateDescription = (triggerType: string): string => {
    const descriptions: Record<string, string> = {
      'lead-submitted': 'Sent automatically when customers submit pricing inquiries',
      'lead-booked': 'Sent when customers book appointments or schedule services',
      'revised-bid': 'Sent when pricing is updated or revised after initial quote'
    };
    return descriptions[triggerType] || 'Custom email template';
  };

  useEffect(() => {
    if (editingTemplate) {
      setTemplateForm({
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        htmlContent: editingTemplate.htmlContent,
        textContent: editingTemplate.textContent,
        triggerType: editingTemplate.triggerType as "custom",
        isActive: editingTemplate.isActive,
      });
    } else {
      setTemplateForm({
        name: "",
        subject: "",
        htmlContent: "",
        textContent: "",
        triggerType: "custom",
        isActive: true,
      });
    }
  }, [editingTemplate]);

  const handleTemplateSave = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.htmlContent) {
      toast({
        title: "Required fields missing",
        description: "Please fill in the template name, subject, and HTML content.",
        variant: "destructive",
      });
      return;
    }

    saveTemplateMutation.mutate(templateForm);
  };

  if (settingsLoading || templatesLoading || businessLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Skeleton hero */}
            <div className="animate-pulse rounded-2xl h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
            {/* Skeleton tabs */}
            <div className="animate-pulse rounded-2xl h-12 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
            {/* Skeleton card */}
            <div className="animate-pulse rounded-2xl h-96 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes dash-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-stagger { animation: dash-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .dash-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 dash-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Header */}
          <div className="dash-stagger relative overflow-hidden rounded-2xl border border-blue-200/40 dark:border-blue-500/10 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/30 to-transparent dark:from-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-200/20 to-transparent dark:from-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-600/70 dark:text-blue-400/60 font-semibold mb-2">Configuration</p>
              <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Email Management
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Manage business info, email settings, and custom templates.
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-1 h-auto">
              <TabsTrigger value="business" className="flex items-center justify-center space-x-2 p-2.5 sm:p-3 text-xs sm:text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md">
                <Building2 className="h-4 w-4" />
                <span>Business Info</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center justify-center space-x-2 p-2.5 sm:p-3 text-xs sm:text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md">
                <Settings className="h-4 w-4" />
                <span>Email Settings</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center justify-center space-x-2 p-2.5 sm:p-3 text-xs sm:text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md">
                <FileText className="h-4 w-4" />
                <span>Email Templates</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="business">
              <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    <Building2 className="h-5 w-5 text-amber-500" />
                    <span>Business Information</span>
                  </CardTitle>
                  <CardDescription>
                    Manage business details that appear in customer emails.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      placeholder="Your Business Name"
                      value={businessForm.businessName}
                      onChange={(e) => handleBusinessFormChange("businessName", e.target.value)}
                      className="rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      This name will appear in email subject lines and headers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="contact@yourbusiness.com"
                      value={businessForm.businessEmail}
                      onChange={(e) => handleBusinessFormChange("businessEmail", e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={saveBusinessSettings}
                      disabled={updateBusinessMutation.isPending}
                      className="rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white min-w-[140px]"
                    >
                      {updateBusinessMutation.isPending ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    <User className="h-5 w-5 text-amber-500" />
                    <span>Email Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Set up your sender information and signature.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailBusinessEmail">Sender Email</Label>
                      <Input
                        id="emailBusinessEmail"
                        type="email"
                        placeholder="noreply@yourbusiness.com"
                        value={emailForm.businessEmail}
                        onChange={(e) => handleEmailFormChange("businessEmail", e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyToEmail">Reply-To Email</Label>
                      <Input
                        id="replyToEmail"
                        type="email"
                        placeholder="replies@yourbusiness.com"
                        value={emailForm.replyToEmail}
                        onChange={(e) => handleEmailFormChange("replyToEmail", e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      placeholder="Your Business Name"
                      value={emailForm.fromName}
                      onChange={(e) => handleEmailFormChange("fromName", e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailSignature">Email Signature</Label>
                    <Textarea
                      id="emailSignature"
                      placeholder="Best regards,&#10;The Team at Your Business"
                      className="min-h-[100px] rounded-lg"
                      value={emailForm.emailSignature}
                      onChange={(e) => handleEmailFormChange("emailSignature", e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={saveEmailSettings}
                      disabled={updateSettingsMutation.isPending}
                      className="rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white min-w-[140px]"
                    >
                      {updateSettingsMutation.isPending ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Email Templates
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Turn templates on/off and customize their content.
                  </p>
                </div>
                <Button 
                  onClick={handleEnhancedTemplateSave} 
                  disabled={!hasTemplateChanges}
                  className="rounded-lg gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>

              <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 rounded-2xl overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                              <Mail className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{template.name}</CardTitle>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                            </div>
                          </div>
                          <Switch
                            id={`toggle-${template.id}`}
                            checked={template.enabled}
                            onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                          />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label htmlFor={`subject-${template.id}`}>Subject</Label>
                          <Input
                            id={`subject-${template.id}`}
                            value={template.subject}
                            onChange={(e) => updateTemplate(template.id, { subject: e.target.value })}
                            placeholder="Email subject line..."
                            disabled={!template.enabled}
                            className="rounded-lg"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`message-${template.id}`}>Message</Label>
                          <Textarea
                            id={`message-${template.id}`}
                            value={template.message}
                            onChange={(e) => updateTemplate(template.id, { message: e.target.value })}
                            placeholder="Email message content..."
                            rows={8}
                            disabled={!template.enabled}
                            className="font-mono text-sm rounded-lg"
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
                          disabled={!template.enabled}
                          className="rounded-lg"
                        >
                          {selectedTemplate === template.id ? 'Hide Variables' : 'Show Variables'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 rounded-2xl sticky top-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                        <Plus className="h-5 w-5 text-amber-500" />
                        Dynamic Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Click to insert dynamic data into the selected template.
                      </p>
                      <div className="space-y-2">
                        {DYNAMIC_VARIABLES.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Button
                              key={item.variable}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start gap-2 h-9 text-xs rounded-lg dark:border-gray-700 dark:hover:bg-gray-700/50"
                              onClick={() => insertVariable(item.variable)}
                              disabled={!selectedTemplate}
                            >
                              <IconComponent className="h-3.5 w-3.5 text-gray-400" />
                              {item.name}
                            </Button>
                          );
                        })}
                      </div>
                      {!selectedTemplate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                          Select a template to enable dynamic data.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </div>

      {/* Template Creation/Edit Dialog (no changes needed here) */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            <DialogDescription>Create a custom email template with dynamic data support.</DialogDescription>
          </DialogHeader>
          {/* ... dialog content ... */}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
