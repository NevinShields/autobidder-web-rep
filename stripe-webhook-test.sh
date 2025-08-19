#!/bin/bash

# Stripe CLI Testing Script for Webhook Events
# Usage: ./stripe-webhook-test.sh [event-type] [subscription-id]

WEBHOOK_URL="https://94220369-191f-48c3-929b-3315885782bb-00-1ojyiqi38q95u.kirk.replit.dev/api/stripe-webhook"

echo "🔧 Stripe CLI Webhook Testing"
echo "=============================="

# Check if Stripe CLI is installed and authenticated
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install it first."
    exit 1
fi

# Set default values
EVENT_TYPE=${1:-"customer.subscription.updated"}
SUBSCRIPTION_ID=${2:-"sub_1RxttnPxWRb4SpBEf4wOl9xK"}

echo "📡 Testing webhook event: $EVENT_TYPE"
echo "🔗 Webhook URL: $WEBHOOK_URL"
echo "📋 Subscription ID: $SUBSCRIPTION_ID"
echo ""

case $EVENT_TYPE in
    "customer.subscription.updated")
        echo "🔄 Testing subscription update (plan change)..."
        stripe events resend evt_test_webhook --webhook-endpoint $WEBHOOK_URL
        ;;
    "checkout.session.completed")
        echo "✅ Testing checkout completion..."
        stripe events resend evt_test_webhook --webhook-endpoint $WEBHOOK_URL
        ;;
    "invoice.payment_succeeded")
        echo "💳 Testing successful payment..."
        stripe events resend evt_test_webhook --webhook-endpoint $WEBHOOK_URL
        ;;
    "listen")
        echo "👂 Starting webhook listener..."
        echo "This will forward all Stripe events to your local webhook endpoint"
        stripe listen --forward-to $WEBHOOK_URL
        ;;
    *)
        echo "❓ Usage: $0 [event-type] [subscription-id]"
        echo ""
        echo "Available event types:"
        echo "  - customer.subscription.updated"
        echo "  - checkout.session.completed" 
        echo "  - invoice.payment_succeeded"
        echo "  - listen (start webhook listener)"
        echo ""
        echo "Example: $0 customer.subscription.updated sub_1234567890"
        ;;
esac