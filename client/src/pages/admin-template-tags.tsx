import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus,
  Edit, 
  Trash2, 
  Tags,
  Palette,
  Eye,
  Settings,
  Filter
} from 'lucide-react';

interface TemplateTag {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  color: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface DudaTemplate {
  template_id: string;
  template_name: string;
  preview_url: string;
  thumbnail_url: string;
  tags?: TemplateTag[];
}

const tagFormSchema = z.object({
  name: z.string().min(1, "Name is required").regex(/^[a-z0-9-]+$/, "Name must be lowercase, numbers, and hyphens only"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"),
  displayOrder: z.number().min(0),
});

type TagFormData = z.infer<typeof tagFormSchema>;

const PREDEFINED_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6B7280', // Gray
];

export default function AdminTemplateTags() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TemplateTag | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DudaTemplate | null>(null);
  const [isTagAssignmentOpen, setIsTagAssignmentOpen] = useState(false);

  // Check if user is super admin
  const isSuperAdmin = (user as any)?.userType === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg max-w-md">
            <CardContent className="p-8 text-center">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600">Only super administrators can access template tag management.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch template tags
  const { data: tags = [], isLoading: tagsLoading, refetch: refetchTags } = useQuery<TemplateTag[]>({
    queryKey: ['/api/admin/template-tags'],
    enabled: !!user && isSuperAdmin
  });

