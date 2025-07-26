import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Validation schemas
export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Helper functions
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateUserId(): string {
  return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

// Calculate trial dates
export function calculateTrialDates() {
  const trialStartDate = new Date();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialStartDate.getDate() + 14); // 14 days from now
  
  return {
    trialStartDate,
    trialEndDate,
  };
}

// Email auth middleware
export function requireEmailAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  
  // Check if user is still active
  if (!req.session.user.isActive) {
    return res.status(401).json({ success: false, message: "Account is deactivated" });
  }
  
  // Check trial status for trial users
  if (req.session.user.plan === "trial" && req.session.user.trialEndDate) {
    const now = new Date();
    const trialEnd = new Date(req.session.user.trialEndDate);
    
    if (now > trialEnd) {
      return res.status(402).json({ 
        success: false, 
        message: "Trial period has expired. Please upgrade your plan.",
        trialExpired: true 
      });
    }
  }
  
  next();
}

// Check if user is on trial and how many days left
export function getTrialStatus(user: any) {
  if (user.plan !== "trial" || !user.trialEndDate) {
    return { isOnTrial: false, daysLeft: 0, expired: false };
  }
  
  const now = new Date();
  const trialEnd = new Date(user.trialEndDate);
  const timeDiff = trialEnd.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return {
    isOnTrial: true,
    daysLeft: Math.max(0, daysLeft),
    expired: daysLeft <= 0,
    trialEndDate: trialEnd,
  };
}

// Email auth routes
export function setupEmailAuth(app: Express) {
  // Setup session middleware
  
  const PostgresSessionStore = connectPg(session);
  
  app.set('trust proxy', 1);
  app.use(session({
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // Create table if missing
      ttl: 7 * 24 * 60 * 60, // 1 week
      tableName: 'user_sessions', // Use different table name to avoid conflicts
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));
  // Sign up with email
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const { firstName, lastName, email, password, businessName } = validatedData;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists"
        });
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Generate user ID and trial dates
      const userId = generateUserId();
      const { trialStartDate, trialEndDate } = calculateTrialDates();
      
      // Create user with trial
      const user = await storage.createUser({
        id: userId,
        email,
        firstName,
        lastName,
        passwordHash,
        authProvider: "email",
        emailVerified: false, // In production, require email verification
        plan: "trial",
        subscriptionStatus: "trialing",
        trialStartDate,
        trialEndDate,
        trialUsed: true,
        isActive: true,
        userType: "owner",
        permissions: {
          canManageUsers: true,
          canEditFormulas: true,
          canViewLeads: true,
          canManageCalendar: true,
          canAccessDesign: true,
          canViewStats: true,
        },
        businessInfo: businessName ? { businessName } : undefined,
        onboardingCompleted: false,
        onboardingStep: 1,
      });
      
      // Create onboarding progress
      await storage.createOnboardingProgress({
        userId,
        completedSteps: [],
        currentStep: 1,
        businessSetupCompleted: false,
        firstCalculatorCreated: false,
        designCustomized: false,
        embedCodeGenerated: false,
        firstLeadReceived: false,
      });
      
      // Set session
      req.session.user = user;
      
      const trialStatus = getTrialStatus(user);
      
      res.json({
        success: true,
        user: {
          ...user,
          passwordHash: undefined, // Don't send password hash
        },
        trialStatus,
        message: "Account created successfully! Your 14-day free trial has started."
      });
      
    } catch (error) {
      console.error("Signup error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to create account"
      });
    }
  });
  
  // Login with email
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || user.authProvider !== "email") {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
      
      // Verify password
      if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
      
      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated"
        });
      }
      
      // Set session
      req.session.user = user;
      
      const trialStatus = getTrialStatus(user);
      
      res.json({
        success: true,
        user: {
          ...user,
          passwordHash: undefined, // Don't send password hash
        },
        trialStatus,
        message: "Login successful"
      });
      
    } catch (error) {
      console.error("Login error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Login failed"
      });
    }
  });
  
  // Get current user (email auth only)
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      // Check for email auth session only
      if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = req.session.user;
      const trialStatus = getTrialStatus(user);
      
      res.json({
        ...user,
        passwordHash: undefined, // Don't send password hash
        trialStatus,
      });
      
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          message: "Logout failed"
        });
      }
      
      res.json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });
  
  // Get trial status
  app.get("/api/auth/trial-status", requireEmailAuth, async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      const trialStatus = getTrialStatus(user);
      
      res.json({
        success: true,
        trialStatus
      });
      
    } catch (error) {
      console.error("Trial status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get trial status"
      });
    }
  });
}

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    user?: any;
  }
}