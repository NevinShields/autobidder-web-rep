import Stripe from 'stripe';

// Validate required Stripe environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable must be set");
}

const isLiveMode = !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

// Validate webhook secrets are configured
if (isLiveMode && !process.env.STRIPE_WEBHOOK_SECRET_LIVE) {
  console.warn('⚠️  STRIPE_WEBHOOK_SECRET_LIVE not configured - live webhooks will fail');
}

if (!isLiveMode && !process.env.STRIPE_WEBHOOK_SECRET_TEST) {
  console.warn('⚠️  STRIPE_WEBHOOK_SECRET_TEST not configured - test webhooks will fail');
}

// Additional environment validations for live mode
if (isLiveMode) {
  if (!process.env.DOMAIN || process.env.DOMAIN.includes('localhost')) {
    console.warn('⚠️  DOMAIN should be set to production HTTPS URL for live mode');
  }
  
  if (!process.env.VITE_STRIPE_PUBLIC_KEY || !process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_live_')) {
    console.warn('⚠️  VITE_STRIPE_PUBLIC_KEY should be set to live publishable key (pk_live_...)');
  }

  console.log('✅ Stripe initialized in LIVE mode');
} else {
  console.log('🧪 Stripe initialized in TEST mode');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Using SDK default API version for maximum compatibility
});

// Subscription plan configurations
type SubscriptionPlan = {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  monthlyPriceId?: string;
  yearlyPriceId?: string;
};

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  standard: {
    name: 'Standard',
    monthlyPrice: 4900, // $49.00 in cents
    yearlyPrice: Math.round(4900 * 12 * 0.83), // ~17% discount = $488.04 yearly
    features: [
      '5 pricing calculators',
      '500 leads per month',
      'Basic customization',
      'Email support'
    ]
  },
  plus: {
    name: 'Plus Plan',
    monthlyPrice: 9700, // $97.00 in cents
    yearlyPrice: Math.round(9700 * 12 * 0.83), // ~17% discount = $966.24 yearly
    features: [
      '25 pricing calculators',
      '2,500 leads per month',
      'Advanced customization',
      'Calendar integration',
      'Analytics dashboard',
      'Priority support'
    ]
  },
  plusSeo: {
    name: 'Plus SEO',
    monthlyPrice: 29700, // $297.00 in cents
    yearlyPrice: Math.round(29700 * 12 * 0.83), // ~17% discount = $2,958.12 yearly
    features: [
      'Unlimited calculators',
      'Unlimited leads',
      'White-label branding',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Dedicated support'
    ]
  }
};

export async function createCheckoutSession(
  planId: keyof typeof SUBSCRIPTION_PLANS,
  billingPeriod: 'monthly' | 'yearly',
  customerEmail: string,
  userId: string,
  stripeConfig?: any
) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid plan selected');
  }

  // Get Price ID from plan configuration or stripeConfig
  const priceIdKey = billingPeriod === 'monthly' ? 'monthlyPriceId' : 'yearlyPriceId';
  let priceId = plan[priceIdKey] || stripeConfig?.[planId]?.[priceIdKey];
  
  if (!priceId) {
    // Check if we're in test mode before creating dynamic prices
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    
    if (!isTestMode) {
      throw new Error(`Price ID not configured for ${planId} ${billingPeriod} in live mode. Please set up price IDs in business settings or environment variables.`);
    }
    
    // Only create dynamic prices in test mode
    console.log(`Creating dynamic price for ${planId} ${billingPeriod} (test mode only)`);
    const price = await stripe.prices.create({
      currency: 'usd',
      product_data: {
        name: `Autobidder - ${plan.name}`,
      },
      unit_amount: billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
      recurring: {
        interval: billingPeriod === 'yearly' ? 'year' : 'month'
      }
    });
    priceId = price.id;
  }

  // Create or retrieve customer
  let customer;
  const existingCustomers = await stripe.customers.list({
    email: customerEmail,
    limit: 1
  });

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await stripe.customers.create({
      email: customerEmail,
      metadata: {
        userId: userId
      }
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.DOMAIN || 'https://localhost:5000'}/profile?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN || 'https://localhost:5000'}/pricing`,
    metadata: {
      userId: userId,
      planId: planId,
      billingPeriod: billingPeriod
    }
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.DOMAIN || 'https://localhost:5000'}/dashboard`,
  });

  return session;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

export async function updateSubscription(
  subscriptionId: string, 
  newPlanId: keyof typeof SUBSCRIPTION_PLANS,
  billingPeriod: 'monthly' | 'yearly'
) {
  const plan = SUBSCRIPTION_PLANS[newPlanId];
  if (!plan) {
    throw new Error('Invalid plan selected');
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get existing price ID from plan configuration
  const priceIdKey = billingPeriod === 'monthly' ? 'monthlyPriceId' : 'yearlyPriceId';
  let priceId = plan[priceIdKey];
  
  if (!priceId) {
    // Check if we're in test mode before creating dynamic prices
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    
    if (!isTestMode) {
      throw new Error(`Price ID not configured for ${newPlanId} ${billingPeriod} in live mode. Please set up price IDs in business settings.`);
    }
    
    // Only create dynamic prices in test mode
    console.log(`Creating dynamic price for ${newPlanId} ${billingPeriod} (test mode only)`);
    const newPrice = await stripe.prices.create({
      currency: 'usd',
      product_data: {
        name: `Autobidder - ${plan.name}`,
      },
      unit_amount: billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
      recurring: {
        interval: billingPeriod === 'yearly' ? 'year' : 'month'
      }
    });
    priceId = newPrice.id;
  }

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId
    }],
    proration_behavior: 'create_prorations'
  });

  return updatedSubscription;
}