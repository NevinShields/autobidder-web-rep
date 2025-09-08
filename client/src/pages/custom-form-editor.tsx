import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, ExternalLink, Settings } from 'lucide-react';
import { CustomForm, Formula } from '@shared/schema';

interface CustomFormEditData {
  name: string;
  slug: string;
  description: string;
  enabled: boolean;
  serviceIds: number[];
}

export default function CustomFormEditor() {
  const { formId } = useParams<{ formId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CustomFormEditData>({
    name: '',
    slug: '',
    description: '',
    enabled: true,
    serviceIds: []
  });

  // Fetch custom form data
  const { data: customForm, isLoading: isLoadingForm } = useQuery<CustomForm>({
    queryKey: ['/api/custom-forms', formId],
    queryFn: async () => {
      const res = await fetch(`/api/custom-forms/${formId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch custom form');
      return res.json();
    },
    enabled: !!formId
  });

  // Fetch available formulas/services
  const { data: formulas, isLoading: isLoadingFormulas } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
    queryFn: async () => {
      const res = await fetch('/api/formulas', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch formulas');
      return res.json();
    }
  });

  // Update form data when custom form is loaded
  useEffect(() => {
    if (customForm) {
      setFormData({
        name: customForm.name || '',
        slug: customForm.slug || '',
        description: customForm.description || '',
        enabled: customForm.enabled ?? true,
        serviceIds: customForm.serviceIds || []
      });
    }
  }, [customForm]);

  // Update form mutation
  const updateFormMutation = useMutation({
    mutationFn: async (data: CustomFormEditData) => {
      const res = await apiRequest('PATCH', `/api/custom-forms/${formId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Form Updated',
        description: 'Your custom form has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-forms'] });
      navigate('/custom-forms');
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update the form. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof CustomFormEditData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: checked 
        ? [...prev.serviceIds, serviceId]
        : prev.serviceIds.filter(id => id !== serviceId)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Form name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'URL slug is required.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.serviceIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one service must be selected.',
        variant: 'destructive',
      });
      return;
    }

    updateFormMutation.mutate(formData);
  };

  if (isLoadingForm || isLoadingFormulas) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customForm) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold mb-2">Form Not Found</h1>
            <p className="text-gray-600">The requested custom form could not be found.</p>
            <Link href="/custom-forms">
              <Button className="mt-4">Back to Custom Forms</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const availableFormulas = formulas?.filter((f: Formula) => f.isDisplayed !== false) || [];
  const selectedFormulas = availableFormulas.filter((f: Formula) => formData.serviceIds.includes(f.id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link href="/custom-forms">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="sm:inline">Back to Forms</span>
              </Button>
            </Link>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold">Edit Custom Form</h1>
              <p className="text-sm sm:text-base text-gray-600">Modify form settings and service selections</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => window.open(`/f/${customForm?.accountId}/${customForm?.slug}`, '_blank')}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              <span className="sm:inline">Preview Form</span>
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateFormMutation.isPending}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateFormMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Form Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Form Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div>
                <Label htmlFor="form-name" className="text-sm font-medium">Form Name *</Label>
                <Input
                  id="form-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter form name"
                  className="mt-1 h-10 sm:h-9"
                />
              </div>

              <div>
                <Label htmlFor="form-slug" className="text-sm font-medium">URL Slug *</Label>
                <Input
                  id="form-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="url-friendly-name"
                  className="mt-1 h-10 sm:h-9"
                />
                <p className="text-xs text-gray-500 mt-1 break-all">
                  Form will be available at: /f/{customForm?.accountId}/{formData.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="form-description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="form-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description for the form"
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label htmlFor="form-enabled" className="text-sm font-medium cursor-pointer">Form Enabled</Label>
                <Switch
                  id="form-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Service Selection</CardTitle>
              <p className="text-sm text-gray-600">
                Choose which services should be available in this form
              </p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                {availableFormulas.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 text-sm">
                    No services available. Create services first.
                  </p>
                ) : (
                  availableFormulas.map((formula: Formula) => (
                    <div key={formula.id} className="flex items-start space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id={`service-${formula.id}`}
                        checked={formData.serviceIds.includes(formula.id)}
                        onCheckedChange={(checked) => handleServiceToggle(formula.id, checked as boolean)}
                        className="mt-1 h-5 w-5"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <Label htmlFor={`service-${formula.id}`} className="text-sm sm:text-base font-medium cursor-pointer leading-tight">
                          {formula.name}
                        </Label>
                        {formula.description && (
                          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{formula.description}</p>
                        )}
                      </div>
                      <Link href={`/formula/${formula.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
              
              {formData.serviceIds.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Selected Services ({formData.serviceIds.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedFormulas.map((formula: Formula) => (
                        <Badge key={formula.id} variant="secondary" className="text-xs px-2 py-1">
                          {formula.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}