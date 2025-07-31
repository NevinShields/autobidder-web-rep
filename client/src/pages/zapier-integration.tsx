import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Copy, Key, Trash2, ExternalLink, Zap, Info, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ZapierApiKey {
  id: number;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export default function ZapierIntegration() {
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ZapierApiKey[]>({
    queryKey: ['/api/zapier/api-keys'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/zapier/api-keys');
      const result = await response.json();
      return result.apiKeys || [];
    }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text has been copied to your clipboard.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Zapier Integration</h1>
            <p className="text-gray-600 dark:text-gray-400">Connect Autobidder to thousands of apps with Zapier</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="setup" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to connect Autobidder to Zapier and automate your workflows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                      <div>
                        <h4 className="font-medium">Create an API Key</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Generate an API key in the "API Keys" tab to authenticate your Zapier connection.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <h4 className="font-medium">Connect to Zapier</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use your API key to authenticate Autobidder in your Zapier workflows.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <h4 className="font-medium">Create Automations</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Set up triggers and actions to automate your business processes.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Triggers & Actions</CardTitle>
                  <CardDescription>
                    Here's what you can do with the Autobidder Zapier integration:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">Triggers (When this happens...)</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          New Lead Submitted
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          New Calculator Created
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400">Actions (Then do this...)</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Create New Lead
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Update Lead Status
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                      Manage your Zapier API keys for authentication
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowNewKeyForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New API Key
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedKey && (
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <strong>Your new API key:</strong>
                          <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                            {generatedKey}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generatedKey)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {showNewKeyForm && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Create New API Key</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="keyName">API Key Name</Label>
                          <Input
                            id="keyName"
                            placeholder="e.g., Zapier Integration"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => generateKeyMutation.mutate(newKeyName)}
                            disabled={!newKeyName.trim() || generateKeyMutation.isPending}
                          >
                            {generateKeyMutation.isPending ? "Generating..." : "Generate Key"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowNewKeyForm(false);
                              setNewKeyName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-3">
                    {isLoading ? (
                      <div className="text-center py-4">Loading API keys...</div>
                    ) : apiKeys.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No API keys found. Create your first API key to get started.
                      </div>
                    ) : (
                      apiKeys.map((key) => (
                        <Card key={key.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Key className="w-5 h-5 text-gray-400" />
                                <div>
                                  <div className="font-medium">{key.name}</div>
                                  <div className="text-sm text-gray-500">
                                    Created {formatDate(key.createdAt)}
                                    {key.lastUsed && ` • Last used ${formatDate(key.lastUsed)}`}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={key.isActive ? "default" : "secondary"}>
                                  {key.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deactivateKeyMutation.mutate(key.id)}
                                  disabled={deactivateKeyMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Endpoints</CardTitle>
                  <CardDescription>
                    These are the webhook URLs you can use in your Zapier workflows
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">Authentication Test</div>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                        GET {window.location.origin}/api/zapier/auth/test
                      </code>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">New Leads Trigger</div>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                        GET {window.location.origin}/api/zapier/triggers/new-leads
                      </code>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">New Calculators Trigger</div>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                        GET {window.location.origin}/api/zapier/triggers/new-calculators
                      </code>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">Create Lead Action</div>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                        POST {window.location.origin}/api/zapier/actions/create-lead
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('https://zapier.com', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Zapier
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('https://zapier.com/developer', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Zapier Developer Docs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Having trouble setting up your Zapier integration? Our support team is here to help.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}