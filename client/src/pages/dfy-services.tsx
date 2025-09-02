import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ShoppingCart, Star, Clock, CheckCircle, AlertCircle, Play, CreditCard, History } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/dashboard-layout';

// Stripe setup
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

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

function PaymentForm({ service, clientSecret, onSuccess, onError, notes }: {
  service: DfyService;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  notes: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dfy-services`,
      },
    });

    if (error) {
      onError(error.message || 'Payment failed');
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{service.name}</h3>
        <p className="text-2xl font-bold text-primary">{formatPrice(service.price)}</p>
        {notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm"><strong>Notes:</strong> {notes}</p>
          </div>
        )}
      </div>
      
      <PaymentElement />
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        size="lg"
      >
        {isProcessing ? 'Processing...' : `Pay ${formatPrice(service.price)}`}
      </Button>
    </form>
  );
}

function ServiceCard({ service, userPurchases }: { service: DfyService; userPurchases: ServicePurchase[] }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const existingPurchase = userPurchases.find(p => p.serviceId === service.id);

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/dfy-services/${service.id}/create-payment-intent`, {
        notes: notes.trim() || undefined
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to set up payment",
        variant: "destructive",
      });
    }
  });

  const handlePurchaseSuccess = () => {
    setShowPayment(false);
    setClientSecret(null);
    setNotes('');
    queryClient.invalidateQueries({ queryKey: ['/api/dfy-services/purchases'] });
    toast({
      title: "Purchase Successful!",
      description: `You've successfully purchased ${service.name}. We'll start working on your project soon.`,
    });
  };

  const handlePurchaseError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
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

        <CardFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(true)}
            className="flex-1"
          >
            View Details
          </Button>
          {existingPurchase ? (
            <Button variant="secondary" disabled className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Purchased
            </Button>
          ) : (
            <Button 
              onClick={() => createPaymentIntentMutation.mutate()}
              disabled={createPaymentIntentMutation.isPending || !user}
              className="flex-1"
            >
              {createPaymentIntentMutation.isPending ? (
                'Setting up...'
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase
                </>
              )}
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
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            {!existingPurchase && user && (
              <Button 
                onClick={() => {
                  setShowDetails(false);
                  createPaymentIntentMutation.mutate();
                }}
                disabled={createPaymentIntentMutation.isPending}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Purchase Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
            <DialogDescription>
              Complete your payment to get started with {service.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Special Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or notes for your project..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  service={service}
                  clientSecret={clientSecret}
                  onSuccess={handlePurchaseSuccess}
                  onError={handlePurchaseError}
                  notes={notes}
                />
              </Elements>
            )}
          </div>
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