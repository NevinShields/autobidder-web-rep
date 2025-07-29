import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Globe, 
  Edit, 
  Trash2, 
  Plus,
  Eye,
  ArrowUp,
  ArrowDown,
  Monitor,
  Settings
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';

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

export default function AdminWebsiteTemplates() {
  const { toast } = useToast();
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomWebsiteTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    templateId: '',
    name: '',
    industry: '',
    previewUrl: '',
    thumbnailUrl: '',
    displayOrder: 0,
    status: 'active' as 'active' | 'inactive'
  });

  // Fetch all custom website templates
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/custom-website-templates'],
    queryFn: () => apiRequest('GET', '/api/admin/custom-website-templates')
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: typeof formData) => {
      return await apiRequest('POST', '/api/admin/custom-website-templates', templateData);
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Custom website template created successfully"
      });
      setIsAddingTemplate(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      return await apiRequest('PUT', `/api/admin/custom-website-templates/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Custom website template updated successfully"
      });
      setEditingTemplate(null);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/custom-website-templates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Custom website template deleted successfully"
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      templateId: '',
      name: '',
      industry: '',
      previewUrl: '',
      thumbnailUrl: '',
      displayOrder: 0,
      status: 'active'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.templateId || !formData.name || !formData.industry) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handleEdit = (template: CustomWebsiteTemplate) => {
    setEditingTemplate(template);
    setFormData({
      templateId: template.templateId,
      name: template.name,
      industry: template.industry,
      previewUrl: template.previewUrl,
      thumbnailUrl: template.thumbnailUrl,
      displayOrder: template.displayOrder,
      status: template.status
    });
    setIsAddingTemplate(true);
  };

  const handleDelete = (template: CustomWebsiteTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  const handleDisplayOrderChange = (template: CustomWebsiteTemplate, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? template.displayOrder - 1 : template.displayOrder + 1;
    updateTemplateMutation.mutate({ 
      id: template.id, 
      data: { displayOrder: Math.max(0, newOrder) }
    });
  };

  const sortedTemplates = [...templates].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Website Template Management</h1>
              <p className="text-gray-600 mt-1">Manage custom website templates for all users</p>
            </div>
            <Dialog open={isAddingTemplate} onOpenChange={(open) => {
              setIsAddingTemplate(open);
              if (!open) {
                setEditingTemplate(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Add New Template'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="templateId">Template ID *</Label>
                      <Input
                        id="templateId"
                        value={formData.templateId}
                        onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                        placeholder="Enter Duda template ID"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Template Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter template name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry *</Label>
                      <Select 
                        value={formData.industry} 
                        onValueChange={(value) => setFormData({ ...formData, industry: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
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
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="previewUrl">Preview URL</Label>
                      <Input
                        id="previewUrl"
                        value={formData.previewUrl}
                        onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                        placeholder="https://preview.duda.co/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                      <Input
                        id="thumbnailUrl"
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        placeholder="https://thumbnail.duda.co/..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-xs text-gray-600 mt-1">Lower numbers appear first</p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingTemplate(false);
                        setEditingTemplate(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    >
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Templates</p>
                    <p className="text-3xl font-bold text-gray-900">{templates.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Settings className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {templates.filter((t: CustomWebsiteTemplate) => t.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Monitor className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Inactive</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {templates.filter((t: CustomWebsiteTemplate) => t.status === 'inactive').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Industries</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {new Set(templates.map((t: CustomWebsiteTemplate) => t.industry)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates List */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : sortedTemplates.length > 0 ? (
                <div className="space-y-4">
                  {sortedTemplates.map((template: CustomWebsiteTemplate) => (
                    <Card key={template.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {template.thumbnailUrl ? (
                                <img
                                  src={template.thumbnailUrl}
                                  alt={template.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Monitor className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{template.name}</h3>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge 
                                  variant={template.status === 'active' ? 'default' : 'secondary'}
                                  className={template.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {template.status}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {INDUSTRIES.find(ind => ind.value === template.industry)?.label || template.industry}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Order: {template.displayOrder}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ID: {template.templateId}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleDisplayOrderChange(template, 'up')}
                              variant="outline"
                              size="sm"
                              disabled={updateTemplateMutation.isPending}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDisplayOrderChange(template, 'down')}
                              variant="outline"
                              size="sm"
                              disabled={updateTemplateMutation.isPending}
                            >
                              <ArrowDown className="w-4 h-4" />
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
                            <Button
                              onClick={() => handleEdit(template)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(template)}
                              variant="destructive"
                              size="sm"
                              disabled={deleteTemplateMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Monitor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates</h3>
                  <p className="text-gray-600">No custom website templates have been created yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}