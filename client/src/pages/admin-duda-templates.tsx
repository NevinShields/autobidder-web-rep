import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';
import {
  Tags,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Globe,
  Settings,
  Filter,
  X,
  Save
} from 'lucide-react';

interface DudaTemplateTag {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface DudaTemplateMetadata {
  id: number;
  templateId: string;
  templateName: string;
  isVisible: boolean;
  displayOrder: number;
  previewUrl?: string;
  thumbnailUrl?: string;
  vertical?: string;
  templateType?: string;
  visibility?: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateWithTags extends DudaTemplateMetadata {
  tags: DudaTemplateTag[];
}

export default function AdminDudaTemplates() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<DudaTemplateMetadata | null>(null);
  const [selectedTag, setSelectedTag] = useState<DudaTemplateTag | null>(null);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newTagData, setNewTagData] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#3B82F6',
    displayOrder: 0
  });

  // Fetch templates with tags
  const { data: templatesWithTags = [], isLoading: templatesLoading, refetch: refetchTemplates } = useQuery<TemplateWithTags[]>({
    queryKey: ['/api/duda-templates-with-tags']
  });

  // Fetch all templates (admin view)
  const { data: allTemplates = [], isLoading: allTemplatesLoading } = useQuery<DudaTemplateMetadata[]>({
    queryKey: ['/api/admin/duda-templates']
  });

  // Fetch all tags
  const { data: allTags = [], isLoading: tagsLoading, refetch: refetchTags } = useQuery<DudaTemplateTag[]>({
    queryKey: ['/api/admin/duda-template-tags']
  });

  // Sync templates mutation
  const syncTemplatesMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/duda-templates/sync'),
    onSuccess: (data: any) => {
      toast({
        title: "Templates Synced",
        description: `Successfully synced ${data.templates?.length || 0} templates from Duda API`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/duda-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/duda-templates-with-tags'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync templates",
        variant: "destructive"
      });
    }
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: (tagData: any) => apiRequest('POST', '/api/admin/duda-template-tags', tagData),
    onSuccess: () => {
      toast({
        title: "Tag Created",
        description: "Template tag created successfully"
      });
      setIsTagDialogOpen(false);
      setNewTagData({
        name: '',
        displayName: '',
        description: '',
        color: '#3B82F6',
        displayOrder: 0
      });
      refetchTags();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive"
      });
    }
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/admin/duda-template-tags/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Tag Updated",
        description: "Template tag updated successfully"
      });
      refetchTags();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tag",
        variant: "destructive"
      });
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/duda-template-tags/${id}`),
    onSuccess: () => {
      toast({
        title: "Tag Deleted",
        description: "Template tag deleted successfully"
      });
      refetchTags();
      refetchTemplates();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tag",
        variant: "destructive"
      });
    }
  });

  // Update template visibility mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) => 
      apiRequest('PUT', `/api/admin/duda-templates/${templateId}`, data),
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Template updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/duda-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/duda-templates-with-tags'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive"
      });
    }
  });

  // Assign tag to template mutation
  const assignTagMutation = useMutation({
    mutationFn: ({ templateId, tagId }: { templateId: string; tagId: number }) => 
      apiRequest('POST', `/api/admin/duda-templates/${templateId}/tags`, { tagId }),
    onSuccess: () => {
      toast({
        title: "Tag Assigned",
        description: "Tag assigned to template successfully"
      });
      refetchTemplates();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign tag",
        variant: "destructive"
      });
    }
  });

  // Remove tag from template mutation
  const removeTagMutation = useMutation({
    mutationFn: ({ templateId, tagId }: { templateId: string; tagId: number }) => 
      apiRequest('DELETE', `/api/admin/duda-templates/${templateId}/tags/${tagId}`),
    onSuccess: () => {
      toast({
        title: "Tag Removed",
        description: "Tag removed from template successfully"
      });
      refetchTemplates();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove tag",
        variant: "destructive"
      });
    }
  });

  const handleCreateTag = () => {
    if (!newTagData.name || !newTagData.displayName) {
      toast({
        title: "Validation Error",
        description: "Name and display name are required",
        variant: "destructive"
      });
      return;
    }
    createTagMutation.mutate(newTagData);
  };

  const handleToggleTagActive = (tag: DudaTemplateTag) => {
    updateTagMutation.mutate({
      id: tag.id,
      data: { isActive: !tag.isActive }
    });
  };

  const handleToggleTemplateVisible = (template: DudaTemplateMetadata) => {
    updateTemplateMutation.mutate({
      templateId: template.templateId,
      data: { isVisible: !template.isVisible }
    });
  };

  const handleAssignTag = (templateId: string, tagId: number) => {
    assignTagMutation.mutate({ templateId, tagId });
  };

  const handleRemoveTag = (templateId: string, tagId: number) => {
    removeTagMutation.mutate({ templateId, tagId });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Duda Template Management</h1>
              <p className="text-gray-600 mt-1">Manage template tags, visibility, and organization</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => syncTemplatesMutation.mutate()}
                disabled={syncTemplatesMutation.isPending}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Templates
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Templates ({templatesWithTags.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <div className="text-center py-8">Loading templates...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templatesWithTags.map((template) => (
                        <Card key={template.templateId} className="border hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Template Preview */}
                              {template.thumbnailUrl && (
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={template.thumbnailUrl} 
                                    alt={template.templateName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* Template Info */}
                              <div>
                                <h3 className="font-semibold text-sm line-clamp-2">{template.templateName}</h3>
                                <p className="text-xs text-gray-500 mt-1">ID: {template.templateId}</p>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1">
                                {template.tags.map((tag) => (
                                  <Badge 
                                    key={tag.id}
                                    variant="secondary" 
                                    className="text-xs"
                                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                  >
                                    {tag.displayName}
                                    <button
                                      onClick={() => handleRemoveTag(template.templateId, tag.id)}
                                      className="ml-1 hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleTemplateVisible(template)}
                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                      template.isVisible 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {template.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    {template.isVisible ? 'Visible' : 'Hidden'}
                                  </button>
                                </div>
                                
                                <Select onValueChange={(tagId) => handleAssignTag(template.templateId, parseInt(tagId))}>
                                  <SelectTrigger className="h-7 text-xs w-24">
                                    <SelectValue placeholder="Add Tag" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allTags
                                      .filter(tag => tag.isActive && !template.tags.find(t => t.id === tag.id))
                                      .map((tag) => (
                                        <SelectItem key={tag.id} value={tag.id.toString()}>
                                          {tag.displayName}
                                        </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Tags className="w-5 h-5" />
                      Template Tags ({allTags.length})
                    </CardTitle>
                    <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Tag
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Template Tag</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="tagName">Tag Name (ID)</Label>
                            <Input
                              id="tagName"
                              value={newTagData.name}
                              onChange={(e) => setNewTagData({ ...newTagData, name: e.target.value })}
                              placeholder="e.g., auto-detailing"
                            />
                          </div>
                          <div>
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                              id="displayName"
                              value={newTagData.displayName}
                              onChange={(e) => setNewTagData({ ...newTagData, displayName: e.target.value })}
                              placeholder="e.g., Auto Detailing"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={newTagData.description}
                              onChange={(e) => setNewTagData({ ...newTagData, description: e.target.value })}
                              placeholder="Optional description for this tag"
                            />
                          </div>
                          <div>
                            <Label htmlFor="color">Color</Label>
                            <Input
                              id="color"
                              type="color"
                              value={newTagData.color}
                              onChange={(e) => setNewTagData({ ...newTagData, color: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="displayOrder">Display Order</Label>
                            <Input
                              id="displayOrder"
                              type="number"
                              value={newTagData.displayOrder}
                              onChange={(e) => setNewTagData({ ...newTagData, displayOrder: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <Button 
                            onClick={handleCreateTag} 
                            disabled={createTagMutation.isPending}
                            className="w-full"
                          >
                            Create Tag
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {tagsLoading ? (
                    <div className="text-center py-8">Loading tags...</div>
                  ) : (
                    <div className="space-y-3">
                      {allTags.map((tag) => (
                        <Card key={tag.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <div>
                                  <h4 className="font-medium">{tag.displayName}</h4>
                                  <p className="text-sm text-gray-500">
                                    {tag.name} • Order: {tag.displayOrder}
                                  </p>
                                  {tag.description && (
                                    <p className="text-xs text-gray-400 mt-1">{tag.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={tag.isActive}
                                  onCheckedChange={() => handleToggleTagActive(tag)}
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this tag? This will remove it from all templates.')) {
                                      deleteTagMutation.mutate(tag.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}