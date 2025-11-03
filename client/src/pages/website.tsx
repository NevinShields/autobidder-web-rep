import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import type { SeoCycle, SeoTask, SeoContentIdea, SeoSetupChecklistItem } from '@shared/schema';
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
  Trash2,
  KeyRound,
  Calendar,
  Clock,
  FileText,
  Facebook,
  MapPin,
  Target,
  Sparkles,
  History
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';
import SupportContact from '@/components/support-contact';

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
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);

  // SEO Tracker state
  const [selectedTask, setSelectedTask] = useState<SeoTask | null>(null);
  const [proofLink, setProofLink] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [selectedHistoryCycle, setSelectedHistoryCycle] = useState<SeoCycle | null>(null);

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

  // SEO Tracker queries
  const { data: currentCycle, isLoading: cycleLoading } = useQuery<SeoCycle>({
    queryKey: ['/api/seo/current-cycle'],
    enabled: !!user
  });

  const { data: seoTasks = [], isLoading: tasksLoading } = useQuery<SeoTask[]>({
    queryKey: ['/api/seo/tasks', currentCycle?.id],
    enabled: !!currentCycle?.id,
  });

  const { data: contentIdeas = [] } = useQuery<SeoContentIdea[]>({
    queryKey: ['/api/seo/content-ideas'],
    enabled: !!user
  });

  const { data: cycleHistory = [] } = useQuery<SeoCycle[]>({
    queryKey: ['/api/seo/cycles/history'],
    enabled: !!user
  });

  const { data: historyTasks = [] } = useQuery<SeoTask[]>({
    queryKey: ['/api/seo/tasks', selectedHistoryCycle?.id],
    enabled: !!selectedHistoryCycle?.id,
  });

  // SEO Setup Checklist query
  const { data: setupChecklistItems = [] } = useQuery<SeoSetupChecklistItem[]>({
    queryKey: ['/api/seo/setup-checklist'],
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
    mutationFn: async (templateId: string): Promise<any> => {
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
      console.log('Activation link in response:', data.activation_link);
      console.log('Welcome link in response:', data.welcome_link);
      console.log('Activation email sent:', data.activation_email_sent);
      console.log('Full response keys:', Object.keys(data));
      
      // Store the activation link and email status for the dialog
      setWelcomeLink(data.activation_link || data.welcome_link || null);
      setWelcomeEmailSent(data.activation_email_sent || false);
      
      refetchWebsites();
      setIsCreatingWebsite(false);
      setSelectedTemplate(null);
      setConfirmationDialogOpen(false);
      setShowSuccessDialog(true);
      
      // Automatically open the activation link in a new tab for immediate access
      if (data.activation_link) {
        console.log('Opening Duda activation link for immediate access:', data.activation_link);
        window.open(data.activation_link, '_blank', 'noopener,noreferrer');
      } else if (data.welcome_link) {
        console.log('Opening Duda welcome link (fallback):', data.welcome_link);
        window.open(data.welcome_link, '_blank', 'noopener,noreferrer');
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

  // Reset website password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (siteName: string) => {
      return await apiRequest('POST', `/api/websites/${siteName}/reset-password`);
    },
    onSuccess: (data: any) => {
      console.log('Reset password response data:', data);
      console.log('Data keys:', Object.keys(data));
      console.log('Reset link value:', data.reset_link);
      
      if (data.reset_link) {
        console.log('Opening reset password link:', data.reset_link);
        window.open(data.reset_link, '_blank', 'noopener,noreferrer');
        toast({
          title: "Password Reset",
          description: "Opening password reset link...",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "No reset link received from server",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
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

  // SEO Tracker mutations
  const startCycleMutation = useMutation({
    mutationFn: async (keywords: string[]) => {
      const response = await apiRequest("POST", "/api/seo/cycles/start", { keywords });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/current-cycle'] });
      toast({ title: "Success", description: "New SEO cycle started!" });
      setNewKeywords("");
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, proofLink }: { taskId: number; proofLink: string }) => {
      const response = await apiRequest("PATCH", `/api/seo/tasks/${taskId}/complete`, { proofLink });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seo/current-cycle'] });
      toast({ title: "Success", description: "Task marked as complete!" });
      setSelectedTask(null);
      setProofLink("");
    },
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await apiRequest("POST", "/api/seo/content-ideas/generate", { keyword });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/content-ideas'] });
      toast({ title: "Success", description: "Content ideas generated!" });
    },
  });

  const initializeChecklistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/seo/setup-checklist/initialize", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/setup-checklist'] });
      toast({ title: "Success", description: "SEO Setup Checklist initialized!" });
    },
  });

  const toggleChecklistItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiRequest("PATCH", `/api/seo/setup-checklist/${itemId}/toggle`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/setup-checklist'] });
    },
  });

  // SEO Helper functions
  const TASK_WEIGHTS = {
    blog: { total: 3, weight: 30 },
    gmb: { total: 3, weight: 25 },
    facebook: { total: 3, weight: 15 },
    location: { total: 10, weight: 30 },
  };

  const getTaskCounts = (type: string) => {
    const completed = seoTasks.filter(t => t.type === type && t.isCompleted).length;
    const total = TASK_WEIGHTS[type as keyof typeof TASK_WEIGHTS].total;
    return { completed, total };
  };

  const getDaysLeft = () => {
    if (!currentCycle) return 0;
    const end = new Date(currentCycle.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isCycleExpired = () => {
    if (!currentCycle) return false;
    const end = new Date(currentCycle.endDate);
    const now = new Date();
    return now > end;
  };

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
              <SupportContact 
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 py-2"
                    data-testid="button-support"
                  >
                    <HeadphonesIcon className="w-3 w-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Support</span>
                  </Button>
                }
              />
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

          {/* Tabs for Websites and SEO Tracker */}
          <Tabs defaultValue="websites" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="websites" data-testid="tab-websites">
                <Globe className="w-4 h-4 mr-2" />
                Websites
              </TabsTrigger>
              <TabsTrigger value="seo" data-testid="tab-seo">
                <TrendingUp className="w-4 h-4 mr-2" />
                SEO Tracker
              </TabsTrigger>
            </TabsList>

            <TabsContent value="websites" className="space-y-6">
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
                        onClick={() => {
                          const editorLink = `https://mysite.autobidder.org/`;
                          console.log('Opening editor link:', editorLink);
                          window.open(editorLink, '_blank', 'noopener,noreferrer');
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
{/* Reset Password button temporarily hidden */}
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
            </TabsContent>

            {/* SEO Tracker Tab */}
            <TabsContent value="seo" className="space-y-6">
              {(!currentCycle || isCycleExpired()) ? (
                <div className="space-y-6">
                  {isCycleExpired() && currentCycle && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader>
                        <CardTitle className="text-xl">Previous Cycle Completed</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Keywords:</span>
                          <div className="flex flex-wrap gap-2">
                            {currentCycle.keywords.map((keyword, i) => (
                              <Badge key={i} variant="secondary">{keyword}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Completion:</span>
                          <Badge variant={currentCycle.completionPercentage === 100 ? "default" : "outline"}>
                            {currentCycle.completionPercentage}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Period:</span>
                          <span className="text-sm text-gray-600">
                            {new Date(currentCycle.startDate).toLocaleDateString()} - {new Date(currentCycle.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card className="text-center">
                    <CardHeader>
                      <CardTitle className="text-3xl">
                        {currentCycle && isCycleExpired() ? 'Start Your Next SEO Cycle' : 'Start Your SEO Journey'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-gray-600">
                        {currentCycle && isCycleExpired()
                          ? 'Great work! Ready to begin another 30-day cycle with new keywords?' 
                          : 'Begin your 30-day SEO cycle and track your progress toward better search rankings!'}
                      </p>
                      <div className="space-y-4">
                        <Label htmlFor="keywords">Enter your target keywords (comma-separated)</Label>
                        <Input
                          id="keywords"
                          data-testid="input-keywords"
                          placeholder="e.g., plumbing services, emergency plumber, local plumber"
                          value={newKeywords}
                          onChange={(e) => setNewKeywords(e.target.value)}
                        />
                        <Button
                          data-testid="button-start-cycle"
                          size="lg"
                          onClick={() => {
                            const keywords = newKeywords.split(',').map(k => k.trim()).filter(Boolean);
                            if (keywords.length === 0) {
                              toast({ title: "Error", description: "Please enter at least one keyword", variant: "destructive" });
                              return;
                            }
                            startCycleMutation.mutate(keywords);
                          }}
                          disabled={startCycleMutation.isPending}
                        >
                          <Target className="w-5 h-5 mr-2" />
                          {currentCycle && isCycleExpired() ? 'Start Next Cycle' : 'Start 30-Day Cycle'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">SEO Tracker</h2>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      <Clock className="w-4 h-4 mr-2" />
                      {getDaysLeft()} days left
                    </Badge>
                  </div>

                  <Tabs defaultValue="dashboard" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="dashboard">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Dashboard
                      </TabsTrigger>
                      <TabsTrigger value="setup">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Setup Checklist
                      </TabsTrigger>
                      <TabsTrigger value="ideas">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Content Ideas
                      </TabsTrigger>
                      <TabsTrigger value="history">
                        <History className="w-4 h-4 mr-2" />
                        History
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Monthly Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Overall Completion</span>
                              <span className="font-semibold">{currentCycle.completionPercentage}%</span>
                            </div>
                            <Progress value={currentCycle.completionPercentage} className="h-3" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentCycle.keywords.map((keyword, i) => (
                              <Badge key={i} variant="secondary">{keyword}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tasks Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Blog Posts */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                Blog Posts
                              </CardTitle>
                              <Badge>
                                {getTaskCounts('blog').completed}/{getTaskCounts('blog').total}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Progress 
                                value={(getTaskCounts('blog').completed / getTaskCounts('blog').total) * 100} 
                                className="h-2"
                              />
                              <div className="space-y-2 mt-4">
                                {seoTasks.filter(t => t.type === 'blog').map((task) => (
                                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      {task.isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                      )}
                                      <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                                        {task.title || `Blog Post ${seoTasks.filter(t => t.type === 'blog').indexOf(task) + 1}`}
                                      </span>
                                    </div>
                                    {!task.isCompleted && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        data-testid={`button-complete-blog-${task.id}`}
                                        onClick={() => setSelectedTask(task)}
                                      >
                                        Complete
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* GMB Posts */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-500" />
                                Google Business Posts
                              </CardTitle>
                              <Badge>
                                {getTaskCounts('gmb').completed}/{getTaskCounts('gmb').total}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Progress 
                                value={(getTaskCounts('gmb').completed / getTaskCounts('gmb').total) * 100} 
                                className="h-2"
                              />
                              <div className="space-y-2 mt-4">
                                {seoTasks.filter(t => t.type === 'gmb').map((task) => (
                                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      {task.isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                      )}
                                      <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                                        {task.title || `GMB Post ${seoTasks.filter(t => t.type === 'gmb').indexOf(task) + 1}`}
                                      </span>
                                    </div>
                                    {!task.isCompleted && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        data-testid={`button-complete-gmb-${task.id}`}
                                        onClick={() => setSelectedTask(task)}
                                      >
                                        Complete
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Facebook Posts */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-600" />
                                Facebook Posts
                              </CardTitle>
                              <Badge>
                                {getTaskCounts('facebook').completed}/{getTaskCounts('facebook').total}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Progress 
                                value={(getTaskCounts('facebook').completed / getTaskCounts('facebook').total) * 100} 
                                className="h-2"
                              />
                              <div className="space-y-2 mt-4">
                                {seoTasks.filter(t => t.type === 'facebook').map((task) => (
                                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      {task.isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                      )}
                                      <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                                        {task.title || `Facebook Post ${seoTasks.filter(t => t.type === 'facebook').indexOf(task) + 1}`}
                                      </span>
                                    </div>
                                    {!task.isCompleted && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        data-testid={`button-complete-facebook-${task.id}`}
                                        onClick={() => setSelectedTask(task)}
                                      >
                                        Complete
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Location Pages */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-green-500" />
                                Location Landing Pages
                              </CardTitle>
                              <Badge>
                                {getTaskCounts('location').completed}/{getTaskCounts('location').total}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Progress 
                                value={(getTaskCounts('location').completed / getTaskCounts('location').total) * 100} 
                                className="h-2"
                              />
                              <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
                                {seoTasks.filter(t => t.type === 'location').map((task) => (
                                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      {task.isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                                      )}
                                      <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                                        {task.title || `Location Page ${seoTasks.filter(t => t.type === 'location').indexOf(task) + 1}`}
                                      </span>
                                    </div>
                                    {!task.isCompleted && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        data-testid={`button-complete-location-${task.id}`}
                                        onClick={() => setSelectedTask(task)}
                                      >
                                        Complete
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="setup" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>SEO Setup Checklist</CardTitle>
                              <p className="text-sm text-gray-500 mt-1">
                                Follow these steps to optimize your website's SEO
                              </p>
                            </div>
                            {setupChecklistItems.length === 0 && (
                              <Button
                                onClick={() => initializeChecklistMutation.mutate()}
                                disabled={initializeChecklistMutation.isPending}
                                data-testid="button-initialize-checklist"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Initialize Checklist
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {setupChecklistItems.length === 0 ? (
                            <div className="text-center py-12">
                              <CheckCircle2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                              <p className="text-gray-500 mb-4">
                                Get started by initializing your SEO setup checklist
                              </p>
                              <Button
                                onClick={() => initializeChecklistMutation.mutate()}
                                disabled={initializeChecklistMutation.isPending}
                                data-testid="button-initialize-checklist-center"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Initialize Checklist
                              </Button>
                            </div>
                          ) : (
                            <>
                              {/* SEO Best Practices */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                  SEO Best Practices
                                </h3>
                                <div className="space-y-2">
                                  {setupChecklistItems
                                    .filter(item => item.category === 'best_practices')
                                    .map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        data-testid={`checklist-item-${item.id}`}
                                      >
                                        <Checkbox
                                          checked={item.isCompleted}
                                          onCheckedChange={() => toggleChecklistItemMutation.mutate(item.id)}
                                          data-testid={`checkbox-item-${item.id}`}
                                        />
                                        <span className={item.isCompleted ? "line-through text-gray-500 flex-1" : "flex-1"}>
                                          {item.itemName}
                                        </span>
                                        {item.isCompleted && (
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* SEO Boosted Checklist (Optional) */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-purple-500" />
                                  SEO Boosted Checklist (Optional)
                                </h3>
                                <div className="space-y-2">
                                  {setupChecklistItems
                                    .filter(item => item.category === 'seo_boosted')
                                    .map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        data-testid={`checklist-item-${item.id}`}
                                      >
                                        <Checkbox
                                          checked={item.isCompleted}
                                          onCheckedChange={() => toggleChecklistItemMutation.mutate(item.id)}
                                          data-testid={`checkbox-item-${item.id}`}
                                        />
                                        <span className={item.isCompleted ? "line-through text-gray-500 flex-1" : "flex-1"}>
                                          {item.itemName}
                                        </span>
                                        {item.isCompleted && (
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* After Publishing */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <Globe className="w-5 h-5 text-green-500" />
                                  After Publishing
                                </h3>
                                <div className="space-y-2">
                                  {setupChecklistItems
                                    .filter(item => item.category === 'after_publishing')
                                    .map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        data-testid={`checklist-item-${item.id}`}
                                      >
                                        <Checkbox
                                          checked={item.isCompleted}
                                          onCheckedChange={() => toggleChecklistItemMutation.mutate(item.id)}
                                          data-testid={`checkbox-item-${item.id}`}
                                        />
                                        <span className={item.isCompleted ? "line-through text-gray-500 flex-1" : "flex-1"}>
                                          {item.itemName}
                                        </span>
                                        {item.isCompleted && (
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* Progress Summary */}
                              <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-6">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold">Overall Progress</span>
                                    <span className="text-lg font-bold text-blue-600">
                                      {setupChecklistItems.filter(item => item.isCompleted).length}/{setupChecklistItems.length}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={(setupChecklistItems.filter(item => item.isCompleted).length / setupChecklistItems.length) * 100} 
                                    className="h-2"
                                  />
                                </CardContent>
                              </Card>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="ideas" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Generate Content Ideas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter a keyword..."
                              value={selectedKeyword}
                              onChange={(e) => setSelectedKeyword(e.target.value)}
                            />
                            <Button
                              onClick={() => {
                                if (!selectedKeyword) {
                                  toast({ title: "Error", description: "Please enter a keyword", variant: "destructive" });
                                  return;
                                }
                                generateIdeasMutation.mutate(selectedKeyword);
                              }}
                              disabled={generateIdeasMutation.isPending}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {contentIdeas.slice(0, 5).map((idea) => (
                              <div key={idea.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="font-medium">{idea.title}</div>
                                <div className="text-sm text-gray-500">{idea.type.toUpperCase()}</div>
                              </div>
                            ))}
                            {contentIdeas.length === 0 && (
                              <p className="text-center text-gray-500 py-4">No ideas yet. Generate some above!</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>SEO Cycle History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {cycleHistory.map((cycle) => (
                              <Card 
                                key={cycle.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setSelectedHistoryCycle(cycle)}
                              >
                                <CardContent className="pt-6">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold">
                                        {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        Keywords: {cycle.keywords.join(', ')}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-green-600">
                                        {cycle.completionPercentage}%
                                      </div>
                                      <Badge variant={cycle.status === 'completed' ? 'default' : 'secondary'}>
                                        {cycle.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {cycleHistory.length === 0 && (
                              <p className="text-center text-gray-500 py-8">No previous cycles yet</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
              {welcomeEmailSent ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Your website is ready! We've sent you a welcome email with setup instructions.
                  </p>
                  <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Welcome email sent successfully
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Your website is ready! Click the button below to set up your password and start editing.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  // Try to get the welcome link from the stored state or fallback to editor
                  const linkToOpen = welcomeLink || `https://mysite.autobidder.org`;
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

      {/* History Cycle Details Dialog */}
      <Dialog open={!!selectedHistoryCycle} onOpenChange={(open) => !open && setSelectedHistoryCycle(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cycle Details</DialogTitle>
            <DialogDescription>
              {selectedHistoryCycle && (
                <>
                  {new Date(selectedHistoryCycle.startDate).toLocaleDateString()} - {new Date(selectedHistoryCycle.endDate).toLocaleDateString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedHistoryCycle && (
            <div className="space-y-6">
              {/* Cycle Summary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Keywords:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedHistoryCycle.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Completion:</span>
                  <div className="flex items-center gap-3">
                    <Progress value={selectedHistoryCycle.completionPercentage} className="w-32 h-2" />
                    <span className="font-bold text-green-600">{selectedHistoryCycle.completionPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Task Breakdown by Type */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Task Breakdown</h3>
                
                {/* Blog Posts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Blog Posts</span>
                    <Badge variant="outline">
                      {historyTasks.filter(t => t.type === 'blog' && t.isCompleted).length}/{historyTasks.filter(t => t.type === 'blog').length}
                    </Badge>
                  </div>
                  {historyTasks.filter(t => t.type === 'blog').map((task) => (
                    <div key={task.id} className="ml-6 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className={task.isCompleted ? 'line-through text-gray-500' : ''}>
                            Blog Post {task.id}
                          </span>
                        </div>
                        {task.proofLink && (
                          <a href={task.proofLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View Proof
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* GMB Posts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="font-medium">GMB Posts</span>
                    <Badge variant="outline">
                      {historyTasks.filter(t => t.type === 'gmb' && t.isCompleted).length}/{historyTasks.filter(t => t.type === 'gmb').length}
                    </Badge>
                  </div>
                  {historyTasks.filter(t => t.type === 'gmb').map((task) => (
                    <div key={task.id} className="ml-6 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className={task.isCompleted ? 'line-through text-gray-500' : ''}>
                            GMB Post {task.id}
                          </span>
                        </div>
                        {task.proofLink && (
                          <a href={task.proofLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View Proof
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Facebook Posts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Facebook Posts</span>
                    <Badge variant="outline">
                      {historyTasks.filter(t => t.type === 'facebook' && t.isCompleted).length}/{historyTasks.filter(t => t.type === 'facebook').length}
                    </Badge>
                  </div>
                  {historyTasks.filter(t => t.type === 'facebook').map((task) => (
                    <div key={task.id} className="ml-6 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className={task.isCompleted ? 'line-through text-gray-500' : ''}>
                            Facebook Post {task.id}
                          </span>
                        </div>
                        {task.proofLink && (
                          <a href={task.proofLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View Proof
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Location Pages */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">Location Pages</span>
                    <Badge variant="outline">
                      {historyTasks.filter(t => t.type === 'location' && t.isCompleted).length}/{historyTasks.filter(t => t.type === 'location').length}
                    </Badge>
                  </div>
                  {historyTasks.filter(t => t.type === 'location').map((task) => (
                    <div key={task.id} className="ml-6 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className={task.isCompleted ? 'line-through text-gray-500' : ''}>
                            Location Page {task.id}
                          </span>
                        </div>
                        {task.proofLink && (
                          <a href={task.proofLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View Proof
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}