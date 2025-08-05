import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Crown, 
  Check, 
  Calculator, 
  Users, 
  BarChart3, 
  Zap, 
  Star,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface PlanUpgradeProps {
  currentPlan: string;
  trialEndDate?: string;
  isTrialing: boolean;
}

const PLANS = {
  standard: {
    name: 'Standard',
    monthlyPrice: 49,
    yearlyPrice: 490, // ~17% discount
    features: [
      '5 pricing calculators',
      '500 leads per month',
      'Basic customization',
      'Email support'
    ],
    icon: Calculator,
    popular: false
  },
  plus: {
    name: 'Plus Plan',
    monthlyPrice: 97,
    yearlyPrice: 970, // ~17% discount
    features: [
      '25 pricing calculators',
      '2,500 leads per month',
      'Advanced customization',
      'Calendar integration',
      'Analytics dashboard',
      'Priority support'
    ],
    icon: Star,
    popular: true
  },
  plusSeo: {
    name: 'Plus SEO',
    monthlyPrice: 297,
    yearlyPrice: 2970, // ~17% discount
    features: [
      'Unlimited calculators',
      'Unlimited leads',
      'White-label branding',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Dedicated support'
    ],
    icon: Crown,
    popular: false
  }
};

export default function PlanUpgrade({ 
  currentPlan, 
  trialEndDate, 
  isTrialing 
}: PlanUpgradeProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>('plus');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const upgradeMutation = useMutation({
    mutationFn: async ({ planId, billing }: { planId: keyof typeof PLANS; billing: 'monthly' | 'yearly' }) => {
      const res = await apiRequest("POST", "/api/create-checkout-session", {
        planId,
        billingPeriod: billing
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number) => {
    return `$${price}`;
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const yearlySavings = (monthly * 12) - yearly;
    const percentSavings = Math.round((yearlySavings / (monthly * 12)) * 100);
    return { amount: yearlySavings, percent: percentSavings };
  };

  const formatTrialEndDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
        </div>
        {isTrialing && trialEndDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              Your trial ends on {formatTrialEndDate(trialEndDate)}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Upgrade now to continue using all features without interruption
            </p>
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4 bg-gray-50 rounded-lg p-4">
        <Label htmlFor="billing-toggle" className={billingPeriod === 'monthly' ? 'font-semibold' : 'text-gray-600'}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={billingPeriod === 'yearly'}
          onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
        />
        <Label htmlFor="billing-toggle" className={billingPeriod === 'yearly' ? 'font-semibold' : 'text-gray-600'}>
          Yearly
        </Label>
        {billingPeriod === 'yearly' && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Save up to 17%
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([planId, plan]) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === planId;
          const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);

          return (
            <Card 
              key={planId}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-200' : ''
              } ${
                plan.popular ? 'border-blue-300 shadow-md' : ''
              }`}
              onClick={() => setSelectedPlan(planId as keyof typeof PLANS)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`w-8 h-8 ${plan.popular ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {formatPrice(price)}
                    <span className="text-sm font-normal text-gray-600">
                      /{billingPeriod === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {formatPrice(savings.amount)}/year
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                      <ArrowRight className="w-4 h-4" />
                      Selected Plan
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Button */}
      <div className="text-center pt-4">
        <Button 
          size="lg"
          onClick={() => upgradeMutation.mutate({ 
            planId: selectedPlan, 
            billing: billingPeriod 
          })}
          disabled={upgradeMutation.isPending}
          className="w-full md:w-auto px-8 py-3 text-lg font-semibold"
        >
          {upgradeMutation.isPending ? (
            "Processing..."
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Upgrade to {PLANS[selectedPlan].name}
            </>
          )}
        </Button>
        <p className="text-sm text-gray-600 mt-3">
          Secure payment powered by Stripe • Cancel anytime
        </p>
      </div>

      {/* Feature Comparison */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4 text-center">All plans include:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Lead capture forms
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Email notifications
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Mobile responsive
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            SSL security
          </div>
        </div>
      </div>
    </div>
  );
}