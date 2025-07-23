import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Globe, 
  Plus, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Palette, 
  Layout, 
  Image,
  Type,
  Smartphone,
  Monitor,
  Crown,
  Lock
} from "lucide-react";

interface DudaWebsite {
  site_name: string;
  account_name: string;
  site_domain: string;
  preview_url: string;
  last_published?: string;
  created_date: string;
  status: 'active' | 'draft' | 'published';
  template_id?: string;
}

interface DudaTemplate {
  template_id: string;
  template_name: string;
  preview_url: string;
  thumbnail_url: string;
  desktop_thumbnail_url: string;
  tablet_thumbnail_url: string;
  mobile_thumbnail_url: string;
  template_properties: {
    can_build_from_url: boolean;
    has_store: boolean;
    has_blog: boolean;
    has_new_features: boolean;
    vertical: string;
    type: string;
    visibility: string;
  };
}

export default function Website() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [websiteDescription, setWebsiteDescription] = useState("");

  // Fetch user profile to get plan information
  const { data: userProfile } = useQuery<{ plan?: string }>({
    queryKey: ['/api/profile'],
  });

  // Website builder access - currently open to all users
  const hasWebsiteAccess = true; // Full access for now, will add plan restrictions later

  // Fetch websites from Duda API
  const { data: websites = [], isLoading, refetch } = useQuery<DudaWebsite[]>({
    queryKey: ['/api/websites'],
    enabled: hasWebsiteAccess,
  });

  // Fetch templates from Duda API
  const { data: dudaTemplates = [], isLoading: templatesLoading } = useQuery<DudaTemplate[]>({
    queryKey: ['/api/templates'],
    enabled: hasWebsiteAccess,
  });

  // Create website mutation
  const createWebsiteMutation = useMutation({
    mutationFn: async (data: { 
      description: string; 
      template_id?: string;
    }) => {
      return apiRequest('POST', '/api/websites', data);
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Website created successfully!", 
        description: `Duda account created for ${data.duda_user_email}` 
      });
      setIsCreateDialogOpen(false);
      setWebsiteDescription("");
      setSelectedTemplate("");
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating website", 
        description: error.message || "Please check your Duda API credentials",
        variant: "destructive" 
      });
    },
  });

  // Delete website mutation
  const deleteWebsiteMutation = useMutation({
    mutationFn: async (siteName: string) => {
      return apiRequest('DELETE', `/api/websites/${siteName}`);
    },
    onSuccess: () => {
      toast({ title: "Website deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting website", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleCreateWebsite = () => {
    if (!userProfile?.email) {
      toast({ 
        title: "Profile incomplete", 
        description: "Please update your profile with an email address",
        variant: "destructive" 
      });
      return;
    }

    createWebsiteMutation.mutate({
      description: websiteDescription,
      template_id: selectedTemplate || undefined
    });
  };

  const handleDeleteWebsite = (siteName: string) => {
    if (confirm(`Are you sure you want to delete the website "${siteName}"? This action cannot be undone.`)) {
      deleteWebsiteMutation.mutate(siteName);
    }
  };

  const openWebsiteEditor = (website: any) => {
    // Use SSO URL if available, otherwise use default editor URL
    const editorUrl = website.duda_sso_url || `https://editor.dudaone.com/home/site/${website.site_name}`;
    window.open(editorUrl, '_blank');
  };

  if (!hasWebsiteAccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 shadow-lg border">
              <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Website Builder</h1>
              <p className="text-xl text-gray-600 mb-8">
                Create and manage professional websites with our integrated Duda platform
              </p>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 mb-8">
                <Crown className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Upgrade to Access Website Builder
                </h2>
                <p className="text-gray-600 mb-6">
                  The website builder is available for Professional and Enterprise plan subscribers. 
                  Upgrade your plan to start creating beautiful, responsive websites.
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>Drag-and-drop website builder</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>Professional templates and themes</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>Mobile-responsive designs</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>Custom domain support</span>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                onClick={() => window.location.href = '/pricing'}
              >
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Globe className="h-8 w-8 text-blue-600" />
                Website Builder
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage professional websites with our integrated Duda platform
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Website
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Website</DialogTitle>
                  <p className="text-sm text-gray-600">
                    Create a professional website using your business information and choose from our template library.
                  </p>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Website Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-800">Website Name:</span>
                        <span className="font-medium text-blue-900">{userProfile?.organizationName || "Your Business Website"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Owner Email:</span>
                        <span className="font-medium text-blue-900">{userProfile?.email || "Not set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Owner Name:</span>
                        <span className="font-medium text-blue-900">
                          {userProfile?.firstName} {userProfile?.lastName}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="websiteDescription">Description (Optional)</Label>
                    <Textarea
                      id="websiteDescription"
                      placeholder="Brief description of your website"
                      value={websiteDescription}
                      onChange={(e) => setWebsiteDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template or start blank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blank">Blank Template</SelectItem>
                        {templatesLoading ? (
                          <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                        ) : (
                          dudaTemplates.map((template) => (
                            <SelectItem key={template.template_id} value={template.template_id}>
                              {template.template_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateWebsite}
                      disabled={createWebsiteMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {createWebsiteMutation.isPending ? "Creating..." : "Create Website"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="websites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="websites" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              My Websites
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Websites Tab */}
          <TabsContent value="websites" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : websites.length === 0 ? (
              <div className="text-center py-16">
                <Globe className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No websites yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first website to get started with our drag-and-drop builder
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Website
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websites.map((website) => (
                  <Card key={website.site_name} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {website.site_name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mb-2">
                            {website.site_domain}
                          </p>
                          <Badge 
                            variant={website.status === 'published' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {website.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="text-xs text-gray-500">
                          Created: {new Date(website.created_date).toLocaleDateString()}
                          {website.last_published && (
                            <div>Published: {new Date(website.last_published).toLocaleDateString()}</div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => openWebsiteEditor(website)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(website.preview_url, '_blank')}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(website.site_domain, '_blank')}
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visit Site
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteWebsite(website.site_name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteWebsiteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Website Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
{templatesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading templates from Duda...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dudaTemplates.map((template) => (
                      <Card key={template.template_id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                            {template.thumbnail_url ? (
                              <img 
                                src={template.thumbnail_url} 
                                alt={template.template_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                                <Layout className="h-8 w-8 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{template.template_name}</h3>
                          <div className="flex flex-wrap gap-1 mb-3">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {template.template_properties.vertical}
                            </Badge>
                            {template.template_properties.has_blog && (
                              <Badge variant="outline" className="text-xs">Blog</Badge>
                            )}
                            {template.template_properties.has_store && (
                              <Badge variant="outline" className="text-xs">Store</Badge>
                            )}
                            {template.template_properties.has_new_features && (
                              <Badge variant="outline" className="text-xs">New</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                setSelectedTemplate(template.template_id);
                                setIsCreateDialogOpen(true);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                            >
                              Use Template
                            </Button>
                            {template.preview_url && (
                              <Button 
                                onClick={() => window.open(template.preview_url, '_blank')}
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Website Builder Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Duda Integration</h3>
                  <p className="text-blue-800 text-sm">
                    Your website builder is powered by Duda's professional platform. 
                    All websites are automatically synced and managed through your Duda account.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Features Available</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700">Mobile-responsive design</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700">Desktop optimization</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Palette className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700">Custom styling options</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Type className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700">Rich content editing</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}