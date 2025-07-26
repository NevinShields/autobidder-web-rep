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
import { Mail, Settings, FileText, Plus, Edit, Trash2, Save, Bell, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { EmailSettings, EmailTemplate } from "@shared/schema";

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("settings");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Email Settings Query
  const { data: emailSettings, isLoading: settingsLoading } = useQuery<EmailSettings>({
    queryKey: ["/api/email-settings"],
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

  const handleSettingsUpdate = (field: string, value: any) => {
    if (!emailSettings) return;
    
    const updatedSettings = {
      ...emailSettings,
      [field]: value,
    };
    
    // Handle nested notifications object
    if (field.startsWith('notifications.')) {
      const notificationKey = field.split('.')[1];
      updatedSettings.notifications = {
        ...emailSettings.notifications,
        [notificationKey]: value,
      };
    }
    
    updateSettingsMutation.mutate(updatedSettings);
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

  if (settingsLoading || templatesLoading) {
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
            Configure your email settings and create custom templates
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Email Settings</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Email Templates</span>
          </TabsTrigger>
        </TabsList>

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
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    placeholder="your@business.com"
                    value={emailSettings?.businessEmail || ""}
                    onChange={(e) => handleSettingsUpdate("businessEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyToEmail">Reply-To Email</Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    placeholder="reply@business.com"
                    value={emailSettings?.replyToEmail || ""}
                    onChange={(e) => handleSettingsUpdate("replyToEmail", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  placeholder="Your Business Name"
                  value={emailSettings?.fromName || ""}
                  onChange={(e) => handleSettingsUpdate("fromName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSignature">Email Signature</Label>
                <Textarea
                  id="emailSignature"
                  placeholder="Best regards,&#10;Your Name&#10;Your Business&#10;Phone: (555) 123-4567"
                  className="min-h-[100px]"
                  value={emailSettings?.emailSignature || ""}
                  onChange={(e) => handleSettingsUpdate("emailSignature", e.target.value)}
                />
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
                    handleSettingsUpdate("notifications.newLeads", checked)
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
                    handleSettingsUpdate("notifications.estimateRequests", checked)
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
                    handleSettingsUpdate("notifications.appointmentBookings", checked)
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
                    handleSettingsUpdate("notifications.systemUpdates", checked)
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
                    handleSettingsUpdate("notifications.weeklyReports", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>
                    Create and manage custom email templates for automated communications
                  </CardDescription>
                </div>
                <Button onClick={() => openTemplateDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emailTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first email template to get started
                  </p>
                  <Button onClick={() => openTemplateDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {emailTemplates.map((template) => (
                    <Card key={template.id} className="border border-muted">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{template.name}</h4>
                              <Badge 
                                variant={template.isActive ? "default" : "secondary"}
                              >
                                {template.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">
                                {template.triggerType.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {template.subject}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTemplateDialog(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTemplateMutation.mutate(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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