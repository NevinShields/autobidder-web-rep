import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UpgradeButton } from "@/components/upgrade-button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CreditCard, 
  Calendar, 
  Download, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  RotateCcw,
  Eye,
  DollarSign
} from "lucide-react";

interface SubscriptionDetails {
  hasSubscription: boolean;
  subscription?: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    canceledAt?: number;
    items: Array<{
      priceId: string;
      productName: string;
      amount: number;
      interval: string;
    }>;
  };
  customer?: {
    id: string;
    email: string;
    defaultPaymentMethod?: string;
  };
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  total: number;
  subtotal: number;
  tax?: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  created: number;
  dueDate?: number;
  paidAt?: number;
  periodStart: number;
  periodEnd: number;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  description?: string;
  lines: Array<{
    description: string;
    amount: number;
    quantity: number;
    period: {
      start: number;
      end: number;
    };
  }>;
}

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showInvoicesDialog, setShowInvoicesDialog] = useState(false);

  // Fetch subscription details
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery<SubscriptionDetails>({
    queryKey: ["/api/subscription-details"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-details");
      return res.json();
    },
  });

  // Fetch invoices
  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery<{ invoices: Invoice[] }>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices");
      return res.json();
    },
    enabled: showInvoicesDialog,
  });

  // Fetch user profile for current plan info
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cancel-subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setShowCancelDialog(false);
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will end at the current billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reactivate-subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been reactivated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reactivation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync subscription mutation for development
  const syncSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sync-subscription");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      if (data.success) {
        toast({
          title: "Subscription Synced",
          description: `Successfully synced ${data.plan} subscription.`,
        });
      } else {
        toast({
          title: "No Active Subscription",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Reactivation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Billing portal mutation
  const billingPortalMutation = useMutation({
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
      // Handle specific error types with user-friendly messages
      let title = "Portal Access Failed";
      let description = error.message;
      
      if (error.message?.includes('configuration_required') || error.message?.includes('not been activated')) {
        title = "Portal Setup Required";
        description = "Go to your Stripe Dashboard → Settings → Billing → Customer Portal and activate it to enable subscription management.";
      } else if (error.message?.includes('test mode') || error.message?.includes('configuration')) {
        title = "Portal Configuration Needed";
        description = "The billing portal needs to be activated in your Stripe dashboard first.";
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

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" />Past Due</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Open</Badge>;
      case 'void':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Void</Badge>;
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription & Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription & Billing
        </CardTitle>
        <CardDescription>
          Manage your subscription, payment methods, and billing history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {subscriptionData?.hasSubscription ? (
          <>
            {/* Current Subscription */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Current Plan</h4>
                  <p className="text-sm text-gray-600">
                    {subscriptionData.subscription?.items[0]?.productName || 'Subscription Plan'}
                  </p>
                </div>
                {getStatusBadge(subscriptionData.subscription?.status || '')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Billing Amount:</span>
                  <p className="text-gray-600">
                    {formatCurrency(subscriptionData.subscription?.items[0]?.amount || 0)} / {subscriptionData.subscription?.items[0]?.interval}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Next Billing Date:</span>
                  <p className="text-gray-600">
                    {formatDate(subscriptionData.subscription?.currentPeriodEnd || 0)}
                  </p>
                </div>
              </div>

              {subscriptionData.subscription?.cancelAtPeriodEnd && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription will be canceled on {formatDate(subscriptionData.subscription.currentPeriodEnd)}.
                    You can reactivate it anytime before then.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {profile?.plan && profile?.billingPeriod && (
                <UpgradeButton 
                  currentPlan={profile.plan}
                  currentBillingPeriod={profile.billingPeriod}
                />
              )}

              <Button
                onClick={() => billingPortalMutation.mutate()}
                disabled={billingPortalMutation.isPending}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {billingPortalMutation.isPending ? "Opening..." : "Update Payment Method"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowInvoicesDialog(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Invoices
              </Button>

              <Button
                variant="outline"
                onClick={() => syncSubscriptionMutation.mutate()}
                disabled={syncSubscriptionMutation.isPending}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {syncSubscriptionMutation.isPending ? "Syncing..." : "Sync Status"}
              </Button>

              {subscriptionData.subscription?.cancelAtPeriodEnd ? (
                <Button
                  variant="outline"
                  onClick={() => reactivateSubscriptionMutation.mutate()}
                  disabled={reactivateSubscriptionMutation.isPending}
                  className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {reactivateSubscriptionMutation.isPending ? "Reactivating..." : "Reactivate Subscription"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="font-semibold mb-2">No Active Subscription</h4>
            <p className="text-gray-600 mb-4">Subscribe to unlock premium features and get unlimited access.</p>
            <div className="flex justify-center gap-3">
              <UpgradeButton />
              <Button
                variant="outline"
                onClick={() => syncSubscriptionMutation.mutate()}
                disabled={syncSubscriptionMutation.isPending}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {syncSubscriptionMutation.isPending ? "Syncing..." : "Sync from Stripe"}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Cancel Subscription
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will remain active until {formatDate(subscriptionData?.subscription?.currentPeriodEnd || 0)}.
                  You can reactivate anytime before then.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                  Keep Subscription
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  {cancelSubscriptionMutation.isPending ? "Canceling..." : "Cancel Subscription"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invoices Dialog */}
        <Dialog open={showInvoicesDialog} onOpenChange={setShowInvoicesDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Invoice History
              </DialogTitle>
              <DialogDescription>
                View and download your past invoices
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isLoadingInvoices ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : invoicesData?.invoices && invoicesData.invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoicesData.invoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">Invoice #{invoice.number}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(invoice.created)} • {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                            </p>
                          </div>
                          {getInvoiceStatusBadge(invoice.status)}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(invoice.total, invoice.currency)}</p>
                          <div className="flex gap-2 mt-2">
                            {invoice.hostedInvoiceUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </a>
                              </Button>
                            )}
                            {invoice.invoicePdf && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-3 h-3 mr-1" />
                                  PDF
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      {invoice.lines.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {invoice.lines.map((line, index) => (
                            <div key={index}>
                              {line.description} - {formatCurrency(line.amount, invoice.currency)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No invoices found</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}