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
  siteName?: string; // For backward compatibility
  site_domain: string | null;
  siteDomain?: string | null; // For backward compatibility
  preview_url: string;
  previewUrl?: string; // For backward compatibility
  status: 'active' | 'draft' | 'published';
  template_id?: string;
  templateId?: string; // For backward compatibility
  created_date: string;
  createdDate?: string; // For backward compatibility
  last_published?: string;
  lastPublished?: string; // For backward compatibility
  account_name?: string;
  accountName?: string; // For backward compatibility
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

interface DudaTemplateTag {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
}

interface DudaTemplateMetadata {
  id: number;
  templateId: string;
  templateName: string;
  isVisible: boolean;
  displayOrder: number;
  previewUrl?: string;
  thumbnailUrl?: string;
  desktopThumbnailUrl?: string;
  tabletThumbnailUrl?: string;
  mobileThumbnailUrl?: string;
  vertical?: string;
  templateType?: string;
  visibility?: string;
  canBuildFromUrl?: boolean;
  hasStore?: boolean;
  hasBlog?: boolean;
  hasNewFeatures?: boolean;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  tags: DudaTemplateTag[];
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
  const [selectedDudaTemplate, setSelectedDudaTemplate] = useState<DudaTemplateMetadata | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

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

  // Fetch Duda templates with tags
  const { data: dudaTemplates = [], isLoading: dudaTemplatesLoading } = useQuery<DudaTemplateMetadata[]>({
    queryKey: ['/api/duda-templates-with-tags'],
    enabled: !!user
  });

  // Fetch available template tags
  const { data: templateTags = [], isLoading: tagsLoading } = useQuery<DudaTemplateTag[]>({
    queryKey: ['/api/duda-template-tags'],
    enabled: !!user
  });

