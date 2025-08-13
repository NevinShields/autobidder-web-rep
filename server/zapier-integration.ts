import { nanoid } from "nanoid";
import { db } from "./db";
import { zapierWebhooks, zapierApiKeys, leads, formulas, type ZapierWebhook, type ZapierApiKey } from "@shared/schema";
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

  // Unsubscribe webhook by ID
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

  // Unsubscribe webhook by URL (used by Zapier unsubscribe)
  static async unsubscribeWebhookByUrl(targetUrl: string, userId: string): Promise<boolean> {
    const result = await db
      .update(zapierWebhooks)
      .set({ isActive: false })
      .where(and(
        eq(zapierWebhooks.targetUrl, targetUrl),
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
        
        // If no real leads exist, provide sample data for Zapier testing
        if (allLeads.length === 0) {
          return [
            {
              id: "sample_lead_1",
              name: "John Smith",
              email: "john.smith@example.com",
              phone: "(555) 123-4567",
              address: "123 Main St, Anytown, ST 12345",
              variables: {
                houseHeight: ["Two Story"],
                roofMaterial: ["Shingle"],
                roofSlope: ["Medium"]
              },
              formulaId: "sample_formula_1",
              formulaName: "Roof Cleaning Calculator",
              totalPrice: 450,
              serviceType: "Roof Cleaning",
              status: "new",
              source: "Website Calculator",
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              notes: "Customer mentioned urgency for next week"
            },
            {
              id: "sample_lead_2",
              name: "Sarah Johnson",
              email: "sarah.j@example.com",
              phone: "(555) 987-6543",
              address: "456 Oak Ave, Springfield, ST 54321",
              variables: {
                linearFootage: 150,
                materialType: "wood",
                dirtLevel: "heavy"
              },
              formulaId: "sample_formula_2",
              formulaName: "Fence Cleaning Calculator",
              totalPrice: 275,
              serviceType: "Fence Cleaning",
              status: "new",
              source: "Website Calculator",
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
              notes: "Prefers weekend scheduling"
            },
            {
              id: "sample_lead_3",
              name: "Mike Wilson",
              email: "mike.wilson@example.com",
              phone: "(555) 456-7890",
              address: "789 Pine St, Hometown, ST 98765",
              variables: {
                squareFootage: 2500,
                surfaceType: "concrete",
                cleaningType: "deep"
              },
              formulaId: "sample_formula_3",
              formulaName: "Driveway Cleaning Calculator",
              totalPrice: 380,
              serviceType: "Driveway Cleaning",
              status: "new",
              source: "Website Calculator",
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
              notes: "Has pets, needs pet-safe cleaning products"
            }
          ].slice(0, limit);
        }
        
        return allLeads.map(({ leads: lead, formulas: formula }) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          variables: lead.variables,
          formulaId: lead.formulaId,
          formulaName: formula?.name || 'Unknown',
          totalPrice: lead.totalPrice || 0,
          serviceType: formula?.name || 'Service',
          status: 'new',
          source: 'Website Calculator',
          createdAt: lead.createdAt,
          notes: lead.notes
        }));

      case 'new_calculator':
        // Get recent formulas as sample data
        const allFormulas = await db.select()
          .from(formulas)
          .where(eq(formulas.userId, userId))
          .orderBy(desc(formulas.id))
          .limit(limit);
        
        // If no real formulas exist, provide sample data for Zapier testing
        if (allFormulas.length === 0) {
          return [
            {
              id: "sample_formula_1",
              name: "Roof Cleaning Calculator",
              description: "Professional roof cleaning service pricing calculator",
              title: "Get Your Roof Cleaning Quote",
              serviceType: "Roof Cleaning",
              isActive: true,
              embedId: "roof-cleaning-calc",
              variables: {
                houseHeight: { type: "select", options: ["Single Story", "Two Story", "Three Story"] },
                roofMaterial: { type: "select", options: ["Shingle", "Tile", "Metal"] },
                roofSlope: { type: "select", options: ["Flat", "Low", "Medium", "Steep"] }
              },
              formula: "basePrice + (houseHeight * heightMultiplier) + (materialMultiplier * roofSize)",
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()  // 12 hours ago
            },
            {
              id: "sample_formula_2",
              name: "Fence Cleaning Calculator",
              description: "Fence cleaning service pricing based on linear footage and material",
              title: "Calculate Your Fence Cleaning Cost",
              serviceType: "Fence Cleaning",
              isActive: true,
              embedId: "fence-cleaning-calc",
              variables: {
                linearFootage: { type: "number", min: 1, max: 1000 },
                materialType: { type: "select", options: ["wood", "vinyl", "chain-link", "aluminum"] },
                dirtLevel: { type: "select", options: ["light", "moderate", "heavy"] }
              },
              formula: "linearFootage * pricePerFoot * materialMultiplier * dirtMultiplier",
              createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
              updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()   // 6 hours ago
            }
          ].slice(0, limit);
        }
        
        return allFormulas.map(formula => ({
          id: formula.id,
          name: formula.name,
          description: formula.description,
          title: formula.title,
          serviceType: formula.name,
          isActive: formula.isActive,
          embedId: formula.embedId,
          variables: formula.variables,
          formula: formula.formula,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

      case 'lead_updated':
        // Get recent lead updates as sample data
        const updatedLeads = await db.select()
          .from(leads)
          .leftJoin(formulas, eq(leads.formulaId, formulas.id))
          .where(eq(formulas.userId, userId))
          .orderBy(desc(leads.createdAt))
          .limit(limit);
        
        // If no real leads exist, provide sample data for Zapier testing
        if (updatedLeads.length === 0) {
          return [
            {
              id: "sample_lead_1",
              name: "John Smith",
              email: "john.smith@example.com",
              phone: "(555) 123-4567",
              status: "contacted",
              totalPrice: 450,
              notes: "Customer confirmed appointment for next Tuesday",
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
            }
          ].slice(0, limit);
        }
        
        return updatedLeads.map(({ leads: lead }) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: 'updated',
          totalPrice: lead.totalPrice || 0,
          notes: lead.notes,
          createdAt: lead.createdAt,
          updatedAt: lead.createdAt
        }));

      default:
        return [];
    }
  }
}

// Middleware for API key authentication
export function requireZapierAuth(req: Request, res: Response, next: Function) {
  let apiKey: string | undefined;
  
  // Check Authorization header first (Zapier uses this format)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    apiKey = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix
  }
  
  // Fallback to x-api-key header or query parameter
  if (!apiKey) {
    apiKey = req.headers['x-api-key'] as string || req.query.api_key as string;
  }
  
  if (!apiKey || apiKey.trim() === '') {
    return res.status(401).json({ 
      error: 'API key required. Include Authorization: Bearer <key> header, X-API-Key header, or api_key query parameter.' 
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