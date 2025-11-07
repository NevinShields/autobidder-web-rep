import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Mail, MessageSquare, Zap, Save } from "lucide-react";
import { CrmSettings as CrmSettingsType } from "@shared/schema";

export default function CrmSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("twilio");
  
  const { data: settings, isLoading } = useQuery<CrmSettingsType>({
    queryKey: ["/api/crm/settings"]
  });
  
  const [formData, setFormData] = useState({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    sendgridApiKey: "",
    sendgridFromEmail: "",
    zapierWebhookUrl: "",
    emailSignature: ""
  });
  
  useEffect(() => {
    if (settings) {
      setFormData({
        twilioAccountSid: settings.twilioAccountSid || "",
        twilioAuthToken: settings.twilioAuthToken || "",
        twilioPhoneNumber: settings.twilioPhoneNumber || "",
        sendgridApiKey: settings.sendgridApiKey || "",
        sendgridFromEmail: settings.sendgridFromEmail || "",
        zapierWebhookUrl: settings.zapierWebhookUrl || "",
        emailSignature: settings.emailSignature || ""
      });
    }
  }, [settings]);
  
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      if (settings) {
        return await apiRequest("/api/crm/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      } else {
        return await apiRequest("/api/crm/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/settings"] });
      toast({
        title: "Settings saved",
        description: "Your CRM settings have been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save CRM settings",
        variant: "destructive"
      });
    }
  });
  
  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          CRM Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure integrations for automated communications and workflows
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="twilio" data-testid="tab-twilio">
            <MessageSquare className="h-4 w-4 mr-2" />
            Twilio SMS
          </TabsTrigger>
          <TabsTrigger value="sendgrid" data-testid="tab-sendgrid">
            <Mail className="h-4 w-4 mr-2" />
            SendGrid Email
          </TabsTrigger>
          <TabsTrigger value="zapier" data-testid="tab-zapier">
            <Zap className="h-4 w-4 mr-2" />
            Zapier Webhook
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="twilio">
          <Card>
            <CardHeader>
              <CardTitle>Twilio SMS Configuration</CardTitle>
              <CardDescription>
                Connect your Twilio account to send automated SMS messages to leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twilioAccountSid">Account SID</Label>
                <Input
                  id="twilioAccountSid"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.twilioAccountSid}
                  onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
                  data-testid="input-twilio-sid"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twilioAuthToken">Auth Token</Label>
                <Input
                  id="twilioAuthToken"
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={formData.twilioAuthToken}
                  onChange={(e) => setFormData({ ...formData, twilioAuthToken: e.target.value })}
                  data-testid="input-twilio-token"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
                <Input
                  id="twilioPhoneNumber"
                  placeholder="+1234567890"
                  value={formData.twilioPhoneNumber}
                  onChange={(e) => setFormData({ ...formData, twilioPhoneNumber: e.target.value })}
                  data-testid="input-twilio-phone"
                />
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-twilio"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Twilio Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sendgrid">
          <Card>
            <CardHeader>
              <CardTitle>SendGrid Email Configuration</CardTitle>
              <CardDescription>
                Connect your SendGrid account to send automated emails to leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                <Input
                  id="sendgridApiKey"
                  type="password"
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.sendgridApiKey}
                  onChange={(e) => setFormData({ ...formData, sendgridApiKey: e.target.value })}
                  data-testid="input-sendgrid-key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sendgridFromEmail">From Email Address</Label>
                <Input
                  id="sendgridFromEmail"
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={formData.sendgridFromEmail}
                  onChange={(e) => setFormData({ ...formData, sendgridFromEmail: e.target.value })}
                  data-testid="input-sendgrid-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailSignature">Email Signature</Label>
                <Textarea
                  id="emailSignature"
                  placeholder="Best regards,\nYour Company Name"
                  rows={4}
                  value={formData.emailSignature}
                  onChange={(e) => setFormData({ ...formData, emailSignature: e.target.value })}
                  data-testid="input-email-signature"
                />
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-sendgrid"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save SendGrid Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="zapier">
          <Card>
            <CardHeader>
              <CardTitle>Zapier Webhook Configuration</CardTitle>
              <CardDescription>
                Set up a Zapier webhook to trigger invoice creation when leads reach "paid" status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zapierWebhookUrl">Webhook URL</Label>
                <Input
                  id="zapierWebhookUrl"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={formData.zapierWebhookUrl}
                  onChange={(e) => setFormData({ ...formData, zapierWebhookUrl: e.target.value })}
                  data-testid="input-zapier-webhook"
                />
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Create a Zapier webhook trigger to receive lead data when marked as paid
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">How to set this up:</h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Create a new Zap in Zapier</li>
                  <li>Choose "Webhooks by Zapier" as the trigger</li>
                  <li>Select "Catch Hook" as the trigger event</li>
                  <li>Copy the webhook URL and paste it above</li>
                  <li>Add your invoicing app as the action (QuickBooks, Stripe, etc.)</li>
                </ol>
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-zapier"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Zapier Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
