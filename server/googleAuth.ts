import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";
import type { Express, Request, Response } from "express";
import crypto from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

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

      if (!user) {
        const newUserId = generateUserId();
        user = await storage.createUser({
          id: newUserId,
          email: email,
          firstName: given_name || "",
          lastName: family_name || "",
          profileImageUrl: picture || null,
          googleId: googleId,
          password: null,
          userType: "owner",
          onboardingCompleted: false,
          subscriptionStatus: "trialing",
          subscriptionPlan: "free",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
      } else if (!user.googleId) {
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
