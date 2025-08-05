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
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Session exists:', !!req.session);
    console.log('Session user:', req.session?.user);
    console.log('Session keys:', req.session ? Object.keys(req.session) : 'no session');
    
    // Check for email auth session only
    if (!req.session?.user) {
      console.log('AUTH FAILED: No session user found');
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const user = req.session.user;
    
    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account is deactivated" });
    }
    
    // Check trial status for trial users
    if (user.plan === "trial" && user.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndDate);
      
      if (now > trialEnd) {
        return res.status(402).json({ 
          success: false, 
          message: "Trial period has expired. Please upgrade your plan.",
          trialExpired: true 
        });
      }
    }
    
    // Add user to request for downstream handlers
    (req as any).currentUser = user;
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