import type { Express } from "express";
import { ZapierIntegrationService, requireZapierAuth } from "./zapier-integration";
import { storage } from "./storage";

export function registerZapierRoutes(app: Express): void {
  
  // ===== Authentication Test Endpoint =====
  // Used by Zapier to test API key authentication
  app.get("/api/zapier/auth/test", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      
      // Get basic user info for authentication verification
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email
        },
        message: "Authentication successful"
      });
    } catch (error) {
      console.error("Zapier auth test error:", error);
      res.status(500).json({ error: "Authentication test failed" });
    }
  });

  // ===== TRIGGERS (for Zapier to receive data) =====
  
  // Polling trigger: Get new leads
  app.get("/api/zapier/triggers/new-leads", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;
      
      const leads = await ZapierIntegrationService.getSampleData(userId, 'new_lead', limit);
      
      // Zapier expects an array of data
      res.json(leads);
    } catch (error) {
      console.error("Zapier new leads trigger error:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Polling trigger: Get new calculators/formulas
  app.get("/api/zapier/triggers/new-calculators", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;
      
      const calculators = await ZapierIntegrationService.getSampleData(userId, 'new_calculator', limit);
      
      res.json(calculators);
    } catch (error) {
      console.error("Zapier new calculators trigger error:", error);
      res.status(500).json({ error: "Failed to fetch calculators" });
    }
  });

  // ===== REST HOOKS (Instant Triggers) =====
  
  // Subscribe to webhook for new leads
  app.post("/api/zapier/hooks/new-leads/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const webhook = await ZapierIntegrationService.subscribeWebhook(
        userId,
        target_url,
        'new_lead'
      );

      res.json({
        success: true,
        webhook_id: webhook.id,
        message: "Successfully subscribed to new leads"
      });
    } catch (error) {
      console.error("Zapier new leads subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to webhook" });
    }
  });

  // Unsubscribe from new leads webhook
  app.delete("/api/zapier/hooks/new-leads/subscribe/:webhookId", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const webhookId = parseInt(req.params.webhookId);

      const success = await ZapierIntegrationService.unsubscribeWebhook(webhookId, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from new leads"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier new leads unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from webhook" });
    }
  });

  // Subscribe to webhook for new calculators
  app.post("/api/zapier/hooks/new-calculators/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const webhook = await ZapierIntegrationService.subscribeWebhook(
        userId,
        target_url,
        'new_calculator'
      );

      res.json({
        success: true,
        webhook_id: webhook.id,
        message: "Successfully subscribed to new calculators"
      });
    } catch (error) {
      console.error("Zapier new calculators subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to webhook" });
    }
  });

  // Unsubscribe from new calculators webhook
  app.delete("/api/zapier/hooks/new-calculators/subscribe/:webhookId", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const webhookId = parseInt(req.params.webhookId);

      const success = await ZapierIntegrationService.unsubscribeWebhook(webhookId, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from new calculators"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier new calculators unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from webhook" });
    }
  });

  // ===== ACTIONS (for Zapier to send data to Autobidder) =====
  
  // Action: Create a new lead
  app.post("/api/zapier/actions/create-lead", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { name, email, phone, address, formulaId, variables, notes } = req.body;

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ 
          error: "Name and email are required fields" 
        });
      }

      // Create the lead
      const leadData = {
        name,
        email,
        phone: phone || null,
        address: address || null,
        formulaId: formulaId || 1, // Default formula if not provided
        variables: variables || {},
        calculatedPrice: 0, // Default calculated price
        notes: notes || null,
        source: 'zapier',
        stage: 'new'
      };

      const lead = await storage.createLead(leadData);

      res.json({
        success: true,
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          createdAt: lead.createdAt
        },
        message: "Lead created successfully"
      });
    } catch (error) {
      console.error("Zapier create lead error:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // Action: Update lead status
  app.post("/api/zapier/actions/update-lead", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { leadId, stage, notes } = req.body;

      if (!leadId) {
        return res.status(400).json({ error: "leadId is required" });
      }

      // Get the lead first
      const existingLead = await storage.getLead(leadId);
      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Update the lead
      const updatedLead = await storage.updateLead(leadId, {
        stage: stage || existingLead.stage,
        notes: notes !== undefined ? notes : existingLead.notes
      });

      res.json({
        success: true,
        lead: {
          id: updatedLead.id,
          name: updatedLead.name,
          email: updatedLead.email,
          stage: updatedLead.stage,
          notes: updatedLead.notes
        },
        message: "Lead updated successfully"
      });
    } catch (error) {
      console.error("Zapier update lead error:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // ===== SAMPLE DATA ENDPOINTS =====
  
  // Get sample data for testing triggers
  app.get("/api/zapier/sample/new-leads", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const sampleData = await ZapierIntegrationService.getSampleData(userId, 'new_lead', 3);
      
      res.json(sampleData);
    } catch (error) {
      console.error("Zapier sample leads error:", error);
      res.status(500).json({ error: "Failed to get sample data" });
    }
  });

  app.get("/api/zapier/sample/new-calculators", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const sampleData = await ZapierIntegrationService.getSampleData(userId, 'new_calculator', 3);
      
      res.json(sampleData);
    } catch (error) {
      console.error("Zapier sample calculators error:", error);
      res.status(500).json({ error: "Failed to get sample data" });
    }
  });

  // ===== API KEY MANAGEMENT =====
  
  // Generate new API key (regular authenticated endpoint, not Zapier auth)
  app.post("/api/zapier/api-keys", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { name } = req.body;
      const userId = req.user.id;

      const apiKey = await ZapierIntegrationService.generateApiKey(
        userId, 
        name || "Zapier Integration"
      );

      res.json({
        success: true,
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.keyHash, // This is the actual key, only shown once
          createdAt: apiKey.createdAt
        },
        message: "API key generated successfully. Save this key securely - it won't be shown again."
      });
    } catch (error) {
      console.error("Generate API key error:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });

  // List API keys for user
  app.get("/api/zapier/api-keys", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = req.user.id;
      
      // Get user's API keys (without the actual key values)
      const apiKeys = await storage.getZapierApiKeys(userId);

      res.json({
        success: true,
        apiKeys: apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          isActive: key.isActive,
          lastUsed: key.lastUsed,
          createdAt: key.createdAt
        }))
      });
    } catch (error) {
      console.error("List API keys error:", error);
      res.status(500).json({ error: "Failed to list API keys" });
    }
  });

  // Deactivate API key
  app.delete("/api/zapier/api-keys/:keyId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = req.user.id;
      const keyId = parseInt(req.params.keyId);

      const success = await storage.deactivateZapierApiKey(keyId, userId);

      if (success) {
        res.json({
          success: true,
          message: "API key deactivated successfully"
        });
      } else {
        res.status(404).json({ error: "API key not found" });
      }
    } catch (error) {
      console.error("Deactivate API key error:", error);
      res.status(500).json({ error: "Failed to deactivate API key" });
    }
  });
}