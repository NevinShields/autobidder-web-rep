import express, { type Request, Response, NextFunction } from "express";
// @ts-ignore
import compression from "compression";
import type Stripe from "stripe";
import { eq, or, sql } from "drizzle-orm";
import { registerRoutes } from "./routes";
import { db } from "./db";
import { metaPurchaseEvents, users } from "../shared/schema";
import { stripe } from "./stripe";
import { trackPurchase, trackSubscribe } from "./facebook-capi";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

const SEND_META_PURCHASE_FOR_RENEWALS = true;

function getAppBaseUrl(req?: Request): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  if (req) {
    const xfProto = typeof req.headers["x-forwarded-proto"] === "string"
      ? req.headers["x-forwarded-proto"].split(",")[0]?.trim()
      : null;
    const proto = xfProto || req.protocol || "http";
    const host = req.get("host");
    if (host) {
      return `${proto}://${host}`;
    }
  }
  return "http://localhost:5000";
}

function normalizePlanId(planId: string | null | undefined): string | null {
  if (!planId) {
    return null;
  }

  if (planId === "plusSeo") {
    return "plus_seo";
  }

  return planId;
}

function toReadablePlanName(planId: string | null | undefined): string | null {
  const normalized = normalizePlanId(planId);
  if (!normalized) {
    return null;
  }

  const planNameMap: Record<string, string> = {
    standard: "Standard",
    plus: "Plus",
    plus_seo: "Plus SEO",
    free: "Free",
    trial: "Trial",
  };

  return planNameMap[normalized] || normalized;
}

function splitName(fullName: string | null | undefined): { firstName?: string; lastName?: string } {
  if (!fullName) {
    return {};
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return {};
  }

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  };
}

function getInvoiceAmountValue(invoice: Stripe.Invoice): number {
  const amountPaid = typeof invoice.amount_paid === "number" ? invoice.amount_paid : 0;
  return Number((amountPaid / 100).toFixed(2));
}

function getInvoiceEventTime(invoice: Stripe.Invoice): number {
  const paidAt = (invoice.status_transitions as Stripe.Invoice.StatusTransitions | null | undefined)?.paid_at;
  if (typeof paidAt === "number" && paidAt > 0) {
    return paidAt;
  }
  return Math.floor(Date.now() / 1000);
}

function getInvoiceBillingInterval(invoice: Stripe.Invoice): string | null {
  const lines = ((invoice as any).lines?.data || []) as Array<any>;
  const line = lines.find((candidate) => candidate?.price?.recurring?.interval) || lines[0];
  const interval = line?.price?.recurring?.interval;
  if (interval === "year") {
    return "yearly";
  }
  if (interval === "month") {
    return "monthly";
  }
  return null;
}

function getInvoicePlanName(invoice: Stripe.Invoice, fallbackPlan: string | null | undefined): string | null {
  const line = (((invoice as any).lines?.data || []) as Array<any>)[0];
  const metadataPlan =
    line?.price?.metadata?.planId ||
    line?.price?.metadata?.plan_id ||
    line?.metadata?.planId ||
    line?.metadata?.plan_id;

  if (typeof metadataPlan === "string" && metadataPlan.trim()) {
    return toReadablePlanName(metadataPlan.trim());
  }

  if (typeof line?.price?.nickname === "string" && line.price.nickname.trim()) {
    return line.price.nickname.trim();
  }

  if (typeof line?.description === "string" && line.description.trim()) {
    return line.description.trim();
  }

  return toReadablePlanName(fallbackPlan);
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = (invoice as any).subscription;
  if (typeof subscription === "string" && subscription) {
    return subscription;
  }
  if (subscription && typeof subscription === "object" && typeof subscription.id === "string" && subscription.id) {
    return subscription.id;
  }
  return null;
}

async function resolveInvoiceCustomer(
  invoice: Stripe.Invoice,
): Promise<Stripe.Customer | null> {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer && typeof invoice.customer === "object" && "id" in invoice.customer
        ? invoice.customer.id
        : null;

  if (!customerId) {
    return null;
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      return customer;
    }
  } catch (error) {
    console.error("[Stripe Webhook] Failed to retrieve invoice customer for Meta matching:", {
      stripeInvoiceId: invoice.id,
      customerId,
      error,
    });
  }

  return null;
}

