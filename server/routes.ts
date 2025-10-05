import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { storage } from "./storage";
import { db } from "./db";
import { dfyServices, dfyServicePurchases, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { setupEmailAuth, requireEmailAuth } from "./emailAuth";
import { requireAuth, optionalAuth, requireSuperAdmin, isSuperAdmin } from "./universalAuth";
import { 
  insertFormulaSchema,
  insertFormulaTemplateSchema,
  insertLeadSchema, 
  insertMultiServiceLeadSchema, 
  insertBusinessSettingsSchema,
  insertAvailabilitySlotSchema,
  insertRecurringAvailabilitySchema,
  insertBlockedDateSchema,
  insertWebsiteSchema,
  insertCustomFormSchema,
  insertCustomFormLeadSchema,
  insertSupportTicketSchema,
  insertTicketMessageSchema,
  insertEstimateSchema,
  insertEmailSettingsSchema,
  insertEmailTemplateSchema,
  insertBidRequestSchema,
  insertBidResponseSchema,
  insertBidEmailTemplateSchema,
  insertIconSchema,
  insertIconTagSchema,
  insertIconTagAssignmentSchema,
  insertDudaTemplateTagSchema,
  insertDudaTemplateMetadataSchema,
  insertDudaTemplateTagAssignmentSchema,
  insertDfyServiceSchema,
  insertDfyServicePurchaseSchema
} from "@shared/schema";
import { generateFormula as generateFormulaGemini, editFormula as editFormulaGemini } from "./gemini";
import { generateFormula as generateFormulaOpenAI, refineObjectDescription as refineObjectDescriptionOpenAI } from "./openai-formula";
import { generateFormula as generateFormulaClaude, editFormula as editFormulaClaude } from "./claude";
import { analyzePhotoMeasurement, analyzeWithSetupConfig, type MeasurementRequest } from "./photo-measurement";
import { dudaApi } from "./duda-api";
import { calculateDistance, geocodeAddress } from "./location-utils";
import { ZapierIntegrationService } from "./zapier-integration";
import { stripe, createCheckoutSession, createPortalSession, updateSubscription, SUBSCRIPTION_PLANS } from "./stripe";
import { 
  sendEmail,
  sendWelcomeEmail, 
  sendOnboardingCompleteEmail, 
  sendSubscriptionConfirmationEmail, 
  sendNewLeadNotification, 
  sendNewMultiServiceLeadNotification,
  sendNewBookingNotification,
  sendBidRequestNotification,
  sendBidResponseNotification,
  sendCustomerEstimateEmail,
  sendCustomerBookingConfirmationEmail,
  sendCustomerRevisedEstimateEmail,
  sendLeadSubmittedEmail,
  sendLeadBookedEmail,
  sendRevisedBidEmail,
  sendPasswordResetEmail
} from "./email-templates";
import { sendEmailWithFallback } from "./email-providers";
import { registerZapierRoutes } from "./zapier-routes";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { getGoogleCalendarBusyTimes, getGoogleCalendarEvents, checkUserGoogleCalendarConnection, getGoogleOAuthUrl, exchangeCodeForTokens, getAvailableCalendars } from "./google-calendar";
import { Resend } from 'resend';

// Utility function to extract client IP address
function getClientIpAddress(req: express.Request): string | null {
  // Check forwarded headers first (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }
  
  // Check other common proxy headers
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  // Fall back to connection remote address
  return req.connection.remoteAddress || req.socket.remoteAddress || null;
}

// Configure multer for file uploads - using memory storage for object storage uploads
const uploadIcon = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any, false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Configure multer for form image uploads
const formImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/form-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `form-image-${uniqueSuffix}${fileExtension}`);
  }
});

