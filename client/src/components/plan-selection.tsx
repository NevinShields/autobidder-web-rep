import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ExternalLink, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    <div className={`space-y-8 ${className}`}>
      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              billingPeriod === 'yearly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700 border-none">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
          <Card key={planId} className={`relative transition-all duration-300 hover:shadow-lg ${
            plan.popular 
              ? 'border-2 border-blue-500 shadow-md bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900' 
              : 'hover:border-gray-300 dark:hover:border-gray-600'
          }`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-medium shadow-lg">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pt-6 pb-4">
              <CardTitle className="text-xl font-bold mb-2">{plan.name}</CardTitle>
              <CardDescription className="space-y-1">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                    /month
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Billed yearly (${plan.yearlyPrice * 12}/year)
                  </div>
                )}
                {billingPeriod === 'monthly' && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Billed monthly
                  </div>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanSelect(planId)}
                disabled={checkoutMutation.isPending}
                className={`w-full py-2.5 text-sm font-medium ${
                  plan.popular 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'border-2 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {checkoutMutation.isPending ? 'Creating...' : `Choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4 border-t">
        <p className="text-gray-600 dark:text-gray-400 mb-1">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Secure checkout powered by Stripe
        </p>
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

  // For users without a subscription, show plan selection in modal
  if (currentPlan === 'trial') {
    return (
      <>
        <Button
          onClick={() => setShowPlanSelection(true)}
          className={className}
        >
          Upgrade Plan
        </Button>

        <Dialog open={showPlanSelection} onOpenChange={setShowPlanSelection}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-center">
                  Choose Your Plan
                </DialogTitle>
                <DialogDescription className="text-center text-lg mt-2">
                  Select the plan that best fits your business needs and start your 14-day free trial
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6">
              <PlanSelection onPlanSelect={() => setShowPlanSelection(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </>
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