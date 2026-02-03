import type { Express } from "express";
import { ZapierIntegrationService, requireZapierAuth } from "./zapier-integration";
import { storage } from "./storage";
import { requireAuth } from "./universalAuth";
import { db } from "./db";
import { leadTags } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Plans that have access to Zapier
const ZAPIER_ALLOWED_PLANS = ['trial', 'standard', 'plus', 'plus_seo'];

function canAccessZapier(plan: string | null | undefined): boolean {
  return ZAPIER_ALLOWED_PLANS.includes(plan || 'free');
}

// CRM Pipeline stages
const CRM_STAGES = [
  { id: 'any', name: 'Any Stage' },
  { id: 'new', name: 'New' },
  { id: 'open', name: 'Open' },
  { id: 'estimate_sent', name: 'Estimate Sent' },
  { id: 'estimate_viewed', name: 'Estimate Viewed' },
  { id: 'estimate_approved', name: 'Estimate Approved' },
  { id: 'booked', name: 'Booked' },
  { id: 'completed', name: 'Completed' },
  { id: 'paid', name: 'Paid' },
  { id: 'lost', name: 'Lost' },
];

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

  // ===== OPTIONS ENDPOINTS (for dynamic dropdowns) =====

  // Get available CRM stages for dropdown
  app.get("/api/zapier/options/stages", requireZapierAuth, async (req, res) => {
    try {
      res.json(CRM_STAGES);
    } catch (error) {
      console.error("Zapier stages options error:", error);
      res.status(500).json({ error: "Failed to fetch stages" });
    }
  });

  // Get available tags for dropdown
  app.get("/api/zapier/options/tags", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;

      // Get user's tags
      const tags = await db.select()
        .from(leadTags)
        .where(and(
          eq(leadTags.businessOwnerId, userId),
          eq(leadTags.isActive, true)
        ));

      // Format for Zapier dropdown - include "Any Tag" option
      const formattedTags = [
        { id: 0, name: 'Any Tag' },
        ...tags.map(tag => ({
          id: tag.id,
          name: tag.displayName || tag.name
        }))
      ];

      res.json(formattedTags);
    } catch (error) {
      console.error("Zapier tags options error:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  // ===== TRIGGERS (for Zapier to receive data) =====
  
  // Polling trigger: Get new leads
  app.get("/api/zapier/triggers/new-leads", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;
      
      const leads = await ZapierIntegrationService.getSampleData(userId, 'new_lead', limit);
      
      // Wrap polling data in the same structure as webhook data
      const wrappedLeads = leads.map((leadData: any) => ({
        event: 'new_lead',
        timestamp: new Date().toISOString(),
        data: leadData
      }));
      
      // Zapier expects an array of data
      res.json(wrappedLeads);
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

  // Polling trigger: Get lead stage changes
  app.get("/api/zapier/triggers/lead-stage-changed", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;

      const stageChanges = await ZapierIntegrationService.getSampleData(userId, 'lead_stage_changed', limit);

      const wrappedData = stageChanges.map((data: any) => ({
        event: 'lead_stage_changed',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedData);
    } catch (error) {
      console.error("Zapier lead stage changed trigger error:", error);
      res.status(500).json({ error: "Failed to fetch lead stage changes" });
    }
  });

  // Polling trigger: Get lead tag assignments
  app.get("/api/zapier/triggers/lead-tagged", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;

      const taggedLeads = await ZapierIntegrationService.getSampleData(userId, 'lead_tagged', limit);

      const wrappedData = taggedLeads.map((data: any) => ({
        event: 'lead_tagged',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedData);
    } catch (error) {
      console.error("Zapier lead tagged trigger error:", error);
      res.status(500).json({ error: "Failed to fetch tagged leads" });
    }
  });

  // Polling trigger: Get created estimates
  app.get("/api/zapier/triggers/estimate-created", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;

      const estimates = await ZapierIntegrationService.getSampleData(userId, 'estimate_created', limit);

      const wrappedData = estimates.map((data: any) => ({
        event: 'estimate_created',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedData);
    } catch (error) {
      console.error("Zapier estimate created trigger error:", error);
      res.status(500).json({ error: "Failed to fetch created estimates" });
    }
  });

  // Polling trigger: Get sent estimates
  app.get("/api/zapier/triggers/estimate-sent", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;

      const estimates = await ZapierIntegrationService.getSampleData(userId, 'estimate_sent', limit);

      const wrappedData = estimates.map((data: any) => ({
        event: 'estimate_sent',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedData);
    } catch (error) {
      console.error("Zapier estimate sent trigger error:", error);
      res.status(500).json({ error: "Failed to fetch sent estimates" });
    }
  });

  // Polling trigger: Get viewed estimates
  app.get("/api/zapier/triggers/estimate-viewed", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;

      const estimates = await ZapierIntegrationService.getSampleData(userId, 'estimate_viewed', limit);

      const wrappedData = estimates.map((data: any) => ({
        event: 'estimate_viewed',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedData);
    } catch (error) {
      console.error("Zapier estimate viewed trigger error:", error);
      res.status(500).json({ error: "Failed to fetch viewed estimates" });
    }
  });

  // Polling trigger: Get accepted estimates
  app.get("/api/zapier/triggers/estimate-accepted", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const limit = parseInt(req.query.limit as string) || 25;

      const estimates = await ZapierIntegrationService.getSampleData(userId, 'estimate_accepted', limit);

      const wrappedData = estimates.map((data: any) => ({
        event: 'estimate_accepted',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedData);
    } catch (error) {
      console.error("Zapier estimate accepted trigger error:", error);
      res.status(500).json({ error: "Failed to fetch accepted estimates" });
    }
  });

  // ===== REST HOOKS (Instant Triggers) =====
  
  // Subscribe to webhook for new leads
  app.post("/api/zapier/webhooks/subscribe", requireZapierAuth, async (req, res) => {
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

  // Unsubscribe from webhook
  app.delete("/api/zapier/webhooks/unsubscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      // Find and deactivate webhook by target_url and userId
      const success = await ZapierIntegrationService.unsubscribeWebhookByUrl(target_url, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from webhook"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier webhook unsubscribe error:", error);
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

  // Subscribe to webhook for lead stage changes
  app.post("/api/zapier/hooks/lead-stage-changed/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url, filters } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      // Parse filters if provided (e.g., { stage: 'booked' })
      const webhookFilters = filters || {};

      const webhook = await ZapierIntegrationService.subscribeWebhook(
        userId,
        target_url,
        'lead_stage_changed',
        webhookFilters
      );

      res.json({
        success: true,
        webhook_id: webhook.id,
        message: "Successfully subscribed to lead stage changes",
        filters: webhookFilters
      });
    } catch (error) {
      console.error("Zapier lead stage changed subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to webhook" });
    }
  });

  // Unsubscribe from lead stage changed webhook
  app.delete("/api/zapier/hooks/lead-stage-changed/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const success = await ZapierIntegrationService.unsubscribeWebhookByUrl(target_url, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from lead stage changes"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier lead stage changed unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from webhook" });
    }
  });

  // Subscribe to webhook for lead tagged
  app.post("/api/zapier/hooks/lead-tagged/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url, filters } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      // Parse filters if provided (e.g., { tagId: 1 })
      const webhookFilters = filters || {};

      const webhook = await ZapierIntegrationService.subscribeWebhook(
        userId,
        target_url,
        'lead_tagged',
        webhookFilters
      );

      res.json({
        success: true,
        webhook_id: webhook.id,
        message: "Successfully subscribed to lead tag assignments",
        filters: webhookFilters
      });
    } catch (error) {
      console.error("Zapier lead tagged subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to webhook" });
    }
  });

  // Unsubscribe from lead tagged webhook
  app.delete("/api/zapier/hooks/lead-tagged/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const success = await ZapierIntegrationService.unsubscribeWebhookByUrl(target_url, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from lead tag assignments"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier lead tagged unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from webhook" });
    }
  });

  // Subscribe to webhook for estimate created
  app.post("/api/zapier/hooks/estimate-created/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const webhook = await ZapierIntegrationService.subscribeWebhook(
        userId,
        target_url,
        'estimate_created'
      );

      res.json({
        success: true,
        webhook_id: webhook.id,
        message: "Successfully subscribed to estimate created events"
      });
    } catch (error) {
      console.error("Zapier estimate created subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to webhook" });
    }
  });

  // Unsubscribe from estimate created webhook
  app.delete("/api/zapier/hooks/estimate-created/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const success = await ZapierIntegrationService.unsubscribeWebhookByUrl(target_url, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from estimate created events"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier estimate created unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from webhook" });
    }
  });

  // Subscribe to webhook for estimate sent
  app.post("/api/zapier/hooks/estimate-sent/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const webhook = await ZapierIntegrationService.subscribeWebhook(
        userId,
        target_url,
        'estimate_sent'
      );

      res.json({
        success: true,
        webhook_id: webhook.id,
        message: "Successfully subscribed to estimate sent events"
      });
    } catch (error) {
      console.error("Zapier estimate sent subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to webhook" });
    }
  });

  // Unsubscribe from estimate sent webhook
  app.delete("/api/zapier/hooks/estimate-sent/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const success = await ZapierIntegrationService.unsubscribeWebhookByUrl(target_url, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from estimate sent events"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier estimate sent unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from webhook" });
    }
  });

  // Subscribe to webhook for estimate viewed
  app.post("/api/zapier/hooks/estimate-viewed/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const webhook = await ZapierIntegrationService.subscribeWebhook(
        userId,
        target_url,
        'estimate_viewed'
      );

      res.json({
        success: true,
        webhook_id: webhook.id,
        message: "Successfully subscribed to estimate viewed events"
      });
    } catch (error) {
      console.error("Zapier estimate viewed subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to webhook" });
    }
  });

  // Unsubscribe from estimate viewed webhook
  app.delete("/api/zapier/hooks/estimate-viewed/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const success = await ZapierIntegrationService.unsubscribeWebhookByUrl(target_url, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from estimate viewed events"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier estimate viewed unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from webhook" });
    }
  });

  // Subscribe to webhook for estimate accepted
  app.post("/api/zapier/hooks/estimate-accepted/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const webhook = await ZapierIntegrationService.subscribeWebhook(
        userId,
        target_url,
        'estimate_accepted'
      );

      res.json({
        success: true,
        webhook_id: webhook.id,
        message: "Successfully subscribed to estimate accepted events"
      });
    } catch (error) {
      console.error("Zapier estimate accepted subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to webhook" });
    }
  });

  // Unsubscribe from estimate accepted webhook
  app.delete("/api/zapier/hooks/estimate-accepted/subscribe", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const { target_url } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      const success = await ZapierIntegrationService.unsubscribeWebhookByUrl(target_url, userId);

      if (success) {
        res.json({
          success: true,
          message: "Successfully unsubscribed from estimate accepted events"
        });
      } else {
        res.status(404).json({ error: "Webhook not found" });
      }
    } catch (error) {
      console.error("Zapier estimate accepted unsubscribe error:", error);
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

      if (!updatedLead) {
        return res.status(404).json({ error: "Failed to update lead" });
      }

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
      
      // Wrap sample data in the same structure as webhook data
      const wrappedSampleData = sampleData.map((leadData: any) => ({
        event: 'new_lead',
        timestamp: new Date().toISOString(),
        data: leadData
      }));
      
      res.json(wrappedSampleData);
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

  app.get("/api/zapier/sample/lead-stage-changed", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const sampleData = await ZapierIntegrationService.getSampleData(userId, 'lead_stage_changed', 3);

      const wrappedSampleData = sampleData.map((data: any) => ({
        event: 'lead_stage_changed',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedSampleData);
    } catch (error) {
      console.error("Zapier sample lead stage changed error:", error);
      res.status(500).json({ error: "Failed to get sample data" });
    }
  });

  app.get("/api/zapier/sample/lead-tagged", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const sampleData = await ZapierIntegrationService.getSampleData(userId, 'lead_tagged', 3);

      const wrappedSampleData = sampleData.map((data: any) => ({
        event: 'lead_tagged',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedSampleData);
    } catch (error) {
      console.error("Zapier sample lead tagged error:", error);
      res.status(500).json({ error: "Failed to get sample data" });
    }
  });

  app.get("/api/zapier/sample/estimate-created", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const sampleData = await ZapierIntegrationService.getSampleData(userId, 'estimate_created', 3);

      const wrappedSampleData = sampleData.map((data: any) => ({
        event: 'estimate_created',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedSampleData);
    } catch (error) {
      console.error("Zapier sample estimate created error:", error);
      res.status(500).json({ error: "Failed to get sample data" });
    }
  });

  app.get("/api/zapier/sample/estimate-sent", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const sampleData = await ZapierIntegrationService.getSampleData(userId, 'estimate_sent', 3);

      const wrappedSampleData = sampleData.map((data: any) => ({
        event: 'estimate_sent',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedSampleData);
    } catch (error) {
      console.error("Zapier sample estimate sent error:", error);
      res.status(500).json({ error: "Failed to get sample data" });
    }
  });

  app.get("/api/zapier/sample/estimate-viewed", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const sampleData = await ZapierIntegrationService.getSampleData(userId, 'estimate_viewed', 3);

      const wrappedSampleData = sampleData.map((data: any) => ({
        event: 'estimate_viewed',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedSampleData);
    } catch (error) {
      console.error("Zapier sample estimate viewed error:", error);
      res.status(500).json({ error: "Failed to get sample data" });
    }
  });

  app.get("/api/zapier/sample/estimate-accepted", requireZapierAuth, async (req, res) => {
    try {
      const { userId } = (req as any).zapierAuth;
      const sampleData = await ZapierIntegrationService.getSampleData(userId, 'estimate_accepted', 3);

      const wrappedSampleData = sampleData.map((data: any) => ({
        event: 'estimate_accepted',
        timestamp: new Date().toISOString(),
        data
      }));

      res.json(wrappedSampleData);
    } catch (error) {
      console.error("Zapier sample estimate accepted error:", error);
      res.status(500).json({ error: "Failed to get sample data" });
    }
  });

  // ===== API KEY MANAGEMENT =====
  
  // Generate new API key (regular authenticated endpoint, not Zapier auth)
  app.post("/api/zapier/api-keys", requireAuth, async (req, res) => {
    try {
      if (!(req as any).currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check plan access and permissions for Zapier
      const currentUser = (req as any).currentUser;
      if (!canAccessZapier(currentUser.plan)) {
        return res.status(403).json({
          error: "Zapier integration not available on free plan",
          message: "Upgrade to connect Zapier integrations.",
          upgradeRequired: true
        });
      }
      if (currentUser.userType !== 'owner' && currentUser.userType !== 'super_admin' && currentUser.permissions?.canAccessZapier !== true) {
        return res.status(403).json({ error: "You don't have permission to access Zapier integrations" });
      }

      const { name } = req.body;
      const userId = currentUser.id;

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
  app.get("/api/zapier/api-keys", requireAuth, async (req, res) => {
    try {
      if (!(req as any).currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check plan access and permissions for Zapier
      const currentUser = (req as any).currentUser;
      if (!canAccessZapier(currentUser.plan)) {
        return res.status(403).json({
          error: "Zapier integration not available on free plan",
          message: "Upgrade to connect Zapier integrations.",
          upgradeRequired: true
        });
      }
      if (currentUser.userType !== 'owner' && currentUser.userType !== 'super_admin' && currentUser.permissions?.canAccessZapier !== true) {
        return res.status(403).json({ error: "You don't have permission to access Zapier integrations" });
      }

      const userId = currentUser.id;
      
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
  app.delete("/api/zapier/api-keys/:keyId", requireAuth, async (req, res) => {
    try {
      if (!(req as any).currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const currentUser = (req as any).currentUser;
      if (currentUser.userType !== 'owner' && currentUser.userType !== 'super_admin' && currentUser.permissions?.canAccessZapier !== true) {
        return res.status(403).json({ error: "You don't have permission to access Zapier integrations" });
      }
      const userId = currentUser.id;
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