async function resolveUserForInvoice(
  invoice: Stripe.Invoice,
  customer: Stripe.Customer | null,
): Promise<(typeof users.$inferSelect) | undefined> {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer && typeof invoice.customer === "object" && "id" in invoice.customer
        ? invoice.customer.id
        : null;
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerEmail =
    (typeof invoice.customer_email === "string" && invoice.customer_email.trim()) ||
    (customer?.email?.trim() || null);
  const customerMetadataUserId =
    customer?.metadata && typeof customer.metadata.userId === "string" && customer.metadata.userId.trim()
      ? customer.metadata.userId.trim()
      : null;

  if (customerMetadataUserId) {
    const [userById] = await db.select().from(users).where(eq(users.id, customerMetadataUserId)).limit(1);
    if (userById) {
      return userById;
    }
  }

  if (customerId || subscriptionId) {
    const clauses = [];
    if (customerId) {
      clauses.push(eq(users.stripeCustomerId, customerId));
    }
    if (subscriptionId) {
      clauses.push(eq(users.stripeSubscriptionId, subscriptionId));
    }
    if (clauses.length > 0) {
      const stripeWhere = clauses.length === 1 ? clauses[0] : or(...clauses);
      const [userByStripe] = await db.select().from(users).where(stripeWhere).limit(1);
      if (userByStripe) {
        return userByStripe;
      }
    }
  }

  if (customerEmail) {
    const [userByEmail] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${customerEmail})`)
      .limit(1);
    if (userByEmail) {
      return userByEmail;
    }
  }

  return undefined;
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event, invoice: Stripe.Invoice, req: Request): Promise<void> {
  const invoiceAny = invoice as any;

  console.log("[Stripe Webhook] invoice.payment_succeeded received", {
    stripeEventId: event.id,
    stripeInvoiceId: invoice.id,
    invoiceStatus: invoice.status,
    amountPaid: invoice.amount_paid,
    amountDue: invoice.amount_due,
    billingReason: invoice.billing_reason,
    subscriptionId: getInvoiceSubscriptionId(invoice),
  });

  const stripeInvoiceId = invoice.id;
  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
  const isRenewal = invoice.billing_reason === "subscription_cycle";

  if (!stripeInvoiceId) {
    console.log("[Stripe Webhook] Skipping Meta purchase: invoice id missing");
    return;
  }

  if (!stripeSubscriptionId) {
    console.log("[Stripe Webhook] Skipping Meta purchase: invoice is not tied to a subscription", {
      stripeInvoiceId,
    });
    return;
  }

  if (invoice.status !== "paid") {
    console.log("[Stripe Webhook] Skipping Meta purchase: invoice is not marked paid", {
      stripeInvoiceId,
      invoiceStatus: invoice.status,
    });
    return;
  }

  if ((invoice.amount_paid || 0) <= 0 || (invoice.total || 0) <= 0) {
    console.log("[Stripe Webhook] Skipping Meta purchase: zero-dollar or trial invoice", {
      stripeInvoiceId,
      amountPaid: invoice.amount_paid,
      total: invoice.total,
    });
    return;
  }

  if (!SEND_META_PURCHASE_FOR_RENEWALS && isRenewal) {
    console.log("[Stripe Webhook] Skipping Meta purchase: renewal invoices disabled by config", {
      stripeInvoiceId,
      stripeSubscriptionId,
    });
    return;
  }

  const [existingPurchase] = await db
    .select()
    .from(metaPurchaseEvents)
    .where(eq(metaPurchaseEvents.stripeInvoiceId, stripeInvoiceId))
    .limit(1);

  if (existingPurchase) {
    console.log("[Stripe Webhook] Skipping Meta purchase: invoice already recorded", {
      stripeInvoiceId,
      metaEventId: existingPurchase.metaEventId,
    });
    return;
  }

  const customer = await resolveInvoiceCustomer(invoice);
  const user = await resolveUserForInvoice(invoice, customer);
  const invoiceName =
    (typeof invoiceAny.customer_name === "string" && invoiceAny.customer_name.trim()) ||
    customer?.name ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null);
  const nameParts = splitName(invoiceName);
  const billingAddress = invoiceAny.customer_address || customer?.address || customer?.shipping?.address || null;
  const email =
    (typeof invoiceAny.customer_email === "string" && invoiceAny.customer_email.trim()) ||
    customer?.email ||
    user?.email ||
    undefined;
  const phone =
    (typeof invoiceAny.customer_phone === "string" && invoiceAny.customer_phone.trim()) ||
    customer?.phone ||
    customer?.shipping?.phone ||
    undefined;
  const planName = getInvoicePlanName(invoice, user?.plan || null);
  const billingInterval = getInvoiceBillingInterval(invoice) || user?.billingPeriod || null;
  const eventId = `stripe_invoice_${stripeInvoiceId}`;
  const eventSourceUrl = `${getAppBaseUrl(req)}/profile`;

  try {
    const metaResult = await trackPurchase(
      {
        email,
        phone,
        firstName: user?.firstName || nameParts.firstName,
        lastName: user?.lastName || nameParts.lastName,
        city: billingAddress?.city || undefined,
        state: billingAddress?.state || undefined,
        zipCode: billingAddress?.postal_code || undefined,
        country: billingAddress?.country || undefined,
      },
      {
        eventId,
        eventTime: getInvoiceEventTime(invoice),
        eventSourceUrl,
        value: getInvoiceAmountValue(invoice),
        currency: (invoice.currency || "usd").toUpperCase(),
        contentName: planName || "Autobidder Paid Subscription",
        contentType: "product",
        numItems: 1,
        customData: {
          currency: (invoice.currency || "usd").toUpperCase(),
          value: getInvoiceAmountValue(invoice),
          plan_name: planName || undefined,
          billing_interval: billingInterval || undefined,
          stripe_invoice_id: stripeInvoiceId,
          stripe_subscription_id: stripeSubscriptionId,
        },
      },
    );

    if (!metaResult.success) {
      console.error("[Stripe Webhook] Meta purchase send failed", {
        stripeEventId: event.id,
        stripeInvoiceId,
        stripeSubscriptionId,
        metaEventId: eventId,
        error: metaResult.error,
      });
      return;
    }

    await db
      .insert(metaPurchaseEvents)
      .values({
        stripeInvoiceId,
        stripeEventId: event.id,
        stripeSubscriptionId,
        userId: user?.id || null,
        metaEventId: metaResult.eventId,
      })
      .onConflictDoNothing();

    console.log("[Stripe Webhook] Meta purchase sent", {
      stripeEventId: event.id,
      stripeInvoiceId,
      stripeSubscriptionId,
      metaEventId: metaResult.eventId,
      userId: user?.id || null,
      isRenewal,
    });
  } catch (error) {
    console.error("[Stripe Webhook] Unexpected Meta purchase error", {
      stripeEventId: event.id,
      stripeInvoiceId,
      stripeSubscriptionId,
      error,
    });
  }
}

// Enable gzip compression for faster asset delivery
app.use(compression());

// CORS setup for mobile app support and dev environments
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow any origin in development or requests from known dev URLs
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Register Stripe webhook BEFORE json parsing middleware
// This ensures the raw body is preserved for signature verification
// Handle both webhook paths for compatibility  
app.post(["/api/stripe-webhook", "/api/stripe/webhook"], express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    
    if (isTestMode) {
      console.log('🔔 STRIPE WEBHOOK RECEIVED (TEST MODE) 🔔');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Body length:', req.body?.length);
    } else {
      // Only log essential info in production to avoid exposing sensitive data
      console.log('Stripe webhook received:', new Date().toISOString());
    }
    
    const sig = req.headers['stripe-signature'];
    
    // Use appropriate webhook secret based on Stripe environment
    const webhookSecret = isTestMode 
      ? process.env.STRIPE_WEBHOOK_SECRET_TEST 
      : process.env.STRIPE_WEBHOOK_SECRET_LIVE;
    
    if (isTestMode) {
      console.log('🔑 Webhook configuration:', {
        isTestMode,
        hasWebhookSecret: !!webhookSecret,
        secretLength: webhookSecret?.length || 0,
        hasSignature: !!sig
      });
    }
    
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
      if (isTestMode) {
        console.log('✅ Webhook signature verified successfully');
      }
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', (err as Error).message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (isTestMode) {
      console.log('📋 Event details:', {
        id: event.id,
        type: event.type,
        created: event.created
      });
      } else {
        console.log(`Processing ${event.type} event:`, event.id);
      }

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
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: 'active',
              plan: planId,
              billingPeriod: billingPeriod,
              updatedAt: new Date()
            })
            .where(eq(users.id, userId));
          
          console.log('✅ User subscription updated successfully');

          const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          const readablePlanName = toReadablePlanName(planId) || planId;
          const subscribeEventId = `stripe_checkout_${session.id}`;

          try {
            const subscribeResult = await trackSubscribe(
              {
                email: updatedUser?.email || session.customer_details?.email || undefined,
                firstName: updatedUser?.firstName || undefined,
                lastName: updatedUser?.lastName || undefined,
                phone: session.customer_details?.phone || undefined,
                city: session.customer_details?.address?.city || undefined,
                state: session.customer_details?.address?.state || undefined,
                zipCode: session.customer_details?.address?.postal_code || undefined,
                country: session.customer_details?.address?.country || undefined,
              },
              {
                eventId: subscribeEventId,
                eventTime: event.created,
                eventSourceUrl: `${getAppBaseUrl(req)}/upgrade`,
                value: typeof session.amount_total === 'number' ? session.amount_total / 100 : 0,
                currency: typeof session.currency === 'string' ? session.currency.toUpperCase() : 'USD',
                customData: {
                  plan_name: readablePlanName,
                  billing_interval: billingPeriod,
                  stripe_checkout_session_id: session.id,
                  stripe_subscription_id: subscriptionId,
                },
              }
            );

            if (!subscribeResult.success) {
              console.error('❌ Meta subscribe send failed:', {
                stripeEventId: event.id,
                checkoutSessionId: session.id,
                subscriptionId,
                metaEventId: subscribeEventId,
                error: subscribeResult.error,
              });
            } else {
              console.log('✅ Meta subscribe sent:', {
                stripeEventId: event.id,
                checkoutSessionId: session.id,
                subscriptionId,
                metaEventId: subscribeEventId,
              });
            }
          } catch (metaError) {
            console.error('❌ Meta subscribe tracking error:', metaError);
          }
          
          // Send subscription confirmation email
          const { sendSubscriptionConfirmationEmail, sendAdminPlanUpgradeNotification } = await import('./email-templates');
          
          try {
            if (updatedUser) {
              const user = updatedUser;
              const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.email || 'Customer');
              if (user.email) {
                await sendSubscriptionConfirmationEmail(user.email, readablePlanName);
              }
              console.log('📧 Subscription confirmation email sent');
            }
          } catch (emailError) {
            console.error('❌ Failed to send subscription confirmation email:', emailError);
          }
          
          // Send admin notification (non-blocking, independent of customer email)
          try {
            if (updatedUser) {
              const user = updatedUser;
              const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.email || 'Customer');
              const readableBillingPeriod = billingPeriod === 'monthly' ? 'Monthly' : 'Yearly';
              
              if (user.email) {
                sendAdminPlanUpgradeNotification(
                  user.email,
                  userName,
                  userId,
                  `${readablePlanName} (${readableBillingPeriod})`,
                  readableBillingPeriod
                ).catch(error => {
                  console.error('Failed to send admin plan upgrade notification:', error);
                });
              }
            }
          } catch (adminEmailError) {
            console.error('❌ Failed to send admin plan upgrade notification:', adminEmailError);
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
    } else if (event.type === 'invoice.payment_succeeded') {
      await handleInvoicePaymentSucceeded(event as Stripe.Event, event.data.object as Stripe.Invoice, req);
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      console.log(`💳 Processing subscription ${event.type}:`, subscription.id);
      
      if (subscription.customer) {
        const { db } = await import('./db');
        const { users } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        try {
          const updateData: any = {
            subscriptionStatus: subscription.status,
            updatedAt: new Date()
          };
          
          if (event.type === 'customer.subscription.deleted') {
            updateData.subscriptionStatus = 'canceled';
            updateData.stripeSubscriptionId = null;
          }
          
          await db.update(users)
            .set(updateData)
            .where(eq(users.stripeCustomerId, subscription.customer));
          
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
// Increased limit to 50mb to support multiple high-resolution image uploads in photo measurement feature
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

    // Keep the process alive after request-level failures.
    // Rethrowing here can crash the server and impact all users.
    console.error("Unhandled request error:", err);
    res.status(status).json({ message });
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
  const maxListenRetries = 5;
  const retryDelayMs = 1200;
  let listenAttempt = 0;

  const startListening = () => {
    listenAttempt += 1;

    server.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
      }
    );
  };

  server.on("error", (error: any) => {
    if (error?.code === "EADDRINUSE" && listenAttempt < maxListenRetries) {
      log(
        `port ${port} is busy (attempt ${listenAttempt}/${maxListenRetries}); retrying in ${retryDelayMs}ms`,
        "startup"
      );
      setTimeout(startListening, retryDelayMs);
      return;
    }

    if (error?.code === "EADDRINUSE") {
      log(
        `failed to bind port ${port} after ${maxListenRetries} attempts. Ensure only one server process is running.`,
        "startup"
      );
      process.exit(1);
    }

    console.error("Server listen error:", error);
    process.exit(1);
  });

  startListening();
})();
