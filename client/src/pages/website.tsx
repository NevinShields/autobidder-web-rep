import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Edit, 
  ExternalLink, 
  Eye, 
  Monitor, 
  Type, 
  Lock, 
  Crown, 
  Plus,
  Palette,
  Smartphone,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';

interface Website {
  site_name: string;
  site_domain: string | null;
  site_default_domain: string;
  site_url: string;
  preview_site_url: string;
  publish_status: string;
  thumbnail_url?: string;
}

interface DudaTemplate {
  template_id: number;
  template_name: string;
  preview_url: string;
  thumbnail_url: string;
  desktop_thumbnail_url: string;
  tablet_thumbnail_url: string;
  mobile_thumbnail_url: string;
  template_properties: {
    can_build_from_url: boolean;
    promote_mobile_editor: boolean;
  };
}

export default function Website() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingWebsite, setIsCreatingWebsite] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DudaTemplate | null>(null);

  // Check if user can publish websites (Professional plan or higher)
  const canPublishWebsite = (user as any)?.plan === 'professional' || (user as any)?.plan === 'enterprise';

  // Fetch existing websites
  const { data: websites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ['/api/websites'],
    enabled: !!user
  });

  // Fetch available templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/duda/templates'],
    enabled: !!user
  });

  // Create website mutation
  const createWebsiteMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiRequest('POST', '/api/websites', {
        template_id: templateId,
        site_name: `${(user as any)?.email?.split('@')[0] || 'user'}-site`,
        user_email: (user as any)?.email,
        user_first_name: (user as any)?.firstName || 'User',
        user_last_name: (user as any)?.lastName || 'User'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
      setIsCreatingWebsite(false);
      setSelectedTemplate(null);
      toast({ title: 'Website created successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create website',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Publish website mutation
  const publishWebsiteMutation = useMutation({
    mutationFn: async (website: Website) => {
      const response = await apiRequest('POST', '/api/websites/publish', {
        site_name: website.site_name
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
      toast({ title: 'Website published successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to publish website',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const openWebsiteEditor = (website: Website) => {
    window.open(website.site_url, '_blank');
  };

  const handleCreateWebsite = (template: DudaTemplate) => {
    setSelectedTemplate(template);
    setIsCreatingWebsite(true);
    createWebsiteMutation.mutate(template.template_id);
  };

  const handlePublishWebsite = (website: Website) => {
    publishWebsiteMutation.mutate(website);
  };

  const handleUpgradeRequired = () => {
    toast({
      title: 'Upgrade Required',
      description: 'Publishing requires a Professional plan. Upgrade to publish your website.',
      variant: 'destructive'
    });
  };

  if (websitesLoading || templatesLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Builder</h1>
          <p className="text-gray-600">Create and manage professional websites with our powerful drag-and-drop builder.</p>
        </div>

        <Tabs defaultValue="my-websites" className="space-y-6">
          <TabsList className="bg-white shadow-sm border">
            <TabsTrigger value="my-websites" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              My Websites
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-websites" className="space-y-6">
            {(websites as Website[]).length === 0 ? (
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-blue-100 rounded-full mb-6">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No websites yet</h3>
                  <p className="text-gray-600 text-center mb-6 max-w-md">
                    Get started by creating your first professional website using our drag-and-drop builder.
                  </p>
                  <Button
                    onClick={() => (document.querySelector('[value="templates"]') as HTMLElement)?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Website
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {(websites as Website[]).map((website: Website, index: number) => (
                  <Card key={website.site_name} className={`shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-200 ${index === 0 ? 'lg:col-span-2 xl:col-span-2' : ''}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="truncate">{website.site_name}</span>
                          </CardTitle>
                          <p className="text-gray-600 truncate">
                            {website.site_domain || website.site_default_domain}
                          </p>
                        </div>
                        <Badge 
                          variant={website.publish_status === 'PUBLISHED' ? 'default' : 'secondary'}
                          className="ml-3 bg-green-100 text-green-800 border-green-200"
                        >
                          {website.publish_status === 'NOT_PUBLISHED_YET' ? 'Draft' : website.publish_status}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => openWebsiteEditor(website)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Website
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(website.preview_site_url, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden mb-6 border border-gray-200 shadow-inner">
                        {website.thumbnail_url ? (
                          <img 
                            src={website.thumbnail_url} 
                            alt="Website Screenshot"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${website.thumbnail_url ? 'hidden' : ''}`}>
                          <div className="text-center px-6">
                            <div className="p-4 bg-white rounded-full shadow-md mb-4 inline-block">
                              <Monitor className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-base font-medium text-gray-600 mb-1">Website Preview</p>
                            <p className="text-sm text-gray-500">Screenshot will appear once published</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-green-900">Status</span>
                          </div>
                          <p className="text-lg font-bold text-green-800 capitalize">
                            {website.publish_status === 'NOT_PUBLISHED_YET' ? 'Draft' : website.publish_status || 'Draft'}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">Views</span>
                          </div>
                          <p className="text-lg font-bold text-blue-800">-</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Type className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-900">Forms</span>
                          </div>
                          <p className="text-lg font-bold text-purple-800">0</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button 
                          variant="outline"
                          onClick={() => window.open(website.preview_site_url, '_blank')}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Site
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(website.preview_site_url || '');
                            toast({ title: "Link copied to clipboard!" });
                          }}
                          className="flex-1"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        {canPublishWebsite ? (
                          <Button 
                            onClick={() => handlePublishWebsite(website)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            disabled={publishWebsiteMutation.isPending}
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Publish Live
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            onClick={() => handleUpgradeRequired()}
                            className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Upgrade to Publish
                          </Button>
                        )}
                      </div>
                      
                      {!canPublishWebsite && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Crown className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-orange-800 mb-1">Publishing requires Professional plan</p>
                              <p className="text-sm text-orange-700">
                                Upgrade to the $97/month Professional plan to publish your website and make it live.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Palette className="h-5 w-5 text-blue-600" />
                  </div>
                  Choose a Template
                </CardTitle>
                <p className="text-gray-600">Select from professional templates to start building your website.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(templates as DudaTemplate[]).map((template: DudaTemplate) => (
                    <Card key={template.template_id} className="border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group">
                      <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                        <img
                          src={template.desktop_thumbnail_url || template.thumbnail_url}
                          alt={template.template_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                          <Button
                            onClick={() => handleCreateWebsite(template)}
                            disabled={isCreatingWebsite}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{template.template_name}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-4 w-4 text-green-600" />
                            <Monitor className="h-4 w-4 text-green-600" />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(template.preview_url, '_blank')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Website Builder Features</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}