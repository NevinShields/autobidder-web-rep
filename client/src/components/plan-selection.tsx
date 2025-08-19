import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

const SUBSCRIPTION_PLANS = {
  standard: {
    name: 'Standard',
    monthlyPrice: 49,
    yearlyPrice: 41, // ~17% discount
    popular: false,
    features: [
      '5 pricing calculators',
      '500 leads per month',
      'Basic customization',
      'Email support'
    ]
  },
  plus: {
    name: 'Plus Plan',
    monthlyPrice: 97,
    yearlyPrice: 81, // ~17% discount
    popular: true,
    features: [
      '25 pricing calculators',
      '2,500 leads per month',
      'Advanced customization',
      'Calendar integration',
      'Analytics dashboard',
      'Priority support'
    ]
  },
  plusSeo: {
    name: 'Plus SEO',
    monthlyPrice: 297,
    yearlyPrice: 247, // ~17% discount
    popular: false,
    features: [
      'Unlimited calculators',
      'Unlimited leads',
      'White-label branding',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Dedicated support'
    ]
  }
};

interface PlanSelectionProps {
  onPlanSelect?: () => void;
  className?: string;
}

export function PlanSelection({ onPlanSelect, className }: PlanSelectionProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async ({ planId, billingPeriod }: { planId: string, billingPeriod: string }) => {
      const res = await apiRequest("POST", "/api/create-checkout-session", { planId, billingPeriod });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe checkout
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (planId: string) => {
    checkoutMutation.mutate({ planId, billingPeriod });
    onPlanSelect?.();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === 'yearly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
          <Card key={planId} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                    /{billingPeriod === 'monthly' ? 'month' : 'month'}
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Billed yearly (${plan.yearlyPrice * 12})
                  </div>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanSelect(planId)}
                disabled={checkoutMutation.isPending}
                className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {checkoutMutation.isPending ? 'Creating...' : `Choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        All plans include a 14-day free trial. Cancel anytime.
      </div>
    </div>
  );
}

interface UpgradeButtonProps {
  currentPlan?: string;
  currentBillingPeriod?: string;
  className?: string;
}

export function UpgradeButton({ 
  currentPlan = 'trial', 
  currentBillingPeriod = 'monthly', 
  className 
}: UpgradeButtonProps) {
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const { toast } = useToast();

  // Customer Portal mutation for existing subscribers
  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-portal-session");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      let title = "Portal Access Failed";
      let description = error.message;
      
      if (error.message?.includes('configuration_required') || error.message?.includes('not been activated')) {
        title = "Portal Setup Required";
        description = "Customer Portal needs to be activated in your Stripe dashboard.";
      } else if (error.message?.includes('No Stripe customer ID')) {
        title = "Payment Setup Required";
        description = "Please complete a payment first to access billing management.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  // For users without a subscription, show plan selection
  if (currentPlan === 'trial') {
    if (showPlanSelection) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select the plan that best fits your business needs
            </p>
          </div>
          
          <PlanSelection onPlanSelect={() => setShowPlanSelection(false)} />
          
          <div className="text-center mt-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowPlanSelection(false)}
            >
              Back
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <Button
        onClick={() => setShowPlanSelection(true)}
        className={className}
      >
        Upgrade Plan
      </Button>
    );
  }

  // For users with a subscription, show Customer Portal
  return (
    <Button
      onClick={() => portalMutation.mutate()}
      disabled={portalMutation.isPending}
      className={`${className} flex items-center gap-2`}
    >
      <ExternalLink className="w-4 h-4" />
      {portalMutation.isPending ? "Opening..." : "Change Plan"}
    </Button>
  );
}