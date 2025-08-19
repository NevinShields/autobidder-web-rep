// Quick debug script to manually sync the subscription
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function debugSubscription() {
  const customerId = 'cus_StSxWtjioIImOy';
  
  console.log('Fetching subscriptions for customer:', customerId);
  
  try {
    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10
    });
    
    console.log('Found subscriptions:', subscriptions.data.length);
    
    subscriptions.data.forEach((sub, index) => {
      console.log(`Subscription ${index + 1}:`, {
        id: sub.id,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000),
        current_period_end: new Date(sub.current_period_end * 1000),
        price_id: sub.items.data[0]?.price?.id,
        price_amount: sub.items.data[0]?.price?.unit_amount,
        interval: sub.items.data[0]?.price?.recurring?.interval,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      });
    });
    
    // Also check recent payment intents
    console.log('\nFetching recent payment intents...');
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 5
    });
    
    paymentIntents.data.forEach((pi, index) => {
      console.log(`Payment Intent ${index + 1}:`, {
        id: pi.id,
        status: pi.status,
        amount: pi.amount,
        created: new Date(pi.created * 1000),
        description: pi.description
      });
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugSubscription();