import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, DollarSign, Settings, ExternalLink, Webhook, Key } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AdminStripeConfig {
  stripeConfig?: {
    standard: {
      monthlyPriceId?: string;
      yearlyPriceId?: string;
    };
    plus: {
      monthlyPriceId?: string;
      yearlyPriceId?: string;
    };
    plusSeo: {
      monthlyPriceId?: string;
      yearlyPriceId?: string;
    };
  };
  webhookSecret?: string;
}

export default function AdminStripeSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form state
  const [stripeConfig, setStripeConfig] = useState({
    standard: {
      monthlyPriceId: "",
      yearlyPriceId: "",
    },
    plus: {
      monthlyPriceId: "",
      yearlyPriceId: "",
    },
    plusSeo: {
      monthlyPriceId: "",
      yearlyPriceId: "",
    },
  });
  const [webhookSecret, setWebhookSecret] = useState("");

  // Admin Stripe Config Query
  const { data: adminConfig, isLoading } = useQuery<AdminStripeConfig>({
    queryKey: ["/api/admin/stripe-config"],
  });

  // Load existing config when data loads
  useEffect(() => {
    if (adminConfig?.stripeConfig) {
      setStripeConfig({
        standard: {
          monthlyPriceId: adminConfig.stripeConfig.standard?.monthlyPriceId || "",
          yearlyPriceId: adminConfig.stripeConfig.standard?.yearlyPriceId || "",
        },
        plus: {
          monthlyPriceId: adminConfig.stripeConfig.plus?.monthlyPriceId || "",
          yearlyPriceId: adminConfig.stripeConfig.plus?.yearlyPriceId || "",
        },
        plusSeo: {
          monthlyPriceId: adminConfig.stripeConfig.plusSeo?.monthlyPriceId || "",
          yearlyPriceId: adminConfig.stripeConfig.plusSeo?.yearlyPriceId || "",
        },
      });
    }
    if (adminConfig?.webhookSecret) {
      setWebhookSecret(adminConfig.webhookSecret);
    }
  }, [adminConfig]);

  // Update Stripe Configuration Mutation
  const updateStripeConfigMutation = useMutation({
    mutationFn: async (config: { stripeConfig: typeof stripeConfig; webhookSecret: string }) => {
      const res = await apiRequest("PUT", "/api/admin/stripe-config", config);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe-config"] });
      toast({
        title: "Stripe configuration updated",
        description: "Global payment settings have been configured successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateStripeConfigMutation.mutate({ stripeConfig, webhookSecret });
  };

  const updatePriceId = (plan: keyof typeof stripeConfig, period: 'monthlyPriceId' | 'yearlyPriceId', value: string) => {
    setStripeConfig(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [period]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Global Stripe Configuration</h1>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Global Stripe Configuration</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateStripeConfigMutation.isPending}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {updateStripeConfigMutation.isPending ? "Saving..." : "Save Global Configuration"}
        </Button>
      </div>

      <div className="grid gap-6">
        
        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Configure the Stripe webhook secret for secure payment event handling.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Webhook Setup Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to your <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 inline-flex items-center gap-1">Stripe Dashboard → Webhooks <ExternalLink className="h-3 w-3" /></a></li>
                <li>Add endpoint: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/api/webhooks/stripe</code></li>
                <li>Select events: <code className="bg-blue-100 px-1 rounded">checkout.session.completed</code>, <code className="bg-blue-100 px-1 rounded">invoice.payment_succeeded</code>, <code className="bg-blue-100 px-1 rounded">customer.subscription.updated</code></li>
                <li>Copy the "Signing secret" (starts with whsec_) and paste it below</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Signing Secret</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                This secret is used to verify that webhook events are actually sent by Stripe.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Price IDs Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Subscription Plan Price IDs
            </CardTitle>
            <CardDescription>
              Configure global Stripe Price IDs for all subscription plans. These will be used across the entire platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Setup Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">Price ID Setup Instructions:</h4>
              <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                <li>Go to your <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-600 inline-flex items-center gap-1">Stripe Dashboard → Products <ExternalLink className="h-3 w-3" /></a></li>
                <li>Create products for Standard ($49), Plus Plan ($97), and Plus SEO ($297)</li>
                <li>For each product, create both monthly and yearly pricing</li>
                <li>Copy the Price IDs (start with "price_") and paste them below</li>
              </ol>
            </div>

            {/* Standard Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Standard Plan - $49</CardTitle>
                <CardDescription>Basic features for small businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="standard-monthly">Monthly Price ID</Label>
                    <Input
                      id="standard-monthly"
                      placeholder="price_1ABC123... (monthly)"
                      value={stripeConfig.standard.monthlyPriceId}
                      onChange={(e) => updatePriceId('standard', 'monthlyPriceId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="standard-yearly">Yearly Price ID</Label>
                    <Input
                      id="standard-yearly"
                      placeholder="price_1XYZ456... (yearly)"
                      value={stripeConfig.standard.yearlyPriceId}
                      onChange={(e) => updatePriceId('standard', 'yearlyPriceId', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plus Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plus Plan - $97</CardTitle>
                <CardDescription>Advanced features for growing businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plus-monthly">Monthly Price ID</Label>
                    <Input
                      id="plus-monthly"
                      placeholder="price_1DEF789... (monthly)"
                      value={stripeConfig.plus.monthlyPriceId}
                      onChange={(e) => updatePriceId('plus', 'monthlyPriceId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plus-yearly">Yearly Price ID</Label>
                    <Input
                      id="plus-yearly"
                      placeholder="price_1GHI012... (yearly)"
                      value={stripeConfig.plus.yearlyPriceId}
                      onChange={(e) => updatePriceId('plus', 'yearlyPriceId', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plus SEO Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plus SEO - $297</CardTitle>
                <CardDescription>Premium features with SEO capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plusSeo-monthly">Monthly Price ID</Label>
                    <Input
                      id="plusSeo-monthly"
                      placeholder="price_1JKL345... (monthly)"
                      value={stripeConfig.plusSeo.monthlyPriceId}
                      onChange={(e) => updatePriceId('plusSeo', 'monthlyPriceId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plusSeo-yearly">Yearly Price ID</Label>
                    <Input
                      id="plusSeo-yearly"
                      placeholder="price_1MNO678... (yearly)"
                      value={stripeConfig.plusSeo.yearlyPriceId}
                      onChange={(e) => updatePriceId('plusSeo', 'yearlyPriceId', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Security Notice
          </h4>
          <p className="text-sm text-red-800">
            These settings control payment processing for the entire platform. Only super administrators should have access to modify these configurations. 
            Ensure your Stripe account is properly secured with two-factor authentication.
          </p>
        </div>

      </div>
    </div>
  );
}