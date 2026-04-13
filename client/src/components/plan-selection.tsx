import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Sparkles, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

const SUBSCRIPTION_PLANS = {
  standard: {
    name: 'Standard',
    monthlyPrice: 49,
    yearlyPrice: 41.42,
    yearlyTotal: 497,
    popular: false,
    features: [
      'Custom Price Calculations',
      'Lead Generation',
      'Scheduling',
      'Custom Design Editor',
      'Custom Logic Builder',
      'Spam Filter',
      'Template Library',
      'Stats Panel',
      'Facebook Pixel Tracking',
      'Google Tracking'
    ]
  },
  plus: {
    name: 'Plus',
    monthlyPrice: 97,
    yearlyPrice: 83.08,
    yearlyTotal: 997,
    popular: true,
    features: [
      'Everything in Standard',
      'Location Filtering',
      'Bid Approval System',
      'Zapier Integration',
      'Website Included',
      'Team Members',
      'Multi Forms'
    ]
  },
  plusSeo: {
    name: 'Plus SEO',
    monthlyPrice: 297,
    yearlyPrice: 247.50,
    yearlyTotal: 2970,
    popular: false,
    features: [
      'Everything in Plus',
      'Monthly SEO Done For You',
      'Access to SEO Dashboard',
      'Premium Support'
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

  const surfaceClassName =
    "rounded-[24px] border border-slate-200/70 bg-white/85 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.24)] backdrop-blur-sm transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/75";

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
        <div className="inline-flex items-center rounded-2xl border border-amber-200/70 bg-white/85 p-1.5 shadow-sm backdrop-blur-sm dark:border-amber-500/20 dark:bg-slate-900/75">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_12px_24px_-16px_rgba(234,88,12,0.9)]'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_12px_24px_-16px_rgba(234,88,12,0.9)]'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Yearly
            <Badge className="ml-2 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
          <Card key={planId} className={`relative overflow-hidden ${surfaceClassName} hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)] ${
            plan.popular 
              ? 'border-amber-300/80 bg-gradient-to-b from-amber-50 via-white to-orange-50 dark:border-amber-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950' 
              : ''
          }`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-xs font-medium text-white shadow-lg">
                  Most Popular
                </Badge>
              </div>
            )}

            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
            
            <CardHeader className="text-center pt-6 pb-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_16px_24px_-18px_rgba(234,88,12,0.95)]">
                {plan.popular ? <Sparkles className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              </div>
              <CardTitle
                className="mb-2 text-2xl tracking-tight text-slate-950 dark:text-white"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                {plan.name}
              </CardTitle>
              <CardDescription className="space-y-2">
                <div className="text-4xl text-slate-950 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  <span className="ml-1 text-base font-normal font-sans text-slate-500 dark:text-slate-400">
                    /month
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Billed yearly (${plan.yearlyTotal}/year)
                  </div>
                )}
                {billingPeriod === 'monthly' && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Billed monthly
                  </div>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-6">
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-3 dark:border-slate-800/80 dark:bg-slate-900/60">
                    <CheckCircle className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span className="text-sm leading-6 text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanSelect(planId)}
                disabled={checkoutMutation.isPending}
                className={`h-11 w-full rounded-xl text-sm font-medium transition-all duration-200 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_18px_32px_-18px_rgba(234,88,12,0.95)] hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500' 
                    : 'border border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800'
                }`}
                variant={plan.popular ? 'unstyled' : 'unstyled'}
              >
                {checkoutMutation.isPending ? 'Creating...' : `Choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-[20px] border border-slate-200/70 bg-white/80 px-6 py-5 text-center shadow-sm backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/70">
        <p className="mb-1 text-slate-600 dark:text-slate-300">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
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
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto rounded-[28px] border border-slate-200/70 bg-white/95 p-0 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95">
            <div className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">
              <DialogHeader>
                <DialogTitle
                  className="text-center text-3xl tracking-tight text-slate-950 dark:text-white"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  Choose Your Plan
                </DialogTitle>
                <DialogDescription className="mt-2 text-center text-base text-slate-600 dark:text-slate-300">
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
