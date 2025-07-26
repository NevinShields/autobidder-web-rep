import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable must be set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    name: 'Starter',
    monthlyPrice: 4900, // $49.00 in cents
    yearlyPrice: 4900 * 10, // ~17% discount
    features: [
      '5 pricing calculators',
      '500 leads per month',
      'Basic customization',
      'Email support'
    ]
  },
  professional: {
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    name: 'Professional', 
    monthlyPrice: 9700, // $97.00 in cents
    yearlyPrice: 9700 * 10, // ~17% discount
    features: [
      '25 pricing calculators',
      '2,500 leads per month',
      'Advanced customization',
      'Calendar integration',
      'Analytics dashboard',
      'Priority support'
    ]
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    name: 'Enterprise',
    monthlyPrice: 29700, // $297.00 in cents
    yearlyPrice: 29700 * 10, // ~17% discount
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
  userId: string
) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid plan selected');
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
        price_data: {
          currency: 'usd',
          product: `PriceBuilder Pro - ${plan.name}`,
          unit_amount: billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
          recurring: {
            interval: billingPeriod === 'yearly' ? 'year' : 'month'
          }
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.DOMAIN || 'https://localhost:5000'}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
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
  
  // Create a new price for the plan update
  const newPrice = await stripe.prices.create({
    currency: 'usd',
    product_data: {
      name: `PriceBuilder Pro - ${plan.name}`,
    },
    unit_amount: billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
    recurring: {
      interval: billingPeriod === 'yearly' ? 'year' : 'month'
    }
  });

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPrice.id
    }],
    proration_behavior: 'create_prorations'
  });

  return updatedSubscription;
}