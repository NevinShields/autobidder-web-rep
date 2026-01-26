import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Copy, Key, Trash2, ExternalLink, Zap, Info, Plus, Settings, MessageSquare, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

// Plans that have access to Zapier integration
const ZAPIER_ALLOWED_PLANS = ['trial', 'standard', 'plus', 'plus_seo'];

interface ZapierApiKey {
  id: number;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export default function IntegrationsPage() {
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showZapierDialog, setShowZapierDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check if user has access to Zapier
  const userPlan = user?.plan || 'free';
  const hasAccess = ZAPIER_ALLOWED_PLANS.includes(userPlan);

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ZapierApiKey[]>({
    queryKey: ['/api/zapier/api-keys'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/zapier/api-keys');
      const result = await response.json();
      return result.apiKeys || [];
    },
    enabled: hasAccess,
  });

  // Generate new API key
  const generateKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/zapier/api-keys', { name });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.apiKey.key);
      setNewKeyName("");
      setShowNewKeyForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/zapier/api-keys'] });
      toast({
        title: "API Key Generated",
        description: "Your new API key has been created. Make sure to copy it now - it won't be shown again.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate API key. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Deactivate API key
  const deactivateKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const response = await apiRequest('DELETE', `/api/zapier/api-keys/${keyId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zapier/api-keys'] });
      toast({
        title: "API Key Deactivated",
        description: "The API key has been deactivated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate API key. Please try again.",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} has been copied to your clipboard.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const serverUrl = window.location.origin;

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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Integrations</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Zapier and other integrations are not available on the free plan. Upgrade to automate your workflow.
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
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">
            Integrations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
            Connect Autobidder with your favorite tools and automate your workflow
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Zapier Integration Card */}
          <Card className="relative overflow-hidden border-2 hover:border-orange-200 dark:hover:border-orange-800 transition-colors group cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Zapier</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Available
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Connect to 5,000+ apps and automate your lead management workflow
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                  <strong>Triggers:</strong> New Lead
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                  <strong>Popular connections:</strong> Gmail, Slack, Google Sheets, HubSpot
                </div>
                
                <Dialog open={showZapierDialog} onOpenChange={setShowZapierDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        Zapier Integration Setup
                      </DialogTitle>
                      <DialogDescription>
                        Copy these credentials to connect your Autobidder account with Zapier
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Server URL */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Server URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={serverUrl}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(serverUrl, 'Server URL')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Use this URL when setting up your Zapier connection
                        </p>
                      </div>

                      <Separator />

                      {/* API Keys Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">API Keys</Label>
                          <Button
                            size="sm"
                            onClick={() => setShowNewKeyForm(true)}
                            disabled={generateKeyMutation.isPending}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            New Key
                          </Button>
                        </div>

                        {/* New Key Form */}
                        {showNewKeyForm && (
                          <Card className="border-dashed">
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="keyName" className="text-sm">Key Name</Label>
                                  <Input
                                    id="keyName"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="e.g., Zapier Integration"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => generateKeyMutation.mutate(newKeyName)}
                                    disabled={!newKeyName || generateKeyMutation.isPending}
                                  >
                                    {generateKeyMutation.isPending ? "Generating..." : "Generate"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowNewKeyForm(false)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Generated Key Display */}
                        {generatedKey && (
                          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Your new API key has been generated:
                                </p>
                                <div className="flex gap-2">
                                  <Input
                                    value={generatedKey}
                                    readOnly
                                    className="font-mono text-xs bg-white dark:bg-gray-800"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(generatedKey, 'API Key')}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  ⚠️ Copy this key now - it won't be shown again for security reasons.
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Existing API Keys */}
                        {isLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                          </div>
                        ) : apiKeys.length > 0 ? (
                          <div className="space-y-2">
                            {apiKeys.map((apiKey) => (
                              <div
                                key={apiKey.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{apiKey.name}</span>
                                    <Badge
                                      variant={apiKey.isActive ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {apiKey.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                    {apiKey.lastUsed && (
                                      <span className="ml-2">
                                        Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {apiKey.isActive && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deactivateKeyMutation.mutate(apiKey.id)}
                                    disabled={deactivateKeyMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No API keys created yet</p>
                            <p className="text-xs">Create one to start using Zapier integration</p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Instructions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Setup Instructions:</h4>
                        <ol className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 space-y-1 list-decimal list-inside">
                          <li>Copy the Server URL and API Key above</li>
                          <li>Go to <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Zapier.com</a> and search for "Autobidder"</li>
                          <li>Create a new Zap and select "Autobidder" as your trigger app</li>
                          <li>When prompted, enter your Server URL and API Key</li>
                          <li>Choose "New Lead" as your trigger event</li>
                          <li>Connect to your favorite apps like Gmail, Slack, or Google Sheets</li>
                        </ol>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Twilio Integration Card */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Twilio SMS</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Available
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Send automated SMS messages to leads and customers via your own Twilio account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                  <strong>Features:</strong> CRM automations, customer notifications
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                  <strong>Requirements:</strong> Your own Twilio account and credentials
                </div>
                
                <Link href="/crm/settings">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Twilio
                  </Button>
                </Link>

                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <p className="font-medium mb-1">Multi-tenant setup:</p>
                    <p>Each business uses their own Twilio account. Configure your Account SID, Auth Token, and Phone Number in CRM Settings.</p>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon Cards */}
          <Card className="relative overflow-hidden border-2 opacity-60">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-bl-full opacity-10"></div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Make (Integromat)</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Advanced automation platform for complex workflows
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                  Visual workflow builder with advanced logic
                </div>
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 opacity-60">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-bl-full opacity-10"></div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Webhooks</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Direct HTTP callbacks for custom integrations
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                  Real-time notifications to your custom endpoints
                </div>
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zapier Workflow Embed */}
        {user && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Create Your Workflows
              </CardTitle>
              <CardDescription>
                Build custom automations and connect Autobidder to your favorite apps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                dangerouslySetInnerHTML={{
                  __html: `
                    <zapier-workflow
                      sign-up-email="${user.email || ''}"
                      sign-up-first-name="${user.firstName || ''}"
                      sign-up-last-name="${user.lastName || ''}"
                      client-id="8Ua95Vw6WpfvB75NIP7XhuMfFzra060hX5RYGxi5"
                      theme="light"
                      intro-copy-display="hide"
                      manage-zaps-display="hide"
                      guess-zap-display="show"
                      app-search-bar-display="show"
                      template-ids=""
                      zap-create-from-scratch-display="hide"
                    ></zapier-workflow>
                  `
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
                Having trouble setting up an integration? We're here to help!
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" asChild>
                  <a href="/support" className="flex items-center gap-2">
                    Contact Support
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href="https://help.zapier.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Zapier Help Center
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}