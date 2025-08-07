import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function PaymentForm({ subscriptionId, onSuccess }: { subscriptionId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile?payment=success`,
      },
    });

    if (error) {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Payment'
        )}
      </Button>
    </form>
  );
}

export default function PaymentConfirmation() {
  const [location, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const paymentIntentId = params.get('payment_intent');
    const subId = params.get('subscription_id');

    if (!paymentIntentId || !subId) {
      navigate('/profile');
      return;
    }

    setSubscriptionId(subId);

    // Get the client secret for the payment intent
    apiRequest('POST', '/api/payment-intent-secret', {
      paymentIntentId,
      subscriptionId: subId
    })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error getting payment intent:', error);
        toast({
          title: 'Payment Setup Failed',
          description: 'Unable to set up payment. Redirecting back to profile.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/profile'), 2000);
      });
  }, [location, navigate, toast]);

  const handleSuccess = () => {
    setIsSuccess(true);
    toast({
      title: 'Payment Successful!',
      description: 'Your subscription is now active.',
    });
    setTimeout(() => navigate('/profile'), 2000);
  };

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Setting up payment...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground">Redirecting you back to your profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Unable to load payment form. Please try again.</p>
            <Button 
              onClick={() => navigate('/profile')} 
              className="mt-4"
            >
              Go Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Subscription</CardTitle>
          <CardDescription>
            Enter your payment details to activate your new plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
              }
            }}
          >
            <PaymentForm 
              subscriptionId={subscriptionId} 
              onSuccess={handleSuccess} 
            />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}