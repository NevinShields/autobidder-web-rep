import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Universal authentication middleware that works with both Replit OAuth and email/password
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let user = null;
    
    // Check for email auth session first
    if (req.session?.user) {
      user = req.session.user;
      
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
    }
    // Check for Replit auth (existing system)
    else if ((req as any).user?.claims?.sub) {
      const userId = (req as any).user.claims.sub;
      user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
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
    let user = null;
    
    // Check for email auth session first
    if (req.session?.user) {
      user = req.session.user;
    }
    // Check for Replit auth (existing system)
    else if ((req as any).user?.claims?.sub) {
      const userId = (req as any).user.claims.sub;
      user = await storage.getUser(userId);
    }
    
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