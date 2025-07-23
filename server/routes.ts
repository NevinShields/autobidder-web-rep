import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  insertFormulaSchema, 
  insertLeadSchema, 
  insertMultiServiceLeadSchema, 
  insertBusinessSettingsSchema,
  insertAvailabilitySlotSchema,
  insertRecurringAvailabilitySchema,
  insertWebsiteSchema
} from "@shared/schema";
import { generateFormula } from "./gemini";
import { dudaApi } from "./duda-api";
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
  app.get("/api/formulas", async (req, res) => {
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

  app.post("/api/formulas", async (req, res) => {
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

  app.patch("/api/formulas/:id", async (req, res) => {
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

  app.delete("/api/formulas/:id", async (req, res) => {
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
  app.get("/api/leads", async (req, res) => {
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

  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
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
  app.get("/api/multi-service-leads", async (req, res) => {
    try {
      const leads = await storage.getAllMultiServiceLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch multi-service leads" });
    }
  });

  app.post("/api/multi-service-leads", async (req, res) => {
    try {
      const validatedData = insertMultiServiceLeadSchema.parse(req.body);
      const lead = await storage.createMultiServiceLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid multi-service lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create multi-service lead" });
    }
  });

  // Business settings routes
  app.get("/api/business-settings", async (req, res) => {
    try {
      const settings = await storage.getBusinessSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business settings" });
    }
  });

  app.post("/api/business-settings", async (req, res) => {
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

  app.patch("/api/business-settings", async (req, res) => {
    try {
      // Update the first business settings record (assuming single business)
      const validatedData = insertBusinessSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateBusinessSettings(1, validatedData);
      if (!settings) {
        return res.status(404).json({ message: "Business settings not found" });
      }
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid business settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update business settings" });
    }
  });

  app.patch("/api/business-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBusinessSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateBusinessSettings(id, validatedData);
      if (!settings) {
        return res.status(404).json({ message: "Business settings not found" });
      }
      res.json(settings);
    } catch (error) {
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

  // Website routes
  app.get("/api/websites", async (req, res) => {
    try {
      // Mock user ID - in production this would come from authentication
      const userId = "user1";
      
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

  app.post("/api/websites", async (req, res) => {
    try {
      const userId = "user1"; // Mock user ID
      
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

  app.delete("/api/websites/:siteName", async (req, res) => {
    try {
      const { siteName } = req.params;
      const userId = "user1"; // Mock user ID
      
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

  // Profile routes
  app.get("/api/profile", async (req, res) => {
    try {
      // For now, we'll use a mock user ID. In production, this would come from authentication
      const userId = "user1"; // This should come from the authenticated session
      const user = await storage.getUserById(userId);
      if (!user) {
        // Create a default user if one doesn't exist
        const newUser = await storage.upsertUser({
          id: userId,
          email: "user@example.com",
          firstName: "Demo",
          lastName: "User",
          userType: "owner",
          plan: "Professional", // Default to Professional for demo
          isActive: true
        });
        return res.json(newUser);
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", async (req, res) => {
    try {
      // For now, we'll use a mock user ID. In production, this would come from authentication
      const userId = "user1"; // This should come from the authenticated session
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

  const httpServer = createServer(app);
  return httpServer;
}
