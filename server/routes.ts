import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupEmailAuth, requireEmailAuth } from "./emailAuth";
import { requireAuth, optionalAuth, requireSuperAdmin, isSuperAdmin } from "./universalAuth";
import { 
  insertFormulaSchema, 
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
  insertBidRequestSchema
} from "@shared/schema";
import { generateFormula, editFormula } from "./gemini";
import { dudaApi } from "./duda-api";
import { stripe, createCheckoutSession, createPortalSession, updateSubscription, SUBSCRIPTION_PLANS } from "./stripe";
import { sendWelcomeEmail, sendOnboardingCompleteEmail, sendSubscriptionConfirmationEmail, sendNewLeadNotification, sendNewMultiServiceLeadNotification } from "./sendgrid";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Email authentication only
  setupEmailAuth(app);

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
  // Formula routes
  app.get("/api/formulas", requireAuth, async (req, res) => {
    try {
      const formulas = await storage.getAllFormulas();
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
      const validatedData = insertFormulaSchema.parse(req.body);
      const formula = await storage.createFormula(validatedData);
      res.status(201).json(formula);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid formula data", errors: error.errors });
      }
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

  // Lead routes
  app.get("/api/leads", requireAuth, async (req, res) => {
    try {
      const formulaId = req.query.formulaId ? parseInt(req.query.formulaId as string) : undefined;
      const leads = formulaId 
        ? await storage.getLeadsByFormulaId(formulaId)
        : await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", optionalAuth, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      
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
              description: formula?.description || null,
              category: null
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
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone || undefined,
            address: lead.address || undefined,
            notes: lead.notes || undefined,
            formulaName,
            calculatedPrice: lead.calculatedPrice,
            variables: lead.variables,
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
      const formulas = await storage.getAllFormulas();
      const leads = await storage.getAllLeads();
      
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
      const leads = await storage.getAllMultiServiceLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch multi-service leads" });
    }
  });

  app.post("/api/multi-service-leads", optionalAuth, async (req, res) => {
    try {
      const validatedData = insertMultiServiceLeadSchema.parse(req.body);
      const lead = await storage.createMultiServiceLead(validatedData);
      
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
              description: null,
              category: null
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
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone || undefined,
            address: lead.address || undefined,
            notes: lead.notes || undefined,
            services: lead.services,
            totalPrice: lead.totalPrice,
            createdAt: lead.createdAt
          });
          
          console.log(`New multi-service lead notification sent to ${ownerEmail}`);
        } else {
          console.log('No owner email found - skipping multi-service lead notification');
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
      const settings = await storage.getBusinessSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business settings" });
    }
  });

  app.post("/api/business-settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertBusinessSettingsSchema.parse(req.body);
      const settings = await storage.createBusinessSettings(validatedData);
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
      const validatedData = insertBusinessSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateBusinessSettings(1, validatedData);
      if (!settings) {
        return res.status(404).json({ message: "Business settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error('Business settings validation error (no ID):', error);
      if (error instanceof z.ZodError) {
        console.error('Detailed validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid business settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update business settings" });
    }
  });

  app.patch("/api/business-settings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Business settings update request body:', JSON.stringify(req.body, null, 2));
      const validatedData = insertBusinessSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateBusinessSettings(id, validatedData);
      if (!settings) {
        return res.status(404).json({ message: "Business settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error('Business settings validation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid business settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update business settings" });
    }
  });

  // Calendar/Availability routes
  app.get("/api/availability-slots", async (req, res) => {
    try {
      const { startDate, endDate, date } = req.query;
      
      if (date) {
        const slots = await storage.getAvailabilitySlotsByDate(date as string);
        res.json(slots);
      } else if (startDate && endDate) {
        const slots = await storage.getAvailableSlotsByDateRange(startDate as string, endDate as string);
        res.json(slots);
      } else {
        res.status(400).json({ message: "Please provide either 'date' or both 'startDate' and 'endDate' parameters" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability slots" });
    }
  });

  app.post("/api/availability-slots", async (req, res) => {
    try {
      const validatedData = insertAvailabilitySlotSchema.parse(req.body);
      const slot = await storage.createAvailabilitySlot(validatedData);
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid availability slot data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create availability slot" });
    }
  });

  app.patch("/api/availability-slots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAvailabilitySlotSchema.partial().parse(req.body);
      const slot = await storage.updateAvailabilitySlot(id, validatedData);
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

  app.delete("/api/availability-slots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAvailabilitySlot(id);
      if (!success) {
        return res.status(404).json({ message: "Availability slot not found" });
      }
      res.json({ message: "Availability slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete availability slot" });
    }
  });

  app.post("/api/availability-slots/:id/book", async (req, res) => {
    try {
      const slotId = parseInt(req.params.id);
      const { leadId, slotData } = req.body;
      
      if (!leadId) {
        return res.status(400).json({ message: "Lead ID is required" });
      }
      
      const bookedSlot = await storage.bookSlot(slotId, leadId, slotData);
      if (!bookedSlot) {
        return res.status(404).json({ message: "Availability slot not found or could not be created" });
      }
      res.json(bookedSlot);
    } catch (error) {
      res.status(500).json({ message: "Failed to book slot" });
    }
  });

  // Availability slots GET routes
  app.get("/api/availability-slots", async (req, res) => {
    try {
      const { date } = req.query;
      if (date && typeof date === 'string') {
        // Single date query
        const slots = await storage.getAvailabilitySlotsByDate(date);
        res.json(slots);
      } else {
        // Return all slots if no date specified
        const slots = await storage.getAllAvailabilitySlots();
        res.json(slots);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability slots" });
    }
  });

  app.get("/api/availability-slots/:startDate/:endDate", async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const slots = await storage.getAllSlotsByDateRange(startDate, endDate);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability slots for date range" });
    }
  });

  // Recurring availability routes
  app.get("/api/recurring-availability", async (req, res) => {
    try {
      const recurring = await storage.getRecurringAvailability();
      res.json(recurring);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recurring availability" });
    }
  });

  app.post("/api/recurring-availability", async (req, res) => {
    try {
      const validatedData = insertRecurringAvailabilitySchema.parse(req.body);
      const recurring = await storage.createRecurringAvailability(validatedData);
      res.status(201).json(recurring);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recurring availability data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create recurring availability" });
    }
  });

  app.patch("/api/recurring-availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRecurringAvailabilitySchema.partial().parse(req.body);
      const recurring = await storage.updateRecurringAvailability(id, validatedData);
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

  app.delete("/api/recurring-availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRecurringAvailability(id);
      if (!success) {
        return res.status(404).json({ message: "Recurring availability not found" });
      }
      res.json({ message: "Recurring availability deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recurring availability" });
    }
  });

  app.delete("/api/recurring-availability/all", async (req, res) => {
    try {
      const success = await storage.clearAllRecurringAvailability();
      res.json({ message: "All recurring availability cleared successfully", cleared: success });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear recurring availability" });
    }
  });

  app.post("/api/recurring-availability/save-schedule", async (req, res) => {
    try {
      const { schedule } = req.body;
      if (!schedule || typeof schedule !== 'object') {
        return res.status(400).json({ message: "Schedule object is required" });
      }
      
      const savedRecords = await storage.saveWeeklySchedule(schedule);
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

      const session = await createCheckoutSession(planId, billingPeriod, userEmail, userId);
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

  app.post("/api/webhook/stripe", express.raw({type: 'application/json'}), async (req, res) => {
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

  app.post('/api/create-portal-session', async (req, res) => {
    try {
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: 'Customer ID is required' });
      }

      const session = await createPortalSession(customerId);
      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ message: 'Failed to create portal session' });
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

  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          success: true, 
          message: "If this email is registered, you will receive a password reset link shortly." 
        });
      }
      
      // Generate reset token (use crypto for security)
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Update user with reset token
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetTokenExpires: resetTokenExpires
      });
      
      // In production, you would send an email here
      // For now, just log the reset link for development
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      console.log(`Password reset link for ${email}: ${resetLink}`);
      
      res.json({ 
        success: true, 
        message: "If this email is registered, you will receive a password reset link shortly.",
        // In development, include the link for testing
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
      });
      
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process password reset request" 
      });
    }
  });
  
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Token and new password are required" 
        });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: "Password must be at least 8 characters long" 
        });
      }
      
      // Find user by reset token
      const users = await storage.getAllUsers();
      const user = users.find(u => u.passwordResetToken === token && 
                                  u.passwordResetTokenExpires && 
                                  new Date() < new Date(u.passwordResetTokenExpires));
      
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired reset token" 
        });
      }
      
      // Hash the new password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user with new password and clear reset token
      await storage.updateUser(user.id, {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null
      });
      
      res.json({ 
        success: true, 
        message: "Password has been reset successfully. You can now log in with your new password." 
      });
      
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to reset password" 
      });
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
      // Clean and validate the services array if present
      let services = req.body.services;
      if (services && Array.isArray(services)) {
        services = services.map((service: any) => ({
          formulaId: service.formulaId,
          calculatedPrice: service.calculatedPrice,
          formulaName: service.formulaName,
          variables: service.variables,
          description: service.description,
          category: service.category
        }));
      }

      const requestData = {
        ...req.body,
        services: services || null
      };

      // Validate request body
      const validatedData = insertBidRequestSchema.parse(requestData);
      
      const bidRequest = await storage.createBidRequest(validatedData);
      res.status(201).json(bidRequest);
    } catch (error) {
      console.error('Error creating bid request:', error);
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

  const httpServer = createServer(app);
  return httpServer;
}
