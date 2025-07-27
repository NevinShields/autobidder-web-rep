import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, DollarSign, Settings, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BusinessSettings } from "@shared/schema";

export default function StripeSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Business Settings Query (contains Stripe config)
  const { data: businessSettings, isLoading } = useQuery<BusinessSettings>({
    queryKey: ["/api/business-settings"],
  });

  // Initialize form state with current values
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

  // Load existing config when data loads
  useEffect(() => {
    if (businessSettings?.stripeConfig) {
      setStripeConfig({
        standard: {
          monthlyPriceId: businessSettings.stripeConfig.standard?.monthlyPriceId || "",
          yearlyPriceId: businessSettings.stripeConfig.standard?.yearlyPriceId || "",
        },
        plus: {
          monthlyPriceId: businessSettings.stripeConfig.plus?.monthlyPriceId || "",
          yearlyPriceId: businessSettings.stripeConfig.plus?.yearlyPriceId || "",
        },
        plusSeo: {
          monthlyPriceId: businessSettings.stripeConfig.plusSeo?.monthlyPriceId || "",
          yearlyPriceId: businessSettings.stripeConfig.plusSeo?.yearlyPriceId || "",
        },
      });
    }
  }, [businessSettings]);

  // Update Stripe Configuration Mutation
  const updateStripeConfigMutation = useMutation({
    mutationFn: async (config: typeof stripeConfig) => {
      const res = await apiRequest("PUT", "/api/business-settings", {
        stripeConfig: config
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      toast({
        title: "Stripe configuration updated",
        description: "Your payment plans have been configured successfully.",
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
    updateStripeConfigMutation.mutate(stripeConfig);
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
          <h1 className="text-3xl font-bold">Stripe Payment Configuration</h1>
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
          <h1 className="text-3xl font-bold">Stripe Payment Configuration</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateStripeConfigMutation.isPending}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {updateStripeConfigMutation.isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Subscription Plan Price IDs
          </CardTitle>
          <CardDescription>
            Configure your Stripe Price IDs for each subscription plan. You need to create products in your Stripe Dashboard first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Setup Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to your <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 inline-flex items-center gap-1">Stripe Dashboard → Products <ExternalLink className="h-3 w-3" /></a></li>
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

          <Separator />

          {/* Webhook Configuration */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">Don't forget:</h4>
            <p className="text-sm text-amber-800">
              After adding your Price IDs, set up webhook endpoints in Stripe Dashboard → Webhooks:
            </p>
            <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside ml-4">
              <li>Endpoint URL: <code className="bg-amber-100 px-1 rounded">https://your-domain.com/api/webhooks/stripe</code></li>
              <li>Events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.updated</li>
              <li>Add the webhook signing secret to your environment variables</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}