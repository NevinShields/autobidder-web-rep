import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

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

  // Checkout session mutation for new subscribers  
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

  // For users without a subscription, show upgrade option with checkout
  if (currentPlan === 'trial') {
    return (
      <Button
        onClick={() => checkoutMutation.mutate({ planId: 'standard', billingPeriod: 'monthly' })}
        disabled={checkoutMutation.isPending}
        className={className}
      >
        {checkoutMutation.isPending ? "Creating..." : "Upgrade Plan"}
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