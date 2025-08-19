# Stripe Webhook Setup Guide

## Root Cause Analysis
Your payment flow is working correctly, but webhooks aren't updating user subscriptions automatically because **Stripe isn't configured to send webhook events to your application**.

## Current Status
✅ Webhook endpoint is accessible at `/api/stripe-webhook`
✅ Webhook secret is configured properly  
✅ Webhook handler code is working
❌ Stripe Dashboard not configured to send webhooks to your app

## How to Fix This

### 1. Get Your Webhook URL
Your webhook URL should be:
```
https://workspace-shielnev11.replit.app/api/stripe-webhook
```

### 2. Configure Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard** → https://dashboard.stripe.com/
2. **Navigate to Webhooks**:
   - Click "Developers" in left menu
   - Click "Webhooks"
3. **Add New Endpoint**:
   - Click "Add endpoint" button
   - Enter URL: `https://workspace-shielnev11.replit.app/api/stripe-webhook`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated` 
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

4. **Get Webhook Secret**:
   - After creating the endpoint, click on it
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

5. **Update Environment Variable**:
   - In Replit, go to Secrets tab
   - Update `STRIPE_WEBHOOK_SECRET_TEST` with the new secret

### 3. Test the Webhook

After setup, you can test by:
1. Making a new test payment
2. Checking the webhook logs in Stripe Dashboard
3. Verifying user subscription updates automatically

## Current Database Status
Your test user's subscription is now active after manual fix:
- User: admin+dingle@autobidder.org
- Status: active
- Plan: standard
- Customer ID: cus_StcwusCkhwL4ES

## Next Steps
1. Complete Stripe webhook configuration above
2. Make a new test payment with a different email
3. Verify automatic subscription activation