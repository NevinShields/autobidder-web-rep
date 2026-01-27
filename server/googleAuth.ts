import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { isSuperAdmin } from "./universalAuth";
import { sendAdminNewUserSignupNotification } from "./email-templates";
import { addUserToGoogleSheet } from "./googleSheets";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Calculate trial dates (same as email auth)
function calculateTrialDates() {
  const trialStartDate = new Date();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialStartDate.getDate() + 14); // 14 days from now
  
  return {
    trialStartDate,
    trialEndDate,
  };
}

function getRedirectUri(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers.host || req.hostname;
  return `${protocol}://${host}/api/auth/google/callback`;
}

function getOAuth2Client(req: Request): OAuth2Client {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    getRedirectUri(req)
  );
}

function generateUserId(): string {
  return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

export function setupGoogleAuth(app: Express) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth not configured - GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
    return;
  }

  app.get("/api/auth/google", (req: Request, res: Response) => {
    const oauth2Client = getOAuth2Client(req);
    
    const state = crypto.randomBytes(32).toString('hex');
    (req.session as any).oauthState = state;
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "select_account",
      state: state,
    });

    res.redirect(authUrl);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code, state } = req.query;
    
    if (!code || typeof code !== "string") {
      return res.redirect("/login?error=missing_code");
    }

    const sessionState = (req.session as any).oauthState;
    if (!state || state !== sessionState) {
      return res.redirect("/login?error=invalid_state");
    }
    
    delete (req.session as any).oauthState;

    try {
      const oauth2Client = getOAuth2Client(req);
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.redirect("/login?error=invalid_token");
      }

      const { sub: googleId, email, given_name, family_name, picture } = payload;

      if (!email) {
        return res.redirect("/login?error=no_email");
      }

      let user = await storage.getUserByEmail(email);
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        const newUserId = generateUserId();
        const { trialStartDate, trialEndDate } = calculateTrialDates();
        
        // Determine user type based on email (same as email auth)
        const userType = isSuperAdmin(email) ? "super_admin" : "owner";
        
        user = await storage.createUser({
          id: newUserId,
          email: email,
          firstName: given_name || "",
          lastName: family_name || "",
          profileImageUrl: picture || null,
          googleId: googleId,
          passwordHash: null,
          authProvider: "google",
          emailVerified: true,
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
          onboardingCompleted: false,
          onboardingStep: 1,
        });
        
        // Create onboarding progress (same as email auth)
        await storage.createOnboardingProgress({
          userId: newUserId,
          completedSteps: [],
          currentStep: 1,
          businessSetupCompleted: false,
          firstCalculatorCreated: false,
          designCustomized: false,
          embedCodeGenerated: false,
          firstLeadReceived: false,
        });
        
        // Send admin notification (non-blocking, same as email auth)
        const userName = `${given_name || ""} ${family_name || ""}`.trim() || "Google User";
        sendAdminNewUserSignupNotification(
          email,
          userName,
          newUserId,
          undefined // No business name from Google OAuth
        ).catch(error => {
          console.error('Failed to send admin signup notification for Google user:', error);
        });
        
        // Add user to Google Sheet (non-blocking, same as email auth)
        addUserToGoogleSheet({
          userId: newUserId,
          email,
          firstName: given_name || "",
          lastName: family_name || "",
          businessName: undefined,
          signupDate: new Date(),
          plan: "trial",
          trialEndDate: trialEndDate
        }).catch(error => {
          console.error('Failed to add Google user to Google Sheet:', error);
        });
        
      } else if (!user.googleId) {
        // Existing user linking their Google account
        await storage.updateUser(user.id, {
          googleId: googleId,
          profileImageUrl: user.profileImageUrl || picture || null,
        });
        user = await storage.getUser(user.id);
      }

      if (!user) {
        return res.redirect("/login?error=user_creation_failed");
      }

      // Set session.user the same way email auth does
      (req.session as any).user = user;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect("/login?error=session_error");
        }
        
        if (!user!.onboardingCompleted) {
          return res.redirect("/onboarding");
        }
        return res.redirect("/dashboard");
      });
    } catch (error) {
      console.error("Google OAuth error:", error);
      return res.redirect("/login?error=oauth_failed");
    }
  });
}