  // Filter Duda templates by selected tags
  const filteredDudaTemplates = dudaTemplates.filter((template: DudaTemplateMetadata) => {
    if (selectedTags.length === 0) return true;
    return selectedTags.some(tagId => 
      template.tags?.some(tag => tag.id === tagId)
    );
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
    onSuccess: (newWebsite) => {
      toast({
        title: "Website Created",
        description: "Your new website has been created successfully!"
      });
      setSelectedTemplate(null);
      setIsCreatingWebsite(false);
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
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
    onSuccess: (data: any) => {
      toast({
        title: "Website Published",
        description: `Your website is now live at ${data.domain}!`
      });
      refetchWebsites();
    },
    onError: (error: any) => {
      if (error.upgradeRequired) {
        toast({
          title: "Upgrade Required",
          description: "Publishing requires Professional plan. Please upgrade to continue.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Publishing Failed",
          description: error.message || "Failed to publish website",
          variant: "destructive"
        });
      }
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

  const handleCreateDudaWebsite = async (template: DudaTemplateMetadata) => {
    setSelectedDudaTemplate(template);
    setIsCreatingWebsite(true);
    createWebsiteMutation.mutate(template.templateId);
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
              {/* Duda Templates Section */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Professional Website Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Tag Filters */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Filter by Category:</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedTags.length === 0 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTags([])}
                        className="h-8"
                      >
                        All Templates
                      </Button>
                      {templateTags.map((tag) => (
                        <Button
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTagToggle(tag.id)}
                          className="h-8"
                          style={{
                            backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                            borderColor: tag.color,
                            color: selectedTags.includes(tag.id) ? 'white' : tag.color
                          }}
                        >
                          {tag.displayName}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Duda Templates Grid */}
                  {dudaTemplatesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : filteredDudaTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredDudaTemplates.map((template: DudaTemplateMetadata) => (
                        <Card key={template.templateId} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-video bg-gray-100 relative">
                            {template.thumbnailUrl ? (
                              <img
                                src={template.thumbnailUrl}
                                alt={template.templateName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                                <Monitor className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Template Features */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {template.hasStore && (
                                <Badge className="bg-green-600 text-white text-xs">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Store
                                </Badge>
                              )}
                              {template.hasBlog && (
                                <Badge className="bg-blue-600 text-white text-xs">
                                  <Type className="w-3 h-3 mr-1" />
                                  Blog
                                </Badge>
                              )}
                              {template.hasNewFeatures && (
                                <Badge className="bg-purple-600 text-white text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-2 line-clamp-2">{template.templateName}</h3>
                            
                            {/* Template Tags */}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {template.tags?.slice(0, 3).map((tag) => (
                                <Badge 
                                  key={tag.id}
                                  variant="secondary" 
                                  className="text-xs"
                                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                >
                                  {tag.displayName}
                                </Badge>
                              ))}
                              {template.tags?.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.tags.length - 3} more
                                </Badge>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCreateDudaWebsite(template)}
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
                        {selectedTags.length > 0 
                          ? "Try adjusting your filters or contact support for custom templates."
                          : "No templates are available at the moment. Contact support for assistance."
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Legacy Custom Templates Section (if any exist) */}
              {customTemplates.length > 0 && (
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Legacy Custom Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
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

                  {/* Templates Grid */}
                  {templatesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : customTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Badge className="absolute top-2 right-2 bg-blue-600">
                              {INDUSTRIES.find(ind => ind.value === template.industry)?.label || template.industry}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleCreateWebsite(template)}
                                disabled={isCreatingWebsite}
                                size="sm"
                                className="flex-1"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Create Site
                              </Button>
                              {template.previewUrl && (
                                <Button
                                  onClick={() => window.open(template.previewUrl, '_blank')}
                                  variant="outline"
                                  size="sm"
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
                      <p className="text-gray-600">
                        {selectedIndustry === 'all' 
                          ? 'No custom templates have been added yet.'
                          : `No templates available for ${INDUSTRIES.find(ind => ind.value === selectedIndustry)?.label}.`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Your Websites */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Your Websites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {websitesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : websites.length > 0 ? (
                    <div className="space-y-4">
                      {websites.map((website: Website) => (
                        <Card key={website.id || website.site_name} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{website.site_name || website.siteName}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                  <Badge 
                                    variant={website.status === 'published' ? 'default' : 'secondary'}
                                    className={website.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                                  >
                                    {website.status}
                                  </Badge>
                                  {(website.last_published || website.lastPublished) && (
                                    <span className="text-xs text-gray-500">
                                      Published {new Date(website.last_published || website.lastPublished!).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => window.open(website.preview_url || website.previewUrl, '_blank')}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => window.open(`https://editor.duda.co/home/site/${website.site_name || website.siteName}`, '_blank')}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {website.status !== 'published' && canPublishWebsite && (
                                  <Button
                                    onClick={() => handlePublishWebsite(website.site_name || website.siteName!)}
                                    disabled={publishWebsiteMutation.isPending}
                                    size="sm"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Publish
                                  </Button>
                                )}
                                {!canPublishWebsite && website.status !== 'published' && (
                                  <Button disabled size="sm" className="relative">
                                    <Crown className="w-4 h-4 mr-1" />
                                    Publish
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleDeleteWebsite(website.site_name || website.siteName!)}
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleteWebsiteMutation.isPending}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Websites Yet</h3>
                      <p className="text-gray-600">Create your first website using one of our custom templates.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Done for You Service */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-purple-900">
                    Done for You Website Service
                  </CardTitle>
                  <div className="text-3xl font-bold text-purple-900 mt-2">
                    $497
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Custom website design</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Professional copywriting</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Mobile optimization</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">SEO optimization</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Lead capture forms</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">7-day delivery</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => window.open('https://support.autobidder.org', '_blank')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                  
                  <p className="text-xs text-gray-600 text-center">
                    Let our experts build your website while you focus on your business
                  </p>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('https://support.autobidder.org', '_blank')}
                  >
                    <HeadphonesIcon className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('https://help.autobidder.org/website-builder', '_blank')}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Website Guide
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('https://help.autobidder.org/templates', '_blank')}
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Template Gallery
                  </Button>
                </CardContent>
              </Card>

              {/* Plan Information */}
              {!canPublishWebsite && (
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <Crown className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-yellow-900 mb-2">Upgrade to Publish</h3>
                    <p className="text-sm text-yellow-800 mb-4">
                      Publishing websites requires Professional plan or higher
                    </p>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      onClick={() => window.location.href = '/profile'}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}