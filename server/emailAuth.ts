import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { isSuperAdmin } from "./universalAuth";
import { users, passwordResetCodes } from "@shared/schema";
import { db } from "./db";
import { and, eq, gte, isNull, lte } from "drizzle-orm";

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
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
}).refine((data) => data.password || data.newPassword, {
  message: "Password is required",
  path: ["password"]
});

// New validation schemas for 6-digit code system
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const passwordResetVerifySchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});

export const passwordResetCompleteSchema = z.object({
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

// New security helper functions for 6-digit code system
export function generate6DigitCode(): string {
  // Generate cryptographically secure 6-digit code
  let code = '';
  for (let i = 0; i < 6; i++) {
    // Use crypto.randomInt for secure random number generation
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

export function hashCode(code: string): string {
  // Use SHA-256 to hash the code for secure storage
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function verifyCodeHash(code: string, hash: string): boolean {
  // Verify the code against its hash
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(hash));
}

// Rate limiting storage for password reset requests
const resetRequestRateLimit = new Map<string, Date>();

export function checkRateLimit(email: string, windowMs: number = 60000): boolean {
  const now = new Date();
  const lastRequest = resetRequestRateLimit.get(email);
  
  if (lastRequest && (now.getTime() - lastRequest.getTime()) < windowMs) {
    return false; // Rate limited
  }
  
  resetRequestRateLimit.set(email, now);
  return true; // OK to proceed
}

export function cleanupExpiredRateLimits(windowMs: number = 60000): void {
  const now = new Date();
  for (const [email, timestamp] of resetRequestRateLimit.entries()) {
    if ((now.getTime() - timestamp.getTime()) >= windowMs) {
      resetRequestRateLimit.delete(email);
    }
  }
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
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false, // Don't try to create - table exists
    ttl: 7 * 24 * 60 * 60, // 1 week
    tableName: 'sessions', // Use existing sessions table
    pruneSessionInterval: false, // Disable automatic cleanup
  });

  app.use(session({
    store: sessionStore,
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
      
      // Determine user type based on email
      const userType = isSuperAdmin(email) ? "super_admin" : "owner";
      
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
        userType,
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
      
      // Ensure session is saved before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to create session"
          });
        }
        
        res.json({
          success: true,
          user: {
            ...user,
            passwordHash: undefined, // Don't send password hash
          },
          trialStatus,
          message: "Account created successfully! Your 14-day free trial has started."
        });
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
      console.log("Login attempt - User found:", !!user);
      console.log("Login attempt - Auth provider:", user?.authProvider);
      console.log("Login attempt - User object keys:", user ? Object.keys(user) : 'no user');
      
      if (!user || user.authProvider !== "email") {
        console.log("Login failed - User not found or wrong auth provider");
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
      
      // Verify password
      console.log("Login attempt - Has password hash:", !!user.passwordHash);
      console.log("Login attempt - Password length:", password.length);
      
      const passwordValid = user.passwordHash && await verifyPassword(password, user.passwordHash);
      console.log("Login attempt - Password valid:", passwordValid);
      
      if (!passwordValid) {
        console.log("Login failed - Invalid password");
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
      
      // Ensure session is saved before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to create session"
          });
        }
        
        res.json({
          success: true,
          user: {
            ...user,
            passwordHash: undefined, // Don't send password hash
          },
          trialStatus,
          message: "Login successful"
        });
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
  
  // NEW SECURE 6-DIGIT PASSWORD RESET SYSTEM
  
  // Step 1: Request password reset with 6-digit code
  app.post("/api/auth/password-reset/request", async (req: Request, res: Response) => {
    try {
      const validatedData = passwordResetRequestSchema.parse(req.body);
      const { email } = validatedData;
      
      // Rate limiting - 60 seconds between requests
      if (!checkRateLimit(email, 60000)) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please wait 60 seconds before requesting another code."
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || user.authProvider !== "email") {
        // Don't reveal if email exists for security, but still succeed
        return res.json({ 
          success: true, 
          message: "If this email is registered, you will receive a 6-digit verification code shortly." 
        });
      }
      
      // Cleanup any existing expired codes for all users
      await storage.cleanupExpiredPasswordResetCodes();
      
      // Invalidate any existing active codes for this user
      await storage.invalidateUserPasswordResetCodes(user.id);
      
      // Generate secure 6-digit code
      const resetCode = generate6DigitCode();
      const codeHash = hashCode(resetCode);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Store the code in database
      await storage.createPasswordResetCode({
        userId: user.id,
        codeHash,
        expiresAt,
        attempts: 0,
        maxAttempts: 5,
        requestIp: req.ip || req.connection.remoteAddress || 'unknown'
      });
      
      // Send 6-digit code email
      const { sendPasswordResetCodeEmail } = await import('./email-templates');
      const emailSent = await sendPasswordResetCodeEmail(
        user.email,
        user.firstName ?? 'User',
        resetCode
      );
      
      if (!emailSent) {
        console.error(`Failed to send password reset code to ${email}`);
      }
      
      res.json({ 
        success: true, 
        message: "If this email is registered, you will receive a 6-digit verification code shortly.",
        // In development, include the code for testing
        resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
      });
      
    } catch (error) {
      console.error("Password reset request error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to process password reset request" 
      });
    }
  });

  // Step 2: Verify 6-digit code and get reset token
  app.post("/api/auth/password-reset/verify", async (req: Request, res: Response) => {
    try {
      const validatedData = passwordResetVerifySchema.parse(req.body);
      const { email, code } = validatedData;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || user.authProvider !== "email") {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code"
        });
      }
      
      // Get active reset code for user
      const resetCodeRecord = await storage.getActivePasswordResetCode(user.id);
      if (!resetCodeRecord) {
        return res.status(400).json({
          success: false,
          message: "No active reset code found. Please request a new code."
        });
      }
      
      // Check if code has expired
      if (new Date() > resetCodeRecord.expiresAt) {
        await storage.markPasswordResetCodeAsConsumed(resetCodeRecord.id);
        return res.status(400).json({
          success: false,
          message: "Reset code has expired. Please request a new code.",
          expired: true
        });
      }
      
      // Check if too many attempts
      if (resetCodeRecord.attempts >= resetCodeRecord.maxAttempts) {
        await storage.markPasswordResetCodeAsConsumed(resetCodeRecord.id);
        return res.status(400).json({
          success: false,
          message: "Too many incorrect attempts. Please request a new code.",
          attemptsExceeded: true
        });
      }
      
      // Verify the code
      const isCodeValid = verifyCodeHash(code, resetCodeRecord.codeHash);
      
      if (!isCodeValid) {
        // Increment attempts
        await storage.updatePasswordResetCodeAttempts(
          resetCodeRecord.id, 
          resetCodeRecord.attempts + 1
        );
        
        const attemptsLeft = resetCodeRecord.maxAttempts - resetCodeRecord.attempts - 1;
        return res.status(400).json({
          success: false,
          message: `Invalid verification code. ${attemptsLeft} attempt(s) remaining.`,
          attemptsLeft
        });
      }
      
      // Code is valid - mark as consumed and generate reset token
      await storage.markPasswordResetCodeAsConsumed(resetCodeRecord.id);
      
      // Generate secure reset token
      const resetToken = generateSecureToken();
      const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Update user with reset token
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetTokenExpires: resetTokenExpires
      });
      
      res.json({
        success: true,
        message: "Code verified successfully",
        resetToken,
        expiresAt: resetTokenExpires.toISOString()
      });
      
    } catch (error) {
      console.error("Password reset verify error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to verify code" 
      });
    }
  });

  // Step 3: Complete password reset with token
  app.post("/api/auth/password-reset/complete", async (req: Request, res: Response) => {
    try {
      const validatedData = passwordResetCompleteSchema.parse(req.body);
      const { token, password } = validatedData;
      
      // Find user by reset token
      const users = await storage.getAllUsers();
      const user = users.find(u => 
        u.passwordResetToken === token && 
        u.passwordResetTokenExpires && 
        new Date() < new Date(u.passwordResetTokenExpires)
      );
      
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired reset token" 
        });
      }
      
      // Hash the new password
      const passwordHash = await hashPassword(password);
      
      // Update user password and clear reset token
      await storage.updateUser(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpires: null
      });
      
      // Cleanup any remaining reset codes for this user
      await storage.invalidateUserPasswordResetCodes(user.id);
      
      res.json({ 
        success: true, 
        message: "Password reset successfully" 
      });
      
    } catch (error) {
      console.error("Password reset complete error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to reset password" 
      });
    }
  });

  // DEPRECATED: Old forgot password endpoint (kept for backward compatibility)
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    res.status(410).json({
      success: false,
      message: "This endpoint is deprecated. Please use the new 6-digit code system: /api/auth/password-reset/request",
      deprecated: true,
      newEndpoint: "/api/auth/password-reset/request"
    });
  });
  
  // DEPRECATED: Old reset password endpoint (will be removed in future version)
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      const { email } = validatedData;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          success: true, 
          message: "If this email is registered, you will receive a password reset link shortly." 
        });
      }
      
      // Generate reset token
      const resetToken = generateSecureToken();
      const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Update user with reset token
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetTokenExpires: resetTokenExpires
      });
      
      // Generate reset link and send email
      // Use environment-specific URL generation - prioritize DOMAIN for production
      let baseUrl;
      if (process.env.DOMAIN) {
        // Production/custom domain (highest priority)
        baseUrl = process.env.DOMAIN;
      } else if (process.env.REPLIT_DEV_DOMAIN) {
        // Development Replit deployment (fallback)
        baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
      } else {
        // Fallback to request headers (local development)
        baseUrl = `${req.protocol}://${req.get('host')}`;
      }
      
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
      console.log(`Password reset link for ${email}: ${resetLink}`);
      
      // Send password reset email
      const { sendPasswordResetEmail } = await import('./email-templates');
      const emailSent = await sendPasswordResetEmail(
        user.email,
        user.firstName ?? 'User',
        resetLink
      );
      
      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`);
      }
      
      res.json({ 
        success: true, 
        message: "If this email is registered, you will receive a password reset link shortly.",
        // In development, include the link for testing
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
      });
      
    } catch (error) {
      console.error("Forgot password error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to process password reset request" 
      });
    }
  });
  
  // Reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const { token, password, newPassword } = validatedData;
      const passwordToUse = newPassword || password;
      
      // Find user by reset token
      const users = await storage.getAllUsers();
      const user = users.find(u => 
        u.passwordResetToken === token && 
        u.passwordResetTokenExpires && 
        new Date() < new Date(u.passwordResetTokenExpires)
      );
      
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired reset token" 
        });
      }
      
      // Hash the new password
      const passwordHash = await hashPassword(passwordToUse!);
      
      // Update user password and clear reset token
      await storage.updateUser(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpires: null
      });
      
      res.json({ 
        success: true, 
        message: "Password reset successfully" 
      });
      
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to reset password" 
      });
    }
  });
  
  // Change password
  app.post("/api/auth/change-password", requireEmailAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required"
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long"
        });
      }
      
      const userId = req.session.user.id;
      const user = await storage.getUserById(userId);
      
      if (!user || !user.passwordHash) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
      
      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(userId, {
        passwordHash: newPasswordHash
      });
      
      res.json({
        success: true,
        message: "Password changed successfully"
      });
      
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password"
      });
    }
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