import { nanoid } from "nanoid";
import { db } from "./db";
import { zapierWebhooks, zapierApiKeys, type ZapierWebhook, type ZapierApiKey } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Request, Response } from "express";

// Zapier integration service for managing webhooks and API authentication
export class ZapierIntegrationService {
  
  // Generate a new API key for Zapier authentication
  static async generateApiKey(userId: string, name: string = "Zapier Integration"): Promise<ZapierApiKey> {
    const apiKey = `zap_${nanoid(32)}`;
    
    const [zapierKey] = await db
      .insert(zapierApiKeys)
      .values({
        userId,
        name,
        keyHash: apiKey, // In production, this should be hashed
        createdAt: new Date(),
        lastUsed: null,
        isActive: true
      })
      .returning();
    
    return { ...zapierKey, keyHash: apiKey }; // Return unhashed key once for user
  }

  // Validate API key for incoming requests
  static async validateApiKey(apiKey: string): Promise<ZapierApiKey | null> {
    if (!apiKey?.startsWith('zap_')) {
      return null;
    }

    const [key] = await db
      .select()
      .from(zapierApiKeys)
      .where(and(
        eq(zapierApiKeys.keyHash, apiKey),
        eq(zapierApiKeys.isActive, true)
      ));

    if (key) {
      // Update last used timestamp
      await db
        .update(zapierApiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(zapierApiKeys.id, key.id));
    }

    return key || null;
  }

  // Subscribe to webhook for instant triggers
  static async subscribeWebhook(
    userId: string,
    targetUrl: string,
    event: string,
    filters: Record<string, any> = {}
  ): Promise<ZapierWebhook> {
    const [webhook] = await db
      .insert(zapierWebhooks)
      .values({
        userId,
        targetUrl,
        event,
        filters: JSON.stringify(filters),
        isActive: true,
        createdAt: new Date()
      })
      .returning();

    return webhook;
  }

  // Unsubscribe webhook
  static async unsubscribeWebhook(webhookId: number, userId: string): Promise<boolean> {
    const result = await db
      .update(zapierWebhooks)
      .set({ isActive: false })
      .where(and(
        eq(zapierWebhooks.id, webhookId),
        eq(zapierWebhooks.userId, userId)
      ));

    return (result?.rowCount || 0) > 0;
  }

  // Get active webhooks for an event
  static async getActiveWebhooks(userId: string, event: string): Promise<ZapierWebhook[]> {
    return await db
      .select()
      .from(zapierWebhooks)
      .where(and(
        eq(zapierWebhooks.userId, userId),
        eq(zapierWebhooks.event, event),
        eq(zapierWebhooks.isActive, true)
      ));
  }

  // Send webhook notification
  static async sendWebhookNotification(
    userId: string,
    event: string,
    data: any
  ): Promise<void> {
    const webhooks = await this.getActiveWebhooks(userId, event);

    const promises = webhooks.map(async (webhook) => {
      try {
        const response = await fetch(webhook.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Autobidder-Zapier/1.0'
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data
          })
        });

        if (!response.ok) {
          console.error(`Webhook failed for ${webhook.targetUrl}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Webhook error for ${webhook.targetUrl}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Get sample data for Zapier testing
  static async getSampleData(userId: string, event: string, limit: number = 3): Promise<any[]> {
    switch (event) {
      case 'new_lead':
        // Get recent leads as sample data
        const allLeads = await db.select()
          .from(leads)
          .leftJoin(formulas, eq(leads.formulaId, formulas.id))
          .where(eq(formulas.userId, userId))
          .orderBy(desc(leads.createdAt))
          .limit(limit);
        return allLeads.map(({ leads: lead, formulas: formula }) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          variables: lead.variables,
          formulaId: lead.formulaId,
          formulaName: formula?.name || 'Unknown',
          createdAt: lead.createdAt
        }));

      case 'new_calculator':
        // Get recent formulas as sample data
        const allFormulas = await db.select()
          .from(formulas)
          .where(eq(formulas.userId, userId))
          .orderBy(desc(formulas.id))
          .limit(limit);
        return allFormulas.map(formula => ({
          id: formula.id,
          name: formula.name,
          description: formula.description,
          title: formula.title
        }));

      case 'lead_updated':
        // Get recent lead updates as sample data
        const updatedLeads = await db.select()
          .from(leads)
          .leftJoin(formulas, eq(leads.formulaId, formulas.id))
          .where(eq(formulas.userId, userId))
          .orderBy(desc(leads.createdAt))
          .limit(limit);
        return updatedLeads.map(({ leads: lead }) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          status: 'updated',
          createdAt: lead.createdAt
        }));

      default:
        return [];
    }
  }
}

// Middleware for API key authentication
export function requireZapierAuth(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required. Include X-API-Key header or api_key query parameter.' 
    });
  }

  ZapierIntegrationService.validateApiKey(apiKey as string)
    .then(key => {
      if (!key) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      
      // Add user info to request
      (req as any).zapierAuth = { userId: key.userId, keyId: key.id };
      next();
    })
    .catch(error => {
      console.error('Zapier auth error:', error);
      res.status(500).json({ error: 'Authentication error' });
    });
}