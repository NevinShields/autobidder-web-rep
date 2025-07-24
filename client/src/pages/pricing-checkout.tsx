import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle, Star, Zap, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PlanConfig {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
  borderColor: string;
  popular?: boolean;
  features: string[];
}

const PLANS: Record<string, PlanConfig> = {
  starter: {
    name: 'Starter',
    monthlyPrice: 49,
    yearlyPrice: 49 * 10, // ~17% discount
    icon: <Star className="h-6 w-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    features: [
      '5 pricing calculators',
      '500 leads per month',
      'Basic customization',
      'Email support'
    ]
  },
  professional: {
    name: 'Professional',
    monthlyPrice: 97,
    yearlyPrice: 97 * 10, // ~17% discount
    icon: <Zap className="h-6 w-6" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
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
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 297,
    yearlyPrice: 297 * 10, // ~17% discount
    icon: <Crown className="h-6 w-6" />,
    color: "text-gold-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
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

interface PricingCheckoutProps {
  selectedPlan?: keyof typeof PLANS;
  userEmail?: string;
  userId?: string;
}

export default function PricingCheckout({ selectedPlan = 'professional', userEmail, userId }: PricingCheckoutProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckout = async (planId: keyof typeof PLANS) => {
    if (!userEmail || !userId) {
      toast({
        title: "Authentication Required",
        description: "Please complete registration first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(planId);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          billingPeriod: isYearly ? 'yearly' : 'monthly',
          userEmail,
          userId
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const calculateSavings = (monthlyPrice: number) => {
    const yearlySavings = (monthlyPrice * 12) - (monthlyPrice * 10);
    const savingsPercentage = Math.round((yearlySavings / (monthlyPrice * 12)) * 100);
    return { yearlySavings, savingsPercentage };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start building professional pricing calculators today
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Label htmlFor="billing-toggle" className={!isYearly ? "text-gray-900 font-medium" : "text-gray-500"}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? "text-gray-900 font-medium" : "text-gray-500"}>
              Yearly
              <Badge variant="secondary" className="ml-2 text-green-700 bg-green-100">
                Save 17%
              </Badge>
            </Label>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(PLANS).map(([planId, plan]) => {
            const { yearlySavings, savingsPercentage } = calculateSavings(plan.monthlyPrice);
            const currentPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isSelected = planId === selectedPlan;
            
            return (
              <Card 
                key={planId}
                className={`relative transition-all duration-200 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className={`text-center ${plan.bgColor} rounded-t-lg`}>
                  <div className={`mx-auto mb-4 ${plan.color}`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">
                    <span className="text-3xl font-bold text-gray-900">
                      ${isYearly ? (currentPrice / 10).toFixed(0) : currentPrice}
                    </span>
                    <span className="text-gray-600">
                      /{isYearly ? 'month' : 'month'}
                    </span>
                  </CardDescription>
                  {isYearly && (
                    <p className="text-sm text-green-600 font-medium">
                      Save ${yearlySavings} ({savingsPercentage}%) yearly
                    </p>
                  )}
                </CardHeader>

                <CardContent className="p-6">
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : isSelected
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    onClick={() => handleCheckout(planId as keyof typeof PLANS)}
                    disabled={loading === planId}
                  >
                    {loading === planId ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `Start ${plan.name} Plan`
                    )}
                  </Button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include 14-day free trial • Cancel anytime • No setup fees
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>✓ SSL Security</span>
            <span>✓ 99.9% Uptime</span>
            <span>✓ GDPR Compliant</span>
            <span>✓ 24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}