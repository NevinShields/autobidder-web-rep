import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Star, Clock, CheckCircle, AlertCircle, CreditCard, History } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/dashboard-layout';

// Stripe checkout URLs mapping
const STRIPE_CHECKOUT_URLS: Record<string, string> = {
  "Setup Autobidder for the User": "https://buy.stripe.com/bJecN7ffYaXm68ib6B9k403",
  "DFY Website Design (Basic)": "https://buy.stripe.com/6oU7sN9VEc1qaoy6Ql9k400", 
  "Add Extra Website Page": "https://buy.stripe.com/5kQ3cxebU9TibsC8Yt9k401",
  "DFY Website (SEO Boost)": "https://buy.stripe.com/00wbJ38RA6H62W61w19k402"
};

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
}

function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(0)}`;
}

// Helper function to get Stripe checkout URL for a service
function getStripeCheckoutUrl(serviceName: string): string | null {
  return STRIPE_CHECKOUT_URLS[serviceName] || null;
}

function ServiceCard({ service, userPurchases }: { service: DfyService; userPurchases: ServicePurchase[] }) {
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();

  const existingPurchase = userPurchases.find(p => p.serviceId === service.id);
  const stripeCheckoutUrl = getStripeCheckoutUrl(service.name);

  const handlePurchaseClick = () => {
    if (stripeCheckoutUrl) {
      // Open Stripe checkout in new tab
      window.open(stripeCheckoutUrl, '_blank');
    }
  };

  const getStatusBadge = () => {
    if (!existingPurchase) return null;

    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending Setup' },
      in_progress: { variant: 'default' as const, icon: AlertCircle, text: 'In Progress' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle, text: 'Cancelled' }
    };

    const config = statusConfig[existingPurchase.serviceStatus];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{service.name}</CardTitle>
              {service.popularService && (
                <Badge variant="default" className="mb-2 gap-1">
                  <Star className="w-3 h-3" />
                  Popular
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{formatPrice(service.price)}</div>
              {getStatusBadge()}
            </div>
          </div>
          <CardDescription className="text-sm">
            {service.shortDescription}
          </CardDescription>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{service.estimatedDelivery}</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">What's included:</h4>
            <ul className="text-sm space-y-1">
              {service.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
              {service.features.length > 4 && (
                <li className="text-muted-foreground">
                  +{service.features.length - 4} more features...
                </li>
              )}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(true)}
            className="flex-1 min-w-0 text-sm"
            data-testid="button-view-details"
          >
            <span className="truncate">View Details</span>
          </Button>
          {existingPurchase ? (
            <Button variant="secondary" disabled className="flex-1 min-w-0 text-sm" data-testid="button-purchased">
              <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Purchased</span>
            </Button>
          ) : (
            <Button 
              onClick={handlePurchaseClick}
              disabled={!user || !stripeCheckoutUrl}
              className="flex-1 min-w-0 text-sm"
              data-testid="button-purchase"
            >
              <CreditCard className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Purchase</span>
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Service Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {service.name}
              {service.popularService && (
                <Badge variant="default" className="gap-1">
                  <Star className="w-3 h-3" />
                  Popular
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold text-primary">{formatPrice(service.price)}</span>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{service.estimatedDelivery}</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {service.videoUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={service.videoUrl}
                  title={`${service.name} Demo`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Everything Included</h4>
              <div className="grid gap-2">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {existingPurchase && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">You've purchased this service</span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Status: {getStatusBadge()}</p>
                  <p>Purchased: {new Date(existingPurchase.createdAt).toLocaleDateString()}</p>
                  {existingPurchase.deliveryNotes && (
                    <p>Notes: {existingPurchase.deliveryNotes}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)} data-testid="button-close-details">
              Close
            </Button>
            {!existingPurchase && user && stripeCheckoutUrl && (
              <Button 
                onClick={() => {
                  setShowDetails(false);
                  handlePurchaseClick();
                }}
                data-testid="button-purchase-now"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Purchase Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

function PurchaseHistory({ purchases }: { purchases: ServicePurchase[] }) {
  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No purchases yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <Card key={purchase.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{purchase.service.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Purchased {new Date(purchase.createdAt).toLocaleDateString()}
                </p>
                {purchase.purchaseNotes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Notes: {purchase.purchaseNotes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatPrice(purchase.amountPaid)}</div>
                <Badge variant={
                  purchase.serviceStatus === 'completed' ? 'default' :
                  purchase.serviceStatus === 'in_progress' ? 'secondary' :
                  purchase.serviceStatus === 'cancelled' ? 'destructive' : 'outline'
                }>
                  {purchase.serviceStatus.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DfyServicesPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'purchases'>('services');
  const { user } = useAuth();

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/dfy-services'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dfy-services');
      return response.json() as Promise<DfyService[]>;
    }
  });

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['/api/dfy-services/purchases'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dfy-services/purchases');
      return response.json() as Promise<ServicePurchase[]>;
    },
    enabled: !!user
  });

  const categorizedServices = services?.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, DfyService[]>) || {};

  const categoryNames = {
    setup: 'Setup & Configuration',
    website: 'Website Services',
    seo: 'SEO & Marketing',
    design: 'Design Services',
    development: 'Development Services'
  };

  // Define the desired category order
  const categoryOrder = ['setup', 'website', 'seo', 'design', 'development'];

  if (servicesLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading services...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Done-For-You Services</h1>
        <p className="text-muted-foreground text-lg">
          Professional services to help grow your business. Let our experts handle the work while you focus on what matters most.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
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
              Available Services
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('purchases')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'purchases'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                My Purchases
                {purchases.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {purchases.length}
                  </Badge>
                )}
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'services' ? (
        <div className="space-y-12">
          {categoryOrder
            .filter(category => categorizedServices[category]?.length > 0)
            .map((category) => (
            <div key={category}>
              <h2 className="text-2xl font-semibold mb-6">
                {categoryNames[category as keyof typeof categoryNames] || category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorizedServices[category].map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    userPurchases={purchases}
                  />
                ))}
              </div>
            </div>
          ))}
          
          {/* Handle any categories not in the predefined order */}
          {Object.entries(categorizedServices)
            .filter(([category]) => !categoryOrder.includes(category))
            .map(([category, categoryServices]) => (
            <div key={category}>
              <h2 className="text-2xl font-semibold mb-6">
                {categoryNames[category as keyof typeof categoryNames] || category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    userPurchases={purchases}
                  />
                ))}
              </div>
            </div>
          ))}

          {(!services || services.length === 0) && (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Services Available</h3>
                <p className="text-muted-foreground">
                  Our service catalog is being updated. Check back soon for new offerings!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Purchase History</h2>
          {purchasesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading purchases...</p>
            </div>
          ) : (
            <PurchaseHistory purchases={purchases} />
          )}
        </div>
      )}

      {!user && activeTab === 'services' && (
        <div className="mt-8 p-6 bg-muted rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">Ready to get started?</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to purchase services and track your projects.
          </p>
          <Button asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}