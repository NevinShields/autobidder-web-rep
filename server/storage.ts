import { formulas, leads, type Formula, type InsertFormula, type Lead, type InsertLead } from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
    return result.rowCount > 0;
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
}

export const storage = new DatabaseStorage();
