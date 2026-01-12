import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Save, Info, ExternalLink } from "lucide-react";
import { CrmSettings as CrmSettingsType } from "@shared/schema";

export default function CrmSettings() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<CrmSettingsType>({
    queryKey: ["/api/crm/settings"]
  });
  
  const [formData, setFormData] = useState({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: ""
  });
  
  useEffect(() => {
    if (settings) {
      setFormData({
        twilioAccountSid: settings.twilioAccountSid || "",
        twilioAuthToken: settings.twilioAuthToken || "",
        twilioPhoneNumber: settings.twilioPhoneNumber || ""
      });
    }
  }, [settings]);
  
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      if (settings) {
        return await apiRequest("PATCH", "/api/crm/settings", data);
      } else {
        return await apiRequest("POST", "/api/crm/settings", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/settings"] });
      toast({
        title: "Settings saved",
        description: "Your CRM settings have been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save CRM settings",
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          Twilio SMS Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Connect your Twilio account to send automated SMS messages through CRM automations
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Multi-tenant setup:</p>
            <p className="text-sm">Each business uses their own Twilio account. Your credentials are securely encrypted and stored.</p>
            <p className="text-sm">
              Don't have a Twilio account?{" "}
              <a 
                href="https://www.twilio.com/try-twilio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Sign up here
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Twilio Credentials</CardTitle>
          <CardDescription>
            Enter your Twilio credentials below. You can find these in your Twilio Console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="twilioAccountSid">Account SID</Label>
            <Input
              id="twilioAccountSid"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.twilioAccountSid}
              onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
              data-testid="input-twilio-sid"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your Twilio Account SID starts with "AC"
            </p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your Auth Token is encrypted before storage for security
            </p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Must be in E.164 format (e.g., +1234567890)
            </p>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={saveSettingsMutation.isPending}
              data-testid="button-save-twilio"
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveSettingsMutation.isPending ? "Saving..." : "Save Twilio Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Find Your Twilio Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
            <li>Log in to your <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twilio Console</a></li>
            <li>Your Account SID and Auth Token are displayed on the dashboard</li>
            <li>To get a phone number, go to Phone Numbers → Buy a Number</li>
            <li>Choose a number with SMS capabilities</li>
            <li>Copy your purchased phone number and paste it above</li>
          </ol>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
