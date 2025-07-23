import { 
  formulas, 
  leads, 
  multiServiceLeads, 
  businessSettings,
  availabilitySlots,
  recurringAvailability,
  type Formula, 
  type InsertFormula, 
  type Lead, 
  type InsertLead, 
  type MultiServiceLead, 
  type InsertMultiServiceLead, 
  type BusinessSettings, 
  type InsertBusinessSettings,
  type AvailabilitySlot,
  type InsertAvailabilitySlot,
  type RecurringAvailability,
  type InsertRecurringAvailability
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Formula operations
  getFormula(id: number): Promise<Formula | undefined>;
  getFormulaByEmbedId(embedId: string): Promise<Formula | undefined>;
  getAllFormulas(): Promise<Formula[]>;
  createFormula(formula: InsertFormula): Promise<Formula>;
  updateFormula(id: number, formula: Partial<InsertFormula>): Promise<Formula | undefined>;
  deleteFormula(id: number): Promise<boolean>;
  
  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByFormulaId(formulaId: number): Promise<Lead[]>;
  getAllLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  // Multi-service lead operations
  getMultiServiceLead(id: number): Promise<MultiServiceLead | undefined>;
  getAllMultiServiceLeads(): Promise<MultiServiceLead[]>;
  createMultiServiceLead(lead: InsertMultiServiceLead): Promise<MultiServiceLead>;
  
  // Business settings operations
  getBusinessSettings(): Promise<BusinessSettings | undefined>;
  createBusinessSettings(settings: InsertBusinessSettings): Promise<BusinessSettings>;
  updateBusinessSettings(id: number, settings: Partial<InsertBusinessSettings>): Promise<BusinessSettings | undefined>;
  
  // Calendar operations
  getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined>;
  getAvailabilitySlotsByDate(date: string): Promise<AvailabilitySlot[]>;
  getAvailableSlotsByDateRange(startDate: string, endDate: string): Promise<AvailabilitySlot[]>;
  createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot>;
  updateAvailabilitySlot(id: number, slot: Partial<InsertAvailabilitySlot>): Promise<AvailabilitySlot | undefined>;
  deleteAvailabilitySlot(id: number): Promise<boolean>;
  bookSlot(slotId: number, leadId: number): Promise<AvailabilitySlot | undefined>;
  
  // Recurring availability operations
  getRecurringAvailability(): Promise<RecurringAvailability[]>;
  createRecurringAvailability(availability: InsertRecurringAvailability): Promise<RecurringAvailability>;
  updateRecurringAvailability(id: number, availability: Partial<InsertRecurringAvailability>): Promise<RecurringAvailability | undefined>;
  deleteRecurringAvailability(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Formula operations
  async getFormula(id: number): Promise<Formula | undefined> {
    const [formula] = await db.select().from(formulas).where(eq(formulas.id, id));
    return formula || undefined;
  }

  async getFormulaByEmbedId(embedId: string): Promise<Formula | undefined> {
    const [formula] = await db.select().from(formulas).where(eq(formulas.embedId, embedId));
    return formula || undefined;
  }

  async getAllFormulas(): Promise<Formula[]> {
    return await db.select().from(formulas);
  }

  async createFormula(insertFormula: InsertFormula): Promise<Formula> {
    const [formula] = await db
      .insert(formulas)
      .values({
        ...insertFormula,
        embedId: nanoid(10),
        isActive: insertFormula.isActive ?? true
      })
      .returning();
    return formula;
  }

  async updateFormula(id: number, updateData: Partial<InsertFormula>): Promise<Formula | undefined> {
    const [formula] = await db
      .update(formulas)
      .set(updateData)
      .where(eq(formulas.id, id))
      .returning();
    return formula || undefined;
  }

  async deleteFormula(id: number): Promise<boolean> {
    const result = await db.delete(formulas).where(eq(formulas.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Lead operations
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByFormulaId(formulaId: number): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.formulaId, formulaId));
  }

  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values({
        ...insertLead,
        createdAt: new Date()
      })
      .returning();
    return lead;
  }

  // Multi-service lead operations
  async getMultiServiceLead(id: number): Promise<MultiServiceLead | undefined> {
    const [lead] = await db.select().from(multiServiceLeads).where(eq(multiServiceLeads.id, id));
    return lead || undefined;
  }

  async getAllMultiServiceLeads(): Promise<MultiServiceLead[]> {
    return await db.select().from(multiServiceLeads);
  }

  async createMultiServiceLead(insertLead: InsertMultiServiceLead): Promise<MultiServiceLead> {
    const [lead] = await db
      .insert(multiServiceLeads)
      .values({
        ...insertLead,
        bookingSlotId: insertLead.bookingSlotId || null
      })
      .returning();
    return lead;
  }

  // Business settings operations
  async getBusinessSettings(): Promise<BusinessSettings | undefined> {
    const [settings] = await db.select().from(businessSettings).limit(1);
    return settings || undefined;
  }

  async createBusinessSettings(insertSettings: InsertBusinessSettings): Promise<BusinessSettings> {
    const [settings] = await db
      .insert(businessSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateBusinessSettings(id: number, updateData: Partial<InsertBusinessSettings>): Promise<BusinessSettings | undefined> {
    const [settings] = await db
      .update(businessSettings)
      .set(updateData)
      .where(eq(businessSettings.id, id))
      .returning();
    return settings || undefined;
  }

  // Calendar operations
  async getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined> {
    const [slot] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, id));
    return slot || undefined;
  }

  async getAvailabilitySlotsByDate(date: string): Promise<AvailabilitySlot[]> {
    return await db.select().from(availabilitySlots).where(eq(availabilitySlots.date, date));
  }

  async getAvailableSlotsByDateRange(startDate: string, endDate: string): Promise<AvailabilitySlot[]> {
    return await db.select().from(availabilitySlots).where(
      and(
        gte(availabilitySlots.date, startDate),
        lte(availabilitySlots.date, endDate),
        eq(availabilitySlots.isBooked, false)
      )
    );
  }

  async createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const [newSlot] = await db
      .insert(availabilitySlots)
      .values(slot)
      .returning();
    return newSlot;
  }

  async updateAvailabilitySlot(id: number, slot: Partial<InsertAvailabilitySlot>): Promise<AvailabilitySlot | undefined> {
    const [updatedSlot] = await db
      .update(availabilitySlots)
      .set(slot)
      .where(eq(availabilitySlots.id, id))
      .returning();
    return updatedSlot || undefined;
  }

  async deleteAvailabilitySlot(id: number): Promise<boolean> {
    const result = await db.delete(availabilitySlots).where(eq(availabilitySlots.id, id));
    return result.rowCount > 0;
  }

  async bookSlot(slotId: number, leadId: number): Promise<AvailabilitySlot | undefined> {
    const [bookedSlot] = await db
      .update(availabilitySlots)
      .set({ isBooked: true, bookedBy: leadId })
      .where(eq(availabilitySlots.id, slotId))
      .returning();
    return bookedSlot || undefined;
  }

  // Recurring availability operations
  async getRecurringAvailability(): Promise<RecurringAvailability[]> {
    return await db.select().from(recurringAvailability).where(eq(recurringAvailability.isActive, true));
  }

  async createRecurringAvailability(availability: InsertRecurringAvailability): Promise<RecurringAvailability> {
    const [newAvailability] = await db
      .insert(recurringAvailability)
      .values(availability)
      .returning();
    return newAvailability;
  }

  async updateRecurringAvailability(id: number, availability: Partial<InsertRecurringAvailability>): Promise<RecurringAvailability | undefined> {
    const [updatedAvailability] = await db
      .update(recurringAvailability)
      .set(availability)
      .where(eq(recurringAvailability.id, id))
      .returning();
    return updatedAvailability || undefined;
  }

  async deleteRecurringAvailability(id: number): Promise<boolean> {
    const result = await db.delete(recurringAvailability).where(eq(recurringAvailability.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
