import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Register Stripe webhook BEFORE json parsing middleware
// This ensures the raw body is preserved for signature verification
app.post("/api/stripe-webhook", express.raw({type: 'application/json'}), async (req, res) => {
  try {
    console.log('🔔 STRIPE WEBHOOK RECEIVED 🔔');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body length:', req.body?.length);
    console.log('Raw body preview:', req.body?.toString().substring(0, 200));
    
    const { stripe } = await import('./stripe');
    const sig = req.headers['stripe-signature'];
    
    // Use appropriate webhook secret based on Stripe environment
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    const webhookSecret = isTestMode 
      ? process.env.STRIPE_WEBHOOK_SECRET_TEST 
      : process.env.STRIPE_WEBHOOK_SECRET_LIVE;
    
    console.log('🔑 Webhook configuration:', {
      isTestMode,
      hasWebhookSecret: !!webhookSecret,
      secretLength: webhookSecret?.length || 0,
      hasSignature: !!sig
    });
    
    if (!webhookSecret) {
      const envType = isTestMode ? 'test' : 'live';
      console.error(`❌ Webhook secret not configured for ${envType} environment`);
      return res.status(400).json({ 
        error: `Webhook secret not configured for ${envType} environment. Please set STRIPE_WEBHOOK_SECRET_${envType.toUpperCase()}` 
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      console.log('✅ Webhook signature verified successfully');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', (err as Error).message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('📋 Event details:', {
      id: event.id,
      type: event.type,
      created: event.created
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      console.log('💳 Processing checkout session completed:', session.id);
      
      if (session.metadata?.userId && session.subscription) {
        const { db } = await import('./db');
        const { users } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const userId = session.metadata.userId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const planId = session.metadata.planId || 'standard';
        const billingPeriod = session.metadata.billingPeriod || 'monthly';
        
        console.log('🔄 Updating user subscription:', {
          userId,
          customerId,
          subscriptionId,
          planId,
          billingPeriod
        });
        
        try {
          await db.update(users)
            .set({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              subscription_plan: planId,
              subscription_billing_period: billingPeriod,
              subscription_start_date: new Date()
            })
            .where(eq(users.id, userId));
          
          console.log('✅ User subscription updated successfully');
          
          // Send subscription confirmation email
          const { sendSubscriptionConfirmationEmail } = await import('./email-templates');
          try {
            const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (userResult.length > 0) {
              const user = userResult[0];
              await sendSubscriptionConfirmationEmail(user.email, user.name, planId);
              console.log('📧 Subscription confirmation email sent');
            }
          } catch (emailError) {
            console.error('❌ Failed to send subscription confirmation email:', emailError);
          }
          
        } catch (dbError) {
          console.error('❌ Database update failed:', dbError);
          return res.status(500).json({ error: 'Database update failed' });
        }
      } else {
        console.log('⚠️ Missing metadata in checkout session:', {
          hasUserId: !!session.metadata?.userId,
          hasSubscription: !!session.subscription,
          metadata: session.metadata
        });
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      console.log(`💳 Processing subscription ${event.type}:`, subscription.id);
      
      if (subscription.customer) {
        const { db } = await import('./db');
        const { users } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        try {
          const updateData: any = {
            subscription_status: subscription.status
          };
          
          if (event.type === 'customer.subscription.deleted') {
            updateData.subscription_status = 'cancelled';
            updateData.stripe_subscription_id = null;
          }
          
          await db.update(users)
            .set(updateData)
            .where(eq(users.stripe_customer_id, subscription.customer));
          
          console.log('✅ Subscription status updated successfully');
        } catch (dbError) {
          console.error('❌ Database update failed:', dbError);
          return res.status(500).json({ error: 'Database update failed' });
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Now apply JSON parsing middleware for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
