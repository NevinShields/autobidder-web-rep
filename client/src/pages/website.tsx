import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Globe, 
  Edit, 
  ExternalLink, 
  Eye, 
  Monitor, 
  Type, 
  Crown, 
  Plus,
  Palette,
  Smartphone,
  Settings,
  Star,
  CheckCircle2,
  TrendingUp,
  Users,
  Zap,
  HeadphonesIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';

interface Website {
  id?: number;
  site_name: string;
  siteName?: string;
  site_domain: string | null;
  siteDomain?: string | null;
  preview_url: string;
  previewUrl?: string;
  status: 'active' | 'draft' | 'published';
  template_id?: string;
  templateId?: string;
  created_date: string;
  createdDate?: string;
  last_published?: string;
  lastPublished?: string;
  account_name?: string;
  accountName?: string;
}

interface CustomWebsiteTemplate {
  id: number;
  templateId: string;
  name: string;
  industry: string;
  previewUrl: string;
  thumbnailUrl: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

const INDUSTRIES = [
  { value: 'all', label: 'All Industries' },
  { value: 'construction', label: 'Construction' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'cleaning', label: 'Cleaning Services' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'home-services', label: 'Home Services' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'fitness', label: 'Fitness & Wellness' },
  { value: 'retail', label: 'Retail' },
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'education', label: 'Education' },
  { value: 'technology', label: 'Technology' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'financial', label: 'Financial Services' }
];

