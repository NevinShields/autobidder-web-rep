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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Crown, Sparkles, Zap, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { SubscriptionChangePreview } from './subscription-change-preview';
import { Separator } from '@/components/ui/separator';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface UpgradeButtonProps {
  currentPlan?: string;
  currentBillingPeriod?: string;
  className?: string;
}

export const PLANS = {
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
  const [showPreview, setShowPreview] = useState(false);
  const [prorationPreview, setProrationPreview] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async ({ planId, billingPeriod }: { planId: string; billingPeriod: string }) => {
      const response = await apiRequest('POST', '/api/change-subscription', {
        newPlanId: planId,
        newBillingPeriod: billingPeriod
      });
      return response.json();
    },
    onSuccess: async (data: any) => {
      console.log('Subscription change response:', data);
      
      // Handle payment required for trial users
      if (data.requiresPayment) {
        console.log('Payment required, redirecting to checkout:', data.checkoutUrl);
        
        // Redirect to Stripe Checkout page
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        
        // Fallback: if no checkout URL, show error
        toast({
          title: 'Payment Setup Error',
          description: 'Unable to redirect to payment page. Please try again.',
          variant: 'destructive'
        });
        return;
      } 
      
      // Handle proration preview
      if (data.requiresConfirmation && data.preview) {
        console.log('Proration preview received:', data.preview);
        setProrationPreview(data);
        setShowPreview(true);
        return;
      } 
      
      // Regular subscription update
      toast({
        title: 'Subscription Updated',
        description: data.message || 'Your plan has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive'
      });
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ planId, billingPeriod }: { planId: string; billingPeriod: string }) => {
      const response = await apiRequest('POST', '/api/confirm-subscription-change', {
        newPlanId: planId,
        newBillingPeriod: billingPeriod
      });
      return response.json();
    },
    onSuccess: async (data: any) => {
      console.log('Subscription confirmed:', data);
      
      toast({
        title: 'Subscription Updated',
        description: data.message || 'Your plan has been successfully updated with proration.',
        variant: 'default'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsOpen(false);
      setShowPreview(false);
      setProrationPreview(null);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Change Your Subscription</DialogTitle>
          <DialogDescription>
            Choose your new plan and billing period. Changes are prorated automatically.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={showPreview ? "proration" : "plans"} value={showPreview ? "proration" : "plans"} className="space-y-6">
          <TabsList className={`grid w-full ${showPreview ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="plans" disabled={showPreview}>Choose Plan</TabsTrigger>
            <TabsTrigger value="preview" disabled={selectedPlan === currentPlan && selectedBilling === currentBillingPeriod || showPreview}>
              Preview Changes
            </TabsTrigger>
            {showPreview && (
              <TabsTrigger value="proration" className="bg-blue-100 text-blue-800 font-semibold">
                Confirm Upgrade
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            {/* Billing Period Toggle */}
            <div className="flex justify-center">
              <div className="flex items-center space-x-2 sm:space-x-4 bg-muted p-1 rounded-lg w-full sm:w-auto">
                <Button
                  variant={selectedBilling === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedBilling('monthly')}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Monthly
                </Button>
                <Button
                  variant={selectedBilling === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedBilling('yearly')}
                  className="relative flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Yearly
                  <Badge className="ml-1 sm:ml-2 bg-green-500 text-white text-xs">
                    Save 20%
                  </Badge>
                </Button>
              </div>
            </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                  <CardHeader className="text-center p-4 sm:p-6">
                    <div className="flex justify-center mb-2">
                      <div className={`p-2 sm:p-3 rounded-full ${plan.color} text-white`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>
                    <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-lg">
                      {plan.name}
                      {isCurrentPlan && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <div className="text-xl sm:text-2xl font-bold">
                        ${selectedBilling === 'yearly' ? price.toFixed(0) : price.toFixed(0)}
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                          /{selectedBilling === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      {selectedBilling === 'yearly' && (
                        <div className="text-xs sm:text-sm text-green-600">
                          Save ${(plan.monthly * 12 - plan.yearly).toFixed(0)}/year
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <ul className="space-y-1 sm:space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-xs sm:text-sm">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
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
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Plan Change Summary</h4>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs sm:text-sm">
                <div className="flex-1">
                  <div className="text-muted-foreground">
                    Current: {currentPlan === 'trial' ? 'Trial' : (PLANS[currentPlan as keyof typeof PLANS]?.name || 'Unknown')} ({currentBillingPeriod})
                  </div>
                  <div className="font-medium">New: {PLANS[selectedPlan as keyof typeof PLANS]?.name || 'Unknown'} ({selectedBilling})</div>
                </div>
                <div className="flex flex-col sm:text-right">
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
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t bg-background sticky bottom-0 -mx-6 px-6 pb-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleUpgrade}
              disabled={upgradeMutation.isPending || (selectedPlan === currentPlan && selectedBilling === currentBillingPeriod)}
              className="w-full sm:w-auto"
            >
              {upgradeMutation.isPending ? 'Processing...' : getActionText()}
            </Button>
          </div>
          </TabsContent>

          {/* Proration Preview Tab */}
          {showPreview && prorationPreview && (
            <TabsContent value="proration" className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Proration Details</h4>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Current Plan:</span>
                    <span className="font-medium">{PLANS[prorationPreview.preview.currentPlan as keyof typeof PLANS]?.name} - ${prorationPreview.preview.currentAmount}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Plan:</span>
                    <span className="font-medium">{PLANS[prorationPreview.preview.newPlan as keyof typeof PLANS]?.name} - ${prorationPreview.preview.newAmount}/month</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>{prorationPreview.preview.prorationAmount >= 0 ? 'Amount to charge:' : 'Credit amount:'}</span>
                    <span className={prorationPreview.preview.prorationAmount >= 0 ? 'text-red-600' : 'text-green-600'}>
                      ${Math.abs(prorationPreview.preview.prorationAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {prorationPreview.message}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t bg-background sticky bottom-0 -mx-6 px-6 pb-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPreview(false);
                    setProrationPreview(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => confirmMutation.mutate({
                    planId: selectedPlan,
                    billingPeriod: selectedBilling
                  })}
                  disabled={confirmMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {confirmMutation.isPending ? 'Processing...' : `Confirm & ${prorationPreview.preview.prorationAmount >= 0 ? 'Pay' : 'Get Credit'} $${Math.abs(prorationPreview.preview.prorationAmount).toFixed(2)}`}
                </Button>
              </div>
            </TabsContent>
          )}

          <TabsContent value="preview" className="space-y-6">
            <SubscriptionChangePreview
              currentPlan={currentPlan}
              currentBillingPeriod={currentBillingPeriod}
              newPlan={selectedPlan}
              newBillingPeriod={selectedBilling}
            />
            
            {/* Action Button for Preview Tab */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t bg-background sticky bottom-0 -mx-6 px-6 pb-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleUpgrade}
                disabled={upgradeMutation.isPending}
                className="w-full sm:w-auto"
              >
                {upgradeMutation.isPending ? 'Processing...' : getActionText()}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}