import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface UpgradeButtonProps {
  currentPlan?: string;
  currentBillingPeriod?: string;
  className?: string;
}

const PLANS = {
  standard: {
    name: 'Standard',
    icon: Zap,
    color: 'bg-blue-500',
    features: ['Up to 5 calculators', 'Basic templates', 'Email support'],
    monthly: 49,
    yearly: 490 // ~17% discount for yearly
  },
  plus: {
    name: 'Plus',
    icon: Crown,
    color: 'bg-purple-500',
    features: ['Up to 25 calculators', 'Premium templates', 'Priority support', 'Custom branding'],
    monthly: 97,
    yearly: 970 // ~17% discount for yearly
  },
  plusSeo: {
    name: 'Plus SEO',
    icon: Sparkles,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    features: ['Unlimited calculators', 'All templates', '24/7 support', 'Custom branding', 'SEO optimization', 'Advanced analytics'],
    monthly: 297,
    yearly: 2970 // ~17% discount for yearly
  }
};

export function UpgradeButton({ 
  currentPlan = 'trial', 
  currentBillingPeriod = 'monthly', 
  className 
}: UpgradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan || 'standard');
  const [selectedBilling, setSelectedBilling] = useState(currentBillingPeriod || 'monthly');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async ({ planId, billingPeriod }: { planId: string; billingPeriod: string }) => {
      return await apiRequest('POST', '/api/change-subscription', {
        newPlanId: planId,
        newBillingPeriod: billingPeriod
      });
    },
    onSuccess: async (data: any) => {
      console.log('Subscription change response:', data);
      
      // Handle payment required for trial users
      if (data.requiresPayment && data.clientSecret) {
        console.log('Payment required, client secret:', data.clientSecret);
        
        const stripe = await stripePromise;
        if (!stripe) {
          toast({
            title: 'Payment Error',
            description: 'Failed to load payment system',
            variant: 'destructive'
          });
          return;
        }

        // Create a payment element for the subscription
        const { error } = await stripe.confirmPayment({
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/profile?payment=success&subscription_id=${data.subscriptionId}`,
          },
          redirect: 'if_required'
        });

        if (error) {
          console.error('Payment confirmation error:', error);
          toast({
            title: 'Payment Failed',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Payment Confirmed',
            description: 'Your subscription is now active!',
          });
          queryClient.invalidateQueries({ queryKey: ['/api/subscription-details'] });
          queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
          setIsOpen(false);
        }
      } else {
        // Regular subscription update
        toast({
          title: 'Subscription Updated',
          description: 'Your plan has been successfully updated.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription-details'] });
        queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
        setIsOpen(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive'
      });
    }
  });

  const handleUpgrade = () => {
    if (selectedPlan === currentPlan && selectedBilling === currentBillingPeriod && currentPlan !== 'trial') {
      toast({
        title: 'No Changes',
        description: 'You are already on this plan and billing period.',
        variant: 'destructive'
      });
      return;
    }

    upgradeMutation.mutate({
      planId: selectedPlan,
      billingPeriod: selectedBilling
    });
  };

  const getCurrentPlanIndex = () => {
    const planOrder = ['standard', 'plus', 'plusSeo'];
    return planOrder.indexOf(currentPlan);
  };

  const getSelectedPlanIndex = () => {
    const planOrder = ['standard', 'plus', 'plusSeo'];
    return planOrder.indexOf(selectedPlan);
  };

  const isUpgrade = getSelectedPlanIndex() > getCurrentPlanIndex();
  const isDowngrade = getSelectedPlanIndex() < getCurrentPlanIndex();
  const isSamePlan = selectedPlan === currentPlan;
  const isDifferentBilling = selectedBilling !== currentBillingPeriod;

  const getActionText = () => {
    if (isSamePlan && isDifferentBilling) {
      return selectedBilling === 'yearly' ? 'Switch to Yearly' : 'Switch to Monthly';
    }
    if (isUpgrade) return 'Upgrade Plan';
    if (isDowngrade) return 'Downgrade Plan';
    return 'Update Plan';
  };

  const getPrice = (plan: keyof typeof PLANS, billing: string) => {
    return billing === 'yearly' ? PLANS[plan].yearly : PLANS[plan].monthly;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          Change Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Change Your Subscription</DialogTitle>
          <DialogDescription>
            Choose your new plan and billing period. Changes are prorated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Period Toggle */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-4 bg-muted p-1 rounded-lg">
              <Button
                variant={selectedBilling === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedBilling('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={selectedBilling === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedBilling('yearly')}
                className="relative"
              >
                Yearly
                <Badge className="ml-2 bg-green-500 text-white text-xs">
                  Save 20%
                </Badge>
              </Button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(PLANS).map(([planId, plan]) => {
              const Icon = plan.icon;
              const isCurrentPlan = planId === currentPlan;
              const isSelected = planId === selectedPlan;
              const price = getPrice(planId as keyof typeof PLANS, selectedBilling);

              return (
                <Card
                  key={planId}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  } ${isCurrentPlan ? 'border-primary' : ''}`}
                  onClick={() => setSelectedPlan(planId)}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className={`p-3 rounded-full ${plan.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <CardTitle className="flex items-center justify-center gap-2">
                      {plan.name}
                      {isCurrentPlan && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <div className="text-2xl font-bold">
                        ${selectedBilling === 'yearly' ? price.toFixed(0) : price.toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{selectedBilling === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      {selectedBilling === 'yearly' && (
                        <div className="text-sm text-green-600">
                          Save ${(plan.monthly * 12 - plan.yearly).toFixed(0)}/year
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Current vs New Plan Summary */}
          {(selectedPlan !== currentPlan || selectedBilling !== currentBillingPeriod) && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Plan Change Summary</h4>
              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-muted-foreground">
                    Current: {currentPlan === 'trial' ? 'Trial' : (PLANS[currentPlan as keyof typeof PLANS]?.name || 'Unknown')} ({currentBillingPeriod})
                  </div>
                  <div className="font-medium">New: {PLANS[selectedPlan as keyof typeof PLANS].name} ({selectedBilling})</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">
                    {currentPlan === 'trial' ? 'Free' : `$${getPrice(currentPlan as keyof typeof PLANS, currentBillingPeriod).toFixed(0)}/${currentBillingPeriod === 'yearly' ? 'year' : 'month'}`}
                  </div>
                  <div className="font-medium">
                    ${getPrice(selectedPlan as keyof typeof PLANS, selectedBilling).toFixed(0)}/{selectedBilling === 'yearly' ? 'year' : 'month'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpgrade}
              disabled={upgradeMutation.isPending || (selectedPlan === currentPlan && selectedBilling === currentBillingPeriod)}
            >
              {upgradeMutation.isPending ? 'Processing...' : getActionText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}