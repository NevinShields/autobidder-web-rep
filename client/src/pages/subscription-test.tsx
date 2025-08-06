import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionTest() {
  const [planId, setPlanId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const activateSubscription = useMutation({
    mutationFn: async () => {
      if (!planId || !billingPeriod) {
        throw new Error('Please select both plan and billing period');
      }
      
      return await apiRequest('POST', '/api/simulate-webhook', {
        planId,
        billingPeriod
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Test subscription activated. Check your profile page.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-details'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Simulation Tool</CardTitle>
          <CardDescription>
            Simulate the Stripe webhook to update your subscription status.
            Use this after completing a Stripe checkout to activate your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Plan</label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard - $49/month</SelectItem>
                <SelectItem value="plus">Plus - $97/month</SelectItem>
                <SelectItem value="plusSeo">Plus SEO - $297/month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Billing Period</label>
            <Select value={billingPeriod} onValueChange={setBillingPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select billing period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => activateSubscription.mutate()}
            disabled={!planId || !billingPeriod || activateSubscription.isPending}
            className="w-full"
          >
            {activateSubscription.isPending ? 'Simulating...' : 'Simulate Webhook & Activate Subscription'}
          </Button>

          <div className="text-sm text-muted-foreground">
            <p>This will:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Simulate the Stripe webhook call</li>
              <li>Update your subscription status to "active"</li>
              <li>Set your plan and billing period</li>
              <li>Allow you to see subscription details on your profile</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}