  // Fetch Duda templates with their assigned tags
  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates } = useQuery<DudaTemplate[]>({
    queryKey: ['/api/admin/duda-templates-with-tags'],
    enabled: !!user && isSuperAdmin
  });

  const createTagForm = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      color: PREDEFINED_COLORS[0],
      displayOrder: 0,
    },
  });

  const editTagForm = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: TagFormData) => {
      const response = await apiRequest('POST', '/api/admin/template-tags', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Tag Created",
        description: "Template tag has been created successfully"
      });
      refetchTags();
      setIsCreateDialogOpen(false);
      createTagForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template tag",
        variant: "destructive"
      });
    }
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TagFormData }) => {
      const response = await apiRequest('PUT', `/api/admin/template-tags/${id}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Tag Updated",
        description: "Template tag has been updated successfully"
      });
      refetchTags();
      setIsEditDialogOpen(false);
      setSelectedTag(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template tag",
        variant: "destructive"
      });
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/template-tags/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Tag Deleted",
        description: "Template tag has been deleted successfully"
      });
      refetchTags();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template tag",
        variant: "destructive"
      });
    }
  });

  // Assign/unassign tag to template mutation
  const toggleTagAssignmentMutation = useMutation({
    mutationFn: async ({ templateId, tagId, action }: { templateId: string; tagId: number; action: 'assign' | 'unassign' }) => {
      const endpoint = action === 'assign' 
        ? '/api/admin/template-tag-assignments'
        : `/api/admin/template-tag-assignments/${templateId}/${tagId}`;
      
      const method = action === 'assign' ? 'POST' : 'DELETE';
      
      if (action === 'assign') {
        await apiRequest(method, endpoint, { templateId, tagId });
      } else {
        await apiRequest(method, endpoint);
      }
    },
    onSuccess: () => {
      toast({
        title: "Tag Assignment Updated",
        description: "Template tag assignment has been updated"
      });
      refetchTemplates();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tag assignment",
        variant: "destructive"
      });
    }
  });

  const handleCreateTag = (data: TagFormData) => {
    createTagMutation.mutate(data);
  };

  const handleEditTag = (tag: TemplateTag) => {
    setSelectedTag(tag);
    editTagForm.reset({
      name: tag.name,
      displayName: tag.displayName,
      description: tag.description || '',
      color: tag.color,
      displayOrder: tag.displayOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTag = (data: TagFormData) => {
    if (selectedTag) {
      updateTagMutation.mutate({ id: selectedTag.id, data });
    }
  };

  const handleDeleteTag = (tag: TemplateTag) => {
    if (confirm(`Are you sure you want to delete the tag "${tag.displayName}"? This will remove it from all templates.`)) {
      deleteTagMutation.mutate(tag.id);
    }
  };

  const handleToggleTagAssignment = (templateId: string, tagId: number, isAssigned: boolean) => {
    const action = isAssigned ? 'unassign' : 'assign';
    toggleTagAssignmentMutation.mutate({ templateId, tagId, action });
  };

  const openTagAssignment = (template: DudaTemplate) => {
    setSelectedTemplate(template);
    setIsTagAssignmentOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Template Tag Management</h1>
              <p className="text-gray-600 mt-1">Create and manage industry tags for website templates</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tag
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Template Tag</DialogTitle>
                </DialogHeader>
                <Form {...createTagForm}>
                  <form onSubmit={createTagForm.handleSubmit(handleCreateTag)} className="space-y-4">
                    <FormField
                      control={createTagForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name (URL-friendly)</FormLabel>
                          <FormControl>
                            <Input placeholder="construction" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createTagForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Construction" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createTagForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Templates for construction businesses..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createTagForm.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="flex gap-2 flex-wrap">
                                {PREDEFINED_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded border-2 ${field.value === color ? 'border-gray-900' : 'border-gray-300'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => field.onChange(color)}
                                  />
                                ))}
                              </div>
                              <Input placeholder="#3B82F6" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createTagForm.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={createTagMutation.isPending}>
                        {createTagMutation.isPending ? "Creating..." : "Create Tag"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Tags className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tags</p>
                    <p className="text-3xl font-bold text-gray-900">{tags.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Filter className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Tags</p>
                    <p className="text-3xl font-bold text-gray-900">{tags.filter(t => t.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Palette className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Templates</p>
                    <p className="text-3xl font-bold text-gray-900">{templates.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tags Management */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="w-5 h-5" />
                  Template Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tagsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : tags.length > 0 ? (
                  <div className="space-y-3">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge style={{ backgroundColor: tag.color, color: 'white' }}>
                            {tag.displayName}
                          </Badge>
                          <div>
                            <p className="font-medium">{tag.name}</p>
                            {tag.description && (
                              <p className="text-sm text-gray-600">{tag.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTag(tag)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTag(tag)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tags className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tags yet</h3>
                    <p className="text-gray-600">Create your first template tag to start organizing templates.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Tag Assignments */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Template Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : templates.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                      <div key={template.template_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {template.thumbnail_url ? (
                            <img
                              src={template.thumbnail_url}
                              alt={template.template_name}
                              className="w-12 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                              <Eye className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{template.template_name}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {template.tags?.map((tag) => (
                                <Badge 
                                  key={tag.id} 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ borderColor: tag.color, color: tag.color }}
                                >
                                  {tag.displayName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTagAssignment(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Palette className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                    <p className="text-gray-600">Templates will appear here once they're loaded.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Tag Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Template Tag</DialogTitle>
            </DialogHeader>
            <Form {...editTagForm}>
              <form onSubmit={editTagForm.handleSubmit(handleUpdateTag)} className="space-y-4">
                <FormField
                  control={editTagForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (URL-friendly)</FormLabel>
                      <FormControl>
                        <Input placeholder="construction" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTagForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Construction" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTagForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Templates for construction businesses..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTagForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex gap-2 flex-wrap">
                            {PREDEFINED_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded border-2 ${field.value === color ? 'border-gray-900' : 'border-gray-300'}`}
                                style={{ backgroundColor: color }}
                                onClick={() => field.onChange(color)}
                              />
                            ))}
                          </div>
                          <Input placeholder="#3B82F6" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTagForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={updateTagMutation.isPending}>
                    {updateTagMutation.isPending ? "Updating..." : "Update Tag"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Tag Assignment Dialog */}
        <Dialog open={isTagAssignmentOpen} onOpenChange={setIsTagAssignmentOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Tags to Template</DialogTitle>
              {selectedTemplate && (
                <p className="text-sm text-gray-600">{selectedTemplate.template_name}</p>
              )}
            </DialogHeader>
            <div className="space-y-4">
              {tags.map((tag) => {
                const isAssigned = selectedTemplate?.tags?.some(t => t.id === tag.id) || false;
                return (
                  <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge style={{ backgroundColor: tag.color, color: 'white' }}>
                        {tag.displayName}
                      </Badge>
                      <div>
                        <p className="font-medium">{tag.name}</p>
                        {tag.description && (
                          <p className="text-sm text-gray-600">{tag.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={isAssigned ? "default" : "outline"}
                      size="sm"
                      onClick={() => selectedTemplate && handleToggleTagAssignment(selectedTemplate.template_id, tag.id, isAssigned)}
                      disabled={toggleTagAssignmentMutation.isPending}
                    >
                      {isAssigned ? "Remove" : "Assign"}
                    </Button>
                  </div>
                );
              })}
              {tags.length === 0 && (
                <div className="text-center py-8">
                  <Tags className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tags available</h3>
                  <p className="text-gray-600">Create some tags first to assign them to templates.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}