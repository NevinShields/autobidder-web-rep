import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Super admin email addresses
const SUPER_ADMIN_EMAILS = [
  "admin@autobidder.org",
  "shielnev11@gmail.com"
];

// Email authentication middleware only
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for email auth session only
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    let user: any = req.session.user as any;

    // Always refresh from DB so webhook/admin updates are reflected in active sessions.
    const latestUser = await storage.getUserById(user.id);
    if (!latestUser) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    user = latestUser as any;
    req.session.user = user;
    
    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account is deactivated" });
    }
    
    // Routes that should bypass trial period check (allow expired trial users to upgrade)
    const trialBypassRoutes = [
      '/api/create-checkout-session',
      '/api/create-portal-session',
      '/api/subscription-details',
      '/api/stripe-webhook',
      '/api/stripe/webhook',
      '/api/sync-subscription'
    ];
    
    // Check trial status for trial users, but skip if they are a beta tester,
    // accessing payment routes, or already linked to a Stripe subscription.
    if (user.plan === "trial" && user.trialEndDate && !user.isBetaTester && !user.stripeSubscriptionId && !trialBypassRoutes.includes(req.path)) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndDate);
      
      if (now > trialEnd) {
        // Convert expired trial to free plan so users can continue with free-tier features
        try {
          const downgradedUser = await storage.updateUser(user.id, {
            plan: "free",
            subscriptionStatus: "inactive",
          });

          user = (downgradedUser || { ...user, plan: "free", subscriptionStatus: "inactive" }) as any;
          req.session.user = user;
        } catch (updateError) {
          console.error("Error updating expired trial user in auth middleware:", updateError);
          // Fall back to allowing access but treat as free plan in-memory
          user = { ...user, plan: "free", subscriptionStatus: "inactive" };
          req.session.user = user as any;
        }
      }
    }
    
    // Add user to request for downstream handlers
    // Include isImpersonating flag so admin has full permissions while viewing user accounts
    const isImpersonating = (req.session as any).isImpersonating || false;
    (req as any).currentUser = { ...user, isImpersonating };
    next();
    
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
}

// Optional auth middleware - doesn't require authentication but sets user if available
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for email auth session only
    const user = req.session?.user || null;
    
    // Add user to request for downstream handlers (or null if not authenticated)
    (req as any).currentUser = user;
    next();
    
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Continue without user for optional auth
    (req as any).currentUser = null;
    next();
  }
}

// Check if user is super admin
export function isSuperAdmin(userEmail: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(userEmail);
}

// Super admin authentication middleware
export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // First check if user is authenticated
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const user = req.session.user;
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account is deactivated" });
    }
    
    // Check if user email is in super admin list
    if (!isSuperAdmin(user.email)) {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }
    
    // Add user to request for downstream handlers
    (req as any).currentUser = user;
    next();
    
  } catch (error) {
    console.error("Super admin auth middleware error:", error);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
}
