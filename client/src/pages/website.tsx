import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  HeadphonesIcon,
  Filter,
  X,
  Mail,
  AlertCircle,
  Trash2
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



export default function Website() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingWebsite, setIsCreatingWebsite] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedIndustryTags, setSelectedIndustryTags] = useState<number[]>([]);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [templateToCreate, setTemplateToCreate] = useState<any>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [welcomeLink, setWelcomeLink] = useState<string | null>(null);

  // Check if user can publish websites ($97 Plus or $297 Plus SEO plan)
  const canPublishWebsite = (user as any)?.plan === 'plus' || (user as any)?.plan === 'plusSeo';
  const needsUpgradeForPublishing = (user as any)?.plan === 'standard';

  // Fetch existing websites
  const { data: websites = [], isLoading: websitesLoading, refetch: refetchWebsites } = useQuery<Website[]>({
    queryKey: ['/api/websites'],
    enabled: !!user
  });

  // Fetch template tags for filtering
  const { data: templateTags = [] } = useQuery<any[]>({
    queryKey: ['/api/duda-template-tags'],
    enabled: !!user
  });

  // Fetch website templates with optional tag filtering
  const { data: websiteTemplates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ['/api/duda-templates', selectedIndustryTags.join(',')],
    queryFn: async () => {
      const tagsParam = selectedIndustryTags.length > 0 ? `?tags=${selectedIndustryTags.join(',')}` : '';
      const response = await fetch(`/api/duda-templates${tagsParam}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
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
      console.log('Making API request to create website...');
      const response = await apiRequest('POST', '/api/websites', {
        template_id: templateId,
        description: `Website created from ${selectedTemplate?.name || 'custom template'}`
      });
      console.log('Raw API response received:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Website created successfully:', data);
      console.log('Welcome link in response:', data.welcome_link);
      console.log('Activation link in response:', data.activation_link);
      console.log('Full response keys:', Object.keys(data));
      
      // Store the welcome link for the dialog button
      setWelcomeLink(data.welcome_link || data.activation_link || null);
      
      refetchWebsites();
      setIsCreatingWebsite(false);
      setSelectedTemplate(null);
      setConfirmationDialogOpen(false);
      setShowSuccessDialog(true);
      
      // Automatically open the appropriate Duda link in a new tab
      // Prioritize welcome link (for password setup) over activation link (for immediate access)
      if (data.welcome_link) {
        console.log('Opening Duda welcome link for password setup:', data.welcome_link);
        window.open(data.welcome_link, '_blank', 'noopener,noreferrer');
      } else if (data.activation_link) {
        console.log('Opening Duda activation link (fallback):', data.activation_link);
        window.open(data.activation_link, '_blank', 'noopener,noreferrer');
      } else {
        console.log('No links found in response data');
      }
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

  const handleCreateWebsite = async (template: any) => {
    setSelectedTemplate(template);
    setIsCreatingWebsite(true);
    createWebsiteMutation.mutate(template.templateId);
  };

  const confirmCreateWebsite = () => {
    if (templateToCreate) {
      handleCreateWebsite(templateToCreate);
    }
  };

  const handlePublishWebsite = (siteName: string) => {
    if (needsUpgradeForPublishing) {
      setShowUpgradeDialog(true);
      return;
    }
    publishWebsiteMutation.mutate(siteName);
  };

  const handleDeleteWebsite = (siteName: string) => {
    if (confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
      deleteWebsiteMutation.mutate(siteName);
    }
  };

  // Check if user already has a website
  const hasExistingWebsite = websites && websites.length > 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {hasExistingWebsite ? 'Your Website' : 'Website Builder'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {hasExistingWebsite 
                  ? 'Manage and customize your professional website'
                  : 'Create professional websites with our custom templates'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.open('https://support.autobidder.org', '_blank')}
                variant="outline"
                size="sm"
                className="px-3 py-2"
              >
                <HeadphonesIcon className="w-3 w-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Support</span>
              </Button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Globe className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Total Websites</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{websiteStats.totalWebsites}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Published</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{websiteStats.publishedWebsites}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                    <Edit className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Drafts</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{websiteStats.draftWebsites}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Show different content based on whether user has a website */}
          {hasExistingWebsite ? (
            /* User has a website - show website management interface */
            <div className="space-y-6">
              {/* Website Details */}
              {websites.map((website: Website) => (
                <Card key={website.id || website.siteName} className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      {website.siteName || website.site_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">Your professional website</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Website URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={`https://mysite.autobidder.org/preview/${website.siteName || website.site_name}`}
                            readOnly
                            className="bg-gray-50"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://mysite.autobidder.org/preview/${website.siteName || website.site_name}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Site ID</Label>
                        <div className="mt-1">
                          <Input
                            value={website.siteName || website.site_name}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <div className="mt-1">
                          <Badge variant={website.status === 'published' ? 'default' : 'secondary'}>
                            {website.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(website.createdDate || website.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button
                        onClick={async () => {
                          try {
                            console.log('Requesting editor link for site:', website.siteName || website.site_name);
                            const response = await apiRequest('GET', `/api/websites/${website.siteName || website.site_name}/editor-link`);
                            console.log('Editor link response:', response);
                            if (response.editor_link) {
                              window.open(response.editor_link, '_blank', 'noopener,noreferrer');
                            } else {
                              throw new Error('No editor link received');
                            }
                          } catch (error) {
                            console.error('Error getting editor link:', error);
                            toast({
                              title: "Error",
                              description: "Could not open website editor. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                        variant="default"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        data-testid="button-edit-website"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Edit Website</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(website.previewUrl || website.preview_url, '_blank')}
                        className="flex-1 sm:flex-none"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Preview</span>
                      </Button>
                      <Button
                        onClick={() => handlePublishWebsite(website.siteName || website.site_name)}
                        disabled={publishWebsiteMutation.isPending}
                        variant={needsUpgradeForPublishing ? "outline" : "secondary"}
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">{website.status === 'published' ? 'Republish' : 'Publish'} Website</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteWebsite(website.siteName || website.site_name)}
                        disabled={deleteWebsiteMutation.isPending}
                        className="flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Delete</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* User doesn't have a website - show template selection */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Website Templates Section */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Duda Template Library Section */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Template Library ({websiteTemplates.length} templates)
                  </CardTitle>
                  <p className="text-sm text-gray-600">Browse our full collection of professional website templates</p>
                  
                  {/* Industry Filter */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
                      <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Filter by Industry:</span>
                      <span className="sm:hidden">Filter:</span>
                    </div>
                    {templateTags.filter((tag: any) => tag.isActive).map((tag: any) => (
                      <Badge
                        key={tag.id}
                        variant={selectedIndustryTags.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        style={{
                          backgroundColor: selectedIndustryTags.includes(tag.id) ? tag.color : 'transparent',
                          borderColor: tag.color,
                          color: selectedIndustryTags.includes(tag.id) ? 'white' : tag.color
                        }}
                        onClick={() => {
                          setSelectedIndustryTags(prev => 
                            prev.includes(tag.id) 
                              ? prev.filter(id => id !== tag.id)
                              : [...prev, tag.id]
                          );
                        }}
                      >
                        {tag.displayName}
                        {selectedIndustryTags.includes(tag.id) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                    {selectedIndustryTags.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIndustryTags([])}
                        className="text-xs px-2 py-1 h-6"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Website Templates Grid */}
                  {templatesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 sm:h-56 lg:h-64 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : websiteTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                      {websiteTemplates.map((template: any) => (
                        <Card key={template.templateId || template.template_id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                          <div className="aspect-[4/3] sm:aspect-video bg-gray-100 relative">
                            {template.thumbnailUrl || template.thumbnail_url ? (
                              <img
                                src={template.thumbnailUrl || template.thumbnail_url}
                                alt={template.templateName || template.template_name}
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
                                {template.template_properties?.type || 'Premium'}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="p-3 sm:p-4">
                            <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2" title={template.templateName || template.template_name}>
                              {template.templateName || template.template_name}
                            </h3>
                            
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const customTemplate = {
                                    id: 0,
                                    templateId: template.templateId || template.template_id,
                                    name: template.templateName || template.template_name,
                                    industry: 'general',
                                    previewUrl: template.previewUrl || template.preview_url,
                                    thumbnailUrl: template.thumbnailUrl || template.thumbnail_url,
                                    displayOrder: 0,
                                    status: 'active' as const,
                                    createdAt: '',
                                    updatedAt: ''
                                  };
                                  setTemplateToCreate(customTemplate);
                                  setConfirmationDialogOpen(true);
                                }}
                                disabled={isCreatingWebsite}
                                className="flex-1 text-xs px-2 py-1 h-8"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Create</span>
                                <span className="sm:hidden">Use</span>
                              </Button>
                              {(template.previewUrl || template.preview_url) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(template.previewUrl || template.preview_url, '_blank')}
                                  className="px-2 py-1 h-8 flex-shrink-0"
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
            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                    Your Websites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {websitesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 sm:h-20 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : websites.length > 0 ? (
                    <div className="space-y-3">
                      {websites.map((website: Website) => (
                        <Card key={website.site_name || website.siteName} className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-xs sm:text-sm truncate flex-1 mr-2">{website.site_name || website.siteName}</h4>
                            <Badge 
                              variant={website.status === 'published' ? 'default' : 'secondary'}
                              className="text-xs flex-shrink-0"
                            >
                              {website.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(website.preview_url || website.previewUrl, '_blank')}
                              className="flex-1 text-xs px-2 py-1 h-7 sm:h-8"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            {website.status !== 'published' && canPublishWebsite && (
                              <Button
                                size="sm"
                                onClick={() => handlePublishWebsite(website.site_name || website.siteName!)}
                                className="flex-1 text-xs px-2 py-1 h-7 sm:h-8"
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
                    <div className="text-center py-6 sm:py-8">
                      <Globe className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-gray-600">No websites yet</p>
                      <p className="text-xs text-gray-500 mt-1">Create your first website using a template</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Done for You Service */}
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900 text-sm sm:text-base">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                    Done for You Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-purple-700 mb-3 sm:mb-4">
                    Need a custom website? Our experts will create a professional website tailored to your business.
                  </p>
                  <div className="text-center mb-3 sm:mb-4">
                    <div className="text-xl sm:text-2xl font-bold text-purple-900">$497</div>
                    <div className="text-xs text-purple-600">One-time payment</div>
                  </div>
                  <Link href="/dfy-services">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 h-8 sm:h-10 text-xs sm:text-sm">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Browse Services
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Confirm Website Creation
            </DialogTitle>
            <DialogDescription>
              You're about to create a new website using the "{templateToCreate?.name}" template.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {templateToCreate?.thumbnailUrl && (
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={templateToCreate.thumbnailUrl}
                  alt={templateToCreate.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="text-sm text-gray-600">
              <p>This will create a new website in your account. You'll receive an email with activation instructions once the website is ready.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmationDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmCreateWebsite}
                disabled={isCreatingWebsite}
                className="flex-1"
              >
                {isCreatingWebsite ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Website
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Website Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your website has been created and is being set up.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-gray-900">Website Created Successfully!</h3>
              <p className="text-sm text-gray-600">
                Your website is ready! Click the button below to set up your password and start editing.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  // Try to get the welcome link from the stored state or fallback to editor
                  const linkToOpen = welcomeLink || `https://editor.dudamobile.com/home/site/`;
                  console.log('Opening link from button:', linkToOpen);
                  window.open(linkToOpen, '_blank', 'noopener,noreferrer');
                  setShowSuccessDialog(false);
                }}
                className="flex-1"
                data-testid="button-open-editor"
              >
                <Edit className="w-4 h-4 mr-2" />
                Open Editor
              </Button>
              <Button
                onClick={() => setShowSuccessDialog(false)}
                variant="outline"
                className="flex-1"
                data-testid="button-close-dialog"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              Upgrade Required to Publish
            </DialogTitle>
            <DialogDescription>
              Publishing your website requires a Plus Plan ($97) or Plus SEO ($297) subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-gray-900">Ready to Go Live?</h3>
              <p className="text-sm text-gray-600">
                Upgrade to publish your website and connect your custom domain name.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Plus Plan:</span>
                  <span className="font-semibold text-gray-900">$97/month</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Plus SEO:</span>
                  <span className="font-semibold text-gray-900">$297/month</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowUpgradeDialog(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => {
                  setShowUpgradeDialog(false);
                  window.open('/settings/subscription', '_blank');
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}