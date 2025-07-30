import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, Eye, DollarSign, Package, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';

interface DfyService {
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  features: string[];
  category: string;
  estimatedDelivery: string;
  popularService: boolean;
  videoUrl?: string;
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ServicePurchase {
  id: number;
  userId: string;
  serviceId: number;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amountPaid: number;
  currency: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'canceled';
  serviceStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  purchaseNotes?: string;
  deliveryNotes?: string;
  completedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  service: DfyService;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

const serviceFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  category: z.string().min(1, 'Category is required'),
  estimatedDelivery: z.string().min(1, 'Estimated delivery is required'),
  popularService: z.boolean(),
  videoUrl: z.string().optional(),
  stripeProductId: z.string().optional(),
  stripePriceId: z.string().optional(),
  isActive: z.boolean(),
  displayOrder: z.number().min(1, 'Display order must be positive')
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(0)}`;
}

function ServiceForm({ 
  service, 
  onSubmit, 
  onCancel, 
  isSubmitting 
}: { 
  service?: DfyService; 
  onSubmit: (data: ServiceFormData) => void; 
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: service?.name || '',
    shortDescription: service?.shortDescription || '',
    description: service?.description || '',
    price: service?.price || 0,
    features: service?.features || [''],
    category: service?.category || 'website',
    estimatedDelivery: service?.estimatedDelivery || '',
    popularService: service?.popularService || false,
    videoUrl: service?.videoUrl || '',
    stripeProductId: service?.stripeProductId || '',
    stripePriceId: service?.stripePriceId || '',
    isActive: service?.isActive ?? true,
    displayOrder: service?.displayOrder || 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = serviceFormSchema.safeParse(formData);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(error => {
        newErrors[error.path[0] as string] = error.message;
      });
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(validation.data);
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData({ ...formData, features: newFeatures });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Service Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="DFY Website Design"
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Website Services</SelectItem>
              <SelectItem value="seo">SEO & Marketing</SelectItem>
              <SelectItem value="setup">Setup & Configuration</SelectItem>
              <SelectItem value="design">Design Services</SelectItem>
              <SelectItem value="development">Development Services</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description</Label>
        <Input
          id="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
          placeholder="Brief one-line description for cards"
        />
        {errors.shortDescription && <p className="text-sm text-red-500 mt-1">{errors.shortDescription}</p>}
      </div>

      <div>
        <Label htmlFor="description">Full Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the service"
          rows={4}
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (in cents)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
            placeholder="49700"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Display: {formatPrice(formData.price)}
          </p>
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
        </div>

        <div>
          <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
          <Input
            id="estimatedDelivery"
            value={formData.estimatedDelivery}
            onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
            placeholder="5-7 business days"
          />
          {errors.estimatedDelivery && <p className="text-sm text-red-500 mt-1">{errors.estimatedDelivery}</p>}
        </div>
      </div>

      <div>
        <Label>Features</Label>
        <div className="space-y-2 mt-2">
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder="Feature description"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFeature(index)}
                disabled={formData.features.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addFeature}>
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>
        </div>
        {errors.features && <p className="text-sm text-red-500 mt-1">{errors.features}</p>}
      </div>

      <div>
        <Label htmlFor="videoUrl">Video URL (Optional)</Label>
        <Input
          id="videoUrl"
          type="url"
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          placeholder="https://www.youtube.com/embed/..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stripeProductId">Stripe Product ID (Optional)</Label>
          <Input
            id="stripeProductId"
            value={formData.stripeProductId}
            onChange={(e) => setFormData({ ...formData, stripeProductId: e.target.value })}
            placeholder="prod_..."
          />
        </div>

        <div>
          <Label htmlFor="stripePriceId">Stripe Price ID (Optional)</Label>
          <Input
            id="stripePriceId"
            value={formData.stripePriceId}
            onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
            placeholder="price_..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="popularService"
            checked={formData.popularService}
            onCheckedChange={(checked) => setFormData({ ...formData, popularService: checked })}
          />
          <Label htmlFor="popularService">Popular Service</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <div>
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            min="1"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminDfyServicesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingService, setEditingService] = useState<DfyService | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'purchases'>('services');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/admin/dfy-services'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dfy-services');
      return response.json() as Promise<DfyService[]>;
    }
  });

  // Fetch purchases
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['/api/admin/dfy-services/purchases'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/dfy-services/purchases');
      return response.json() as Promise<ServicePurchase[]>;
    }
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const response = await apiRequest('POST', '/api/admin/dfy-services', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dfy-services'] });
      setShowCreateDialog(false);
      toast({
        title: "Service Created",
        description: "DFY service created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServiceFormData> }) => {
      const response = await apiRequest('PATCH', `/api/admin/dfy-services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dfy-services'] });
      setEditingService(null);
      toast({
        title: "Service Updated",
        description: "DFY service updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/dfy-services/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dfy-services'] });
      toast({
        title: "Service Deleted",
        description: "DFY service deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    }
  });

  // Update purchase mutation
  const updatePurchaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServicePurchase> }) => {
      const response = await apiRequest('PATCH', `/api/admin/dfy-services/purchases/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dfy-services/purchases'] });
      toast({
        title: "Purchase Updated",
        description: "Purchase status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update purchase",
        variant: "destructive",
      });
    }
  });

  const totalRevenue = purchases
    .filter(p => p.paymentStatus === 'succeeded')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const completedServices = purchases.filter(p => p.serviceStatus === 'completed').length;
  const activeServices = purchases.filter(p => ['pending', 'in_progress'].includes(p.serviceStatus)).length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">DFY Services Management</h1>
            <p className="text-muted-foreground">
              Manage your Done-For-You services catalog and track purchases
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">
              {services.filter(s => s.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {purchases.filter(p => p.paymentStatus === 'succeeded').length} paid purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
            <p className="text-xs text-muted-foreground">
              In progress or pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedServices}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              Services Management
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'purchases'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              Purchase Management
              {purchases.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {purchases.length}
                </Badge>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {servicesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading services...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {service.name}
                          {service.popularService && (
                            <Badge variant="default" className="gap-1">
                              <Star className="w-3 h-3" />
                              Popular
                            </Badge>
                          )}
                          {!service.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {service.shortDescription}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatPrice(service.price)}</div>
                          <div className="text-sm text-muted-foreground">
                            Order #{service.displayOrder}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingService(service)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteServiceMutation.mutate(service.id)}
                            disabled={deleteServiceMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Features</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {service.features.map((feature, index) => (
                            <div key={index} className="text-sm flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>Category: {service.category}</span>
                        <span>Delivery: {service.estimatedDelivery}</span>
                        <span>Created: {new Date(service.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {purchasesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading purchases...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <Card key={purchase.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      <div>
                        <h4 className="font-medium">{purchase.service.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {purchase.user.firstName} {purchase.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {purchase.user.email}
                        </p>
                      </div>
                      
                      <div>
                        <div className="font-medium">{formatPrice(purchase.amountPaid)}</div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </p>
                        <Badge variant={
                          purchase.paymentStatus === 'succeeded' ? 'default' :
                          purchase.paymentStatus === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {purchase.paymentStatus}
                        </Badge>
                      </div>

                      <div>
                        <Select
                          value={purchase.serviceStatus}
                          onValueChange={(value) => updatePurchaseMutation.mutate({
                            id: purchase.id,
                            data: { serviceStatus: value as any }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        {purchase.purchaseNotes && (
                          <div className="p-2 bg-muted rounded text-sm">
                            <strong>Notes:</strong> {purchase.purchaseNotes}
                          </div>
                        )}
                        <Textarea
                          placeholder="Delivery notes..."
                          value={purchase.deliveryNotes || ''}
                          onChange={(e) => updatePurchaseMutation.mutate({
                            id: purchase.id,
                            data: { deliveryNotes: e.target.value }
                          })}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Service Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New DFY Service</DialogTitle>
            <DialogDescription>
              Add a new Done-For-You service to your catalog
            </DialogDescription>
          </DialogHeader>
          <ServiceForm
            onSubmit={(data) => createServiceMutation.mutate(data)}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={createServiceMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit DFY Service</DialogTitle>
            <DialogDescription>
              Update the service details and configuration
            </DialogDescription>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              service={editingService}
              onSubmit={(data) => updateServiceMutation.mutate({
                id: editingService.id,
                data
              })}
              onCancel={() => setEditingService(null)}
              isSubmitting={updateServiceMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}