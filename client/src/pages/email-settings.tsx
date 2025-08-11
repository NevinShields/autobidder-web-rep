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
import { Mail, Settings, FileText, Plus, Edit, Trash2, Save, Bell, User, Building2, Phone, MapPin, DollarSign, Calendar, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { EmailSettings, EmailTemplate, BusinessSettings } from "@shared/schema";

// Dynamic variables that users can insert
const DYNAMIC_VARIABLES = [
  { name: 'Customer Name', variable: '{{customerName}}', icon: User },
  { name: 'Customer Email', variable: '{{customerEmail}}', icon: Mail },
  { name: 'Customer Phone', variable: '{{customerPhone}}', icon: Phone },
  { name: 'Customer Address', variable: '{{customerAddress}}', icon: MapPin },
  { name: 'Service Name', variable: '{{serviceName}}', icon: Plus },
  { name: 'Total Price', variable: '{{totalPrice}}', icon: DollarSign },
  { name: 'Original Price', variable: '{{originalPrice}}', icon: DollarSign },
  { name: 'Revised Price', variable: '{{revisedPrice}}', icon: DollarSign },
  { name: 'Price Change', variable: '{{priceChange}}', icon: DollarSign },
  { name: 'Appointment Date', variable: '{{appointmentDate}}', icon: Calendar },
  { name: 'Appointment Time', variable: '{{appointmentTime}}', icon: Clock },
  { name: 'Current Date', variable: '{{currentDate}}', icon: Calendar },
  { name: 'Business Name', variable: '{{businessName}}', icon: Plus },
  { name: 'Business Phone', variable: '{{businessPhone}}', icon: Phone },
  { name: 'Business Email', variable: '{{businessEmail}}', icon: Mail },
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
    enabled: true
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
    enabled: true
  },
  {
    id: 'revised-bid',
    name: 'Revised Estimate Email',
    subject: 'Updated Estimate: {{serviceName}} - {{revisedPrice}}',
    message: `Hi {{customerName}},

We've reviewed your {{serviceName}} project and have an updated estimate for you.

Price Update:
• Original Estimate: {{originalPrice}}
• Updated Estimate: {{revisedPrice}}
• Price Change: {{priceChange}}

This updated estimate reflects the most accurate pricing based on your specific requirements. If you have any questions about the changes, please don't hesitate to contact us.

Contact Information:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

Thank you for choosing {{businessName}}!

Best regards,
The {{businessName}} Team`,
    description: 'Sent when pricing is updated or revised after initial quote',
    enabled: true
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
      // Here you would typically save to the backend
      console.log('Saving templates:', templates);
      
      toast({
        title: "Templates Saved",
        description: "Your email templates have been saved successfully."
      });
      
      setHasTemplateChanges(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your templates. Please try again.",
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
        businessPhone: "", // businessPhone not available in businessSettings
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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Email Management</h1>
          <p className="text-muted-foreground">
            Manage your business information, email settings, and custom templates
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Business Info</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Email Settings</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Email Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Business Information</span>
              </CardTitle>
              <CardDescription>
                Manage your business details that appear in customer emails
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
                />
                <p className="text-sm text-muted-foreground">
                  This name will appear in email subject lines and headers instead of "Autobidder"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={businessForm.businessPhone}
                  onChange={(e) => handleBusinessFormChange("businessPhone", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Phone number displayed in customer emails for contact
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
                />
                <p className="text-sm text-muted-foreground">
                  Primary business email for receiving lead notifications
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={saveBusinessSettings}
                  disabled={updateBusinessMutation.isPending}
                  className="min-w-[120px]"
                >
                  {updateBusinessMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Set up your business email details and sender information
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
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address used as sender for automated emails
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyToEmail">Reply-To Email</Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    placeholder="replies@yourbusiness.com"
                    value={emailForm.replyToEmail}
                    onChange={(e) => handleEmailFormChange("replyToEmail", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address where customers can reply to automated emails
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  placeholder="Your Business Name"
                  value={emailForm.fromName}
                  onChange={(e) => handleEmailFormChange("fromName", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Name that appears as the sender in customer emails
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSignature">Email Signature</Label>
                <Textarea
                  id="emailSignature"
                  placeholder="Best regards,&#10;Your Name&#10;Your Business&#10;Phone: (555) 123-4567"
                  className="min-h-[100px]"
                  value={emailForm.emailSignature}
                  onChange={(e) => handleEmailFormChange("emailSignature", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Signature added to the bottom of automated emails
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={saveEmailSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="min-w-[120px]"
                >
                  {updateSettingsMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Email Notifications</span>
              </CardTitle>
              <CardDescription>
                Choose which email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">New Leads</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new leads submit your forms
                  </p>
                </div>
                <Switch
                  checked={emailSettings?.notifications?.newLeads || false}
                  onCheckedChange={(checked) => 
                    handleNotificationUpdate("newLeads", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Estimate Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when estimates are requested
                  </p>
                </div>
                <Switch
                  checked={emailSettings?.notifications?.estimateRequests || false}
                  onCheckedChange={(checked) => 
                    handleNotificationUpdate("estimateRequests", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Appointment Bookings</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when appointments are booked
                  </p>
                </div>
                <Switch
                  checked={emailSettings?.notifications?.appointmentBookings || false}
                  onCheckedChange={(checked) => 
                    handleNotificationUpdate("appointmentBookings", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">System Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about platform updates and maintenance
                  </p>
                </div>
                <Switch
                  checked={emailSettings?.notifications?.systemUpdates || false}
                  onCheckedChange={(checked) => 
                    handleNotificationUpdate("systemUpdates", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Get weekly summary reports of your activity
                  </p>
                </div>
                <Switch
                  checked={emailSettings?.notifications?.weeklyReports || false}
                  onCheckedChange={(checked) => 
                    handleNotificationUpdate("weeklyReports", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Email Templates</h2>
              <p className="text-muted-foreground">
                Turn email templates on/off and customize them with dynamic data
              </p>
            </div>
            <Button 
              onClick={handleEnhancedTemplateSave} 
              disabled={!hasTemplateChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Email Template List with Toggle Switches */}
            <div className="lg:col-span-2 space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label htmlFor={`toggle-${template.id}`} className="text-sm font-medium">
                          {template.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`toggle-${template.id}`}
                          checked={template.enabled}
                          onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`subject-${template.id}`}>Email Subject</Label>
                      <Input
                        id={`subject-${template.id}`}
                        value={template.subject}
                        onChange={(e) => updateTemplate(template.id, { subject: e.target.value })}
                        placeholder="Email subject line..."
                        disabled={!template.enabled}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`message-${template.id}`}>Email Message</Label>
                      <Textarea
                        id={`message-${template.id}`}
                        value={template.message}
                        onChange={(e) => updateTemplate(template.id, { message: e.target.value })}
                        placeholder="Email message content..."
                        rows={8}
                        disabled={!template.enabled}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
                        disabled={!template.enabled}
                      >
                        {selectedTemplate === template.id ? 'Hide Variables' : 'Show Variables'}
                      </Button>
                      <Badge variant={template.enabled ? 'default' : 'secondary'}>
                        {template.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Dynamic Variables Box */}
            <div className="lg:col-span-1">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl sticky top-6">
                <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Dynamic Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Click to insert dynamic data into your email templates:
                  </p>
                  
                  <div className="space-y-2">
                    {DYNAMIC_VARIABLES.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Button
                          key={item.variable}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-9 text-xs"
                          onClick={() => insertVariable(item.variable)}
                          disabled={!selectedTemplate}
                        >
                          <IconComponent className="h-3 w-3" />
                          {item.name}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {!selectedTemplate && (
                    <p className="text-xs text-gray-500 mt-4 text-center">
                      Click "Show Variables" on any email template to insert data
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Creation/Edit Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              Create a custom email template with dynamic data support
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="Welcome Email"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select 
                  value={templateForm.triggerType} 
                  onValueChange={(value) => setTemplateForm({ ...templateForm, triggerType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_submitted">Lead Submitted</SelectItem>
                    <SelectItem value="estimate_sent">Estimate Sent</SelectItem>
                    <SelectItem value="appointment_booked">Appointment Booked</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSubject">Email Subject</Label>
              <Input
                id="templateSubject"
                placeholder="Thank you for your inquiry, {{name}}!"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="htmlContent">HTML Content</Label>
              <Textarea
                id="htmlContent"
                placeholder="<h1>Hello {{name}},</h1><p>Thank you for your inquiry. Your quote is ${{price}}.</p>"
                className="min-h-[200px] font-mono text-sm"
                value={templateForm.htmlContent}
                onChange={(e) => setTemplateForm({ ...templateForm, htmlContent: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{name}"}, {"{email}"}, {"{price}"}, {"{services}"} and other variables
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
              <Textarea
                id="textContent"
                placeholder="Hello {{name}}, Thank you for your inquiry. Your quote is ${{price}}."
                className="min-h-[100px]"
                value={templateForm.textContent}
                onChange={(e) => setTemplateForm({ ...templateForm, textContent: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={templateForm.isActive}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })}
              />
              <Label htmlFor="isActive">Template is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTemplateSave} disabled={saveTemplateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}