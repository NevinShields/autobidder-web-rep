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
    <div className={`space-y-10 py-8 ${className}`}>
      {/* Billing Period Toggle */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
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
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8 max-w-7xl mx-auto">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
          <Card key={planId} className={`relative transition-all duration-300 hover:shadow-xl ${
            plan.popular 
              ? 'border-2 border-blue-500 shadow-lg scale-105 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900' 
              : 'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600'
          }`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm font-medium shadow-lg">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pt-8 pb-6">
              <CardTitle className="text-2xl font-bold mb-3">{plan.name}</CardTitle>
              <CardDescription className="space-y-2">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
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

            <CardContent className="space-y-6 px-6 pb-8">
              <ul className="space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanSelect(planId)}
                disabled={checkoutMutation.isPending}
                size="lg"
                className={`w-full py-3 text-base font-medium ${
                  plan.popular 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
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

      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
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

  // For users without a subscription, show plan selection
  if (currentPlan === 'trial') {
    if (showPlanSelection) {
      return (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Select the plan that best fits your business needs and start your 14-day free trial
            </p>
          </div>
          
          <PlanSelection onPlanSelect={() => setShowPlanSelection(false)} />
          
          <div className="text-center mt-12">
            <Button 
              variant="ghost" 
              size="lg"
              onClick={() => setShowPlanSelection(false)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ← Back
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