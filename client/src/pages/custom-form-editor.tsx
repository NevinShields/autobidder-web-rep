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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/custom-forms">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Forms
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Edit Custom Form</h1>
              <p className="text-gray-600">Modify form settings and service selections</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => window.open(`/f/${customForm?.accountId}/${customForm?.slug}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview Form
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateFormMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateFormMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="form-name">Form Name *</Label>
                <Input
                  id="form-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter form name"
                />
              </div>

              <div>
                <Label htmlFor="form-slug">URL Slug *</Label>
                <Input
                  id="form-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="url-friendly-name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Form will be available at: /f/{customForm?.accountId}/{formData.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description for the form"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="form-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                />
                <Label htmlFor="form-enabled">Form Enabled</Label>
              </div>
            </CardContent>
          </Card>

          {/* Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Service Selection</CardTitle>
              <p className="text-sm text-gray-600">
                Choose which services should be available in this form
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableFormulas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No services available. Create services first.
                  </p>
                ) : (
                  availableFormulas.map((formula: Formula) => (
                    <div key={formula.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`service-${formula.id}`}
                        checked={formData.serviceIds.includes(formula.id)}
                        onCheckedChange={(checked) => handleServiceToggle(formula.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`service-${formula.id}`} className="text-sm font-medium cursor-pointer">
                          {formula.name}
                        </Label>
                        {formula.description && (
                          <p className="text-xs text-gray-500 truncate">{formula.description}</p>
                        )}
                      </div>
                      <Link href={`/formula/${formula.id}`}>
                        <Button variant="ghost" size="sm">
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
                  <div>
                    <Label className="text-sm font-medium">Selected Services ({formData.serviceIds.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFormulas.map((formula: Formula) => (
                        <Badge key={formula.id} variant="secondary">
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