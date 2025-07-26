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
import AppHeader from "@/components/app-header";
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
  site_default_domain?: string;
  preview_url: string;
  preview_site_url?: string;
  thumbnail_url?: string;
  last_published?: string;
  created_date: string;
  status: 'active' | 'draft' | 'published';
  publish_status?: string;
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
  const { data: userProfile } = useQuery<{ 
    plan?: string;
    id: string;
    email: string;
    organizationName?: string;
    firstName?: string;
    lastName?: string;
  }>({
    queryKey: ['/api/profile'],
  });

  // Check if user can publish websites (requires $97+ professional plan or enterprise)
  const canPublishWebsite = userProfile?.plan === 'professional' || userProfile?.plan === 'enterprise';
  
  // All users can access the website tab and edit sites
  const hasWebsiteAccess = true;

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
    // Open Duda editor in new tab  
    window.open(`https://editor.dudaone.com/home/site/${website.site_name}`, '_blank');
  };

  // Publish website mutation
  const publishWebsiteMutation = useMutation({
    mutationFn: async (website: any) => {
      return apiRequest('POST', `/api/websites/${website.site_name}/publish`);
    },
    onSuccess: () => {
      toast({ 
        title: "Website published successfully!", 
        description: "Your website is now live on mysite.autobidder.org" 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error publishing website", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handlePublishWebsite = (website: any) => {
    if (!canPublishWebsite) {
      handleUpgradeRequired();
      return;
    }
    
    if (confirm(`Are you sure you want to publish "${website.site_name}" live to the web?`)) {
      publishWebsiteMutation.mutate(website);
    }
  };

  const handleUpgradeRequired = () => {
    toast({
      title: "Professional plan required",
      description: "Publishing websites requires the $97/month Professional plan. Redirecting to pricing...",
      variant: "default"
    });
    
    setTimeout(() => {
      window.location.href = '/pricing';
    }, 2000);
  };

  if (!hasWebsiteAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AppHeader />
      <div className="p-3 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile Optimized */}
          <div className="mb-6">
            <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                Website Builder
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                Create and manage professional websites with our integrated Duda platform
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto text-sm sm:text-base">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Create Website
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] mx-4 my-8 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Create New Website</DialogTitle>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Create a professional website using your business information and choose from our template library.
                  </p>
                </DialogHeader>
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Website Details</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-800">Website Name:</span>
                        <span className="font-medium text-blue-900 truncate ml-2">{userProfile?.organizationName || "Your Business Website"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Owner Email:</span>
                        <span className="font-medium text-blue-900 truncate ml-2">{userProfile?.email || "Not set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Owner Name:</span>
                        <span className="font-medium text-blue-900 truncate ml-2">
                          {userProfile?.firstName} {userProfile?.lastName}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="websiteDescription" className="text-sm">Description (Optional)</Label>
                    <Textarea
                      id="websiteDescription"
                      placeholder="Brief description of your website"
                      value={websiteDescription}
                      onChange={(e) => setWebsiteDescription(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template" className="text-sm">Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="text-sm">
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

                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="text-sm order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateWebsite}
                      disabled={createWebsiteMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm order-1 sm:order-2"
                    >
                      {createWebsiteMutation.isPending ? "Creating..." : "Create Website"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

        {/* Tabs - Mobile Optimized */}
        <Tabs defaultValue="websites" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="websites" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Layout className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">My </span>Websites
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Image className="h-3 w-3 sm:h-4 sm:w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Websites Tab */}
          <TabsContent value="websites" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    </CardContent>
                  </Card>
                </div>
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
              <div className="space-y-6">
                {/* Mobile-Optimized Main Website Dashboard */}
                <div className="space-y-4">
                  {/* Featured Website Screenshot */}
                  <Card className="shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                              <span className="truncate">{websites[0]?.site_name || 'Your Website'}</span>
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {websites[0]?.site_domain || websites[0]?.site_default_domain}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button
                            size="sm"
                            onClick={() => openWebsiteEditor(websites[0])}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Edit Site
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(websites[0]?.preview_site_url, '_blank')}
                            className="flex-1 text-xs sm:text-sm"
                          >
                            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            View Live
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      {/* Website Screenshot */}
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 border">
                        {websites[0]?.thumbnail_url ? (
                          <img 
                            src={websites[0].thumbnail_url} 
                            alt="Website Screenshot"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${websites[0]?.thumbnail_url ? 'hidden' : ''}`}>
                          <div className="text-center px-4">
                            <Monitor className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm sm:text-base text-gray-500">Website Preview</p>
                            <p className="text-xs sm:text-sm text-gray-400">Screenshot will appear here once published</p>
                          </div>
                        </div>
                      </div>

                      {/* Website Stats Row - Mobile Optimized */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <div className="bg-green-50 rounded-lg p-2 sm:p-4 border border-green-200">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs sm:text-sm font-medium text-green-900">Status</span>
                          </div>
                          <p className="text-sm sm:text-lg font-bold text-green-800 capitalize leading-tight">
                            {websites[0]?.publish_status === 'NOT_PUBLISHED_YET' ? 'Draft' : websites[0]?.publish_status || 'Draft'}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 sm:p-4 border border-blue-200">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium text-blue-900">Views</span>
                          </div>
                          <p className="text-sm sm:text-lg font-bold text-blue-800">-</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 sm:p-4 border border-purple-200">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                            <Type className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                            <span className="text-xs sm:text-sm font-medium text-purple-900">Forms</span>
                          </div>
                          <p className="text-sm sm:text-lg font-bold text-purple-800">0</p>
                        </div>
                      </div>

                      {/* Quick Actions - Mobile Optimized */}
                      <div className="pt-3 border-t">
                        <div className="grid grid-cols-3 gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(websites[0]?.preview_site_url, '_blank')}
                            className="text-xs p-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(websites[0]?.preview_site_url || '')}
                            className="text-xs p-2"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          {canPublishWebsite ? (
                            <Button 
                              size="sm" 
                              onClick={() => handlePublishWebsite(websites[0])}
                              className="text-xs p-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Globe className="h-3 w-3 mr-1" />
                              Publish
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpgradeRequired()}
                              className="text-xs p-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Upgrade
                            </Button>
                          )}
                        </div>
                        
                        {/* Plan Restriction Notice for Publishing */}
                        {!canPublishWebsite && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Crown className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-orange-800">Publishing requires Professional plan</p>
                                <p className="text-xs text-orange-700 mt-1">
                                  Upgrade to the $97/month Professional plan to publish your website and make it live to the world.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs p-2"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Settings
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Websites - Mobile Optimized */}
                  {websites.length > 1 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg font-semibold">Other Websites</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6">
                        <div className="space-y-3">
                          {websites.slice(1).map((website, index) => (
                            <div key={website.site_name} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-gray-900 truncate">{website.site_name}</h4>
                                  <p className="text-xs text-gray-600 truncate">{website.site_domain || website.site_default_domain}</p>
                                </div>
                                <Badge 
                                  variant={website.publish_status === 'PUBLISHED' ? 'default' : 'secondary'}
                                  className="text-xs ml-2 flex-shrink-0"
                                >
                                  {website.publish_status === 'NOT_PUBLISHED_YET' ? 'Draft' : website.publish_status}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openWebsiteEditor(website)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(website.preview_site_url, '_blank')}
                                  className="px-3"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {canPublishWebsite ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePublishWebsite(website)}
                                    className="px-3 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Globe className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpgradeRequired()}
                                    className="px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                                  >
                                    <Lock className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Mobile Stacked Analytics and Form Responses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Website Analytics Card - Mobile Optimized */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Settings className="h-4 w-4 text-gray-600" />
                          Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Total Visits</span>
                            <span className="text-sm font-medium">-</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">This Month</span>
                            <span className="text-sm font-medium">-</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Bounce Rate</span>
                            <span className="text-sm font-medium">-</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500">
                            Analytics data will appear after your website is published.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Form Responses Card - Mobile Optimized */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Type className="h-4 w-4 text-gray-600" />
                          Form Responses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6">
                        <div className="space-y-3">
                          <div className="text-center py-4">
                            <Type className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 mb-1">No responses yet</p>
                            <p className="text-xs text-gray-500">
                              Form submissions will appear here
                            </p>
                          </div>

                          <div className="pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-xs"
                              disabled
                            >
                              View All Responses
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions Card - Mobile Optimized */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full justify-start text-xs sm:text-sm"
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Create New Website
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full justify-start text-xs sm:text-sm"
                        onClick={() => window.open('https://help.dudaone.com/', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Help & Support
                      </Button>
                    </CardContent>
                  </Card>
                </div>
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
    </div>
  );
}