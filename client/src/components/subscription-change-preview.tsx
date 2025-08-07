import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, ArrowRight, DollarSign, Calendar, Zap, AlertTriangle } from "lucide-react";
import { PLANS } from "./upgrade-button";

interface SubscriptionChangePreviewProps {
  currentPlan: string;
  currentBillingPeriod: string;
  newPlan: string;
  newBillingPeriod: string;
  className?: string;
}

interface PlanComparison {
  feature: string;
  current: boolean;
  new: boolean;
  isNew?: boolean;
  isRemoved?: boolean;
}

export function SubscriptionChangePreview({
  currentPlan,
  currentBillingPeriod,
  newPlan,
  newBillingPeriod,
  className
}: SubscriptionChangePreviewProps) {
  // Get plan details
  const getCurrentPlanDetails = () => {
    if (currentPlan === 'trial') {
      return {
        name: 'Trial',
        features: ['1 calculator', 'Basic templates', 'Email support'],
        monthly: 0,
        yearly: 0
      };
    }
    return PLANS[currentPlan as keyof typeof PLANS];
  };

  const currentPlanDetails = getCurrentPlanDetails();
  const newPlanDetails = PLANS[newPlan as keyof typeof PLANS];

  // Calculate pricing
  const currentPrice = currentPlan === 'trial' ? 0 : 
    (currentBillingPeriod === 'yearly' ? currentPlanDetails.yearly : currentPlanDetails.monthly);
  const newPrice = newBillingPeriod === 'yearly' ? newPlanDetails.yearly : newPlanDetails.monthly;

  // Calculate monthly equivalent for comparison
  const currentMonthlyEquivalent = currentPlan === 'trial' ? 0 :
    (currentBillingPeriod === 'yearly' ? currentPlanDetails.yearly / 12 : currentPlanDetails.monthly);
  const newMonthlyEquivalent = newBillingPeriod === 'yearly' ? newPlanDetails.yearly / 12 : newPlanDetails.monthly;

  // Price difference
  const priceDifference = newPrice - currentPrice;
  const monthlyDifference = newMonthlyEquivalent - currentMonthlyEquivalent;

  // Feature comparison
  const allFeatures = Array.from(new Set([...currentPlanDetails.features, ...newPlanDetails.features]));
  const featureComparison: PlanComparison[] = allFeatures.map(feature => ({
    feature,
    current: currentPlanDetails.features.includes(feature),
    new: newPlanDetails.features.includes(feature),
    isNew: !currentPlanDetails.features.includes(feature) && newPlanDetails.features.includes(feature),
    isRemoved: currentPlanDetails.features.includes(feature) && !newPlanDetails.features.includes(feature)
  }));

  // Billing change impact
  const getBillingChangeImpact = () => {
    if (currentBillingPeriod === newBillingPeriod) return null;
    
    if (newBillingPeriod === 'yearly') {
      const yearlyDiscount = (newPlanDetails.monthly * 12) - newPlanDetails.yearly;
      return {
        type: 'savings',
        message: `Save $${yearlyDiscount.toFixed(0)} per year with annual billing`,
        amount: yearlyDiscount
      };
    } else {
      return {
        type: 'change',
        message: 'Switching to monthly billing (no annual discount)',
        amount: 0
      };
    }
  };

  const billingImpact = getBillingChangeImpact();

  // Plan change type
  const getPlanChangeType = () => {
    const planOrder = { trial: 0, standard: 1, plus: 2, plusSeo: 3 };
    const currentOrder = planOrder[currentPlan as keyof typeof planOrder] || 0;
    const newOrder = planOrder[newPlan as keyof typeof planOrder] || 0;
    
    if (newOrder > currentOrder) return 'upgrade';
    if (newOrder < currentOrder) return 'downgrade';
    return 'billing-change';
  };

  const changeType = getPlanChangeType();

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          {changeType === 'upgrade' && <Zap className="h-5 w-5 text-green-500" />}
          {changeType === 'downgrade' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
          {changeType === 'billing-change' && <Calendar className="h-5 w-5 text-blue-500" />}
          <h3 className="text-lg font-semibold">
            {changeType === 'upgrade' && 'Plan Upgrade Preview'}
            {changeType === 'downgrade' && 'Plan Downgrade Preview'}
            {changeType === 'billing-change' && 'Billing Change Preview'}
          </h3>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Plan Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {/* Current Plan */}
              <div className="flex-1">
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">Current</Badge>
                  <div className="font-semibold">{currentPlanDetails.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentBillingPeriod === 'yearly' ? 'Annual' : 'Monthly'} billing
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 mx-4">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* New Plan */}
              <div className="flex-1">
                <div className="text-center">
                  <Badge className="mb-2">New</Badge>
                  <div className="font-semibold">{newPlanDetails.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {newBillingPeriod === 'yearly' ? 'Annual' : 'Monthly'} billing
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price Comparison */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Current Cost</div>
                <div className="font-semibold">
                  {currentPrice === 0 ? 'Free' : `$${currentPrice.toFixed(0)}`}
                  {currentPrice > 0 && (
                    <span className="text-sm text-muted-foreground">
                      /{currentBillingPeriod === 'yearly' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">New Cost</div>
                <div className="font-semibold">
                  ${newPrice.toFixed(0)}
                  <span className="text-sm text-muted-foreground">
                    /{newBillingPeriod === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cost Impact */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {changeType === 'upgrade' ? 'Additional Cost:' : 
                   changeType === 'downgrade' ? 'Monthly Savings:' : 'Cost Change:'}
                </span>
                <span className={`font-semibold ${
                  priceDifference > 0 ? 'text-red-600' : 
                  priceDifference < 0 ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {priceDifference === 0 ? 'No change' : 
                   `${priceDifference > 0 ? '+' : ''}$${priceDifference.toFixed(0)}/${newBillingPeriod === 'yearly' ? 'year' : 'month'}`}
                </span>
              </div>
              
              {/* Monthly equivalent if different billing periods */}
              {currentBillingPeriod !== newBillingPeriod && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Monthly equivalent:</span>
                  <span className={`${
                    monthlyDifference > 0 ? 'text-red-600' : 
                    monthlyDifference < 0 ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {monthlyDifference === 0 ? 'No change' : 
                     `${monthlyDifference > 0 ? '+' : ''}$${monthlyDifference.toFixed(0)}/month`}
                  </span>
                </div>
              )}
            </div>

            {/* Billing Impact */}
            {billingImpact && (
              <>
                <Separator />
                <div className={`p-3 rounded-lg ${
                  billingImpact.type === 'savings' ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'
                }`}>
                  <div className="text-sm font-medium">{billingImpact.message}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Changes</CardTitle>
            <CardDescription>
              See what features you'll gain or lose with this change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {featureComparison.map((comparison, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{comparison.feature}</span>
                  <div className="flex items-center gap-4">
                    {/* Current */}
                    <div className="flex items-center gap-1">
                      {comparison.current ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">Current</span>
                    </div>
                    
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    
                    {/* New */}
                    <div className="flex items-center gap-1">
                      {comparison.new ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">New</span>
                      {comparison.isNew && (
                        <Badge variant="outline" className="text-xs ml-1">Added</Badge>
                      )}
                      {comparison.isRemoved && (
                        <Badge variant="destructive" className="text-xs ml-1">Removed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className={`${
          changeType === 'upgrade' ? 'border-green-200 bg-green-50' :
          changeType === 'downgrade' ? 'border-orange-200 bg-orange-50' :
          'border-blue-200 bg-blue-50'
        }`}>
          <CardContent className="pt-4">
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {changeType === 'upgrade' && 'You\'ll get access to more features and capabilities.'}
                {changeType === 'downgrade' && 'Some features will be removed but you\'ll save money.'}
                {changeType === 'billing-change' && 'Only your billing frequency will change.'}
              </div>
              <div className="text-muted-foreground">
                {priceDifference !== 0 && (
                  <>Changes will be prorated and reflected in your next billing cycle.</>
                )}
                {priceDifference === 0 && billingImpact?.type === 'savings' && (
                  <>You'll start saving immediately with annual billing.</>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}