export default function Website() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingWebsite, setIsCreatingWebsite] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomWebsiteTemplate | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  // Check if user can publish websites (Professional plan or higher)
  const canPublishWebsite = (user as any)?.plan === 'professional' || (user as any)?.plan === 'enterprise';

  // Fetch existing websites
  const { data: websites = [], isLoading: websitesLoading, refetch: refetchWebsites } = useQuery<Website[]>({
    queryKey: ['/api/websites'],
    enabled: !!user
  });

  // Fetch custom website templates
  const { data: customTemplates = [], isLoading: templatesLoading } = useQuery<CustomWebsiteTemplate[]>({
    queryKey: ['/api/custom-website-templates', selectedIndustry],
    enabled: !!user
  });

  // Fetch Duda templates (the full template library)
  const { data: dudaTemplates = [], isLoading: dudaTemplatesLoading } = useQuery<any[]>({
    queryKey: ['/api/templates'],
    enabled: !!user
  });

  // Dashboard stats
  const websiteStats = {
    totalWebsites: websites.length,
    publishedWebsites: websites.filter((w: Website) => w.status === 'published').length,
    draftWebsites: websites.filter((w: Website) => w.status === 'draft').length,
  };

  // Create website mutation
  const createWebsiteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest('POST', '/api/websites', {
        template_id: templateId,
        description: `Website created from ${selectedTemplate?.name || 'custom template'}`
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Website Created",
        description: `Your website "${data.site_name}" has been created successfully`
      });
      refetchWebsites();
      setIsCreatingWebsite(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create website",
        variant: "destructive"
      });
      setIsCreatingWebsite(false);
    }
  });

  // Publish website mutation
  const publishWebsiteMutation = useMutation({
    mutationFn: async (siteName: string) => {
      return await apiRequest('POST', `/api/websites/${siteName}/publish`);
    },
    onSuccess: () => {
      toast({
        title: "Website Published",
        description: "Website has been published successfully"
      });
      refetchWebsites();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to publish website",
        variant: "destructive"
      });
    }
  });

  // Delete website mutation
  const deleteWebsiteMutation = useMutation({
    mutationFn: async (siteName: string) => {
      return await apiRequest('DELETE', `/api/websites/${siteName}`);
    },
    onSuccess: () => {
      toast({
        title: "Website Deleted",
        description: "Website has been deleted successfully"
      });
      refetchWebsites();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete website",
        variant: "destructive"
      });
    }
  });

  const handleCreateWebsite = async (template: CustomWebsiteTemplate) => {
    setSelectedTemplate(template);
    setIsCreatingWebsite(true);
    createWebsiteMutation.mutate(template.templateId);
  };

  const handlePublishWebsite = (siteName: string) => {
    publishWebsiteMutation.mutate(siteName);
  };

  const handleDeleteWebsite = (siteName: string) => {
    if (confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      deleteWebsiteMutation.mutate(siteName);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Website Builder</h1>
              <p className="text-gray-600 mt-1">Create professional websites with our custom templates</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.open('https://support.autobidder.org', '_blank')}
                variant="outline"
                size="sm"
              >
                <HeadphonesIcon className="w-4 h-4 mr-2" />
                Support
              </Button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Websites</p>
                    <p className="text-3xl font-bold text-gray-900">{websiteStats.totalWebsites}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Published</p>
                    <p className="text-3xl font-bold text-gray-900">{websiteStats.publishedWebsites}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Edit className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Drafts</p>
                    <p className="text-3xl font-bold text-gray-900">{websiteStats.draftWebsites}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Website Templates Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Custom Website Templates Section */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Professional Website Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <label className="text-sm font-medium text-gray-700">Filter by Industry:</label>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry.value} value={industry.value}>
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Templates Grid */}
                  {templatesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : customTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customTemplates.map((template: CustomWebsiteTemplate) => (
                        <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-video bg-gray-100 relative">
                            {template.thumbnailUrl ? (
                              <img
                                src={template.thumbnailUrl}
                                alt={template.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                                <Monitor className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Industry Badge */}
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-blue-600 text-white text-xs capitalize">
                                {template.industry}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-2 line-clamp-2">{template.name}</h3>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCreateWebsite(template)}
                                disabled={isCreatingWebsite}
                                className="flex-1"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Create Website
                              </Button>
                              {template.previewUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(template.previewUrl, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Monitor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                      <p className="text-gray-600">
                        {selectedIndustry !== 'all' 
                          ? "Try selecting a different industry or contact support for custom templates."
                          : "No templates are available at the moment. Contact support for assistance."
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Duda Template Library Section */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Template Library ({dudaTemplates.length} templates)
                  </CardTitle>
                  <p className="text-sm text-gray-600">Browse our full collection of professional website templates</p>
                </CardHeader>
                <CardContent>
                  {/* Duda Templates Grid */}
                  {dudaTemplatesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : dudaTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {dudaTemplates.map((template: any) => (
                        <Card key={template.template_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-video bg-gray-100 relative">
                            {template.thumbnail_url ? (
                              <img
                                src={template.thumbnail_url}
                                alt={template.template_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
                                <Monitor className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Template Type Badge */}
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-purple-600 text-white text-xs">
                                {template.template_properties?.type || 'Duda'}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-xs mb-2 line-clamp-2" title={template.template_name}>
                              {template.template_name}
                            </h3>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const customTemplate = {
                                    id: 0,
                                    templateId: template.template_id,
                                    name: template.template_name,
                                    industry: 'general',
                                    previewUrl: template.preview_url,
                                    thumbnailUrl: template.thumbnail_url,
                                    displayOrder: 0,
                                    status: 'active' as const,
                                    createdAt: '',
                                    updatedAt: ''
                                  };
                                  handleCreateWebsite(customTemplate);
                                }}
                                disabled={isCreatingWebsite}
                                className="flex-1 text-xs px-2 py-1"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Create
                              </Button>
                              {template.preview_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(template.preview_url, '_blank')}
                                  className="px-2 py-1"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No templates available</h3>
                      <p className="text-gray-600">Template library is currently being loaded.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Existing Websites */}
            <div className="space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Your Websites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {websitesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : websites.length > 0 ? (
                    <div className="space-y-3">
                      {websites.map((website: Website) => (
                        <Card key={website.site_name || website.siteName} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{website.site_name || website.siteName}</h4>
                            <Badge 
                              variant={website.status === 'published' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {website.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(website.preview_url || website.previewUrl, '_blank')}
                              className="flex-1"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            {website.status !== 'published' && canPublishWebsite && (
                              <Button
                                size="sm"
                                onClick={() => handlePublishWebsite(website.site_name || website.siteName!)}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Publish
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No websites yet</p>
                      <p className="text-xs text-gray-500">Create your first website using a template</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Done for You Service */}
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Crown className="w-5 h-5" />
                    Done for You Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-700 mb-4">
                    Need a custom website? Our experts will create a professional website tailored to your business.
                  </p>
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-purple-900">$497</div>
                    <div className="text-xs text-purple-600">One-time payment</div>
                  </div>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => window.open('https://support.autobidder.org', '_blank')}
                  >
                    <HeadphonesIcon className="w-4 h-4 mr-2" />
                    Contact Us
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}