const uploadFormImage = multer({ 
  storage: formImageStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed!') as any, false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (configurable via form settings)
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Email authentication only
  setupEmailAuth(app);

  // Logout endpoint for email authentication
  app.post("/api/logout", (req, res) => {
    try {
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ success: false, message: "Failed to logout" });
        }
        
        // Clear the session cookie
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ success: false, message: "Failed to logout" });
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Config endpoint for frontend environment variables
  app.get("/api/config", async (req, res) => {
    try {
      res.json({
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  // Geocode endpoint for address search in map components
  app.get("/api/geocode", async (req, res) => {
    try {
      const { address } = req.query;
      
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: "Address parameter is required" 
        });
      }

      const result = await geocodeAddress(address);
      
      if (result) {
        return res.json({
          success: true,
          location: {
            latitude: result.latitude,
            longitude: result.longitude,
            formattedAddress: result.formattedAddress
          }
        });
      } else {
        return res.json({
          success: false,
          error: "Could not geocode the provided address"
        });
      }
    } catch (error) {
      console.error("Geocode API error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during geocoding" 
      });
    }
  });

  // Note: Auth routes are now handled in emailAuth.ts

  // Object storage routes for persistent icon storage

  // Endpoint to serve private objects (icons)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint to get presigned URL for icon upload
  app.post("/api/objects/icon-upload", async (req, res) => {
    try {
      const { fileExtension } = req.body;
      if (!fileExtension) {
        return res.status(400).json({ message: "File extension is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const { uploadUrl, objectPath } = await objectStorageService.getIconUploadURL(fileExtension);
      
      res.json({ uploadUrl, objectPath });
    } catch (error) {
      console.error('Error getting icon upload URL:', error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Endpoint to set ACL policy after icon upload
  app.post("/api/objects/set-icon-acl", async (req, res) => {
    try {
      const { objectPath, userId } = req.body;
      if (!objectPath) {
        return res.status(400).json({ message: "Object path is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        objectPath,
        {
          owner: userId || "system",
          visibility: "public", // Icons are public for display
        }
      );

      res.json({ objectPath: normalizedPath });
    } catch (error) {
      console.error('Error setting icon ACL:', error);
      res.status(500).json({ message: "Failed to set icon policy" });
    }
  });

  // Endpoint to get presigned URL for reference image upload
  app.post("/api/objects/reference-image-upload", async (req, res) => {
    try {
      const { fileExtension } = req.body;
      if (!fileExtension) {
        return res.status(400).json({ message: "File extension is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const { uploadUrl, objectPath } = await objectStorageService.getIconUploadURL(fileExtension);
      
      res.json({ uploadUrl, objectPath });
    } catch (error) {
      console.error('Error getting reference image upload URL:', error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Endpoint to set ACL policy after reference image upload
  app.post("/api/objects/set-reference-image-acl", async (req, res) => {
    try {
      const { objectPath, userId } = req.body;
      if (!objectPath) {
        return res.status(400).json({ message: "Object path is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        objectPath,
        {
          owner: userId || "system",
          visibility: "public",
        }
      );

      res.json({ objectPath: normalizedPath });
    } catch (error) {
      console.error('Error setting reference image ACL:', error);
      res.status(500).json({ message: "Failed to set reference image policy" });
    }
  });

  // Updated icon upload endpoint using object storage
  app.post("/api/upload/icon", uploadIcon.single('icon'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log('Upload icon - file info:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length || 'no buffer'
      });

      const fileExtension = path.extname(req.file.originalname);
      const objectStorageService = new ObjectStorageService();
      
      console.log('Upload icon - getting presigned URL for extension:', fileExtension);
      // Get presigned URL for upload
      const { uploadUrl, objectPath } = await objectStorageService.getIconUploadURL(fileExtension);
      console.log('Upload icon - got presigned URL:', { uploadUrl: 'URL_REDACTED', objectPath });
      
      console.log('Upload icon - starting fetch upload, file buffer size:', req.file.buffer?.length);
      // Upload file buffer directly to object storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: req.file.buffer,
        headers: {
          'Content-Type': req.file.mimetype,
          'Content-Length': req.file.size.toString(),
        },
      });

      console.log('Upload icon - fetch response status:', uploadResponse.status);
      console.log('Upload icon - fetch response ok:', uploadResponse.ok);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.log('Upload icon - fetch error response:', errorText);
        throw new Error(`Upload failed with status: ${uploadResponse.status} - ${errorText}`);
      }

      console.log('Upload icon - setting ACL policy');
      // Set ACL policy to make the icon public
      await objectStorageService.trySetObjectEntityAclPolicy(
        objectPath,
        {
          owner: "system",
          visibility: "public",
        }
      );
      console.log('Upload icon - ACL policy set successfully');

      // Return the object storage path
      res.json({ iconUrl: objectPath });
    } catch (error) {
      console.error('Icon upload error:', error);
      res.status(500).json({ message: "Failed to upload icon" });
    }
  });

  // Form image upload endpoint
  app.post("/api/upload-image", uploadFormImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      
      const imageUrl = `/uploads/form-images/${req.file.filename}`;
      res.json({ 
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Form image upload error:', error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Combined API endpoint for embed forms to reduce requests
  app.get("/api/public/embed-data", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "userId parameter is required" });
      }

      // Fetch both formulas and business settings in parallel for better performance
      const [allFormulas, settings] = await Promise.all([
        storage.getFormulasByUserId(userId),
        storage.getBusinessSettingsByUserId(userId)
      ]);

      // Filter formulas to only show those that are displayed AND active
      const activeFormulas = allFormulas.filter(formula => 
        formula.isDisplayed !== false && formula.isActive === true
      );

      // Prepare public business settings (excluding sensitive data)
      const publicSettings = settings ? {
        businessName: settings.businessName,
        styling: settings.styling,
        enableLeadCapture: settings.enableLeadCapture,
        enableBooking: settings.enableBooking,
        discounts: settings.discounts,
        allowDiscountStacking: settings.allowDiscountStacking,
        enableDistancePricing: settings.enableDistancePricing,
        distancePricingType: settings.distancePricingType,
        distancePricingRate: settings.distancePricingRate,
        businessAddress: settings.businessAddress,
        serviceRadius: settings.serviceRadius,
        guideVideos: settings.guideVideos
      } : null;

      // Return combined data
      res.json({
        formulas: activeFormulas,
        businessSettings: publicSettings
      });
    } catch (error) {
      console.error('Error fetching embed data:', error);
      res.status(500).json({ message: "Failed to fetch embed data" });
    }
  });

  // Public API endpoints for embed forms (kept for backward compatibility)
  app.get("/api/public/formulas", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "userId parameter is required" });
      }

      // Get formulas for specific user that are marked as displayed AND active
      const allFormulas = await storage.getFormulasByUserId(userId);
      const activeFormulas = allFormulas.filter(formula => 
        formula.isDisplayed !== false && formula.isActive === true
      );
      res.json(activeFormulas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch formulas" });
    }
  });

  app.get("/api/public/business-settings", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "userId parameter is required" });
      }

      // Get business settings for specific user (without sensitive info)
      const settings = await storage.getBusinessSettingsByUserId(userId);
      if (settings) {
        // Only return styling and public settings, exclude sensitive data
        const publicSettings = {
          businessName: settings.businessName,
          styling: settings.styling,
          enableLeadCapture: settings.enableLeadCapture,
          enableBooking: settings.enableBooking,
          discounts: settings.discounts,
          allowDiscountStacking: settings.allowDiscountStacking,
          enableDistancePricing: settings.enableDistancePricing,
          distancePricingType: settings.distancePricingType,
          distancePricingRate: settings.distancePricingRate,
          businessAddress: settings.businessAddress,
          serviceRadius: settings.serviceRadius,
          guideVideos: settings.guideVideos,
          enableAutoExpandCollapse: settings.enableAutoExpandCollapse
        };
        res.json(publicSettings);
      } else {
        res.status(404).json({ message: "Business settings not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business settings" });
    }
  });

  // Combined calculator data endpoint for better performance
  app.get("/api/public/calculator-data", async (req, res) => {
    // Disable caching to ensure fresh data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const { userId, customFormId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "userId parameter is required" });
      }

      // Fetch all data in parallel for better performance
      const [allFormulas, businessSettings, designSettings, customForm] = await Promise.all([
        storage.getFormulasByUserId(userId),
        storage.getBusinessSettingsByUserId(userId),
        storage.getDesignSettingsByUserId(userId),
        customFormId ? storage.getCustomFormById(customFormId as string) : null
      ]);

      // Filter formulas to only show those that are displayed AND active
      let activeFormulas = allFormulas.filter(formula => 
        formula.isDisplayed !== false && formula.isActive === true
      );

      // If this is a custom form, filter to only selected services
      if (customForm && customForm.selectedServices) {
        activeFormulas = activeFormulas.filter(formula => 
          customForm.selectedServices.includes(formula.id)
        );
      }

      // Prepare public business settings (excluding sensitive data)
      const publicBusinessSettings = businessSettings ? {
        businessName: businessSettings.businessName,
        styling: businessSettings.styling,
        enableLeadCapture: businessSettings.enableLeadCapture,
        enableBooking: businessSettings.enableBooking,
        discounts: businessSettings.discounts,
        allowDiscountStacking: businessSettings.allowDiscountStacking,
        enableDistancePricing: businessSettings.enableDistancePricing,
        distancePricingType: businessSettings.distancePricingType,
        distancePricingRate: businessSettings.distancePricingRate,
        businessAddress: businessSettings.businessAddress,
        serviceRadius: businessSettings.serviceRadius,
        guideVideos: businessSettings.guideVideos,
        enableAutoExpandCollapse: businessSettings.enableAutoExpandCollapse
      } : null;

      // Prepare design settings or defaults
      const publicDesignSettings = designSettings || {
        styling: {
          theme: "modern",
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B",
          backgroundColor: "#FFFFFF",
          textColor: "#1F2937",
          fontFamily: "Inter",
          borderRadius: 8
        },
        componentStyles: {}
      };

      // Return all data in one response
      res.json({
        formulas: activeFormulas,
        businessSettings: publicBusinessSettings,
        designSettings: publicDesignSettings,
        customForm: customForm
      });
    } catch (error) {
      console.error('Error fetching calculator data:', error);
      res.status(500).json({ message: "Failed to fetch calculator data" });
    }
  });

  app.get("/api/public/design-settings", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "userId parameter is required" });
      }

      // Get design settings for specific user
      const designSettings = await storage.getDesignSettingsByUserId(userId);
      if (designSettings) {
        res.json(designSettings);
      } else {
        // Return default design settings if none found
        const defaultDesignSettings = {
          styling: {
            theme: "modern",
            primaryColor: "#3B82F6",
            secondaryColor: "#10B981",
            accentColor: "#F59E0B",
            backgroundColor: "#FFFFFF",
            textColor: "#1F2937",
            fontFamily: "Inter",
            borderRadius: 8
          },
          componentStyles: {}
        };
        res.json(defaultDesignSettings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch design settings" });
    }
  });



  // Preview route for custom forms (auth required)
  app.get("/api/dashboard/forms/:formId/preview", requireAuth, async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      const userId = (req as any).currentUser.id;
      
      const form = await storage.getCustomFormById(formId);
      if (!form || form.accountId !== userId) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      
      // Return form with noindex meta tag
      res.send(`
        <html>
          <head>
            <title>${form.name} - Preview</title>
            <meta name="robots" content="noindex">
          </head>
          <body>
            <div style="background: #f0f0f0; padding: 10px; text-align: center; font-family: Arial;">
              <strong>PREVIEW MODE</strong> - This form is not live
            </div>
            <div id="custom-form-preview" data-form='${JSON.stringify(form)}'></div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error fetching custom form preview:', error);
      res.status(500).json({ message: "Failed to fetch custom form preview" });
    }
  });

  // Formula routes
  app.get("/api/formulas", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const formulas = await storage.getFormulasByUserId(userId);
      res.json(formulas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch formulas" });
    }
  });

  app.get("/api/formulas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const formula = await storage.getFormula(id);
      if (!formula) {
        return res.status(404).json({ message: "Formula not found" });
      }
      res.json(formula);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch formula" });
    }
  });

  app.post("/api/formulas", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      console.log('Received formula data:', JSON.stringify(req.body, null, 2));
      const validatedData = insertFormulaSchema.parse(req.body);
      const embedId = `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const formulaWithUser = { ...validatedData, userId, embedId };
      const formula = await storage.createFormula(formulaWithUser);
      res.status(201).json(formula);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Formula validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid formula data", errors: error.errors });
      }
      console.error('Formula creation error:', error);
      res.status(500).json({ message: "Failed to create formula" });
    }
  });

  app.patch("/api/formulas/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFormulaSchema.partial().parse(req.body);
      const formula = await storage.updateFormula(id, validatedData);
      if (!formula) {
        return res.status(404).json({ message: "Formula not found" });
      }
      res.json(formula);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid formula data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update formula" });
    }
  });

  app.delete("/api/formulas/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFormula(id);
      if (!deleted) {
        return res.status(404).json({ message: "Formula not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete formula" });
    }
  });

  // Reorder formulas
  app.post("/api/formulas/reorder", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const { formulas } = req.body;
      
      if (!Array.isArray(formulas)) {
        return res.status(400).json({ message: "Formulas array is required" });
      }

      // Update sort order for each formula
      for (let i = 0; i < formulas.length; i++) {
        const formulaId = formulas[i].id;
        await storage.updateFormula(formulaId, { sortOrder: i });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Formula reorder error:', error);
      res.status(500).json({ message: "Failed to reorder formulas" });
    }
  });

  // AI Formula Generation - Support for OpenAI, Gemini, and Claude
  app.post("/api/formulas/generate", async (req, res) => {
    try {
      const { description, provider } = req.body;
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ message: "Description is required" });
      }

      let aiFormula;
      const requestedProvider = provider?.toLowerCase();

      // If specific provider requested, try that first
      if (requestedProvider === 'claude') {
        try {
          console.log('Attempting formula generation with Claude...');
          aiFormula = await generateFormulaClaude(description);
          console.log('Claude formula generation successful');
        } catch (claudeError) {
          console.warn('Claude formula generation failed, falling back to OpenAI:', claudeError);
          aiFormula = await generateFormulaOpenAI(description);
          console.log('OpenAI fallback successful');
        }
      } else if (requestedProvider === 'gemini') {
        try {
          console.log('Attempting formula generation with Gemini...');
          aiFormula = await generateFormulaGemini(description);
          console.log('Gemini formula generation successful');
        } catch (geminiError) {
          console.warn('Gemini formula generation failed, falling back to Claude:', geminiError);
          aiFormula = await generateFormulaClaude(description);
          console.log('Claude fallback successful');
        }
      } else {
        // Default order: OpenAI -> Claude -> Gemini
        try {
          console.log('Attempting formula generation with OpenAI...');
          aiFormula = await generateFormulaOpenAI(description);
          console.log('OpenAI formula generation successful');
        } catch (openaiError) {
          console.warn('OpenAI formula generation failed, trying Claude:', openaiError);
          try {
            aiFormula = await generateFormulaClaude(description);
            console.log('Claude fallback successful');
          } catch (claudeError) {
            console.warn('Claude formula generation failed, falling back to Gemini:', claudeError);
            aiFormula = await generateFormulaGemini(description);
            console.log('Gemini final fallback successful');
          }
        }
      }

      res.json(aiFormula);
    } catch (error) {
      console.error('AI formula generation error (all providers failed):', error);
      res.status(500).json({ message: "Failed to generate formula with AI" });
    }
  });

  // AI Formula Editing - Support for OpenAI, Gemini, and Claude
  app.post("/api/formulas/edit", async (req, res) => {
    try {
      const { currentFormula, editInstructions, provider } = req.body;
      if (!currentFormula || !editInstructions || typeof editInstructions !== 'string') {
        return res.status(400).json({ message: "Current formula and edit instructions are required" });
      }

      let editedFormula;
      const requestedProvider = provider?.toLowerCase();

      // If specific provider requested, try that first
      if (requestedProvider === 'claude') {
        try {
          console.log('Attempting formula editing with Claude...');
          editedFormula = await editFormulaClaude(currentFormula, editInstructions);
          console.log('Claude formula editing successful');
        } catch (claudeError) {
          console.warn('Claude formula editing failed, falling back to Gemini:', claudeError);
          editedFormula = await editFormulaGemini(currentFormula, editInstructions);
          console.log('Gemini fallback successful');
        }
      } else {
        // Default: use Gemini for editing (most stable for this task)
        try {
          console.log('Attempting formula editing with Gemini...');
          editedFormula = await editFormulaGemini(currentFormula, editInstructions);
          console.log('Gemini formula editing successful');
        } catch (geminiError) {
          console.warn('Gemini formula editing failed, trying Claude:', geminiError);
          editedFormula = await editFormulaClaude(currentFormula, editInstructions);
          console.log('Claude fallback successful');
        }
      }

      res.json(editedFormula);
    } catch (error) {
      console.error('AI formula edit error (all providers failed):', error);
      res.status(500).json({ message: "Failed to edit formula with AI" });
    }
  });

  // Calculate distance between two addresses
  app.post("/api/calculate-distance", async (req, res) => {
    try {
      const { businessAddress, customerAddress } = req.body;
      
      if (!businessAddress || !customerAddress) {
        return res.status(400).json({ error: "Both addresses are required" });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      // If no API key, use simple city-based estimation
      if (!apiKey) {
        console.log("No Google Maps API key - using city-based estimation");
        const distance = estimateDistanceFromCities(businessAddress, customerAddress);
        return res.json({
          distance: Math.round(distance * 10) / 10,
          distanceText: `~${Math.round(distance)} mi (estimated)`,
          duration: "Enable Google Maps API for accurate calculation"
        });
      }

      // For now, skip Google Maps APIs due to permission issues and use city estimation
      console.log("Skipping Google Maps APIs, using city-based estimation directly");

      // Final fallback: Simple city-based estimation
      console.log("Using final fallback city-based estimation");
      const distance = estimateDistanceFromCities(businessAddress, customerAddress);
      return res.json({
        distance: Math.round(distance * 10) / 10,
        distanceText: `~${Math.round(distance)} mi (estimated)`,
        duration: "Enable Google Maps APIs for accurate calculation"
      });

    } catch (error) {
      console.error("Distance calculation error:", error);
      
      // Even if everything fails, provide an estimated distance
      try {
        const distance = estimateDistanceFromCities(req.body.businessAddress || "", req.body.customerAddress || "");
        return res.json({
          distance: Math.round(distance * 10) / 10,
          distanceText: `~${Math.round(distance)} mi (estimated)`,
          duration: "Basic distance estimation"
        });
      } catch (fallbackError) {
        res.status(500).json({ error: "Failed to calculate distance" });
      }
    }
  });

  // Simple city-based distance estimation function
  function estimateDistanceFromCities(address1: string, address2: string): number {
    const extractCity = (address: string): string => {
      const cleanAddr = address.toLowerCase();
      if (cleanAddr.includes('philadelphia') || cleanAddr.includes('philly')) return 'philadelphia';
      if (cleanAddr.includes('pittsburgh')) return 'pittsburgh';
      if (cleanAddr.includes('harrisburg')) return 'harrisburg';
      if (cleanAddr.includes('lemoyne')) return 'lemoyne';
      if (cleanAddr.includes('new york')) return 'newyork';
      if (cleanAddr.includes('baltimore')) return 'baltimore';
      if (cleanAddr.includes('washington') || cleanAddr.includes('dc')) return 'washington';
      return 'unknown';
    };

    const city1 = extractCity(address1);
    const city2 = extractCity(address2);

    // Basic PA city distances (approximate)
    const distances: Record<string, Record<string, number>> = {
      'lemoyne': {
        'philadelphia': 95,
        'pittsburgh': 200,
        'harrisburg': 5,
        'newyork': 180,
        'baltimore': 85,
        'washington': 110
      },
      'philadelphia': {
        'lemoyne': 95,
        'pittsburgh': 300,
        'harrisburg': 95,
        'newyork': 95,
        'baltimore': 100,
        'washington': 140
      }
    };

    return distances[city1]?.[city2] || distances[city2]?.[city1] || 50; // Default 50 miles
  }

  // Get available AI providers
  app.get("/api/ai-providers", async (req, res) => {
    try {
      const providers = {
        openai: {
          name: "OpenAI",
          available: !!process.env.OPENAI_API_KEY,
          description: "GPT-4o model for advanced formula generation"
        },
        claude: {
          name: "Claude",
          available: !!process.env.ANTHROPIC_API_KEY,
          description: "Claude 3.5 Sonnet for intelligent pricing calculations"
        },
        gemini: {
          name: "Gemini",
          available: !!process.env.GEMINI_API_KEY,
          description: "Google Gemini for versatile contractor formulas"
        }
      };

      res.json(providers);
    } catch (error) {
      console.error('Error fetching AI providers:', error);
      res.status(500).json({ message: "Failed to fetch AI providers" });
    }
  });

  // Embed route
  app.get("/api/embed/:embedId", async (req, res) => {
    try {
      const { embedId } = req.params;
      const formula = await storage.getFormulaByEmbedId(embedId);
      if (!formula) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      // Fetch design settings instead of business settings for styling
      const designSettings = await storage.getDesignSettingsByUserId(formula.userId);
      
      // Include design settings for styling/component styles with the formula
      const response = {
        ...formula,
        designSettings: designSettings || null,
        styling: designSettings?.styling || null,
        componentStyles: designSettings?.componentStyles || null,
      };
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calculator" });
    }
  });

  // Formula Template routes (public templates accessible to all users)
  app.get("/api/formula-templates", async (req, res) => {
    try {
      const { category } = req.query;
      let templates;
      
      if (category && typeof category === 'string') {
        templates = await storage.getFormulaTemplatesByCategory(category);
      } else {
        templates = await storage.getActiveFormulaTemplates();
      }
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching formula templates:', error);
      res.status(500).json({ message: "Failed to fetch formula templates" });
    }
  });

  app.get("/api/formula-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getFormulaTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error('Error fetching formula template:', error);
      res.status(500).json({ message: "Failed to fetch formula template" });
    }
  });

  // Create new formula from template
  app.post("/api/formula-templates/:id/use", requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const userId = (req as any).currentUser.id;
      
      // Get the template
      const template = await storage.getFormulaTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Apply template's complete design settings (colors, borders, shadows, etc.) to user's design settings
      if (template.templateStyling || template.templateComponentStyles) {
        const currentDesignSettings = await storage.getDesignSettingsByUserId(userId);
        
        const updatedDesignSettings = {
          userId,
          styling: template.templateStyling || currentDesignSettings?.styling || {},
          componentStyles: template.templateComponentStyles || currentDesignSettings?.componentStyles || {},
          deviceView: currentDesignSettings?.deviceView || 'desktop'
        };

        if (currentDesignSettings) {
          await storage.updateDesignSettings(currentDesignSettings.id, updatedDesignSettings);
        } else {
          await storage.createDesignSettings(updatedDesignSettings);
        }
      }

      // Create new formula from template (NO styling data - completely separate from design)
      const embedId = `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newFormula = {
        name: template.name,
        title: template.title,
        description: template.description,
        bulletPoints: template.bulletPoints,
        variables: template.variables,
        formula: template.formula,
        styling: {}, // Keep empty - design is handled separately
        guideVideoUrl: template.guideVideoUrl,
        iconUrl: template.iconUrl,
        iconId: template.iconId,
        enableMeasureMap: template.enableMeasureMap,
        measureMapType: template.measureMapType,
        measureMapUnit: template.measureMapUnit,
        upsellItems: template.upsellItems,
        enableDistancePricing: template.enableDistancePricing,
        distancePricingType: template.distancePricingType,
        distancePricingRate: template.distancePricingRate,
        serviceRadius: template.serviceRadius,
        userId,
        embedId
      };

      const formula = await storage.createFormula(newFormula);
      
      // Increment template usage count
      await storage.incrementTemplateUsage(templateId);
      
      res.status(201).json(formula);
    } catch (error) {
      console.error('Error creating formula from template:', error);
      res.status(500).json({ message: "Failed to create formula from template" });
    }
  });

  // Save formula as template (for regular users)
  app.post("/api/formulas/:id/save-as-template", requireAuth, async (req, res) => {
    try {
      const formulaId = parseInt(req.params.id);
      const userId = (req as any).currentUser.id;
      const { category, templateName, iconId, iconUrl } = req.body;

      if (!category || typeof category !== 'string') {
        return res.status(400).json({ message: "Category is required" });
      }

      // Get the formula
      const formula = await storage.getFormula(formulaId);
      if (!formula) {
        return res.status(404).json({ message: "Formula not found" });
      }

      // Verify user owns this formula
      if (formula.userId !== userId) {
        return res.status(403).json({ message: "You can only save your own formulas as templates" });
      }

      // Create template from formula
      const templateData = {
        name: templateName || formula.name,
        title: formula.title,
        description: formula.description,
        bulletPoints: formula.bulletPoints,
        variables: formula.variables,
        formula: formula.formula,
        category,
        guideVideoUrl: formula.guideVideoUrl,
        iconUrl: iconUrl !== undefined ? iconUrl : formula.iconUrl,
        iconId: iconId !== undefined ? iconId : formula.iconId,
        enableMeasureMap: formula.enableMeasureMap,
        measureMapType: formula.measureMapType,
        measureMapUnit: formula.measureMapUnit,
        upsellItems: formula.upsellItems,
        enableDistancePricing: formula.enableDistancePricing,
        distancePricingType: formula.distancePricingType,
        distancePricingRate: formula.distancePricingRate,
        serviceRadius: formula.serviceRadius,
        createdBy: userId
      };

      const template = await storage.createFormulaTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error saving formula as template:', error);
      res.status(500).json({ message: "Failed to save formula as template" });
    }
  });

  // Save formula as global template (admin only)
  app.post("/api/formulas/:id/save-as-global-template", requireAuth, async (req, res) => {
    try {
      const formulaId = parseInt(req.params.id);
      const userId = (req as any).currentUser.id;
      const { category } = req.body;

      // Check if user is admin/super admin
      const user = await storage.getUserById(userId);
      if (!user || user.userType !== 'super_admin') {
        return res.status(403).json({ message: "Only admins can create global templates" });
      }

      if (!category || typeof category !== 'string') {
        return res.status(400).json({ message: "Category is required" });
      }

      // Get the formula
      const formula = await storage.getFormula(formulaId);
      if (!formula) {
        return res.status(404).json({ message: "Formula not found" });
      }

      // Create template from formula
      const templateData = {
        name: formula.name,
        title: formula.title,
        description: formula.description,
        bulletPoints: formula.bulletPoints,
        variables: formula.variables,
        formula: formula.formula,
        category,
        guideVideoUrl: formula.guideVideoUrl,
        iconUrl: formula.iconUrl,
        iconId: formula.iconId,
        enableMeasureMap: formula.enableMeasureMap,
        measureMapType: formula.measureMapType,
        measureMapUnit: formula.measureMapUnit,
        upsellItems: formula.upsellItems,
        enableDistancePricing: formula.enableDistancePricing,
        distancePricingType: formula.distancePricingType,
        distancePricingRate: formula.distancePricingRate,
        serviceRadius: formula.serviceRadius,
        createdBy: userId
      };

      const template = await storage.createFormulaTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error saving formula as global template:', error);
      res.status(500).json({ message: "Failed to save formula as global template" });
    }
  });

  // Admin template management routes
  app.get("/api/admin/formula-templates", requireSuperAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllFormulaTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching all formula templates:', error);
      res.status(500).json({ message: "Failed to fetch formula templates" });
    }
  });

  app.put("/api/admin/formula-templates/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFormulaTemplateSchema.partial().parse(req.body);
      
      const template = await storage.updateFormulaTemplate(id, validatedData);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error('Error updating formula template:', error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/admin/formula-templates/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFormulaTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting formula template:', error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Design Settings API routes - completely separate from business settings
  app.get("/api/design-settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const designSettings = await storage.getDesignSettingsByUserId(userId);
      res.json(designSettings);
    } catch (error) {
      console.error('Error fetching design settings:', error);
      res.status(500).json({ message: "Failed to fetch design settings" });
    }
  });

  app.post("/api/design-settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const { styling, componentStyles, deviceView } = req.body;
      
      if (!styling || !componentStyles) {
        return res.status(400).json({ message: "Styling and component styles are required" });
      }

      const designSettings = await storage.createDesignSettings({
        userId,
        styling,
        componentStyles,
        deviceView: deviceView || 'desktop'
      });
      
      res.status(201).json(designSettings);
    } catch (error) {
      console.error('Error creating design settings:', error);
      res.status(500).json({ message: "Failed to create design settings" });
    }
  });

  app.put("/api/design-settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const { styling, componentStyles, deviceView } = req.body;
      
      // Get existing design settings
      let currentSettings = await storage.getDesignSettingsByUserId(userId);
      
      if (!currentSettings) {
        // Create new design settings if none exist
        const newSettings = await storage.createDesignSettings({
          userId,
          styling: styling || {
            // Default styling values
            containerWidth: 700,
            containerHeight: 850,
            containerBorderRadius: 16,
            containerShadow: 'xl',
            backgroundColor: '#FFFFFF',
            fontFamily: 'inter',
            fontSize: 'base',
            fontWeight: 'medium',
            textColor: '#1F2937',
            primaryColor: '#2563EB',
            buttonStyle: 'rounded',
            buttonBorderRadius: 12,
            inputBorderRadius: 10,
            inputBorderColor: '#E5E7EB',
            inputFocusColor: '#2563EB'
          },
          componentStyles: componentStyles || {},
          deviceView: deviceView || 'desktop'
        });
        return res.json(newSettings);
      }
      
      // Update existing settings
      const updateData: any = {};
      if (styling) updateData.styling = styling;
      if (componentStyles) updateData.componentStyles = componentStyles;
      if (deviceView) updateData.deviceView = deviceView;
      
      const updatedSettings = await storage.updateDesignSettings(currentSettings.id, updateData);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating design settings:', error);
      res.status(500).json({ message: "Failed to update design settings" });
    }
  });

  // Lead routes
  app.get("/api/leads", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const formulaId = req.query.formulaId ? parseInt(req.query.formulaId as string) : undefined;
      const leads = formulaId 
        ? await storage.getLeadsByFormulaId(formulaId)
        : await storage.getLeadsByUserId(userId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", optionalAuth, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      
      // Calculate distance-based pricing if enabled and address provided
      let distanceAdjustedPrice = validatedData.calculatedPrice;
      let distanceInfo = null;
      
      if (validatedData.address) {
        try {
          // Get business settings to check if distance pricing is enabled
          const businessSettings = await storage.getBusinessSettings();
          
          if (businessSettings?.enableDistancePricing && businessSettings.businessAddress) {
            console.log(`Distance pricing enabled for single service, calculating for customer address: ${validatedData.address}`);
            
            // Geocode business address if not already done
            let businessLat = businessSettings.businessLatitude;
            let businessLng = businessSettings.businessLongitude;
            
            if (!businessLat || !businessLng) {
              const businessGeocode = await geocodeAddress(businessSettings.businessAddress);
              if (businessGeocode) {
                businessLat = businessGeocode.latitude;
                businessLng = businessGeocode.longitude;
                
                // Update business settings with coordinates
                await storage.updateBusinessSettings(businessSettings.userId, {
                  businessLatitude: businessLat,
                  businessLongitude: businessLng
                });
              }
            }
            
            // Geocode customer address
            const customerGeocode = await geocodeAddress(validatedData.address);
            
            if (businessLat && businessLng && customerGeocode) {
              // Calculate distance in miles
              const distance = calculateDistance(
                businessLat, 
                businessLng,
                customerGeocode.latitude,
                customerGeocode.longitude
              );
              
              console.log(`Single service distance calculated: ${distance.toFixed(2)} miles from business to customer`);
              
              // Check if customer is outside service radius
              const serviceRadius = businessSettings.serviceRadius || 25;
              if (distance > serviceRadius) {
                const excessDistance = distance - serviceRadius;
                const pricingRate = businessSettings.distancePricingRate || 0;
                const pricingType = businessSettings.distancePricingType || 'dollar';
                
                let distanceFee = 0;
                if (pricingType === 'dollar') {
                  // Dollar amount per mile (stored as cents)
                  distanceFee = Math.round((pricingRate / 100) * excessDistance);
                } else {
                  // Percentage of quote per mile (stored as basis points)
                  distanceFee = Math.round(validatedData.calculatedPrice * (pricingRate / 10000) * excessDistance);
                }
                
                distanceAdjustedPrice = validatedData.calculatedPrice + distanceFee;
                distanceInfo = {
                  distance: Math.round(distance * 100) / 100, // Round to 2 decimals
                  serviceRadius,
                  excessDistance: Math.round(excessDistance * 100) / 100,
                  distanceFee,
                  pricingType,
                  pricingRate
                };
                
                console.log(`Single service distance fee applied: $${distanceFee} for ${excessDistance.toFixed(2)} excess miles`);
              } else {
                console.log(`Single service customer within service radius of ${serviceRadius} miles`);
              }
            } else {
              console.log('Could not geocode addresses for single service distance calculation');
            }
          }
        } catch (distanceError) {
          console.error('Error calculating distance pricing for single service:', distanceError);
          // Continue with original pricing if distance calculation fails
        }
      }
      
      // Create lead with adjusted pricing and discount/upsell data
      const leadData = {
        ...validatedData,
        calculatedPrice: distanceAdjustedPrice,
        ipAddress: getClientIpAddress(req),
        ...(distanceInfo && { distanceInfo }),
        ...(validatedData.appliedDiscounts && { appliedDiscounts: validatedData.appliedDiscounts }),
        ...(validatedData.selectedUpsells && { selectedUpsells: validatedData.selectedUpsells })
      };
      
      const lead = await storage.createLead(leadData);
      
      // Create BidRequest and send email notification to account owner
      try {
        // Get formula information for the email
        const formula = await storage.getFormula(lead.formulaId);
        const formulaName = formula?.name || "Unknown Service";
        
        // Determine owner email and ID - prefer current user, then business settings
        let ownerEmail = (req as any).currentUser?.email;
        let businessOwnerId = (req as any).currentUser?.id;
        
        if (!ownerEmail) {
          const businessSettings = await storage.getBusinessSettings();
          ownerEmail = businessSettings?.businessEmail;
          // Get the actual business owner from users table
          if (ownerEmail) {
            const businessOwner = await storage.getUserByEmail(ownerEmail);
            businessOwnerId = businessOwner?.id || businessOwnerId;
          }
        }
        
        console.log(`Lead created - Owner Email: ${ownerEmail}, Business Owner ID: ${businessOwnerId}`);
        
        // Create BidRequest for business owner review
        if (businessOwnerId && businessOwnerId !== "default_owner") {
          const bidRequest = await storage.createBidRequest({
            customerName: lead.name,
            customerEmail: lead.email,
            customerPhone: lead.phone || null,
            businessOwnerId,
            autoPrice: lead.calculatedPrice,
            finalPrice: null,
            address: lead.address || null,
            services: [{
              formulaId: lead.formulaId,
              calculatedPrice: lead.calculatedPrice,
              formulaName,
              variables: lead.variables,
              description: formula?.description || undefined,
              category: undefined,
              appliedDiscounts: lead.appliedDiscounts || [],
              selectedUpsells: lead.selectedUpsells || []
            }],
            bidStatus: "pending",
            magicToken: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            emailOpened: false,
            emailSubject: null,
            emailBody: null,
            pdfText: null
          });
          
          console.log(`BidRequest created with ID: ${bidRequest.id} for business owner: ${businessOwnerId}`);
          
          // Create notification for new lead
          await createNotificationForUser(
            businessOwnerId,
            'new_lead',
            'New Lead Received',
            `${lead.name} submitted a quote request for ${formulaName}`,
            { leadId: lead.id, formulaName, customerName: lead.name, price: lead.calculatedPrice }
          );
        } else {
          console.log(`No valid business owner ID found. Current ID: ${businessOwnerId}`);
        }
        
        // Only send email if we have a valid owner email
        if (ownerEmail) {
          await sendNewLeadNotification(ownerEmail, {
            id: lead.id.toString(),
            customerName: lead.name,
            email: lead.email,
            phone: lead.phone || undefined,
            serviceName: formulaName,
            totalPrice: lead.calculatedPrice, // Keep in cents for proper conversion in email template
            variables: lead.variables,
            calculatedAt: new Date(),
            createdAt: lead.createdAt,
            appliedDiscounts: lead.appliedDiscounts || [],
            selectedUpsells: lead.selectedUpsells || []
          });
          
          console.log(`New lead notification sent to ${ownerEmail}`);
        } else {
          console.log('No owner email found - skipping lead notification');
        }
      } catch (emailError) {
        console.error('Failed to send lead notification email or create BidRequest:', emailError);
        // Don't fail the lead creation if email fails
      }
      
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.delete("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLead(id);
      if (!deleted) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  app.patch("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const { stage } = req.body;
      
      if (!stage || !["open", "booked", "completed", "lost"].includes(stage)) {
        return res.status(400).json({ message: "Invalid stage value" });
      }
      
      const updatedLead = await storage.updateLeadStage(leadId, stage);
      res.json(updatedLead);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lead stage" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const formulas = await storage.getFormulasByUserId(userId);
      const leads = await storage.getLeadsByUserId(userId);
      const multiServiceLeads = await storage.getMultiServiceLeadsByUserId(userId);
      
      // Combine both types of leads for calculations
      const allLeads = [...leads, ...multiServiceLeads];
      
      const now = new Date();
      const thisMonth = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
      });

      // Calculate average quote value from both lead types
      const avgQuoteValue = allLeads.length > 0 
        ? Math.round(allLeads.reduce((sum, lead) => {
            // Regular leads use calculatedPrice, multi-service leads use totalPrice
            const price = ('totalPrice' in lead && lead.totalPrice) ? lead.totalPrice : 
                         ('calculatedPrice' in lead && lead.calculatedPrice) ? lead.calculatedPrice : 0;
            return sum + price;
          }, 0) / allLeads.length)
        : 0;

      // Calculate conversion rate based on leads converted from "open" to "booked"
      const bookedLeads = allLeads.filter(lead => lead.stage === 'booked' || lead.stage === 'completed');
      const conversionRate = allLeads.length > 0 ? 
        parseFloat(((bookedLeads.length / allLeads.length) * 100).toFixed(1)) : 0;

      const stats = {
        totalCalculators: formulas.length,
        leadsThisMonth: thisMonth.length,
        avgQuoteValue,
        conversionRate
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // User management routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users/invite', async (req, res) => {
    try {
      const { email, firstName, lastName, permissions } = req.body;
      
      const employee = await storage.createEmployee({
        id: `emp_${Date.now()}`,
        email,
        firstName,
        lastName,
        ownerId: 'owner_1', // For now, defaulting to owner_1
        organizationName: 'Eco Clean',
        permissions: permissions || {
          canEditFormulas: true,
          canViewLeads: true,
          canManageCalendar: false,
          canAccessDesign: false,
          canViewStats: false,
        }
      });

      res.json(employee);
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ message: "Failed to invite user" });
    }
  });

  app.patch('/api/users/:id', async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const updatedUser = await storage.updateUser(targetUserId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const success = await storage.deleteUser(targetUserId);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Multi-service lead routes
  app.get("/api/multi-service-leads", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const leads = await storage.getMultiServiceLeadsByUserId(userId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch multi-service leads" });
    }
  });

  app.post("/api/multi-service-leads", optionalAuth, async (req, res) => {
    try {
      const validatedData = insertMultiServiceLeadSchema.parse(req.body);
      
      // Calculate distance-based pricing if enabled and address provided
      let distanceAdjustedPrice = validatedData.totalPrice;
      let distanceInfo = null;
      
      if (validatedData.address) {
        try {
          // Get business settings to check if distance pricing is enabled
          const businessSettings = await storage.getBusinessSettings();
          
          if (businessSettings?.enableDistancePricing && businessSettings.businessAddress) {
            console.log(`Distance pricing enabled, calculating for customer address: ${validatedData.address}`);
            
            // Geocode business address if not already done
            let businessLat = businessSettings.businessLatitude;
            let businessLng = businessSettings.businessLongitude;
            
            if (!businessLat || !businessLng) {
              const businessGeocode = await geocodeAddress(businessSettings.businessAddress);
              if (businessGeocode) {
                businessLat = businessGeocode.latitude;
                businessLng = businessGeocode.longitude;
                
                // Update business settings with coordinates
                await storage.updateBusinessSettings(businessSettings.userId, {
                  businessLatitude: businessLat,
                  businessLongitude: businessLng
                });
              }
            }
            
            // Geocode customer address
            const customerGeocode = await geocodeAddress(validatedData.address);
            
            if (businessLat && businessLng && customerGeocode) {
              // Calculate distance in miles
              const distance = calculateDistance(
                businessLat, 
                businessLng,
                customerGeocode.latitude,
                customerGeocode.longitude
              );
              
              console.log(`Distance calculated: ${distance.toFixed(2)} miles from business to customer`);
              
              // Check if customer is outside service radius
              const serviceRadius = businessSettings.serviceRadius || 25;
              if (distance > serviceRadius) {
                const excessDistance = distance - serviceRadius;
                const pricingRate = businessSettings.distancePricingRate || 0;
                const pricingType = businessSettings.distancePricingType || 'dollar';
                
                let distanceFee = 0;
                if (pricingType === 'dollar') {
                  // Dollar amount per mile (stored as cents)
                  distanceFee = Math.round((pricingRate / 100) * excessDistance);
                } else {
                  // Percentage of quote per mile (stored as basis points)
                  distanceFee = Math.round(validatedData.totalPrice * (pricingRate / 10000) * excessDistance);
                }
                
                distanceAdjustedPrice = validatedData.totalPrice + distanceFee;
                distanceInfo = {
                  distance: Math.round(distance * 100) / 100, // Round to 2 decimals
                  serviceRadius,
                  excessDistance: Math.round(excessDistance * 100) / 100,
                  distanceFee,
                  pricingType,
                  pricingRate
                };
                
                console.log(`Distance fee applied: $${distanceFee} for ${excessDistance.toFixed(2)} excess miles`);
              } else {
                console.log(`Customer within service radius of ${serviceRadius} miles`);
              }
            } else {
              console.log('Could not geocode addresses for distance calculation');
            }
          }
        } catch (distanceError) {
          console.error('Error calculating distance pricing:', distanceError);
          // Continue with original pricing if distance calculation fails
        }
      }
      
      // Create lead with adjusted pricing
      const leadData = {
        ...validatedData,
        totalPrice: distanceAdjustedPrice,
        ipAddress: getClientIpAddress(req),
        ...(distanceInfo && { distanceInfo })
      };
      
      const lead = await storage.createMultiServiceLead(leadData);
      
      // Determine owner email and ID - prefer businessOwnerId from payload, then current user, then business settings
      let ownerEmail = (req as any).currentUser?.email;
      let businessOwnerId = validatedData.businessOwnerId || (req as any).currentUser?.id;
      
      // If businessOwnerId provided but no email, get owner from users table
      if (businessOwnerId && !ownerEmail) {
        const businessOwner = await storage.getUserById(businessOwnerId);
        ownerEmail = businessOwner?.email;
      }
      
      // Fallback to business settings if no owner found
      if (!ownerEmail) {
        const businessSettings = await storage.getBusinessSettings();
        ownerEmail = businessSettings?.businessEmail;
        // Get the actual business owner from users table
        if (ownerEmail) {
          const businessOwner = await storage.getUserByEmail(ownerEmail);
          businessOwnerId = businessOwner?.id || businessOwnerId;
        }
      }
      
      // Create BidRequest and send email notification to account owner
      try {
        
        console.log(`Multi-service lead created - Owner Email: ${ownerEmail}, Business Owner ID: ${businessOwnerId}`);
        
        // Create BidRequest for business owner review
        if (businessOwnerId && businessOwnerId !== "default_owner") {
          // Calculate pricing breakdown for bid request
          const serviceSubtotal = lead.services.reduce((sum: number, service: any) => sum + service.calculatedPrice, 0);
          const bundleDiscount = lead.bundleDiscount || lead.bundleDiscountAmount || 0;
          const taxAmount = lead.taxAmount || 0;
          
          const bidRequest = await storage.createBidRequest({
            customerName: lead.name,
            customerEmail: lead.email,
            customerPhone: lead.phone || null,
            businessOwnerId,
            autoPrice: lead.totalPrice,
            finalPrice: null,
            address: lead.address || null,
            services: lead.services.map((service: any) => ({
              formulaId: service.formulaId,
              calculatedPrice: service.calculatedPrice,
              formulaName: service.formulaName,
              variables: service.variables,
              description: undefined,
              category: undefined,
              appliedDiscounts: service.appliedDiscounts || [],
              selectedUpsells: service.selectedUpsells || []
            })),
            appliedDiscounts: lead.appliedDiscounts || [],
            selectedUpsells: lead.selectedUpsells || [],
            bundleDiscount: bundleDiscount,
            taxAmount: taxAmount,
            subtotal: serviceSubtotal,
            bidStatus: "pending",
            magicToken: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            emailOpened: false,
            emailSubject: null,
            emailBody: null,
            pdfText: null,
            multiServiceLeadId: lead.id
          });
          
          console.log(`Multi-service BidRequest created with ID: ${bidRequest.id} for business owner: ${businessOwnerId}`);
          
          // Create notification for new multi-service lead
          const serviceNames = lead.services.map(s => s.formulaName).join(', ');
          await createNotificationForUser(
            businessOwnerId,
            'new_lead',
            'New Multi-Service Lead Received',
            `${lead.name} submitted a quote request for ${lead.services.length} services: ${serviceNames}`,
            { leadId: lead.id, services: lead.services, customerName: lead.name, totalPrice: lead.totalPrice }
          );
        } else {
          console.log(`No valid business owner ID found for multi-service lead. Current ID: ${businessOwnerId}`);
        }
        
        // Only send email if we have a valid owner email
        if (ownerEmail) {
          await sendNewMultiServiceLeadNotification(ownerEmail, {
            id: lead.id.toString(),
            customerName: lead.name,
            email: lead.email,
            phone: lead.phone || undefined,
            services: lead.services.map(service => ({
              name: service.formulaName || 'Service',
              price: service.calculatedPrice, // Keep in cents for proper conversion in email template
              variables: service.variables,
              appliedDiscounts: service.appliedDiscounts || [],
              selectedUpsells: service.selectedUpsells || []
            })),
            totalPrice: lead.totalPrice, // Keep in cents for proper conversion in email template
            subtotal: lead.subtotal,
            taxAmount: lead.taxAmount,
            bundleDiscountAmount: lead.bundleDiscountAmount,
            appliedDiscounts: lead.appliedDiscounts || [],
            selectedUpsells: lead.selectedUpsells || [],
            createdAt: lead.createdAt
          });
          
          console.log(`New multi-service lead notification sent to ${ownerEmail}`);
        } else {
          console.log('No owner email found - skipping multi-service lead notification');
        }

        // Send "Lead submitted" email to customer
        if (lead.email && lead.name) {
          try {
            const businessSettings = await storage.getBusinessSettings();
            const mainService = lead.services[0]?.formulaName || 'Multiple Services';
            
            await sendLeadSubmittedEmail(lead.email, lead.name, {
              service: `${lead.services.length} Services (${mainService}${lead.services.length > 1 ? ' + more' : ''})`,
              price: lead.totalPrice,
              services: lead.services.map(service => ({
                name: service.formulaName || 'Service',
                price: service.calculatedPrice
              })),
              businessName: businessSettings?.businessName,
              businessPhone: businessSettings?.businessPhone || '',
              estimatedTimeframe: "2-3 business days",
              leadId: lead.id.toString(),
              businessOwnerId: businessOwnerId
            });
            console.log(`Lead submitted email sent to customer: ${lead.email}`);
          } catch (error) {
            console.error('Failed to send lead submitted email:', error);
          }
        }
      } catch (emailError) {
        console.error('Failed to send multi-service lead notification email:', emailError);
        // Don't fail the lead creation if email fails
      }

      // Trigger Zapier webhook for new lead
      try {
        if (businessOwnerId && businessOwnerId !== "default_owner") {
          const zapierLeadData = {
            id: lead.id.toString(),
            name: lead.name,
            email: lead.email,
            phone: lead.phone || null,
            address: lead.address || null,
            notes: lead.notes || null,
            howDidYouHear: lead.howDidYouHear || null,
            totalPrice: lead.totalPrice / 100, // Convert from cents to dollars for Zapier
            status: 'new',
            createdAt: lead.createdAt.toISOString(),
            source: 'Calculator Form',
            services: lead.services.map(service => ({
              formulaId: service.formulaId,
              formulaName: service.formulaName,
              calculatedPrice: service.calculatedPrice / 100, // Convert from cents to dollars
              variables: service.variables
            })),
            appliedDiscounts: lead.appliedDiscounts || [],
            selectedUpsells: lead.selectedUpsells || [],
            bundleDiscountAmount: (lead.bundleDiscountAmount || 0) / 100, // Convert from cents to dollars
            subtotal: (lead.subtotal || 0) / 100, // Convert from cents to dollars
            taxAmount: (lead.taxAmount || 0) / 100 // Convert from cents to dollars
          };

          await ZapierIntegrationService.sendWebhookNotification(
            businessOwnerId,
            'new_lead',
            zapierLeadData
          );
          
          console.log(`Zapier webhook triggered for new multi-service lead: ${lead.id}`);
        }
      } catch (zapierError) {
        console.error('Failed to send Zapier webhook notification:', zapierError);
        // Don't fail the lead creation if webhook fails
      }

      // Save photo measurements if provided
      try {
        console.log('Photo measurements check:', {
          exists: !!req.body.photoMeasurements,
          isArray: Array.isArray(req.body.photoMeasurements),
          length: req.body.photoMeasurements?.length || 0
        });
        
        if (req.body.photoMeasurements && Array.isArray(req.body.photoMeasurements) && req.body.photoMeasurements.length > 0) {
          // Enforce strict limits to prevent DoS
          const MAX_MEASUREMENTS = 5; // Reduced from 10
          const MAX_IMAGES_PER_MEASUREMENT = 3; // Reduced from 5
          const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB per image (reduced from 5MB)
          const MAX_TOTAL_PAYLOAD_BYTES = 15 * 1024 * 1024; // 15MB total across all measurements

          if (req.body.photoMeasurements.length > MAX_MEASUREMENTS) {
            console.warn(`Rejecting ${req.body.photoMeasurements.length} photo measurements - exceeds limit of ${MAX_MEASUREMENTS}`);
            throw new Error(`Too many photo measurements - maximum ${MAX_MEASUREMENTS} allowed`);
          }

          // Track total payload size
          let totalPayloadSize = 0;

          for (const measurement of req.body.photoMeasurements) {
            console.log('Processing measurement:', {
              hasEstimatedValue: !!measurement.estimatedValue,
              estimatedValueType: typeof measurement.estimatedValue,
              estimatedValue: measurement.estimatedValue,
              hasCustomerImages: !!measurement.customerImageUrls,
              imageCount: measurement.customerImageUrls?.length
            });
            
            // Validate and sanitize image URLs
            if (!measurement.customerImageUrls || !Array.isArray(measurement.customerImageUrls)) {
              console.warn('Skipping photo measurement with invalid image URLs');
              continue;
            }

            // Limit number of images
            const imageUrls = measurement.customerImageUrls.slice(0, MAX_IMAGES_PER_MEASUREMENT);
            
            // Validate each image
            const validatedUrls = [];
            for (const url of imageUrls) {
              if (typeof url !== 'string') {
                console.warn('Skipping non-string image URL');
                continue;
              }

              // Check if it's a data URI (base64)
              if (url.startsWith('data:image/')) {
                // Estimate base64 size (rough calculation: base64 is ~33% larger than binary)
                const base64Data = url.split(',')[1];
                if (!base64Data) {
                  console.warn('Skipping invalid base64 data URI');
                  continue;
                }

                const estimatedSize = base64Data.length * 0.75;
                
                // Check individual image size
                if (estimatedSize > MAX_IMAGE_SIZE_BYTES) {
                  console.warn(`Skipping oversized image - estimated ${Math.round(estimatedSize / 1024 / 1024)}MB exceeds ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB limit`);
                  continue;
                }

                // Check cumulative size
                if (totalPayloadSize + estimatedSize > MAX_TOTAL_PAYLOAD_BYTES) {
                  console.warn(`Rejecting additional images - would exceed total payload limit of ${MAX_TOTAL_PAYLOAD_BYTES / 1024 / 1024}MB`);
                  throw new Error(`Total image payload exceeds maximum allowed size of ${MAX_TOTAL_PAYLOAD_BYTES / 1024 / 1024}MB`);
                }

                totalPayloadSize += estimatedSize;
                validatedUrls.push(url);
              } else if (url.startsWith('http://') || url.startsWith('https://')) {
                // Allow HTTP/HTTPS URLs (e.g., from object storage) but validate length
                const MAX_URL_LENGTH = 2048; // 2KB max for URLs
                if (url.length > MAX_URL_LENGTH) {
                  console.warn(`Skipping oversized URL - ${url.length} characters exceeds ${MAX_URL_LENGTH} limit`);
                  continue;
                }
                validatedUrls.push(url);
              } else {
                console.warn('Skipping invalid image URL format');
              }
            }

            if (validatedUrls.length === 0) {
              console.warn('Skipping photo measurement with no valid images');
              continue;
            }

            const tags = [measurement.formulaName || 'Unknown Service'].filter(Boolean);
            
            // Convert estimatedValue to number, default to 0 if invalid
            const estimatedValue = Number(measurement.estimatedValue);
            const safeEstimatedValue = Number.isFinite(estimatedValue) ? Math.round(estimatedValue * 100) : 0;
            
            // Save image with measurement data (use defaults for missing fields)
            await storage.createPhotoMeasurement({
              leadId: lead.id,
              userId: businessOwnerId || (req as any).currentUser?.id,
              formulaName: measurement.formulaName || null,
              setupConfig: measurement.setupConfig || {},
              customerImageUrls: validatedUrls,
              estimatedValue: safeEstimatedValue,
              estimatedUnit: measurement.estimatedUnit || 'sq ft',
              confidence: Number(measurement.confidence) || 0,
              explanation: measurement.explanation || 'Image uploaded',
              warnings: measurement.warnings || [],
              tags
            });
          }
          console.log(`Saved ${req.body.photoMeasurements.length} photo measurement(s) for lead ${lead.id}`);
        }
      } catch (photoMeasurementError) {
        console.error('Failed to save photo measurements:', photoMeasurementError);
        // Don't fail the lead creation if photo measurement save fails
      }
      
      // Convert BigInt fields to numbers for JSON serialization
      const serializedLead = {
        ...lead,
        totalPrice: Number(lead.totalPrice),
        subtotal: lead.subtotal ? Number(lead.subtotal) : null,
        taxAmount: lead.taxAmount ? Number(lead.taxAmount) : null,
        bundleDiscountAmount: lead.bundleDiscountAmount ? Number(lead.bundleDiscountAmount) : null,
        distanceFee: lead.distanceFee ? Number(lead.distanceFee) : null,
        services: lead.services.map(service => ({
          ...service,
          calculatedPrice: Number(service.calculatedPrice)
        }))
      };
      
      res.status(201).json(serializedLead);
    } catch (error) {
      console.error('Multi-service lead creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid multi-service lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create multi-service lead" });
    }
  });

  app.patch("/api/multi-service-leads/:id", requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const { stage } = req.body;
      
      if (!stage || !["open", "booked", "completed", "lost"].includes(stage)) {
        return res.status(400).json({ message: "Invalid stage value" });
      }
      
      const updatedLead = await storage.updateMultiServiceLeadStage(leadId, stage);
      res.json(updatedLead);
    } catch (error) {
      res.status(500).json({ message: "Failed to update multi-service lead stage" });
    }
  });

  app.delete("/api/multi-service-leads/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMultiServiceLead(id);
      if (!deleted) {
        return res.status(404).json({ message: "Multi-service lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete multi-service lead" });
    }
  });

  // Business settings routes
  app.get("/api/business-settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      let settings = await storage.getBusinessSettingsByUserId(userId);
      
      // If no settings exist, create default ones
      if (!settings) {
        const defaultSettings = {
          userId,
          businessName: '',
          businessEmail: '',
          businessPhone: '',
          businessAddress: '',
          businessDescription: '',
          styling: {
            theme: 'modern',
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981',
            accentColor: '#F59E0B',
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937',
            fontFamily: 'Inter',
            borderRadius: 8,
            cardStyle: 'elevated',
            buttonStyle: 'rounded',
            inputStyle: 'outlined',
            maxImages: 5,
            maxImageSize: 10,
            enableSalesTax: false,
            salesTaxRate: 8.25,
            salesTaxLabel: 'Sales Tax',
            enableDisclaimer: true,
            disclaimerText: 'Prices are estimates and may vary based on specific requirements. Final pricing will be confirmed after consultation.',
            showBundleDiscount: false,
            bundleDiscountPercent: 10,
            requireContactFirst: false,
            showProgressGuide: true,
            enableBooking: true,
            requireName: true,
            nameLabel: 'Full Name',
            requireEmail: true,
            emailLabel: 'Email Address',
            enablePhone: true,
            requirePhone: false,
            phoneLabel: 'Phone Number',
            enableAddress: false,
            requireAddress: false,
            addressLabel: 'Address',
            enableNotes: false,
            notesLabel: 'Additional Notes',
            enableHowDidYouHear: false,
            requireHowDidYouHear: false,
            howDidYouHearLabel: 'How did you hear about us?',
            howDidYouHearOptions: ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other'],
            enableImageUpload: false,
            requireImageUpload: false,
            imageUploadLabel: 'Upload Images',
            imageUploadDescription: 'Please upload relevant images to help us provide an accurate quote',
            imageUploadHelperText: 'Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.',
            enableCustomButton: false,
            customButtonText: 'Contact Us',
            customButtonUrl: ''
          },
          enableBooking: true,
          serviceRadius: 25,
          enableDistancePricing: false,
          distancePricingType: 'dollar',
          distancePricingRate: 0,
          discounts: [],
          allowDiscountStacking: false,
          guideVideos: {}
        };
        
        settings = await storage.createBusinessSettings(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching/creating business settings:', error);
      res.status(500).json({ message: "Failed to fetch business settings" });
    }
  });

  app.post("/api/business-settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const validatedData = insertBusinessSettingsSchema.parse(req.body);
      const settingsWithUser = { ...validatedData, userId };
      const settings = await storage.createBusinessSettings(settingsWithUser);
      res.status(201).json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid business settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create business settings" });
    }
  });

  app.patch("/api/business-settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      console.log('Business settings update request body (no ID):', JSON.stringify(req.body, null, 2));
      
      // Get the user's existing business settings to find the correct ID
      let existingSettings = await storage.getBusinessSettingsByUserId(userId);
      
      // If no settings exist, create default ones first
      if (!existingSettings) {
        const defaultSettings = {
          userId,
          businessName: '',
          businessEmail: '',
          businessPhone: '',
          businessAddress: '',
          businessDescription: '',
          styling: {
            theme: 'modern',
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981',
            accentColor: '#F59E0B',
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937',
            fontFamily: 'Inter',
            borderRadius: 8,
            cardStyle: 'elevated',
            buttonStyle: 'rounded',
            inputStyle: 'outlined',
            maxImages: 5,
            maxImageSize: 10,
            enableSalesTax: false,
            salesTaxRate: 8.25,
            salesTaxLabel: 'Sales Tax',
            enableDisclaimer: true,
            disclaimerText: 'Prices are estimates and may vary based on specific requirements. Final pricing will be confirmed after consultation.',
            showBundleDiscount: false,
            bundleDiscountPercent: 10,
            requireContactFirst: false,
            showProgressGuide: true,
            enableBooking: true,
            requireName: true,
            nameLabel: 'Full Name',
            requireEmail: true,
            emailLabel: 'Email Address',
            enablePhone: true,
            requirePhone: false,
            phoneLabel: 'Phone Number',
            enableAddress: false,
            requireAddress: false,
            addressLabel: 'Address',
            enableNotes: false,
            notesLabel: 'Additional Notes',
            enableHowDidYouHear: false,
            requireHowDidYouHear: false,
            howDidYouHearLabel: 'How did you hear about us?',
            howDidYouHearOptions: ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other'],
            enableImageUpload: false,
            requireImageUpload: false,
            imageUploadLabel: 'Upload Images',
            imageUploadDescription: 'Please upload relevant images to help us provide an accurate quote',
            imageUploadHelperText: 'Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.',
            enableCustomButton: false,
            customButtonText: 'Contact Us',
            customButtonUrl: ''
          },
          enableBooking: true,
          serviceRadius: 25,
          enableDistancePricing: false,
          distancePricingType: 'dollar',
          distancePricingRate: 0,
          discounts: [],
          allowDiscountStacking: false,
          guideVideos: {}
        };
        
        existingSettings = await storage.createBusinessSettings(defaultSettings);
      }
      
      // For stripeConfig, we don't need complex validation since it's just a JSON object
      const validatedData: any = {};
      
      // Copy over allowed fields
      const allowedFields = [
        'businessName', 'businessEmail', 'businessPhone', 'businessAddress', 'businessDescription',
        'contactFirstToggle', 'bundleDiscount', 'salesTax', 'salesTaxLabel', 'styling',
        'serviceSelectionTitle', 'serviceSelectionSubtitle', 'enableBooking', 'stripeConfig',
        'enableDistancePricing', 'distancePricingType', 'distancePricingRate', 'enableLeadCapture',
        'discounts', 'allowDiscountStacking', 'serviceRadius', 'guideVideos'
      ];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          validatedData[field] = req.body[field];
        }
      }

      const settings = await storage.updateBusinessSettings(existingSettings.id, validatedData);
      if (!settings) {
        return res.status(404).json({ message: "Business settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error('Business settings validation error (no ID):', error);
      res.status(500).json({ message: "Failed to update business settings" });
    }
  });

  app.patch("/api/business-settings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Business settings update request body:', JSON.stringify(req.body, null, 2));
      
      // Allow all necessary fields for business settings including discounts and sales tax
      const allowedFields = [
        'businessName', 'businessEmail', 'businessPhone', 'businessAddress', 'businessDescription',
        'contactFirstToggle', 'bundleDiscount', 'salesTax', 'salesTaxLabel', 'styling',
        'serviceSelectionTitle', 'serviceSelectionSubtitle', 'enableBooking', 'stripeConfig',
        'enableDistancePricing', 'distancePricingType', 'distancePricingRate', 'enableLeadCapture',
        'discounts', 'allowDiscountStacking', 'serviceRadius', 'guideVideos'
      ];
      const cleanData: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          cleanData[field] = req.body[field];
        }
      }
      
      console.log('Clean data to update:', JSON.stringify(cleanData, null, 2));
      
      const settings = await storage.updateBusinessSettings(id, cleanData);
      if (!settings) {
        return res.status(404).json({ message: "Business settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error('Business settings update error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid business settings data", errors: error.errors });
      }
      res.status(500).json({ 
        message: "Failed to update business settings", 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: JSON.stringify(error, null, 2)
      });
    }
  });

  // Calendar/Availability routes
  app.get("/api/availability-slots", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, date } = req.query;
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (date) {
        const slots = await storage.getUserAvailabilitySlotsByDate(userId, date as string);
        res.json(slots);
      } else if (startDate && endDate) {
        const slots = await storage.getUserAvailableSlotsByDateRange(userId, startDate as string, endDate as string);
        res.json(slots);
      } else {
        res.status(400).json({ message: "Please provide either 'date' or both 'startDate' and 'endDate' parameters" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability slots" });
    }
  });

  app.post("/api/availability-slots", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const validatedData = insertAvailabilitySlotSchema.parse({
        ...req.body,
        userId
      });
      const slot = await storage.createAvailabilitySlot(validatedData);
      
      // Send booking confirmation emails if this is a booked slot
      if (slot.isBooked && slot.bookedBy) {
        try {
          // Get lead information for customer and business owner emails
          // Note: For now, we'll skip lead lookup since the booking system doesn't directly link to leads
          const lead = null;
          const multiServiceLead = null;
          
          if (lead || multiServiceLead) {
            const customerInfo = lead || multiServiceLead;
            const bookingDetails = {
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              service: lead ? lead.serviceName || 'Service Appointment' : 'Multi-Service Appointment',
              price: lead ? lead.calculatedPrice : (multiServiceLead?.totalPrice || 0)
            };

            // Get business owner email
            let ownerEmail: string | null = null;
            const businessSettings = await storage.getBusinessSettings();
            ownerEmail = businessSettings?.businessEmail || null;

            // Send confirmation email to customer
            if (customerInfo?.email) {
              await sendCustomerBookingConfirmationEmail(
                customerInfo.email,
                customerInfo.name,
                {
                  service: bookingDetails.service || 'Service Appointment',
                  appointmentDate: new Date(bookingDetails.date),
                  appointmentTime: bookingDetails.startTime,
                  businessName: businessSettings?.businessName,
                  businessPhone: businessSettings?.businessPhone || '',
                  businessEmail: businessSettings?.businessEmail,
                  address: slot.notes || '',
                  notes: customerInfo.notes,
                  businessOwnerId: userId
                }
              );
              console.log(`Booking confirmation email sent to customer: ${customerInfo.email}`);
            }

            // Send notification email to business owner
            if (ownerEmail && customerInfo) {
              await sendNewBookingNotification(ownerEmail, {
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                customerPhone: customerInfo.phone || undefined,
                bookingDetails,
                leadId: slot.bookedBy
              });
              console.log(`New booking notification sent to owner: ${ownerEmail}`);
            }
          }
        } catch (emailError) {
          console.error('Failed to send booking confirmation emails:', emailError);
          // Don't fail the booking creation if email fails
        }
      }
      
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid availability slot data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create availability slot" });
    }
  });

  app.patch("/api/availability-slots/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const validatedData = insertAvailabilitySlotSchema.partial().parse(req.body);
      const slot = await storage.updateUserAvailabilitySlot(userId, id, validatedData);
      if (!slot) {
        return res.status(404).json({ message: "Availability slot not found" });
      }
      res.json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid availability slot data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update availability slot" });
    }
  });

  app.delete("/api/availability-slots/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const success = await storage.deleteUserAvailabilitySlot(userId, id);
      if (!success) {
        return res.status(404).json({ message: "Availability slot not found" });
      }
      res.json({ message: "Availability slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete availability slot" });
    }
  });

  app.post("/api/availability-slots/:id/book", requireAuth, async (req, res) => {
    try {
      const slotId = parseInt(req.params.id);
      const { leadId, slotData } = req.body;
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (!leadId) {
        return res.status(400).json({ message: "Lead ID is required" });
      }
      
      // Ensure slotData includes userId for security
      const secureSlotData = slotData ? { ...slotData, userId } : undefined;
      
      const bookedSlot = await storage.bookSlot(slotId, leadId, secureSlotData);
      if (!bookedSlot) {
        return res.status(404).json({ message: "Availability slot not found or could not be created" });
      }
      res.json(bookedSlot);
    } catch (error) {
      res.status(500).json({ message: "Failed to book slot" });
    }
  });

  // Remove duplicate route - handled above

  app.get("/api/availability-slots/:startDate/:endDate", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const slots = await storage.getUserSlotsByDateRange(userId, startDate, endDate);
      res.json(slots || []);
    } catch (error) {
      console.error("Error fetching availability slots for date range:", error);
      res.status(500).json({ message: "Failed to fetch availability slots for date range" });
    }
  });

  // Public booking availability routes (for customer forms)
  app.get("/api/public/recurring-availability/:businessOwnerId", async (req, res) => {
    try {
      const businessOwnerId = req.params.businessOwnerId;
      
      if (!businessOwnerId) {
        return res.status(400).json({ message: "Business owner ID required" });
      }
      
      const recurring = await storage.getUserRecurringAvailability(businessOwnerId);
      res.json(recurring || []);
    } catch (error) {
      console.error("Error fetching public recurring availability:", error);
      res.status(500).json({ message: "Failed to fetch recurring availability" });
    }
  });

  app.get("/api/public/availability-slots/:businessOwnerId", async (req, res) => {
    try {
      const businessOwnerId = req.params.businessOwnerId;
      const { date, startDate, endDate } = req.query;
      
      if (!businessOwnerId) {
        return res.status(400).json({ message: "Business owner ID required" });
      }
      
      let slots;
      if (startDate && endDate) {
        slots = await storage.getUserSlotsByDateRange(businessOwnerId, startDate as string, endDate as string);
      } else if (date) {
        slots = await storage.getUserSlotsByDate(businessOwnerId, date as string);
      } else {
        return res.status(400).json({ message: "Date or date range required" });
      }
      
      const user = await storage.getUserById(businessOwnerId);
      if (user?.googleCalendarConnected) {
        try {
          const calendarStartDate = date || startDate;
          const calendarEndDate = date || endDate;
          
          if (calendarStartDate && calendarEndDate) {
            const busyTimes = await getGoogleCalendarBusyTimes(businessOwnerId, calendarStartDate as string, calendarEndDate as string);
            
            const filteredSlots = (slots || []).filter((slot: any) => {
              const slotStart = new Date(`${slot.date}T${slot.startTime}`);
              const slotEnd = new Date(`${slot.date}T${slot.endTime}`);
              
              const isConflicting = busyTimes.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                
                return (slotStart < busyEnd && slotEnd > busyStart);
              });
              
              return !isConflicting;
            });
            
            return res.json(filteredSlots);
          }
        } catch (error) {
          console.error("Error filtering Google Calendar busy times:", error);
        }
      }
      
      res.json(slots || []);
    } catch (error) {
      console.error("Error fetching public availability slots:", error);
      res.status(500).json({ message: "Failed to fetch availability slots" });
    }
  });

  app.post("/api/public/availability-slots/:businessOwnerId/book", async (req, res) => {
    try {
      const businessOwnerId = req.params.businessOwnerId;
      const { date, startTime, endTime, leadId, title, notes, customerName, customerEmail, customerPhone } = req.body;
      
      console.log('📅 Booking request received with title:', title);
      console.log('📅 Full booking request body:', JSON.stringify(req.body, null, 2));
      
      if (!businessOwnerId) {
        return res.status(400).json({ message: "Business owner ID required" });
      }
      
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ message: "Date, start time, and end time are required" });
      }
      
      // Use customer information for the appointment title and notes
      const appointmentTitle = customerName 
        ? `${title || 'Customer Appointment'} - ${customerName}`
        : title || 'Customer Appointment';
      
      const appointmentNotes = [
        notes || 'Booked via customer form',
        customerName ? `Customer: ${customerName}` : '',
        customerEmail ? `Email: ${customerEmail}` : '',
        customerPhone ? `Phone: ${customerPhone}` : ''
      ].filter(Boolean).join('\n');

      // Create a new booked slot
      const slotData = {
        userId: businessOwnerId,
        date,
        startTime,
        endTime,
        title: appointmentTitle,
        isBooked: true,
        bookedBy: leadId || null,
        notes: appointmentNotes
      };
      
      const bookedSlot = await storage.createAvailabilitySlot(slotData);
      
      // Send booking notification email to business owner
      try {
        // Get business owner information
        const businessOwner = await storage.getUserById(businessOwnerId);
        const businessSettings = await storage.getBusinessSettingsByUserId(businessOwnerId);
        
        if (businessOwner && businessOwner.email) {
          // Use customer information passed directly, fallback to lead info if needed
          let finalCustomerName = customerName;
          let finalCustomerEmail = customerEmail; 
          let finalCustomerPhone = customerPhone;
          
          // If customer info not provided directly, try to get from lead
          if (!finalCustomerName && leadId) {
            const leadInfo = await storage.getMultiServiceLead(leadId);
            if (leadInfo) {
              finalCustomerName = leadInfo.name;
              finalCustomerEmail = leadInfo.email;
              finalCustomerPhone = leadInfo.phone;
            }
          }
          
          // Send booking notification email to business owner
          const { sendBookingNotificationEmail } = await import('./email-providers.js');
          await sendBookingNotificationEmail({
            businessOwnerEmail: businessOwner.email,
            businessName: businessSettings?.businessName || 'Your Business',
            customerName: finalCustomerName || 'Customer',
            customerEmail: finalCustomerEmail || '',
            customerPhone: finalCustomerPhone || '',
            appointmentDate: date,
            appointmentTime: `${startTime} - ${endTime}`,
            serviceDetails: title || 'Service Appointment',
            notes: notes || 'Booked via customer form'
          });
          
          // Send confirmation email to customer
          if (finalCustomerEmail) {
            console.log('📧 Sending booking confirmation email with service:', title || 'Service Appointment');
            console.log('📧 Business Owner ID for template lookup:', businessOwnerId);
            console.log('📧 Business settings:', { 
              businessName: businessSettings?.businessName,
              businessPhone: businessSettings?.businessPhone,
              businessEmail: businessOwner.email
            });
            await sendCustomerBookingConfirmationEmail(
              finalCustomerEmail,
              finalCustomerName || 'Customer',
              {
                service: title || 'Service Appointment',
                appointmentDate: new Date(date),
                appointmentTime: `${startTime} - ${endTime}`,
                businessName: businessSettings?.businessName || 'Your Business',
                businessPhone: businessSettings?.businessPhone || '',
                businessEmail: businessOwner.email,
                address: businessSettings?.businessAddress || '',
                notes: notes || '',
                businessOwnerId: businessOwnerId
              }
            );
          }
        }
      } catch (emailError) {
        console.error("Error sending booking notification email:", emailError);
        // Don't fail the booking if email fails
      }
      
      res.json(bookedSlot);
    } catch (error) {
      console.error("Error booking slot:", error);
      res.status(500).json({ message: "Failed to book slot" });
    }
  });

  // Recurring availability routes (authenticated)
  app.get("/api/recurring-availability", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const recurring = await storage.getUserRecurringAvailability(userId);
      res.json(recurring || []);
    } catch (error) {
      console.error("Error fetching recurring availability:", error);
      res.status(500).json({ message: "Failed to fetch recurring availability" });
    }
  });

  app.post("/api/recurring-availability", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const validatedData = insertRecurringAvailabilitySchema.parse({
        ...req.body,
        userId
      });
      const recurring = await storage.createRecurringAvailability(validatedData);
      res.status(201).json(recurring);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recurring availability data", errors: error.errors });
      }
      console.error("Error creating recurring availability:", error);
      res.status(500).json({ message: "Failed to create recurring availability" });
    }
  });

  app.patch("/api/recurring-availability/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      const validatedData = insertRecurringAvailabilitySchema.partial().parse(req.body);
      const recurring = await storage.updateUserRecurringAvailability(userId, id, validatedData);
      if (!recurring) {
        return res.status(404).json({ message: "Recurring availability not found" });
      }
      res.json(recurring);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recurring availability data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update recurring availability" });
    }
  });

  app.delete("/api/recurring-availability/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      const success = await storage.deleteUserRecurringAvailability(userId, id);
      if (!success) {
        return res.status(404).json({ message: "Recurring availability not found" });
      }
      res.json({ message: "Recurring availability deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recurring availability" });
    }
  });

  app.delete("/api/recurring-availability/all", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const success = await storage.clearUserRecurringAvailability(userId);
      res.json({ message: "All recurring availability cleared successfully", cleared: success });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear recurring availability" });
    }
  });

  app.post("/api/recurring-availability/save-schedule", requireAuth, async (req, res) => {
    try {
      const { schedule } = req.body;
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (!schedule || typeof schedule !== 'object') {
        return res.status(400).json({ message: "Schedule object is required" });
      }
      
      const savedRecords = await storage.saveUserWeeklySchedule(userId, schedule);
      res.json(savedRecords);
    } catch (error) {
      console.error("Error saving weekly schedule:", error);
      res.status(500).json({ message: "Failed to save weekly schedule" });
    }
  });

  // Google Calendar OAuth routes
  app.get("/api/google-calendar/status", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const isConnected = await checkUserGoogleCalendarConnection(userId);
      res.json({ connected: isConnected });
    } catch (error) {
      console.error("Error checking Google Calendar connection:", error);
      res.json({ connected: false });
    }
  });

  app.get("/api/google-calendar/connect", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host');
      const redirectUri = `${protocol}://${host}/api/google-calendar/callback`;
      
      const authUrl = getGoogleOAuthUrl(userId, redirectUri);
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating Google Calendar OAuth:", error);
      res.status(500).json({ message: "Failed to initiate Google Calendar connection" });
    }
  });

  app.get("/api/google-calendar/callback", requireAuth, async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).send('Missing code or state parameter');
      }

      const authenticatedUserId = (req as any).currentUser?.id;
      const stateUserId = state as string;
      
      if (authenticatedUserId !== stateUserId) {
        console.error("OAuth state mismatch: authenticated user does not match state parameter");
        return res.redirect('/calendar?error=invalid_state');
      }

      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host');
      const redirectUri = `${protocol}://${host}/api/google-calendar/callback`;
      
      const tokens = await exchangeCodeForTokens(code as string, redirectUri);
      
      await storage.updateUser(authenticatedUserId, {
        googleCalendarConnected: true,
        googleAccessToken: tokens.accessToken,
        googleRefreshToken: tokens.refreshToken || null,
        googleTokenExpiry: tokens.expiry
      });
      
      res.redirect('/calendar?connected=true');
    } catch (error) {
      console.error("Error in Google Calendar OAuth callback:", error);
      res.redirect('/calendar?error=connection_failed');
    }
  });

  app.post("/api/google-calendar/disconnect", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await storage.updateUser(userId, { 
        googleCalendarConnected: false,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarConnectionId: null
      });
      
      res.json({ success: true, connected: false });
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      res.status(500).json({ message: "Failed to disconnect Google Calendar" });
    }
  });

  app.get("/api/google-calendar/events", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      const { startDate, endDate } = req.query;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const events = await getGoogleCalendarEvents(userId, startDate as string, endDate as string);
      res.json(events);
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events", events: [] });
    }
  });

  app.get("/api/google-calendar/calendars", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const calendars = await getAvailableCalendars(userId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching available calendars:", error);
      res.status(500).json({ message: "Failed to fetch available calendars", calendars: [] });
    }
  });

  app.post("/api/google-calendar/selected-calendars", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      const { calendarIds } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!Array.isArray(calendarIds)) {
        return res.status(400).json({ message: "Calendar IDs must be an array" });
      }

      await storage.updateUser(userId, { 
        selectedCalendarIds: calendarIds 
      });
      
      res.json({ success: true, selectedCalendarIds: calendarIds });
    } catch (error) {
      console.error("Error saving selected calendars:", error);
      res.status(500).json({ message: "Failed to save selected calendars" });
    }
  });

  app.get("/api/blocked-dates", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      const { startDate, endDate } = req.query;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Validate query parameters if provided
      if (startDate && typeof startDate !== 'string') {
        return res.status(400).json({ message: "Invalid startDate parameter" });
      }
      if (endDate && typeof endDate !== 'string') {
        return res.status(400).json({ message: "Invalid endDate parameter" });
      }
      
      // Validate date format if provided
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({ message: "Invalid startDate format. Use YYYY-MM-DD" });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({ message: "Invalid endDate format. Use YYYY-MM-DD" });
      }
      
      // Validate date range
      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ message: "Start date must be before or equal to end date" });
      }
      
      let blockedDates;
      if (startDate && endDate) {
        blockedDates = await storage.getUserBlockedDatesByRange(userId, startDate as string, endDate as string);
      } else {
        blockedDates = await storage.getUserBlockedDates(userId);
      }
      
      res.json(blockedDates);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      res.status(500).json({ message: "Failed to fetch blocked dates" });
    }
  });

  app.post("/api/blocked-dates", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Validate with Zod schema
      const validation = insertBlockedDateSchema.extend({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD")
      }).refine(
        (data) => data.startDate <= data.endDate,
        { message: "Start date must be before or equal to end date" }
      ).safeParse({ ...req.body, userId });
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }
      
      const blockedDate = await storage.createBlockedDate(validation.data);
      res.json(blockedDate);
    } catch (error) {
      console.error("Error creating blocked date:", error);
      res.status(500).json({ message: "Failed to create blocked date" });
    }
  });

  app.delete("/api/blocked-dates/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      const id = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const success = await storage.deleteBlockedDate(userId, id);
      if (!success) {
        return res.status(404).json({ message: "Blocked date not found" });
      }
      
      res.json({ message: "Blocked date deleted successfully" });
    } catch (error) {
      console.error("Error deleting blocked date:", error);
      res.status(500).json({ message: "Failed to delete blocked date" });
    }
  });

  // Proposal routes
  app.get("/api/proposals", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const proposal = await storage.getUserProposal(userId);
      res.json(proposal);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  app.post("/api/proposals", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const proposalData = { ...req.body, userId };
      const proposal = await storage.createProposal(proposalData);
      res.json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  app.patch("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const updatedProposal = await storage.updateUserProposal(userId, id, req.body);
      if (updatedProposal) {
        res.json(updatedProposal);
      } else {
        res.status(404).json({ message: "Proposal not found" });
      }
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  app.delete("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const deleted = await storage.deleteUserProposal(userId, id);
      if (deleted) {
        res.json({ message: "Proposal deleted successfully" });
      } else {
        res.status(404).json({ message: "Proposal not found" });
      }
    } catch (error) {
      console.error("Error deleting proposal:", error);
      res.status(500).json({ message: "Failed to delete proposal" });
    }
  });

  // Public API routes for proposal viewing (no authentication required)
  app.get("/api/multi-service-leads/:leadId", async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const lead = await storage.getMultiServiceLeadById(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.get("/api/proposals/public/:businessOwnerId", async (req, res) => {
    try {
      const { businessOwnerId } = req.params;
      const proposal = await storage.getUserProposal(businessOwnerId);
      
      if (!proposal) {
        return res.json(null); // Return null if no proposal template exists
      }
      
      res.json(proposal);
    } catch (error) {
      console.error("Error fetching public proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  app.get("/api/public/business-settings/:businessOwnerId", async (req, res) => {
    try {
      const { businessOwnerId } = req.params;
      const settings = await storage.getBusinessSettingsByUserId(businessOwnerId);
      
      if (!settings) {
        return res.status(404).json({ message: "Business settings not found" });
      }
      
      // Only return basic business info for public access
      const publicSettings = {
        businessName: settings.businessName,
        businessPhone: settings.businessPhone,
        businessEmail: settings.businessEmail,
        businessAddress: settings.businessAddress,
        enableBooking: settings.enableBooking
      };
      
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching public business settings:", error);
      res.status(500).json({ message: "Failed to fetch business settings" });
    }
  });

  // Website routes
  app.get("/api/websites", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      
      if (!dudaApi.isConfigured()) {
        return res.status(400).json({ 
          message: "Duda API not configured. Please provide DUDA_API_KEY and DUDA_API_PASSWORD." 
        });
      }

      // Get websites from our database for this user
      const localWebsites = await storage.getWebsitesByUserId(userId);
      
      // For each local website, get updated info from Duda API
      const websitesWithUpdates = [];
      for (const localSite of localWebsites) {
        try {
          const dudaData = await dudaApi.getWebsite(localSite.siteName);
          websitesWithUpdates.push({
            ...localSite,
            site_name: localSite.siteName,
            account_name: localSite.accountName,
            site_domain: localSite.siteDomain || dudaData.site_default_domain,
            preview_url: localSite.previewUrl || dudaData.preview_site_url,
            edit_url: dudaData.edit_site_url,
            last_published: localSite.lastPublished || dudaData.modification_date,
            created_date: localSite.createdDate.toISOString(),
            status: localSite.status,
            publish_status: dudaData.publish_status,
            canonical_url: dudaData.canonical_url
          });
        } catch (error) {
          // If we can't get data from Duda, just use local data
          websitesWithUpdates.push({
            site_name: localSite.siteName,
            account_name: localSite.accountName,
            site_domain: localSite.siteDomain || '',
            preview_url: localSite.previewUrl || '',
            last_published: localSite.lastPublished?.toISOString(),
            created_date: localSite.createdDate.toISOString(),
            status: localSite.status,
            template_id: localSite.templateId
          });
        }
      }

      res.json(websitesWithUpdates);
    } catch (error) {
      console.error('Error fetching websites:', error);
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  // Payment and Subscription Routes
  // REMOVED DUPLICATE: Stripe checkout endpoint moved to line 4580

  // REMOVED DUPLICATE: Portal session endpoint - using the one at line 3653

  // Update subscription with prorated pricing
  app.post("/api/update-subscription", requireAuth, async (req: any, res) => {
    try {
      const { planId, billingPeriod } = req.body;
      const userId = (req as any).currentUser.id;
      
      if (!planId || !billingPeriod) {
        return res.status(400).json({ message: "Plan ID and billing period are required" });
      }

      // Get user profile
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has existing subscription
      if (user.stripeSubscriptionId) {
        // Update existing subscription with proration
        const updatedSubscription = await updateSubscription(
          user.stripeSubscriptionId,
          planId,
          billingPeriod
        );

        // Update user's plan in database
        await storage.updateUser(userId, {
          plan: planId as 'starter' | 'professional' | 'enterprise',
          billingPeriod: billingPeriod as 'monthly' | 'yearly',
          subscriptionStatus: 'active'
        });

        res.json({ 
          message: "Subscription updated successfully",
          subscription: updatedSubscription 
        });
      } else {
        // Create new subscription for user without existing subscription
        const session = await createCheckoutSession(
          planId,
          billingPeriod,
          user.email!,
          userId
        );

        res.json({ 
          message: "Checkout session created",
          url: session.url 
        });
      }
    } catch (error) {
      console.error('Subscription update error:', error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Removed broken webhook handler - using the correct one at /api/stripe-webhook

  // Enhanced User Registration API
  app.post("/api/signup", async (req, res) => {
    try {
      const { email, firstName, lastName, businessInfo, planId = 'starter' } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, first name, and last name are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Calculate trial dates
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

      // Create new user with trial
      const userData = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        lastName,
        userType: 'owner' as const,
        isActive: true,
        plan: 'trial' as const, // Start with trial
        subscriptionStatus: 'trialing' as const, // Trial status
        billingPeriod: 'monthly' as const,
        trialStartDate,
        trialEndDate,
        trialUsed: true, // Mark trial as used
        onboardingCompleted: false,
        onboardingStep: 1,
        businessInfo: businessInfo || {}
      };

      const newUser = await storage.createUser(userData);

      // Create initial onboarding progress
      await storage.createOnboardingProgress({
        userId: newUser.id,
        completedSteps: [],
        currentStep: 1,
        businessSetupCompleted: false,
        firstCalculatorCreated: false,
        designCustomized: false,
        embedCodeGenerated: false,
        firstLeadReceived: false
      });

      // Send welcome email
      await sendWelcomeEmail(email, firstName, businessInfo?.businessName);

      // Create session for the new user (auto-login after signup)
      (req.session as any).user = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        plan: newUser.plan,
        userType: newUser.userType,
        isActive: newUser.isActive
      };

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          plan: newUser.plan,
          onboardingCompleted: false
        },
        message: "Account created successfully"
      });
    } catch (error) {
      console.error('User registration error:', error);
      res.status(500).json({ message: "Failed to create user account" });
    }
  });

  // Complete Onboarding API
  app.post("/api/complete-onboarding/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Update user onboarding status
      const updatedUser = await storage.updateUser(userId, {
        onboardingCompleted: true,
        onboardingStep: 5
      });

      // Update onboarding progress
      await storage.updateOnboardingProgress(userId, {
        currentStep: 5,
        businessSetupCompleted: true,
        firstCalculatorCreated: true,
        designCustomized: true,
        embedCodeGenerated: true,
        completedAt: new Date()
      });

      // Send completion email
      const user = await storage.getUserById(userId);
      if (user && user.email) {
        await sendOnboardingCompleteEmail(
          user.email,
          user.firstName || 'User',
          user.businessInfo?.businessName
        );
      }

      res.json({ message: "Onboarding completed successfully", user: updatedUser });
    } catch (error) {
      console.error('Onboarding completion error:', error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.post("/api/websites", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      
      if (!dudaApi.isConfigured()) {
        return res.status(400).json({ 
          message: "Duda API not configured. Please provide DUDA_API_KEY and DUDA_API_PASSWORD." 
        });
      }

      const validatedData = z.object({
        description: z.string().optional(),
        template_id: z.union([z.string(), z.number()]).optional()
      }).parse(req.body);

      // Get user profile for email and name
      const user = await storage.getUserById(userId);
      if (!user?.email) {
        return res.status(400).json({ 
          message: "User profile incomplete. Please update your profile with an email address." 
        });
      }

      const userEmail = user.email;
      const firstName = user.firstName || 'Website';
      const lastName = user.lastName || 'Owner';
      const websiteName = user.organizationName || 'Your Business Website';

      // 1. Create website in Duda
      const createWebsiteData = {
        name: websiteName,
        description: validatedData.description,
        template_id: validatedData.template_id ? String(validatedData.template_id) : undefined
      };
      const dudaWebsite = await dudaApi.createWebsite(createWebsiteData);

      // 2. Create Duda user account
      const dudaAccount = await dudaApi.createAccount({
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        account_type: 'CUSTOMER'
      });

      // 3. Create welcome link for password setup in Duda editor (always create this)
      let welcomeLink: string | null = null;
      let emailSent = false;
      try {
        console.log('Creating welcome link for user to set up Duda password...');
        welcomeLink = await dudaApi.createWelcomeLink(dudaAccount.account_name);
        console.log('Welcome link created successfully:', welcomeLink);

        // 4. If email is configured, also send welcome email with the link
        const FROM_EMAIL = process.env.FROM_EMAIL;
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        
        if (FROM_EMAIL && RESEND_API_KEY && welcomeLink) {
          try {
            console.log('Email environment configured - sending welcome email...');
            // Initialize Resend
            const resend = new Resend(RESEND_API_KEY);

            // Send email via Resend
            const subject = "Set up your Autobidder website access";
            const displayName = `${firstName} ${lastName}`.trim() || "there";
            const html = `
              <div style="font-family:sans-serif;line-height:1.5;max-width:600px;margin:0 auto;padding:20px">
                <div style="text-align:center;margin-bottom:30px">
                  <h1 style="color:#333;margin:0">Welcome to Autobidder!</h1>
                </div>
                
                <p style="color:#555;font-size:16px;margin-bottom:20px">Hi ${displayName},</p>
                
                <p style="color:#555;font-size:16px;margin-bottom:25px">
                  Congratulations! Your website "${websiteName}" has been created and is ready for you to customize. 
                  Click the button below to set your password and access your website editor.
                </p>
                
                <div style="text-align:center;margin:30px 0">
                  <a href="${welcomeLink}" 
                     style="display:inline-block;background:#007bff;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">
                    Set Password & Access Editor
                  </a>
                </div>
                
                <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee">
                  <p style="color:#666;font-size:14px;margin-bottom:10px">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="color:#007bff;font-size:14px;word-break:break-all">
                    <a href="${welcomeLink}" style="color:#007bff">${welcomeLink}</a>
                  </p>
                  <p style="color:#999;font-size:12px;margin-top:20px">
                    This link expires in 30 days for security purposes.
                  </p>
                </div>
              </div>
            `;
            
            const textBody = `Hi ${displayName},

Congratulations! Your website "${websiteName}" has been created and is ready for you to customize.

Use this link to set your password and access your website editor:
${welcomeLink}

This link expires in 30 days for security purposes.

Best regards,
The Autobidder Team`;

            console.log('Sending welcome email via Resend...');
            const emailResult = await resend.emails.send({
              from: FROM_EMAIL,
              to: userEmail,
              subject,
              html,
              text: textBody,
            });

            if (emailResult.error) {
              console.error('Resend email error:', emailResult.error);
            } else {
              console.log('Welcome email sent successfully:', emailResult.data);
              emailSent = true;
            }
          } catch (emailError) {
            console.error('Error sending welcome email (welcome link still available):', emailError);
            // Email failed but welcome link is still available
          }
        } else {
          console.log('Email environment not configured or no welcome link - skipping email send');
        }
      } catch (welcomeError) {
        console.error('Error creating welcome link:', welcomeError);
        // Don't fail the entire process if welcome link fails
        console.log('Continuing without welcome link - user can still access via SSO');
      }

      // 5. Grant full permissions to the user for this site
      await dudaApi.grantSitePermissions(dudaAccount.account_name, dudaWebsite.site_name);

      // 6. Store website in our database
      const dbWebsiteData = {
        userId,
        siteName: dudaWebsite.site_name,
        accountName: dudaWebsite.account_name || '',
        siteDomain: dudaWebsite.site_domain,
        previewUrl: dudaWebsite.preview_url,
        status: dudaWebsite.status as 'active' | 'draft' | 'published',
        templateId: validatedData.template_id ? String(validatedData.template_id) : undefined,
        dudaSiteId: dudaWebsite.site_name,
        dudaAccountName: dudaAccount.account_name,
        dudaUserEmail: userEmail
      };

      const createdWebsite = await storage.createWebsite(dbWebsiteData);

      // 6. Generate SSO activation link for automatic redirect
      let activationLink: string | null = null;
      try {
        console.log('Generating SSO activation link...', { 
          accountName: dudaAccount.account_name,
          siteName: dudaWebsite.site_name 
        });
        
        activationLink = await dudaApi.generateSSOActivationLink(dudaAccount.account_name, dudaWebsite.site_name);
        console.log('SSO activation link generated successfully:', activationLink);
      } catch (ssoError) {
        console.error('Error generating SSO activation link:', ssoError);
        // If SSO link generation fails, fallback to editor URL
        activationLink = `https://editor.dudamobile.com/home/site/${dudaWebsite.site_name}`;
        console.log('Using fallback activation link:', activationLink);
      }
      const responseData = {
        ...createdWebsite,
        site_name: createdWebsite.siteName,
        account_name: createdWebsite.accountName,
        site_domain: createdWebsite.siteDomain,
        preview_url: createdWebsite.previewUrl,
        last_published: createdWebsite.lastPublished?.toISOString(),
        created_date: createdWebsite.createdDate.toISOString(),
        status: createdWebsite.status,
        template_id: createdWebsite.templateId,
        duda_account_name: createdWebsite.dudaAccountName,
        duda_user_email: createdWebsite.dudaUserEmail,
        activation_link: activationLink, // Include the activation link for automatic redirect
        welcome_link: welcomeLink, // Include welcome link for password setup
        welcome_email_sent: emailSent // Indicate if welcome email was sent automatically
      };
      
      console.log('Sending website response with welcome_link:', welcomeLink);
      console.log('Welcome email sent:', emailSent);
      console.log('Full response data keys:', Object.keys(responseData));
      
      res.status(201).json(responseData);
    } catch (error) {
      console.error('Error creating website:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid website data", errors: error.errors });
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to create website";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Generate SSO editor link for existing website
  app.get('/api/websites/:siteName/editor-link', requireAuth, async (req, res) => {
    try {
      const { siteName } = req.params;
      const userId = (req.session as any).user.id;
      
      console.log(`Generating editor link for site: ${siteName}, user: ${userId}`);
      
      // Find the website in our database
      const website = await storage.getWebsiteBySiteName(siteName);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      if (!dudaApi.isConfigured()) {
        return res.status(400).json({ message: "Duda API not configured. Please provide API credentials." });
      }
      
      // Generate SSO editor link using the Duda account name
      const editorLink = await dudaApi.generateSSOEditorLink(website.dudaAccountName!, website.siteName);
      console.log('SSO editor link generated successfully:', editorLink);
      
      res.json({ editor_link: editorLink });
    } catch (error) {
      console.error('Error generating editor link:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate editor link";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Reset website password
  app.post('/api/websites/:siteName/reset-password', requireAuth, async (req, res) => {
    try {
      const { siteName } = req.params;
      const userId = (req.session as any).user.id;
      
      console.log(`Resetting password for site: ${siteName}, user: ${userId}`);
      
      // Find the website in our database
      const website = await storage.getWebsiteBySiteName(siteName);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      // Get user information to use email as account_name
      const user = await storage.getUserById(userId);
      if (!user?.email) {
        return res.status(400).json({ message: "User email not found" });
      }
      
      if (!dudaApi.isConfigured()) {
        return res.status(400).json({ message: "Duda API not configured. Please provide API credentials." });
      }
      
      // Initiate password reset with Duda using user's email as account_name
      await dudaApi.resetAccountPassword(user.email);
      console.log('Password reset initiated successfully for account:', user.email);
      
      // Generate UUID for the reset password link 
      const resetUuid = crypto.randomUUID().replace(/-/g, '');
      
      // Generate the direct reset password link using the correct format
      const resetLink = `http://mysite.autobidder.org/login/resetpwd?lang=en&uuid=${resetUuid}`;
      console.log('Password reset link generated:', resetLink);
      
      res.json({ reset_link: resetLink });
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Improved Duda Welcome Link + Email via Resend
  app.post('/api/duda/welcome-link-email', requireAuth, async (req, res) => {
    try {
      const { accountEmail, toEmail, toName } = req.body || {};
      if (!accountEmail || !toEmail) {
        return res.status(400).json({ error: "Missing accountEmail or toEmail" });
      }
      
      const DUDA_USER = process.env.DUDA_API_KEY;
      const DUDA_PASS = process.env.DUDA_API_PASSWORD;
      const FROM_EMAIL = process.env.FROM_EMAIL;
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      
      if (!DUDA_USER || !DUDA_PASS || !RESEND_API_KEY || !FROM_EMAIL) {
        return res.status(500).json({ error: "Missing required environment variables" });
      }

      // Initialize Resend
      const resend = new Resend(RESEND_API_KEY);

      // 1) Create Welcome Link via Duda API
      const welcomeUrl = `https://api.duda.co/api/accounts/${encodeURIComponent(accountEmail)}/welcome`;
      const auth = Buffer.from(`${DUDA_USER}:${DUDA_PASS}`).toString('base64');

      console.log(`Creating welcome link for account: ${accountEmail}`);
      const dudaResponse = await fetch(welcomeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await dudaResponse.text();
      console.log(`Duda welcome link response: ${dudaResponse.status} - ${responseText}`);
      
      if (!dudaResponse.ok) {
        let detail = responseText;
        try { detail = JSON.parse(responseText); } catch {}
        return res.status(dudaResponse.status).json({
          error: "Failed to create welcome link",
          detail
        });
      }

      let data;
      try { 
        data = JSON.parse(responseText); 
      } catch {
        return res.status(502).json({ error: "Invalid JSON from Duda welcome endpoint" });
      }

      const { welcome_url, expiration } = data || {};
      if (!welcome_url) {
        return res.status(502).json({ error: "Duda response missing welcome_url" });
      }

      console.log('Welcome link created successfully:', welcome_url);

      // 2) Send email via Resend
      const subject = "Set up your Autobidder website access";
      const displayName = toName || "there";
      const html = `
        <div style="font-family:sans-serif;line-height:1.5;max-width:600px;margin:0 auto;padding:20px">
          <div style="text-align:center;margin-bottom:30px">
            <h1 style="color:#333;margin:0">Welcome to Autobidder!</h1>
          </div>
          
          <p style="color:#555;font-size:16px;margin-bottom:20px">Hi ${displayName},</p>
          
          <p style="color:#555;font-size:16px;margin-bottom:25px">
            Welcome! Your website has been created and is ready for you to customize. 
            Click the button below to set your password and access your website editor.
          </p>
          
          <div style="text-align:center;margin:30px 0">
            <a href="${welcome_url}" 
               style="display:inline-block;background:#007bff;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">
              Set Password & Access Editor
            </a>
          </div>
          
          <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee">
            <p style="color:#666;font-size:14px;margin-bottom:10px">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color:#007bff;font-size:14px;word-break:break-all">
              <a href="${welcome_url}" style="color:#007bff">${welcome_url}</a>
            </p>
            <p style="color:#999;font-size:12px;margin-top:20px">
              This link expires in 30 days for security purposes.
            </p>
          </div>
        </div>
      `;
      
      const textBody = `Hi ${displayName},

Welcome to Autobidder! Your website has been created and is ready for you to customize.

Use this link to set your password and access your website editor:
${welcome_url}

This link expires in 30 days for security purposes.

Best regards,
The Autobidder Team`;

      console.log('Sending email via Resend...');
      const emailResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject,
        html,
        text: textBody,
      });

      if (emailResult.error) {
        console.error('Resend email error:', emailResult.error);
        return res.status(502).json({ 
          error: "Failed to send email via Resend", 
          detail: emailResult.error 
        });
      }

      console.log('Email sent successfully:', emailResult.data);

      // 3) Final response
      return res.status(200).json({
        sent: true,
        welcome_url,
        expires_at_ms: expiration
      });

    } catch (err) {
      console.error("welcome-link-email error:", err);
      return res.status(500).json({ error: "Server error creating welcome link + email" });
    }
  });

  // Get templates from Duda API
  app.get('/api/templates', async (req, res) => {
    try {
      if (!dudaApi.isConfigured()) {
        return res.status(400).json({ message: "Duda API not configured. Please provide API credentials." });
      }

      const templates = await dudaApi.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch templates";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Custom Website Template routes - Only show templates with type: custom
  app.get('/api/custom-website-templates', async (req, res) => {
    try {
      const { industry } = req.query;
      
      let templates;
      if (industry && industry !== 'all') {
        templates = await storage.getCustomWebsiteTemplatesByIndustry(industry as string);
      } else {
        templates = await storage.getActiveCustomWebsiteTemplates();
      }
      
      // Filter to only show templates with template_properties.type = "custom"
      const customTemplates = templates.filter(template => {
        const templateProperties = template.templateProperties as any;
        return templateProperties && templateProperties.type === 'custom';
      });
      
      res.json(customTemplates);
    } catch (error) {
      console.error('Error fetching custom website templates:', error);
      res.status(500).json({ message: "Failed to fetch custom website templates" });
    }
  });

  // Get all custom website templates (including inactive ones for admin)
  app.get('/api/custom-website-templates/all', async (req, res) => {
    try {
      const templates = await storage.getAllCustomWebsiteTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching all custom website templates:', error);
      res.status(500).json({ message: "Failed to fetch all custom website templates" });
    }
  });

  app.get('/api/admin/custom-website-templates', requireSuperAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllCustomWebsiteTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching all custom website templates:', error);
      res.status(500).json({ message: "Failed to fetch custom website templates" });
    }
  });

  // Duda Template Management System API Routes
  
  // Template Tags Routes
  app.get('/api/duda-template-tags', async (req, res) => {
    try {
      const tags = await storage.getActiveDudaTemplateTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching template tags:', error);
      res.status(500).json({ message: "Failed to fetch template tags" });
    }
  });

  // Public endpoint for website template filtering
  app.get('/api/duda-template-tags', async (req, res) => {
    try {
      const tags = await storage.getAllDudaTemplateTags();
      // Only return active tags for public filtering
      const activeTags = tags.filter(tag => tag.isActive);
      res.json(activeTags);
    } catch (error) {
      console.error('Error fetching template tags:', error);
      res.status(500).json({ message: "Failed to fetch template tags" });
    }
  });

  // Add alias endpoint for frontend compatibility
  app.get('/api/admin/template-tags', requireSuperAdmin, async (req, res) => {
    try {
      const tags = await storage.getAllDudaTemplateTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching template tags:', error);
      res.status(500).json({ message: "Failed to fetch template tags" });
    }
  });

  app.get('/api/admin/duda-template-tags', requireSuperAdmin, async (req, res) => {
    try {
      const tags = await storage.getAllDudaTemplateTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching all template tags:', error);
      res.status(500).json({ message: "Failed to fetch template tags" });
    }
  });

  app.post('/api/admin/duda-template-tags', requireSuperAdmin, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const validatedData = insertDudaTemplateTagSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      const tag = await storage.createDudaTemplateTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      console.error('Error creating template tag:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tag data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template tag" });
    }
  });

  app.put('/api/admin/duda-template-tags/:id', requireSuperAdmin, async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      const validatedData = insertDudaTemplateTagSchema.partial().parse(req.body);
      
      const updated = await storage.updateDudaTemplateTag(tagId, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Template tag not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating template tag:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tag data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template tag" });
    }
  });

  app.delete('/api/admin/duda-template-tags/:id', requireSuperAdmin, async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      const success = await storage.deleteDudaTemplateTag(tagId);
      
      if (!success) {
        return res.status(404).json({ message: "Template tag not found" });
      }
      
      res.json({ message: "Template tag deleted successfully" });
    } catch (error) {
      console.error('Error deleting template tag:', error);
      res.status(500).json({ message: "Failed to delete template tag" });
    }
  });

  // Template Tag Assignment APIs (missing endpoints)
  app.post('/api/admin/template-tag-assignments', requireSuperAdmin, async (req, res) => {
    try {
      const { templateId, tagId } = req.body;
      const userId = (req as any).currentUser?.id || 'system';
      const assignment = await storage.assignTagToTemplate({
        templateId,
        tagId,
        assignedBy: userId
      });
      res.json(assignment);
    } catch (error) {
      console.error('Error assigning tag to template:', error);
      res.status(500).json({ message: "Failed to assign tag to template" });
    }
  });

  app.delete('/api/admin/template-tag-assignments/:templateId/:tagId', requireSuperAdmin, async (req, res) => {
    try {
      const { templateId, tagId } = req.params;
      const success = await storage.removeTagFromTemplate(templateId, parseInt(tagId));
      
      if (!success) {
        return res.status(404).json({ message: "Tag assignment not found" });
      }
      
      res.json({ message: "Tag unassigned from template successfully" });
    } catch (error) {
      console.error('Error unassigning tag from template:', error);
      res.status(500).json({ message: "Failed to unassign tag from template" });
    }
  });

  app.get('/api/admin/duda-templates-with-tags', requireSuperAdmin, async (req, res) => {
    try {
      const templates = await storage.getTemplatesWithTags();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates with tags:', error);
      res.status(500).json({ message: "Failed to fetch templates with tags" });
    }
  });

  // Template Metadata Routes
  app.get('/api/duda-templates', async (req, res) => {
    try {
      const { tags } = req.query;
      let templates;
      
      if (tags && typeof tags === 'string') {
        const tagIds = tags.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (tagIds.length > 0) {
          templates = await storage.getDudaTemplateMetadataByTags(tagIds);
        } else {
          templates = await storage.getVisibleDudaTemplateMetadata();
        }
      } else {
        templates = await storage.getVisibleDudaTemplateMetadata();
      }
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching Duda templates:', error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/duda-templates-with-tags', async (req, res) => {
    try {
      const templates = await storage.getTemplatesWithTags();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates with tags:', error);
      res.status(500).json({ message: "Failed to fetch templates with tags" });
    }
  });

  app.get('/api/admin/duda-templates', requireSuperAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllDudaTemplateMetadata();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching all Duda templates:', error);
      res.status(500).json({ message: "Failed to fetch all templates" });
    }
  });

  app.post('/api/admin/duda-templates/sync', requireSuperAdmin, async (req, res) => {
    try {
      if (!dudaApi.isConfigured()) {
        return res.status(400).json({ message: "Duda API not configured" });
      }

      // Fetch templates from Duda API
      const dudaTemplates = await dudaApi.getTemplates();
      const syncedTemplates = [];

      // Sync each template to our database
      for (const dudaTemplate of dudaTemplates) {
        const metadata = {
          templateId: dudaTemplate.template_id,
          templateName: dudaTemplate.template_name,
          previewUrl: dudaTemplate.preview_url,
          thumbnailUrl: dudaTemplate.thumbnail_url,
          desktopThumbnailUrl: dudaTemplate.desktop_thumbnail_url,
          tabletThumbnailUrl: dudaTemplate.tablet_thumbnail_url,
          mobileThumbnailUrl: dudaTemplate.mobile_thumbnail_url,
          vertical: dudaTemplate.template_properties?.vertical,
          templateType: dudaTemplate.template_properties?.type,
          visibility: dudaTemplate.template_properties?.visibility,
          canBuildFromUrl: dudaTemplate.template_properties?.can_build_from_url || false,
          hasStore: dudaTemplate.template_properties?.has_store || false,
          hasBlog: dudaTemplate.template_properties?.has_blog || false,
          hasNewFeatures: dudaTemplate.template_properties?.has_new_features || false,
        };

        const synced = await storage.upsertDudaTemplateMetadata(metadata);
        syncedTemplates.push(synced);
      }

      res.json({ 
        message: `Successfully synced ${syncedTemplates.length} templates`,
        templates: syncedTemplates 
      });
    } catch (error) {
      console.error('Error syncing Duda templates:', error);
      res.status(500).json({ message: "Failed to sync templates" });
    }
  });

  app.put('/api/admin/duda-templates/:templateId', requireSuperAdmin, async (req, res) => {
    try {
      const { templateId } = req.params;
      const validatedData = insertDudaTemplateMetadataSchema.partial().parse(req.body);
      
      const updated = await storage.updateDudaTemplateMetadata(templateId, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating template metadata:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/admin/duda-templates/:templateId', requireSuperAdmin, async (req, res) => {
    try {
      const { templateId } = req.params;
      const success = await storage.deleteDudaTemplateMetadata(templateId);
      
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Template Tag Assignment Routes
  app.get('/api/admin/duda-templates/:templateId/tags', requireSuperAdmin, async (req, res) => {
    try {
      const { templateId } = req.params;
      const assignments = await storage.getTemplateTagAssignments(templateId);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching template tags:', error);
      res.status(500).json({ message: "Failed to fetch template tags" });
    }
  });

  app.post('/api/admin/duda-templates/:templateId/tags', requireSuperAdmin, async (req, res) => {
    try {
      const { templateId } = req.params;
      const { tagId } = req.body;
      const userId = (req as any).currentUser.id;
      
      if (!tagId || typeof tagId !== 'number') {
        return res.status(400).json({ message: "Tag ID is required" });
      }

      const assignment = await storage.assignTagToTemplate({
        templateId,
        tagId,
        assignedBy: userId
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error assigning tag to template:', error);
      res.status(500).json({ message: "Failed to assign tag to template" });
    }
  });

  app.delete('/api/admin/duda-templates/:templateId/tags/:tagId', requireSuperAdmin, async (req, res) => {
    try {
      const { templateId, tagId } = req.params;
      const success = await storage.removeTagFromTemplate(templateId, parseInt(tagId));
      
      if (!success) {
        return res.status(404).json({ message: "Tag assignment not found" });
      }
      
      res.json({ message: "Tag removed from template successfully" });
    } catch (error) {
      console.error('Error removing tag from template:', error);
      res.status(500).json({ message: "Failed to remove tag from template" });
    }
  });

  app.post('/api/admin/custom-website-templates', requireSuperAdmin, async (req, res) => {
    try {
      const templateData = req.body;
      const template = await storage.createCustomWebsiteTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating custom website template:', error);
      res.status(500).json({ message: "Failed to create custom website template" });
    }
  });

  app.put('/api/admin/custom-website-templates/:id', requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const templateData = req.body;
      const template = await storage.updateCustomWebsiteTemplate(id, templateData);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Error updating custom website template:', error);
      res.status(500).json({ message: "Failed to update custom website template" });
    }
  });

  app.delete('/api/admin/custom-website-templates/:id', requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomWebsiteTemplate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting custom website template:', error);
      res.status(500).json({ message: "Failed to delete custom website template" });
    }
  });

  app.delete("/api/websites/:siteName", requireAuth, async (req, res) => {
    try {
      const { siteName } = req.params;
      const userId = (req as any).currentUser.id;
      
      if (!dudaApi.isConfigured()) {
        return res.status(400).json({ 
          message: "Duda API not configured. Please provide DUDA_API_KEY and DUDA_API_PASSWORD." 
        });
      }

      // Find the website in our database
      const website = await storage.getWebsiteBySiteName(siteName);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Delete from Duda
      try {
        await dudaApi.deleteWebsite(siteName);
      } catch (dudaError) {
        console.warn('Failed to delete from Duda, continuing with local deletion:', dudaError);
      }

      // Delete from our database
      const success = await storage.deleteWebsite(website.id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete website from database" });
      }

      res.json({ message: "Website deleted successfully" });
    } catch (error) {
      console.error('Error deleting website:', error);
      res.status(500).json({ message: "Failed to delete website" });
    }
  });

  // Publish website route with plan restrictions
  app.post("/api/websites/:siteName/publish", requireAuth, async (req: any, res) => {
    try {
      const { siteName } = req.params;
      const userId = (req as any).currentUser.id;
      
      // Get user profile to check plan
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has publishing permissions (Professional or Enterprise plan)
      const canPublish = user.plan === 'professional' || user.plan === 'enterprise';
      if (!canPublish) {
        return res.status(403).json({ 
          message: "Publishing requires Professional plan", 
          upgradeRequired: true,
          currentPlan: user.plan 
        });
      }
      
      if (!dudaApi.isConfigured()) {
        return res.status(400).json({ 
          message: "Duda API not configured. Please provide DUDA_API_KEY and DUDA_API_PASSWORD." 
        });
      }

      // Find the website in our database
      const website = await storage.getWebsiteBySiteName(siteName);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Publish via Duda API
      try {
        await dudaApi.publishWebsite(siteName);
        
        // Update local database with published status
        await storage.updateWebsite(website.id, {
          status: 'published',
          lastPublished: new Date()
        });
        
        // Construct the published URL on mysite.autobidder.org domain
        const publishedUrl = `https://${siteName}.mysite.autobidder.org`;
        
        res.json({ 
          message: "Website published successfully",
          publishedUrl,
          domain: `${siteName}.mysite.autobidder.org`,
          status: 'published'
        });
      } catch (dudaError) {
        console.error('Failed to publish with Duda:', dudaError);
        res.status(500).json({ 
          message: "Failed to publish website. Please try again or contact support." 
        });
      }
    } catch (error) {
      console.error('Error publishing website:', error);
      res.status(500).json({ message: "Failed to publish website" });
    }
  });

  // Profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const updates = req.body;
      
      // Only allow certain fields to be updated
      const allowedFields = ['firstName', 'lastName', 'organizationName', 'profileImageUrl'];
      const filteredUpdates: any = {};
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }
      
      const updatedUser = await storage.updateUser(userId, filteredUpdates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Onboarding API routes
  app.get("/api/onboarding/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const progress = await storage.getOnboardingProgress(userId);
      
      if (!progress) {
        // Create initial onboarding progress
        const newProgress = await storage.createOnboardingProgress({
          userId,
          completedSteps: [],
          currentStep: 1,
          businessSetupCompleted: false,
          firstCalculatorCreated: false,
          designCustomized: false,
          embedCodeGenerated: false,
          firstLeadReceived: false
        });
        return res.json(newProgress);
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.patch("/api/onboarding/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      const progress = await storage.updateOnboardingProgress(userId, updates);
      if (!progress) {
        return res.status(404).json({ message: "Onboarding progress not found" });
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update onboarding progress" });
    }
  });

  app.patch("/api/onboarding/:userId/step", async (req, res) => {
    try {
      const { userId } = req.params;
      const { step, businessInfo } = req.body;
      
      const user = await storage.updateUserOnboardingStep(userId, step, businessInfo);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update onboarding step" });
    }
  });

  // User signup API endpoint
  app.post("/api/signup", async (req, res) => {
    try {
      const { userInfo, businessInfo } = req.body;
      
      // Generate a unique user ID (in production this would be handled by auth)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create user with business info
      const user = await storage.upsertUser({
        id: userId,
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        businessInfo: businessInfo,
        onboardingStep: 1,
        onboardingCompleted: false,
        userType: "owner",
        permissions: {
          canManageUsers: true,
          canEditFormulas: true,
          canViewLeads: true,
          canManageCalendar: true,
          canAccessDesign: true,
          canViewStats: true,
        }
      });
      
      // Create initial onboarding progress
      await storage.createOnboardingProgress({
        userId,
        completedSteps: [],
        currentStep: 1,
        businessSetupCompleted: false,
        firstCalculatorCreated: false,
        designCustomized: false,
        embedCodeGenerated: false,
        firstLeadReceived: false
      });
      
      res.json({ 
        success: true, 
        user,
        message: "Account created successfully"
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create account. Please try again." 
      });
    }
  });

  // REMOVED DUPLICATE: Stripe checkout endpoint moved to line 4607

  app.post('/api/create-portal-session', requireAuth, async (req: any, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: 'No Stripe customer ID found. Please complete a payment first.' });
      }

      // For new Stripe test environment, we need to configure the portal first
      try {
        // Check if portal is configured by attempting to create a session
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${req.protocol}://${req.get('host')}/profile`,
        });
        res.json({ url: session.url });
      } catch (stripeError: any) {
        console.error('Stripe portal error:', stripeError);
        
        // If portal isn't configured in new test environment, provide setup instructions
        if (stripeError.message?.includes('not been activated') || stripeError.message?.includes('configuration')) {
          return res.status(400).json({ 
            message: 'Billing portal needs to be activated in your Stripe dashboard.',
            type: 'configuration_required',
            instructions: 'Go to Stripe Dashboard → Settings → Billing → Customer Portal, then activate it.',
            suggestion: 'This will allow customers to manage subscriptions, update payment methods, and download invoices automatically.'
          });
        }
        
        // For other Stripe errors, provide a helpful message
        return res.status(500).json({ 
          message: 'Unable to access billing portal at the moment. Please try again later.',
          type: 'stripe_error'
        });
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ message: 'Failed to create portal session' });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', requireAuth, async (req: any, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active subscription found' });
      }

      // First, try to retrieve the subscription to check if it's managed by a schedule
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      if (subscription.schedule) {
        // Subscription is managed by a schedule, we need to cancel the schedule
        console.log('Subscription is managed by schedule:', subscription.schedule);
        
        try {
          // Cancel the subscription schedule instead
          const schedule = await stripe.subscriptionSchedules.cancel(subscription.schedule as string);
          
          // Update user status in database
          await storage.updateUser(userId, {
            subscriptionStatus: 'canceled'
          });

          res.json({ 
            message: 'Subscription schedule has been canceled',
            canceled: true,
            scheduleId: schedule.id
          });
        } catch (scheduleError: any) {
          console.error('Error canceling subscription schedule:', scheduleError);
          
          // If schedule cancellation fails, try to end the schedule at the current period end
          try {
            const schedule = await stripe.subscriptionSchedules.update(subscription.schedule as string, {
              end_behavior: 'cancel'
            });
            
            // Update user status in database
            await storage.updateUser(userId, {
              subscriptionStatus: 'canceled'
            });

            res.json({ 
              message: 'Subscription schedule will end at the current period',
              scheduleUpdated: true,
              scheduleId: schedule.id
            });
          } catch (updateError: any) {
            console.error('Error updating subscription schedule:', updateError);
            return res.status(500).json({ 
              message: 'Unable to cancel subscription schedule. Please contact support.',
              error: updateError.message 
            });
          }
        }
      } else {
        // Regular subscription, not managed by a schedule
        try {
          // Cancel the subscription at the end of the current period
          const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });

          // Update user status in database
          await storage.updateUser(userId, {
            subscriptionStatus: 'canceled'
          });

          res.json({ 
            message: 'Subscription will be canceled at the end of the current billing period',
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
            currentPeriodEnd: updatedSubscription.current_period_end
          });
        } catch (subscriptionError: any) {
          console.error('Error canceling subscription:', subscriptionError);
          return res.status(500).json({ 
            message: 'Failed to cancel subscription',
            error: subscriptionError.message 
          });
        }
      }
    } catch (error: any) {
      console.error('Error in cancel subscription:', error);
      res.status(500).json({ 
        message: 'Failed to process cancellation request',
        error: error.message 
      });
    }
  });

  // Reactivate subscription
  app.post('/api/reactivate-subscription', requireAuth, async (req: any, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No subscription found' });
      }

      // Reactivate the subscription
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update user status in database
      await storage.updateUser(userId, {
        subscriptionStatus: 'active'
      });

      res.json({ 
        message: 'Subscription reactivated successfully',
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      res.status(500).json({ message: 'Failed to reactivate subscription' });
    }
  });

  // Handle successful payment return from Stripe checkout
  app.get('/api/verify-checkout/:sessionId', requireAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).currentUser.id;
      
      console.log('Verifying checkout session:', sessionId, 'for user:', userId);
      
      // Retrieve checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      console.log('Session details:', {
        id: session.id,
        payment_status: session.payment_status,
        subscription: session.subscription,
        customer: session.customer,
        metadata: session.metadata
      });
      
      if (session.payment_status === 'paid' && session.metadata?.userId === userId) {
        const planId = session.metadata.planId;
        const billingPeriod = session.metadata.billingPeriod;
        
        console.log('Payment verified, updating user subscription:', { userId, planId, billingPeriod, subscriptionId: session.subscription });
        
        // Update user with subscription info
        await storage.updateUser(userId, {
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
          subscriptionStatus: 'active',
          plan: planId as 'standard' | 'plus' | 'plus_seo',
          billingPeriod: billingPeriod as 'monthly' | 'yearly'
        });
        
        console.log('User subscription updated successfully');
        
        res.json({ 
          success: true, 
          message: 'Subscription activated successfully',
          plan: planId,
          billingPeriod
        });
      } else {
        console.log('Payment verification failed:', {
          payment_status: session.payment_status,
          metadata_userId: session.metadata?.userId,
          actual_userId: userId
        });
        res.status(400).json({ 
          success: false, 
          message: 'Payment not completed or session mismatch' 
        });
      }
    } catch (error) {
      console.error('Error verifying checkout:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to verify payment' 
      });
    }
  });

  // Manual subscription sync for fresh test environment (after payment completion)
  app.post('/api/sync-subscription', requireAuth, async (req: any, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: 'No Stripe customer found - please try upgrading again' });
      }
      
      console.log('Syncing subscription for fresh test environment - user:', userId, 'customer:', user.stripeCustomerId);
      
      // Get active subscriptions for this customer in the fresh test environment
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1
      });
      
      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        const priceId = subscription.items.data[0]?.price.id;
        const interval = subscription.items.data[0]?.price.recurring?.interval;
        
        console.log('Found active subscription:', {
          id: subscription.id,
          status: subscription.status,
          priceId,
          interval,
          currentPeriodEnd: subscription.current_period_end
        });
        
        // Get the price amount to determine the correct plan
        const priceAmount = subscription.items.data[0]?.price.unit_amount || 0;
        const isYearly = interval === 'year';
        
        // Match plan based on price amount (Stripe amounts are in cents)
        let planId = 'standard'; // default
        if (isYearly) {
          // Yearly prices
          if (priceAmount >= 29700) planId = 'plus_seo'; // $297/year (29700 cents)
          else if (priceAmount >= 9700) planId = 'plus'; // $97/year (9700 cents)  
          else planId = 'standard'; // $49/year (4900 cents)
        } else {
          // Monthly prices
          if (priceAmount >= 29700) planId = 'plus_seo'; // $297/month (29700 cents)
          else if (priceAmount >= 9700) planId = 'plus'; // $97/month (9700 cents)
          else planId = 'standard'; // $49/month (4900 cents)
        }
        
        console.log('Plan detection:', {
          priceAmount,
          isYearly,
          detectedPlan: planId
        });
        
        // Update user with subscription info including billing dates
        const updates: any = {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: 'active',
          plan: planId as 'standard' | 'plus' | 'plus_seo',
          billingPeriod: (interval === 'year' ? 'yearly' : 'monthly') as 'monthly' | 'yearly'
        };
        
        // Add billing dates if available
        if (subscription.current_period_start) {
          updates.billingStart = new Date(subscription.current_period_start * 1000);
        }
        if (subscription.current_period_end) {
          updates.billingEnd = new Date(subscription.current_period_end * 1000);
        }
        
        const updatedUser = await storage.updateUser(userId, updates);
        
        console.log('Subscription synced successfully for user:', userId);
        console.log('Updated user data:', {
          id: updatedUser?.id,
          plan: updatedUser?.plan,
          stripeSubscriptionId: updatedUser?.stripeSubscriptionId,
          subscriptionStatus: updatedUser?.subscriptionStatus
        });
        
        res.json({ 
          success: true, 
          message: 'Subscription synced successfully',
          plan: planId,
          billingPeriod: interval === 'year' ? 'yearly' : 'monthly'
        });
      } else {
        res.json({ 
          success: false, 
          message: 'No active subscription found in Stripe' 
        });
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to sync subscription' 
      });
    }
  });

  // Get subscription details
  app.get('/api/subscription-details', requireAuth, async (req: any, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      
      console.log('Subscription details request for user:', userId, 'stripeSubscriptionId:', user?.stripeSubscriptionId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ hasSubscription: false });
      }

      // Check if subscription status allows showing subscription details
      const validStatuses = ['active', 'trialing', 'incomplete', 'past_due'];
      if (user.subscriptionStatus && !validStatuses.includes(user.subscriptionStatus)) {
        return res.json({ hasSubscription: false });
      }

      // Check if it's a test subscription (fake ID)
      if (user.stripeSubscriptionId.startsWith('sub_test_')) {
        // Return mock data for test subscriptions
        const planPrices: Record<string, { monthly: number; yearly: number }> = {
          'standard': { monthly: 4900, yearly: Math.round(4900 * 12 * 0.83) },
          'plus': { monthly: 9700, yearly: Math.round(9700 * 12 * 0.83) },
          'plus_seo': { monthly: 29700, yearly: Math.round(29700 * 12 * 0.83) }
        };

        const planInfo = planPrices[user.plan as string] || planPrices.standard;
        const amount = user.billingPeriod === 'yearly' ? planInfo.yearly : planInfo.monthly;
        const now = Date.now() / 1000;
        const intervalInSeconds = user.billingPeriod === 'yearly' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60;

        const mockSubscription = {
          hasSubscription: true,
          subscription: {
            id: user.stripeSubscriptionId,
            status: 'active',
            cancelAtPeriodEnd: false,
            currentPeriodStart: now,
            currentPeriodEnd: now + intervalInSeconds,
            canceledAt: null,
            items: [{
              priceId: `price_test_${user.plan}`,
              productName: `Autobidder ${user.plan?.charAt(0).toUpperCase()}${user.plan?.slice(1)} Plan`,
              amount: amount,
              interval: user.billingPeriod === 'yearly' ? 'year' : 'month'
            }]
          },
          customer: {
            id: user.stripeCustomerId || `cus_test_${userId}`,
            email: user.email,
            defaultPaymentMethod: null
          }
        };
        
        console.log('Mock subscription data:', {
          currentPeriodStart: mockSubscription.subscription.currentPeriodStart,
          currentPeriodEnd: mockSubscription.subscription.currentPeriodEnd,
          now: now,
          intervalInSeconds: intervalInSeconds,
          endDate: new Date((now + intervalInSeconds) * 1000).toISOString()
        });
        
        return res.json(mockSubscription);
      }

      // Real Stripe subscription - expand to get full details
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['customer', 'items.data.price']
      });
      const customer = await stripe.customers.retrieve(user.stripeCustomerId!);
      
      // Get period dates from the first subscription item since they're not at the top level
      const firstItem = subscription.items.data[0];
      const currentPeriodStart = firstItem?.current_period_start || subscription.billing_cycle_anchor;
      const currentPeriodEnd = firstItem?.current_period_end || (currentPeriodStart ? currentPeriodStart + (30 * 24 * 60 * 60) : undefined);

      const realSubscription = {
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          canceledAt: subscription.canceled_at,
          items: subscription.items.data.map(item => ({
            priceId: item.price.id,
            productName: item.price.nickname || 'Subscription',
            amount: item.price.unit_amount,
            interval: item.price.recurring?.interval
          }))
        },
        customer: {
          id: customer.id,
          email: customer.email,
          defaultPaymentMethod: customer.invoice_settings?.default_payment_method
        }
      };

      
      res.json(realSubscription);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      res.status(500).json({ message: 'Failed to fetch subscription details' });
    }
  });

  // Get invoice history
  app.get('/api/invoices', requireAuth, async (req: any, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      
      if (!user?.stripeCustomerId || user.stripeCustomerId.startsWith('cus_test_')) {
        // Return mock invoices for test customers
        const planPrices: Record<string, { monthly: number; yearly: number }> = {
          'standard': { monthly: 4900, yearly: Math.round(4900 * 12 * 0.83) },
          'plus': { monthly: 9700, yearly: Math.round(9700 * 12 * 0.83) },
          'plus_seo': { monthly: 29700, yearly: Math.round(29700 * 12 * 0.83) }
        };
        
        const planInfo = planPrices[user.plan as string] || planPrices.standard;
        const amount = user.billingPeriod === 'yearly' ? planInfo.yearly : planInfo.monthly;
        
        return res.json({ 
          invoices: [{
            id: 'in_test_001',
            number: 'INV-TEST-001',
            status: 'paid',
            total: amount,
            subtotal: amount,
            tax: 0,
            amountPaid: amount,
            amountDue: 0,
            currency: 'usd',
            created: Math.floor(Date.now() / 1000),
            dueDate: null,
            paidAt: Math.floor(Date.now() / 1000),
            periodStart: Math.floor(Date.now() / 1000),
            periodEnd: Math.floor(Date.now() / 1000) + (user.billingPeriod === 'yearly' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60),
            hostedInvoiceUrl: null,
            invoicePdf: null,
            description: `Autobidder ${user.plan} Plan - ${user.billingPeriod}`,
            lines: [{
              description: `Autobidder ${user.plan} Plan`,
              amount: amount,
              quantity: 1,
              period: {
                start: Math.floor(Date.now() / 1000),
                end: Math.floor(Date.now() / 1000) + (user.billingPeriod === 'yearly' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60)
              }
            }]
          }]
        });
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 50,
        expand: ['data.charge']
      });

      const formattedInvoices = invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        total: invoice.total,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        created: invoice.created,
        dueDate: invoice.due_date,
        paidAt: invoice.status_transitions?.paid_at,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        description: invoice.description,
        lines: invoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount,
          quantity: line.quantity,
          period: line.period
        }))
      }));

      res.json({ invoices: formattedInvoices });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  // Subscription payment intent endpoint for getting payment details
  app.post("/api/subscription-payment-intent", requireAuth, async (req, res) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID required" });
      }

      // Get the subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent'],
      });

      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent;

      if (!paymentIntent) {
        return res.status(400).json({ message: "No payment intent found for subscription" });
      }

      res.json({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      });
    } catch (error: any) {
      console.error("Error getting subscription payment intent:", error);
      res.status(500).json({ message: "Failed to get payment intent" });
    }
  });

  // Payment intent secret endpoint for payment confirmation page
  app.post("/api/payment-intent-secret", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID required" });
      }

      // Get the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      res.json({
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      });
    } catch (error: any) {
      console.error("Error getting payment intent secret:", error);
      res.status(500).json({ message: "Failed to get payment intent" });
    }
  });

  // Removed duplicate webhook handler - using the correct one at line 6693

  // Custom Forms API endpoints - UPDATED FOR NEW SCHEMA
  app.get("/api/custom-forms", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const forms = await storage.getCustomFormsByAccountId(userId);
      res.json(forms);
    } catch (error) {
      console.error('Error fetching custom forms:', error);
      res.status(500).json({ message: "Failed to fetch custom forms" });
    }
  });

  app.get("/api/custom-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).currentUser.id;
      const form = await storage.getCustomFormById(id);
      if (!form || form.accountId !== userId) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.json(form);
    } catch (error) {
      console.error('Error fetching custom form:', error);
      res.status(500).json({ message: "Failed to fetch custom form" });
    }
  });

  // Validate slug uniqueness endpoint
  app.post("/api/custom-forms/validate-slug", requireAuth, async (req, res) => {
    try {
      const { slug, excludeId } = req.body;
      const userId = (req as any).currentUser.id;
      
      if (!slug) {
        return res.status(400).json({ message: "Slug is required" });
      }
      
      const isUnique = await storage.validateUniqueSlug(userId, slug, excludeId);
      res.json({ isUnique });
    } catch (error) {
      console.error('Error validating slug:', error);
      res.status(500).json({ message: "Failed to validate slug" });
    }
  });

  app.post("/api/custom-forms", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).currentUser.id;
      
      // Validate the form data
      const validatedData = insertCustomFormSchema.parse({
        ...req.body,
        accountId: userId,
      });
      
      // Check if slug is unique
      const isSlugUnique = await storage.validateUniqueSlug(userId, validatedData.slug);
      if (!isSlugUnique) {
        return res.status(400).json({ message: "Slug already exists for this account" });
      }
      
      // Validate that all serviceIds are enabled formulas for this user
      const userFormulas = await storage.getFormulasByUserId(userId);
      const enabledFormulaIds = userFormulas.filter(f => f.isActive && f.isDisplayed).map(f => f.id);
      
      const invalidServiceIds = validatedData.serviceIds.filter(id => !enabledFormulaIds.includes(id));
      if (invalidServiceIds.length > 0) {
        return res.status(400).json({ 
          message: "Some selected services are not enabled for your account",
          invalidIds: invalidServiceIds
        });
      }
      
      const form = await storage.createCustomForm(validatedData);
      res.status(201).json(form);
    } catch (error) {
      console.error('Error creating custom form:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid custom form data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create custom form" });
    }
  });

  app.patch("/api/custom-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).currentUser.id;
      
      // Check if form exists and belongs to user
      const existingForm = await storage.getCustomFormById(id);
      if (!existingForm || existingForm.accountId !== userId) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      
      const validatedData = insertCustomFormSchema.partial().parse({
        ...req.body,
        accountId: userId,
      });
      
      // If slug is being updated, check uniqueness
      if (validatedData.slug && validatedData.slug !== existingForm.slug) {
        const isSlugUnique = await storage.validateUniqueSlug(userId, validatedData.slug, id);
        if (!isSlugUnique) {
          return res.status(400).json({ message: "Slug already exists for this account" });
        }
      }
      
      // Validate serviceIds if provided
      if (validatedData.serviceIds) {
        const userFormulas = await storage.getFormulasByUserId(userId);
        const enabledFormulaIds = userFormulas.filter(f => f.isActive && f.isDisplayed).map(f => f.id);
        
        const invalidServiceIds = validatedData.serviceIds.filter(id => !enabledFormulaIds.includes(id));
        if (invalidServiceIds.length > 0) {
          return res.status(400).json({ 
            message: "Some selected services are not enabled for your account",
            invalidIds: invalidServiceIds
          });
        }
      }
      
      const form = await storage.updateCustomForm(id, validatedData);
      res.json(form);
    } catch (error) {
      console.error('Error updating custom form:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid custom form data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update custom form" });
    }
  });

  app.delete("/api/custom-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).currentUser.id;
      
      // Check if form exists and belongs to user
      const existingForm = await storage.getCustomFormById(id);
      if (!existingForm || existingForm.accountId !== userId) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      
      const success = await storage.deleteCustomForm(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete custom form" });
      }
      res.json({ message: "Custom form deleted successfully" });
    } catch (error) {
      console.error('Error deleting custom form:', error);
      res.status(500).json({ message: "Failed to delete custom form" });
    }
  });

  // Public Custom Form Access - NEW SLUG-BASED ENDPOINT
  app.get("/api/public/forms/:accountId/:slug", async (req, res) => {
    try {
      const { accountId, slug } = req.params;
      
      const form = await storage.getCustomFormByAccountSlug(accountId, slug);
      if (!form || !form.enabled) {
        return res.status(404).json({ message: "Form not found or disabled" });
      }
      
      // Get the associated formulas/services for this form
      const formulas = await storage.getFormulasByUserId(form.accountId);
      const selectedFormulas = formulas.filter(f => form.serviceIds.includes(f.id) && f.isActive && f.isDisplayed);
      
      // Return form with its formulas
      res.json({
        form,
        formulas: selectedFormulas
      });
    } catch (error) {
      console.error('Error fetching public custom form:', error);
      res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  // Custom Form Leads API endpoints - UPDATED FOR NEW SCHEMA
  app.get("/api/custom-forms/:formId/leads", requireAuth, async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      const userId = (req as any).currentUser.id;
      
      // Verify form belongs to user
      const form = await storage.getCustomFormById(formId);
      if (!form || form.accountId !== userId) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      
      const leads = await storage.getCustomFormLeads(formId);
      res.json(leads);
    } catch (error) {
      console.error('Error fetching custom form leads:', error);
      res.status(500).json({ message: "Failed to fetch custom form leads" });
    }
  });

  app.post("/api/custom-forms/:formId/leads", async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      
      // Get form to validate and get metadata
      const form = await storage.getCustomFormById(formId);
      if (!form || !form.enabled) {
        return res.status(404).json({ message: "Custom form not found or disabled" });
      }
      
      const validatedData = insertCustomFormLeadSchema.parse({
        ...req.body,
        customFormId: formId,
        customFormSlug: form.slug,
        customFormName: form.name,
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
      });
      
      const lead = await storage.createCustomFormLead(validatedData);
      
      // TODO: Fire analytics events with custom form metadata
      // TODO: Trigger webhooks with customFormId, customFormSlug, customFormName
      
      res.status(201).json(lead);
    } catch (error) {
      console.error('Error creating custom form lead:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // DFY Services API endpoints
  app.get("/api/dfy-services", async (req, res) => {
    try {
      const services = await storage.getAllDfyServices();
      res.json(services);
    } catch (error) {
      console.error('Error fetching DFY services:', error);
      res.status(500).json({ message: "Failed to fetch DFY services" });
    }
  });

  app.get("/api/dfy-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getDfyService(id);
      if (!service) {
        return res.status(404).json({ message: "DFY service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error('Error fetching DFY service:', error);
      res.status(500).json({ message: "Failed to fetch DFY service" });
    }
  });

  // Create payment intent for DFY service purchase
  app.post("/api/dfy-services/:id/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const { notes } = req.body;
      const userId = (req as any).user?.id;

      const service = await storage.getDfyService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "DFY service not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: `${user.firstName} ${user.lastName}`.trim(),
          metadata: {
            userId: user.id
          }
        });
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(userId, { stripeCustomerId });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: service.price,
        currency: 'usd',
        customer: stripeCustomerId,
        metadata: {
          serviceId: serviceId.toString(),
          userId: userId,
          serviceName: service.name
        },
        description: `Purchase of ${service.name}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create purchase record
      const purchase = await storage.createDfyServicePurchase({
        userId,
        serviceId,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId,
        amountPaid: service.price,
        currency: 'usd',
        paymentStatus: 'pending',
        serviceStatus: 'pending',
        purchaseNotes: notes || null,
        metadata: {}
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        purchaseId: purchase.id
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Get user's DFY service purchases
  app.get("/api/dfy-services/purchases", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const purchases = await storage.getUserDfyServicePurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error('Error fetching user purchases:', error);  
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Admin DFY Services Management
  app.post("/api/admin/dfy-services", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertDfyServiceSchema.parse(req.body);
      const service = await storage.createDfyService({
        ...validatedData,
        createdBy: (req as any).user?.id
      });
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      console.error('Error creating DFY service:', error);
      res.status(500).json({ message: "Failed to create DFY service" });
    }
  });

  app.patch("/api/admin/dfy-services/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDfyServiceSchema.partial().parse(req.body);
      const service = await storage.updateDfyService(id, validatedData);
      if (!service) {
        return res.status(404).json({ message: "DFY service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      console.error('Error updating DFY service:', error);
      res.status(500).json({ message: "Failed to update DFY service" });
    }
  });

  app.delete("/api/admin/dfy-services/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDfyService(id);
      if (!success) {
        return res.status(404).json({ message: "DFY service not found" });
      }
      res.json({ message: "DFY service deleted successfully" });
    } catch (error) {
      console.error('Error deleting DFY service:', error);
      res.status(500).json({ message: "Failed to delete DFY service" });
    }
  });

  // Admin purchase management
  app.get("/api/admin/dfy-services/purchases", requireSuperAdmin, async (req, res) => {
    try {
      const purchases = await db.select({
        id: dfyServicePurchases.id,
        userId: dfyServicePurchases.userId,
        serviceId: dfyServicePurchases.serviceId,
        stripePaymentIntentId: dfyServicePurchases.stripePaymentIntentId,
        stripeCustomerId: dfyServicePurchases.stripeCustomerId,
        amountPaid: dfyServicePurchases.amountPaid,
        currency: dfyServicePurchases.currency,
        paymentStatus: dfyServicePurchases.paymentStatus,
        serviceStatus: dfyServicePurchases.serviceStatus,
        purchaseNotes: dfyServicePurchases.purchaseNotes,
        deliveryNotes: dfyServicePurchases.deliveryNotes,
        completedAt: dfyServicePurchases.completedAt,
        refundedAt: dfyServicePurchases.refundedAt,
        refundAmount: dfyServicePurchases.refundAmount,
        metadata: dfyServicePurchases.metadata,
        createdAt: dfyServicePurchases.createdAt,
        updatedAt: dfyServicePurchases.updatedAt,
        service: dfyServices,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(dfyServicePurchases)
      .innerJoin(dfyServices, eq(dfyServicePurchases.serviceId, dfyServices.id))
      .innerJoin(users, eq(dfyServicePurchases.userId, users.id))
      .orderBy(desc(dfyServicePurchases.createdAt));
      
      res.json(purchases);
    } catch (error) {
      console.error('Error fetching admin purchases:', error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.patch("/api/admin/dfy-services/purchases/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDfyServicePurchaseSchema.partial().parse(req.body);
      const purchase = await storage.updateDfyServicePurchase(id, validatedData);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase data", errors: error.errors });
      }
      console.error('Error updating purchase:', error);
      res.status(500).json({ message: "Failed to update purchase" });
    }
  });

  // Admin API endpoints
  app.get("/api/admin/stats", requireSuperAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  app.get("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsersForAdmin();
      res.json(users);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/leads", requireSuperAdmin, async (req, res) => {
    try {
      const leads = await storage.getAllLeadsForAdmin();
      res.json(leads);
    } catch (error) {
      console.error('Error fetching admin leads:', error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/admin/websites", requireSuperAdmin, async (req, res) => {
    try {
      const websites = await storage.getAllWebsitesForAdmin();
      res.json(websites);
    } catch (error) {
      console.error('Error fetching admin websites:', error);
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  // Admin user management endpoints
  app.patch("/api/admin/users/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      // Only allow certain fields to be updated by admin
      const allowedFields = ['firstName', 'lastName', 'organizationName', 'plan', 'isActive', 'subscriptionStatus', 'isBetaTester', 'permissions'];
      const filteredUpdates: any = {};
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }
      
      const updatedUser = await storage.updateUser(userId, filteredUpdates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin Stripe Configuration endpoints
  app.get("/api/admin/stripe-config", requireSuperAdmin, async (req, res) => {
    try {
      // Get the first business settings record which contains global Stripe config
      const businessSettings = await storage.getBusinessSettings();
      res.json({
        stripeConfig: businessSettings?.stripeConfig || {
          standard: { monthlyPriceId: "", yearlyPriceId: "" },
          plus: { monthlyPriceId: "", yearlyPriceId: "" },
          plus_seo: { monthlyPriceId: "", yearlyPriceId: "" }
        },
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ""
      });
    } catch (error) {
      console.error('Error fetching admin Stripe config:', error);
      res.status(500).json({ message: "Failed to fetch Stripe configuration" });
    }
  });

  app.put("/api/admin/stripe-config", requireSuperAdmin, async (req, res) => {
    try {
      const { stripeConfig, webhookSecret } = req.body;
      
      // Update business settings with new Stripe config
      const settings = await storage.updateBusinessSettings(1, { stripeConfig });
      
      // Note: webhookSecret would need to be updated in environment variables
      // For now, we'll just acknowledge it was received
      console.log('Webhook secret updated (requires restart to take effect):', webhookSecret ? 'SET' : 'EMPTY');
      
      res.json({ 
        message: "Stripe configuration updated successfully",
        settings,
        webhookSecretUpdated: !!webhookSecret
      });
    } catch (error) {
      console.error('Error updating admin Stripe config:', error);
      res.status(500).json({ message: "Failed to update Stripe configuration" });
    }
  });

  // Admin impersonation endpoint
  app.post("/api/admin/impersonate/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create impersonation token (in production, this would be a secure JWT)
      const impersonationToken = `admin_impersonate_${userId}_${Date.now()}`;
      
      // Log the impersonation for security audit
      console.log(`Admin impersonation: accessing user ${userId} (${user.email}) at ${new Date().toISOString()}`);
      
      res.json({ 
        token: impersonationToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationName: user.organizationName
        }
      });
    } catch (error) {
      console.error('Error creating impersonation token:', error);
      res.status(500).json({ message: "Failed to create impersonation session" });
    }
  });



  // Support Ticket API endpoints
  app.get("/api/support-tickets", requireAuth, async (req: any, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.get("/api/support-tickets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching support ticket:", error);
      res.status(500).json({ message: "Failed to fetch support ticket" });
    }
  });

  app.post("/api/support-tickets", async (req, res) => {
    try {
      const validatedData = insertSupportTicketSchema.parse(req.body);
      const ticket = await storage.createSupportTicket(validatedData);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.patch("/api/support-tickets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSupportTicketSchema.partial().parse(req.body);
      const ticket = await storage.updateSupportTicket(id, validatedData);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  app.get("/api/support-tickets/:ticketId/messages", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const messages = await storage.getTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ message: "Failed to fetch ticket messages" });
    }
  });

  app.post("/api/support-tickets/:ticketId/messages", requireAuth, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const userId = req.user?.claims?.sub;
      const validatedData = insertTicketMessageSchema.parse({
        ...req.body,
        ticketId,
        senderId: userId,
        isFromCustomer: false,
      });
      const message = await storage.createTicketMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating ticket message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Estimate management routes
  app.get("/api/estimates", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const estimates = await storage.getEstimatesByUserId(userId);
      res.json(estimates);
    } catch (error) {
      console.error('Error fetching user estimates:', error);
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.get("/api/estimates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const estimate = await storage.getEstimate(id);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      console.error('Error fetching estimate:', error);
      res.status(500).json({ message: "Failed to fetch estimate" });
    }
  });

  app.get("/api/estimates/by-number/:estimateNumber", async (req, res) => {
    try {
      const { estimateNumber } = req.params;
      const estimate = await storage.getEstimateByNumber(estimateNumber);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      console.error('Error fetching estimate by number:', error);
      res.status(500).json({ message: "Failed to fetch estimate" });
    }
  });

  app.post("/api/estimates", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEstimateSchema.parse(req.body);
      const estimate = await storage.createEstimate(validatedData);
      res.status(201).json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid estimate data", errors: error.errors });
      }
      console.error('Error creating estimate:', error);
      res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  app.patch("/api/estimates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEstimateSchema.partial().parse(req.body);
      const estimate = await storage.updateEstimate(id, validatedData);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid estimate data", errors: error.errors });
      }
      console.error('Error updating estimate:', error);
      res.status(500).json({ message: "Failed to update estimate" });
    }
  });

  app.delete("/api/estimates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEstimate(id);
      if (!success) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      res.json({ message: "Estimate deleted successfully" });
    } catch (error) {
      console.error('Error deleting estimate:', error);
      res.status(500).json({ message: "Failed to delete estimate" });
    }
  });

  // Create estimate from lead
  app.post("/api/leads/:id/estimate", requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const { businessMessage, validUntil } = req.body;
      
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const formula = await storage.getFormula(lead.formulaId);
      if (!formula) {
        return res.status(404).json({ message: "Formula not found" });
      }

      // Generate unique estimate number
      const estimateNumber = `EST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const estimateData = {
        leadId: lead.id,
        estimateNumber,
        customerName: lead.name,
        customerEmail: lead.email,
        customerPhone: lead.phone,
        businessMessage: businessMessage || "Thank you for your interest in our services. Please find the detailed estimate below.",
        services: [{
          name: formula.name,
          description: formula.description || "",
          variables: lead.variables,
          price: lead.calculatedPrice,
          category: "Service"
        }],
        subtotal: lead.calculatedPrice,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: lead.calculatedPrice,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "draft"
      };

      const estimate = await storage.createEstimate(estimateData);
      res.status(201).json(estimate);
    } catch (error) {
      console.error('Error creating estimate from lead:', error);
      res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  // Create estimate from multi-service lead
  app.post("/api/multi-service-leads/:id/estimate", requireAuth, async (req, res) => {
    try {
      const multiServiceLeadId = parseInt(req.params.id);
      const { businessMessage, validUntil, taxRate = 0, discountAmount = 0 } = req.body;
      
      const lead = await storage.getMultiServiceLead(multiServiceLeadId);
      if (!lead) {
        return res.status(404).json({ message: "Multi-service lead not found" });
      }

      // Generate unique estimate number
      const estimateNumber = `EST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Convert service calculations to estimate services
      const services = lead.services.map(service => ({
        name: service.formulaName,
        description: `Service ID: ${service.formulaId}`,
        variables: service.variables,
        price: service.calculatedPrice,
        category: "Service"
      }));

      const subtotal = lead.totalPrice - discountAmount;
      const taxAmount = Math.round(subtotal * (taxRate / 100));
      const totalAmount = subtotal + taxAmount;

      const estimateData = {
        multiServiceLeadId: lead.id,
        estimateNumber,
        customerName: lead.name,
        customerEmail: lead.email,
        customerPhone: lead.phone,
        customerAddress: lead.address,
        businessMessage: businessMessage || "Thank you for your interest in our services. Please find the detailed estimate below.",
        services,
        subtotal: lead.totalPrice,
        taxAmount,
        discountAmount,
        totalAmount,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "draft"
      };

      const estimate = await storage.createEstimate(estimateData);
      res.status(201).json(estimate);
    } catch (error) {
      console.error('Error creating estimate from multi-service lead:', error);
      res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  // Email Settings API routes
  app.get("/api/email-settings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      let emailSettings = await storage.getEmailSettings(userId);
      
      // Create default settings if none exist
      if (!emailSettings) {
        emailSettings = await storage.createEmailSettings({
          userId,
          notifications: {
            newLeads: true,
            estimateRequests: true,
            appointmentBookings: true,
            systemUpdates: false,
            weeklyReports: true,
          }
        });
      }

      res.json(emailSettings);
    } catch (error) {
      console.error('Error getting email settings:', error);
      res.status(500).json({ message: "Failed to get email settings" });
    }
  });

  app.put("/api/email-settings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const updatedSettings = await storage.updateEmailSettings(userId, req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating email settings:', error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  // Email Templates API routes
  app.get("/api/email-templates", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const templates = await storage.getEmailTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error('Error getting email templates:', error);
      res.status(500).json({ message: "Failed to get email templates" });
    }
  });

  app.post("/api/email-templates", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const template = await storage.createEmailTemplate({
        ...req.body,
        userId
      });
      res.json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.put("/api/email-templates/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateEmailTemplate(parseInt(id), req.body);
      res.json(template);
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.delete("/api/email-templates/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteEmailTemplate(parseInt(id));
      res.json({ success });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  // Email statistics endpoint
  app.get("/api/email-stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const stats = await storage.getEmailSendStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error getting email statistics:', error);
      res.status(500).json({ message: "Failed to get email statistics" });
    }
  });

  // BidRequest API routes
  app.post("/api/bids", async (req, res) => {
    try {
      // Manually create bid request data to avoid Zod type inference issues
      const bidRequestData = {
        businessOwnerId: req.body.businessOwnerId,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone || null,
        address: req.body.address || null,
        streetViewUrl: req.body.streetViewUrl || null,
        autoPrice: req.body.autoPrice,
        finalPrice: req.body.finalPrice || null,
        bidStatus: req.body.bidStatus || "pending",
        emailSubject: req.body.emailSubject || null,
        emailBody: req.body.emailBody || null,
        pdfText: req.body.pdfText || null,
        attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
        magicToken: req.body.magicToken || null,
        tokenExpiresAt: req.body.tokenExpiresAt ? new Date(req.body.tokenExpiresAt) : null,
        emailOpened: req.body.emailOpened || false,
        leadId: req.body.leadId || null,
        multiServiceLeadId: req.body.multiServiceLeadId || null,
        services: Array.isArray(req.body.services) ? req.body.services : []
      };
      
      const bidRequest = await storage.createBidRequest(bidRequestData as any);
      res.status(201).json(bidRequest);
    } catch (error) {
      console.error('Error creating bid request:', error);
      console.error('Request data if available:', JSON.stringify(req.body, null, 2));
      res.status(500).json({ message: "Failed to create bid request" });
    }
  });

  app.get("/api/bids", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const bidRequests = await storage.getBidRequestsByBusinessOwner(userId);
      res.json(bidRequests);
    } catch (error) {
      console.error('Error getting bid requests:', error);
      res.status(500).json({ message: "Failed to get bid requests" });
    }
  });

  app.get("/api/bids/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.query;
      
      let bidRequest;
      if (token && typeof token === 'string') {
        // Magic link access - verify token first
        bidRequest = await storage.getBidRequestByToken(token);
        if (!bidRequest || bidRequest.id !== parseInt(id)) {
          return res.status(401).json({ message: "Invalid or expired token" });
        }
        
        // Check if token is expired
        if (bidRequest.tokenExpiresAt && new Date() > bidRequest.tokenExpiresAt) {
          return res.status(401).json({ message: "Token has expired" });
        }
      } else {
        // Regular authenticated access
        bidRequest = await storage.getBidRequest(parseInt(id));
        if (!bidRequest) {
          return res.status(404).json({ message: "Bid request not found" });
        }
      }
      
      res.json(bidRequest);
    } catch (error) {
      console.error('Error getting bid request:', error);
      res.status(500).json({ message: "Failed to get bid request" });
    }
  });

  // API endpoint for customer bid response page to get bid request by token
  app.get("/api/verify-bid/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Get bid request by magic token
      const bidRequest = await storage.getBidRequestByToken(token);
      
      if (!bidRequest) {
        return res.status(404).json({ message: "Bid request not found or invalid token" });
      }
      
      // Check if token is expired
      if (bidRequest.tokenExpiresAt && new Date() > bidRequest.tokenExpiresAt) {
        return res.status(401).json({ message: "Token has expired" });
      }
      
      res.json(bidRequest);
    } catch (error) {
      console.error('Error verifying bid token:', error);
      res.status(500).json({ message: "Failed to verify bid token" });
    }
  });

  app.post("/api/bids/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const { bidStatus, finalPrice, emailSubject, emailBody, pdfText } = req.body;
      
      const bidRequest = await storage.updateBidRequest(parseInt(id), {
        bidStatus,
        finalPrice,
        emailSubject,
        emailBody,
        pdfText
      });
      
      if (!bidRequest) {
        return res.status(404).json({ message: "Bid request not found" });
      }
      
      res.json(bidRequest);
    } catch (error) {
      console.error('Error verifying bid request:', error);
      res.status(500).json({ message: "Failed to verify bid request" });
    }
  });

  app.post("/api/bids/:id/send-to-customer", async (req, res) => {
    try {
      const { id } = req.params;
      const { bidStatus, finalPrice, emailSubject, emailBody, pdfText } = req.body;
      
      // Generate a unique token for customer response
      const crypto = await import('crypto');
      const responseToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const bidRequest = await storage.updateBidRequest(parseInt(id), {
        bidStatus: bidStatus || "sent_to_customer",
        finalPrice,
        emailSubject,
        emailBody,
        pdfText,
        magicToken: responseToken,
        tokenExpiresAt
      });
      
      if (!bidRequest) {
        return res.status(404).json({ message: "Bid request not found" });
      }
      
      // Create customer response link with proper domain
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : (process.env.FRONTEND_URL || 'http://localhost:5000');
      const responseLink = `${baseUrl}/bid-response/${responseToken}`;
      
      // Get business settings for email customization
      const businessSettings = await storage.getBusinessSettingsByUserId(bidRequest.businessOwnerId);
      const businessName = businessSettings?.businessName || 'Our Business';
      const businessPhone = businessSettings?.businessPhone || '';
      const businessEmail = businessSettings?.businessEmail || '';
      
      // Try to send email notification to customer
      try {
        console.log(`Attempting to send email to: ${bidRequest.customerEmail}`);
        console.log('Bid status:', bidStatus);
        console.log('Final price (in cents):', finalPrice);
        console.log('Auto price (in cents):', bidRequest.autoPrice);
        
        let emailResult;
        
        // Check if this is a revised bid
        if (bidStatus === "revised") {
          const originalPrice = bidRequest.autoPrice / 100; // Convert cents to dollars
          const revisedPrice = finalPrice / 100; // Convert cents to dollars
          
          console.log('Sending revised bid email');
          console.log('Original price (dollars):', originalPrice);
          console.log('Revised price (dollars):', revisedPrice);
          
          emailResult = await sendRevisedBidEmail(
            bidRequest.customerEmail,
            bidRequest.customerName,
            {
              service: bidRequest.services?.[0]?.formulaName || 'Service',
              originalPrice: originalPrice,
              revisedPrice: revisedPrice,
              revisionReason: emailBody,
              businessName: businessName
            }
          );
        } else {
          // Regular bid notification
          console.log('Sending regular bid response notification');
          
          const emailParams = {
            customerName: bidRequest.customerName,
            businessName,
            businessPhone,
            businessEmail,
            serviceName: bidRequest.services?.[0]?.formulaName || 'Service',
            totalPrice: finalPrice || bidRequest.autoPrice, // Already in cents, sendBidResponseNotification will convert
            quoteMessage: emailBody,
            bidResponseLink: responseLink,
            emailSubject: emailSubject || `Your Service Quote is Ready - ${businessName}`,
            fromName: businessSettings?.businessName || 'Service Team'
          };
          
          console.log('Email parameters:', JSON.stringify(emailParams, null, 2));
          emailResult = await sendBidResponseNotification(bidRequest.customerEmail, emailParams);
        }
        
        console.log(`Email send result: ${emailResult}`);
        console.log(`Bid notification sent to ${bidRequest.customerEmail}`);
      } catch (emailError) {
        console.error('Failed to send bid response email:', emailError);
        console.error('Error details:', emailError instanceof Error ? emailError.message : String(emailError));
        console.error('Stack trace:', emailError instanceof Error ? emailError.stack : 'No stack trace available');
        // Don't fail the API call if email fails
      }
      
      res.json({ 
        bidRequest,
        responseLink,
        message: "Quote sent to customer successfully" 
      });
    } catch (error) {
      console.error('Error sending bid to customer:', error);
      res.status(500).json({ message: "Failed to send bid to customer" });
    }
  });

  app.post("/api/bids/:id/upload-attachment", async (req, res) => {
    try {
      const { id } = req.params;
      // TODO: Implement file upload logic
      // For now, return placeholder
      res.json({ message: "File upload not yet implemented" });
    } catch (error) {
      console.error('Error uploading attachment:', error);
      res.status(500).json({ message: "Failed to upload attachment" });
    }
  });

  app.get("/api/bids/:id/opened", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markEmailOpened(parseInt(id));
      
      // Return a 1x1 transparent pixel
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 
        'base64'
      );
      
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(pixel);
    } catch (error) {
      console.error('Error marking email as opened:', error);
      res.status(500).json({ message: "Failed to mark email as opened" });
    }
  });

  // Bid Response API routes
  app.post("/api/bid-responses", async (req, res) => {
    try {
      const responseData = insertBidResponseSchema.parse(req.body);
      const bidResponse = await storage.createBidResponse(responseData);
      res.status(201).json(bidResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid response data", errors: error.errors });
      }
      console.error('Error creating bid response:', error);
      res.status(500).json({ message: "Failed to create bid response" });
    }
  });

  app.get("/api/bid-responses/:bidRequestId", async (req, res) => {
    try {
      const bidRequestId = parseInt(req.params.bidRequestId);
      const responses = await storage.getBidResponsesByBidRequestId(bidRequestId);
      res.json(responses);
    } catch (error) {
      console.error('Error getting bid responses:', error);
      res.status(500).json({ message: "Failed to get bid responses" });
    }
  });

  app.patch("/api/bid-responses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedResponse = await storage.updateBidResponse(id, updateData);
      
      if (!updatedResponse) {
        return res.status(404).json({ message: "Bid response not found" });
      }
      
      res.json(updatedResponse);
    } catch (error) {
      console.error('Error updating bid response:', error);
      res.status(500).json({ message: "Failed to update bid response" });
    }
  });

  // Bid Email Template API routes
  app.get("/api/bid-email-templates", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const templates = await storage.getBidEmailTemplatesByUserId(userId);
      res.json(templates);
    } catch (error) {
      console.error('Error getting bid email templates:', error);
      res.status(500).json({ message: "Failed to get bid email templates" });
    }
  });

  app.get("/api/bid-email-templates/:type", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const templateType = req.params.type;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const template = await storage.getBidEmailTemplateByType(userId, templateType);
      res.json(template);
    } catch (error) {
      console.error('Error getting bid email template:', error);
      res.status(500).json({ message: "Failed to get bid email template" });
    }
  });

  app.post("/api/bid-email-templates", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const templateData = insertBidEmailTemplateSchema.parse({
        ...req.body,
        userId
      });
      
      const template = await storage.createBidEmailTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error('Error creating bid email template:', error);
      res.status(500).json({ message: "Failed to create bid email template" });
    }
  });

  app.put("/api/bid-email-templates/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedTemplate = await storage.updateBidEmailTemplate(id, updateData);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Bid email template not found" });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating bid email template:', error);
      res.status(500).json({ message: "Failed to update bid email template" });
    }
  });

  app.delete("/api/bid-email-templates/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBidEmailTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Bid email template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting bid email template:', error);
      res.status(500).json({ message: "Failed to delete bid email template" });
    }
  });

  // Icon management API routes
  app.get("/api/icons", async (req, res) => {
    try {
      const { category, active, tagId } = req.query;
      let icons;
      
      if (tagId && typeof tagId === 'string') {
        const tagIdParam = z.coerce.number().int().positive().safeParse(tagId);
        if (!tagIdParam.success) {
          return res.status(400).json({ message: "Invalid tag ID" });
        }
        icons = await storage.getIconsByTag(tagIdParam.data);
      } else if (category && typeof category === 'string') {
        icons = await storage.getIconsByCategory(category);
      } else if (active === 'true') {
        icons = await storage.getActiveIcons();
      } else {
        icons = await storage.getAllIcons();
      }
      
      // Transform icons to include full URL paths
      const iconsWithUrls = icons.map(icon => {
        // Check if this is an object storage icon by filename pattern
        // Object storage icons have pattern: icon-[timestamp]-[random].[ext] OR UUID.[ext]
        if (icon.filename && (icon.filename.match(/^icon-\d+-\d+\./) || icon.filename.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\./i))) {
          // This is an object storage icon
          return {
            ...icon,
            url: `/objects/icons/${icon.filename}`
          };
        } else {
          // Legacy file system icon
          return {
            ...icon,
            url: `/uploads/icons/${icon.filename}`
          };
        }
      });
      
      res.json(iconsWithUrls);
    } catch (error) {
      console.error('Error fetching icons:', error);
      res.status(500).json({ message: "Failed to fetch icons" });
    }
  });

  app.get("/api/icons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const icon = await storage.getIcon(id);
      
      if (!icon) {
        return res.status(404).json({ message: "Icon not found" });
      }
      
      // Transform icon to include proper URL path
      let iconWithUrl;
      // Check if this is an object storage icon by filename pattern
      // Object storage icons have pattern: icon-[timestamp]-[random].[ext] OR UUID.[ext]
      if (icon.filename && (icon.filename.match(/^icon-\d+-\d+\./) || icon.filename.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\./i))) {
        // This is an object storage icon
        iconWithUrl = {
          ...icon,
          url: `/objects/icons/${icon.filename}`
        };
      } else {
        // Legacy file system icon
        iconWithUrl = {
          ...icon,
          url: `/uploads/icons/${icon.filename}`
        };
      }
      
      res.json(iconWithUrl);
    } catch (error) {
      console.error('Error fetching icon:', error);
      res.status(500).json({ message: "Failed to fetch icon" });
    }
  });

  app.post("/api/icons", requireSuperAdmin, uploadIcon.single('icon'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Icon file is required" });
      }

      // Generate filename if not provided (for memory storage)
      let filename = req.file.filename;
      if (!filename) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(req.file.originalname);
        filename = `icon-${uniqueSuffix}${fileExtension}`;
      }

      // Upload to object storage
      const objectStorageService = new ObjectStorageService();
      const fileExtension = path.extname(req.file.originalname);
      
      // Get presigned URL for upload
      const { uploadUrl, objectPath } = await objectStorageService.getIconUploadURL(fileExtension);
      
      // Upload file buffer directly to object storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: req.file.buffer,
        headers: {
          'Content-Type': req.file.mimetype,
          'Content-Length': req.file.size.toString(),
        },
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed with status: ${uploadResponse.status} - ${errorText}`);
      }

      // Set ACL policy to make the icon public
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
        owner: "system",
        visibility: "public",
      });

      // Extract the actual filename from the object path (e.g., /objects/icons/uuid.png -> uuid.png)
      const objectFilename = objectPath.split('/').pop() || filename;

      const iconData = {
        name: req.body.name || req.file.originalname,
        filename: objectFilename,
        category: req.body.category || 'general',
        description: req.body.description || null,
        isActive: true
      };

      const icon = await storage.createIcon(iconData);
      
      // Return with proper object storage URL
      res.status(201).json({
        ...icon,
        url: `/objects/icons/${icon.filename}`
      });
    } catch (error) {
      console.error('Error creating icon:', error);
      res.status(500).json({ message: "Failed to create icon" });
    }
  });

  app.put("/api/icons/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, category, description, isActive } = req.body;
      
      const icon = await storage.updateIcon(id, {
        name,
        category,
        description,
        isActive
      });
      
      if (!icon) {
        return res.status(404).json({ message: "Icon not found" });
      }
      
      res.json({
        ...icon,
        url: `/uploads/icons/${icon.filename}`
      });
    } catch (error) {
      console.error('Error updating icon:', error);
      res.status(500).json({ message: "Failed to update icon" });
    }
  });

  app.delete("/api/icons/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const icon = await storage.getIcon(id);
      
      if (!icon) {
        return res.status(404).json({ message: "Icon not found" });
      }
      
      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'uploads/icons', icon.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      const success = await storage.deleteIcon(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete icon from database" });
      }
      
      res.json({ message: "Icon deleted successfully" });
    } catch (error) {
      console.error('Error deleting icon:', error);
      res.status(500).json({ message: "Failed to delete icon" });
    }
  });

  // Icon Tag Management API Routes
  app.get("/api/icon-tags", async (req, res) => {
    try {
      const { active } = req.query;
      let tags;
      
      if (active === 'true') {
        tags = await storage.getActiveIconTags();
      } else {
        tags = await storage.getAllIconTags();
      }
      
      res.json(tags);
    } catch (error) {
      console.error('Error fetching icon tags:', error);
      res.status(500).json({ message: "Failed to fetch icon tags" });
    }
  });

  app.post("/api/icon-tags", requireSuperAdmin, async (req, res) => {
    try {
      const validation = insertIconTagSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid tag data", 
          errors: validation.error.errors 
        });
      }

      const tagData = {
        ...validation.data,
        createdBy: req.user!.id
      };

      const tag = await storage.createIconTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      console.error('Error creating icon tag:', error);
      res.status(500).json({ message: "Failed to create icon tag" });
    }
  });

  app.put("/api/icon-tags/:id", requireSuperAdmin, async (req, res) => {
    try {
      const idParam = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!idParam.success) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      const id = idParam.data;
      const validation = insertIconTagSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid tag data", 
          errors: validation.error.errors 
        });
      }

      const tag = await storage.updateIconTag(id, validation.data);
      
      if (!tag) {
        return res.status(404).json({ message: "Icon tag not found" });
      }
      
      res.json(tag);
    } catch (error) {
      console.error('Error updating icon tag:', error);
      res.status(500).json({ message: "Failed to update icon tag" });
    }
  });

  app.delete("/api/icon-tags/:id", requireSuperAdmin, async (req, res) => {
    try {
      const idParam = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!idParam.success) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      const id = idParam.data;
      const success = await storage.deleteIconTag(id);
      
      if (!success) {
        return res.status(404).json({ message: "Icon tag not found" });
      }
      
      res.json({ message: "Icon tag deleted successfully" });
    } catch (error) {
      console.error('Error deleting icon tag:', error);
      res.status(500).json({ message: "Failed to delete icon tag" });
    }
  });

  app.post("/api/icons/:iconId/tags/:tagId", requireSuperAdmin, async (req, res) => {
    try {
      const iconIdParam = z.coerce.number().int().positive().safeParse(req.params.iconId);
      const tagIdParam = z.coerce.number().int().positive().safeParse(req.params.tagId);
      
      if (!iconIdParam.success) {
        return res.status(400).json({ message: "Invalid icon ID" });
      }
      if (!tagIdParam.success) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      const iconId = iconIdParam.data;
      const tagId = tagIdParam.data;
      
      // Check if icon exists
      const icon = await storage.getIcon(iconId);
      if (!icon) {
        return res.status(404).json({ message: "Icon not found" });
      }
      
      // Check if tag exists
      const tags = await storage.getAllIconTags();
      const tag = tags.find(t => t.id === tagId);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      const assignment = await storage.assignTagToIcon(iconId, tagId, req.user!.id);
      res.status(201).json(assignment);
    } catch (error: any) {
      console.error('Error assigning tag to icon:', error);
      // Handle duplicate assignment
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        return res.status(409).json({ message: "Tag already assigned to this icon" });
      }
      res.status(500).json({ message: "Failed to assign tag to icon" });
    }
  });

  app.delete("/api/icons/:iconId/tags/:tagId", requireSuperAdmin, async (req, res) => {
    try {
      const iconIdParam = z.coerce.number().int().positive().safeParse(req.params.iconId);
      const tagIdParam = z.coerce.number().int().positive().safeParse(req.params.tagId);
      
      if (!iconIdParam.success) {
        return res.status(400).json({ message: "Invalid icon ID" });
      }
      if (!tagIdParam.success) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      const iconId = iconIdParam.data;
      const tagId = tagIdParam.data;
      
      // Check if icon exists
      const icon = await storage.getIcon(iconId);
      if (!icon) {
        return res.status(404).json({ message: "Icon not found" });
      }
      
      // Check if tag exists
      const tags = await storage.getAllIconTags();
      const tag = tags.find(t => t.id === tagId);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      const success = await storage.removeTagFromIcon(iconId, tagId);
      
      if (!success) {
        return res.status(404).json({ message: "Tag assignment not found" });
      }
      
      res.json({ message: "Tag removed from icon successfully" });
    } catch (error) {
      console.error('Error removing tag from icon:', error);
      res.status(500).json({ message: "Failed to remove tag from icon" });
    }
  });

  app.get("/api/icons/:iconId/tags", async (req, res) => {
    try {
      const iconIdParam = z.coerce.number().int().positive().safeParse(req.params.iconId);
      
      if (!iconIdParam.success) {
        return res.status(400).json({ message: "Invalid icon ID" });
      }
      
      const iconId = iconIdParam.data;
      
      // Check if icon exists
      const icon = await storage.getIcon(iconId);
      if (!icon) {
        return res.status(404).json({ message: "Icon not found" });
      }
      
      const tags = await storage.getTagsForIcon(iconId);
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags for icon:', error);
      res.status(500).json({ message: "Failed to fetch tags for icon" });
    }
  });

  app.get("/api/icon-tags/:tagId/icons", async (req, res) => {
    try {
      const tagIdParam = z.coerce.number().int().positive().safeParse(req.params.tagId);
      
      if (!tagIdParam.success) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      const tagId = tagIdParam.data;
      
      // Check if tag exists
      const tags = await storage.getAllIconTags();
      const tag = tags.find(t => t.id === tagId);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      const icons = await storage.getIconsByTag(tagId);
      
      // Transform icons to include full URL paths
      const iconsWithUrls = icons.map(icon => ({
        ...icon,
        url: `/uploads/icons/${icon.filename}`
      }));
      
      res.json(iconsWithUrls);
    } catch (error) {
      console.error('Error fetching icons for tag:', error);
      res.status(500).json({ message: "Failed to fetch icons for tag" });
    }
  });

  // Test Stripe integration endpoint
  app.get("/api/test-stripe", async (req, res) => {
    try {
      // Test 1: Check if Stripe is properly initialized
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ 
          success: false, 
          error: "STRIPE_SECRET_KEY environment variable not set" 
        });
      }

      // Test 2: Try to create a simple product (this tests API connectivity)
      const testProduct = await stripe.products.create({
        name: 'Test Product - Delete Me',
        description: 'This is a test product to verify Stripe integration'
      });

      // Test 3: Clean up the test product
      await stripe.products.del(testProduct.id);

      // Test 4: Check business settings for Stripe config
      const businessSettings = await storage.getBusinessSettings();
      const hasStripeConfig = !!businessSettings?.stripeConfig;

      res.json({
        success: true,
        message: "Stripe integration is working correctly",
        tests: {
          apiKey: "✅ Stripe API key is set",
          connectivity: "✅ Can communicate with Stripe API",
          productCreation: "✅ Can create and delete products",
          businessConfig: hasStripeConfig ? "✅ Stripe price IDs configured" : "⚠️ No price IDs configured (will use dynamic pricing)"
        },
        stripeConfig: businessSettings?.stripeConfig || "Not configured"
      });
    } catch (error) {
      console.error('Stripe test error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Stripe integration test failed"
      });
    }
  });

  // Test payment endpoint
  app.post("/api/test-payment", async (req, res) => {
    try {
      const { email = 'test@example.com', amount = 1000 } = req.body; // $10.00 default

      // Create a test payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Amount in cents
        currency: 'usd',
        metadata: {
          test: 'true',
          description: 'Test payment to verify Stripe integration'
        },
        description: 'Test payment - PriceBuilder Pro Stripe Integration Test'
      });

      res.json({
        success: true,
        message: "Test payment intent created successfully",
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret
        }
      });
    } catch (error) {
      console.error('Test payment error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Test payment creation failed"
      });
    }
  });

  // Test email endpoint for debugging
  app.post("/api/test-email", async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      console.log('Sending test email to:', to || 'shielnev11@gmail.com');
      
      const success = await sendEmailWithFallback({
        to: to || 'shielnev11@gmail.com',
        subject: subject || 'Test Email from PriceBuilder Pro',
        html: `<p>${message || 'This is a test email to verify email integration is working.'}</p>`
      });
      
      if (success) {
        console.log('Test email sent successfully');
        res.json({ message: "Test email sent successfully", to: to || 'shielnev11@gmail.com', subject });
      } else {
        console.log('Failed to send test email');
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: "Error sending test email", error: error.message });
    }
  });

  // Simulate webhook manually for testing purposes
  app.post("/api/simulate-webhook", requireAuth, async (req, res) => {
    try {
      const { planId, billingPeriod } = req.body;
      const user = (req as any).currentUser;

      console.log('Simulating webhook for subscription activation:', { 
        userId: user?.id,
        planId, 
        billingPeriod 
      });

      // Simply update the user's subscription status as if webhook was called
      await storage.updateUser(user.id, {
        stripeCustomerId: `cus_test_${user.id}`,
        stripeSubscriptionId: `sub_test_${user.id}`,
        subscriptionStatus: 'active',
        plan: planId as 'standard' | 'plus' | 'plus_seo',
        billingPeriod: billingPeriod as 'monthly' | 'yearly'
      });

      console.log('Webhook simulation completed - subscription activated');
      res.json({ 
        success: true, 
        message: "Subscription activated via webhook simulation" 
      });
    } catch (error) {
      console.error('Error simulating webhook:', error);
      res.status(500).json({ message: "Failed to simulate webhook", error: error.message });
    }
  });

  // Upgrade/downgrade subscription
  app.post("/api/change-subscription", requireAuth, async (req, res) => {
    try {
      const { newPlanId, newBillingPeriod } = req.body;
      const sessionUser = (req as any).currentUser;

      if (!newPlanId || !newBillingPeriod) {
        return res.status(400).json({ message: "Plan ID and billing period are required" });
      }

      // Refresh user data to get latest subscription info
      const user = await storage.getUserById(sessionUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle test subscriptions
      if (user.stripeSubscriptionId?.startsWith('sub_test_')) {
        await storage.updateUser(user.id, {
          plan: newPlanId as 'standard' | 'plus' | 'plus_seo',
          billingPeriod: newBillingPeriod as 'monthly' | 'yearly'
        });

        console.log('Test subscription changed for user:', user.id);
        return res.json({ 
          success: true, 
          message: "Subscription updated successfully" 
        });
      }

      // Debug logging
      console.log('Change subscription request for user:', user.id);
      console.log('User stripeSubscriptionId:', user.stripeSubscriptionId);
      console.log('User plan:', user.plan);
      console.log('User billingPeriod:', user.billingPeriod);

      // For fresh test environment, don't reconnect to old subscriptions
      let activeStripeSubscription = null;

      // Handle trial users upgrading to paid plans  
      if (!user.stripeSubscriptionId && !activeStripeSubscription) {
        console.log('No stripeSubscriptionId found for user:', user.id, '- redirecting to checkout');
        
        // Get current user record to check for existing Stripe customer
        const currentUser = await storage.getUserById(user.id);
        let customerId = currentUser?.stripeCustomerId;

        // Create or retrieve Stripe customer (force new customer for fresh test environment)
        if (!customerId) {
          // For fresh test environment, always create new customer instead of searching old ones
          console.log('Creating new Stripe customer for fresh test environment');
          const customer = await stripe.customers.create({
            email: user.email,
            name: currentUser?.firstName && currentUser?.lastName 
              ? `${currentUser.firstName} ${currentUser.lastName}` 
              : undefined,
            metadata: {
              userId: user.id
            }
          });
          customerId = customer.id;
          console.log('Created new Stripe customer:', customerId);

          // Update user record with Stripe customer ID
          await storage.updateUser(user.id, {
            stripeCustomerId: customerId
          });
        }

        // Use dynamic pricing approach since we might not have all Price IDs configured
        const planPrices: Record<string, { monthly: number; yearly: number }> = {
          'standard': { monthly: 4900, yearly: Math.round(4900 * 12 * 0.83) }, // ~17% discount
          'plus': { monthly: 9700, yearly: Math.round(9700 * 12 * 0.83) }, // ~17% discount
          'plus_seo': { monthly: 29700, yearly: Math.round(29700 * 12 * 0.83) } // ~17% discount
        };

        const prices = planPrices[newPlanId];
        if (!prices) {
          return res.status(400).json({ message: "Invalid plan selected" });
        }

        const amount = newBillingPeriod === 'yearly' ? prices.yearly : prices.monthly;
        const interval = newBillingPeriod === 'yearly' ? 'year' : 'month';

        // Create checkout session with dynamic pricing
        const checkoutSession = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Autobidder ${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} Plan`,
              },
              unit_amount: amount,
              recurring: {
                interval: interval as 'month' | 'year',
              },
            },
            quantity: 1,
          }],
          mode: 'subscription',
          success_url: `${req.protocol}://${req.get('host')}/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.protocol}://${req.get('host')}/profile?payment=cancelled`,
          metadata: {
            userId: user.id,
            planId: newPlanId,
            billingPeriod: newBillingPeriod
          }
        });

        console.log('Checkout session created for trial upgrade:', checkoutSession.id, 'URL:', checkoutSession.url);

        return res.json({
          success: true,
          requiresPayment: true,
          checkoutUrl: checkoutSession.url,
          message: "Redirecting to payment checkout"
        });
      }

      // Get current subscription (use the active subscription we found or the stored one)
      const subscriptionId = activeStripeSubscription?.id || user.stripeSubscriptionId;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId!);
      
      // Always use dynamic pricing to ensure we're using fresh test environment
      console.log('Creating dynamic price for clean test environment:', newPlanId, newBillingPeriod);
      
      const planPricing: Record<string, { monthly: number; yearly: number }> = {
        'standard': { monthly: 4900, yearly: Math.round(4900 * 12 * 0.83) }, // ~17% discount
        'plus': { monthly: 9700, yearly: Math.round(9700 * 12 * 0.83) }, // ~17% discount
        'plus_seo': { monthly: 29700, yearly: Math.round(29700 * 12 * 0.83) } // ~17% discount
      };

      const prices = planPricing[newPlanId];
      if (!prices) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const amount = newBillingPeriod === 'yearly' ? prices.yearly : prices.monthly;
      const interval = newBillingPeriod === 'yearly' ? 'year' : 'month';

      // Create a new price for this plan
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: amount,
        recurring: {
          interval: interval,
        },
        product_data: {
          name: `Autobidder ${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} Plan`,
        },
      });
      
      const newPriceId = price.id;
      console.log('Created dynamic price:', newPriceId, 'for amount:', amount);

      // Determine if this is an upgrade or downgrade
      const currentAmount = subscription.items.data[0].price.unit_amount || 0;
      const newAmount = amount; // Use the same amount we already calculated
      const isDowngrade = newAmount < currentAmount;
      
      console.log('Plan change detection:', {
        currentAmount: currentAmount / 100,
        newAmount: newAmount / 100,
        isDowngrade
      });

      // Handle downgrades differently - schedule for next billing period
      if (isDowngrade) {
        res.json({
          success: true,
          requiresConfirmation: true,
          isDowngrade: true,
          preview: {
            currentPlan: user.plan,
            newPlan: newPlanId,
            currentAmount: currentAmount / 100,
            newAmount: newAmount / 100,
            prorationAmount: 0, // No immediate charge for downgrades
            nextBillingDate: subscription.items.data[0]?.current_period_end || subscription.billing_cycle_anchor,
            currency: 'USD'
          },
          message: `Your plan will be downgraded to ${newPlanId} at the end of your current billing period${subscription.items.data[0]?.current_period_end ? ` (${new Date(subscription.items.data[0].current_period_end * 1000).toLocaleDateString()})` : ''}. You'll keep all current features until then.`
        });
      } else {
        // Handle upgrades with immediate proration
        try {
          // Use modern Stripe API approach: retrieve upcoming invoice to preview proration
          const upcomingInvoice = await stripe.invoices.upcoming({
            customer: subscription.customer as string,
            subscription: subscription.id,
            subscription_items: [{
              id: subscription.items.data[0].id,
              price: newPriceId,
            }],
          });

          console.log('Proration preview retrieved successfully:', {
            total: upcomingInvoice.total,
            lines: upcomingInvoice.lines.data.length
          });

          // Calculate proration details
          const prorationAmount = upcomingInvoice.total;
          
          console.log('Upgrade proration preview:', {
            currentAmount: currentAmount / 100,
            newAmount: newAmount / 100,
            prorationTotal: prorationAmount / 100
          });

          res.json({
            success: true,
            requiresConfirmation: true,
            isDowngrade: false,
            preview: {
              currentPlan: user.plan,
              newPlan: newPlanId,
              currentAmount: currentAmount / 100,
              newAmount: newAmount / 100,
              prorationAmount: prorationAmount / 100,
              nextBillingDate: upcomingInvoice.next_payment_attempt ? new Date(upcomingInvoice.next_payment_attempt * 1000) : new Date(),
              currency: 'USD'
            },
            message: `Your plan will be upgraded immediately and you'll be charged $${Math.abs(prorationAmount / 100).toFixed(2)} prorated for the remaining billing period.`
          });
        } catch (previewError) {
          console.error('Error generating upgrade proration preview:', previewError);
          console.error('Full error details:', JSON.stringify(previewError, null, 2));
          
          // Try an alternative approach: calculate proration manually based on subscription timing
          const currentPeriodStart = subscription.current_period_start;
          const currentPeriodEnd = subscription.current_period_end;
          const currentTime = Math.floor(Date.now() / 1000);
          
          let remainingRatio = 1.0; // Default to full amount if we can't determine period
          if (currentPeriodStart && currentPeriodEnd) {
            const totalPeriodLength = currentPeriodEnd - currentPeriodStart;
            const timeRemaining = Math.max(0, currentPeriodEnd - currentTime);
            remainingRatio = Math.min(1, Math.max(0, timeRemaining / totalPeriodLength));
          }
          
          // For upgrades: calculate the remaining value of the billing period
          // User pays the difference prorated for the time remaining
          const priceDifference = newAmount - currentAmount;
          const estimatedProration = Math.max(0, Math.round(priceDifference * remainingRatio));

          console.log('Manual proration calculation (updated for accurate billing):', {
            currentAmount: currentAmount / 100,
            newAmount: newAmount / 100,
            priceDifference: priceDifference / 100,
            remainingRatio: remainingRatio.toFixed(3),
            estimatedProration: estimatedProration / 100,
            periodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : 'unknown',
            periodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : 'unknown',
            currentTime: new Date(currentTime * 1000),
            daysRemaining: currentPeriodEnd ? Math.ceil((currentPeriodEnd - currentTime) / 86400) : 'unknown'
          });
          
          res.json({
            success: true,
            requiresConfirmation: true,
            isDowngrade: false,
            preview: {
              currentPlan: user.plan,
              newPlan: newPlanId,
              currentAmount: currentAmount / 100,
              newAmount: newAmount / 100,
              prorationAmount: estimatedProration / 100,
              nextBillingDate: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
              currency: 'USD'
            },
            message: `Your plan will be upgraded immediately and you'll be charged approximately $${Math.abs(estimatedProration / 100).toFixed(2)} prorated for the remaining billing period. The exact amount will be calculated by Stripe.`
          });
        }
      }
    } catch (error) {
      console.error('Error changing subscription:', error);
      res.status(500).json({ message: "Failed to change subscription", error: error.message });
    }
  });

  // Confirm subscription change (execute the actual upgrade after preview)
  app.post("/api/confirm-subscription-change", requireAuth, async (req, res) => {
    try {
      const { newPlanId, newBillingPeriod } = req.body;
      const sessionUser = (req as any).currentUser;

      if (!newPlanId || !newBillingPeriod) {
        return res.status(400).json({ message: "Plan ID and billing period are required" });
      }

      // Refresh user data to get latest subscription info
      const user = await storage.getUserById(sessionUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has active subscription in Stripe
      let activeStripeSubscription = null;
      if (user.stripeCustomerId) {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
          limit: 1
        });
        if (subscriptions.data.length > 0) {
          activeStripeSubscription = subscriptions.data[0];
        }
      }

      const subscriptionId = activeStripeSubscription?.id || user.stripeSubscriptionId;
      if (!subscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Determine if this is an upgrade or downgrade
      const currentAmount = subscription.items.data[0].price.unit_amount || 0;
      
      // Get pricing info for new plan to compare
      const planPricing: Record<string, { monthly: number; yearly: number }> = {
        'standard': { monthly: 4900, yearly: Math.round(4900 * 12 * 0.83) },
        'plus': { monthly: 9700, yearly: Math.round(9700 * 12 * 0.83) },
        'plus_seo': { monthly: 29700, yearly: Math.round(29700 * 12 * 0.83) }
      };
      
      const newPlanPricing = planPricing[newPlanId];
      if (!newPlanPricing) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }
      
      const newAmount = newBillingPeriod === 'yearly' ? newPlanPricing.yearly : newPlanPricing.monthly;
      const isDowngrade = newAmount < currentAmount;
      
      console.log('Confirmation - Plan change detection:', {
        currentAmount: currentAmount / 100,
        newAmount: newAmount / 100,
        isDowngrade
      });

      // Create dynamic price for plan change (Customer Portal handles pricing automatically)
      {
        const planPricing: Record<string, { monthly: number; yearly: number }> = {
          'standard': { monthly: 4900, yearly: Math.round(4900 * 12 * 0.83) },
          'plus': { monthly: 9700, yearly: Math.round(9700 * 12 * 0.83) },
          'plus_seo': { monthly: 29700, yearly: Math.round(29700 * 12 * 0.83) }
        };

        const prices = planPricing[newPlanId];
        const amount = newBillingPeriod === 'yearly' ? prices.yearly : prices.monthly;
        const interval = newBillingPeriod === 'yearly' ? 'year' : 'month';

        const price = await stripe.prices.create({
          currency: 'usd',
          unit_amount: amount,
          recurring: { interval: interval },
          product_data: {
            name: `Autobidder ${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} Plan`,
            description: `${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} subscription - ${newBillingPeriod}`,
          },
        });
        
        newPriceId = price.id;
      }

      // Handle downgrades vs upgrades differently
      if (isDowngrade) {
        // Schedule downgrade at period end - user keeps current features until then
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: subscription.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: 'none', // No immediate proration
          billing_cycle_anchor: 'unchanged', // Keep current billing cycle
        });

        // Store the scheduled downgrade in metadata
        await stripe.subscriptions.update(subscriptionId, {
          metadata: {
            scheduled_downgrade: 'true',
            scheduled_plan: newPlanId,
            scheduled_billing: newBillingPeriod,
            scheduled_date: subscription.current_period_end?.toString() || '0'
          }
        });

        // Don't update the user's plan in database yet - they keep current plan until period end
        console.log('Downgrade scheduled at period end for user:', user.id, 'effective:', subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : 'unknown');
        
        res.json({ 
          success: true,
          message: `Downgrade scheduled successfully. Your plan will change to ${newPlanId} on ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : 'next billing cycle'} and you'll keep all current features until then.`,
          isDowngrade: true,
          effectiveDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
        });
      } else {
        // Execute immediate upgrade with proration
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: subscription.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: 'create_prorations', // Immediate proration for upgrades
          billing_cycle_anchor: 'unchanged' // Preserve existing billing cycle
        });

        console.log('Upgrade executed with subscription update:', {
          subscriptionId: updatedSubscription.id,
          newPriceId,
          prorationBehavior: 'create_prorations',
          status: updatedSubscription.status
        });

        // Wait briefly for Stripe to process the subscription change
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for created invoice (proration should create one) and ensure it's processed
        try {
          // First check for any recent invoices (including draft/open)
          const allInvoices = await stripe.invoices.list({
            subscription: subscriptionId,
            limit: 5,
            created: {
              gte: Math.floor(Date.now() / 1000) - 300 // Last 5 minutes
            }
          });
          
          console.log('Recent invoices for subscription:', allInvoices.data.map(inv => ({
            id: inv.id,
            status: inv.status,
            amount: inv.total / 100,
            created: new Date(inv.created * 1000),
            billing_reason: inv.billing_reason
          })));
          
          // Look for draft or open invoices to finalize, prioritizing proration invoices
          const prorationInvoices = allInvoices.data.filter(inv => 
            inv.billing_reason === 'subscription_update' || 
            (inv.status === 'draft' || inv.status === 'open')
          );
          
          for (const invoice of prorationInvoices) {
            if (invoice.status === 'draft' || invoice.status === 'open') {
              console.log('Found pending proration invoice, attempting to finalize and pay:', {
                invoiceId: invoice.id,
                status: invoice.status,
                amount: invoice.total / 100,
                billingReason: invoice.billing_reason
              });
              
              // Finalize the invoice if it's in draft
              if (invoice.status === 'draft') {
                await stripe.invoices.finalizeInvoice(invoice.id);
                console.log('Proration invoice finalized:', invoice.id);
              }
              
              // Pay the invoice immediately
              const paidInvoice = await stripe.invoices.pay(invoice.id);
              console.log('Proration invoice paid successfully:', {
                invoiceId: paidInvoice.id,
                amountPaid: paidInvoice.amount_paid / 100,
                status: paidInvoice.status
              });
              break;
            }
          }
          
          // Check if there are already paid proration invoices
          const paidProrationInvoice = allInvoices.data.find(inv => 
            inv.status === 'paid' && inv.billing_reason === 'subscription_update'
          );
          
          if (paidProrationInvoice) {
            console.log('Proration invoice already processed:', {
              invoiceId: paidProrationInvoice.id,
              amount: paidProrationInvoice.amount_paid / 100,
              status: paidProrationInvoice.status,
              billingReason: paidProrationInvoice.billing_reason
            });
          } else if (prorationInvoices.length === 0) {
            console.log('No proration invoice found - upgrade may have been free or no proration needed');
          }
        } catch (invoiceError) {
          console.error('Could not process proration invoice:', invoiceError.message);
        }

        // Update user's plan in database immediately for upgrades
        await storage.updateUser(user.id, {
          plan: newPlanId as 'standard' | 'plus' | 'plus_seo',
          billingPeriod: newBillingPeriod as 'monthly' | 'yearly'
        });

        console.log('Upgrade executed immediately with proration for user:', user.id);
        
        res.json({ 
          success: true,
          message: "Plan upgraded successfully with proration applied",
          isDowngrade: false,
          subscription: updatedSubscription 
        });
      }

    } catch (error) {
      console.error('Error confirming subscription change:', error);
      res.status(500).json({ message: "Failed to update subscription", error: error.message });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", requireAuth, async (req, res) => {
    try {
      const user = (req as any).currentUser;

      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Handle test subscriptions
      if (user.stripeSubscriptionId.startsWith('sub_test_')) {
        await storage.updateUser(user.id, {
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null
        });

        return res.json({ 
          success: true, 
          message: "Test subscription canceled" 
        });
      }

      // Cancel at period end (don't immediately cancel)
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      console.log('Subscription set to cancel for user:', user.id);
      res.json({ 
        success: true,
        message: "Subscription will be canceled at the end of current billing period",
        cancelAtPeriodEnd: subscription.cancel_at_period_end 
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ message: "Failed to cancel subscription", error: error.message });
    }
  });

  // Endpoint to get recent checkout sessions for webhook setup
  app.get("/api/recent-checkout-sessions", requireAuth, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const { stripe } = await import('./stripe');

      // Get recent checkout sessions
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
        expand: ['data.customer']
      });

      // Filter sessions by user email
      const userSessions = sessions.data.filter(session => 
        session.customer_email === user.email || 
        (session.customer && typeof session.customer === 'object' && session.customer.email === user.email)
      );

      res.json({ 
        sessions: userSessions.map(session => ({
          id: session.id,
          status: session.status,
          customer: session.customer,
          subscription: session.subscription,
          metadata: session.metadata,
          created: session.created
        }))
      });
    } catch (error) {
      console.error('Error getting checkout sessions:', error);
      res.status(500).json({ message: "Failed to get checkout sessions", error: error.message });
    }
  });



  // Get user profile with trial status for upgrade page
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      
      // Calculate trial status
      let trialStatus = {
        isOnTrial: false,
        daysLeft: 0,
        expired: false,
        trialEndDate: null as string | null
      };

      if (user.subscriptionStatus === 'trialing' || user.plan === 'trial') {
        trialStatus.isOnTrial = true;
        if (user.trialEndDate) {
          const trialEnd = new Date(user.trialEndDate);
          const now = new Date();
          const diffTime = trialEnd.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          trialStatus.daysLeft = Math.max(0, diffDays);
          trialStatus.expired = diffDays <= 0;
          trialStatus.trialEndDate = user.trialEndDate;
        }
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          trialUsed: user.trialUsed
        },
        trialStatus
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Stripe checkout session for plan upgrades
  app.post("/api/create-checkout-session", requireAuth, async (req, res) => {
    try {
      const { planId, billingPeriod, couponCode } = req.body;
      const user = (req as any).currentUser;

      console.log('Creating checkout session:', { 
        planId, 
        billingPeriod, 
        userId: user?.id,
        userEmail: user?.email
      });

      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!planId || !billingPeriod) {
        return res.status(400).json({ message: "Plan ID and billing period are required" });
      }

      // Check if user is on trial or can upgrade
      if (user?.subscriptionStatus === 'active') {
        return res.status(400).json({ message: "You already have an active subscription. Use billing portal to change plans." });
      }

      // Map plan IDs to match Stripe configuration
      const planMapping: Record<string, string> = {
        'standard': 'standard',
        'plus': 'plus', 
        'plus_seo': 'plus_seo',
        'plusSeo': 'plus_seo'  // Map frontend camelCase to backend underscore
      };

      const mappedPlanId = planMapping[planId] || planId;

      // Create Stripe checkout session directly
      const { stripe } = await import('./stripe');
      
      // Define plan prices (in cents) - using actual Stripe yearly prices
      const planPrices: Record<string, { monthly: number; yearly: number }> = {
        'standard': { monthly: 4900, yearly: 49700 }, // $49/$497
        'plus': { monthly: 9700, yearly: 97000 }, // $97/$970  
        'plus_seo': { monthly: 29700, yearly: 297000 } // $297/$2970
      };

      const prices = planPrices[mappedPlanId];
      if (!prices) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const amount = billingPeriod === 'yearly' ? prices.yearly : prices.monthly;
      const interval = billingPeriod === 'yearly' ? 'year' : 'month';

      // Get current user record to check for existing Stripe customer
      const currentUser = await storage.getUserById(user.id);
      let customerId = currentUser?.stripeCustomerId;

      // Create or retrieve Stripe customer
      if (!customerId) {
        // Check if customer already exists in Stripe by email
        const existingCustomers = await stripe.customers.list({
          email: user.email,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
          console.log('Found existing Stripe customer:', customerId);
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: user.email,
            name: currentUser?.firstName && currentUser?.lastName 
              ? `${currentUser.firstName} ${currentUser.lastName}` 
              : undefined,
            metadata: {
              userId: user.id
            }
          });
          customerId = customer.id;
          console.log('Created new Stripe customer:', customerId);
        }

        // Update user record with Stripe customer ID
        await storage.updateUser(user.id, {
          stripeCustomerId: customerId
        });
      }

      // Get predefined Price IDs to avoid creating duplicate products
      const priceIds: Record<string, { monthly: string; yearly: string }> = {
        'standard': { 
          monthly: 'price_1RpbIEPtLtROj9IoD0DDo3DF', 
          yearly: 'price_1RpbklPtLtROj9IoodMM26Qr' 
        },
        'plus': { 
          monthly: 'price_1RpbRBPtLtROj9Ioxq2JXLN4', 
          yearly: 'price_1Rpbn5PtLtROj9IoLYcqH68f' 
        },
        'plus_seo': { 
          monthly: 'price_1RpbSAPtLtROj9IoX8G8LCYY', 
          yearly: 'price_1RpbruPtLtROj9Ioh17yebmu' 
        }
      };

      const priceId = priceIds[mappedPlanId]?.[billingPeriod];
      if (!priceId) {
        return res.status(400).json({ message: "Price ID not found for the selected plan" });
      }

      const sessionConfig: any = {
        customer: customerId, // Use customer ID instead of customer_email
        payment_method_types: ['card'],
        line_items: [{
          price: priceId, // Use predefined Price ID instead of creating new products
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/upgrade?canceled=true`,
        allow_promotion_codes: true, // Allow customers to enter promo codes
        metadata: {
          userId: user?.id || '',
          planId: mappedPlanId,
          billingPeriod: billingPeriod
        },
      };

      // Apply coupon if provided
      if (couponCode) {
        try {
          // Validate coupon exists and is active
          const coupon = await stripe.coupons.retrieve(couponCode);
          sessionConfig.discounts = [{ coupon: couponCode }];
          console.log(`Applied coupon ${couponCode} (${coupon.percent_off}% off) to checkout session`);
        } catch (error) {
          console.warn(`Invalid coupon code ${couponCode}:`, (error as Error).message);
          // Continue without discount rather than failing
        }
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      console.log('Stripe session created successfully:', session.id);
      res.json({ url: session.url });
    } catch (error) {
      console.error('Checkout session error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Manual subscription sync endpoint (for debugging webhook issues)
  app.post("/api/sync-subscription", requireAuth, async (req, res) => {
    try {
      const user = (req as any).currentUser;
      const { stripe } = await import('./stripe');
      
      console.log(`🔄 Manual subscription sync for user: ${user.email}`);
      
      // Find customer in Stripe by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length === 0) {
        return res.status(404).json({ message: "No Stripe customer found" });
      }
      
      const customer = customers.data[0];
      console.log(`✅ Found Stripe customer: ${customer.id}`);
      
      // Get customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      });
      
      if (subscriptions.data.length === 0) {
        // Check for trialing subscriptions too
        const trialingSubscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'trialing',
          limit: 1
        });
        
        if (trialingSubscriptions.data.length === 0) {
          return res.status(404).json({ message: "No active subscriptions found" });
        }
        
        subscriptions.data.push(...trialingSubscriptions.data);
      }
      
      const subscription = subscriptions.data[0];
      console.log(`✅ Found subscription: ${subscription.id}, status: ${subscription.status}`);
      
      // Map Stripe plan to our plan names
      const planMapping: Record<string, string> = {
        'standard': 'standard',
        'plus': 'plus', 
        'plus_seo': 'plus_seo'
      };
      
      // Get plan from subscription metadata or product name
      let planId = subscription.metadata.planId || 'plus'; // default to plus
      const mappedPlan = planMapping[planId] || planId;
      
      // Update user in database
      await storage.updateUser(user.id, {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'active' as const,
        plan: mappedPlan as any,
        billingPeriod: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' as const : 'monthly' as const
      });
      
      console.log(`✅ Updated user ${user.id} with subscription data`);
      
      res.json({ 
        success: true,
        customerId: customer.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: mappedPlan,
        billingPeriod: subscription.items.data[0]?.price?.recurring?.interval
      });
      
    } catch (error) {
      console.error('Manual subscription sync error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Create promo code endpoint
  app.post("/api/create-promo-code", requireAuth, async (req, res) => {
    try {
      const { code, percentOff, duration, maxRedemptions, expiresAt } = req.body;
      const { createTestCoupon } = await import('./stripe');

      const result = await createTestCoupon({
        code: code,
        percentOff: percentOff || 100,
        duration: duration || 'once',
        maxRedemptions: maxRedemptions,
        expiresAt: expiresAt
      });

      console.log('Created promo code:', { code, percentOff, duration });
      res.json({ 
        success: true, 
        couponId: result.coupon.id,
        promoCodeId: result.promoCode?.id,
        code: result.promoCode?.code || result.coupon.id,
        percentOff: result.coupon.percent_off
      });
    } catch (error) {
      console.error('Error creating promo code:', error);
      res.status(500).json({ 
        message: "Failed to create promo code", 
        error: (error as Error).message 
      });
    }
  });

  // Validate promo code endpoint
  app.post("/api/validate-promo-code", async (req, res) => {
    try {
      const { code } = req.body;
      const { validateCoupon } = await import('./stripe');

      if (!code) {
        return res.status(400).json({ message: "Promo code is required" });
      }

      const result = await validateCoupon(code);
      res.json(result);
    } catch (error) {
      console.error('Error validating promo code:', error);
      res.status(500).json({ 
        message: "Failed to validate promo code", 
        error: (error as Error).message 
      });
    }
  });

  // Stripe configuration endpoint
  app.get("/api/stripe/config", requireAuth, async (req, res) => {
    try {
      const testMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
      const currentWebhookSecret = testMode 
        ? process.env.STRIPE_WEBHOOK_SECRET_TEST 
        : process.env.STRIPE_WEBHOOK_SECRET_LIVE;
      const webhookConfigured = !!currentWebhookSecret;
      const keysConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);

      res.json({
        testMode,
        webhookConfigured,
        keysConfigured,
        environment: testMode ? 'test' : 'live',
        webhookSecretType: testMode ? 'test' : 'live'
      });
    } catch (error) {
      console.error('Stripe config error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Webhook diagnostics endpoint
  app.get("/api/webhook-diagnostics", async (req, res) => {
    try {
      const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
      const webhookSecret = isTestMode 
        ? process.env.STRIPE_WEBHOOK_SECRET_TEST 
        : process.env.STRIPE_WEBHOOK_SECRET_LIVE;
      
      // Get recent webhook attempts from logs (last 10 requests)
      const recentWebhooks = []; // This would need implementation to track webhook calls
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        isTestMode,
        environment: isTestMode ? 'test' : 'live',
        hasWebhookSecret: !!webhookSecret,
        webhookSecretLength: webhookSecret?.length || 0,
        expectedURL: `${process.env.DOMAIN || 'https://workspace-shielnev11.replit.app'}/api/stripe-webhook`,
        instructions: {
          step1: "Go to Stripe Dashboard → Developers → Webhooks",
          step2: "Add endpoint with URL above",
          step3: "Select events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted",
          step4: "Copy signing secret and update STRIPE_WEBHOOK_SECRET_TEST in Replit secrets",
          step5: "Test with a new payment"
        },
        troubleshooting: {
          webhookNotReceived: "Check Stripe Dashboard webhook logs for delivery attempts",
          signatureVerificationFailed: "Verify webhook secret matches Stripe Dashboard",
          subscriptionNotUpdated: "Check webhook events include required metadata (userId, planId, billingPeriod)"
        }
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Test webhook endpoint
  app.post("/api/stripe/test-webhook", requireAuth, async (req, res) => {
    try {
      // Simple connectivity test
      const testEvent = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'test.webhook',
        data: { object: { test: true } }
      };

      res.json({ 
        success: true, 
        message: 'Webhook endpoint is accessible',
        testEvent 
      });
    } catch (error) {
      console.error('Webhook test error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create test checkout session
  app.post("/api/stripe/test-checkout", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      const user = (req as any).currentUser;

      // Use test price IDs for now
      const planPrices = {
        standard: 'price_test_standard',
        plus: 'price_test_plus', 
        plus_seo: 'price_test_plus_seo',
      };

      const priceId = planPrices[planId as keyof typeof planPrices];
      if (!priceId) {
        return res.status(400).json({ error: 'Invalid plan ID' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan (Test)`,
            },
            unit_amount: planId === 'standard' ? 4900 : planId === 'plus' ? 9700 : 29700,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/upgrade`,
        customer_email: user?.email || user?.username || 'test@example.com',
        metadata: {
          userId: user.id,
          planId: planId,
          testMode: 'true'
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Test checkout error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Run comprehensive Stripe tests
  app.post("/api/stripe/run-tests", requireAuth, async (req, res) => {
    try {
      const results: Array<{
        test: string;
        status: 'success' | 'error' | 'warning';
        message: string;
        details?: any;
      }> = [];

      // Test 1: API Key Validation
      try {
        await stripe.balance.retrieve();
        results.push({
          test: 'API Key Validation',
          status: 'success',
          message: 'Stripe API keys are valid and connected'
        });
      } catch (error) {
        results.push({
          test: 'API Key Validation',
          status: 'error',
          message: 'Invalid Stripe API keys',
          details: (error as Error).message
        });
      }

      // Test 2: Test Mode Check
      const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
      results.push({
        test: 'Test Mode Check',
        status: isTestMode ? 'success' : 'warning',
        message: isTestMode ? 'Running in test mode (safe for testing)' : 'Running in live mode (real payments)',
        details: { testMode: isTestMode }
      });

      // Test 3: Webhook Secret
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      results.push({
        test: 'Webhook Configuration',
        status: webhookSecret ? 'success' : 'error',
        message: webhookSecret ? 'Webhook secret is configured' : 'Webhook secret is missing',
        details: { configured: !!webhookSecret }
      });

      // Test 4: Database Connection for Subscriptions
      try {
        const user = req.user as any;
        await storage.getUserByEmail(user.email);
        results.push({
          test: 'Database Connectivity',
          status: 'success',
          message: 'Database connection working for subscription management'
        });
      } catch (error) {
        results.push({
          test: 'Database Connectivity',
          status: 'error',
          message: 'Database connection failed',
          details: (error as Error).message
        });
      }

      // Test 5: Create Test Product (if in test mode)
      if (isTestMode) {
        try {
          const testProduct = await stripe.products.create({
            name: 'Test Product - Delete Me',
            metadata: { test: 'true' }
          });
          
          // Clean up immediately
          await stripe.products.del(testProduct.id);
          
          results.push({
            test: 'Product Creation Test',
            status: 'success',
            message: 'Can create and delete test products'
          });
        } catch (error) {
          results.push({
            test: 'Product Creation Test',
            status: 'error',
            message: 'Failed to create test product',
            details: (error as Error).message
          });
        }
      }

      const hasErrors = results.some(r => r.status === 'error');

      res.json({
        success: !hasErrors,
        summary: {
          total: results.length,
          passed: results.filter(r => r.status === 'success').length,
          warnings: results.filter(r => r.status === 'warning').length,
          errors: results.filter(r => r.status === 'error').length
        },
        results
      });
    } catch (error) {
      console.error('Test suite error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Stripe webhook handler removed - using the main handler in server/index.ts
  // Duplicate handler commented out to avoid conflicts
  /* app.post("/api/stripe-webhook", express.raw({type: 'application/json'}), async (req, res) => {
    try {
      console.log('🔔 STRIPE WEBHOOK RECEIVED 🔔');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body length:', req.body?.length);
      console.log('Raw body preview:', req.body?.toString().substring(0, 200));
      
      const { stripe } = await import('./stripe');
      const sig = req.headers['stripe-signature'];
      
      // Use appropriate webhook secret based on Stripe environment
      const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
      const webhookSecret = isTestMode 
        ? process.env.STRIPE_WEBHOOK_SECRET_TEST 
        : process.env.STRIPE_WEBHOOK_SECRET_LIVE;
      
      console.log('🔑 Webhook configuration:', {
        isTestMode,
        hasWebhookSecret: !!webhookSecret,
        secretLength: webhookSecret?.length || 0,
        hasSignature: !!sig
      });
      
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
        console.log('✅ Webhook signature verified successfully');
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', (err as Error).message);
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Handle the event
      console.log('📨 Processing webhook event:', {
        type: event.type,
        eventId: event.id,
        created: event.created
      });
      
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log('💳 Checkout session completed:', {
            sessionId: session.id,
            customerId: session.customer,
            subscriptionId: session.subscription,
            metadata: session.metadata
          });
          
          // Update user subscription in database
          if (session.metadata?.userId) {
            console.log('🔄 Updating user subscription for userId:', session.metadata.userId);
            try {
              await storage.updateUserSubscription(session.metadata.userId, {
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                subscriptionStatus: 'active',
                plan: session.metadata.planId,
                billingPeriod: session.metadata.billingPeriod
              });
              console.log('✅ User subscription updated successfully');
            } catch (updateError) {
              console.error('❌ Failed to update user subscription:', updateError);
            }
          } else {
            console.error('❌ No userId in session metadata:', session.metadata);
          }
          break;

        case 'customer.subscription.updated':
          const subscription = event.data.object;
          console.log('📝 Subscription updated event:', {
            subscriptionId: subscription.id,
            status: subscription.status,
            items: subscription.items.data.map(item => ({
              priceId: item.price.id,
              productName: item.price.product?.name,
              amount: item.price.unit_amount
            }))
          });
          
          // Find user by Stripe subscription ID and update status
          const userBySubscription = await storage.getUserByStripeSubscriptionId(subscription.id);
          if (userBySubscription) {
            console.log('🔍 Found user for subscription update:', {
              userId: userBySubscription.id,
              email: userBySubscription.email
            });
            
            // Extract plan info from first subscription item
            const subscriptionItem = subscription.items.data[0];
            const priceId = subscriptionItem?.price?.id;
            const productName = subscriptionItem?.price?.product?.name || '';
            const amount = subscriptionItem?.price?.unit_amount || 0;
            
            // Map Stripe product names to internal plan names
            let planName = 'standard'; // default
            if (productName.toLowerCase().includes('plus seo') || amount >= 29700) { // $297
              planName = 'plus_seo';
            } else if (productName.toLowerCase().includes('plus') || amount >= 9700) { // $97
              planName = 'plus';
            } else if (productName.toLowerCase().includes('standard') || amount >= 4900) { // $49
              planName = 'standard';
            }
            
            const billingPeriod = subscriptionItem?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';
            
            console.log('🔄 Updating user subscription with:', {
              userId: userBySubscription.id,
              subscriptionStatus: subscription.status,
              plan: planName,
              billingPeriod,
              amount: amount / 100
            });
            
            await storage.updateUserSubscription(userBySubscription.id, {
              subscriptionStatus: subscription.status as any,
              plan: planName as any,
              billingPeriod
            });
            
            console.log(`✅ Updated user ${userBySubscription.id} to ${planName} plan with status ${subscription.status}`);
          } else {
            console.error('❌ No user found for subscription ID:', subscription.id);
          }
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object;
          console.log('Subscription deleted:', deletedSubscription.id);
          
          // Find user and update to canceled status
          const userByDeletedSub = await storage.getUserByStripeSubscriptionId(deletedSubscription.id);
          if (userByDeletedSub) {
            await storage.updateUserSubscription(userByDeletedSub.id, {
              subscriptionStatus: 'canceled'
            });
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }); */

  // Register Zapier integration routes
  registerZapierRoutes(app);

  // Serve uploaded icons
  app.use('/uploads/icons', express.static(path.join(process.cwd(), 'uploads/icons')));

  // Notification API endpoints
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser.id;
      const unreadNotifications = await storage.getUnreadNotifications(userId);
      res.json(unreadNotifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.get("/api/notifications/unread/count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.markNotificationAsRead(parseInt(id));
      if (success) {
        res.json({ message: "Notification marked as read" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser.id;
      const success = await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNotification(parseInt(id));
      if (success) {
        res.json({ message: "Notification deleted" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Helper function to create notifications
  async function createNotificationForUser(userId: string, type: string, title: string, message: string, data?: any) {
    try {
      await storage.createNotification({
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        isRead: false
      });
    } catch (error) {
      console.error(`Error creating ${type} notification:`, error);
    }
  }

  // AI-powered object description refinement for photo measurements
  app.post("/api/photo-measurement/refine-prompt", async (req, res) => {
    try {
      const { description, measurementType } = req.body;
      
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ message: "Description is required" });
      }
      
      if (!measurementType || typeof measurementType !== 'string') {
        return res.status(400).json({ message: "Measurement type is required" });
      }

      // Try OpenAI for refinement
      try {
        console.log('Attempting prompt refinement with OpenAI...');
        const refinedDescription = await refineObjectDescriptionOpenAI(description, measurementType);
        console.log('OpenAI prompt refinement successful');
        return res.json({ refinedDescription });
      } catch (openaiError) {
        console.warn('OpenAI prompt refinement failed:', openaiError);
        // If OpenAI fails, return a helpful default refinement
        const fallbackRefinement = `${description.trim()}. Please identify this object in the provided photos and estimate its ${measurementType} using standard reference dimensions such as doors (7ft tall), windows (3-5ft wide), bricks (8in long), and other visible architectural elements for scale.`;
        return res.json({ refinedDescription: fallbackRefinement });
      }
    } catch (error) {
      console.error('Prompt refinement error:', error);
      res.status(500).json({ message: "Failed to refine prompt" });
    }
  });

  // Photo measurement analysis with setup configuration
  app.post("/api/photo-measurement/analyze-with-setup", express.json({ limit: '20mb' }), async (req, res) => {
    try {
      const { setupConfig, customerImages } = req.body;

      // Validation
      if (!setupConfig || typeof setupConfig !== 'object') {
        return res.status(400).json({ message: "Setup configuration is required" });
      }
      if (!customerImages || !Array.isArray(customerImages) || customerImages.length === 0) {
        return res.status(400).json({ message: "At least one customer image is required" });
      }
      if (customerImages.length > 5) {
        return res.status(400).json({ message: "Maximum 5 customer images allowed" });
      }
      if (!setupConfig.objectDescription || typeof setupConfig.objectDescription !== 'string' || !setupConfig.objectDescription.trim()) {
        return res.status(400).json({ message: "Object description is required in setup configuration" });
      }
      if (!setupConfig.referenceImages || !Array.isArray(setupConfig.referenceImages)) {
        return res.status(400).json({ message: "Reference images must be an array (can be empty)" });
      }
      if (setupConfig.referenceImages.length > 5) {
        return res.status(400).json({ message: "Maximum 5 reference images allowed in setup" });
      }
      if (!setupConfig.measurementType || !['area', 'length', 'width', 'height', 'perimeter'].includes(setupConfig.measurementType)) {
        return res.status(400).json({ message: "Valid measurement type is required in setup configuration" });
      }

      // Validate each reference image has required fields (only if there are any)
      if (setupConfig.referenceImages.length > 0) {
        for (let i = 0; i < setupConfig.referenceImages.length; i++) {
          const ref = setupConfig.referenceImages[i];
          if (!ref.description || !ref.measurement || !ref.unit) {
            return res.status(400).json({ message: `Reference image ${i + 1} is missing required fields` });
          }
          const measurement = parseFloat(ref.measurement);
          if (isNaN(measurement) || measurement <= 0) {
            return res.status(400).json({ message: `Reference image ${i + 1} measurement must be a positive number` });
          }
        }
      }

      // Call the analysis function
      const result = await analyzeWithSetupConfig(setupConfig, customerImages);
      res.json(result);
    } catch (error) {
      console.error("Photo measurement with setup error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze photo measurement" 
      });
    }
  });

  // Photo measurement analysis endpoint
  app.post("/api/photo-measurement/analyze", express.json({ limit: '20mb' }), async (req, res) => {
    try {
      const { images, referenceObject, referenceMeasurement, referenceUnit, referenceImages, targetObject, measurementType } = req.body;

      // Validation
      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ message: "At least one image is required" });
      }
      if (images.length > 5) {
        return res.status(400).json({ message: "Maximum 5 images allowed" });
      }
      if (!targetObject || !measurementType) {
        return res.status(400).json({ message: "Target object and measurement type are required" });
      }
      // If reference images are provided, validate reference info is also provided
      if (referenceImages && Array.isArray(referenceImages)) {
        // Empty reference images array should be treated as no reference images
        if (referenceImages.length === 0) {
          // Continue to other validation modes
        } else if (referenceImages.length > 0) {
          if (!referenceObject || !referenceMeasurement || !referenceUnit) {
            return res.status(400).json({ message: "When providing reference images, you must also specify reference object, measurement, and unit" });
          }
          if (typeof referenceMeasurement !== 'number' || referenceMeasurement <= 0) {
            return res.status(400).json({ message: "Reference measurement must be a positive number" });
          }
          if (referenceImages.length > 3) {
            return res.status(400).json({ message: "Maximum 3 reference images allowed" });
          }
        }
      }
      // If manual reference info is provided (without images), validate it
      else if (referenceObject || referenceMeasurement || referenceUnit) {
        if (!referenceObject || !referenceMeasurement || !referenceUnit) {
          return res.status(400).json({ message: "If providing reference, all reference fields (object, measurement, unit) are required" });
        }
        if (typeof referenceMeasurement !== 'number' || referenceMeasurement <= 0) {
          return res.status(400).json({ message: "Reference measurement must be a positive number" });
        }
      }
      if (!['area', 'length', 'width', 'height', 'perimeter'].includes(measurementType)) {
        return res.status(400).json({ message: "Invalid measurement type" });
      }

      const request: MeasurementRequest = {
        images,
        referenceObject,
        referenceMeasurement,
        referenceUnit,
        referenceImages,
        targetObject,
        measurementType: measurementType as 'area' | 'length' | 'width' | 'height' | 'perimeter',
      };

      const result = await analyzePhotoMeasurement(request);
      res.json(result);
    } catch (error) {
      console.error("Photo measurement analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze photo measurement" 
      });
    }
  });

  // Save photo measurement to database
  app.post("/api/photo-measurements", async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { leadId, formulaName, setupConfig, customerImageUrls, estimatedValue, estimatedUnit, confidence, explanation, warnings, tags } = req.body;

      if (!setupConfig || !customerImageUrls || !estimatedValue || !estimatedUnit || confidence === undefined || !explanation) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const measurement = await storage.createPhotoMeasurement({
        leadId: leadId || null,
        userId,
        formulaName: formulaName || null,
        setupConfig,
        customerImageUrls,
        estimatedValue: Math.round(estimatedValue * 100), // Store as integer with 2 decimal precision
        estimatedUnit,
        confidence,
        explanation,
        warnings: warnings || [],
        tags: tags || (formulaName ? [formulaName] : [])
      });

      res.json(measurement);
    } catch (error) {
      console.error("Error saving photo measurement:", error);
      res.status(500).json({ message: "Failed to save photo measurement" });
    }
  });

  // Get photo measurements for a lead
  app.get("/api/photo-measurements/lead/:leadId", async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { leadId } = req.params;
      const measurements = await storage.getPhotoMeasurementsByLeadId(parseInt(leadId));
      
      // Convert stored integer values back to decimals
      const formattedMeasurements = measurements.map(m => ({
        ...m,
        estimatedValue: m.estimatedValue / 100
      }));

      res.json(formattedMeasurements);
    } catch (error) {
      console.error("Error fetching photo measurements:", error);
      res.status(500).json({ message: "Failed to fetch photo measurements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
