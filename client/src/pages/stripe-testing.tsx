import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  TestTube,
  Settings,
  Webhook,
  DollarSign,
  Clock,
  Zap,
  Shield
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

interface StripeTestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function StripeTesting() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<StripeTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Redirect non-admin users
  if (user && user.userType !== 'super_admin') {
    return <Redirect to="/dashboard" />;
  }

  // Fetch current Stripe configuration
  const { data: stripeConfig, isLoading } = useQuery<{
    testMode: boolean;
    webhookConfigured: boolean;
    keysConfigured: boolean;
    environment: string;
  }>({
    queryKey: ['/api/stripe/config'],
  });

  // Test webhook endpoint
  const testWebhookMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/stripe/test-webhook', {});
    },
    onSuccess: (data) => {
      toast({
        title: "Webhook Test Successful",
        description: "Stripe webhook endpoint is working correctly",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Webhook Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create test checkout session
  const testCheckoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest('POST', '/api/stripe/test-checkout', { planId });
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Test Checkout Created",
          description: "Opening test checkout in new tab",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Run comprehensive billing tests
  const runBillingTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      const response = await apiRequest('POST', '/api/stripe/run-tests', {}) as any;
      setTestResults(response.results || []);
      
      const hasErrors = response.results?.some((r: StripeTestResult) => r.status === 'error');
      toast({
        title: hasErrors ? "Some Tests Failed" : "All Tests Passed",
        description: hasErrors ? "Check the results below for details" : "Stripe billing is working correctly",
        variant: hasErrors ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "Testing Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'error':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  Stripe Testing Dashboard
                  <Badge variant="destructive" className="text-xs">ADMIN ONLY</Badge>
                </h1>
                <p className="text-gray-600">Test and validate Stripe billing integration - Restricted to super administrators</p>
              </div>
            </div>
          </div>

          {/* Configuration Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Stripe Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Test Mode</span>
                  <Badge className={stripeConfig?.testMode ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {stripeConfig?.testMode ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Webhook Secret</span>
                  <Badge className={stripeConfig?.webhookConfigured ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {stripeConfig?.webhookConfigured ? "Configured" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">API Keys</span>
                  <Badge className={stripeConfig?.keysConfigured ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {stripeConfig?.keysConfigured ? "Valid" : "Invalid"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tests */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Webhook className="w-5 h-5" />
                  Webhook Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Test your webhook endpoint connectivity
                </p>
                <Button 
                  onClick={() => testWebhookMutation.mutate()}
                  disabled={testWebhookMutation.isPending}
                  className="w-full"
                >
                  {testWebhookMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Test Webhook
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5" />
                  Test Checkout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create a test checkout session
                </p>
                <Button 
                  onClick={() => testCheckoutMutation.mutate('standard')}
                  disabled={testCheckoutMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {testCheckoutMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Test Standard Plan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TestTube className="w-5 h-5" />
                  Full Test Suite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Run comprehensive billing tests
                </p>
                <Button 
                  onClick={runBillingTests}
                  disabled={isRunningTests}
                  className="w-full"
                >
                  {isRunningTests && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Run All Tests
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{result.test}</h4>
                          {getStatusBadge(result.status)}
                        </div>
                        <p className="text-sm text-gray-600">{result.message}</p>
                        {result.details && (
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Credit Cards */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Test Credit Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Successful Payment</h4>
                    <p className="text-sm text-green-700">4242 4242 4242 4242</p>
                    <p className="text-xs text-green-600">Use any future date and any 3-digit CVC</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-900">Declined Payment</h4>
                    <p className="text-sm text-red-700">4000 0000 0000 0002</p>
                    <p className="text-xs text-red-600">Card will be declined</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900">Insufficient Funds</h4>
                    <p className="text-sm text-yellow-700">4000 0000 0000 9995</p>
                    <p className="text-xs text-yellow-600">Card will be declined with insufficient funds</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Requires Authentication</h4>
                    <p className="text-sm text-blue-700">4000 0025 0000 3155</p>
                    <p className="text-xs text-blue-600">Will trigger 3D Secure authentication</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}