import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Email authentication middleware only
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for email auth session only
    if (!req.session?.user) {
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