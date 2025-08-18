import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable must be set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  standard: {
    name: 'Standard',
    monthlyPrice: 4900, // $49.00 in cents
    yearlyPrice: 4900 * 10, // ~17% discount
    monthlyPriceId: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_STANDARD_YEARLY_PRICE_ID,
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
    yearlyPrice: 9700 * 10, // ~17% discount
    monthlyPriceId: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PLUS_YEARLY_PRICE_ID,
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
    yearlyPrice: 29700 * 10, // ~17% discount
    monthlyPriceId: process.env.STRIPE_PLUS_SEO_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PLUS_SEO_YEARLY_PRICE_ID,
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
  let priceId = plan[billingPeriod === 'monthly' ? 'monthlyPriceId' : 'yearlyPriceId'] || 
                stripeConfig?.[planId]?.[billingPeriod === 'monthly' ? 'monthlyPriceId' : 'yearlyPriceId'];
  
  if (!priceId) {
    // Create a dynamic price if no price ID is configured
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
  
  // Get existing price ID from plan configuration or create new one
  let priceId = plan[billingPeriod === 'monthly' ? 'monthlyPriceId' : 'yearlyPriceId'];
  
  if (!priceId) {
    // Create a new price for the plan update if no existing price ID
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