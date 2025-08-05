import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
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
  insertDudaTemplateTagSchema,
  insertDudaTemplateMetadataSchema,
  insertDudaTemplateTagAssignmentSchema,
  insertDfyServiceSchema,
  insertDfyServicePurchaseSchema
} from "@shared/schema";
import { generateFormula, editFormula } from "./gemini";
import { dudaApi } from "./duda-api";
import { calculateDistance, geocodeAddress } from "./location-utils";
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
import { ZapierIntegrationService } from "./zapier-integration";
import { registerZapierRoutes } from "./zapier-routes";
import { z } from "zod";

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

// Configure multer for file uploads
const iconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/icons');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `icon-${uniqueSuffix}${fileExtension}`);
  }
});

const uploadIcon = multer({ 
  storage: iconStorage,
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

  // Note: Auth routes are now handled in emailAuth.ts

  // Icon upload endpoint
  app.post("/api/upload/icon", uploadIcon.single('icon'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const iconUrl = `/uploads/icons/${req.file.filename}`;
      res.json({ iconUrl });
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

  // Public API endpoints for embed forms
  app.get("/api/public/formulas", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "userId parameter is required" });
      }

      // Get formulas for specific user that are marked as displayed
      const allFormulas = await storage.getFormulasByUserId(userId);
      const displayedFormulas = allFormulas.filter(formula => formula.isDisplayed !== false);
      res.json(displayedFormulas);
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
          enableBooking: settings.enableBooking
        };
        res.json(publicSettings);
      } else {
        res.status(404).json({ message: "Business settings not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business settings" });
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

  // AI Formula Generation
  app.post("/api/formulas/generate", async (req, res) => {
    try {
      const { description } = req.body;
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ message: "Description is required" });
      }

      const aiFormula = await generateFormula(description);
      res.json(aiFormula);
    } catch (error) {
      console.error('AI formula generation error:', error);
      res.status(500).json({ message: "Failed to generate formula with AI" });
    }
  });

  // AI Formula Editing
  app.post("/api/formulas/edit", async (req, res) => {
    try {
      const { currentFormula, editInstructions } = req.body;
      if (!currentFormula || !editInstructions || typeof editInstructions !== 'string') {
        return res.status(400).json({ message: "Current formula and edit instructions are required" });
      }

      const editedFormula = await editFormula(currentFormula, editInstructions);
      res.json(editedFormula);
    } catch (error) {
      console.error('AI formula edit error:', error);
      res.status(500).json({ message: "Failed to edit formula with AI" });
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
      res.json(formula);
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

      // Get user's business settings for default styling
      const businessSettings = await storage.getBusinessSettingsByUserId(userId);
      const defaultStyling = businessSettings?.styling || {};

      // Create new formula from template
      const embedId = `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newFormula = {
        name: template.name,
        title: template.title,
        description: template.description,
        bulletPoints: template.bulletPoints,
        variables: template.variables,
        formula: template.formula,
        styling: defaultStyling,
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
      const { category, templateName } = req.body;

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
      
      // Create lead with adjusted pricing
      const leadData = {
        ...validatedData,
        calculatedPrice: distanceAdjustedPrice,
        ipAddress: getClientIpAddress(req),
        ...(distanceInfo && { distanceInfo })
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
              category: undefined
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
            createdAt: lead.createdAt
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
      
      const now = new Date();
      const thisMonth = leads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
      });

      const avgQuoteValue = leads.length > 0 
        ? Math.round(leads.reduce((sum, lead) => sum + lead.calculatedPrice, 0) / leads.length)
        : 0;

      const stats = {
        totalCalculators: formulas.length,
        leadsThisMonth: thisMonth.length,
        avgQuoteValue,
        conversionRate: leads.length > 0 ? ((thisMonth.length / leads.length) * 100).toFixed(1) : "0.0"
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
      
      // Create BidRequest and send email notification to account owner
      try {
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
        
        console.log(`Multi-service lead created - Owner Email: ${ownerEmail}, Business Owner ID: ${businessOwnerId}`);
        
        // Create BidRequest for business owner review
        if (businessOwnerId && businessOwnerId !== "default_owner") {
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
              category: undefined
            })),
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
              price: service.calculatedPrice // Keep in cents for proper conversion in email template
            })),
            totalPrice: lead.totalPrice, // Keep in cents for proper conversion in email template
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
              businessPhone: businessSettings?.businessPhone,
              estimatedTimeframe: "2-3 business days"
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
      
      res.status(201).json(lead);
    } catch (error) {
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
      const settings = await storage.getBusinessSettingsByUserId(userId);
      res.json(settings);
    } catch (error) {
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
      // Update the first business settings record (assuming single business)
      console.log('Business settings update request body (no ID):', JSON.stringify(req.body, null, 2));
      
      // For stripeConfig, we don't need complex validation since it's just a JSON object
      const validatedData: any = {};
      
      // Copy over allowed fields
      const allowedFields = [
        'businessName', 'businessEmail', 'businessPhone', 'businessAddress', 'businessDescription',
        'contactFirstToggle', 'bundleDiscount', 'salesTax', 'salesTaxLabel', 'styling',
        'serviceSelectionTitle', 'serviceSelectionSubtitle', 'enableBooking', 'stripeConfig',
        'enableDistancePricing', 'distancePricingType', 'distancePricingRate', 'enableLeadCapture'
      ];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          validatedData[field] = req.body[field];
        }
      }

      const settings = await storage.updateBusinessSettings(1, validatedData);
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
      
      // Simplified approach - just validate the core fields we actually need
      const allowedFields = ['businessName', 'enableLeadCapture', 'styling'];
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
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid business settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update business settings" });
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
                  service: slotDetails.service || 'Service Appointment',
                  appointmentDate: new Date(slotDetails.date),
                  appointmentTime: slotDetails.time,
                  businessName: businessSettings?.businessName,
                  businessPhone: businessSettings?.businessPhone,
                  businessEmail: businessSettings?.businessEmail,
                  address: slotDetails.address,
                  notes: customerInfo.notes
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
      
      res.json(slots || []);
    } catch (error) {
      console.error("Error fetching public availability slots:", error);
      res.status(500).json({ message: "Failed to fetch availability slots" });
    }
  });

  app.post("/api/public/availability-slots/:businessOwnerId/book", async (req, res) => {
    try {
      const businessOwnerId = req.params.businessOwnerId;
      const { date, startTime, endTime, leadId, title, notes } = req.body;
      
      if (!businessOwnerId) {
        return res.status(400).json({ message: "Business owner ID required" });
      }
      
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ message: "Date, start time, and end time are required" });
      }
      
      // Create a new booked slot
      const slotData = {
        userId: businessOwnerId,
        date,
        startTime,
        endTime,
        title: title || 'Customer Appointment',
        isBooked: true,
        bookedBy: leadId || null,
        notes: notes || 'Booked via customer form'
      };
      
      const bookedSlot = await storage.createAvailabilitySlot(slotData);
      
      // Send booking notification email to business owner
      try {
        // Get business owner information
        const businessOwner = await storage.getUserById(businessOwnerId);
        const businessSettings = await storage.getBusinessSettingsByUserId(businessOwnerId);
        
        if (businessOwner && businessOwner.email) {
          // Get lead information if available
          let leadInfo = null;
          if (leadId) {
            leadInfo = await storage.getMultiServiceLead(leadId);
          }
          
          // Send booking notification email
          const { sendBookingNotificationEmail } = await import('./email-providers.js');
          await sendBookingNotificationEmail({
            businessOwnerEmail: businessOwner.email,
            businessName: businessSettings?.businessName || 'Your Business',
            customerName: leadInfo?.name || 'Customer',
            customerEmail: leadInfo?.email || '',
            customerPhone: leadInfo?.phone || '',
            appointmentDate: date,
            appointmentTime: `${startTime} - ${endTime}`,
            serviceDetails: title || 'Service Appointment',
            notes: notes || 'Booked via customer form'
          });
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
      const userId = req.user!.id;
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
      const userId = req.user!.id;
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
      const userId = req.user!.id;
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
            ...dudaData,
            site_name: localSite.siteName,
            account_name: localSite.accountName,
            site_domain: localSite.siteDomain || dudaData.site_domain,
            preview_url: localSite.previewUrl || dudaData.preview_url,
            last_published: localSite.lastPublished || dudaData.last_published,
            created_date: localSite.createdDate.toISOString(),
            status: localSite.status
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
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { planId, billingPeriod, userEmail, userId } = req.body;
      
      if (!planId || !billingPeriod || !userEmail || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get business settings for Stripe configuration
      const businessSettings = await storage.getBusinessSettings();
      const stripeConfig = businessSettings?.stripeConfig;

      const session = await createCheckoutSession(planId, billingPeriod, userEmail, userId, stripeConfig);
      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Checkout session error:', error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/create-portal-session", async (req, res) => {
    try {
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }

      const session = await createPortalSession(customerId);
      res.json({ url: session.url });
    } catch (error) {
      console.error('Portal session error:', error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

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

  app.post("/api/webhooks/stripe", express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send('Missing stripe signature or webhook secret');
      }
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const error = err as Error;
      console.log(`Webhook signature verification failed.`, error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          const userId = session.metadata?.userId;
          const planId = session.metadata?.planId;
          const billingPeriod = session.metadata?.billingPeriod;

          if (!userId || !planId || !billingPeriod) {
            console.error('Missing required metadata in checkout session');
            break;
          }

          // Update user with subscription info
          await storage.updateUser(userId, {
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
            subscriptionStatus: 'active',
            plan: planId as 'starter' | 'professional' | 'enterprise',
            billingPeriod: billingPeriod as 'monthly' | 'yearly'
          });

          // Get user info for email
          const user = await storage.getUserById(userId);
          if (user && user.email && planId in SUBSCRIPTION_PLANS) {
            const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
            await sendSubscriptionConfirmationEmail(
              user.email,
              user.firstName || 'User',
              plan.name,
              billingPeriod as 'monthly' | 'yearly',
              billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
            );
          }
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          const customer = await stripe.customers.retrieve(customerId);
          
          if ('metadata' in customer && customer.metadata?.userId) {
            await storage.updateUser(customer.metadata.userId, {
              subscriptionStatus: subscription.status === 'active' ? 'active' : 'inactive'
            });
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({received: true});
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

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

      // 3. Grant full permissions to the user for this site
      await dudaApi.grantSitePermissions(dudaAccount.account_name, dudaWebsite.site_name);

      // 4. Generate SSO setup link for the user
      const ssoResponse = await dudaApi.generateSSOLink(dudaAccount.account_name, dudaWebsite.site_name);
      
      // Store website in our database
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

      // 5. Send website setup email with the SSO link
      try {
        const { sendWebsiteSetupEmail } = await import('./email-templates');
        const emailSent = await sendWebsiteSetupEmail(
          userEmail,
          firstName,
          ssoResponse.url,
          websiteName
        );
        
        if (emailSent) {
          console.log(`Website setup email sent successfully to ${userEmail}`);
        } else {
          console.error(`Failed to send website setup email to ${userEmail}`);
        }
      } catch (emailError) {
        console.error('Error sending website setup email:', emailError);
        // Don't fail the website creation if email fails
      }
      res.status(201).json({
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
        duda_user_email: createdWebsite.dudaUserEmail
      });
    } catch (error) {
      console.error('Error creating website:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid website data", errors: error.errors });
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to create website";
      res.status(500).json({ message: errorMessage });
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

  // Stripe payment routes
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { planId, billingPeriod, userEmail, userId } = req.body;
      
      if (!planId || !userEmail || !userId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) {
        return res.status(400).json({ message: 'Invalid plan selected' });
      }

      const session = await createCheckoutSession(
        planId,
        billingPeriod || 'monthly',
        userEmail,
        userId
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

  app.post('/api/create-portal-session', requireAuth, async (req: any, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: 'No Stripe customer ID found' });
      }

      const session = await createPortalSession(user.stripeCustomerId);
      res.json({ url: session.url });
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

      // Cancel the subscription at the end of the current period
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update user status in database
      await storage.updateUser(userId, {
        subscriptionStatus: 'canceled'
      });

      res.json({ 
        message: 'Subscription will be canceled at the end of the current billing period',
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
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

  // Get subscription details
  app.get('/api/subscription-details', requireAuth, async (req: any, res) => {
    try {
      const userId = (req as any).currentUser.id;
      const user = await storage.getUserById(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ hasSubscription: false });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const customer = await stripe.customers.retrieve(user.stripeCustomerId!);

      res.json({
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
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
      });
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
      
      if (!user?.stripeCustomerId) {
        return res.json({ invoices: [] });
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

  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log('Payment succeeded:', session);
          
          // Update user subscription status
          if (session.metadata?.userId) {
            try {
              await storage.updateUser(session.metadata.userId, {
                stripeCustomerId: session.customer as string,
                subscriptionStatus: 'active',
                plan: session.metadata.planId as 'starter' | 'professional' | 'enterprise'
              });
              
              // Send subscription confirmation email
              const user = await storage.getUserById(session.metadata.userId);
              if (user?.email) {
                await sendSubscriptionConfirmationEmail(
                  user.email, 
                  user.firstName || 'there', 
                  session.metadata.planId, 
                  'monthly', 
                  0
                );
              }
            } catch (error) {
              console.error('Error updating user after payment:', error);
            }
          }
          break;
          
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          console.log('Subscription updated:', subscription);
          
          // Update user subscription status based on subscription status
          try {
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            if (customer && !customer.deleted) {
              // Find user by customer ID and update subscription status
              const users = await storage.getAllUsers();
              const user = users.find(u => u.stripeCustomerId === subscription.customer);
              
              if (user) {
                await storage.updateUser(user.id, {
                  subscriptionStatus: subscription.status === 'active' ? 'active' : 'inactive'
                });
              }
            }
          } catch (error) {
            console.error('Error handling subscription update:', error);
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Custom Forms API endpoints
  app.get("/api/custom-forms", requireAuth, async (req, res) => {
    try {
      const forms = await storage.getAllCustomForms();
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom forms" });
    }
  });

  app.get("/api/custom-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const form = await storage.getCustomFormById(id);
      if (!form) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom form" });
    }
  });

  app.get("/api/custom-forms/embed/:embedId", async (req, res) => {
    try {
      const { embedId } = req.params;
      const form = await storage.getCustomFormByEmbedId(embedId);
      if (!form) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom form" });
    }
  });

  app.post("/api/custom-forms", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomFormSchema.parse(req.body);
      const form = await storage.createCustomForm(validatedData);
      res.status(201).json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid custom form data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create custom form" });
    }
  });

  app.patch("/api/custom-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCustomFormSchema.partial().parse(req.body);
      const form = await storage.updateCustomForm(id, validatedData);
      if (!form) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid custom form data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update custom form" });
    }
  });

  app.delete("/api/custom-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomForm(id);
      if (!success) {
        return res.status(404).json({ message: "Custom form not found" });
      }
      res.json({ message: "Custom form deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete custom form" });
    }
  });

  // Custom Form Leads API endpoints
  app.get("/api/custom-forms/:formId/leads", requireAuth, async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      const leads = await storage.getCustomFormLeads(formId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom form leads" });
    }
  });

  app.post("/api/custom-forms/:formId/leads", async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      const validatedData = insertCustomFormLeadSchema.parse({
        ...req.body,
        customFormId: formId
      });
      const lead = await storage.createCustomFormLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
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
      const userId = req.user!.id;

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
      const userId = req.user!.id;
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
        createdBy: req.user!.id
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
      const allowedFields = ['firstName', 'lastName', 'organizationName', 'plan', 'isActive', 'subscriptionStatus'];
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
          plusSeo: { monthlyPriceId: "", yearlyPriceId: "" }
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
      const estimates = await storage.getAllEstimates();
      res.json(estimates);
    } catch (error) {
      console.error('Error fetching estimates:', error);
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
      const businessName = businessSettings?.businessInfo?.businessName || 'Our Business';
      const businessPhone = businessSettings?.businessInfo?.phone || '';
      const businessEmail = businessSettings?.businessInfo?.email || '';
      
      // Try to send email notification to customer
      try {
        const emailParams = {
          customerName: bidRequest.customerName,
          businessName,
          businessPhone,
          businessEmail,
          serviceName: bidRequest.services?.[0]?.formulaName || 'Service',
          totalPrice: finalPrice || bidRequest.autoPrice,
          quoteMessage: emailBody,
          bidResponseLink: responseLink,
          emailSubject: emailSubject || `Your Service Quote is Ready - ${businessName}`,
          fromName: businessSettings?.businessInfo?.contactName || 'Service Team'
        };
        
        console.log('Email parameters:', JSON.stringify(emailParams, null, 2));
        console.log(`Attempting to send email to: ${bidRequest.customerEmail}`);
        
        const emailResult = await sendBidResponseNotification(bidRequest.customerEmail, emailParams);
        
        console.log(`Email send result: ${emailResult}`);
        console.log(`Bid response notification sent to ${bidRequest.customerEmail}`);
      } catch (emailError) {
        console.error('Failed to send bid response email:', emailError);
        console.error('Error details:', emailError.message);
        console.error('Stack trace:', emailError.stack);
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
      const { category, active } = req.query;
      let icons;
      
      if (category && typeof category === 'string') {
        icons = await storage.getIconsByCategory(category);
      } else if (active === 'true') {
        icons = await storage.getActiveIcons();
      } else {
        icons = await storage.getAllIcons();
      }
      
      // Transform icons to include full URL paths
      const iconsWithUrls = icons.map(icon => ({
        ...icon,
        url: `/uploads/icons/${icon.filename}`
      }));
      
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
      
      res.json({
        ...icon,
        url: `/uploads/icons/${icon.filename}`
      });
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

      const iconData = {
        name: req.body.name || req.file.originalname,
        filename: req.file.filename,
        category: req.body.category || 'general',
        description: req.body.description || null,
        isActive: true
      };

      const icon = await storage.createIcon(iconData);
      res.status(201).json({
        ...icon,
        url: `/uploads/icons/${icon.filename}`
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

  // Register Zapier integration routes
  registerZapierRoutes(app);

  // Serve uploaded icons
  app.use('/uploads/icons', express.static(path.join(process.cwd(), 'uploads/icons')));

  const httpServer = createServer(app);
  return httpServer;
}
