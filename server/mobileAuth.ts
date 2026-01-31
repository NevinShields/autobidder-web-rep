import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";
import { storage } from "./storage";
import { requireAuth } from "./universalAuth";

export interface MobileAuthedRequest extends Request {
  mobileUserId?: string;
}

export function requireMobileAuth(req: MobileAuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.mobileUserId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export async function requireWebOrMobileAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme === "Bearer" && token) {
    try {
      const payload = verifyAccessToken(token);
      const user = await storage.getUser(payload.sub);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const trialBypassRoutes = [
        "/api/create-checkout-session",
        "/api/create-portal-session",
        "/api/subscription-details",
        "/api/stripe-webhook",
        "/api/sync-subscription",
      ];

      if (user.plan === "trial" && user.trialEndDate && !user.isBetaTester && !trialBypassRoutes.includes(req.path)) {
        const now = new Date();
        const trialEnd = new Date(user.trialEndDate);

        if (now > trialEnd) {
          return res.status(402).json({
            success: false,
            message: "Trial period has expired. Please upgrade your plan.",
            trialExpired: true,
          });
        }
      }

      (req as any).currentUser = { ...user, isImpersonating: false };
      return next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  if (req.session?.user) {
    return requireAuth(req, res, next);
  }

  return res.status(401).json({ message: "Unauthorized" });
}
