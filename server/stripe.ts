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
  free: {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '1 pricing calculator',
      '10 leads per month',
      'Basic customization',
      'Autobidder branding on forms'
    ]
  },
  standard: {
    name: 'Standard',
    monthlyPrice: 4900, // $49.00 in cents
    yearlyPrice: 49700, // $497.00 in cents - actual Stripe price
    monthlyPriceId:'price_1RpbIEPtLtROj9IoD0DDo3DF',
    yearlyPriceId:'price_1RpbklPtLtROj9IoodMM26Qr',
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
    yearlyPrice: 97000, // $970.00 in cents - actual Stripe price
    monthlyPriceId:'price_1RpbRBPtLtROj9Ioxq2JXLN4',
    yearlyPriceId:'price_1Rpbn5PtLtROj9IoLYcqH68f',
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
    yearlyPrice: 297000, // $2,970.00 in cents - actual Stripe price
    monthlyPriceId:'price_1RpbSAPtLtROj9IoX8G8LCYY',
    yearlyPriceId:'price_1RpbruPtLtROj9Ioh17yebmu',
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
  stripeConfig?: any,
  couponCode?: string
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

  // Create checkout session configuration
  const sessionConfig: any = {
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
    allow_promotion_codes: true, // Allow customers to enter promo codes
    metadata: {
      userId: userId,
      planId: planId,
      billingPeriod: billingPeriod
    }
  };

  // Apply coupon if provided
  if (couponCode) {
    try {
      // Validate coupon exists and is active
      const coupon = await stripe.coupons.retrieve(couponCode);
      sessionConfig.discounts = [{ coupon: couponCode }];
      console.log(`Applied coupon ${couponCode} (${coupon.percent_off}% off) to checkout session`);
    } catch (error) {
      console.warn(`Invalid coupon code ${couponCode}:`, (error as Error).message);
      // Continue without discount rather than failing
    }
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create(sessionConfig);

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

// Coupon management functions
export async function createTestCoupon(options: {
  code?: string;
  percentOff?: number;
  amountOff?: number;
  duration?: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  maxRedemptions?: number;
  expiresAt?: number;
}) {
  const couponData: any = {
    duration: options.duration || 'once'
  };

  if (options.percentOff) {
    couponData.percent_off = options.percentOff;
  } else if (options.amountOff) {
    couponData.amount_off = options.amountOff;
    couponData.currency = 'usd';
  } else {
    // Default to 100% off for testing
    couponData.percent_off = 100;
  }

  if (options.duration === 'repeating' && options.durationInMonths) {
    couponData.duration_in_months = options.durationInMonths;
  }

  if (options.maxRedemptions) {
    couponData.max_redemptions = options.maxRedemptions;
  }

  if (options.expiresAt) {
    couponData.redeem_by = options.expiresAt;
  }

  // Create the coupon
  const coupon = await stripe.coupons.create(couponData);

  // If a custom code is provided, create a promotion code
  if (options.code) {
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: options.code,
      restrictions: {
        minimum_amount: 0,
        minimum_amount_currency: 'usd'
      }
    });
    return { coupon, promoCode };
  }

  return { coupon };
}

export async function validateCoupon(couponCode: string) {
  try {
    const coupon = await stripe.coupons.retrieve(couponCode);
    return {
      valid: coupon.valid,
      percentOff: coupon.percent_off,
      amountOff: coupon.amount_off,
      currency: coupon.currency,
      duration: coupon.duration,
      timesRedeemed: coupon.times_redeemed,
      maxRedemptions: coupon.max_redemptions
    };
  } catch (error) {
    // Try as promotion code
    try {
      const promoCodes = await stripe.promotionCodes.list({
        code: couponCode,
        limit: 1
      });
      
      if (promoCodes.data.length > 0) {
        const promoCode = promoCodes.data[0];
        const coupon = await stripe.coupons.retrieve(promoCode.coupon as string);
        return {
          valid: coupon.valid && promoCode.active,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off,
          currency: coupon.currency,
          duration: coupon.duration,
          timesRedeemed: promoCode.times_redeemed,
          maxRedemptions: promoCode.restrictions?.minimum_amount
        };
      }
    } catch (promoError) {
      // Both coupon and promo code lookup failed
    }
    
    return { valid: false, error: (error as Error).message };
  }
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